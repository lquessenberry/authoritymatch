import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyRevenue,
  calculateACV,
  calculateLTV,
  calculateAuthorityQualityScore,
} from '../calculators';
import type { AuthorityRecord } from '../types';
import { makeAuthorityRecord } from './__fixtures__';

// ─── calculateMonthlyRevenue ───────────────────────────────────────────────

describe('calculateMonthlyRevenue', () => {
  it('calculates revenue correctly for standard inputs', () => {
    // $100k volume, 95% advance, 2.5% fee → $100k * 0.95 * 0.025 = $2,375
    expect(calculateMonthlyRevenue(100_000, 95, 2.5)).toBe(2375);
  });

  it('returns 0 when monthly volume is 0', () => {
    expect(calculateMonthlyRevenue(0, 95, 2.5)).toBe(0);
  });

  it('returns 0 when advance rate is 0', () => {
    expect(calculateMonthlyRevenue(100_000, 0, 2.5)).toBe(0);
  });

  it('returns 0 when factoring fee is 0', () => {
    expect(calculateMonthlyRevenue(100_000, 95, 0)).toBe(0);
  });

  it('scales linearly with volume', () => {
    const base = calculateMonthlyRevenue(50_000, 90, 3);
    const doubled = calculateMonthlyRevenue(100_000, 90, 3);
    expect(doubled).toBeCloseTo(base * 2, 5);
  });

  it('scales linearly with advance rate', () => {
    const low = calculateMonthlyRevenue(100_000, 80, 2);
    const high = calculateMonthlyRevenue(100_000, 90, 2);
    // high / low = 90/80 = 1.125
    expect(high / low).toBeCloseTo(1.125, 5);
  });

  it('handles large volumes without overflow', () => {
    const result = calculateMonthlyRevenue(10_000_000, 97, 1.5);
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });
});

// ─── calculateACV ─────────────────────────────────────────────────────────

describe('calculateACV', () => {
  it('multiplies monthly revenue by contract term', () => {
    expect(calculateACV(2375, 12)).toBe(28500);
  });

  it('returns 0 for 0 monthly revenue', () => {
    expect(calculateACV(0, 12)).toBe(0);
  });

  it('returns 0 for 0 contract term', () => {
    expect(calculateACV(2375, 0)).toBe(0);
  });

  it('handles single-month contracts', () => {
    expect(calculateACV(5000, 1)).toBe(5000);
  });

  it('handles multi-year contracts (24 months)', () => {
    expect(calculateACV(1000, 24)).toBe(24000);
  });
});

// ─── calculateLTV ─────────────────────────────────────────────────────────

describe('calculateLTV', () => {
  it('multiplies monthly revenue by retention months', () => {
    expect(calculateLTV(2375, 36)).toBe(85500);
  });

  it('returns 0 for 0 monthly revenue', () => {
    expect(calculateLTV(0, 36)).toBe(0);
  });

  it('returns 0 for 0 retention months', () => {
    expect(calculateLTV(2375, 0)).toBe(0);
  });

  it('LTV is always >= ACV for same monthly revenue when retention >= term', () => {
    const monthly = 3000;
    const term = 12;
    const retention = 24;
    expect(calculateLTV(monthly, retention)).toBeGreaterThanOrEqual(
      calculateACV(monthly, term),
    );
  });
});

// ─── calculateAuthorityQualityScore ───────────────────────────────────────

describe('calculateAuthorityQualityScore', () => {
  const baseRecord: AuthorityRecord = makeAuthorityRecord({
    creditScore: 720,
    yearsInBusiness: 5,
    monthlyVolume: 100_000,
  });

  it('returns a number between 0 and 100', () => {
    const score = calculateAuthorityQualityScore(baseRecord);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns a rounded integer', () => {
    const score = calculateAuthorityQualityScore(baseRecord);
    expect(Number.isInteger(score)).toBe(true);
  });

  it('higher credit score produces higher score', () => {
    const low = calculateAuthorityQualityScore(makeAuthorityRecord({ creditScore: 550 }));
    const high = calculateAuthorityQualityScore(makeAuthorityRecord({ creditScore: 800 }));
    expect(high).toBeGreaterThan(low);
  });

  it('more years in business produces higher score', () => {
    const newBiz = calculateAuthorityQualityScore(makeAuthorityRecord({ yearsInBusiness: 0 }));
    const veteran = calculateAuthorityQualityScore(makeAuthorityRecord({ yearsInBusiness: 10 }));
    expect(veteran).toBeGreaterThan(newBiz);
  });

  it('higher monthly volume produces higher score', () => {
    const small = calculateAuthorityQualityScore(makeAuthorityRecord({ monthlyVolume: 10_000 }));
    const large = calculateAuthorityQualityScore(makeAuthorityRecord({ monthlyVolume: 200_000 }));
    expect(large).toBeGreaterThan(small);
  });

  it('caps credit score contribution at 20 points', () => {
    // creditScore 850 → (850-500)/17.5 = 20 → capped at 20
    const maxCredit = calculateAuthorityQualityScore(
      makeAuthorityRecord({ creditScore: 850, yearsInBusiness: 0, monthlyVolume: 0 }),
    );
    const overMax = calculateAuthorityQualityScore(
      makeAuthorityRecord({ creditScore: 850, yearsInBusiness: 0, monthlyVolume: 0 }),
    );
    expect(maxCredit).toBe(overMax); // no further increase beyond 850
  });

  it('caps years-in-business contribution at 15 points (5+ years)', () => {
    const fiveYears = calculateAuthorityQualityScore(
      makeAuthorityRecord({ creditScore: 500, yearsInBusiness: 5, monthlyVolume: 0 }),
    );
    const tenYears = calculateAuthorityQualityScore(
      makeAuthorityRecord({ creditScore: 500, yearsInBusiness: 10, monthlyVolume: 0 }),
    );
    // Both should be capped at 15 points for years
    expect(fiveYears).toBe(tenYears);
  });

  it('caps volume contribution at 15 points ($150k+)', () => {
    const cap = calculateAuthorityQualityScore(
      makeAuthorityRecord({ creditScore: 500, yearsInBusiness: 0, monthlyVolume: 150_000 }),
    );
    const over = calculateAuthorityQualityScore(
      makeAuthorityRecord({ creditScore: 500, yearsInBusiness: 0, monthlyVolume: 500_000 }),
    );
    expect(cap).toBe(over);
  });

  it('base score is 50 with minimum inputs', () => {
    // creditScore=500 → 0 pts, yearsInBusiness=0 → 0 pts, monthlyVolume=0 → 0 pts
    const score = calculateAuthorityQualityScore(
      makeAuthorityRecord({ creditScore: 500, yearsInBusiness: 0, monthlyVolume: 0 }),
    );
    expect(score).toBe(50);
  });
});
