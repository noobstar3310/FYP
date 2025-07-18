"use client"

import { useState, useEffect } from "react"
import { useAaveUserData, type UserAccountData } from "../utils/aave-positions/read-aave"
import { calculateCreditScore, type CreditScoreBreakdown } from "../utils/aave-positions/calculate-credit-score"
import { isAddress } from "viem"

export default function AavePositions() {
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [scoreData, setScoreData] = useState<CreditScoreBreakdown | null>(null)
  const { data: aaveData, error } = useAaveUserData(isAddress(address) ? (address as `0x${string}`) : undefined)

  // Effect to automatically calculate score when aaveData changes
  useEffect(() => {
    if (aaveData && !isLoading) {
      try {
        const creditScore = calculateCreditScore(aaveData as unknown as UserAccountData)
        setScoreData(creditScore)
      } catch (error) {
        console.error("Error calculating AAVE score:", error)
        setScoreData(null)
      }
    } else if (!aaveData) {
      setScoreData(null)
    }
  }, [aaveData, isLoading])

  const handleCheck = async () => {
    if (!isAddress(address)) return
    setIsLoading(true)
    try {
      // The useEffect above will handle the score calculation
      // when aaveData is updated
      setScoreData(null) // Clear previous data while loading
    } catch (error) {
      console.error("Error calculating AAVE score:", error)
      setScoreData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value
    setAddress(newAddress)
    // Clear score data when address changes
    if (scoreData) {
      setScoreData(null)
    }
  }

  // Format number to 2 decimal places and add commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
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

  // Calculate the rotation for the gauge needle (from -90 to 90 degrees)
  const calculateRotation = (score: number) => {
    return (score / 100) * 180 - 90
  }

  const getRiskColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-green-600"
      case "B":
        return "text-blue-600"
      case "C":
        return "text-yellow-600"
      case "D":
        return "text-red-600"
      default:
        return "text-black"
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-light text-black mb-4 tracking-tight">AAVE Position Analysis</h2>
          <p className="text-gray-600 text-lg font-light max-w-2xl">
            Comprehensive credit scoring based on AAVE protocol positions and health metrics
          </p>
        </div>

        {/* Address Input */}
        <div className="mb-16">
          <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Wallet Address</label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={handleAddressChange}
            placeholder="0x..."
            className="w-full max-w-2xl px-0 py-4 text-xl text-black border-0 border-b border-gray-300 focus:ring-0 focus:border-black transition-colors bg-transparent font-mono tracking-wide"
          />
        </div>

        {error && (
          <div className="mb-16 p-6 border border-red-200 bg-red-50">
            <p className="text-red-800 font-medium">Error fetching AAVE data. Please try again.</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        )}

        {!isLoading && !scoreData && isAddress(address) && (
          <div className="text-center py-16">
            <p className="text-gray-600">No AAVE positions found for this address.</p>
          </div>
        )}

        {scoreData && (
          <>
            {/* Credit Score Display */}
            <div className="mb-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Score Visualization */}
                <div className="text-center lg:text-left">
                  <div className="mb-8">
                    <div className="text-8xl font-light text-black mb-2 tracking-tight">
                      {scoreData.totalScore.toFixed(0)}
                    </div>
                    <div className="text-2xl text-gray-500 font-light">/ 100</div>
                  </div>

                  <div className={`text-xl font-medium mb-6 uppercase tracking-widest ${getRiskColor(scoreData.riskGrade)}`}>
                    Grade {scoreData.riskGrade}
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
                          transform: `translateX(-50%) rotate(${calculateRotation(scoreData.totalScore)}deg)`,
                        }}
                      />

                      {/* Center Dot */}
                      <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-black rounded-full transform -translate-x-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Components Grid */}
            <div className="mb-24">
              <h3 className="text-2xl font-light text-black mb-12 uppercase tracking-wide">Score Components</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="border-l-4 border-black pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Health Factor</div>
                  <div className="text-4xl font-light text-black mb-1">{scoreData.healthFactorScore}</div>
                  <div className="text-sm text-gray-500 font-mono">30% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Current: {formatNumber(scoreData.calculations.healthFactor)}
                  </div>
                </div>

                <div className="border-l-4 border-gray-300 pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">LTV Margin</div>
                  <div className="text-4xl font-light text-black mb-1">{scoreData.ltvMarginScore}</div>
                  <div className="text-sm text-gray-500 font-mono">30% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Current: {formatNumber(scoreData.calculations.ltvMargin)}
                  </div>
                </div>

                <div className="border-l-4 border-gray-300 pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Collateral</div>
                  <div className="text-4xl font-light text-black mb-1">{scoreData.collateralScore}</div>
                  <div className="text-sm text-gray-500 font-mono">20% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {formatUSD(scoreData.calculations.collateralUSD)}
                  </div>
                </div>

                <div className="border-l-4 border-gray-300 pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Borrow Discipline</div>
                  <div className="text-4xl font-light text-black mb-1">{scoreData.borrowDisciplineScore}</div>
                  <div className="text-sm text-gray-500 font-mono">20% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Ratio: {formatNumber(scoreData.calculations.borrowRatio)}
                  </div>
                </div>
              </div>
            </div>

            {/* Scoring Explanation */}
            <div>
              <h3 className="text-2xl font-light text-black mb-12 uppercase tracking-wide">How the Score is Calculated</h3>
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="space-y-4">
                  <p className="text-gray-600">
                    The AAVE position score is calculated based on four key metrics:
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mr-4">30%</div>
                      <div>
                        <h4 className="font-medium text-black">Health Factor</h4>
                        <p className="text-gray-600">Measures the safety margin of your position against liquidation.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mr-4">30%</div>
                      <div>
                        <h4 className="font-medium text-black">LTV Margin</h4>
                        <p className="text-gray-600">Evaluates the buffer between your current loan-to-value ratio and the liquidation threshold.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mr-4">20%</div>
                      <div>
                        <h4 className="font-medium text-black">Collateral Value</h4>
                        <p className="text-gray-600">Considers the total USD value of your deposited collateral.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mr-4">20%</div>
                      <div>
                        <h4 className="font-medium text-black">Borrow Discipline</h4>
                        <p className="text-gray-600">Assesses how responsibly you're using your borrowing capacity.</p>
                      </div>
                    </li>
                  </ul>
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-black mb-4">Risk Grades</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-green-600 font-medium">Grade A</div>
                        <div className="text-sm text-gray-600">80-100 points</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-blue-600 font-medium">Grade B</div>
                        <div className="text-sm text-gray-600">65-79 points</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-yellow-600 font-medium">Grade C</div>
                        <div className="text-sm text-gray-600">50-64 points</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-red-600 font-medium">Grade D</div>
                        <div className="text-sm text-gray-600">0-49 points</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
