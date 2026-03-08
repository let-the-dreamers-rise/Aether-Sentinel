// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TokenizedVault
 * @notice Manages tokenized asset deposits, withdrawals, collateral tracking, and reserve ratio enforcement
 * @dev Implements UUPS upgradeable pattern with role-based access control
 */
contract TokenizedVault is 
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // ============ Roles ============
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant RISK_GUARDIAN_ROLE = keccak256("RISK_GUARDIAN_ROLE");

    // ============ State Variables ============
    
    /// @notice Underlying asset (e.g., USDC, DAI)
    IERC20 public underlyingAsset;
    
    /// @notice Vault token balances for each user
    mapping(address => uint256) public vaultTokenBalances;
    
    /// @notice Total vault tokens in circulation
    uint256 public totalVaultTokens;
    
    /// @notice Total underlying assets held by vault
    uint256 public totalUnderlyingAssets;
    
    /// @notice Reserve ratio in basis points (10000 = 100%)
    uint256 public reserveRatio;
    
    /// @notice Minimum reserve ratio threshold in basis points
    uint256 public minimumReserveRatio;
    
    /// @notice Total deposits made to vault
    uint256 public totalDeposits;
    
    /// @notice Total liabilities (withdrawable amount)
    uint256 public totalLiabilities;
    
    /// @notice Timestamp of last reserve ratio update
    uint256 public lastReserveRatioUpdate;
    
    /// @notice Deposit event counter for audit trail
    uint256 public depositCount;
    
    /// @notice Withdrawal event counter for audit trail
    uint256 public withdrawalCount;

    // ============ Structs ============
    
    struct VaultState {
        uint256 reserveRatio;
        uint256 totalDeposits;
        uint256 totalLiabilities;
        bool paused;
        uint256 lastUpdate;
        uint256 totalUnderlyingAssets;
        uint256 totalVaultTokens;
        uint256 minimumReserveRatio;
    }
    
    struct DepositEvent {
        address user;
        uint256 amount;
        uint256 vaultTokensMinted;
        uint256 timestamp;
        uint256 reserveRatioAfter;
    }
    
    struct WithdrawalEvent {
        address user;
        uint256 vaultTokensBurned;
        uint256 assetsReturned;
        uint256 timestamp;
        uint256 reserveRatioAfter;
    }
    
    /// @notice Deposit history mapping
    mapping(uint256 => DepositEvent) public depositHistory;
    
    /// @notice Withdrawal history mapping
    mapping(uint256 => WithdrawalEvent) public withdrawalHistory;

    // ============ Events ============
    
    event Deposit(
        address indexed user,
        uint256 amount,
        uint256 vaultTokens,
        uint256 reserveRatio,
        uint256 timestamp
    );
    
    event Withdrawal(
        address indexed user,
        uint256 vaultTokens,
        uint256 assetsReturned,
        uint256 reserveRatio,
        uint256 timestamp
    );
    
    event EmergencyPause(
        address indexed triggeredBy,
        uint256 timestamp
    );
    
    event Unpause(
        address indexed triggeredBy,
        uint256 timestamp
    );
    
    event ReserveRatioAdjusted(
        uint256 oldRatio,
        uint256 newRatio,
        uint256 timestamp
    );

    // ============ Errors ============
    
    error InvalidAmount();
    error InsufficientBalance();
    error ReserveRatioTooLow();
    error InvalidReserveRatio();
    error ZeroAddress();

    // ============ Initialization ============
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @notice Initialize the vault
     * @param _underlyingAsset Address of the underlying asset
     * @param _minimumReserveRatio Minimum reserve ratio in basis points
     * @param _admin Address of the admin
     */
    function initialize(
        address _underlyingAsset,
        uint256 _minimumReserveRatio,
        address _admin
    ) public initializer {
        if (_underlyingAsset == address(0) || _admin == address(0)) {
            revert ZeroAddress();
        }
        if (_minimumReserveRatio < 1000 || _minimumReserveRatio > 5000) {
            revert InvalidReserveRatio();
        }
        
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        underlyingAsset = IERC20(_underlyingAsset);
        minimumReserveRatio = _minimumReserveRatio;
        reserveRatio = 10000; // Start at 100%
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }

    // ============ Core Functions ============
    
    /**
     * @notice Deposit underlying assets and mint vault tokens
     * @param amount Amount of underlying assets to deposit
     * @return vaultTokensMinted Amount of vault tokens minted
     * @dev Implements task 1.1.1: Core deposit function with vault token minting
     */
    function deposit(uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
        returns (uint256 vaultTokensMinted) 
    {
        if (amount == 0) revert InvalidAmount();
        
        // Transfer underlying asset from user
        underlyingAsset.safeTransferFrom(msg.sender, address(this), amount);
        
        // Calculate vault tokens to mint
        if (totalVaultTokens == 0 || totalUnderlyingAssets == 0) {
            // First deposit: 1:1 ratio
            vaultTokensMinted = amount;
        } else {
            // Subsequent deposits: proportional to existing ratio
            vaultTokensMinted = (amount * totalVaultTokens) / totalUnderlyingAssets;
        }
        
        // Update state
        vaultTokenBalances[msg.sender] += vaultTokensMinted;
        totalVaultTokens += vaultTokensMinted;
        totalUnderlyingAssets += amount;
        totalDeposits += amount;
        totalLiabilities += amount;
        
        // Recalculate reserve ratio
        _updateReserveRatio();
        
        // Store deposit event
        depositHistory[depositCount] = DepositEvent({
            user: msg.sender,
            amount: amount,
            vaultTokensMinted: vaultTokensMinted,
            timestamp: block.timestamp,
            reserveRatioAfter: reserveRatio
        });
        depositCount++;
        
        emit Deposit(msg.sender, amount, vaultTokensMinted, reserveRatio, block.timestamp);
        
        return vaultTokensMinted;
    }
    
    /**
     * @notice Withdraw underlying assets by burning vault tokens
     * @param vaultTokenAmount Amount of vault tokens to burn
     * @return assetsReturned Amount of underlying assets returned
     * @dev Implements task 1.1.2: Withdraw function with reserve ratio validation
     */
    function withdraw(uint256 vaultTokenAmount) 
        external 
        whenNotPaused 
        nonReentrant 
        returns (uint256 assetsReturned) 
    {
        if (vaultTokenAmount == 0) revert InvalidAmount();
        if (vaultTokenBalances[msg.sender] < vaultTokenAmount) {
            revert InsufficientBalance();
        }
        
        // Calculate assets to return
        assetsReturned = (vaultTokenAmount * totalUnderlyingAssets) / totalVaultTokens;
        
        // Check reserve ratio after withdrawal
        uint256 newTotalAssets = totalUnderlyingAssets - assetsReturned;
        uint256 newTotalLiabilities = totalLiabilities - assetsReturned;
        
        uint256 newReserveRatio;
        if (newTotalLiabilities == 0) {
            newReserveRatio = 10000; // 100%
        } else {
            newReserveRatio = (newTotalAssets * 10000) / newTotalLiabilities;
        }
        
        if (newReserveRatio < minimumReserveRatio) {
            revert ReserveRatioTooLow();
        }
        
        // Update state
        vaultTokenBalances[msg.sender] -= vaultTokenAmount;
        totalVaultTokens -= vaultTokenAmount;
        totalUnderlyingAssets -= assetsReturned;
        totalLiabilities -= assetsReturned;
        
        // Recalculate reserve ratio
        _updateReserveRatio();
        
        // Transfer assets to user
        underlyingAsset.safeTransfer(msg.sender, assetsReturned);
        
        // Store withdrawal event
        withdrawalHistory[withdrawalCount] = WithdrawalEvent({
            user: msg.sender,
            vaultTokensBurned: vaultTokenAmount,
            assetsReturned: assetsReturned,
            timestamp: block.timestamp,
            reserveRatioAfter: reserveRatio
        });
        withdrawalCount++;
        
        emit Withdrawal(msg.sender, vaultTokenAmount, assetsReturned, reserveRatio, block.timestamp);
        
        return assetsReturned;
    }
    
    /**
     * @notice Calculate current reserve ratio
     * @return Current reserve ratio in basis points
     * @dev Implements task 1.1.3: Reserve ratio calculation logic
     */
    function calculateReserveRatio() public view returns (uint256) {
        if (totalLiabilities == 0) {
            return 10000; // 100% if no liabilities
        }
        return (totalUnderlyingAssets * 10000) / totalLiabilities;
    }
    
    /**
     * @notice Internal function to update reserve ratio
     */
    function _updateReserveRatio() internal {
        reserveRatio = calculateReserveRatio();
        lastReserveRatioUpdate = block.timestamp;
    }
    
    /**
     * @notice Emergency pause all deposits and withdrawals
     * @dev Implements task 1.1.4: Emergency pause functionality
     */
    function emergencyPause() external onlyRole(RISK_GUARDIAN_ROLE) {
        _pause();
        emit EmergencyPause(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Unpause the vault
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
        emit Unpause(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Adjust minimum reserve ratio
     * @param newRatio New minimum reserve ratio in basis points
     */
    function adjustMinimumReserveRatio(uint256 newRatio) 
        external 
        onlyRole(RISK_GUARDIAN_ROLE) 
    {
        if (newRatio < 1000 || newRatio > 5000) {
            revert InvalidReserveRatio();
        }
        
        uint256 oldRatio = minimumReserveRatio;
        minimumReserveRatio = newRatio;
        
        emit ReserveRatioAdjusted(oldRatio, newRatio, block.timestamp);
    }

    // ============ View Functions ============
    
    /**
     * @notice Get current vault state
     * @return Current vault state struct
     */
    function getVaultState() external view returns (VaultState memory) {
        return VaultState({
            reserveRatio: reserveRatio,
            totalDeposits: totalDeposits,
            totalLiabilities: totalLiabilities,
            paused: paused(),
            lastUpdate: lastReserveRatioUpdate,
            totalUnderlyingAssets: totalUnderlyingAssets,
            totalVaultTokens: totalVaultTokens,
            minimumReserveRatio: minimumReserveRatio
        });
    }
    
    /**
     * @notice Get user's vault token balance
     * @param user Address of the user
     * @return User's vault token balance
     */
    function balanceOf(address user) external view returns (uint256) {
        return vaultTokenBalances[user];
    }

    // ============ Admin Functions ============
    // Task 1.1.5: Role-based access control implementation
    
    /**
     * @notice Grant OPERATOR role
     * @param account Address to grant role to
     */
    function grantOperatorRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(OPERATOR_ROLE, account);
    }
    
    /**
     * @notice Grant RISK_GUARDIAN role
     * @param account Address to grant role to
     */
    function grantRiskGuardianRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(RISK_GUARDIAN_ROLE, account);
    }
    
    /**
     * @notice Revoke OPERATOR role
     * @param account Address to revoke role from
     */
    function revokeOperatorRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(OPERATOR_ROLE, account);
    }
    
    /**
     * @notice Revoke RISK_GUARDIAN role
     * @param account Address to revoke role from
     */
    function revokeRiskGuardianRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(RISK_GUARDIAN_ROLE, account);
    }

    // ============ Upgrade Authorization ============
    
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(ADMIN_ROLE) 
    {}
}
