import { Download, Hammer, Tag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getMarketplaceListing,
  getMarketplaceSkillPreview,
} from "@/lib/marketplace";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const listing = await getMarketplaceListing(id);

  if (!listing) {
    notFound();
  }

  const preview = await getMarketplaceSkillPreview(listing.storage_path);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b pb-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Hammer className="size-4" />
            </div>
            <span className="text-lg font-semibold">Chisel</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/marketplace">Marketplace</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>
        </header>

        <section className="py-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-2">
                {listing.category ? (
                  <Badge variant="secondary">{listing.category}</Badge>
                ) : null}
                <Badge variant="outline">
                  <Download className="size-3" />
                  {listing.download_count} downloads
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {listing.name}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
                {listing.description}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Published by {listing.author_email ?? "Chisel creator"} on{" "}
                {formatDate(listing.published_at)}
              </p>
            </div>
            <Button asChild>
              <a href={`/api/marketplace/${listing.id}/download`}>
                <Download className="size-4" />
                Download
              </a>
            </Button>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {(listing.tags ?? []).map((tag) => (
              <Badge key={tag} variant="outline">
                <Tag className="size-3" />
                {tag}
              </Badge>
            ))}
          </div>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>SKILL.md Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {preview ? (
                <pre className="max-h-[620px] overflow-auto rounded-md border bg-muted/40 p-4 text-sm leading-6">
                  <code>{preview}</code>
                </pre>
              ) : (
                <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  Preview unavailable.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}
