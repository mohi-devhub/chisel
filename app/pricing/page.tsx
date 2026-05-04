"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Loader2, PackagePlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Plan } from "@/types";

interface OrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  plan: Plan;
  name: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: () => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): {
    open: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const plans: Array<{
  plan: Plan;
  name: string;
  price: string;
  cadence: string;
  description: string;
  badge?: string;
  features: string[];
}> = [
  {
    plan: "creator_monthly",
    name: "Creator",
    price: "INR 399",
    cadence: "per month",
    description: "Full skill generation for regular Claude Code users.",
    features: [
      "30 generations per month",
      "SKILL.md, scripts, references, and assets",
      "Generation history",
      "Credit packs for overage",
    ],
  },
  {
    plan: "pro_monthly",
    name: "Pro",
    price: "INR 899",
    cadence: "per month",
    description: "Higher volume generation and marketplace publishing.",
    badge: "Publish",
    features: [
      "100 generations per month",
      "Full skill structure",
      "Marketplace publishing",
      "Download analytics",
    ],
  },
  {
    plan: "pro_annual",
    name: "Pro Annual",
    price: "INR 7,499",
    cadence: "per year",
    description: "The Pro tier with annual billing.",
    badge: "Best value",
    features: [
      "100 generations per month",
      "Full skill structure",
      "Marketplace publishing",
      "Lower annual cost",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(plan: Plan) {
    setLoadingPlan(plan);
    setError("");

    try {
      await loadRazorpayScript();

      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/sign-in");
          return;
        }

        throw new Error(
          payload.message ?? payload.details ?? "Could not start checkout."
        );
      }

      const order = payload as OrderResponse;

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout could not be loaded.");
      }

      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Chisel",
        description: order.name,
        order_id: order.order_id,
        handler: () => {
          router.push("/dashboard?payment=success");
        },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
        theme: {
          color: "#111111",
        },
      });

      checkout.open();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not start checkout."
      );
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b pb-4">
          <Link href="/" className="text-lg font-semibold">
            Chisel
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/marketplace">Marketplace</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>
        </header>

        <section className="py-8">
          <div className="mb-6 max-w-2xl">
            <Badge variant="outline" className="mb-3">
              Trial, Creator, or Pro required
            </Badge>
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Choose a generation plan
            </h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Payments are confirmed by Razorpay webhook before account access
              changes.
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((item) => (
              <Card key={item.plan} className="rounded-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{item.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {item.description}
                      </CardDescription>
                    </div>
                    {item.badge ? (
                      <Badge variant="secondary">{item.badge}</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="text-3xl font-semibold">{item.price}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {item.cadence}
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <Check className="mt-0.5 size-4 text-muted-foreground" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    onClick={() => startCheckout(item.plan)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === item.plan ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CreditCard className="size-4" />
                    )}
                    {loadingPlan === item.plan ? "Opening..." : "Pay with Razorpay"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-4 rounded-lg">
            <CardHeader>
              <CardTitle>Credit Pack</CardTitle>
              <CardDescription>
                Add 20 extra generations to any active tier.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-2xl font-semibold">INR 199</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  One-time purchase, consumed after monthly quota.
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => startCheckout("credit_pack")}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === "credit_pack" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PackagePlus className="size-4" />
                )}
                Buy credits
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function loadRazorpayScript() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Could not load Razorpay checkout.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(script);
  });
}
