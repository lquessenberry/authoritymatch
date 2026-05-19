/**
 * Grading Configuration
 * Default scoring weights and rules
 */

export interface GradingConfig {
  version: string;
  active: boolean;
  weights: {
    safety: number;
    stability: number;
    scale: number;
    compliance: number;
    geography: number;
  };
  safetyRules: {
    satisfactoryRatingBonus: number;
    conditionalRatingPenalty: number;
    unsatisfactoryRatingPenalty: number;
    maxAcceptableOosRate: number;
    csaThresholds: {
      alert: number;
      warning: number;
      critical: number;
    };
  };
  stabilityRules: {
    minAuthorityAgeMonths: number;
    newAuthorityPenalty: number;
    veteranBonusThreshold: number;
    veteranBonus: number;
  };
  scaleRules: {
    fleetSizeTiers: {
      micro: [number, number];
      small: [number, number];
      medium: [number, number];
      large: [number, number];
      enterprise: [number, number];
    };
    driverToPowerUnitIdealRatio: number;
  };
  complianceRules: {
    requireActiveInsurance: boolean;
    requireMcs150WithinDays: number;
    maxNameChangeFrequency: number;
  };
  geographyRules: {
    stateRiskScores: Record<string, number>;
    preferredStatesBonus: number;
    highRiskStatePenalty: number;
  };
  gradeBoundaries: {
    'A+': [number, number];
    'A': [number, number];
    'A-': [number, number];
    'B+': [number, number];
    'B': [number, number];
    'B-': [number, number];
    'C+': [number, number];
    'C': [number, number];
    'D': [number, number];
    'F': [number, number];
  };
}

/**
 * Default scoring configuration
 */
export const DEFAULT_CONFIG: GradingConfig = {
  version: '1.0.0',
  active: true,
  
  // Component weights (must sum to 1.0)
  weights: {
    safety: 0.30,      // 30% - Safety is paramount
    stability: 0.25,   // 25% - Longevity matters
    scale: 0.20,       // 20% - Size indicates success
    compliance: 0.15,  // 15% - Following rules
    geography: 0.10,   // 10% - Location factors
  },
  
  // Safety scoring rules
  safetyRules: {
    satisfactoryRatingBonus: 30,
    conditionalRatingPenalty: 15,
    unsatisfactoryRatingPenalty: 50,
    maxAcceptableOosRate: 0.10,  // 10% max OOS rate
    csaThresholds: {
      alert: 50,       // 50th percentile
      warning: 65,     // 65th percentile
      critical: 80,    // 80th percentile
    },
  },
  
  // Stability scoring rules
  stabilityRules: {
    minAuthorityAgeMonths: 6,      // 6 months minimum
    newAuthorityPenalty: 15,      // -15 points for new authorities
    veteranBonusThreshold: 5,       // 5 years for veteran status
    veteranBonus: 15,             // +15 points for veterans
  },
  
  // Scale scoring rules
  scaleRules: {
    fleetSizeTiers: {
      micro: [0, 5],
      small: [6, 20],
      medium: [21, 100],
      large: [101, 500],
      enterprise: [501, Infinity],
    },
    driverToPowerUnitIdealRatio: 1.0,  // 1:1 ratio ideal
  },
  
  // Compliance scoring rules
  complianceRules: {
    requireActiveInsurance: true,
    requireMcs150WithinDays: 730,  // 2 years
    maxNameChangeFrequency: 3,       // Max 3 changes in 5 years
  },
  
  // Geography scoring rules
  geographyRules: {
    stateRiskScores: {
      // Lower = better (safer, more stable markets)
      'AR': 35,  // Arkansas - moderate
      'TX': 30,  // Texas - large market
      'CA': 40,  // California - high volume, some risk
      'FL': 35,  // Florida
      'GA': 30,  // Georgia
      'IL': 35,  // Illinois
      'IN': 30,  // Indiana
      'OH': 30,  // Ohio
      'PA': 35,  // Pennsylvania
      'NC': 35,  // North Carolina
      'NY': 45,  // New York - higher risk
      'NJ': 45,  // New Jersey
      'MI': 40,  // Michigan
      'TN': 30,  // Tennessee
      'AL': 35,  // Alabama
      'MS': 40,  // Mississippi
      'LA': 40,  // Louisiana
      'OK': 35,  // Oklahoma
      'MO': 35,  // Missouri
      'KY': 35,  // Kentucky
      'SC': 35,  // South Carolina
      'VA': 35,  // Virginia
      'WV': 40,  // West Virginia
      'WI': 35,  // Wisconsin
      'MN': 30,  // Minnesota
      'IA': 30,  // Iowa
      'KS': 35,  // Kansas
      'NE': 35,  // Nebraska
      'SD': 35,  // South Dakota
      'ND': 40,  // North Dakota
      'MT': 40,  // Montana
      'WY': 40,  // Wyoming
      'CO': 30,  // Colorado
      'NM': 40,  // New Mexico
      'AZ': 35,  // Arizona
      'NV': 40,  // Nevada
      'UT': 30,  // Utah
      'ID': 35,  // Idaho
      'OR': 35,  // Oregon
      'WA': 30,  // Washington
      'ME': 40,  // Maine
      'NH': 35,  // New Hampshire
      'VT': 40,  // Vermont
      'MA': 40,  // Massachusetts
      'RI': 40,  // Rhode Island
      'CT': 40,  // Connecticut
      'DE': 40,  // Delaware
      'MD': 40,  // Maryland
      'DC': 50,  // DC - highest risk
      'AK': 45,  // Alaska
      'HI': 45,  // Hawaii
    },
    preferredStatesBonus: 5,      // +5 for being in a good state
    highRiskStatePenalty: 10,     // -10 for high-risk states
  },
  
  // Grade boundaries (0-100 scale)
  gradeBoundaries: {
    'A+': [95, 100],
    'A':  [90, 94],
    'A-': [85, 89],
    'B+': [80, 84],
    'B':  [75, 79],
    'B-': [70, 74],
    'C+': [65, 69],
    'C':  [60, 64],
    'D':  [50, 59],
    'F':  [0, 49],
  },
};

/**
 * Risk-based configurations for different factor types
 */
export const CONSERVATIVE_CONFIG: GradingConfig = {
  ...DEFAULT_CONFIG,
  version: '1.0.0-conservative',
  weights: {
    ...DEFAULT_CONFIG.weights,
    safety: 0.40,      // Higher weight on safety
    stability: 0.30,
    scale: 0.15,
    compliance: 0.15,
    geography: 0.00,
  },
  safetyRules: {
    ...DEFAULT_CONFIG.safetyRules,
    maxAcceptableOosRate: 0.05,  // Stricter OOS limit
  },
};

export const AGGRESSIVE_CONFIG: GradingConfig = {
  ...DEFAULT_CONFIG,
  version: '1.0.0-aggressive',
  weights: {
    ...DEFAULT_CONFIG.weights,
    safety: 0.20,      // Lower weight on safety
    stability: 0.15,
    scale: 0.35,       // Higher on growth potential
    compliance: 0.15,
    geography: 0.15,
  },
};
