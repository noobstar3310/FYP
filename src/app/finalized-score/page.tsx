"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAaveUserData, type UserAccountData } from "../utils/aave-positions/read-aave"
import { calculateCreditScore } from "../utils/aave-positions/calculate-credit-score"
import { isAddress } from "viem"
import { getErc20Holdings } from "../utils/erc20-holdings/getErc20Holdings"
import { calculateErc20Score } from "../utils/erc20-holdings/calculateErc20Score"
import { getWalletAge } from "../utils/wallet-age-and-activity/getWalletAge"
import { calculateWalletAgeScore } from "../utils/wallet-age-and-activity/calculateWalletAgeScore"
import { getParticipationScore } from "../utils/participation/getParticipationScore"
import { useAccount, useWriteContract } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"

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

// Use lending protocol contract address
const LENDING_PROTOCOL_ADDRESS = "0x47E85b70D0DE7529809Fc32ba069fFa4d09aa245"

// Add lending protocol contract ABI for mint function
const LENDING_PROTOCOL_ABI = [
  {
    "inputs": [{"internalType": "uint256","name": "score","type": "uint256"}],
    "name": "mintCreditScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export default function CreditScore() {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [scoreData, setScoreData] = useState<FinalScore | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { data: aaveData } = useAaveUserData(isConnected ? (address as `0x${string}`) : undefined)
  const { writeContractAsync } = useWriteContract()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Auto-fetch score when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      handleCheck()
    }
  }, [isConnected, address])

  const handleCheck = async () => {
    if (!isConnected || !address) return

    setIsLoading(true)
    try {
      let aaveScore: number | null = null
      let participationScore: number | null = null
      let erc20Score: number | null = null
      let walletAgeScore: number | null = null

      // Aave data processing
      if (aaveData) {
        const creditScore = calculateCreditScore(aaveData as unknown as UserAccountData)
        aaveScore = creditScore.totalScore
      }

      // Wallet age
      const walletData = await getWalletAge(address)
      if (walletData && walletData.active_chains.length > 0) {
        const firstTransaction = walletData.active_chains[0].first_transaction.block_timestamp
        walletAgeScore = calculateWalletAgeScore(firstTransaction)
      }

      // Participation data
      const participationData = await getParticipationScore(address)
      if (participationData) {
        participationScore = participationData.score
      }

      // ERC20 data
      const holdings = await getErc20Holdings(address)
      if (holdings && holdings.holdings.length > 0) {
        const erc20Result = calculateErc20Score(holdings.holdings)
        erc20Score = erc20Result.score
      }

      const finalScore = calculateFinalScore(aaveScore, participationScore, erc20Score, walletAgeScore)
      setScoreData(finalScore)
    } catch (error) {
      console.error("Error fetching data:", error)
      setScoreData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMint = async () => {
    if (!scoreData || !address) return

    try {
      setIsMinting(true)
      
      await writeContractAsync({
        address: LENDING_PROTOCOL_ADDRESS,
        abi: LENDING_PROTOCOL_ABI,
        functionName: 'mintCreditScore',
        args: [BigInt(Math.round(scoreData.score))],
      })

      // Show success message or handle post-mint actions
      console.log('Successfully minted credit score NFT')
    } catch (error) {
      console.error('Error minting credit score:', error)
    } finally {
      setIsMinting(false)
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { text: "Excellent", color: "text-black" }
    if (score >= 65) return { text: "Good", color: "text-black" }
    if (score >= 50) return { text: "Moderate", color: "text-black" }
    return { text: "Risky", color: "text-red-600" }
  }

  const calculateRotation = (score: number) => {
    return (score / 100) * 180 - 90
  }

  const finalScore = scoreData ? Math.round(Object.values(scoreData.weightedComponents).reduce((a, b) => a + b, 0)) : 0

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity, transform;
        }

        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .stagger-1 {
          transition-delay: 0.2s;
        }
        .stagger-2 {
          transition-delay: 0.4s;
        }
        .stagger-3 {
          transition-delay: 0.6s;
        }

        .gauge-needle {
          transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: bottom center;
        }

        .score-animate {
          animation: score-count 2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes score-count {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .progress-bar {
          animation: progress-fill 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes progress-fill {
          0% {
            width: 0%;
          }
          100% {
            width: var(--progress-width);
          }
        }

        .meter-scale {
          position: relative;
        }

        .meter-tick {
          position: absolute;
          width: 2px;
          height: 12px;
          background: #d1d5db;
          transform-origin: bottom center;
        }

        .meter-tick.major {
          height: 20px;
          width: 3px;
          background: #6b7280;
        }

        .meter-label {
          position: absolute;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          transform: translateX(-50%);
        }

        /* Ensure all text has proper contrast */
        .text-ensure-black {
          color: #000000 !important;
        }

        .text-ensure-gray {
          color: #4b5563 !important;
        }

        .text-ensure-light-gray {
          color: #6b7280 !important;
        }
      `}</style>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className={`mb-24 fade-in ${isVisible ? "visible" : ""}`}>
          <h1 className="text-5xl font-light text-ensure-black mb-6 tracking-tight">Credit Analysis</h1>
          <p className="text-lg text-ensure-gray font-light max-w-3xl leading-relaxed">
            Comprehensive on-chain credit scoring based on DeFi positions, protocol participation, token holdings, and
            wallet maturity
          </p>
        </div>

        {/* Connection Status */}
        <div className={`mb-24 fade-in ${isVisible ? "visible" : ""} stagger-1`}>
          {!isConnected ? (
            <div className="text-center py-12 border border-gray-200 bg-gray-50">
              <p className="text-lg text-ensure-gray mb-6">Please connect your wallet to view your credit score</p>
              <ConnectButton />
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg text-ensure-gray">Analyzing your wallet...</p>
            </div>
          ) : !scoreData ? (
            <div className="text-center py-12">
              <button
                onClick={handleCheck}
                className="px-12 py-4 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-all hover:scale-105"
              >
                Analyze My Wallet
              </button>
            </div>
          ) : null}
        </div>

        {/* Score Display */}
        {scoreData && (
          <div className="space-y-24">
            {/* Main Score with Meter */}
            <div className={`fade-in ${isVisible ? "visible" : ""} stagger-2`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Score Display */}
                <div className="text-center lg:text-left">
                  <div className="mb-8">
                    <div className="text-9xl font-light text-ensure-black mb-4 tracking-tight score-animate">
                      {finalScore}
                    </div>
                    <div className="text-3xl text-ensure-light-gray font-light">/ 100</div>
                  </div>

                  <div
                    className={`text-2xl font-medium mb-8 uppercase tracking-widest ${getRiskLevel(finalScore).color}`}
                  >
                    {getRiskLevel(finalScore).text}
                  </div>

                  <div className="space-y-2 text-sm text-ensure-gray font-mono">
                    <div>Analysis Date: {new Date().toLocaleDateString()}</div>
                    <div className="break-all">Address: {address}</div>
                  </div>
                </div>

                {/* Score Meter */}
                <div className="flex justify-center lg:justify-end">
                  <div className="relative">
                    {/* Meter Background */}
                    <div className="w-80 h-40 relative meter-scale">
                      {/* Meter Arc */}
                      <div className="absolute w-full h-full border-4 border-gray-200 rounded-t-full"></div>

                      {/* Score Zones */}
                      <div className="absolute w-full h-full rounded-t-full overflow-hidden">
                        <div className="absolute w-full h-full bg-gradient-to-r from-red-100 via-yellow-100 via-blue-100 to-green-100 opacity-30 rounded-t-full"></div>
                      </div>

                      {/* Meter Ticks */}
                      {[0, 20, 40, 60, 80, 100].map((value) => {
                        const angle = (value / 100) * 180 - 90
                        const isMajor = value % 20 === 0
                        return (
                          <div key={value}>
                            <div
                              className={`meter-tick ${isMajor ? "major" : ""}`}
                              style={{
                                bottom: "0px",
                                left: "50%",
                                transform: `translateX(-50%) rotate(${angle}deg)`,
                              }}
                            />
                            {isMajor && (
                              <div
                                className="meter-label"
                                style={{
                                  bottom: "-30px",
                                  left: `${10 + (value / 100) * 80}%`,
                                }}
                              >
                                {value}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Needle */}
                      <div
                        className="absolute bottom-0 left-1/2 w-1 h-32 bg-black gauge-needle"
                        style={{
                          transform: `translateX(-50%) rotate(${calculateRotation(finalScore)}deg)`,
                        }}
                      />

                      {/* Center Dot */}
                      <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-black rounded-full transform -translate-x-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Component Breakdown */}
            <div className={`fade-in ${isVisible ? "visible" : ""} stagger-3`}>
              <h2 className="text-3xl font-light text-ensure-black mb-12 uppercase tracking-wide">Score Components</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {[
                  {
                    label: "Aave Positions",
                    score: scoreData.components.aaveScore,
                    weight: WEIGHTS.aave,
                    weighted: scoreData.weightedComponents.aaveWeighted,
                    description: "Lending protocol health and activity",
                  },
                  {
                    label: "Protocol Participation",
                    score: scoreData.components.participationScore,
                    weight: WEIGHTS.participation,
                    weighted: scoreData.weightedComponents.participationWeighted,
                    description: "DeFi ecosystem engagement",
                  },
                  {
                    label: "Token Holdings",
                    score: scoreData.components.erc20Score,
                    weight: WEIGHTS.erc20,
                    weighted: scoreData.weightedComponents.erc20Weighted,
                    description: "Portfolio diversity and stability",
                  },
                  {
                    label: "Wallet Maturity",
                    score: scoreData.components.walletAgeScore,
                    weight: WEIGHTS.walletAge,
                    weighted: scoreData.weightedComponents.walletAgeWeighted,
                    description: "Account age and transaction history",
                  },
                ].map((component) => (
                  <div
                    key={component.label}
                    className="space-y-6 p-8 border border-gray-200 hover:border-gray-300 transition-colors bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-medium text-ensure-black uppercase tracking-wide mb-2">
                          {component.label}
                        </h3>
                        <p className="text-sm text-ensure-gray font-light">{component.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-light text-ensure-black">{component.weighted.toFixed(1)}</div>
                        <div className="text-sm text-ensure-light-gray">/ {(component.weight * 100).toFixed(0)}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-ensure-gray">Progress</span>
                        <span className="font-mono text-ensure-black">
                          {((component.weighted / component.weight) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full progress-bar"
                          style={
                            {
                              "--progress-width": `${(component.weighted / component.weight) * 100}%`,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                      <div className="text-xs text-ensure-light-gray font-mono">
                        Base Score: {component.score || 0} × {(component.weight * 100).toFixed(0)}% weight
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Calculation */}
            <div className={`pt-16 border-t border-gray-200 fade-in ${isVisible ? "visible" : ""} stagger-3`}>
              <h3 className="text-2xl font-light text-ensure-black mb-8 uppercase tracking-wide">Final Calculation</h3>
              <div className="bg-gray-50 p-8 font-mono text-lg border border-gray-200">
                <div className="space-y-2">
                  {Object.entries(scoreData.weightedComponents).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-ensure-gray">
                        {key
                          .replace("Weighted", "")
                          .replace(/([A-Z])/g, " $1")
                          .trim()}
                        :
                      </span>
                      <span className="text-ensure-black">{value.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 pt-2 mt-4 flex justify-between font-medium text-xl">
                    <span className="text-ensure-black">Total Score:</span>
                    <span className="text-ensure-black">{finalScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div
              className={`text-center pt-16 border-t border-gray-200 fade-in ${isVisible ? "visible" : ""} stagger-3`}
            >
              <h3 className="text-3xl font-light text-ensure-black mb-8 tracking-tight">Ready to mint your score?</h3>
              <button 
                onClick={handleMint}
                disabled={isMinting || !scoreData}
                className="px-12 py-4 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isMinting ? 'Minting...' : 'Mint as SBT'}
              </button>
              <p className="text-sm text-ensure-gray mt-4 font-light">
                Mint your credit score as a Soul-Bound Token for portable reputation
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
