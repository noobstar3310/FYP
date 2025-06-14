// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CreditScoreNFT is ERC721, Ownable {
    struct CreditData {
        uint256 creditScore;
        uint256 lastUpdated;
        bool isCollateralized;
    }

    // Mapping from token ID to credit data
    mapping(uint256 => CreditData) public creditScores;
    
    // Counter for token IDs
    uint256 private _tokenIdCounter;

    // Address of the lending protocol that can update credit scores
    address public lendingProtocol;

    // Events
    event CreditScoreUpdated(uint256 indexed tokenId, uint256 newScore);
    event CollateralStatusChanged(uint256 indexed tokenId, bool isCollateralized);

    constructor() ERC721("Credit Score NFT", "CREDIT") Ownable(msg.sender) {}

    modifier onlyLendingProtocol() {
        require(msg.sender == lendingProtocol, "Only lending protocol can call this");
        _;
    }

    function setLendingProtocol(address _lendingProtocol) external onlyOwner {
        require(_lendingProtocol != address(0), "Invalid address");
        lendingProtocol = _lendingProtocol;
    }

    function mint() external returns (uint256) {
        require(balanceOf(msg.sender) == 0, "User already has a credit score NFT");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);
        
        // Initialize credit score data
        creditScores[tokenId] = CreditData({
            creditScore: 500, // Base credit score
            lastUpdated: block.timestamp,
            isCollateralized: false
        });

        return tokenId;
    }

    function updateCreditScore(uint256 tokenId, uint256 newScore) external onlyLendingProtocol {
        require(_exists(tokenId), "Token does not exist");
        require(newScore >= 300 && newScore <= 850, "Invalid credit score range");

        creditScores[tokenId].creditScore = newScore;
        creditScores[tokenId].lastUpdated = block.timestamp;

        emit CreditScoreUpdated(tokenId, newScore);
    }

    function setCollateralStatus(uint256 tokenId, bool status) external onlyLendingProtocol {
        require(_exists(tokenId), "Token does not exist");
        creditScores[tokenId].isCollateralized = status;
        emit CollateralStatusChanged(tokenId, status);
    }

    function getCreditData(uint256 tokenId) external view returns (CreditData memory) {
        require(_exists(tokenId), "Token does not exist");
        return creditScores[tokenId];
    }

    // Override transfer functions to make NFT non-transferable
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Allow minting (from zero address) but prevent transfers
        require(from == address(0) || to == address(0), "Token is non-transferable");
        
        // Prevent burning if token is being used as collateral
        if (to == address(0)) {
            require(!creditScores[tokenId].isCollateralized, "Token is currently used as collateral");
        }
    }
} 