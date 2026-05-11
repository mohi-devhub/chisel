import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MarketplaceSort } from "@/lib/marketplace";

export function FilterBar({
  categories,
  tags,
  selectedCategory,
  selectedTag,
  sort,
}: {
  categories: string[];
  tags: string[];
  selectedCategory?: string;
  selectedTag?: string;
  sort: MarketplaceSort;
}) {
  return (
    <form className="grid gap-3 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm md:grid-cols-[1fr_1fr_150px_auto]">
      <label className="sr-only" htmlFor="category">
        Category
      </label>
      <Input
        id="category"
        name="category"
        list="marketplace-categories"
        placeholder="Category"
        defaultValue={selectedCategory}
        className="border-border/50 bg-background/50 placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:ring-primary/20"
      />
      <datalist id="marketplace-categories">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <label className="sr-only" htmlFor="tag">
        Tag
      </label>
      <Input
        id="tag"
        name="tag"
        list="marketplace-tags"
        placeholder="Tag"
        defaultValue={selectedTag}
        className="border-border/50 bg-background/50 placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:ring-primary/20"
      />
      <datalist id="marketplace-tags">
        {tags.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>

      <label className="sr-only" htmlFor="sort">
        Sort
      </label>
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
