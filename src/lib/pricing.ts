/**
 * Pricing configuration for DisputeHub
 * All amounts in pence (e.g., 999 = £9.99)
 */

export const PRICING = {
  DISPUTE_UNLOCK: {
    amount: 999, // £9.99
    currency: "gbp",
    description: "Unlock full dispute analysis",
  },
} as const;

export function formatPrice(amountInPence: number, currency: string = "gbp") {
  const amount = amountInPence / 100;
  
  const formatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
  
  return formatter.format(amount);
}
