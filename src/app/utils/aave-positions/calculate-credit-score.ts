import { UserAccountData } from './read-aave';

export type CreditScoreBreakdown = {
  healthFactorScore: number;
  ltvMarginScore: number;
  collateralScore: number;
  borrowDisciplineScore: number;
  totalScore: number;
  riskGrade: string;
  calculations: {
    healthFactor: number;
    ltvMargin: number;
    collateralUSD: number;
    borrowRatio: number;
  };
};

function scoreHealthFactor(hf: number): number {
  if (hf >= 2.0) return 40;
  if (hf >= 1.5) return 35;
  if (hf >= 1.3) return 30;
  if (hf >= 1.1) return 20;
  if (hf >= 1.0) return 10;
  return 0;
}

function scoreLTVDistance(margin: number): number {
  if (margin >= 10) return 30;
  if (margin >= 5) return 25;
  if (margin >= 3) return 20;
  if (margin >= 1) return 10;
  return 0;
}

function scoreCollateral(collateralUSD: number): number {
  if (collateralUSD >= 1_000_000) return 20;
  if (collateralUSD >= 500_000) return 18;
  if (collateralUSD >= 100_000) return 15;
  if (collateralUSD >= 10_000) return 10;
  return 5;
}

function scoreBorrowDiscipline(ratio: number): number {
  if (ratio <= 0.5) return 10;
  if (ratio <= 0.7) return 8;
  if (ratio <= 0.85) return 5;
  return 0;
}

function getRiskGrade(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Moderate';
  return 'Risky';
}

export function calculateCreditScore(accountData: UserAccountData): CreditScoreBreakdown {
  // Convert bigint values to numbers and normalize
  const healthFactor = Number(accountData[5]) / 1e18;
  const ltv = Number(accountData[4]) / 100;
  const liquidationThreshold = Number(accountData[3]) / 100;
  const collateralUSD = Number(accountData[0]) / 1e8;
  const debtUSD = Number(accountData[1]) / 1e8;
  const availableBorrowsUSD = Number(accountData[2]) / 1e8;

  // Calculate intermediate values
  const ltvMargin = liquidationThreshold - ltv;
  const borrowRatio = debtUSD / (collateralUSD + availableBorrowsUSD);

  // Calculate component scores
  const healthFactorScore = scoreHealthFactor(healthFactor);
  const ltvMarginScore = scoreLTVDistance(ltvMargin);
  const collateralScore = scoreCollateral(collateralUSD);
  const borrowDisciplineScore = scoreBorrowDiscipline(borrowRatio);

  // Calculate total score
  const totalScore = 
    healthFactorScore +
    ltvMarginScore +
    collateralScore +
    borrowDisciplineScore;

  return {
    healthFactorScore,
    ltvMarginScore,
    collateralScore,
    borrowDisciplineScore,
    totalScore,
    riskGrade: getRiskGrade(totalScore),
    calculations: {
      healthFactor,
      ltvMargin,
      collateralUSD,
      borrowRatio
    }
  };
} 