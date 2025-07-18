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
  console.group("Health Factor Scoring")
  console.log("Input Health Factor:", healthFactor)
  
  let score = 0
  if (healthFactor <= 0) {
    console.log("Score: 0 - Invalid health factor (≤ 0)")
  } else if (healthFactor >= 2) {
    score = 30
    console.log("Score: 30 - Excellent health factor (≥ 2)")
  } else if (healthFactor >= 1.5) {
    score = 25
    console.log("Score: 25 - Very good health factor (≥ 1.5)")
  } else if (healthFactor >= 1.2) {
    score = 20
    console.log("Score: 20 - Good health factor (≥ 1.2)")
  } else if (healthFactor >= 1.1) {
    score = 15
    console.log("Score: 15 - Moderate health factor (≥ 1.1)")
  } else if (healthFactor >= 1.05) {
    score = 10
    console.log("Score: 10 - Below average health factor (≥ 1.05)")
  } else if (healthFactor >= 1) {
    score = 5
    console.log("Score: 5 - Low health factor (≥ 1)")
  } else {
    console.log("Score: 0 - Critical health factor (< 1)")
  }
  
  console.log("Final Health Factor Score:", score, "/ 30")
  console.groupEnd()
  return score
}

function scoreLTVDistance(margin: number): number {
  console.group("LTV Margin Scoring")
  console.log("Input LTV Margin:", (margin * 100).toFixed(2) + "%")
  
  let score = 0
  if (margin < 0) {
    console.log("Score: 0 - Invalid LTV margin (< 0)")
  } else if (margin >= 0.2) {
    score = 30
    console.log("Score: 30 - Excellent safety margin (≥ 20%)")
  } else if (margin >= 0.15) {
    score = 25
    console.log("Score: 25 - Very good safety margin (≥ 15%)")
  } else if (margin >= 0.1) {
    score = 20
    console.log("Score: 20 - Good safety margin (≥ 10%)")
  } else if (margin >= 0.05) {
    score = 15
    console.log("Score: 15 - Moderate safety margin (≥ 5%)")
  } else {
    console.log("Score: 0 - Risky safety margin (< 5%)")
  }
  
  console.log("Final LTV Margin Score:", score, "/ 30")
  console.groupEnd()
  return score
}

function scoreCollateral(collateralUSD: number): number {
  console.group("Collateral Scoring")
  console.log("Input Collateral Value:", new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(collateralUSD))
  
  let score = 0
  if (collateralUSD <= 0) {
    console.log("Score: 0 - No collateral")
  } else if (collateralUSD >= 1_000_000) {
    score = 20
    console.log("Score: 20 - Excellent collateral (≥ $1M)")
  } else if (collateralUSD >= 500_000) {
    score = 18
    console.log("Score: 18 - Very good collateral (≥ $500K)")
  } else if (collateralUSD >= 100_000) {
    score = 15
    console.log("Score: 15 - Good collateral (≥ $100K)")
  } else if (collateralUSD >= 10_000) {
    score = 10
    console.log("Score: 10 - Moderate collateral (≥ $10K)")
  } else {
    console.log("Score: 0 - Low collateral (< $10K)")
  }
  
  console.log("Final Collateral Score:", score, "/ 20")
  console.groupEnd()
  return score
}

function scoreBorrowDiscipline(borrowRatio: number): number {
  console.group("Borrow Discipline Scoring")
  console.log("Input Borrow Ratio:", (borrowRatio * 100).toFixed(2) + "%")
  
  let score = 0
  if (borrowRatio < 0) {
    console.log("Score: 0 - Invalid borrow ratio (< 0)")
  } else if (borrowRatio <= 0.3) {
    score = 20
    console.log("Score: 20 - Excellent discipline (≤ 30%)")
  } else if (borrowRatio <= 0.5) {
    score = 15
    console.log("Score: 15 - Good discipline (≤ 50%)")
  } else if (borrowRatio <= 0.7) {
    score = 10
    console.log("Score: 10 - Moderate discipline (≤ 70%)")
  } else if (borrowRatio <= 0.8) {
    score = 5
    console.log("Score: 5 - High utilization (≤ 80%)")
  } else {
    console.log("Score: 0 - Very high utilization (> 80%)")
  }
  
  console.log("Final Borrow Discipline Score:", score, "/ 20")
  console.groupEnd()
  return score
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