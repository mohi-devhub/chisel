"use client";

import type { GenerateRequest } from "@/types";
import { Textarea } from "@/components/ui/textarea";

type Complexity = GenerateRequest["complexity"];

interface DescriptionInputProps {
  description: string;
  complexity: Complexity;
  onDescriptionChange: (value: string) => void;
  onComplexityChange: (value: Complexity) => void;
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

export function DescriptionInput({
  description,
  complexity,
  onDescriptionChange,
  onComplexityChange,
}: DescriptionInputProps) {
  const characterCount = description.length;

  return (
    <div className="space-y-4">
      <Textarea
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
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
            onClick={() => onComplexityChange(option.value)}
            className={[
              "rounded-md border p-3 text-left transition-colors",
              complexity === option.value
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent",
            ].join(" ")}
          >
            <span className="block text-sm font-medium">{option.label}</span>
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
    </div>
  );
}
