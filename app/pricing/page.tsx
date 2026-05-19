"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { SiteNav } from "@/components/ui/site-nav";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types";

interface CheckoutResponse {
  checkout_url: string;
  checkout_session_id: string;
  plan: Plan;
  name: string;
}

type BillingCycle = "monthly" | "yearly";

const FREE_FEATURES = [
  "1 free repo scan",
  "Download generated CLAUDE.md",
  "Browse the registry",
];

const SOLO_FEATURES = [
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
  const soloCadence = billing === "yearly" ? "/year" : "/month";

  const teamPlan: Plan = billing === "yearly" ? "team_yearly" : "team_monthly";
  const teamPrice = billing === "yearly" ? "$429" : "$49";
  const teamCadence = billing === "yearly" ? "/year" : "/month";

  async function startCheckout(plan: Plan) {
    setLoadingPlan(plan);
    setError("");
    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (response.status === 401) { router.push("/sign-in"); return; }
      let payload: CheckoutResponse & { message?: string; details?: string };
      try {
        payload = await response.json();
      } catch {
        throw new Error("Server error — please try again.");
      }
      if (!response.ok) {
        throw new Error(payload.message ?? payload.details ?? "Could not start checkout.");
      }
      window.location.assign(payload.checkout_url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start checkout.");
      setLoadingPlan(null);
    }
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <SiteNav
          links={[
            { label: "Registry", href: "/registry" },
            { label: "Pricing", href: "/pricing" },
          ]}
          authLinks={[{ label: "Dashboard", href: "/dashboard" }]}
          cta={{ label: "Sign in", href: "/sign-in" }}
        />

        <section className="py-12">
          {/* Hero */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Choose Your Plan
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Affordable and adaptable pricing to suit your goals.
            </p>

            {/* Billing toggle */}
            <div className="mt-6 inline-flex items-center rounded-full border border-border/60 bg-card p-1 text-sm">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={cn(
                  "rounded-full px-4 py-1.5 font-medium transition-all",
                  billing === "monthly"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Bill monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("yearly")}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-1.5 font-medium transition-all",
                  billing === "yearly"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Bill annually
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-bold",
                  billing === "yearly"
                    ? "bg-black/20 text-primary-foreground"
                    : "bg-primary/15 text-primary"
                )}>
                  27% OFF
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
          <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-3 lg:items-stretch">
            {/* Free */}
            <PlanCard
              name="Free"
              description="For individuals and small teams getting started."
              price="$0"
              cadence="/month"
              features={FREE_FEATURES}
              cta="Start scanning"
              ctaHref="/"
              variant="default"
            />

            {/* Solo — recommended */}
            <PlanCard
              name="Solo"
              description="For individual developers who live in Claude Code."
              price={soloPrice}
              cadence={soloCadence}
              features={SOLO_FEATURES}
              cta="Start free trial"
              onCta={() => startCheckout(soloPlan)}
              loading={loadingPlan === soloPlan}
              disabled={loadingPlan !== null}
              variant="featured"
              recommended="Recommended for you"
            />

            {/* Team */}
            <PlanCard
              name="Team"
              description="Shared config layer for your entire engineering team."
              price={teamPrice}
              cadence={teamCadence}
              features={TEAM_FEATURES}
              cta="Start free trial"
              onCta={() => startCheckout(teamPlan)}
              loading={loadingPlan === teamPlan}
              disabled={loadingPlan !== null}
              variant="default"
            />
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Payments processed securely by Dodo Payments. Cancel any time from your dashboard.
          </p>
        </section>
      </div>
    </main>
  );
}

function PlanCard({
  name,
  description,
  price,
  cadence,
  features,
  recommended,
  variant,
  cta,
  ctaHref,
  onCta,
  loading,
  disabled,
}: {
  name: string;
  description: string;
  price: string;
  cadence: string;
  features: string[];
  recommended?: string;
  variant: "default" | "featured";
  cta: string;
  ctaHref?: string;
  onCta?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isFeatured = variant === "featured";

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border p-6 transition-all duration-200 cursor-default",
        isFeatured
          ? "border-primary/50 bg-card ring-1 ring-primary/20 hover:-translate-y-1 hover:shadow-[0_8px_32px_theme(colors.primary/20%)] hover:border-primary/70"
          : "border-border/60 bg-card hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:border-border"
      )}
    >
      {recommended && (
        <p className="mb-4 text-xs font-semibold tracking-wide text-primary uppercase">
          {recommended}
        </p>
      )}

      <div className="mb-1">
        <h2 className="text-lg font-bold">{name}</h2>
        <p className="mt-1 text-sm text-muted-foreground leading-snug">{description}</p>
      </div>

      <div className="my-5 flex items-end gap-1">
        <span className="text-5xl font-black tracking-tight">{price}</span>
        <span className="mb-1.5 text-sm text-muted-foreground">{cadence}</span>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        What&apos;s included:
      </p>

      <ul className="mb-6 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className={cn(
              "mt-0.5 size-4 shrink-0",
              isFeatured ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      {ctaHref ? (
        <Link
          href={ctaHref}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-primary/60 bg-black px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-primary hover:border-primary hover:text-black"
        >
          {cta}
        </Link>
      ) : (
        <button
          type="button"
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-primary/60 bg-black px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-primary hover:border-primary hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onCta}
          disabled={disabled}
        >
          {loading
            ? <><Loader2 className="size-4 animate-spin" /> Opening…</>
            : <><CreditCard className="size-4" /> {cta}</>
          }
        </button>
      )}
    </div>
  );
}
