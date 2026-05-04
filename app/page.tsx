"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hammer, Loader2, Sparkles } from "lucide-react";

import { DescriptionInput } from "@/components/generator/DescriptionInput";
import { downloadSkill } from "@/components/generator/DownloadButton";
import { OptionsPanel } from "@/components/generator/OptionsPanel";
import { PreviewPane } from "@/components/generator/PreviewPane";
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Hammer className="size-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-none">Chisel</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate installable Claude Code skills.
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" asChild>
              <Link href="/marketplace">Marketplace</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </nav>
        </header>

        <section className="grid flex-1 gap-6 py-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
          <div className="flex flex-col gap-4">
            <div>
              <Badge variant="outline" className="mb-3">
                Trial required
              </Badge>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-normal sm:text-4xl">
                Describe a workflow. Download a Claude Code skill.
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Chisel creates a valid `SKILL.md` and packages it as a `.skill`
                zip that you can install directly.
              </p>
            </div>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Skill Brief</CardTitle>
                <CardDescription>
                  Explain what the skill should help Claude Code do and when it
                  should be used.
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
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    Start a 7-day Creator trial to generate skills. Free
                    accounts cannot generate.
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button
                  type="button"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                >
                  {isGenerating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {isGenerating ? "Chiseling..." : "Chisel It"}
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
              Sign up to start a 7-day Creator trial and continue generating
              skills with scripts, references, and assets.
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
