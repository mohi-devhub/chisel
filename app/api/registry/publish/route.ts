import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  publishSkillToRegistry,
  publishTemplate,
  type RegistryItemType,
} from "@/lib/registry";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_TEMPLATE_BYTES = 256 * 1024; // 256 KB cap for raw markdown

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = parseRequest(body);
    if (parsed instanceof NextResponse) return parsed;

    const result =
      parsed.type === "template"
        ? await publishTemplate({
            userId,
            name: parsed.name,
            description: parsed.description,
            stack: parsed.stack,
            tags: parsed.tags,
            category: parsed.category,
            content: parsed.content,
          })
        : await publishSkillToRegistry({
            userId,
            skillId: parsed.skillId,
            name: parsed.name,
            description: parsed.description,
            stack: parsed.stack,
            tags: parsed.tags,
            category: parsed.category,
          });

    if (result.status === "forbidden") {
      return NextResponse.json(
        {
          error: "subscription_required",
          message: "Only Solo or Team subscribers can publish.",
        },
        { status: 403 }
      );
    }
    if (result.status === "not_found") {
      return NextResponse.json({ error: "skill_not_found" }, { status: 404 });
    }
    if (result.status === "already_published") {
      return NextResponse.json(
        { error: "already_published", itemId: result.itemId },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { id: result.itemId, status: "published" },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not publish.";
    return NextResponse.json(
      { error: "publish_failed", message },
      { status: 500 }
    );
  }
}

type ParsedTemplate = {
  type: "template";
  name: string;
  description: string;
  stack: string[];
  tags: string[];
  category: string | null;
  content: string;
};

type ParsedSkill = {
  type: "skill";
  skillId: string;
  name: string;
  description: string;
  stack: string[];
  tags: string[];
  category: string | null;
};

function parseRequest(payload: Record<string, unknown>): ParsedTemplate | ParsedSkill | NextResponse {
  const type = typeof payload.type === "string" ? payload.type : "";
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
  if (description.length < 20 || description.length > 600) {
    return NextResponse.json(
      {
        error: "invalid_description",
        message: "Description must be 20-600 characters.",
      },
      { status: 400 }
    );
  }

  const tags = normalizeStringArray(payload.tags).slice(0, 8);
  const stack = normalizeStringArray(payload.stack).slice(0, 8);
  const categoryRaw = typeof payload.category === "string" ? payload.category.trim() : "";
  const category = categoryRaw ? categoryRaw.toLowerCase().slice(0, 40) : null;

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
    return { type, name, description, stack, tags, category, content };
  }

  const skillId = typeof payload.skill_id === "string" ? payload.skill_id : "";
  if (!UUID_PATTERN.test(skillId)) {
    return NextResponse.json({ error: "invalid_skill_id" }, { status: 400 });
  }
  return { type, skillId, name, description, stack, tags, category };
}

function normalizeStringArray(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  return [
    ...new Set(
      raw
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}
