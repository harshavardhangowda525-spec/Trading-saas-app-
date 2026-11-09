import { describe, expect, it } from "vitest";
import { CONCEPTS, conceptForDate } from "@/features/learn/concepts";

describe("concept of the day", () => {
  it("is stable within an IST day and changes the next day", () => {
    const morning = conceptForDate(new Date("2026-11-09T01:00:00+05:30"));
    const night = conceptForDate(new Date("2026-11-09T23:30:00+05:30"));
    const nextDay = conceptForDate(new Date("2026-11-10T01:00:00+05:30"));
    expect(morning).toBe(night);
    expect(nextDay).not.toBe(morning);
  });

  it("never uses banned hype words", () => {
    const banned = /guarantee|sure shot|100%|risk-free|can't lose|jackpot/i;
    for (const c of CONCEPTS) {
      expect(`${c.term} ${c.explanation} ${c.tip}`).not.toMatch(banned);
    }
  });
});
