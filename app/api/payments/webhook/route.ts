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
    const { data, error } = await supabase.rpc("capture_dodo_payment", {
      p_checkout_session_id: checkoutSessionId,
      p_payment_id: paymentId,
    });

    if (error) {
      throw new Error(`Could not capture payment: ${error.message}`);
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row?.handled) {
      return NextResponse.json(
        { error: "payment_not_found" },
        { status: 404 }
      );
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
