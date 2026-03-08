// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title ConfidentialTreasuryManager
 * @notice Manages treasury rebalancing with encrypted strategies on Oasis Sapphire
 * @dev Strategy details remain confidential to prevent front-running
 */
contract ConfidentialTreasuryManager is 
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable 
{
    bytes32 public constant TREASURY_OPERATOR_ROLE = keccak256("TREASURY_OPERATOR_ROLE");
    bytes32 public constant STRATEGY_MANAGER_ROLE = keccak256("STRATEGY_MANAGER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    struct EncryptedStrategy {
        bytes encryptedAllocation;
        bytes encryptedRebalanceThreshold;
        bytes encryptedSlippageTolerance;
        uint256 lastExecuted;
        uint256 lastUpdated;
        address updatedBy;
        bool active;
    }

    struct RebalanceExecution {
        uint256 timestamp;
        address executor;
        uint256 deviation;
        bytes32 instructionHash;
        bool approved;
    }

    EncryptedStrategy private strategy;
    RebalanceExecution[] public rebalanceHistory;
    
    uint256 public constant MAX_HISTORY = 500;
    uint256 public constant MIN_REBALANCE_INTERVAL = 1 hours;
    
    mapping(bytes32 => bool) public approvedInstructions;

    event StrategyUpdated(uint256 timestamp, address indexed updatedBy);
    event RebalanceExecuted(
        uint256 indexed timestamp,
        address indexed executor,
        uint256 deviation,
        bytes32 instructionHash
    );
    event RebalanceApproved(bytes32 indexed instructionHash, uint256 timestamp);
    event StrategyActivated(uint256 timestamp);
    event StrategyDeactivated(uint256 timestamp);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STRATEGY_MANAGER_ROLE, msg.sender);
        _grantRole(TREASURY_OPERATOR_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);

        _setDefaultStrategy();
    }

    /**
     * @notice Set default strategy during initialization
     * @dev Encrypts default allocation: [40%, 30%, 20%, 10%]
     */
    function _setDefaultStrategy() private {
        uint256[] memory defaultAllocation = new uint256[](4);
        defaultAllocation[0] = 40; // 40%
        defaultAllocation[1] = 30; // 30%
        defaultAllocation[2] = 20; // 20%
        defaultAllocation[3] = 10; // 10%

        bytes memory allocationData = abi.encode(defaultAllocation);
        bytes memory thresholdData = abi.encode(uint256(5)); // 5% deviation threshold
        bytes memory slippageData = abi.encode(uint256(1)); // 1% slippage tolerance

        strategy = EncryptedStrategy({
            encryptedAllocation: Sapphire.encrypt(bytes32(0), 0, allocationData, ""),
            encryptedRebalanceThreshold: Sapphire.encrypt(bytes32(0), 0, thresholdData, ""),
            encryptedSlippageTolerance: Sapphire.encrypt(bytes32(0), 0, slippageData, ""),
            lastExecuted: 0,
            lastUpdated: block.timestamp,
            updatedBy: msg.sender,
            active: true
        });
    }

    /**
     * @notice Update treasury strategy (encrypted)
     * @param encryptedAllocation Encrypted target allocation percentages
     * @param encryptedRebalanceThreshold Encrypted rebalance trigger threshold
     * @param encryptedSlippageTolerance Encrypted slippage tolerance
     */
    function updateStrategy(
        bytes calldata encryptedAllocation,
        bytes calldata encryptedRebalanceThreshold,
        bytes calldata encryptedSlippageTolerance
    ) external onlyRole(STRATEGY_MANAGER_ROLE) {
        require(encryptedAllocation.length > 0, "Invalid allocation");
        require(encryptedRebalanceThreshold.length > 0, "Invalid threshold");
        require(encryptedSlippageTolerance.length > 0, "Invalid slippage");

        strategy.encryptedAllocation = encryptedAllocation;
        strategy.encryptedRebalanceThreshold = encryptedRebalanceThreshold;
        strategy.encryptedSlippageTolerance = encryptedSlippageTolerance;
        strategy.lastUpdated = block.timestamp;
        strategy.updatedBy = msg.sender;

        emit StrategyUpdated(block.timestamp, msg.sender);
    }

    /**
     * @notice Execute rebalance calculation in TEE
     * @param currentBalances Current asset balances
     * @param currentPrices Current asset prices
     * @return encryptedInstructions Encrypted trade instructions
     */
    function executeRebalance(
        uint256[] calldata currentBalances,
        uint256[] calldata currentPrices
    ) external onlyRole(TREASURY_OPERATOR_ROLE) nonReentrant returns (bytes memory encryptedInstructions) {
        require(strategy.active, "Strategy not active");
        require(currentBalances.length == currentPrices.length, "Array length mismatch");
        require(currentBalances.length > 0, "Empty arrays");
        require(
            block.timestamp >= strategy.lastExecuted + MIN_REBALANCE_INTERVAL,
            "Rebalance too soon"
        );

        // Decrypt strategy in TEE
        uint256[] memory targetAllocation = abi.decode(
            Sapphire.decrypt(bytes32(0), 0, strategy.encryptedAllocation, ""),
            (uint256[])
        );

        uint256 rebalanceThreshold = abi.decode(
            Sapphire.decrypt(bytes32(0), 0, strategy.encryptedRebalanceThreshold, ""),
            (uint256)
        );

        require(currentBalances.length == targetAllocation.length, "Allocation mismatch");

        // Calculate current allocation percentages
        uint256 totalValue = 0;
        for (uint i = 0; i < currentBalances.length; i++) {
            totalValue += currentBalances[i] * currentPrices[i] / 1e18;
        }
        require(totalValue > 0, "Zero total value");

        // Calculate deviation from target
        uint256 maxDeviation = 0;
        for (uint i = 0; i < currentBalances.length; i++) {
            uint256 currentPercent = (currentBalances[i] * currentPrices[i] * 100) / (totalValue * 1e18);
            uint256 deviation = currentPercent > targetAllocation[i] 
                ? currentPercent - targetAllocation[i]
                : targetAllocation[i] - currentPercent;
            
            if (deviation > maxDeviation) {
                maxDeviation = deviation;
            }
        }

        require(maxDeviation >= rebalanceThreshold, "Rebalance not needed");

        // Calculate required trades privately
        (uint256[] memory buyAmounts, uint256[] memory sellAmounts) = 
            _calculateRebalanceTrades(currentBalances, currentPrices, targetAllocation, totalValue);

        // Encrypt trade instructions
        bytes memory instructions = abi.encode(buyAmounts, sellAmounts);
        encryptedInstructions = Sapphire.encrypt(bytes32(0), 0, instructions, "");

        // Update execution timestamp
        strategy.lastExecuted = block.timestamp;

        // Record execution
        bytes32 instructionHash = keccak256(encryptedInstructions);
        _recordRebalance(msg.sender, maxDeviation, instructionHash);

        emit RebalanceExecuted(block.timestamp, msg.sender, maxDeviation, instructionHash);

        return encryptedInstructions;
    }

    /**
     * @notice Calculate rebalance trades in TEE
     * @param currentBalances Current asset balances
     * @param currentPrices Current asset prices
     * @param targetAllocation Target allocation percentages
     * @param totalValue Total portfolio value
     * @return buyAmounts Amounts to buy for each asset
     * @return sellAmounts Amounts to sell for each asset
     */
    function _calculateRebalanceTrades(
        uint256[] memory currentBalances,
        uint256[] memory currentPrices,
        uint256[] memory targetAllocation,
        uint256 totalValue
    ) private pure returns (uint256[] memory buyAmounts, uint256[] memory sellAmounts) {
        uint256 length = currentBalances.length;
        buyAmounts = new uint256[](length);
        sellAmounts = new uint256[](length);

        for (uint i = 0; i < length; i++) {
            uint256 targetValue = (totalValue * targetAllocation[i]) / 100;
            uint256 currentValue = (currentBalances[i] * currentPrices[i]) / 1e18;

            if (currentValue < targetValue) {
                // Need to buy
                uint256 buyValue = targetValue - currentValue;
                buyAmounts[i] = (buyValue * 1e18) / currentPrices[i];
                sellAmounts[i] = 0;
            } else if (currentValue > targetValue) {
                // Need to sell
                uint256 sellValue = currentValue - targetValue;
                sellAmounts[i] = (sellValue * 1e18) / currentPrices[i];
                buyAmounts[i] = 0;
            } else {
                buyAmounts[i] = 0;
                sellAmounts[i] = 0;
            }
        }

        return (buyAmounts, sellAmounts);
    }

    /**
     * @notice Record rebalance execution in history
     * @param executor Address that executed rebalance
     * @param deviation Maximum deviation from target
     * @param instructionHash Hash of encrypted instructions
     */
    function _recordRebalance(
        address executor,
        uint256 deviation,
        bytes32 instructionHash
    ) private {
        if (rebalanceHistory.length >= MAX_HISTORY) {
            // Remove oldest entry
            for (uint i = 0; i < rebalanceHistory.length - 1; i++) {
                rebalanceHistory[i] = rebalanceHistory[i + 1];
            }
            rebalanceHistory.pop();
        }

        rebalanceHistory.push(RebalanceExecution({
            timestamp: block.timestamp,
            executor: executor,
            deviation: deviation,
            instructionHash: instructionHash,
            approved: false
        }));
    }

    /**
     * @notice Approve rebalance instructions for execution
     * @param instructionHash Hash of instructions to approve
     */
    function approveRebalanceInstructions(bytes32 instructionHash) 
        external 
        onlyRole(GOVERNANCE_ROLE) 
    {
        require(!approvedInstructions[instructionHash], "Already approved");
        
        approvedInstructions[instructionHash] = true;

        // Update approval status in history
        for (uint i = 0; i < rebalanceHistory.length; i++) {
            if (rebalanceHistory[i].instructionHash == instructionHash) {
                rebalanceHistory[i].approved = true;
                break;
            }
        }

        emit RebalanceApproved(instructionHash, block.timestamp);
    }

    /**
     * @notice Activate strategy
     */
    function activateStrategy() external onlyRole(STRATEGY_MANAGER_ROLE) {
        require(!strategy.active, "Already active");
        strategy.active = true;
        emit StrategyActivated(block.timestamp);
    }

    /**
     * @notice Deactivate strategy
     */
    function deactivateStrategy() external onlyRole(STRATEGY_MANAGER_ROLE) {
        require(strategy.active, "Already inactive");
        strategy.active = false;
        emit StrategyDeactivated(block.timestamp);
    }

    /**
     * @notice Get strategy metadata (without revealing values)
     * @return lastExecuted Timestamp of last execution
     * @return lastUpdated Timestamp of last update
     * @return updatedBy Address that last updated strategy
     * @return active Whether strategy is active
     */
    function getStrategyMetadata() 
        external 
        view 
        returns (
            uint256 lastExecuted,
            uint256 lastUpdated,
            address updatedBy,
            bool active
        ) 
    {
        return (
            strategy.lastExecuted,
            strategy.lastUpdated,
            strategy.updatedBy,
            strategy.active
        );
    }

    /**
     * @notice Get rebalance history count
     * @return count Number of rebalances recorded
     */
    function getRebalanceHistoryCount() external view returns (uint256) {
        return rebalanceHistory.length;
    }

    /**
     * @notice Get rebalance execution details
     * @param index Index in history array
     * @return execution The rebalance execution record
     */
    function getRebalanceExecution(uint256 index) 
        external 
        view 
        returns (RebalanceExecution memory) 
    {
        require(index < rebalanceHistory.length, "Invalid index");
        return rebalanceHistory[index];
    }

    /**
     * @notice Get recent rebalance executions
     * @param count Number of recent executions to retrieve
     * @return executions Array of recent executions
     */
    function getRecentRebalances(uint256 count) 
        external 
        view 
        returns (RebalanceExecution[] memory executions) 
    {
        uint256 length = rebalanceHistory.length;
        uint256 returnCount = count > length ? length : count;
        
        executions = new RebalanceExecution[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            executions[i] = rebalanceHistory[length - returnCount + i];
        }
        
        return executions;
    }

    /**
     * @notice Check if instructions are approved
     * @param instructionHash Hash of instructions
     * @return approved Whether instructions are approved
     */
    function isApproved(bytes32 instructionHash) external view returns (bool) {
        return approvedInstructions[instructionHash];
    }
}
