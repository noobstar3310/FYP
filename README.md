# 🏦 DeFi Lending Protocol with Credit Score NFTs

A revolutionary DeFi lending protocol that introduces on-chain credit scoring through non-transferable NFTs, enabling better loan terms for reliable borrowers.

## 🌟 Features

### Credit Score System
- 📈 Scores range from 0-100
- 🎯 Dynamic scoring based on repayment behavior:
  - ⚡ Early repayment (≤30 days): +5 points
  - ⏰ Slight delay (31-45 days): -2 points
  - ⚠️ Late repayment (>45 days): -10 points
- 💰 Additional bonuses for repayment amounts:
  - 10+ ETH: +3 points
  - 5+ ETH: +2 points
  - 1+ ETH: +1 point

### Collateralization System
- 🔒 Base collateral ratio: 150%
- 🛡️ Minimum collateral ratio: 110%
- 💎 Credit score-based discounts:
  - 90-100: 30% discount
  - 80-89: 25% discount
  - 70-79: 20% discount
  - 60-69: 15% discount
  - 50-59: 10% discount
  - 40-49: 5% discount
  - Below 40: No discount
- 🆕 No credit score? No problem! Borrow with 200% collateral

## 🛠 Technical Stack

- **Smart Contracts**: Solidity ^0.8.19
- **Development Framework**: Foundry
- **Testing**: Forge
- **Dependencies**: OpenZeppelin Contracts

## 📦 Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd fyp-contracts
```

2. Install dependencies
```bash
make install
```

3. Build the project
```bash
make build
```

## 🚀 Deployment

1. Set up your environment variables in `.env`:
```bash
SEPOLIA_RPC_URL=your_rpc_url
ETHERSCAN_API_KEY=your_api_key
SEPOLIA_VERIFIER_URL=https://api-sepolia.etherscan.io/api
```

2. Deploy the LendingProtocol:
```bash
make deploy-lending-protocol
```

3. Verify the CreditScoreNFT contract:
```bash
NFT_CONTRACT=<deployed-nft-address> make verify-nft-contract
```

## 🔍 Contract Addresses (Sepolia)

- LendingProtocol: [0xbEE1Bdd1B2EaFB02952098b571555d6F4e59deD5](https://sepolia.etherscan.io/address/0xbee1bdd1b2eafb02952098b571555d6f4e59ded5)
- CreditScoreNFT: [0x1608134A9C4d7Ea211949c4324c6360afA959205](https://sepolia.etherscan.io/address/0x1608134a9c4d7ea211949c4324c6360afa959205)

## 💡 Usage

### For Lenders
1. Deposit ETH into the lending pool:
```solidity
function deposit() external payable
```

### For Borrowers
1. Mint a credit score NFT (optional):
```solidity
function mintCreditScore(uint256 _initialCreditScore) external
```

2. Deposit collateral:
```solidity
function depositOrCollateralize() external payable
```

3. Borrow ETH:
```solidity
function borrow(uint256 _weiAmount, uint256 _creditScoreTokenId) external
```

4. Repay loan:
```solidity
function repay() external payable
```

## 🔐 Security Features

- ✅ Non-transferable credit score NFTs
- 🛡️ Reentrancy protection
- 🔒 Ownership controls
- 💪 Robust collateralization system
- 🎯 Precise interest calculations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This protocol is part of a final year project and is not audited. Use at your own risk.
