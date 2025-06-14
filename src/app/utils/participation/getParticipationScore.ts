import Moralis from 'moralis';

const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY;

export type ParticipationScore = {
  score: number;
  totalTransactions: number;
  uniqueProtocols: number;
  lastActivity: Date | null;
};

// Initialize Moralis once
if (MORALIS_API_KEY) {
  try {
    Moralis.start({
      apiKey: MORALIS_API_KEY
    });
  } catch (error) {
    console.error("Error initializing Moralis:", error);
  }
}

export async function getParticipationScore(address: string): Promise<ParticipationScore | null> {
  if (!MORALIS_API_KEY) {
    console.error("Moralis API key is missing");
    throw new Error("Moralis API key not found");
  }

  try {
    // Get transaction count and last activity
    const response = await Moralis.EvmApi.transaction.getWalletTransactions({
      chain: "0x1",
      address: address,
      limit: 100
    });

    const transactions = response.raw.result || [];
    const totalTransactions = transactions.length;
    
    // Get unique protocols (to addresses) interacted with
    const uniqueProtocols = new Set(transactions.map(tx => tx.to_address)).size;
    
    // Get last activity date
    const lastActivity = transactions.length > 0 
      ? new Date(transactions[0].block_timestamp) 
      : null;

    // Calculate score based on activity
    let score = 0;

    // Score based on total transactions (max 40 points)
    if (totalTransactions >= 100) score += 40;
    else score += (totalTransactions / 100) * 40;

    // Score based on unique protocols (max 40 points)
    if (uniqueProtocols >= 10) score += 40;
    else score += (uniqueProtocols / 10) * 40;

    // Score based on recency (max 20 points)
    if (lastActivity) {
      const daysSinceLastActivity = (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastActivity <= 7) score += 20;
      else if (daysSinceLastActivity <= 30) score += 15;
      else if (daysSinceLastActivity <= 90) score += 10;
      else if (daysSinceLastActivity <= 180) score += 5;
    }

    return {
      score: Math.round(score),
      totalTransactions,
      uniqueProtocols,
      lastActivity
    };
  } catch (error) {
    console.error("Error fetching participation data:", error);
    return null;
  }
} 