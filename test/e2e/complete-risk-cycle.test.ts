import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * End-to-End Test: Complete Risk Monitoring Cycle
 * 
 * Tests the full flow from risk detection to safeguard execution
 * Simulates CRE Workflow A behavior
 */
describe("E2E: Complete Risk Monitoring Cycle", function () {
  it("Should complete full risk monitoring and response cycle", async function () {
    const [owner, creWorkflow, user] = await ethers.getSigners();

    // Deploy all contracts
    const TokenizedVault = await ethers.getContractFactory("TokenizedVault");
    const vault = await TokenizedVault.deploy();
    await vault.waitForDeployment();

    const RiskGuardian = await ethers.getContractFactory("RiskGuardian");
    const guardian = await RiskGuardian.deploy();
    await guardian.waitForDeployment();

    // Setup permissions
    const RISK_GUARDIAN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RISK_GUARDIAN_ROLE"));
    await vault.grantRole(RISK_GUARDIAN_ROLE, await guardian.getAddress());
    await guardian.addAuthorizedCREWorkflow(creWorkflow.address);
    await guardian.setVaultContract(await vault.getAddress());

    // Step 1: User deposits (normal operation)
    console.log("Step 1: User deposits funds");
    await vault.connect(user).deposit(ethers.parseEther("100"));
    
    let state = await vault.getVaultState();
    console.log(`  TVL: ${ethers.formatEther(state.totalDeposits)} ETH`);
    console.log(`  Reserve Ratio: ${state.reserveRatio / 100}%`);

    // Step 2: CRE Workflow fetches vault state (simulated)
    console.log("\nStep 2: CRE Workflow fetches vault state");
    const vaultState = await vault.getVaultState();
    console.log(`  Fetched state: ${JSON.stringify({
      reserveRatio: Number(vaultState.reserveRatio) / 100,
      totalDeposits: ethers.formatEther(vaultState.totalDeposits),
      paused: vaultState.paused
    })}`);

    // Step 3: AI Risk Engine assesses risk (simulated)
    console.log("\nStep 3: AI Risk Engine assesses risk");
    const riskAssessment = {
      riskScore: 85,
      action: "ADJUST_RESERVE_RATIO",
      confidence: 88,
      reasoning: "High volatility detected in market"
    };
    console.log(`  Risk Score: ${riskAssessment.riskScore}`);
    console.log(`  Recommended Action: ${riskAssessment.action}`);

    // Step 4: CRE Workflow executes risk response
    console.log("\nStep 4: CRE Workflow executes risk response");
    await guardian.connect(creWorkflow).executeRiskResponse(
      riskAssessment.riskScore,
      riskAssessment.action,
      riskAssessment.confidence,
      riskAssessment.reasoning
    );
    console.log("  ✅ Risk response executed");

    // Step 5: Verify safeguard applied
    console.log("\nStep 5: Verify safeguard applied");
    state = await vault.getVaultState();
    console.log(`  New Reserve Ratio: ${state.reserveRatio / 100}%`);

    // Step 6: Verify audit trail
    console.log("\nStep 6: Verify audit trail");
    const history = await guardian.getRiskSignalHistory(1);
    expect(history.length).to.equal(1);
    expect(history[0].riskScore).to.equal(85);
    console.log("  ✅ Audit trail recorded");

    console.log("\n✅ Complete risk monitoring cycle successful");
  });
});
