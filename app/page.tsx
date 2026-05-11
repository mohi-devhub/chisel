"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hammer, Loader2, Sparkles } from "lucide-react";

import { DescriptionInput } from "@/components/generator/DescriptionInput";
import { downloadSkill } from "@/components/generator/DownloadButton";
import { OptionsPanel } from "@/components/generator/OptionsPanel";
import { PreviewPane } from "@/components/generator/PreviewPane";
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
import type { AccountStatus, GenerateRequest, GenerateResponse } from "@/types";

type Complexity = GenerateRequest["complexity"];

export default function Home() {
  const [description, setDescription] = useState("");
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [include, setInclude] = useState<GenerateRequest["include"]>({
    scripts: false,
    references: false,
    assets: false,
  });
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const [generated, setGenerated] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const canGenerate = description.trim().length >= 10 && !isGenerating;
  const requiresTrial = account?.effectiveTier === "free";

  useEffect(() => {
    let ignore = false;

    refreshAccount().then((payload) => {
      if (!ignore && payload) {
        setAccount(payload);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  async function handleGenerate() {
    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          description,
          complexity,
          include,
        } satisfies GenerateRequest),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (
          payload.error === "auth_required" ||
          payload.error === "quota_exceeded"
        ) {
          setShowUpgradePrompt(true);
        }

        throw new Error(
          payload.message ?? payload.details ?? "Could not generate skill."
        );
      }

      setGenerated(payload as GenerateResponse);
      downloadSkill(payload as GenerateResponse);
      const nextAccount = await refreshAccount();
      if (nextAccount) {
        setAccount(nextAccount);
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not generate skill."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Ambient background glow */}
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
                Claude Code skill generator
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/marketplace">Marketplace</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button size="sm" className="ml-1" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </nav>
        </header>

        {/* Main content */}
        <section className="grid flex-1 gap-6 py-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
          <div className="flex flex-col gap-6">
            {/* Hero */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                {requiresTrial ? "Trial required to generate" : "Ready to generate"}
              </div>
              <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
                Describe a workflow.{" "}
                <span className="bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-transparent">
                  Download a skill.
                </span>
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                Chisel builds a valid{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground/80">
                  SKILL.md
                </code>{" "}
                and packages it as a{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground/80">
                  .skill
                </code>{" "}
                zip you can install directly in Claude Code.
              </p>
            </div>

            {/* Generator card */}
            <Card className="rounded-xl border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Skill Brief</CardTitle>
                <CardDescription className="text-sm">
                  Explain what the skill should help Claude Code do and when it should be used.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DescriptionInput
                  description={description}
                  complexity={complexity}
                  onDescriptionChange={setDescription}
                  onComplexityChange={setComplexity}
                />

                <OptionsPanel
                  include={include}
                  canUseAdvanced={Boolean(account?.canUseAdvanced)}
                  onChange={setInclude}
                />

                {requiresTrial ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-primary/80">
                    Start a 7-day Creator trial to generate skills. Free accounts cannot generate.
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button
                  type="button"
                  size="lg"
                  className="w-full sm:w-auto shadow-[0_0_20px_theme(colors.primary/25%)] hover:shadow-[0_0_28px_theme(colors.primary/40%)] transition-shadow"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                >
                  {isGenerating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {isGenerating ? "Chiseling…" : "Chisel It"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <PreviewPane generated={generated} />
        </section>
      </div>

      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generation limit reached</DialogTitle>
            <DialogDescription>
              Sign up to start a 7-day Creator trial and continue generating skills with scripts, references, and assets.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradePrompt(false)}>
              Close
            </Button>
            <Button asChild>
              <Link href="/sign-up">Start trial</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

async function refreshAccount() {
  const response = await fetch("/api/me", { cache: "no-store" });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AccountStatus;
}
