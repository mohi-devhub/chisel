"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Pin, PinOff, Sparkles, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrgItem, OrgItemType } from "@/lib/workspace";

export function WorkspaceItems({ items }: { items: OrgItem[] }) {
  const [tab, setTab] = useState<OrgItemType>("template");

  const grouped = useMemo(() => {
    const templates = items.filter((item) => item.type === "template");
    const skills = items.filter((item) => item.type === "skill");
    return { templates, skills };
  }, [items]);

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as OrgItemType)}>
      <TabsList>
        <TabsTrigger value="template">
          <FileText className="size-3.5" />
          Templates
          <span className="ml-1 text-xs text-muted-foreground">
            {grouped.templates.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="skill">
          <Sparkles className="size-3.5" />
          Skills
          <span className="ml-1 text-xs text-muted-foreground">
            {grouped.skills.length}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="template" className="mt-4">
        <ItemGrid items={grouped.templates} emptyLabel="No team templates yet." />
      </TabsContent>
      <TabsContent value="skill" className="mt-4">
        <ItemGrid items={grouped.skills} emptyLabel="No team skills yet." />
      </TabsContent>
    </Tabs>
  );
}

function ItemGrid({ items, emptyLabel }: { items: OrgItem[]; emptyLabel: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ItemCard({ item }: { item: OrgItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function togglePinned() {
    setBusy(true);
    try {
      await fetch(`/api/workspace/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !item.pinned }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove "${item.name}" from the workspace?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/workspace/items/${item.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const TypeIcon = item.type === "template" ? FileText : Sparkles;

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-card/80 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Badge variant="secondary" className="gap-1 text-xs capitalize">
          <TypeIcon className="size-3" />
          {item.type}
        </Badge>
        {item.pinned ? (
          <Badge variant="outline" className="gap-1 text-xs">
            <Pin className="size-3" />
            Pinned
          </Badge>
        ) : null}
      </div>

      <h3 className="line-clamp-2 text-sm font-semibold">{item.name}</h3>
      {item.description ? (
        <p className="mt-1 line-clamp-3 flex-1 text-xs text-muted-foreground">
          {item.description}
        </p>
      ) : (
        <div className="flex-1" />
      )}

      <p className="mt-3 text-xs text-muted-foreground/60">
        Added by {item.created_by_email ?? "team"} on {formatDate(item.created_at)}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border/40 pt-3">
        <Button size="sm" variant="outline" asChild>
          <a href={`/api/workspace/items/${item.id}/download`}>
            <Download className="size-3.5" />
            Download
          </a>
        </Button>
        <Button size="sm" variant="ghost" onClick={togglePinned} disabled={busy}>
          {item.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
          {item.pinned ? "Unpin" : "Pin"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={remove}
          disabled={busy}
          className="ml-auto text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}
