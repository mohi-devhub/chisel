import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getSkillDownloadUrl } from "@/lib/dashboard";

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

    const download = await getSkillDownloadUrl({ skillId: id, userId });

    if (!download) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.redirect(download.signedUrl);
  } catch {
    return NextResponse.json(
      {
        error: "download_failed",
        message: "Could not create download.",
      },
      { status: 500 }
    );
  }
}
