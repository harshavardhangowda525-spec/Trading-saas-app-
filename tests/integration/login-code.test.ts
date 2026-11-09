import { afterAll, describe, expect, it } from "vitest";
import {
  createLoginCode,
  deriveLoginCodeKeys,
  LOGIN_CODE_MAX_ATTEMPTS,
  verifyLoginCode,
} from "@/features/auth/server/login-code.service";
import { createTestClient, testDbUrl } from "./db";

describe.skipIf(!testDbUrl)("6-digit sign-in codes (integration)", () => {
  const db = createTestClient();
  const keys = deriveLoginCodeKeys("s".repeat(40));
  const email = "code-test@integration.test";
  const link = "https://app.example.com/api/auth/callback/resend?token=abc&email=x";
  const nonce = () => `nonce-${Math.random().toString(36).slice(2)}`;
  const wrong = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, "0");

  afterAll(async () => {
    await db.loginCode.deleteMany({ where: { email } });
    await db.$disconnect();
  });

  it("returns the magic link for the right code in the requesting browser", async () => {
    const n = nonce();
    const code = await createLoginCode(db, keys, { email, nonce: n, magicLink: link });
    expect(code).toMatch(/^\d{6}$/);
    await expect(verifyLoginCode(db, keys, { nonce: n, code })).resolves.toEqual({
      ok: true,
      magicLink: link,
      email,
    });
  });

  it("never stores the code or link in plain text", async () => {
    const n = nonce();
    const code = await createLoginCode(db, keys, { email, nonce: n, magicLink: link });
    const row = await db.loginCode.findFirstOrThrow({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
    expect(JSON.stringify(row)).not.toContain(code);
    expect(row.linkCipher).not.toContain("token=abc");
    expect(row.nonceHash).not.toBe(n);
  });

  it("is single-use", async () => {
    const n = nonce();
    const code = await createLoginCode(db, keys, { email, nonce: n, magicLink: link });
    await verifyLoginCode(db, keys, { nonce: n, code });
    await expect(verifyLoginCode(db, keys, { nonce: n, code })).resolves.toMatchObject({
      ok: false,
      reason: "NO_CODE",
    });
  });

  it("does not work from a different browser (different nonce)", async () => {
    const code = await createLoginCode(db, keys, { email, nonce: nonce(), magicLink: link });
    await expect(verifyLoginCode(db, keys, { nonce: nonce(), code })).resolves.toMatchObject({
      ok: false,
      reason: "NO_CODE",
    });
  });

  it("locks after too many wrong attempts, even for the right code", async () => {
    const n = nonce();
    const code = await createLoginCode(db, keys, { email, nonce: n, magicLink: link });
    const results = [];
    for (let i = 0; i < LOGIN_CODE_MAX_ATTEMPTS; i++) {
      results.push(await verifyLoginCode(db, keys, { nonce: n, code: wrong(code) }));
    }
    expect(results[0]).toMatchObject({
      reason: "WRONG",
      attemptsLeft: LOGIN_CODE_MAX_ATTEMPTS - 1,
    });
    expect(results.at(-1)).toMatchObject({ reason: "LOCKED" });
    await expect(verifyLoginCode(db, keys, { nonce: n, code })).resolves.toMatchObject({
      ok: false,
      reason: "LOCKED",
    });
  });

  it("caps attempts under concurrent guessing", async () => {
    const n = nonce();
    const code = await createLoginCode(db, keys, { email, nonce: n, magicLink: link });
    await Promise.all(
      Array.from({ length: 20 }, () => verifyLoginCode(db, keys, { nonce: n, code: wrong(code) })),
    );
    const row = await db.loginCode.findFirstOrThrow({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
    expect(row.attempts).toBe(LOGIN_CODE_MAX_ATTEMPTS);
  });

  it("expires after 10 minutes", async () => {
    const n = nonce();
    const issued = new Date("2026-11-09T10:00:00Z");
    const code = await createLoginCode(db, keys, { email, nonce: n, magicLink: link, now: issued });
    await expect(
      verifyLoginCode(db, keys, { nonce: n, code, now: new Date("2026-11-09T10:10:01Z") }),
    ).resolves.toMatchObject({ ok: false, reason: "EXPIRED" });
  });

  it("uses the latest code when several were requested", async () => {
    const n = nonce();
    const first = await createLoginCode(db, keys, { email, nonce: n, magicLink: `${link}&n=1` });
    const second = await createLoginCode(db, keys, { email, nonce: n, magicLink: `${link}&n=2` });
    if (first !== second) {
      await expect(verifyLoginCode(db, keys, { nonce: n, code: first })).resolves.toMatchObject({
        reason: "WRONG",
      });
    }
    await expect(verifyLoginCode(db, keys, { nonce: n, code: second })).resolves.toMatchObject({
      ok: true,
      magicLink: `${link}&n=2`,
    });
  });
});
