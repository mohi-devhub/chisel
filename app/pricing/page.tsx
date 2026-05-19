"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Loader2, Sparkles, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteNav } from "@/components/ui/site-nav";
import type { Plan } from "@/types";

interface CheckoutResponse {
  checkout_url: string;
  checkout_session_id: string;
  plan: Plan;
  name: string;
}

type BillingCycle = "monthly" | "yearly";

const SOLO_MONTHLY_FEATURES = [
  "Unlimited repo scans",
  "30 skill generations / month",
  "Full skill structure (scripts, references, assets)",
  "Publish to community registry",
  "Generation history",
];

const TEAM_FEATURES = [
  "Unlimited repo scans",
  "200 generations / month (shared pool)",
  "Full skill structure",
  "Publish to community registry",
  "Private team workspace — up to 5 seats",
  "Shared templates and skills",
];

export default function PricingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  const soloPlan: Plan = billing === "yearly" ? "solo_yearly" : "solo_monthly";
  const soloPrice = billing === "yearly" ? "$79" : "$9";
  const soloCadence = billing === "yearly" ? "/ year" : "/ month";
  const soloSavings = billing === "yearly";

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
        if (response.status === 401) { router.push("/sign-in"); return; }
        throw new Error(payload.message ?? payload.details ?? "Could not start checkout.");
      }
      window.location.assign((payload as CheckoutResponse).checkout_url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start checkout.");
      setLoadingPlan(null);
    }
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% -10%, oklch(0.78 0.17 65 / 0.1) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <SiteNav
          links={[
            { label: "Registry", href: "/registry" },
            { label: "Dashboard", href: "/dashboard" },
          ]}
          cta={{ label: "Sign in", href: "/sign-in" }}
        />

        <section className="py-10">
          {/* Hero */}
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-xs font-medium text-primary">
              <Zap className="size-3" />
              14-day free trial on every paid plan
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Simple,{" "}
              <span className="bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">
                transparent
              </span>{" "}
              pricing
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required to start. Cancel any time.
            </p>

            {/* Billing toggle */}
            <div className="mt-6 inline-flex items-center gap-1 rounded-xl border border-border/50 bg-card/50 p-1">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={[
                  "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                  billing === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("yearly")}
                className={[
                  "flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                  billing === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Yearly
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">
                  Save 27%
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Plans */}
          <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-3">
            {/* Free */}
            <PlanCard
              icon={<Sparkles className="size-4" />}
              name="Free"
              price="$0"
              cadence="forever"
              description="Try Chisel before you commit."
              features={[
                "1 free repo scan",
                "Download generated CLAUDE.md",
                "Browse the registry",
              ]}
              cta="Start scanning"
              ctaHref="/"
            />

            {/* Solo */}
            <PlanCard
              icon={<Zap className="size-4" />}
              name="Solo"
              price={soloPrice}
              cadence={soloCadence}
              description="For individual developers who live in Claude Code."
              features={SOLO_MONTHLY_FEATURES}
              savings={soloSavings ? "~$29 saved vs monthly" : undefined}
              cta="Start free trial"
              onCta={() => startCheckout(soloPlan)}
              loading={loadingPlan === soloPlan}
              disabled={loadingPlan !== null}
            />

            {/* Team */}
            <PlanCard
              icon={<Users className="size-4" />}
              name="Team"
              price="$49"
              cadence="/ month"
              description="Shared config layer for your entire engineering team."
              features={TEAM_FEATURES}
              badge="Most popular"
              featured
              cta="Start free trial"
              onCta={() => startCheckout("team_monthly")}
              loading={loadingPlan === "team_monthly"}
              disabled={loadingPlan !== null}
            />
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Payments processed securely by Dodo Payments. Cancel any time from your dashboard.
          </p>
        </section>
      </div>
    </main>
  );
}

function PlanCard({
  icon,
  name,
  price,
  cadence,
  description,
  features,
  savings,
  badge,
  featured,
  cta,
  ctaHref,
  onCta,
  loading,
  disabled,
}: {
  icon: React.ReactNode;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  savings?: string;
  badge?: string;
  featured?: boolean;
  cta: string;
  ctaHref?: string;
  onCta?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={[
        "relative flex flex-col rounded-2xl border p-6 transition-all duration-200",
        featured
          ? "border-primary/50 bg-primary/5 shadow-[0_0_40px_theme(colors.primary/12%)]"
          : "border-border/50 bg-card/50",
      ].join(" ")}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground border-0 shadow-[0_0_12px_theme(colors.primary/40%)]">
            {badge}
          </Badge>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2.5">
        <div className={[
          "flex size-8 items-center justify-center rounded-lg",
          featured ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
        ].join(" ")}>
          {icon}
        </div>
        <span className={["text-base font-semibold", featured ? "text-primary" : ""].join(" ")}>
          {name}
        </span>
      </div>

      <div className="mb-1 flex items-end gap-1.5">
        <span className="text-4xl font-bold tracking-tight">{price}</span>
        <span className="mb-1 text-sm text-muted-foreground">{cadence}</span>
      </div>
      {savings && (
        <p className="mb-1 text-xs font-medium text-primary">{savings}</p>
      )}
      <p className="mb-6 text-xs text-muted-foreground">{description}</p>

      <ul className="mb-6 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className={["mt-0.5 size-4 shrink-0", featured ? "text-primary" : "text-muted-foreground"].join(" ")} />
            <span className="leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      {ctaHref ? (
        <Button className="w-full" variant={featured ? "default" : "outline"} asChild>
          <Link href={ctaHref}>{cta}</Link>
        </Button>
      ) : (
        <Button
          className={["w-full", featured ? "shadow-[0_0_20px_theme(colors.primary/30%)] hover:shadow-[0_0_30px_theme(colors.primary/50%)] transition-shadow" : ""].join(" ")}
          variant={featured ? "default" : "outline"}
          onClick={onCta}
          disabled={disabled}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
          {loading ? "Opening…" : cta}
        </Button>
      )}
    </div>
  );
}
