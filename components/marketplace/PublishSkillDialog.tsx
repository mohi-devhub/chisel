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

export function PublishSkillDialog({
  skill,
}: {
  skill: {
    id: string;
    name: string;
    description: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setIsPublishing(true);

    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill_id: skill.id,
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          category: String(formData.get("category") ?? ""),
          tags: String(formData.get("tags") ?? ""),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? "Could not publish this skill.");
        return;
      }

      setOpen(false);
      router.refresh();
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="size-4" />
          Publish
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Publish to Marketplace</DialogTitle>
            <DialogDescription>
              Publish a copy of this generated skill for anyone to download.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              name="name"
              defaultValue={skill.name}
              minLength={3}
              maxLength={80}
              required
            />
            <Textarea
              name="description"
              defaultValue={skill.description}
              minLength={20}
              maxLength={600}
              required
              className="min-h-28"
            />
            <Input name="category" placeholder="Category" maxLength={40} />
            <Input name="tags" placeholder="Tags, comma separated" />
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPublishing}>
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
