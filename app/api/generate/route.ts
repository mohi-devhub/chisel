import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getFingerprint } from "@/lib/fingerprint";
import { generateSkill } from "@/lib/anthropic";
import { packageSkill } from "@/lib/packaging";
import { checkAnonymousQuota, consumeAnonymousQuota } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";
import type { GenerateRequest, GeneratedSkill } from "@/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<GenerateRequest>;
    const parsed = parseGenerateRequest(body);

    if (parsed instanceof NextResponse) {
      return parsed;
    }

    if (
      parsed.include.scripts ||
      parsed.include.references ||
      parsed.include.assets
    ) {
      return NextResponse.json(
        {
          error: "upgrade_required",
          message: "Anonymous generation includes SKILL.md only.",
        },
        { status: 403 }
      );
    }

    const fingerprint = getFingerprint(request);
    const quota = await checkAnonymousQuota(fingerprint);

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          message: "You have used your 3 free anonymous generations.",
          remaining: quota.remaining,
        },
        { status: 402 }
      );
    }

    const generated = await generateSkill(parsed);
    const freeSkill = stripAdvancedFiles(generated);
    const zip = await packageSkill(freeSkill);
    const storagePath = `skills/anon/${fingerprint.slice(
      0,
      16
    )}/${randomUUID()}.skill`;

    await storeGeneratedSkill({
      skill: freeSkill,
      description: parsed.description,
      storagePath,
      zip,
    }).catch(() => {
      // Storage is best-effort — a bucket misconfiguration should not block the download.
    });

    const updatedQuota = await consumeAnonymousQuota(fingerprint);
    const wantsJson = request.headers
      .get("accept")
      ?.toLowerCase()
      .includes("application/json");

    if (wantsJson) {
      return NextResponse.json({
        name: freeSkill.name,
        skill_md: freeSkill.skill_md,
        zip_base64: zip.toString("base64"),
        filename: `${freeSkill.name}.skill`,
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
        "Content-Disposition": `attachment; filename="${freeSkill.name}.skill"`,
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

async function storeGeneratedSkill({
  skill,
  description,
  storagePath,
  zip,
}: {
  skill: GeneratedSkill;
  description: string;
  storagePath: string;
  zip: Buffer;
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
    user_id: null,
    name: skill.name,
    description,
    storage_path: storagePath,
    structure: {
      has_scripts: false,
      has_references: false,
      has_assets: false,
    },
  });

  if (insertError) {
    throw new Error(`Could not record generated skill: ${insertError.message}`);
  }
}
