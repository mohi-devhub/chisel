import { Download, FileText, Hammer, Sparkles, Tag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRegistryItem, getRegistryItemPreview } from "@/lib/registry";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RegistryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const item = await getRegistryItem(id);
  if (!item) {
    notFound();
  }

  const preview = await getRegistryItemPreview(item);
  const TypeIcon = item.type === "template" ? FileText : Sparkles;
  const previewTitle = item.type === "template" ? "CLAUDE.md preview" : "SKILL.md preview";

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
              <Link href="/registry">Registry</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>
        </header>

        <section className="py-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1 capitalize">
                  <TypeIcon className="size-3" />
                  {item.type}
                </Badge>
                {item.category ? (
                  <Badge variant="outline">{item.category}</Badge>
                ) : null}
                <Badge variant="outline" className="gap-1">
                  <Download className="size-3" />
                  {item.install_count} {item.type === "template" ? "uses" : "installs"}
                </Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {item.name}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Published by {item.author_email ?? "Chisel creator"} on{" "}
                {formatDate(item.published_at)}
              </p>
            </div>
            <Button asChild>
              <a href={`/api/registry/${item.id}/download`}>
                <Download className="size-4" />
                Download
              </a>
            </Button>
          </div>

          {(item.stack.length > 0 || item.tags.length > 0) && (
            <div className="mb-6 flex flex-wrap gap-2">
              {item.stack.map((tag) => (
                <Badge key={`stack-${tag}`} variant="secondary">
                  {tag}
                </Badge>
              ))}
              {item.tags.map((tag) => (
                <Badge key={`tag-${tag}`} variant="outline">
                  <Tag className="size-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>{previewTitle}</CardTitle>
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
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}
