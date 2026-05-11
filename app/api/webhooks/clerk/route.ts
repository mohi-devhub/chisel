import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request, {
      signingSecret:
        process.env.CLERK_WEBHOOK_SIGNING_SECRET ??
        process.env.CLERK_WEBHOOK_SECRET,
    });

    if (event.type !== "user.created") {
      return NextResponse.json({ received: true });
    }

    const user = event.data;
    const email =
      user.email_addresses.find(
        (address) => address.id === user.primary_email_address_id
      )?.email_address ??
      user.email_addresses[0]?.email_address ??
      `${user.id}@clerk.local`;

    const supabase = createClient();

    // ignoreDuplicates: true — if the webhook is replayed or the record was
    // already created by ensureUserRecord, leave the existing row untouched.
    // This prevents a replay from resetting a Pro user back to free/trial.
    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        email,
        tier: "free",
        trial_ends_at: new Date(Date.now() + TRIAL_DURATION_MS).toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

    if (error) {
      throw new Error(`Could not create user: ${error.message}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook verification failed";

    return NextResponse.json(
      { error: "webhook_failed", details: message },
      { status: 400 }
    );
  }
}
