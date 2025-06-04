import Moralis from 'moralis';

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

const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY;

export async function getWalletAge(address: string): Promise<WalletResponse | null> {
  if (!MORALIS_API_KEY) {
    throw new Error("Moralis API key not found");
  }

  try {
    await Moralis.start({
      apiKey: MORALIS_API_KEY
    });

    const response = await Moralis.EvmApi.wallets.getWalletActiveChains({
      chains: ["0x1"],
      address: address
    });

    const data = response.raw as WalletResponse;
    if (!data || !data.active_chains || data.active_chains.length === 0) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching wallet age:", error);
    return null;
  }
}
