"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Download,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ScanResponse } from "@/types";

export function RepoScanner() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [claudeMd, setClaudeMd] = useState("");
  const [error, setError] = useState<string | null>(null);
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
      const data = (await res.json()) as ScanResponse & {
        error?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Scan failed");
      setResult(data);
      setClaudeMd(data.claude_md);
      // Refresh server components so the dashboard reflects the new scan + counter
      router.refresh();
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

  function handleReset() {
    setResult(null);
    setClaudeMd("");
    setUrl("");
    setError(null);
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Scan a repository</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste any GitHub URL — we&apos;ll generate a precise CLAUDE.md for it.
          </p>
        </div>
        {result && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
            <X className="size-3.5" />
            Scan another
          </Button>
        )}
      </div>

      {!result && (
        <form onSubmit={handleScan} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5 transition-all focus-within:border-foreground/30">
            <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
              disabled={scanning}
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              type="submit"
              disabled={!canScan}
              className="shrink-0 rounded-lg px-5 py-2 text-sm font-semibold"
            >
              {scanning ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {scanning ? "Scanning…" : "Scan repo"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground/60">Try:</span>
            {[
              { label: "vercel/next.js", url: "https://github.com/vercel/next.js" },
              { label: "tiangolo/fastapi", url: "https://github.com/tiangolo/fastapi" },
              { label: "rails/rails", url: "https://github.com/rails/rails" },
            ].map(({ label, url: repoUrl }) => (
              <button
                key={label}
                type="button"
                onClick={() => setUrl(repoUrl)}
                disabled={scanning}
                className="rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {label}
              </button>
            ))}
          </div>
        </form>
      )}

      {scanning && (
        <p className="mt-3 text-xs text-muted-foreground animate-pulse">
          Analyzing repository structure and generating CLAUDE.md…
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-1 flex flex-col gap-3">
          {/* Stack tags + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-foreground">Detected stack</span>
              {result.detected_stack.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" onClick={handleDownload}>
                <Download className="size-3.5" />
                Download
              </Button>
            </div>
          </div>

          {/* Editable CLAUDE.md */}
          <textarea
            value={claudeMd}
            onChange={(e) => setClaudeMd(e.target.value)}
            className="w-full min-h-[420px] rounded-xl border border-border bg-background px-4 py-3 font-mono text-xs leading-relaxed text-foreground/90 resize-y focus:outline-none focus:ring-2 focus:ring-foreground/20"
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground">
            Editable — tweak before downloading. Place it at the root of your repo.
          </p>
        </div>
      )}
    </div>
  );
}
