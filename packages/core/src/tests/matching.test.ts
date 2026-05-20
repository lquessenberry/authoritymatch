import { describe, it, expect } from 'vitest';
import { calculateMatchScore, findMatches } from '../matching';
import { makeAuthorityRecord, makeFactorProfile } from './__fixtures__';

// ─── calculateMatchScore ───────────────────────────────────────────────────

describe('calculateMatchScore', () => {
  it('returns a score between 0 and 100', () => {
    const authority = makeAuthorityRecord();
    const factor = makeFactorProfile();
    const { score } = calculateMatchScore(authority, factor);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns a rounded integer score', () => {
    const { score } = calculateMatchScore(makeAuthorityRecord(), makeFactorProfile());
    expect(Number.isInteger(score)).toBe(true);
  });

  it('returns reasons array with at least one entry', () => {
    const { reasons } = calculateMatchScore(makeAuthorityRecord(), makeFactorProfile());
    expect(reasons.length).toBeGreaterThan(0);
  });

  // Credit score matching
  describe('credit score component', () => {
    it('gives full credit score points when within range', () => {
      const authority = makeAuthorityRecord({ creditScore: 720 });
      const factor = makeFactorProfile({ minCreditScore: 650, maxCreditScore: 800 });
      const { score, reasons } = calculateMatchScore(authority, factor);
      expect(reasons).toContain('Credit score within range');
      // 100 * 0.3 = 30 pts from credit alone (plus other components)
      expect(score).toBeGreaterThan(50);
    });

    it('penalises when credit score is below minimum', () => {
      const good = makeAuthorityRecord({ creditScore: 720 });
      const bad = makeAuthorityRecord({ creditScore: 580 });
      const factor = makeFactorProfile({ minCreditScore: 650 });
      const { score: goodScore } = calculateMatchScore(good, factor);
      const { score: badScore } = calculateMatchScore(bad, factor);
      expect(goodScore).toBeGreaterThan(badScore);
    });

    it('includes reason when credit score is outside range', () => {
      const authority = makeAuthorityRecord({ creditScore: 580 });
      const factor = makeFactorProfile({ minCreditScore: 650 });
      const { reasons } = calculateMatchScore(authority, factor);
      expect(reasons.some(r => r.includes('outside range'))).toBe(true);
    });

    it('handles missing maxCreditScore (defaults to 850)', () => {
      const authority = makeAuthorityRecord({ creditScore: 840 });
      const factor = makeFactorProfile({ minCreditScore: 600, maxCreditScore: undefined });
      const { reasons } = calculateMatchScore(authority, factor);
      expect(reasons).toContain('Credit score within range');
    });
  });

  // Volume matching
  describe('volume component', () => {
    it('gives full volume points when within range', () => {
      const authority = makeAuthorityRecord({ monthlyVolume: 75_000 });
      const factor = makeFactorProfile({ minMonthlyVolume: 20_000, maxMonthlyVolume: 200_000 });
      const { reasons } = calculateMatchScore(authority, factor);
      expect(reasons).toContain('Volume within range');
    });

    it('penalises when volume is below minimum', () => {
      const low = makeAuthorityRecord({ monthlyVolume: 5_000 });
      const ok = makeAuthorityRecord({ monthlyVolume: 75_000 });
      const factor = makeFactorProfile({ minMonthlyVolume: 20_000 });
      const { score: lowScore } = calculateMatchScore(low, factor);
      const { score: okScore } = calculateMatchScore(ok, factor);
      expect(okScore).toBeGreaterThan(lowScore);
    });

    it('includes reason when volume is outside range', () => {
      const authority = makeAuthorityRecord({ monthlyVolume: 5_000 });
      const factor = makeFactorProfile({ minMonthlyVolume: 20_000 });
      const { reasons } = calculateMatchScore(authority, factor);
      expect(reasons).toContain('Volume outside preferred range');
    });

    it('handles missing maxMonthlyVolume (unlimited)', () => {
      const authority = makeAuthorityRecord({ monthlyVolume: 10_000_000 });
      const factor = makeFactorProfile({ minMonthlyVolume: 20_000, maxMonthlyVolume: undefined });
      const { reasons } = calculateMatchScore(authority, factor);
      expect(reasons).toContain('Volume within range');
    });
  });

  // Equipment matching
  describe('equipment component', () => {
    it('gives full equipment points when all types match', () => {
      const authority = makeAuthorityRecord({ equipmentTypes: ['dry_van', 'flatbed'] });
      const factor = makeFactorProfile({ equipmentTypes: ['dry_van', 'flatbed'] });
      const { reasons } = calculateMatchScore(authority, factor);
      expect(reasons.some(r => r.includes('equipment types match'))).toBe(true);
    });

    it('gives partial credit for partial equipment match', () => {
      const fullMatch = makeAuthorityRecord({ equipmentTypes: ['dry_van', 'flatbed'] });
      const partialMatch = makeAuthorityRecord({ equipmentTypes: ['dry_van'] });
      const factor = makeFactorProfile({ equipmentTypes: ['dry_van', 'flatbed'] });
      const { score: full } = calculateMatchScore(fullMatch, factor);
      const { score: partial } = calculateMatchScore(partialMatch, factor);
      expect(full).toBeGreaterThan(partial);
    });

    it('gives full equipment score when factor has no equipment requirements', () => {
      const authority = makeAuthorityRecord({ equipmentTypes: ['dry_van'] });
      const factor = makeFactorProfile({ equipmentTypes: [] });
      // equipmentScore = 100 when factor.equipmentTypes.length === 0
      const { score } = calculateMatchScore(authority, factor);
      expect(score).toBeGreaterThan(0);
    });

    it('gives 0 equipment score when no types match', () => {
      const authority = makeAuthorityRecord({ equipmentTypes: ['tanker'] });
      const factor = makeFactorProfile({ equipmentTypes: ['dry_van', 'flatbed'] });
      const { score: noMatch } = calculateMatchScore(authority, factor);
      const authority2 = makeAuthorityRecord({ equipmentTypes: ['dry_van'] });
      const { score: match } = calculateMatchScore(authority2, factor);
      expect(match).toBeGreaterThan(noMatch);
    });
  });

  // Location matching
  describe('location component', () => {
    it('gives full location points when state is served', () => {
      const authority = makeAuthorityRecord({ location: { city: 'Little Rock', state: 'AR', zip: '72201' } });
      const factor = makeFactorProfile({ statesServed: ['AR', 'TX'] });
      const { reasons } = calculateMatchScore(authority, factor);
      expect(reasons).toContain('Serves trucker state');
    });

    it('penalises when state is not served', () => {
      const inState = makeAuthorityRecord({ location: { city: 'Little Rock', state: 'AR', zip: '72201' } });
      const outState = makeAuthorityRecord({ location: { city: 'Albany', state: 'NY', zip: '12201' } });
      const factor = makeFactorProfile({ statesServed: ['AR', 'TX'] });
      const { score: inScore } = calculateMatchScore(inState, factor);
      const { score: outScore } = calculateMatchScore(outState, factor);
      expect(inScore).toBeGreaterThan(outScore);
    });

    it('includes reason when state is not in service area', () => {
      const authority = makeAuthorityRecord({ location: { city: 'Albany', state: 'NY', zip: '12201' } });
      const factor = makeFactorProfile({ statesServed: ['AR', 'TX'] });
      const { reasons } = calculateMatchScore(authority, factor);
      expect(reasons).toContain('State not in service area');
    });
  });

  // Perfect match
  it('produces a high score for a perfect match', () => {
    const authority = makeAuthorityRecord({
      creditScore: 750,
      monthlyVolume: 100_000,
      equipmentTypes: ['dry_van', 'flatbed'],
      location: { city: 'Little Rock', state: 'AR', zip: '72201' },
    });
    const factor = makeFactorProfile({
      minCreditScore: 650,
      maxCreditScore: 800,
      minMonthlyVolume: 50_000,
      maxMonthlyVolume: 200_000,
      equipmentTypes: ['dry_van', 'flatbed'],
      statesServed: ['AR', 'TX'],
    });
    const { score } = calculateMatchScore(authority, factor);
    expect(score).toBeGreaterThanOrEqual(90);
  });

  // Worst match
  it('produces a low score for a poor match', () => {
    const authority = makeAuthorityRecord({
      creditScore: 400,
      monthlyVolume: 1_000,
      equipmentTypes: ['tanker'],
      location: { city: 'Albany', state: 'NY', zip: '12201' },
    });
    const factor = makeFactorProfile({
      minCreditScore: 700,
      minMonthlyVolume: 100_000,
      equipmentTypes: ['dry_van', 'flatbed'],
      statesServed: ['AR', 'TX'],
    });
    const { score } = calculateMatchScore(authority, factor);
    expect(score).toBeLessThan(50);
  });
});

// ─── findMatches ──────────────────────────────────────────────────────────

describe('findMatches', () => {
  const authority = makeAuthorityRecord({
    creditScore: 720,
    monthlyVolume: 75_000,
    equipmentTypes: ['dry_van', 'flatbed'],
    location: { city: 'Little Rock', state: 'AR', zip: '72201' },
  });

  const goodFactor = makeFactorProfile({
    id: 'fp-good',
    minCreditScore: 650,
    minMonthlyVolume: 20_000,
    equipmentTypes: ['dry_van', 'flatbed'],
    statesServed: ['AR', 'TX'],
  });

  const badFactor = makeFactorProfile({
    id: 'fp-bad',
    minCreditScore: 800,
    minMonthlyVolume: 500_000,
    equipmentTypes: ['tanker'],
    statesServed: ['NY', 'NJ'],
  });

  it('returns only matches above the minimum score threshold', () => {
    const matches = findMatches(authority, [goodFactor, badFactor], 60);
    expect(matches.every(m => m.score >= 60)).toBe(true);
  });

  it('returns results sorted by score descending', () => {
    const factors = [badFactor, goodFactor];
    const matches = findMatches(authority, factors, 0);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].score).toBeGreaterThanOrEqual(matches[i].score);
    }
  });

  it('respects the limit parameter', () => {
    const manyFactors = Array.from({ length: 10 }, (_, i) =>
      makeFactorProfile({ id: `fp-${i}`, minCreditScore: 600, minMonthlyVolume: 10_000, statesServed: ['AR'] }),
    );
    const matches = findMatches(authority, manyFactors, 0, 3);
    expect(matches.length).toBeLessThanOrEqual(3);
  });

  it('returns empty array when no factors meet the minimum score', () => {
    const matches = findMatches(authority, [badFactor], 90);
    expect(matches).toHaveLength(0);
  });

  it('returns empty array for empty factors list', () => {
    const matches = findMatches(authority, []);
    expect(matches).toHaveLength(0);
  });

  it('populates leadId and factorId correctly', () => {
    const matches = findMatches(authority, [goodFactor], 0);
    expect(matches[0].leadId).toBe(authority.id);
    expect(matches[0].factorId).toBe(goodFactor.id);
  });

  it('populates matchedAt as a Date', () => {
    const matches = findMatches(authority, [goodFactor], 0);
    expect(matches[0].matchedAt).toBeInstanceOf(Date);
  });

  it('uses default minScore of 60 when not specified', () => {
    // badFactor should score < 60 and be excluded by default
    const matches = findMatches(authority, [badFactor]);
    expect(matches).toHaveLength(0);
  });

  it('uses default limit of 5 when not specified', () => {
    const manyFactors = Array.from({ length: 10 }, (_, i) =>
      makeFactorProfile({ id: `fp-${i}`, minCreditScore: 600, minMonthlyVolume: 10_000, statesServed: ['AR'] }),
    );
    const matches = findMatches(authority, manyFactors, 0);
    expect(matches.length).toBeLessThanOrEqual(5);
  });
});
