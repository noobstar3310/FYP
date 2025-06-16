"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAccount, useReadContract, useWriteContract, useBalance, useWatchContractEvent } from "wagmi"
import { formatEther, parseEther } from "viem"

// Contract ABIs and addresses
const LENDING_PROTOCOL_ADDRESS = "0x56A2969Bd99D799E4768841A7AF1748b5e5F2f7c"
const LENDING_PROTOCOL_ABI = [
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "getUserPosition",
    "outputs": [
      {"internalType": "uint256","name": "borrowed","type": "uint256"},
      {"internalType": "uint256","name": "collateralAmount","type": "uint256"},
      {"internalType": "uint256","name": "creditScoreTokenId","type": "uint256"},
      {"internalType": "uint256","name": "lastInterestUpdate","type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "depositOrCollateralize",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pool",
    "outputs": [
      {"internalType": "uint256","name": "totalDeposited","type": "uint256"},
      {"internalType": "uint256","name": "totalBorrowed","type": "uint256"},
      {"internalType": "uint256","name": "interestRate","type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAvailableLiquidity",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256","name": "_weiAmount","type": "uint256"},
      {"internalType": "uint256","name": "_creditScoreTokenId","type": "uint256"}
    ],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const

interface AssetMetrics {
  balance: string
  apy: string
  totalSupplied: string
}

interface BorrowPosition {
  borrowed: string
  variableApy: string
  collateral: string
}

interface AssetToBorrow {
  availableToBorrow: string
  variableApy: string
  totalBorrowed: string
}

const EthereumLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.9978 3L11.8435 3.52344V15.0857L11.9978 15.2396L17.2434 12.1883L11.9978 3Z" fill="#000000"/>
    <path d="M11.9978 3L6.75195 12.1883L11.9978 15.2396V9.54473V3Z" fill="#000000"/>
    <path d="M11.9978 16.2418L11.9108 16.3478V20.5511L11.9978 20.8087L17.2478 13.1927L11.9978 16.2418Z" fill="#000000"/>
    <path d="M11.9978 20.8087V16.2418L6.75195 13.1927L11.9978 20.8087Z" fill="#000000"/>
    <path d="M11.9978 15.2396L17.2434 12.1883L11.9978 9.54473V15.2396Z" fill="#000000"/>
    <path d="M6.75195 12.1883L11.9978 15.2396V9.54473L6.75195 12.1883Z" fill="#000000"/>
  </svg>
)

export default function LendingMarketPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false)
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false)
  const [supplyAmount, setSupplyAmount] = useState("")
  const [borrowAmount, setBorrowAmount] = useState("")
  const [isSupplying, setIsSupplying] = useState(false)
  const [isBorrowing, setIsBorrowing] = useState(false)
  const { address: userAddress, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()

  // Get user's ETH balance
  const { data: userBalance } = useBalance({
    address: userAddress,
  })

  // Read user's position from the lending protocol
  const { data: userPosition, refetch: refetchUserPosition } = useReadContract({
    address: LENDING_PROTOCOL_ADDRESS,
    abi: LENDING_PROTOCOL_ABI,
    functionName: 'getUserPosition',
    args: userAddress ? [userAddress] : undefined,
  })

  // Read available liquidity from the contract
  const { data: availableLiquidity } = useReadContract({
    address: LENDING_PROTOCOL_ADDRESS,
    abi: LENDING_PROTOCOL_ABI,
    functionName: 'getAvailableLiquidity',
  })

  // Debug logging
  useEffect(() => {
    console.log('Connected wallet address:', userAddress)
    console.log('User position data:', userPosition)
    if (userPosition) {
      console.log('Raw contract response:', {
        borrowed: userPosition[0].toString(),
        collateralAmount: userPosition[1].toString(),
        creditScoreTokenId: userPosition[2].toString(),
        lastInterestUpdate: userPosition[3].toString()
      });
      
      const bigIntValue = BigInt(userPosition[1]);
      console.log('Collateral as BigInt:', bigIntValue.toString());
      
      const ethValue = formatEther(bigIntValue);
      console.log('Collateral in ETH:', ethValue);
      
      const formattedValue = Number(ethValue).toFixed(2);
      console.log('Formatted collateral:', formattedValue, 'ETH');
    }
  }, [userAddress, userPosition])

  // Read pool data to get total deposited amount
  const { data: poolData, refetch: refetchPoolData } = useReadContract({
    address: LENDING_PROTOCOL_ADDRESS,
    abi: LENDING_PROTOCOL_ABI,
    functionName: 'pool',
  })

  // Watch for Deposited events
  useWatchContractEvent({
    address: LENDING_PROTOCOL_ADDRESS,
    abi: LENDING_PROTOCOL_ABI,
    eventName: 'Deposited',
    onLogs() {
      // Refetch both user position and pool data when a deposit event occurs
      refetchUserPosition()
      refetchPoolData()
    },
  })

  // Format user's balance for display
  const formattedBalance = userBalance ? 
    `${Number(formatEther(userBalance.value)).toFixed(2)} ETH` : 
    "0.00 ETH"

  // Format user's supplied amount (collateralAmount) for display
  const formattedCollateral = userPosition ? 
    `${Number(formatEther(BigInt(userPosition[1]))).toFixed(4)} ETH` : 
    "0.0000 ETH"

  // Format total deposited amount for available to borrow display
  const formattedTotalDeposited = poolData ? 
    `${Number(formatEther(poolData[0])).toFixed(2)} ETH` : 
    "0.00 ETH"

  // Format interest rate for display (converts basis points to percentage)
  const formattedInterestRate = poolData ?
    `${(Number(poolData[2]) / 100).toFixed(2)}%` :
    "0.00%"

  // Format available liquidity for display
  const formattedAvailableLiquidity = availableLiquidity ? 
    `${Number(formatEther(BigInt(availableLiquidity))).toFixed(4)} ETH` : 
    "0.0000 ETH"

  // Debug logging for available liquidity
  useEffect(() => {
    if (availableLiquidity) {
      console.log('Raw available liquidity:', availableLiquidity.toString());
      console.log('Available liquidity in ETH:', formattedAvailableLiquidity);
    }
  }, [availableLiquidity, formattedAvailableLiquidity])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSupply = async () => {
    if (!supplyAmount || !userAddress) return

    try {
      setIsSupplying(true)
      
      // Convert ETH amount to Wei for the contract
      const supplyAmountWei = parseEther(supplyAmount)

      await writeContractAsync({
        address: LENDING_PROTOCOL_ADDRESS,
        abi: LENDING_PROTOCOL_ABI,
        functionName: 'depositOrCollateralize',
        value: supplyAmountWei,
      })

      // Refetch user position after successful supply
      await refetchUserPosition()
      
      setIsSupplyModalOpen(false)
      setSupplyAmount("")
    } catch (error) {
      console.error('Error supplying ETH:', error)
    } finally {
      setIsSupplying(false)
    }
  }

  const handleMaxClick = () => {
    if (userBalance) {
      // Leave some ETH for gas fees (0.01 ETH)
      const maxAmount = Number(formatEther(userBalance.value)) - 0.01
      setSupplyAmount(maxAmount > 0 ? maxAmount.toString() : "0")
    }
  }

  const handleBorrow = async () => {
    if (!borrowAmount || !userAddress || !userPosition) return

    try {
      setIsBorrowing(true)
      
      // Convert ETH amount to Wei for the contract
      const borrowAmountWei = parseEther(borrowAmount)

      await writeContractAsync({
        address: LENDING_PROTOCOL_ADDRESS,
        abi: LENDING_PROTOCOL_ABI,
        functionName: 'borrow',
        args: [borrowAmountWei, userPosition[2]], // borrowAmount and creditScoreTokenId
      })

      // Refetch user position after successful borrow
      await refetchUserPosition()
      
      setIsBorrowModalOpen(false)
      setBorrowAmount("")
    } catch (error) {
      console.error('Error borrowing ETH:', error)
    } finally {
      setIsBorrowing(false)
    }
  }

  const handleMaxBorrowClick = () => {
    if (availableLiquidity) {
      const maxAmount = Number(formatEther(BigInt(availableLiquidity)))
      setBorrowAmount(maxAmount.toString())
    }
  }

  const ethMetrics: AssetMetrics = {
    balance: formattedBalance,
    apy: formattedInterestRate,
    totalSupplied: formattedCollateral
  }

  const ethBorrowPosition: BorrowPosition = {
    borrowed: "2.5 ETH",
    variableApy: "3.25%",
    collateral: "5 ETH"
  }

  const ethToBorrow: AssetToBorrow = {
    availableToBorrow: formattedAvailableLiquidity,
    variableApy: formattedInterestRate,
    totalBorrowed: poolData ? `${Number(formatEther(poolData[1])).toFixed(4)} ETH` : "0.0000 ETH"
  }

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

        .stagger-1 { transition-delay: 0.1s; }
        .stagger-2 { transition-delay: 0.2s; }
        .stagger-3 { transition-delay: 0.3s; }

        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hover-lift:hover {
          transform: translateY(-2px);
        }

        .number-animate {
          animation: number-pop 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes number-pop {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className={`mb-24 fade-in ${isVisible ? "visible" : ""}`}>
          <h1 className="text-5xl font-light text-black mb-6 tracking-tight">Market Position</h1>
          <p className="text-lg text-gray-600 font-light max-w-2xl">
            Overview of your ETH supply position and borrowing activity
          </p>
        </div>

        {/* ETH Supply Metrics */}
        <div className={`mb-24 fade-in ${isVisible ? "visible" : ""} stagger-1`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* Balance */}
            <div className="space-y-4">
              <div className="text-sm text-gray-600 uppercase tracking-widest font-medium">Your Balance</div>
              <div className="text-6xl font-light text-black tracking-tight number-animate">{formattedBalance}</div>
              <div className="w-16 h-px bg-black"></div>
            </div>

            {/* APY */}
            <div className="space-y-4">
              <div className="text-sm text-gray-600 uppercase tracking-widest font-medium">Supply APY</div>
              <div className="text-6xl font-light text-black tracking-tight number-animate">{ethMetrics.apy}</div>
              <div className="w-16 h-px bg-black"></div>
            </div>

            {/* Total Supplied */}
            <div className="space-y-4">
              <div className="text-sm text-gray-600 uppercase tracking-widest font-medium">Total Supplied</div>
              <div className="text-6xl font-light text-black tracking-tight number-animate">{formattedCollateral}</div>
              <div className="w-16 h-px bg-black"></div>
              <button 
                onClick={() => setIsSupplyModalOpen(true)}
                className="mt-4 px-6 py-2 bg-black text-white font-medium uppercase tracking-wide text-sm hover:bg-gray-800 transition-colors"
              >
                Supply ETH
              </button>
            </div>
          </div>
        </div>

        {/* Supply Modal */}
        {isSupplyModalOpen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-[480px] rounded-xl shadow-xl">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-medium text-black">Supply ETH</h3>
                <button 
                  onClick={() => {
                    setIsSupplyModalOpen(false)
                    setSupplyAmount("")
                  }}
                  className="text-black hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-black font-medium">Amount</label>
                    <div className="text-sm text-black">
                      Balance: {formattedBalance}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={supplyAmount}
                      onChange={(e) => setSupplyAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black bg-gray-50 text-black placeholder-gray-500"
                      placeholder="0.00"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                      <button 
                        onClick={handleMaxClick}
                        className="text-sm font-medium text-black hover:opacity-70 transition-opacity"
                      >
                        MAX
                      </button>
                      <span className="text-black">|</span>
                      <span className="font-medium text-black">ETH</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Overview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm text-black font-medium mb-3">Transaction overview</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Supply APY</span>
                      <span className="font-medium text-black">{ethMetrics.apy}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Collateralization</span>
                      <span className="text-green-600 font-medium">Enabled</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleSupply}
                  disabled={!supplyAmount || isSupplying || !isConnected}
                  className="w-full py-4 bg-gray-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors rounded-lg"
                >
                  {isSupplying ? 'Supplying...' : 'Supply ETH'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Borrow Modal */}
        {isBorrowModalOpen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-[480px] rounded-xl shadow-xl">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-medium text-black">Borrow ETH</h3>
                <button 
                  onClick={() => {
                    setIsBorrowModalOpen(false)
                    setBorrowAmount("")
                  }}
                  className="text-black hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-black font-medium">Amount</label>
                    <div className="text-sm text-black">
                      Available: {formattedAvailableLiquidity}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black bg-gray-50 text-black placeholder-gray-500"
                      placeholder="0.0000"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                      <button 
                        onClick={handleMaxBorrowClick}
                        className="text-sm font-medium text-black hover:opacity-70 transition-opacity"
                      >
                        MAX
                      </button>
                      <span className="text-black">|</span>
                      <span className="font-medium text-black">ETH</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Overview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm text-black font-medium mb-3">Transaction overview</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Variable APY</span>
                      <span className="font-medium text-black">{formattedInterestRate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Credit Score Token ID</span>
                      <span className="font-medium text-black">
                        {userPosition ? Number(userPosition[2]).toString() : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleBorrow}
                  disabled={!borrowAmount || isBorrowing || !isConnected || !userPosition?.[2]}
                  className="w-full py-4 bg-gray-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors rounded-lg"
                >
                  {!userPosition?.[2] ? 'Credit Score NFT Required' : 
                   isBorrowing ? 'Borrowing...' : 'Borrow ETH'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Positions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Borrow Position */}
          <div className={`fade-in ${isVisible ? "visible" : ""} stagger-2`}>
            <div className="mb-8">
              <h2 className="text-2xl font-light text-black uppercase tracking-wide">Your ETH Borrow Position</h2>
              <div className="w-24 h-px bg-black mt-4"></div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-4 gap-8 items-center py-6 border-b border-gray-200 hover-lift">
                <div>
                  <div className="flex items-center gap-2">
                    <EthereumLogo />
                    <div className="text-lg font-medium text-black uppercase tracking-wide">ETH</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">Borrowed</div>
                  <div className="text-lg font-light text-black font-mono">{ethBorrowPosition.borrowed}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">APY</div>
                  <div className="text-lg font-light text-black">{ethBorrowPosition.variableApy}</div>
                  <div className="text-xs text-gray-500 mt-1">Collateral: {ethBorrowPosition.collateral}</div>
                </div>

                <div className="text-right">
                  <button className="px-6 py-2 border border-gray-400 text-gray-600 font-medium uppercase tracking-wide text-sm hover:bg-gray-600 hover:text-white transition-colors">
                    Repay
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Asset to Borrow */}
          <div className={`fade-in ${isVisible ? "visible" : ""} stagger-2`}>
            <div className="mb-8">
              <h2 className="text-2xl font-light text-black uppercase tracking-wide">ETH Available to Borrow</h2>
              <div className="w-24 h-px bg-black mt-4"></div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-4 gap-8 items-center py-6 border-b border-gray-200 hover-lift">
                <div>
                  <div className="flex items-center gap-2">
                    <EthereumLogo />
                    <div className="text-lg font-medium text-black uppercase tracking-wide">ETH</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">Available</div>
                  <div className="text-lg font-light text-black font-mono">{formattedAvailableLiquidity}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">Variable APY</div>
                  <div className="text-lg font-light text-black">{ethToBorrow.variableApy}</div>
                </div>

                <div className="text-right">
                  <button 
                    onClick={() => setIsBorrowModalOpen(true)}
                    className="px-6 py-2 border border-black text-black font-medium uppercase tracking-wide text-sm hover:bg-black hover:text-white transition-colors"
                  >
                    Borrow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className={`mt-24 pt-16 border-t border-gray-200 fade-in ${isVisible ? "visible" : ""} stagger-3`}>
          <div className="text-center">
            <h3 className="text-3xl font-light text-black mb-8 tracking-tight">Manage Your ETH Position</h3>
            <div className="flex justify-center space-x-8">
              <button className="px-12 py-4 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors">
                Supply ETH
              </button>
              <button className="px-12 py-4 border border-black text-black font-medium uppercase tracking-wide hover:bg-black hover:text-white transition-colors">
                Borrow ETH
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className={`mt-24 pt-16 border-t border-gray-200 fade-in ${isVisible ? "visible" : ""} stagger-3`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="text-center">
              <div className="text-3xl font-light text-black mb-2">2.5 ETH</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Total Borrowed</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-light text-black mb-2">156.45 ETH</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Available to Borrow</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-light text-black mb-2">1.2M ETH</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Total Value Locked</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-light text-black mb-2">Active</div>
              <div className="text-sm text-gray-600 uppercase tracking-wide">Market Status</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
