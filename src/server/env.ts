import "server-only";
import { parseEnv } from "./env.schema";

/**
 * Validated server environment. Importing this module parses `process.env`
 * and throws (failing startup/build) if anything required is missing.
 */
export const env = parseEnv(process.env);

if (env.APP_ENV === "production" && env.FEATURE_TRADE_LEVELS) {
  console.warn(
    "[config] FEATURE_TRADE_LEVELS is ON in production. Keep it OFF until SEBI RA compliance is confirmed.",
  );
}
