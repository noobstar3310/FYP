"use client"

import { useState, useEffect } from "react"
import { useAaveUserData, type UserAccountData } from "../utils/aave-positions/read-aave"
import { calculateCreditScore } from "../utils/aave-positions/calculate-credit-score"
import { isAddress } from "viem"
import { getErc20Holdings, type TokenHolding } from "../utils/erc20-holdings/getErc20Holdings"
import { calculateErc20Score } from "../utils/erc20-holdings/calculateErc20Score"
import { ethers } from "ethers"
import { getWalletAge } from "../utils/wallet-age-and-activity/getWalletAge"
import { calculateWalletAgeScore } from "../utils/wallet-age-and-activity/calculateWalletAgeScore"

export default function CreditScore() {
  const [address, setAddress] = useState("")
  const [walletAge, setWalletAge] = useState<string | null>(null)
  const [walletAgeScore, setWalletAgeScore] = useState<number | null>(null)
  const [erc20Data, setErc20Data] = useState<any>(null)
  const [hasCheckedErc20, setHasCheckedErc20] = useState(false)
  const { data: aaveData, error: aaveError, isPending: isAavePending } = useAaveUserData(isAddress(address) ? (address as `0x${string}`) : undefined)

  // Cast aaveData to unknown first, then to UserAccountData
  const creditScore = aaveData ? calculateCreditScore(aaveData as unknown as UserAccountData) : undefined

  useEffect(() => {
    const fetchData = async () => {
      if (!isAddress(address) || hasCheckedErc20) return

      try {
        // Fetch wallet age and calculate score
        const walletData = await getWalletAge(address)
        let walletScore: number | null = null
        let firstTransaction: string | null = null

        if (walletData && walletData.active_chains.length > 0) {
          firstTransaction = walletData.active_chains[0].first_transaction.block_timestamp
          walletScore = calculateWalletAgeScore(firstTransaction)
          setWalletAgeScore(walletScore)
          setWalletAge(new Date(firstTransaction).toLocaleDateString())
        }

        // Fetch ERC20 data
        console.log('Fetching ERC20 holdings for address:', address)
        const holdings = await getErc20Holdings(address)
        
        if (holdings && holdings.holdings.length > 0) {
          const erc20Score = calculateErc20Score(holdings.holdings)
          const erc20Result = {
            holdings: holdings.holdings.map((h: TokenHolding) => ({
              symbol: h.symbol,
              balance: ethers.formatUnits(h.balance, h.decimals),
              decimals: h.decimals
            })),
            score: erc20Score
          }
          setErc20Data(erc20Result)

          // Log combined data when all are available
          if (aaveData && walletScore !== null && firstTransaction) {
            console.log('Combined Scores:', {
              aave: creditScore,
              erc20: erc20Score,
              walletAge: {
                score: walletScore,
                firstTransaction
              }
            })
          }
        } else {
          console.log('No ERC20 holdings found for address:', address)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setHasCheckedErc20(true)
      }
    }

    fetchData()
  }, [address, aaveData, creditScore, hasCheckedErc20])

  // Reset checks when address changes
  useEffect(() => {
    setHasCheckedErc20(false)
    setErc20Data(null)
    setWalletAge(null)
    setWalletAgeScore(null)
  }, [address])

  const formatUSD = (value: bigint | undefined) => {
    if (!value) return "$0.00"
    return `$${(Number(value) / 1e8).toFixed(2)}`
  }

  const formatPercentage = (value: bigint | undefined) => {
    if (!value) return "0.00"
    return (Number(value) / 100).toFixed(2)
  }

  const formatNumber = (value: number) => {
    return value.toFixed(2)
  }

  const formatHealthFactor = (value: number) => {
    return value.toFixed(4)
  }

  const calculateRotation = (score: number) => {
    return (score / 100) * 180 - 90
  }

  const getRiskColor = (grade: string) => {
    switch (grade) {
      case "Excellent":
        return "text-black"
      case "Good":
        return "text-black"
      case "Fair":
        return "text-black"
      case "Poor":
        return "text-black"
      case "Risky":
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
          <h2 className="text-4xl font-light text-black mb-4 tracking-tight">Comprehensive Credit Analysis</h2>
          <p className="text-gray-600 text-lg font-light max-w-2xl">
            On-chain credit scoring based on Aave positions and stablecoin holdings
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

        {aaveError && (
          <div className="mb-16 p-6 border border-red-200 bg-red-50">
            <p className="text-red-800 font-medium">Error: Unable to fetch Aave data. Please verify the address.</p>
          </div>
        )}

        {isAavePending && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        )}

        {aaveData && creditScore && (
          <>
            {/* Credit Score Display */}
            <div className="mb-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Score Visualization */}
                <div className="text-center lg:text-left">
                  <div className="mb-8">
                    <div className="text-8xl font-light text-black mb-2 tracking-tight">
                      {formatNumber(creditScore.totalScore)}
                    </div>
                    <div className="text-2xl text-gray-500 font-light">/ 100</div>
                  </div>

                  <div
                    className={`text-xl font-medium mb-6 uppercase tracking-widest ${getRiskColor(creditScore.riskGrade)}`}
                  >
                    {creditScore.riskGrade}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 font-mono">
                    <div>Last Updated: {new Date().toLocaleDateString()}</div>
                    <div className="break-all">Address: {address}</div>
                    {walletAge && (
                      <div>Wallet Age: {walletAge}</div>
                    )}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="border-l-4 border-black pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Health Factor</div>
                  <div className="text-4xl font-light text-black mb-1">{creditScore.healthFactorScore}</div>
                  <div className="text-sm text-gray-500 font-mono">40% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    HF: {formatNumber(creditScore.calculations.healthFactor)}
                  </div>
                </div>

                <div className="border-l-4 border-gray-300 pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">LTV Margin</div>
                  <div className="text-4xl font-light text-black mb-1">{creditScore.ltvMarginScore}</div>
                  <div className="text-sm text-gray-500 font-mono">30% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Margin: {formatNumber(creditScore.calculations.ltvMargin)}%
                  </div>
                </div>

                <div className="border-l-4 border-gray-300 pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Collateral</div>
                  <div className="text-4xl font-light text-black mb-1">{creditScore.collateralScore}</div>
                  <div className="text-sm text-gray-500 font-mono">20% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    ${formatNumber(creditScore.calculations.collateralUSD)}
                  </div>
                </div>

                <div className="border-l-4 border-gray-300 pl-6">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Borrow Discipline</div>
                  <div className="text-4xl font-light text-black mb-1">{creditScore.borrowDisciplineScore}</div>
                  <div className="text-sm text-gray-500 font-mono">10% Weight</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Ratio: {formatNumber(creditScore.calculations.borrowRatio)}
                  </div>
                </div>

                {/* Wallet Age Score */}
                {walletAgeScore !== null && (
                  <div className="border-l-4 border-gray-300 pl-6">
                    <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Wallet Age</div>
                    <div className="text-4xl font-light text-black mb-1">{walletAgeScore}</div>
                    <div className="text-sm text-gray-500 font-mono">Score</div>
                    {walletAge && (
                      <div className="text-xs text-gray-400 mt-2">
                        Since: {walletAge}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ERC20 Holdings Section */}
            {erc20Data && (
              <div className="mb-24">
                <h3 className="text-2xl font-light text-black mb-8 uppercase tracking-wide">
                  Stablecoin Holdings
                  <span className="ml-4 text-lg font-light text-gray-500">
                    Score: {erc20Data.score.score}
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {Object.entries(erc20Data.score.breakdown).map(([symbol, data]: [string, any]) => (
                    <div key={symbol} className={`p-6 rounded-lg ${data.held ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-lg font-medium text-black">{symbol}</div>
                        <div className={`text-sm font-medium px-2 py-1 rounded ${data.held ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                          {data.held ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div className="text-3xl font-light text-black mb-2">
                        ${Number(data.balance).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">Score Contribution: {data.score}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-sm text-gray-500">
                  <p>* Score is based on maintaining minimum balances of stablecoins (DAI, USDC, USDT)</p>
                  <p>* Each stablecoin contributes up to 33.33 points to the total score</p>
                  <p>* Minimum balance requirement: $100 equivalent</p>
                </div>
              </div>
            )}

            {/* Position Details */}
            <div>
              <h3 className="text-2xl font-light text-black mb-12 uppercase tracking-wide">Position Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-12">
                <div className="space-y-4 overflow-hidden">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Health Factor</div>
                  <div className="text-5xl font-light text-black font-mono truncate" title={formatHealthFactor(creditScore.calculations.healthFactor)}>
                    {formatHealthFactor(creditScore.calculations.healthFactor)}
                  </div>
                  <div className="text-sm text-gray-500">Must stay above 1.0</div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Total Collateral</div>
                  <div className="text-5xl font-light text-black font-mono">
                    {formatUSD(aaveData?.[0])}
                  </div>
                  <div className="text-sm text-gray-500">Deposited assets</div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Total Debt</div>
                  <div className="text-5xl font-light text-black font-mono">{formatUSD(aaveData?.[1])}</div>
                  <div className="text-sm text-gray-500">Borrowed assets</div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Available to Borrow</div>
                  <div className="text-5xl font-light text-black font-mono">{formatUSD(aaveData?.[2])}</div>
                  <div className="text-sm text-gray-500">Maximum borrowing power</div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Maximum LTV</div>
                  <div className="text-5xl font-light text-black">{formatPercentage(aaveData?.[4])}%</div>
                  <div className="text-sm text-gray-500">Loan to value ratio</div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Liquidation Threshold</div>
                  <div className="text-5xl font-light text-black">{formatPercentage(aaveData?.[3])}%</div>
                  <div className="text-sm text-gray-500">Liquidation point</div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}