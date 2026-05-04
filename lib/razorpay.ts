import Razorpay from "razorpay";
import type { Plan } from "@/types";

export const PLAN_DETAILS: Record<
  Plan,
  { label: string; amount: number; currency: "INR" }
> = {
  creator_monthly: {
    label: "Creator Monthly",
    amount: 39900,
    currency: "INR",
  },
  pro_monthly: {
    label: "Pro Monthly",
    amount: 89900,
    currency: "INR",
  },
  pro_annual: {
    label: "Pro Annual",
    amount: 749900,
    currency: "INR",
  },
  credit_pack: {
    label: "Credit Pack",
    amount: 19900,
    currency: "INR",
  },
};

export function isPlan(value: unknown): value is Plan {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(PLAN_DETAILS, value)
  );
}

export function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createOrder({
  plan,
  userId,
}: {
  plan: Plan;
  userId: string;
}) {
  const details = PLAN_DETAILS[plan];
  const razorpay = getRazorpayClient();

  return razorpay.orders.create({
    amount: details.amount,
    currency: details.currency,
    receipt: `${plan}_${Date.now()}`.slice(0, 40),
    notes: {
      plan,
      user_id: userId,
    },
  });
}

export function verifyWebhookSignature(body: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  }

  return Razorpay.validateWebhookSignature(body, signature, secret);
}
