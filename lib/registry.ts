import JSZip from "jszip";

import { createClient } from "@/lib/supabase/server";
import type { Tier } from "@/types";

export const REGISTRY_PAGE_SIZE = 12;
export const REGISTRY_BUCKET = "chisel-registry";

export type RegistryItemType = "skill" | "template";
export type RegistrySort = "recent" | "popular" | "name";

export interface RegistryItem {
  id: string;
  type: RegistryItemType;
  author_id: string;
  author_email: string | null;
  name: string;
  description: string;
  tags: string[];
  stack: string[];
  category: string | null;
  content_path: string;
  bucket: string;
  install_count: number;
  published_at: string;
}

export interface RegistryListResult {
  items: RegistryItem[];
  total: number;
  page: number;
  pageSize: number;
  stacks: string[];
  categories: string[];
  tags: string[];
}

export async function getRegistryItems({
  type,
  stack,
  category,
  tag,
  search,
  sort = "recent",
  page = 1,
  pageSize = REGISTRY_PAGE_SIZE,
}: {
  type?: RegistryItemType;
  stack?: string;
  category?: string;
  tag?: string;
  search?: string;
  sort?: RegistrySort;
  page?: number;
  pageSize?: number;
}): Promise<RegistryListResult> {
  const supabase = createClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 50);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = supabase
    .from("registry_items")
    .select(
      "id, type, author_id, name, description, tags, stack, category, content_path, bucket, install_count, published_at, users!registry_items_author_id_fkey(email)",
      { count: "exact" }
    );

  if (type) {
    query = query.eq("type", type);
  }
  if (stack) {
    query = query.contains("stack", [stack]);
  }
  if (tag) {
    query = query.contains("tags", [tag]);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "")}%`;
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
  }

  if (sort === "popular") {
    query = query
      .order("install_count", { ascending: false })
      .order("published_at", { ascending: false });
  } else if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else {
    query = query.order("published_at", { ascending: false });
  }

  const [listResult, facetsResult] = await Promise.all([
    query.range(from, to).returns<RegistryItemRow[]>(),
    supabase
      .from("registry_items")
      .select("stack, category, tags")
      .returns<Array<{ stack: string[] | null; category: string | null; tags: string[] | null }>>(),
  ]);

  if (listResult.error) {
    throw new Error(`Could not load registry items: ${listResult.error.message}`);
  }
  if (facetsResult.error) {
    throw new Error(`Could not load registry facets: ${facetsResult.error.message}`);
  }

  const stacks = new Set<string>();
  const categories = new Set<string>();
  const tags = new Set<string>();

  for (const row of facetsResult.data ?? []) {
    for (const value of row.stack ?? []) {
      const v = normalizeLabel(value);
      if (v) stacks.add(v);
    }
    const c = normalizeLabel(row.category);
    if (c) categories.add(c);
    for (const value of row.tags ?? []) {
      const v = normalizeLabel(value);
      if (v) tags.add(v);
    }
  }

  return {
    items: (listResult.data ?? []).map(mapRow),
    total: listResult.count ?? 0,
    page: safePage,
    pageSize: safePageSize,
    stacks: [...stacks].sort((a, b) => a.localeCompare(b)),
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    tags: [...tags].sort((a, b) => a.localeCompare(b)),
  };
}

export async function getRegistryItem(id: string): Promise<RegistryItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("registry_items")
    .select(
      "id, type, author_id, name, description, tags, stack, category, content_path, bucket, install_count, published_at, users!registry_items_author_id_fkey(email)"
    )
    .eq("id", id)
    .maybeSingle<RegistryItemRow>();

  if (error) {
    throw new Error(`Could not load registry item: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

export async function getRegistryItemPreview(item: RegistryItem): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(item.bucket)
    .download(item.content_path);

  if (error || !data) {
    return null;
  }

  if (item.type === "template") {
    return data.text();
  }

  const zip = await JSZip.loadAsync(await data.arrayBuffer());
  const skillFile = zip.file("SKILL.md");
  if (!skillFile) {
    return null;
  }
  return skillFile.async("string");
}

export async function getRegistryDownloadUrl(item: RegistryItem) {
  const supabase = createClient();
  const ext = item.type === "skill" ? "skill" : "md";

  const { error: incrementError } = await supabase.rpc(
    "increment_registry_install_count",
    { item_id: item.id }
  );

  if (incrementError) {
    const { error: fallbackError } = await supabase
      .from("registry_items")
      .update({ install_count: item.install_count + 1 })
      .eq("id", item.id);

    if (fallbackError) {
      throw new Error(`Could not increment install count: ${fallbackError.message}`);
    }
  }

  const { data, error } = await supabase.storage
    .from(item.bucket)
    .createSignedUrl(item.content_path, 3600, {
      download: `${sanitizeFilename(item.name)}.${ext}`,
    });

  if (error) {
    throw new Error(`Could not create signed download URL: ${error.message}`);
  }

  return data.signedUrl;
}

export interface PublishTemplateInput {
  userId: string;
  name: string;
  description: string;
  stack: string[];
  tags: string[];
  category: string | null;
  content: string;
}

export interface PublishSkillInput {
  userId: string;
  skillId: string;
  name: string;
  description: string;
  stack: string[];
  tags: string[];
  category: string | null;
}

export type PublishResult =
  | { status: "published"; itemId: string }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "already_published"; itemId: string };

export async function publishTemplate(input: PublishTemplateInput): Promise<PublishResult> {
  const supabase = createClient();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("tier")
    .eq("id", input.userId)
    .maybeSingle<{ tier: Tier }>();

  if (userError) {
    throw new Error(`Could not load user: ${userError.message}`);
  }
  if (!user || !isPublisher(user.tier)) {
    return { status: "forbidden" };
  }

  const id = crypto.randomUUID();
  const contentPath = `templates/${id}.md`;

  const { error: uploadError } = await supabase.storage
    .from(REGISTRY_BUCKET)
    .upload(contentPath, new Blob([input.content], { type: "text/markdown" }), {
      contentType: "text/markdown",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Could not upload template: ${uploadError.message}`);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("registry_items")
    .insert({
      id,
      author_id: input.userId,
      type: "template",
      name: input.name,
      description: input.description,
      tags: input.tags,
      stack: input.stack,
      category: input.category,
      content_path: contentPath,
      bucket: REGISTRY_BUCKET,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError) {
    throw new Error(`Could not create registry entry: ${insertError.message}`);
  }

  return { status: "published", itemId: inserted.id };
}

export async function publishSkillToRegistry(input: PublishSkillInput): Promise<PublishResult> {
  const supabase = createClient();

  const [{ data: user, error: userError }, { data: skill, error: skillError }] = await Promise.all([
    supabase
      .from("users")
      .select("tier")
      .eq("id", input.userId)
      .maybeSingle<{ tier: Tier }>(),
    supabase
      .from("skills")
      .select("id, storage_path")
      .eq("id", input.skillId)
      .eq("user_id", input.userId)
      .maybeSingle<{ id: string; storage_path: string }>(),
  ]);

  if (userError) throw new Error(`Could not load user: ${userError.message}`);
  if (skillError) throw new Error(`Could not load skill: ${skillError.message}`);
  if (!user || !isPublisher(user.tier)) return { status: "forbidden" };
  if (!skill) return { status: "not_found" };

  const { data: existing, error: existingError } = await supabase
    .from("registry_items")
    .select("id")
    .eq("author_id", input.userId)
    .eq("type", "skill")
    .eq("name", input.name)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error(`Could not check existing item: ${existingError.message}`);
  }
  if (existing) {
    return { status: "already_published", itemId: existing.id };
  }

  const { data: archive, error: downloadError } = await supabase.storage
    .from("chisel-skills")
    .download(skill.storage_path);

  if (downloadError || !archive) {
    throw new Error(`Could not read source skill: ${downloadError?.message ?? "empty archive"}`);
  }

  const id = crypto.randomUUID();
  const contentPath = `skills/${id}.skill`;

  const { error: uploadError } = await supabase.storage
    .from(REGISTRY_BUCKET)
    .upload(contentPath, archive, {
      contentType: "application/zip",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Could not upload skill: ${uploadError.message}`);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("registry_items")
    .insert({
      id,
      author_id: input.userId,
      type: "skill",
      name: input.name,
      description: input.description,
      tags: input.tags,
      stack: input.stack,
      category: input.category,
      content_path: contentPath,
      bucket: REGISTRY_BUCKET,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError) {
    throw new Error(`Could not create registry entry: ${insertError.message}`);
  }

  return { status: "published", itemId: inserted.id };
}

function isPublisher(tier: Tier) {
  return tier === "solo" || tier === "team_owner" || tier === "team_member";
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").slice(0, 60) || "registry-item";
}

function mapRow(row: RegistryItemRow): RegistryItem {
  const authorEmail = Array.isArray(row.users)
    ? row.users[0]?.email ?? null
    : row.users?.email ?? null;

  return {
    id: row.id,
    type: row.type,
    author_id: row.author_id,
    author_email: authorEmail,
    name: row.name,
    description: row.description,
    tags: row.tags ?? [],
    stack: row.stack ?? [],
    category: row.category,
    content_path: row.content_path,
    bucket: row.bucket ?? REGISTRY_BUCKET,
    install_count: row.install_count ?? 0,
    published_at: row.published_at,
  };
}

function normalizeLabel(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized.toLowerCase() : null;
}

interface RegistryItemRow {
  id: string;
  type: RegistryItemType;
  author_id: string;
  name: string;
  description: string;
  tags: string[] | null;
  stack: string[] | null;
  category: string | null;
  content_path: string;
  bucket: string | null;
  install_count: number | null;
  published_at: string;
  users: { email: string } | Array<{ email: string }> | null;
}
