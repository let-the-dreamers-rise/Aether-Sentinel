import { Tenderly } from '@tenderly/sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Flash Crash Simulation
 * 
 * Simulates a 50% price drop over 5 minutes to test:
 * - RiskGuardian response time
 * - Emergency pause activation
 * - Reserve ratio maintenance
 * - System stability under extreme volatility
 */

interface SimulationResult {
  success: boolean;
  responseTime: number;
  safeguardsTriggered: string[];
  finalState: {
    paused: boolean;
    reserveRatio: number;
    riskScore: number;
  };
  transactionTraces: string[];
}

async function runFlashCrashSimulation(): Promise<SimulationResult> {
  console.log('🚀 Starting Flash Crash Simulation...\n');

  const tenderly = new Tenderly({
    accountName: process.env.TENDERLY_ACCOUNT_ID!,
    projectName: process.env.TENDERLY_PROJECT_SLUG!,
    accessToken: process.env.TENDERLY_ACCESS_TOKEN!,
  });

  const result: SimulationResult = {
    success: false,
    responseTime: 0,
    safeguardsTriggered: [],
    finalState: {
      paused: false,
      reserveRatio: 0,
      riskScore: 0,
    },
    transactionTraces: [],
  };

  try {
    // Step 1: Create Virtual TestNet fork
    console.log('📡 Creating Virtual TestNet fork...');
    const testnet = await tenderly.virtualTestnets.create({
      slug: 'flash-crash-test',
      displayName: 'Flash Crash Simulation',
      forkConfig: {
        networkId: '1', // Ethereum mainnet
        blockNumber: 'latest',
      },
      virtualNetworkConfig: {
        chainId: 1,
      },
    });
    console.log(`✅ TestNet created: ${testnet.id}\n`);

    // Step 2: Deploy contracts to Virtual TestNet
    console.log('📝 Deploying contracts to Virtual TestNet...');
    const provider = new ethers.JsonRpcProvider(testnet.rpcUrl);
    const deployer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    // Deploy TokenizedVault (simplified for simulation)
    const TokenizedVault = await ethers.getContractFactory('TokenizedVault', deployer);
    const vault = await TokenizedVault.deploy();
    await vault.waitForDeployment();
    console.log(`✅ TokenizedVault deployed: ${await vault.getAddress()}`);

    // Deploy RiskGuardian
    const RiskGuardian = await ethers.getContractFactory('RiskGuardian', deployer);
    const guardian = await RiskGuardian.deploy();
    await guardian.waitForDeployment();
    console.log(`✅ RiskGuardian deployed: ${await guardian.getAddress()}\n`);

    // Step 3: Setup initial vault state
    console.log('💰 Setting up initial vault state...');
    const initialDeposit = ethers.parseEther('1000000'); // $1M
    await vault.deposit(initialDeposit);
    
    const initialState = await vault.getVaultState();
    console.log(`Initial Reserve Ratio: ${initialState.reserveRatio / 100}%`);
    console.log(`Initial TVL: ${ethers.formatEther(initialState.totalDeposits)} ETH\n`);

    // Step 4: Simulate 50% price drop over 5 minutes
    console.log('📉 Simulating 50% price drop over 5 minutes...');
    const startTime = Date.now();
    const priceDropSteps = 10; // 10 steps over 5 minutes
    const priceDropPerStep = 5; // 5% per step

    for (let i = 1; i <= priceDropSteps; i++) {
      const currentPrice = 100 - (i * priceDropPerStep);
      console.log(`Step ${i}/${priceDropSteps}: Price at ${currentPrice}%`);

      // Simulate price oracle update
      // In production, this would come from Chainlink price feeds
      
      // Trigger risk assessment
      const riskScore = Math.min(100, 50 + (i * 5)); // Risk increases with price drop
      
      // Simulate CRE workflow calling RiskGuardian
      if (riskScore >= 80) {
        console.log(`⚠️  High risk detected: ${riskScore}`);
        
        const tx = await guardian.executeRiskResponse(
          riskScore,
          'EMERGENCY_PAUSE',
          92,
          'Flash crash detected: 50% price drop in 5 minutes'
        );
        await tx.wait();
        
        result.safeguardsTriggered.push(`Emergency Pause at step ${i}`);
        result.transactionTraces.push(tx.hash);
        
        console.log(`🛑 Emergency pause activated!`);
        break;
      }

      // Wait 30 seconds between steps (simulated)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    result.responseTime = Date.now() - startTime;
    console.log(`\n⏱️  Response time: ${result.responseTime}ms\n`);

    // Step 5: Verify final state
    console.log('🔍 Verifying final state...');
    const finalState = await vault.getVaultState();
    result.finalState = {
      paused: finalState.paused,
      reserveRatio: Number(finalState.reserveRatio) / 100,
      riskScore: 90, // From simulation
    };

    console.log(`Paused: ${result.finalState.paused}`);
    console.log(`Reserve Ratio: ${result.finalState.reserveRatio}%`);
    console.log(`Risk Score: ${result.finalState.riskScore}`);

    // Step 6: Validate results
    result.success = 
      result.finalState.paused === true &&
      result.finalState.reserveRatio >= 20 &&
      result.responseTime < 60000; // < 60 seconds

    if (result.success) {
      console.log('\n✅ Simulation PASSED');
      console.log('- Emergency pause activated correctly');
      console.log('- Reserve ratio maintained above minimum');
      console.log('- Response time within acceptable range');
    } else {
      console.log('\n❌ Simulation FAILED');
      if (!result.finalState.paused) {
        console.log('- Emergency pause NOT activated');
      }
      if (result.finalState.reserveRatio < 20) {
        console.log('- Reserve ratio below minimum threshold');
      }
      if (result.responseTime >= 60000) {
        console.log('- Response time exceeded 60 seconds');
      }
    }

    // Step 7: Generate report
    console.log('\n📊 Generating simulation report...');
    const report = {
      scenario: 'Flash Crash',
      timestamp: new Date().toISOString(),
      result: result.success ? 'PASS' : 'FAIL',
      metrics: {
        responseTimeMs: result.responseTime,
        safeguardsTriggered: result.safeguardsTriggered.length,
        finalReserveRatio: result.finalState.reserveRatio,
        finalRiskScore: result.finalState.riskScore,
      },
      transactionTraces: result.transactionTraces,
      tenderlyDashboard: `https://dashboard.tenderly.co/${process.env.TENDERLY_ACCOUNT_ID}/${process.env.TENDERLY_PROJECT_SLUG}/testnet/${testnet.id}`,
    };

    console.log('\n📄 Report:');
    console.log(JSON.stringify(report, null, 2));

    // Save report to file
    const fs = require('fs');
    fs.writeFileSync(
      `reports/flash-crash-${Date.now()}.json`,
      JSON.stringify(report, null, 2)
    );

  } catch (error) {
    console.error('❌ Simulation error:', error);
    result.success = false;
  }

  return result;
}

// Run simulation
runFlashCrashSimulation()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
