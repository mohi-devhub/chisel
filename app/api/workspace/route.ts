import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getOrgForUser, getOrgItems, getOrgMembers } from "@/lib/workspace";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const membership = await getOrgForUser(userId);
    if (!membership) {
      return NextResponse.json({ error: "no_org" }, { status: 404 });
    }

    const [items, members] = await Promise.all([
      getOrgItems(membership.org.id),
      getOrgMembers(membership.org.id),
    ]);

    return NextResponse.json({ org: membership.org, role: membership.role, items, members });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load workspace.";
    return NextResponse.json({ error: "workspace_failed", message }, { status: 500 });
  }
}
