import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  getOrgForUser,
  getOrgMembers,
  inviteMember,
  removeMember,
} from "@/lib/workspace";

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
    const members = await getOrgMembers(membership.org.id);
    return NextResponse.json({ members });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load members.";
    return NextResponse.json({ error: "members_failed", message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const membership = await getOrgForUser(userId);
    if (!membership) {
      return NextResponse.json({ error: "no_org" }, { status: 403 });
    }
    if (membership.role !== "owner") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { email?: string };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "invalid_email", message: "Provide a valid email." },
        { status: 400 }
      );
    }

    const result = await inviteMember(membership.org.id, userId, email);
    if (result.status === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (result.status === "user_not_found") {
      return NextResponse.json(
        {
          error: "user_not_found",
          message: "No Chisel account exists for that email. Ask them to sign up first.",
        },
        { status: 404 }
      );
    }
    if (result.status === "already_member") {
      return NextResponse.json(
        {
          error: "already_member",
          message: "This user is already in an organization.",
        },
        { status: 409 }
      );
    }
    if (result.status === "seat_limit") {
      return NextResponse.json(
        {
          error: "seat_limit",
          message: "Team seat limit reached (5 members).",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ status: "invited", userId: result.userId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not invite member.";
    return NextResponse.json({ error: "invite_failed", message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const membership = await getOrgForUser(userId);
    if (!membership) {
      return NextResponse.json({ error: "no_org" }, { status: 403 });
    }
    if (membership.role !== "owner") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get("userId");
    if (!target) {
      return NextResponse.json({ error: "missing_user" }, { status: 400 });
    }

    const result = await removeMember(membership.org.id, userId, target);
    if (result.status === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (result.status === "cannot_remove_owner") {
      return NextResponse.json(
        { error: "cannot_remove_owner", message: "Owner cannot be removed." },
        { status: 409 }
      );
    }
    if (result.status === "not_member") {
      return NextResponse.json({ error: "not_member" }, { status: 404 });
    }
    return NextResponse.json({ status: "removed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove member.";
    return NextResponse.json({ error: "remove_failed", message }, { status: 500 });
  }
}
