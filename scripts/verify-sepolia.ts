import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=".repeat(60));
  console.log("AETHER SENTINEL - Contract Verification on Sepolia");
  console.log("=".repeat(60));
  console.log();

  // Load deployment addresses
  const deploymentFile = path.join(__dirname, "..", "deployments", "sepolia.json");
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  const contracts = deployment.contracts;

  console.log("Loaded deployment from:", deploymentFile);
  console.log("Network:", deployment.network);
  console.log("Deployer:", deployment.deployer);
  console.log();

  // Verify each contract
  const contractsToVerify = [
    {
      name: "TokenizedVault",
      address: contracts.TokenizedVault,
      constructorArguments: []
    },
    {
      name: "RiskGuardian",
      address: contracts.RiskGuardian,
      constructorArguments: []
    },
    {
      name: "PredictionMarket",
      address: contracts.PredictionMarket,
      constructorArguments: []
    },
    {
      name: "GovernanceModule",
      address: contracts.GovernanceModule,
      constructorArguments: []
    }
  ];

  for (const contract of contractsToVerify) {
    console.log(`📝 Verifying ${contract.name}...`);
    console.log(`   Address: ${contract.address}`);
    
    try {
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArguments,
      });
      console.log(`✅ ${contract.name} verified successfully`);
      console.log(`   View on Etherscan: https://sepolia.etherscan.io/address/${contract.address}#code`);
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ ${contract.name} already verified`);
        console.log(`   View on Etherscan: https://sepolia.etherscan.io/address/${contract.address}#code`);
      } else {
        console.error(`❌ Failed to verify ${contract.name}:`);
        console.error(`   ${error.message}`);
      }
    }
    console.log();
  }

  console.log("=".repeat(60));
  console.log("Verification completed!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });
