import { describe, expect, it } from "vitest";
import { createSignedFilePath, deriveFileUrlKey, verifyFileSignature } from "@/server/signed-url";

const key = deriveFileUrlKey("x".repeat(40));
const objectKey = "charts/user_1/0b1c-uuid.png";
const now = Date.UTC(2026, 10, 9, 12, 0, 0);

function parse(path: string) {
  const url = new URL(path, "https://example.com");
  const keyPart = url.pathname
    .replace("/api/files/", "")
    .split("/")
    .map(decodeURIComponent)
    .join("/");
  return { keyPart, exp: url.searchParams.get("exp"), sig: url.searchParams.get("sig") };
}

describe("signed file links", () => {
  it("round-trips a valid link", () => {
    const { keyPart, exp, sig } = parse(createSignedFilePath(objectKey, 300, key, now));
    expect(keyPart).toBe(objectKey);
    expect(verifyFileSignature(keyPart, exp, sig, key, now + 299_000)).toBe("ok");
  });

  it("expires after the TTL", () => {
    const { exp, sig } = parse(createSignedFilePath(objectKey, 300, key, now));
    expect(verifyFileSignature(objectKey, exp, sig, key, now + 301_000)).toBe("expired");
  });

  it("rejects a link reused for a different file", () => {
    const { exp, sig } = parse(createSignedFilePath(objectKey, 300, key, now));
    expect(verifyFileSignature("charts/user_2/other.png", exp, sig, key, now)).toBe("invalid");
  });

  it("rejects an extended expiry", () => {
    const { exp, sig } = parse(createSignedFilePath(objectKey, 300, key, now));
    expect(verifyFileSignature(objectKey, String(Number(exp) + 86_400), sig, key, now)).toBe(
      "invalid",
    );
  });

  it("rejects links signed with a different secret", () => {
    const other = deriveFileUrlKey("y".repeat(40));
    const { exp, sig } = parse(createSignedFilePath(objectKey, 300, other, now));
    expect(verifyFileSignature(objectKey, exp, sig, key, now)).toBe("invalid");
  });

  it("rejects missing or malformed parameters", () => {
    expect(verifyFileSignature(objectKey, null, "abc", key, now)).toBe("invalid");
    expect(verifyFileSignature(objectKey, "123", null, key, now)).toBe("invalid");
    expect(verifyFileSignature(objectKey, "12abc", "abc", key, now)).toBe("invalid");
  });
});
