"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Hammer,
  Library,
  Loader2,
  Search,
  Sparkles,
  Users,
  Zap,
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

      const data = (await res.json()) as ScanResponse & {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        if (data.error === "quota_exceeded") {
          setShowGate(true);
        }
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
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 h-[700px] w-[1000px] rounded-full bg-primary/6 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        {/* Nav */}
        <header className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_16px_theme(colors.primary/50%)]">
              <Hammer className="size-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Chisel</span>
          </div>
          <nav className="hidden items-center gap-0.5 sm:flex">
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
              <Link href="/pricing">Pricing</Link>
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

        {/* Hero */}
        <section className="flex flex-col items-center pt-16 pb-14 text-center sm:pt-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Free scan included — no sign-up required
          </div>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
            The fastest way to configure{" "}
            <span className="bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">
              Claude Code
            </span>{" "}
            for any repo.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            Paste a GitHub URL. Chisel scans the codebase, detects your stack,
            and generates a precise{" "}
            <code className="rounded-md border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-foreground/80">
              CLAUDE.md
            </code>{" "}
            — so Claude Code works the way you expect from message one.
          </p>

          {/* Scanner */}
          <form
            onSubmit={handleScan}
            className="mt-8 w-full max-w-2xl"
          >
            <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/60 p-1.5 shadow-[0_0_0_1px_oklch(0.22_0_0),0_8px_32px_oklch(0_0_0_/0.4)] backdrop-blur-sm transition-shadow focus-within:shadow-[0_0_0_1px_theme(colors.primary/50%),0_8px_32px_oklch(0_0_0_/0.4)]">
              <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="flex-1 bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground/70 focus:outline-none"
                disabled={scanning}
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                type="submit"
                disabled={!canScan}
                className="shrink-0 shadow-[0_0_16px_theme(colors.primary/30%)] hover:shadow-[0_0_24px_theme(colors.primary/50%)] transition-shadow"
              >
                {scanning ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {scanning ? "Scanning…" : "Scan repo"}
              </Button>
            </div>
          </form>

          {/* Example repos */}
          {!result && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="opacity-60">Try:</span>
              {[
                { label: "vercel/next.js", url: "https://github.com/vercel/next.js" },
                { label: "tiangolo/fastapi", url: "https://github.com/tiangolo/fastapi" },
                { label: "rails/rails", url: "https://github.com/rails/rails" },
              ].map(({ label, url: repoUrl }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setUrl(repoUrl)}
                  className="rounded-md border border-border/50 bg-muted/30 px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/60 hover:text-foreground"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {scanning && (
            <p className="mt-4 text-xs text-muted-foreground animate-pulse">
              Analyzing repository structure and generating CLAUDE.md…
            </p>
          )}

          {error && (
            <div className="mt-4 w-full max-w-2xl rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </section>

        {/* Results */}
        {result && (
          <section className="grid gap-6 pb-16 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* CLAUDE.md editor */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">CLAUDE.md</span>
                  {result.detected_stack.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? (
                      <Check className="size-3.5 text-green-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
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
                className="w-full min-h-[520px] rounded-xl border border-border/60 bg-card/80 px-4 py-3 font-mono text-xs leading-relaxed text-foreground/90 resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
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
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Skills and templates from the registry
                </p>
              </div>

              {result.recommended_items.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-card/40 px-4 py-8 text-center">
                  <p className="text-xs text-muted-foreground">
                    No registry items yet for this stack.
                  </p>
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
                        <Badge variant="outline" className="shrink-0 text-xs capitalize">
                          {item.type}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                      {(item.stack ?? []).length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {(item.stack ?? []).slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
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
                onClick={() => {
                  setResult(null);
                  setClaudeMd("");
                  setUrl("");
                }}
              >
                ← Scan another repo
              </button>
            </div>
          </section>
        )}

        {/* Features section — shown only when no results */}
        {!result && !scanning && (
          <section className="pb-16 pt-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <FeatureCard
                icon={<Sparkles className="size-4" />}
                title="Instant CLAUDE.md"
                description="AI scans your repo structure, detects frameworks, and writes a precise config that makes Claude Code effective immediately."
              />
              <FeatureCard
                icon={<Library className="size-4" />}
                title="Skill Registry"
                description="Browse community-built CLAUDE.md templates and skills. Download or publish your own to share with other developers."
                href="/registry"
              />
              <FeatureCard
                icon={<Users className="size-4" />}
                title="Team Workspace"
                description="Share configs and skills privately with your team. Keep your Claude Code setup consistent across every engineer."
                href="/pricing"
              />
            </div>

            <div className="mt-8 flex items-center justify-center">
              <Link
                href="/registry"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Browse the registry
                <ArrowRight className="size-3.5" />
              </Link>
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
              You&apos;ve used your free scan. Sign up for a 14-day trial to scan
              unlimited repositories and access recommended skills.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGate(false)}>
              Close
            </Button>
            <Button asChild>
              <Link href="/sign-up">Start free trial</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
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
  const content = (
    <div className="group flex flex-col gap-3 rounded-xl border border-border/50 bg-card/40 p-5 transition-all hover:border-border/80 hover:bg-card/70">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          {href && (
            <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
