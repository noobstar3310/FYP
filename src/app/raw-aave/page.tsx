"use client"

import { useState } from "react"
import { useAaveUserData } from "../utils/aave-positions/read-aave"
import { calculateCreditScore } from "../utils/aave-positions/calculate-credit-score"
import { isAddress } from "viem"

export default function RawAaveData() {
  const [address, setAddress] = useState("")
  const { data: aaveData, error } = useAaveUserData(isAddress(address) ? (address as `0x${string}`) : undefined)

  // Format number with scientific notation if needed
  const formatNumber = (value: number) => {
    if (value >= 1e15) {
      return value.toExponential(2);
    }
    if (value >= 1000) {
      return value.toFixed(2);
    }
    if (value >= 1) {
      return value.toFixed(4);
    }
    return value.toExponential(2);
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

  // Calculate credit score if we have data
  const creditScore = aaveData ? calculateCreditScore({
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
          <h1 className="text-4xl font-light text-gray-900 mb-4">Raw AAVE Position Data</h1>
          <p className="text-gray-700 text-lg">
            Detailed breakdown of AAVE positions and credit score calculations.
          </p>
        </div>

        <div className="mb-12">
          <div className="max-w-2xl">
            <label htmlFor="address" className="block text-sm font-medium text-gray-800 mb-2">
              Ethereum Address
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mb-12 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">Error fetching AAVE data. Please try again.</p>
          </div>
        )}

        {creditScore && (
          <div className="space-y-12">
            {/* Raw Position Data */}
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-6">Raw Position Data</h2>
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
                  <div className="text-2xl font-light text-gray-900">{formatNumber(creditScore.calculations.healthFactor)}</div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-700 font-medium mb-2">LTV Margin</div>
                  <div className="text-2xl font-light text-gray-900">{formatNumber(creditScore.calculations.ltvMargin * 100)}%</div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-700 font-medium mb-2">Borrow Ratio</div>
                  <div className="text-2xl font-light text-gray-900">{formatNumber(creditScore.calculations.borrowRatio * 100)}%</div>
                </div>
              </div>
            </section>

            {/* Credit Score */}
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-6">Credit Score Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Score Overview */}
                <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-center mb-8">
                    <div className="text-8xl font-light text-gray-900 mb-4">{creditScore.totalScore.toFixed(0)}</div>
                    <div className="text-xl text-gray-700">Total Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-medium text-gray-900 mb-2">Grade {creditScore.riskGrade}</div>
                    <div className="text-gray-700 font-medium">Risk Assessment</div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Score Breakdown</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700 font-medium">Health Factor</span>
                        <span className="text-gray-900 font-medium">{creditScore.healthFactorScore} / 30</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full"
                          style={{ width: `${(creditScore.healthFactorScore / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700 font-medium">LTV Margin</span>
                        <span className="text-gray-900 font-medium">{creditScore.ltvMarginScore} / 30</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full"
                          style={{ width: `${(creditScore.ltvMarginScore / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700 font-medium">Collateral</span>
                        <span className="text-gray-900 font-medium">{creditScore.collateralScore} / 20</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full"
                          style={{ width: `${(creditScore.collateralScore / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700 font-medium">Borrow Discipline</span>
                        <span className="text-gray-900 font-medium">{creditScore.borrowDisciplineScore} / 20</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full"
                          style={{ width: `${(creditScore.borrowDisciplineScore / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
