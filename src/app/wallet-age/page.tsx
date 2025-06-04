"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { getWalletAge } from "../utils/wallet-age-and-activity/getWalletAge";

export default function WalletAge() {
  const [address, setAddress] = useState("");
  const [walletData, setWalletData] = useState<Awaited<ReturnType<typeof getWalletAge>>>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddressSubmit = async () => {
    if (!isAddress(address)) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getWalletAge(address);
      if (data) {
        setWalletData(data);
      } else {
        setError("No transaction history found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch wallet age");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-light text-black mb-4 tracking-tight">Wallet Age Analysis</h2>
          <p className="text-gray-600 text-lg font-light max-w-2xl">
            Discover when an Ethereum address first became active and its latest activity
          </p>
        </div>

        {/* Address Input */}
        <div className="mb-16">
          <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
            Wallet Address
          </label>
          <div className="flex gap-4 items-end max-w-2xl">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-0 py-4 text-xl text-black border-0 border-b border-gray-300 focus:ring-0 focus:border-black transition-colors bg-transparent font-mono tracking-wide"
            />
            <button
              onClick={handleAddressSubmit}
              disabled={isLoading}
              className="px-6 py-4 bg-black text-white text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:bg-gray-300"
            >
              {isLoading ? "Loading..." : "Check"}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-16 p-6 border border-red-200 bg-red-50">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {walletData?.active_chains.map((chain, index) => (
          <div key={index} className="max-w-2xl space-y-12">
            {/* First Transaction */}
            <div className="space-y-8">
              <div>
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                  First Transaction
                </div>
                <div className="text-4xl font-light text-black mb-2">
                  {formatDate(chain.first_transaction.block_timestamp)}
                </div>
                <div className="text-sm text-gray-500 font-mono break-all">
                  Tx: {chain.first_transaction.transaction_hash}
                </div>
              </div>
            </div>

            {/* Latest Transaction */}
            <div className="space-y-8">
              <div>
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                  Latest Transaction
                </div>
                <div className="text-4xl font-light text-black mb-2">
                  {formatDate(chain.last_transaction.block_timestamp)}
                </div>
                <div className="text-sm text-gray-500 font-mono break-all">
                  Tx: {chain.last_transaction.transaction_hash}
                </div>
              </div>
            </div>

            {/* Chain Info */}
            <div className="pt-8 border-t border-gray-200">
              <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                Chain Information
              </div>
              <div className="text-lg text-black">
                {chain.chain.toUpperCase()} ({chain.chain_id})
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
} 