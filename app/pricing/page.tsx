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

const SOLO_FEATURES = [
  "5 repo scans / month",
  "Browse & download from registry",
  "Download generated CLAUDE.md",
  "7 skill generations / month",
  "Standard skill complexity",
];

const PRO_FEATURES = [
  "25 repo scans / month",
  "15 skill generations / month",
  "All complexity levels (simple → full)",
  "Scripts, references & assets",
  "Publish to community registry",
];

const TEAM_FEATURES = [
  "Everything in Pro",
  "Up to 3 seats",
  "200 skill generations / month (shared pool)",
  "Private team workspace",
  "Shared templates and skills",
];

export default function PricingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  const soloPlan: Plan = billing === "yearly" ? "solo_yearly" : "solo_monthly";
  const soloPrice = billing === "yearly" ? "$29" : "$3";
  const soloCadence = billing === "yearly" ? "/year" : "/month";

  const proPlan: Plan = billing === "yearly" ? "pro_yearly" : "pro_monthly";
  const proPrice = billing === "yearly" ? "$99" : "$12";
  const proCadence = billing === "yearly" ? "/year" : "/month";

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
    <main className="relative min-h-screen bg-background text-foreground">
      <SiteNav
        links={[
          { label: "Pricing", href: "/pricing" },
        ]}
        authLinks={[{ label: "Dashboard", href: "/dashboard" }]}
        cta={{ label: "Sign in", href: "/sign-in" }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="py-16">
          {/* Hero */}
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Pricing</p>
            <h1 className="font-display text-5xl md:text-6xl tracking-tight text-foreground leading-[0.95]">
              Affordable and <em className="italic">adaptable</em>.
            </h1>
            <p className="mt-5 text-base text-muted-foreground max-w-xl mx-auto">
              Pick the plan that fits your workflow. Upgrade or cancel any time.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center rounded-full border border-border bg-background p-1 text-sm">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={cn(
                  "rounded-full px-4 py-1.5 font-medium transition-all",
                  billing === "monthly"
                    ? "bg-foreground text-background"
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
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Bill annually
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-bold",
                  billing === "yearly"
                    ? "bg-background/20 text-background"
                    : "bg-accent/15 text-accent"
                )}>
                  Save ~20%
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive max-w-5xl mx-auto">
              {error}
            </div>
          )}

          {/* Plans */}
          <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-3 lg:items-stretch">
            {/* Solo */}
            <PlanCard
              name="Solo"
              description="For individual developers getting started with Claude Code."
              price={soloPrice}
              cadence={soloCadence}
              features={SOLO_FEATURES}
              cta="Get started"
              onCta={() => startCheckout(soloPlan)}
              loading={loadingPlan === soloPlan}
              disabled={loadingPlan !== null}
              variant="default"
            />

            {/* Pro — recommended */}
            <PlanCard
              name="Pro"
              description="For developers who live in Claude Code and want the full toolkit."
              price={proPrice}
              cadence={proCadence}
              features={PRO_FEATURES}
              cta="Get Pro"
              onCta={() => startCheckout(proPlan)}
              loading={loadingPlan === proPlan}
              disabled={loadingPlan !== null}
              variant="featured"
              recommended="Most popular"
            />

            {/* Team */}
            <PlanCard
              name="Team"
              description="Shared config layer for your entire engineering team."
              price={teamPrice}
              cadence={teamCadence}
              features={TEAM_FEATURES}
              cta="Get started"
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
        "group relative flex flex-col rounded-2xl border p-7 transition-all duration-200",
        isFeatured
          ? "border-accent/40 bg-background ring-1 ring-accent/20 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_rgba(255,255,255,0.08)] hover:border-accent/60"
          : "border-border bg-background hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_rgba(255,255,255,0.05)] hover:border-border/80"
      )}
    >
      {recommended && (
        <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
          {recommended}
        </span>
      )}

      <div className="mb-1">
        <h2 className="text-lg font-semibold text-foreground">{name}</h2>
        <p className="mt-1 text-sm text-muted-foreground leading-snug">{description}</p>
      </div>

      <div className="my-5 flex items-end gap-1">
        <span className="font-display text-5xl tracking-tight text-foreground">{price}</span>
        <span className="mb-1.5 text-sm text-muted-foreground">{cadence}</span>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        What&apos;s included:
      </p>

      <ul className="mb-7 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-accent" />
            <span className="leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      {ctaHref ? (
        <Link
          href={ctaHref}
          className={cn(
            "mt-auto flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
            isFeatured
              ? "bg-foreground text-background hover:opacity-90"
              : "border border-border bg-background text-foreground hover:bg-secondary"
          )}
        >
          {cta}
        </Link>
      ) : (
        <button
          type="button"
          className={cn(
            "mt-auto flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            isFeatured
              ? "bg-foreground text-background hover:opacity-90"
              : "border border-border bg-background text-foreground hover:bg-secondary"
          )}
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
