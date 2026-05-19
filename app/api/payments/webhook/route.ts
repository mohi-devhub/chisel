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

    if (event.type !== "payment.succeeded") {
      return NextResponse.json({ received: true });
    }

    const payment = event.data;

    if (payment.payload_type !== "Payment") {
      return NextResponse.json(
        { error: "invalid_payload" },
        { status: 400 }
      );
    }

    const checkoutSessionId = payment.checkout_session_id;
    const paymentId = payment.payment_id;

    if (!checkoutSessionId || !paymentId) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const supabase = createClient();

    const { data: paymentRow, error: paymentError } = await supabase
      .from("payments")
      .select("id, user_id, plan, status")
      .eq("dodo_checkout_session_id", checkoutSessionId)
      .maybeSingle<{ id: string; user_id: string; plan: string; status: string }>();

    if (paymentError) {
      throw new Error(`Could not look up payment: ${paymentError.message}`);
    }

    if (!paymentRow) {
      return NextResponse.json(
        { error: "payment_not_found" },
        { status: 404 }
      );
    }

    // Idempotency — already processed
    if (paymentRow.status === "paid") {
      return NextResponse.json({ received: true });
    }

    const { error: updateError } = await supabase
      .from("payments")
      .update({ status: "paid", dodo_payment_id: paymentId })
      .eq("id", paymentRow.id);

    if (updateError) {
      throw new Error(`Could not update payment: ${updateError.message}`);
    }

    if (paymentRow.plan === "solo_monthly" || paymentRow.plan === "solo_yearly") {
      const { error } = await supabase
        .from("users")
        .update({ tier: "solo", monthly_gen_count: 0, monthly_reset_at: new Date().toISOString() })
        .eq("id", paymentRow.user_id);

      if (error) {
        throw new Error(`Could not upgrade user to solo: ${error.message}`);
      }
    } else if (paymentRow.plan === "team_monthly") {
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("id", paymentRow.user_id)
        .single<{ email: string }>();

      if (userError) {
        throw new Error(`Could not fetch user for team creation: ${userError.message}`);
      }

      const orgName = userRow.email.split("@")[0] + "'s Team";

      const { data: orgRow, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: orgName, owner_id: paymentRow.user_id })
        .select("id")
        .single<{ id: string }>();

      if (orgError) {
        throw new Error(`Could not create organization: ${orgError.message}`);
      }

      const { error: memberError } = await supabase
        .from("org_members")
        .insert({ org_id: orgRow.id, user_id: paymentRow.user_id, role: "owner" });

      if (memberError) {
        throw new Error(`Could not add org owner: ${memberError.message}`);
      }

      const { error: tierError } = await supabase
        .from("users")
        .update({
          tier: "team_owner",
          org_id: orgRow.id,
          monthly_gen_count: 0,
          monthly_reset_at: new Date().toISOString(),
        })
        .eq("id", paymentRow.user_id);

      if (tierError) {
        throw new Error(`Could not upgrade user to team_owner: ${tierError.message}`);
      }
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
