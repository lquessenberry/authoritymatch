/**
 * Shared test fixtures for @authoritymatch/core tests
 */

import type { Authority } from '../types/authority';
import type { Factor } from '../types/factor';
import type { AuthorityRecord, FactorProfile } from '../types';

// ─── Authority fixtures ────────────────────────────────────────────────────

export const makeAuthority = (overrides: Partial<Authority> = {}): Authority => ({
  id: 'auth-001',
  dotNumber: '1234567',
  mcNumber: 'MC-123456',
  legalName: 'Test Trucking LLC',
  dbaName: 'Test Trucking',
  carrierOperation: 'A',
  entityType: 'LLC',
  physicalAddress: {
    street: '123 Main St',
    city: 'Little Rock',
    state: 'AR',
    zip: '72201',
  },
  phone: '501-555-0100',
  totalDrivers: 15,
  totalPowerUnits: 15,
  status: 'A',
  safetyRating: {
    rating: 'S',
    oosRate: 0.05,
    crashRate: 0,
    driverFitness: 20,
    vehicleMaintenance: 25,
    controlledSubstances: 10,
    hazmatCompliance: 15,
    hoursOfService: 30,
    unsafeDriving: 20,
  },
  insurance: {
    status: 'A',
    form: 'BMC-91',
  },
  addDate: '2018-06-01',
  mcs150Date: '2023-01-15',
  cargoTypes: ['DRY_VAN', 'FLATBED'],
  source: 'FMCSA_CSV',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  lastSyncedAt: '2024-01-01T00:00:00Z',
  version: 1,
  ...overrides,
});

export const makeNewAuthority = (): Authority =>
  makeAuthority({
    id: 'auth-new',
    dotNumber: '9999999',
    legalName: 'Brand New Carrier LLC',
    addDate: new Date().toISOString().substring(0, 10), // today
    totalDrivers: 2,
    totalPowerUnits: 2,
    safetyRating: { rating: null },
    insurance: { status: null },
  });

export const makeUnsatisfactoryAuthority = (): Authority =>
  makeAuthority({
    id: 'auth-bad',
    dotNumber: '0000001',
    legalName: 'Risky Carrier Inc',
    safetyRating: {
      rating: 'U',
      oosRate: 0.25,
      crashRate: 5,
      driverFitness: 80,
      vehicleMaintenance: 85,
      controlledSubstances: 70,
      hazmatCompliance: 60,
      hoursOfService: 75,
      unsafeDriving: 90,
    },
    insurance: { status: 'I' },
    status: 'I',
    totalDrivers: 3,
    totalPowerUnits: 3,
  });

export const makeLargeAuthority = (): Authority =>
  makeAuthority({
    id: 'auth-large',
    dotNumber: '7654321',
    legalName: 'Big Fleet Corp',
    totalDrivers: 600,
    totalPowerUnits: 580,
    addDate: '2005-01-01',
    safetyRating: {
      rating: 'S',
      oosRate: 0.02,
      crashRate: 0,
      driverFitness: 10,
      vehicleMaintenance: 12,
      controlledSubstances: 5,
      hazmatCompliance: 8,
      hoursOfService: 15,
      unsafeDriving: 10,
    },
  });

// ─── Factor fixtures ───────────────────────────────────────────────────────

export const makeFactor = (overrides: Partial<Factor> = {}): Factor => ({
  id: 'factor-001',
  companyName: 'Premier Factoring Co',
  legalName: 'Premier Factoring Company LLC',
  taxId: '12-3456789',
  status: 'ACTIVE',
  verificationStatus: 'VERIFIED',
  contactInfo: {
    email: 'contact@premierfactoring.com',
    phone: '800-555-0200',
    address: {
      street: '456 Finance Ave',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
    },
  },
  preferences: {
    preferredStates: ['AR', 'TX', 'TN', 'OK', 'LA'],
    excludedStates: ['NY', 'NJ', 'CA'],
    preferredRegions: ['South', 'Southwest'],
    minFleetSize: 5,
    maxFleetSize: 200,
    preferredFleetSizeRange: [10, 100],
    minAuthorityScore: 60,
    minSafetyRating: 'C',
    maxOosRate: 0.15,
    requiredInsurance: true,
    preferredCargoTypes: ['DRY_VAN', 'FLATBED', 'REEFER'],
    excludedCargoTypes: ['HAZMAT'],
    riskTolerance: 'MODERATE',
    acceptConditionalRatings: true,
    acceptNewAuthorities: false,
    maxAcceptableClaims: 3,
    maxAdvanceRate: 0.97,
  },
  offerings: {
    advanceRates: [0.90, 0.93, 0.95, 0.97],
    baseFee: 2.5,
    feeStructure: 'FLAT',
    services: {
      recourse: true,
      nonRecourse: false,
      fuelAdvances: true,
      fuelCards: true,
      creditChecks: true,
      collections: true,
      accounting: false,
      mobileApp: true,
    },
    contractTerm: 'ANNUAL',
    minVolume: 10000,
    maxVolume: 500000,
    fundingSpeed: 24,
    applicationProcess: 'SEMI_AUTO',
  },
  metrics: {
    totalClients: 250,
    activeClients: 220,
    totalVolumeYTD: 12000000,
    averageClientSize: 50000,
    averageFundingTime: 20,
    clientRetentionRate: 0.88,
    defaultRate: 0.02,
    claimRate: 0.01,
    clientSatisfaction: 4.3,
    responseTime: 60,
    matchAcceptanceRate: 0.65,
    acceptedMatches: 130,
    declinedMatches: 70,
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const makeConservativeFactor = (): Factor =>
  makeFactor({
    id: 'factor-conservative',
    companyName: 'Safe Harbor Factoring',
    preferences: {
      ...makeFactor().preferences,
      riskTolerance: 'CONSERVATIVE',
      minSafetyRating: 'S',
      maxOosRate: 0.05,
      acceptConditionalRatings: false,
      acceptNewAuthorities: false,
      minAuthorityScore: 75,
    },
  });

export const makeAggressiveFactor = (): Factor =>
  makeFactor({
    id: 'factor-aggressive',
    companyName: 'Growth Capital Factoring',
    preferences: {
      ...makeFactor().preferences,
      riskTolerance: 'AGGRESSIVE',
      minSafetyRating: null,
      maxOosRate: 0.30,
      acceptConditionalRatings: true,
      acceptNewAuthorities: true,
      minAuthorityScore: 40,
      minFleetSize: 1,
    },
  });

// ─── AuthorityRecord fixtures (for matching/index.ts) ─────────────────────

export const makeAuthorityRecord = (overrides: Partial<AuthorityRecord> = {}): AuthorityRecord => ({
  id: 'rec-001',
  mcNumber: 'MC-111111',
  dotNumber: '1111111',
  companyName: 'Record Trucking LLC',
  contactEmail: 'info@recordtrucking.com',
  contactPhone: '501-555-0300',
  authorityDate: new Date('2019-03-15'),
  equipmentTypes: ['dry_van', 'flatbed'],
  factoringStatus: 'inactive',
  creditScore: 720,
  monthlyVolume: 75000,
  yearsInBusiness: 5,
  safetyRating: 'satisfactory',
  location: { city: 'Little Rock', state: 'AR', zip: '72201' },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const makeFactorProfile = (overrides: Partial<FactorProfile> = {}): FactorProfile => ({
  id: 'fp-001',
  name: 'Test Factor',
  website: 'https://testfactor.com',
  minCreditScore: 650,
  maxCreditScore: 850,
  minMonthlyVolume: 20000,
  maxMonthlyVolume: 500000,
  equipmentTypes: ['dry_van', 'flatbed', 'reefer'],
  statesServed: ['AR', 'TX', 'TN', 'OK', 'LA'],
  advanceRate: 95,
  factoringFee: 2.5,
  contractTerm: 12,
  recourse: true,
  fuelCardProgram: true,
  fuelDiscounts: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
