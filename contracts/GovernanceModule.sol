// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title IWorldID
 * @notice Interface for World ID verification
 */
interface IWorldID {
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}

/**
 * @title GovernanceModule
 * @notice Manages World ID verified governance proposals, voting, and emergency overrides
 * @dev Implements human-verified governance with sybil resistance
 */
contract GovernanceModule is 
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    // ============ Roles ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CRE_ROLE = keccak256("CRE_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // ============ Enums ============
    enum ProposalStatus {
        Active,
        Succeeded,
        Defeated,
        Executed,
        Cancelled
    }

    // ============ Structs ============
    struct Vote {
        bool support;
        uint256 nullifierHash;
        uint256 timestamp;
    }

    struct Proposal {
        uint256 proposalId;
        address proposer;
        string title;
        string description;
        address targetContract;
        bytes callData;
        uint256 creationTime;
        uint256 votingEndTime;
        ProposalStatus status;
        uint256 votesFor;
        uint256 votesAgainst;
        mapping(address => Vote) votes;
        mapping(uint256 => bool) usedNullifiers;
        address[] voters;
        bool isEmergency;
        uint256 riskScore;
        string aiReasoning;
    }

    // ============ State Variables ============
    IWorldID public worldId;
    uint256 public externalNullifierHash;
    uint256 public groupId;
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    // Governance parameters
    uint256 public quorumPercentage; // e.g., 40 = 40%
    uint256 public votingPeriod; // e.g., 7 days
    uint256 public emergencyVotingPeriod; // e.g., 24 hours
    uint256 public totalVerifiedHumans; // Updated via World ID oracle
    
    // Guardian multi-sig
    address public guardianMultiSig;
    mapping(uint256 => bool) public guardianOverrides;
    
    // Whitelisted target contracts
    mapping(address => bool) public whitelistedTargets;
    
    // Constants
    uint256 public constant MIN_QUORUM = 10; // 10%
    uint256 public constant MAX_QUORUM = 80; // 80%
    uint256 public constant MIN_VOTING_PERIOD = 1 days;
    uint256 public constant MAX_VOTING_PERIOD = 30 days;
    uint256 public constant MIN_EMERGENCY_PERIOD = 1 hours;
    uint256 public constant MAX_EMERGENCY_PERIOD = 3 days;
    uint256 public constant EMERGENCY_RISK_THRESHOLD = 90;

    // ============ Events ============
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 votingEndTime
    );
    
    event EmergencyProposalCreated(
        uint256 indexed proposalId,
        uint256 riskScore,
        string aiReasoning,
        uint256 votingEndTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 timestamp
    );
    
    event ProposalExecuted(uint256 indexed proposalId, uint256 timestamp);
    
    event ProposalDefeated(
        uint256 indexed proposalId,
        uint256 votesFor,
        uint256 votesAgainst
    );
    
    event GuardianOverride(
        uint256 indexed proposalId,
        address indexed guardian,
        string justification,
        uint256 timestamp
    );
    
    event VerifiedHumansUpdated(uint256 oldTotal, uint256 newTotal);
    event TargetWhitelisted(address indexed target);
    event TargetRemoved(address indexed target);
    event GuardianMultiSigUpdated(address indexed oldGuardian, address indexed newGuardian);

    // ============ Custom Errors ============
    error InvalidWorldIDProof();
    error NullifierAlreadyUsed();
    error TargetNotWhitelisted();
    error ProposalNotFound();
    error ProposalNotActive();
    error VotingPeriodNotEnded();
    error VotingPeriodEnded();
    error QuorumNotReached();
    error ProposalAlreadyExecuted();
    error NotGuardianMultiSig();
    error NotEmergencyProposal();
    error InsufficientRiskScore();
    error InvalidQuorumPercentage();
    error InvalidVotingPeriod();
    error InvalidEmergencyPeriod();
    error ExecutionFailed();
    error AlreadyVoted();

    // ============ Initialization ============
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _worldId,
        uint256 _externalNullifierHash,
        uint256 _groupId,
        uint256 _quorumPercentage,
        uint256 _votingPeriod,
        uint256 _emergencyVotingPeriod,
        address _guardianMultiSig
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        require(_worldId != address(0), "Invalid WorldID address");
        require(_guardianMultiSig != address(0), "Invalid guardian address");
        require(_quorumPercentage >= MIN_QUORUM && _quorumPercentage <= MAX_QUORUM, "Invalid quorum");
        require(_votingPeriod >= MIN_VOTING_PERIOD && _votingPeriod <= MAX_VOTING_PERIOD, "Invalid voting period");
        require(_emergencyVotingPeriod >= MIN_EMERGENCY_PERIOD && _emergencyVotingPeriod <= MAX_EMERGENCY_PERIOD, "Invalid emergency period");

        worldId = IWorldID(_worldId);
        externalNullifierHash = _externalNullifierHash;
        groupId = _groupId;
        quorumPercentage = _quorumPercentage;
        votingPeriod = _votingPeriod;
        emergencyVotingPeriod = _emergencyVotingPeriod;
        guardianMultiSig = _guardianMultiSig;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}

    // ============ Core Functions ============

    function createProposal(
        string calldata title,
        string calldata description,
        address targetContract,
        bytes calldata callData,
        uint256 merkleRoot,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external returns (uint256 proposalId) {
        _verifyWorldID(merkleRoot, nullifierHash, proof);

        if (!whitelistedTargets[targetContract]) {
            revert TargetNotWhitelisted();
        }

        proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.proposalId = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.targetContract = targetContract;
        proposal.callData = callData;
        proposal.creationTime = block.timestamp;
        proposal.votingEndTime = block.timestamp + votingPeriod;
        proposal.status = ProposalStatus.Active;
        proposal.isEmergency = false;

        emit ProposalCreated(proposalId, msg.sender, title, proposal.votingEndTime);
    }

    function createEmergencyProposal(
        string calldata title,
        string calldata description,
        address targetContract,
        bytes calldata callData,
        uint256 riskScore,
        string calldata aiReasoning
    ) external onlyRole(CRE_ROLE) returns (uint256 proposalId) {
        if (riskScore < EMERGENCY_RISK_THRESHOLD) {
            revert InsufficientRiskScore();
        }

        if (!whitelistedTargets[targetContract]) {
            revert TargetNotWhitelisted();
        }

        proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.proposalId = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.targetContract = targetContract;
        proposal.callData = callData;
        proposal.creationTime = block.timestamp;
        proposal.votingEndTime = block.timestamp + emergencyVotingPeriod;
        proposal.status = ProposalStatus.Active;
        proposal.isEmergency = true;
        proposal.riskScore = riskScore;
        proposal.aiReasoning = aiReasoning;

        emit EmergencyProposalCreated(proposalId, riskScore, aiReasoning, proposal.votingEndTime);
    }

    function vote(
        uint256 proposalId,
        bool support,
        uint256 merkleRoot,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.proposer == address(0)) {
            revert ProposalNotFound();
        }

        if (proposal.status != ProposalStatus.Active) {
            revert ProposalNotActive();
        }

        if (block.timestamp >= proposal.votingEndTime) {
            revert VotingPeriodEnded();
        }

        _verifyWorldID(merkleRoot, nullifierHash, proof);

        if (proposal.usedNullifiers[nullifierHash]) {
            revert NullifierAlreadyUsed();
        }

        if (proposal.votes[msg.sender].timestamp != 0) {
            revert AlreadyVoted();
        }

        proposal.usedNullifiers[nullifierHash] = true;

        Vote storage userVote = proposal.votes[msg.sender];
        userVote.support = support;
        userVote.nullifierHash = nullifierHash;
        userVote.timestamp = block.timestamp;

        if (support) {
            proposal.votesFor++;
        } else {
            proposal.votesAgainst++;
        }

        proposal.voters.push(msg.sender);

        emit VoteCast(proposalId, msg.sender, support, block.timestamp);
    }

    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.proposer == address(0)) {
            revert ProposalNotFound();
        }

        if (proposal.status != ProposalStatus.Active) {
            revert ProposalNotActive();
        }

        if (block.timestamp < proposal.votingEndTime) {
            revert VotingPeriodNotEnded();
        }

        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        require(totalVerifiedHumans > 0, "No verified humans registered");
        uint256 quorum = (totalVotes * 100) / totalVerifiedHumans;

        if (quorum < quorumPercentage) {
            revert QuorumNotReached();
        }

        if (proposal.votesFor > proposal.votesAgainst) {
            proposal.status = ProposalStatus.Succeeded;
            
            (bool success, ) = proposal.targetContract.call(proposal.callData);
            if (!success) {
                revert ExecutionFailed();
            }
            
            proposal.status = ProposalStatus.Executed;
            emit ProposalExecuted(proposalId, block.timestamp);
        } else {
            proposal.status = ProposalStatus.Defeated;
            emit ProposalDefeated(proposalId, proposal.votesFor, proposal.votesAgainst);
        }
    }

    function guardianOverride(
        uint256 proposalId,
        string calldata justification
    ) external {
        if (msg.sender != guardianMultiSig) {
            revert NotGuardianMultiSig();
        }

        Proposal storage proposal = proposals[proposalId];

        if (proposal.proposer == address(0)) {
            revert ProposalNotFound();
        }

        if (!proposal.isEmergency) {
            revert NotEmergencyProposal();
        }

        (bool success, ) = proposal.targetContract.call(proposal.callData);
        if (!success) {
            revert ExecutionFailed();
        }

        guardianOverrides[proposalId] = true;
        proposal.status = ProposalStatus.Executed;

        emit GuardianOverride(proposalId, msg.sender, justification, block.timestamp);
    }

    // ============ View Functions ============

    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        string memory description,
        address targetContract,
        uint256 votingEndTime,
        ProposalStatus status,
        uint256 votesFor,
        uint256 votesAgainst,
        bool isEmergency
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.targetContract,
            proposal.votingEndTime,
            proposal.status,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.isEmergency
        );
    }

    function getVote(uint256 proposalId, address voter) external view returns (
        bool support,
        uint256 nullifierHash,
        uint256 timestamp
    ) {
        Vote storage userVote = proposals[proposalId].votes[voter];
        return (userVote.support, userVote.nullifierHash, userVote.timestamp);
    }

    function getVoters(uint256 proposalId) external view returns (address[] memory) {
        return proposals[proposalId].voters;
    }

    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].votes[voter].timestamp != 0;
    }

    function isNullifierUsed(uint256 proposalId, uint256 nullifierHash) external view returns (bool) {
        return proposals[proposalId].usedNullifiers[nullifierHash];
    }

    // ============ Admin Functions ============

    function whitelistTarget(address target) external onlyRole(ADMIN_ROLE) {
        require(target != address(0), "Invalid target address");
        whitelistedTargets[target] = true;
        emit TargetWhitelisted(target);
    }

    function removeTarget(address target) external onlyRole(ADMIN_ROLE) {
        whitelistedTargets[target] = false;
        emit TargetRemoved(target);
    }

    function updateTotalVerifiedHumans(uint256 newTotal) external onlyRole(ORACLE_ROLE) {
        uint256 oldTotal = totalVerifiedHumans;
        totalVerifiedHumans = newTotal;
        emit VerifiedHumansUpdated(oldTotal, newTotal);
    }

    function updateGuardianMultiSig(address newGuardian) external onlyRole(ADMIN_ROLE) {
        require(newGuardian != address(0), "Invalid guardian address");
        address oldGuardian = guardianMultiSig;
        guardianMultiSig = newGuardian;
        emit GuardianMultiSigUpdated(oldGuardian, newGuardian);
    }

    function updateQuorumPercentage(uint256 newQuorum) external onlyRole(ADMIN_ROLE) {
        if (newQuorum < MIN_QUORUM || newQuorum > MAX_QUORUM) {
            revert InvalidQuorumPercentage();
        }
        quorumPercentage = newQuorum;
    }

    function updateVotingPeriod(uint256 newPeriod) external onlyRole(ADMIN_ROLE) {
        if (newPeriod < MIN_VOTING_PERIOD || newPeriod > MAX_VOTING_PERIOD) {
            revert InvalidVotingPeriod();
        }
        votingPeriod = newPeriod;
    }

    function updateEmergencyVotingPeriod(uint256 newPeriod) external onlyRole(ADMIN_ROLE) {
        if (newPeriod < MIN_EMERGENCY_PERIOD || newPeriod > MAX_EMERGENCY_PERIOD) {
            revert InvalidEmergencyPeriod();
        }
        emergencyVotingPeriod = newPeriod;
    }

    function cancelProposal(uint256 proposalId) external onlyRole(ADMIN_ROLE) {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.proposer == address(0)) {
            revert ProposalNotFound();
        }

        if (proposal.status != ProposalStatus.Active) {
            revert ProposalNotActive();
        }

        proposal.status = ProposalStatus.Cancelled;
    }

    // ============ Internal Functions ============

    function _verifyWorldID(
        uint256 merkleRoot,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) internal view {
        try worldId.verifyProof(
            merkleRoot,
            groupId,
            uint256(uint160(msg.sender)),
            nullifierHash,
            externalNullifierHash,
            proof
        ) {
            // Proof is valid
        } catch {
            revert InvalidWorldIDProof();
        }
    }
}
