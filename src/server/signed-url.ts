import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Short-lived signed links for privately stored files, equivalent to S3
 * presigned URLs: anyone holding the link can read that one file until it
 * expires; nothing else is reachable.
 */

const PREFIX = "/api/files/";

/** Derive a dedicated key so file links can't be confused with other HMAC uses of the secret. */
export function deriveFileUrlKey(appSecret: string): Buffer {
  return createHmac("sha256", appSecret).update("chartsense:file-urls:v1").digest();
}

function signature(key: Buffer, objectKey: string, exp: number): string {
  return createHmac("sha256", key).update(`${objectKey}\n${exp}`).digest("base64url");
}

export function createSignedFilePath(
  objectKey: string,
  ttlSeconds: number,
  key: Buffer,
  nowMs: number = Date.now(),
): string {
  const exp = Math.floor(nowMs / 1000) + ttlSeconds;
  const path = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${PREFIX}${path}?exp=${exp}&sig=${signature(key, objectKey, exp)}`;
}

export type SignatureCheck = "ok" | "expired" | "invalid";

export function verifyFileSignature(
  objectKey: string,
  expRaw: string | null,
  sig: string | null,
  key: Buffer,
  nowMs: number = Date.now(),
): SignatureCheck {
  if (!expRaw || !sig || !/^\d{1,12}$/.test(expRaw)) return "invalid";
  const exp = Number(expRaw);
  const expected = Buffer.from(signature(key, objectKey, exp));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "invalid";
  if (exp < Math.floor(nowMs / 1000)) return "expired";
  return "ok";
}
