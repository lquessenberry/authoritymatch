/**
 * Authority Types
 * Core data models for freight authorities
 */

export interface PhysicalAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  latitude?: number;
  longitude?: number;
}

export interface MailingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface SafetyRating {
  rating: 'S' | 'C' | 'U' | 'N' | null; // Satisfactory, Conditional, Unsatisfactory, None
  reviewDate?: string;
  reviewType?: string;
  oosRate?: number;           // Out of Service rate
  crashRate?: number;
  // CSA BASIC Percentiles (0-100, lower is better)
  driverFitness?: number;
  vehicleMaintenance?: number;
  controlledSubstances?: number;
  hazmatCompliance?: number;
  hoursOfService?: number;
  unsafeDriving?: number;
}

export interface Insurance {
  form?: string;               // BMC-91, MCS-90, etc.
  type?: string;
  coverageFrom?: number;
  coverageTo?: number;
  effectiveDate?: string;
  cancellationDate?: string;
  status: 'A' | 'I' | null;   // Active, Inactive
}

export interface Authority {
  // Identifiers
  id: string;
  dotNumber: string;
  mcNumber?: string;
  docketNumbers?: string[];
  
  // Basic Info
  legalName: string;
  dbaName?: string;
  carrierOperation: 'A' | 'B' | 'C' | string; // A=Interstate, B=Intrastate, C=Both
  entityType?: string;
  
  // Addresses
  physicalAddress: PhysicalAddress;
  mailingAddress?: MailingAddress;
  
  // Contact
  phone?: string;
  fax?: string;
  email?: string;
  
  // Metrics
  totalDrivers: number;
  totalPowerUnits: number;
  mcs150Date?: string;
  addDate?: string;
  
  // Status
  status: 'A' | 'I' | 'N' | string; // Active, Inactive, Not Authorized
  
  // Safety & Compliance
  safetyRating?: SafetyRating;
  insurance?: Insurance;
  
  // Operations
  cargoTypes?: string[];
  operationClassifications?: string[];
  
  // AuthorityMatch specific
  authorityScore?: AuthorityScore;
  
  // Metadata
  source: 'FMCSA_API' | 'FMCSA_CSV' | 'MANUAL';
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
  version: number;
}

export interface AuthorityScore {
  overall: number;
  grade: Grade;
  
  safety: ScoreComponent;
  stability: ScoreComponent;
  scale: ScoreComponent;
  compliance: ScoreComponent;
  geography: ScoreComponent;
  
  calculatedAt: string;
  calculationVersion: string;
  history?: ScoreHistoryPoint[];
}

export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D' | 'F' | null;

export interface ScoreComponent {
  score: number;
  weight: number;
  factors: Record<string, number>;
}

export interface ScoreHistoryPoint {
  date: string;
  score: number;
}

// Authority Change Tracking
export interface AuthorityChange {
  id: string;
  authorityId: string;
  dotNumber: string;
  
  field: string;
  previousValue: unknown;
  newValue: unknown;
  importance: 'MINOR' | 'MAJOR' | 'CRITICAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  source: 'FMCSA_API' | 'FMCSA_CSV' | 'MANUAL' | 'FACTOR_REPORT';
  sourceDetails?: string;
  
  detectedAt: string;
  appliedAt?: string;
  appliedBy?: string;
  
  reviewStatus: 'AUTO_APPLIED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// Filter/Query Types
export interface AuthorityFilter {
  state?: string[];
  status?: ('A' | 'I' | 'N')[];
  minScore?: number;
  maxScore?: number;
  minFleetSize?: number;
  maxFleetSize?: number;
  safetyRating?: ('S' | 'C' | 'U' | 'N')[];
  hasInsurance?: boolean;
  search?: string;
}

export interface AuthoritySort {
  field: 'dotNumber' | 'legalName' | 'state' | 'score' | 'updatedAt' | 'totalDrivers';
  direction: 'asc' | 'desc';
}

export interface AuthorityListOptions {
  filter?: AuthorityFilter;
  sort?: AuthoritySort;
  pagination?: {
    page: number;
    limit: number;
  };
}
