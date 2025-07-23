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
        UserPosition storage position = positions[msg.sender];
        uint256 collateral = position.collateralAmount + msg.value;
        bool hasNFT = position.creditScoreTokenId != 0;

        // Calculate interest upfront (5% of borrowed amount)
        uint256 interest = (_weiAmount * pool.interestRate) / BASIS_POINTS;
        uint256 totalBorrowAmount = _weiAmount + interest;

        // Update user position with total amount including interest
        position.borrowed = totalBorrowAmount;
        position.collateralAmount = collateral;
        if (hasNFT) {
            position.creditScoreTokenId = 0; // Set to 0 since NFT is burned
        }
        position.lastInterestUpdate = block.timestamp;

        pool.totalBorrowed += totalBorrowAmount;

        // Transfer borrowed ETH to user (original amount without interest)
        (bool success,) = payable(msg.sender).call{value: _weiAmount}("");
        require(success, "ETH transfer failed");

        emit Borrowed(msg.sender, _weiAmount, msg.value);
    }

    function repay() external payable nonReentrant {
        UserPosition storage position = positions[msg.sender];
        if (position.borrowed <= 0) {
            revert LendingProtocol__NoActiveLoan();
        }

        // If user sends more than they owe, we'll only take what they owe
        uint256 repayAmount = msg.value > position.borrowed ? position.borrowed : msg.value;
        
        // Update borrowed amount
        position.borrowed -= repayAmount;
        pool.totalBorrowed -= repayAmount;

        // If loan is fully repaid, return collateral
        if (position.borrowed == 0) {
            uint256 collateralToReturn = position.collateralAmount;
            position.collateralAmount = 0;
            (bool success,) = payable(msg.sender).call{value: collateralToReturn}("");
            require(success, "Collateral return failed");
        }

        // Return any excess payment
        uint256 refund = msg.value - repayAmount;
        if (refund > 0) {
            (bool success,) = payable(msg.sender).call{value: refund}("");
            require(success, "Refund transfer failed");
        }

        emit Repaid(msg.sender, repayAmount);
    }

    function getAvailableLiquidity() public view returns (uint256) {
        return address(this).balance - pool.totalBorrowed;
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
            uint256 tokenId = position.creditScoreTokenId;
            
            if (tokenId > 0) {
                // User has an NFT, check if it's collateralized
                CreditScoreNFT.CreditData memory creditData = creditScoreNFT.getCreditData(tokenId);
                
                if (creditData.isCollateralized) {
                    // NFT is collateralized, calculate based on credit score
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
                    maxAmount = (collateral * 50) / 100; // NFT not collateralized: Can borrow 50% of collateral
                }
            } else {
                maxAmount = (collateral * 50) / 100; // No NFT: Can borrow 50% of collateral
            }

            // Return the minimum between calculated maxAmount and available liquidity
            return maxAmount > availableLiquidity ? availableLiquidity : maxAmount;
        }
    }

    function getTotalAmountToRepay(address user) external view returns (uint256 totalOwed, uint256 principal, uint256 interestAccrued) {
        UserPosition memory position = positions[user];
        
        // If no borrowed amount, return zeros
        if (position.borrowed == 0) {
            return (0, 0, 0);
        }
        
        // Calculate what portion was interest (5% of principal)
        uint256 principalAmount = (position.borrowed * BASIS_POINTS) / (BASIS_POINTS + pool.interestRate);
        uint256 interest = position.borrowed - principalAmount;
        
        return (position.borrowed, principalAmount, interest);
    }

    // Required to receive ETH
    receive() external payable {}
}
