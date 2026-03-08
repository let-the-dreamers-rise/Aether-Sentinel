# Design Document: AETHER SENTINEL

## Overview

AETHER SENTINEL is an institutional-grade blockchain infrastructure that combines autonomous financial operations with AI-powered risk intelligence. The system architecture consists of four primary layers:

1. **Smart Contract Layer**: Solidity contracts deployed on EVM-compatible chains handling vault operations, risk safeguards, prediction markets, and governance
2. **Autonomous Orchestration Layer**: Chainlink Runtime Environment (CRE) workflows that execute multi-step operations autonomously
3. **AI Intelligence Layer**: Python-based machine learning service providing real-time risk assessment
4. **Application L
1. **Autonomous Risk Protection**: AI-powered risk monitoring with sub-minute response times
2. **Human-Verified Operations**: World ID integration prevents sybil attacks while maintaining privacy
3. **Strategy Privacy**: Confidential compute protects liquidation strategies and risk thresholds
4. **Institutional Grade**: Comprehensive audit trails, fail-safes, and regulatory compliance patterns
5. **Battle-Tested**: Tenderly simulation validates behavior under extreme market conditions

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND LAYER (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Risk         │  │ Vault        │  │ Prediction   │  │ Governance  │ │
│  │ Dashboard    │  │ Interface    │  │ Markets      │  │ Voting      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                  │                 │        │
│         └─────────────────┴──────────────────┴─────────────────┘        │
│                                    │                                     │
│                          ┌─────────▼─────────┐                          │
│                          │  Wallet Connect   │                          │
│                          │  World ID SDK     │                          │
│                          └─────────┬─────────┘                          │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                       BACKEND LAYER (Node.js)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ REST API     │  │ World ID     │  │ AI Risk      │  │ CRE Trigger │ │
│  │ Gateway      │  │ Validator    │  │ Aggregator   │  │ Service     │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                  │                 │        │
│         └─────────────────┴──────────────────┴─────────────────┘        │
│                                    │                                     │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                    CHAINLINK RUNTIME ENVIRONMENT (CRE)                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Workflow A: Continuous Risk Monitoring (Every 15 min)           │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │   │
│  │  │ Fetch  │─▶│ Fetch  │─▶│  Call  │─▶│Evaluate│─▶│Execute │    │   │
│  │  │On-Chain│  │Market  │  │   AI   │  │ Risk   │  │Contract│    │   │
│  │  │  Data  │  │  Data  │  │ Engine │  │ Score  │  │  Call  │    │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Workflow B: Prediction Market Resolution (Event-Driven)         │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                │   │
│  │  │ Fetch  │─▶│Validate│─▶│ Settle │─▶│ Emit   │                │   │
│  │  │Oracle  │  │Consensus│  │ Market │  │ Event  │                │   │
│  │  │  Data  │  │ (2/3)  │  │        │  │        │                │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Workflow C: Emergency Governance (Risk > 90)                    │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │   │
│  │  │Detect  │─▶│ Create │─▶│ World  │─▶│Execute │─▶│ Notify │    │   │
│  │  │Critical│  │Emergency│  │   ID   │  │ Action │  │  All   │    │   │
│  │  │  Risk  │  │Proposal│  │ Voting │  │        │  │        │    │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│                    CONFIDENTIAL COMPUTE LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Private     │  │  Hidden AI   │  │  Private     │                  │
│  │  Liquidation │  │  Threshold   │  │  Treasury    │                  │
│  │  Auctions    │  │  Logic       │  │  Operations  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└────────────────────────────────────────────────────────────────────────┬─┘
                                                                         │
┌────────────────────────────────────────────────────────────────────────▼─┐
│                      SMART CONTRACT LAYER (Solidity)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Tokenized    │  │ Risk         │  │ Prediction   │  │ Governance  │ │
│  │ Vault        │◀─│ Guardian     │  │ Market       │  │ Module      │ │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ World ID     │  │ Chainlink    │  │ Price        │                  │
│  │ Verifier     │  │ Automation   │  │ Feeds        │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                      AI RISK ENGINE (Python/TensorFlow)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Data         │  │ Risk Model   │  │ Anomaly      │  │ Response    │ │
│  │ Aggregation  │─▶│ Inference    │─▶│ Detection    │─▶│ Formatter   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                                          │
│  Input: Reserve Ratio (30%), Volatility (25%), Liquidity (25%),         │
│         Abnormal Withdrawals (20%)                                       │
│  Output: Risk Score (0-100), Action, Confidence, Reasoning              │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                      EXTERNAL DATA SOURCES                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Chainlink    │  │ Market Data  │  │ World ID     │  │ Tenderly    │ │
│  │ Price Feeds  │  │ APIs         │  │ API          │  │ Virtual Net │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

**Critical Path: Risk Detection to Safeguard Execution**
```
1. CRE Workflow A Timer Trigger (Every 15 min)
   ↓
2. Fetch TokenizedVault.getVaultState() → {reserveRatio, totalDeposits, recentTxs}
   ↓
3. Fetch External Market Data → {volatilityIndex, liquidityMetrics, priceFeeds}
   ↓
4. POST /api/risk-assessment → AI Risk Engine
   ↓
5. AI Engine Response → {riskScore: 85, action: "PAUSE", confidence: 0.92, reasoning: "..."}
   ↓
6. CRE Conditional: if (riskScore > 80) → Execute RiskGuardian.executeS
afeguard(riskScore, action)
   ↓
7. RiskGuardian verifies caller is authorized CRE address
   ↓
8. RiskGuardian.executeEmergencyPause() → TokenizedVault.pause()
   ↓
9. Emit RiskGuardianAction event with full audit trail
   ↓
10. Frontend WebSocket receives event → Update risk dashboard (red alert)
```

**World ID Verification Flow**
```
Frontend: User clicks "Verify Identity"
   ↓
World ID SDK: Generate proof request with actionId and signal
   ↓
World App: User scans QR code / deep link
   ↓
World App: Generate ZK proof (merkleRoot, nullifierHash, proof)
   ↓
Frontend: Receive proof data
   ↓
Decision Point: On-chain or Off-chain verification?
   │
   ├─▶ ON-CHAIN PATH:
   │   Frontend: Include proof in transaction calldata
   │   Smart Contract: Call WorldIDVerifier.verifyProof()
   │   Smart Contract: Check nullifierHash not used
   │   Smart Contract: Store nullifierHash
   │   Smart Contract: Execute protected function
   │
   └─▶ OFF-CHAIN PATH:
       Frontend: POST /api/verify-world-id with proof
       Backend: Call World ID API for verification
       Backend: Cache verification result (60s TTL)
       Backend: Return JWT with verified claim
       Frontend: Include JWT in subsequent requests
       Backend: Validate JWT before executing operations
```

---

## Smart Contract Layer Design

### Contract Architecture Overview

The smart contract layer consists of four core contracts with clear separation of concerns:

1. **TokenizedVault.sol**: Asset custody, minting/burning, reserve ratio management
2. **RiskGuardian.sol**: Risk signal reception, safeguard execution, CRE authorization
3. **PredictionMarket.sol**: Market creation, World ID verification, automated settlement
4. **GovernanceModule.sol**: Proposal management, World ID voting, emergency overrides

All contracts follow OpenZeppelin standards for upgradeability (UUPS pattern), access control (AccessControl), and pausability (Pausable).


### TokenizedVault.sol - Detailed Specification

**Purpose**: Manages tokenized asset deposits, withdrawals, collateral tracking, and reserve ratio enforcement.

**State Variables**:
```solidity
// Core accounting
mapping(address => uint256) public vaultTokenBalances;
uint256 public totalVaultTokens;
uint256 public totalUnderlyingAssets;
uint256 public reserveRatio; // Basis points (10000 = 100%)
uint256 public minimumReserveRatio; // e.g., 2000 = 20%

// Asset management
IERC20 public underlyingAsset;
uint256 public totalDeposits;
uint256 public totalLiabilities;

// Access control
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
bytes32 public constant RISK_GUARDIAN_ROLE = keccak256("RISK_GUARDIAN_ROLE");

// Emergency controls
bool public paused;
uint256 public lastReserveRatioUpdate;

// Audit trail
struct DepositEvent {
    address user;
    uint256 amount;
    uint256 vaultTokensMinted;
    uint256 timestamp;
    uint256 reserveRatioAfter;
}
mapping(uint256 => DepositEvent) public depositHistory;
uint256 public depositCount;
```

**Core Functions**:

```solidity
function deposit(uint256 amount) external whenNotPaused returns (uint256 vaultTokensMinted)
```
- Validates amount > 0
- Transfers underlying asset from user
- Calculates vault tokens: `vaultTokens = (amount * totalVaultTokens) / totalUnderlyingAssets`
- Mints vault tokens to user
- Updates totalUnderlyingAssets, totalDeposits
- Recalculates reserve ratio
- Emits Deposit event with full state snapshot
- Returns vault tokens minted

```solidity
function withdraw(uint256 vaultTokenAmount) external whenNotPaused returns (uint256 assetsReturned)
```
- Validates vaultTokenAmount > 0 and user has balance
- Calculates assets: `assets = (vaultTokenAmount * totalUnderlyingAssets) / totalVaultTokens`
- Checks reserve ratio after withdrawal: `newRatio = (totalAssets - assets) / totalLiabilities`
- Reverts if newRatio < minimumReserveRatio
- Burns vault tokens from user
- Transfers underlying assets to user
- Updates totalUnderlyingAssets, totalLiabilities
- Recalculates reserve ratio
- Emits Withdrawal event
- Returns assets transferred

```solidity
function calculateReserveRatio() public view returns (uint256)
```
- Returns `(totalUnderlyingAssets * 10000) / totalLiabilities`
- Returns 10000 (100%) if totalLiabilities == 0

```solidity
function emergencyPause() external onlyRole(RISK_GUARDIAN_ROLE)
```
- Sets paused = true
- Emits EmergencyPause event with caller and timestamp
- Prevents all deposits and withdrawals

```solidity
function unpause() external onlyRole(ADMIN_ROLE)
```
- Sets paused = false
- Emits Unpause event

```solidity
function adjustMinimumReserveRatio(uint256 newRatio) external onlyRole(RISK_GUARDIAN_ROLE)
```
- Validates newRatio >= 1000 (10%) and <= 5000 (50%)
- Updates minimumReserveRatio
- Emits ReserveRatioAdjusted event

```solidity
function getVaultState() external view returns (VaultState memory)
```
- Returns struct with: reserveRatio, totalDeposits, totalLiabilities, paused, lastUpdate
- Used by CRE workflows for risk assessment

**Events**:
```solidity
event Deposit(address indexed user, uint256 amount, uint256 vaultTokens, uint256 reserveRatio, uint256 timestamp);
event Withdrawal(address indexed user, uint256 vaultTokens, uint256 assetsReturned, uint256 reserveRatio, uint256 timestamp);
event EmergencyPause(address indexed triggeredBy, uint256 timestamp);
event Unpause(address indexed triggeredBy, uint256 timestamp);
event ReserveRatioAdjusted(uint256 oldRatio, uint256 newRatio, uint256 timestamp);
```

**Security Considerations**:
- Reentrancy protection on all state-changing functions (ReentrancyGuard)
- Integer overflow protection (Solidity 0.8+)
- Reserve ratio checks before withdrawals prevent bank run scenarios
- Role-based access control prevents unauthorized parameter changes
- Comprehensive event emission for audit trail


### RiskGuardian.sol - Detailed Specification

**Purpose**: Receives risk signals from authorized CRE workflows and executes automated safeguard actions.

**State Variables**:
```solidity
// CRE authorization
mapping(address => bool) public authorizedCREWorkflows;
address[] public creWorkflowList;

// Risk tracking
struct RiskSignal {
    uint256 riskScore;
    string recommendedAction;
    uint256 confidence;
    string reasoning;
    uint256 timestamp;
    address triggeredBy;
}
RiskSignal[] public riskSignalHistory;

// Safeguard configuration
uint256 public moderateRiskThreshold; // e.g., 60
uint256 public elevatedRiskThreshold; // e.g., 80
uint256 public criticalRiskThreshold; // e.g., 90
uint256 public safeguardCooldown; // e.g., 3600 seconds (1 hour)
uint256 public lastSafeguardExecution;

// Contract references
ITokenizedVault public vaultContract;
IGovernanceModule public governanceContract;

// Access control
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
```

**Core Functions**:

```solidity
function executeRiskResponse(
    uint256 riskScore,
    string calldata recommendedAction,
    uint256 confidence,
    string calldata reasoning
) external onlyAuthorizedCRE
```
- Validates caller is authorized CRE workflow
- Validates riskScore between 0 and 100
- Validates confidence between 0 and 100
- Checks cooldown period has elapsed
- Stores risk signal in history
- Determines action based on risk score:
  - riskScore >= criticalRiskThreshold (90): Execute emergency pause
  - riskScore >= elevatedRiskThreshold (80): Adjust reserve ratio to conservative level
  - riskScore >= moderateRiskThreshold (60): Emit warning event only
  - riskScore < moderateRiskThreshold: No action
- Updates lastSafeguardExecution timestamp
- Emits RiskResponseExecuted event with full details

```solidity
function executeCriticalSafeguard(uint256 riskScore, string calldata reasoning) internal
```
- Calls vaultContract.emergencyPause()
- If riskScore >= 95, also triggers emergency governance proposal
- Emits CriticalSafeguardActivated event

```solidity
function executeElevatedSafeguard(uint256 riskScore) internal
```
- Calculates new conservative reserve ratio: `newRatio = currentRatio * 1.5`
- Caps at 50% (5000 basis points)
- Calls vaultContract.adjustMinimumReserveRatio(newRatio)
- Emits ElevatedSafeguardActivated event

```solidity
function addAuthorizedCREWorkflow(address workflowAddress) external onlyRole(ADMIN_ROLE)
```
- Validates workflowAddress is contract
- Adds to authorizedCREWorkflows mapping
- Adds to creWorkflowList array
- Emits CREWorkflowAuthorized event

```solidity
function removeAuthorizedCREWorkflow(address workflowAddress) external onlyRole(ADMIN_ROLE)
```
- Removes from authorizedCREWorkflows mapping
- Removes from creWorkflowList array
- Emits CREWorkflowRevoked event

```solidity
function getRiskSignalHistory(uint256 count) external view returns (RiskSignal[] memory)
```
- Returns last `count` risk signals
- Used for dashboard and analytics

```solidity
function updateThresholds(
    uint256 moderate,
    uint256 elevated,
    uint256 critical
) external onlyRole(ADMIN_ROLE)
```
- Validates moderate < elevated < critical
- Updates threshold values
- Emits ThresholdsUpdated event

**Modifiers**:
```solidity
modifier onlyAuthorizedCRE() {
    require(authorizedCREWorkflows[msg.sender], "RiskGuardian: Unauthorized CRE workflow");
    _;
}

modifier cooldownElapsed() {
    require(
        block.timestamp >= lastSafeguardExecution + safeguardCooldown,
        "RiskGuardian: Cooldown period active"
    );
    _;
}
```

**Events**:
```solidity
event RiskResponseExecuted(
    uint256 indexed riskScore,
    string action,
    uint256 confidence,
    address triggeredBy,
    uint256 timestamp
);
event CriticalSafeguardActivated(uint256 riskScore, string reasoning, uint256 timestamp);
event ElevatedSafeguardActivated(uint256 oldRatio, uint256 newRatio, uint256 timestamp);
event CREWorkflowAuthorized(address indexed workflow, uint256 timestamp);
event CREWorkflowRevoked(address indexed workflow, uint256 timestamp);
event UnauthorizedAccessAttempt(address indexed attacker, uint256 timestamp);
```

**Security Considerations**:
- Strict CRE workflow authorization prevents unauthorized safeguard triggers
- Cooldown period prevents rapid oscillation of safeguards
- Comprehensive audit trail for all risk signals and actions
- Emergency override capability for guardian multi-sig
- Threshold validation prevents misconfiguration


### PredictionMarket.sol - Detailed Specification

**Purpose**: Enables creation and participation in prediction markets with World ID verification and automated settlement.

**State Variables**:
```solidity
// World ID integration
IWorldID public worldId;
uint256 public externalNullifierHash;
mapping(uint256 => bool) public usedNullifiers; // Prevents double participation

// Market structure
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
    mapping(uint256 => uint256) outcomeStakes; // outcome index => total stake
    mapping(address => Participation) participants;
    address[] participantList;
}

struct Participation {
    uint256 outcomeIndex;
    uint256 stakeAmount;
    bool claimed;
    uint256 nullifierHash;
}

enum MarketStatus {
    Active,
    Closed,
    ResolutionPending,
    Settled,
    Disputed
}

mapping(uint256 => Market) public markets;
uint256 public marketCount;

// CRE authorization for settlement
mapping(address => bool) public authorizedResolvers;

// Configuration
uint256 public minimumStake; // e.g., 0.01 ETH
uint256 public platformFee; // Basis points, e.g., 200 = 2%
```

**Core Functions**:

```solidity
function createMarket(
    string calldata question,
    string[] calldata outcomes,
    uint256 duration,
    uint256 merkleRoot,
    uint256 nullifierHash,
    uint256[8] calldata proof
) external payable returns (uint256 marketId)
```
- Verifies World ID proof using worldId.verifyProof()
- Checks nullifierHash not already used
- Validates outcomes.length >= 2 and <= 10
- Validates duration >= 1 hour and <= 30 days
- Creates new Market struct
- Sets endTime = block.timestamp + duration
- Sets status = Active
- Stores nullifierHash to prevent reuse
- Emits MarketCreated event
- Returns marketId

```solidity
function participateInMarket(
    uint256 marketId,
    uint256 outcomeIndex,
    uint256 merkleRoot,
    uint256 nullifierHash,
    uint256[8] calldata proof
) external payable
```
- Verifies World ID proof
- Checks nullifierHash not used for this market
- Validates market exists and status == Active
- Validates block.timestamp < market.endTime
- Validates msg.value >= minimumStake
- Validates outcomeIndex < market.outcomes.length
- Records participation with nullifierHash
- Updates market.outcomeStakes[outcomeIndex]
- Updates market.totalStake
- Adds user to participantList if first participation
- Emits MarketParticipation event

```solidity
function settleMarket(
    uint256 marketId,
    uint256 winningOutcome,
    string calldata resolutionData
) external onlyAuthorizedResolver
```
- Validates market exists and status == ResolutionPending
- Validates winningOutcome < market.outcomes.length
- Sets market.winningOutcome = winningOutcome
- Sets market.status = Settled
- Sets market.resolutionTime = block.timestamp
- Emits MarketSettled event with resolution data

```solidity
function claimWinnings(uint256 marketId) external returns (uint256 payout)
```
- Validates market.status == Settled
- Validates msg.sender participated in market
- Validates participation.outcomeIndex == market.winningOutcome
- Validates !participation.claimed
- Calculates payout: `(participation.stake * market.totalStake) / market.outcomeStakes[winningOutcome]`
- Deducts platform fee
- Marks participation.claimed = true
- Transfers payout to msg.sender
- Emits WinningsClaimed event
- Returns payout amount

```solidity
function closeMarket(uint256 marketId) external
```
- Validates block.timestamp >= market.endTime
- Validates market.status == Active
- Sets market.status = ResolutionPending
- Emits MarketClosed event
- Triggers CRE Workflow B for resolution

```solidity
function disputeMarket(uint256 marketId, string calldata reason) external
```
- Validates msg.sender is market participant
- Validates market.status == Settled
- Validates block.timestamp <= market.resolutionTime + 7 days
- Sets market.status = Disputed
- Escalates to governance for manual resolution
- Emits MarketDisputed event

**Events**:
```solidity
event MarketCreated(
    uint256 indexed marketId,
    address indexed creator,
    string question,
    string[] outcomes,
    uint256 endTime
);
event MarketParticipation(
    uint256 indexed marketId,
    address indexed participant,
    uint256 outcomeIndex,
    uint256 stakeAmount
);
event MarketClosed(uint256 indexed marketId, uint256 timestamp);
event MarketSettled(
    uint256 indexed marketId,
    uint256 winningOutcome,
    string resolutionData,
    uint256 timestamp
);
event WinningsClaimed(
    uint256 indexed marketId,
    address indexed participant,
    uint256 payout
);
event MarketDisputed(uint256 indexed marketId, address indexed disputer, string reason);
```

**Security Considerations**:
- World ID nullifier hash prevents same person from participating multiple times
- Separate nullifier tracking per market allows same person across different markets
- CRE-only settlement prevents manipulation
- Dispute mechanism provides recourse for incorrect resolutions
- Platform fee covers operational costs and incentivizes proper maintenance


### GovernanceModule.sol - Detailed Specification

**Purpose**: Manages World ID verified governance proposals, voting, and emergency overrides.

**State Variables**:
```solidity
// World ID integration
IWorldID public worldId;
mapping(uint256 => bool) public usedVoteNullifiers;

// Proposal structure
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
    address[] voters;
    bool isEmergency;
}

struct Vote {
    bool support;
    uint256 nullifierHash;
    uint256 timestamp;
}

enum ProposalStatus {
    Active,
    Succeeded,
    Defeated,
    Executed,
    Cancelled
}

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
```

**Core Functions**:

```solidity
function createProposal(
    string calldata title,
    string calldata description,
    address targetContract,
    bytes calldata callData,
    uint256 merkleRoot,
    uint256 nullifierHash,
    uint256[8] calldata proof
) external returns (uint256 proposalId)
```
- Verifies World ID proof
- Validates targetContract is whitelisted
- Creates new Proposal struct
- Sets votingEndTime = block.timestamp + votingPeriod
- Sets status = Active
- Sets isEmergency = false
- Emits ProposalCreated event
- Returns proposalId

```solidity
function createEmergencyProposal(
    string calldata title,
    string calldata description,
    address targetContract,
    bytes calldata callData,
    uint256 riskScore,
    string calldata aiReasoning
) external onlyAuthorizedCRE returns (uint256 proposalId)
```
- Validates riskScore >= 90
- Creates new Proposal struct
- Sets votingEndTime = block.timestamp + emergencyVotingPeriod (24 hours)
- Sets status = Active
- Sets isEmergency = true
- Includes risk data in proposal metadata
- Emits EmergencyProposalCreated event
- Triggers notification to all governance participants
- Returns proposalId

```solidity
function vote(
    uint256 proposalId,
    bool support,
    uint256 merkleRoot,
    uint256 nullifierHash,
    uint256[8] calldata proof
) external
```
- Verifies World ID proof
- Checks nullifierHash not used for this proposal
- Validates proposal exists and status == Active
- Validates block.timestamp < proposal.votingEndTime
- Records vote with nullifierHash
- Updates votesFor or votesAgainst
- Adds voter to voters list
- Stores usedVoteNullifiers[nullifierHash] = true
- Emits VoteCast event

```solidity
function executeProposal(uint256 proposalId) external
```
- Validates proposal.status == Active
- Validates block.timestamp >= proposal.votingEndTime
- Calculates quorum: `(proposal.votesFor + proposal.votesAgainst) * 100 / totalVerifiedHumans`
- Validates quorum >= quorumPercentage
- Determines outcome: votesFor > votesAgainst
- If succeeded:
  - Sets status = Succeeded
  - Executes call to targetContract with callData
  - Sets status = Executed
  - Emits ProposalExecuted event
- If defeated:
  - Sets status = Defeated
  - Emits ProposalDefeated event

```solidity
function guardianOverride(
    uint256 proposalId,
    string calldata justification
) external onlyGuardianMultiSig
```
- Validates msg.sender == guardianMultiSig
- Validates proposal.isEmergency == true
- Executes proposal immediately regardless of votes
- Sets guardianOverrides[proposalId] = true
- Sets proposal.status = Executed
- Emits GuardianOverride event with justification
- Used only for critical system failures

```solidity
function updateTotalVerifiedHumans(uint256 newTotal) external onlyWorldIDOracle
```
- Updates totalVerifiedHumans
- Used for accurate quorum calculations
- Emits VerifiedHumansUpdated event

**Events**:
```solidity
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
event ProposalDefeated(uint256 indexed proposalId, uint256 votesFor, uint256 votesAgainst);
event GuardianOverride(
    uint256 indexed proposalId,
    address indexed guardian,
    string justification,
    uint256 timestamp
);
```

**Security Considerations**:
- World ID prevents sybil attacks on governance
- Nullifier tracking prevents double voting
- Guardian multi-sig provides emergency override for critical failures
- Quorum requirements prevent low-participation attacks
- Emergency proposals have shortened voting period for rapid response
- Whitelist for target contracts prevents malicious proposal execution


---

## World ID Integration Layer

### Architecture Decision: Hybrid On-Chain + Off-Chain Verification

**Decision**: Implement both on-chain and off-chain World ID verification paths with intelligent routing based on use case.

**Rationale**:

**On-Chain Verification** (Used for: Governance voting, Market settlement, Critical vault operations)
- **Pros**: Trustless, verifiable on-chain, no backend dependency, immutable audit trail
- **Cons**: Higher gas costs (~150k gas per verification), slower UX, blockchain congestion risk
- **Use When**: Security and trustlessness are paramount, operations are infrequent, gas costs acceptable

**Off-Chain Verification** (Used for: Market participation, Vault deposits, Dashboard access)
- **Pros**: Lower cost (free), faster UX, scalable to high volume, flexible caching
- **Cons**: Requires backend trust, verification not on-chain, potential centralization
- **Use When**: High frequency operations, cost sensitivity, acceptable trust model

**Hybrid Strategy**:
```
High-Value Operations (>$10k, Governance) → On-Chain Verification
Medium-Value Operations ($1k-$10k) → Off-Chain with On-Chain Audit
Low-Value Operations (<$1k) → Off-Chain with Caching
```

### Frontend World ID Integration

**SDK Integration** (Next.js):
```typescript
import { IDKitWidget, ISuccessResult } from '@worldcoin/idkit'

// Configuration
const worldIdConfig = {
  app_id: process.env.NEXT_PUBLIC_WORLD_ID_APP_ID,
  action: 'aether-sentinel-governance-vote', // Unique per action type
  signal: proposalId.toString(), // Prevents proof reuse across proposals
  verification_level: 'orb', // 'orb' or 'device'
}

// Proof Generation Flow
function WorldIDVerification({ onSuccess, actionId, signal }) {
  const handleVerify = async (proof: ISuccessResult) => {
    // proof contains: merkle_root, nullifier_hash, proof, verification_level
    
    // Route based on verification strategy
    if (requiresOnChainVerification(actionId)) {
      // Include proof in transaction calldata
      await executeOnChainVerification(proof)
    } else {
      // Send to backend for off-chain verification
      await executeOffChainVerification(proof)
    }
    
    onSuccess(proof)
  }

  return (
    <IDKitWidget
      app_id={worldIdConfig.app_id}
      action={actionId}
      signal={signal}
      onSuccess={handleVerify}
      verification_level={worldIdConfig.verification_level}
    />
  )
}
```

**On-Chain Verification Flow**:
```typescript
async function executeOnChainVerification(proof: ISuccessResult) {
  const { merkle_root, nullifier_hash, proof: zkProof } = proof
  
  // Convert proof to contract format
  const unpackedProof = unpackProof(zkProof)
  
  // Include in transaction
  const tx = await governanceContract.vote(
    proposalId,
    support,
    merkle_root,
    nullifier_hash,
    unpackedProof,
    { gasLimit: 500000 } // Higher gas for verification
  )
  
  await tx.wait()
}
```

**Off-Chain Verification Flow**:
```typescript
async function executeOffChainVerification(proof: ISuccessResult) {
  // Send to backend for verification
  const response = await fetch('/api/verify-world-id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proof: proof.proof,
      merkle_root: proof.merkle_root,
      nullifier_hash: proof.nullifier_hash,
      verification_level: proof.verification_level,
      action: actionId,
      signal: signal,
    }),
  })
  
  const { verified, jwt } = await response.json()
  
  if (verified) {
    // Store JWT for subsequent requests
    localStorage.setItem('world_id_jwt', jwt)
    return jwt
  } else {
    throw new Error('World ID verification failed')
  }
}
```

### Backend World ID Validation Service

**Verification Endpoint** (Node.js/Express):
```typescript
import axios from 'axios'
import jwt from 'jsonwebtoken'

interface WorldIDProof {
  proof: string
  merkle_root: string
  nullifier_hash: string
  verification_level: 'orb' | 'device'
  action: string
  signal: string
}

async function verifyWorldIDProof(proofData: WorldIDProof): Promise<boolean> {
  try {
    // Call World ID verification API
    const response = await axios.post(
      'https://developer.worldcoin.org/api/v1/verify',
      {
        proof: proofData.proof,
        merkle_root: proofData.merkle_root,
        nullifier_hash: proofData.nullifier_hash,
        verification_level: proofData.verification_level,
        action: proofData.action,
        signal: proofData.signal,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    )
    
    return response.data.success === true
  } catch (error) {
    console.error('World ID verification failed:', error)
    return false
  }
}

// Express endpoint
app.post('/api/verify-world-id', async (req, res) => {
  const proofData: WorldIDProof = req.body
  
  // Validate required fields
  if (!proofData.proof || !proofData.nullifier_hash) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  
  // Check if nullifier already used (prevent replay)
  const nullifierUsed = await checkNullifierUsed(
    proofData.nullifier_hash,
    proofData.action
  )
  
  if (nullifierUsed) {
    return res.status(400).json({ error: 'Proof already used' })
  }
  
  // Verify proof with World ID API
  const verified = await verifyWorldIDProof(proofData)
  
  if (!verified) {
    return res.status(401).json({ error: 'Verification failed' })
  }
  
  // Store nullifier to prevent reuse
  await storeNullifier(proofData.nullifier_hash, proofData.action)
  
  // Generate JWT with verified claim
  const token = jwt.sign(
    {
      nullifier_hash: proofData.nullifier_hash,
      verification_level: proofData.verification_level,
      action: proofData.action,
      verified_at: Date.now(),
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
  
  // Cache verification result
  await cacheVerification(proofData.nullifier_hash, token, 3600)
  
  res.json({ verified: true, jwt: token })
})
```

**Nullifier Management**:
```typescript
// Redis-based nullifier tracking
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

async function checkNullifierUsed(
  nullifierHash: string,
  action: string
): Promise<boolean> {
  const key = `nullifier:${action}:${nullifierHash}`
  const exists = await redis.exists(key)
  return exists === 1
}

async function storeNullifier(
  nullifierHash: string,
  action: string
): Promise<void> {
  const key = `nullifier:${action}:${nullifierHash}`
  // Store permanently (nullifiers should never be reused)
  await redis.set(key, Date.now())
}

async function cacheVerification(
  nullifierHash: string,
  jwt: string,
  ttl: number
): Promise<void> {
  const key = `verification:${nullifierHash}`
  await redis.setex(key, ttl, jwt)
}
```

### Smart Contract World ID Verification

**On-Chain Verifier Integration**:
```solidity
// Interface for World ID verifier contract
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

// Integration in GovernanceModule
contract GovernanceModule {
    IWorldID public worldId;
    uint256 public externalNullifierHash;
    
    function vote(
        uint256 proposalId,
        bool support,
        uint256 merkleRoot,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external {
        // Check nullifier not used
        require(
            !usedVoteNullifiers[nullifierHash],
            "Nullifier already used"
        );
        
        // Verify World ID proof
        worldId.verifyProof(
            merkleRoot,
            1, // groupId for World ID
            abi.encodePacked(proposalId).hashToField(),
            nullifierHash,
            externalNullifierHash,
            proof
        );
        
        // Mark nullifier as used
        usedVoteNullifiers[nullifierHash] = true;
        
        // Record vote
        _recordVote(proposalId, msg.sender, support, nullifierHash);
    }
}
```

**Action ID Strategy**:
```
aether-sentinel-governance-vote → Unique per proposal via signal
aether-sentinel-market-create → Unique per user (can create multiple markets)
aether-sentinel-market-participate → Unique per market via signal
aether-sentinel-vault-deposit → Reusable (same person can deposit multiple times)
```

**Security Considerations**:
- Nullifier hashes prevent proof reuse within same action
- Signal parameter (e.g., proposalId) makes proofs action-specific
- External nullifier hash prevents cross-application proof reuse
- JWT expiration limits off-chain verification window
- Redis persistence ensures nullifier tracking survives restarts
- Rate limiting on verification endpoint prevents DoS


---

## AI Risk Engine Architecture

### System Design

**Technology Stack**:
- **Framework**: Python 3.11 + FastAPI
- **ML Library**: TensorFlow 2.14 / PyTorch 2.1
- **Model Type**: Ensemble (Random Forest + LSTM + Gradient Boosting)
- **Deployment**: Docker container on AWS ECS / GCP Cloud Run
- **Monitoring**: Prometheus + Grafana for model performance

**Architecture Components**:
```
┌─────────────────────────────────────────────────────────────┐
│                    AI Risk Engine Service                    │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Data           │  │ Feature        │  │ Model         │ │
│  │ Aggregation    │─▶│ Engineering    │─▶│ Inference     │ │
│  │ Layer          │  │ Layer          │  │ Layer         │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ On-Chain Data  │  │ Anomaly        │  │ Response      │ │
│  │ Fetcher        │  │ Detection      │  │ Formatter     │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Fail-Safe Logic: Return risk=50, confidence=0.3       │ │
│  │ if model inference fails                               │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Input Data Structure

**Request Schema**:
```json
{
  "vault_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "timestamp": 1704067200,
  "on_chain_data": {
    "reserve_ratio": 0.25,
    "total_deposits": "1000000000000000000000",
    "total_liabilities": "800000000000000000000",
    "recent_transactions": [
      {
        "type": "withdrawal",
        "amount": "50000000000000000000",
        "timestamp": 1704066000,
        "user": "0x..."
      }
    ],
    "deposit_velocity": 0.05,
    "withdrawal_velocity": 0.12
  },
  "market_data": {
    "volatility_index": 45.2,
    "liquidity_depth": "5000000000000000000000",
    "price_feeds": {
      "ETH_USD": 2250.50,
      "BTC_USD": 42000.00
    },
    "market_sentiment": 0.35
  },
  "historical_context": {
    "avg_reserve_ratio_7d": 0.28,
    "max_withdrawal_24h": "100000000000000000000",
    "unique_depositors_7d": 150
  }
}
```

### Feature Engineering

**Weighted Risk Components**:

1. **Reserve Ratio Analysis (30% weight)**:
   ```python
   def calculate_reserve_ratio_risk(reserve_ratio: float, historical_avg: float) -> float:
       # Deviation from historical average
       deviation = abs(reserve_ratio - historical_avg) / historical_avg
       
       # Absolute threshold risk
       if reserve_ratio < 0.15:
           threshold_risk = 100
       elif reserve_ratio < 0.20:
           threshold_risk = 80
       elif reserve_ratio < 0.25:
           threshold_risk = 50
       else:
           threshold_risk = 20
       
       # Combine deviation and threshold
       risk = (deviation * 50) + (threshold_risk * 0.5)
       return min(risk, 100)
   ```

2. **Volatility Analysis (25% weight)**:
   ```python
   def calculate_volatility_risk(volatility_index: float, price_feeds: dict) -> float:
       # VIX-style volatility scoring
       base_risk = (volatility_index / 100) * 100
       
       # Price correlation analysis
       price_changes = calculate_price_changes(price_feeds)
       correlation_risk = analyze_correlation_breakdown(price_changes)
       
       return (base_risk * 0.7) + (correlation_risk * 0.3)
   ```

3. **Liquidity Flow Analysis (25% weight)**:
   ```python
   def calculate_liquidity_risk(
       deposit_velocity: float,
       withdrawal_velocity: float,
       liquidity_depth: float
   ) -> float:
       # Net flow analysis
       net_flow = withdrawal_velocity - deposit_velocity
       
       # Liquidity depth adequacy
       depth_ratio = liquidity_depth / total_liabilities
       
       # Risk increases with negative flow and low depth
       flow_risk = max(0, net_flow * 100)
       depth_risk = max(0, (0.5 - depth_ratio) * 200)
       
       return (flow_risk * 0.6) + (depth_risk * 0.4)
   ```

4. **Abnormal Withdrawal Detection (20% weight)**:
   ```python
   def detect_abnormal_withdrawals(
       recent_transactions: list,
       historical_context: dict
   ) -> tuple[float, list]:
       # Statistical anomaly detection
       withdrawal_amounts = [tx['amount'] for tx in recent_transactions if tx['type'] == 'withdrawal']
       
       # Z-score analysis
       mean = historical_context['avg_withdrawal']
       std = historical_context['std_withdrawal']
       
       anomalies = []
       for tx in recent_transactions:
           if tx['type'] == 'withdrawal':
               z_score = (tx['amount'] - mean) / std
               if abs(z_score) > 3:  # 3 sigma threshold
                   anomalies.append({
                       'address': tx['user'],
                       'amount': tx['amount'],
                       'z_score': z_score,
                       'timestamp': tx['timestamp']
                   })
       
       # Risk based on number and severity of anomalies
       risk = min(len(anomalies) * 25, 100)
       return risk, anomalies
   ```

### Model Inference

**Ensemble Approach**:
```python
class RiskEnsembleModel:
    def __init__(self):
        self.random_forest = load_model('models/random_forest.pkl')
        self.lstm = load_model('models/lstm.h5')
        self.gradient_boosting = load_model('models/xgboost.pkl')
        
    def predict(self, features: np.ndarray) -> dict:
        # Get predictions from each model
        rf_pred = self.random_forest.predict_proba(features)[0][1]
        lstm_pred = self.lstm.predict(features)[0][0]
        gb_pred = self.gradient_boosting.predict_proba(features)[0][1]
        
        # Weighted ensemble (RF: 40%, LSTM: 35%, GB: 25%)
        ensemble_score = (rf_pred * 0.40) + (lstm_pred * 0.35) + (gb_pred * 0.25)
        
        # Calculate confidence based on model agreement
        predictions = [rf_pred, lstm_pred, gb_pred]
        confidence = 1.0 - (np.std(predictions) / np.mean(predictions))
        
        return {
            'risk_score': ensemble_score * 100,
            'confidence': confidence,
            'model_breakdown': {
                'random_forest': rf_pred,
                'lstm': lstm_pred,
                'gradient_boosting': gb_pred
            }
        }
```

### Output Format

**Response Schema** (Deterministic for CRE):
```json
{
  "risk_score": 85,
  "recommended_action": "EMERGENCY_PAUSE",
  "confidence_level": 0.92,
  "reasoning": "Critical risk detected: Reserve ratio dropped to 18% (below 20% threshold). Abnormal withdrawal pattern detected from 3 addresses totaling $500k in last hour. Market volatility index at 65 (elevated). Recommend immediate emergency pause to prevent potential bank run.",
  "component_scores": {
    "reserve_ratio_risk": 90,
    "volatility_risk": 75,
    "liquidity_risk": 80,
    "abnormal_withdrawal_risk": 95
  },
  "anomalies_detected": [
    {
      "type": "large_withdrawal",
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "amount": "200000000000000000000",
      "z_score": 4.2,
      "timestamp": 1704066000
    }
  ],
  "timestamp": 1704067200,
  "model_version": "v2.3.1"
}
```

**Action Mapping**:
```python
def determine_recommended_action(risk_score: float) -> str:
    if risk_score >= 90:
        return "EMERGENCY_PAUSE"
    elif risk_score >= 80:
        return "ADJUST_RESERVE_RATIO"
    elif risk_score >= 60:
        return "INCREASE_MONITORING"
    else:
        return "NORMAL_OPERATION"
```

### REST API Specification

**Endpoint**: `POST /api/v1/assess-risk`

**Authentication**: Bearer token (JWT)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <uuid>
```

**Rate Limiting**: 100 requests/minute per API key

**Timeout**: 5 seconds

**Example cURL**:
```bash
curl -X POST https://ai-risk-engine.aether-sentinel.io/api/v1/assess-risk \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d @risk_assessment_request.json
```

### Fail-Safe Logic

**Failure Scenarios and Responses**:

1. **Model Inference Failure**:
   ```python
   try:
       risk_score = model.predict(features)
   except Exception as e:
       logger.error(f"Model inference failed: {e}")
       return {
           "risk_score": 50,
           "recommended_action": "INCREASE_MONITORING",
           "confidence_level": 0.3,
           "reasoning": "Model inference failed. Returning conservative fail-safe score.",
           "error": str(e)
       }
   ```

2. **Data Fetch Timeout**:
   ```python
   if not on_chain_data_available:
       # Use last known good data
       cached_data = get_cached_risk_assessment(vault_address)
       if cached_data and (time.now() - cached_data.timestamp) < 3600:
           return {
               **cached_data,
               "stale": True,
               "staleness_seconds": time.now() - cached_data.timestamp
           }
   ```

3. **Invalid Input Data**:
   ```python
   def validate_input(data: dict) -> tuple[bool, str]:
       if data['reserve_ratio'] < 0 or data['reserve_ratio'] > 1:
           return False, "Invalid reserve ratio"
       if data['volatility_index'] < 0 or data['volatility_index'] > 100:
           return False, "Invalid volatility index"
       return True, ""
   ```

### Historical Audit Trail

**Database Schema** (PostgreSQL):
```sql
CREATE TABLE risk_assessments (
    id SERIAL PRIMARY KEY,
    request_id UUID NOT NULL,
    vault_address VARCHAR(42) NOT NULL,
    risk_score INTEGER NOT NULL,
    recommended_action VARCHAR(50) NOT NULL,
    confidence_level DECIMAL(3,2) NOT NULL,
    reasoning TEXT NOT NULL,
    component_scores JSONB NOT NULL,
    anomalies_detected JSONB,
    model_version VARCHAR(20) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_vault_address (vault_address),
    INDEX idx_created_at (created_at),
    INDEX idx_risk_score (risk_score)
);
```

**Retention Policy**: 90 days for detailed logs, 2 years for aggregated metrics

**Monitoring Metrics**:
- Average response time
- Model prediction distribution
- Confidence level distribution
- Error rate by error type
- API request rate and throttling events


---

## CRE Workflow Orchestration

### Chainlink Runtime Environment Overview

CRE enables autonomous multi-step workflows that combine on-chain and off-chain operations with conditional logic, error handling, and cross-chain capabilities. AETHER SENTINEL leverages CRE for three critical workflows that operate without human intervention.

### Workflow A: Continuous Risk Monitoring

**Purpose**: Continuously monitor vault health and trigger safeguards when risk thresholds are breached.

**Trigger**: Time-based (every 15 minutes) + Event-based (large withdrawal detected)

**Workflow Steps**:

```yaml
name: continuous_risk_monitoring
version: 1.0.0
trigger:
  schedule: "*/15 * * * *"  # Every 15 minutes
  events:
    - contract: TokenizedVault
      event: Withdrawal
      filter: amount > 100 ETH

steps:
  - id: fetch_vault_state
    type: contract_read
    contract: TokenizedVault
    function: getVaultState
    outputs:
      - reserve_ratio
      - total_deposits
      - total_liabilities
      - paused
    error_handling:
      retry: 3
      backoff: exponential
      fallback: use_cached_data

  - id: fetch_recent_transactions
    type: contract_read
    contract: TokenizedVault
    function: getRecentTransactions
    params:
      count: 100
      time_window: 3600  # Last hour
    outputs:
      - transactions

  - id: fetch_market_data
    type: http_request
    url: https://api.coingecko.com/api/v3/simple/price
    method: GET
    params:
      ids: ethereum,bitcoin
      vs_currencies: usd
      include_24hr_vol: true
    outputs:
      - price_data
    timeout: 5000
    error_handling:
      retry: 2
      fallback: use_cached_prices

  - id: fetch_volatility_index
    type: http_request
    url: https://api.volatility-index.com/v1/current
    method: GET
    headers:
      Authorization: Bearer ${VOLATILITY_API_KEY}
    outputs:
      - volatility_index
    timeout: 5000

  - id: aggregate_data
    type: compute
    function: |
      function aggregateData(vaultState, transactions, marketData, volatilityIndex) {
        return {
          vault_address: vaultState.address,
          timestamp: Date.now() / 1000,
          on_chain_data: {
            reserve_ratio: vaultState.reserve_ratio / 10000,
            total_deposits: vaultState.total_deposits,
            total_liabilities: vaultState.total_liabilities,
            recent_transactions: transactions,
            deposit_velocity: calculateDepositVelocity(transactions),
            withdrawal_velocity: calculateWithdrawalVelocity(transactions)
          },
          market_data: {
            volatility_index: volatilityIndex.value,
            liquidity_depth: marketData.total_volume_24h,
            price_feeds: marketData.prices,
            market_sentiment: calculateSentiment(marketData)
          },
          historical_context: {
            avg_reserve_ratio_7d: vaultState.historical_avg,
            max_withdrawal_24h: vaultState.max_withdrawal,
            unique_depositors_7d: vaultState.unique_depositors
          }
        }
      }
    outputs:
      - aggregated_data

  - id: call_ai_risk_engine
    type: http_request
    url: https://ai-risk-engine.aether-sentinel.io/api/v1/assess-risk
    method: POST
    headers:
      Authorization: Bearer ${AI_ENGINE_JWT}
      Content-Type: application/json
      X-Request-ID: ${workflow_execution_id}
    body: ${aggregated_data}
    timeout: 5000
    outputs:
      - risk_assessment
    error_handling:
      retry: 3
      backoff: exponential
      fallback: use_last_assessment

  - id: evaluate_risk_score
    type: conditional
    condition: ${risk_assessment.risk_score} >= 60
    branches:
      true: execute_risk_response
      false: log_normal_operation

  - id: execute_risk_response
    type: contract_write
    contract: RiskGuardian
    function: executeRiskResponse
    params:
      riskScore: ${risk_assessment.risk_score}
      recommendedAction: ${risk_assessment.recommended_action}
      confidence: ${risk_assessment.confidence_level}
      reasoning: ${risk_assessment.reasoning}
    gas_limit: 500000
    error_handling:
      retry: 2
      on_failure: emit_alert

  - id: log_normal_operation
    type: event_emit
    event: RiskMonitoringCompleted
    data:
      risk_score: ${risk_assessment.risk_score}
      status: normal
      timestamp: ${timestamp}

  - id: emit_workflow_completion
    type: event_emit
    event: WorkflowACompleted
    data:
      execution_id: ${workflow_execution_id}
      risk_score: ${risk_assessment.risk_score}
      action_taken: ${risk_assessment.recommended_action}
      execution_time_ms: ${execution_time}
      timestamp: ${timestamp}
```

**Error Handling Strategy**:
- **Transient Failures**: Exponential backoff retry (3 attempts)
- **Data Unavailable**: Use cached data with staleness indicator
- **AI Engine Down**: Use last known risk score, increase monitoring frequency
- **Contract Call Failure**: Emit alert to guardian multi-sig, log for manual review

**Performance Metrics**:
- Target execution time: < 30 seconds
- Success rate: > 99.5%
- Data freshness: < 5 minutes


### Workflow B: Prediction Market Resolution

**Purpose**: Automatically resolve prediction markets by fetching real-world data from multiple oracle sources and settling based on consensus.

**Trigger**: Event-based (market reaches end time)

**Workflow Steps**:

```yaml
name: prediction_market_resolution
version: 1.0.0
trigger:
  events:
    - contract: PredictionMarket
      event: MarketClosed
      params:
        - marketId

steps:
  - id: fetch_market_details
    type: contract_read
    contract: PredictionMarket
    function: getMarketDetails
    params:
      marketId: ${event.marketId}
    outputs:
      - market_question
      - outcomes
      - resolution_criteria
      - end_time

  - id: fetch_oracle_source_1
    type: http_request
    url: ${resolution_criteria.oracle_1_url}
    method: GET
    headers:
      Authorization: Bearer ${ORACLE_1_API_KEY}
    outputs:
      - oracle_1_result
    timeout: 10000
    error_handling:
      retry: 3
      on_failure: mark_as_failed

  - id: fetch_oracle_source_2
    type: http_request
    url: ${resolution_criteria.oracle_2_url}
    method: GET
    headers:
      Authorization: Bearer ${ORACLE_2_API_KEY}
    outputs:
      - oracle_2_result
    timeout: 10000
    error_handling:
      retry: 3
      on_failure: mark_as_failed

  - id: fetch_oracle_source_3
    type: http_request
    url: ${resolution_criteria.oracle_3_url}
    method: GET
    headers:
      Authorization: Bearer ${ORACLE_3_API_KEY}
    outputs:
      - oracle_3_result
    timeout: 10000
    error_handling:
      retry: 3
      on_failure: mark_as_failed

  - id: validate_consensus
    type: compute
    function: |
      function validateConsensus(oracle1, oracle2, oracle3, outcomes) {
        const results = [oracle1, oracle2, oracle3].filter(r => r !== null)
        
        if (results.length < 2) {
          return { consensus: false, reason: "Insufficient oracle responses" }
        }
        
        // Count votes for each outcome
        const votes = {}
        results.forEach(result => {
          const outcome = mapResultToOutcome(result, outcomes)
          votes[outcome] = (votes[outcome] || 0) + 1
        })
        
        // Require 2/3 consensus
        const maxVotes = Math.max(...Object.values(votes))
        if (maxVotes >= 2) {
          const winningOutcome = Object.keys(votes).find(k => votes[k] === maxVotes)
          return {
            consensus: true,
            winning_outcome: winningOutcome,
            vote_breakdown: votes,
            confidence: maxVotes / results.length
          }
        }
        
        return { consensus: false, reason: "No consensus reached" }
      }
    outputs:
      - consensus_result

  - id: check_consensus
    type: conditional
    condition: ${consensus_result.consensus} === true
    branches:
      true: settle_market
      false: escalate_to_dispute

  - id: settle_market
    type: contract_write
    contract: PredictionMarket
    function: settleMarket
    params:
      marketId: ${event.marketId}
      winningOutcome: ${consensus_result.winning_outcome}
      resolutionData: JSON.stringify(${consensus_result})
    gas_limit: 800000
    error_handling:
      retry: 2
      on_failure: escalate_to_manual

  - id: emit_settlement_event
    type: event_emit
    event: MarketSettledByWorkflow
    data:
      market_id: ${event.marketId}
      winning_outcome: ${consensus_result.winning_outcome}
      confidence: ${consensus_result.confidence}
      oracle_breakdown: ${consensus_result.vote_breakdown}
      timestamp: ${timestamp}

  - id: escalate_to_dispute
    type: contract_write
    contract: PredictionMarket
    function: escalateToDispute
    params:
      marketId: ${event.marketId}
      reason: ${consensus_result.reason}
    gas_limit: 300000

  - id: notify_governance
    type: http_request
    url: https://api.aether-sentinel.io/v1/notify-governance
    method: POST
    body:
      market_id: ${event.marketId}
      status: disputed
      reason: ${consensus_result.reason}
      requires_manual_resolution: true
```

**Oracle Source Configuration**:
```json
{
  "market_types": {
    "price_prediction": {
      "oracles": [
        "https://api.coingecko.com",
        "https://api.coinmarketcap.com",
        "https://api.binance.com"
      ]
    },
    "event_outcome": {
      "oracles": [
        "https://api.newsapi.org",
        "https://api.eventregistry.org",
        "https://api.gdeltproject.org"
      ]
    },
    "sports_result": {
      "oracles": [
        "https://api.sportsdata.io",
        "https://api.espn.com",
        "https://api.thesportsdb.com"
      ]
    }
  }
}
```

**Consensus Logic**:
- Require 2 out of 3 oracle agreement
- If no consensus: Escalate to governance dispute resolution
- If oracle unavailable: Retry 3 times, then mark as failed
- Confidence score: (agreeing_oracles / total_responding_oracles)


### Workflow C: Emergency Governance Trigger

**Purpose**: Automatically create emergency governance proposals when critical risk conditions are detected, enabling rapid community response.

**Trigger**: Conditional (risk score >= 90)

**Workflow Steps**:

```yaml
name: emergency_governance_trigger
version: 1.0.0
trigger:
  condition: ${risk_assessment.risk_score} >= 90

steps:
  - id: validate_critical_risk
    type: compute
    function: |
      function validateCriticalRisk(riskAssessment) {
        // Double-check risk score and confidence
        if (riskAssessment.risk_score < 90) {
          return { valid: false, reason: "Risk score below threshold" }
        }
        if (riskAssessment.confidence_level < 0.7) {
          return { valid: false, reason: "Confidence too low for emergency action" }
        }
        return { valid: true }
      }
    outputs:
      - validation_result

  - id: check_validation
    type: conditional
    condition: ${validation_result.valid} === true
    branches:
      true: create_emergency_proposal
      false: log_and_exit

  - id: prepare_proposal_data
    type: compute
    function: |
      function prepareProposalData(riskAssessment, vaultState) {
        const title = `EMERGENCY: Critical Risk Detected - Risk Score ${riskAssessment.risk_score}`
        
        const description = `
          CRITICAL RISK ALERT
          
          Risk Score: ${riskAssessment.risk_score}/100
          Confidence: ${(riskAssessment.confidence_level * 100).toFixed(1)}%
          
          AI Analysis:
          ${riskAssessment.reasoning}
          
          Current Vault State:
          - Reserve Ratio: ${(vaultState.reserve_ratio / 100).toFixed(2)}%
          - Total Deposits: ${formatEther(vaultState.total_deposits)} ETH
          - Total Liabilities: ${formatEther(vaultState.total_liabilities)} ETH
          
          Recommended Action: ${riskAssessment.recommended_action}
          
          Component Risk Breakdown:
          - Reserve Ratio Risk: ${riskAssessment.component_scores.reserve_ratio_risk}
          - Volatility Risk: ${riskAssessment.component_scores.volatility_risk}
          - Liquidity Risk: ${riskAssessment.component_scores.liquidity_risk}
          - Abnormal Withdrawal Risk: ${riskAssessment.component_scores.abnormal_withdrawal_risk}
          
          Anomalies Detected:
          ${formatAnomalies(riskAssessment.anomalies_detected)}
          
          This proposal was automatically generated by CRE Workflow C.
          Voting period: 24 hours
          Quorum required: 40% of verified humans
        `
        
        // Determine target contract and calldata based on recommended action
        let targetContract, callData
        if (riskAssessment.recommended_action === "EMERGENCY_PAUSE") {
          targetContract = vaultState.address
          callData = encodeFunctionCall("emergencyPause", [])
        } else if (riskAssessment.recommended_action === "ADJUST_RESERVE_RATIO") {
          const newRatio = Math.min(vaultState.reserve_ratio * 1.5, 5000)
          targetContract = vaultState.address
          callData = encodeFunctionCall("adjustMinimumReserveRatio", [newRatio])
        }
        
        return { title, description, targetContract, callData }
      }
    outputs:
      - proposal_data

  - id: create_emergency_proposal
    type: contract_write
    contract: GovernanceModule
    function: createEmergencyProposal
    params:
      title: ${proposal_data.title}
      description: ${proposal_data.description}
      targetContract: ${proposal_data.targetContract}
      callData: ${proposal_data.callData}
      riskScore: ${risk_assessment.risk_score}
      aiReasoning: ${risk_assessment.reasoning}
    gas_limit: 1000000
    error_handling:
      retry: 2
      on_failure: notify_guardians

  - id: fetch_governance_participants
    type: contract_read
    contract: GovernanceModule
    function: getAllVerifiedParticipants
    outputs:
      - participant_addresses

  - id: notify_all_participants
    type: parallel
    tasks:
      - id: send_email_notifications
        type: http_request
        url: https://api.aether-sentinel.io/v1/notify-email
        method: POST
        body:
          recipients: ${participant_addresses}
          subject: "EMERGENCY GOVERNANCE VOTE REQUIRED"
          template: emergency_vote
          data:
            proposal_id: ${create_emergency_proposal.proposalId}
            risk_score: ${risk_assessment.risk_score}
            voting_deadline: ${Date.now() + 86400000}

      - id: send_push_notifications
        type: http_request
        url: https://api.aether-sentinel.io/v1/notify-push
        method: POST
        body:
          recipients: ${participant_addresses}
          title: "Emergency Vote Required"
          body: "Critical risk detected. Vote now."
          data:
            proposal_id: ${create_emergency_proposal.proposalId}

      - id: post_to_discord
        type: http_request
        url: ${DISCORD_WEBHOOK_URL}
        method: POST
        body:
          content: "@everyone EMERGENCY GOVERNANCE VOTE"
          embeds:
            - title: ${proposal_data.title}
              description: ${proposal_data.description}
              color: 16711680  # Red
              url: https://app.aether-sentinel.io/governance/${create_emergency_proposal.proposalId}

  - id: monitor_voting_progress
    type: loop
    condition: ${voting_active} === true
    interval: 3600000  # Check every hour
    steps:
      - id: check_vote_status
        type: contract_read
        contract: GovernanceModule
        function: getProposalStatus
        params:
          proposalId: ${create_emergency_proposal.proposalId}
        outputs:
          - vote_status

      - id: check_quorum_reached
        type: conditional
        condition: ${vote_status.quorum_reached} === true
        branches:
          true: execute_proposal
          false: continue_monitoring

      - id: check_deadline_passed
        type: conditional
        condition: ${Date.now()} >= ${vote_status.voting_end_time}
        branches:
          true: finalize_vote
          false: continue_monitoring

  - id: execute_proposal
    type: contract_write
    contract: GovernanceModule
    function: executeProposal
    params:
      proposalId: ${create_emergency_proposal.proposalId}
    gas_limit: 1500000

  - id: finalize_vote
    type: conditional
    condition: ${vote_status.quorum_reached} === false
    branches:
      true: escalate_to_guardians
      false: execute_proposal

  - id: escalate_to_guardians
    type: http_request
    url: https://api.aether-sentinel.io/v1/notify-guardians
    method: POST
    body:
      proposal_id: ${create_emergency_proposal.proposalId}
      reason: "Quorum not reached within 24 hours"
      risk_score: ${risk_assessment.risk_score}
      requires_guardian_override: true

  - id: emit_workflow_completion
    type: event_emit
    event: WorkflowCCompleted
    data:
      proposal_id: ${create_emergency_proposal.proposalId}
      risk_score: ${risk_assessment.risk_score}
      outcome: ${vote_status.outcome}
      execution_time_ms: ${execution_time}
      timestamp: ${timestamp}
```

**Notification Channels**:
- Email (via SendGrid)
- Push notifications (via Firebase Cloud Messaging)
- Discord webhook
- Telegram bot
- SMS (via Twilio) for guardian multi-sig

**Escalation Path**:
```
Risk Score >= 90
  ↓
Create Emergency Proposal (24h voting period)
  ↓
Notify All Governance Participants
  ↓
Monitor Voting Progress (hourly checks)
  ↓
Quorum Reached? → Execute Proposal
  ↓
Quorum Not Reached? → Escalate to Guardian Multi-Sig
  ↓
Guardian Override → Execute Action Immediately
```

**Guardian Multi-Sig Configuration**:
- 3-of-5 multi-sig
- Guardians: Protocol founders, security auditors, institutional partners
- Override capability only for emergency proposals
- All overrides logged on-chain with justification


### Cross-Chain Operation Design

**Multi-Chain Support**:
- Primary Chain: Ethereum Mainnet (governance, high-value operations)
- Secondary Chains: Arbitrum, Optimism, Polygon (high-frequency operations)
- Bridge: Chainlink CCIP for cross-chain messaging

**Cross-Chain Risk Aggregation**:
```yaml
name: cross_chain_risk_aggregation
version: 1.0.0

steps:
  - id: fetch_ethereum_vault_state
    type: contract_read
    chain: ethereum
    contract: TokenizedVault
    function: getVaultState

  - id: fetch_arbitrum_vault_state
    type: contract_read
    chain: arbitrum
    contract: TokenizedVault
    function: getVaultState

  - id: fetch_optimism_vault_state
    type: contract_read
    chain: optimism
    contract: TokenizedVault
    function: getVaultState

  - id: aggregate_cross_chain_risk
    type: compute
    function: |
      function aggregateCrossChainRisk(ethState, arbState, opState) {
        const totalDeposits = ethState.total_deposits + arbState.total_deposits + opState.total_deposits
        const totalLiabilities = ethState.total_liabilities + arbState.total_liabilities + opState.total_liabilities
        const aggregatedReserveRatio = totalDeposits / totalLiabilities
        
        return {
          aggregated_reserve_ratio: aggregatedReserveRatio,
          chain_breakdown: {
            ethereum: ethState.reserve_ratio,
            arbitrum: arbState.reserve_ratio,
            optimism: opState.reserve_ratio
          },
          total_deposits: totalDeposits,
          total_liabilities: totalLiabilities
        }
      }

  - id: send_cross_chain_message
    type: ccip_send
    source_chain: ethereum
    destination_chain: arbitrum
    message:
      action: update_risk_parameters
      aggregated_risk: ${aggregated_cross_chain_risk}
```

---

## Privacy & Confidential Compute Layer

### Confidential Compute Strategy

**Technology Choice**: Intel SGX / AWS Nitro Enclaves

**Rationale**:
- Intel SGX: Hardware-level isolation, attestation support, mature ecosystem
- AWS Nitro Enclaves: Cloud-native, easier deployment, AWS integration
- Decision: Use AWS Nitro Enclaves for MVP, plan SGX migration for decentralization

### Private Liquidation Auctions

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Nitro Enclave                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Sealed Auction Logic                                  │ │
│  │  - Receive encrypted bids                              │ │
│  │  - Decrypt within enclave                              │ │
│  │  - Determine winner                                    │ │
│  │  - Reveal only winning bid                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Attestation Service                                   │ │
│  │  - Prove code integrity                                │ │
│  │  - Verify enclave authenticity                         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              Smart Contract (On-Chain Settlement)            │
│  - Verify enclave attestation                                │
│  - Accept winning bid commitment                             │
│  - Execute collateral transfer                               │
└──────────────────────────────────────────────────────────────┘
```

**Auction Flow**:

1. **Auction Initialization**:
   ```typescript
   // On-chain: Create auction
   const auctionId = await liquidationContract.createAuction({
     collateralToken: "0x...",
     collateralAmount: "1000000000000000000",
     minimumBid: "900000000000000000",
     duration: 3600, // 1 hour
   })
   
   // Off-chain: Initialize enclave
   const enclaveSession = await nitroCli.createEnclave({
     auctionId,
     attestationDocument: true,
   })
   ```

2. **Bid Submission**:
   ```typescript
   // Bidder generates encrypted bid
   const encryptedBid = await enclave.encryptBid({
     bidAmount: "950000000000000000",
     bidderAddress: "0x...",
     nonce: randomBytes(32),
   }, enclavePublicKey)
   
   // Submit to enclave (not on-chain)
   await enclave.submitBid(auctionId, encryptedBid)
   ```

3. **Auction Conclusion**:
   ```typescript
   // Enclave determines winner (private computation)
   const result = await enclave.concludeAuction(auctionId)
   // result = { winnerAddress, winningBid, attestation }
   
   // On-chain settlement
   await liquidationContract.settleAuction(
     auctionId,
     result.winnerAddress,
     result.winningBid,
     result.attestation
   )
   ```

**Privacy Guarantees**:
- Losing bids never revealed (not even to system operators)
- Bidding strategies remain private
- Only winning bid amount disclosed on-chain
- Enclave attestation proves correct execution

**Fallback Mechanism**:
```solidity
// If enclave fails or attestation invalid
function fallbackToPublicAuction(uint256 auctionId) external onlyGuardian {
    Auction storage auction = auctions[auctionId];
    require(auction.status == AuctionStatus.EnclaveFailure, "Not in failure state");
    
    // Convert to standard English auction
    auction.status = AuctionStatus.PublicAuction;
    auction.duration = block.timestamp + 1 hours;
    
    emit FallbackToPublicAuction(auctionId, block.timestamp);
}
```


### Hidden AI Threshold Logic

**Purpose**: Prevent adversaries from gaming the system by operating just below detection thresholds.

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Nitro Enclave                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Sealed Threshold Configuration                        │ │
│  │  - moderate_risk_threshold: 58 (hidden)               │ │
│  │  - elevated_risk_threshold: 77 (hidden)               │ │
│  │  - critical_risk_threshold: 89 (hidden)               │ │
│  │  - dynamic_adjustment_enabled: true                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Threshold Evaluation Logic                            │ │
│  │  function evaluateRisk(riskScore) {                    │ │
│  │    if (riskScore >= critical_threshold) {              │ │
│  │      return { action: "EMERGENCY_PAUSE", triggered: true } │ │
│  │    }                                                    │ │
│  │    // ... other thresholds                             │ │
│  │  }                                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Dynamic Threshold Adjustment                          │ │
│  │  - Adjust thresholds based on attack patterns         │ │
│  │  - Prevent threshold probing via timing analysis      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              Public Interface (On-Chain)                     │
│  - Receive risk score from AI engine                         │
│  - Return: { action_triggered: true/false }                  │
│  - NO threshold values exposed                               │
└──────────────────────────────────────────────────────────────┘
```

**Implementation**:

```typescript
// Enclave code (runs in AWS Nitro Enclave)
class SealedThresholdEvaluator {
  private thresholds: {
    moderate: number
    elevated: number
    critical: number
  }
  
  constructor() {
    // Load from encrypted configuration
    this.thresholds = this.loadSealedConfig()
  }
  
  evaluateRisk(riskScore: number): EvaluationResult {
    // Add random jitter to prevent timing attacks
    const jitter = Math.random() * 10
    await sleep(jitter)
    
    let action = "NONE"
    let triggered = false
    
    if (riskScore >= this.thresholds.critical) {
      action = "EMERGENCY_PAUSE"
      triggered = true
    } else if (riskScore >= this.thresholds.elevated) {
      action = "ADJUST_RESERVE_RATIO"
      triggered = true
    } else if (riskScore >= this.thresholds.moderate) {
      action = "INCREASE_MONITORING"
      triggered = true
    }
    
    // Log internally (never exposed)
    this.logEvaluation(riskScore, action, this.thresholds)
    
    // Return only action, not threshold or margin
    return { action, triggered }
  }
  
  // Secure multi-party computation for auditing
  async generateAuditProof(auditorPublicKeys: string[]): Promise<AuditProof> {
    // Use threshold encryption to allow auditors to verify
    // thresholds without revealing them publicly
    return await this.thresholdEncrypt(this.thresholds, auditorPublicKeys)
  }
  
  // Dynamic adjustment based on attack patterns
  adjustThresholds(attackPattern: AttackPattern): void {
    if (attackPattern.type === "threshold_probing") {
      // Randomly adjust thresholds by ±5%
      this.thresholds.critical += (Math.random() - 0.5) * 10
      this.thresholds.elevated += (Math.random() - 0.5) * 10
      this.thresholds.moderate += (Math.random() - 0.5) * 10
      
      this.logThresholdAdjustment(attackPattern)
    }
  }
}
```

**On-Chain Integration**:
```solidity
contract RiskGuardian {
    // Enclave attestation
    address public trustedEnclaveAddress;
    
    function executeRiskResponseWithEnclave(
        uint256 riskScore,
        bytes calldata enclaveAttestation,
        bytes calldata enclaveSignature
    ) external {
        // Verify call comes from attested enclave
        require(
            verifyEnclaveAttestation(enclaveAttestation, enclaveSignature),
            "Invalid enclave attestation"
        );
        
        // Enclave has already evaluated thresholds privately
        // We just execute the action without knowing the threshold
        _executeAction(riskScore);
        
        // Emit event WITHOUT threshold information
        emit RiskActionExecuted(riskScore, block.timestamp);
    }
}
```

**Anti-Probing Measures**:
1. **Timing Jitter**: Random delays prevent timing-based threshold discovery
2. **Dynamic Thresholds**: Thresholds adjust slightly over time
3. **Batch Processing**: Process multiple risk scores together to obscure individual evaluations
4. **Decoy Evaluations**: Occasionally trigger actions at random scores to confuse attackers

**Auditor Access**:
```typescript
// Auditors can verify thresholds using secure multi-party computation
async function auditThresholds(auditorKeys: string[]): Promise<void> {
  // Requires 3 of 5 auditors to reconstruct thresholds
  const proof = await enclave.generateAuditProof(auditorKeys)
  
  // Each auditor receives encrypted share
  // Only when 3+ combine shares can they see thresholds
  const shares = await distributeShares(proof, auditorKeys)
  
  // Auditors verify thresholds are reasonable
  // But cannot leak them publicly
}
```


### Private Treasury Operations

**Purpose**: Execute treasury rebalancing and large operations without revealing strategy or creating front-running opportunities.

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Nitro Enclave                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Treasury Strategy Engine                              │ │
│  │  - Portfolio optimization algorithm                    │ │
│  │  - Risk-adjusted allocation targets                    │ │
│  │  - Rebalancing thresholds                              │ │
│  │  - Slippage tolerance parameters                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Trade Execution Planner                               │ │
│  │  - Break large orders into smaller chunks             │ │
│  │  - Randomize execution timing                          │ │
│  │  - Route across multiple DEXs                          │ │
│  │  - Obfuscate final allocation target                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              On-Chain Execution (Batched & Obfuscated)       │
│  - Execute trades via DEX aggregators                        │
│  - Use multiple wallets to obscure total size               │
│  - Emit only aggregate position changes                      │
└──────────────────────────────────────────────────────────────┘
```

**Rebalancing Flow**:

```typescript
// Enclave: Calculate optimal allocation
class TreasuryStrategyEngine {
  async calculateRebalancing(
    currentPositions: Position[],
    marketConditions: MarketData
  ): Promise<RebalancingPlan> {
    // Private optimization algorithm
    const targetAllocation = this.optimizePortfolio(
      currentPositions,
      marketConditions,
      this.riskParameters
    )
    
    // Calculate required trades
    const trades = this.calculateTrades(currentPositions, targetAllocation)
    
    // Break into smaller chunks to prevent front-running
    const executionPlan = this.createExecutionPlan(trades, {
      maxChunkSize: 100000, // $100k per trade
      randomizeTimings: true,
      multipleRoutes: true,
    })
    
    return executionPlan
  }
  
  createExecutionPlan(trades: Trade[], options: ExecutionOptions): RebalancingPlan {
    const chunks = []
    
    for (const trade of trades) {
      // Split large trades
      const numChunks = Math.ceil(trade.amount / options.maxChunkSize)
      
      for (let i = 0; i < numChunks; i++) {
        chunks.push({
          tokenIn: trade.tokenIn,
          tokenOut: trade.tokenOut,
          amount: trade.amount / numChunks,
          // Randomize execution time within 4-hour window
          executeAt: Date.now() + Math.random() * 14400000,
          // Randomize DEX routing
          dex: this.selectRandomDEX(),
          // Use different wallet for each chunk
          executorWallet: this.selectExecutorWallet(i),
        })
      }
    }
    
    // Shuffle execution order
    return shuffle(chunks)
  }
}
```

**On-Chain Execution**:
```solidity
contract TreasuryExecutor {
    // Multiple executor wallets to obfuscate total size
    mapping(address => bool) public executorWallets;
    
    // Execute single trade chunk
    function executeTrade(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes calldata dexCalldata,
        bytes calldata enclaveSignature
    ) external onlyExecutorWallet {
        // Verify signature from enclave
        require(
            verifyEnclaveSignature(
                keccak256(abi.encode(tokenIn, tokenOut, amountIn)),
                enclaveSignature
            ),
            "Invalid enclave signature"
        );
        
        // Execute trade via DEX aggregator
        (bool success, ) = dexAggregator.call(dexCalldata);
        require(success, "Trade failed");
        
        // Emit minimal information
        emit TradeExecuted(tokenIn, tokenOut, block.timestamp);
        // Note: NOT emitting amounts to prevent strategy inference
    }
    
    // Periodic summary (reveals net changes, not individual trades)
    function publishTreasurySummary() external onlyGovernance {
        TreasurySummary memory summary = calculateSummary();
        
        emit TreasurySummary(
            summary.totalValueUSD,
            summary.netPositionChanges, // Only net changes
            summary.period,
            block.timestamp
        );
    }
}
```

**Privacy Guarantees**:
- Individual trade sizes hidden
- Execution timing randomized
- Multiple wallets prevent size aggregation
- Only net position changes revealed (weekly)
- Strategy parameters never exposed

**Emergency Override**:
```solidity
// Guardian multi-sig can execute emergency treasury operations
// with full transparency (only for critical situations)
function emergencyTreasuryOperation(
    address[] calldata tokens,
    uint256[] calldata amounts,
    string calldata justification
) external onlyGuardianMultiSig {
    // Execute with full transparency
    for (uint i = 0; i < tokens.length; i++) {
        _executeEmergencyTransfer(tokens[i], amounts[i]);
    }
    
    emit EmergencyTreasuryOperation(
        tokens,
        amounts,
        justification,
        msg.sender,
        block.timestamp
    );
}
```

**Confidential Compute Failure Handling**:
```typescript
// If enclave becomes unavailable
class TreasuryFailsafe {
  async handleEnclaveFailure(): Promise<void> {
    // 1. Halt all automated treasury operations
    await treasuryContract.pauseAutomatedOperations()
    
    // 2. Notify guardian multi-sig
    await notifyGuardians({
      alert: "Enclave failure - treasury operations paused",
      severity: "high",
      requiresAction: true,
    })
    
    // 3. Switch to manual governance-approved operations
    // All operations require on-chain governance vote
    await treasuryContract.enableManualMode()
    
    // 4. Attempt enclave recovery
    await this.attemptEnclaveRecovery()
  }
}
```

---

## Tenderly Integration Strategy

### Simulation Environment Setup

**Virtual TestNet Configuration**:
```typescript
import { Tenderly } from '@tenderly/sdk'

const tenderly = new Tenderly({
  accountName: 'aether-sentinel',
  projectName: 'mainnet-simulations',
  accessToken: process.env.TENDERLY_ACCESS_TOKEN,
})

// Create isolated virtual testnet
const virtualTestnet = await tenderly.virtualTestnets.create({
  displayName: 'AETHER SENTINEL - Flash Crash Simulation',
  forkConfig: {
    networkId: '1', // Ethereum Mainnet
    blockNumber: 'latest',
  },
  virtualNetworkConfig: {
    chainId: 73571, // Custom chain ID
    baseFeePerGas: '1000000000', // 1 gwei
  },
})
```


### Flash Crash Scenario Simulation

**Objective**: Validate system behavior when asset prices drop 50% within 5 minutes.

**Simulation Script**:
```typescript
async function simulateFlashCrash() {
  // 1. Deploy all contracts to virtual testnet
  const contracts = await deployContracts(virtualTestnet)
  
  // 2. Setup initial state
  await setupInitialState(contracts, {
    vaultDeposits: ethers.parseEther("10000"), // 10,000 ETH
    reserveRatio: 0.30, // 30%
    priceETH: 2500, // $2,500 per ETH
  })
  
  // 3. Inject price crash
  console.log("Injecting 50% price crash over 5 minutes...")
  const crashSteps = 10
  const priceDropPerStep = 2500 * 0.05 // 5% per step
  
  for (let i = 0; i < crashSteps; i++) {
    const newPrice = 2500 - (priceDropPerStep * (i + 1))
    
    // Update price feed
    await contracts.priceFeed.updatePrice(
      ethers.parseUnits(newPrice.toString(), 8)
    )
    
    // Wait 30 seconds between updates
    await tenderly.simulator.increaseTime(30)
    
    // Trigger CRE Workflow 
er
version: 1.0.0
trigger:
  conditional:
    source: workflow_a
    condition: ${risk_assessment.risk_score} >= 90

steps:
  - id: fetch_risk_context
    type: contract_read
    contract: RiskGuardian
    function: getRiskSignalHistory
    params:
      count: 10
    outputs:
      - recent_risk_signals

  - id: create_emergency_proposal
    type: contract_write
    contract: GovernanceModule
    function: createEmergencyProposal
    params:
      title: "Emergency Response: Critical Risk Detected"
      description: ${risk_assessment.reasoning}
      targetContract: ${determine_target_contract(risk_assessment.recommended_action)}
      callData: ${encode_emergency_action(risk_assessment.recommended_action)}
      riskScore: ${risk_assessment.risk_score}
      aiReasoning: ${risk_assessment.reasoning}
    gas_limit: 600000
    outputs:
      - proposal_id

  - id: notify_governance_participants
    type: http_request
    url: https://api.aether-sentinel.io/v1/notify-emergency
    method: POST
    body:
      proposal_id: ${proposal_id}
      risk_score: ${risk_assessment.risk_score}
      recommended_action: ${risk_assessment.recommended_action}
      reasoning: ${risk_assessment.reasoning}
      voting_deadline: ${timestamp + 86400}  # 24 hours
    timeout: 5000

  - id: emit_emergency_trigger
    type: event_emit
    event: EmergencyGovernanceTriggered
    data:
      proposal_id: ${proposal_id}
      risk_score: ${risk_assessment.risk_score}
      action: ${risk_assessment.recommended_action}
      timestamp: ${timestamp}

```

**Emergency Action Encoding**:
```typescript
function encodeEmergencyAction(recommendedAction: string): string {
  switch (recommendedAction) {
    case "EMERGENCY_PAUSE":
      return TokenizedVault.interface.encodeFunctionData("emergencyPause", [])
    
    case "ADJUST_RESERVE_RATIO":
      return TokenizedVault.interface.encodeFunctionData("adjustMinimumReserveRatio", [3000]) // 30%
    
    case "ACTIVATE_GUARDIAN":
      return GovernanceModule.interface.encodeFunctionData("activateGuardianMode", [])
    
    default:
      throw new Error(`Unknown action: ${recommendedAction}`)
  }
}
```

**Notification Channels**:
- Email to registered governance participants
- Discord webhook to governance channel
- Telegram bot notifications
- On-chain event for frontend WebSocket listeners
- SMS to guardian multi-sig members (critical only)

---

## Confidential Compute Layer

### Architecture Overview

**Technology**: Oasis Sapphire (EVM-compatible confidential compute)

**Purpose**: Execute sensitive operations where strategy, thresholds, or bidding information must remain private even from node operators.

**Use Cases**:
1. Private liquidation auctions (bid amounts hidden)
2. Hidden AI risk thresholds (prevent gaming)
3. Private treasury operations (strategy protection)

### Private Liquidation Auctions

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                  Oasis Sapphire Network                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PrivateLiquidationAuction.sol (Confidential)          │ │
│  │                                                         │ │
│  │  - Encrypted bid storage                               │ │
│  │  - Private bid comparison logic                        │ │
│  │  - Winner determination in TEE                         │ │
│  │  - Only winning bid revealed                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Ethereum Mainnet (Settlement Layer)             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  LiquidationSettlement.sol                             │ │
│  │                                                         │ │
│  │  - Receives winning bid from Sapphire                  │ │
│  │  - Transfers collateral to winner                      │ │
│  │  - Transfers proceeds to vault                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```


**Smart Contract Implementation**:
```solidity
// Deployed on Oasis Sapphire
contract PrivateLiquidationAuction {
    using Sapphire for *;
    
    struct EncryptedBid {
        address bidder;
        bytes encryptedAmount;
        uint256 timestamp;
        bytes32 commitment;
    }
    
    struct Auction {
        uint256 auctionId;
        address collateralAsset;
        uint256 collateralAmount;
        uint256 startTime;
        uint256 endTime;
        AuctionStatus status;
        EncryptedBid[] bids;
        address winner;
        uint256 winningAmount; // Only revealed after auction
    }
    
    mapping(uint256 => Auction) public auctions;
    uint256 public auctionCount;
    
    IWorldID public worldId;
    mapping(uint256 => bool) public usedBidderNullifiers;
    
    function submitBid(
        uint256 auctionId,
        bytes calldata encryptedBidAmount,
        bytes32 commitment,
        uint256 merkleRoot,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external {
        // Verify World ID proof
        worldId.verifyProof(
            merkleRoot,
            1,
            abi.encodePacked(auctionId).hashToField(),
            nullifierHash,
            externalNullifierHash,
            proof
        );
        
        require(!usedBidderNullifiers[nullifierHash], "Already bid");
        
        Auction storage auction = auctions[auctionId];
        require(block.timestamp < auction.endTime, "Auction ended");
        
        // Store encrypted bid
        auction.bids.push(EncryptedBid({
            bidder: msg.sender,
            encryptedAmount: encryptedBidAmount,
            timestamp: block.timestamp,
            commitment: commitment
        }));
        
        usedBidderNullifiers[nullifierHash] = true;
        
        emit BidSubmitted(auctionId, msg.sender, commitment);
    }
    
    function finalizeAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp >= auction.endTime, "Auction ongoing");
        require(auction.status == AuctionStatus.Active, "Already finalized");
        
        // Decrypt and compare bids in TEE
        uint256 highestBid = 0;
        address highestBidder;
        
        for (uint i = 0; i < auction.bids.length; i++) {
            uint256 bidAmount = Sapphire.decrypt(auction.bids[i].encryptedAmount);
            
            if (bidAmount > highestBid) {
                highestBid = bidAmount;
                highestBidder = auction.bids[i].bidder;
            }
        }
        
        auction.winner = highestBidder;
        auction.winningAmount = highestBid;
        auction.status = AuctionStatus.Finalized;
        
        // Send settlement message to mainnet
        _bridgeSettlement(auctionId, highestBidder, highestBid);
        
        emit AuctionFinalized(auctionId, highestBidder, highestBid);
    }
}
```

**Privacy Guarantees**:
- Bid amounts encrypted client-side before submission
- Decryption only occurs in Trusted Execution Environment (TEE)
- Losing bids never revealed
- Node operators cannot see bid amounts
- Only winning bid amount published on-chain

### Hidden AI Threshold Logic

**Implementation**:
```solidity
// Deployed on Oasis Sapphire
contract ConfidentialRiskThresholds {
    using Sapphire for *;
    
    struct EncryptedThresholds {
        bytes encryptedModerateThreshold;
        bytes encryptedElevatedThreshold;
        bytes encryptedCriticalThreshold;
        uint256 lastUpdated;
        address updatedBy;
    }
    
    EncryptedThresholds private thresholds;
    
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    
    function updateThresholds(
        bytes calldata encryptedModerate,
        bytes calldata encryptedElevated,
        bytes calldata encryptedCritical
    ) external onlyRole(GUARDIAN_ROLE) {
        thresholds = EncryptedThresholds({
            encryptedModerateThreshold: encryptedModerate,
            encryptedElevatedThreshold: encryptedElevated,
            encryptedCriticalThreshold: encryptedCritical,
            lastUpdated: block.timestamp,
            updatedBy: msg.sender
        });
        
        // Emit event without revealing values
        emit ThresholdsUpdated(block.timestamp, msg.sender);
    }
    
    function evaluateRiskScore(uint256 riskScore) external view returns (string memory action) {
        // Decrypt thresholds in TEE
        uint256 moderate = Sapphire.decrypt(thresholds.encryptedModerateThreshold);
        uint256 elevated = Sapphire.decrypt(thresholds.encryptedElevatedThreshold);
        uint256 critical = Sapphire.decrypt(thresholds.encryptedCriticalThreshold);
        
        // Evaluate without revealing thresholds
        if (riskScore >= critical) {
            return "EMERGENCY_PAUSE";
        } else if (riskScore >= elevated) {
            return "ADJUST_RESERVE_RATIO";
        } else if (riskScore >= moderate) {
            return "INCREASE_MONITORING";
        } else {
            return "NORMAL_OPERATION";
        }
    }
    
    // Secure multi-party computation for auditing
    function verifyThresholdForAuditor(
        bytes calldata auditorPublicKey,
        string calldata thresholdType
    ) external view returns (bytes memory encryptedThreshold) {
        require(hasRole(AUDITOR_ROLE, msg.sender), "Not authorized");
        
        bytes memory threshold;
        if (keccak256(bytes(thresholdType)) == keccak256("moderate")) {
            threshold = thresholds.encryptedModerateThreshold;
        } else if (keccak256(bytes(thresholdType)) == keccak256("elevated")) {
            threshold = thresholds.encryptedElevatedThreshold;
        } else {
            threshold = thresholds.encryptedCriticalThreshold;
        }
        
        // Re-encrypt for auditor's public key
        return Sapphire.reencrypt(threshold, auditorPublicKey);
    }
}
```


**Security Benefits**:
- Adversaries cannot game system by operating just below thresholds
- Threshold values remain confidential even during audits
- Secure multi-party computation allows authorized auditor verification
- Timing attack prevention through constant-time operations

### Private Treasury Operations

**Use Case**: Execute large treasury rebalancing without revealing strategy or creating front-running opportunities.

**Implementation**:
```solidity
// Deployed on Oasis Sapphire
contract ConfidentialTreasuryManager {
    using Sapphire for *;
    
    struct EncryptedStrategy {
        bytes encryptedAllocation; // Target allocation percentages
        bytes encryptedRebalanceThreshold; // When to trigger rebalance
        bytes encryptedSlippageTolerance;
        uint256 lastExecuted;
    }
    
    EncryptedStrategy private strategy;
    
    function executeRebalance(
        uint256[] calldata currentBalances,
        uint256[] calldata currentPrices
    ) external onlyRole(TREASURY_OPERATOR_ROLE) returns (bytes memory encryptedInstructions) {
        // Decrypt strategy in TEE
        uint256[] memory targetAllocation = Sapphire.decrypt(strategy.encryptedAllocation);
        uint256 rebalanceThreshold = Sapphire.decrypt(strategy.encryptedRebalanceThreshold);
        
        // Calculate required trades privately
        (uint256[] memory buyAmounts, uint256[] memory sellAmounts) = 
            _calculateRebalanceTrades(currentBalances, currentPrices, targetAllocation);
        
        // Check if rebalance needed
        uint256 deviation = _calculateDeviation(currentBalances, targetAllocation);
        require(deviation >= rebalanceThreshold, "Rebalance not needed");
        
        // Encrypt trade instructions
        bytes memory instructions = abi.encode(buyAmounts, sellAmounts);
        encryptedInstructions = Sapphire.encrypt(instructions);
        
        strategy.lastExecuted = block.timestamp;
        
        // Emit event without revealing strategy
        emit RebalanceExecuted(block.timestamp, deviation);
        
        return encryptedInstructions;
    }
    
    function _calculateRebalanceTrades(
        uint256[] memory current,
        uint256[] memory prices,
        uint256[] memory target
    ) private pure returns (uint256[] memory, uint256[] memory) {
        // Private calculation logic
        // Returns buy/sell amounts to achieve target allocation
    }
}
```

---

## Tenderly Integration Strategy

### Virtual TestNet Architecture

**Purpose**: Simulate extreme scenarios and validate system behavior before production deployment.

**Tenderly Features Used**:
1. **Virtual TestNets**: Isolated blockchain forks for testing
2. **Transaction Simulator**: Preview state changes before execution
3. **Debugger**: Step-through transaction execution
4. **Alerts**: Monitor specific events and conditions
5. **Web3 Actions**: Automate responses to on-chain events

### Simulation Scenario 1: Flash Crash

**Objective**: Validate RiskGuardian responds correctly to 50% price drop in 5 minutes.

**Setup Script**:
```typescript
import { Tenderly } from '@tenderly/sdk'

const tenderly = new Tenderly({
  accountName: 'aether-sentinel',
  projectName: 'mainnet-fork',
  accessToken: process.env.TENDERLY_ACCESS_TOKEN
})

async function setupFlashCrashSimulation() {
  // Create virtual testnet
  const testnet = await tenderly.virtualTestnets.create({
    slug: 'flash-crash-test',
    displayName: 'Flash Crash Simulation',
    forkConfig: {
      networkId: '1', // Ethereum mainnet
      blockNumber: 'latest'
    },
    virtualNetworkId: '73571'
  })
  
  // Deploy contracts
  const contracts = await deployAllContracts(testnet)
  
  // Setup initial state
  await setupInitialVaultState(contracts, {
    totalDeposits: ethers.utils.parseEther('1000'),
    reserveRatio: 2500, // 25%
    depositors: 50
  })
  
  // Configure price feeds
  const priceFeed = await ethers.getContractAt('MockPriceFeed', contracts.priceFeed)
  
  // Simulate flash crash
  console.log('Starting flash crash simulation...')
  const initialPrice = await priceFeed.latestAnswer()
  console.log(`Initial ETH price: $${ethers.utils.formatUnits(initialPrice, 8)}`)
  
  // Drop price 50% over 5 minutes (5 blocks)
  for (let i = 1; i <= 5; i++) {
    const newPrice = initialPrice.mul(100 - (i * 10)).div(100)
    await priceFeed.updateAnswer(newPrice)
    await tenderly.simulator.simulateBundle([
      {
        from: contracts.creWorkflow,
        to: contracts.riskGuardian,
        input: encodeRiskMonitoringCall()
      }
    ])
    console.log(`Block ${i}: Price dropped to $${ethers.utils.formatUnits(newPrice, 8)}`)
  }
  
  // Verify safeguards triggered
  const vaultPaused = await contracts.tokenizedVault.paused()
  const riskSignals = await contracts.riskGuardian.getRiskSignalHistory(10)
  
  console.log(`Vault paused: ${vaultPaused}`)
  console.log(`Risk signals recorded: ${riskSignals.length}`)
  
  // Generate report
  return {
    testnetUrl: testnet.publicExplorerUrl,
    vaultPaused,
    riskSignals,
    responseTime: calculateResponseTime(riskSignals),
    fundsProtected: await contracts.tokenizedVault.totalDeposits()
  }
}
```


**Expected Results**:
- RiskGuardian detects elevated risk by block 3 (30% drop)
- Emergency pause triggered by block 4 (40% drop)
- Reserve ratio adjusted to conservative level
- No user funds lost
- Complete audit trail in transaction traces

### Simulation Scenario 2: Liquidity Drain Attack

**Objective**: Validate AI engine detects coordinated withdrawal pattern and triggers safeguards.

**Setup Script**:
```typescript
async function setupLiquidityDrainSimulation() {
  const testnet = await tenderly.virtualTestnets.create({
    slug: 'liquidity-drain-test',
    displayName: 'Liquidity Drain Attack Simulation'
  })
  
  const contracts = await deployAllContracts(testnet)
  
  // Create attacker accounts
  const attackers = await createAttackerAccounts(10, {
    vaultTokenBalance: ethers.utils.parseEther('100')
  })
  
  // Setup normal user activity baseline
  await simulateNormalActivity(contracts, 24 * 60) // 24 hours
  
  // Execute coordinated attack
  console.log('Executing coordinated withdrawal attack...')
  const attackTxs = attackers.map(attacker => ({
    from: attacker.address,
    to: contracts.tokenizedVault.address,
    input: contracts.tokenizedVault.interface.encodeFunctionData('withdraw', [
      ethers.utils.parseEther('100')
    ])
  }))
  
  // Submit all withdrawals in same block
  const simulation = await tenderly.simulator.simulateBundle(attackTxs)
  
  // Trigger risk monitoring
  await triggerCREWorkflowA(contracts)
  
  // Verify detection
  const riskAssessment = await contracts.riskGuardian.getRiskSignalHistory(1)
  const abnormalWithdrawals = riskAssessment[0].anomalies_detected
  
  console.log(`Abnormal withdrawals detected: ${abnormalWithdrawals.length}`)
  console.log(`Risk score: ${riskAssessment[0].riskScore}`)
  
  // Verify mitigation
  const withdrawalLimitsActive = await contracts.tokenizedVault.withdrawalLimitsEnabled()
  const reserveRatio = await contracts.tokenizedVault.calculateReserveRatio()
  
  return {
    testnetUrl: testnet.publicExplorerUrl,
    attackDetected: abnormalWithdrawals.length > 0,
    riskScore: riskAssessment[0].riskScore,
    mitigationActive: withdrawalLimitsActive,
    finalReserveRatio: reserveRatio,
    transactionTraces: simulation.simulation_results.map(r => r.trace_url)
  }
}
```

**Expected Results**:
- AI engine flags abnormal withdrawal pattern (Z-score > 3)
- Risk score elevated to 85+
- Withdrawal limits activated
- Legitimate users can still withdraw up to limits
- Reserve ratio maintained above minimum threshold

### Simulation Scenario 3: Stablecoin Depeg

**Objective**: Validate system handles collateral value volatility and maintains solvency.

**Setup Script**:
```typescript
async function setupStablecoinDepegSimulation() {
  const testnet = await tenderly.virtualTestnets.create({
    slug: 'stablecoin-depeg-test',
    displayName: 'Stablecoin Depeg Simulation'
  })
  
  const contracts = await deployAllContracts(testnet)
  
  // Setup vault with stablecoin collateral
  await setupVaultWithStablecoin(contracts, {
    stablecoin: 'USDC',
    totalDeposits: ethers.utils.parseUnits('1000000', 6), // $1M
    reserveRatio: 2500 // 25%
  })
  
  // Simulate gradual depeg
  console.log('Simulating stablecoin depeg from $1.00 to $0.85...')
  const priceFeed = await ethers.getContractAt('MockPriceFeed', contracts.usdcPriceFeed)
  
  const depegSteps = [
    { block: 1, price: 1.00 },
    { block: 10, price: 0.98 },
    { block: 20, price: 0.95 },
    { block: 30, price: 0.90 },
    { block: 40, price: 0.85 }
  ]
  
  for (const step of depegSteps) {
    await priceFeed.updateAnswer(ethers.utils.parseUnits(step.price.toString(), 8))
    await triggerCREWorkflowA(contracts)
    
    const vaultState = await contracts.tokenizedVault.getVaultState()
    console.log(`Block ${step.block}: Price $${step.price}, Reserve Ratio: ${vaultState.reserveRatio / 100}%`)
    
    // Check if liquidations triggered
    if (vaultState.reserveRatio < 2000) { // Below 20%
      await triggerLiquidationAuctions(contracts)
    }
  }
  
  // Verify system response
  const finalState = await contracts.tokenizedVault.getVaultState()
  const liquidationEvents = await contracts.tokenizedVault.queryFilter('LiquidationExecuted')
  
  return {
    testnetUrl: testnet.publicExplorerUrl,
    finalReserveRatio: finalState.reserveRatio,
    liquidationsExecuted: liquidationEvents.length,
    systemSolvent: finalState.reserveRatio >= 1500, // 15% minimum
    collateralRecovered: calculateCollateralRecovered(liquidationEvents)
  }
}
```

**Expected Results**:
- Reserve ratio recalculated with updated collateral values
- Liquidation auctions triggered when ratio < 20%
- World ID verified liquidators participate
- Reserve ratio restored to safe levels
- System remains solvent throughout depeg

### Deployment Checklist

**Pre-Production Validation**:
```markdown
## Tenderly Simulation Checklist

### Contract Deployment
- [ ] All contracts deployed to Virtual TestNet
- [ ] Contract addresses verified in Tenderly Explorer
- [ ] All roles assigned correctly
- [ ] Initial parameters configured

### Integration Testing
- [ ] CRE workflows can call contracts
- [ ] World ID verification works on-chain
- [ ] AI Risk Engine endpoint accessible
- [ ] Price feeds updating correctly

### Scenario Simulations
- [ ] Flash crash simulation passed
- [ ] Liquidity drain simulation passed
- [ ] Stablecoin depeg simulation passed
- [ ] All transaction traces reviewed
- [ ] No unexpected reverts or failures

### Performance Validation
- [ ] Risk monitoring response time < 60 seconds
- [ ] Gas costs within acceptable ranges
- [ ] No transaction failures due to gas limits

### Security Validation
- [ ] Unauthorized access attempts properly rejected
- [ ] Reentrancy protection verified
- [ ] Integer overflow/underflow checks passed
- [ ] Role-based access control enforced

### Production Readiness
- [ ] All simulations documented with explorer links
- [ ] Rollback procedures tested
- [ ] Guardian multi-sig configured
- [ ] Monitoring alerts configured
```

---

## Frontend Architecture

### Technology Stack

**Framework**: Next.js 14 (App Router)
**Styling**: Tailwind CSS + shadcn/ui components
**State Management**: Zustand + React Query
**Wallet Integration**: RainbowKit + wagmi
**World ID**: @worldcoin/idkit
**Charts**: Recharts
**Real-time**: Socket.io client

### Application Structure

```
frontend/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Landing page
│   ├── dashboard/
│   │   ├── page.tsx              # Risk dashboard
│   │   └── components/
│   │       ├── RiskScoreCard.tsx
│   │       ├── ReserveRatioChart.tsx
│   │       └── RecentActivity.tsx
│   ├── vault/
│   │   ├── page.tsx              # Vault operations
│   │   └── components/
│   │       ├── DepositForm.tsx
│   │       └── WithdrawForm.tsx
│   ├── markets/
│   │   ├── page.tsx              # Prediction markets list
│   │   ├── [id]/
│   │   │   └── page.tsx          # Market details
│   │   └── components/
│   │       ├── MarketCard.tsx
│   │       └── ParticipationForm.tsx
│   └── governance/
│       ├── page.tsx              # Proposals list
│       ├── [id]/
│       │   └── page.tsx          # Proposal details
│       └── components/
│           ├── ProposalCard.tsx
│           └── VotingInterface.tsx
├── components/
│   ├── WalletConnect.tsx
│   ├── WorldIDVerification.tsx
│   ├── TransactionStatus.tsx
│   └── ErrorBoundary.tsx
├── hooks/
│   ├── useVaultState.ts
│   ├── useRiskScore.ts
│   ├── useWorldID.ts
│   └── useContracts.ts
├── lib/
│   ├── contracts.ts              # Contract ABIs and addresses
│   ├── worldid.ts                # World ID configuration
│   └── api.ts                    # Backend API client
└── types/
    ├── contracts.ts
    └── api.ts
```


### Real-Time Risk Dashboard Implementation

**Component**: `app/dashboard/page.tsx`
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRiskScore } from '@/hooks/useRiskScore'
import { useVaultState } from '@/hooks/useVaultState'
import { RiskScoreCard } from './components/RiskScoreCard'
import { ReserveRatioChart } from './components/ReserveRatioChart'
import { RecentActivity } from './components/RecentActivity'
import { io } from 'socket.io-client'

export default function DashboardPage() {
  const { riskScore, isLoading: riskLoading } = useRiskScore()
  const { vaultState, isLoading: vaultLoading } = useVaultState()
  const [realtimeUpdates, setRealtimeUpdates] = useState(true)
  
  useEffect(() => {
    if (!realtimeUpdates) return
    
    // Connect to WebSocket for real-time updates
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      auth: { token: localStorage.getItem('auth_token') }
    })
    
    socket.on('risk_score_updated', (data) => {
      // Update risk score in real-time
      queryClient.setQueryData(['riskScore'], data)
    })
    
    socket.on('vault_state_changed', (data) => {
      queryClient.setQueryData(['vaultState'], data)
    })
    
    socket.on('safeguard_activated', (data) => {
      // Show prominent notification
      toast.error(`Safeguard Activated: ${data.action}`, {
        description: data.reasoning,
        duration: Infinity
      })
    })
    
    return () => socket.disconnect()
  }, [realtimeUpdates])
  
  if (riskLoading || vaultLoading) {
    return <DashboardSkeleton />
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Risk Dashboard</h1>
        <button
          onClick={() => setRealtimeUpdates(!realtimeUpdates)}
          className={`px-4 py-2 rounded ${realtimeUpdates ? 'bg-green-500' : 'bg-gray-500'}`}
        >
          {realtimeUpdates ? 'Live' : 'Paused'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RiskScoreCard score={riskScore.risk_score} confidence={riskScore.confidence_level} />
        <ReserveRatioCard ratio={vaultState.reserveRatio} minimum={vaultState.minimumReserveRatio} />
        <TVLCard value={vaultState.totalDeposits} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReserveRatioChart />
        <RiskScoreHistoryChart />
      </div>
      
      <RecentActivity />
      
      {vaultState.paused && (
        <EmergencyBanner
          message="Emergency pause active"
          details="Withdrawals and deposits are currently disabled due to elevated risk."
        />
      )}
    </div>
  )
}
```

**Risk Score Card Component**:
```typescript
interface RiskScoreCardProps {
  score: number
  confidence: number
}

export function RiskScoreCard({ score, confidence }: RiskScoreCardProps) {
  const getRiskColor = (score: number) => {
    if (score >= 81) return 'bg-red-500'
    if (score >= 61) return 'bg-orange-500'
    if (score >= 31) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  
  const getRiskLabel = (score: number) => {
    if (score >= 81) return 'Critical'
    if (score >= 61) return 'Elevated'
    if (score >= 31) return 'Moderate'
    return 'Low'
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-5xl font-bold">{score}</div>
          <div className={`px-4 py-2 rounded-full text-white ${getRiskColor(score)}`}>
            {getRiskLabel(score)}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Confidence</span>
            <span>{(confidence * 100).toFixed(0)}%</span>
          </div>
          <Progress value={confidence * 100} className="mt-2" />
        </div>
      </CardContent>
    </Card>
  )
}
```

### Vault Operations Interface

**Deposit Form with World ID**:
```typescript
'use client'

import { useState } from 'react'
import { useAccount, useContractWrite } from 'wagmi'
import { IDKitWidget, ISuccessResult } from '@worldcoin/idkit'
import { parseEther } from 'viem'

export function DepositForm() {
  const { address } = useAccount()
  const [amount, setAmount] = useState('')
  const [worldIdVerified, setWorldIdVerified] = useState(false)
  const [worldIdProof, setWorldIdProof] = useState<ISuccessResult | null>(null)
  
  const { write: deposit, isLoading } = useContractWrite({
    address: contracts.tokenizedVault,
    abi: TokenizedVaultABI,
    functionName: 'deposit',
    args: [parseEther(amount)],
    onSuccess: (data) => {
      toast.success('Deposit successful!', {
        description: `Transaction: ${data.hash}`
      })
    }
  })
  
  const handleWorldIDSuccess = (proof: ISuccessResult) => {
    setWorldIdVerified(true)
    setWorldIdProof(proof)
  }
  
  const handleDeposit = async () => {
    if (!worldIdVerified) {
      toast.error('Please verify with World ID first')
      return
    }
    
    deposit()
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Assets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
          />
        </div>
        
        {!worldIdVerified ? (
          <IDKitWidget
            app_id={process.env.NEXT_PUBLIC_WORLD_ID_APP_ID!}
            action="aether-sentinel-vault-deposit"
            signal={address}
            onSuccess={handleWorldIDSuccess}
            verification_level="device"
          >
            {({ open }) => (
              <Button onClick={open} className="w-full">
                Verify with World ID
              </Button>
            )}
          </IDKitWidget>
        ) : (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>World ID Verified</span>
          </div>
        )}
        
        <Button
          onClick={handleDeposit}
          disabled={!worldIdVerified || !amount || isLoading}
          className="w-full"
        >
          {isLoading ? 'Depositing...' : 'Deposit'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Prediction Market Interface

**Market Participation**:
```typescript
export function MarketParticipationForm({ marketId }: { marketId: string }) {
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const { data: market } = useMarketDetails(marketId)
  
  const { write: participate } = useContractWrite({
    address: contracts.predictionMarket,
    abi: PredictionMarketABI,
    functionName: 'participateInMarket',
  })
  
  const handleParticipate = async (proof: ISuccessResult) => {
    if (selectedOutcome === null) return
    
    participate({
      args: [
        BigInt(marketId),
        BigInt(selectedOutcome),
        proof.merkle_root,
        proof.nullifier_hash,
        proof.proof
      ],
      value: parseEther(stakeAmount)
    })
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{market?.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Select Outcome</Label>
          <RadioGroup value={selectedOutcome?.toString()} onValueChange={(v) => setSelectedOutcome(parseInt(v))}>
            {market?.outcomes.map((outcome, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`outcome-${index}`} />
                <Label htmlFor={`outcome-${index}`}>{outcome}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div>
          <Label htmlFor="stake">Stake Amount (ETH)</Label>
          <Input
            id="stake"
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="0.01"
          />
        </div>
        
        <IDKitWidget
          app_id={process.env.NEXT_PUBLIC_WORLD_ID_APP_ID!}
          action="aether-sentinel-market-participate"
          signal={marketId}
          onSuccess={handleParticipate}
          verification_level="orb"
        >
          {({ open }) => (
            <Button onClick={open} disabled={selectedOutcome === null || !stakeAmount} className="w-full">
              Participate with World ID
            </Button>
          )}
        </IDKitWidget>
      </CardContent>
    </Card>
  )
}
```

---

## Backend Service Architecture

### Technology Stack

**Runtime**: Node.js 20 + TypeScript
**Framework**: Express.js
**Database**: PostgreSQL + Redis
**Blockchain**: ethers.js v6
**API Client**: axios
**Monitoring**: Prometheus + Winston logger
**Queue**: Bull (Redis-based)

### Service Structure

```
backend/
├── src/
│   ├── server.ts                 # Express app entry point
│   ├── config/
│   │   ├── contracts.ts          # Contract addresses and ABIs
│   │   ├── database.ts           # PostgreSQL connection
│   │   └── redis.ts              # Redis connection
│   ├── routes/
│   │   ├── risk.ts               # Risk assessment endpoints
│   │   ├── worldid.ts            # World ID verification
│   │   └── status.ts             # Health check
│   ├── services/
│   │   ├── AIRiskService.ts      # AI engine integration
│   │   ├── BlockchainService.ts  # On-chain data fetching
│   │   ├── WorldIDService.ts     # World ID verification
│   │   └── CREService.ts         # CRE workflow triggers
│   ├── middleware/
│   │   ├── auth.ts               # JWT authentication
│   │   ├── rateLimit.ts          # Rate limiting
│   │   └── errorHandler.ts       # Error handling
│   ├── models/
│   │   ├── RiskAssessment.ts
│   │   └── Verification.ts
│   └── utils/
│       ├── logger.ts
│       └── metrics.ts
└── tests/
    ├── integration/
    └── unit/
```


### AI Risk Integration Service

**Implementation**: `src/services/AIRiskService.ts`
```typescript
import axios, { AxiosError } from 'axios'
import { Redis } from 'ioredis'
import { logger } from '../utils/logger'
import { metrics } from '../utils/metrics'

interface RiskAssessmentRequest {
  vault_address: string
  timestamp: number
  on_chain_data: OnChainData
  market_data: MarketData
  historical_context: HistoricalContext
}

interface RiskAssessmentResponse {
  risk_score: number
  recommended_action: string
  confidence_level: number
  reasoning: string
  component_scores: ComponentScores
  anomalies_detected: Anomaly[]
  timestamp: number
  model_version: string
}

export class AIRiskService {
  private redis: Redis
  private aiEngineUrl: string
  private aiEngineToken: string
  private timeout: number = 5000
  private maxRetries: number = 3
  
  constructor(redis: Redis) {
    this.redis = redis
    this.aiEngineUrl = process.env.AI_ENGINE_URL!
    this.aiEngineToken = process.env.AI_ENGINE_TOKEN!
  }
  
  async assessRisk(request: RiskAssessmentRequest): Promise<RiskAssessmentResponse> {
    const startTime = Date.now()
    const cacheKey = `risk:${request.vault_address}:${Math.floor(request.timestamp / 60)}`
    
    try {
      // Check cache first (60 second TTL)
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        logger.info('Risk assessment cache hit', { vault: request.vault_address })
        metrics.riskAssessmentCacheHits.inc()
        return JSON.parse(cached)
      }
      
      // Call AI engine with retry logic
      const response = await this.callAIEngineWithRetry(request)
      
      // Validate response
      this.validateResponse(response)
      
      // Cache result
      await this.redis.setex(cacheKey, 60, JSON.stringify(response))
      
      // Store in database for audit trail
      await this.storeAssessment(request, response)
      
      // Record metrics
      const duration = Date.now() - startTime
      metrics.riskAssessmentDuration.observe(duration)
      metrics.riskAssessmentSuccess.inc()
      
      logger.info('Risk assessment completed', {
        vault: request.vault_address,
        risk_score: response.risk_score,
        duration
      })
      
      return response
      
    } catch (error) {
      logger.error('Risk assessment failed', {
        vault: request.vault_address,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      metrics.riskAssessmentErrors.inc()
      
      // Return fail-safe response
      return this.getFailSafeResponse(request, error)
    }
  }
  
  private async callAIEngineWithRetry(
    request: RiskAssessmentRequest,
    attempt: number = 1
  ): Promise<RiskAssessmentResponse> {
    try {
      const response = await axios.post<RiskAssessmentResponse>(
        `${this.aiEngineUrl}/api/v1/assess-risk`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.aiEngineToken}`,
            'Content-Type': 'application/json',
            'X-Request-ID': `${request.vault_address}-${request.timestamp}`
          },
          timeout: this.timeout
        }
      )
      
      return response.data
      
    } catch (error) {
      if (attempt < this.maxRetries && this.isRetryableError(error)) {
        const backoffMs = Math.pow(2, attempt) * 1000
        logger.warn(`AI engine call failed, retrying in ${backoffMs}ms`, {
          attempt,
          error: error instanceof Error ? error.message : 'Unknown'
        })
        
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        return this.callAIEngineWithRetry(request, attempt + 1)
      }
      
      throw error
    }
  }
  
  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      // Retry on network errors and 5xx server errors
      return !error.response || (error.response.status >= 500 && error.response.status < 600)
    }
    return false
  }
  
  private validateResponse(response: RiskAssessmentResponse): void {
    if (typeof response.risk_score !== 'number' || response.risk_score < 0 || response.risk_score > 100) {
      throw new Error('Invalid risk score')
    }
    
    if (typeof response.confidence_level !== 'number' || response.confidence_level < 0 || response.confidence_level > 1) {
      throw new Error('Invalid confidence level')
    }
    
    if (!response.recommended_action || !response.reasoning) {
      throw new Error('Missing required fields')
    }
  }
  
  private async getFailSafeResponse(
    request: RiskAssessmentRequest,
    error: unknown
  ): Promise<RiskAssessmentResponse> {
    // Try to get last known assessment
    const lastAssessment = await this.getLastAssessment(request.vault_address)
    
    if (lastAssessment && (request.timestamp - lastAssessment.timestamp) < 3600) {
      logger.info('Using last known assessment as fallback', {
        vault: request.vault_address,
        staleness: request.timestamp - lastAssessment.timestamp
      })
      
      return {
        ...lastAssessment,
        stale: true,
        staleness_seconds: request.timestamp - lastAssessment.timestamp
      }
    }
    
    // Return conservative fail-safe score
    return {
      risk_score: 50,
      recommended_action: 'INCREASE_MONITORING',
      confidence_level: 0.3,
      reasoning: `AI engine unavailable. Returning fail-safe score. Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      component_scores: {
        reserve_ratio_risk: 50,
        volatility_risk: 50,
        liquidity_risk: 50,
        abnormal_withdrawal_risk: 50
      },
      anomalies_detected: [],
      timestamp: request.timestamp,
      model_version: 'fail-safe',
      error: true
    }
  }
  
  private async storeAssessment(
    request: RiskAssessmentRequest,
    response: RiskAssessmentResponse
  ): Promise<void> {
    // Store in PostgreSQL for audit trail
    await db.query(
      `INSERT INTO risk_assessments 
       (vault_address, risk_score, recommended_action, confidence_level, reasoning, 
        component_scores, anomalies_detected, model_version, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        request.vault_address,
        response.risk_score,
        response.recommended_action,
        response.confidence_level,
        response.reasoning,
        JSON.stringify(response.component_scores),
        JSON.stringify(response.anomalies_detected),
        response.model_version
      ]
    )
  }
  
  private async getLastAssessment(vaultAddress: string): Promise<RiskAssessmentResponse | null> {
    const result = await db.query(
      `SELECT * FROM risk_assessments 
       WHERE vault_address = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [vaultAddress]
    )
    
    return result.rows[0] || null
  }
}
```

### World ID Verification Service

**Implementation**: `src/services/WorldIDService.ts`
```typescript
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { Redis } from 'ioredis'

interface WorldIDProof {
  proof: string
  merkle_root: string
  nullifier_hash: string
  verification_level: 'orb' | 'device'
  action: string
  signal: string
}

export class WorldIDService {
  private redis: Redis
  private jwtSecret: string
  
  constructor(redis: Redis) {
    this.redis = redis
    this.jwtSecret = process.env.JWT_SECRET!
  }
  
  async verifyProof(proofData: WorldIDProof): Promise<{ verified: boolean; jwt?: string }> {
    try {
      // Check if nullifier already used
      const nullifierKey = `nullifier:${proofData.action}:${proofData.nullifier_hash}`
      const exists = await this.redis.exists(nullifierKey)
      
      if (exists) {
        logger.warn('Nullifier already used', {
          action: proofData.action,
          nullifier: proofData.nullifier_hash
        })
        return { verified: false }
      }
      
      // Verify with World ID API
      const response = await axios.post(
        'https://developer.worldcoin.org/api/v1/verify',
        {
          proof: proofData.proof,
          merkle_root: proofData.merkle_root,
          nullifier_hash: proofData.nullifier_hash,
          verification_level: proofData.verification_level,
          action: proofData.action,
          signal: proofData.signal
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      )
      
      if (response.data.success !== true) {
        return { verified: false }
      }
      
      // Store nullifier permanently
      await this.redis.set(nullifierKey, Date.now())
      
      // Generate JWT
      const token = jwt.sign(
        {
          nullifier_hash: proofData.nullifier_hash,
          verification_level: proofData.verification_level,
          action: proofData.action,
          verified_at: Date.now()
        },
        this.jwtSecret,
        { expiresIn: '1h' }
      )
      
      // Cache verification
      await this.redis.setex(
        `verification:${proofData.nullifier_hash}`,
        3600,
        token
      )
      
      logger.info('World ID verification successful', {
        action: proofData.action,
        level: proofData.verification_level
      })
      
      return { verified: true, jwt: token }
      
    } catch (error) {
      logger.error('World ID verification failed', {
        error: error instanceof Error ? error.message : 'Unknown'
      })
      return { verified: false }
    }
  }
  
  verifyJWT(token: string): boolean {
    try {
      jwt.verify(token, this.jwtSecret)
      return true
    } catch {
      return false
    }
  }
}
```

### Health Check Endpoint

**Implementation**: `src/routes/status.ts`
```typescript
import express from 'express'
import { db } from '../config/database'
import { redis } from '../config/redis'
import { ethers } from 'ethers'

const router = express.Router()

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: Date.now(),
    version: process.env.npm_package_version,
    dependencies: {
      database: 'unknown',
      redis: 'unknown',
      blockchain: 'unknown',
      ai_engine: 'unknown'
    }
  }
  
  try {
    // Check database
    await db.query('SELECT 1')
    health.dependencies.database = 'healthy'
  } catch (error) {
    health.dependencies.database = 'unhealthy'
    health.status = 'degraded'
  }
  
  try {
    // Check Redis
    await redis.ping()
    health.dependencies.redis = 'healthy'
  } catch (error) {
    health.dependencies.redis = 'unhealthy'
    health.status = 'degraded'
  }
  
  try {
    // Check blockchain connection
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
    await provider.getBlockNumber()
    health.dependencies.blockchain = 'healthy'
  } catch (error) {
    health.dependencies.blockchain = 'unhealthy'
    health.status = 'degraded'
  }
  
  try {
    // Check AI engine
    const response = await axios.get(`${process.env.AI_ENGINE_URL}/health`, {
      timeout: 2000
    })
    health.dependencies.ai_engine = response.status === 200 ? 'healthy' : 'unhealthy'
  } catch (error) {
    health.dependencies.ai_engine = 'unhealthy'
    health.status = 'degraded'
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503
  res.status(statusCode).json(health)
})

export default router
```

---

## Correctness Properties

### Property 1: Reserve Ratio Invariant
**Validates**: Requirements 1.3, 1.4

**Property**: The reserve ratio SHALL always be calculated correctly and withdrawals SHALL be prevented when ratio falls below minimum threshold.

```typescript
property("Reserve ratio prevents withdrawals below threshold", async () => {
  const vault = await deployTokenizedVault()
  const minimumRatio = 2000 // 20%
  
  // Setup: Deposit assets
  await vault.deposit(parseEther("100"))
  
  // Calculate maximum safe withdrawal
  const state = await vault.getVaultState()
  const maxWithdrawal = calculateMaxWithdrawal(state, minimumRatio)
  
  // Property: Withdrawal at limit should succeed
  await expect(vault.withdraw(maxWithdrawal)).to.not.be.reverted
  
  // Property: Withdrawal beyond limit should revert
  await expect(vault.withdraw(parseEther("1"))).to.be.revertedWith("Reserve ratio too low")
})
```

### Property 2: World ID Nullifier Uniqueness
**Validates**: Requirements 5.2, 6.2, 7.6

**Property**: A World ID nullifier hash SHALL never be reused for the same action.

```typescript
property("World ID nullifiers prevent double participation", async () => {
  const market = await deployPredictionMarket()
  const proof = generateValidWorldIDProof()
  
  // First participation should succeed
  await expect(
    market.participateInMarket(
      marketId,
      outcomeIndex,
      proof.merkle_root,
      proof.nullifier_hash,
      proof.proof,
      { value: parseEther("0.1") }
    )
  ).to.not.be.reverted
  
  // Second participation with same nullifier should revert
  await expect(
    market.participateInMarket(
      marketId,
      outcomeIndex,
      proof.merkle_root,
      proof.nullifier_hash,
      proof.proof,
      { value: parseEther("0.1") }
    )
  ).to.be.revertedWith("Nullifier already used")
})
```

### Property 3: Risk Guardian Authorization
**Validates**: Requirements 4.1, 4.8

**Property**: Only authorized CRE workflows SHALL be able to trigger safeguards.

```typescript
property("Only authorized CRE can trigger safeguards", async () => {
  const riskGuardian = await deployRiskGuardian()
  const authorizedCRE = await deployCREWorkflow()
  const unauthorizedAddress = randomAddress()
  
  await riskGuardian.addAuthorizedCREWorkflow(authorizedCRE.address)
  
  // Authorized CRE should succeed
  await expect(
    riskGuardian.connect(authorizedCRE).executeRiskResponse(85, "PAUSE", 92, "Test")
  ).to.not.be.reverted
  
  // Unauthorized address should revert
  await expect(
    riskGuardian.connect(unauthorizedAddress).executeRiskResponse(85, "PAUSE", 92, "Test")
  ).to.be.revertedWith("Unauthorized CRE workflow")
})
```

### Property 4: AI Engine Fail-Safe
**Validates**: Requirements 2.5, 8.6, 21.4

**Property**: When AI engine fails, the system SHALL return a fail-safe risk score of 50 with low confidence.

```typescript
property("AI engine failure returns fail-safe score", async () => {
  const aiService = new AIRiskService(redis)
  
  // Simulate AI engine down
  mockAIEngineDown()
  
  const request = createRiskAssessmentRequest()
  const response = await aiService.assessRisk(request)
  
  // Property: Fail-safe score returned
  expect(response.risk_score).to.equal(50)
  expect(response.confidence_level).to.be.lessThan(0.5)
  expect(response.recommended_action).to.equal("INCREASE_MONITORING")
  expect(response.error).to.be.true
})
```

### Property 5: CRE Workflow Retry Logic
**Validates**: Requirements 3.5, 9.7

**Property**: CRE workflows SHALL retry failed steps with exponential backoff up to maximum attempts.

```typescript
property("CRE workflows retry with exponential backoff", async () => {
  const workflow = createCREWorkflow()
  let attemptCount = 0
  let attemptTimestamps: number[] = []
  
  // Mock failing step
  workflow.mockStep("fetch_market_data", () => {
    attemptCount++
    attemptTimestamps.push(Date.now())
    throw new Error("Network timeout")
  })
  
  await workflow.execute()
  
  // Property: Retried 3 times
  expect(attemptCount).to.equal(3)
  
  // Property: Exponential backoff applied
  const backoff1 = attemptTimestamps[1] - attemptTimestamps[0]
  const backoff2 = attemptTimestamps[2] - attemptTimestamps[1]
  expect(backoff2).to.be.greaterThan(backoff1 * 1.5)
})
```

---

## Testing Strategy

### Unit Tests
- Smart contract functions (Hardhat + Chai)
- Backend services (Jest)
- Frontend components (Vitest + React Testing Library)

### Integration Tests
- Contract interactions
- CRE workflow execution
- AI engine integration
- World ID verification flow

### Property-Based Tests
- Reserve ratio invariants
- Nullifier uniqueness
- Authorization checks
- Fail-safe behavior

### Simulation Tests (Tenderly)
- Flash crash scenario
- Liquidity drain attack
- Stablecoin depeg
- Emergency governance trigger

### End-to-End Tests
- Complete user flows
- Multi-contract interactions
- Real-time dashboard updates

---

## Deployment Strategy

### Phase 1: Testnet Deployment
1. Deploy to Sepolia testnet
2. Configure CRE workflows on testnet
3. Deploy AI engine to staging environment
4. Run all Tenderly simulations
5. Execute integration test suite

### Phase 2: Mainnet Preparation
1. Security audit by reputable firm
2. Bug bounty program launch
3. Guardian multi-sig setup
4. Monitoring and alerting configuration
5. Incident response procedures documented

### Phase 3: Mainnet Launch
1. Deploy contracts to mainnet
2. Verify contracts on Etherscan
3. Configure production CRE workflows
4. Deploy AI engine to production
5. Launch frontend application
6. Gradual TVL ramp with caps

### Phase 4: Post-Launch
1. Monitor system health 24/7
2. Collect user feedback
3. Iterate on UX improvements
4. Expand to additional chains
5. Add new features based on governance

---

## Conclusion

AETHER SENTINEL represents a comprehensive institutional-grade blockchain infrastructure that combines autonomous operations, AI-powered risk intelligence, human verification, and confidential compute. The system is designed with security, reliability, and regulatory compliance as core principles, validated through extensive simulation and property-based testing before production deployment.
