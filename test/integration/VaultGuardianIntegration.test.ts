import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenizedVault, RiskGuardian } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Integration Tests: TokenizedVault + RiskGuardian
 * 
 * Tests the complete flow of risk detection and safeguard execution
 */
describe("TokenizedVault + RiskGuardian Integration", function () {
  let vault: TokenizedVault;
  let guardian: RiskGuardian;
  let owner: SignerWithAddress;
  let creWorkflow: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, creWorkflow, user1, user2] = await ethers.getSigners();

    // Deploy TokenizedVault
    const TokenizedVault = await ethers.getContractFactory("TokenizedVault");
    vault = await TokenizedVault.deploy();
    await vault.waitForDeployment();

    // Deploy RiskGuardian
    const RiskGuardian = await ethers.getContractFactory("RiskGuardian");
    guardian = await RiskGuardian.deploy();
    await guardian.waitForDeployment();

    // Setup: Grant RiskGuardian permission to pause vault
    const RISK_GUARDIAN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RISK_GUARDIAN_ROLE"));
    await vault.grantRole(RISK_GUARDIAN_ROLE, await guardian.getAddress());

    // Setup: Authorize CRE workflow in RiskGuardian
    await guardian.addAuthorizedCREWorkflow(creWorkflow.address);

    // Setup: Configure RiskGuardian to control vault
    await guardian.setVaultContract(await vault.getAddress());
  });

  describe("Risk Detection and Emergency Pause", function () {
    it("Should trigger emergency pause when critical risk detected", async function () {
      // Setup: Users deposit funds
      await vault.connect(user1).deposit(ethers.parseEther("100"));
      await vault.connect(user2).deposit(ethers.parseEther("50"));

      // Verify vault is not paused
      const stateBefore = await vault.getVaultState();
      expect(stateBefore.paused).to.be.false;

      // Simulate: CRE workflow detects critical risk (score >= 90)
      await guardian.connect(creWorkflow).executeRiskResponse(
        95,
        "EMERGENCY_PAUSE",
        92,
        "Critical risk: Flash crash detected"
      );

      // Verify: Vault is now paused
      const stateAfter = await vault.getVaultState();
      expect(stateAfter.paused).to.be.true;

      // Verify: Users cannot deposit or withdraw
      await expect(
        vault.connect(user1).deposit(ethers.parseEther("10"))
      ).to.be.reverted;

      await expect(
        vault.connect(user1).withdraw(ethers.parseEther("10"))
      ).to.be.reverted;
    });

    it("Should adjust reserve ratio when elevated risk detected", async function () {
      // Setup: Deposit funds
      await vault.connect(user1).deposit(ethers.parseEther("100"));

      const stateBefore = await vault.getVaultState();
      const initialReserveRatio = stateBefore.reserveRatio;

      // Simulate: CRE workflow detects elevated risk (score 80-89)
      await guardian.connect(creWorkflow).executeRiskResponse(
        85,
        "ADJUST_RESERVE_RATIO",
        88,
        "Elevated risk: High volatility detected"
      );

      // Verify: Reserve ratio increased
      const stateAfter = await vault.getVaultState();
      expect(stateAfter.reserveRatio).to.be.gt(initialReserveRatio);
    });

    it("Should emit warning for moderate risk without action", async function () {
      // Simulate: CRE workflow detects moderate risk (score 60-79)
      await expect(
        guardian.connect(creWorkflow).executeRiskResponse(
          65,
          "INCREASE_MONITORING",
          75,
          "Moderate risk: Increased withdrawal activity"
        )
      ).to.emit(guardian, "RiskResponseExecuted");

      // Verify: Vault remains operational
      const state = await vault.getVaultState();
      expect(state.paused).to.be.false;

      // Verify: Users can still transact
      await expect(
        vault.connect(user1).deposit(ethers.parseEther("10"))
      ).to.not.be.reverted;
    });
  });

  describe("Cooldown Period Enforcement", function () {
    it("Should enforce cooldown between safeguard executions", async function () {
      // First execution
      await guardian.connect(creWorkflow).executeRiskResponse(
        85,
        "ADJUST_RESERVE_RATIO",
        88,
        "First risk signal"
      );

      // Immediate second execution should fail
      await expect(
        guardian.connect(creWorkflow).executeRiskResponse(
          90,
          "EMERGENCY_PAUSE",
          92,
          "Second risk signal"
        )
      ).to.be.revertedWith("Cooldown period active");
    });
  });

  describe("Authorization Checks", function () {
    it("Should reject risk response from unauthorized caller", async function () {
      await expect(
        guardian.connect(user1).executeRiskResponse(
          95,
          "EMERGENCY_PAUSE",
          92,
          "Unauthorized attempt"
        )
      ).to.be.revertedWith("Unauthorized CRE workflow");
    });

    it("Should emit unauthorized access event", async function () {
      await expect(
        guardian.connect(user1).executeRiskResponse(
          95,
          "EMERGENCY_PAUSE",
          92,
          "Unauthorized attempt"
        )
      ).to.emit(guardian, "UnauthorizedAccessAttempt");
    });
  });

  describe("Risk Signal Audit Trail", function () {
    it("Should store complete risk signal history", async function () {
      // Execute multiple risk responses
      await guardian.connect(creWorkflow).executeRiskResponse(
        65,
        "INCREASE_MONITORING",
        75,
        "Signal 1"
      );

      // Fast forward time to bypass cooldown
      await ethers.provider.send("evm_increaseTime", [3700]);
      await ethers.provider.send("evm_mine", []);

      await guardian.connect(creWorkflow).executeRiskResponse(
        85,
        "ADJUST_RESERVE_RATIO",
        88,
        "Signal 2"
      );

      // Verify: History contains both signals
      const history = await guardian.getRiskSignalHistory(10);
      expect(history.length).to.equal(2);
      expect(history[0].riskScore).to.equal(65);
      expect(history[1].riskScore).to.equal(85);
    });
  });

  describe("End-to-End Risk Mitigation Flow", function () {
    it("Should complete full risk detection and mitigation cycle", async function () {
      // Step 1: Normal operations
      await vault.connect(user1).deposit(ethers.parseEther("1000"));
      await vault.connect(user2).deposit(ethers.parseEther("500"));

      const initialState = await vault.getVaultState();
      expect(initialState.paused).to.be.false;

      // Step 2: Risk escalation - Moderate
      await guardian.connect(creWorkflow).executeRiskResponse(
        65,
        "INCREASE_MONITORING",
        75,
        "Moderate risk detected"
      );

      // Step 3: Fast forward time
      await ethers.provider.send("evm_increaseTime", [3700]);
      await ethers.provider.send("evm_mine", []);

      // Step 4: Risk escalation - Elevated
      await guardian.connect(creWorkflow).executeRiskResponse(
        85,
        "ADJUST_RESERVE_RATIO",
        88,
        "Elevated risk detected"
      );

      // Step 5: Fast forward time
      await ethers.provider.send("evm_increaseTime", [3700]);
      await ethers.provider.send("evm_mine", []);

      // Step 6: Risk escalation - Critical
      await guardian.connect(creWorkflow).executeRiskResponse(
        95,
        "EMERGENCY_PAUSE",
        92,
        "Critical risk detected"
      );

      // Verify: System is now in emergency mode
      const finalState = await vault.getVaultState();
      expect(finalState.paused).to.be.true;

      // Verify: Complete audit trail exists
      const history = await guardian.getRiskSignalHistory(10);
      expect(history.length).to.equal(3);
      expect(history[0].riskScore).to.equal(65);
      expect(history[1].riskScore).to.equal(85);
      expect(history[2].riskScore).to.equal(95);
    });
  });
});
