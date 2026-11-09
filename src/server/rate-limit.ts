import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: Date };

/**
 * Fixed-window counter in Postgres. One atomic upsert per call, safe under
 * concurrency. Good enough for MVP traffic; swap for Upstash when needed.
 */
export async function consumeRateLimit(
  client: PrismaClient,
  key: string,
  limit: number,
  windowMs: number,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const rows = await client.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart")
    DO UPDATE SET "count" = "RateLimit"."count" + 1
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? limit + 1);

  // Opportunistic cleanup of stale windows (~1% of calls).
  if (Math.random() < 0.01) {
    void client.rateLimit
      .deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 86_400_000) } } })
      .catch(() => undefined);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: new Date(windowStart.getTime() + windowMs),
  };
}
