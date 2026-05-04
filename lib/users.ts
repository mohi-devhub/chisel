import { currentUser } from "@clerk/nextjs/server";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";

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

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      email,
      tier: "free",
      gen_count: anonymousCount,
      monthly_gen_count: 0,
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("*")
    .single<User>();

  if (error) {
    throw new Error(`Could not create user: ${error.message}`);
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
