import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("Starting AETHER SENTINEL deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy MockWorldID
  console.log("Deploying MockWorldID...");
  const MockWorldIDFactory = await ethers.getContractFactory("MockWorldID");
  const mockWorldID = await MockWorldIDFactory.deploy();
  await mockWorldID.waitForDeployment();
  console.log("MockWorldID deployed to:", await mockWorldID.getAddress());

  // Deploy MockERC20
  console.log("\nDeploying MockERC20 (underlying asset)...");
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const underlyingAsset = await MockERC20Factory.deploy(
    "Mock USDC",
    "USDC",
    ethers.parseEther("1000000")
  );
  await underlyingAsset.waitForDeployment();
  console.log("MockERC20 deployed to:", await underlyingAsset.getAddress());

  // Deploy TokenizedVault via UUPS proxy
  console.log("\nDeploying TokenizedVault (UUPS Proxy)...");
  const TokenizedVaultFactory = await ethers.getContractFactory("TokenizedVault");
  const MINIMUM_RESERVE_RATIO = 2000;
  const vault = await upgrades.deployProxy(
    TokenizedVaultFactory,
    [await underlyingAsset.getAddress(), MINIMUM_RESERVE_RATIO, deployer.address],
    { kind: "uups" }
  );
  await vault.waitForDeployment();
  console.log("TokenizedVault deployed to:", await vault.getAddress());

  // Deploy RiskGuardian via UUPS proxy
  console.log("\nDeploying RiskGuardian (UUPS Proxy)...");
  const RiskGuardianFactory = await ethers.getContractFactory("RiskGuardian");
  const riskGuardian = await upgrades.deployProxy(
    RiskGuardianFactory,
    [await vault.getAddress(), deployer.address],
    { kind: "uups" }
  );
  await riskGuardian.waitForDeployment();
  console.log("RiskGuardian deployed to:", await riskGuardian.getAddress());

  // Deploy PredictionMarket via UUPS proxy
  console.log("\nDeploying PredictionMarket (UUPS Proxy)...");
  const PredictionMarketFactory = await ethers.getContractFactory("PredictionMarket");
  const EXTERNAL_NULLIFIER_HASH = ethers.keccak256(ethers.toUtf8Bytes("prediction-market"));
  const GROUP_ID = 1;
  const MINIMUM_STAKE = ethers.parseEther("0.01");
  const PLATFORM_FEE = 200;

  const predictionMarket = await upgrades.deployProxy(
    PredictionMarketFactory,
    [await mockWorldID.getAddress(), EXTERNAL_NULLIFIER_HASH, GROUP_ID, MINIMUM_STAKE, PLATFORM_FEE],
    { kind: "uups" }
  );
  await predictionMarket.waitForDeployment();
  console.log("PredictionMarket deployed to:", await predictionMarket.getAddress());

  // Deploy GovernanceModule via UUPS proxy
  console.log("\nDeploying GovernanceModule (UUPS Proxy)...");
  const GovernanceModuleFactory = await ethers.getContractFactory("GovernanceModule");
  const GOV_EXTERNAL_NULLIFIER = ethers.keccak256(ethers.toUtf8Bytes("governance"));
  const QUORUM_PERCENTAGE = 40;
  const VOTING_PERIOD = 7 * 24 * 60 * 60;
  const EMERGENCY_VOTING_PERIOD = 24 * 60 * 60;

  const governance = await upgrades.deployProxy(
    GovernanceModuleFactory,
    [await mockWorldID.getAddress(), GOV_EXTERNAL_NULLIFIER, GROUP_ID, QUORUM_PERCENTAGE, VOTING_PERIOD, EMERGENCY_VOTING_PERIOD, deployer.address],
    { kind: "uups" }
  );
  await governance.waitForDeployment();
  console.log("GovernanceModule deployed to:", await governance.getAddress());

  // Configure roles
  console.log("\n=== Configuring Roles and Permissions ===");

  const RISK_GUARDIAN_ROLE = await vault.RISK_GUARDIAN_ROLE();
  await vault.grantRole(RISK_GUARDIAN_ROLE, await riskGuardian.getAddress());
  console.log("Granted RISK_GUARDIAN_ROLE to RiskGuardian on TokenizedVault");

  await governance.whitelistTarget(await vault.getAddress());
  console.log("Whitelisted TokenizedVault in GovernanceModule");

  await riskGuardian.setGovernanceContract(await governance.getAddress());
  console.log("Set GovernanceModule on RiskGuardian");

  await predictionMarket.authorizeResolver(deployer.address);
  console.log("Authorized deployer as resolver for PredictionMarket");

  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MockWorldID: await mockWorldID.getAddress(),
      MockERC20: await underlyingAsset.getAddress(),
      TokenizedVault: await vault.getAddress(),
      RiskGuardian: await riskGuardian.getAddress(),
      PredictionMarket: await predictionMarket.getAddress(),
      GovernanceModule: await governance.getAddress()
    }
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
