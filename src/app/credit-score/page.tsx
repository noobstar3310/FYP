// "use client"

// import { useState, useEffect } from "react"
// import { useAaveUserData, type UserAccountData } from "../utils/aave-positions/read-aave"
// import { calculateCreditScore } from "../utils/aave-positions/calculate-credit-score"
// import { useWalletAge } from "../utils/get-wallet-age"
// import { isAddress } from "viem"

// export default function CreditScore() {
//   const [address, setAddress] = useState("")
//   const [walletAge, setWalletAge] = useState<string | null>(null)
//   const { data, error, isPending } = useAaveUserData(isAddress(address) ? (address as `0x${string}`) : undefined)
//   const { getWalletAge } = useWalletAge(isAddress(address) ? (address as `0x${string}`) : undefined)

//   useEffect(() => {
//     const fetchWalletAge = async () => {
//       if (isAddress(address)) {
//         const age = await getWalletAge()
//         setWalletAge(age)
//       } else {
//         setWalletAge(null)
//       }
//     }

//     fetchWalletAge()
//   }, [address, getWalletAge])

//   const formatUSD = (value: bigint | undefined) => {
//     if (!value) return "$0.00"
//     return `$${(Number(value) / 1e8).toFixed(2)}`
//   }

//   const formatPercentage = (value: bigint | undefined) => {
//     if (!value) return "0.00"
//     return (Number(value) / 100).toFixed(2)
//   }

//   const formatNumber = (value: number) => {
//     return value.toFixed(2)
//   }

//   const formatHealthFactor = (value: number) => {
//     return value.toFixed(4)
//   }

//   const accountData = data as UserAccountData | undefined
//   const creditScore = accountData ? calculateCreditScore(accountData) : undefined

//   // Calculate the rotation for the gauge needle (from -90 to 90 degrees)
//   const calculateRotation = (score: number) => {
//     return (score / 100) * 180 - 90
//   }

//   const getRiskColor = (grade: string) => {
//     switch (grade) {
//       case "Excellent":
//         return "text-black"
//       case "Good":
//         return "text-black"
//       case "Fair":
//         return "text-black"
//       case "Poor":
//         return "text-black"
//       case "Risky":
//         return "text-red-600"
//       default:
//         return "text-black"
//     }
//   }

//   return (
//     <div className="min-h-screen bg-white">

//       <main className="max-w-7xl mx-auto px-6 py-16">
//         {/* Title Section */}
//         <div className="mb-16">
//           <h2 className="text-4xl font-light text-black mb-4 tracking-tight">Credit Analysis</h2>
//           <p className="text-gray-600 text-lg font-light max-w-2xl">
//             Comprehensive on-chain credit scoring based on Aave position data
//           </p>
//         </div>

//         {/* Address Input */}
//         <div className="mb-16">
//           <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Wallet Address</label>
//           <input
//             type="text"
//             value={address}
//             onChange={(e) => setAddress(e.target.value)}
//             placeholder="0x..."
//             className="w-full max-w-2xl px-0 py-4 text-xl text-black border-0 border-b border-gray-300 focus:ring-0 focus:border-black transition-colors bg-transparent font-mono tracking-wide"
//           />
//         </div>

//         {error && (
//           <div className="mb-16 p-6 border border-red-200 bg-red-50">
//             <p className="text-red-800 font-medium">Error: Unable to fetch data. Please verify the address.</p>
//           </div>
//         )}

//         {isPending && (
//           <div className="flex items-center justify-center py-16">
//             <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
//           </div>
//         )}

//         {creditScore && (
//           <>
//             {/* Credit Score Display */}
//             <div className="mb-24">
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
//                 {/* Score Visualization */}
//                 <div className="text-center lg:text-left">
//                   <div className="mb-8">
//                     <div className="text-8xl font-light text-black mb-2 tracking-tight">
//                       {formatNumber(creditScore.totalScore)}
//                     </div>
//                     <div className="text-2xl text-gray-500 font-light">/ 100</div>
//                   </div>

//                   <div
//                     className={`text-xl font-medium mb-6 uppercase tracking-widest ${getRiskColor(creditScore.riskGrade)}`}
//                   >
//                     {creditScore.riskGrade}
//                   </div>

//                   <div className="space-y-2 text-sm text-gray-600 font-mono">
//                     <div>Last Updated: {new Date().toLocaleDateString()}</div>
//                     <div className="break-all">Address: {address}</div>
//                     {walletAge && (
//                       <div>Wallet Age: {walletAge}</div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Minimal Gauge */}
//                 <div className="flex justify-center lg:justify-end">
//                   <div className="relative">
//                     {/* Gauge Background */}
//                     <div className="w-64 h-32 relative">
//                       <div className="absolute w-full h-full border-4 border-gray-200 rounded-t-full"></div>

//                       {/* Score Indicator */}
//                       <div
//                         className="absolute bottom-0 left-1/2 w-1 h-28 bg-black origin-bottom transition-transform duration-1000 ease-out"
//                         style={{
//                           transform: `translateX(-50%) rotate(${calculateRotation(creditScore.totalScore)}deg)`,
//                         }}
//                       />

//                       {/* Center Dot */}
//                       <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-black rounded-full transform -translate-x-1/2"></div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* SBT Minting */}
//               <div className="mt-12 pt-8 border-t border-gray-200">
//                 <button className="px-8 py-3 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors">
//                   Mint as SBT
//                 </button>
//                 <p className="text-sm text-gray-600 mt-3 font-light">Mint your On Chain Credit Score token as a Soul-Bound Token</p>
//               </div>
//             </div>

//             {/* Score Components Grid */}
//             <div className="mb-24">
//               <h3 className="text-2xl font-light text-black mb-12 uppercase tracking-wide">Score Components</h3>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//                 <div className="border-l-4 border-black pl-6">
//                   <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Health Factor</div>
//                   <div className="text-4xl font-light text-black mb-1">{creditScore.healthFactorScore}</div>
//                   <div className="text-sm text-gray-500 font-mono">40% Weight</div>
//                   <div className="text-xs text-gray-400 mt-2">
//                     HF: {formatNumber(creditScore.calculations.healthFactor)}
//                   </div>
//                 </div>

//                 <div className="border-l-4 border-gray-300 pl-6">
//                   <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">LTV Margin</div>
//                   <div className="text-4xl font-light text-black mb-1">{creditScore.ltvMarginScore}</div>
//                   <div className="text-sm text-gray-500 font-mono">30% Weight</div>
//                   <div className="text-xs text-gray-400 mt-2">
//                     Margin: {formatNumber(creditScore.calculations.ltvMargin)}%
//                   </div>
//                 </div>

//                 <div className="border-l-4 border-gray-300 pl-6">
//                   <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Collateral</div>
//                   <div className="text-4xl font-light text-black mb-1">{creditScore.collateralScore}</div>
//                   <div className="text-sm text-gray-500 font-mono">20% Weight</div>
//                   <div className="text-xs text-gray-400 mt-2">
//                     ${formatNumber(creditScore.calculations.collateralUSD)}
//                   </div>
//                 </div>

//                 <div className="border-l-4 border-gray-300 pl-6">
//                   <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Borrow Discipline</div>
//                   <div className="text-4xl font-light text-black mb-1">{creditScore.borrowDisciplineScore}</div>
//                   <div className="text-sm text-gray-500 font-mono">10% Weight</div>
//                   <div className="text-xs text-gray-400 mt-2">
//                     Ratio: {formatNumber(creditScore.calculations.borrowRatio)}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Position Details */}
//             <div>
//               <h3 className="text-2xl font-light text-black mb-12 uppercase tracking-wide">Position Details</h3>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-12">
//                 <div className="space-y-4 overflow-hidden">
//                   <div className="text-sm text-gray-600 uppercase tracking-wide">Health Factor</div>
//                   <div className="text-5xl font-light text-black font-mono truncate" title={formatHealthFactor(creditScore.calculations.healthFactor)}>
//                     {formatHealthFactor(creditScore.calculations.healthFactor)}
//                   </div>
//                   <div className="text-sm text-gray-500">Must stay above 1.0</div>
//                 </div>

//                 <div className="space-y-4">
//                   <div className="text-sm text-gray-600 uppercase tracking-wide">Total Collateral</div>
//                   <div className="text-5xl font-light text-black font-mono">
//                     {formatUSD(data?.[0])}
//                   </div>
//                   <div className="text-sm text-gray-500">Deposited assets</div>
//                 </div>

//                 <div className="space-y-4">
//                   <div className="text-sm text-gray-600 uppercase tracking-wide">Total Debt</div>
//                   <div className="text-5xl font-light text-black font-mono">{formatUSD(data?.[1])}</div>
//                   <div className="text-sm text-gray-500">Borrowed assets</div>
//                 </div>

//                 <div className="space-y-4">
//                   <div className="text-sm text-gray-600 uppercase tracking-wide">Available to Borrow</div>
//                   <div className="text-5xl font-light text-black font-mono">{formatUSD(data?.[2])}</div>
//                   <div className="text-sm text-gray-500">Maximum borrowing power</div>
//                 </div>

//                 <div className="space-y-4">
//                   <div className="text-sm text-gray-600 uppercase tracking-wide">Maximum LTV</div>
//                   <div className="text-5xl font-light text-black">{formatPercentage(data?.[4])}%</div>
//                   <div className="text-sm text-gray-500">Loan to value ratio</div>
//                 </div>

//                 <div className="space-y-4">
//                   <div className="text-sm text-gray-600 uppercase tracking-wide">Liquidation Threshold</div>
//                   <div className="text-5xl font-light text-black">{formatPercentage(data?.[3])}%</div>
//                   <div className="text-sm text-gray-500">Liquidation point</div>
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </main>
//     </div>
//   )
// }
"use client"

import { useState, useEffect } from "react"
import { useAaveUserData, type UserAccountData } from "../utils/aave-positions/read-aave"
import { calculateCreditScore } from "../utils/aave-positions/calculate-credit-score"
import { useWalletAge } from "../utils/get-wallet-age"
import { isAddress } from "viem"

export default function CreditScore() {
  const [address, setAddress] = useState("")
  const [walletAge, setWalletAge] = useState<string | null>(null)
  const { data, error, isPending } = useAaveUserData(isAddress(address) ? (address as `0x${string}`) : undefined)
  const { getWalletAge } = useWalletAge(isAddress(address) ? (address as `0x${string}`) : undefined)

  useEffect(() => {
    const fetchWalletAge = async () => {
      if (isAddress(address)) {
        const age = await getWalletAge()
        setWalletAge(age)
      } else {
        setWalletAge(null)
      }
    }

    fetchWalletAge()
  }, [address, getWalletAge])

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

  const accountData = data as UserAccountData | undefined
  const creditScore = accountData ? calculateCreditScore(accountData) : undefined

  // Calculate the rotation for the gauge needle (from -90 to 90 degrees)
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
          <h2 className="text-4xl font-light text-black mb-4 tracking-tight">Credit Analysis</h2>
          <p className="text-gray-600 text-lg font-light max-w-2xl">
            Comprehensive on-chain credit scoring based on Aave position data
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
            <p className="text-red-800 font-medium">Error: Unable to fetch data. Please verify the address.</p>
          </div>
        )}

        {isPending && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        )}

        {creditScore && (
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

              {/* SBT Minting */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <button className="px-8 py-3 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors">
                  Mint as SBT
                </button>
                <p className="text-sm text-gray-600 mt-3 font-light">Mint your On Chain Credit Score token as a Soul-Bound Token</p>
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
              </div>
            </div>

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
                    {formatUSD(data?.[0])}
                  </div>
                  <div className="text-sm text-gray-500">Deposited assets</div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Total Debt</div>
                  <div className="text-5xl font-light text-black font-mono">{formatUSD(data?.[1])}</div>
                  <div className="text-sm text-gray-500">Borrowed assets</div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Available to Borrow</div>
                  <div className="text-5xl font-light text-black font-mono">{formatUSD(data?.[2])}</div>
                  <div className="text-sm text-gray-500">Maximum borrowing power</div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Maximum LTV</div>
                  <div className="text-5xl font-light text-black">{formatPercentage(data?.[4])}%</div>
                  <div className="text-sm text-gray-500">Loan to value ratio</div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600 uppercase tracking-wide">Liquidation Threshold</div>
                  <div className="text-5xl font-light text-black">{formatPercentage(data?.[3])}%</div>
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