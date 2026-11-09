import { z } from "zod";

const optionalString = z.string().min(1).optional();
const flag = (defaultValue: boolean) => z.stringbool().default(defaultValue);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    /**
     * Deployment environment. NODE_ENV is "production" for any `next build`,
     * including local ones, so production-only guards key off this instead.
     * Falls back to VERCEL_ENV on Vercel.
     */
    APP_ENV: z.enum(["development", "preview", "production"]).default("development"),

    // ── M1: core ────────────────────────────────────────────────
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "must be a postgres:// URL"),
    DIRECT_URL: z
      .string()
      .regex(/^postgres(ql)?:\/\//, "must be a postgres:// URL")
      .optional(),
    AUTH_SECRET: z.string().min(32, "must be at least 32 characters (run: npx auth secret)"),
    NEXT_PUBLIC_APP_URL: z.url(),
    AUTH_GOOGLE_ID: optionalString,
    AUTH_GOOGLE_SECRET: optionalString,
    /** "console" logs magic links to the server output (dev only). */
    EMAIL_TRANSPORT: z.enum(["resend", "console"]),
    RESEND_API_KEY: optionalString,
    EMAIL_FROM: z.string().min(3).default("ChartSense <login@chartsense.local>"),
    FREE_SIGNUP_CREDITS: z.coerce.number().int().min(0).max(100).default(1),
    ADMIN_EMAILS: z
      .string()
      .default("")
      .transform((raw) =>
        raw
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    IP_HASH_SALT: z.string().min(8),

    // ── Feature flags (Section 9) ───────────────────────────────
    FEATURE_TRADE_LEVELS: flag(false),
    FEATURE_SHARE_LINKS: flag(true),
    FEATURE_FREE_CREDIT: flag(true),

    // ── Later milestones (optional until their feature ships) ───
    S3_ENDPOINT: optionalString,
    S3_REGION: optionalString,
    S3_BUCKET: optionalString,
    S3_ACCESS_KEY_ID: optionalString,
    S3_SECRET_ACCESS_KEY: optionalString,
    /** true for local emulators (moto/MinIO); R2 and AWS work either way. */
    S3_FORCE_PATH_STYLE: flag(false),
    SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(300),
    ANTHROPIC_API_KEY: optionalString,
    AI_MODEL_ANALYSIS: optionalString,
    AI_MODEL_READABILITY: optionalString,
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
    UPSTASH_REDIS_REST_URL: optionalString,
    UPSTASH_REDIS_REST_TOKEN: optionalString,
    RAZORPAY_KEY_ID: optionalString,
    RAZORPAY_KEY_SECRET: optionalString,
    RAZORPAY_WEBHOOK_SECRET: optionalString,
    CRON_SECRET: optionalString,
    SENTRY_DSN: optionalString,
  })
  .superRefine((e, ctx) => {
    const s3 = [
      e.S3_ENDPOINT,
      e.S3_REGION,
      e.S3_BUCKET,
      e.S3_ACCESS_KEY_ID,
      e.S3_SECRET_ACCESS_KEY,
    ];
    if (s3.some(Boolean) && !s3.every(Boolean)) {
      ctx.addIssue({
        code: "custom",
        path: ["S3_BUCKET"],
        message:
          "S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be set together",
      });
    }
    if (Boolean(e.AUTH_GOOGLE_ID) !== Boolean(e.AUTH_GOOGLE_SECRET)) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_GOOGLE_ID"],
        message: "AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set together",
      });
    }
    if (e.EMAIL_TRANSPORT === "resend" && !e.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "required when EMAIL_TRANSPORT=resend",
      });
    }
    if (e.APP_ENV !== "development" && !e.NEXT_PUBLIC_APP_URL.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_APP_URL"],
        message: "must be the public https:// URL of the site on deployed environments",
      });
    }
    if (e.APP_ENV === "production" && e.EMAIL_TRANSPORT === "console") {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_TRANSPORT"],
        message: "console transport is not allowed in production",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

function isLocalUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname;
    return ["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"].includes(host);
  } catch {
    return false;
  }
}

/** Parses a raw env record. Empty strings are treated as unset. */
export function parseEnv(raw: Record<string, string | undefined>): Env {
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined && value.trim() !== "") cleaned[key] = value;
  }
  // Deployment environment: explicit APP_ENV, else Vercel's, else "preview" on Render.
  cleaned.APP_ENV ??= cleaned.VERCEL_ENV ?? (cleaned.RENDER === "true" ? "preview" : undefined);
  const deployed = cleaned.APP_ENV !== undefined && cleaned.APP_ENV !== "development";

  // A localhost URL on a deployed server is always a config mistake (e.g. a local
  // .env imported into the host). Using it would put localhost in magic links.
  if (deployed) {
    for (const key of ["NEXT_PUBLIC_APP_URL", "AUTH_URL", "NEXTAUTH_URL"]) {
      const value = cleaned[key];
      if (value && isLocalUrl(value)) {
        console.warn(
          `[config] Ignoring ${key}=${value}: localhost is not valid on a deployed server.`,
        );
        delete cleaned[key];
      }
    }
  }
  // Canonical public URL. Render exposes RENDER_EXTERNAL_URL (https://<name>.onrender.com).
  cleaned.NEXT_PUBLIC_APP_URL ??=
    cleaned.AUTH_URL ?? cleaned.NEXTAUTH_URL ?? cleaned.RENDER_EXTERNAL_URL;

  // Sensible default: Resend on deployed environments, console email locally.
  cleaned.EMAIL_TRANSPORT ??=
    cleaned.APP_ENV && cleaned.APP_ENV !== "development" ? "resend" : "console";

  const result = envSchema.safeParse(cleaned);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  return result.data;
}
