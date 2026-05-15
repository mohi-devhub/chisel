import { NextResponse } from "next/server";

import {
  getRegistryItems,
  type RegistryItemType,
  type RegistrySort,
} from "@/lib/registry";

export const runtime = "nodejs";

const SORT_VALUES = new Set<RegistrySort>(["recent", "popular", "name"]);
const TYPE_VALUES = new Set<RegistryItemType>(["skill", "template"]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sortParam = url.searchParams.get("sort") ?? "recent";
    const typeParam = url.searchParams.get("type");
    const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const pageSize = Number.parseInt(url.searchParams.get("pageSize") ?? "12", 10);

    const data = await getRegistryItems({
      type: typeParam && TYPE_VALUES.has(typeParam as RegistryItemType)
        ? (typeParam as RegistryItemType)
        : undefined,
      stack: url.searchParams.get("stack") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
      search: url.searchParams.get("q") ?? undefined,
      sort: SORT_VALUES.has(sortParam as RegistrySort)
        ? (sortParam as RegistrySort)
        : "recent",
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 12,
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "registry_failed", message: "Could not load registry items." },
      { status: 500 }
    );
  }
}
