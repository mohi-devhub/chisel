import { NextResponse } from "next/server";

import {
  getMarketplaceListings,
  type MarketplaceSort,
} from "@/lib/marketplace";

export const runtime = "nodejs";

const SORT_VALUES = new Set(["recent", "popular", "name"]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sortParam = url.searchParams.get("sort") ?? "recent";
    const sort: MarketplaceSort = SORT_VALUES.has(sortParam)
      ? (sortParam as MarketplaceSort)
      : "recent";
    const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const pageSize = Number.parseInt(url.searchParams.get("pageSize") ?? "12", 10);

    const data = await getMarketplaceListings({
      category: url.searchParams.get("category") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
      sort,
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 12,
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        error: "marketplace_failed",
        message: "Could not load marketplace listings.",
      },
      { status: 500 }
    );
  }
}
