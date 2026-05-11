import { Download, Tag } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MarketplaceListing } from "@/lib/marketplace";

export function SkillCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <div className="group flex flex-col rounded-xl border border-border/60 bg-card/80 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_0_20px_theme(colors.primary/8%)]">
      {/* Meta row */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {listing.category ? (
          <Badge variant="secondary" className="text-xs">
            {listing.category}
          </Badge>
        ) : null}
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground/70">
          <Download className="size-3" />
          {listing.download_count}
        </span>
      </div>

      {/* Title */}
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
        <Link href={`/marketplace/${listing.id}`}>{listing.name}</Link>
      </h3>

      {/* Description */}
      <p className="mt-2 line-clamp-3 flex-1 text-xs leading-5 text-muted-foreground">
        {listing.description}
      </p>

      {/* Tags */}
      {(listing.tags ?? []).length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(listing.tags ?? []).slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1 text-xs">
              <Tag className="size-2.5" />
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-3">
        <span className="min-w-0 truncate text-xs text-muted-foreground/60">
          {listing.author_email ?? "Chisel creator"}
        </span>
        <Button size="sm" asChild className="shrink-0">
          <Link href={`/marketplace/${listing.id}`}>View</Link>
        </Button>
      </div>
    </div>
  );
}
