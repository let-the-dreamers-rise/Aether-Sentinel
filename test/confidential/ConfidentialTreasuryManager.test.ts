import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { ConfidentialTreasuryManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ConfidentialTreasuryManager", function () {
  let treasury: ConfidentialTreasuryManager;
  let owner: SignerWithAddress;
  let strategyManager: SignerWithAddress;
  let operator: SignerWithAddress;
  let governance: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const STRATEGY_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("STRATEGY_MANAGER_ROLE"));
  const TREASURY_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TREASURY_OPERATOR_ROLE"));
  const GOVERNANCE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GOVERNANCE_ROLE"));

  beforeEach(async function () {
    [owner, strategyManager, operator, governance, unauthorized] = await ethers.getSigners();

    const ConfidentialTreasuryManager = await ethers.getContractFactory("ConfidentialTreasuryManager");
    treasury = await upgrades.deployProxy(
      ConfidentialTreasuryManager,
      [],
      { initializer: "initialize" }
    ) as unknown as ConfidentialTreasuryManager;

    await treasury.grantRole(STRATEGY_MANAGER_ROLE, strategyManager.address);
    await treasury.grantRole(TREASURY_OPERATOR_ROLE, operator.address);
    await treasury.grantRole(GOVERNANCE_ROLE, governance.address);
  });

  describe("Initialization", function () {
    it("Should initialize with default strategy", async function () {
      const [lastExecuted, lastUpdated, updatedBy, active] = await treasury.getStrategyMetadata();
      expect(updatedBy).to.equal(owner.address);
      expect(active).to.be.true;
      expect(lastUpdated).to.be.gt(0);
      expect(lastExecuted).to.equal(0);
    });

    it("Should grant roles correctly", async function () {
      expect(await treasury.hasRole(STRATEGY_MANAGER_ROLE, strategyManager.address)).to.be.true;
      expect(await treasury.hasRole(TREASURY_OPERATOR_ROLE, operator.address)).to.be.true;
      expect(await treasury.hasRole(GOVERNANCE_ROLE, governance.address)).to.be.true;
    });
  });

  describe("Strategy Management", function () {
    it("Should allow strategy manager to update strategy", async function () {
      const encryptedAllocation = ethers.hexlify(ethers.randomBytes(64));
      const encryptedThreshold = ethers.hexlify(ethers.randomBytes(32));
      const encryptedSlippage = ethers.hexlify(ethers.randomBytes(32));

      await expect(
        treasury.connect(strategyManager).updateStrategy(
          encryptedAllocation,
          encryptedThreshold,
          encryptedSlippage
        )
      )
        .to.emit(treasury, "StrategyUpdated")
        .withArgs(await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1), strategyManager.address);

      const [, lastUpdated, updatedBy] = await treasury.getStrategyMetadata();
      expect(updatedBy).to.equal(strategyManager.address);
    });

    it("Should reject empty strategy values", async function () {
      await expect(
        treasury.connect(strategyManager).updateStrategy(
          "0x",
          ethers.hexlify(ethers.randomBytes(32)),
          ethers.hexlify(ethers.randomBytes(32))
        )
      ).to.be.revertedWith("Invalid allocation");
    });

    it("Should reject updates from non-strategy-manager", async function () {
      const encryptedAllocation = ethers.hexlify(ethers.randomBytes(64));
      const encryptedThreshold = ethers.hexlify(ethers.randomBytes(32));
      const encryptedSlippage = ethers.hexlify(ethers.randomBytes(32));

      await expect(
        treasury.connect(unauthorized).updateStrategy(
          encryptedAllocation,
          encryptedThreshold,
          encryptedSlippage
        )
      ).to.be.reverted;
    });
  });

  describe("Strategy Activation", function () {
    it("Should allow deactivating strategy", async function () {
      await expect(
        treasury.connect(strategyManager).deactivateStrategy()
      )
        .to.emit(treasury, "StrategyDeactivated");

      const [, , , active] = await treasury.getStrategyMetadata();
      expect(active).to.be.false;
    });

    it("Should allow reactivating strategy", async function () {
      await treasury.connect(strategyManager).deactivateStrategy();
      
      await expect(
        treasury.connect(strategyManager).activateStrategy()
      )
        .to.emit(treasury, "StrategyActivated");

      const [, , , active] = await treasury.getStrategyMetadata();
      expect(active).to.be.true;
    });

    it("Should reject activation when already active", async function () {
      await expect(
        treasury.connect(strategyManager).activateStrategy()
      ).to.be.revertedWith("Already active");
    });

    it("Should reject deactivation when already inactive", async function () {
      await treasury.connect(strategyManager).deactivateStrategy();
      
      await expect(
        treasury.connect(strategyManager).deactivateStrategy()
      ).to.be.revertedWith("Already inactive");
    });
  });

  describe("Rebalance Execution", function () {
    it("Should execute rebalance with valid parameters", async function () {
      // Create portfolio with significant deviation from default allocation [40, 30, 20, 10]
      const currentBalances = [
        ethers.parseEther("100"), // Asset 0: 100 units
        ethers.parseEther("50"),  // Asset 1: 50 units
        ethers.parseEther("30"),  // Asset 2: 30 units
        ethers.parseEther("20")   // Asset 3: 20 units
      ];

      const currentPrices = [
        ethers.parseEther("1"),   // $1 per unit
        ethers.parseEther("1"),   // $1 per unit
        ethers.parseEther("1"),   // $1 per unit
        ethers.parseEther("1")    // $1 per unit
      ];

      // Total value = 200, current allocation = [50%, 25%, 15%, 10%]
      // Target allocation = [40%, 30%, 20%, 10%]
      // Max deviation = 10% (should trigger rebalance with 5% threshold)

      await expect(
        treasury.connect(operator).executeRebalance(currentBalances, currentPrices)
      ).to.emit(treasury, "RebalanceExecuted");

      const count = await treasury.getRebalanceHistoryCount();
      expect(count).to.equal(1);
    });

    it("Should reject rebalance when strategy inactive", async function () {
      await treasury.connect(strategyManager).deactivateStrategy();

      const currentBalances = [ethers.parseEther("100")];
      const currentPrices = [ethers.parseEther("1")];

      await expect(
        treasury.connect(operator).executeRebalance(currentBalances, currentPrices)
      ).to.be.revertedWith("Strategy not active");
    });

    it("Should reject rebalance with mismatched array lengths", async function () {
      const currentBalances = [ethers.parseEther("100"), ethers.parseEther("50")];
      const currentPrices = [ethers.parseEther("1")];

      await expect(
        treasury.connect(operator).executeRebalance(currentBalances, currentPrices)
      ).to.be.revertedWith("Array length mismatch");
    });

    it("Should reject rebalance with empty arrays", async function () {
      await expect(
        treasury.connect(operator).executeRebalance([], [])
      ).to.be.revertedWith("Empty arrays");
    });

    it("Should reject rebalance from non-operator", async function () {
      const currentBalances = [ethers.parseEther("100")];
      const currentPrices = [ethers.parseEther("1")];

      await expect(
        treasury.connect(unauthorized).executeRebalance(currentBalances, currentPrices)
      ).to.be.reverted;
    });

    it("Should enforce minimum rebalance interval", async function () {
      const currentBalances = [
        ethers.parseEther("100"),
        ethers.parseEther("50"),
        ethers.parseEther("30"),
        ethers.parseEther("20")
      ];

      const currentPrices = [
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        ethers.parseEther("1")
      ];

      // First rebalance
      await treasury.connect(operator).executeRebalance(currentBalances, currentPrices);

      // Try immediate second rebalance
      await expect(
        treasury.connect(operator).executeRebalance(currentBalances, currentPrices)
      ).to.be.revertedWith("Rebalance too soon");
    });
  });

  describe("Governance Approval", function () {
    let instructionHash: string;

    beforeEach(async function () {
      const currentBalances = [
        ethers.parseEther("100"),
        ethers.parseEther("50"),
        ethers.parseEther("30"),
        ethers.parseEther("20")
      ];

      const currentPrices = [
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        ethers.parseEther("1")
      ];

      await treasury.connect(operator).executeRebalance(currentBalances, currentPrices);
      
      const execution = await treasury.getRebalanceExecution(0);
      instructionHash = execution.instructionHash;
    });

    it("Should allow governance to approve instructions", async function () {
      await expect(
        treasury.connect(governance).approveRebalanceInstructions(instructionHash)
      )
        .to.emit(treasury, "RebalanceApproved")
        .withArgs(instructionHash, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      expect(await treasury.isApproved(instructionHash)).to.be.true;
    });

    it("Should reject duplicate approval", async function () {
      await treasury.connect(governance).approveRebalanceInstructions(instructionHash);

      await expect(
        treasury.connect(governance).approveRebalanceInstructions(instructionHash)
      ).to.be.revertedWith("Already approved");
    });

    it("Should reject approval from non-governance", async function () {
      await expect(
        treasury.connect(unauthorized).approveRebalanceInstructions(instructionHash)
      ).to.be.reverted;
    });
  });

  describe("History Management", function () {
    beforeEach(async function () {
      const currentBalances = [
        ethers.parseEther("100"),
        ethers.parseEther("50"),
        ethers.parseEther("30"),
        ethers.parseEther("20")
      ];

      const currentPrices = [
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        ethers.parseEther("1")
      ];

      // Execute multiple rebalances
      await treasury.connect(operator).executeRebalance(currentBalances, currentPrices);
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3700]);
      await ethers.provider.send("evm_mine", []);
      
      await treasury.connect(operator).executeRebalance(currentBalances, currentPrices);
    });

    it("Should return correct history count", async function () {
      const count = await treasury.getRebalanceHistoryCount();
      expect(count).to.equal(2);
    });

    it("Should return execution by index", async function () {
      const execution = await treasury.getRebalanceExecution(0);
      expect(execution.executor).to.equal(operator.address);
      expect(execution.approved).to.be.false;
    });

    it("Should return recent executions", async function () {
      const recent = await treasury.getRecentRebalances(2);
      expect(recent.length).to.equal(2);
      expect(recent[0].executor).to.equal(operator.address);
      expect(recent[1].executor).to.equal(operator.address);
    });

    it("Should handle request for more executions than exist", async function () {
      const recent = await treasury.getRecentRebalances(10);
      expect(recent.length).to.equal(2);
    });

    it("Should reject invalid execution index", async function () {
      await expect(
        treasury.getRebalanceExecution(999)
      ).to.be.revertedWith("Invalid index");
    });
  });

  describe("View Functions", function () {
    it("Should return strategy metadata", async function () {
      const [lastExecuted, lastUpdated, updatedBy, active] = await treasury.getStrategyMetadata();
      
      expect(lastExecuted).to.equal(0);
      expect(lastUpdated).to.be.gt(0);
      expect(updatedBy).to.equal(owner.address);
      expect(active).to.be.true;
    });

    it("Should return approval status", async function () {
      const randomHash = ethers.keccak256(ethers.toUtf8Bytes("random"));
      expect(await treasury.isApproved(randomHash)).to.be.false;
    });
  });
});
