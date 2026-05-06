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
    <form className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_1fr_150px_auto]">
      <label className="sr-only" htmlFor="category">
        Category
      </label>
      <Input
        id="category"
        name="category"
        list="marketplace-categories"
        placeholder="Category"
        defaultValue={selectedCategory}
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
        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="recent">Recent</option>
        <option value="popular">Popular</option>
        <option value="name">Name</option>
      </select>

      <Button type="submit">
        <Search className="size-4" />
        Filter
      </Button>
    </form>
  );
}
