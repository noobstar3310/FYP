import { ethers } from 'ethers';

// Token contract addresses
export const STABLECOIN_ADDRESSES = {
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
} as const;

// Minimal ERC20 ABI for balanceOf
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export type TokenHolding = {
  token_address: string;
  symbol: string;
  decimals: number;
  balance: string;
};

export type TokenHoldingsResponse = {
  address: string;
  holdings: TokenHolding[];
};

export async function getErc20Holdings(address: string): Promise<TokenHoldingsResponse | null> {
  try {
    // Connect to Ethereum mainnet
    const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
    
    const holdings: TokenHolding[] = [];

    // Fetch balances for each stablecoin
    for (const [symbol, tokenAddress] of Object.entries(STABLECOIN_ADDRESSES)) {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      // Get token details and balance
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals()
      ]);

      holdings.push({
        token_address: tokenAddress,
        symbol: symbol,
        decimals: decimals,
        balance: balance.toString()
      });
    }

    console.log("Fetched holdings:", holdings);
    
    return {
      address,
      holdings
    };
  } catch (error) {
    console.error("Error fetching token holdings:", error);
    return null;
  }
} 