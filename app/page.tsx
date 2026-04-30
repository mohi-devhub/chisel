"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Hammer, Loader2, Lock, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { GenerateRequest } from "@/types";

type Complexity = GenerateRequest["complexity"];

interface GenerateResponse {
  name: string;
  skill_md: string;
  zip_base64: string;
  filename: string;
  remaining: number;
}

const complexityOptions: Array<{
  value: Complexity;
  label: string;
  description: string;
}> = [
  {
    value: "simple",
    label: "Simple",
    description: "Short instructions for a narrow workflow.",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced instructions with practical examples.",
  },
  {
    value: "full",
    label: "Full",
    description: "More complete guidance for broad workflows.",
  },
];

export default function Home() {
  const [description, setDescription] = useState("");
  const [complexity, setComplexity] = useState<Complexity>("standard");
  const [generated, setGenerated] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const characterCount = description.length;
  const canGenerate = description.trim().length >= 10 && !isGenerating;

  const preview = useMemo(() => {
    if (generated?.skill_md) {
      return generated.skill_md;
    }

    return `---
name: your-skill-name
description: Use this skill when...
---

Your generated Claude Code skill preview will appear here after Chisel builds it.`;
  }, [generated]);

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
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Example: A skill that helps review PostgreSQL migrations for locking risks, unsafe defaults, and rollback issues."
                  className="min-h-44 resize-none text-sm leading-6"
                  maxLength={4000}
                />

                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{characterCount}/4000 characters</span>
                  <span>Minimum 10 characters</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {complexityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setComplexity(option.value)}
                      className={[
                        "rounded-md border p-3 text-left transition-colors",
                        complexity === option.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background hover:bg-accent",
                      ].join(" ")}
                    >
                      <span className="block text-sm font-medium">
                        {option.label}
                      </span>
                      <span
                        className={[
                          "mt-1 block text-xs leading-5",
                          complexity === option.value
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>

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

          <Card className="rounded-lg">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>SKILL.md Preview</CardTitle>
                  <CardDescription>
                    Anonymous downloads include the generated `SKILL.md`.
                  </CardDescription>
                </div>
                {generated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => downloadSkill(generated)}
                  >
                    <Download className="size-4" />
                    Download
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="flex min-h-[520px] flex-col p-0">
              <pre className="h-full flex-1 overflow-auto p-4 text-sm leading-6">
                <code>{preview}</code>
              </pre>
              {generated ? (
                <div className="border-t px-4 py-3 text-sm text-muted-foreground">
                  {generated.remaining} anonymous generations remaining.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function downloadSkill(response: GenerateResponse) {
  const bytes = Uint8Array.from(atob(response.zip_base64), (char) =>
    char.charCodeAt(0)
  );
  const blob = new Blob([bytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = response.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
