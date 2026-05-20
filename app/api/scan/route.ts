import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { getFingerprint } from "@/lib/fingerprint";
import { buildRepoContext, parseGitHubUrl } from "@/lib/github";
import { checkScanQuota, getEffectiveTier } from "@/lib/quota";
import { getClientIp, ipKey, rateLimit } from "@/lib/ratelimit";
import { scanRepo } from "@/lib/scanner";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users";
import type { RecommendedItem, ScanResponse } from "@/types";

export const runtime = "nodejs";

const MAX_ANONYMOUS_SCANS = 1;
// 10 scan requests per IP per minute
const SCAN_RATE_LIMIT = { limit: 10, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = rateLimit(
      ipKey(ip, "scan"),
      SCAN_RATE_LIMIT.limit,
      SCAN_RATE_LIMIT.windowMs
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "rate_limit", message: "Too many requests — please wait a moment." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((retryAfterMs ?? 60_000) / 1000)) },
        }
      );
    }

    const body = (await request.json()) as { github_url?: string };

    if (!body.github_url || typeof body.github_url !== "string") {
      return NextResponse.json({ error: "github_url is required" }, { status: 400 });
    }

    let parsed: { owner: string; repo: string; branch?: string };
    try {
      parsed = parseGitHubUrl(body.github_url);
    } catch {
      return NextResponse.json(
        { error: "invalid_url", message: "Not a valid GitHub repository URL" },
        { status: 400 }
      );
    }

    const fingerprint = getFingerprint(request);
    const { userId } = await auth();
    const supabase = createClient();

    // --- Quota check ---
    let anonSession: { id: string; scan_count: number } | null = null;

    if (!userId) {
      const { data } = await supabase
        .from("anonymous_sessions")
        .select("id, scan_count")
        .eq("fingerprint", fingerprint)
        .maybeSingle<{ id: string; scan_count: number }>();

      anonSession = data;
      const scanCount = anonSession?.scan_count ?? 0;

      if (scanCount >= MAX_ANONYMOUS_SCANS) {
        return NextResponse.json(
          { error: "quota_exceeded", message: "Sign up for unlimited scans" },
          { status: 429 }
        );
      }
    } else {
      const user = await ensureUserRecord(userId, fingerprint);
      const quota = checkScanQuota(user);

      if (!quota.allowed) {
        if (quota.reason === "plan_required") {
          return NextResponse.json(
            {
              error: "plan_required",
              message: "Choose a plan to scan repositories",
            },
            { status: 403 }
          );
        }
        return NextResponse.json(
          {
            error: "scan_limit_reached",
            message: `You've hit your monthly scan limit on the ${user.tier} plan. Upgrade for more.`,
          },
          { status: 429 }
        );
      }
    }

    // --- Scan ---
    const context = await buildRepoContext(parsed.owner, parsed.repo, parsed.branch);
    const result = await scanRepo(context);

    const detectedStack = Array.from(new Set([...context.detectedStack, ...result.detected_stack]));

    // --- Recommended registry items ---
    let recommendedItems: RecommendedItem[] = [];
    if (detectedStack.length > 0) {
      const { data } = await supabase
        .from("registry_items")
        .select("id, type, name, description, stack, install_count")
        .overlaps("stack", detectedStack)
        .order("install_count", { ascending: false })
        .limit(5);
      recommendedItems = (data ?? []) as RecommendedItem[];
    }

    // --- Track scan ---
    if (!userId) {
      if (anonSession) {
        void supabase
          .from("anonymous_sessions")
          .update({
            scan_count: anonSession.scan_count + 1,
            last_seen_at: new Date().toISOString(),
          })
          .eq("id", anonSession.id);
      } else {
        void supabase
          .from("anonymous_sessions")
          .insert({ fingerprint, scan_count: 1 });
      }
    } else {
      // Persist scan history + bump monthly scan counter for signed-in users
      const { data: currentUser } = await supabase
        .from("users")
        .select("monthly_scan_count")
        .eq("id", userId)
        .maybeSingle<{ monthly_scan_count: number }>();

      const insertResult = await supabase.from("scans").insert({
        user_id: userId,
        repo_owner: parsed.owner,
        repo_name: parsed.repo,
        repo_url: `https://github.com/${parsed.owner}/${parsed.repo}`,
        branch: parsed.branch ?? null,
        claude_md: result.claude_md,
        detected_stack: detectedStack,
      });

      if (insertResult.error) {
        console.error("Could not persist scan:", insertResult.error.message);
      }

      await supabase
        .from("users")
        .update({ monthly_scan_count: (currentUser?.monthly_scan_count ?? 0) + 1 })
        .eq("id", userId);
    }

    return NextResponse.json({
      claude_md: result.claude_md,
      detected_stack: detectedStack,
      recommended_items: recommendedItems,
    } satisfies ScanResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";

    if (message.includes("not found or is private")) {
      return NextResponse.json({ error: "repo_not_found", message }, { status: 404 });
    }
    if (message.includes("rate limit")) {
      return NextResponse.json({ error: "rate_limit", message }, { status: 429 });
    }

    return NextResponse.json({ error: "scan_failed", message }, { status: 500 });
  }
}
