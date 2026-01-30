import mongoose from "mongoose";
import { adjustCredits } from "@/lib/credits";

export async function recordUsageReceipt({
  userId,
  creditAccountId,
  actionType,
  model,
  inputTokens,
  outputTokens,
  creditsCharged,
  requestId,
  metadata,
}: {
  userId: mongoose.Types.ObjectId;
  creditAccountId: mongoose.Types.ObjectId;
  actionType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  creditsCharged: number;
  requestId: string;
  metadata?: Record<string, unknown>;
}) {
  if (creditsCharged === 0) {
    return null;
  }

  return adjustCredits({
    userId,
    creditAccountId,
    delta: -Math.abs(creditsCharged),
    reason: actionType,
    requestId,
    metadata,
    receipt: {
      actionType,
      model,
      inputTokens,
      outputTokens,
      creditsCharged,
      requestId,
    },
  });
}
