export type CreditAccount = {
  userId: string;
  balance: number;
  reserved: number;
};

export type CreditLedgerEntry = {
  id: string;
  delta: number;
  reason: string;
  requestId: string;
  timestamp: string;
};

export type UsageReceipt = {
  requestId: string;
  actionType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  creditsCharged: number;
  timestamp: string;
};

export type CreditSummary = {
  account: CreditAccount;
  recentLedger: CreditLedgerEntry[];
  recentReceipts: UsageReceipt[];
};
