"use client"

import { useState } from "react"
import { useDefiPositions } from "../utils/wallet-defi-activities/get-defi-positions"
import { calculateDefiCreditScore } from "../utils/wallet-defi-activities/defi-position-credit-score"
import { isAddress } from "viem"

export default function TestDefiPositions() {
  const [address, setAddress] = useState("")
  const { data: positions, error, isPending } = useDefiPositions(isAddress(address) ? address as `0x${string}` : undefined)

  const formatNumber = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "0"
    const num = typeof value === 'string' ? Number(value) : value
    if (isNaN(num)) return "0"
    if (Math.abs(num) < 0.0001 && num !== 0) {
      return num.toExponential(6)
    }
    return num.toFixed(6)
  }

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
      case "Excellent":
        return "text-green-600"
      case "Good":
        return "text-blue-600"
      case "Fair":
        return "text-yellow-600"
      case "Poor":
        return "text-orange-600"
      case "Risky":
        return "text-red-600"
      default:
        return "text-black"
    }
  }

  const creditScore = positions && positions.length > 0 ? calculateDefiCreditScore(positions) : undefined

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-light text-black mb-4 tracking-tight">DeFi Participation Analysis</h2>
          <p className="text-gray-600 text-lg font-light max-w-2xl">
            Comprehensive on-chain credit scoring based on DeFi protocol participation and activity
          </p>
        </div>

        {/* Address Input */}
        <div className="mb-16">
          <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Wallet Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full max-w-2xl px-0 py-4 text-xl text-black border-0 border-b border-gray-300 focus:ring-0 focus:border-black transition-colors bg-transparent font-mono tracking-wide"
          />
        </div>

        {error && (
          <div className="mb-16 p-6 border border-red-200 bg-red-50">
            <p className="text-red-800 font-medium">Error: {error.message}</p>
          </div>
        )}

        {isPending && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        )}

        {creditScore && positions && (
          <>
            {/* Credit Score Display */}
            <div className="mb-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Score Visualization */}
                <div className="text-center lg:text-left">
                  <div className="mb-8">
                    <div className="text-8xl font-light text-black mb-2 tracking-tight">
                      {creditScore.totalScore.toFixed(0)}
                    </div>
                    <div className="text-2xl text-gray-500 font-light">/ 100</div>
                  </div>

                  <div className={`text-xl font-medium mb-6 uppercase tracking-widest ${getRiskColor(creditScore.riskGrade)}`}>
                    {creditScore.riskGrade}
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
                          transform: `translateX(-50%) rotate(${calculateRotation(creditScore.totalScore)}deg)`,
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="border-l-4 border-black pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Protocol Diversity</div>
                  <div className="text-4xl font-light text-black mb-1">{creditScore.protocolDiversityScore}</div>
                  <div className="text-sm text-gray-500 font-mono">40% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Unique Protocols: {creditScore.calculations.uniqueProtocols}
                  </div>
                </div>

                <div className="border-l-4 border-gray-300 pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Activity Types</div>
                  <div className="text-4xl font-light text-black mb-1">{creditScore.activityTypesScore}</div>
                  <div className="text-sm text-gray-500 font-mono">40% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Unique Activities: {creditScore.calculations.uniqueActivities}
                  </div>
                </div>

                <div className="border-l-4 border-gray-300 pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Total Value</div>
                  <div className="text-4xl font-light text-black mb-1">{creditScore.totalValueScore}</div>
                  <div className="text-sm text-gray-500 font-mono">20% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {formatUSD(creditScore.calculations.totalValueUSD)}
                  </div>
                </div>
              </div>
            </div>

            {/* Positions List */}
            <div>
              <h3 className="text-2xl font-light text-black mb-12 uppercase tracking-wide">DeFi Positions</h3>
              <div className="space-y-8">
                {positions.map((position, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    {/* Protocol Info */}
                    <div className="flex items-center gap-4 mb-6">
                      <img 
                        src={position.protocol_logo} 
                        alt={position.protocol_name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <h3 className="text-xl font-medium text-black">{position.protocol_name}</h3>
                        <a 
                          href={position.protocol_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View on {position.protocol_name} ↗
                        </a>
                      </div>
                    </div>

                    {/* Position Info */}
                    <div className="space-y-4 font-mono">
                      <div>
                        <div className="text-sm font-medium text-gray-900 uppercase tracking-wide">Position Type</div>
                        <div className="text-lg text-black">{position.position.label}</div>
                      </div>

                      {/* Tokens */}
                      {position.position.tokens.map((token, idx) => (
                        <div key={idx} className="border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img 
                                src={token.logo} 
                                alt={token.name}
                                className="w-6 h-6 rounded-full"
                              />
                              <div>
                                <div className="font-medium text-black">{token.name}</div>
                                <div className="text-sm text-gray-700">{token.symbol}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-black">${formatNumber(token.usd_value)}</div>
                              <div className="text-sm text-gray-700">
                                {formatNumber(token.balance)} {token.symbol}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Position Details */}
                      {position.position.position_details && (
                        <div className="border-t border-gray-200 pt-4">
                          <div className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-2">Position Details</div>
                          <div className="space-y-2 text-sm">
                            {position.position.position_details.share_of_pool !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-gray-700">Share of Pool</span>
                                <span className="text-black font-medium">{formatNumber(position.position.position_details.share_of_pool * 100)}%</span>
                              </div>
                            )}
                            {position.position.position_details.reserve0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-700">Reserve 0</span>
                                <span className="text-black font-medium">{formatNumber(position.position.position_details.reserve0)}</span>
                              </div>
                            )}
                            {position.position.position_details.reserve1 && (
                              <div className="flex justify-between">
                                <span className="text-gray-700">Reserve 1</span>
                                <span className="text-black font-medium">{formatNumber(position.position.position_details.reserve1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {positions && positions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600">No DeFi positions found for this address.</p>
          </div>
        )}
      </main>
    </div>
  )
} 