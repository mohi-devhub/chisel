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
    <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-3">
      {options.map((option) => (
        <label
          key={option.key}
          title={
            canUseAdvanced
              ? option.label
              : "Advanced folders unlock during trial and paid tiers."
          }
          className={[
            "flex min-h-10 items-center justify-between gap-2 rounded-md bg-background px-3 py-2",
            canUseAdvanced
              ? "cursor-pointer text-foreground"
              : "cursor-not-allowed text-muted-foreground",
          ].join(" ")}
        >
          <span>{option.label}</span>
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              className="size-4 accent-current disabled:cursor-not-allowed"
              checked={include[option.key]}
              disabled={!canUseAdvanced}
              onChange={(event) => updateOption(option.key, event.target.checked)}
            />
            {canUseAdvanced ? null : <Lock className="size-3.5" />}
          </span>
        </label>
      ))}
    </div>
  );
}
