import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { getFingerprint } from "@/lib/fingerprint";
import { createOrder, isPlan, PLAN_DETAILS } from "@/lib/razorpay";
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

    const order = await createOrder({ plan: body.plan, userId });
    const supabase = createClient();
    const { error } = await supabase.from("payments").insert({
      user_id: userId,
      razorpay_order_id: order.id,
      plan: body.plan,
      status: "pending",
    });

    if (error) {
      throw new Error(`Could not record payment: ${error.message}`);
    }

    const details = PLAN_DETAILS[body.plan];

    return NextResponse.json({
      order_id: order.id,
      amount: details.amount,
      currency: details.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan: body.plan,
      name: details.label,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create order";

    return NextResponse.json(
      { error: "order_failed", details: message },
      { status: 500 }
    );
  }
}
