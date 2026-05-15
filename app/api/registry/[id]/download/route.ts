import { NextResponse } from "next/server";

import { getRegistryDownloadUrl, getRegistryItem } from "@/lib/registry";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
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

    const signedUrl = await getRegistryDownloadUrl(item);
    return NextResponse.redirect(signedUrl);
  } catch {
    return NextResponse.json(
      { error: "download_failed", message: "Could not create download." },
      { status: 500 }
    );
  }
}
