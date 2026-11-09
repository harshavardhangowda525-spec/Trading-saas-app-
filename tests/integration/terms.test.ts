import { afterAll, describe, expect, it } from "vitest";
import { acceptTerms } from "@/features/onboarding/server/terms.service";
import { TERMS_VERSION } from "@/lib/legal";
import { createTestClient, createTestUser, testDbUrl } from "./db";

describe.skipIf(!testDbUrl)("terms acceptance (integration)", () => {
  const db = createTestClient();

  afterAll(async () => {
    await db.user.deleteMany({ where: { email: { endsWith: "@integration.test" } } });
    await db.$disconnect();
  });

  const input = (userId: string) => ({
    userId,
    version: TERMS_VERSION,
    ipHash: "h",
    userAgent: "ua",
  });

  it("records acceptance and grants the signup bonus exactly once", async () => {
    const user = await createTestUser(db);
    const first = await acceptTerms(db, input(user.id), { signupCredits: 1 });
    const again = await acceptTerms(db, input(user.id), { signupCredits: 1 });

    expect(first).toEqual({ balance: 1, bonusGranted: true });
    expect(again).toEqual({ balance: 1, bonusGranted: false });

    const fresh = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(fresh.termsVersion).toBe(TERMS_VERSION);
    expect(fresh.termsAcceptedAt).not.toBeNull();
    expect(await db.termsAcceptance.count({ where: { userId: user.id } })).toBe(1);
  });

  it("grants nothing when the free credit is disabled", async () => {
    const user = await createTestUser(db);
    const res = await acceptTerms(db, input(user.id), { signupCredits: 0 });
    expect(res).toEqual({ balance: 0, bonusGranted: false });
  });

  it("rejects an outdated terms version", async () => {
    const user = await createTestUser(db);
    await expect(
      acceptTerms(db, { ...input(user.id), version: "1999-01-01" }, { signupCredits: 1 }),
    ).rejects.toMatchObject({ code: "TERMS_OUTDATED" });
  });
});
