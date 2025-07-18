// Contract addresses
export const LENDING_PROTOCOL_ADDRESS = "0x6541f442d61A82e84C61DF52209e3a78B8D17271"
export const NFT_CONTRACT_ADDRESS = "0xf28dA7e4f75140916f30fB103a9AB23999585A06"

// Contract ABIs
export const LENDING_PROTOCOL_ABI = [
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
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "_tokenId","type": "uint256"}],
    "name": "collateralizeNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "getMaxBorrowableAmount",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "_weiAmount","type": "uint256"}],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "repay",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "_initialCreditScore","type": "uint256"}],
    "name": "mintCreditScore",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export const NFT_CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address","name": "holder","type": "address"}],
    "name": "getHolderTokenId",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256","name": "tokenId","type": "uint256"}],
    "name": "getCreditData",
    "outputs": [
      {"internalType": "uint256","name": "creditScore","type": "uint256"},
      {"internalType": "uint256","name": "lastUpdated","type": "uint256"},
      {"internalType": "bool","name": "isCollateralized","type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address","name": "to","type": "address"},
      {"internalType": "uint256","name": "tokenId","type": "uint256"}
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const 