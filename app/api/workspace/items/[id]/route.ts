import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  getOrgForUser,
  removeOrgItem,
  setOrgItemPinned,
} from "@/lib/workspace";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
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

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.pinned !== "boolean") {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const result = await setOrgItemPinned(membership.org.id, userId, id, body.pinned);
    if (result.status === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update item.";
    return NextResponse.json({ error: "update_failed", message }, { status: 500 });
  }
}

export async function DELETE(
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

    const result = await removeOrgItem(membership.org.id, userId, id);
    if (result.status === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (result.status === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ status: "removed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove item.";
    return NextResponse.json({ error: "delete_failed", message }, { status: 500 });
  }
}
