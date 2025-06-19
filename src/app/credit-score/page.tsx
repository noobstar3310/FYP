// "use client"

// import { useState } from "react"
// import { useAaveUserData, type UserAccountData } from "../utils/aave-positions/read-aave"
// import { calculateCreditScore } from "../utils/aave-positions/calculate-credit-score"
// import { isAddress } from "viem"
// import { getErc20Holdings } from "../utils/erc20-holdings/getErc20Holdings"
// import { calculateErc20Score } from "../utils/erc20-holdings/calculateErc20Score"
// import { ethers } from "ethers"
// import { getWalletAge } from "../utils/wallet-age-and-activity/getWalletAge"
// import { calculateWalletAgeScore } from "../utils/wallet-age-and-activity/calculateWalletAgeScore"
// import { getParticipationScore } from "../utils/participation/getParticipationScore"

// type FinalScore = {
//   score: number;
//   components: {
//     aaveScore: number | null;
//     participationScore: number | null;
//     erc20Score: number | null;
//     walletAgeScore: number | null;
//   };
//   weightedComponents: {
//     aaveWeighted: number;
//     participationWeighted: number;
//     erc20Weighted: number;
//     walletAgeWeighted: number;
//   };
// };

// const WEIGHTS = {
//   aave: 0.45,
//   participation: 0.25,
//   erc20: 0.15,
//   walletAge: 0.15
// };

// function calculateFinalScore(
//   aaveScore: number | null,
//   participationScore: number | null,
//   erc20Score: number | null,
//   walletAgeScore: number | null
// ): FinalScore {
//   // Initialize weighted components
//   const weightedComponents = {
//     aaveWeighted: 0,
//     participationWeighted: 0,
//     erc20Weighted: 0,
//     walletAgeWeighted: 0
//   };

//   // Calculate weighted scores for each component
//   if (aaveScore !== null) weightedComponents.aaveWeighted = aaveScore * WEIGHTS.aave;
//   if (participationScore !== null) weightedComponents.participationWeighted = participationScore * WEIGHTS.participation;
//   if (erc20Score !== null) weightedComponents.erc20Weighted = erc20Score * WEIGHTS.erc20;
//   if (walletAgeScore !== null) weightedComponents.walletAgeWeighted = walletAgeScore * WEIGHTS.walletAge;

//   // Calculate total score
//   const totalScore = Object.values(weightedComponents).reduce((a, b) => a + b, 0);

//   return {
//     score: Math.round(totalScore),
//     components: {
//       aaveScore,
//       participationScore,
//       erc20Score,
//       walletAgeScore
//     },
//     weightedComponents
//   };
// }

// export default function CreditScore() {
//   const [address, setAddress] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [scoreData, setScoreData] = useState<FinalScore | null>(null)
//   const { data: aaveData } = useAaveUserData(isAddress(address) ? (address as `0x${string}`) : undefined)

//   const formatUSD = (value: bigint | undefined) => {
//     if (!value) return "$0.00"
//     return `$${(Number(value) / 1e8).toFixed(2)}`
//   }

//   const handleCheck = async () => {
//     if (!isAddress(address)) {
//       console.log('Invalid address')
//       return
//     }

//     setIsLoading(true)
//     try {
//       // Initialize scores
//       let aaveScore: number | null = null;
//       let participationScore: number | null = null;
//       let erc20Score: number | null = null;
//       let walletAgeScore: number | null = null;

//       // Log Aave data and credit score
//       if (aaveData) {
//         const creditScore = calculateCreditScore(aaveData as unknown as UserAccountData)
//         aaveScore = creditScore.totalScore;
        
//         // Log Aave positions
//         console.group('Aave Positions')
//         console.log('Total Collateral:', formatUSD(aaveData[0]))
//         console.log('Total Debt:', formatUSD(aaveData[1]))
//         console.log('Available to Borrow:', formatUSD(aaveData[2]))
//         console.log('Liquidation Threshold:', (Number(aaveData[3]) / 100).toFixed(2) + '%')
//         console.log('Maximum LTV:', (Number(aaveData[4]) / 100).toFixed(2) + '%')
//         console.log('Health Factor:', (Number(aaveData[5]) / 1e18).toFixed(4))
//         console.groupEnd()

//         // Log credit score breakdown
//         console.group('Aave Credit Score')
//         console.log('Total Score:', creditScore.totalScore)
//         console.log('Risk Grade:', creditScore.riskGrade)
//         console.log('\nScore Components:')
//         console.log('- Health Factor Score:', creditScore.healthFactorScore, '(40% weight)')
//         console.log('- LTV Margin Score:', creditScore.ltvMarginScore, '(30% weight)')
//         console.log('- Collateral Score:', creditScore.collateralScore, '(20% weight)')
//         console.log('- Borrow Discipline Score:', creditScore.borrowDisciplineScore, '(10% weight)')
//         console.log('\nCalculations:')
//         console.log('- Health Factor:', creditScore.calculations.healthFactor.toFixed(4))
//         console.log('- LTV Margin:', creditScore.calculations.ltvMargin.toFixed(2) + '%')
//         console.log('- Collateral USD:', '$' + creditScore.calculations.collateralUSD.toFixed(2))
//         console.log('- Borrow Ratio:', creditScore.calculations.borrowRatio.toFixed(4))
//         console.groupEnd()
//       } else {
//         console.log('No Aave positions found')
//       }

//       // Fetch wallet age
//       const walletData = await getWalletAge(address)
//       console.group('Wallet Age Data')
//       if (walletData && walletData.active_chains.length > 0) {
//         const firstTransaction = walletData.active_chains[0].first_transaction.block_timestamp
//         walletAgeScore = calculateWalletAgeScore(firstTransaction)
//         console.log('Score:', walletAgeScore)
//         console.log('First Transaction:', new Date(firstTransaction).toLocaleDateString())
//         console.log('Chain:', walletData.active_chains[0].chain)
//       } else {
//         console.log('No wallet age data found')
//       }
//       console.groupEnd()

//       // Fetch participation data
//       console.group('Protocol Participation')
//       const participationData = await getParticipationScore(address)
//       if (participationData) {
//         participationScore = participationData.score;
//         console.log('Score:', participationData.score)
//         console.log('\nMetrics:')
//         console.log('- Total Transactions:', participationData.totalTransactions)
//         console.log('- Unique Protocols:', participationData.uniqueProtocols)
//         if (participationData.lastActivity) {
//           console.log('- Last Activity:', participationData.lastActivity.toLocaleDateString())
//           const daysSinceLastActivity = Math.round((new Date().getTime() - participationData.lastActivity.getTime()) / (1000 * 60 * 60 * 24))
//           console.log('- Days Since Last Activity:', daysSinceLastActivity)
//         }
//         console.log('\nScore Breakdown:')
//         console.log('- Transaction Volume: Up to 40 points')
//         console.log('- Protocol Diversity: Up to 40 points')
//         console.log('- Activity Recency: Up to 20 points')
//       } else {
//         console.log('No participation data found')
//       }
//       console.groupEnd()

//       // Fetch ERC20 data
//       console.group('ERC20 Holdings')
//       const holdings = await getErc20Holdings(address)
      
//       if (holdings && holdings.holdings.length > 0) {
//         const erc20Result = {
//           holdings: holdings.holdings.map(h => ({
//             symbol: h.symbol,
//             balance: ethers.formatUnits(h.balance, h.decimals),
//             decimals: h.decimals
//           })),
//           score: calculateErc20Score(holdings.holdings)
//         }
//         erc20Score = erc20Result.score.score;
//         console.log('Score:', erc20Result.score.score)
//         console.log('\nHoldings:')
//         erc20Result.holdings.forEach(h => {
//           console.log(`- ${h.symbol}: ${h.balance}`)
//         })
//         console.log('\nScore Breakdown:')
//         Object.entries(erc20Result.score.breakdown).forEach(([symbol, data]: [string, any]) => {
//           console.log(`- ${symbol}: Score ${data.score} (Balance: $${Number(data.balance).toFixed(2)})`)
//         })
//       } else {
//         console.log('No ERC20 holdings found')
//       }
//       console.groupEnd()

//       // Calculate and display final score
//       const finalScore = calculateFinalScore(aaveScore, participationScore, erc20Score, walletAgeScore);
//       setScoreData(finalScore);
      
//       console.group('Final Credit Score')
//       const totalWeightedScore = Object.values(finalScore.weightedComponents).reduce((a, b) => a + b, 0);
      
//       console.log('\nComponent Scores:')
//       console.log('- Aave Positions:', finalScore.components.aaveScore, `(${WEIGHTS.aave * 100}% weight)`)
//       console.log('- Protocol Participation:', finalScore.components.participationScore, `(${WEIGHTS.participation * 100}% weight)`)
//       console.log('- ERC20 Holdings:', finalScore.components.erc20Score, `(${WEIGHTS.erc20 * 100}% weight)`)
//       console.log('- Wallet Age:', finalScore.components.walletAgeScore, `(${WEIGHTS.walletAge * 100}% weight)`)
      
//       console.log('\nWeighted Scores:')
//       console.log('- Aave Positions:', finalScore.weightedComponents.aaveWeighted.toFixed(2))
//       console.log('- Protocol Participation:', finalScore.weightedComponents.participationWeighted.toFixed(2))
//       console.log('- ERC20 Holdings:', finalScore.weightedComponents.erc20Weighted.toFixed(2))
//       console.log('- Wallet Age:', finalScore.weightedComponents.walletAgeWeighted.toFixed(2))
      
//       console.log('\nFinal Score Calculation:')
//       console.log(`${finalScore.weightedComponents.aaveWeighted.toFixed(2)} + ${finalScore.weightedComponents.participationWeighted.toFixed(2)} + ${finalScore.weightedComponents.erc20Weighted.toFixed(2)} + ${finalScore.weightedComponents.walletAgeWeighted.toFixed(2)} = ${totalWeightedScore.toFixed(2)}`)
//       console.log('\nFinal Credit Score:', Math.round(totalWeightedScore))
//       console.groupEnd()

//     } catch (error) {
//       console.error('Error fetching data:', error)
//       setScoreData(null)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const getRiskLevel = (score: number) => {
//     if (score >= 80) return { text: 'Excellent', color: 'text-green-600' }
//     if (score >= 65) return { text: 'Good', color: 'text-blue-600' }
//     if (score >= 50) return { text: 'Moderate', color: 'text-yellow-600' }
//     return { text: 'Risky', color: 'text-red-600' }
//   }

//   return (
//     <div className="min-h-screen bg-white">
//       <main className="max-w-7xl mx-auto px-6 py-16">
//         {/* Title Section */}
//         <div className="mb-16">
//           <h2 className="text-4xl font-light text-black mb-4 tracking-tight">Comprehensive Credit Analysis</h2>
//           <p className="text-gray-600 text-lg font-light max-w-2xl">
//             On-chain credit scoring based on Aave positions (45%), protocol participation (25%), stablecoin holdings (15%), and wallet age (15%)
//           </p>
//         </div>

//         {/* Address Input and Check Button */}
//         <div className="mb-16">
//           <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Wallet Address</label>
//           <div className="flex gap-4 items-end">
//             <input
//               type="text"
//               value={address}
//               onChange={(e) => setAddress(e.target.value)}
//               placeholder="0x..."
//               className="flex-1 max-w-2xl px-0 py-4 text-xl text-black border-0 border-b border-gray-300 focus:ring-0 focus:border-black transition-colors bg-transparent font-mono tracking-wide"
//             />
//             <button
//               onClick={handleCheck}
//               disabled={!isAddress(address) || isLoading}
//               className={`px-8 py-4 text-lg font-medium rounded-lg transition-colors ${
//                 isLoading || !isAddress(address)
//                   ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                   : 'bg-black text-white hover:bg-gray-800'
//               }`}
//             >
//               {isLoading ? 'Checking...' : 'Check'}
//             </button>
//           </div>
//         </div>

//         {/* Score Display */}
//         {scoreData && (
//           <div className="space-y-16">
//             {/* Final Score */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
//               <div>
//                 <div className="mb-8">
//                   <div className="text-8xl font-light text-black mb-2">
//                     {Math.round(Object.values(scoreData.weightedComponents).reduce((a, b) => a + b, 0))}
//                   </div>
//                   <div className="text-2xl text-gray-500 font-light">/ 100</div>
//                 </div>
//                 <div className={`text-xl font-medium mb-6 uppercase tracking-widest ${getRiskLevel(scoreData.score).color}`}>
//                   {getRiskLevel(scoreData.score).text}
//                 </div>
//                 <div className="text-sm text-gray-600">
//                   Last Updated: {new Date().toLocaleDateString()}
//                 </div>
//               </div>

//               {/* Score Components */}
//               <div className="space-y-6">
//                 <div className="text-xl font-light text-black mb-4">Score Components</div>
//                 {[
//                   { label: 'Aave Positions', score: scoreData.components.aaveScore, weight: WEIGHTS.aave, weighted: scoreData.weightedComponents.aaveWeighted },
//                   { label: 'Protocol Participation', score: scoreData.components.participationScore, weight: WEIGHTS.participation, weighted: scoreData.weightedComponents.participationWeighted },
//                   { label: 'ERC20 Holdings', score: scoreData.components.erc20Score, weight: WEIGHTS.erc20, weighted: scoreData.weightedComponents.erc20Weighted },
//                   { label: 'Wallet Age', score: scoreData.components.walletAgeScore, weight: WEIGHTS.walletAge, weighted: scoreData.weightedComponents.walletAgeWeighted }
//                 ].map((component, index) => (
//                   <div key={component.label} className="relative">
//                     <div className="flex justify-between items-baseline mb-2">
//                       <div className="text-sm text-gray-600">{component.label}</div>
//                       <div className="text-sm font-medium">
//                         {component.weighted.toFixed(2)} <span className="text-gray-500">/ {(component.weight * 100).toFixed(0)}</span>
//                       </div>
//                     </div>
//                     <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//                       <div 
//                         className="h-full bg-black rounded-full transition-all duration-500"
//                         style={{ width: `${(component.weighted / component.weight) * 100}%` }}
//                       />
//                     </div>
//                     <div className="text-xs text-gray-500 mt-1">
//                       Base Score: {component.score || 0}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Calculation Breakdown */}
//             <div className="border-t pt-16">
//               <h3 className="text-2xl font-light text-black mb-8">Final Score Calculation</h3>
//               <div className="font-mono text-lg">
//                 {Object.entries(scoreData.weightedComponents).map(([key, value], index, arr) => (
//                   <span key={key}>
//                     {value.toFixed(2)}
//                     {index < arr.length - 1 ? ' + ' : ' = '}
//                   </span>
//                 ))}
//                 <span className="font-medium">
//                   {Math.round(Object.values(scoreData.weightedComponents).reduce((a, b) => a + b, 0))}
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   )
// }
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

export default function CreditScore() {
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [scoreData, setScoreData] = useState<FinalScore | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { data: aaveData } = useAaveUserData(isAddress(address) ? (address as `0x${string}`) : undefined)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const formatUSD = (value: bigint | undefined) => {
    if (!value) return "$0.00"
    return `$${(Number(value) / 1e8).toFixed(2)}`
  }

  const handleCheck = async () => {
    if (!isAddress(address)) return

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
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
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
          background: #e5e7eb;
          transform-origin: bottom center;
        }

        .meter-tick.major {
          height: 20px;
          width: 3px;
          background: #9ca3af;
        }

        .meter-label {
          position: absolute;
          font-size: 10px;
          color: #6b7280;
          transform: translateX(-50%);
        }
      `}</style>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className={`mb-24 fade-in ${isVisible ? "visible" : ""}`}>
          <h1 className="text-5xl font-light text-black mb-6 tracking-tight">Credit Analysis</h1>
          <p className="text-lg text-gray-600 font-light max-w-3xl leading-relaxed">
            Comprehensive on-chain credit scoring based on DeFi positions, protocol participation, token holdings, and
            wallet maturity
          </p>
        </div>

        {/* Input Section */}
        <div className={`mb-24 fade-in ${isVisible ? "visible" : ""} stagger-1`}>
          <div className="max-w-4xl">
            <label className="block text-sm font-medium text-gray-700 mb-6 uppercase tracking-widest">
              Wallet Address
            </label>
            <div className="flex items-end space-x-8">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-0 py-6 text-xl border-0 border-b-2 border-gray-200 focus:border-black focus:outline-none bg-transparent font-mono tracking-wide transition-colors"
              />
              <button
                onClick={handleCheck}
                disabled={!isAddress(address) || isLoading}
                className={`px-12 py-6 font-medium uppercase tracking-wide transition-all ${
                  isLoading || !isAddress(address)
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800 hover:scale-105"
                }`}
              >
                {isLoading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </div>
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
                    <div className="text-9xl font-light text-black mb-4 tracking-tight score-animate">{finalScore}</div>
                    <div className="text-3xl text-gray-500 font-light">/ 100</div>
                  </div>

                  <div
                    className={`text-2xl font-medium mb-8 uppercase tracking-widest ${getRiskLevel(finalScore).color}`}
                  >
                    {getRiskLevel(finalScore).text}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 font-mono">
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
                      {[0, 20, 40, 60, 80, 100].map((value, index) => {
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
                                  bottom: "-25px",
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
              <h2 className="text-3xl font-light text-black mb-12 uppercase tracking-wide">Score Components</h2>

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
                ].map((component, index) => (
                  <div
                    key={component.label}
                    className="space-y-6 p-8 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-medium text-black uppercase tracking-wide mb-2">
                          {component.label}
                        </h3>
                        <p className="text-sm text-gray-600 font-light">{component.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-light text-black">{component.weighted.toFixed(1)}</div>
                        <div className="text-sm text-gray-500">/ {(component.weight * 100).toFixed(0)}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-mono">{((component.weighted / component.weight) * 100).toFixed(1)}%</span>
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
                      <div className="text-xs text-gray-500 font-mono">
                        Base Score: {component.score || 0} × {(component.weight * 100).toFixed(0)}% weight
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Calculation */}
            <div className={`pt-16 border-t border-gray-200 fade-in ${isVisible ? "visible" : ""} stagger-3`}>
              <h3 className="text-2xl font-light text-black mb-8 uppercase tracking-wide">Final Calculation</h3>
              <div className="bg-gray-50 p-8 font-mono text-lg">
                <div className="space-y-2">
                  {Object.entries(scoreData.weightedComponents).map(([key, value], index, arr) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">
                        {key
                          .replace("Weighted", "")
                          .replace(/([A-Z])/g, " $1")
                          .trim()}
                        :
                      </span>
                      <span>{value.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 pt-2 mt-4 flex justify-between font-medium text-xl">
                    <span>Total Score:</span>
                    <span>{finalScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div
              className={`text-center pt-16 border-t border-gray-200 fade-in ${isVisible ? "visible" : ""} stagger-3`}
            >
              <h3 className="text-3xl font-light text-black mb-8 tracking-tight">Ready to mint your score?</h3>
              <button className="px-12 py-4 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-all hover:scale-105">
                Mint as SBT
              </button>
              <p className="text-sm text-gray-600 mt-4 font-light">
                Mint your credit score as a Soul-Bound Token for portable reputation
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
