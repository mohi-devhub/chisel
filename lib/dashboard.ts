import { createClient } from "@/lib/supabase/server";
import type { Tier, User } from "@/types";

export interface DashboardSkill {
  id: string;
  name: string;
  description: string;
  structure: {
    has_scripts?: boolean;
    has_references?: boolean;
    has_assets?: boolean;
  } | null;
  created_at: string;
}

export interface PublishedSkill {
  id: string;
  skill_id: string;
  name: string;
  description: string;
  category: string | null;
  tags: string[] | null;
  download_count: number;
  published_at: string;
}

export interface DashboardData {
  user: Pick<
    User,
    | "id"
    | "email"
    | "tier"
    | "gen_count"
    | "monthly_gen_count"
    | "credits"
    | "trial_ends_at"
  > | null;
  skills: DashboardSkill[];
  publishedSkills: PublishedSkill[];
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = createClient();

  const [userResult, skillsResult, publishedResult] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, email, tier, gen_count, monthly_gen_count, credits, trial_ends_at"
      )
      .eq("id", userId)
      .maybeSingle<DashboardData["user"]>(),
    supabase
      .from("skills")
      .select("id, name, description, structure, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .returns<DashboardSkill[]>(),
    supabase
      .from("marketplace_listings")
      .select(
        "id, skill_id, name, description, category, tags, download_count, published_at"
      )
      .eq("author_id", userId)
      .order("published_at", { ascending: false })
      .returns<PublishedSkill[]>(),
  ]);

  if (userResult.error) {
    throw new Error(`Could not load user: ${userResult.error.message}`);
  }

  if (skillsResult.error) {
    throw new Error(`Could not load skills: ${skillsResult.error.message}`);
  }

  if (publishedResult.error) {
    throw new Error(
      `Could not load published skills: ${publishedResult.error.message}`
    );
  }

  return {
    user: userResult.data,
    skills: skillsResult.data ?? [],
    publishedSkills: publishedResult.data ?? [],
  };
}

export async function getSkillDownloadUrl({
  skillId,
  userId,
}: {
  skillId: string;
  userId: string;
}) {
  const supabase = createClient();

  const { data: skill, error: skillError } = await supabase
    .from("skills")
    .select("name, storage_path")
    .eq("id", skillId)
    .eq("user_id", userId)
    .maybeSingle<{ name: string; storage_path: string }>();

  if (skillError) {
    throw new Error(`Could not load skill: ${skillError.message}`);
  }

  if (!skill) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from("chisel-skills")
    .createSignedUrl(skill.storage_path, 3600, {
      download: `${skill.name}.skill`,
    });

  if (error) {
    throw new Error(`Could not create download URL: ${error.message}`);
  }

  return {
    name: skill.name,
    signedUrl: data.signedUrl,
  };
}

export function normalizeTier(tier: Tier | undefined, trialEndsAt?: string | null) {
  if (trialEndsAt && new Date(trialEndsAt).getTime() > Date.now()) {
    return "trial";
  }

  return tier ?? "free";
}
