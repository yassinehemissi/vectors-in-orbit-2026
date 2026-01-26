import type { CreditSummary } from "./types";
import { mockCreditSummary } from "./mock";

export async function getCreditSummary(): Promise<CreditSummary> {
  return mockCreditSummary;
}
