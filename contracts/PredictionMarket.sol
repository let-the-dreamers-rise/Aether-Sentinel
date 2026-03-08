// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

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
 * @title PredictionMarket
 * @notice World ID verified prediction markets with automated CRE settlement
 */
contract PredictionMarket is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CRE_ROLE = keccak256("CRE_ROLE");

    enum MarketStatus { Active, Closed, ResolutionPending, Settled, Disputed }

    struct Participation {
        uint256 outcomeIndex;
        uint256 stakeAmount;
        bool claimed;
        uint256 nullifierHash;
    }

    struct Market {
        uint256 marketId;
        address creator;
        string question;
        string[] outcomes;
        uint256 endTime;
        uint256 resolutionTime;
        MarketStatus status;
        uint256 winningOutcome;
        uint256 totalStake;
        uint256[] outcomeStakes;
        address[] participantList;
        bool exists;
    }

    IWorldID public worldId;
    uint256 public externalNullifierHash;
    uint256 public groupId;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Participation)) public participations;
    mapping(uint256 => mapping(uint256 => bool)) public marketNullifiers;
    uint256 public marketCount;

    mapping(address => bool) public authorizedResolvers;

    uint256 public minimumStake;
    uint256 public platformFee;
    address public feeRecipient;
    uint256 public accumulatedFees;

    uint256 public constant MAX_OUTCOMES = 10;
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 30 days;
    uint256 public constant DISPUTE_WINDOW = 7 days;
    uint256 public constant MAX_FEE = 1000;

    event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 endTime);
    event MarketParticipation(uint256 indexed marketId, address indexed participant, uint256 outcomeIndex, uint256 stakeAmount);
    event MarketClosed(uint256 indexed marketId, uint256 timestamp);
    event MarketSettled(uint256 indexed marketId, uint256 winningOutcome, string resolutionData, uint256 timestamp);
    event WinningsClaimed(uint256 indexed marketId, address indexed participant, uint256 payout);
    event MarketDisputed(uint256 indexed marketId, address indexed disputant, string reason);
    event ResolverAuthorized(address indexed resolver);
    event ResolverRevoked(address indexed resolver);

    error InvalidWorldIDProof();
    error NullifierAlreadyUsed();
    error MarketNotFound();
    error MarketNotActive();
    error MarketNotSettled();
    error InvalidMarketStatus();
    error MarketNotEnded();
    error InvalidOutcomeCount();
    error InvalidDuration();
    error InsufficientStake();
    error InvalidOutcomeIndex();
    error AlreadyParticipated();
    error NotParticipant();
    error AlreadyClaimed();
    error NotWinningOutcome();
    error DisputePeriodExpired();
    error NotResolver();
    error InvalidPlatformFee();
    error InsufficientFees();
    error TransferFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(
        address _worldId,
        uint256 _externalNullifierHash,
        uint256 _groupId,
        uint256 _minimumStake,
        uint256 _platformFee
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        require(_worldId != address(0), "Invalid WorldID address");
        if (_platformFee > MAX_FEE) revert InvalidPlatformFee();

        worldId = IWorldID(_worldId);
        externalNullifierHash = _externalNullifierHash;
        groupId = _groupId;
        minimumStake = _minimumStake;
        platformFee = _platformFee;
        feeRecipient = msg.sender;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function _authorizeUpgrade(address) internal override onlyRole(ADMIN_ROLE) {}

    function createMarket(
        string calldata question,
        string[] calldata outcomes,
        uint256 duration,
        uint256 merkleRoot,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external payable returns (uint256 marketId) {
        _verifyWorldID(merkleRoot, nullifierHash, proof);

        if (outcomes.length < 2 || outcomes.length > MAX_OUTCOMES) revert InvalidOutcomeCount();
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert InvalidDuration();

        marketId = marketCount++;
        Market storage market = markets[marketId];
        market.marketId = marketId;
        market.creator = msg.sender;
        market.question = question;
        market.endTime = block.timestamp + duration;
        market.status = MarketStatus.Active;
        market.exists = true;

        for (uint256 i = 0; i < outcomes.length; i++) {
            market.outcomes.push(outcomes[i]);
            market.outcomeStakes.push(0);
        }

        emit MarketCreated(marketId, msg.sender, question, market.endTime);
    }

    function participateInMarket(
        uint256 marketId,
        uint256 outcomeIndex,
        uint256 merkleRoot,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external payable nonReentrant {
        Market storage market = markets[marketId];
        if (!market.exists) revert MarketNotFound();
        if (market.status != MarketStatus.Active) revert MarketNotActive();
        if (block.timestamp >= market.endTime) revert MarketNotEnded();
        if (msg.value < minimumStake) revert InsufficientStake();
        if (outcomeIndex >= market.outcomes.length) revert InvalidOutcomeIndex();

        _verifyWorldID(merkleRoot, nullifierHash, proof);

        if (marketNullifiers[marketId][nullifierHash]) revert NullifierAlreadyUsed();
        if (participations[marketId][msg.sender].stakeAmount > 0) revert AlreadyParticipated();

        marketNullifiers[marketId][nullifierHash] = true;

        participations[marketId][msg.sender] = Participation({
            outcomeIndex: outcomeIndex,
            stakeAmount: msg.value,
            claimed: false,
            nullifierHash: nullifierHash
        });

        market.outcomeStakes[outcomeIndex] += msg.value;
        market.totalStake += msg.value;
        market.participantList.push(msg.sender);

        emit MarketParticipation(marketId, msg.sender, outcomeIndex, msg.value);
    }

    function closeMarket(uint256 marketId) external {
        Market storage market = markets[marketId];
        if (!market.exists) revert MarketNotFound();
        if (market.status != MarketStatus.Active) revert MarketNotActive();
        if (block.timestamp < market.endTime) revert MarketNotEnded();

        market.status = MarketStatus.ResolutionPending;
        emit MarketClosed(marketId, block.timestamp);
    }

    function settleMarket(uint256 marketId, uint256 winningOutcome, string calldata resolutionData) external {
        if (!authorizedResolvers[msg.sender] && !hasRole(CRE_ROLE, msg.sender)) revert NotResolver();

        Market storage market = markets[marketId];
        if (!market.exists) revert MarketNotFound();
        if (market.status != MarketStatus.ResolutionPending) revert InvalidMarketStatus();
        if (winningOutcome >= market.outcomes.length) revert InvalidOutcomeIndex();

        market.winningOutcome = winningOutcome;
        market.status = MarketStatus.Settled;
        market.resolutionTime = block.timestamp;

        emit MarketSettled(marketId, winningOutcome, resolutionData, block.timestamp);
    }

    function claimWinnings(uint256 marketId) external nonReentrant returns (uint256 payout) {
        Market storage market = markets[marketId];
        if (!market.exists) revert MarketNotFound();
        if (market.status != MarketStatus.Settled) revert MarketNotSettled();

        Participation storage p = participations[marketId][msg.sender];
        if (p.stakeAmount == 0) revert NotParticipant();
        if (p.claimed) revert AlreadyClaimed();
        if (p.outcomeIndex != market.winningOutcome) revert NotWinningOutcome();

        uint256 winningPool = market.outcomeStakes[market.winningOutcome];
        if (winningPool == 0) revert NotWinningOutcome();

        payout = (p.stakeAmount * market.totalStake) / winningPool;

        uint256 fee = (payout * platformFee) / 10000;
        payout -= fee;
        accumulatedFees += fee;

        p.claimed = true;

        (bool success, ) = msg.sender.call{value: payout}("");
        if (!success) revert TransferFailed();

        emit WinningsClaimed(marketId, msg.sender, payout);
    }

    function disputeMarket(uint256 marketId, string calldata reason) external {
        Market storage market = markets[marketId];
        if (!market.exists) revert MarketNotFound();
        if (market.status != MarketStatus.Settled) revert InvalidMarketStatus();

        Participation storage p = participations[marketId][msg.sender];
        if (p.stakeAmount == 0) revert NotParticipant();
        if (block.timestamp > market.resolutionTime + DISPUTE_WINDOW) revert DisputePeriodExpired();

        market.status = MarketStatus.Disputed;
        emit MarketDisputed(marketId, msg.sender, reason);
    }

    // ============ View Functions ============

    function getMarket(uint256 marketId) external view returns (
        address creator, string memory question, string[] memory outcomes,
        uint256 endTime, MarketStatus status, uint256 winningOutcome, uint256 totalStake, bool exists
    ) {
        Market storage m = markets[marketId];
        return (m.creator, m.question, m.outcomes, m.endTime, m.status, m.winningOutcome, m.totalStake, m.exists);
    }

    function getMarketOutcomes(uint256 marketId) external view returns (string[] memory) {
        return markets[marketId].outcomes;
    }

    function getOutcomeStake(uint256 marketId, uint256 outcomeIndex) external view returns (uint256) {
        return markets[marketId].outcomeStakes[outcomeIndex];
    }

    function getMarketOutcomeStakes(uint256 marketId) external view returns (uint256[] memory) {
        return markets[marketId].outcomeStakes;
    }

    function getParticipation(uint256 marketId, address participant) external view returns (
        uint256 outcomeIndex, uint256 stakeAmount, bool claimed, uint256 nullifierHash
    ) {
        Participation storage p = participations[marketId][participant];
        return (p.outcomeIndex, p.stakeAmount, p.claimed, p.nullifierHash);
    }

    function getParticipants(uint256 marketId) external view returns (address[] memory) {
        return markets[marketId].participantList;
    }

    function getParticipantCount(uint256 marketId) external view returns (uint256) {
        return markets[marketId].participantList.length;
    }

    function isNullifierUsed(uint256 marketId, uint256 nullifierHash) external view returns (bool) {
        return marketNullifiers[marketId][nullifierHash];
    }

    // ============ Admin Functions ============

    function authorizeResolver(address resolver) external onlyRole(ADMIN_ROLE) {
        require(resolver != address(0), "Invalid resolver");
        authorizedResolvers[resolver] = true;
        emit ResolverAuthorized(resolver);
    }

    function revokeResolver(address resolver) external onlyRole(ADMIN_ROLE) {
        authorizedResolvers[resolver] = false;
        emit ResolverRevoked(resolver);
    }

    function updateMinimumStake(uint256 newMinimumStake) external onlyRole(ADMIN_ROLE) {
        minimumStake = newMinimumStake;
    }

    function updatePlatformFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        if (newFee > MAX_FEE) revert InvalidPlatformFee();
        platformFee = newFee;
    }

    function updateFeeRecipient(address newRecipient) external onlyRole(ADMIN_ROLE) {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }

    function withdrawFees(address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        if (amount > accumulatedFees) revert InsufficientFees();
        accumulatedFees -= amount;
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    // ============ Internal ============

    function _verifyWorldID(uint256 merkleRoot, uint256 nullifierHash, uint256[8] calldata proof) internal view {
        try worldId.verifyProof(
            merkleRoot, groupId, uint256(uint160(msg.sender)),
            nullifierHash, externalNullifierHash, proof
        ) {} catch { revert InvalidWorldIDProof(); }
    }
}
