// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CreditScoreNFT is ERC721 {
    struct CreditData {
        uint256 creditScore;
        uint256 lastUpdated;
        bool isCollateralized;
    }

    // Mapping from token ID to credit data
    mapping(uint256 => CreditData) public creditScores;
    
    // Counter for token IDs
    uint256 private _nextTokenId;

    // Events
    event CreditScoreUpdated(uint256 indexed tokenId, uint256 newScore);
    event CollateralStatusChanged(uint256 indexed tokenId, bool isCollateralized);

    constructor() ERC721("Credit Score NFT", "CREDIT") {}

    function mint(address to, uint256 initialScore) external returns (uint256) {
        require(msg.sender == owner(), "Only lending protocol can mint");
        require(balanceOf(to) == 0, "User already has a credit score NFT");
        require(initialScore <= 100, "Invalid credit score range"); // Score must be between 0-100
        
        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);
        
        // Initialize credit score data with provided score
        creditScores[tokenId] = CreditData({
            creditScore: initialScore,
            lastUpdated: block.timestamp,
            isCollateralized: false
        });

        return tokenId;
    }

    function burn(uint256 tokenId) external {
        require(msg.sender == owner(), "Only lending protocol can burn");
        require(ownerOf(tokenId) == owner(), "NFT must be owned by protocol");
        require(!creditScores[tokenId].isCollateralized, "Token is currently used as collateral");
        
        delete creditScores[tokenId];
        _burn(tokenId);
    }

    function updateCreditScore(uint256 tokenId, uint256 newScore) external {
        require(msg.sender == owner(), "Only lending protocol can update");
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        require(newScore <= 100, "Invalid credit score range"); // Score must be between 0-100

        creditScores[tokenId].creditScore = newScore;
        creditScores[tokenId].lastUpdated = block.timestamp;

        emit CreditScoreUpdated(tokenId, newScore);
    }

    function setCollateralStatus(uint256 tokenId, bool status) external {
        require(msg.sender == owner(), "Only lending protocol can update");
        require(ownerOf(tokenId) == owner(), "NFT must be owned by protocol");
        creditScores[tokenId].isCollateralized = status;
        emit CollateralStatusChanged(tokenId, status);
    }

    function getCreditData(uint256 tokenId) external view returns (CreditData memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return creditScores[tokenId];
    }

    // Make NFT transferable only to/from the lending protocol
    // function _transfer(
    //     address from,
    //     address to,
    //     uint256 tokenId
    // ) internal virtual override {
    //     if (from != address(0) && to != address(0)) { // If not minting or burning
    //         require(from == owner() || to == owner(), "Can only transfer to/from protocol");
    //     }
    //     super._transfer(from, to, tokenId);
    // }

    // Override owner() to return the LendingProtocol address
    function owner() public view returns (address) {
        return msg.sender;
    }
} 