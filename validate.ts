import { MESSAGES } from "./messages";
import type { ErrorCode, Platform } from "./types";

export type ParsedTarget =
  | { platform: "youtube"; id: string; canonicalUrl: string }
  | { platform: "instagram"; id: string; kind: "p" | "reel" | "tv"; canonicalUrl: string };

export type ParseResult =
  | { ok: true; target: ParsedTarget }
  | { ok: false; code: ErrorCode; message: string };

const MAX_LEN = 2048;
const YT_HOSTS = new Set([
  "youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be",
  "youtube-nocookie.com", "www.youtube-nocookie.com",
]);
const IG_HOSTS = new Set(["instagram.com", "www.instagram.com"]);
export const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const IG_CODE = /^[A-Za-z0-9_-]{5,30}$/;

const fail = (code: ErrorCode): ParseResult => ({ ok: false, code, message: MESSAGES[code] });

function toUrl(raw: string): URL | null {
  let input = raw.trim();
  if (!input || input.length > MAX_LEN || /[\u0000-\u001f\u007f\s]/.test(input)) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) input = `https://${input}`;
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

/** Lightweight, UI-only hint. The server always re-validates with parseMediaUrl. */
export function detectPlatform(raw: string): Platform | null {
  const url = toUrl(raw);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  if (YT_HOSTS.has(host)) return "youtube";
  if (IG_HOSTS.has(host)) return "instagram";
  return null;
}

export function parseMediaUrl(raw: unknown): ParseResult {
  if (typeof raw !== "string") return fail("BAD_REQUEST");
  const trimmed = raw.trim();
  if (!trimmed) return fail("EMPTY");
  if (trimmed.length > MAX_LEN) return fail("TOO_LONG");

  const url = toUrl(trimmed);
  if (!url) return fail("INVALID_URL");
  if (url.protocol !== "https:" && url.protocol !== "http:") return fail("INVALID_URL");
  if (url.username || url.password) return fail("INVALID_URL");
  if (url.port) return fail("INVALID_URL");

  const host = url.hostname.toLowerCase();
  const segs = url.pathname.split("/").filter(Boolean);

  if (YT_HOSTS.has(host)) return parseYouTube(segs, url);
  if (IG_HOSTS.has(host)) return parseInstagram(segs);
  return fail("UNSUPPORTED_HOST");
}

function parseYouTube(segs: string[], url: URL): ParseResult {
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (host === "youtu.be") id = segs[0] ?? null;
  else if (segs[0] === "watch") id = url.searchParams.get("v");
  else if (["shorts", "embed", "live", "v"].includes(segs[0] ?? "")) id = segs[1] ?? null;

  if (!id || !YT_ID.test(id)) return fail("UNSUPPORTED_PATH");
  return { ok: true, target: { platform: "youtube", id, canonicalUrl: `https://www.youtube.com/watch?v=${id}` } };
}

function parseInstagram(segs: string[]): ParseResult {
  if (segs[0] === "stories") return fail("UNSUPPORTED_PATH");

  // /p/CODE, /reel/CODE, /tv/CODE  or  /<username>/p|reel/CODE
  const offset = segs.length >= 3 ? 1 : 0;
  const kindRaw = segs[offset];
  const code = segs[offset + 1];
  const kind = kindRaw === "reels" ? "reel" : kindRaw;

  if ((kind !== "p" && kind !== "reel" && kind !== "tv") || !code || !IG_CODE.test(code)) {
    return fail("UNSUPPORTED_PATH");
  }
  return {
    ok: true,
    target: { platform: "instagram", id: code, kind, canonicalUrl: `https://www.instagram.com/${kind}/${code}/` },
  };
}
