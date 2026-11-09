import "server-only";
import { env } from "./env";

/** Single source of truth for feature flags and derived app config (Section 9). */
export const flags = {
  tradeLevels: env.FEATURE_TRADE_LEVELS,
  shareLinks: env.FEATURE_SHARE_LINKS,
  freeCredit: env.FEATURE_FREE_CREDIT,
} as const;

export const appConfig = {
  appUrl: env.NEXT_PUBLIC_APP_URL,
  freeSignupCredits: env.FEATURE_FREE_CREDIT ? env.FREE_SIGNUP_CREDITS : 0,
  googleAuthEnabled: Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
  adminEmails: env.ADMIN_EMAILS,
} as const;
