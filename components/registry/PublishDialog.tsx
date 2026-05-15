"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";

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

interface SkillOption {
  id: string;
  name: string;
  description: string;
}

export function PublishDialog({
  defaultType = "template",
  skills = [],
  trigger,
}: {
  defaultType?: "template" | "skill";
  skills?: SkillOption[];
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"template" | "skill">(defaultType);
  const [skillId, setSkillId] = useState<string>(skills[0]?.id ?? "");
  const [error, setError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setIsPublishing(true);

    try {
      const body: Record<string, unknown> = {
        type,
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        category: String(formData.get("category") ?? ""),
        tags: String(formData.get("tags") ?? ""),
        stack: String(formData.get("stack") ?? ""),
      };

      if (type === "template") {
        body.content = String(formData.get("content") ?? "");
      } else {
        body.skill_id = skillId;
      }

      const response = await fetch("/api/registry/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? "Could not publish to registry.");
        return;
      }

      setOpen(false);
      router.refresh();
      if (payload.id) {
        router.push(`/registry/${payload.id}`);
      }
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Send className="size-4" />
            Publish
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Publish to Registry</DialogTitle>
            <DialogDescription>
              Share a CLAUDE.md template or skill with the Chisel community.
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
              Generate a skill first from{" "}
              <a className="underline" href="/generate">/generate</a> before
              publishing it.
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
              placeholder="Short description"
              minLength={20}
              maxLength={600}
              required
              className="min-h-24"
            />
            <Input name="stack" placeholder="Stack tags (e.g. nextjs, supabase)" />
            <Input name="tags" placeholder="Tags, comma separated" />
            <Input name="category" placeholder="Category" maxLength={40} />

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
            <Button type="submit" disabled={isPublishing}>
              {isPublishing ? "Publishing…" : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

