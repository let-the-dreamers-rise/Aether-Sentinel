import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=".repeat(60));
  console.log("AETHER SENTINEL - Sepolia Testnet Deployment");
  console.log("=".repeat(60));
  console.log();

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log();

  // Verify we're on Sepolia
  if (network.chainId !== 11155111n) {
    throw new Error(`Expected Sepolia (chainId: 11155111), got chainId: ${network.chainId}`);
  }

  const deploymentAddresses: any = {
    network: "sepolia",
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  // ========================================
  // 1. Deploy MockWorldID (for testing)
  // ========================================
  console.log("📝 Step 1: Deploying MockWorldID...");
  const MockWorldIDFactory = await ethers.getContractFactory("MockWorldID");
  const mockWorldID = await MockWorldIDFactory.deploy();
  await mockWorldID.waitForDeployment();
  const worldIDAddress = await mockWorldID.getAddress();
  deploymentAddresses.contracts.MockWorldID = worldIDAddress;
  console.log("✅ MockWorldID:", worldIDAddress);
  console.log();

  // ========================================
  // 2. Deploy MockERC20 (underlying asset)
  // ========================================
  console.log("📝 Step 2: Deploying MockERC20 (USDC)...");
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const underlyingAsset = await MockERC20Factory.deploy(
    "Mock USDC",
    "USDC",
    ethers.parseEther("10000000") // 10M tokens
  );
  await underlyingAsset.waitForDeployment();
  const usdcAddress = await underlyingAsset.getAddress();
  deploymentAddresses.contracts.MockERC20 = usdcAddress;
  console.log("✅ MockERC20 (USDC):", usdcAddress);
  console.log();

  // ========================================
  // 3. Deploy TokenizedVault
  // ========================================
  console.log("📝 Step 3: Deploying TokenizedVault (UUPS Proxy)...");
  const TokenizedVaultFactory = await ethers.getContractFactory("TokenizedVault");
  const MINIMUM_RESERVE_RATIO = 2000;
  const vault = await upgrades.deployProxy(
    TokenizedVaultFactory,
    [usdcAddress, MINIMUM_RESERVE_RATIO, deployer.address],
    { kind: "uups" }
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  deploymentAddresses.contracts.TokenizedVault = vaultAddress;
  console.log("✅ TokenizedVault:", vaultAddress);
  console.log("   Initialized with 20% minimum reserve ratio");
  console.log();

  // ========================================
  // 4. Deploy RiskGuardian
  // ========================================
  console.log("📝 Step 4: Deploying RiskGuardian (UUPS Proxy)...");
  const RiskGuardianFactory = await ethers.getContractFactory("RiskGuardian");
  const riskGuardian = await upgrades.deployProxy(
    RiskGuardianFactory,
    [vaultAddress, deployer.address],
    { kind: "uups" }
  );
  await riskGuardian.waitForDeployment();
  const riskGuardianAddress = await riskGuardian.getAddress();
  deploymentAddresses.contracts.RiskGuardian = riskGuardianAddress;
  console.log("✅ RiskGuardian:", riskGuardianAddress);
  console.log("   Initialized with vault and admin");
  console.log();

  // ========================================
  // 5. Deploy PredictionMarket
  // ========================================
  console.log("📝 Step 5: Deploying PredictionMarket (UUPS Proxy)...");
  const PredictionMarketFactory = await ethers.getContractFactory("PredictionMarket");
  const EXTERNAL_NULLIFIER_HASH = ethers.keccak256(ethers.toUtf8Bytes("aether-sentinel-prediction"));
  const GROUP_ID = 1;
  const MINIMUM_STAKE = ethers.parseEther("0.01");
  const PLATFORM_FEE = 200;

  const predictionMarket = await upgrades.deployProxy(
    PredictionMarketFactory,
    [worldIDAddress, EXTERNAL_NULLIFIER_HASH, GROUP_ID, MINIMUM_STAKE, PLATFORM_FEE],
    { kind: "uups" }
  );
  await predictionMarket.waitForDeployment();
  const predictionMarketAddress = await predictionMarket.getAddress();
  deploymentAddresses.contracts.PredictionMarket = predictionMarketAddress;
  console.log("✅ PredictionMarket:", predictionMarketAddress);
  console.log("   Initialized with 0.01 ETH minimum stake, 2% platform fee");
  console.log();

  // ========================================
  // 6. Deploy GovernanceModule
  // ========================================
  console.log("📝 Step 6: Deploying GovernanceModule (UUPS Proxy)...");
  const GovernanceModuleFactory = await ethers.getContractFactory("GovernanceModule");
  const GOV_EXTERNAL_NULLIFIER = ethers.keccak256(ethers.toUtf8Bytes("aether-sentinel-governance"));
  const QUORUM_PERCENTAGE = 40;
  const VOTING_PERIOD = 7 * 24 * 60 * 60;
  const EMERGENCY_VOTING_PERIOD = 24 * 60 * 60;

  const governance = await upgrades.deployProxy(
    GovernanceModuleFactory,
    [worldIDAddress, GOV_EXTERNAL_NULLIFIER, GROUP_ID, QUORUM_PERCENTAGE, VOTING_PERIOD, EMERGENCY_VOTING_PERIOD, deployer.address],
    { kind: "uups" }
  );
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  deploymentAddresses.contracts.GovernanceModule = governanceAddress;
  console.log("✅ GovernanceModule:", governanceAddress);
  console.log("   Initialized with 40% quorum, 7-day voting period");
  console.log();

  // ========================================
  // 7. Configure Roles and Permissions
  // ========================================
  console.log("📝 Step 7: Configuring roles and permissions...");
  
  // Grant RISK_GUARDIAN_ROLE to RiskGuardian on TokenizedVault
  const RISK_GUARDIAN_ROLE = await vault.RISK_GUARDIAN_ROLE();
  const grantRoleTx = await vault.grantRole(RISK_GUARDIAN_ROLE, riskGuardianAddress);
  await grantRoleTx.wait();
  console.log("✅ Granted RISK_GUARDIAN_ROLE to RiskGuardian");

  // Whitelist vault as target for governance
  const whitelistTx = await governance.whitelistTarget(vaultAddress);
  await whitelistTx.wait();
  console.log("✅ Whitelisted TokenizedVault in GovernanceModule");

  // Authorize deployer as resolver for PredictionMarket
  const authResolverTx = await predictionMarket.authorizeResolver(deployer.address);
  await authResolverTx.wait();
  console.log("✅ Authorized deployer as PredictionMarket resolver");

  // Update RiskGuardian governance address
  const updateGovTx = await riskGuardian.setGovernanceContract(governanceAddress);
  await updateGovTx.wait();
  console.log("✅ Updated RiskGuardian governance address");
  console.log();

  // ========================================
  // 8. Save Deployment Information
  // ========================================
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "sepolia.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentAddresses, null, 2));
  console.log("📄 Deployment info saved to:", deploymentFile);
  console.log();

  // ========================================
  // 9. Deployment Summary
  // ========================================
  console.log("=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log();
  console.log("Network:          Sepolia Testnet");
  console.log("Chain ID:         11155111");
  console.log("Deployer:         ", deployer.address);
  console.log();
  console.log("Contracts:");
  console.log("  MockWorldID:         ", worldIDAddress);
  console.log("  MockERC20 (USDC):    ", usdcAddress);
  console.log("  TokenizedVault:      ", vaultAddress);
  console.log("  RiskGuardian:        ", riskGuardianAddress);
  console.log("  PredictionMarket:    ", predictionMarketAddress);
  console.log("  GovernanceModule:    ", governanceAddress);
  console.log();
  console.log("Etherscan Links:");
  console.log("  TokenizedVault:      ", `https://sepolia.etherscan.io/address/${vaultAddress}`);
  console.log("  RiskGuardian:        ", `https://sepolia.etherscan.io/address/${riskGuardianAddress}`);
  console.log("  PredictionMarket:    ", `https://sepolia.etherscan.io/address/${predictionMarketAddress}`);
  console.log("  GovernanceModule:    ", `https://sepolia.etherscan.io/address/${governanceAddress}`);
  console.log();
  console.log("Next Steps:");
  console.log("  1. Verify contracts on Etherscan: npx hardhat verify --network sepolia <address>");
  console.log("  2. Configure CRE workflows with deployed addresses");
  console.log("  3. Deploy backend and frontend to staging");
  console.log("  4. Run integration tests against testnet");
  console.log();
  console.log("✅ Deployment completed successfully!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
