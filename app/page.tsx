"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Library,
  Loader2,
  Search,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SiteNav } from "@/components/ui/site-nav";
import type { ScanResponse } from "@/types";

export default function Home() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [claudeMd, setClaudeMd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showGate, setShowGate] = useState(false);
  const [copied, setCopied] = useState(false);

  const canScan = url.trim().length > 0 && !scanning;

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setScanning(true);
    setError(null);
    setResult(null);
    setClaudeMd("");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_url: url.trim() }),
      });
      const data = (await res.json()) as ScanResponse & { error?: string; message?: string };
      if (!res.ok) {
        if (data.error === "quota_exceeded") setShowGate(true);
        throw new Error(data.message ?? "Scan failed");
      }
      setResult(data);
      setClaudeMd(data.claude_md);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(claudeMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([claudeMd], { type: "text/plain" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "CLAUDE.md";
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      {/* Radial fade — keeps grid from being too loud in the center */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.07 0 0 / 0) 0%, oklch(0.07 0 0 / 0.6) 100%)",
        }}
      />
      {/* Primary glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% -10%, oklch(0.78 0.17 65 / 0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <SiteNav
          links={[
            { label: "Registry", href: "/registry" },
            { label: "Pricing", href: "/pricing" },
          ]}
          authLinks={[{ label: "Dashboard", href: "/dashboard" }]}
          cta={{ label: "Sign in", href: "/sign-in" }}
        />

        {/* ---- HERO ---- */}
        {!result && (
          <section className="grid min-h-[calc(100vh-80px)] items-center gap-8 pb-16 pt-8 lg:grid-cols-[1fr_480px] lg:gap-16">
            {/* Left column */}
            <div className="flex flex-col">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-3.5 py-1.5 text-xs font-medium text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Free scan — no sign-up required
              </div>

              <h1 className="text-5xl font-black tracking-tight leading-[1.05] sm:text-6xl lg:text-7xl">
                Make Claude Code{" "}
                <span className="bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-transparent">
                  actually
                </span>{" "}
                understand your repo.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
                Paste a GitHub URL. Chisel scans your codebase, detects the stack,
                and generates a precise{" "}
                <code className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-foreground/80">
                  CLAUDE.md
                </code>{" "}
                — so Claude Code works the way you expect from message one.
              </p>

              {/* Scanner */}
              <form onSubmit={handleScan} className="mt-8">
                <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 p-1.5 shadow-[0_0_0_1px_oklch(0.19_0_0),0_16px_48px_oklch(0_0_0_/0.5)] backdrop-blur-sm transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_1px_theme(colors.primary/40%),0_16px_48px_oklch(0_0_0_/0.5)]">
                  <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="flex-1 bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                    disabled={scanning}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Button
                    type="submit"
                    disabled={!canScan}
                    className="shrink-0 px-5 py-2 text-sm font-semibold shadow-[0_0_20px_theme(colors.primary/35%)] hover:shadow-[0_0_32px_theme(colors.primary/60%)] transition-shadow"
                  >
                    {scanning ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {scanning ? "Scanning…" : "Scan repo"}
                  </Button>
                </div>
              </form>

              {scanning && (
                <p className="mt-3 text-xs text-muted-foreground animate-pulse">
                  Analyzing repository structure and generating CLAUDE.md…
                </p>
              )}

              {error && (
                <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Example repos */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground/60">Try:</span>
                {[
                  { label: "vercel/next.js", url: "https://github.com/vercel/next.js" },
                  { label: "tiangolo/fastapi", url: "https://github.com/tiangolo/fastapi" },
                  { label: "rails/rails", url: "https://github.com/rails/rails" },
                ].map(({ label, url: repoUrl }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setUrl(repoUrl)}
                    className="rounded-lg border border-border/40 bg-muted/20 px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-border/80 hover:bg-muted/50 hover:text-foreground"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Secondary CTA */}
              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/registry"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/20 px-4 py-2 text-sm text-muted-foreground transition-all hover:border-border hover:bg-muted/40 hover:text-foreground"
                >
                  <Library className="size-4" />
                  Browse registry
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  View plans
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Right column — product mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <ClaudemdMockup />
            </div>
          </section>
        )}

        {/* ---- RESULTS ---- */}
        {result && (
          <section className="grid gap-6 pb-16 pt-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Editor */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">CLAUDE.md</span>
                  {result.detected_stack.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="size-3.5" />
                    Download
                  </Button>
                </div>
              </div>
              <textarea
                value={claudeMd}
                onChange={(e) => setClaudeMd(e.target.value)}
                className="w-full min-h-[520px] rounded-xl border border-border/60 bg-card/80 px-4 py-3 font-mono text-xs leading-relaxed text-foreground/90 resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                Editable — tweak before downloading. Place it at the root of your repo.
              </p>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold">Recommended for your stack</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">From the registry</p>
              </div>

              {result.recommended_items.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card/40 px-4 py-8 text-center">
                  <p className="text-xs text-muted-foreground">No registry items yet for this stack.</p>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" asChild>
                    <Link href="/registry">Browse registry</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {result.recommended_items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border/50 bg-card/80 p-4 transition-colors hover:bg-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-snug">{item.name}</span>
                        <Badge variant="outline" className="shrink-0 text-xs capitalize">{item.type}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                      {(item.stack ?? []).length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {(item.stack ?? []).slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="mt-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground text-left"
                onClick={() => { setResult(null); setClaudeMd(""); setUrl(""); }}
              >
                ← Scan another repo
              </button>
            </div>
          </section>
        )}

        {/* ---- FEATURES (below hero) ---- */}
        {!result && (
          <section className="border-t border-border/40 py-16">
            <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
              Everything you need to configure Claude Code
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <FeatureCard
                icon={<Sparkles className="size-5" />}
                title="Repo Scanner"
                description="AI analyzes your file structure, detects frameworks, reads configs. Generates a precise CLAUDE.md in under 30 seconds."
              />
              <FeatureCard
                icon={<Library className="size-5" />}
                title="Skill Registry"
                description="Browse and install community-built CLAUDE.md templates and skills. Publish your own to help other developers."
                href="/registry"
              />
              <FeatureCard
                icon={<Users className="size-5" />}
                title="Team Workspace"
                description="Share configs and skills with your team privately. Keep your Claude Code setup consistent across every engineer."
                href="/pricing"
              />
            </div>
          </section>
        )}
      </div>

      {/* Sign-up gate */}
      <Dialog open={showGate} onOpenChange={setShowGate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Free scan used</DialogTitle>
            <DialogDescription>
              Sign up for a 14-day trial to scan unlimited repositories and access recommended skills.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGate(false)}>Close</Button>
            <Button asChild><Link href="/sign-up">Start free trial</Link></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/* ---- Static CLAUDE.md mockup shown in hero ---- */
function ClaudemdMockup() {
  return (
    <div className="relative w-full">
      {/* Subtle glow behind the card */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/5 blur-2xl scale-110" />

      <div className="rounded-2xl border border-border/60 bg-card/95 shadow-[0_40px_80px_-16px_oklch(0_0_0/0.8)] overflow-hidden backdrop-blur-xl">
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-[#FF5F56]" />
            <div className="size-3 rounded-full bg-[#FFBD2E]" />
            <div className="size-3 rounded-full bg-[#27C93F]" />
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/30 px-2.5 py-1">
            <Terminal className="size-3 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">CLAUDE.md</span>
          </div>
          <div className="ml-auto flex gap-1.5">
            <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
              Next.js
            </span>
            <span className="rounded border border-border/40 bg-muted/30 px-2 py-0.5 font-mono text-xs text-muted-foreground">
              TypeScript
            </span>
          </div>
        </div>

        {/* Code content */}
        <div className="p-5 font-mono text-xs leading-[1.8]">
          <Line comment="# CLAUDE.md — generated by Chisel" />
          <div className="h-3" />
          <Line dim="## Stack" />
          <Line text="- Next.js 15 (App Router)" />
          <Line text="- TypeScript · strict mode" />
          <Line text="- Tailwind CSS v4 · Prisma" />
          <div className="h-3" />
          <Line dim="## Dev commands" />
          <Line accent="pnpm dev" suffix=" — local :3000" />
          <Line accent="pnpm build" suffix=" — production build" />
          <Line accent="pnpm test" suffix=" — Jest + RTL" />
          <div className="h-3" />
          <Line dim="## Conventions" />
          <Line text="- Server components by default" />
          <Line text="- 'use client' only for interactivity" />
          <Line text="- API routes under /app/api/" />
          <div className="h-3" />
          <Line dim="## Never do" />
          <Line text="- Skip TypeScript errors" />
          <Line text="- Commit .env files" />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Generated in 4.1s</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">847 tokens</span>
        </div>
      </div>

      {/* Floating badge — stack detected */}
      <div className="absolute -right-5 -top-5 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-full bg-green-500/15">
            <Check className="size-3 text-green-400" />
          </div>
          <div>
            <p className="text-xs font-semibold">Stack detected</p>
            <p className="text-xs text-muted-foreground">6 technologies</p>
          </div>
        </div>
      </div>

      {/* Floating badge — ready to use */}
      <div className="absolute -bottom-5 -left-5 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary/15">
            <Sparkles className="size-3 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">Ready to use</p>
            <p className="text-xs text-muted-foreground">Drop it in your repo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({
  comment,
  dim,
  text,
  accent,
  suffix,
}: {
  comment?: string;
  dim?: string;
  text?: string;
  accent?: string;
  suffix?: string;
}) {
  if (comment) return <div className="text-primary font-bold">{comment}</div>;
  if (dim) return <div className="mt-1 text-muted-foreground/50">{dim}</div>;
  if (accent)
    return (
      <div>
        <span className="text-primary/90">{accent}</span>
        {suffix && <span className="text-muted-foreground/50">{suffix}</span>}
      </div>
    );
  return <div className="text-foreground/70">{text}</div>;
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
}) {
  const inner = (
    <div className="group flex flex-col gap-4 rounded-xl border border-border/40 bg-card/40 p-6 transition-all duration-200 hover:border-border/80 hover:bg-card/70">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          {href && (
            <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
