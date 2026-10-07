import { ApiError } from "./errors";
import { makeTtlCache } from "./cache";
import { readJpegSize } from "./jpeg";
import { readLimited } from "./stream";
import type { ThumbnailResult, ThumbnailVariant } from "./types";

export type QualityKey = "maxres" | "sd" | "hq" | "mq" | "default";

type Quality = { key: QualityKey; file: string; word: string; width: number; height: number };

// Nominal (documented) size per YouTube thumbnail filename, used as a fallback
// if the JPEG header can't be parsed. maxresdefault is only generated for
// some videos; we probe for it and fall back to whichever smaller size exists.
const QUALITIES: Quality[] = [
  { key: "maxres", file: "maxresdefault.jpg", word: "Maximum", width: 1280, height: 720 },
  { key: "sd", file: "sddefault.jpg", word: "Standard", width: 640, height: 480 },
  { key: "hq", file: "hqdefault.jpg", word: "High", width: 480, height: 360 },
  { key: "mq", file: "mqdefault.jpg", word: "Medium", width: 320, height: 180 },
  { key: "default", file: "default.jpg", word: "Small", width: 120, height: 90 },
];

export function findQuality(key: string | null): Quality | undefined {
  return QUALITIES.find((q) => q.key === key);
}

export function youtubeImageUrl(id: string, file: string): string {
  return `https://i.ytimg.com/vi/${id}/${file}`;
}

const dl = (id: string, key: string) => `/api/download?id=${id}&q=${key}`;

type CachedResult = { variants: ThumbnailVariant[]; title?: string; author?: string };
const cache = makeTtlCache<CachedResult>(10 * 60 * 1000); // 10 min

const PROBE_BYTES = 32 * 1024; // enough to reach a JPEG's SOF marker

type ProbeHit = { ok: true; url: string; width: number; height: number };
type ProbeMiss = { ok: false; networkError: boolean };
type ProbeResult = ProbeHit | ProbeMiss;

function isHit(p: ProbeResult): p is ProbeHit {
  return p.ok;
}

/** GETs (not HEADs) each size, since we need real bytes to read the JPEG's actual dimensions. */
async function probe(id: string, q: Quality): Promise<ProbeResult> {
  const url = youtubeImageUrl(id, q.file);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "image/jpeg", Range: `bytes=0-${PROBE_BYTES - 1}` },
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
  } catch {
    return { ok: false, networkError: true };
  }

  if (res.status !== 200 && res.status !== 206) {
    await res.body?.cancel();
    return { ok: false, networkError: false };
  }
  if (!(res.headers.get("content-type") ?? "").toLowerCase().startsWith("image/jpeg")) {
    await res.body?.cancel();
    return { ok: false, networkError: false };
  }

  const { bytes } = await readLimited(res, PROBE_BYTES);
  const size = readJpegSize(bytes) ?? { width: q.width, height: q.height };

  // YouTube serves a generic 120×90 placeholder with a 200 status (not a 404)
  // under maxres/sd/hq/mq filenames when that size doesn't actually exist for
  // the video — only "default" is legitimately that size. Without this check
  // every quality would look "available" even when only the placeholder exists.
  if (q.key !== "default" && size.width === 120 && size.height === 90) {
    return { ok: false, networkError: false };
  }

  return { ok: true, url, width: size.width, height: size.height };
}

/** Best-effort title/author from YouTube's public oEmbed endpoint (no key needed). */
async function fetchMeta(canonicalUrl: string): Promise<{ title?: string; author?: string }> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(canonicalUrl)}`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) return {};
    const j = (await res.json()) as { title?: unknown; author_name?: unknown };
    return {
      title: typeof j.title === "string" ? j.title.slice(0, 200) : undefined,
      author: typeof j.author_name === "string" ? j.author_name.slice(0, 100) : undefined,
    };
  } catch {
    return {};
  }
}

export async function getYouTubeThumbnails(id: string, canonicalUrl: string): Promise<ThumbnailResult> {
  const cached = cache.get(id);
  if (cached) return { platform: "youtube", id, sourceUrl: canonicalUrl, ...cached };

  const [probes, meta] = await Promise.all([
    Promise.all(QUALITIES.map(async (q) => ({ q, result: await probe(id, q) }))),
    fetchMeta(canonicalUrl),
  ]);

  const hits = probes.filter((p): p is { q: Quality; result: ProbeHit } => isHit(p.result));

  if (!hits.length) {
    const allNetworkErrors = probes.every((p) => !p.result.ok && p.result.networkError);
    if (allNetworkErrors) throw new ApiError("UPSTREAM", 502);
    throw new ApiError("NOT_FOUND", 404);
  }

  const variants: ThumbnailVariant[] = hits.map(({ q, result }, i) => ({
    key: q.key,
    quality: i === 0 ? "Maximum Available" : q.word,
    width: result.width,
    height: result.height,
    url: result.url,
    downloadUrl: dl(id, q.key),
    filename: `youtube-${id}-${q.key}.jpg`,
  }));

  const result: CachedResult = { variants, ...meta };
  cache.set(id, result);
  return { platform: "youtube", id, sourceUrl: canonicalUrl, ...result };
}
