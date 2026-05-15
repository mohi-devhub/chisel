import { ChevronLeft, ChevronRight, FileText, Hammer, Library, Sparkles } from "lucide-react";
import Link from "next/link";

import { RegistryCard } from "@/components/registry/RegistryCard";
import { RegistryFilters } from "@/components/registry/RegistryFilters";
import { Button } from "@/components/ui/button";
import {
  REGISTRY_PAGE_SIZE,
  getRegistryItems,
  type RegistryItemType,
  type RegistrySort,
} from "@/lib/registry";

const SORT_VALUES = new Set<RegistrySort>(["recent", "popular", "name"]);
const TYPE_VALUES = new Set<RegistryItemType>(["skill", "template"]);

export const metadata = {
  title: "Registry — Chisel",
  description:
    "Browse CLAUDE.md templates and skills published by the Chisel community.",
};

export default async function RegistryPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    stack?: string;
    category?: string;
    tag?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const type: RegistryItemType = TYPE_VALUES.has(params.type as RegistryItemType)
    ? (params.type as RegistryItemType)
    : "template";
  const sort: RegistrySort = SORT_VALUES.has(params.sort as RegistrySort)
    ? (params.sort as RegistrySort)
    : "recent";
  const page = Number.parseInt(params.page ?? "1", 10);

  const registry = await getRegistryItems({
    type,
    stack: normalizeFilter(params.stack),
    category: normalizeFilter(params.category),
    tag: normalizeFilter(params.tag),
    search: params.q?.trim() || undefined,
    sort,
    page: Number.isFinite(page) ? page : 1,
    pageSize: REGISTRY_PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(registry.total / registry.pageSize));

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between pb-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_16px_theme(colors.primary/50%)]">
              <Hammer className="size-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Chisel</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button
              size="sm"
              className="ml-2 h-8 text-xs shadow-[0_0_16px_theme(colors.primary/30%)]"
              asChild
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </nav>
        </header>

        <section className="py-8">
          {/* Page header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Library className="size-5" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Registry</h1>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Community-built CLAUDE.md templates and skills for Claude Code.
              </p>
            </div>
            <Button
              asChild
              className="shadow-[0_0_20px_theme(colors.primary/20%)] hover:shadow-[0_0_28px_theme(colors.primary/35%)] transition-shadow"
            >
              <Link href="/dashboard">Publish</Link>
            </Button>
          </div>

          <TypeTabs current={type} />

          <RegistryFilters
            stacks={registry.stacks}
            categories={registry.categories}
            selectedStack={params.stack}
            selectedCategory={params.category}
            search={params.q}
            sort={sort}
            hiddenParams={{ type }}
          />

          {registry.items.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {registry.items.map((item) => (
                <RegistryCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border/40 px-4 text-center">
              <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                {type === "template" ? (
                  <FileText className="size-5" />
                ) : (
                  <Sparkles className="size-5" />
                )}
              </div>
              <h2 className="text-sm font-medium">
                No {type === "template" ? "templates" : "skills"} found
              </h2>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Try a different filter or be the first to publish.
              </p>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={registry.page <= 1}
                asChild={registry.page > 1}
              >
                {registry.page > 1 ? (
                  <Link href={pageHref(params, type, sort, registry.page - 1)}>
                    <ChevronLeft className="size-4" />
                    Previous
                  </Link>
                ) : (
                  <>
                    <ChevronLeft className="size-4" />
                    Previous
                  </>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {registry.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={registry.page >= totalPages}
                asChild={registry.page < totalPages}
              >
                {registry.page < totalPages ? (
                  <Link href={pageHref(params, type, sort, registry.page + 1)}>
                    Next
                    <ChevronRight className="size-4" />
                  </Link>
                ) : (
                  <>
                    Next
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function TypeTabs({ current }: { current: RegistryItemType }) {
  return (
    <div className="mb-5 inline-flex gap-1 rounded-lg border border-border/50 bg-card/50 p-1">
      <Link href="/registry?type=template" className={tabClass(current === "template")}>
        <FileText className="size-3.5" />
        Templates
      </Link>
      <Link href="/registry?type=skill" className={tabClass(current === "skill")}>
        <Sparkles className="size-3.5" />
        Skills
      </Link>
    </div>
  );
}

function tabClass(active: boolean) {
  const base =
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  return active
    ? `${base} bg-background text-foreground shadow-sm`
    : `${base} text-muted-foreground hover:text-foreground`;
}

function normalizeFilter(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function pageHref(
  params: {
    type?: string;
    stack?: string;
    category?: string;
    tag?: string;
    q?: string;
  },
  type: RegistryItemType,
  sort: RegistrySort,
  page: number
) {
  const searchParams = new URLSearchParams();
  searchParams.set("type", type);
  searchParams.set("sort", sort);
  searchParams.set("page", String(page));

  for (const key of ["stack", "category", "tag", "q"] as const) {
    const value = params[key];
    if (value) searchParams.set(key, value);
  }

  return `/registry?${searchParams.toString()}`;
}
