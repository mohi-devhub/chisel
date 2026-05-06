import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getDashboardData } from "@/lib/dashboard";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const data = await getDashboardData(userId);

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        error: "dashboard_failed",
        message: "Could not load dashboard.",
      },
      { status: 500 }
    );
  }
}
