import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

import { verifyDodoWebhook } from "@/lib/dodo-payments";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const webhookHeaders = {
      "webhook-id": request.headers.get("webhook-id") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    };

    if (
      !webhookHeaders["webhook-id"] ||
      !webhookHeaders["webhook-signature"] ||
      !webhookHeaders["webhook-timestamp"]
    ) {
      return NextResponse.json(
        { error: "missing_webhook_headers" },
        { status: 400 }
      );
    }

    let event: ReturnType<typeof verifyDodoWebhook>;

    try {
      event = verifyDodoWebhook(body, webhookHeaders);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("is not configured")
      ) {
        throw error;
      }

      return NextResponse.json(
        { error: "invalid_signature" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    switch (event.type) {
      case "payment.succeeded": {
        if (event.data.payload_type !== "Payment") break;

        const payment = event.data;
        const checkoutSessionId = payment.checkout_session_id;
        const paymentId = payment.payment_id;
        const subscriptionId = payment.subscription_id ?? null;

        if (!checkoutSessionId || !paymentId) break;

        const { data: paymentRow, error: lookupError } = await supabase
          .from("payments")
          .select("id, user_id, plan, status")
          .eq("dodo_checkout_session_id", checkoutSessionId)
          .maybeSingle<{ id: string; user_id: string; plan: string; status: string }>();

        if (lookupError) throw new Error(`Lookup failed: ${lookupError.message}`);
        if (!paymentRow) break; // unknown session — ignore
        if (paymentRow.status === "paid") break; // idempotent

        await supabase
          .from("payments")
          .update({
            status: "paid",
            dodo_payment_id: paymentId,
            ...(subscriptionId && { dodo_subscription_id: subscriptionId }),
          })
          .eq("id", paymentRow.id);

        await upgradeTier(supabase, paymentRow.user_id, paymentRow.plan);
        break;
      }

      case "payment.failed":
      case "payment.cancelled": {
        if (event.data.payload_type !== "Payment") break;

        const checkoutSessionId = event.data.checkout_session_id;
        if (!checkoutSessionId) break;

        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("dodo_checkout_session_id", checkoutSessionId)
          .eq("status", "pending");
        break;
      }

      case "subscription.active": {
        if (event.data.payload_type !== "Subscription") break;

        const sub = event.data;
        const userId = sub.metadata?.user_id;
        const plan = sub.metadata?.plan;
        if (!userId || !plan) break;

        // Update subscription ID on the matching payment row (may already be set by payment.succeeded)
        await supabase
          .from("payments")
          .update({ dodo_subscription_id: sub.subscription_id })
          .eq("user_id", userId)
          .eq("plan", plan)
          .is("dodo_subscription_id", null)
          .eq("status", "paid");

        // Ensure tier is set correctly (idempotent)
        await upgradeTier(supabase, userId, plan);
        break;
      }

      case "subscription.renewed": {
        if (event.data.payload_type !== "Subscription") break;

        // Renewal fired — subscription is still active. Reset monthly quota.
        const sub = event.data;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        await supabase
          .from("users")
          .update({ monthly_gen_count: 0, monthly_reset_at: new Date().toISOString() })
          .eq("id", userId);
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired": {
        if (event.data.payload_type !== "Subscription") break;

        const sub = event.data;
        const metaUserId: string | undefined = sub.metadata?.user_id || undefined;

        // Try metadata first, then look up via subscription_id in payments table
        let resolvedUserId: string | undefined = metaUserId;
        if (!resolvedUserId) {
          const { data: row } = await supabase
            .from("payments")
            .select("user_id")
            .eq("dodo_subscription_id", sub.subscription_id)
            .maybeSingle<{ user_id: string }>();
          resolvedUserId = row?.user_id;
        }

        if (!resolvedUserId) break;

        await supabase
          .from("users")
          .update({ tier: "free" })
          .eq("id", resolvedUserId);

        await supabase
          .from("payments")
          .update({ status: "cancelled" })
          .eq("dodo_subscription_id", sub.subscription_id);
        break;
      }

      case "subscription.failed":
      case "subscription.on_hold": {
        if (event.data.payload_type !== "Subscription") break;

        const sub = event.data;

        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("dodo_subscription_id", sub.subscription_id)
          .eq("status", "paid");
        break;
      }

      default:
        // Unhandled event types — acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not process webhook";

    return NextResponse.json(
      { error: "webhook_failed", details: message },
      { status: 500 }
    );
  }
}

async function upgradeTier(
  supabase: ReturnType<typeof import("@/lib/supabase/server").createClient>,
  userId: string,
  plan: string
) {
  if (plan === "solo_monthly" || plan === "solo_yearly") {
    const { error } = await supabase
      .from("users")
      .update({ tier: "solo", monthly_gen_count: 0, monthly_reset_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(`Could not upgrade to solo: ${error.message}`);
  } else if (plan === "team_monthly" || plan === "team_yearly") {
    // Check if org already exists for this user
    const { data: existingUser } = await supabase
      .from("users")
      .select("org_id, email")
      .eq("id", userId)
      .single<{ org_id: string | null; email: string }>();

    if (existingUser?.org_id) {
      // Already has an org — just ensure tier
      await supabase
        .from("users")
        .update({ tier: "team_owner", monthly_gen_count: 0, monthly_reset_at: new Date().toISOString() })
        .eq("id", userId);
      return;
    }

    const orgName = (existingUser?.email?.split("@")[0] ?? "My") + "'s Team";

    const { data: orgRow, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName, owner_id: userId })
      .select("id")
      .single<{ id: string }>();

    if (orgError) throw new Error(`Could not create organization: ${orgError.message}`);

    const { error: memberError } = await supabase
      .from("org_members")
      .insert({ org_id: orgRow.id, user_id: userId, role: "owner" });

    if (memberError) throw new Error(`Could not add org owner: ${memberError.message}`);

    const { error: tierError } = await supabase
      .from("users")
      .update({ tier: "team_owner", org_id: orgRow.id, monthly_gen_count: 0, monthly_reset_at: new Date().toISOString() })
      .eq("id", userId);

    if (tierError) throw new Error(`Could not upgrade to team_owner: ${tierError.message}`);
  }
}
