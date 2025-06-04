import { usePublicClient } from "wagmi";
import { formatDistanceToNow } from "date-fns";

export function useWalletAge(address: `0x${string}` | undefined) {
  const publicClient = usePublicClient();

  const getWalletAge = async () => {
    if (!address || !publicClient) return null;

    try {
      // Get the current block number
      const currentBlock = await publicClient.getBlockNumber();
      
      // Search for the first transaction by binary search through blocks
      let left = BigInt(0);
      let right = currentBlock;
      let firstTxBlock = null;
      
      while (left <= right) {
        const mid = left + (right - left) / BigInt(2);
        
        const block = await publicClient.getBlock({
          blockNumber: mid,
        });
        
        // Check if there are any transactions in this block for the address
        const txCount = await publicClient.getTransactionCount({
          address,
          blockNumber: mid,
        });

        if (txCount > 0) {
          firstTxBlock = block;
          right = mid - BigInt(1); // Look for earlier blocks
        } else {
          left = mid + BigInt(1); // Look in later blocks
        }
      }

      if (!firstTxBlock) {
        return "No transactions found";
      }

      const timestamp = Number(firstTxBlock.timestamp) * 1000; // Convert to milliseconds
      
      // Format the age
      const age = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
      
      return age;
    } catch (error) {
      console.error("Error fetching wallet age:", error);
      return "Error fetching age";
    }
  };

  return { getWalletAge };
} 