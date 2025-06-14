"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { calculateFinalScore, SCORE_WEIGHTS } from "../utils/finalized-score/calculateFinalScore";
import { useAaveUserData } from "../utils/aave-positions/read-aave";
import { getErc20Holdings } from "../utils/erc20-holdings/getErc20Holdings";
import { calculateErc20Score } from "../utils/erc20-holdings/calculateErc20Score";
import { useDefiPositions } from "../utils/wallet-defi-activities/get-defi-positions";
import { calculateDefiCreditScore } from "../utils/wallet-defi-activities/defi-position-credit-score";

export default function FinalizedScore() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [erc20Data, setErc20Data] = useState<any>(null);
  const [finalScore, setFinalScore] = useState<any>(null);

  // Fetch Aave data using the hook
  const { data: aaveData, isLoading: isAaveLoading } = useAaveUserData(
    isAddress(address) ? (address as `0x${string}`) : undefined
  );

  // Fetch DeFi positions using the hook
  const { data: defiPositions, isPending: isDefiLoading } = useDefiPositions(
    isAddress(address) ? address as `0x${string}` : undefined
  );

  // Format currency values
  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Calculate the rotation for the gauge needle
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
    setErc20Data(null);
    setFinalScore(null);

    try {
      // Get ERC20 holdings data
      const holdings = await getErc20Holdings(address);
      if (holdings) {
        const erc20Score = calculateErc20Score(holdings.holdings);
        setErc20Data(erc20Score);
      }

      // Calculate final score
      const score = await calculateFinalScore(
        address,
        aaveData ? {
          totalCollateralBase: aaveData[0],
          totalDebtBase: aaveData[1],
          availableBorrowsBase: aaveData[2],
          currentLiquidationThreshold: aaveData[3],
          ltv: aaveData[4],
          healthFactor: aaveData[5]
        } : undefined,
        holdings?.holdings || [],
        defiPositions || []
      );
      
      setFinalScore(score);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (grade: string): string => {
    switch (grade) {
      case "EXCELLENT":
        return "text-green-600";
      case "GOOD":
        return "text-blue-600";
      case "MODERATE":
        return "text-yellow-600";
      case "RISKY":
      case "HIGH RISK":
        return "text-red-600";
      default:
        return "text-black";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-light text-black mb-4 tracking-tight">Comprehensive Credit Score Analysis</h2>
          <p className="text-gray-600 text-lg font-light max-w-2xl">
            Calculate your comprehensive on-chain credit score based on wallet age, Aave positions, stablecoin holdings, and DeFi participation
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
              disabled={isLoading || isAaveLoading || isDefiLoading}
              className="px-6 py-4 bg-black text-white text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:bg-gray-300"
            >
              {isLoading || isAaveLoading || isDefiLoading ? "Loading..." : "Check"}
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
        {(isLoading || isAaveLoading || isDefiLoading) && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        )}

        {/* Score Display */}
        {finalScore && (
          <div className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Score Visualization */}
              <div className="text-center lg:text-left">
                <div className="mb-8">
                  <div className="text-8xl font-light text-black mb-2 tracking-tight">
                    {finalScore.totalScore.toFixed(2)}
                  </div>
                  <div className="text-2xl text-gray-500 font-light">/ 100</div>
                </div>

                <div className={`text-xl font-medium mb-6 uppercase tracking-widest ${getRiskColor(finalScore.riskGrade)}`}>
                  {finalScore.riskGrade}
                </div>

                <div className="space-y-2 text-sm text-gray-600 font-mono">
                  <div>Last Updated: {new Date().toLocaleDateString()}</div>
                  <div className="break-all">Address: {address}</div>
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
                        transform: `translateX(-50%) rotate(${calculateRotation(finalScore.totalScore)}deg)`,
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

        {/* Score Components */}
        {finalScore && (
          <div className="mb-24">
            <h3 className="text-2xl font-light text-black mb-12 uppercase tracking-wide">Score Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Wallet Age Score */}
              <div className="border-l-4 border-black pl-6">
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Wallet Age</div>
                <div className="text-4xl font-light text-black mb-1">{finalScore.components.walletAge.toFixed(2)}</div>
                <div className="text-sm text-gray-500 font-mono">{(SCORE_WEIGHTS.ADDRESS_AGE * 100)}% Weight</div>
              </div>

              {/* Aave Score */}
              <div className="border-l-4 border-gray-300 pl-6">
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Aave Credit</div>
                <div className="text-4xl font-light text-black mb-1">{finalScore.components.aaveScore.toFixed(2)}</div>
                <div className="text-sm text-gray-500 font-mono">{(SCORE_WEIGHTS.CREDIT_SCORE * 100)}% Weight</div>
              </div>

              {/* ERC20 Holdings Score */}
              <div className="border-l-4 border-gray-300 pl-6">
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Stablecoin Holdings</div>
                <div className="text-4xl font-light text-black mb-1">
                  {erc20Data ? erc20Data.score.toFixed(2) : "0.00"}
                </div>
                <div className="text-sm text-gray-500 font-mono">{(SCORE_WEIGHTS.ERC20_HOLDINGS * 100)}% Weight</div>
              </div>

              {/* DeFi Participation Score */}
              <div className="border-l-4 border-gray-300 pl-6">
                <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">DeFi Participation</div>
                <div className="text-4xl font-light text-black mb-1">
                  {defiPositions ? calculateDefiCreditScore(defiPositions).totalScore.toFixed(2) : "0.00"}
                </div>
                <div className="text-sm text-gray-500 font-mono">{(SCORE_WEIGHTS.PARTICIPATION * 100)}% Weight</div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Breakdowns */}
        {finalScore && (
          <div>
            {/* ERC20 Holdings Breakdown */}
            {erc20Data && (
              <div className="mb-16">
                <h3 className="text-2xl font-light text-black mb-8 uppercase tracking-wide">Stablecoin Holdings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {Object.entries(erc20Data.breakdown).map(([symbol, data]: [string, any]) => (
                    <div key={symbol} className="p-6 border border-gray-200 rounded-lg">
                      <div className="text-lg font-medium text-black mb-2">{symbol}</div>
                      <div className="text-3xl font-light text-black mb-4">{formatUSD(data.balance)}</div>
                      <div className="text-sm text-gray-500">Score: {data.score.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DeFi Positions */}
            {defiPositions && defiPositions.length > 0 && (
              <div>
                <h3 className="text-2xl font-light text-black mb-8 uppercase tracking-wide">DeFi Positions</h3>
                <div className="space-y-6">
                  {defiPositions.map((position: any, index: number) => (
                    <div key={index} className="p-6 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={position.protocol_logo}
                          alt={position.protocol_name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="text-lg font-medium text-black">{position.protocol_name}</div>
                      </div>
                      <div className="text-gray-600">{position.position.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 