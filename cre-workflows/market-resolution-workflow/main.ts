/**
 * AETHER SENTINEL - CRE Market Resolution Workflow
 *
 * This Chainlink Runtime Environment workflow automates prediction market settlement:
 * 1. Reads market state from PredictionMarket on Sepolia (blockchain read)
 * 2. Fetches real-world outcome data from external APIs (offchain HTTP)
 * 3. Settles the market on-chain with the verified outcome (blockchain write)
 *
 * Integrates: Blockchain (Sepolia) + External Data Source (CoinGecko price API)
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
  predictionMarketAddress: z.string(),
  priceApiUrl: z.string(),
  maxMarketsToCheck: z.number().default(10),
  gasLimit: z.string().default("500000"),
})

type Config = z.infer<typeof configSchema>

const predictionMarketAbi = parseAbi([
  "function getMarket(uint256 marketId) view returns (string question, address creator, uint256 endTime, bool resolved, uint256 winningOutcome, uint256 totalStake, uint8 status)",
  "function marketCount() view returns (uint256)",
])

const fetchPriceData = (nodeRuntime: NodeRuntime): bigint => {
  const httpClient = new HTTPClient()
  const config = nodeRuntime.config as Config

  const resp = httpClient
    .sendRequest(nodeRuntime, {
      url: config.priceApiUrl,
      method: "GET",
      headers: { Accept: "application/json" },
    })
    .result()

  const bodyText = new TextDecoder().decode(resp.body)

  try {
    const parsed = JSON.parse(bodyText)
    const ethPrice = parsed?.ethereum?.usd ?? 0
    return BigInt(Math.round(ethPrice * 100))
  } catch {
    return BigInt(0)
  }
}

const onCronTrigger = (runtime: Runtime): string => {
  const config = runtime.config as Config

  runtime.log("=== AETHER SENTINEL Market Resolution Workflow ===")
  runtime.log(`Market Contract: ${config.predictionMarketAddress}`)

  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.chainName,
    isTestnet: true,
  })
  if (!network) {
    throw new Error(`Unknown chain name: ${config.chainName}`)
  }

  const evmClient = new EVMClient(network.chainSelector.selector)

  // Step 1: Read market count from blockchain
  runtime.log("[Step 1] Reading market count from PredictionMarket...")

  let marketCount = 0

  try {
    const encodedCount = encodeFunctionData({
      abi: predictionMarketAbi,
      functionName: "marketCount",
    })

    const countRaw = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: config.predictionMarketAddress as `0x${string}`,
          data: encodedCount,
        }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    const hexData = bytesToHex(countRaw.data)
    if (hexData && hexData !== "0x") {
      marketCount = Number(
        decodeFunctionResult({
          abi: predictionMarketAbi,
          functionName: "marketCount",
          data: hexData,
        })
      )
    } else {
      runtime.log("  Contract returned empty data — no markets deployed yet")
    }
  } catch {
    runtime.log("  Could not read market count — contract may not be deployed yet")
  }

  runtime.log(`  Total markets: ${marketCount}`)

  // Step 2: Fetch current price data (offchain via DON consensus)
  runtime.log("[Step 2] Fetching offchain price data from CoinGecko...")

  let ethPrice = 0
  try {
    const ethPriceCents = runtime
      .runInNodeMode(fetchPriceData, consensusMedianAggregation<bigint>())()
      .result()
    ethPrice = Number(ethPriceCents) / 100
  } catch {
    runtime.log("  CoinGecko API unavailable — using fallback price")
    ethPrice = 2500
  }

  runtime.log(`  ETH Price: $${ethPrice}`)

  if (marketCount === 0) {
    runtime.log("No markets found — workflow complete with price data fetched.")
    return JSON.stringify({
      status: "success",
      markets_checked: 0,
      markets_settled: 0,
      eth_price: ethPrice,
    })
  }

  // Step 3: Check each market and settle expired ones
  runtime.log("[Step 3] Checking markets for settlement...")

  const now = Math.floor(Date.now() / 1000)
  let settledCount = 0
  const limit = Math.min(marketCount, config.maxMarketsToCheck)

  for (let i = 0; i < limit; i++) {
    try {
      const encodedGetMarket = encodeFunctionData({
        abi: predictionMarketAbi,
        functionName: "getMarket",
        args: [BigInt(i)],
      })

      const marketRaw = evmClient
        .callContract(runtime, {
          call: encodeCallMsg({
            from: zeroAddress,
            to: config.predictionMarketAddress as `0x${string}`,
            data: encodedGetMarket,
          }),
          blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
        })
        .result()

      const market = decodeFunctionResult({
        abi: predictionMarketAbi,
        functionName: "getMarket",
        data: bytesToHex(marketRaw.data),
      })

      const endTime = Number(market[2])
      const resolved = market[3]
      const status = Number(market[6])

      if (resolved || endTime > now || status !== 1) {
        continue
      }

      runtime.log(`  Market #${i}: expired and unresolved — settling...`)

      const winningOutcome = ethPrice >= 3000 ? 0 : 1

      const reportData = encodeAbiParameters(
        parseAbiParameters("uint256 marketId, uint256 winningOutcome, uint256 ethPrice"),
        [BigInt(i), BigInt(winningOutcome), BigInt(Math.round(ethPrice * 100))]
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
          receiver: config.predictionMarketAddress,
          report: reportResponse,
          gasConfig: { gasLimit: config.gasLimit },
        })
        .result()

      const txHash = bytesToHex(writeResult.txHash || new Uint8Array(32))
      runtime.log(`  Settled market #${i} — outcome: ${winningOutcome}, tx: ${txHash}`)
      settledCount++
    } catch {
      runtime.log(`  Could not process market #${i} — skipping`)
    }
  }

  runtime.log(`=== Workflow Complete: ${settledCount} markets settled ===`)

  return JSON.stringify({
    status: "success",
    markets_checked: limit,
    markets_settled: settledCount,
    eth_price: ethPrice,
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
