import { currentUser } from "@clerk/nextjs/server";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";

const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

export async function ensureUserRecord(userId: string, fingerprint: string) {
  const supabase = createClient();

  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle<User>();

  if (existingError) {
    throw new Error(`Could not load user: ${existingError.message}`);
  }

  const anonymousCount = await getAnonymousGenerationCount(fingerprint);

  if (existing) {
    if (anonymousCount > existing.gen_count) {
      const { data, error } = await supabase
        .from("users")
        .update({ gen_count: anonymousCount })
        .eq("id", userId)
        .select("*")
        .maybeSingle<User>();

      if (error) {
        throw new Error(`Could not carry over anonymous quota: ${error.message}`);
      }

      return data ?? existing;
    }

    return existing;
  }

  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses.find(
      (address) => address.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    `${userId}@clerk.local`;

  // Upsert to handle concurrent first-request races gracefully.
  const { error: upsertError } = await supabase
    .from("users")
    .upsert(
      {
        id: userId,
        email,
        tier: "free",
        gen_count: anonymousCount,
        monthly_gen_count: 0,
        trial_ends_at: new Date(Date.now() + TRIAL_DURATION_MS).toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

  if (upsertError) {
    throw new Error(`Could not create user: ${upsertError.message}`);
  }

  // Re-fetch the row (covers both the just-inserted case and the race-condition
  // case where another request inserted first).
  const { data: fetched, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle<User>();

  if (fetchError) {
    throw new Error(`Could not load user after upsert: ${fetchError.message}`);
  }

  if (!fetched) {
    throw new Error(`User record missing after upsert for ${userId}`);
  }

  return fetched;
}

async function getAnonymousGenerationCount(fingerprint: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("anonymous_sessions")
    .select("gen_count")
    .eq("fingerprint", fingerprint)
    .maybeSingle<{ gen_count: number }>();

  if (error) {
    throw new Error(`Could not load anonymous quota: ${error.message}`);
  }

  return data?.gen_count ?? 0;
}
