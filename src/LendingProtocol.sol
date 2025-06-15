// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./CreditScoreNFT.sol";

contract LendingProtocol is ReentrancyGuard, Ownable {
    // errors
    error LendingProtocol__InvalidCreditScore();
    error LendingProtocol__CannotMintWhileHavingActiveLoan();
    error LendingProtocol__UserAlreadyHasCreditScoreNFT();
    error LendingProtocol__AmountMustBeGreaterThanOrEqualToZero();
    error LendingProtocol__InsufficientLiquidity();
    error LendingProtocol__NotOwnerOfCreditScoreNFT();
    error LendingProtocol__AlreadyCollateralized();
    error LendingProtocol__InsufficientCollateral();
    error LendingProtocol__NoActiveLoan();

    // structs
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

    // Credit score thresholds and their corresponding collateral discounts (in basis points)
    struct CreditThreshold {
        uint256 score;
        uint256 discount;
    }

    // Credit Score NFT contract
    CreditScoreNFT public immutable creditScoreNFT;

    // Lending pool data
    LendingPool public pool;

    // Mapping of user addresses to their lending positions
    mapping(address => UserPosition) public positions;

    // Constants
    uint256 private constant BASE_COLLATERAL_RATIO = 15000; // 150% in basis points
    uint256 private constant MIN_COLLATERAL_RATIO = 11000; // 110% in basis points
    uint256 private constant BASIS_POINTS = 10000;

    // Array of credit thresholds (ordered from highest to lowest score)
    CreditThreshold[] public creditThresholds;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount, uint256 collateralAmount);
    event Repaid(address indexed user, uint256 amount);
    event CollateralAdded(address indexed user, uint256 amount);
    event CollateralRemoved(address indexed user, uint256 amount);
    event CreditScoreMinted(address indexed user, uint256 tokenId);
    event CreditScoreBurned(address indexed user, uint256 tokenId);

    modifier checkAmountMoreThanZeroAndLessThanAvailableLiquidity(uint256 _weiAmount) {
        if (_weiAmount <= 0) {
            revert LendingProtocol__AmountMustBeGreaterThanOrEqualToZero();
        } if (_weiAmount > getAvailableLiquidity()) {
            revert LendingProtocol__InsufficientLiquidity();
        }
        _;
    }

    constructor() Ownable(msg.sender) {
        // Deploy the CreditScoreNFT contract
        creditScoreNFT = new CreditScoreNFT();

        // Initialize pool with 5% interest rate
        pool.interestRate = 500;

        // Initialize credit score thresholds and their discounts
        creditThresholds.push(CreditThreshold({score: 90, discount: 3000})); // 90+ score = 30% discount
        creditThresholds.push(CreditThreshold({score: 80, discount: 2500})); // 80-89 score = 25% discount
        creditThresholds.push(CreditThreshold({score: 70, discount: 2000})); // 70-79 score = 20% discount
        creditThresholds.push(CreditThreshold({score: 60, discount: 1500})); // 60-69 score = 15% discount
        creditThresholds.push(CreditThreshold({score: 50, discount: 1000})); // 50-59 score = 10% discount
        creditThresholds.push(CreditThreshold({score: 40, discount: 500})); // 40-49 score = 5% discount
            // Below 40 = no discount
    }

    function mintCreditScore(uint256 _initialCreditScore) external returns (uint256) {
        // Validate initial score
        if (_initialCreditScore >= 100 || _initialCreditScore < 0) {
            revert LendingProtocol__InvalidCreditScore();
        } if (positions[msg.sender].borrowed != 0) {
            revert LendingProtocol__CannotMintWhileHavingActiveLoan();
        } if (creditScoreNFT.balanceOf(msg.sender) != 0) {
            revert LendingProtocol__UserAlreadyHasCreditScoreNFT();
        }

        // Mint new credit score NFT with initial score
        uint256 tokenId = creditScoreNFT.mint(msg.sender, _initialCreditScore);
        emit CreditScoreMinted(msg.sender, tokenId);
        return tokenId;
    }

    function depositOrCollateralize() external payable nonReentrant {
        if (msg.value <= 0) {
            revert LendingProtocol__AmountMustBeGreaterThanOrEqualToZero();
        }
        pool.totalDeposited += msg.value;
        positions[msg.sender].collateralAmount += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 _weiAmount) external nonReentrant checkAmountMoreThanZeroAndLessThanAvailableLiquidity(_weiAmount) {

        pool.totalDeposited -= _weiAmount;
        (bool success,) = payable(msg.sender).call{value: _weiAmount}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(msg.sender, _weiAmount);
    }

    function borrow(uint256 _weiAmount, uint256 _creditScoreTokenId) external payable nonReentrant checkAmountMoreThanZeroAndLessThanAvailableLiquidity (_weiAmount) {
        uint256 requiredCollateral;
        bool hasNFT;
        if (_creditScoreTokenId != 0) {
            hasNFT = true;
        } else {
            hasNFT = false;
        }

        if (hasNFT) {
            // Verify credit score NFT ownership
            if (creditScoreNFT.ownerOf(_creditScoreTokenId) != msg.sender) {
                revert LendingProtocol__NotOwnerOfCreditScoreNFT();
            }

            // Get credit score data
            CreditScoreNFT.CreditData memory creditData = creditScoreNFT.getCreditData(_creditScoreTokenId);
            if (creditData.isCollateralized) {
                revert LendingProtocol__AlreadyCollateralized();
            }

            // Calculate required collateral based on credit score
            requiredCollateral = calculateRequiredCollateral(_weiAmount, creditData.creditScore);

            // Transfer NFT to protocol
            creditScoreNFT.transferFrom(msg.sender, address(this), _creditScoreTokenId);

            // Mark credit score as collateralized
            creditScoreNFT.setCollateralStatus(_creditScoreTokenId, true);
        } else {
            // For users without NFT, require full collateralization (200%)
            requiredCollateral = (_weiAmount * 20000) / BASIS_POINTS; // 200% collateral ratio
        }

        if (positions[msg.sender].collateralAmount < requiredCollateral) {
            revert LendingProtocol__InsufficientCollateral();
        }

        // Update user position
        positions[msg.sender].borrowed += _weiAmount;
        positions[msg.sender].collateralAmount += msg.value;
        if (hasNFT) {
            positions[msg.sender].creditScoreTokenId = _creditScoreTokenId;
        }
        positions[msg.sender].lastInterestUpdate = block.timestamp;

        pool.totalBorrowed += _weiAmount;

        // Transfer borrowed ETH to user
        (bool success,) = payable(msg.sender).call{value: _weiAmount}("");
        require(success, "ETH transfer failed");

        emit Borrowed(msg.sender, _weiAmount, msg.value);
    }

    function repay() external payable nonReentrant checkAmountMoreThanZeroAndLessThanAvailableLiquidity(msg.value) {
        UserPosition storage position = positions[msg.sender];
        if (position.borrowed <= 0) {
            revert LendingProtocol__NoActiveLoan();
        }

        uint256 interest = calculateInterest(position.borrowed, position.lastInterestUpdate);
        uint256 totalOwed = position.borrowed + interest;

        uint256 repayAmount = msg.value > totalOwed ? totalOwed : msg.value;
        uint256 refund = msg.value - repayAmount;

        position.borrowed = totalOwed - repayAmount;
        position.lastInterestUpdate = block.timestamp;
        pool.totalBorrowed -= repayAmount;

        // If loan is fully repaid
        if (position.borrowed == 0) {
            uint256 collateralToReturn = position.collateralAmount;
            position.collateralAmount = 0;

            // If user had a credit score NFT, update and burn it
            if (position.creditScoreTokenId != 0) {
                uint256 tokenId = position.creditScoreTokenId;
                position.creditScoreTokenId = 0;

                // Update credit score before burning
                uint256 newScore = calculateNewCreditScore(tokenId, totalOwed, position.lastInterestUpdate);
                creditScoreNFT.updateCreditScore(tokenId, newScore);

                // Unset collateral status and burn NFT
                creditScoreNFT.setCollateralStatus(tokenId, false);
                creditScoreNFT.burn(tokenId);
            }

            // Return collateral
            (bool successCollateral,) = payable(msg.sender).call{value: collateralToReturn}("");
            require(successCollateral, "Collateral return failed");
        }

        // Return excess payment if any
        if (refund > 0) {
            (bool successRefund,) = payable(msg.sender).call{value: refund}("");
            require(successRefund, "Refund transfer failed");
        }

        emit Repaid(msg.sender, repayAmount);
    }

    function calculateNewCreditScore(uint256 tokenId, uint256 totalRepaid, uint256 loanStartTime)
        internal
        view
        returns (uint256)
    {
        CreditScoreNFT.CreditData memory creditData = creditScoreNFT.getCreditData(tokenId);
        uint256 currentScore = creditData.creditScore;

        // Calculate time taken to repay (in days)
        uint256 daysToRepay = (block.timestamp - loanStartTime) / 1 days;

        // Calculate score adjustments based on repayment amount and time
        int256 scoreAdjustment = 0;

        // Time-based adjustment
        if (daysToRepay <= 30) {
            // Early repayment bonus
            scoreAdjustment += 5;
        } else if (daysToRepay <= 45) {
            // Slight delay penalty
            scoreAdjustment -= 2;
        } else {
            // Significant delay penalty
            scoreAdjustment -= 10;
        }

        // Amount-based adjustment
        // If repaid amount is significant (over 10 ETH), give additional bonus
        if (totalRepaid >= 10 ether) {
            scoreAdjustment += 3;
        } else if (totalRepaid >= 5 ether) {
            scoreAdjustment += 2;
        } else if (totalRepaid >= 1 ether) {
            scoreAdjustment += 1;
        }

        // Apply adjustments while keeping score within bounds
        if (scoreAdjustment > 0) {
            return min(100, currentScore + uint256(scoreAdjustment));
        } else {
            return max(0, currentScore > uint256(-scoreAdjustment) ? currentScore - uint256(-scoreAdjustment) : 0);
        }
    }

    function calculateRequiredCollateral(uint256 amount, uint256 creditScore) public view returns (uint256) {
        uint256 baseCollateral = (amount * BASE_COLLATERAL_RATIO) / BASIS_POINTS;

        // Find the applicable discount based on credit score
        uint256 discount = 0;
        for (uint256 i = 0; i < creditThresholds.length; i++) {
            if (creditScore >= creditThresholds[i].score) {
                discount = creditThresholds[i].discount;
                break;
            }
        }

        // Apply the discount
        uint256 discountedCollateral = baseCollateral - ((baseCollateral * discount) / BASIS_POINTS);

        // Ensure minimum collateral ratio is maintained
        uint256 minCollateral = (amount * MIN_COLLATERAL_RATIO) / BASIS_POINTS;
        return max(discountedCollateral, minCollateral);
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

    function getUserPosition(address user)
        external
        view
        returns (uint256 borrowed, uint256 collateralAmount, uint256 creditScoreTokenId, uint256 lastInterestUpdate)
    {
        UserPosition memory position = positions[user];
        return (position.borrowed, position.collateralAmount, position.creditScoreTokenId, position.lastInterestUpdate);
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    // Required to receive ETH
    receive() external payable {}
}
