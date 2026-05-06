import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { publishSkill } from "@/lib/marketplace";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const parsed = parsePublishRequest(await request.json());

    if (parsed instanceof NextResponse) {
      return parsed;
    }

    const result = await publishSkill({
      userId,
      ...parsed,
    });

    if (result.status === "forbidden") {
      return NextResponse.json(
        {
          error: "pro_required",
          message: "Only Pro accounts can publish skills.",
        },
        { status: 403 }
      );
    }

    if (result.status === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (result.status === "already_published") {
      return NextResponse.json(
        {
          error: "already_published",
          listingId: result.listingId,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { id: result.listingId, status: "published" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        error: "publish_failed",
        message: "Could not publish skill.",
      },
      { status: 500 }
    );
  }
}

function parsePublishRequest(body: unknown) {
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const skillId = typeof payload.skill_id === "string" ? payload.skill_id : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const category =
    typeof payload.category === "string" ? payload.category.trim() : "";
  const tags = Array.isArray(payload.tags)
    ? payload.tags
    : typeof payload.tags === "string"
      ? payload.tags.split(",")
      : [];
  const normalizedTags = tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

  if (!UUID_PATTERN.test(skillId)) {
    return NextResponse.json({ error: "invalid_skill_id" }, { status: 400 });
  }

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

  return {
    skillId,
    name,
    description,
    tags: [...new Set(normalizedTags)],
    category: category ? category.toLowerCase().slice(0, 40) : null,
  };
}
