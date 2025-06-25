import { useState, useEffect } from 'react';
import type { Address } from 'viem';
import { mainnet } from 'wagmi/chains';
import { createPublicClient, http } from 'viem';

// ABI for the getUserAccountData function from the implementation contract
export const AAVE_IMPLEMENTATION_ABI = [{
  inputs: [{ name: 'user', type: 'address' }],
  name: 'getUserAccountData',
  outputs: [
    { name: 'totalCollateralBase', type: 'uint256' },
    { name: 'totalDebtBase', type: 'uint256' },
    { name: 'availableBorrowsBase', type: 'uint256' },
    { name: 'currentLiquidationThreshold', type: 'uint256' },
    { name: 'ltv', type: 'uint256' },
    { name: 'healthFactor', type: 'uint256' }
  ],
  stateMutability: 'view',
  type: 'function'
}] as const;

// Mainnet Aave V3 Pool address
export const AAVE_PROXY_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2" as const;

export type UserAccountData = {
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
};

// Create a public client specifically for mainnet
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth-mainnet.g.alchemy.com/v2/demo') // Using Alchemy's demo endpoint - replace with your own RPC URL
});

export function useAaveUserData(userAddress: Address | undefined) {
  const [result, setResult] = useState<{ data?: readonly [bigint, bigint, bigint, bigint, bigint, bigint], error?: Error }>({});

  useEffect(() => {
    async function fetchData() {
      if (!userAddress) return;

      try {
        console.log('useAaveUserData hook called with address:', userAddress);
        console.log('Reading from Mainnet Aave:', AAVE_PROXY_ADDRESS);

        const data = await mainnetClient.readContract({
          address: AAVE_PROXY_ADDRESS,
          abi: AAVE_IMPLEMENTATION_ABI,
          functionName: 'getUserAccountData',
          args: [userAddress],
        });

        if (data) {
          console.log('Aave user data:', {
            totalCollateralBase: data[0].toString(),
            totalDebtBase: data[1].toString(),
            availableBorrowsBase: data[2].toString(),
            currentLiquidationThreshold: data[3].toString(),
            ltv: data[4].toString(),
            healthFactor: data[5].toString()
          });
          setResult({ data });
        } else {
          console.log('No Aave data - this could mean no positions on mainnet');
          setResult({});
        }
      } catch (error) {
        console.error('Error fetching Aave data:', error);
        setResult({ error: error as Error });
      }
    }

    fetchData();
  }, [userAddress]);

  return result;
} 