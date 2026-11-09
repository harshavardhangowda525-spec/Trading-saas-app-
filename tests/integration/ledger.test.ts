import { afterAll, describe, expect, it } from "vitest";
import { appendLedgerEntry } from "@/features/credits/server/ledger.service";
import { createTestClient, createTestUser, testDbUrl } from "./db";

describe.skipIf(!testDbUrl)("credit ledger (integration)", () => {
  const db = createTestClient();

  afterAll(async () => {
    await db.user.deleteMany({ where: { email: { endsWith: "@integration.test" } } });
    await db.$disconnect();
  });

  it("adds credits and records balanceAfter", async () => {
    const user = await createTestUser(db);
    const res = await appendLedgerEntry(db, {
      userId: user.id,
      delta: 5,
      reason: "PURCHASE",
      referenceId: `pay_${user.id}`,
    });
    expect(res).toEqual({ applied: true, balance: 5 });
    const rows = await db.creditLedger.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.balanceAfter).toBe(5);
  });

  it("is idempotent on (reason, referenceId)", async () => {
    const user = await createTestUser(db);
    const entry = {
      userId: user.id,
      delta: 1,
      reason: "SIGNUP_BONUS" as const,
      referenceId: user.id,
    };
    await appendLedgerEntry(db, entry);
    const second = await appendLedgerEntry(db, entry);
    expect(second).toEqual({ applied: false, balance: 1 });
  });

  it("stays idempotent under concurrent duplicate requests", async () => {
    const user = await createTestUser(db);
    const entry = {
      userId: user.id,
      delta: 25,
      reason: "PURCHASE" as const,
      referenceId: `pay_c_${user.id}`,
    };
    const results = await Promise.all(
      Array.from({ length: 5 }, () => appendLedgerEntry(db, entry)),
    );
    expect(results.filter((r) => r.applied)).toHaveLength(1);
    const fresh = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(fresh.creditBalance).toBe(25);
    expect(await db.creditLedger.count({ where: { userId: user.id } })).toBe(1);
  });

  it("never lets the balance go negative, even concurrently", async () => {
    const user = await createTestUser(db);
    await appendLedgerEntry(db, {
      userId: user.id,
      delta: 1,
      reason: "SIGNUP_BONUS",
      referenceId: user.id,
    });

    const attempts = await Promise.allSettled(
      Array.from({ length: 4 }, (_, i) =>
        appendLedgerEntry(db, {
          userId: user.id,
          delta: -1,
          reason: "ANALYSIS",
          referenceId: `analysis_${i}_${user.id}`,
        }),
      ),
    );
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(1);
    const rejected = attempts.filter((a) => a.status === "rejected");
    expect(rejected).toHaveLength(3);
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toMatchObject({ code: "INSUFFICIENT_CREDITS" });
    }
    const fresh = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(fresh.creditBalance).toBe(0);
  });

  it("keeps the cached balance equal to the ledger sum", async () => {
    const user = await createTestUser(db);
    await appendLedgerEntry(db, {
      userId: user.id,
      delta: 5,
      reason: "PURCHASE",
      referenceId: `p1_${user.id}`,
    });
    await appendLedgerEntry(db, {
      userId: user.id,
      delta: -1,
      reason: "ANALYSIS",
      referenceId: `a1_${user.id}`,
    });
    await appendLedgerEntry(db, {
      userId: user.id,
      delta: 1,
      reason: "REFUND",
      referenceId: `a1_${user.id}`,
    });
    await appendLedgerEntry(db, {
      userId: user.id,
      delta: -2,
      reason: "ADMIN_ADJUST",
      referenceId: null,
    });

    const sum = await db.creditLedger.aggregate({
      where: { userId: user.id },
      _sum: { delta: true },
    });
    const fresh = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(fresh.creditBalance).toBe(3);
    expect(sum._sum.delta).toBe(3);
  });
});
