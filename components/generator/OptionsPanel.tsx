"use client";

import { Lock } from "lucide-react";

import type { GenerateRequest } from "@/types";

type IncludeOptions = GenerateRequest["include"];
type IncludeKey = keyof IncludeOptions;

interface OptionsPanelProps {
  include: IncludeOptions;
  canUseAdvanced: boolean;
  onChange: (include: IncludeOptions) => void;
}

const options: Array<{ key: IncludeKey; label: string }> = [
  { key: "scripts", label: "scripts/" },
  { key: "references", label: "references/" },
  { key: "assets", label: "assets/" },
];

export function OptionsPanel({
  include,
  canUseAdvanced,
  onChange,
}: OptionsPanelProps) {
  function updateOption(key: IncludeKey, checked: boolean) {
    onChange({ ...include, [key]: checked });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Include folders</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = include[option.key];
          return (
            <button
              key={option.key}
              type="button"
              disabled={!canUseAdvanced}
              onClick={() => canUseAdvanced && updateOption(option.key, !active)}
              title={
                canUseAdvanced
                  ? option.label
                  : "Advanced folders unlock during trial and paid tiers."
              }
              className={[
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-xs transition-all duration-150",
                canUseAdvanced
                  ? active
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border/50 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground cursor-pointer"
                  : "border-border/30 bg-muted/20 text-muted-foreground/40 cursor-not-allowed",
              ].join(" ")}
            >
              {!canUseAdvanced && <Lock className="size-3 opacity-50" />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
