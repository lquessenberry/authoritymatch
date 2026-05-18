import { z } from 'zod';

// Authority Record (Trucker)
export const AuthorityRecordSchema = z.object({
  id: z.string(),
  mcNumber: z.string(),
  dotNumber: z.string(),
  companyName: z.string(),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
  authorityDate: z.date(),
  equipmentTypes: z.array(z.string()),
  factoringStatus: z.enum(['active', 'inactive', 'pending']),
  creditScore: z.number().min(300).max(850),
  monthlyVolume: z.number(),
  yearsInBusiness: z.number(),
  safetyRating: z.enum(['satisfactory', 'conditional', 'unsatisfactory']),
  location: z.object({
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AuthorityRecord = z.infer<typeof AuthorityRecordSchema>;

// Factor Profile
export const FactorProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  website: z.string().url(),
  minCreditScore: z.number(),
  maxCreditScore: z.number(),
  minMonthlyVolume: z.number(),
  maxMonthlyVolume: z.number().optional(),
  equipmentTypes: z.array(z.string()),
  statesServed: z.array(z.string()),
  advanceRate: z.number(), // percentage
  factoringFee: z.number(), // percentage
  setupFee: z.number().optional(),
  monthlyMinimum: z.number().optional(),
  contractTerm: z.number(), // months
  recourse: z.boolean(),
  fuelCardProgram: z.boolean(),
  fuelDiscounts: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FactorProfile = z.infer<typeof FactorProfileSchema>;

// Lead
export const LeadSchema = z.object({
  id: z.string(),
  authorityId: z.string(),
  factorId: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'archived']),
  source: z.enum(['fmcsa_import', 'web_form', 'manual_entry', 'api']),
  claimedAt: z.date().optional(),
  convertedAt: z.date().optional(),
  notes: z.string().optional(),
  matchScore: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Lead = z.infer<typeof LeadSchema>;

// Match Result
export const MatchResultSchema = z.object({
  leadId: z.string(),
  factorId: z.string(),
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  matchedAt: z.date(),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;
