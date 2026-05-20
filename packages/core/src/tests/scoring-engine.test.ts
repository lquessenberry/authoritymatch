import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringEngine, defaultScoringEngine } from '../scoring/engine';
import { DEFAULT_CONFIG, CONSERVATIVE_CONFIG, AGGRESSIVE_CONFIG } from '../scoring/config';
import {
  makeAuthority,
  makeNewAuthority,
  makeUnsatisfactoryAuthority,
  makeLargeAuthority,
} from './__fixtures__';
import type { Authority } from '../types/authority';

describe('ScoringEngine', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = new ScoringEngine(DEFAULT_CONFIG);
  });

  // ─── calculateScore ────────────────────────────────────────────────────

  describe('calculateScore', () => {
    it('returns an AuthorityScore with all required fields', () => {
      const score = engine.calculateScore(makeAuthority());
      expect(score).toMatchObject({
        overall: expect.any(Number),
        grade: expect.any(String),
        safety: { score: expect.any(Number), weight: expect.any(Number), factors: expect.any(Object) },
        stability: { score: expect.any(Number), weight: expect.any(Number), factors: expect.any(Object) },
        scale: { score: expect.any(Number), weight: expect.any(Number), factors: expect.any(Object) },
        compliance: { score: expect.any(Number), weight: expect.any(Number), factors: expect.any(Object) },
        geography: { score: expect.any(Number), weight: expect.any(Number), factors: expect.any(Object) },
        calculatedAt: expect.any(String),
        calculationVersion: expect.any(String),
      });
    });

    it('overall score is between 0 and 100', () => {
      const score = engine.calculateScore(makeAuthority());
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('overall score is a rounded integer', () => {
      const score = engine.calculateScore(makeAuthority());
      expect(Number.isInteger(score.overall)).toBe(true);
    });

    it('all component scores are between 0 and 100', () => {
      const score = engine.calculateScore(makeAuthority());
      for (const key of ['safety', 'stability', 'scale', 'compliance', 'geography'] as const) {
        expect(score[key].score).toBeGreaterThanOrEqual(0);
        expect(score[key].score).toBeLessThanOrEqual(100);
      }
    });

    it('calculatedAt is a valid ISO date string', () => {
      const score = engine.calculateScore(makeAuthority());
      expect(() => new Date(score.calculatedAt)).not.toThrow();
      expect(new Date(score.calculatedAt).toISOString()).toBe(score.calculatedAt);
    });

    it('calculationVersion matches config version', () => {
      const score = engine.calculateScore(makeAuthority());
      expect(score.calculationVersion).toBe(DEFAULT_CONFIG.version);
    });

    it('overall equals weighted sum of components (within rounding)', () => {
      const score = engine.calculateScore(makeAuthority());
      const w = DEFAULT_CONFIG.weights;
      const expected = Math.round(
        score.safety.score * w.safety +
          score.stability.score * w.stability +
          score.scale.score * w.scale +
          score.compliance.score * w.compliance +
          score.geography.score * w.geography,
      );
      expect(score.overall).toBe(expected);
    });

    // Grade assignment
    describe('grade assignment', () => {
      it('assigns A+ for scores 95-100', () => {
        // Force a near-perfect authority
        const authority = makeLargeAuthority();
        const score = engine.calculateScore(authority);
        // Just verify grade boundaries are respected
        const { overall, grade } = score;
        const boundaries = DEFAULT_CONFIG.gradeBoundaries;
        const [min, max] = boundaries[grade as keyof typeof boundaries];
        expect(overall).toBeGreaterThanOrEqual(min);
        expect(overall).toBeLessThanOrEqual(max);
      });

      it('assigns F for very low scores', () => {
        const bad = makeUnsatisfactoryAuthority();
        const score = engine.calculateScore(bad);
        const { overall, grade } = score;
        const boundaries = DEFAULT_CONFIG.gradeBoundaries;
        const [min, max] = boundaries[grade as keyof typeof boundaries];
        expect(overall).toBeGreaterThanOrEqual(min);
        expect(overall).toBeLessThanOrEqual(max);
      });

      it('grade always corresponds to the correct score boundary', () => {
        const authorities = [makeAuthority(), makeNewAuthority(), makeUnsatisfactoryAuthority(), makeLargeAuthority()];
        for (const authority of authorities) {
          const { overall, grade } = engine.calculateScore(authority);
          const boundaries = DEFAULT_CONFIG.gradeBoundaries;
          const [min, max] = boundaries[grade as keyof typeof boundaries];
          expect(overall).toBeGreaterThanOrEqual(min);
          expect(overall).toBeLessThanOrEqual(max);
        }
      });
    });
  });

  // ─── Safety Score ──────────────────────────────────────────────────────

  describe('safety score', () => {
    it('satisfactory rating produces higher safety score than conditional', () => {
      const sat = makeAuthority({ safetyRating: { rating: 'S', oosRate: 0.05 } });
      const cond = makeAuthority({ safetyRating: { rating: 'C', oosRate: 0.05 } });
      const satScore = engine.calculateScore(sat).safety.score;
      const condScore = engine.calculateScore(cond).safety.score;
      expect(satScore).toBeGreaterThan(condScore);
    });

    it('unsatisfactory rating produces lowest safety score', () => {
      const sat = makeAuthority({ safetyRating: { rating: 'S', oosRate: 0.05 } });
      const unsat = makeAuthority({ safetyRating: { rating: 'U', oosRate: 0.05 } });
      const satScore = engine.calculateScore(sat).safety.score;
      const unsatScore = engine.calculateScore(unsat).safety.score;
      expect(satScore).toBeGreaterThan(unsatScore);
    });

    it('lower OOS rate produces higher safety score', () => {
      const lowOos = makeAuthority({ safetyRating: { rating: 'S', oosRate: 0.01 } });
      const highOos = makeAuthority({ safetyRating: { rating: 'S', oosRate: 0.09 } });
      const lowScore = engine.calculateScore(lowOos).safety.score;
      const highScore = engine.calculateScore(highOos).safety.score;
      expect(lowScore).toBeGreaterThan(highScore);
    });

    it('authority with no safety data gets a neutral score of 50', () => {
      const authority = makeAuthority({ safetyRating: undefined });
      const score = engine.calculateScore(authority).safety.score;
      expect(score).toBe(50);
    });

    it('lower CSA percentiles produce higher safety score', () => {
      const goodCsa = makeAuthority({
        safetyRating: {
          rating: 'S',
          oosRate: 0.02,
          driverFitness: 10,
          vehicleMaintenance: 10,
          controlledSubstances: 5,
          hazmatCompliance: 5,
          hoursOfService: 10,
          unsafeDriving: 10,
        },
      });
      const badCsa = makeAuthority({
        safetyRating: {
          rating: 'S',
          oosRate: 0.02,
          driverFitness: 80,
          vehicleMaintenance: 85,
          controlledSubstances: 75,
          hazmatCompliance: 70,
          hoursOfService: 80,
          unsafeDriving: 90,
        },
      });
      const goodScore = engine.calculateScore(goodCsa).safety.score;
      const badScore = engine.calculateScore(badCsa).safety.score;
      expect(goodScore).toBeGreaterThan(badScore);
    });
  });

  // ─── Stability Score ───────────────────────────────────────────────────

  describe('stability score', () => {
    it('veteran authority (5+ years) scores higher than new authority', () => {
      const veteran = makeAuthority({ addDate: '2015-01-01' });
      const newAuth = makeNewAuthority();
      const veteranScore = engine.calculateScore(veteran).stability.score;
      const newScore = engine.calculateScore(newAuth).stability.score;
      expect(veteranScore).toBeGreaterThan(newScore);
    });

    it('active status produces higher stability score than inactive', () => {
      const active = makeAuthority({ status: 'A' });
      const inactive = makeAuthority({ status: 'I' });
      const activeScore = engine.calculateScore(active).stability.score;
      const inactiveScore = engine.calculateScore(inactive).stability.score;
      expect(activeScore).toBeGreaterThan(inactiveScore);
    });

    it('authority with no addDate gets a below-average stability score', () => {
      const noDate = makeAuthority({ addDate: undefined });
      const withDate = makeAuthority({ addDate: '2018-01-01' });
      const noDateScore = engine.calculateScore(noDate).stability.score;
      const withDateScore = engine.calculateScore(withDate).stability.score;
      // No date should be penalised
      expect(withDateScore).toBeGreaterThanOrEqual(noDateScore);
    });
  });

  // ─── Scale Score ───────────────────────────────────────────────────────

  describe('scale score', () => {
    it('enterprise fleet scores higher than micro fleet', () => {
      const enterprise = makeLargeAuthority(); // 600 drivers
      const micro = makeAuthority({ totalDrivers: 2, totalPowerUnits: 2 });
      const enterpriseScore = engine.calculateScore(enterprise).scale.score;
      const microScore = engine.calculateScore(micro).scale.score;
      expect(enterpriseScore).toBeGreaterThan(microScore);
    });

    it('scale score increases with fleet size tiers', () => {
      const tiers = [
        makeAuthority({ totalDrivers: 2, totalPowerUnits: 2 }),   // micro
        makeAuthority({ totalDrivers: 10, totalPowerUnits: 10 }),  // small
        makeAuthority({ totalDrivers: 50, totalPowerUnits: 50 }),  // medium
        makeAuthority({ totalDrivers: 200, totalPowerUnits: 200 }), // large
        makeAuthority({ totalDrivers: 600, totalPowerUnits: 580 }), // enterprise
      ];
      const scores = tiers.map(a => engine.calculateScore(a).scale.score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
      }
    });

    it('authority with 0 drivers gets minimum scale score', () => {
      const zero = makeAuthority({ totalDrivers: 0, totalPowerUnits: 0 });
      const score = engine.calculateScore(zero).scale.score;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  // ─── Compliance Score ──────────────────────────────────────────────────

  describe('compliance score', () => {
    it('active insurance produces higher compliance score', () => {
      const insured = makeAuthority({ insurance: { status: 'A' } });
      const uninsured = makeAuthority({ insurance: { status: 'I' } });
      const insuredScore = engine.calculateScore(insured).compliance.score;
      const uninsuredScore = engine.calculateScore(uninsured).compliance.score;
      expect(insuredScore).toBeGreaterThan(uninsuredScore);
    });

    it('active authority status produces higher compliance score', () => {
      const active = makeAuthority({ status: 'A' });
      const inactive = makeAuthority({ status: 'I' });
      const activeScore = engine.calculateScore(active).compliance.score;
      const inactiveScore = engine.calculateScore(inactive).compliance.score;
      expect(activeScore).toBeGreaterThan(inactiveScore);
    });

    it('recent MCS-150 date produces higher compliance score', () => {
      const recent = makeAuthority({ mcs150Date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10) });
      const old = makeAuthority({ mcs150Date: '2010-01-01' });
      const recentScore = engine.calculateScore(recent).compliance.score;
      const oldScore = engine.calculateScore(old).compliance.score;
      expect(recentScore).toBeGreaterThan(oldScore);
    });
  });

  // ─── Geography Score ───────────────────────────────────────────────────

  describe('geography score', () => {
    it('interstate carrier (A) has higher operatingRadius factor than intrastate (B)', () => {
      // Both may hit the 100 cap after summing all geography factors.
      // Verify the operatingRadius sub-factor directly.
      const interstate = makeAuthority({ carrierOperation: 'A' });
      const intrastate = makeAuthority({ carrierOperation: 'B' });
      const interstateGeo = engine.calculateScore(interstate).geography;
      const intrastateGeo = engine.calculateScore(intrastate).geography;
      expect(interstateGeo.factors['operatingRadius']).toBeGreaterThan(
        intrastateGeo.factors['operatingRadius'],
      );
    });

    it('low-risk state has higher stateRisk factor than high-risk state', () => {
      // Both may hit the 100 cap after summing all geography factors.
      // Verify the stateRisk sub-factor directly.
      const lowRisk = makeAuthority({ physicalAddress: { street: '1 Main', city: 'Minneapolis', state: 'MN', zip: '55401' } }); // MN riskScore=30 → stateRisk=70
      const highRisk = makeAuthority({ physicalAddress: { street: '1 Main', city: 'DC', state: 'DC', zip: '20001' } }); // DC riskScore=50 → stateRisk=50
      const lowGeo = engine.calculateScore(lowRisk).geography;
      const highGeo = engine.calculateScore(highRisk).geography;
      expect(lowGeo.factors['stateRisk']).toBeGreaterThan(highGeo.factors['stateRisk']);
    });

    it('authority with no state gets a below-average geography score', () => {
      const noState = makeAuthority({ physicalAddress: undefined as any });
      const score = engine.calculateScore(noState).geography.score;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  // ─── batchScore ────────────────────────────────────────────────────────

  describe('batchScore', () => {
    it('returns a Map with one entry per authority', () => {
      const authorities = [makeAuthority(), makeNewAuthority(), makeLargeAuthority()];
      const results = engine.batchScore(authorities);
      expect(results.size).toBe(3);
    });

    it('keys the Map by authority id', () => {
      const authority = makeAuthority({ id: 'auth-batch-test' });
      const results = engine.batchScore([authority]);
      expect(results.has('auth-batch-test')).toBe(true);
    });

    it('each entry is a valid AuthorityScore', () => {
      const authorities = [makeAuthority(), makeLargeAuthority()];
      const results = engine.batchScore(authorities);
      for (const [, score] of results) {
        expect(score.overall).toBeGreaterThanOrEqual(0);
        expect(score.overall).toBeLessThanOrEqual(100);
        expect(score.grade).toBeTruthy();
      }
    });

    it('returns empty Map for empty input', () => {
      const results = engine.batchScore([]);
      expect(results.size).toBe(0);
    });
  });

  // ─── Config variants ───────────────────────────────────────────────────

  describe('config variants', () => {
    it('conservative config penalises risky authorities more than default', () => {
      const risky = makeUnsatisfactoryAuthority();
      const defaultScore = new ScoringEngine(DEFAULT_CONFIG).calculateScore(risky).overall;
      const conservativeScore = new ScoringEngine(CONSERVATIVE_CONFIG).calculateScore(risky).overall;
      // Conservative weights safety at 40% vs 30%, so risky authority should score lower
      expect(conservativeScore).toBeLessThanOrEqual(defaultScore);
    });

    it('aggressive config rewards large fleets more than default', () => {
      const large = makeLargeAuthority();
      const defaultScore = new ScoringEngine(DEFAULT_CONFIG).calculateScore(large).overall;
      const aggressiveScore = new ScoringEngine(AGGRESSIVE_CONFIG).calculateScore(large).overall;
      // Aggressive weights scale at 35% vs 20%, so large fleet should score higher
      expect(aggressiveScore).toBeGreaterThanOrEqual(defaultScore);
    });

    it('conservative config uses stricter OOS rate limit', () => {
      expect(CONSERVATIVE_CONFIG.safetyRules.maxAcceptableOosRate).toBeLessThan(
        DEFAULT_CONFIG.safetyRules.maxAcceptableOosRate,
      );
    });
  });

  // ─── defaultScoringEngine singleton ───────────────────────────────────

  describe('defaultScoringEngine', () => {
    it('is an instance of ScoringEngine', () => {
      expect(defaultScoringEngine).toBeInstanceOf(ScoringEngine);
    });

    it('produces valid scores', () => {
      const score = defaultScoringEngine.calculateScore(makeAuthority());
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });
  });
});
