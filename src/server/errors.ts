export const ERROR_CODES = {
  UNAUTHENTICATED: 401,
  TERMS_NOT_ACCEPTED: 403,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  TERMS_OUTDATED: 409,
  INSUFFICIENT_CREDITS: 402,
  RATE_LIMITED: 429,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/** Shape of every API error response (Section 12). */
export type ApiErrorBody = { error: { code: ErrorCode; message: string } };

/** Expected, user-presentable error. Anything else is treated as INTERNAL. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_CODES[code];
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
