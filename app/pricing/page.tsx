"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Hammer, Loader2, Sparkles, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/types";

interface CheckoutResponse {
  checkout_url: string;
  checkout_session_id: string;
  plan: Plan;
  name: string;
}

const plans: Array<{
  plan: Plan | null;
  name: string;
  price: string;
  cadence: string;
  description: string;
  badge?: string;
  featured?: boolean;
  cta: string;
  ctaHref?: string;
  features: string[];
  icon: React.ReactNode;
}> = [
  {
    plan: null,
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Try Chisel before you commit.",
    cta: "Start scanning",
    ctaHref: "/",
    icon: <Sparkles className="size-4" />,
    features: [
      "1 free repo scan",
      "Download generated CLAUDE.md",
      "Browse the registry",
    ],
  },
  {
    plan: "solo_monthly",
    name: "Solo",
    price: "$9",
    cadence: "/ month",
    description: "For individual developers who live in Claude Code.",
    cta: "Start free trial",
    icon: <Zap className="size-4" />,
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
    description: "Shared config layer for your entire engineering team.",
    badge: "Most popular",
    featured: true,
    cta: "Start free trial",
    icon: <Users className="size-4" />,
    features: [
      "Unlimited repo scans",
      "200 generations per month (shared pool)",
      "Full skill structure",
      "Publish to community registry",
      "Private team workspace — up to 5 seats",
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
        throw new Error(payload.message ?? payload.details ?? "Could not start checkout.");
      }

      const checkout = payload as CheckoutResponse;
      window.location.assign(checkout.checkout_url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start checkout.");
      setLoadingPlan(null);
    }
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        {/* Nav */}
        <header className="flex items-center justify-between pb-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_16px_theme(colors.primary/50%)]">
              <Hammer className="size-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Chisel</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/registry">Registry</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button
              size="sm"
              className="ml-2 h-8 text-xs shadow-[0_0_16px_theme(colors.primary/30%)]"
              asChild
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </nav>
        </header>

        <section className="py-10">
          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-xs font-medium text-primary">
              <Zap className="size-3" />
              14-day free trial on every paid plan
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Simple,{" "}
              <span className="bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">
                transparent
              </span>{" "}
              pricing
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required to start. Cancel any time.
            </p>
          </div>

          {error ? (
            <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {/* Plans grid */}
          <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-3">
            {plans.map((item) => (
              <div
                key={item.name}
                className={[
                  "relative flex flex-col rounded-2xl border p-6 transition-all duration-200",
                  item.featured
                    ? "border-primary/50 bg-primary/5 shadow-[0_0_40px_theme(colors.primary/12%)]"
                    : "border-border/50 bg-card/50",
                ].join(" ")}
              >
                {item.badge ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground border-0 shadow-[0_0_12px_theme(colors.primary/40%)]">
                      {item.badge}
                    </Badge>
                  </div>
                ) : null}

                {/* Plan icon + name */}
                <div className="mb-4 flex items-center gap-2.5">
                  <div className={[
                    "flex size-8 items-center justify-center rounded-lg",
                    item.featured ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                  ].join(" ")}>
                    {item.icon}
                  </div>
                  <span className={[
                    "text-base font-semibold",
                    item.featured ? "text-primary" : "",
                  ].join(" ")}>
                    {item.name}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-1 flex items-end gap-1.5">
                  <span className="text-4xl font-bold tracking-tight">{item.price}</span>
                  <span className="mb-1 text-sm text-muted-foreground">{item.cadence}</span>
                </div>
                <p className="mb-6 text-xs text-muted-foreground">{item.description}</p>

                {/* Features */}
                <ul className="mb-6 flex-1 space-y-2.5">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className={[
                        "mt-0.5 size-4 shrink-0",
                        item.featured ? "text-primary" : "text-muted-foreground",
                      ].join(" ")} />
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {item.ctaHref ? (
                  <Button
                    className="w-full"
                    variant={item.featured ? "default" : "outline"}
                    asChild
                  >
                    <Link href={item.ctaHref}>{item.cta}</Link>
                  </Button>
                ) : (
                  <Button
                    className={[
                      "w-full",
                      item.featured
                        ? "shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_30px_theme(colors.primary/50%)] transition-shadow"
                        : "",
                    ].join(" ")}
                    variant={item.featured ? "default" : "outline"}
                    onClick={() => item.plan && startCheckout(item.plan)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === item.plan ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CreditCard className="size-4" />
                    )}
                    {loadingPlan === item.plan ? "Opening…" : item.cta}
                  </Button>
                )}
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Payments processed securely by Dodo Payments. Cancel any time from your dashboard.
          </p>
        </section>
      </div>
    </main>
  );
}
