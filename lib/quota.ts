import { createClient } from "@/lib/supabase/server";

const ANONYMOUS_LIMIT = 3;

export interface AnonymousQuota {
  allowed: boolean;
  remaining: number;
  sessionId?: string;
  genCount: number;
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
      allowed: true,
      remaining: ANONYMOUS_LIMIT,
      genCount: 0,
    };
  }

  const remaining = Math.max(ANONYMOUS_LIMIT - data.gen_count, 0);

  return {
    allowed: data.gen_count < ANONYMOUS_LIMIT,
    remaining,
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
    p_limit: ANONYMOUS_LIMIT,
  });

  if (error) {
    throw new Error(`Could not consume anonymous quota: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    allowed: row.allowed,
    remaining: Math.max(ANONYMOUS_LIMIT - row.gen_count, 0),
    sessionId: row.session_id,
    genCount: row.gen_count,
  };
}
