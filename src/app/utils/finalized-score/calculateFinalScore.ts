import { getWalletAge, calculateWalletAgeScore } from "../wallet-age-and-activity/getWalletAge";
import { type UserAccountData } from "../aave-positions/read-aave";
import { calculateCreditScore } from "../aave-positions/calculate-credit-score";
import { isAddress } from "viem";
import { type ERC20Holding } from "../erc20-holdings/types";
import { type DefiPosition } from "../wallet-defi-activities/types";
import { calculateErc20Score } from "../erc20-holdings/calculateErc20Score";
import { calculateDefiCreditScore } from "../wallet-defi-activities/defi-position-credit-score";

// Score weights
export const SCORE_WEIGHTS = {
  ADDRESS_AGE: 0.15, // 15%
  CREDIT_SCORE: 0.45, // 45%
  ERC20_HOLDINGS: 0.15, // 15%
  PARTICIPATION: 0.25, // 25%
} as const;

export type ComponentScore = {
  score: number;
  name: string;
  weight: number;
};

export type FinalScore = {
  totalScore: number;
  riskGrade: string;
  components: {
    walletAge: number;
    aaveScore: number;
    erc20Score: number;
    defiScore: number;
  };
};

export async function calculateFinalScore(
  address: string,
  aaveData: [bigint, bigint, bigint, bigint, bigint, bigint] | undefined,
  erc20Holdings: ERC20Holding[],
  defiPositions: DefiPosition[]
): Promise<FinalScore> {
  try {
    if (!isAddress(address)) {
      throw new Error("Invalid address");
    }

    // Get wallet age data
    const walletData = await getWalletAge(address);
    
    // Calculate wallet age score
    let addressAgeScore = 0;
    if (walletData?.active_chains[0]?.first_transaction) {
      addressAgeScore = calculateWalletAgeScore(walletData.active_chains[0].first_transaction.block_timestamp);
    }
    
    // Calculate Aave credit score
    let aaveScore = 0;
    if (aaveData) {
      const accountData: UserAccountData = {
        totalCollateralBase: aaveData[0],
        totalDebtBase: aaveData[1],
        availableBorrowsBase: aaveData[2],
        currentLiquidationThreshold: aaveData[3],
        ltv: aaveData[4],
        healthFactor: aaveData[5]
      };
      const creditScoreResult = calculateCreditScore(accountData);
      aaveScore = creditScoreResult.totalScore;
    }

    // Calculate ERC20 holdings score
    const erc20Score = calculateErc20Score(erc20Holdings).score;

    // Calculate DeFi participation score
    const defiScore = calculateDefiCreditScore(defiPositions).totalScore;

    // Calculate weighted scores
    const totalScore = 
      (addressAgeScore * SCORE_WEIGHTS.ADDRESS_AGE) +
      (aaveScore * SCORE_WEIGHTS.CREDIT_SCORE) +
      (erc20Score * SCORE_WEIGHTS.ERC20_HOLDINGS) +
      (defiScore * SCORE_WEIGHTS.PARTICIPATION);

    return {
      totalScore,
      riskGrade: getRiskGrade(totalScore),
      components: {
        walletAge: addressAgeScore,
        aaveScore: aaveScore,
        erc20Score: erc20Score,
        defiScore: defiScore
      }
    };
  } catch (error) {
    console.error("Error calculating final score:", error);
    throw error;
  }
}

export function getRiskGrade(score: number): string {
  if (score >= 80) return "EXCELLENT";
  if (score >= 60) return "GOOD";
  if (score >= 40) return "MODERATE";
  if (score >= 20) return "RISKY";
  return "HIGH RISK";
}

export function getRiskColor(grade: string): string {
  switch (grade) {
    case "EXCELLENT":
    case "GOOD":
    case "MODERATE":
      return "text-black";
    case "RISKY":
    case "HIGH RISK":
      return "text-red-600";
    default:
      return "text-black";
  }
} 