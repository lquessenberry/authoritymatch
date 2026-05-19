/**
 * Authority Scoring Engine
 * Calculates comprehensive authority grades
 */

import type { Authority, AuthorityScore, ScoreComponent, Grade } from '../types/authority';
import type { GradingConfig } from './config';
import { DEFAULT_CONFIG } from './config';

export class ScoringEngine {
  private config: GradingConfig;
  
  constructor(config: GradingConfig = DEFAULT_CONFIG) {
    this.config = config;
  }
  
  /**
   * Calculate full authority score
   */
  calculateScore(authority: Authority): AuthorityScore {
    const safety = this.calculateSafetyScore(authority);
    const stability = this.calculateStabilityScore(authority);
    const scale = this.calculateScaleScore(authority);
    const compliance = this.calculateComplianceScore(authority);
    const geography = this.calculateGeographyScore(authority);
    
    // Weighted overall score
    const overall = Math.round(
      safety.score * safety.weight +
      stability.score * stability.weight +
      scale.score * scale.weight +
      compliance.score * compliance.weight +
      geography.score * geography.weight
    );
    
    return {
      overall,
      grade: this.scoreToGrade(overall),
      safety,
      stability,
      scale,
      compliance,
      geography,
      calculatedAt: new Date().toISOString(),
      calculationVersion: this.config.version,
    };
  }
  
  /**
   * Safety Score (30% weight)
   * Based on FMCSA safety ratings and CSA scores
   */
  private calculateSafetyScore(authority: Authority): ScoreComponent {
    const { safetyRules } = this.config;
    const safety = authority.safetyRating;
    const factors: Record<string, number> = {};
    
    let score = 70; // Start at C grade baseline
    
    if (safety) {
      // Safety rating (0-30 points)
      switch (safety.rating) {
        case 'S':
          factors.safetyRating = 30;
          break;
        case 'C':
          factors.safetyRating = 15;
          break;
        case 'U':
          factors.safetyRating = 0;
          break;
        default:
          factors.safetyRating = 10; // No rating yet
      }
      
      // OOS Rate (0-25 points)
      if (safety.oosRate !== undefined) {
        const maxRate = safetyRules.maxAcceptableOosRate;
        factors.oosRate = Math.max(0, 25 * (1 - safety.oosRate / maxRate));
      } else {
        factors.oosRate = 15; // Unknown = neutral
      }
      
      // CSA BASICs (0-45 points total)
      const csaFields = [
        'driverFitness',
        'vehicleMaintenance', 
        'controlledSubstances',
        'hazmatCompliance',
        'hoursOfService',
        'unsafeDriving'
      ] as const;
      
      let csaScore = 45;
      csaFields.forEach(field => {
        const value = safety[field as keyof typeof safety] as number | undefined;
        if (value !== undefined) {
          // Lower percentile = better score
          const deduction = Math.min(value * 0.5, 7.5); // Max 7.5 per category
          csaScore -= deduction;
        }
      });
      factors.csaScores = Math.max(0, csaScore);
      
      // Crash rate (bonus/penalty)
      if (safety.crashRate !== undefined) {
        factors.crashHistory = safety.crashRate === 0 ? 5 : Math.max(0, 5 - safety.crashRate);
      } else {
        factors.crashHistory = 0;
      }
      
      score = Math.round(
        factors.safetyRating +
        factors.oosRate +
        factors.csaScores +
        factors.crashHistory
      );
    } else {
      // No safety data available
      factors.noDataPenalty = -20;
      score = 50;
    }
    
    return {
      score: Math.min(100, Math.max(0, score)),
      weight: this.config.weights.safety,
      factors,
    };
  }
  
  /**
   * Stability Score (25% weight)
   * Based on time in business and consistency
   */
  private calculateStabilityScore(authority: Authority): ScoreComponent {
    const { stabilityRules } = this.config;
    const factors: Record<string, number> = {};
    
    let score = 60;
    
    // Authority age (0-50 points)
    if (authority.addDate) {
      const addDate = new Date(authority.addDate);
      const now = new Date();
      const ageMonths = (now.getFullYear() - addDate.getFullYear()) * 12 + 
                       (now.getMonth() - addDate.getMonth());
      
      if (ageMonths < stabilityRules.minAuthorityAgeMonths) {
        // New authority penalty
        factors.yearsInBusiness = Math.max(0, 50 * (ageMonths / stabilityRules.minAuthorityAgeMonths));
        score -= stabilityRules.newAuthorityPenalty;
      } else if (ageMonths >= stabilityRules.veteranBonusThreshold * 12) {
        // Veteran bonus
        factors.yearsInBusiness = 50;
        factors.veteranBonus = stabilityRules.veteranBonus;
        score += stabilityRules.veteranBonus;
      } else {
        // Normal range
        factors.yearsInBusiness = Math.min(50, 50 * (ageMonths / 60)); // 5 years = full
      }
    } else {
      factors.yearsInBusiness = 20; // Unknown = below average
    }
    
    // Status consistency (0-30 points)
    factors.statusConsistency = authority.status === 'A' ? 30 : 10;
    
    // Name changes (0-20 points) - penalize frequent changes
    // Would need historical data
    factors.nameChanges = 20; // Assume stable
    
    score = Math.round(
      factors.yearsInBusiness +
      factors.statusConsistency +
      factors.nameChanges +
      (score - 60) // Apply bonuses/penalties
    );
    
    return {
      score: Math.min(100, Math.max(0, score)),
      weight: this.config.weights.stability,
      factors,
    };
  }
  
  /**
   * Scale Score (20% weight)
   * Based on fleet size and operational capacity
   */
  private calculateScaleScore(authority: Authority): ScoreComponent {
    const { scaleRules } = this.config;
    const factors: Record<string, number> = {};
    
    let score = 50;
    
    const { fleetSizeTiers } = scaleRules;
    const drivers = authority.totalDrivers || 0;
    const powerUnits = authority.totalPowerUnits || 0;
    
    // Fleet size tier (0-50 points)
    let sizeScore = 0;
    if (drivers >= fleetSizeTiers.enterprise[0]) {
      sizeScore = 50; // Enterprise
      factors.fleetSize = 50;
    } else if (drivers >= fleetSizeTiers.large[0]) {
      sizeScore = 40; // Large
      factors.fleetSize = 40;
    } else if (drivers >= fleetSizeTiers.medium[0]) {
      sizeScore = 35; // Medium
      factors.fleetSize = 35;
    } else if (drivers >= fleetSizeTiers.small[0]) {
      sizeScore = 25; // Small
      factors.fleetSize = 25;
    } else {
      sizeScore = 15; // Micro
      factors.fleetSize = 15;
    }
    
    // Driver count (0-25 points) - bonus for more drivers
    factors.driverCount = Math.min(25, drivers * 1.5);
    
    // Power unit ratio (0-25 points) - ideal is 1:1 driver:truck
    const idealRatio = scaleRules.driverToPowerUnitIdealRatio;
    const actualRatio = drivers > 0 && powerUnits > 0 ? drivers / powerUnits : 1;
    const ratioDiff = Math.abs(actualRatio - idealRatio);
    factors.powerUnitRatio = Math.max(0, 25 - ratioDiff * 10);
    
    score = Math.round(
      factors.fleetSize +
      factors.driverCount +
      factors.powerUnitRatio
    );
    
    return {
      score: Math.min(100, Math.max(0, score)),
      weight: this.config.weights.scale,
      factors,
    };
  }
  
  /**
   * Compliance Score (15% weight)
   * Based on insurance, authority status, documentation
   */
  private calculateComplianceScore(authority: Authority): ScoreComponent {
    const { complianceRules } = this.config;
    const factors: Record<string, number> = {};
    
    let score = 60;
    
    // Insurance active (0-40 points)
    if (complianceRules.requireActiveInsurance) {
      factors.insuranceActive = 
        authority.insurance?.status === 'A' ? 40 : 
        authority.insurance?.status === 'I' ? 10 : 
        0; // Unknown
    } else {
      factors.insuranceActive = 30; // Not required
    }
    
    // Authority status (0-30 points)
    factors.authorityStatus = authority.status === 'A' ? 30 : 5;
    
    // MCS-150 current (0-20 points)
    if (authority.mcs150Date) {
      const mcs150Date = new Date(authority.mcs150Date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - mcs150Date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= complianceRules.requireMcs150WithinDays) {
        factors.mcs150Current = 20;
      } else if (daysDiff <= complianceRules.requireMcs150WithinDays * 2) {
        factors.mcs150Current = 10;
      } else {
        factors.mcs150Current = 5;
      }
    } else {
      factors.mcs150Current = 10;
    }
    
    // Compliance history (0-10 points)
    // Would need historical data for name changes, violations, etc.
    factors.complianceHistory = 10;
    
    score = Math.round(
      factors.insuranceActive +
      factors.authorityStatus +
      factors.mcs150Current +
      factors.complianceHistory
    );
    
    return {
      score: Math.min(100, Math.max(0, score)),
      weight: this.config.weights.compliance,
      factors,
    };
  }
  
  /**
   * Geography Score (10% weight)
   * Based on state risk and market access
   */
  private calculateGeographyScore(authority: Authority): ScoreComponent {
    const { geographyRules } = this.config;
    const factors: Record<string, number> = {};
    
    const state = authority.physicalAddress?.state;
    let score = 50;
    
    if (state) {
      // State risk score (0-50 points)
      const riskScore = geographyRules.stateRiskScores[state] ?? 50;
      factors.stateRisk = 100 - riskScore; // Invert so higher = better
      
      // Preferred state bonus
      if (geographyRules.preferredStatesBonus > 0 && riskScore < 40) {
        factors.preferredBonus = geographyRules.preferredStatesBonus;
        score += geographyRules.preferredStatesBonus;
      }
      
      // High risk penalty
      if (riskScore > 70) {
        factors.highRiskPenalty = -geographyRules.highRiskStatePenalty;
        score -= geographyRules.highRiskStatePenalty;
      }
    } else {
      factors.stateRisk = 40; // Unknown state = below average
    }
    
    // Operating radius (0-25 points) - based on carrier operation type
    factors.operatingRadius = authority.carrierOperation === 'A' ? 25 : 
                              authority.carrierOperation === 'C' ? 20 : 15;
    
    // Route diversity (0-25 points) - would need more data
    factors.routeDiversity = 25; // Assume good for now
    
    score = Math.round(
      factors.stateRisk +
      factors.operatingRadius +
      factors.routeDiversity
    );
    
    return {
      score: Math.min(100, Math.max(0, score)),
      weight: this.config.weights.geography,
      factors,
    };
  }
  
  /**
   * Convert numeric score to letter grade
   */
  private scoreToGrade(score: number): Grade {
    const { gradeBoundaries } = this.config;
    
    for (const [grade, [min, max]] of Object.entries(gradeBoundaries)) {
      if (score >= min && score <= max) {
        return grade as Grade;
      }
    }
    
    return 'F';
  }
  
  /**
   * Batch score multiple authorities
   */
  batchScore(authorities: Authority[]): Map<string, AuthorityScore> {
    const results = new Map<string, AuthorityScore>();
    
    for (const authority of authorities) {
      results.set(authority.id, this.calculateScore(authority));
    }
    
    return results;
  }
}

// Export singleton instance with default config
export const defaultScoringEngine = new ScoringEngine(DEFAULT_CONFIG);
