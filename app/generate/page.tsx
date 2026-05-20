"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hammer, Loader2, Sparkles } from "lucide-react";

import { DescriptionInput } from "@/components/generator/DescriptionInput";
import { DownloadButton } from "@/components/generator/DownloadButton";
import { OptionsPanel } from "@/components/generator/OptionsPanel";
import { PreviewPane } from "@/components/generator/PreviewPane";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AccountStatus, GenerateRequest, GenerateResponse } from "@/types";

const DEFAULT_INCLUDE: GenerateRequest["include"] = {
  scripts: false,
  references: false,
  assets: false,
};

export default function GeneratePage() {
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [description, setDescription] = useState("");
  const [complexity, setComplexity] = useState<GenerateRequest["complexity"]>("standard");
  const [include, setInclude] = useState(DEFAULT_INCLUDE);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json() as Promise<AccountStatus>)
      .then(setAccount)
      .catch(() => {
        setAccount({ signedIn: false, tier: "free", effectiveTier: "free", remaining: 0, canUseAdvanced: false });
      });
  }, []);

  const canGenerate =
    account?.signedIn &&
    account.effectiveTier !== "free" &&
    description.trim().length >= 10 &&
    !generating;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canGenerate) return;

    setGenerating(true);
    setError(null);
    setGenerated(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ description: description.trim(), complexity, include }),
      });
      const data = (await res.json()) as GenerateResponse & { error?: string; message?: string; details?: string };

      if (!res.ok) {
        throw new Error(data.message ?? data.details ?? "Generation failed");
      }

      setGenerated(data);
      setAccount((prev) =>
        prev ? { ...prev, remaining: data.remaining } : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const canUseAdvanced = account?.canUseAdvanced ?? false;

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 right-0 h-[500px] w-[700px] rounded-full bg-primary/4 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        {/* Nav */}
        <header className="flex items-center justify-between pb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_16px_theme(colors.primary/50%)]">
              <Hammer className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Chisel</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {[
              { label: "Pricing", href: "/pricing" },
              { label: "Dashboard", href: "/dashboard" },
            ].map(({ label, href }) => (
              <Button
                key={label}
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </nav>
        </header>

        {/* Page heading */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-3.5 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3" />
            Skill Generator
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Build a Claude Code skill
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Describe a workflow in plain English. Chisel generates a ready-to-install{" "}
            <code className="rounded border border-border/60 bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground/80">
              .skill
            </code>{" "}
            zip in seconds.
          </p>
        </div>

        {/* Auth gate */}
        {account && !account.signedIn && (
          <div className="mb-6 rounded-xl border border-border/60 bg-card/50 px-5 py-4">
            <p className="text-sm font-medium">Sign up to generate skills</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a free account to start a 14-day trial with 30 generations included.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="h-8 text-xs" asChild>
                <Link href="/sign-up">Start free trial</Link>
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Quota exceeded gate */}
        {account?.signedIn && account.effectiveTier === "free" && (
          <div className="mb-6 rounded-xl border border-border/60 bg-card/50 px-5 py-4">
            <p className="text-sm font-medium">Trial or subscription required</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Skill generation requires a Solo or Team plan. Start a 14-day trial — no credit card needed.
            </p>
            <Button size="sm" className="mt-3 h-8 text-xs" asChild>
              <Link href="/pricing">See plans</Link>
            </Button>
          </div>
        )}

        {/* Main layout */}
        <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_480px]">
          {/* Left — form */}
          <form onSubmit={handleGenerate} className="flex flex-col gap-5">
            <div className="rounded-xl border border-border/50 bg-card/40 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Describe the skill
              </p>
              <DescriptionInput
                description={description}
                complexity={complexity}
                onDescriptionChange={setDescription}
                onComplexityChange={setComplexity}
              />
            </div>

            <div className="rounded-xl border border-border/50 bg-card/40 p-5">
              <OptionsPanel
                include={include}
                canUseAdvanced={canUseAdvanced}
                onChange={setInclude}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-4">
              <Button
                type="submit"
                disabled={!canGenerate}
                className="gap-2 shadow-[0_0_20px_theme(colors.primary/20%)] hover:shadow-[0_0_28px_theme(colors.primary/35%)] transition-shadow disabled:opacity-40"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate skill
                  </>
                )}
              </Button>

              {account?.signedIn && account.effectiveTier !== "free" && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {account.remaining} remaining
                  </Badge>
                </div>
              )}

              {generated && (
                <DownloadButton generated={generated} variant="outline" size="sm" />
              )}
            </div>
          </form>

          {/* Right — preview */}
          <div className="flex flex-col">
            <PreviewPane generated={generated} />
          </div>
        </div>
      </div>
    </main>
  );
}
