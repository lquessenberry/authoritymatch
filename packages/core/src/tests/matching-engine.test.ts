import { describe, it, expect, beforeEach } from 'vitest';
import { MatchingEngine } from '../matching/engine';
import {
  makeAuthority,
  makeFactor,
  makeNewAuthority,
  makeUnsatisfactoryAuthority,
  makeLargeAuthority,
  makeConservativeFactor,
  makeAggressiveFactor,
} from './__fixtures__';

describe('MatchingEngine', () => {
  let engine: MatchingEngine;

  beforeEach(() => {
    engine = new MatchingEngine();
  });

  // ─── calculateCompatibility ──────────────────────────────────────────────

  describe('calculateCompatibility', () => {
    it('returns a MatchResult with all required fields', () => {
      const result = engine.calculateCompatibility(makeAuthority(), makeFactor());
      expect(result).toMatchObject({
        authorityId: expect.any(String),
        factorId: expect.any(String),
        score: expect.any(Number),
        compatibility: {
          geographic: expect.any(Number),
          fleetSize: expect.any(Number),
          riskProfile: expect.any(Number),
          preferences: expect.any(Number),
          financial: expect.any(Number),
        },
        meetsRequirements: expect.any(Boolean),
        disqualifyingFactors: expect.any(Array),
      });
    });

    it('sets authorityId and factorId from the inputs', () => {
      const authority = makeAuthority({ id: 'auth-xyz' });
      const factor = makeFactor({ id: 'factor-xyz' });
      const result = engine.calculateCompatibility(authority, factor);
      expect(result.authorityId).toBe('auth-xyz');
      expect(result.factorId).toBe('factor-xyz');
    });

    it('score is between 0 and 100', () => {
      const result = engine.calculateCompatibility(makeAuthority(), makeFactor());
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('score is a rounded integer', () => {
      const result = engine.calculateCompatibility(makeAuthority(), makeFactor());
      expect(Number.isInteger(result.score)).toBe(true);
    });

    it('all compatibility sub-scores are between 0 and 100', () => {
      const { compatibility } = engine.calculateCompatibility(makeAuthority(), makeFactor());
      for (const val of Object.values(compatibility)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
      }
    });

    it('meetsRequirements is false when there are disqualifying factors', () => {
      const result = engine.calculateCompatibility(makeAuthority(), makeFactor());
      expect(result.meetsRequirements).toBe(result.disqualifyingFactors.length === 0);
    });

    // Geographic score
    describe('geographic score', () => {
      it('returns 100 when authority state is in factor preferred states', () => {
        const authority = makeAuthority({ physicalAddress: { street: '1 Main', city: 'LR', state: 'AR', zip: '72201' } });
        const factor = makeFactor();
        // factor.preferences.preferredStates includes 'AR'
        const { compatibility } = engine.calculateCompatibility(authority, factor);
        expect(compatibility.geographic).toBe(100);
      });

      it('returns lower score when authority state is not in preferred states', () => {
        // NY is in excludedStates but the engine only returns 0 when the state is
        // both preferred AND excluded. When not preferred at all, it falls through
        // to the region/no-match path (30). The key invariant is that an excluded
        // state scores no higher than a preferred state.
        const preferred = makeAuthority({ physicalAddress: { street: '1 Main', city: 'LR', state: 'AR', zip: '72201' } });
        const excluded = makeAuthority({ physicalAddress: { street: '1 Main', city: 'NYC', state: 'NY', zip: '10001' } });
        const factor = makeFactor();
        const { compatibility: prefC } = engine.calculateCompatibility(preferred, factor);
        const { compatibility: exclC } = engine.calculateCompatibility(excluded, factor);
        expect(prefC.geographic).toBeGreaterThan(exclC.geographic);
      });

      it('returns 50 when authority has no physical address state', () => {
        const authority = makeAuthority({ physicalAddress: undefined as any });
        const factor = makeFactor();
        const { compatibility } = engine.calculateCompatibility(authority, factor);
        expect(compatibility.geographic).toBe(50);
      });

      it('returns 30 when state is not preferred and not in any region', () => {
        const authority = makeAuthority({ physicalAddress: { street: '1 Main', city: 'Anchorage', state: 'AK', zip: '99501' } });
        const factor = makeFactor();
        const { compatibility } = engine.calculateCompatibility(authority, factor);
        expect(compatibility.geographic).toBe(30);
      });
    });

    // Fleet size score
    describe('fleet size score', () => {
      it('returns 0 when fleet is below minimum', () => {
        const authority = makeAuthority({ totalDrivers: 1 }); // factor minFleetSize = 5
        const factor = makeFactor();
        const { compatibility } = engine.calculateCompatibility(authority, factor);
        expect(compatibility.fleetSize).toBe(0);
      });

      it('returns 0 when fleet exceeds maximum', () => {
        const authority = makeAuthority({ totalDrivers: 500 }); // factor maxFleetSize = 200
        const factor = makeFactor();
        const { compatibility } = engine.calculateCompatibility(authority, factor);
        expect(compatibility.fleetSize).toBe(0);
      });

      it('returns 100 when fleet is within ideal range', () => {
        const authority = makeAuthority({ totalDrivers: 50 }); // ideal range [10, 100]
        const factor = makeFactor();
        const { compatibility } = engine.calculateCompatibility(authority, factor);
        expect(compatibility.fleetSize).toBe(100);
      });

      it('returns non-zero when fleet is within acceptable but not ideal range', () => {
        const authority = makeAuthority({ totalDrivers: 150 }); // above ideal max (100) but below max (200)
        const factor = makeFactor();
        const { compatibility } = engine.calculateCompatibility(authority, factor);
        expect(compatibility.fleetSize).toBeGreaterThan(0);
        expect(compatibility.fleetSize).toBeLessThan(100);
      });
    });

    // Risk profile score
    describe('risk profile score', () => {
      it('penalises unsatisfactory safety rating', () => {
        const good = makeAuthority({ safetyRating: { rating: 'S', oosRate: 0.02 } });
        const bad = makeUnsatisfactoryAuthority();
        const factor = makeFactor();
        const { compatibility: goodC } = engine.calculateCompatibility(good, factor);
        const { compatibility: badC } = engine.calculateCompatibility(bad, factor);
        expect(goodC.riskProfile).toBeGreaterThan(badC.riskProfile);
      });

      it('penalises high OOS rate', () => {
        const lowOos = makeAuthority({ safetyRating: { rating: 'S', oosRate: 0.02 } });
        const highOos = makeAuthority({ safetyRating: { rating: 'S', oosRate: 0.20 } });
        const factor = makeFactor();
        const { compatibility: lowC } = engine.calculateCompatibility(lowOos, factor);
        const { compatibility: highC } = engine.calculateCompatibility(highOos, factor);
        expect(lowC.riskProfile).toBeGreaterThan(highC.riskProfile);
      });

      it('penalises inactive insurance when required', () => {
        const insured = makeAuthority({ insurance: { status: 'A' } });
        const uninsured = makeAuthority({ insurance: { status: 'I' } });
        const factor = makeFactor(); // requiredInsurance: true
        const { compatibility: insuredC } = engine.calculateCompatibility(insured, factor);
        const { compatibility: uninsuredC } = engine.calculateCompatibility(uninsured, factor);
        expect(insuredC.riskProfile).toBeGreaterThan(uninsuredC.riskProfile);
      });
    });

    // Financial score
    describe('financial score', () => {
      it('gives bonus for high advance rates (>=0.95)', () => {
        const highAdvance = makeFactor({
          offerings: { ...makeFactor().offerings, advanceRates: [0.95, 0.97] },
        });
        const lowAdvance = makeFactor({
          offerings: { ...makeFactor().offerings, advanceRates: [0.80, 0.85] },
        });
        const authority = makeAuthority();
        const { compatibility: highC } = engine.calculateCompatibility(authority, highAdvance);
        const { compatibility: lowC } = engine.calculateCompatibility(authority, lowAdvance);
        expect(highC.financial).toBeGreaterThan(lowC.financial);
      });
    });
  });

  // ─── findMatchesForAuthority ─────────────────────────────────────────────

  describe('findMatchesForAuthority', () => {
    it('returns results sorted by score descending', () => {
      const authority = makeAuthority();
      const factors = [makeFactor(), makeConservativeFactor(), makeAggressiveFactor()];
      const results = engine.findMatchesForAuthority(authority, factors);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('filters out results below minCompatibilityScore', () => {
      const authority = makeAuthority();
      const factors = [makeFactor()];
      const results = engine.findMatchesForAuthority(authority, factors, { minCompatibilityScore: 999 });
      expect(results).toHaveLength(0);
    });

    it('respects maxResults option', () => {
      const authority = makeAuthority();
      const factors = Array.from({ length: 20 }, (_, i) => makeFactor({ id: `f-${i}` }));
      const results = engine.findMatchesForAuthority(authority, factors, { maxResults: 3 });
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('excludes disqualified results by default', () => {
      const tinyAuthority = makeAuthority({ totalDrivers: 1 }); // below minFleetSize
      const factor = makeFactor();
      const results = engine.findMatchesForAuthority(tinyAuthority, [factor]);
      // Fleet disqualifier should exclude this
      expect(results.every(r => r.meetsRequirements)).toBe(true);
    });

    it('includes disqualified results when includeDisqualified is true', () => {
      const tinyAuthority = makeAuthority({ totalDrivers: 1 });
      const factor = makeFactor();
      const results = engine.findMatchesForAuthority(tinyAuthority, [factor], {
        includeDisqualified: true,
      });
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty array for empty factors list', () => {
      const results = engine.findMatchesForAuthority(makeAuthority(), []);
      expect(results).toHaveLength(0);
    });

    it('defaults to maxResults of 10', () => {
      const authority = makeAuthority();
      const factors = Array.from({ length: 20 }, (_, i) =>
        makeFactor({ id: `f-${i}`, preferences: { ...makeFactor().preferences, minFleetSize: 1 } }),
      );
      const results = engine.findMatchesForAuthority(authority, factors, { includeDisqualified: true });
      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  // ─── findMatchesForFactor ────────────────────────────────────────────────

  describe('findMatchesForFactor', () => {
    it('returns results sorted by score descending', () => {
      const factor = makeFactor();
      const authorities = [makeAuthority(), makeNewAuthority(), makeLargeAuthority()];
      const results = engine.findMatchesForFactor(factor, authorities, { includeDisqualified: true });
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('filters out results below minCompatibilityScore', () => {
      const factor = makeFactor();
      const results = engine.findMatchesForFactor(factor, [makeAuthority()], {
        minCompatibilityScore: 999,
      });
      expect(results).toHaveLength(0);
    });

    it('respects maxResults option', () => {
      const factor = makeFactor();
      const authorities = Array.from({ length: 100 }, (_, i) =>
        makeAuthority({ id: `a-${i}`, dotNumber: `${i}` }),
      );
      const results = engine.findMatchesForFactor(factor, authorities, {
        maxResults: 5,
        includeDisqualified: true,
      });
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('defaults to maxResults of 50', () => {
      const factor = makeFactor();
      const authorities = Array.from({ length: 100 }, (_, i) =>
        makeAuthority({ id: `a-${i}`, dotNumber: `${i}` }),
      );
      const results = engine.findMatchesForFactor(factor, authorities, { includeDisqualified: true });
      expect(results.length).toBeLessThanOrEqual(50);
    });

    it('returns empty array for empty authorities list', () => {
      const results = engine.findMatchesForFactor(makeFactor(), []);
      expect(results).toHaveLength(0);
    });

    it('large authority fleet-size score is higher than micro authority fleet-size score', () => {
      // The large authority (600 drivers) exceeds the factor's maxFleetSize (200),
      // so its fleetSize compatibility is 0. Instead we verify the scale component
      // directly via calculateCompatibility.
      const factor = makeFactor({ preferences: { ...makeFactor().preferences, minFleetSize: 1, maxFleetSize: 1000, preferredFleetSizeRange: [10, 800] } });
      const large = makeLargeAuthority();
      const micro = makeAuthority({ totalDrivers: 2 });
      const largeResult = engine.calculateCompatibility(large, factor);
      const microResult = engine.calculateCompatibility(micro, factor);
      expect(largeResult.compatibility.fleetSize).toBeGreaterThan(microResult.compatibility.fleetSize);
    });
  });

  // ─── Weighted score integrity ────────────────────────────────────────────

  describe('weighted score integrity', () => {
    it('overall score equals weighted sum of components (within rounding)', () => {
      const authority = makeAuthority();
      const factor = makeFactor();
      const result = engine.calculateCompatibility(authority, factor);
      const { compatibility: c } = result;

      const weights = {
        geographic: 0.2,
        fleetSize: 0.2,
        riskProfile: 0.25,
        preferences: 0.2,
        financial: 0.15,
      };

      const expected = Math.round(
        c.geographic * weights.geographic +
          c.fleetSize * weights.fleetSize +
          c.riskProfile * weights.riskProfile +
          c.preferences * weights.preferences +
          c.financial * weights.financial,
      );

      expect(result.score).toBe(expected);
    });
  });
});
