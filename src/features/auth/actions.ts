"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/server/auth";

const emailSchema = z.email().max(254);

export async function signInWithEmail(formData: FormData): Promise<void> {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) redirect("/login?error=InvalidEmail");

  try {
    await signIn("resend", { email: parsed.data, redirectTo: "/app" });
  } catch (e) {
    // signIn() succeeds by throwing a redirect; only map real auth errors.
    if (e instanceof AuthError) redirect(`/login?error=${encodeURIComponent(e.type)}`);
    throw e;
  }
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
