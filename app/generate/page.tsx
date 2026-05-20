"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

import { DescriptionInput } from "@/components/generator/DescriptionInput";
import { DownloadButton } from "@/components/generator/DownloadButton";
import { OptionsPanel } from "@/components/generator/OptionsPanel";
import { PreviewPane } from "@/components/generator/PreviewPane";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/ui/site-nav";
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
    account?.signedIn && // TODO: re-add tier check before launch
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
    <main className="relative min-h-screen bg-background text-foreground">
      <SiteNav
        links={[{ label: "Pricing", href: "/pricing" }]}
        authLinks={[{ label: "Dashboard", href: "/dashboard" }]}
        cta={{ label: "Sign in", href: "/sign-in" }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="mb-10">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">
            <Sparkles className="inline size-3 mr-1" />
            Skill Generator
          </p>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight text-foreground leading-[0.95]">
            Build a Claude Code <em className="italic">skill</em>.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Describe a workflow in plain English. Chisel generates a ready-to-install{" "}
            <code className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs text-foreground/80">
              .skill
            </code>{" "}
            zip in seconds.
          </p>
        </div>

        {/* Not signed in */}
        {account && !account.signedIn && (
          <div className="mb-8 rounded-2xl border border-border bg-background p-6">
            <p className="text-sm font-semibold text-foreground">Sign in to generate skills</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Choose a plan to start generating Claude Code skills.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/pricing"
                className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity"
              >
                View plans
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}

        {/* TODO: re-enable subscription gate before launch */}

        {/* Main layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_480px]">
          {/* Left — form */}
          <form onSubmit={handleGenerate} className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Describe the skill
              </p>
              <DescriptionInput
                description={description}
                complexity={complexity}
                canUseFull={canUseAdvanced}
                onDescriptionChange={setDescription}
                onComplexityChange={setComplexity}
              />
            </div>

            <div className="rounded-2xl border border-border bg-background p-6">
              <OptionsPanel
                include={include}
                canUseAdvanced={canUseAdvanced}
                onChange={setInclude}
              />
            </div>

            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                disabled={!canGenerate}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
              </button>

              {account?.signedIn && account.effectiveTier !== "free" && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {account.remaining} remaining
                </Badge>
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
