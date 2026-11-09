import { describe, expect, it } from "vitest";
import { parseEnv } from "@/server/env.schema";

const base = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(32),
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  IP_HASH_SALT: "salt-salt",
};

describe("parseEnv", () => {
  it("applies defaults for flags and credits", () => {
    const env = parseEnv(base);
    expect(env.FEATURE_TRADE_LEVELS).toBe(false);
    expect(env.FEATURE_SHARE_LINKS).toBe(true);
    expect(env.FEATURE_FREE_CREDIT).toBe(true);
    expect(env.FREE_SIGNUP_CREDITS).toBe(1);
    expect(env.EMAIL_TRANSPORT).toBe("console");
  });

  it("parses boolean flags from strings", () => {
    const env = parseEnv({ ...base, FEATURE_TRADE_LEVELS: "true", FEATURE_FREE_CREDIT: "0" });
    expect(env.FEATURE_TRADE_LEVELS).toBe(true);
    expect(env.FEATURE_FREE_CREDIT).toBe(false);
  });

  it("rejects an invalid flag value instead of silently defaulting", () => {
    expect(() => parseEnv({ ...base, FEATURE_TRADE_LEVELS: "yes please" })).toThrow(
      /FEATURE_TRADE_LEVELS/,
    );
  });

  it("fails fast when required vars are missing", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL[\s\S]*AUTH_SECRET/);
  });

  it("treats empty strings as unset", () => {
    expect(() => parseEnv({ ...base, AUTH_SECRET: "" })).toThrow(/AUTH_SECRET/);
  });

  it("requires Google id and secret together", () => {
    expect(() => parseEnv({ ...base, AUTH_GOOGLE_ID: "id" })).toThrow(/AUTH_GOOGLE_ID/);
  });

  it("defaults to Resend on deployed environments and requires its key", () => {
    expect(() => parseEnv({ ...base, APP_ENV: "production" })).toThrow(/RESEND_API_KEY/);
    const env = parseEnv({ ...base, APP_ENV: "production", RESEND_API_KEY: "re_123" });
    expect(env.EMAIL_TRANSPORT).toBe("resend");
  });

  it("reads the deployment environment from VERCEL_ENV", () => {
    const env = parseEnv({ ...base, VERCEL_ENV: "preview", RESEND_API_KEY: "re_123" });
    expect(env.APP_ENV).toBe("preview");
    expect(env.EMAIL_TRANSPORT).toBe("resend");
  });

  it("forbids the console email transport in production", () => {
    expect(() => parseEnv({ ...base, APP_ENV: "production", EMAIL_TRANSPORT: "console" })).toThrow(
      /EMAIL_TRANSPORT/,
    );
  });

  it("allows a local production build (NODE_ENV=production) with console email", () => {
    const env = parseEnv({ ...base, NODE_ENV: "production" });
    expect(env.EMAIL_TRANSPORT).toBe("console");
  });

  it("normalises admin emails", () => {
    const env = parseEnv({ ...base, ADMIN_EMAILS: " A@x.com, b@y.com ,," });
    expect(env.ADMIN_EMAILS).toEqual(["a@x.com", "b@y.com"]);
  });
});
