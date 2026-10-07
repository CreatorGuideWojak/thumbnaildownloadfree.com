import { ApiError } from "./errors";
import { readLimited } from "./stream";
import { findQuality, youtubeImageUrl } from "./youtube";
import { YT_ID } from "./validate";

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Downloads a YouTube thumbnail for the download endpoint.
 * The caller supplies a video ID and a quality key; the URL is built here from
 * a fixed host and file list, so no caller-supplied URL is ever fetched — this
 * is why the endpoint takes ?id=&q= rather than a raw image URL.
 */
export async function fetchYouTubeImage(id: string | null, qualityKey: string | null) {
  const quality = findQuality(qualityKey);
  if (!id || !YT_ID.test(id) || !quality) throw new ApiError("BAD_REQUEST", 400);

  let upstream: Response;
  try {
    upstream = await fetch(youtubeImageUrl(id, quality.file), {
      headers: { Accept: "image/jpeg" },
      redirect: "manual", // never follow a redirect off the allowed host
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("UPSTREAM", 502);
  }

  if (upstream.status !== 200) {
    await upstream.body?.cancel();
    throw new ApiError("NOT_FOUND", 404);
  }
  if (!(upstream.headers.get("content-type") ?? "").toLowerCase().startsWith("image/jpeg")) {
    await upstream.body?.cancel();
    throw new ApiError("UPSTREAM", 502);
  }
  if (Number(upstream.headers.get("content-length") ?? 0) > MAX_BYTES) {
    await upstream.body?.cancel();
    throw new ApiError("TOO_LARGE", 413);
  }

  const { bytes, truncated } = await readLimited(upstream, MAX_BYTES);
  if (truncated) throw new ApiError("TOO_LARGE", 413);

  return { bytes, contentType: "image/jpeg", filename: `youtube-${id}-${quality.key}.jpg` };
}
