import { describe, expect, it } from "vitest";
import { isAdminEmail, isDisposableEmail, normalizeEmail } from "@/features/auth/email-rules";

describe("email rules", () => {
  it("normalises case and whitespace", () => {
    expect(normalizeEmail("  Trader@Gmail.COM ")).toBe("trader@gmail.com");
  });

  it("flags disposable domains", () => {
    expect(isDisposableEmail("x@mailinator.com")).toBe(true);
    expect(isDisposableEmail("X@YOPMAIL.COM")).toBe(true);
    expect(isDisposableEmail("x@gmail.com")).toBe(false);
  });

  it("matches admin emails case-insensitively", () => {
    expect(isAdminEmail("Founder@Example.com", ["founder@example.com"])).toBe(true);
    expect(isAdminEmail("other@example.com", ["founder@example.com"])).toBe(false);
  });
});
