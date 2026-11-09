import { afterAll, describe, expect, it } from "vitest";
import { consumeRateLimit } from "@/server/rate-limit";
import { createTestClient, testDbUrl } from "./db";

describe.skipIf(!testDbUrl)("rate limiter (integration)", () => {
  const db = createTestClient();
  const prefix = `test:${Date.now()}:`;

  afterAll(async () => {
    await db.rateLimit.deleteMany({ where: { key: { startsWith: prefix } } });
    await db.$disconnect();
  });

  it("allows up to the limit, then blocks", async () => {
    const key = `${prefix}basic`;
    const now = new Date("2026-11-09T10:15:00Z");
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await consumeRateLimit(db, key, 3, 60_000, now));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[2]?.remaining).toBe(0);
  });

  it("is exact under concurrency", async () => {
    const key = `${prefix}concurrent`;
    const now = new Date("2026-11-09T10:15:00Z");
    const results = await Promise.all(
      Array.from({ length: 20 }, () => consumeRateLimit(db, key, 5, 60_000, now)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  it("resets in the next window", async () => {
    const key = `${prefix}window`;
    await consumeRateLimit(db, key, 1, 60_000, new Date("2026-11-09T10:15:10Z"));
    const blocked = await consumeRateLimit(db, key, 1, 60_000, new Date("2026-11-09T10:15:50Z"));
    const next = await consumeRateLimit(db, key, 1, 60_000, new Date("2026-11-09T10:16:01Z"));
    expect(blocked.allowed).toBe(false);
    expect(next.allowed).toBe(true);
    expect(blocked.resetAt.toISOString()).toBe("2026-11-09T10:16:00.000Z");
  });
});
