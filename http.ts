import { NextRequest, NextResponse } from "next/server";
import type { ErrorCode } from "./types";
import { site } from "./site";

/**
 * Which header carries the real client IP. Only trust x-forwarded-for (or any
 * proxy header) if your host actually sets/overwrites it — Vercel and
 * Cloudflare do. Behind a different proxy, set TRUSTED_IP_HEADER to match it,
 * or leave unset to fall back to a constant bucket (rate limiting still works,
 * just shared across all clients).
 */
const TRUSTED_IP_HEADER = (process.env.TRUSTED_IP_HEADER ?? "x-forwarded-for").toLowerCase();

export function clientIp(req: NextRequest): string {
  const raw = req.headers.get(TRUSTED_IP_HEADER);
  if (!raw) return "unknown";
  return raw.split(",")[0].trim().slice(0, 64) || "unknown";
}

export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients; still rate limited
  try {
    const host = new URL(origin).host;
    const own = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return host === own || host === new URL(site.url).host;
  } catch {
    return false;
  }
}

export function jsonError(code: ErrorCode, message: string, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
