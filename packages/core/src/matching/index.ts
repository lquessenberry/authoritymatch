import type { AuthorityRecord, FactorProfile, MatchResult } from '../types';

interface MatchWeights {
  creditScore: number;
  volume: number;
  equipment: number;
  location: number;
  recourse: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  creditScore: 0.3,
  volume: 0.3,
  equipment: 0.2,
  location: 0.15,
  recourse: 0.05,
};

// Calculate match score between an authority and factor
export function calculateMatchScore(
  authority: AuthorityRecord,
  factor: FactorProfile,
  weights: MatchWeights = DEFAULT_WEIGHTS
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Credit score match (0-100)
  if (authority.creditScore >= factor.minCreditScore &&
      authority.creditScore <= (factor.maxCreditScore || 850)) {
    score += 100 * weights.creditScore;
    reasons.push('Credit score within range');
  } else {
    const creditScoreDiff = authority.creditScore < factor.minCreditScore
      ? factor.minCreditScore - authority.creditScore
      : authority.creditScore - (factor.maxCreditScore || 850);
    const creditPenalty = Math.max(0, 100 - creditScoreDiff * 2);
    score += creditPenalty * weights.creditScore;
    reasons.push(`Credit score ${creditScoreDiff} points outside range`);
  }

  // Volume match (0-100)
  if (authority.monthlyVolume >= factor.minMonthlyVolume &&
      authority.monthlyVolume <= (factor.maxMonthlyVolume || Infinity)) {
    score += 100 * weights.volume;
    reasons.push('Volume within range');
  } else {
    reasons.push('Volume outside preferred range');
  }

  // Equipment match (0-100)
  const equipmentMatch = authority.equipmentTypes.filter(
    eq => factor.equipmentTypes.includes(eq)
  ).length;
  const equipmentScore = factor.equipmentTypes.length > 0
    ? (equipmentMatch / factor.equipmentTypes.length) * 100
    : 100;
  score += equipmentScore * weights.equipment;
  if (equipmentScore > 50) {
    reasons.push(`${equipmentMatch} equipment types match`);
  }

  // Location match (0-100)
  if (factor.statesServed.includes(authority.location.state)) {
    score += 100 * weights.location;
    reasons.push('Serves trucker state');
  } else {
    reasons.push('State not in service area');
  }

  return { score: Math.round(score), reasons };
}

// Find best matching factors for an authority
export function findMatches(
  authority: AuthorityRecord,
  factors: FactorProfile[],
  minScore: number = 60,
  limit: number = 5
): MatchResult[] {
  const matches = factors.map(factor => {
    const { score, reasons } = calculateMatchScore(authority, factor);
    return {
      leadId: authority.id,
      factorId: factor.id,
      score,
      reasons,
      matchedAt: new Date(),
    };
  });

  return matches
    .filter(m => m.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
