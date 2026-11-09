import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { TERMS_VERSION } from "@/lib/legal";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";

const currentUserSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
  creditBalance: true,
  termsAcceptedAt: true,
  termsVersion: true,
  createdAt: true,
} as const;

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
  creditBalance: number;
  termsAcceptedAt: Date | null;
  termsVersion: string | null;
  createdAt: Date;
};

/**
 * Data Access Layer entry point. Always re-reads the user from the DB (role,
 * deletion and terms state must never come from a stale session). Memoised
 * per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: currentUserSelect,
  });
  return user;
});

export function hasAcceptedCurrentTerms(
  user: Pick<CurrentUser, "termsVersion" | "termsAcceptedAt">,
) {
  return user.termsAcceptedAt !== null && user.termsVersion === TERMS_VERSION;
}

// ── Page guards (redirect) ────────────────────────────────────────

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOnboardedUser(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasAcceptedCurrentTerms(user)) redirect("/onboarding");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireOnboardedUser();
  if (user.role !== "ADMIN") notFound();
  return user;
}

// ── API guards (throw AppError) ───────────────────────────────────

export async function requireApiUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHENTICATED", "Please sign in.");
  return user;
}

export async function requireApiOnboardedUser(): Promise<CurrentUser> {
  const user = await requireApiUser();
  if (!hasAcceptedCurrentTerms(user)) {
    throw new AppError("TERMS_NOT_ACCEPTED", "Please accept the terms to continue.");
  }
  return user;
}
