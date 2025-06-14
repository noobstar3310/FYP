// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./CreditScoreNFT.sol";

contract LendingProtocol is ReentrancyGuard, Ownable {
    struct LendingPool {
        uint256 totalDeposited;
        uint256 totalBorrowed;
        uint256 interestRate; // Annual interest rate with 2 decimal places (e.g., 500 = 5.00%)
    }

    struct UserPosition {
        uint256 borrowed;
        uint256 collateralAmount;
        uint256 creditScoreTokenId;
        uint256 lastInterestUpdate;
    }

    // Credit Score NFT contract
    CreditScoreNFT public immutable creditScoreNFT;

    // Lending pool data
    LendingPool public pool;

    // Mapping of user addresses to their lending positions
    mapping(address => UserPosition) public positions;

    // Constants
    uint256 private constant BASE_COLLATERAL_RATIO = 15000; // 150% in basis points
    uint256 private constant CREDIT_SCORE_DISCOUNT_FACTOR = 100; // Discount per credit score point above 700
    uint256 private constant BASIS_POINTS = 10000;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount, uint256 collateralAmount);
    event Repaid(address indexed user, uint256 amount);
    event CollateralAdded(address indexed user, uint256 amount);
    event CollateralRemoved(address indexed user, uint256 amount);

    constructor(address _creditScoreNFT) Ownable(msg.sender) {
        creditScoreNFT = CreditScoreNFT(_creditScoreNFT);
        
        // Initialize pool with 5% interest rate
        pool.interestRate = 500;
    }

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        
        pool.totalDeposited += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= getAvailableLiquidity(), "Insufficient liquidity");
        
        pool.totalDeposited -= amount;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }

    function borrow(uint256 amount, uint256 creditScoreTokenId) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= getAvailableLiquidity(), "Insufficient liquidity");
        
        // Verify credit score NFT ownership
        require(creditScoreNFT.ownerOf(creditScoreTokenId) == msg.sender, "Not owner of credit score NFT");
        
        // Get credit score data
        CreditScoreNFT.CreditData memory creditData = creditScoreNFT.getCreditData(creditScoreTokenId);
        require(!creditData.isCollateralized, "Credit score already collateralized");

        // Calculate required collateral based on credit score
        uint256 requiredCollateral = calculateRequiredCollateral(amount, creditData.creditScore);
        require(msg.value >= requiredCollateral, "Insufficient collateral");
        
        // Update user position
        positions[msg.sender].borrowed += amount;
        positions[msg.sender].collateralAmount += msg.value;
        positions[msg.sender].creditScoreTokenId = creditScoreTokenId;
        positions[msg.sender].lastInterestUpdate = block.timestamp;
        
        // Mark credit score as collateralized
        creditScoreNFT.setCollateralStatus(creditScoreTokenId, true);
        
        pool.totalBorrowed += amount;
        
        // Transfer borrowed ETH to user
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit Borrowed(msg.sender, amount, msg.value);
    }

    function repay() external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        UserPosition storage position = positions[msg.sender];
        require(position.borrowed > 0, "No active loan");

        uint256 interest = calculateInterest(position.borrowed, position.lastInterestUpdate);
        uint256 totalOwed = position.borrowed + interest;
        
        uint256 repayAmount = msg.value > totalOwed ? totalOwed : msg.value;
        uint256 refund = msg.value - repayAmount;
        
        position.borrowed = totalOwed - repayAmount;
        position.lastInterestUpdate = block.timestamp;
        pool.totalBorrowed -= repayAmount;

        // If loan is fully repaid, release collateral and credit score NFT
        if (position.borrowed == 0) {
            uint256 collateralToReturn = position.collateralAmount;
            position.collateralAmount = 0;
            creditScoreNFT.setCollateralStatus(position.creditScoreTokenId, false);
            position.creditScoreTokenId = 0;
            
            // Return collateral
            (bool successCollateral, ) = payable(msg.sender).call{value: collateralToReturn}("");
            require(successCollateral, "Collateral return failed");
        }
        
        // Return excess payment if any
        if (refund > 0) {
            (bool successRefund, ) = payable(msg.sender).call{value: refund}("");
            require(successRefund, "Refund transfer failed");
        }
        
        emit Repaid(msg.sender, repayAmount);
    }

    function calculateRequiredCollateral(uint256 amount, uint256 creditScore) public view returns (uint256) {
        uint256 baseCollateral = (amount * BASE_COLLATERAL_RATIO) / BASIS_POINTS;
        
        if (creditScore > 700) {
            uint256 discount = ((creditScore - 700) * CREDIT_SCORE_DISCOUNT_FACTOR) / BASIS_POINTS;
            return baseCollateral - ((baseCollateral * discount) / BASIS_POINTS);
        }
        
        return baseCollateral;
    }

    function calculateInterest(uint256 borrowed, uint256 lastUpdate) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - lastUpdate;
        return (borrowed * pool.interestRate * timeElapsed) / (365 days * BASIS_POINTS);
    }

    function getAvailableLiquidity() public view returns (uint256) {
        return address(this).balance - pool.totalBorrowed;
    }

    function setInterestRate(uint256 newRate) external onlyOwner {
        require(newRate > 0 && newRate <= 10000, "Invalid interest rate"); // Max 100%
        pool.interestRate = newRate;
    }

    function getUserPosition(address user) external view returns (
        uint256 borrowed,
        uint256 collateralAmount,
        uint256 creditScoreTokenId,
        uint256 lastInterestUpdate
    ) {
        UserPosition memory position = positions[user];
        return (
            position.borrowed,
            position.collateralAmount,
            position.creditScoreTokenId,
            position.lastInterestUpdate
        );
    }

    // Required to receive ETH
    receive() external payable {}
} 