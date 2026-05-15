import { Download, FileText, Sparkles, Tag } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RegistryItem } from "@/lib/registry";

export function RegistryCard({ item }: { item: RegistryItem }) {
  const TypeIcon = item.type === "template" ? FileText : Sparkles;

  return (
    <div className="group flex flex-col rounded-xl border border-border/60 bg-card/80 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_0_20px_theme(colors.primary/8%)]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1 text-xs capitalize">
          <TypeIcon className="size-3" />
          {item.type}
        </Badge>
        {item.category ? (
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
        ) : null}
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground/70">
          <Download className="size-3" />
          {item.install_count}
        </span>
      </div>

      <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
        <Link href={`/registry/${item.id}`}>{item.name}</Link>
      </h3>

      <p className="mt-2 line-clamp-3 flex-1 text-xs leading-5 text-muted-foreground">
        {item.description}
      </p>

      {(item.stack.length > 0 || item.tags.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.stack.slice(0, 4).map((tag) => (
            <Badge key={`stack-${tag}`} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={`tag-${tag}`} variant="outline" className="gap-1 text-xs">
              <Tag className="size-2.5" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-3">
        <span className="min-w-0 truncate text-xs text-muted-foreground/60">
          {item.author_email ?? "Chisel creator"}
        </span>
        <Button size="sm" asChild className="shrink-0">
          <Link href={`/registry/${item.id}`}>View</Link>
        </Button>
      </div>
    </div>
  );
}
