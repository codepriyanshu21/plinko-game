// Symmetric payout table for 13 bins
export const PAYTABLE: Record<number, number> = {
  0: 5.0,
  1: 2.5,
  2: 1.5,
  3: 1.2,
  4: 1.0,
  5: 0.8,
  6: 0.5, // center
  7: 0.8,
  8: 1.0,
  9: 1.2,
  10: 1.5,
  11: 2.5,
  12: 5.0,
};

export function getPayoutMultiplier(binIndex: number): number {
  return PAYTABLE[binIndex] || 0.5;
}
