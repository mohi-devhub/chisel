import { createHash } from "crypto";
import type { NextRequest } from "next/server";

export function getFingerprint(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown-ip";
  const userAgent = request.headers.get("user-agent") || "unknown-agent";

  return createHash("sha256")
    .update(`${ip}:${userAgent}`)
    .digest("hex");
}
