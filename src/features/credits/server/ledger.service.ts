import "server-only";
import { Prisma, type CreditReason, type PrismaClient } from "@/generated/prisma/client";
import { AppError } from "@/server/errors";

export type LedgerEntryInput = {
  userId: string;
  /** Non-zero. Positive adds credits, negative spends them. */
  delta: number;
  reason: CreditReason;
  /**
   * Idempotency reference (analysisId, paymentId, userId for signup bonus).
   * The pair (reason, referenceId) is unique, so replays are no-ops.
   */
  referenceId: string | null;
  note?: string;
  createdById?: string;
};

export type LedgerResult = {
  /** false when an entry with the same (reason, referenceId) already existed. */
  applied: boolean;
  balance: number;
};

type Tx = Prisma.TransactionClient;

/**
 * The only way credits change. Appends a ledger row and updates the cached
 * balance in ONE transaction. A negative delta never takes the balance
 * below zero (guarded UPDATE), and replays are idempotent.
 */
export async function appendLedgerEntry(
  client: PrismaClient,
  input: LedgerEntryInput,
): Promise<LedgerResult> {
  validateEntry(input);
  try {
    return await client.$transaction((tx) => applyInTx(tx, input));
  } catch (e) {
    // Lost a race against a concurrent identical entry: the whole tx (incl. the
    // balance change) rolled back, so this is a clean no-op.
    if (isUniqueViolation(e)) {
      return { applied: false, balance: await getBalance(client, input.userId) };
    }
    throw e;
  }
}

/** Use when the ledger change must commit atomically with other writes. */
export async function appendLedgerEntryInTx(
  tx: Tx,
  input: LedgerEntryInput,
): Promise<LedgerResult> {
  validateEntry(input);
  return applyInTx(tx, input);
}

async function applyInTx(tx: Tx, input: LedgerEntryInput): Promise<LedgerResult> {
  if (input.referenceId !== null) {
    const existing = await tx.creditLedger.findFirst({
      where: { reason: input.reason, referenceId: input.referenceId },
      select: { id: true },
    });
    if (existing) {
      return { applied: false, balance: await getBalance(tx, input.userId) };
    }
  }

  const required = input.delta < 0 ? -input.delta : 0;
  const updated = await tx.user.updateMany({
    where: { id: input.userId, creditBalance: { gte: required } },
    data: { creditBalance: { increment: input.delta } },
  });
  if (updated.count === 0) {
    const exists = await tx.user.count({ where: { id: input.userId } });
    if (!exists) throw new AppError("NOT_FOUND", "User not found.");
    throw new AppError("INSUFFICIENT_CREDITS", "You don't have enough credits.");
  }

  const balance = await getBalance(tx, input.userId);
  await tx.creditLedger.create({
    data: {
      userId: input.userId,
      delta: input.delta,
      balanceAfter: balance,
      reason: input.reason,
      referenceId: input.referenceId,
      note: input.note,
      createdById: input.createdById,
    },
  });
  return { applied: true, balance };
}

export function validateEntry(input: LedgerEntryInput): void {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new Error("Ledger delta must be a non-zero integer.");
  }
  const mustBePositive: CreditReason[] = ["SIGNUP_BONUS", "PURCHASE", "REFUND"];
  if (mustBePositive.includes(input.reason) && input.delta < 0) {
    throw new Error(`${input.reason} entries must be positive.`);
  }
  if (input.reason === "ANALYSIS" && input.delta > 0) {
    throw new Error("ANALYSIS entries must be negative.");
  }
  if (input.reason !== "ADMIN_ADJUST" && !input.referenceId) {
    throw new Error(`${input.reason} entries require a referenceId.`);
  }
}

export async function getBalance(client: PrismaClient | Tx, userId: string): Promise<number> {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  });
  return user?.creditBalance ?? 0;
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}
