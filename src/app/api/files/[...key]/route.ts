import { DatabaseStorage, fileUrlKey } from "@/server/storage";
import { db } from "@/server/db";
import { errorResponse } from "@/server/http";
import { verifyFileSignature } from "@/server/signed-url";

/**
 * Serves a privately stored file (STORAGE_DRIVER=database) to holders of a
 * valid, unexpired signed link, the same contract as an S3 presigned URL.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/files/[...key]">) {
  const { key: parts } = await ctx.params;
  const objectKey = parts.map((p) => decodeURIComponent(p)).join("/");
  const { searchParams } = new URL(req.url);
  const exp = searchParams.get("exp");

  const check = verifyFileSignature(objectKey, exp, searchParams.get("sig"), fileUrlKey());
  if (check === "expired") return errorResponse("FORBIDDEN", "This image link has expired.");
  if (check === "invalid") return errorResponse("FORBIDDEN", "Invalid image link.");

  const file = await new DatabaseStorage(db, fileUrlKey()).read(objectKey);
  if (!file) return errorResponse("NOT_FOUND", "Image not found.");

  const remaining = Math.max(0, Number(exp) - Math.floor(Date.now() / 1000));
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.size),
      // Browser may cache only until the link expires; never shared caches.
      "Cache-Control": `private, max-age=${remaining}`,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Referrer-Policy": "no-referrer",
    },
  });
}
