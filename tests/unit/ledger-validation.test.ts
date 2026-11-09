import { describe, expect, it } from "vitest";
import { validateEntry } from "@/features/credits/server/ledger.service";

describe("ledger entry validation", () => {
  it("rejects zero and fractional deltas", () => {
    expect(() =>
      validateEntry({ userId: "u", delta: 0, reason: "PURCHASE", referenceId: "p" }),
    ).toThrow();
    expect(() =>
      validateEntry({ userId: "u", delta: 1.5, reason: "PURCHASE", referenceId: "p" }),
    ).toThrow();
  });

  it("enforces the sign of each reason", () => {
    expect(() =>
      validateEntry({ userId: "u", delta: -1, reason: "SIGNUP_BONUS", referenceId: "u" }),
    ).toThrow();
    expect(() =>
      validateEntry({ userId: "u", delta: 1, reason: "ANALYSIS", referenceId: "a" }),
    ).toThrow();
    expect(() =>
      validateEntry({ userId: "u", delta: -1, reason: "REFUND", referenceId: "a" }),
    ).toThrow();
  });

  it("requires a referenceId except for admin adjustments", () => {
    expect(() =>
      validateEntry({ userId: "u", delta: 5, reason: "PURCHASE", referenceId: null }),
    ).toThrow();
    expect(() =>
      validateEntry({ userId: "u", delta: -2, reason: "ADMIN_ADJUST", referenceId: null }),
    ).not.toThrow();
  });
});
