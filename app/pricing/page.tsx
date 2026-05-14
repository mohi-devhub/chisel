"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Hammer, Loader2, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/types";

interface CheckoutResponse {
  checkout_url: string;
  checkout_session_id: string;
  plan: Plan;
  name: string;
}

const plans: Array<{
  plan: Plan;
  name: string;
  price: string;
  cadence: string;
  description: string;
  badge?: string;
  featured?: boolean;
  features: string[];
}> = [
  {
    plan: "solo_monthly",
    name: "Solo",
    price: "$9",
    cadence: "/ month",
    description: "For individual developers configuring Claude Code.",
    features: [
      "Unlimited repo scans",
      "30 skill generations per month",
      "Full skill structure (scripts, references, assets)",
      "Publish to community registry",
      "Generation history",
    ],
  },
  {
    plan: "team_monthly",
    name: "Team",
    price: "$49",
    cadence: "/ month",
    description: "Shared config layer for your whole engineering team.",
    badge: "Best for teams",
    featured: true,
    features: [
      "Unlimited repo scans",
      "200 generations per month (shared pool)",
      "Full skill structure",
      "Publish to community registry",
      "Private team workspace (up to 5 seats)",
      "Shared templates and skills",
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
      const response = await fetch("/api/payments/create-checkout", {
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

      const checkout = payload as CheckoutResponse;
      window.location.assign(checkout.checkout_url);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not start checkout."
      );
      setLoadingPlan(null);
    }
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border/60 pb-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_16px_theme(colors.primary/40%)]">
              <Hammer className="size-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">Chisel</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/registry">Registry</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>
        </header>

        <section className="py-10">
          {/* Hero */}
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Zap className="size-3" />
              Simple, transparent pricing
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Choose your{" "}
              <span className="bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-transparent">
                plan
              </span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              14-day free trial on every account. No credit card required.
            </p>
          </div>

          {error ? (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="mx-auto grid max-w-2xl gap-4 lg:max-w-none lg:grid-cols-2">
            {plans.map((item) => (
              <Card
                key={item.plan}
                className={[
                  "relative flex flex-col rounded-xl transition-all duration-200",
                  item.featured
                    ? "border-primary/40 bg-primary/5 shadow-[0_0_30px_theme(colors.primary/10%)]"
                    : "border-border/60 bg-card/80",
                ].join(" ")}
              >
                {item.badge ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground border-0">
                      {item.badge}
                    </Badge>
                  </div>
                ) : null}

                <CardHeader className="pt-6 pb-3">
                  <div className="flex items-center gap-2">
                    {item.featured ? (
                      <Users className="size-4 text-primary" />
                    ) : null}
                    <CardTitle className={item.featured ? "text-primary" : ""}>{item.name}</CardTitle>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight">{item.price}</span>
                    <span className="mb-1 text-sm text-muted-foreground">{item.cadence}</span>
                  </div>
                </CardContent>

                <CardContent className="flex-1 pb-3">
                  <ul className="space-y-2.5">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check className={[
                          "mt-0.5 size-4 shrink-0",
                          item.featured ? "text-primary" : "text-muted-foreground",
                        ].join(" ")} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardContent className="pt-0">
                  <Button
                    className={[
                      "w-full",
                      item.featured
                        ? "shadow-[0_0_20px_theme(colors.primary/25%)] hover:shadow-[0_0_28px_theme(colors.primary/40%)]"
                        : "",
                    ].join(" ")}
                    variant={item.featured ? "default" : "outline"}
                    onClick={() => startCheckout(item.plan)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === item.plan ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CreditCard className="size-4" />
                    )}
                    {loadingPlan === item.plan ? "Opening…" : "Start free trial"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Payments processed by Dodo Payments. Cancel any time.
          </p>
        </section>
      </div>
    </main>
  );
}
