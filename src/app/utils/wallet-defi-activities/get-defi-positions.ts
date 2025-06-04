import { isAddress } from "viem";

export type Token = {
  token_type: string;
  name: string;
  symbol: string;
  contract_address: string;
  decimals: string;
  logo: string;
  thumbnail: string;
  balance: string;
  balance_formatted: string;
  usd_price: number;
  usd_value: number;
};

export type PositionDetails = {
  reserve0?: string;
  reserve1?: string;
  factory?: string;
  pair?: string;
  share_of_pool?: number;
  // Add other possible position details as needed
};

export type Position = {
  label: string;
  tokens: Token[];
  address: string;
  balance_usd: number;
  total_unclaimed_usd_value: number | null;
  position_details: PositionDetails;
};

export type DefiPosition = {
  protocol_name: string;
  protocol_id: string;
  protocol_url: string;
  protocol_logo: string;
  position: Position;
};

const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY;

export async function getDefiPositions(address: string): Promise<DefiPosition[]> {
  if (!isAddress(address)) {
    throw new Error("Invalid address");
  }

  if (!MORALIS_API_KEY) {
    throw new Error("Moralis API key not found");
  }

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-API-Key': MORALIS_API_KEY
    },
  };

  try {
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/wallets/${address}/defi/positions?chain=eth`,
      options
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Log the raw API response
    console.log('Raw DeFi Positions API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    return data as DefiPosition[];
  } catch (error) {
    console.error("Error fetching DeFi positions:", error);
    throw error;
  }
}

// React hook to fetch DeFi positions
import { useEffect, useState } from "react";

export function useDefiPositions(address: string | undefined) {
  const [data, setData] = useState<DefiPosition[] | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!address || !isAddress(address)) {
        setData(undefined);
        setError(undefined);
        return;
      }

      setIsPending(true);
      setError(undefined);

      try {
        const positions = await getDefiPositions(address);
        setData(positions);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsPending(false);
      }
    }

    fetchData();
  }, [address]);

  return { data, error, isPending };
} 