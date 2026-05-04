"use client";

import { DownloadButton } from "@/components/generator/DownloadButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GenerateResponse } from "@/types";

interface PreviewPaneProps {
  generated: GenerateResponse | null;
}

const emptyPreview = `---
name: your-skill-name
description: Use this skill when...
---

Your generated Claude Code skill preview will appear here after Chisel builds it.`;

export function PreviewPane({ generated }: PreviewPaneProps) {
  const preview = generated?.skill_md ?? emptyPreview;

  return (
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
            <DownloadButton generated={generated} variant="outline" size="sm" />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex min-h-[520px] flex-col p-0">
        <pre className="h-full flex-1 overflow-auto p-4 text-sm leading-6">
          <code>{preview}</code>
        </pre>
        {generated ? (
          <div className="border-t px-4 py-3 text-sm text-muted-foreground">
            {generated.remaining} generations remaining.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
