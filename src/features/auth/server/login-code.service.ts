import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";

export const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;
export const LOGIN_CODE_MAX_ATTEMPTS = 5;

export type LoginCodeKeys = { hmacKey: Buffer; encKey: Buffer };

/** Separate keys derived from AUTH_SECRET so this feature can't be confused with other uses. */
export function deriveLoginCodeKeys(appSecret: string): LoginCodeKeys {
  return {
    hmacKey: createHmac("sha256", appSecret).update("chartsense:login-code:hmac:v1").digest(),
    encKey: createHmac("sha256", appSecret).update("chartsense:login-code:enc:v1").digest(),
  };
}

export function hashNonce(nonce: string): string {
  return createHash("sha256").update(nonce).digest("hex");
}

function hashCode(keys: LoginCodeKeys, nonceHash: string, code: string): string {
  return createHmac("sha256", keys.hmacKey).update(`${nonceHash}:${code}`).digest("hex");
}

function encrypt(keys: LoginCodeKeys, plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keys.encKey, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ct].map((b) => b.toString("base64url")).join(".");
}

function decrypt(keys: LoginCodeKeys, payload: string): string {
  const [iv, tag, ct] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  if (!iv || !tag || !ct) throw new Error("Malformed login code payload");
  const decipher = createDecipheriv("aes-256-gcm", keys.encKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Creates a code for this browser (nonce) and returns it for the email. */
export async function createLoginCode(
  db: PrismaClient,
  keys: LoginCodeKeys,
  input: { email: string; nonce: string; magicLink: string; now?: Date },
): Promise<string> {
  const now = input.now ?? new Date();
  const code = generateCode();
  const nonceHash = hashNonce(input.nonce);
  await db.loginCode.create({
    data: {
      email: input.email,
      nonceHash,
      codeHash: hashCode(keys, nonceHash, code),
      linkCipher: encrypt(keys, input.magicLink),
      expiresAt: new Date(now.getTime() + LOGIN_CODE_TTL_MS),
    },
  });
  // Opportunistic cleanup of old rows.
  if (Math.random() < 0.05) {
    void db.loginCode
      .deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 86_400_000) } } })
      .catch(() => undefined);
  }
  return code;
}

export type VerifyResult =
  | { ok: true; magicLink: string; email: string }
  | { ok: false; reason: "NO_CODE" | "EXPIRED" | "LOCKED" | "WRONG"; attemptsLeft?: number };

/**
 * Checks a typed code against the most recent code requested from this browser.
 * Wrong codes count against a small attempt budget; success is single-use.
 */
export async function verifyLoginCode(
  db: PrismaClient,
  keys: LoginCodeKeys,
  input: { nonce: string; code: string; now?: Date },
): Promise<VerifyResult> {
  const now = input.now ?? new Date();
  const nonceHash = hashNonce(input.nonce);
  const row = await db.loginCode.findFirst({
    where: { nonceHash, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return { ok: false, reason: "NO_CODE" };
  if (row.expiresAt <= now) return { ok: false, reason: "EXPIRED" };
  if (row.attempts >= LOGIN_CODE_MAX_ATTEMPTS) return { ok: false, reason: "LOCKED" };

  const expected = Buffer.from(row.codeHash, "hex");
  const given = Buffer.from(hashCode(keys, nonceHash, input.code), "hex");
  if (!timingSafeEqual(expected, given)) {
    // Atomic increment that cannot exceed the budget under concurrent guesses.
    const bumped = await db.loginCode.updateMany({
      where: { id: row.id, attempts: { lt: LOGIN_CODE_MAX_ATTEMPTS }, consumedAt: null },
      data: { attempts: { increment: 1 } },
    });
    if (bumped.count === 0) return { ok: false, reason: "LOCKED" };
    const attemptsLeft = LOGIN_CODE_MAX_ATTEMPTS - (row.attempts + 1);
    return attemptsLeft <= 0
      ? { ok: false, reason: "LOCKED" }
      : { ok: false, reason: "WRONG", attemptsLeft };
  }

  // Single use: only one concurrent request can consume it.
  const consumed = await db.loginCode.updateMany({
    where: { id: row.id, consumedAt: null, attempts: { lt: LOGIN_CODE_MAX_ATTEMPTS } },
    data: { consumedAt: now },
  });
  if (consumed.count === 0) return { ok: false, reason: "NO_CODE" };
  return { ok: true, magicLink: decrypt(keys, row.linkCipher), email: row.email };
}
