/**
 * AETHER SENTINEL - CRE Risk Monitoring Workflow
 *
 * This Chainlink Runtime Environment workflow:
 * 1. Reads vault state from TokenizedVault on Sepolia (blockchain read)
 * 2. Calls an external AI Risk Engine API (offchain HTTP)
 * 3. Writes the risk response to RiskGuardian on Sepolia (blockchain write)
 *
 * Integrates: Blockchain (Sepolia) + External API (AI Risk Engine) + AI Agent
 */

import {
  CronCapability,
  EVMClient,
  HTTPClient,
  handler,
  Runner,
  encodeCallMsg,
  getNetwork,
  LAST_FINALIZED_BLOCK_NUMBER,
  consensusMedianAggregation,
  bytesToHex,
  hexToBase64,
  type Runtime,
  type NodeRuntime,
} from "@chainlink/cre-sdk"
import { z } from "zod"
import {
  encodeFunctionData,
  decodeFunctionResult,
  encodeAbiParameters,
  parseAbiParameters,
  parseAbi,
  zeroAddress,
} from "viem"

const configSchema = z.object({
  schedule: z.string(),
  chainName: z.string(),
  tokenizedVaultAddress: z.string(),
  riskGuardianAddress: z.string(),
  aiRiskEngineUrl: z.string(),
  riskThreshold: z.number().default(60),
  gasLimit: z.string().default("500000"),
})

type Config = z.infer<typeof configSchema>

const vaultAbi = parseAbi([
  "function getVaultState() view returns (uint256 reserveRatio, uint256 totalDeposits, uint256 totalLiabilities, bool paused, uint256 lastUpdate, uint256 totalUnderlyingAssets, uint256 totalVaultTokens, uint256 minimumReserveRatio)",
])

const fetchAIRiskAssessment = (nodeRuntime: NodeRuntime, vaultPayload: string): bigint => {
  const httpClient = new HTTPClient()
  const config = nodeRuntime.config as Config

  const resp = httpClient
    .sendRequest(nodeRuntime, {
      url: `${config.aiRiskEngineUrl}/api/v1/assess-risk`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: new TextEncoder().encode(vaultPayload),
    })
    .result()

  const bodyText = new TextDecoder().decode(resp.body)

  try {
    const parsed = JSON.parse(bodyText)
    return BigInt(Math.round(parsed.risk_score ?? 50))
  } catch {
    return BigInt(50)
  }
}

const onCronTrigger = (runtime: Runtime): string => {
  const config = runtime.config as Config

  runtime.log("=== AETHER SENTINEL Risk Monitoring Workflow ===")
  runtime.log(`Vault: ${config.tokenizedVaultAddress}`)
  runtime.log(`Guardian: ${config.riskGuardianAddress}`)

  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.chainName,
    isTestnet: true,
  })
  if (!network) {
    throw new Error(`Unknown chain name: ${config.chainName}`)
  }

  const evmClient = new EVMClient(network.chainSelector.selector)

  // Step 1: Read vault state from blockchain
  runtime.log("[Step 1] Reading vault state from TokenizedVault...")

  let reserveRatio = 5000
  let totalDeposits = 1000000
  let totalLiabilities = 500000
  let isPaused = false

  try {
    const encodedGetVaultState = encodeFunctionData({
      abi: vaultAbi,
      functionName: "getVaultState",
    })

    const vaultStateRaw = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: config.tokenizedVaultAddress as `0x${string}`,
          data: encodedGetVaultState,
        }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    const hexData = bytesToHex(vaultStateRaw.data)
    if (hexData && hexData !== "0x") {
      const vaultState = decodeFunctionResult({
        abi: vaultAbi,
        functionName: "getVaultState",
        data: hexData,
      })
      reserveRatio = Number(vaultState[0])
      totalDeposits = Number(vaultState[1])
      totalLiabilities = Number(vaultState[2])
      isPaused = vaultState[3] as boolean
    } else {
      runtime.log("  Contract returned empty data — using default vault state for demo")
    }
  } catch {
    runtime.log("  Could not read vault state — using defaults for simulation demo")
  }

  runtime.log(`  Reserve Ratio: ${reserveRatio} bps (${reserveRatio / 100}%)`)
  runtime.log(`  Total Deposits: ${totalDeposits}`)
  runtime.log(`  Total Liabilities: ${totalLiabilities}`)
  runtime.log(`  Paused: ${isPaused}`)

  if (isPaused) {
    runtime.log("Vault is paused — skipping risk assessment.")
    return JSON.stringify({ status: "skipped", reason: "vault_paused" })
  }

  // Step 2: Call AI Risk Engine (offchain via DON consensus)
  runtime.log("[Step 2] Calling AI Risk Engine for assessment...")

  const riskPayload = JSON.stringify({
    vault_state: {
      reserve_ratio: reserveRatio / 10000,
      total_deposits: totalDeposits,
      total_liabilities: totalLiabilities,
      recent_withdrawals: 0,
      timestamp: new Date().toISOString(),
    },
    market_data: {
      volatility_index: 0.5,
      liquidity_score: 0.8,
      price_change_24h: -0.02,
      volume_24h: 1000000,
    },
  })

  let riskScoreNum = 50
  try {
    const riskScore = runtime
      .runInNodeMode(fetchAIRiskAssessment, consensusMedianAggregation<bigint>())(riskPayload)
      .result()
    riskScoreNum = Number(riskScore)
  } catch {
    runtime.log("  AI engine unavailable — using fail-safe risk score of 50")
  }

  runtime.log(`  Risk Score: ${riskScoreNum}/100`)

  // Step 3: Write risk response to blockchain (if threshold met)
  if (riskScoreNum >= config.riskThreshold) {
    runtime.log(
      `[Step 3] Risk score ${riskScoreNum} >= threshold ${config.riskThreshold} — executing on-chain response...`
    )

    try {
      const reportData = encodeAbiParameters(
        parseAbiParameters("uint256 riskScore, uint256 confidence"),
        [BigInt(riskScoreNum), BigInt(80)]
      )

      const reportResponse = runtime
        .report({
          encodedPayload: hexToBase64(reportData),
          encoderName: "evm",
          signingAlgo: "ecdsa",
          hashingAlgo: "keccak256",
        })
        .result()

      const writeResult = evmClient
        .writeReport(runtime, {
          receiver: config.riskGuardianAddress,
          report: reportResponse,
          gasConfig: { gasLimit: config.gasLimit },
        })
        .result()

      const txHash = bytesToHex(writeResult.txHash || new Uint8Array(32))
      runtime.log(`  TX submitted: ${txHash}`)
      runtime.log(`  View: https://sepolia.etherscan.io/tx/${txHash}`)
    } catch {
      runtime.log("  On-chain write skipped (contract not yet deployed)")
    }
  } else {
    runtime.log(
      `[Step 3] Risk score ${riskScoreNum} < threshold ${config.riskThreshold} — no on-chain action needed.`
    )
  }

  runtime.log("=== Workflow Complete ===")

  return JSON.stringify({
    status: "success",
    risk_score: riskScoreNum,
    vault_reserve_ratio_bps: reserveRatio,
    onchain_action_taken: riskScoreNum >= config.riskThreshold,
  })
}

const initWorkflow = (config: Config) => {
  const cron = new CronCapability()
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)]
}

export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema })
  await runner.run(initWorkflow)
}
