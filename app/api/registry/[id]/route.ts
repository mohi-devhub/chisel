import { NextResponse } from "next/server";

import { getRegistryItem, getRegistryItemPreview } from "@/lib/registry";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const item = await getRegistryItem(id);
    if (!item) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const includePreview = url.searchParams.get("preview") === "1";
    const preview = includePreview ? await getRegistryItemPreview(item) : null;

    return NextResponse.json({ item, preview });
  } catch {
    return NextResponse.json(
      { error: "registry_failed", message: "Could not load registry item." },
      { status: 500 }
    );
  }
}
