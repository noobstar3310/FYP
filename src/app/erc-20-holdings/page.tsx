"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { getErc20Holdings } from "../utils/erc20-holdings/getErc20Holdings";
import { calculateErc20Score, getScoreDescription } from "../utils/erc20-holdings/calculateErc20Score";

export default function Erc20Holdings() {
  const [address, setAddress] = useState("");
  const [holdingsData, setHoldingsData] = useState<Awaited<ReturnType<typeof getErc20Holdings>>>(null);
  const [scoreData, setScoreData] = useState<ReturnType<typeof calculateErc20Score> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { text: "EXCELLENT", color: "text-black" };
    if (score >= 60) return { text: "GOOD", color: "text-black" };
    if (score >= 40) return { text: "MODERATE", color: "text-black" };
    if (score >= 20) return { text: "RISKY", color: "text-red-600" };
    return { text: "HIGH RISK", color: "text-red-600" };
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(balance);
  };

  // Calculate the rotation for the gauge needle (from -90 to 90 degrees)
  const calculateRotation = (score: number) => {
    return (score / 100) * 180 - 90;
  };

  const handleAddressSubmit = async () => {
    if (!isAddress(address)) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHoldingsData(null);
    setScoreData(null);

    try {
      const data = await getErc20Holdings(address);
      if (data) {
        setHoldingsData(data);
        const score = calculateErc20Score(data.holdings);
        setScoreData(score);
      } else {
        setError("Failed to fetch token holdings");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch token holdings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-light text-black mb-4 tracking-tight">Stablecoin Holdings Analysis</h2>
          <p className="text-gray-600 text-lg font-light max-w-2xl">
            Analyze your stablecoin holdings (DAI, USDC, USDT) on Ethereum mainnet and get a score based on your portfolio
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

        {/* Loading Display */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        )}

        {/* Score Display */}
        {scoreData && (
          <div className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Score Visualization */}
              <div className="text-center lg:text-left">
                <div className="mb-8">
                  <div className="text-8xl font-light text-black mb-2 tracking-tight">
                    {scoreData.score.toFixed(2)}
                  </div>
                  <div className="text-2xl text-gray-500 font-light">/ 100</div>
                </div>

                <div className={`text-xl font-medium mb-6 uppercase tracking-widest ${getRiskLevel(scoreData.score).color}`}>
                  {getRiskLevel(scoreData.score).text}
                </div>

                <div className="space-y-2 text-sm text-gray-600 font-mono">
                  <div>Last Updated: {new Date().toLocaleDateString()}</div>
                  <div className="break-all">Address: {address}</div>
                  <div>Wallet Age: No transactions found</div>
                </div>
              </div>

              {/* Minimal Gauge */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Gauge Background */}
                  <div className="w-64 h-32 relative">
                    <div className="absolute w-full h-full border-4 border-gray-200 rounded-t-full"></div>

                    {/* Score Indicator */}
                    <div
                      className="absolute bottom-0 left-1/2 w-1 h-28 bg-black origin-bottom transition-transform duration-1000 ease-out"
                      style={{
                        transform: `translateX(-50%) rotate(${calculateRotation(scoreData.score)}deg)`,
                      }}
                    />

                    {/* Center Dot */}
                    <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-black rounded-full transform -translate-x-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Holdings Breakdown */}
        {scoreData && (
          <div className="mb-24">
            <h3 className="text-2xl font-light text-black mb-12 uppercase tracking-wide">Holdings Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(scoreData.breakdown).map(([symbol, data]) => (
                <div key={symbol} className="border-l-4 border-black pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">{symbol}</div>
                  <div className="text-4xl font-light text-black mb-1">{data.score.toFixed(2)}</div>
                  <div className="text-sm text-gray-500 font-mono">33.33% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Balance: {formatBalance(data.balance)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 