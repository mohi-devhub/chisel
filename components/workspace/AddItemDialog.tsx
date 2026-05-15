"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface SkillOption {
  id: string;
  name: string;
  description: string;
}

export function AddItemDialog({ skills = [] }: { skills?: SkillOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"template" | "skill">("template");
  const [skillId, setSkillId] = useState<string>(skills[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        type,
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
      };
      if (type === "template") {
        body.content = String(formData.get("content") ?? "");
      } else {
        body.skill_id = skillId;
      }

      const response = await fetch("/api/workspace/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message ?? "Could not add item.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add to workspace</DialogTitle>
            <DialogDescription>
              Share a CLAUDE.md template or skill with your team. Items are
              private to your org.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 rounded-lg border border-border/60 bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setType("template")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                type === "template"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Template
            </button>
            <button
              type="button"
              onClick={() => setType("skill")}
              disabled={skills.length === 0}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                type === "skill"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                skills.length === 0 && "cursor-not-allowed opacity-50"
              )}
            >
              Skill
            </button>
          </div>

          {type === "skill" && skills.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Generate a skill from{" "}
              <a className="underline" href="/">/</a> first to share it here.
            </p>
          ) : null}

          {type === "skill" && skills.length > 0 ? (
            <select
              value={skillId}
              onChange={(event) => setSkillId(event.target.value)}
              className="h-9 w-full rounded-md border border-border/60 bg-background/50 px-3 text-sm"
            >
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          ) : null}

          <div className="space-y-3">
            <Input
              name="name"
              placeholder="Name"
              minLength={3}
              maxLength={80}
              required
            />
            <Textarea
              name="description"
              placeholder="Short description (optional)"
              maxLength={600}
              className="min-h-20"
            />
            {type === "template" ? (
              <Textarea
                name="content"
                placeholder="Paste your CLAUDE.md content"
                required
                className="min-h-56 font-mono text-xs"
              />
            ) : null}
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
