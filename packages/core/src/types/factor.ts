/**
 * Factor Types
 * Factoring company entities and preferences
 */

import type { PhysicalAddress } from './authority';

export interface Factor {
  id: string;
  
  // Company Info
  companyName: string;
  legalName: string;
  taxId: string;
  
  // Status
  status: FactorStatus;
  verificationStatus: VerificationStatus;
  
  // Contact
  contactInfo: FactorContact;
  
  // Preferences & Offerings
  preferences: FactorPreferences;
  offerings: FactorOfferings;
  
  // Performance
  metrics: FactorMetrics;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  onboardedAt?: string;
}

export type FactorStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED';

export interface FactorContact {
  email: string;
  phone: string;
  website?: string;
  address: PhysicalAddress;
}

export interface FactorPreferences {
  // Geographic
  preferredStates: string[];
  excludedStates: string[];
  preferredRegions?: string[];
  maxDistance?: number;
  
  // Fleet Requirements
  minFleetSize: number;
  maxFleetSize: number;
  preferredFleetSizeRange: [number, number];
  
  // Authority Quality
  minAuthorityScore: number;
  minSafetyRating: 'S' | 'C' | 'U' | null;
  maxOosRate: number;
  requiredInsurance: boolean;
  
  // Operational
  preferredCargoTypes?: string[];
  excludedCargoTypes?: string[];
  preferredOperationTypes?: string[];
  
  // Financial
  minMonthlyRevenue?: number;
  maxAdvanceRate: number;
  minTimeInBusiness?: number;
  
  // Risk
  riskTolerance: RiskTolerance;
  acceptConditionalRatings: boolean;
  acceptNewAuthorities: boolean;
  maxAcceptableClaims: number;
}

export type RiskTolerance = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';

export interface FactorOfferings {
  // Rates & Terms
  advanceRates: number[];
  baseFee: number;
  feeStructure: FeeStructure;
  
  // Services
  services: FactorServices;
  
  // Contract
  contractTerm: ContractTerm;
  minVolume?: number;
  maxVolume?: number;
  setupFee?: number;
  terminationFee?: number;
  
  // Performance
  fundingSpeed: number;        // Hours
  applicationProcess: ApplicationProcess;
}

export type FeeStructure = 'FLAT' | 'TIERED' | 'VOLUME_BASED';
export type ContractTerm = 'MONTHLY' | 'ANNUAL' | 'NONE';
export type ApplicationProcess = 'MANUAL' | 'SEMI_AUTO' | 'FULL_AUTO';

export interface FactorServices {
  recourse: boolean;
  nonRecourse: boolean;
  fuelAdvances: boolean;
  fuelCards: boolean;
  creditChecks: boolean;
  collections: boolean;
  accounting: boolean;
  mobileApp: boolean;
}

export interface FactorMetrics {
  // Volume
  totalClients: number;
  activeClients: number;
  totalVolumeYTD: number;
  averageClientSize: number;
  
  // Performance
  averageFundingTime: number;     // Hours
  clientRetentionRate: number;    // 0-1
  defaultRate: number;
  claimRate: number;
  
  // Ratings
  clientSatisfaction: number;       // 0-5
  industryRating?: string;
  bbbRating?: string;
  
  // Platform
  responseTime: number;           // Minutes
  matchAcceptanceRate: number;
  acceptedMatches: number;
  declinedMatches: number;
}

// Match Types
export interface Match {
  id: string;
  authorityId: string;
  factorId: string;
  
  // Scoring
  score: number;
  compatibility: CompatibilityBreakdown;
  
  // Status
  status: MatchStatus;
  
  // Timeline
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  expiresAt?: string;
  
  // Terms
  proposedTerms?: ProposedTerms;
  finalTerms?: FinalTerms;
  
  // Feedback
  authorityFeedback?: AuthorityFeedback;
  factorFeedback?: FactorFeedback;
}

export type MatchStatus = 
  | 'PENDING' 
  | 'SENT' 
  | 'VIEWED' 
  | 'INTERESTED' 
  | 'ACCEPTED' 
  | 'DECLINED' 
  | 'EXPIRED';

export interface CompatibilityBreakdown {
  geographic: number;
  fleetSize: number;
  riskProfile: number;
  preferences: number;
  financial: number;
}

export interface ProposedTerms {
  advanceRate: number;
  fee: number;
  estimatedMonthlyVolume: number;
  notes?: string;
}

export interface FinalTerms {
  advanceRate: number;
  fee: number;
  contractStart: string;
  contractEnd?: string;
}

export interface AuthorityFeedback {
  rating: number;
  comments?: string;
  selected: boolean;
}

export interface FactorFeedback {
  rating: number;
  declinedReason?: string;
  internalNotes?: string;
}

// Filter/Query Types
export interface FactorFilter {
  status?: FactorStatus[];
  verificationStatus?: VerificationStatus[];
  riskTolerance?: RiskTolerance[];
  minAdvanceRate?: number;
  maxFee?: number;
  services?: (keyof FactorServices)[];
  states?: string[];
}
