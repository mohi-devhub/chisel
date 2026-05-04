import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

import { verifyWebhookSignature } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature || !verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: "invalid_signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body) as RazorpayWebhookPayload;

    if (event.event !== "payment.captured") {
      return NextResponse.json({ received: true });
    }

    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { error: "invalid_payload" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc("capture_payment", {
      p_order_id: orderId,
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
