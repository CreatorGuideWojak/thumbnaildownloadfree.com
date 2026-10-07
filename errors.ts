import { MESSAGES } from "./messages";
import type { ErrorCode } from "./types";

export class ApiError extends Error {
  constructor(public code: ErrorCode, public status: number, message: string = MESSAGES[code]) {
    super(message);
    this.name = "ApiError";
  }
}
