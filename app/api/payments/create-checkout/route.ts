import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { getFingerprint } from "@/lib/fingerprint";
import {
  createCheckoutSession,
  isPlan,
  PLAN_DETAILS,
} from "@/lib/dodo-payments";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { plan?: unknown };

    if (!isPlan(body.plan)) {
      return NextResponse.json(
        { error: "invalid_plan", message: "Unsupported plan." },
        { status: 400 }
      );
    }

    const fingerprint = getFingerprint(request);
    await ensureUserRecord(userId, fingerprint);

    const supabase = createClient();

    // Idempotency: reuse a pending checkout if it has a stored checkout_url
    const { data: existing } = await supabase
      .from("payments")
      .select("dodo_checkout_session_id, checkout_url, plan")
      .eq("user_id", userId)
      .eq("plan", body.plan)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ dodo_checkout_session_id: string; checkout_url: string | null; plan: string }>();

    if (existing?.dodo_checkout_session_id && existing.checkout_url) {
      const details = PLAN_DETAILS[body.plan];
      return NextResponse.json({
        checkout_url: existing.checkout_url,
        checkout_session_id: existing.dodo_checkout_session_id,
        plan: body.plan,
        name: details.label,
      });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    const name = user?.fullName ?? user?.username ?? undefined;
    const session = await createCheckoutSession({
      plan: body.plan,
      userId,
      customer: { email, name },
    });

    const { error } = await supabase.from("payments").insert({
      user_id: userId,
      dodo_checkout_session_id: session.session_id,
      checkout_url: session.checkout_url ?? null,
      plan: body.plan,
      status: "pending",
    });

    if (error) {
      throw new Error(`Could not record payment: ${error.message}`);
    }

    const details = PLAN_DETAILS[body.plan];

    return NextResponse.json({
      checkout_url: session.checkout_url,
      checkout_session_id: session.session_id,
      plan: body.plan,
      name: details.label,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create checkout";

    return NextResponse.json(
      { error: "checkout_failed", details: message },
      { status: 500 }
    );
  }
}
