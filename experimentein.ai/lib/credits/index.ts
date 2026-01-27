import mongoose from "mongoose";
import type { CreditSummary } from "./types";
import { connectToDatabase } from "@/lib/mongoose";
import { CreditAccount } from "@/models/CreditAccount";
import { CreditLog } from "@/models/CreditLog";
import { CreditReceipt } from "@/models/CreditReceipt";

const SIGNUP_CREDITS = 300;

export async function initCreditAccountForUser(userId: mongoose.Types.ObjectId) {
  await connectToDatabase();

  const existing = await CreditAccount.findOne({ userId });
  if (existing) {
    return existing;
  }

  const account = await CreditAccount.create({
    userId,
    balance: SIGNUP_CREDITS,
    reserved: 0,
    month_plan_accredated: new Date(),
  });

  await CreditLog.create({
    userId,
    creditAccountId: account._id,
    delta: SIGNUP_CREDITS,
    reason: "signup_grant",
    requestId: `signup-${userId.toString()}`,
    metadata: { source: "signup" },
  });

  return account;
}

export async function adjustCredits({
  userId,
  creditAccountId,
  delta,
  reason,
  requestId,
  metadata,
  receipt,
}: {
  userId: mongoose.Types.ObjectId;
  creditAccountId: mongoose.Types.ObjectId;
  delta: number;
  reason: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  receipt?: {
    actionType: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    creditsCharged: number;
    requestId: string;
  };
}) {
  await connectToDatabase();

  const account = await CreditAccount.findByIdAndUpdate(
    creditAccountId,
    { $inc: { balance: delta } },
    { new: true }
  );

  if (!account) {
    throw new Error("Credit account not found.");
  }

  await CreditLog.create({
    userId,
    creditAccountId,
    delta,
    reason,
    requestId,
    metadata,
  });

  if (receipt) {
    await CreditReceipt.create({
      userId,
      creditAccountId,
      requestId: receipt.requestId,
      actionType: receipt.actionType,
      model: receipt.model,
      inputTokens: receipt.inputTokens,
      outputTokens: receipt.outputTokens,
      creditsCharged: receipt.creditsCharged,
    });
  }

  return account;
}

export async function getCreditSummary(
  userId: mongoose.Types.ObjectId
): Promise<CreditSummary | null> {
  await connectToDatabase();

  const account = await CreditAccount.findOne({ userId });
  if (!account) {
    return null;
  }

  const recentLedger = await CreditLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const recentReceipts = await CreditReceipt.find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    account: {
      id: account._id.toString(),
      userId: account.userId.toString(),
      balance: account.balance,
      reserved: account.reserved,
      month_plan_accredated: account.month_plan_accredated
        ? account.month_plan_accredated.toISOString()
        : null,
    },
    recentLedger: recentLedger.map((entry) => ({
      id: entry._id.toString(),
      delta: entry.delta,
      reason: entry.reason,
      requestId: entry.requestId ?? "",
      timestamp: entry.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
    recentReceipts: recentReceipts.map((receipt) => ({
      requestId: receipt.requestId,
      actionType: receipt.actionType,
      model: receipt.model,
      inputTokens: receipt.inputTokens,
      outputTokens: receipt.outputTokens,
      creditsCharged: receipt.creditsCharged,
      timestamp: receipt.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
  };
}
