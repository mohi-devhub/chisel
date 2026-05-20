import { createClient } from "@/lib/supabase/server";
import type { Tier, User } from "@/types";

const MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

// Monthly skill generation limits per tier
const GEN_LIMITS: Record<Tier, number> = {
  free: 0,
  solo: 7,
  pro: 15,
  team_owner: 200,
  team_member: 200,
};

// Monthly repo scan limits per tier
const SCAN_LIMITS: Record<Tier, number> = {
  free: 0,
  solo: 5,
  pro: 25,
  team_owner: 200,
  team_member: 200,
};

export function getGenLimit(tier: Tier): number {
  return GEN_LIMITS[tier] ?? 0;
}

export function getScanLimit(tier: Tier): number {
  return SCAN_LIMITS[tier] ?? 0;
}

export interface AnonymousQuota {
  allowed: boolean;
  remaining: number;
  sessionId?: string;
  genCount: number;
}

export interface UserQuota {
  allowed: boolean;
  remaining: number;
  effectiveTier: Tier;
  reason?: "plan_required" | "monthly_limit";
}

export async function checkAnonymousQuota(
  fingerprint: string
): Promise<AnonymousQuota> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("anonymous_sessions")
    .select("id, gen_count")
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not check anonymous quota: ${error.message}`);
  }

  if (!data) {
    return {
      allowed: false,
      remaining: 0,
      genCount: 0,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    sessionId: data.id,
    genCount: data.gen_count,
  };
}

export async function consumeAnonymousQuota(
  fingerprint: string
): Promise<AnonymousQuota> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("consume_anonymous_quota", {
    p_fingerprint: fingerprint,
    p_limit: 0,
  });

  if (error) {
    throw new Error(`Could not consume anonymous quota: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    allowed: row.allowed,
    remaining: 0,
    sessionId: row.session_id,
    genCount: row.gen_count,
  };
}

export function getEffectiveTier(user: User): Tier {
  return user.tier;
}

export function checkUserQuota(user: User): UserQuota {
  const effectiveTier = getEffectiveTier(user);

  if (effectiveTier === "free") {
    return {
      allowed: false,
      remaining: 0,
      effectiveTier,
      reason: "plan_required",
    };
  }

  const monthlyCount = shouldResetMonthlyCount(user) ? 0 : user.monthly_gen_count;
  const monthlyLimit = getGenLimit(effectiveTier);
  const monthlyRemaining = Math.max(monthlyLimit - monthlyCount, 0);

  if (monthlyRemaining > 0) {
    return {
      allowed: true,
      remaining: monthlyRemaining,
      effectiveTier,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    effectiveTier,
    reason: "monthly_limit",
  };
}

export function checkScanQuota(user: User): UserQuota {
  const effectiveTier = getEffectiveTier(user);

  if (effectiveTier === "free") {
    return {
      allowed: false,
      remaining: 0,
      effectiveTier,
      reason: "plan_required",
    };
  }

  const monthlyCount = shouldResetMonthlyCount(user) ? 0 : user.monthly_scan_count;
  const monthlyLimit = getScanLimit(effectiveTier);
  const monthlyRemaining = Math.max(monthlyLimit - monthlyCount, 0);

  if (monthlyRemaining > 0) {
    return { allowed: true, remaining: monthlyRemaining, effectiveTier };
  }

  return {
    allowed: false,
    remaining: 0,
    effectiveTier,
    reason: "monthly_limit",
  };
}

export async function consumeUserQuota(user: User): Promise<UserQuota> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("consume_user_quota", {
    p_user_id: user.id,
  });

  if (error) {
    throw new Error(`Could not consume user quota: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    allowed: row.allowed,
    remaining: row.remaining,
    effectiveTier: row.effective_tier,
    reason: row.reason ?? undefined,
  };
}

function shouldResetMonthlyCount(user: User) {
  return (
    Date.now() - new Date(user.monthly_reset_at).getTime() >= MONTH_IN_MS
  );
}
