"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bot,
  Calendar,
  Check,
  ChevronDown,
  Command,
  CreditCard,
  Download,
  FileArchive,
  GitBranch,
  Library,
  Lock,
  Mail,
  PackageCheck,
  Play,
  Rocket,
  Search,
  Sparkles,
  Store,
  Users,
  Wand2,
  Workflow,
  Zap,
} from "lucide-react";

import { SiteNav } from "@/components/ui/site-nav";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background font-body">
      <SiteNav
        links={[
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "/pricing" },
        ]}
        authLinks={[{ label: "Dashboard", href: "/dashboard" }]}
        cta={{ label: "Get started", href: "/sign-up" }}
      />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <FeatureScanner />
      <FeatureRegistry />
      <FeatureWorkspace />
      <WhyChisel />
      <PricingTeaser />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background video — moody dark abstract loop (Pexels, free use).
          Filter forces B&W in case the source has any color tint. */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: "grayscale(1) brightness(0.45) contrast(1.2)" }}
      >
        <source
          src="https://videos.pexels.com/video-files/2611250/2611250-hd_1920_1080_30fps.mp4"
          type="video/mp4"
        />
        {/* Fallback */}
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
          type="video/mp4"
        />
      </video>

      {/* Overlay stack — keep B&W aesthetic */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/55" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 0%, oklch(0.07 0 0 / 0.85) 100%)",
          }}
        />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-white/[0.05] blur-[120px] hero-glow-1" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-6 pt-16 pb-24">
        <div className="animate-fade-up-sm inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground font-body mb-6">
          CLI Version coming soon
          <span className="text-foreground">✨</span>
        </div>

        <h1 className="animate-fade-up delay-1 text-center font-display text-5xl md:text-6xl lg:text-[5.5rem] leading-[0.95] tracking-tight text-foreground max-w-3xl">
          Make Claude Code{" "}
          <em className="font-display italic text-muted-foreground">actually</em> understand your repo.
        </h1>

        <p className="animate-fade-up delay-2 mt-6 text-center text-base md:text-lg text-muted-foreground max-w-[640px] leading-relaxed font-body">
          Chisel scans your codebase, detects your stack, and generates a precise and clean
          CLAUDE.md , so Claude Code works the way you expect from message one.
        </p>

        <div className="animate-fade-up delay-3 mt-7 flex items-center gap-3">
          <Link
            href="/sign-up"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium font-body text-background hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            Start free scan
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="animate-fade-up-lg delay-5 mt-14 w-full max-w-5xl">
          <div className="rounded-2xl overflow-hidden p-2 border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Trust Strip ────────────────────────────────────────── */
function TrustStrip() {
  const stacks = [
    "Next.js", "FastAPI", "Rails", "Django", "Go", "Rust", "Laravel", "Express", "Spring", "Phoenix"
  ];
  return (
    <section className="border-y border-border bg-card/40 py-10">
      <div className="px-6 md:px-12 lg:px-20">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
          Works with any stack
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 max-w-4xl mx-auto">
          {stacks.map((s) => (
            <span key={s} className="text-base md:text-lg font-display text-muted-foreground/80">
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ───────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: <GitBranch className="size-5" />,
      title: "Paste your GitHub URL",
      desc: "Drop in any public repo — or connect GitHub for private repos. No CLI, no installation, no config files to write.",
    },
    {
      n: "02",
      icon: <Wand2 className="size-5" />,
      title: "We analyze the codebase",
      desc: "Chisel reads your file tree, package manifests, README, and existing configs. Detects frameworks, conventions, dev commands, and constraints.",
    },
    {
      n: "03",
      icon: <Rocket className="size-5" />,
      title: "Download your CLAUDE.md",
      desc: "A precise, token-efficient CLAUDE.md lands in your browser. Edit inline if you want, then drop it at your repo root.",
    },
  ];

  return (
    <section id="features" className="py-24">
      <div className="px-6 md:px-12 lg:px-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">How it works</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground">
            Zero setup. <em className="italic">Instant</em> context.
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            From GitHub URL to a production-ready CLAUDE.md in three steps.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative flex flex-col gap-5 rounded-2xl border border-border bg-card/40 p-7"
            >
              <span className="font-display text-5xl text-foreground/15 select-none leading-none">
                {s.n}
              </span>
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                {s.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Feature: Scanner ───────────────────────────────────── */
function FeatureScanner() {
  return (
    <section className="border-t border-border py-24 bg-card/40">
      <div className="px-6 md:px-12 lg:px-20 max-w-6xl mx-auto grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">Repo Scanner</p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight text-foreground leading-[1.05]">
            Deep repo analysis <em className="italic">in seconds</em>.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Chisel reads your repo the way a senior engineer would on day one —
            file structure, package manifests, existing configs, README, and
            conventions — then writes a CLAUDE.md that captures all of it
            precisely.
          </p>

          <ul className="mt-7 space-y-3">
            {[
              "Detects frameworks, languages, and runtime versions",
              "Extracts dev commands from package.json, Makefile, and scripts",
              "Reads existing CLAUDE.md and extends rather than overwrites",
              "Token-efficient output — no filler, just facts Claude needs",
              "Editable in the browser before download",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                <span className="leading-snug">{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/sign-up"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            Scan your repo free
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)]">
          <ClaudemdCodeMockup />
        </div>
      </div>
    </section>
  );
}

/* ─── Feature: Registry ──────────────────────────────────── */
function FeatureRegistry() {
  return (
    <section className="border-t border-border py-24">
      <div className="px-6 md:px-12 lg:px-20 max-w-6xl mx-auto grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="order-2 lg:order-1 rounded-2xl border border-border bg-background p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)]">
          <RegistryMockup />
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">Skill Registry</p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight text-foreground leading-[1.05]">
            Community-built skills, <em className="italic">one click</em> to install.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Browse hundreds of community-built CLAUDE.md templates and skill
            modules organized by stack. Install with one click, publish your own,
            and stop reinventing the wheel.
          </p>

          <ul className="mt-7 space-y-3">
            {[
              "Templates for Next.js, Django, Rails, Go, Rust, and more",
              "Skill modules for testing, CI/CD, code review, deployments",
              "Install into any project with a single click",
              "Publish your own skills and earn community recognition",
              "Browse without an account",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                <span className="leading-snug">{f}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs text-muted-foreground">
            Available to all signed-in users — start with a free account.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Feature: Workspace ─────────────────────────────────── */
function FeatureWorkspace() {
  return (
    <section className="border-t border-border py-24 bg-card/40">
      <div className="px-6 md:px-12 lg:px-20 max-w-6xl mx-auto grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">Team Workspace</p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight text-foreground leading-[1.05]">
            Keep your whole team <em className="italic">in sync</em>.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Stop sending CLAUDE.md files over Slack. Chisel gives your team a
            private workspace where you can share configs, skills, and templates
            — so every engineer starts from the same foundation.
          </p>

          <ul className="mt-7 space-y-3">
            {[
              "Private team workspace — up to 3 seats on the Team plan",
              "Shared skill library visible only to your org",
              "200 generations/month pooled across the team",
              "Owner controls — manage members, publish rights, and templates",
              "Onboard new engineers in minutes, not days",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                <span className="leading-snug">{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/pricing"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Users className="size-4" />
            See team plans
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08)]">
          <TeamMockup />
        </div>
      </div>
    </section>
  );
}

/* ─── Why Chisel ─────────────────────────────────────────── */
function WhyChisel() {
  const cards = [
    {
      icon: <Zap className="size-5" />,
      title: "Faster first message",
      desc: "Skip the 10-minute context dump. Claude Code reads your CLAUDE.md and already knows your stack, commands, and conventions.",
    },
    {
      icon: <Lock className="size-5" />,
      title: "Fewer hallucinations",
      desc: "Precise stack context means Claude doesn't invent commands or file paths that don't exist in your project.",
    },
    {
      icon: <Bot className="size-5" />,
      title: "Enforces conventions",
      desc: "Encode your rules once — server components by default, no skipping TypeScript errors, always pnpm — and Claude respects them.",
    },
    {
      icon: <Sparkles className="size-5" />,
      title: "AI-generated, human-editable",
      desc: "The output is a starting point, not a black box. Edit inline before downloading.",
    },
    {
      icon: <Library className="size-5" />,
      title: "Community-accelerated",
      desc: "Skip the blank page. Start from a community template tuned for your exact stack.",
    },
    {
      icon: <Workflow className="size-5" />,
      title: "Built for teams",
      desc: "One source of truth for your Claude Code setup. Every engineer on the same foundation from day one.",
    },
  ];

  return (
    <section className="border-t border-border py-24">
      <div className="px-6 md:px-12 lg:px-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">Why Chisel</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground">
            Claude Code is only as good as <em className="italic">its context</em>.
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Without a CLAUDE.md, Claude guesses. With one, it acts like it
            already merged three PRs in your repo.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-border bg-background p-6 transition-all duration-200 hover:border-accent/30 hover:-translate-y-0.5"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                {c.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Teaser ─────────────────────────────────────── */
function PricingTeaser() {
  const plans = [
    {
      name: "Solo",
      price: "$3",
      cadence: "/month",
      desc: "For individual developers.",
      features: [
        "5 repo scans / month",
        "Download generated CLAUDE.md",
        "7 skill generations / month",
        "Browse & download from registry",
      ],
      cta: "Get started",
      ctaHref: "/pricing",
      featured: false,
    },
    {
      name: "Pro",
      price: "$12",
      cadence: "/month",
      desc: "Full toolkit for power users.",
      features: [
        "25 repo scans / month",
        "15 skill generations / month",
        "Scripts, references & assets",
        "Publish to community registry",
      ],
      cta: "Get Pro",
      ctaHref: "/pricing",
      featured: true,
    },
    {
      name: "Team",
      price: "$49",
      cadence: "/month",
      desc: "For engineering teams.",
      features: [
        "Everything in Pro",
        "200 generations/month (shared)",
        "Team workspace — 3 seats",
        "Shared templates & skills",
      ],
      cta: "See team plans",
      ctaHref: "/pricing",
      featured: false,
    },
  ];

  return (
    <section className="border-t border-border py-24 bg-card/40">
      <div className="px-6 md:px-12 lg:px-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">Pricing</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground">
            Affordable and <em className="italic">adaptable</em>.
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Pick the plan that fits your workflow. Upgrade or cancel any time.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
                p.featured
                  ? "border-accent/40 bg-background ring-1 ring-accent/20"
                  : "border-border bg-background"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                  Recommended
                </span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-5xl text-foreground">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.cadence}</span>
              </div>
              <ul className="mt-5 mb-7 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.ctaHref}
                className={`mt-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  p.featured
                    ? "bg-foreground text-background hover:opacity-90"
                    : "border border-border bg-background text-foreground hover:bg-secondary"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            See full pricing comparison
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ──────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="border-t border-border py-24">
      <div className="px-6 md:px-12 lg:px-20 max-w-4xl mx-auto text-center">
        <h2 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground leading-[0.95]">
          Ready to supercharge <em className="italic">Claude Code</em>?
        </h2>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-lg mx-auto">
          Your first scan is free. No credit card. Takes 30 seconds.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            Start for free
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors inline-flex items-center gap-2"
          >
            View plans
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="px-6 md:px-12 lg:px-20 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight text-foreground">
              <span className="text-accent">✦</span> Chisel
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              The Claude Code config layer. © {new Date().getFullYear()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/sign-in" className="text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.74.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.19 1.18.93-.26 1.92-.39 2.91-.39.99 0 1.98.13 2.91.39 2.22-1.49 3.19-1.18 3.19-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.05.78 2.12v3.14c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
              aria-label="X"
            >
              <svg viewBox="0 0 24 24" className="size-3" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"/>
              </svg>
            </a>
            <a
              href="mailto:hello@chisel.dev"
              className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Dashboard Preview — matches real product dashboard ── */
function DashboardPreview() {
  return (
    <div className="rounded-xl overflow-hidden bg-background text-[11px] select-none pointer-events-none border border-border/60">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-background">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-accent text-white text-[10px] font-bold">
            C
          </div>
          <span className="font-semibold text-foreground">Chisel</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-2.5 py-1 w-64">
          <Search className="size-3 text-muted-foreground" />
          <span className="flex-1 text-muted-foreground">Search…</span>
          <span className="flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 text-[9px] text-muted-foreground">
            <Command className="size-2.5" /> K
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-full bg-foreground text-background px-3 py-1 text-[10px] font-medium flex items-center gap-1">
            <PackageCheck className="size-3" />
            Generate skill
          </button>
          <Bell className="size-3.5 text-muted-foreground" />
          <div className="flex size-6 items-center justify-center rounded-full bg-accent text-white text-[9px] font-bold">
            MK
          </div>
        </div>
      </div>

      {/* Page body — matches dashboard/page.tsx structure */}
      <div className="bg-card/40 p-3">
        {/* Header */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/5 px-1.5 py-0.5 text-[9px] font-medium text-accent capitalize">
              Solo
            </span>
            <h2 className="mt-1.5 font-display text-2xl tracking-tight text-foreground leading-none">
              Dashboard
            </h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">mohith@chisel.dev</p>
          </div>
          <button className="rounded-md bg-foreground text-background px-2.5 py-1 text-[10px] font-medium flex items-center gap-1">
            <PackageCheck className="size-3" />
            Generate skill
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <MockMetric icon={<FileArchive className="size-3" />} label="Generated" value="12" accent />
          <MockMetric icon={<Calendar className="size-3" />} label="Monthly use" value="24" />
          <MockMetric icon={<CreditCard className="size-3" />} label="Monthly gens" value="24" />
          <MockMetric icon={<Store className="size-3" />} label="Published" value="3" />
        </div>

        {/* Two-card grid */}
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_200px]">
          {/* Generation History */}
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-2">
              <h3 className="text-xs font-semibold text-foreground">Generation History</h3>
              <p className="text-[9px] text-muted-foreground">Generated skills, stored privately.</p>
            </div>
            <div className="rounded-md border border-border divide-y divide-border overflow-hidden">
              <MockSkillRow
                name="Next.js conventions"
                tags={["Scripts", "References"]}
                desc="Server components, App Router, edge runtime guardrails."
                date="Mar 20, 4:12 PM"
              />
              <MockSkillRow
                name="Testing with Vitest"
                tags={["Scripts"]}
                desc="Vitest setup with msw mocks and snapshot conventions."
                date="Mar 18, 10:33 AM"
              />
              <MockSkillRow
                name="Tailwind v4 setup"
                tags={["References", "Assets"]}
                desc="Tailwind v4 with CSS-first config and theme tokens."
                date="Mar 15, 2:05 PM"
              />
            </div>
          </div>

          {/* Marketplace Publishing */}
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-2">
              <h3 className="text-xs font-semibold text-foreground">Marketplace</h3>
              <p className="text-[9px] text-muted-foreground">Published skills & downloads.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <MockPublishedRow name="Next.js conventions" dl="142" />
              <MockPublishedRow name="Django patterns" dl="87" />
              <MockPublishedRow name="Go service" dl="34" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockMetric({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <div
        className={`flex size-5 items-center justify-center rounded-md ${
          accent ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <div className="mt-1.5 font-display text-base text-foreground leading-none">{value}</div>
      <div className="mt-0.5 text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}

function MockSkillRow({
  name,
  tags,
  desc,
  date,
}: {
  name: string;
  tags: string[];
  desc: string;
  date: string;
}) {
  return (
    <div className="px-2.5 py-2 bg-background">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-medium text-foreground truncate">{name}</span>
          {tags.map((t) => (
            <span
              key={t}
              className="rounded border border-border bg-secondary/40 px-1 py-0.5 text-[8px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        <button className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[9px] text-foreground flex items-center gap-0.5">
          <Download className="size-2.5" />
          Download
        </button>
      </div>
      <p className="mt-0.5 text-[9px] text-muted-foreground line-clamp-1">{desc}</p>
      <p className="mt-0.5 text-[9px] text-muted-foreground/60">{date}</p>
    </div>
  );
}

function MockPublishedRow({ name, dl }: { name: string; dl: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-foreground truncate">{name}</span>
        <span className="shrink-0 rounded-full bg-secondary px-1.5 text-[8px] text-muted-foreground">
          {dl} dl
        </span>
      </div>
    </div>
  );
}

/* ─── Auxiliary mockups for feature sections ─────────────── */
function ClaudemdCodeMockup() {
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 bg-secondary/40">
        <div className="flex gap-1">
          <div className="size-2.5 rounded-full bg-[#FF5F56]" />
          <div className="size-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="size-2.5 rounded-full bg-[#27C93F]" />
        </div>
        <span className="font-mono text-[10px] text-muted-foreground ml-2">CLAUDE.md</span>
        <span className="ml-auto rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] text-accent">
          Next.js
        </span>
      </div>
      <div className="p-4 font-mono text-[11px] leading-[1.7] text-foreground/80">
        <div className="text-accent font-semibold"># CLAUDE.md — generated by Chisel</div>
        <div className="h-2" />
        <div className="text-muted-foreground/60">## Stack</div>
        <div>- Next.js 15 (App Router)</div>
        <div>- TypeScript · strict mode</div>
        <div>- Tailwind CSS v4 · Prisma</div>
        <div className="h-2" />
        <div className="text-muted-foreground/60">## Dev commands</div>
        <div><span className="text-accent">pnpm dev</span><span className="text-muted-foreground/60"> — local :3000</span></div>
        <div><span className="text-accent">pnpm build</span><span className="text-muted-foreground/60"> — production build</span></div>
        <div><span className="text-accent">pnpm test</span><span className="text-muted-foreground/60"> — Jest + RTL</span></div>
        <div className="h-2" />
        <div className="text-muted-foreground/60">## Conventions</div>
        <div>- Server components by default</div>
        <div>- &apos;use client&apos; only for interactivity</div>
        <div>- API routes under /app/api/</div>
        <div className="h-2" />
        <div className="text-muted-foreground/60">## Never do</div>
        <div>- Skip TypeScript errors</div>
        <div>- Commit .env files</div>
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-1.5 bg-secondary/40 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Check className="size-3 text-emerald-500" />
          Generated in 4.1s
        </span>
        <span className="font-mono">847 tokens</span>
      </div>
    </div>
  );
}

function RegistryMockup() {
  const skills = [
    { name: "Next.js App Router", stack: "Next.js · TypeScript", installs: 312 },
    { name: "Django REST patterns", stack: "Python · Django", installs: 187 },
    { name: "Rails conventions", stack: "Ruby · Rails", installs: 143 },
    { name: "Go microservice", stack: "Go · Chi", installs: 98 },
    { name: "TypeScript strict", stack: "TypeScript", installs: 274 },
    { name: "Tailwind v4 setup", stack: "Tailwind · Vite", installs: 221 },
  ];

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Library className="size-3.5 text-accent" />
          Skill Registry
        </span>
        <span className="rounded-full bg-accent/10 text-accent text-[10px] font-medium px-2 py-0.5">
          248 skills
        </span>
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        {skills.map((s) => (
          <div
            key={s.name}
            className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2 text-xs"
          >
            <div>
              <p className="font-medium text-foreground">{s.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.stack}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/60">{s.installs} installs</span>
              <span className="rounded-full bg-foreground text-background px-2 py-0.5 text-[10px] font-medium">
                Install
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamMockup() {
  const members = [
    { name: "Mohith K.", role: "Owner", color: "bg-accent" },
    { name: "Sam R.", role: "Member", color: "bg-blue-500" },
    { name: "Jordan L.", role: "Member", color: "bg-purple-500" },
    { name: "Casey M.", role: "Member", color: "bg-emerald-500" },
  ];
  const shared = ["Next.js conventions", "TypeScript strict rules", "Testing with Vitest", "Deploy to Vercel"];

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Users className="size-3.5 text-accent" />
          Team Workspace
        </span>
        <span className="rounded-full bg-accent/10 text-accent text-[10px] font-medium px-2 py-0.5">
          4 members
        </span>
      </div>
      <div className="p-3 flex flex-col gap-3">
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">Members</p>
          <div className="flex flex-col gap-1.5">
            {members.map((m) => (
              <div key={m.name} className="flex items-center gap-2.5">
                <div className={`flex size-6 shrink-0 items-center justify-center rounded-full ${m.color} text-[10px] font-bold text-white`}>
                  {m.name[0]}
                </div>
                <span className="flex-1 text-xs font-medium text-foreground">{m.name}</span>
                <span className="text-[10px] text-muted-foreground">{m.role}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">Shared skills</p>
          <div className="flex flex-col gap-1">
            {shared.map((s) => (
              <div key={s} className="flex items-center gap-2 rounded-md bg-secondary/40 px-2 py-1.5 text-xs">
                <div className="size-1.5 rounded-full bg-accent" />
                <span className="text-foreground">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">Monthly usage</span>
            <span className="font-semibold text-foreground">142 / 200</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary">
            <div className="h-1.5 rounded-full bg-accent" style={{ width: "71%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
