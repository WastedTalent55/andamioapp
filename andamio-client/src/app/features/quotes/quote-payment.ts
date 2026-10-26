export interface QuotePaymentSplit {
  deposit: number;
  balance: number;
}

export function calculateQuotePaymentSplit(totalAmount: number, percentage: number): QuotePaymentSplit {
  const totalCents = Math.round((Number(totalAmount) + Number.EPSILON) * 100);
  const depositCents = Math.round(totalCents * percentage / 100);

  return {
    deposit: depositCents / 100,
    balance: (totalCents - depositCents) / 100
  };
}
