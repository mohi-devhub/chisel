import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createClient();

  const { data: scan, error } = await supabase
    .from("scans")
    .select("repo_owner, repo_name, claude_md")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle<{ repo_owner: string; repo_name: string; claude_md: string }>();

  if (error) {
    return NextResponse.json(
      { error: "lookup_failed", message: error.message },
      { status: 500 }
    );
  }

  if (!scan) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return new NextResponse(scan.claude_md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="CLAUDE-${scan.repo_owner}-${scan.repo_name}.md"`,
    },
  });
}
