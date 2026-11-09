"use server";

import { randomBytes } from "node:crypto";
import { AuthError } from "next-auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/server/auth";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { consumeRateLimit } from "@/server/rate-limit";
import { clientIp, hashIp } from "@/server/request-meta";
import { normalizeEmail } from "./email-rules";
import { codeErrorMessage } from "./login-errors";
import {
  deriveLoginCodeKeys,
  LOGIN_CODE_TTL_MS,
  verifyLoginCode,
} from "./server/login-code.service";
import { LOGIN_NONCE_COOKIE, loginRequestContext } from "./server/login-context";

const emailSchema = z.email().max(254);
const codeSchema = z.string().regex(/^\d{6}$/);
const HOUR = 60 * 60 * 1000;

export async function signInWithEmail(formData: FormData): Promise<void> {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) redirect("/login?error=InvalidEmail");
  const email = normalizeEmail(parsed.data);

  // Stop inbox flooding: limit sign-in emails per address and per network.
  const ip = clientIp(await headers());
  const [byEmail, byIp] = await Promise.all([
    consumeRateLimit(db, `login-email:addr:${email}`, 5, HOUR),
    ip ? consumeRateLimit(db, `login-email:ip:${hashIp(ip, env.IP_HASH_SALT)}`, 30, HOUR) : null,
  ]);
  if (!byEmail.allowed || (byIp && !byIp.allowed)) redirect("/login?error=TooManyEmails");

  // Ties the emailed 6-digit code to this browser only.
  const nonce = randomBytes(32).toString("base64url");
  (await cookies()).set(LOGIN_NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: env.NEXT_PUBLIC_APP_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: LOGIN_CODE_TTL_MS / 1000,
  });

  let next: string;
  try {
    // redirect:false so WE send the browser to /login/verify. Following Auth.js's own
    // redirect leaves the address bar on /api/auth/verify-request, and the code form
    // (a server action posting to the current URL) would then hit Auth.js instead.
    next = await loginRequestContext.run({ nonce }, () =>
      signIn("resend", { email, redirectTo: "/app", redirect: false }),
    );
  } catch (e) {
    if (e instanceof AuthError) redirect(`/login?error=${encodeURIComponent(e.type)}`);
    throw e;
  }

  const target = new URL(next, env.NEXT_PUBLIC_APP_URL);
  const error = target.searchParams.get("error");
  if (error || !target.pathname.endsWith("verify-request")) {
    redirect(`/login?error=${encodeURIComponent(error ?? "Default")}`);
  }
  redirect("/login/verify");
}

export type VerifyCodeState = { error: string | null; next: string | null };

/**
 * Checks a typed code. On success returns the magic link for the BROWSER to open:
 * a server-side redirect would make Next.js follow it on the server, consuming
 * the one-time token without the session cookie ever reaching the browser.
 */
export async function verifyCodeAction(
  _prev: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> {
  const raw = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (!codeSchema.safeParse(raw).success) {
    return { error: codeErrorMessage("InvalidCode", undefined), next: null };
  }

  const jar = await cookies();
  const nonce = jar.get(LOGIN_NONCE_COOKIE)?.value;
  if (!nonce) return { error: codeErrorMessage("NoCode", undefined), next: null };

  const result = await verifyLoginCode(db, deriveLoginCodeKeys(env.AUTH_SECRET), {
    nonce,
    code: raw,
  });
  if (!result.ok) {
    return {
      error: codeErrorMessage(`Code${result.reason}`, result.attemptsLeft?.toString()),
      next: null,
    };
  }

  jar.delete(LOGIN_NONCE_COOKIE);
  // Same origin (AUTH_URL), so it is safe to hand back to the client.
  return { error: null, next: result.magicLink };
}

export async function signInWithGoogle(): Promise<void> {
  try {
    await signIn("google", { redirectTo: "/app" });
  } catch (e) {
    if (e instanceof AuthError) redirect(`/login?error=${encodeURIComponent(e.type)}`);
    throw e;
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
