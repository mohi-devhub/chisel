import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  getOrgForUser,
  getOrgItem,
  getOrgItemDownloadUrl,
} from "@/lib/workspace";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const membership = await getOrgForUser(userId);
    if (!membership) {
      return NextResponse.json({ error: "no_org" }, { status: 403 });
    }

    const item = await getOrgItem(membership.org.id, id);
    if (!item) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const signedUrl = await getOrgItemDownloadUrl(item);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not download.";
    return NextResponse.json({ error: "download_failed", message }, { status: 500 });
  }
}
