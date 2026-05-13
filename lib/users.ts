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
        .single<User>();

      if (error) {
        throw new Error(`Could not carry over anonymous quota: ${error.message}`);
      }

      return data;
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

  // Use upsert to handle the race condition where two concurrent requests
  // both find no existing record and try to create one simultaneously.
  // ignoreDuplicates: false so we get the row back either way.
  const { data, error } = await supabase
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
    )
    .select("*")
    .single<User>();

  if (error) {
    // Another request won the race and inserted first — re-fetch the existing row.
    if (error.code === "23505" || error.code === "PGRST116") {
      const { data: refetched, error: refetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single<User>();

      if (refetchError) {
        throw new Error(`Could not load user after conflict: ${refetchError.message}`);
      }

      return refetched;
    }

    throw new Error(`Could not create user: ${error.message}`);
  }

  if (!data) {
    // ignoreDuplicates suppressed the insert — re-fetch the existing row.
    const { data: refetched, error: refetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single<User>();

    if (refetchError) {
      throw new Error(`Could not load user after upsert: ${refetchError.message}`);
    }

    return refetched;
  }

  return data;
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
