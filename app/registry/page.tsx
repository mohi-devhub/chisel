import { ChevronLeft, ChevronRight, FileText, Library, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { RegistryCard } from "@/components/registry/RegistryCard";
import { RegistryFilters } from "@/components/registry/RegistryFilters";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/ui/site-nav";
import {
  REGISTRY_PAGE_SIZE,
  getRegistryItems,
  type RegistryItemType,
  type RegistrySort,
} from "@/lib/registry";

const SORT_VALUES = new Set<RegistrySort>(["recent", "popular", "name"]);
const TYPE_VALUES = new Set<RegistryItemType>(["skill", "template"]);

export const metadata: Metadata = {
  title: "Registry",
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
    <main className="relative min-h-screen bg-background text-foreground">
      <SiteNav
        links={[
          { label: "Pricing", href: "/pricing" },
        ]}
        authLinks={[{ label: "Dashboard", href: "/dashboard" }]}
        cta={{ label: "Sign in", href: "/sign-in" }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="py-12">
          {/* Page header */}
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Registry</p>
              <h1 className="font-display text-5xl md:text-6xl tracking-tight text-foreground leading-[0.95]">
                Community-built <em className="italic">skills</em>.
              </h1>
              <p className="mt-4 max-w-lg text-base text-muted-foreground">
                Browse CLAUDE.md templates and skills published by the Chisel community.
              </p>
            </div>
            <Button
              asChild
              className="rounded-full bg-foreground text-background hover:opacity-90"
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
    <div className="mb-6 inline-flex gap-1 rounded-full border border-border bg-background p-1">
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
    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors";
  return active
    ? `${base} bg-foreground text-background`
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
