import Moralis from 'moralis';

const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY;

// Token contract addresses
export const STABLECOIN_ADDRESSES = {
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
} as const;

export type TokenHolding = {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  possible_spam?: boolean;
  verified_collection?: boolean;
  total_supply?: string;
  total_supply_formatted?: string;
  percentage_relative_to_total_supply?: number;
};

export type TokenHoldingsResponse = {
  address: string;
  holdings: TokenHolding[];
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

export async function getErc20Holdings(address: string): Promise<TokenHoldingsResponse | null> {
  if (!MORALIS_API_KEY) {
    console.error("Moralis API key is missing");
    throw new Error("Moralis API key not found");
  }

  try {
    console.log("Fetching ERC20 holdings for address:", address);
    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
      chain: "0x1", // Ethereum mainnet
      address: address,
      tokenAddresses: Object.values(STABLECOIN_ADDRESSES)
    });

    console.log("Raw response:", response.raw);
    
    // The response.raw is an array of token holdings
    const holdings = response.raw as TokenHolding[];
    
    return {
      address,
      holdings: holdings || []
    };
  } catch (error) {
    console.error("Error fetching token holdings:", error);
    return null;
  }
} 