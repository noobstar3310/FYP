export interface AssetMetrics {
  balance: string
  apy: string
  totalSupplied: string
}

export interface BorrowPosition {
  borrowed: string
  variableApy: string
  collateral: string
}

export interface AssetToBorrow {
  availableToBorrow: string
  variableApy: string
  totalBorrowed: string
}

export interface CreditData {
  creditScore: bigint
  lastUpdated: bigint
  isCollateralized: boolean
} 