"use client"

import { useState, useEffect } from "react"
import { useAaveUserData } from "../utils/aave-positions/read-aave"
import { calculateCreditScore } from "../utils/aave-positions/calculate-credit-score"
import { isAddress } from "viem"
import { getErc20Holdings } from "../utils/erc20-holdings/getErc20Holdings"
import { calculateErc20Score } from "../utils/erc20-holdings/calculateErc20Score"
import { getWalletAge } from "../utils/wallet-age-and-activity/getWalletAge"
import { calculateWalletAgeScore } from "../utils/wallet-age-and-activity/calculateWalletAgeScore"
import { getParticipationScore } from "../utils/participation/getParticipationScore"

type FinalScore = {
  score: number
  components: {
    aaveScore: number | null
    participationScore: number | null
    erc20Score: number | null
    walletAgeScore: number | null
  }
  weightedComponents: {
    aaveWeighted: number
    participationWeighted: number
    erc20Weighted: number
    walletAgeWeighted: number
  }
}

const WEIGHTS = {
  aave: 0.45,
  participation: 0.25,
  erc20: 0.15,
  walletAge: 0.15,
}

function calculateFinalScore(
  aaveScore: number | null,
  participationScore: number | null,
  erc20Score: number | null,
  walletAgeScore: number | null,
): FinalScore {
  const weightedComponents = {
    aaveWeighted: 0,
    participationWeighted: 0,
    erc20Weighted: 0,
    walletAgeWeighted: 0,
  }

  if (aaveScore !== null) weightedComponents.aaveWeighted = aaveScore * WEIGHTS.aave
  if (participationScore !== null) weightedComponents.participationWeighted = participationScore * WEIGHTS.participation
  if (erc20Score !== null) weightedComponents.erc20Weighted = erc20Score * WEIGHTS.erc20
  if (walletAgeScore !== null) weightedComponents.walletAgeWeighted = walletAgeScore * WEIGHTS.walletAge

  const totalScore = Object.values(weightedComponents).reduce((a, b) => a + b, 0)

  return {
    score: Math.round(totalScore),
    components: {
      aaveScore,
      participationScore,
      erc20Score,
      walletAgeScore,
    },
    weightedComponents,
  }
}

export default function FinalizedScore() {
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [finalScoreData, setFinalScoreData] = useState<FinalScore | null>(null)
  const { data: aaveData, error: aaveError } = useAaveUserData(isAddress(address) ? (address as `0x${string}`) : undefined)

  // Format number with scientific notation if needed
  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return value.toFixed(2);
    }
    if (value >= 1) {
      return value.toFixed(4);
    }
    if (value > 0) {
      return value.toFixed(6);
    }
    return "0";
  }

  // Format USD value
  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const handleAddressSubmit = async () => {
    if (!isAddress(address)) return
    setIsLoading(true)

    try {
      let aaveScore: number | null = null
      let participationScore: number | null = null
      let erc20Score: number | null = null
      let walletAgeScore: number | null = null

      // AAVE Score
      if (aaveData) {
        console.group("AAVE Data")
        console.log("Raw AAVE Values:", {
          totalCollateralBase: aaveData[0].toString(),
          totalDebtBase: aaveData[1].toString(),
          availableBorrowsBase: aaveData[2].toString(),
          currentLiquidationThreshold: aaveData[3].toString(),
          ltv: aaveData[4].toString(),
          healthFactor: aaveData[5].toString()
        })

        const creditScore = calculateCreditScore({
          totalCollateralBase: aaveData[0],
          totalDebtBase: aaveData[1],
          availableBorrowsBase: aaveData[2],
          currentLiquidationThreshold: aaveData[3],
          ltv: aaveData[4],
          healthFactor: aaveData[5]
        })
        aaveScore = creditScore.totalScore
        console.log("AAVE Credit Score:", aaveScore)
        console.groupEnd()
      }

      // Wallet Age Score
      console.group("Wallet Age")
      const walletData = await getWalletAge(address)
      if (walletData && walletData.active_chains.length > 0) {
        const firstTransaction = walletData.active_chains[0].first_transaction.block_timestamp
        walletAgeScore = calculateWalletAgeScore(firstTransaction)
        console.log("First Transaction:", new Date(firstTransaction).toLocaleDateString())
        console.log("Wallet Age Score:", walletAgeScore)
      } else {
        console.log("No wallet age data found")
      }
      console.groupEnd()

      // DeFi Participation Score
      console.group("DeFi Participation")
      const participationData = await getParticipationScore(address)
      if (participationData) {
        participationScore = participationData.score
        console.log("Participation Score:", participationScore)
      } else {
        console.log("No participation data found")
      }
      console.groupEnd()

      // ERC20 Holdings Score
      console.group("ERC20 Holdings")
      const holdings = await getErc20Holdings(address)
      if (holdings && holdings.holdings.length > 0) {
        const erc20Result = calculateErc20Score(holdings.holdings)
        erc20Score = erc20Result.score
        console.log("Number of tokens:", holdings.holdings.length)
        console.log("ERC20 Score:", erc20Score)
      } else {
        console.log("No ERC20 holdings found")
      }
      console.groupEnd()

      // Calculate Final Score
      const finalScore = calculateFinalScore(aaveScore, participationScore, erc20Score, walletAgeScore)
      console.group("Final Score Calculation")
      console.log("Component Scores:", finalScore.components)
      console.log("Weighted Components:", finalScore.weightedComponents)
      console.log("Total Score:", finalScore.score)
      console.groupEnd()

      setFinalScoreData(finalScore)
    } catch (error) {
      console.error("Error calculating scores:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate credit score if we have data
  const aaveScore = aaveData ? calculateCreditScore({
    totalCollateralBase: aaveData[0],
    totalDebtBase: aaveData[1],
    availableBorrowsBase: aaveData[2],
    currentLiquidationThreshold: aaveData[3],
    ltv: aaveData[4],
    healthFactor: aaveData[5]
  }) : null

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-4">Finalized Credit Score</h1>
          <p className="text-gray-700 text-lg">
            Comprehensive credit score based on AAVE positions, DeFi participation, token holdings, and wallet age.
          </p>
        </div>

        <div className="mb-12">
          <div className="max-w-2xl">
            <label htmlFor="address" className="block text-sm font-medium text-gray-800 mb-2">
              Ethereum Address
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
              />
              <button
                onClick={handleAddressSubmit}
                disabled={!isAddress(address) || isLoading}
                className="px-8 py-3 bg-black text-white font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors rounded-lg"
              >
                {isLoading ? "Calculating..." : "Calculate Score"}
              </button>
            </div>
          </div>
        </div>

        {aaveError && (
          <div className="max-w-2xl mb-12 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">Error fetching AAVE data. Please try again.</p>
          </div>
        )}

        {finalScoreData && (
          <div className="space-y-12">
            {/* Raw Position Data */}
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-6">AAVE Position Data</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-700 font-medium mb-2">Total Collateral</div>
                  <div className="text-2xl font-light text-gray-900">{formatUSD(Number(aaveData![0]) / 1e8)}</div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-700 font-medium mb-2">Total Debt</div>
                  <div className="text-2xl font-light text-gray-900">{formatUSD(Number(aaveData![1]) / 1e8)}</div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-700 font-medium mb-2">Available Borrows</div>
                  <div className="text-2xl font-light text-gray-900">{formatUSD(Number(aaveData![2]) / 1e8)}</div>
                </div>
              </div>
            </section>

            {/* Risk Metrics */}
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-6">Risk Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-700 font-medium mb-2">Health Factor</div>
                  <div className="text-2xl font-light text-gray-900">{formatNumber(aaveScore!.calculations.healthFactor)}</div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-700 font-medium mb-2">LTV Margin</div>
                  <div className="text-2xl font-light text-gray-900">{formatNumber(aaveScore!.calculations.ltvMargin * 100)}%</div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-700 font-medium mb-2">Borrow Ratio</div>
                  <div className="text-2xl font-light text-gray-900">{formatNumber(aaveScore!.calculations.borrowRatio * 100)}%</div>
                </div>
              </div>
            </section>

            {/* Final Score */}
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-6">Final Credit Score</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Score Overview */}
                <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-center mb-8">
                    <div className="text-8xl font-light text-gray-900 mb-4">{finalScoreData.score}</div>
                    <div className="text-xl text-gray-700">Total Score</div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Score Breakdown</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700 font-medium">AAVE Score</span>
                        <span className="text-gray-900 font-medium">{finalScoreData.components.aaveScore?.toFixed(1) || 0} × {(WEIGHTS.aave * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full"
                          style={{ width: `${((finalScoreData.components.aaveScore || 0) / 100) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700 font-medium">DeFi Participation</span>
                        <span className="text-gray-900 font-medium">{finalScoreData.components.participationScore?.toFixed(1) || 0} × {(WEIGHTS.participation * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full"
                          style={{ width: `${((finalScoreData.components.participationScore || 0) / 100) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700 font-medium">Token Holdings</span>
                        <span className="text-gray-900 font-medium">{finalScoreData.components.erc20Score?.toFixed(1) || 0} × {(WEIGHTS.erc20 * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full"
                          style={{ width: `${((finalScoreData.components.erc20Score || 0) / 100) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700 font-medium">Wallet Age</span>
                        <span className="text-gray-900 font-medium">{finalScoreData.components.walletAgeScore?.toFixed(1) || 0} × {(WEIGHTS.walletAge * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full"
                          style={{ width: `${((finalScoreData.components.walletAgeScore || 0) / 100) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Final Calculation */}
            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-xl font-medium text-gray-900 mb-4">Final Score Calculation</h3>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-600">AAVE Score:</span>
                    <span className="text-gray-900">{finalScoreData.weightedComponents.aaveWeighted.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DeFi Participation:</span>
                    <span className="text-gray-900">{finalScoreData.weightedComponents.participationWeighted.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token Holdings:</span>
                    <span className="text-gray-900">{finalScoreData.weightedComponents.erc20Weighted.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wallet Age:</span>
                    <span className="text-gray-900">{finalScoreData.weightedComponents.walletAgeWeighted.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-300">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-900">Final Score:</span>
                      <span className="text-gray-900">{finalScoreData.score}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
