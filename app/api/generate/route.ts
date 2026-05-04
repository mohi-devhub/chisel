import { randomUUID } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { getFingerprint } from "@/lib/fingerprint";
import { generateSkill } from "@/lib/anthropic";
import { packageSkill } from "@/lib/packaging";
import { checkUserQuota, consumeUserQuota } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/users";
import type { GenerateRequest, GeneratedSkill } from "@/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<GenerateRequest>;
    const parsed = parseGenerateRequest(body);

    if (parsed instanceof NextResponse) {
      return parsed;
    }

    const fingerprint = getFingerprint(request);
    const { userId } = await auth();
    const user = userId ? await ensureUserRecord(userId, fingerprint) : null;
    let effectiveTier = user?.tier ?? "free";

    if (!user) {
      return NextResponse.json(
        {
          error: "auth_required",
          message: "Sign up to start a 7-day Creator trial before generating.",
          remaining: 0,
        },
        { status: 401 }
      );
    }

    const userQuota = checkUserQuota(user);
    effectiveTier = userQuota.effectiveTier;

    if (!userQuota.allowed) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          message: buildQuotaMessage(userQuota.reason),
          remaining: userQuota.remaining,
        },
        { status: 402 }
      );
    }

    const generated = await generateSkill(parsed);
    const effectiveSkill =
      user && effectiveTier !== "free" ? generated : stripAdvancedFiles(generated);
    const updatedQuota = await consumeUserQuota(user);

    if (!updatedQuota.allowed) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          message: user
            ? buildQuotaMessage(
                "reason" in updatedQuota ? updatedQuota.reason : undefined
              )
            : "Sign up to start a 7-day Creator trial before generating.",
          remaining: updatedQuota.remaining,
        },
        { status: 402 }
      );
    }

    const zip = await packageSkill(effectiveSkill);
    const storagePath = `skills/${userId ?? "anon"}/${fingerprint.slice(
      0,
      16
    )}/${randomUUID()}.skill`;

    await storeGeneratedSkill({
      skill: effectiveSkill,
      description: parsed.description,
      storagePath,
      zip,
      userId,
    }).catch(() => {
      // Storage is best-effort — a bucket misconfiguration should not block the download.
    });

    const wantsJson = request.headers
      .get("accept")
      ?.toLowerCase()
      .includes("application/json");

    if (wantsJson) {
      return NextResponse.json({
        name: effectiveSkill.name,
        skill_md: effectiveSkill.skill_md,
        zip_base64: zip.toString("base64"),
        filename: `${effectiveSkill.name}.skill`,
        remaining: updatedQuota.remaining,
      });
    }

    const zipBody = zip.buffer.slice(
      zip.byteOffset,
      zip.byteOffset + zip.byteLength
    ) as ArrayBuffer;

    return new NextResponse(zipBody, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${effectiveSkill.name}.skill"`,
        "X-Generations-Remaining": String(updatedQuota.remaining),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not generate skill";

    if (message.includes("frontmatter") || message.includes("skill_md")) {
      return NextResponse.json(
        { error: "invalid_skill", details: message },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "generation_failed", details: message },
      { status: 500 }
    );
  }
}

function parseGenerateRequest(
  body: Partial<GenerateRequest>
): GenerateRequest | NextResponse {
  const description = body.description?.trim();
  const complexity = body.complexity ?? "standard";

  if (!description || description.length < 10) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "Describe the skill in at least 10 characters.",
      },
      { status: 400 }
    );
  }

  if (description.length > 4000) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "Description must be 4000 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (!["simple", "standard", "full"].includes(complexity)) {
    return NextResponse.json(
      { error: "invalid_request", message: "Unsupported complexity." },
      { status: 400 }
    );
  }

  return {
    description,
    complexity,
    include: {
      scripts: Boolean(body.include?.scripts),
      references: Boolean(body.include?.references),
      assets: Boolean(body.include?.assets),
    },
  };
}

function stripAdvancedFiles(skill: GeneratedSkill): GeneratedSkill {
  return {
    ...skill,
    scripts: [],
    references: [],
    assets: [],
  };
}

function buildQuotaMessage(reason?: string) {
  if (reason === "monthly_limit") {
    return "You have reached your monthly generation limit.";
  }

  return "Your trial or paid plan is required to generate skills.";
}

async function storeGeneratedSkill({
  skill,
  description,
  storagePath,
  zip,
  userId,
}: {
  skill: GeneratedSkill;
  description: string;
  storagePath: string;
  zip: Buffer;
  userId: string | null;
}) {
  const supabase = createClient();

  const { error: uploadError } = await supabase.storage
    .from("chisel-skills")
    .upload(storagePath, zip, {
      contentType: "application/zip",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Could not upload skill zip: ${uploadError.message}`);
  }

  const { error: insertError } = await supabase.from("skills").insert({
    user_id: userId,
    name: skill.name,
    description,
    storage_path: storagePath,
    structure: {
      has_scripts: skill.scripts.length > 0,
      has_references: skill.references.length > 0,
      has_assets: skill.assets.length > 0,
    },
  });

  if (insertError) {
    throw new Error(`Could not record generated skill: ${insertError.message}`);
  }
}
