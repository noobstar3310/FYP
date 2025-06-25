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

function getRiskGrade(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

function scoreHealthFactor(healthFactor: number): number {
  console.log("Scoring health factor:", healthFactor);
  if (healthFactor >= 2) return 30;
  if (healthFactor >= 1.5) return 25;
  if (healthFactor >= 1.2) return 20;
  if (healthFactor >= 1.1) return 15;
  return 10;
}

function scoreLTVDistance(margin: number): number {
  console.log("Scoring LTV margin:", margin);
  if (margin >= 0.2) return 30;
  if (margin >= 0.15) return 25;
  if (margin >= 0.1) return 20;
  if (margin >= 0.05) return 15;
  return 10;
}

function scoreCollateral(collateralUSD: number): number {
  console.log("Scoring collateral USD:", collateralUSD);
  if (collateralUSD >= 1_000_000) return 20;
  if (collateralUSD >= 500_000) return 18;
  if (collateralUSD >= 100_000) return 15;
  if (collateralUSD >= 10_000) return 10;
  return 5;
}

function scoreBorrowDiscipline(borrowRatio: number): number {
  console.log("Scoring borrow ratio:", borrowRatio);
  if (borrowRatio <= 0.3) return 20;
  if (borrowRatio <= 0.5) return 15;
  if (borrowRatio <= 0.7) return 10;
  if (borrowRatio <= 0.8) return 5;
  return 0;
}

export function calculateCreditScore(accountData: UserAccountData): CreditScoreBreakdown {
  console.log("Calculating credit score for account data:", accountData);
  
  // Convert bigint values to numbers and normalize
  const healthFactor = Number(accountData.healthFactor) / 1e18;
  const ltv = Number(accountData.ltv) / 100;
  const liquidationThreshold = Number(accountData.currentLiquidationThreshold) / 100;
  const collateralUSD = Number(accountData.totalCollateralBase) / 1e8;
  const debtUSD = Number(accountData.totalDebtBase) / 1e8;
  const availableBorrowsUSD = Number(accountData.availableBorrowsBase) / 1e8;

  console.log("Normalized values:", {
    healthFactor,
    ltv,
    liquidationThreshold,
    collateralUSD,
    debtUSD,
    availableBorrowsUSD
  });

  // Calculate intermediate values
  const ltvMargin = liquidationThreshold - ltv;
  const borrowRatio = debtUSD / (collateralUSD + availableBorrowsUSD);

  console.log("Calculated intermediate values:", {
    ltvMargin,
    borrowRatio
  });

  // Calculate component scores
  const healthFactorScore = scoreHealthFactor(healthFactor);
  const ltvMarginScore = scoreLTVDistance(ltvMargin);
  const collateralScore = scoreCollateral(collateralUSD);
  const borrowDisciplineScore = scoreBorrowDiscipline(borrowRatio);

  console.log("Component scores:", {
    healthFactorScore,
    ltvMarginScore,
    collateralScore,
    borrowDisciplineScore
  });

  // Calculate total score
  const totalScore = 
    healthFactorScore +
    ltvMarginScore +
    collateralScore +
    borrowDisciplineScore;

  console.log("Total score:", totalScore);

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