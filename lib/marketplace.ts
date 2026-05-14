import JSZip from "jszip";

import { createClient } from "@/lib/supabase/server";
import type { Tier } from "@/types";

export const MARKETPLACE_PAGE_SIZE = 12;

export interface MarketplaceListing {
  id: string;
  skill_id: string;
  author_id: string;
  author_email: string | null;
  name: string;
  description: string;
  tags: string[] | null;
  category: string | null;
  download_count: number;
  storage_path: string;
  published_at: string;
}

export interface MarketplaceListResult {
  listings: MarketplaceListing[];
  total: number;
  page: number;
  pageSize: number;
  categories: string[];
  tags: string[];
}

export type MarketplaceSort = "recent" | "popular" | "name";

export async function getMarketplaceListings({
  category,
  tag,
  sort = "recent",
  page = 1,
  pageSize = MARKETPLACE_PAGE_SIZE,
}: {
  category?: string;
  tag?: string;
  sort?: MarketplaceSort;
  page?: number;
  pageSize?: number;
}): Promise<MarketplaceListResult> {
  const supabase = createClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 50);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = supabase
    .from("marketplace_listings")
    .select(
      "id, skill_id, author_id, name, description, tags, category, download_count, storage_path, published_at, users!marketplace_listings_author_id_fkey(email)",
      { count: "exact" }
    );

  if (category) {
    query = query.eq("category", category);
  }

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  if (sort === "popular") {
    query = query
      .order("download_count", { ascending: false })
      .order("published_at", { ascending: false });
  } else if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else {
    query = query.order("published_at", { ascending: false });
  }

  const [listingResult, facetsResult] = await Promise.all([
    query.range(from, to).returns<MarketplaceListingRow[]>(),
    supabase
      .from("marketplace_listings")
      .select("category, tags")
      .returns<Array<{ category: string | null; tags: string[] | null }>>(),
  ]);

  if (listingResult.error) {
    throw new Error(
      `Could not load marketplace listings: ${listingResult.error.message}`
    );
  }

  if (facetsResult.error) {
    throw new Error(`Could not load marketplace facets: ${facetsResult.error.message}`);
  }

  const categories = new Set<string>();
  const tags = new Set<string>();

  for (const row of facetsResult.data ?? []) {
    const normalizedCategory = normalizeLabel(row.category);
    if (normalizedCategory) {
      categories.add(normalizedCategory);
    }

    for (const rowTag of row.tags ?? []) {
      const normalizedTag = normalizeLabel(rowTag);
      if (normalizedTag) {
        tags.add(normalizedTag);
      }
    }
  }

  return {
    listings: (listingResult.data ?? []).map(mapListingRow),
    total: listingResult.count ?? 0,
    page: safePage,
    pageSize: safePageSize,
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    tags: [...tags].sort((a, b) => a.localeCompare(b)),
  };
}

export async function getMarketplaceListing(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("marketplace_listings")
    .select(
      "id, skill_id, author_id, name, description, tags, category, download_count, storage_path, published_at, users!marketplace_listings_author_id_fkey(email)"
    )
    .eq("id", id)
    .maybeSingle<MarketplaceListingRow>();

  if (error) {
    throw new Error(`Could not load marketplace listing: ${error.message}`);
  }

  return data ? mapListingRow(data) : null;
}

export async function getMarketplaceSkillPreview(storagePath: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("chisel-marketplace")
    .download(storagePath);

  if (error || !data) {
    return null;
  }

  const zip = await JSZip.loadAsync(await data.arrayBuffer());
  const skillFile = zip.file("SKILL.md");

  if (!skillFile) {
    return null;
  }

  return skillFile.async("string");
}

export async function getMarketplaceDownloadUrl(id: string) {
  const listing = await getMarketplaceListing(id);

  if (!listing) {
    return null;
  }

  const supabase = createClient();
  const { error: incrementError } = await supabase.rpc(
    "increment_marketplace_download_count",
    { listing_id: id }
  );

  if (incrementError) {
    const { error: fallbackError } = await supabase
      .from("marketplace_listings")
      .update({ download_count: listing.download_count + 1 })
      .eq("id", id);

    if (fallbackError) {
      throw new Error(
        `Could not increment download count: ${fallbackError.message}`
      );
    }
  }

  const { data, error } = await supabase.storage
    .from("chisel-marketplace")
    .createSignedUrl(listing.storage_path, 3600, {
      download: `${listing.name}.skill`,
    });

  if (error) {
    throw new Error(`Could not create marketplace download: ${error.message}`);
  }

  return {
    name: listing.name,
    signedUrl: data.signedUrl,
  };
}

export async function publishSkill({
  userId,
  skillId,
  name,
  description,
  tags,
  category,
}: {
  userId: string;
  skillId: string;
  name: string;
  description: string;
  tags: string[];
  category: string | null;
}) {
  const supabase = createClient();

  const [{ data: user, error: userError }, { data: skill, error: skillError }] =
    await Promise.all([
      supabase
        .from("users")
        .select("tier")
        .eq("id", userId)
        .maybeSingle<{ tier: Tier }>(),
      supabase
        .from("skills")
        .select("id, storage_path")
        .eq("id", skillId)
        .eq("user_id", userId)
        .maybeSingle<{ id: string; storage_path: string }>(),
    ]);

  if (userError) {
    throw new Error(`Could not load user: ${userError.message}`);
  }

  if (skillError) {
    throw new Error(`Could not load skill: ${skillError.message}`);
  }

  if (!user || !["solo", "team_owner", "team_member"].includes(user.tier)) {
    return { status: "forbidden" as const };
  }

  if (!skill) {
    return { status: "not_found" as const };
  }

  const { data: existing, error: existingError } = await supabase
    .from("marketplace_listings")
    .select("id")
    .eq("skill_id", skillId)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error(`Could not check listing: ${existingError.message}`);
  }

  if (existing) {
    return { status: "already_published" as const, listingId: existing.id };
  }

  const { data: archive, error: downloadError } = await supabase.storage
    .from("chisel-skills")
    .download(skill.storage_path);

  if (downloadError || !archive) {
    throw new Error(
      `Could not read generated skill: ${downloadError?.message ?? "empty archive"}`
    );
  }

  const publicPath = `marketplace/${skillId}.skill`;
  const { error: uploadError } = await supabase.storage
    .from("chisel-marketplace")
    .upload(publicPath, archive, {
      contentType: "application/zip",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Could not publish archive: ${uploadError.message}`);
  }

  const { data: listing, error: insertError } = await supabase
    .from("marketplace_listings")
    .insert({
      skill_id: skillId,
      author_id: userId,
      name,
      description,
      tags,
      category,
      storage_path: publicPath,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError) {
    throw new Error(`Could not create listing: ${insertError.message}`);
  }

  return { status: "published" as const, listingId: listing.id };
}

function mapListingRow(row: MarketplaceListingRow): MarketplaceListing {
  return {
    id: row.id,
    skill_id: row.skill_id,
    author_id: row.author_id,
    author_email: Array.isArray(row.users) ? row.users[0]?.email ?? null : row.users?.email ?? null,
    name: row.name,
    description: row.description,
    tags: row.tags,
    category: row.category,
    download_count: row.download_count,
    storage_path: row.storage_path,
    published_at: row.published_at,
  };
}

function normalizeLabel(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized.toLowerCase() : null;
}

interface MarketplaceListingRow {
  id: string;
  skill_id: string;
  author_id: string;
  name: string;
  description: string;
  tags: string[] | null;
  category: string | null;
  download_count: number;
  storage_path: string;
  published_at: string;
  users: { email: string } | Array<{ email: string }> | null;
}
