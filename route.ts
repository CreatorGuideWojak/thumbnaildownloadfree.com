import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/errors";
import { clientIp, isSameOrigin, jsonError } from "@/lib/http";
import { getInstagramResult } from "@/lib/instagram";
import { rateLimit } from "@/lib/rateLimit";
import { parseMediaUrl } from "@/lib/validate";
import { getYouTubeThumbnails } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 4096;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("FORBIDDEN", "Cross-origin requests aren't allowed.", 403);

  const rl = rateLimit(`thumb:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) {
    return jsonError("RATE_LIMITED", `Too many requests. Please try again shortly.`, 429, {
      "Retry-After": String(rl.retryAfter),
    });
  }

  if (!(req.headers.get("content-type") ?? "").includes("application/json")) {
    return jsonError("BAD_REQUEST", "Please enter a valid YouTube or Instagram URL.", 415);
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) return jsonError("BAD_REQUEST", "Request is too large.", 413);
    body = JSON.parse(text);
  } catch {
    return jsonError("BAD_REQUEST", "Please enter a valid YouTube or Instagram URL.", 400);
  }

  const parsed = parseMediaUrl((body as { url?: unknown } | null)?.url);
  if (!parsed.ok) return jsonError(parsed.code, parsed.message, 400);

  try {
    const { target } = parsed;
    const result =
      target.platform === "youtube"
        ? await getYouTubeThumbnails(target.id, target.canonicalUrl)
        : await getInstagramResult(target);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store", "X-RateLimit-Remaining": String(rl.remaining) },
    });
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.code, err.message, err.status);
    console.error("[api/thumbnail]", err);
    return jsonError("INTERNAL", "We couldn't retrieve a thumbnail from this URL. Try again.", 500);
  }
}

export function GET() {
  return jsonError("BAD_REQUEST", "Use POST with a JSON body: { \"url\": \"…\" }.", 405, { Allow: "POST" });
}
