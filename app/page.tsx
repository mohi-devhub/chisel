"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  Hammer,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

      const data = (await res.json()) as ScanResponse & { error?: string; message?: string };

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
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_16px_theme(colors.primary/40%)]">
              <Hammer className="size-4" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight">Chisel</span>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                Claude Code config layer
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button size="sm" className="ml-1" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </nav>
        </header>

        {/* Hero + Scanner */}
        <section className="py-10 sm:py-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Free for your first scan
          </div>
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
            Configure Claude Code for{" "}
            <span className="bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-transparent">
              any project in 60 seconds.
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Point Chisel at a GitHub repo and get a tailored{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground/80">
              CLAUDE.md
            </code>{" "}
            that makes Claude Code effective from the first message.
          </p>

          {/* URL input */}
          <form
            onSubmit={handleScan}
            className="mt-6 flex w-full max-w-2xl gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={scanning}
              />
            </div>
            <Button
              type="submit"
              disabled={!canScan}
              className="shadow-[0_0_20px_theme(colors.primary/25%)] hover:shadow-[0_0_28px_theme(colors.primary/40%)] transition-shadow"
            >
              {scanning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {scanning ? "Scanning…" : "Scan"}
            </Button>
          </form>

          {scanning && (
            <p className="mt-3 text-xs text-muted-foreground animate-pulse">
              Fetching repo structure and generating CLAUDE.md…
            </p>
          )}

          {error && (
            <div className="mt-3 max-w-2xl rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}
        </section>

        {/* Results */}
        {result && (
          <section className="grid gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* CLAUDE.md editor */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-sm font-medium text-foreground">CLAUDE.md</span>
                  {result.detected_stack.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="gap-1.5"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-green-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                    className="gap-1.5"
                  >
                    <Download className="size-3.5" />
                    Download
                  </Button>
                </div>
              </div>

              <textarea
                value={claudeMd}
                onChange={(e) => setClaudeMd(e.target.value)}
                className="w-full min-h-[560px] rounded-lg border border-border bg-card px-4 py-3 font-mono text-xs leading-relaxed text-foreground/90 resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                Editable — tweak before downloading. Drop it at the root of your repo.
              </p>
            </div>

            {/* Sidebar: recommended items */}
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-medium">Recommended for your stack</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Skills and templates from the registry
                </p>
              </div>

              {result.recommended_items.length === 0 ? (
                <div className="rounded-lg border border-border/60 bg-card/50 px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    No registry items yet for this stack.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-primary"
                    asChild
                  >
                    <Link href="/marketplace">Browse marketplace</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {result.recommended_items.map((item) => (
                    <Card
                      key={item.id}
                      className="rounded-xl border-border/60 bg-card/80 backdrop-blur-sm"
                    >
                      <CardHeader className="pb-2 pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm leading-snug">{item.name}</CardTitle>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {item.type}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs line-clamp-2">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="flex flex-wrap gap-1">
                          {(item.stack ?? []).slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Scan again */}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-muted-foreground"
                onClick={() => {
                  setResult(null);
                  setClaudeMd("");
                  setUrl("");
                }}
              >
                Scan another repo
              </Button>
            </div>
          </section>
        )}

        {/* Empty state hint */}
        {!result && !scanning && (
          <section className="pb-12">
            <p className="text-xs text-muted-foreground">
              Try{" "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => setUrl("https://github.com/vercel/next.js")}
              >
                github.com/vercel/next.js
              </button>
              {" · "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => setUrl("https://github.com/tiangolo/fastapi")}
              >
                github.com/tiangolo/fastapi
              </button>
              {" · "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => setUrl("https://github.com/rails/rails")}
              >
                github.com/rails/rails
              </button>
            </p>
          </section>
        )}
      </div>

      {/* Sign-up gate */}
      <Dialog open={showGate} onOpenChange={setShowGate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Free scan used</DialogTitle>
            <DialogDescription>
              You&apos;ve used your free scan. Sign up for a 14-day trial to scan unlimited
              repositories and access recommended skills.
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
