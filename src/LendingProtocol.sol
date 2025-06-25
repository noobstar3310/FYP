// // SPDX-License-Identifier: MIT
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
    uint256 private constant MIN_COLLATERAL_RATIO = 8000; // 80% in basis points - EXTREMELY RISKY!
    uint256 private constant BASIS_POINTS = 10000;

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
        }
        if (_weiAmount > getAvailableLiquidity()) {
            revert LendingProtocol__InsufficientLiquidity();
        }
        _;
    }

    constructor() Ownable(msg.sender) {
        // Deploy the CreditScoreNFT contract
        creditScoreNFT = new CreditScoreNFT();

        // Initialize pool with 5% interest rate
        pool.interestRate = 500;
    }

    function mintCreditScore(uint256 _initialCreditScore) external returns (uint256) {
        // Validate initial score
        if (_initialCreditScore >= 100 || _initialCreditScore < 0) {
            revert LendingProtocol__InvalidCreditScore();
        }
        if (positions[msg.sender].borrowed != 0) {
            revert LendingProtocol__CannotMintWhileHavingActiveLoan();
        }
        if (creditScoreNFT.balanceOf(msg.sender) != 0) {
            revert LendingProtocol__UserAlreadyHasCreditScoreNFT();
        }

        // Mint new credit score NFT with initial score
        uint256 tokenId = creditScoreNFT.mint(msg.sender, _initialCreditScore);
        positions[msg.sender].creditScoreTokenId = tokenId;
        emit CreditScoreMinted(msg.sender, tokenId);
        return tokenId;
    }

    function deposit() external payable nonReentrant {
        if (msg.value <= 0) {
            revert LendingProtocol__AmountMustBeGreaterThanOrEqualToZero();
        }
        pool.totalDeposited += msg.value;
        positions[msg.sender].collateralAmount += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function collateralizeNFT(uint256 _tokenId) external nonReentrant {
        // Verify credit score NFT ownership
        if (creditScoreNFT.ownerOf(_tokenId) != msg.sender) {
            revert LendingProtocol__NotOwnerOfCreditScoreNFT();
        }

        // Get credit score data
        CreditScoreNFT.CreditData memory creditData = creditScoreNFT.getCreditData(_tokenId);
        if (creditData.isCollateralized) {
            revert LendingProtocol__AlreadyCollateralized();
        }

        // Transfer NFT to protocol
        creditScoreNFT.transferFrom(msg.sender, address(this), _tokenId);

        // Mark credit score as collateralized
        creditScoreNFT.setCollateralStatus(_tokenId, true);

        // Update user position
        positions[msg.sender].creditScoreTokenId = _tokenId;
    }

    function withdraw(uint256 _weiAmount)
        external
        nonReentrant
        checkAmountMoreThanZeroAndLessThanAvailableLiquidity(_weiAmount)
    {
        pool.totalDeposited -= _weiAmount;
        (bool success,) = payable(msg.sender).call{value: _weiAmount}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(msg.sender, _weiAmount);
    }

    function borrow(uint256 _weiAmount)
        external
        payable
        nonReentrant
        checkAmountMoreThanZeroAndLessThanAvailableLiquidity(_weiAmount)
    {
        uint256 requiredCollateral;
        UserPosition storage position = positions[msg.sender];
        bool hasNFT = position.creditScoreTokenId != 0;

        // If user already has a loan, calculate and add accrued interest first
        if (position.borrowed > 0) {
            uint256 interest = calculateInterest(position.borrowed, position.lastInterestUpdate);
            position.borrowed += interest;
        }

        if (hasNFT) {
            // Get credit score data and verify NFT is collateralized
            CreditScoreNFT.CreditData memory creditData = creditScoreNFT.getCreditData(position.creditScoreTokenId);
            if (!creditData.isCollateralized || creditScoreNFT.ownerOf(position.creditScoreTokenId) != address(this)) {
                revert LendingProtocol__NotOwnerOfCreditScoreNFT();
            }

            // Calculate required collateral based on credit score
            requiredCollateral = calculateRequiredCollateral(_weiAmount, creditData.creditScore);

            // Unset collateral status before burning
            creditScoreNFT.setCollateralStatus(position.creditScoreTokenId, false);
            
            // Burn the NFT since it's being used for borrowing
            creditScoreNFT.burn(position.creditScoreTokenId);
        } else {
            // For users without NFT, require full collateralization (200%)
            requiredCollateral = (_weiAmount * 20000) / BASIS_POINTS; // 200% collateral ratio
        }

        if (position.collateralAmount < requiredCollateral) {
            revert LendingProtocol__InsufficientCollateral();
        }

        // Update user position
        position.borrowed += _weiAmount;
        position.collateralAmount += msg.value;
        if (hasNFT) {
            position.creditScoreTokenId = 0; // Set to 0 since NFT is burned
        }
        position.lastInterestUpdate = block.timestamp;

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

        // Calculate accrued interest
        uint256 interest = calculateInterest(position.borrowed, position.lastInterestUpdate);
        uint256 totalOwed = position.borrowed + interest;

        uint256 repayAmount = msg.value > totalOwed ? totalOwed : msg.value;
        uint256 refund = msg.value - repayAmount;

        // If loan is fully repaid
        if (repayAmount >= totalOwed) {
            position.borrowed = 0; // Set borrowed amount to 0
            uint256 collateralToReturn = position.collateralAmount;
            position.collateralAmount = 0;

            // Return collateral
            (bool successCollateral,) = payable(msg.sender).call{value: collateralToReturn}("");
            require(successCollateral, "Collateral return failed");
        } else {
            // For partial repayment, first pay off accrued interest, then principal
            if (repayAmount <= interest) {
                // If repayment amount is less than or equal to interest
                position.borrowed = totalOwed - repayAmount;
            } else {
                // If repayment amount is more than interest
                position.borrowed = position.borrowed - (repayAmount - interest);
            }
        }

        position.lastInterestUpdate = block.timestamp;
        pool.totalBorrowed = (pool.totalBorrowed + interest) - repayAmount;

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
        // Check if the amount exceeds available liquidity
        if (amount > getAvailableLiquidity()) {
            revert LendingProtocol__InsufficientLiquidity();
        }

        // Calculate required collateral based on credit score
        uint256 requiredCollateral;

        if (creditScore >= 95) {
            requiredCollateral = (amount * 100) / 150; // Need 66.67% collateral for borrowing
        } else if (creditScore >= 90) {
            requiredCollateral = (amount * 100) / 140; // Need 71.43% collateral for borrowing
        } else if (creditScore >= 85) {
            requiredCollateral = (amount * 100) / 130; // Need 76.92% collateral for borrowing
        } else if (creditScore >= 80) {
            requiredCollateral = (amount * 100) / 120; // Need 83.33% collateral for borrowing
        } else if (creditScore >= 70) {
            requiredCollateral = (amount * 100) / 110; // Need 90.91% collateral for borrowing
        } else if (creditScore >= 60) {
            requiredCollateral = amount; // Need 100% collateral for borrowing
        } else if (creditScore >= 50) {
            requiredCollateral = (amount * 100) / 90; // Need 111.11% collateral for borrowing
        } else if (creditScore >= 40) {
            requiredCollateral = (amount * 100) / 80; // Need 125% collateral for borrowing
        } else {
            requiredCollateral = (amount * 100) / 70; // Need 142.86% collateral for borrowing
        }

        return requiredCollateral;
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
        public
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

    function getMaxBorrowableAmount(address user) external view returns (uint256) {
        UserPosition memory position = positions[user];
        uint256 collateral = position.collateralAmount;
        uint256 maxAmount;
        
        uint256 availableLiquidity = getAvailableLiquidity();

        // If user has no collateral or protocol has no liquidity, they can't borrow
        if (collateral == 0 || availableLiquidity == 0) {
            return 0;
        } else {
            (,,uint256 tokenId,)= getUserPosition(user);
            
            if (tokenId > 0) {
                // User has an NFT, calculate based on credit score
                CreditScoreNFT.CreditData memory creditData = creditScoreNFT.getCreditData(tokenId);
                uint256 creditScore = creditData.creditScore;
                

                // Higher credit score = lower collateral requirement = higher borrowing power
                if (creditScore >= 95) {
                    maxAmount = (collateral * 150) / 100; // Can borrow 150% of collateral
                } else if (creditScore >= 90) {
                    maxAmount = (collateral * 140) / 100; // Can borrow 140% of collateral
                } else if (creditScore >= 85) {
                    maxAmount = (collateral * 130) / 100; // Can borrow 130% of collateral
                } else if (creditScore >= 80) {
                    maxAmount = (collateral * 120) / 100; // Can borrow 120% of collateral
                } else if (creditScore >= 70) {
                    maxAmount = (collateral * 110) / 100; // Can borrow 110% of collateral
                } else if (creditScore >= 60) {
                    maxAmount = collateral; // Can borrow 100% of collateral
                } else if (creditScore >= 50) {
                    maxAmount = (collateral * 90) / 100; // Can borrow 90% of collateral
                } else if (creditScore >= 40) {
                    maxAmount = (collateral * 80) / 100; // Can borrow 80% of collateral
                } else {
                    maxAmount = (collateral * 70) / 100; // Can borrow 70% of collateral
                }
            } else {
                maxAmount = (collateral * 50) / 100; // No NFT: Can borrow 50% of collateral
            }

            // Return the minimum between calculated maxAmount and available liquidity
            return maxAmount > availableLiquidity ? availableLiquidity : maxAmount;
        }
    }

    // Required to receive ETH
    receive() external payable {}
}
