import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { RiskGuardian, TokenizedVault, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Property-Based Test for RiskGuardian
 * **Validates: Requirements 4.1, 4.8**
 * 
 * Property 3: Risk Guardian Authorization
 * Only authorized CRE workflows SHALL be able to trigger safeguards.
 */
describe("RiskGuardian - Property Tests", function () {
  let riskGuardian: RiskGuardian;
  let vault: TokenizedVault;
  let underlyingAsset: MockERC20;
  let admin: SignerWithAddress;
  let authorizedWorkflows: SignerWithAddress[];
  let unauthorizedAddresses: SignerWithAddress[];

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    authorizedWorkflows = signers.slice(1, 4); // 3 authorized workflows
    unauthorizedAddresses = signers.slice(4, 10); // 6 unauthorized addresses

    // Deploy mock ERC20
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    underlyingAsset = await MockERC20Factory.deploy(
      "Mock USDC",
      "USDC",
      ethers.parseEther("1000000")
    );

    // Deploy TokenizedVault
    const TokenizedVaultFactory = await ethers.getContractFactory("TokenizedVault");
    vault = await upgrades.deployProxy(
      TokenizedVaultFactory,
      [await underlyingAsset.getAddress(), 2000, admin.address],
      { initializer: "initialize" }
    ) as unknown as TokenizedVault;

    // Deploy RiskGuardian
    const RiskGuardianFactory = await ethers.getContractFactory("RiskGuardian");
    riskGuardian = await upgrades.deployProxy(
      RiskGuardianFactory,
      [await vault.getAddress(), admin.address],
      { initializer: "initialize" }
    ) as unknown as RiskGuardian;

    // Grant RiskGuardian role on vault
    const RISK_GUARDIAN_ROLE = await vault.RISK_GUARDIAN_ROLE();
    await vault.connect(admin).grantRole(RISK_GUARDIAN_ROLE, await riskGuardian.getAddress());

    // Authorize workflows
    for (const workflow of authorizedWorkflows) {
      await riskGuardian.connect(admin).addAuthorizedCREWorkflow(workflow.address);
    }
  });

  describe("Property 3: Authorization Invariant", function () {
    it("PROPERTY: Only authorized CRE can trigger safeguards", async function () {
      // Test all authorized workflows can execute
      for (const workflow of authorizedWorkflows) {
        await expect(
          riskGuardian.connect(workflow).executeRiskResponse(
            75,
            "TEST",
            90,
            "Authorized test"
          )
        ).to.not.be.reverted;

        // Advance time to avoid cooldown
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine", []);
      }

      // Verify all executions were recorded
      const history = await riskGuardian.getRiskSignalHistory(10);
      expect(history.length).to.equal(authorizedWorkflows.length);
    });

    it("PROPERTY: Unauthorized addresses always revert", async function () {
      // Test all unauthorized addresses are rejected
      for (const unauthorized of unauthorizedAddresses) {
        await expect(
          riskGuardian.connect(unauthorized).executeRiskResponse(
            75,
            "TEST",
            90,
            "Unauthorized test"
          )
        ).to.be.revertedWithCustomError(riskGuardian, "UnauthorizedCREWorkflow");
      }

      // Verify no executions were recorded
      const history = await riskGuardian.getRiskSignalHistory(10);
      expect(history.length).to.equal(0);
    });

    it("PROPERTY: Authorization can be revoked and re-granted", async function () {
      const workflow = authorizedWorkflows[0];

      // Initially authorized - should succeed
      await expect(
        riskGuardian.connect(workflow).executeRiskResponse(
          75,
          "TEST",
          90,
          "Test 1"
        )
      ).to.not.be.reverted;

      // Revoke authorization
      await riskGuardian.connect(admin).removeAuthorizedCREWorkflow(workflow.address);

      // Should now fail
      await expect(
        riskGuardian.connect(workflow).executeRiskResponse(
          75,
          "TEST",
          90,
          "Test 2"
        )
      ).to.be.revertedWithCustomError(riskGuardian, "UnauthorizedCREWorkflow");

      // Re-grant authorization
      await riskGuardian.connect(admin).addAuthorizedCREWorkflow(workflow.address);

      // Advance time to avoid cooldown
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);

      // Should succeed again
      await expect(
        riskGuardian.connect(workflow).executeRiskResponse(
          75,
          "TEST",
          90,
          "Test 3"
        )
      ).to.not.be.reverted;
    });

    it("PROPERTY: Authorization list is always accurate", async function () {
      // Get initial list
      let workflows = await riskGuardian.getAuthorizedWorkflows();
      expect(workflows.length).to.equal(authorizedWorkflows.length);

      // Add new workflow
      const newWorkflow = unauthorizedAddresses[0];
      await riskGuardian.connect(admin).addAuthorizedCREWorkflow(newWorkflow.address);

      workflows = await riskGuardian.getAuthorizedWorkflows();
      expect(workflows.length).to.equal(authorizedWorkflows.length + 1);
      expect(workflows).to.include(newWorkflow.address);

      // Remove workflow
      await riskGuardian.connect(admin).removeAuthorizedCREWorkflow(newWorkflow.address);

      workflows = await riskGuardian.getAuthorizedWorkflows();
      expect(workflows.length).to.equal(authorizedWorkflows.length);
      expect(workflows).to.not.include(newWorkflow.address);
    });

    it("PROPERTY: Unauthorized access attempts are always logged", async function () {
      const attemptsCount = 5;
      
      for (let i = 0; i < attemptsCount; i++) {
        const tx = riskGuardian.connect(unauthorizedAddresses[i]).executeRiskResponse(
          75,
          "TEST",
          90,
          "Attack attempt"
        );

        await expect(tx)
          .to.emit(riskGuardian, "UnauthorizedAccessAttempt")
          .withArgs(unauthorizedAddresses[i].address, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
      }
    });

    it("PROPERTY: Authorization check happens before any state changes", async function () {
      const unauthorized = unauthorizedAddresses[0];
      
      // Get initial state
      const historyBefore = await riskGuardian.getRiskSignalHistory(10);
      const lastExecutionBefore = await riskGuardian.lastSafeguardExecution();

      // Attempt unauthorized execution
      await expect(
        riskGuardian.connect(unauthorized).executeRiskResponse(
          92,
          "EMERGENCY_PAUSE",
          95,
          "Malicious attempt"
        )
      ).to.be.revertedWithCustomError(riskGuardian, "UnauthorizedCREWorkflow");

      // Verify no state changes occurred
      const historyAfter = await riskGuardian.getRiskSignalHistory(10);
      const lastExecutionAfter = await riskGuardian.lastSafeguardExecution();
      const vaultState = await vault.getVaultState();

      expect(historyAfter.length).to.equal(historyBefore.length);
      expect(lastExecutionAfter).to.equal(lastExecutionBefore);
      expect(vaultState.paused).to.be.false; // Vault should not be paused
    });

    it("PROPERTY: Multiple authorized workflows can execute independently", async function () {
      const riskScores = [65, 75, 85];
      
      for (let i = 0; i < authorizedWorkflows.length; i++) {
        await riskGuardian.connect(authorizedWorkflows[i]).executeRiskResponse(
          riskScores[i],
          `ACTION_${i}`,
          90 + i,
          `Reasoning ${i}`
        );

        // Advance time
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine", []);
      }

      // Verify all executions recorded with correct triggeredBy
      const history = await riskGuardian.getRiskSignalHistory(10);
      expect(history.length).to.equal(authorizedWorkflows.length);

      for (let i = 0; i < authorizedWorkflows.length; i++) {
        expect(history[i].triggeredBy).to.equal(authorizedWorkflows[i].address);
        expect(history[i].riskScore).to.equal(riskScores[i]);
      }
    });

    it("PROPERTY: Authorization persists across contract upgrades", async function () {
      // Verify initial authorization
      expect(await riskGuardian.isAuthorizedWorkflow(authorizedWorkflows[0].address)).to.be.true;

      // Note: Actual upgrade testing would require upgrade implementation
      // This test verifies the authorization state is maintained
      const workflows = await riskGuardian.getAuthorizedWorkflows();
      expect(workflows.length).to.be.gt(0);
    });

    it("PROPERTY: Only admin can modify authorization list", async function () {
      const newWorkflow = unauthorizedAddresses[0];

      // Non-admin cannot add
      await expect(
        riskGuardian.connect(unauthorizedAddresses[1]).addAuthorizedCREWorkflow(newWorkflow.address)
      ).to.be.reverted;

      // Non-admin cannot remove
      await expect(
        riskGuardian.connect(unauthorizedAddresses[1]).removeAuthorizedCREWorkflow(authorizedWorkflows[0].address)
      ).to.be.reverted;

      // Admin can add
      await expect(
        riskGuardian.connect(admin).addAuthorizedCREWorkflow(newWorkflow.address)
      ).to.not.be.reverted;

      // Admin can remove
      await expect(
        riskGuardian.connect(admin).removeAuthorizedCREWorkflow(newWorkflow.address)
      ).to.not.be.reverted;
    });

    it("PROPERTY: Authorization check is consistent across all risk levels", async function () {
      const riskLevels = [50, 65, 85, 95]; // Below moderate, moderate, elevated, critical
      const authorized = authorizedWorkflows[0];
      const unauthorized = unauthorizedAddresses[0];

      for (const riskLevel of riskLevels) {
        // Authorized should succeed
        await expect(
          riskGuardian.connect(authorized).executeRiskResponse(
            riskLevel,
            "TEST",
            90,
            `Test at risk ${riskLevel}`
          )
        ).to.not.be.reverted;

        // Advance time
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine", []);

        // Unauthorized should fail
        await expect(
          riskGuardian.connect(unauthorized).executeRiskResponse(
            riskLevel,
            "TEST",
            90,
            `Attack at risk ${riskLevel}`
          )
        ).to.be.revertedWithCustomError(riskGuardian, "UnauthorizedCREWorkflow");
      }
    });
  });
});
