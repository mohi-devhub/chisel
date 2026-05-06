import { ChevronLeft, ChevronRight, Hammer, Store } from "lucide-react";
import Link from "next/link";

import { FilterBar } from "@/components/marketplace/FilterBar";
import { SkillCard } from "@/components/marketplace/SkillCard";
import { Button } from "@/components/ui/button";
import {
  MARKETPLACE_PAGE_SIZE,
  getMarketplaceListings,
  type MarketplaceSort,
} from "@/lib/marketplace";

const SORT_VALUES = new Set(["recent", "popular", "name"]);

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const sort: MarketplaceSort = SORT_VALUES.has(params.sort ?? "")
    ? (params.sort as MarketplaceSort)
    : "recent";
  const page = Number.parseInt(params.page ?? "1", 10);
  const marketplace = await getMarketplaceListings({
    category: normalizeFilter(params.category),
    tag: normalizeFilter(params.tag),
    sort,
    page: Number.isFinite(page) ? page : 1,
    pageSize: MARKETPLACE_PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(marketplace.total / marketplace.pageSize));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b pb-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Hammer className="size-4" />
            </div>
            <span className="text-lg font-semibold">Chisel</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
          </nav>
        </header>

        <section className="py-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Store className="size-5" />
              </div>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                Marketplace
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Browse published Claude Code skills from Chisel creators.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard">Publish a skill</Link>
            </Button>
          </div>

          <FilterBar
            categories={marketplace.categories}
            tags={marketplace.tags}
            selectedCategory={params.category}
            selectedTag={params.tag}
            sort={sort}
          />

          {marketplace.listings.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {marketplace.listings.map((listing) => (
                <SkillCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center">
              <Store className="mb-3 size-8 text-muted-foreground" />
              <h2 className="text-sm font-medium">No skills found</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try a different category or tag.
              </p>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={marketplace.page <= 1}
                asChild={marketplace.page > 1}
              >
                {marketplace.page > 1 ? (
                  <Link href={pageHref(params, marketplace.page - 1)}>
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
              <span className="text-sm text-muted-foreground">
                Page {marketplace.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={marketplace.page >= totalPages}
                asChild={marketplace.page < totalPages}
              >
                {marketplace.page < totalPages ? (
                  <Link href={pageHref(params, marketplace.page + 1)}>
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

function normalizeFilter(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function pageHref(
  params: {
    category?: string;
    tag?: string;
    sort?: string;
  },
  page: number
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...params, page: String(page) })) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  return `/marketplace?${searchParams.toString()}`;
}
