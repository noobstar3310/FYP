import { DefiPosition } from "./get-defi-positions";

export type DefiCreditScore = {
  totalScore: number;
  protocolDiversityScore: number;
  activityTypesScore: number;
  totalValueScore: number;
  calculations: {
    uniqueProtocols: number;
    uniqueActivities: number;
    totalValueUSD: number;
  };
  riskGrade: string;
};

function scoreProtocolDiversity(protocolCount: number): number {
  if (protocolCount >= 6) return 40;
  if (protocolCount === 5) return 35;
  if (protocolCount === 4) return 30;
  if (protocolCount === 3) return 20;
  if (protocolCount === 2) return 10;
  if (protocolCount === 1) return 5;
  return 0;
}

function scoreActivityTypes(labels: string[]): number {
  const types = new Set(labels.map(label => label.toLowerCase()));
  const count = types.size;

  if (count >= 5) return 40;
  if (count === 4) return 35;
  if (count === 3) return 25;
  if (count === 2) return 15;
  if (count === 1) return 5;
  return 0;
}

function scoreTotalValueUSD(totalUSD: number): number {
  if (totalUSD >= 100_000) return 20;
  if (totalUSD >= 10_000) return 15;
  if (totalUSD >= 1_000) return 10;
  if (totalUSD >= 100) return 5;
  return 0;
}

function calculateRiskGrade(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Risky";
}

export function calculateDefiCreditScore(positions: DefiPosition[]): DefiCreditScore {
  // Calculate unique protocols
  const uniqueProtocols = new Set(positions.map(p => p.protocol_name)).size;
  const protocolDiversityScore = scoreProtocolDiversity(uniqueProtocols);

  // Calculate unique activity types
  const activityLabels = positions.map(p => p.position.label);
  const activityTypesScore = scoreActivityTypes(activityLabels);

  // Calculate total USD value
  const totalValueUSD = positions.reduce((sum, p) => {
    const value = p.position.balance_usd || 0;
    return sum + value;
  }, 0);
  const totalValueScore = scoreTotalValueUSD(totalValueUSD);

  // Calculate total score
  const totalScore = protocolDiversityScore + activityTypesScore + totalValueScore;

  return {
    totalScore,
    protocolDiversityScore,
    activityTypesScore,
    totalValueScore,
    calculations: {
      uniqueProtocols,
      uniqueActivities: new Set(activityLabels.map(label => label.toLowerCase())).size,
      totalValueUSD,
    },
    riskGrade: calculateRiskGrade(totalScore),
  };
} 