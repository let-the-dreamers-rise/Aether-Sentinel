import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Deployment Validation Script
 * 
 * Validates all contract deployments and configurations before mainnet launch
 */

interface ValidationResult {
  contract: string;
  checks: {
    name: string;
    passed: boolean;
    details?: string;
  }[];
}

async function validateDeployment(): Promise<boolean> {
  console.log('🔍 Starting Deployment Validation...\n');

  const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  const results: ValidationResult[] = [];
  let allPassed = true;

  try {
    // Validate TokenizedVault
    console.log('📋 Validating TokenizedVault...');
    const vaultResult: ValidationResult = {
      contract: 'TokenizedVault',
      checks: [],
    };

    const vaultAddress = process.env.TOKENIZED_VAULT_ADDRESS!;
    const vaultCode = await provider.getCode(vaultAddress);
    
    vaultResult.checks.push({
      name: 'Contract deployed',
      passed: vaultCode !== '0x',
      details: vaultAddress,
    });

    // Check roles
    const vault = new ethers.Contract(
      vaultAddress,
      ['function hasRole(bytes32,address) view returns (bool)'],
      provider
    );

    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));
    const hasAdmin = await vault.hasRole(ADMIN_ROLE, process.env.ADMIN_ADDRESS);
    
    vaultResult.checks.push({
      name: 'Admin role assigned',
      passed: hasAdmin,
    });

    results.push(vaultResult);

    // Validate RiskGuardian
    console.log('📋 Validating RiskGuardian...');
    const guardianResult: ValidationResult = {
      contract: 'RiskGuardian',
      checks: [],
    };

    const guardianAddress = process.env.RISK_GUARDIAN_ADDRESS!;
    const guardianCode = await provider.getCode(guardianAddress);
    
    guardianResult.checks.push({
      name: 'Contract deployed',
      passed: guardianCode !== '0x',
      details: guardianAddress,
    });

    results.push(guardianResult);

    // Validate PredictionMarket
    console.log('📋 Validating PredictionMarket...');
    const marketResult: ValidationResult = {
      contract: 'PredictionMarket',
      checks: [],
    };

    const marketAddress = process.env.PREDICTION_MARKET_ADDRESS!;
    const marketCode = await provider.getCode(marketAddress);
    
    marketResult.checks.push({
      name: 'Contract deployed',
      passed: marketCode !== '0x',
      details: marketAddress,
    });

    results.push(marketResult);

    // Validate GovernanceModule
    console.log('📋 Validating GovernanceModule...');
    const govResult: ValidationResult = {
      contract: 'GovernanceModule',
      checks: [],
    };

    const govAddress = process.env.GOVERNANCE_MODULE_ADDRESS!;
    const govCode = await provider.getCode(govAddress);
    
    govResult.checks.push({
      name: 'Contract deployed',
      passed: govCode !== '0x',
      details: govAddress,
    });

    results.push(govResult);

    // Print results
    console.log('\n📊 Validation Results:\n');
    for (const result of results) {
      console.log(`${result.contract}:`);
      for (const check of result.checks) {
        const status = check.passed ? '✅' : '❌';
        console.log(`  ${status} ${check.name}`);
        if (check.details) {
          console.log(`     ${check.details}`);
        }
        if (!check.passed) {
          allPassed = false;
        }
      }
      console.log('');
    }

    if (allPassed) {
      console.log('✅ All validation checks PASSED');
      console.log('🚀 System ready for mainnet deployment');
    } else {
      console.log('❌ Some validation checks FAILED');
      console.log('⚠️  Fix issues before mainnet deployment');
    }

    // Generate validation report
    const report = {
      timestamp: new Date().toISOString(),
      network: 'mainnet',
      overallStatus: allPassed ? 'PASS' : 'FAIL',
      results,
    };

    const fs = require('fs');
    fs.writeFileSync(
      `reports/deployment-validation-${Date.now()}.json`,
      JSON.stringify(report, null, 2)
    );

    return allPassed;

  } catch (error) {
    console.error('❌ Validation error:', error);
    return false;
  }
}

validateDeployment()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
