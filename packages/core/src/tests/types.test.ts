import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  AuthorityRecordSchema,
  FactorProfileSchema,
  LeadSchema,
  MatchResultSchema,
} from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────

function validAuthorityRecord() {
  return {
    id: 'rec-001',
    mcNumber: 'MC-111111',
    dotNumber: '1111111',
    companyName: 'Test Trucking LLC',
    contactEmail: 'info@testtrucking.com',
    contactPhone: '501-555-0100',
    authorityDate: new Date('2019-03-15'),
    equipmentTypes: ['dry_van', 'flatbed'],
    factoringStatus: 'inactive' as const,
    creditScore: 720,
    monthlyVolume: 75000,
    yearsInBusiness: 5,
    safetyRating: 'satisfactory' as const,
    location: { city: 'Little Rock', state: 'AR', zip: '72201' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
}

function validFactorProfile() {
  return {
    id: 'fp-001',
    name: 'Test Factor',
    website: 'https://testfactor.com',
    minCreditScore: 650,
    maxCreditScore: 850,
    minMonthlyVolume: 20000,
    maxMonthlyVolume: 500000,
    equipmentTypes: ['dry_van', 'flatbed'],
    statesServed: ['AR', 'TX'],
    advanceRate: 95,
    factoringFee: 2.5,
    contractTerm: 12,
    recourse: true,
    fuelCardProgram: true,
    fuelDiscounts: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
}

function validLead() {
  return {
    id: 'lead-001',
    authorityId: 'rec-001',
    status: 'new' as const,
    source: 'fmcsa_import' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
}

function validMatchResult() {
  return {
    leadId: 'lead-001',
    factorId: 'fp-001',
    score: 85,
    reasons: ['Credit score within range', 'Volume within range'],
    matchedAt: new Date('2024-01-01'),
  };
}

// ─── AuthorityRecordSchema ─────────────────────────────────────────────────

describe('AuthorityRecordSchema', () => {
  it('parses a valid authority record', () => {
    expect(() => AuthorityRecordSchema.parse(validAuthorityRecord())).not.toThrow();
  });

  it('returns the correct shape', () => {
    const result = AuthorityRecordSchema.parse(validAuthorityRecord());
    expect(result.id).toBe('rec-001');
    expect(result.creditScore).toBe(720);
    expect(result.location.state).toBe('AR');
  });

  describe('contactEmail', () => {
    it('rejects invalid email', () => {
      expect(() =>
        AuthorityRecordSchema.parse({ ...validAuthorityRecord(), contactEmail: 'not-an-email' }),
      ).toThrow(z.ZodError);
    });

    it('accepts valid email', () => {
      expect(() =>
        AuthorityRecordSchema.parse({ ...validAuthorityRecord(), contactEmail: 'valid@example.com' }),
      ).not.toThrow();
    });
  });

  describe('creditScore', () => {
    it('rejects credit score below 300', () => {
      expect(() =>
        AuthorityRecordSchema.parse({ ...validAuthorityRecord(), creditScore: 299 }),
      ).toThrow(z.ZodError);
    });

    it('rejects credit score above 850', () => {
      expect(() =>
        AuthorityRecordSchema.parse({ ...validAuthorityRecord(), creditScore: 851 }),
      ).toThrow(z.ZodError);
    });

    it('accepts boundary values 300 and 850', () => {
      expect(() =>
        AuthorityRecordSchema.parse({ ...validAuthorityRecord(), creditScore: 300 }),
      ).not.toThrow();
      expect(() =>
        AuthorityRecordSchema.parse({ ...validAuthorityRecord(), creditScore: 850 }),
      ).not.toThrow();
    });
  });

  describe('factoringStatus', () => {
    it('accepts valid enum values', () => {
      for (const status of ['active', 'inactive', 'pending'] as const) {
        expect(() =>
          AuthorityRecordSchema.parse({ ...validAuthorityRecord(), factoringStatus: status }),
        ).not.toThrow();
      }
    });

    it('rejects invalid factoringStatus', () => {
      expect(() =>
        AuthorityRecordSchema.parse({ ...validAuthorityRecord(), factoringStatus: 'unknown' }),
      ).toThrow(z.ZodError);
    });
  });

  describe('safetyRating', () => {
    it('accepts valid enum values', () => {
      for (const rating of ['satisfactory', 'conditional', 'unsatisfactory'] as const) {
        expect(() =>
          AuthorityRecordSchema.parse({ ...validAuthorityRecord(), safetyRating: rating }),
        ).not.toThrow();
      }
    });

    it('rejects invalid safetyRating', () => {
      expect(() =>
        AuthorityRecordSchema.parse({ ...validAuthorityRecord(), safetyRating: 'excellent' }),
      ).toThrow(z.ZodError);
    });
  });

  describe('required fields', () => {
    const requiredFields = ['id', 'mcNumber', 'dotNumber', 'companyName', 'contactEmail', 'contactPhone'];
    for (const field of requiredFields) {
      it(`rejects missing ${field}`, () => {
        const data = { ...validAuthorityRecord() };
        delete (data as any)[field];
        expect(() => AuthorityRecordSchema.parse(data)).toThrow(z.ZodError);
      });
    }
  });

  it('rejects missing location', () => {
    const data = { ...validAuthorityRecord() };
    delete (data as any).location;
    expect(() => AuthorityRecordSchema.parse(data)).toThrow(z.ZodError);
  });

  it('rejects non-array equipmentTypes', () => {
    expect(() =>
      AuthorityRecordSchema.parse({ ...validAuthorityRecord(), equipmentTypes: 'dry_van' }),
    ).toThrow(z.ZodError);
  });
});

// ─── FactorProfileSchema ───────────────────────────────────────────────────

describe('FactorProfileSchema', () => {
  it('parses a valid factor profile', () => {
    expect(() => FactorProfileSchema.parse(validFactorProfile())).not.toThrow();
  });

  it('returns the correct shape', () => {
    const result = FactorProfileSchema.parse(validFactorProfile());
    expect(result.id).toBe('fp-001');
    expect(result.advanceRate).toBe(95);
    expect(result.recourse).toBe(true);
  });

  describe('website', () => {
    it('rejects invalid URL', () => {
      expect(() =>
        FactorProfileSchema.parse({ ...validFactorProfile(), website: 'not-a-url' }),
      ).toThrow(z.ZodError);
    });

    it('accepts valid URL', () => {
      expect(() =>
        FactorProfileSchema.parse({ ...validFactorProfile(), website: 'https://example.com' }),
      ).not.toThrow();
    });
  });

  describe('optional fields', () => {
    it('accepts missing maxMonthlyVolume', () => {
      const data = { ...validFactorProfile() };
      delete (data as any).maxMonthlyVolume;
      expect(() => FactorProfileSchema.parse(data)).not.toThrow();
    });

    it('accepts missing setupFee', () => {
      const data = { ...validFactorProfile() };
      delete (data as any).setupFee;
      expect(() => FactorProfileSchema.parse(data)).not.toThrow();
    });

    it('accepts missing monthlyMinimum', () => {
      const data = { ...validFactorProfile() };
      delete (data as any).monthlyMinimum;
      expect(() => FactorProfileSchema.parse(data)).not.toThrow();
    });
  });

  describe('required fields', () => {
    const requiredFields = ['id', 'name', 'website', 'minCreditScore', 'minMonthlyVolume', 'advanceRate', 'factoringFee', 'contractTerm'];
    for (const field of requiredFields) {
      it(`rejects missing ${field}`, () => {
        const data = { ...validFactorProfile() };
        delete (data as any)[field];
        expect(() => FactorProfileSchema.parse(data)).toThrow(z.ZodError);
      });
    }
  });

  it('rejects non-array equipmentTypes', () => {
    expect(() =>
      FactorProfileSchema.parse({ ...validFactorProfile(), equipmentTypes: 'dry_van' }),
    ).toThrow(z.ZodError);
  });

  it('rejects non-array statesServed', () => {
    expect(() =>
      FactorProfileSchema.parse({ ...validFactorProfile(), statesServed: 'AR' }),
    ).toThrow(z.ZodError);
  });
});

// ─── LeadSchema ────────────────────────────────────────────────────────────

describe('LeadSchema', () => {
  it('parses a valid lead', () => {
    expect(() => LeadSchema.parse(validLead())).not.toThrow();
  });

  it('returns the correct shape', () => {
    const result = LeadSchema.parse(validLead());
    expect(result.id).toBe('lead-001');
    expect(result.status).toBe('new');
    expect(result.source).toBe('fmcsa_import');
  });

  describe('status enum', () => {
    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'archived'] as const;
    for (const status of validStatuses) {
      it(`accepts status "${status}"`, () => {
        expect(() => LeadSchema.parse({ ...validLead(), status })).not.toThrow();
      });
    }

    it('rejects invalid status', () => {
      expect(() =>
        LeadSchema.parse({ ...validLead(), status: 'unknown' }),
      ).toThrow(z.ZodError);
    });
  });

  describe('source enum', () => {
    const validSources = ['fmcsa_import', 'web_form', 'manual_entry', 'api'] as const;
    for (const source of validSources) {
      it(`accepts source "${source}"`, () => {
        expect(() => LeadSchema.parse({ ...validLead(), source })).not.toThrow();
      });
    }

    it('rejects invalid source', () => {
      expect(() =>
        LeadSchema.parse({ ...validLead(), source: 'unknown_source' }),
      ).toThrow(z.ZodError);
    });
  });

  describe('optional fields', () => {
    it('accepts missing factorId', () => {
      const data = { ...validLead() };
      delete (data as any).factorId;
      expect(() => LeadSchema.parse(data)).not.toThrow();
    });

    it('accepts missing claimedAt', () => {
      const data = { ...validLead() };
      delete (data as any).claimedAt;
      expect(() => LeadSchema.parse(data)).not.toThrow();
    });

    it('accepts missing convertedAt', () => {
      const data = { ...validLead() };
      delete (data as any).convertedAt;
      expect(() => LeadSchema.parse(data)).not.toThrow();
    });

    it('accepts missing notes', () => {
      const data = { ...validLead() };
      delete (data as any).notes;
      expect(() => LeadSchema.parse(data)).not.toThrow();
    });

    it('accepts missing matchScore', () => {
      const data = { ...validLead() };
      delete (data as any).matchScore;
      expect(() => LeadSchema.parse(data)).not.toThrow();
    });
  });

  describe('required fields', () => {
    const requiredFields = ['id', 'authorityId', 'status', 'source', 'createdAt', 'updatedAt'];
    for (const field of requiredFields) {
      it(`rejects missing ${field}`, () => {
        const data = { ...validLead() };
        delete (data as any)[field];
        expect(() => LeadSchema.parse(data)).toThrow(z.ZodError);
      });
    }
  });
});

// ─── MatchResultSchema ─────────────────────────────────────────────────────

describe('MatchResultSchema', () => {
  it('parses a valid match result', () => {
    expect(() => MatchResultSchema.parse(validMatchResult())).not.toThrow();
  });

  it('returns the correct shape', () => {
    const result = MatchResultSchema.parse(validMatchResult());
    expect(result.leadId).toBe('lead-001');
    expect(result.factorId).toBe('fp-001');
    expect(result.score).toBe(85);
    expect(result.reasons).toHaveLength(2);
  });

  describe('score', () => {
    it('rejects score below 0', () => {
      expect(() =>
        MatchResultSchema.parse({ ...validMatchResult(), score: -1 }),
      ).toThrow(z.ZodError);
    });

    it('rejects score above 100', () => {
      expect(() =>
        MatchResultSchema.parse({ ...validMatchResult(), score: 101 }),
      ).toThrow(z.ZodError);
    });

    it('accepts boundary values 0 and 100', () => {
      expect(() =>
        MatchResultSchema.parse({ ...validMatchResult(), score: 0 }),
      ).not.toThrow();
      expect(() =>
        MatchResultSchema.parse({ ...validMatchResult(), score: 100 }),
      ).not.toThrow();
    });
  });

  describe('reasons', () => {
    it('accepts empty reasons array', () => {
      expect(() =>
        MatchResultSchema.parse({ ...validMatchResult(), reasons: [] }),
      ).not.toThrow();
    });

    it('rejects non-array reasons', () => {
      expect(() =>
        MatchResultSchema.parse({ ...validMatchResult(), reasons: 'some reason' }),
      ).toThrow(z.ZodError);
    });
  });

  describe('required fields', () => {
    const requiredFields = ['leadId', 'factorId', 'score', 'reasons', 'matchedAt'];
    for (const field of requiredFields) {
      it(`rejects missing ${field}`, () => {
        const data = { ...validMatchResult() };
        delete (data as any)[field];
        expect(() => MatchResultSchema.parse(data)).toThrow(z.ZodError);
      });
    }
  });
});
