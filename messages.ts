import type { ErrorCode } from "./types";

/** Single source of truth for every user-facing error message. */
const INVALID = "Please enter a valid YouTube or Instagram URL.";
const UNAVAILABLE = "We couldn't retrieve a thumbnail from this URL.";

export const MESSAGES: Record<ErrorCode, string> = {
  EMPTY: INVALID,
  TOO_LONG: INVALID,
  INVALID_URL: INVALID,
  UNSUPPORTED_HOST: INVALID,
  BAD_REQUEST: INVALID,
  UNSUPPORTED_PATH: "This URL format is not currently supported.",
  NOT_FOUND: UNAVAILABLE,
  UPSTREAM: UNAVAILABLE,
  TOO_LARGE: UNAVAILABLE,
  NOT_PUBLIC: "This Instagram content may be private or unavailable.",
  RATE_LIMITED: "Too many requests. Please try again shortly.",
  FORBIDDEN: "This request isn't allowed.",
  INTERNAL: "Something went wrong on our side. Please try again.",
};
