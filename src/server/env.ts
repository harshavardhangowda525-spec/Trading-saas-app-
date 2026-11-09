import "server-only";
import { parseEnv } from "./env.schema";

/**
 * Validated server environment. Importing this module parses `process.env`
 * and throws (failing startup/build) if anything required is missing.
 */
export const env = parseEnv(process.env);

// Pin Auth.js to the canonical public URL. Auth.js reads AUTH_URL at request
// time to build magic-link and OAuth callback URLs. Without it, it trusts the
// request's Host header, which (a) breaks if a stale localhost value is set and
// (b) would let a forged Host header put an attacker's domain in sign-in emails.
process.env.AUTH_URL = env.NEXT_PUBLIC_APP_URL;
delete process.env.NEXTAUTH_URL;

if (env.APP_ENV === "production" && env.FEATURE_TRADE_LEVELS) {
  console.warn(
    "[config] FEATURE_TRADE_LEVELS is ON in production. Keep it OFF until SEBI RA compliance is confirmed.",
  );
}
