// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface ITokenizedVault {
    function emergencyPause() external;
    function adjustMinimumReserveRatio(uint256 newRatio) external;
    function calculateReserveRatio() external view returns (uint256);
}

interface IGovernanceModule {
    function createEmergencyProposal(
        string calldata title,
        string calldata description,
        address targetContract,
        bytes calldata callData,
        uint256 riskScore,
        string calldata aiReasoning
    ) external returns (uint256);
}

/**
 * @title RiskGuardian
 * @notice Receives risk signals from authorized CRE workflows and executes automated safeguard actions
 * @dev Implements tasks 1.2.1 through 1.2.8
 */
contract RiskGuardian is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // ============ Roles ============
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    // ============ State Variables ============
    
    /// @notice Mapping of authorized CRE workflow addresses
    mapping(address => bool) public authorizedCREWorkflows;
    
    /// @notice Array of authorized CRE workflow addresses
    address[] public creWorkflowList;
    
    /// @notice Risk threshold for moderate risk (basis points)
    uint256 public moderateRiskThreshold;
    
    /// @notice Risk threshold for elevated risk (basis points)
    uint256 public elevatedRiskThreshold;
    
    /// @notice Risk threshold for critical risk (basis points)
    uint256 public criticalRiskThreshold;
    
    /// @notice Cooldown period between safeguard executions (seconds)
    uint256 public safeguardCooldown;
    
    /// @notice Timestamp of last safeguard execution
    uint256 public lastSafeguardExecution;
    
    /// @notice Reference to TokenizedVault contract
    ITokenizedVault public vaultContract;
    
    /// @notice Reference to GovernanceModule contract
    IGovernanceModule public governanceContract;

    // ============ Structs ============
    
    struct RiskSignal {
        uint256 riskScore;
        string recommendedAction;
        uint256 confidence;
        string reasoning;
        uint256 timestamp;
        address triggeredBy;
    }
    
    /// @notice Array of risk signal history
    RiskSignal[] public riskSignalHistory;

    // ============ Events ============
    
    event RiskResponseExecuted(
        uint256 indexed riskScore,
        string action,
        uint256 confidence,
        address triggeredBy,
        uint256 timestamp
    );
    
    event CriticalSafeguardActivated(
        uint256 riskScore,
        string reasoning,
        uint256 timestamp
    );
    
    event ElevatedSafeguardActivated(
        uint256 oldRatio,
        uint256 newRatio,
        uint256 timestamp
    );
    
    event CREWorkflowAuthorized(
        address indexed workflow,
        uint256 timestamp
    );
    
    event CREWorkflowRevoked(
        address indexed workflow,
        uint256 timestamp
    );
    
    event UnauthorizedAccessAttempt(
        address indexed attacker,
        uint256 timestamp
    );
    
    event ThresholdsUpdated(
        uint256 moderate,
        uint256 elevated,
        uint256 critical,
        uint256 timestamp
    );

    // ============ Errors ============
    
    error UnauthorizedCREWorkflow();
    error InvalidRiskScore();
    error InvalidConfidence();
    error CooldownActive();
    error InvalidThresholds();
    error ZeroAddress();

    // ============ Modifiers ============
    
    modifier onlyAuthorizedCRE() {
        if (!authorizedCREWorkflows[msg.sender]) {
            emit UnauthorizedAccessAttempt(msg.sender, block.timestamp);
            revert UnauthorizedCREWorkflow();
        }
        _;
    }
    
    modifier cooldownElapsed() {
        if (block.timestamp < lastSafeguardExecution + safeguardCooldown) {
            revert CooldownActive();
        }
        _;
    }

    // ============ Initialization ============
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @notice Initialize the RiskGuardian
     * @param _vaultContract Address of TokenizedVault
     * @param _admin Address of admin
     */
    function initialize(
        address _vaultContract,
        address _admin
    ) public initializer {
        if (_vaultContract == address(0) || _admin == address(0)) {
            revert ZeroAddress();
        }
        
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        vaultContract = ITokenizedVault(_vaultContract);
        
        // Set default thresholds
        moderateRiskThreshold = 60;
        elevatedRiskThreshold = 80;
        criticalRiskThreshold = 90;
        safeguardCooldown = 3600; // 1 hour
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }

    // ============ Core Functions ============
    
    /**
     * @notice Execute risk response based on AI assessment
     * @param riskScore Risk score from 0-100
     * @param recommendedAction Recommended action string
     * @param confidence Confidence level from 0-100
     * @param reasoning AI reasoning for the assessment
     * @dev Implements task 1.2.2: executeRiskResponse function with threshold logic
     */
    function executeRiskResponse(
        uint256 riskScore,
        string calldata recommendedAction,
        uint256 confidence,
        string calldata reasoning
    ) external onlyAuthorizedCRE cooldownElapsed nonReentrant {
        // Validate inputs
        if (riskScore > 100) revert InvalidRiskScore();
        if (confidence > 100) revert InvalidConfidence();
        
        // Store risk signal in history
        riskSignalHistory.push(RiskSignal({
            riskScore: riskScore,
            recommendedAction: recommendedAction,
            confidence: confidence,
            reasoning: reasoning,
            timestamp: block.timestamp,
            triggeredBy: msg.sender
        }));
        
        // Update last execution timestamp
        lastSafeguardExecution = block.timestamp;
        
        // Determine and execute action based on risk score
        if (riskScore >= criticalRiskThreshold) {
            _executeCriticalSafeguard(riskScore, reasoning);
        } else if (riskScore >= elevatedRiskThreshold) {
            _executeElevatedSafeguard(riskScore);
        } else if (riskScore >= moderateRiskThreshold) {
            // Moderate risk: emit warning only
        }
        
        emit RiskResponseExecuted(
            riskScore,
            recommendedAction,
            confidence,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @notice Execute critical safeguard (emergency pause)
     * @param riskScore Current risk score
     * @param reasoning AI reasoning
     * @dev Implements task 1.2.3: Critical safeguard execution
     */
    function _executeCriticalSafeguard(
        uint256 riskScore,
        string memory reasoning
    ) internal {
        // Trigger emergency pause on vault
        vaultContract.emergencyPause();
        
        emit CriticalSafeguardActivated(riskScore, reasoning, block.timestamp);
        
        // If risk score >= 95, also trigger emergency governance
        if (riskScore >= 95 && address(governanceContract) != address(0)) {
            try governanceContract.createEmergencyProposal(
                "Critical Risk: Emergency Response Required",
                reasoning,
                address(vaultContract),
                "", // callData determined by governance
                riskScore,
                reasoning
            ) {} catch {
                // Governance creation failed, but pause is still active
            }
        }
    }
    
    /**
     * @notice Execute elevated safeguard (adjust reserve ratio)
     * @dev Implements task 1.2.4: Elevated safeguard execution
     */
    function _executeElevatedSafeguard(uint256 /* riskScore */) internal {
        // Get current reserve ratio
        uint256 currentRatio = vaultContract.calculateReserveRatio();
        
        // Calculate new conservative reserve ratio (increase by 50%)
        uint256 newRatio = (currentRatio * 150) / 100;
        
        // Cap at 50% (5000 basis points)
        if (newRatio > 5000) {
            newRatio = 5000;
        }
        
        // Ensure minimum of 30% (3000 basis points) for elevated risk
        if (newRatio < 3000) {
            newRatio = 3000;
        }
        
        // Adjust vault's minimum reserve ratio
        vaultContract.adjustMinimumReserveRatio(newRatio);
        
        emit ElevatedSafeguardActivated(currentRatio, newRatio, block.timestamp);
    }

    // ============ CRE Authorization Management ============
    // Task 1.2.1: CRE workflow authorization system
    
    /**
     * @notice Add authorized CRE workflow
     * @param workflowAddress Address of CRE workflow
     */
    function addAuthorizedCREWorkflow(address workflowAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (workflowAddress == address(0)) revert ZeroAddress();
        if (authorizedCREWorkflows[workflowAddress]) return;
        
        authorizedCREWorkflows[workflowAddress] = true;
        creWorkflowList.push(workflowAddress);
        
        emit CREWorkflowAuthorized(workflowAddress, block.timestamp);
    }
    
    /**
     * @notice Remove authorized CRE workflow
     * @param workflowAddress Address of CRE workflow
     */
    function removeAuthorizedCREWorkflow(address workflowAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (!authorizedCREWorkflows[workflowAddress]) return;
        
        authorizedCREWorkflows[workflowAddress] = false;
        
        // Remove from array
        for (uint256 i = 0; i < creWorkflowList.length; i++) {
            if (creWorkflowList[i] == workflowAddress) {
                creWorkflowList[i] = creWorkflowList[creWorkflowList.length - 1];
                creWorkflowList.pop();
                break;
            }
        }
        
        emit CREWorkflowRevoked(workflowAddress, block.timestamp);
    }

    // ============ View Functions ============
    // Task 1.2.6: Risk signal audit log storage
    
    /**
     * @notice Get risk signal history
     * @param count Number of recent signals to return
     * @return Array of recent risk signals
     */
    function getRiskSignalHistory(uint256 count) 
        external 
        view 
        returns (RiskSignal[] memory) 
    {
        uint256 length = riskSignalHistory.length;
        uint256 returnCount = count > length ? length : count;
        
        RiskSignal[] memory signals = new RiskSignal[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            signals[i] = riskSignalHistory[length - returnCount + i];
        }
        
        return signals;
    }
    
    /**
     * @notice Get all authorized CRE workflows
     * @return Array of authorized workflow addresses
     */
    function getAuthorizedWorkflows() external view returns (address[] memory) {
        return creWorkflowList;
    }
    
    /**
     * @notice Check if address is authorized CRE workflow
     * @param workflow Address to check
     * @return True if authorized
     */
    function isAuthorizedWorkflow(address workflow) external view returns (bool) {
        return authorizedCREWorkflows[workflow];
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Update risk thresholds
     * @param moderate Moderate risk threshold
     * @param elevated Elevated risk threshold
     * @param critical Critical risk threshold
     */
    function updateThresholds(
        uint256 moderate,
        uint256 elevated,
        uint256 critical
    ) external onlyRole(ADMIN_ROLE) {
        if (moderate >= elevated || elevated >= critical || critical > 100) {
            revert InvalidThresholds();
        }
        
        moderateRiskThreshold = moderate;
        elevatedRiskThreshold = elevated;
        criticalRiskThreshold = critical;
        
        emit ThresholdsUpdated(moderate, elevated, critical, block.timestamp);
    }
    
    /**
     * @notice Set governance contract address
     * @param _governanceContract Address of governance contract
     */
    function setGovernanceContract(address _governanceContract) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (_governanceContract == address(0)) revert ZeroAddress();
        governanceContract = IGovernanceModule(_governanceContract);
    }
    
    /**
     * @notice Update safeguard cooldown period
     * @param newCooldown New cooldown in seconds
     */
    function updateSafeguardCooldown(uint256 newCooldown) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        safeguardCooldown = newCooldown;
    }

    // ============ Upgrade Authorization ============
    
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(ADMIN_ROLE) 
    {}
}
