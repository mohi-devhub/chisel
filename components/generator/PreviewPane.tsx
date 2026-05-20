"use client";

import { useState } from "react";
import { DownloadButton } from "@/components/generator/DownloadButton";
import type { GenerateResponse } from "@/types";

interface PreviewPaneProps {
  generated: GenerateResponse | null;
}

interface FileEntry {
  path: string;
  content: string;
}

const emptyPreview = `---
name: your-skill-name
description: Use this skill when...
---

Your generated Claude Code skill preview will appear here after Chisel builds it.`;

function buildFileTree(generated: GenerateResponse): FileEntry[] {
  const files: FileEntry[] = [{ path: "SKILL.md", content: generated.skill_md }];
  for (const f of generated.scripts) files.push({ path: `scripts/${f.filename}`, content: f.content });
  for (const f of generated.references) files.push({ path: `references/${f.filename}`, content: f.content });
  for (const f of generated.assets) files.push({ path: `assets/${f.filename}`, content: f.content });
  return files;
}

export function PreviewPane({ generated }: PreviewPaneProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const files = generated ? buildFileTree(generated) : null;
  const activeFile = files?.[activeIndex] ?? null;
  const preview = activeFile?.content ?? emptyPreview;

  // Reset to first tab when a new skill is generated
  const fileCount = files?.length ?? 0;

  return (
    <div className={[
      "flex flex-col rounded-2xl border overflow-hidden transition-all duration-300",
      generated ? "border-border" : "border-border/60",
    ].join(" ")}>
      {/* Terminal title bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-red-500/70" />
            <span className="size-3 rounded-full bg-yellow-500/70" />
            <span className="size-3 rounded-full bg-green-500/70" />
          </div>
          {generated && (
            <span className="font-mono text-xs text-muted-foreground">
              {generated.name}/
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!generated && <span className="text-xs text-muted-foreground/60">Preview</span>}
          {generated && <DownloadButton generated={generated} variant="outline" size="sm" />}
        </div>
      </div>

      {/* File tabs */}
      {files && files.length > 1 && (
        <div className="flex overflow-x-auto border-b border-border/60 bg-muted/10 scrollbar-hide">
          {files.map((file, i) => (
            <button
              key={file.path}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={[
                "shrink-0 border-r border-border/40 px-3 py-2 font-mono text-xs transition-colors whitespace-nowrap",
                activeIndex === i
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
              ].join(" ")}
            >
              {file.path}
            </button>
          ))}
        </div>
      )}

      {/* Single-file label when no extra folders */}
      {files && files.length === 1 && (
        <div className="border-b border-border/60 bg-muted/10 px-4 py-2">
          <span className="font-mono text-xs text-muted-foreground">SKILL.md</span>
        </div>
      )}

      {/* Code content */}
      <div className="flex min-h-[480px] flex-1 flex-col bg-background">
        <pre className="h-full flex-1 overflow-auto p-5 font-mono text-xs leading-6 text-foreground/80">
          <code>{preview}</code>
        </pre>
        {generated && (
          <div className="border-t border-border/40 px-4 py-2.5 font-mono text-xs text-muted-foreground/60 flex items-center justify-between">
            <span>{fileCount} file{fileCount !== 1 ? "s" : ""} generated</span>
            <span>{generated.remaining} generations remaining</span>
          </div>
        )}
      </div>
    </div>
  );
}
