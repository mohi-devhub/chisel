import { Download, Tag } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MarketplaceListing } from "@/lib/marketplace";

export function SkillCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="mb-2 flex flex-wrap gap-2">
          {listing.category ? (
            <Badge variant="secondary">{listing.category}</Badge>
          ) : null}
          <Badge variant="outline">
            <Download className="size-3" />
            {listing.download_count}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 text-base">
          <Link href={`/marketplace/${listing.id}`}>{listing.name}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {listing.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(listing.tags ?? []).slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline">
              <Tag className="size-3" />
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {listing.author_email ?? "Chisel creator"}
        </span>
        <Button size="sm" asChild>
          <Link href={`/marketplace/${listing.id}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
