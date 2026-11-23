import { AnalysisResult, CurrencyCode } from '@/types';

export type ExchangeRates = Record<CurrencyCode, number>;

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD: 1,
  NGN: 1550,
  GBP: 0.79,
  EUR: 0.92,
};

/**
 * Returns the multiplier to convert 1 unit of `from` into `to`.
 */
export function getExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates
): number {
  if (from === to) return 1;
  const fromRate = rates[from] || DEFAULT_EXCHANGE_RATES[from] || 1;
  const toRate = rates[to] || DEFAULT_EXCHANGE_RATES[to] || 1;
  return toRate / fromRate;
}

/**
 * Converts a monetary amount between currencies with 2-decimal precision.
 */
export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates
): number {
  if (from === to) return amount;
  const rate = getExchangeRate(from, to, rates);
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Returns an immutable derived view of AnalysisResult converted from its
 * original `baseCurrency` into `targetCurrency` using live market rates.
 * Raw parsed numbers are never mutated, preventing rounding drift when toggling currencies.
 */
export function convertAnalysisResult(
  data: AnalysisResult,
  targetCurrency: CurrencyCode,
  rates: ExchangeRates
): AnalysisResult {
  const base = data.baseCurrency || data.currency;
  if (base === targetCurrency) {
    return { ...data, currency: targetCurrency };
  }

  const c = (val: number) => convertAmount(val, base, targetCurrency, rates);

  return {
    ...data,
    currency: targetCurrency,
    totalAmount: c(data.totalAmount),
    netAmount: c(data.netAmount),
    grossVolume: c(data.grossVolume),
    averageAmount: c(data.averageAmount),
    highestAmount: c(data.highestAmount),
    lowestAmount: c(data.lowestAmount),
    positiveTotal: c(data.positiveTotal),
    negativeTotal: c(data.negativeTotal),
    transactions: data.transactions.map((tx) => ({
      ...tx,
      amount: c(tx.amount),
    })),
    kaneAudit: data.kaneAudit
      ? {
          ...data.kaneAudit,
          rawCandidateTotal: c(data.kaneAudit.rawCandidateTotal),
          initialBuggyTotal: c(data.kaneAudit.initialBuggyTotal),
          naiveCollapsedTotal:
            data.kaneAudit.naiveCollapsedTotal !== undefined
              ? c(data.kaneAudit.naiveCollapsedTotal)
              : undefined,
          healedDifference:
            data.kaneAudit.healedDifference !== undefined
              ? c(data.kaneAudit.healedDifference)
              : undefined,
          pendingAmountExcluded: c(data.kaneAudit.pendingAmountExcluded),
          reversedAmountExcluded: c(data.kaneAudit.reversedAmountExcluded),
          excludedStatusRows: data.kaneAudit.excludedStatusRows.map((row) => ({
            ...row,
            amount: c(row.amount),
          })),
          bugEvidence: data.kaneAudit.bugEvidence.map((ev) => ({
            ...ev,
            financialImpact: c(ev.financialImpact),
          })),
        }
      : undefined,
  };
}
