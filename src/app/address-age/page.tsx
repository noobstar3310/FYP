"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { getWalletAge, WalletResponse, calculateWalletAgeScore } from "../utils/wallet-age-and-activity/getWalletAge";

export default function AddressAge() {
  const [address, setAddress] = useState("");
  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  const [walletScore, setWalletScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddressSubmit = async () => {
    if (!isAddress(address)) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setWalletScore(null);

    try {
      const data = await getWalletAge(address);
      if (data && data.active_chains.length > 0) {
        const firstChain = data.active_chains[0];
        if (firstChain.first_transaction) {
          setWalletData(data);
          const score = calculateWalletAgeScore(firstChain.first_transaction.block_timestamp);
          setWalletScore(score);
        } else {
          setError("No transaction history found");
        }
      } else {
        setError("No transaction history found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch wallet age");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateRotation = (score: number) => {
    return (score / 100) * 180 - 90;
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-light text-black mb-4 tracking-tight">Address Age Analysis</h2>
          <p className="text-gray-600 text-lg font-light max-w-2xl">
            Discover when an Ethereum address first became active and its maturity score
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

        {/* Score Display */}
        {walletScore !== null && (
          <div className="mb-16 max-w-4xl">
            <div className="flex justify-between items-start mb-16">
              {/* Score and Info */}
              <div>
                <div className="text-[8rem] font-extralight text-gray-900 leading-none mb-2">
                  {walletScore.toFixed(2)}
                </div>
                <div className="text-2xl text-gray-500 mb-6">/ 100</div>
                <div className="text-2xl text-blue-500 mb-8">MODERATE</div>
                <div className="space-y-2 text-gray-600">
                  <div className="text-base">Last Updated: {formatDate(new Date().toISOString())}</div>
                  <div className="text-base font-mono break-all">Address: {address}</div>
                </div>
              </div>

              {/* Gauge */}
              <div className="relative">
                <div className="w-64 h-32 relative">
                  {/* Gauge Background */}
                  <div className="absolute w-full h-full border-4 border-gray-200 rounded-t-full"></div>

                  {/* Score Indicator */}
                  <div
                    className="absolute bottom-0 left-1/2 w-1 h-28 bg-black origin-bottom transition-transform duration-1000 ease-out"
                    style={{
                      transform: `translateX(-50%) rotate(${calculateRotation(walletScore)}deg)`,
                    }}
                  />

                  {/* Center Dot */}
                  <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-black rounded-full transform -translate-x-1/2"></div>
                </div>
              </div>
            </div>

            {/* Score Components */}
            <div>
              <h3 className="text-2xl font-light text-gray-300 mb-12">SCORE COMPONENTS</h3>
              <div className="grid grid-cols-4 gap-12">
                <div>
                  <div className="text-lg text-gray-600 mb-2">WALLET AGE</div>
                  <div className="text-6xl font-light text-gray-900 mb-2">
                    {Math.round(walletScore * 0.4)}
                  </div>
                  <div className="text-base text-gray-500 mb-1">40% Weight</div>
                  <div className="text-sm text-gray-500">
                    Age: {walletData?.active_chains[0]?.first_transaction ? 
                      formatDate(walletData.active_chains[0].first_transaction.block_timestamp) : 
                      'N/A'}
                  </div>
                </div>

                <div>
                  <div className="text-lg text-gray-600 mb-2">TRANSACTION VOLUME</div>
                  <div className="text-6xl font-light text-gray-900 mb-2">0</div>
                  <div className="text-base text-gray-500 mb-1">30% Weight</div>
                  <div className="text-sm text-gray-500">Volume: 0.00%</div>
                </div>

                <div>
                  <div className="text-lg text-gray-600 mb-2">ACTIVITY FREQUENCY</div>
                  <div className="text-6xl font-light text-gray-900 mb-2">5</div>
                  <div className="text-base text-gray-500 mb-1">20% Weight</div>
                  <div className="text-sm text-gray-500">$0.00</div>
                </div>

                <div>
                  <div className="text-lg text-gray-600 mb-2">NETWORK DIVERSITY</div>
                  <div className="text-6xl font-light text-gray-900 mb-2">0</div>
                  <div className="text-base text-gray-500 mb-1">10% Weight</div>
                  <div className="text-sm text-gray-500">Ratio: NaN</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* First Transaction Details */}
        {walletData?.active_chains.map((chain, index) => (
          <div key={index} className="max-w-2xl pt-8 border-t border-gray-200">
            <div className="space-y-8">
              <div>
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">
                  First Transaction Details
                </div>
                <div className="text-sm text-gray-500 font-mono break-all">
                  Block: {chain.first_transaction.block_number}
                </div>
                <div className="text-sm text-gray-500 font-mono break-all">
                  Tx: {chain.first_transaction.transaction_hash}
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
