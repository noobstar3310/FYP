import Moralis from 'moralis';

const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY;

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

export type WalletActiveChain = {
  chain: string;
  chain_id: string;
  first_transaction: {
    block_timestamp: string;
    block_number: string;
    transaction_hash: string;
  };
  last_transaction: {
    block_timestamp: string;
    block_number: string;
    transaction_hash: string;
  };
};

export type WalletResponse = {
  address: string;
  active_chains: WalletActiveChain[];
};

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

export async function getWalletAge(address: string): Promise<WalletResponse | null> {
  if (!MORALIS_API_KEY) {
    console.error("Moralis API key is missing");
    throw new Error("Moralis API key not found");
  }

  try {
    console.log("Fetching data for address:", address);
    const response = await Moralis.EvmApi.wallets.getWalletActiveChains({
      chains: ["0x1"],
      address: address
    });

    console.log("Raw response:", response.raw);
    const data = response.raw as WalletResponse;
    if (!data || !data.active_chains || data.active_chains.length === 0) {
      console.log("No data found for address:", address);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Detailed error fetching wallet age:", error);
    return null;
  }
}
