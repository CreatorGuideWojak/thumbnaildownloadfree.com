import { ApiError } from "./errors";
import type { ThumbnailResult } from "./types";
import type { ParsedTarget } from "./validate";

/**
 * Deliberately does NOT call Meta's oEmbed API. Meta's oEmbed docs state the
 * endpoint may only be used to render a front-end embed — not to extract,
 * store or otherwise reuse its metadata/content — and (per Meta's own recent
 * guidance) it no longer reliably returns an image URL for Instagram anyway.
 * So there is no honest "download" path for Instagram: we only offer a
 * preview via Instagram's own public embed page, which is the same content a
 * browser would load directly. We make one lightweight server-side request
 * to that same public page purely to tell "public and embeddable" apart from
 * "private/unavailable" before showing the iframe — we don't parse, store or
 * reuse anything from the response body, whatever it contains.
 *
 * IMPORTANT: this availability check has not been verified against live
 * Instagram traffic in this environment (the build sandbox has no network
 * access). Treat it as best-effort and confirm behaviour in a real deploy —
 * see README "Known limitations".
 */
export async function getInstagramResult(target: Extract<ParsedTarget, { platform: "instagram" }>): Promise<ThumbnailResult> {
  const embedUrl = `${target.canonicalUrl}embed/`;

  let res: Response;
  try {
    res = await fetch(embedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ThumbnailPreviewBot/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("UPSTREAM", 502, "Instagram didn't respond in time. Try again in a moment.");
  }
  // Discard the body deliberately — we never read, parse or store it.
  await res.body?.cancel();

  if (res.status === 429 || res.status >= 500) {
    throw new ApiError("UPSTREAM", 503, "Instagram is limiting requests right now. Try again shortly.");
  }
  // Instagram serves 200 with an in-page error message for private/missing
  // posts rather than a clean 404, so a non-2xx here is a strong signal but
  // not the only one — see the module docstring on live-verification.
  if (!res.ok) {
    throw new ApiError("NOT_PUBLIC", 404);
  }

  return {
    platform: "instagram",
    id: target.id,
    sourceUrl: target.canonicalUrl,
    variants: [],
    embedUrl,
  };
}
