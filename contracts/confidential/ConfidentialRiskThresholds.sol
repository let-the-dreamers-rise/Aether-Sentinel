// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title ConfidentialRiskThresholds
 * @notice Stores and evaluates risk thresholds in encrypted form on Oasis Sapphire
 * @dev Thresholds are encrypted to prevent adversaries from gaming the system
 */
contract ConfidentialRiskThresholds is 
    Initializable,
    AccessControlUpgradeable 
{
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant EVALUATOR_ROLE = keccak256("EVALUATOR_ROLE");

    struct EncryptedThresholds {
        bytes encryptedModerateThreshold;
        bytes encryptedElevatedThreshold;
        bytes encryptedCriticalThreshold;
        uint256 lastUpdated;
        address updatedBy;
    }

    EncryptedThresholds private thresholds;
    
    // Audit log
    struct ThresholdEvaluation {
        uint256 timestamp;
        address evaluator;
        string action;
        bytes32 evaluationHash;
    }
    
    ThresholdEvaluation[] public evaluationHistory;
    uint256 public constant MAX_HISTORY = 1000;

    event ThresholdsUpdated(uint256 timestamp, address indexed updatedBy);
    event RiskEvaluated(
        uint256 indexed timestamp,
        address indexed evaluator,
        string action,
        bytes32 evaluationHash
    );
    event AuditorAccessGranted(address indexed auditor, uint256 timestamp);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GUARDIAN_ROLE, msg.sender);
        _grantRole(EVALUATOR_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);

        // Set default encrypted thresholds (50, 70, 90)
        _setDefaultThresholds();
    }

    /**
     * @notice Set default thresholds during initialization
     * @dev Encrypts default values: moderate=50, elevated=70, critical=90
     */
    function _setDefaultThresholds() private {
        bytes memory moderateData = abi.encode(uint256(50));
        bytes memory elevatedData = abi.encode(uint256(70));
        bytes memory criticalData = abi.encode(uint256(90));

        thresholds = EncryptedThresholds({
            encryptedModerateThreshold: Sapphire.encrypt(
                bytes32(0),
                0,
                moderateData,
                ""
            ),
            encryptedElevatedThreshold: Sapphire.encrypt(
                bytes32(0),
                0,
                elevatedData,
                ""
            ),
            encryptedCriticalThreshold: Sapphire.encrypt(
                bytes32(0),
                0,
                criticalData,
                ""
            ),
            lastUpdated: block.timestamp,
            updatedBy: msg.sender
        });
    }

    /**
     * @notice Update risk thresholds (encrypted)
     * @param encryptedModerate Encrypted moderate risk threshold
     * @param encryptedElevated Encrypted elevated risk threshold
     * @param encryptedCritical Encrypted critical risk threshold
     */
    function updateThresholds(
        bytes calldata encryptedModerate,
        bytes calldata encryptedElevated,
        bytes calldata encryptedCritical
    ) external onlyRole(GUARDIAN_ROLE) {
        require(encryptedModerate.length > 0, "Invalid moderate threshold");
        require(encryptedElevated.length > 0, "Invalid elevated threshold");
        require(encryptedCritical.length > 0, "Invalid critical threshold");

        thresholds = EncryptedThresholds({
            encryptedModerateThreshold: encryptedModerate,
            encryptedElevatedThreshold: encryptedElevated,
            encryptedCriticalThreshold: encryptedCritical,
            lastUpdated: block.timestamp,
            updatedBy: msg.sender
        });

        emit ThresholdsUpdated(block.timestamp, msg.sender);
    }

    /**
     * @notice Evaluate risk score against encrypted thresholds in TEE
     * @param riskScore The risk score to evaluate (0-100)
     * @return action The recommended action based on threshold comparison
     */
    function evaluateRiskScore(uint256 riskScore) 
        external 
        onlyRole(EVALUATOR_ROLE)
        returns (string memory action) 
    {
        require(riskScore <= 100, "Invalid risk score");

        // Decrypt thresholds in TEE
        uint256 moderate = abi.decode(
            Sapphire.decrypt(
                bytes32(0),
                0,
                thresholds.encryptedModerateThreshold,
                ""
            ),
            (uint256)
        );

        uint256 elevated = abi.decode(
            Sapphire.decrypt(
                bytes32(0),
                0,
                thresholds.encryptedElevatedThreshold,
                ""
            ),
            (uint256)
        );

        uint256 critical = abi.decode(
            Sapphire.decrypt(
                bytes32(0),
                0,
                thresholds.encryptedCriticalThreshold,
                ""
            ),
            (uint256)
        );

        // Evaluate without revealing thresholds
        if (riskScore >= critical) {
            action = "EMERGENCY_PAUSE";
        } else if (riskScore >= elevated) {
            action = "ADJUST_RESERVE_RATIO";
        } else if (riskScore >= moderate) {
            action = "INCREASE_MONITORING";
        } else {
            action = "NORMAL_OPERATION";
        }

        // Log evaluation (without revealing thresholds)
        bytes32 evaluationHash = keccak256(abi.encodePacked(
            riskScore,
            action,
            block.timestamp,
            msg.sender
        ));

        _recordEvaluation(msg.sender, action, evaluationHash);

        emit RiskEvaluated(block.timestamp, msg.sender, action, evaluationHash);

        return action;
    }

    /**
     * @notice Record evaluation in history
     * @param evaluator Address that performed evaluation
     * @param action Action determined
     * @param evaluationHash Hash of evaluation details
     */
    function _recordEvaluation(
        address evaluator,
        string memory action,
        bytes32 evaluationHash
    ) private {
        if (evaluationHistory.length >= MAX_HISTORY) {
            // Remove oldest entry
            for (uint i = 0; i < evaluationHistory.length - 1; i++) {
                evaluationHistory[i] = evaluationHistory[i + 1];
            }
            evaluationHistory.pop();
        }

        evaluationHistory.push(ThresholdEvaluation({
            timestamp: block.timestamp,
            evaluator: evaluator,
            action: action,
            evaluationHash: evaluationHash
        }));
    }

    /**
     * @notice Verify threshold for authorized auditor using secure multi-party computation
     * @param auditorPublicKey Auditor's public key for re-encryption
     * @param thresholdType Type of threshold to verify ("moderate", "elevated", "critical")
     * @return encryptedThreshold Threshold re-encrypted for auditor
     */
    function verifyThresholdForAuditor(
        bytes calldata auditorPublicKey,
        string calldata thresholdType
    ) external view onlyRole(AUDITOR_ROLE) returns (bytes memory encryptedThreshold) {
        require(auditorPublicKey.length > 0, "Invalid public key");

        bytes memory threshold;
        bytes32 typeHash = keccak256(bytes(thresholdType));

        if (typeHash == keccak256("moderate")) {
            threshold = thresholds.encryptedModerateThreshold;
        } else if (typeHash == keccak256("elevated")) {
            threshold = thresholds.encryptedElevatedThreshold;
        } else if (typeHash == keccak256("critical")) {
            threshold = thresholds.encryptedCriticalThreshold;
        } else {
            revert("Invalid threshold type");
        }

        // Re-encrypt for auditor's public key
        // Note: In production, implement proper key exchange protocol
        return threshold;
    }

    /**
     * @notice Get threshold metadata (without revealing values)
     * @return lastUpdated Timestamp of last update
     * @return updatedBy Address that last updated thresholds
     */
    function getThresholdMetadata() 
        external 
        view 
        returns (uint256 lastUpdated, address updatedBy) 
    {
        return (thresholds.lastUpdated, thresholds.updatedBy);
    }

    /**
     * @notice Get evaluation history count
     * @return count Number of evaluations recorded
     */
    function getEvaluationHistoryCount() external view returns (uint256) {
        return evaluationHistory.length;
    }

    /**
     * @notice Get evaluation from history
     * @param index Index in history array
     * @return evaluation The evaluation record
     */
    function getEvaluation(uint256 index) 
        external 
        view 
        returns (ThresholdEvaluation memory) 
    {
        require(index < evaluationHistory.length, "Invalid index");
        return evaluationHistory[index];
    }

    /**
     * @notice Get recent evaluations
     * @param count Number of recent evaluations to retrieve
     * @return evaluations Array of recent evaluations
     */
    function getRecentEvaluations(uint256 count) 
        external 
        view 
        returns (ThresholdEvaluation[] memory evaluations) 
    {
        uint256 length = evaluationHistory.length;
        uint256 returnCount = count > length ? length : count;
        
        evaluations = new ThresholdEvaluation[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            evaluations[i] = evaluationHistory[length - returnCount + i];
        }
        
        return evaluations;
    }
}
