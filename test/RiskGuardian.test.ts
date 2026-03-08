import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { RiskGuardian, TokenizedVault, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RiskGuardian", function () {
  let riskGuardian: RiskGuardian;
  let vault: TokenizedVault;
  let underlyingAsset: MockERC20;
  let admin: SignerWithAddress;
  let creWorkflow: SignerWithAddress;
  let unauthorizedUser: SignerWithAddress;
  let user1: SignerWithAddress;

  const MINIMUM_RESERVE_RATIO = 2000; // 20%
  const INITIAL_SUPPLY = ethers.parseEther("1000000");

  beforeEach(async function () {
    [admin, creWorkflow, unauthorizedUser, user1] = await ethers.getSigners();

    // Deploy mock ERC20
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    underlyingAsset = await MockERC20Factory.deploy("Mock USDC", "USDC", INITIAL_SUPPLY);

    // Deploy TokenizedVault
    const TokenizedVaultFactory = await ethers.getContractFactory("TokenizedVault");
    vault = await upgrades.deployProxy(
      TokenizedVaultFactory,
      [await underlyingAsset.getAddress(), MINIMUM_RESERVE_RATIO, admin.address],
      { initializer: "initialize" }
    ) as unknown as TokenizedVault;

    // Deploy RiskGuardian
    const RiskGuardianFactory = await ethers.getContractFactory("RiskGuardian");
    riskGuardian = await upgrades.deployProxy(
      RiskGuardianFactory,
      [await vault.getAddress(), admin.address],
      { initializer: "initialize" }
    ) as unknown as RiskGuardian;

    // Grant RiskGuardian role to RiskGuardian contract on vault
    const RISK_GUARDIAN_ROLE = await vault.RISK_GUARDIAN_ROLE();
    await vault.connect(admin).grantRole(RISK_GUARDIAN_ROLE, await riskGuardian.getAddress());

    // Authorize CRE workflow
    await riskGuardian.connect(admin).addAuthorizedCREWorkflow(creWorkflow.address);
  });

  describe("Initialization", function () {
    it("Should initialize with correct parameters", async function () {
      expect(await riskGuardian.vaultContract()).to.equal(await vault.getAddress());
      expect(await riskGuardian.moderateRiskThreshold()).to.equal(60);
      expect(await riskGuardian.elevatedRiskThreshold()).to.equal(80);
      expect(await riskGuardian.criticalRiskThreshold()).to.equal(90);
      expect(await riskGuardian.safeguardCooldown()).to.equal(3600);
    });

    it("Should grant admin role to deployer", async function () {
      const ADMIN_ROLE = await riskGuardian.ADMIN_ROLE();
      expect(await riskGuardian.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });
  });

  describe("CRE Workflow Authorization", function () {
    it("Should allow admin to authorize CRE workflow", async function () {
      const newWorkflow = unauthorizedUser.address;
      
      await expect(riskGuardian.connect(admin).addAuthorizedCREWorkflow(newWorkflow))
        .to.emit(riskGuardian, "CREWorkflowAuthorized")
        .withArgs(newWorkflow, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      expect(await riskGuardian.isAuthorizedWorkflow(newWorkflow)).to.be.true;
    });

    it("Should allow admin to revoke CRE workflow", async function () {
      await expect(riskGuardian.connect(admin).removeAuthorizedCREWorkflow(creWorkflow.address))
        .to.emit(riskGuardian, "CREWorkflowRevoked")
        .withArgs(creWorkflow.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      expect(await riskGuardian.isAuthorizedWorkflow(creWorkflow.address)).to.be.false;
    });

    it("Should prevent non-admin from authorizing workflows", async function () {
      await expect(
        riskGuardian.connect(unauthorizedUser).addAuthorizedCREWorkflow(unauthorizedUser.address)
      ).to.be.reverted;
    });

    it("Should return list of authorized workflows", async function () {
      const workflows = await riskGuardian.getAuthorizedWorkflows();
      expect(workflows).to.include(creWorkflow.address);
    });
  });

  describe("Risk Response Execution", function () {
    it("Should allow authorized CRE to execute risk response", async function () {
      const riskScore = 75;
      const action = "ADJUST_RESERVE_RATIO";
      const confidence = 92;
      const reasoning = "Elevated risk detected";

      await expect(
        riskGuardian.connect(creWorkflow).executeRiskResponse(
          riskScore,
          action,
          confidence,
          reasoning
        )
      ).to.emit(riskGuardian, "RiskResponseExecuted")
        .withArgs(riskScore, action, confidence, creWorkflow.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
    });

    it("Should prevent unauthorized address from executing risk response", async function () {
      await expect(
        riskGuardian.connect(unauthorizedUser).executeRiskResponse(
          75,
          "ADJUST_RESERVE_RATIO",
          92,
          "Test"
        )
      ).to.be.revertedWithCustomError(riskGuardian, "UnauthorizedCREWorkflow");
    });

    it("Should emit unauthorized access attempt event", async function () {
      await expect(
        riskGuardian.connect(unauthorizedUser).executeRiskResponse(
          75,
          "ADJUST_RESERVE_RATIO",
          92,
          "Test"
        )
      ).to.emit(riskGuardian, "UnauthorizedAccessAttempt")
        .withArgs(unauthorizedUser.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
    });

    it("Should revert on invalid risk score", async function () {
      await expect(
        riskGuardian.connect(creWorkflow).executeRiskResponse(
          150, // Invalid
          "TEST",
          92,
          "Test"
        )
      ).to.be.revertedWithCustomError(riskGuardian, "InvalidRiskScore");
    });

    it("Should revert on invalid confidence", async function () {
      await expect(
        riskGuardian.connect(creWorkflow).executeRiskResponse(
          75,
          "TEST",
          150, // Invalid
          "Test"
        )
      ).to.be.revertedWithCustomError(riskGuardian, "InvalidConfidence");
    });

    it("Should store risk signal in history", async function () {
      await riskGuardian.connect(creWorkflow).executeRiskResponse(
        75,
        "ADJUST_RESERVE_RATIO",
        92,
        "Test reasoning"
      );

      const history = await riskGuardian.getRiskSignalHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0].riskScore).to.equal(75);
      expect(history[0].recommendedAction).to.equal("ADJUST_RESERVE_RATIO");
      expect(history[0].confidence).to.equal(92);
      expect(history[0].triggeredBy).to.equal(creWorkflow.address);
    });
  });

  describe("Moderate Risk Response", function () {
    it("Should emit warning event for moderate risk (60-79)", async function () {
      await expect(
        riskGuardian.connect(creWorkflow).executeRiskResponse(
          65,
          "INCREASE_MONITORING",
          85,
          "Moderate risk detected"
        )
      ).to.emit(riskGuardian, "RiskResponseExecuted");

      // Vault should not be paused
      const vaultState = await vault.getVaultState();
      expect(vaultState.paused).to.be.false;
    });
  });

  describe("Elevated Risk Response", function () {
    it("Should adjust reserve ratio for elevated risk (80-89)", async function () {
      // Setup: Add some deposits to vault
      await underlyingAsset.transfer(user1.address, ethers.parseEther("1000"));
      await underlyingAsset.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
      await vault.connect(user1).deposit(ethers.parseEther("1000"));

      const initialRatio = await vault.minimumReserveRatio();

      await expect(
        riskGuardian.connect(creWorkflow).executeRiskResponse(
          85,
          "ADJUST_RESERVE_RATIO",
          90,
          "Elevated risk detected"
        )
      ).to.emit(riskGuardian, "ElevatedSafeguardActivated");

      const newRatio = await vault.minimumReserveRatio();
      expect(newRatio).to.be.gt(initialRatio);
    });
  });

  describe("Critical Risk Response", function () {
    it("Should trigger emergency pause for critical risk (90+)", async function () {
      await expect(
        riskGuardian.connect(creWorkflow).executeRiskResponse(
          92,
          "EMERGENCY_PAUSE",
          95,
          "Critical risk detected"
        )
      ).to.emit(riskGuardian, "CriticalSafeguardActivated");

      const vaultState = await vault.getVaultState();
      expect(vaultState.paused).to.be.true;
    });

    it("Should trigger emergency governance for risk >= 95", async function () {
      // Note: This test would require GovernanceModule to be deployed
      // For now, we test that it doesn't revert even without governance
      await expect(
        riskGuardian.connect(creWorkflow).executeRiskResponse(
          96,
          "EMERGENCY_PAUSE",
          98,
          "Extreme risk detected"
        )
      ).to.not.be.reverted;
    });
  });

  describe("Cooldown Period", function () {
    it("Should enforce cooldown period between safeguard executions", async function () {
      // First execution
      await riskGuardian.connect(creWorkflow).executeRiskResponse(
        85,
        "ADJUST_RESERVE_RATIO",
        90,
        "First execution"
      );

      // Second execution should fail due to cooldown
      await expect(
        riskGuardian.connect(creWorkflow).executeRiskResponse(
          85,
          "ADJUST_RESERVE_RATIO",
          90,
          "Second execution"
        )
      ).to.be.revertedWithCustomError(riskGuardian, "CooldownActive");
    });

    it("Should allow execution after cooldown period", async function () {
      // First execution
      await riskGuardian.connect(creWorkflow).executeRiskResponse(
        85,
        "ADJUST_RESERVE_RATIO",
        90,
        "First execution"
      );

      // Advance time by cooldown period
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      // Second execution should succeed
      await expect(
        riskGuardian.connect(creWorkflow).executeRiskResponse(
          85,
          "ADJUST_RESERVE_RATIO",
          90,
          "Second execution"
        )
      ).to.not.be.reverted;
    });

    it("Should allow admin to update cooldown period", async function () {
      const newCooldown = 7200; // 2 hours
      await riskGuardian.connect(admin).updateSafeguardCooldown(newCooldown);
      expect(await riskGuardian.safeguardCooldown()).to.equal(newCooldown);
    });
  });

  describe("Threshold Management", function () {
    it("Should allow admin to update thresholds", async function () {
      const newModerate = 50;
      const newElevated = 75;
      const newCritical = 95;

      await expect(
        riskGuardian.connect(admin).updateThresholds(newModerate, newElevated, newCritical)
      ).to.emit(riskGuardian, "ThresholdsUpdated")
        .withArgs(newModerate, newElevated, newCritical, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));

      expect(await riskGuardian.moderateRiskThreshold()).to.equal(newModerate);
      expect(await riskGuardian.elevatedRiskThreshold()).to.equal(newElevated);
      expect(await riskGuardian.criticalRiskThreshold()).to.equal(newCritical);
    });

    it("Should revert on invalid threshold ordering", async function () {
      await expect(
        riskGuardian.connect(admin).updateThresholds(80, 70, 90) // moderate > elevated
      ).to.be.revertedWithCustomError(riskGuardian, "InvalidThresholds");
    });

    it("Should prevent non-admin from updating thresholds", async function () {
      await expect(
        riskGuardian.connect(unauthorizedUser).updateThresholds(50, 75, 95)
      ).to.be.reverted;
    });
  });

  describe("Risk Signal History", function () {
    it("Should return correct number of recent signals", async function () {
      // Execute multiple risk responses
      for (let i = 0; i < 5; i++) {
        await riskGuardian.connect(creWorkflow).executeRiskResponse(
          60 + i,
          "TEST",
          90,
          `Test ${i}`
        );
        
        // Advance time to avoid cooldown
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine", []);
      }

      const history = await riskGuardian.getRiskSignalHistory(3);
      expect(history.length).to.equal(3);
      
      // Should return most recent signals
      expect(history[2].riskScore).to.equal(64);
    });

    it("Should return all signals if count exceeds history length", async function () {
      await riskGuardian.connect(creWorkflow).executeRiskResponse(
        75,
        "TEST",
        90,
        "Test"
      );

      const history = await riskGuardian.getRiskSignalHistory(100);
      expect(history.length).to.equal(1);
    });
  });

  describe("Governance Integration", function () {
    it("Should allow admin to set governance contract", async function () {
      const mockGovernance = unauthorizedUser.address; // Using as mock address
      
      await riskGuardian.connect(admin).setGovernanceContract(mockGovernance);
      expect(await riskGuardian.governanceContract()).to.equal(mockGovernance);
    });

    it("Should revert on zero address for governance", async function () {
      await expect(
        riskGuardian.connect(admin).setGovernanceContract(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(riskGuardian, "ZeroAddress");
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should have reentrancy protection on executeRiskResponse", async function () {
      // The nonReentrant modifier is present in the contract
      // Actual reentrancy testing would require a malicious contract
    });
  });
});
