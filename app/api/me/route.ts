import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { getFingerprint } from "@/lib/fingerprint";
import { checkUserQuota, getEffectiveTier } from "@/lib/quota";
import { ensureUserRecord } from "@/lib/users";
import type { AccountStatus } from "@/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const fingerprint = getFingerprint(request);
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({
      signedIn: false,
      tier: "free",
      effectiveTier: "free",
      remaining: 0,
      canUseAdvanced: false,
    } satisfies AccountStatus);
  }

  const user = await ensureUserRecord(userId, fingerprint);
  const quota = checkUserQuota(user);
  const effectiveTier = getEffectiveTier(user);

  return NextResponse.json({
    signedIn: true,
    tier: user.tier,
    effectiveTier,
    remaining: quota.remaining,
    canUseAdvanced: effectiveTier !== "free",
  } satisfies AccountStatus);
}
