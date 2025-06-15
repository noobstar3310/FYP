-include .env

install:
	forge install openzeppelin/openzeppelin-contracts --no-commit

build:; forge build

deploy-lending-protocol:
	forge create src/LendingProtocol.sol:LendingProtocol --verify --verifier-url $(SEPOLIA_VERIFIER_URL) --account dev-wallet-1 --etherscan-api-key $(ETHERSCAN_API_KEY) --rpc-url $(SEPOLIA_RPC_URL) --broadcast

verify-nft-contract:
	forge verify-contract $(NFT_CONTRACT) src/CreditScoreNFT.sol:CreditScoreNFT --verifier-url $(SEPOLIA_VERIFIER_URL) --etherscan-api-key $(ETHERSCAN_API_KEY) --chain-id 11155111