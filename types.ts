export type Platform = "youtube" | "instagram";

export type ErrorCode =
  | "EMPTY" | "TOO_LONG" | "INVALID_URL" | "UNSUPPORTED_HOST" | "UNSUPPORTED_PATH"
  | "NOT_FOUND" | "NOT_PUBLIC" | "RATE_LIMITED" | "UPSTREAM" | "BAD_REQUEST"
  | "FORBIDDEN" | "TOO_LARGE" | "INTERNAL";

export type ThumbnailVariant = {
  key: string; // "maxres" | "sd" | "hq" | "mq" | "default"
  /** "Maximum Available" for the best size actually offered, otherwise a plain quality word. */
  quality: string;
  width: number;
  height: number;
  /** Direct, public image URL (safe to copy; not used for the download itself). */
  url: string;
  /** Same-origin proxy that streams the file as an attachment. Built from id+key only — never a raw URL. */
  downloadUrl: string;
  filename: string;
};

export type ThumbnailResult = {
  platform: Platform;
  id: string;
  sourceUrl: string;
  title?: string;
  author?: string;
  /** Always present; empty for Instagram, since there is no downloadable image for it. */
  variants: ThumbnailVariant[];
  /** Instagram's own public embed page — present only for Instagram results. */
  embedUrl?: string;
};

export type ApiErrorBody = { error: { code: ErrorCode; message: string } };
