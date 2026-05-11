"use client";

import { DownloadButton } from "@/components/generator/DownloadButton";
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
    <div className={[
      "flex flex-col rounded-xl border overflow-hidden transition-all duration-300",
      generated
        ? "border-primary/30 shadow-[0_0_24px_theme(colors.primary/10%)]"
        : "border-border/60",
    ].join(" ")}>
      {/* Terminal title bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-red-500/70" />
            <span className="size-3 rounded-full bg-yellow-500/70" />
            <span className="size-3 rounded-full bg-green-500/70" />
          </div>
          <span className="font-mono text-xs text-muted-foreground">SKILL.md</span>
        </div>
        <div className="flex items-center gap-3">
          {generated ? null : (
            <span className="text-xs text-muted-foreground/60">Preview</span>
          )}
          {generated ? (
            <DownloadButton generated={generated} variant="outline" size="sm" />
          ) : null}
        </div>
      </div>

      {/* Code content */}
      <div className="flex min-h-[520px] flex-1 flex-col bg-background/60">
        <pre className="h-full flex-1 overflow-auto p-5 font-mono text-xs leading-6 text-foreground/80">
          <code>{preview}</code>
        </pre>
        {generated ? (
          <div className="border-t border-border/40 px-4 py-2.5 font-mono text-xs text-muted-foreground/60">
            {generated.remaining} generations remaining
          </div>
        ) : null}
      </div>
    </div>
  );
}
