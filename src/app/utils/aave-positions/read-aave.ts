// import { useReadContract } from 'wagmi';
// import type { Address } from 'viem';
// import { mainnet } from 'wagmi/chains';

// // ABI for the getUserAccountData function from the implementation contract
// export const AAVE_IMPLEMENTATION_ABI = [{
//   inputs: [{ name: 'user', type: 'address' }],
//   name: 'getUserAccountData',
//   outputs: [
//     { name: 'totalCollateralBase', type: 'uint256' },
//     { name: 'totalDebtBase', type: 'uint256' },
//     { name: 'availableBorrowsBase', type: 'uint256' },
//     { name: 'currentLiquidationThreshold', type: 'uint256' },
//     { name: 'ltv', type: 'uint256' },
//     { name: 'healthFactor', type: 'uint256' }
//   ],
//   stateMutability: 'view',
//   type: 'function'
// }] as const;

// // Mainnet Aave V3 Pool address
// export const AAVE_PROXY_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2" as const;

// export type UserAccountData = {
//   totalCollateralBase: bigint;
//   totalDebtBase: bigint;
//   availableBorrowsBase: bigint;
//   currentLiquidationThreshold: bigint;
//   ltv: bigint;
//   healthFactor: bigint;
// };

// export function useAaveUserData(userAddress: Address | undefined) {
//   return useReadContract({
//     address: AAVE_PROXY_ADDRESS,
//     abi: AAVE_IMPLEMENTATION_ABI,
//     functionName: 'getUserAccountData',
//     args: userAddress ? [userAddress] : undefined,
//     chainId: mainnet.id, // Specify mainnet chain ID
//     query: {
//       enabled: Boolean(userAddress)
//     }
//   });
// } 
import { useReadContract } from 'wagmi';
import type { Address } from 'viem';
import { mainnet } from 'wagmi/chains';

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

export function useAaveUserData(userAddress: Address | undefined) {
  return useReadContract({
    address: AAVE_PROXY_ADDRESS,
    abi: AAVE_IMPLEMENTATION_ABI,
    functionName: 'getUserAccountData',
    args: userAddress ? [userAddress] : undefined,
    chainId: mainnet.id, // Specify mainnet chain ID
    query: {
      enabled: Boolean(userAddress)
    }
  });
} 