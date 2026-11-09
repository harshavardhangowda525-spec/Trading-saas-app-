import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Carries the requesting browser's nonce from the sign-in server action into
 * Auth.js's sendVerificationRequest (same request, deeper in the call stack).
 */
export const loginRequestContext = new AsyncLocalStorage<{ nonce: string }>();

export const LOGIN_NONCE_COOKIE = "cs_login_nonce";
