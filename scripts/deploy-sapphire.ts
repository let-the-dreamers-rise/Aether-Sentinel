import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("Deploying confidential contracts to Oasis Sapphire...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy World ID mock for testing (replace with actual World ID address on mainnet)
  console.log("\nDeploying World ID mock...");
  const WorldIDMock = await ethers.getContractFactory("contracts/mocks/WorldIDMock.sol:WorldIDMock");
  const worldId = await WorldIDMock.deploy();
  await worldId.waitForDeployment();
  console.log("WorldID mock deployed to:", await worldId.getAddress());

  // Deploy PrivateLiquidationAuction
  console.log("\nDeploying PrivateLiquidationAuction...");
  const PrivateLiquidationAuction = await ethers.getContractFactory("PrivateLiquidationAuction");
  const externalNullifierHash = ethers.keccak256(ethers.toUtf8Bytes("aether-sentinel-auction"));
  
  const auction = await upgrades.deployProxy(
    PrivateLiquidationAuction,
    [await worldId.getAddress(), externalNullifierHash],
    { initializer: "initialize" }
  );
  await auction.waitForDeployment();
  console.log("PrivateLiquidationAuction deployed to:", await auction.getAddress());

  // Deploy ConfidentialRiskThresholds
  console.log("\nDeploying ConfidentialRiskThresholds...");
  const ConfidentialRiskThresholds = await ethers.getContractFactory("ConfidentialRiskThresholds");
  
  const thresholds = await upgrades.deployProxy(
    ConfidentialRiskThresholds,
    [],
    { initializer: "initialize" }
  );
  await thresholds.waitForDeployment();
  console.log("ConfidentialRiskThresholds deployed to:", await thresholds.getAddress());

  // Deploy ConfidentialTreasuryManager
  console.log("\nDeploying ConfidentialTreasuryManager...");
  const ConfidentialTreasuryManager = await ethers.getContractFactory("ConfidentialTreasuryManager");
  
  const treasury = await upgrades.deployProxy(
    ConfidentialTreasuryManager,
    [],
    { initializer: "initialize" }
  );
  await treasury.waitForDeployment();
  console.log("ConfidentialTreasuryManager deployed to:", await treasury.getAddress());

  // Grant roles
  console.log("\nGranting roles...");
  
  const AUCTION_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AUCTION_MANAGER_ROLE"));
  const BRIDGE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_ROLE"));
  const GUARDIAN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GUARDIAN_ROLE"));
  const EVALUATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EVALUATOR_ROLE"));
  const STRATEGY_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("STRATEGY_MANAGER_ROLE"));
  const TREASURY_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TREASURY_OPERATOR_ROLE"));
  const GOVERNANCE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GOVERNANCE_ROLE"));

  await auction.grantRole(AUCTION_MANAGER_ROLE, deployer.address);
  await auction.grantRole(BRIDGE_ROLE, deployer.address);
  console.log("Auction roles granted");

  await thresholds.grantRole(GUARDIAN_ROLE, deployer.address);
  await thresholds.grantRole(EVALUATOR_ROLE, deployer.address);
  console.log("Threshold roles granted");

  await treasury.grantRole(STRATEGY_MANAGER_ROLE, deployer.address);
  await treasury.grantRole(TREASURY_OPERATOR_ROLE, deployer.address);
  await treasury.grantRole(GOVERNANCE_ROLE, deployer.address);
  console.log("Treasury roles granted");

  // Save deployment addresses
  const deploymentInfo = {
    network: "sapphire",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      WorldIDMock: await worldId.getAddress(),
      PrivateLiquidationAuction: await auction.getAddress(),
      ConfidentialRiskThresholds: await thresholds.getAddress(),
      ConfidentialTreasuryManager: await treasury.getAddress()
    }
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\nSave this information for future reference!");

  // Verify deployment
  console.log("\n=== Verifying Deployment ===");
  
  const auctionCount = await auction.auctionCount();
  console.log("Auction count:", auctionCount.toString());
  
  const [lastUpdated, updatedBy] = await thresholds.getThresholdMetadata();
  console.log("Thresholds last updated:", new Date(Number(lastUpdated) * 1000).toISOString());
  console.log("Thresholds updated by:", updatedBy);
  
  const [, , treasuryUpdatedBy, active] = await treasury.getStrategyMetadata();
  console.log("Treasury strategy active:", active);
  console.log("Treasury updated by:", treasuryUpdatedBy);

  console.log("\n✅ All confidential contracts deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
