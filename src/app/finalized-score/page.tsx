"use client"

import { useState, useEffect } from "react"
import { useAaveUserData } from "../utils/aave-positions/read-aave"
import { calculateCreditScore } from "../utils/aave-positions/calculate-credit-score"
import { isAddress } from "viem"
import { useAccount, useWriteContract, useReadContract } from "wagmi"
import { LENDING_PROTOCOL_ADDRESS, NFT_CONTRACT_ADDRESS, LENDING_PROTOCOL_ABI, NFT_CONTRACT_ABI } from "../constants/contracts"
import { getErc20Holdings } from "../utils/erc20-holdings/getErc20Holdings"
import { calculateErc20Score } from "../utils/erc20-holdings/calculateErc20Score"
import { getWalletAge } from "../utils/wallet-age-and-activity/getWalletAge"
import { calculateWalletAgeScore } from "../utils/wallet-age-and-activity/calculateWalletAgeScore"
import { getDefiPositions, type DefiPosition } from "../utils/wallet-defi-activities/get-defi-positions"
import { calculateDefiCreditScore } from "../utils/wallet-defi-activities/defi-position-credit-score"

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
  const [isMinting, setIsMinting] = useState(false)
  const [mintingError, setMintingError] = useState<string | null>(null)
  const { address: userAddress, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [finalScoreData, setFinalScoreData] = useState<FinalScore | null>(null)
  const { data: aaveData, error: aaveError } = useAaveUserData(isAddress(address) ? (address as `0x${string}`) : undefined)

  // Add NFT balance check
  const { data: nftBalance } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_CONTRACT_ABI,
    functionName: 'getHolderTokenId',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  })

  // Add user position check from lending protocol
  const { data: userPosition } = useReadContract({
    address: LENDING_PROTOCOL_ADDRESS,
    abi: LENDING_PROTOCOL_ABI,
    functionName: 'getUserPosition',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  })

  // Get credit score details if user has NFT
  const { data: creditScoreDetails } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_CONTRACT_ABI,
    functionName: 'creditScores',
    args: userPosition && userPosition[2] ? [userPosition[2]] : undefined,
  })

  // Convert BigInt to number for comparison
  const nftTokenId = nftBalance ? Number(nftBalance) : 0
  const creditTokenId = userPosition ? Number(userPosition[2]) : 0
  
  // Check if NFT is collateralized
  const isNFTCollateralized = creditScoreDetails ? Boolean(creditScoreDetails[2]) : false

  // Check if user can mint
  const hasNoNFT = nftTokenId === 0 && creditTokenId === 0
  const hasNoActivePosition = !isNFTCollateralized
  const canMint = isConnected && 
                  userAddress === address && 
                  !isMinting && 
                  hasNoNFT && 
                  hasNoActivePosition

  useEffect(() => {
    if (creditScoreDetails) {
      console.log('Credit Score Details:', {
        score: Number(creditScoreDetails[0]),
        lastUpdated: Number(creditScoreDetails[1]),
        isCollateralized: Boolean(creditScoreDetails[2])
      })
    }
  }, [creditScoreDetails])

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
      try {
        const walletData = await getWalletAge(address)
        if (walletData && walletData.active_chains && walletData.active_chains.length > 0 && walletData.active_chains[0].first_transaction) {
          const firstTransaction = walletData.active_chains[0].first_transaction.block_timestamp
          walletAgeScore = calculateWalletAgeScore(firstTransaction)
          console.log("First Transaction:", new Date(firstTransaction).toLocaleDateString())
          console.log("Wallet Age Score:", walletAgeScore)
        } else {
          console.log("No wallet age data found or wallet is new")
          walletAgeScore = 0
        }
      } catch (error) {
        console.error("Error fetching wallet age:", error)
        walletAgeScore = 0
      }
      console.groupEnd()

      // DeFi Participation Score
      console.group("DeFi Participation")
      try {
        const defiPositions = await getDefiPositions(address)
        console.log("Raw DeFi Positions:", defiPositions)

        if (defiPositions && defiPositions.length > 0) {
          // Log each position's details
          defiPositions.forEach((position, index) => {
            console.group(`Position ${index + 1}: ${position.protocol_name}`)
            console.log("Protocol:", {
              name: position.protocol_name,
              id: position.protocol_id,
              url: position.protocol_url
            })
            console.log("Position Type:", position.position.label)
            console.log("Balance USD:", position.position.balance_usd)
            console.log("Tokens:", position.position.tokens)
            if (position.position.position_details) {
              console.log("Position Details:", position.position.position_details)
            }
            console.groupEnd()
          })

          // Calculate and log score
          const defiScore = calculateDefiCreditScore(defiPositions)
          console.group("DeFi Score Breakdown")
          console.log("Number of Unique Protocols:", defiScore.calculations.uniqueProtocols)
          console.log("Protocol Diversity Score:", defiScore.protocolDiversityScore, "/ 40")
          console.log("Number of Unique Activities:", defiScore.calculations.uniqueActivities)
          console.log("Activity Types Score:", defiScore.activityTypesScore, "/ 40")
          console.log("Total Value USD:", new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(defiScore.calculations.totalValueUSD))
          console.log("Total Value Score:", defiScore.totalValueScore, "/ 20")
          console.log("Final DeFi Score:", defiScore.totalScore)
          console.log("Risk Grade:", defiScore.riskGrade)
          console.groupEnd()

          participationScore = defiScore.totalScore
        } else {
          console.log("No DeFi positions found")
          participationScore = 0
        }
      } catch (error) {
        console.error("Error fetching DeFi positions:", error)
        participationScore = 0
      }
      console.groupEnd()

      // ERC20 Holdings Score
      console.group("ERC20 Holdings")
      try {
        const holdings = await getErc20Holdings(address)
        console.log("Raw ERC20 Holdings Response:", holdings)

        if (holdings && holdings.holdings.length > 0) {
          // Log each token's details
          console.group("Token Details")
          holdings.holdings.forEach((token, index) => {
            console.group(`Token ${index + 1}: ${token.symbol || 'Unknown Token'}`)
            console.log("Token Data:", token)  // Log the entire token object
            console.groupEnd()
          })
          console.groupEnd()

          const erc20Result = calculateErc20Score(holdings.holdings)
          console.group("ERC20 Score Calculation")
          console.log("Number of tokens:", holdings.holdings.length)
          console.log("Raw Holdings Data:", holdings.holdings)
          console.log("ERC20 Score:", erc20Result.score)
          console.log("Score Calculation Details:", erc20Result)
          console.groupEnd()

          erc20Score = erc20Result.score
        } else {
          console.log("No ERC20 holdings found")
          erc20Score = 0
        }
      } catch (error) {
        console.error("Error fetching ERC20 holdings:", error)
        erc20Score = 0
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

  const handleMintCreditScore = async () => {
    if (!finalScoreData || !isConnected || userAddress !== address) return
    
    setIsMinting(true)
    setMintingError(null)

    try {
      // Convert the final score to a uint256 by rounding to the nearest integer
      const scoreForContract = BigInt(Math.round(finalScoreData.score))
      
      // Debug logs
      console.log('Original Score:', finalScoreData.score)
      console.log('Score for contract (uint256):', scoreForContract.toString())
      
      await writeContractAsync({
        address: LENDING_PROTOCOL_ADDRESS,
        abi: LENDING_PROTOCOL_ABI,
        functionName: 'mintCreditScore',
        args: [scoreForContract],
      })

      // You might want to add a success message or redirect here
    } catch (error) {
      console.error('Error minting credit score:', error)
      setMintingError('Failed to mint credit score. Please try again.')
    } finally {
      setIsMinting(false)
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
            {/* Final Score */}
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-6">Final Credit Score</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Score Overview */}
                <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center items-center min-h-[300px]">
                  <div className="text-center">
                    <div className="text-8xl font-light text-gray-900 mb-6">{finalScoreData.score}</div>
                    <div className="text-xl text-gray-600 font-medium tracking-wide">Total Score</div>
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

            {/* Minting Section */}
            <section className="pt-8 border-t border-gray-200">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-2xl font-light text-gray-900 mb-4">Mint Your Credit Score NFT</h3>
                <p className="text-gray-600 mb-8">
                  Turn your credit score into a unique NFT that can be used as collateral in the lending protocol.
                </p>
                
                {!isConnected ? (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                    <p className="text-gray-700 mb-4">Connect your wallet to mint your credit score NFT</p>
                  </div>
                ) : userAddress !== address ? (
                  <div className="bg-red-50 p-6 rounded-lg border border-red-200 mb-6">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-red-700">Address Mismatch</span>
                    </div>
                    <p className="text-red-700">
                      The address you're checking ({address}) doesn't match your connected wallet ({userAddress}).
                      To mint an NFT, please either:
                    </p>
                    <ul className="text-red-700 mt-2 text-sm">
                      <li>• Connect the wallet matching the address you're checking, or</li>
                      <li>• Enter your connected wallet's address above</li>
                    </ul>
                  </div>
                ) : nftTokenId > 0 || creditTokenId > 0 ? (
                  <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 mb-6">
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-yellow-800">NFT Already Owned</span>
                    </div>
                    <p className="text-yellow-800">
                      You already own a credit score NFT{isNFTCollateralized ? " and it is currently being used as collateral" : ""}.
                      You cannot mint another one until you {isNFTCollateralized ? "complete your lending position" : "burn or transfer your existing NFT"}.
                    </p>
                  </div>
                ) : null}

                <button
                  onClick={handleMintCreditScore}
                  disabled={!canMint}
                  className="px-8 py-4 bg-black text-white font-medium rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isMinting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Minting...
                    </span>
                  ) : !isConnected ? (
                    "Connect Wallet to Mint"
                  ) : userAddress !== address ? (
                    "Address Mismatch - Cannot Mint"
                  ) : nftTokenId > 0 || creditTokenId > 0 ? (
                    isNFTCollateralized ? "NFT In Use as Collateral" : "Already Own NFT"
                  ) : (
                    "Mint Credit Score NFT"
                  )}
                </button>

                {mintingError && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    {mintingError}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
