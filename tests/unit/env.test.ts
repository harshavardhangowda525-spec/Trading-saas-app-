import { describe, expect, it } from "vitest";
import { parseEnv } from "@/server/env.schema";

const base = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(32),
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  IP_HASH_SALT: "salt-salt",
};

const deployedBase = { ...base, NEXT_PUBLIC_APP_URL: "https://chartsense.example.com" };

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
    expect(() => parseEnv({ ...deployedBase, APP_ENV: "production" })).toThrow(/RESEND_API_KEY/);
    const env = parseEnv({ ...deployedBase, APP_ENV: "production", RESEND_API_KEY: "re_123" });
    expect(env.EMAIL_TRANSPORT).toBe("resend");
  });

  it("reads the deployment environment from VERCEL_ENV", () => {
    const env = parseEnv({ ...deployedBase, VERCEL_ENV: "preview", RESEND_API_KEY: "re_123" });
    expect(env.APP_ENV).toBe("preview");
    expect(env.EMAIL_TRANSPORT).toBe("resend");
  });

  it("forbids the console email transport in production", () => {
    expect(() =>
      parseEnv({ ...deployedBase, APP_ENV: "production", EMAIL_TRANSPORT: "console" }),
    ).toThrow(/EMAIL_TRANSPORT/);
  });

  it("allows a local production build (NODE_ENV=production) with console email", () => {
    const env = parseEnv({ ...base, NODE_ENV: "production" });
    expect(env.EMAIL_TRANSPORT).toBe("console");
  });

  it("falls back to Render's public URL for NEXT_PUBLIC_APP_URL", () => {
    const { NEXT_PUBLIC_APP_URL: _omit, ...rest } = base;
    void _omit;
    const env = parseEnv({ ...rest, RENDER_EXTERNAL_URL: "https://chartsense.onrender.com" });
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://chartsense.onrender.com");
  });

  describe("public URL on deployed servers", () => {
    const render = {
      ...base,
      RENDER: "true",
      RENDER_EXTERNAL_URL: "https://chartsense.onrender.com",
      RESEND_API_KEY: "re_123",
    };

    it("treats Render as a deployed (preview) environment", () => {
      expect(parseEnv(render).APP_ENV).toBe("preview");
    });

    it("ignores a localhost NEXT_PUBLIC_APP_URL and uses Render's URL", () => {
      expect(parseEnv(render).NEXT_PUBLIC_APP_URL).toBe("https://chartsense.onrender.com");
    });

    it("ignores a localhost AUTH_URL / NEXTAUTH_URL (the magic-link bug)", () => {
      const { NEXT_PUBLIC_APP_URL: _omit, ...rest } = render;
      void _omit;
      const env = parseEnv({
        ...rest,
        AUTH_URL: "http://localhost:3000",
        NEXTAUTH_URL: "http://127.0.0.1:3000",
      });
      expect(env.NEXT_PUBLIC_APP_URL).toBe("https://chartsense.onrender.com");
    });

    it("keeps an explicit public URL (custom domain) over Render's default", () => {
      const env = parseEnv({ ...render, NEXT_PUBLIC_APP_URL: "https://chartsense.in" });
      expect(env.NEXT_PUBLIC_APP_URL).toBe("https://chartsense.in");
    });

    it("fails fast when the only URL configured is localhost", () => {
      expect(() => parseEnv({ ...base, APP_ENV: "preview", RESEND_API_KEY: "re_123" })).toThrow(
        /NEXT_PUBLIC_APP_URL/,
      );
    });

    it("requires https on deployed environments", () => {
      expect(() =>
        parseEnv({
          ...base,
          APP_ENV: "preview",
          RESEND_API_KEY: "re_123",
          NEXT_PUBLIC_APP_URL: "http://chartsense.example.com",
        }),
      ).toThrow(/https/);
    });

    it("still allows localhost in local development", () => {
      expect(parseEnv(base).NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    });
  });

  it("stores images in the database by default", () => {
    expect(parseEnv(base).STORAGE_DRIVER).toBe("database");
  });

  it("requires all S3 settings only when STORAGE_DRIVER=s3", () => {
    expect(() => parseEnv({ ...base, STORAGE_DRIVER: "s3", S3_BUCKET: "b" })).toThrow(
      /STORAGE_DRIVER/,
    );
    expect(parseEnv({ ...base, S3_BUCKET: "leftover" }).STORAGE_DRIVER).toBe("database");
  });

  it("normalises admin emails", () => {
    const env = parseEnv({ ...base, ADMIN_EMAILS: " A@x.com, b@y.com ,," });
    expect(env.ADMIN_EMAILS).toEqual(["a@x.com", "b@y.com"]);
  });
});
