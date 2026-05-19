/**
 * Matching Engine
 * Calculates compatibility between Authorities and Factors
 */

import type { Authority } from "../types/authority";
import type { CompatibilityBreakdown, Factor } from "../types/factor";

export interface MatchResult {
  authorityId: string;
  factorId: string;
  score: number;
  compatibility: CompatibilityBreakdown;
  meetsRequirements: boolean;
  disqualifyingFactors: string[];
}

export interface MatchOptions {
  minCompatibilityScore?: number;
  maxResults?: number;
  includeDisqualified?: boolean;
}

export class MatchingEngine {
  /**
   * Calculate compatibility between an authority and a factor
   */
  calculateCompatibility(authority: Authority, factor: Factor): MatchResult {
    const breakdown: CompatibilityBreakdown = {
      geographic: this.calculateGeographicScore(authority, factor),
      fleetSize: this.calculateFleetSizeScore(authority, factor),
      riskProfile: this.calculateRiskProfileScore(authority, factor),
      preferences: this.calculatePreferencesScore(authority, factor),
      financial: this.calculateFinancialScore(authority, factor),
    };

    // Weighted overall score
    const weights = {
      geographic: 0.2,
      fleetSize: 0.2,
      riskProfile: 0.25,
      preferences: 0.2,
      financial: 0.15,
    };

    const score = Math.round(
      breakdown.geographic * weights.geographic +
        breakdown.fleetSize * weights.fleetSize +
        breakdown.riskProfile * weights.riskProfile +
        breakdown.preferences * weights.preferences +
        breakdown.financial * weights.financial,
    );

    const disqualifyingFactors = this.getDisqualifyingFactors(
      authority,
      factor,
    );

    return {
      authorityId: authority.id,
      factorId: factor.id,
      score,
      compatibility: breakdown,
      meetsRequirements: disqualifyingFactors.length === 0,
      disqualifyingFactors,
    };
  }

  /**
   * Find matches for an authority across all factors
   */
  findMatchesForAuthority(
    authority: Authority,
    factors: Factor[],
    options: MatchOptions = {},
  ): MatchResult[] {
    const {
      minCompatibilityScore = 0,
      maxResults = 10,
      includeDisqualified = false,
    } = options;

    const results = factors
      .map((factor) => this.calculateCompatibility(authority, factor))
      .filter((result) => {
        if (result.score < minCompatibilityScore) return false;
        if (!includeDisqualified && !result.meetsRequirements) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);

    return maxResults ? results.slice(0, maxResults) : results;
  }

  /**
   * Find matches for a factor across all authorities
   */
  findMatchesForFactor(
    factor: Factor,
    authorities: Authority[],
    options: MatchOptions = {},
  ): MatchResult[] {
    const {
      minCompatibilityScore = 0,
      maxResults = 50,
      includeDisqualified = false,
    } = options;

    const results = authorities
      .map((authority) => this.calculateCompatibility(authority, factor))
      .filter((result) => {
        if (result.score < minCompatibilityScore) return false;
        if (!includeDisqualified && !result.meetsRequirements) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);

    return maxResults ? results.slice(0, maxResults) : results;
  }

  /**
   * Geographic compatibility (20%)
   */
  private calculateGeographicScore(
    authority: Authority,
    factor: Factor,
  ): number {
    const authState = authority.physicalAddress?.state;
    const prefs = factor.preferences;

    if (!authState) return 50;

    // Direct state match
    if (prefs.preferredStates.includes(authState)) {
      // Check excluded states
      if (prefs.excludedStates.includes(authState)) {
        return 0; // Explicitly excluded
      }
      return 100;
    }

    // Adjacent/region match (simplified - would use region mapping)
    const regionMap: Record<string, string[]> = {
      South: ["AR", "TN", "MS", "AL", "LA", "GA", "SC", "NC"],
      Southwest: ["TX", "OK", "NM", "AZ"],
      Midsouth: ["AR", "TN", "MS", "MO", "KY"],
    };

    for (const [region, states] of Object.entries(regionMap)) {
      if (prefs.preferredRegions?.includes(region)) {
        if (states.includes(authState)) {
          return 70; // Region match
        }
      }
    }

    return 30; // No match
  }

  /**
   * Fleet size compatibility (20%)
   */
  private calculateFleetSizeScore(
    authority: Authority,
    factor: Factor,
  ): number {
    const drivers = authority.totalDrivers || 0;
    const prefs = factor.preferences;

    // Check bounds
    if (drivers < prefs.minFleetSize) return 0;
    if (drivers > prefs.maxFleetSize) return 0;

    // Ideal range bonus
    const [idealMin, idealMax] = prefs.preferredFleetSizeRange;
    if (drivers >= idealMin && drivers <= idealMax) {
      return 100;
    }

    // Within acceptable range
    const range = prefs.maxFleetSize - prefs.minFleetSize;
    const position = drivers - prefs.minFleetSize;
    return Math.round(60 + (position / range) * 40);
  }

  /**
   * Risk profile compatibility (25%)
   */
  private calculateRiskProfileScore(
    authority: Authority,
    factor: Factor,
  ): number {
    let score = 100;
    const prefs = factor.preferences;
    const authScore = authority.authorityScore;

    // Authority score check
    if (authScore) {
      if (authScore.overall < prefs.minAuthorityScore) {
        score -= 40;
      } else if (authScore.overall >= prefs.minAuthorityScore + 10) {
        score += 10; // Bonus for exceeding minimum
      }
    }

    // Safety rating check
    if (authority.safetyRating?.rating) {
      const rating = authority.safetyRating.rating;
      if (rating === "U") {
        score -= 50; // Unsatisfactory
      } else if (rating === "C" && prefs.minSafetyRating === "S") {
        score -= 30; // Conditional not accepted
      } else if (rating === "S" && prefs.minSafetyRating === "S") {
        score += 10; // Meets strict requirement
      }
    }

    // OOS rate check
    if (authority.safetyRating?.oosRate !== undefined) {
      if (authority.safetyRating.oosRate > prefs.maxOosRate) {
        score -= 25;
      }
    }

    // Insurance requirement
    if (prefs.requiredInsurance && authority.insurance?.status !== "A") {
      score -= 30;
    }

    // Time in business
    if (authority.addDate && prefs.minTimeInBusiness !== undefined) {
      const years =
        new Date().getFullYear() - parseInt(authority.addDate.substring(0, 4));
      if (years < prefs.minTimeInBusiness / 12) {
        if (!prefs.acceptNewAuthorities) {
          score -= 35;
        }
      } else if (years >= 5) {
        score += 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Preferences compatibility (20%)
   */
  private calculatePreferencesScore(
    authority: Authority,
    factor: Factor,
  ): number {
    let score = 70; // Baseline
    const prefs = factor.preferences;

    // Risk tolerance alignment
    const factorRisk = prefs.riskTolerance;
    if (authority.authorityScore?.grade) {
      const grade = authority.authorityScore.grade;
      if (grade?.startsWith("A")) {
        // A grades work with any risk tolerance
        score += 10;
      } else if (grade?.startsWith("B")) {
        if (factorRisk === "CONSERVATIVE") score += 5;
      } else if (grade?.startsWith("C")) {
        if (factorRisk === "CONSERVATIVE") score -= 20;
        if (factorRisk === "AGGRESSIVE") score += 10;
      } else {
        // D/F grades
        if (factorRisk === "AGGRESSIVE") score += 5;
        else score -= 30;
      }
    }

    // Cargo type preferences
    if (prefs.preferredCargoTypes?.length && authority.cargoTypes) {
      const matches = authority.cargoTypes.filter((c) =>
        prefs.preferredCargoTypes?.includes(c),
      ).length;
      if (matches > 0) {
        score += 15;
      }
    }

    // Excluded cargo types
    if (prefs.excludedCargoTypes?.length && authority.cargoTypes) {
      const hasExcluded = authority.cargoTypes.some((c) =>
        prefs.excludedCargoTypes?.includes(c),
      );
      if (hasExcluded) {
        score -= 25;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Financial compatibility (15%)
   */
  private calculateFinancialScore(
    authority: Authority,
    factor: Factor,
  ): number {
    let score = 80; // Baseline
    const prefs = factor.preferences;

    // Monthly revenue requirement (estimated from fleet size)
    const estimatedRevenue = (authority.totalDrivers || 0) * 5000; // Rough estimate
    if (prefs.minMonthlyRevenue && estimatedRevenue < prefs.minMonthlyRevenue) {
      score -= 20;
    }

    // Volume fit
    const offerings = factor.offerings;
    if (offerings.minVolume && offerings.maxVolume) {
      if (
        estimatedRevenue >= offerings.minVolume &&
        estimatedRevenue <= offerings.maxVolume
      ) {
        score += 15;
      }
    }

    // Advance rate attractiveness
    const maxAdvance = Math.max(...offerings.advanceRates);
    if (maxAdvance >= 0.95) {
      score += 10; // High advance rate is attractive
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get disqualifying factors
   */
  private getDisqualifyingFactors(
    authority: Authority,
    factor: Factor,
  ): string[] {
    const factors: string[] = [];
    const prefs = factor.preferences;

    // Hard requirements that disqualify
    if (authority.totalDrivers < prefs.minFleetSize) {
      factors.push(
        `Fleet too small (${authority.totalDrivers} < ${prefs.minFleetSize})`,
      );
    }

    if (authority.totalDrivers > prefs.maxFleetSize) {
      factors.push(
        `Fleet too large (${authority.totalDrivers} > ${prefs.maxFleetSize})`,
      );
    }

    if (
      authority.authorityScore &&
      authority.authorityScore.overall < prefs.minAuthorityScore
    ) {
      factors.push(
        `Score too low (${authority.authorityScore.overall} < ${prefs.minAuthorityScore})`,
      );
    }

    const authState = authority.physicalAddress?.state;
    if (authState && prefs.excludedStates.includes(authState)) {
      factors.push(`State excluded (${authState})`);
    }

    if (prefs.requiredInsurance && authority.insurance?.status !== "A") {
      factors.push("Insurance not active");
    }

    if (
      !prefs.acceptConditionalRatings &&
      authority.safetyRating?.rating === "C"
    ) {
      factors.push("Conditional safety rating not accepted");
    }

    if (authority.safetyRating?.rating === "U") {
      factors.push("Unsatisfactory safety rating");
    }

    return factors;
  }

  /**
   * Batch match calculation
   */
  batchMatch(
    authorities: Authority[],
    factors: Factor[],
    options: MatchOptions = {},
  ): Map<string, MatchResult[]> {
    const results = new Map<string, MatchResult[]>();

    for (const authority of authorities) {
      const matches = this.findMatchesForAuthority(authority, factors, options);
      results.set(authority.id, matches);
    }

    return results;
  }
}

// Export singleton
export const defaultMatchingEngine = new MatchingEngine();
