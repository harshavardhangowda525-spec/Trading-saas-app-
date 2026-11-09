import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import { appendLedgerEntryInTx } from "@/features/credits/server/ledger.service";
import { TERMS_VERSION } from "@/lib/legal";
import { AppError } from "@/server/errors";

export type AcceptTermsInput = {
  userId: string;
  version: string;
  ipHash: string | null;
  userAgent: string | null;
};

export type AcceptTermsResult = { balance: number; bonusGranted: boolean };

/**
 * Records terms acceptance (audit row + denormalized fields) and, on first
 * acceptance, grants the free signup credit(s). Fully idempotent.
 *
 * The bonus is granted here rather than at account creation so a user only
 * receives credits after agreeing to the risk terms, and so a failure can be
 * retried safely (ledger unique on SIGNUP_BONUS + userId).
 */
export async function acceptTerms(
  client: PrismaClient,
  input: AcceptTermsInput,
  options: { signupCredits: number },
): Promise<AcceptTermsResult> {
  if (input.version !== TERMS_VERSION) {
    throw new AppError("TERMS_OUTDATED", "The terms were updated. Please review them again.");
  }

  return client.$transaction(async (tx) => {
    const now = new Date();
    await tx.termsAcceptance.upsert({
      where: { userId_version: { userId: input.userId, version: input.version } },
      create: {
        userId: input.userId,
        version: input.version,
        acceptedAt: now,
        ipHash: input.ipHash,
        userAgent: input.userAgent?.slice(0, 512) ?? null,
      },
      update: {},
    });
    await tx.user.update({
      where: { id: input.userId },
      data: { termsAcceptedAt: now, termsVersion: input.version },
    });

    if (options.signupCredits > 0) {
      const res = await appendLedgerEntryInTx(tx, {
        userId: input.userId,
        delta: options.signupCredits,
        reason: "SIGNUP_BONUS",
        referenceId: input.userId,
        note: "Free signup credit",
      });
      return { balance: res.balance, bonusGranted: res.applied };
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: input.userId },
      select: { creditBalance: true },
    });
    return { balance: user.creditBalance, bonusGranted: false };
  });
}
