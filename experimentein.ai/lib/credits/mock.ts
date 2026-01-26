import type { CreditSummary } from "./types";

export const mockCreditSummary: CreditSummary = {
  account: {
    userId: "demo-user",
    balance: 124,
    reserved: 12,
  },
  recentLedger: [
    {
      id: "ledger-1",
      delta: -6,
      reason: "fill_missing_field",
      requestId: "req-7612",
      timestamp: "2026-01-25T10:14:00Z",
    },
    {
      id: "ledger-2",
      delta: -3,
      reason: "evidence_explain",
      requestId: "req-7611",
      timestamp: "2026-01-25T09:42:00Z",
    },
    {
      id: "ledger-3",
      delta: 50,
      reason: "credit_purchase",
      requestId: "req-7609",
      timestamp: "2026-01-24T17:05:00Z",
    },
  ],
  recentReceipts: [
    {
      requestId: "req-7612",
      actionType: "fill_missing_field",
      model: "gpt-4.1-mini",
      inputTokens: 1100,
      outputTokens: 650,
      creditsCharged: 6,
      timestamp: "2026-01-25T10:14:00Z",
    },
    {
      requestId: "req-7611",
      actionType: "evidence_explain",
      model: "gpt-4.1-mini",
      inputTokens: 620,
      outputTokens: 310,
      creditsCharged: 3,
      timestamp: "2026-01-25T09:42:00Z",
    },
  ],
};
