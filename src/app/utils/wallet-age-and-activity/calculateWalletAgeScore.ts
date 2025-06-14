export function calculateWalletAgeScore(firstTransactionDate: string): number {
  const firstTxDate = new Date(firstTransactionDate);
  const now = new Date();
  const ageInDays = (now.getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Scoring based on wallet age
  if (ageInDays >= 1825) { // 5 years or more
    return 100;
  } else if (ageInDays >= 1095) { // 3-5 years
    const score = 80 + (ageInDays - 1095) / (1825 - 1095) * 19;
    return Math.round(score);
  } else if (ageInDays >= 365) { // 1-3 years
    const score = 50 + (ageInDays - 365) / (1095 - 365) * 29;
    return Math.round(score);
  } else if (ageInDays >= 180) { // 6 months to 1 year
    const score = 30 + (ageInDays - 180) / (365 - 180) * 19;
    return Math.round(score);
  } else if (ageInDays >= 30) { // 1-6 months
    const score = 10 + (ageInDays - 30) / (180 - 30) * 19;
    return Math.round(score);
  } else { // Less than 1 month
    const score = Math.max(1, Math.round(ageInDays / 30 * 9));
    return score;
  }
} 