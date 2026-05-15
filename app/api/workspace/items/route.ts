import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  addOrgSkill,
  addOrgTemplate,
  getOrgForUser,
  type OrgItemType,
} from "@/lib/workspace";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TEMPLATE_BYTES = 256 * 1024;

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

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = parseAddItem(body);
    if (parsed instanceof NextResponse) return parsed;

    const result =
      parsed.type === "template"
        ? await addOrgTemplate({
            orgId: membership.org.id,
            userId,
            name: parsed.name,
            description: parsed.description,
            content: parsed.content,
          })
        : await addOrgSkill({
            orgId: membership.org.id,
            userId,
            skillId: parsed.skillId,
            name: parsed.name,
            description: parsed.description,
          });

    if (result.status === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (result.status === "skill_not_found") {
      return NextResponse.json({ error: "skill_not_found" }, { status: 404 });
    }

    return NextResponse.json({ id: result.itemId, status: "added" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add item.";
    return NextResponse.json({ error: "add_failed", message }, { status: 500 });
  }
}

type ParsedTemplate = {
  type: "template";
  name: string;
  description: string;
  content: string;
};

type ParsedSkill = {
  type: "skill";
  skillId: string;
  name: string;
  description: string;
};

function parseAddItem(payload: Record<string, unknown>): ParsedTemplate | ParsedSkill | NextResponse {
  const type = typeof payload.type === "string" ? (payload.type as OrgItemType) : "";
  if (type !== "template" && type !== "skill") {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";

  if (name.length < 3 || name.length > 80) {
    return NextResponse.json(
      { error: "invalid_name", message: "Name must be 3-80 characters." },
      { status: 400 }
    );
  }
  if (description.length > 600) {
    return NextResponse.json(
      { error: "invalid_description", message: "Description max 600 characters." },
      { status: 400 }
    );
  }

  if (type === "template") {
    const content = typeof payload.content === "string" ? payload.content : "";
    if (content.length < 50) {
      return NextResponse.json(
        { error: "invalid_content", message: "Template content is too short." },
        { status: 400 }
      );
    }
    if (Buffer.byteLength(content, "utf8") > MAX_TEMPLATE_BYTES) {
      return NextResponse.json(
        { error: "content_too_large", message: "Template exceeds 256 KB." },
        { status: 400 }
      );
    }
    return { type, name, description, content };
  }

  const skillId = typeof payload.skill_id === "string" ? payload.skill_id : "";
  if (!UUID_PATTERN.test(skillId)) {
    return NextResponse.json({ error: "invalid_skill_id" }, { status: 400 });
  }
  return { type, skillId, name, description };
}
