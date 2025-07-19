"use client"

import { useEffect, useState } from "react"
import { useAccount, useWriteContract, useReadContract, useBalance, useWatchContractEvent } from "wagmi"
import { formatEther, parseEther } from "viem"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { LENDING_PROTOCOL_ADDRESS, NFT_CONTRACT_ADDRESS, LENDING_PROTOCOL_ABI, NFT_CONTRACT_ABI } from "../constants/contracts"

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

export default function LendingMarket() {
  const [isVisible, setIsVisible] = useState(false)
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false)
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false)
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false)
  const [supplyAmount, setSupplyAmount] = useState("")
  const [borrowAmount, setBorrowAmount] = useState("")
  const [isSupplying, setIsSupplying] = useState(false)
  const [isBorrowing, setIsBorrowing] = useState(false)
  const [isRepaying, setIsRepaying] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isCollateralizing, setIsCollateralizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { address: userAddress, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()

  // Get user's ETH balance
  const { data: userBalance } = useBalance({
    address: userAddress,
  })

  // Check if user has NFT
  const { data: nftBalance } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_CONTRACT_ABI,
    functionName: 'getHolderTokenId',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  })

  // Check user position in lending protocol
  const { data: userPosition } = useReadContract({
    address: LENDING_PROTOCOL_ADDRESS,
    abi: LENDING_PROTOCOL_ABI,
    functionName: 'getUserPosition',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  })

  // Get credit score token ID from lending protocol
  const creditScoreTokenId = userPosition ? Number(userPosition[2]) : 0
  
  // Get NFT credit data if user has a position
  const { data: creditData } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_CONTRACT_ABI,
    functionName: 'getCreditData',
    args: creditScoreTokenId ? [BigInt(creditScoreTokenId)] : undefined,
  })

  // Get credit score details
  const { data: creditScoreDetails } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_CONTRACT_ABI,
    functionName: 'creditScores',
    args: creditScoreTokenId ? [BigInt(creditScoreTokenId)] : undefined,
  })

  // Check NFT ownership - if getHolderTokenId returns non-zero OR creditScoreTokenId is non-zero
  const hasNFT = (nftBalance ? Number(nftBalance) !== 0 : false) || creditScoreTokenId > 0
  
  // Check if NFT is collateralized from creditScores data
  const isNFTCollateralized = creditScoreDetails ? Boolean(creditScoreDetails[2]) : false

  // Get credit score value
  const creditScore = creditScoreDetails ? Number(creditScoreDetails[0]) : null

  useEffect(() => {
    if (creditScoreDetails) {
      console.log('Credit Score Details:', {
        score: Number(creditScoreDetails[0]),
        lastUpdated: Number(creditScoreDetails[1]),
        isCollateralized: Boolean(creditScoreDetails[2])
      })
    }
  }, [creditScoreDetails])

  // Read available liquidity from the contract
  const { data: availableLiquidity } = useReadContract({
    address: LENDING_PROTOCOL_ADDRESS,
    abi: LENDING_PROTOCOL_ABI,
    functionName: 'getAvailableLiquidity',
  })

  // Read max borrowable amount
  const { data: maxBorrowableAmount } = useReadContract({
    address: LENDING_PROTOCOL_ADDRESS,
    abi: LENDING_PROTOCOL_ABI,
    functionName: 'getMaxBorrowableAmount',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  })

  // Read pool data to get total deposited amount
  const { data: poolData, refetch: refetchPoolData } = useReadContract({
    address: LENDING_PROTOCOL_ADDRESS,
    abi: LENDING_PROTOCOL_ABI,
    functionName: 'pool',
  })

  // Format values for display
  const formattedBalance = userBalance ? 
    `${Number(formatEther(userBalance.value)).toFixed(2)} ETH` : 
    "0.00 ETH"

  const formattedCollateral = userPosition ? 
    `${Number(formatEther(userPosition[1])).toFixed(4)} ETH` : 
    "0.0000 ETH"

  const formattedAvailableLiquidity = availableLiquidity ? 
    `${Number(formatEther(availableLiquidity)).toFixed(4)} ETH` : 
    "0.0000 ETH"

  const formattedMaxBorrowable = maxBorrowableAmount ? 
    `${Number(formatEther(maxBorrowableAmount)).toFixed(4)} ETH` : 
    "0.0000 ETH"

  const formattedBorrowed = userPosition ? 
    `${Number(formatEther(userPosition[0])).toFixed(4)} ETH` : 
    "0.0000 ETH"

  const formattedInterestRate = poolData ?
    `${(Number(poolData[2]) / 100).toFixed(2)}%` :
    "0.00%"

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Watch for Deposited events
  useWatchContractEvent({
    address: LENDING_PROTOCOL_ADDRESS,
    abi: LENDING_PROTOCOL_ABI,
    eventName: 'Deposited',
    onLogs() {
      refetchPoolData()
    },
  })

  const handleSupply = async () => {
    if (!supplyAmount || !userAddress) return

    try {
      setIsSupplying(true)
      
      // Convert ETH amount to Wei for the contract
      const supplyAmountWei = parseEther(supplyAmount)

      await writeContractAsync({
        address: LENDING_PROTOCOL_ADDRESS,
        abi: LENDING_PROTOCOL_ABI,
        functionName: 'deposit',
        value: supplyAmountWei,
      })
      
      setIsSupplyModalOpen(false)
      setSupplyAmount("")
    } catch (error) {
      console.error('Error supplying ETH:', error)
    } finally {
      setIsSupplying(false)
    }
  }

  const handleBorrow = async () => {
    if (!borrowAmount || !userAddress) return

    try {
      setIsBorrowing(true)
      
      // Convert ETH amount to Wei for the contract
      const borrowAmountWei = parseEther(borrowAmount)

      await writeContractAsync({
        address: LENDING_PROTOCOL_ADDRESS,
        abi: LENDING_PROTOCOL_ABI,
        functionName: 'borrow',
        args: [borrowAmountWei],
      })
      
      setIsBorrowModalOpen(false)
      setBorrowAmount("")
    } catch (error) {
      console.error('Error borrowing ETH:', error)
    } finally {
      setIsBorrowing(false)
    }
  }

  const handleRepay = async () => {
    if (!userAddress || !userPosition?.[0]) return

    try {
      setIsRepaying(true)

      await writeContractAsync({
        address: LENDING_PROTOCOL_ADDRESS,
        abi: LENDING_PROTOCOL_ABI,
        functionName: 'repay',
        value: userPosition[0], // Send the exact amount borrowed
      })
      
      setIsRepayModalOpen(false)
    } catch (error) {
      console.error('Error repaying ETH:', error)
    } finally {
      setIsRepaying(false)
    }
  }

  const handleMaxClick = () => {
    if (userBalance) {
      // Leave some ETH for gas fees (0.01 ETH)
      const maxAmount = Number(formatEther(userBalance.value)) - 0.01
      setSupplyAmount(maxAmount > 0 ? maxAmount.toString() : "0")
    }
  }

  const handleMaxBorrowClick = () => {
    if (maxBorrowableAmount) {
      const maxAmount = Number(formatEther(maxBorrowableAmount))
      setBorrowAmount(maxAmount.toString())
    }
  }

  const handleCollateralizeNFT = async () => {
    if (!hasNFT || !nftBalance) return
    setError(null)

    try {
      // First step: Approve NFT
      setIsApproving(true)
      await writeContractAsync({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_CONTRACT_ABI,
        functionName: 'approve',
        args: [LENDING_PROTOCOL_ADDRESS, nftBalance],
      })
      setIsApproving(false)

      // Second step: Collateralize NFT
      setIsCollateralizing(true)
      await writeContractAsync({
        address: LENDING_PROTOCOL_ADDRESS,
        abi: LENDING_PROTOCOL_ABI,
        functionName: 'collateralizeNFT',
        args: [nftBalance],
      })
      setIsCollateralizing(false)
    } catch (error) {
      console.error('Error in collateralization process:', error)
      setError('Failed to collateralize NFT. Please try again.')
      setIsApproving(false)
      setIsCollateralizing(false)
    }
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
              <div className="text-6xl font-light text-black tracking-tight number-animate">{formattedInterestRate}</div>
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

        {/* Credit Score NFT Status */}
        <div className={`mb-24 fade-in ${isVisible ? "visible" : ""} stagger-1`}>
          <div className="mb-8">
            <h2 className="text-2xl font-light text-black uppercase tracking-wide">Credit Score NFT</h2>
            <div className="w-24 h-px bg-black mt-4"></div>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            {!isConnected ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Connect your wallet to view your Credit Score NFT status</p>
                <ConnectButton />
              </div>
            ) : !hasNFT ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">You don't have a Credit Score NFT yet</p>
                <a 
                  href="/finalized-score" 
                  className="inline-block px-6 py-2 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors"
                >
                  Get Your Credit Score NFT
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-medium text-black mb-2">
                      Credit Score NFT #{creditScoreTokenId || (nftBalance ? Number(nftBalance) : '...')}
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        Status: {isNFTCollateralized ? (
                          <span className="text-green-600 font-medium">Active as Collateral</span>
                        ) : (
                          <span className="text-yellow-600 font-medium">Not Collateralized</span>
                        )}
                      </p>
                      {creditScore !== null && (
                        <p className="text-gray-600">
                          Credit Score: <span className="font-medium text-black">{creditScore}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {!isNFTCollateralized && (
                    <div>
                      <button 
                        onClick={handleCollateralizeNFT}
                        disabled={isApproving || isCollateralizing}
                        className="px-6 py-2 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors relative group disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <span className="flex items-center gap-2">
                          {isApproving ? (
                            <>
                              Approving...
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            </>
                          ) : isCollateralizing ? (
                            <>
                              Collateralizing...
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            </>
                          ) : (
                            <>
                              Use as Collateral
                              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </>
                          )}
                        </span>
                      </button>
                      <p className="text-xs text-gray-500 mt-2">Requires 2 transactions: Approve & Collateralize</p>
                    </div>
                  )}
                </div>
                {isNFTCollateralized && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Your Credit Score NFT is being used as collateral</span>
                    </div>
                    <p className="text-green-700 text-sm mt-2">
                      This allows you to borrow assets based on your credit score
                    </p>
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">{error}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Positions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Borrow Position */}
          <div className={`fade-in ${isVisible ? "visible" : ""} stagger-2`}>
            <div className="mb-8">
              <h2 className="text-2xl font-light text-black uppercase tracking-wide">Your ETH Borrow Position</h2>
              <div className="w-24 h-px bg-black mt-4"></div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-4 gap-8 items-start py-6 border-b border-gray-200 hover-lift">
                {/* ETH Logo and Symbol */}
                <div>
                  <div className="flex items-center gap-2">
                    <EthereumLogo />
                    <div className="text-lg font-medium text-black uppercase tracking-wide">ETH</div>
                  </div>
                </div>

                {/* Borrowed Amount */}
                <div className="col-span-2">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">Borrowed</div>
                  <div className="text-2xl font-light text-black">{formattedBorrowed}</div>
                </div>

                {/* APY and Collateral */}
                <div className="text-right">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">APY</div>
                  <div className="text-2xl font-light text-black">{formattedInterestRate}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Collateral: {formattedCollateral}
                  </div>
                </div>
              </div>

              {/* Repay Button Section */}
              {Number(userPosition?.[0]) > 0 && (
                <div>
                  <button 
                    onClick={() => setIsRepayModalOpen(true)}
                    className="w-full py-4 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors rounded-lg"
                  >
                    REPAY
                  </button>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Current borrowed amount: {formattedBorrowed}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Asset to Borrow */}
          <div className={`fade-in ${isVisible ? "visible" : ""} stagger-2`}>
            <div className="mb-8">
              <h2 className="text-2xl font-light text-black uppercase tracking-wide">ETH Available to Borrow</h2>
              <div className="w-24 h-px bg-black mt-4"></div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-4 gap-8 items-start py-6 border-b border-gray-200 hover-lift">
                {/* ETH Logo and Symbol */}
                <div>
                  <div className="flex items-center gap-2">
                    <EthereumLogo />
                    <div className="text-lg font-medium text-black uppercase tracking-wide">ETH</div>
                  </div>
                </div>

                {/* Available Amount */}
                <div className="col-span-2">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">Available</div>
                  <div className="text-2xl font-light text-black">{formattedAvailableLiquidity}</div>
                </div>

                {/* Variable APY and Max Borrowable */}
                <div className="text-right">
                  <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">Variable APY</div>
                  <div className="text-2xl font-light text-black">{formattedInterestRate}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Max Borrowable: {formattedMaxBorrowable}
                  </div>
                </div>
              </div>

              {/* Borrow Button Section */}
              <div>
                <button 
                  onClick={() => setIsBorrowModalOpen(true)}
                  className="w-full py-4 bg-black text-white font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors rounded-lg"
                >
                  BORROW
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

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
                    <span className="font-medium text-black">{formattedInterestRate}</span>
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
                className="w-full py-4 bg-black text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors rounded-lg"
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
                    Available: {formattedMaxBorrowable}
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
                    <span className="text-black">Credit Score NFT</span>
                    <span className="font-medium text-black">
                      {nftBalance ? `#${Number(nftBalance)}` : 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleBorrow}
                disabled={!borrowAmount || isBorrowing || !isConnected || !isNFTCollateralized}
                className="w-full py-4 bg-black text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors rounded-lg"
              >
                {!isNFTCollateralized ? 'Collateralize NFT First' : 
                 isBorrowing ? 'Borrowing...' : 'Borrow ETH'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {isRepayModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[400px] rounded-lg shadow-xl">
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-medium text-black mb-2">Repay Your Loan</h3>
                <p className="text-gray-600">Amount to repay:</p>
                <div className="text-3xl font-light text-black mt-4">{formattedBorrowed}</div>
              </div>

              {userBalance && userPosition && userBalance.value < userPosition[0] ? (
                <div className="mb-6 text-center">
                  <div className="text-red-600 font-medium mb-2">Insufficient Balance</div>
                  <div className="text-sm text-gray-600">
                    Your balance: {formattedBalance}<br />
                    Required: {formattedBorrowed}
                  </div>
                </div>
              ) : (
                <div className="mb-6 text-center text-sm text-gray-600">
                  Your balance: {formattedBalance}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setIsRepayModalOpen(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRepay}
                  disabled={isRepaying || !userPosition || (userBalance && userBalance.value < userPosition[0])}
                  className="flex-1 py-3 bg-black text-white font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                >
                  {isRepaying ? 'Repaying...' : 'Confirm Repay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
