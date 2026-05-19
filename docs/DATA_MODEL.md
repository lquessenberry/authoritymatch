# AuthorityMatch Data Model

## Core Entities

### 1. Authority (Fleet/Carrier)

The central entity representing a freight authority from FMCSA.

```typescript
interface Authority {
  // Identifiers
  id: string;                    // UUID internal
  dotNumber: string;             // FMCSA DOT# (unique)
  mcNumber?: string;             // MC Authority number
  docketNumbers?: string[];      // Additional dockets
  
  // Basic Info
  legalName: string;
  dbaName?: string;
  carrierOperation: 'A' | 'B' | 'C'; // A=Interstate, B=Intrastate, C=Both
  
  // Physical Address
  physicalAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    county?: string;
    latitude?: number;
    longitude?: number;
  };
  
  // Mailing Address
  mailingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Contact
  phone?: string;
  fax?: string;
  email?: string;
  
  // Operational Metrics
  totalDrivers: number;
  totalPowerUnits: number;
  mcs150Date?: Date;            // Last MCS-150 update
  addDate: Date;                // When added to FMCSA
  
  // Status
  status: 'A' | 'I' | 'N';      // Active, Inactive, Not Authorized
  entityType: string;           // Carrier, Broker, Shipper, etc.
  
  // Safety
  safetyRating?: {
    rating: 'S' | 'C' | 'U' | 'N'; // Satisfactory, Conditional, Unsatisfactory, None
    reviewDate?: Date;
    reviewType?: string;
    oosRate?: number;            // Out of Service rate
    crashRate?: number;
    driverFitness?: number;      // BASIC percentile
    vehicleMaintenance?: number;
    controlledSubstances?: number;
    hazmatCompliance?: number;
    hoursOfService?: number;
    unsafeDriving?: number;
  };
  
  // Insurance
  insurance?: {
    form: string;                // BMC-91, MCS-90, etc.
    type: string;
    coverageFrom?: number;
    coverageTo?: number;
    effectiveDate?: Date;
    cancellationDate?: Date;
    status: 'A' | 'I';           // Active, Inactive
  };
  
  // Cargo & Operations
  cargoTypes?: string[];
  operationClassifications?: string[];
  
  // Authority Match Specific
  authorityScore: AuthorityScore;
  matchPreferences?: MatchPreferences;
  
  // Metadata
  source: 'FMCSA_API' | 'FMCSA_CSV' | 'MANUAL';
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
  version: number;
}
```

### 2. AuthorityScore (Grading)

Comprehensive scoring model for authority quality assessment.

```typescript
interface AuthorityScore {
  // Overall Score (0-100)
  overall: number;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D' | 'F';
  
  // Component Scores
  safety: {
    score: number;              // 0-100
    weight: number;             // 30% of overall
    factors: {
      safetyRating: number;
      oosRate: number;
      crashHistory: number;
      csaScores: number;
    };
  };
  
  stability: {
    score: number;              // 0-100
    weight: number;             // 25% of overall
    factors: {
      yearsInBusiness: number;
      authorityAge: number;
      statusConsistency: number;
      nameChanges: number;
    };
  };
  
  scale: {
    score: number;              // 0-100
    weight: number;             // 20% of overall
    factors: {
      fleetSize: number;
      driverCount: number;
      powerUnitRatio: number;
      utilizationEstimate: number;
    };
  };
  
  compliance: {
    score: number;              // 0-100
    weight: number;             // 15% of overall
    factors: {
      insuranceActive: number;
      authorityStatus: number;
      mcs150Current: number;
      complianceHistory: number;
    };
  };
  
  geography: {
    score: number;              // 0-100
    weight: number;             // 10% of overall
    factors: {
      stateRisk: number;
      operatingRadius: number;
      routeDiversity: number;
      marketAccess: number;
    };
  };
  
  // Calculated At
  calculatedAt: Date;
  calculationVersion: string;
  
  // Historical Trend
  history?: {
    date: Date;
    score: number;
  }[];
}
```

### 3. Factor (Factoring Company)

Entities that provide factoring services to authorities.

```typescript
interface Factor {
  id: string;
  
  // Company Info
  companyName: string;
  legalName: string;
  taxId: string;
  
  // Status
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
  
  // Contact
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
    address: Address;
  };
  
  // Preferences (What they look for)
  preferences: FactorPreferences;
  
  // Offerings (What they provide)
  offerings: FactorOfferings;
  
  // Performance Metrics
  metrics: FactorMetrics;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  onboardedAt?: Date;
}

interface FactorPreferences {
  // Geographic
  preferredStates: string[];
  excludedStates: string[];
  preferredRegions?: string[];
  maxDistance?: number;          // Miles from factor location
  
  // Fleet Requirements
  minFleetSize: number;
  maxFleetSize: number;
  preferredFleetSizeRange: [number, number];
  
  // Authority Quality
  minAuthorityScore: number;
  minSafetyRating: 'S' | 'C' | 'U';
  maxOosRate: number;
  requiredInsurance: boolean;
  
  // Operational
  preferredCargoTypes?: string[];
  excludedCargoTypes?: string[];
  preferredOperationTypes?: string[];
  
  // Financial
  minMonthlyRevenue?: number;
  maxAdvanceRate: number;        // 80%, 90%, 95%
  minTimeInBusiness?: number;    // Months
  
  // Risk Tolerance
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  acceptConditionalRatings: boolean;
  acceptNewAuthorities: boolean;
  maxAcceptableClaims: number;
}

interface FactorOfferings {
  // Rates & Terms
  advanceRates: number[];        // [0.85, 0.90, 0.95]
  baseFee: number;               // 1.5% - 5%
  feeStructure: 'FLAT' | 'TIERED' | 'VOLUME_BASED';
  
  // Services
  services: {
    recourse: boolean;
    nonRecourse: boolean;
    fuelAdvances: boolean;
    fuelCards: boolean;
    creditChecks: boolean;
    collections: boolean;
    accounting: boolean;
    mobileApp: boolean;
  };
  
  // Terms
  contractTerm: 'MONTHLY' | 'ANNUAL' | 'NONE';
  minVolume?: number;
  maxVolume?: number;
  setupFee?: number;
  terminationFee?: number;
  
  // Speed
  fundingSpeed: number;           // Hours (24, 48, etc.)
  applicationProcess: 'MANUAL' | 'SEMI_AUTO' | 'FULL_AUTO';
}

interface FactorMetrics {
  // Volume
  totalClients: number;
  activeClients: number;
  totalVolumeYTD: number;
  averageClientSize: number;
  
  // Performance
  averageFundingTime: number;    // Hours
  clientRetentionRate: number;   // 0-1
  defaultRate: number;          // 0-1
  claimRate: number;
  
  // Ratings
  clientSatisfaction: number;    // 0-5
  industryRating?: string;
  bbbRating?: string;
  
  // Platform
  responseTime: number;          // Minutes avg
  matchAcceptanceRate: number;   // 0-1
  acceptedMatches: number;
  declinedMatches: number;
}
```

### 4. Match (Authority-Factor Connection)

Represents a potential or actual match between authority and factor.

```typescript
interface Match {
  id: string;
  
  // References
  authorityId: string;
  factorId: string;
  
  // Match Quality
  score: number;                 // 0-100 overall match
  compatibility: {
    geographic: number;          // 0-100
    fleetSize: number;
    riskProfile: number;
    preferences: number;
    financial: number;
  };
  
  // Status
  status: 'PENDING' | 'SENT' | 'VIEWED' | 'INTERESTED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  
  // Timeline
  createdAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  respondedAt?: Date;
  expiresAt?: Date;
  
  // Proposed Terms (if accepted)
  proposedTerms?: {
    advanceRate: number;
    fee: number;
    estimatedMonthlyVolume: number;
    notes?: string;
  };
  
  // Final Terms (if contracted)
  finalTerms?: {
    advanceRate: number;
    fee: number;
    contractStart: Date;
    contractEnd?: Date;
  };
  
  // Feedback
  authorityFeedback?: {
    rating: number;
    comments?: string;
    selected: boolean;
  };
  
  factorFeedback?: {
    rating: number;
    declinedReason?: string;
    internalNotes?: string;
  };
}
```

### 5. AuthorityChange (Audit Trail)

Tracks all changes to authority data for compliance and analysis.

```typescript
interface AuthorityChange {
  id: string;
  authorityId: string;
  dotNumber: string;
  
  // Change Details
  field: string;
  previousValue: any;
  newValue: any;
  importance: 'MINOR' | 'MAJOR' | 'CRITICAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Source
  source: 'FMCSA_API' | 'FMCSA_CSV' | 'MANUAL' | 'FACTOR_REPORT';
  sourceDetails?: string;
  
  // Impact
  affectedScores?: string[];
  triggeredAlerts?: boolean;
  matchReprocessing?: boolean;
  
  // Metadata
  detectedAt: Date;
  appliedAt?: Date;
  appliedBy?: string;
  
  // Review
  reviewStatus: 'AUTO_APPLIED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}
```

### 6. GradingConfiguration

Configurable rules for authority scoring.

```typescript
interface GradingConfiguration {
  version: string;
  active: boolean;
  
  // Weights (must sum to 1.0)
  weights: {
    safety: number;
    stability: number;
    scale: number;
    compliance: number;
    geography: number;
  };
  
  // Safety Rules
  safetyRules: {
    satisfactoryRatingBonus: number;
    conditionalRatingPenalty: number;
    unsatisfactoryRatingPenalty: number;
    maxAcceptableOosRate: number;
    csaThresholds: {
      alert: number;             // Percentile
      warning: number;
      critical: number;
    };
  };
  
  // Stability Rules
  stabilityRules: {
    minAuthorityAgeMonths: number;
    newAuthorityPenalty: number;
    veteranBonusThreshold: number; // 5+ years
    veteranBonus: number;
  };
  
  // Scale Rules
  scaleRules: {
    fleetSizeTiers: {
      micro: [0, 5];
      small: [6, 20];
      medium: [21, 100];
      large: [101, 500];
      enterprise: [501, Infinity];
    };
    driverToPowerUnitIdealRatio: number;
  };
  
  // Compliance Rules
  complianceRules: {
    requireActiveInsurance: boolean;
    requireMcs150WithinDays: number;
    maxNameChangeFrequency: number;
  };
  
  // Geography Rules
  geographyRules: {
    stateRiskScores: Record<string, number>;
    preferredStatesBonus: number;
    highRiskStatePenalty: number;
  };
  
  // Grade Boundaries
  gradeBoundaries: {
    'A+': [95, 100];
    'A': [90, 94];
    'A-': [85, 89];
    'B+': [80, 84];
    'B': [75, 79];
    'B-': [70, 74];
    'C+': [65, 69];
    'C': [60, 64];
    'D': [50, 59];
    'F': [0, 49];
  };
}
```

## Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA RELATIONSHIPS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐         ┌──────────────┐                    │
│   │  Authority   │◄────────│ AuthorityScore│ (1:1 current)      │
│   │              │◄────────│              │ (1:N history)      │
│   └──────┬───────┘         └──────────────┘                    │
│          │                                                      │
│          │ has many                                              │
│          ▼                                                      │
│   ┌──────────────┐                                              │
│   │    Match     │◄────────┐                                    │
│   │              │         │ belongs to                           │
│   └──────────────┘         │                                    │
│          ▲                 │                                    │
│          │                 │                                    │
│          │ belongs to     ▼                                    │
│   ┌──────────────┐         ┌──────────────┐                     │
│   │    Factor    │         │ AuthorityChange│ (audit trail)    │
│   │              │         │              │                    │
│   └──────┬───────┘         └──────────────┘                    │
│          │                                                      │
│          │ has one                                             │
│          ▼                                                      │
│   ┌──────────────┐                                              │
│   │FactorPrefs/  │                                              │
│   │  Offerings   │                                              │
│   └──────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Indexes

### Primary Indexes
- `authorities.dotNumber` - UNIQUE
- `authorities.state` + `authorities.status` - Composite
- `authorities.authorityScore.overall` - For sorting
- `factors.status` + `factors.preferences.riskTolerance`
- `matches.status` + `matches.createdAt`
- `authority_changes.authorityId` + `authority_changes.detectedAt`

### Geospatial Indexes
- `authorities.physicalAddress.latitude` + `longitude` - 2dsphere

### Full-Text Search
- `authorities.legalName` - Text index
- `authorities.dbaName` - Text index
- `factors.companyName` - Text index

## Data Flow

```
FMCSA API/CSV ──┬──► Authority Entity (create/update)
                │
                ├──► AuthorityChange (audit log)
                │
                ├──► AuthorityScore (recalculate)
                │
                ├──► Match (re-evaluate existing)
                │
                └──► Alert (if critical change)
```

## API Endpoints

### Authority Endpoints
```
GET    /api/v1/authorities              # List (paginated, filterable)
GET    /api/v1/authorities/:dotNumber   # Detail
GET    /api/v1/authorities/:id/score    # Current score breakdown
GET    /api/v1/authorities/:id/history  # Score history
GET    /api/v1/authorities/:id/changes  # Change log
POST   /api/v1/authorities/:id/enrich   # Force API enrichment
```

### Factor Endpoints
```
GET    /api/v1/factors                  # List (public subset)
GET    /api/v1/factors/:id              # Detail (if authorized)
POST   /api/v1/factors/:id/preferences  # Update preferences
GET    /api/v1/factors/:id/matches      # Match history
GET    /api/v1/factors/:id/metrics      # Performance metrics
```

### Match Endpoints
```
GET    /api/v1/matches                  # List (admin/factor filtered)
POST   /api/v1/matches                  # Create match
PUT    /api/v1/matches/:id/respond      # Accept/decline
GET    /api/v1/matches/recommendations  # AI recommendations
```

### Scoring Endpoints
```
GET    /api/v1/scores/calculate         # Trigger recalculation
GET    /api/v1/scores/config            # Get grading config
PUT    /api/v1/scores/config            # Update grading rules
POST   /api/v1/scores/batch            # Batch scoring
```

## Implementation Notes

1. **Authority Score Caching**: Recalculate on FMCSA data change, not on every read
2. **Match Pre-computation**: Pre-compute matches when authority scores change
3. **Change Audit**: All FMCSA updates logged for compliance
4. **Soft Deletes**: Never hard delete, mark as archived
5. **Versioning**: All config changes versioned
