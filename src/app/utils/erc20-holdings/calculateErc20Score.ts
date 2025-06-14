import { TokenHolding, STABLECOIN_ADDRESSES } from './getErc20Holdings';
import { ethers } from 'ethers';

const MINIMUM_HOLDING_VALUE = 100; // $100 minimum holding
const MAXIMUM_SCORE = 100;
const SCORE_PER_TOKEN = MAXIMUM_SCORE / 3; // Equal weight for each stablecoin

function convertBalanceToUSD(balance: string, decimals: number): number {
  try {
    // Convert the balance to a human-readable format using ethers
    const formattedBalance = Number(ethers.formatUnits(balance, decimals));
    
    // For this example, we're assuming 1:1 ratio with USD for stablecoins
    // In a production environment, you might want to fetch real-time prices
    return formattedBalance;
  } catch (error) {
    console.error("Error converting balance:", error);
    return 0;
  }
}

export function calculateErc20Score(holdings: TokenHolding[]): {
  score: number;
  breakdown: {
    [key: string]: {
      held: boolean;
      balance: number;
      score: number;
    };
  };
} {
  let totalScore = 0;
  const breakdown: {
    [key: string]: {
      held: boolean;
      balance: number;
      score: number;
    };
  } = {
    DAI: { held: false, balance: 0, score: 0 },
    USDC: { held: false, balance: 0, score: 0 },
    USDT: { held: false, balance: 0, score: 0 }
  };

  // Process each holding
  holdings.forEach(holding => {
    const tokenSymbol = Object.entries(STABLECOIN_ADDRESSES).find(
      ([_, address]) => address.toLowerCase() === holding.token_address.toLowerCase()
    )?.[0];

    if (tokenSymbol) {
      const balanceUSD = convertBalanceToUSD(holding.balance, holding.decimals);
      breakdown[tokenSymbol].balance = balanceUSD;
      
      if (balanceUSD >= MINIMUM_HOLDING_VALUE) {
        breakdown[tokenSymbol].held = true;
        breakdown[tokenSymbol].score = SCORE_PER_TOKEN;
        totalScore += SCORE_PER_TOKEN;
      }
    }
  });

  return {
    score: Math.round(totalScore),
    breakdown
  };
}

export function getScoreDescription(score: number): string {
  if (score >= 100) return "Excellent - Holds all major stablecoins";
  if (score >= 66) return "Good - Holds two major stablecoins";
  if (score >= 33) return "Fair - Holds one major stablecoin";
  return "Poor - No significant stablecoin holdings";
} 