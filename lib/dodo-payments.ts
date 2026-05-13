import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";

import type { Plan } from "@/types";

type DodoEnvironment = "test_mode" | "live_mode";

export const PLAN_DETAILS: Record<
  Plan,
  { label: string; price: string; productIdEnv: string }
> = {
  solo_monthly: {
    label: "Solo",
    price: "$9/mo",
    productIdEnv: "DODO_SOLO_MONTHLY_PRODUCT_ID",
  },
  team_monthly: {
    label: "Team",
    price: "$49/mo",
    productIdEnv: "DODO_TEAM_MONTHLY_PRODUCT_ID",
  },
};

export function isPlan(value: unknown): value is Plan {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(PLAN_DETAILS, value)
  );
}

export function getDodoClient() {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;

  if (!bearerToken) {
    throw new Error("DODO_PAYMENTS_API_KEY is not configured");
  }

  return new DodoPayments({
    bearerToken,
    environment: getDodoEnvironment(),
  });
}

export async function createCheckoutSession({
  plan,
  userId,
  customer,
}: {
  plan: Plan;
  userId: string;
  customer?: {
    email?: string;
    name?: string;
  };
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  const details = PLAN_DETAILS[plan];
  const productId = getRequiredEnv(details.productIdEnv);
  const dodo = getDodoClient();

  const session = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: customer?.email
      ? {
          email: customer.email,
          name: customer.name || undefined,
        }
      : undefined,
    return_url: `${appUrl}/dashboard?payment=success`,
    cancel_url: `${appUrl}/pricing`,
    metadata: {
      plan,
      user_id: userId,
    },
  });

  if (!session.checkout_url) {
    throw new Error("Dodo Payments did not return a checkout URL");
  }

  return session;
}

export function verifyDodoWebhook(
  body: string,
  headers: {
    "webhook-id": string;
    "webhook-signature": string;
    "webhook-timestamp": string;
  }
) {
  const webhookKey =
    process.env.DODO_PAYMENTS_WEBHOOK_KEY ??
    process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

  if (!webhookKey) {
    throw new Error("DODO_PAYMENTS_WEBHOOK_KEY is not configured");
  }

  const webhook = new Webhook(webhookKey);
  return webhook.verify(body, headers) as DodoPayments.WebhookPayload;
}

function getDodoEnvironment(): DodoEnvironment {
  const value = process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";

  if (value !== "test_mode" && value !== "live_mode") {
    throw new Error(
      "DODO_PAYMENTS_ENVIRONMENT must be either test_mode or live_mode"
    );
  }

  return value;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}
