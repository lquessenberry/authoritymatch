import type { AuthorityRecord, FactorProfile } from '../types';

// Calculate potential monthly factoring revenue
export function calculateMonthlyRevenue(
  monthlyVolume: number,
  advanceRate: number,
  factoringFee: number
): number {
  const advancedAmount = monthlyVolume * (advanceRate / 100);
  return advancedAmount * (factoringFee / 100);
}

// Calculate annual contract value
export function calculateACV(
  monthlyRevenue: number,
  contractTerm: number
): number {
  return monthlyRevenue * contractTerm;
}

// Calculate lifetime value (LTV) estimate
export function calculateLTV(
  monthlyRevenue: number,
  expectedRetentionMonths: number
): number {
  return monthlyRevenue * expectedRetentionMonths;
}

// Score authority quality (0-100)
export function calculateAuthorityQualityScore(record: AuthorityRecord): number {
  let score = 50; // base score

  // Credit score factor (max 20 points)
  score += Math.min(20, (record.creditScore - 500) / 17.5);

  // Years in business (max 15 points)
  score += Math.min(15, record.yearsInBusiness * 3);

  // Volume factor (max 15 points)
  score += Math.min(15, record.monthlyVolume / 10000);

  return Math.round(score);
}
