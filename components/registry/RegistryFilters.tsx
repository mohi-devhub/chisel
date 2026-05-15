import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RegistrySort } from "@/lib/registry";

export function RegistryFilters({
  stacks,
  categories,
  selectedStack,
  selectedCategory,
  search,
  sort,
  hiddenParams,
}: {
  stacks: string[];
  categories: string[];
  selectedStack?: string;
  selectedCategory?: string;
  search?: string;
  sort: RegistrySort;
  hiddenParams?: Record<string, string>;
}) {
  return (
    <form className="grid gap-3 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm md:grid-cols-[1fr_1fr_1fr_150px_auto]">
      {Object.entries(hiddenParams ?? {}).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null
      )}

      <label className="sr-only" htmlFor="q">Search</label>
      <Input
        id="q"
        name="q"
        type="search"
        defaultValue={search}
        placeholder="Search name or description"
        className="border-border/50 bg-background/50 placeholder:text-muted-foreground/50"
      />

      <label className="sr-only" htmlFor="stack">Stack</label>
      <Input
        id="stack"
        name="stack"
        list="registry-stacks"
        defaultValue={selectedStack}
        placeholder="Stack (nextjs, django…)"
        className="border-border/50 bg-background/50 placeholder:text-muted-foreground/50"
      />
      <datalist id="registry-stacks">
        {stacks.map((stack) => (
          <option key={stack} value={stack} />
        ))}
      </datalist>

      <label className="sr-only" htmlFor="category">Category</label>
      <Input
        id="category"
        name="category"
        list="registry-categories"
        defaultValue={selectedCategory}
        placeholder="Category"
        className="border-border/50 bg-background/50 placeholder:text-muted-foreground/50"
      />
      <datalist id="registry-categories">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <label className="sr-only" htmlFor="sort">Sort</label>
      <select
        id="sort"
        name="sort"
        defaultValue={sort}
        className="h-9 rounded-md border border-border/50 bg-background/50 px-3 text-sm outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <option value="recent">Recent</option>
        <option value="popular">Popular</option>
        <option value="name">Name</option>
      </select>

      <Button type="submit" className="shadow-[0_0_16px_theme(colors.primary/20%)]">
        <Search className="size-4" />
        Filter
      </Button>
    </form>
  );
}
