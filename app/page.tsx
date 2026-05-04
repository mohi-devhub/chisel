"use client";

import { useState } from "react";
import Link from "next/link";
import { Hammer, Loader2, Lock, Sparkles } from "lucide-react";

import { DescriptionInput } from "@/components/generator/DescriptionInput";
import { downloadSkill } from "@/components/generator/DownloadButton";
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
import type { GenerateRequest, GenerateResponse } from "@/types";

type Complexity = GenerateRequest["complexity"];

export default function Home() {
  const [description, setDescription] = useState("");
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [generated, setGenerated] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const canGenerate = description.trim().length >= 10 && !isGenerating;

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
          include: {
            scripts: false,
            references: false,
            assets: false,
          },
        } satisfies GenerateRequest),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.message ?? payload.details ?? "Could not generate skill."
        );
      }

      setGenerated(payload as GenerateResponse);
      downloadSkill(payload as GenerateResponse);
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
          </nav>
        </header>

        <section className="grid flex-1 gap-6 py-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
          <div className="flex flex-col gap-4">
            <div>
              <Badge variant="outline" className="mb-3">
                3 anonymous generations
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

                <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-3">
                  {["scripts", "references", "assets"].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-muted-foreground"
                    >
                      <span>{item}/</span>
                      <Lock className="size-3.5" />
                    </div>
                  ))}
                </div>

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
    </main>
  );
}
