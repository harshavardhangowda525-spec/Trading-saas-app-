import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, type ApiErrorBody, type ErrorCode, ERROR_CODES } from "./errors";

export function errorResponse(code: ErrorCode, message: string): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status: ERROR_CODES[code] });
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Same-origin check for state-changing requests. Auth.js protects its own
 * routes; this covers ours. Webhooks opt out with `{ sameOrigin: false }`.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response>;

/** Wraps a route handler: origin check + consistent `{ error: { code, message } }` responses. */
export function route<Ctx>(
  handler: Handler<Ctx>,
  options: { sameOrigin?: boolean } = {},
): Handler<Ctx> {
  const sameOrigin = options.sameOrigin ?? true;
  return async (req, ctx) => {
    try {
      if (sameOrigin && !SAFE_METHODS.has(req.method) && !isSameOrigin(req)) {
        return errorResponse("FORBIDDEN", "Cross-origin request blocked.");
      }
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof AppError) return errorResponse(e.code, e.message);
      if (e instanceof ZodError) {
        return errorResponse("VALIDATION_ERROR", e.issues[0]?.message ?? "Invalid request.");
      }
      console.error("[api] unhandled error", e);
      return errorResponse("INTERNAL", "Something went wrong. Please try again.");
    }
  };
}

/** Parses a JSON body; malformed JSON becomes a VALIDATION_ERROR. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be valid JSON.");
  }
}
