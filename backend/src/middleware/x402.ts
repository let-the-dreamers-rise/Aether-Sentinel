// x402 Payment Protocol Middleware for Aether Sentinel
// Wraps premium endpoints with crypto micropayments on Base Sepolia
// 
// This uses dynamic imports to handle the ESM x402 packages
// in a CommonJS TypeScript project running under tsx

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
const RECEIVER_ADDRESS = process.env.X402_RECEIVER_ADDRESS || '0x9A1ea0029144cd0804A98f3726Ad1E787cAB885f';
const NETWORK = process.env.X402_NETWORK || 'eip155:84532'; // Base Sepolia

// Payment configuration for premium endpoints
export const x402Config = {
    facilitatorUrl: FACILITATOR_URL,
    receiverAddress: RECEIVER_ADDRESS,
    network: NETWORK,
    routes: {
        premiumRisk: {
            price: '$0.001',
            description: 'Premium AI Risk Assessment — deep analysis with scenario modeling and mitigation strategies',
        },
        premiumHistory: {
            price: '$0.0005',
            description: 'Premium risk history with trend analysis and predictive insights',
        },
    },
};

// Initialize x402 middleware with dynamic imports
let x402PaymentMiddleware: any = null;
let x402Initialized = false;

export async function initializeX402(): Promise<boolean> {
    try {
        // @ts-ignore — x402 packages use ESM exports, tsx handles the interop at runtime
        const { paymentMiddleware, x402ResourceServer } = await import('@x402/express');
        // @ts-ignore
        const { ExactEvmScheme } = await import('@x402/evm/exact/server');
        // @ts-ignore
        const { HTTPFacilitatorClient } = await import('@x402/core/server');

        const facilitatorClient = new HTTPFacilitatorClient({
            url: FACILITATOR_URL,
        });

        const resourceServer = new x402ResourceServer(facilitatorClient);
        resourceServer.register(NETWORK, new ExactEvmScheme());

        x402PaymentMiddleware = paymentMiddleware(
            {
                'POST /api/risk-assessment/premium': {
                    accepts: [
                        {
                            scheme: 'exact' as const,
                            price: x402Config.routes.premiumRisk.price,
                            network: NETWORK,
                            payTo: RECEIVER_ADDRESS,
                        },
                    ],
                    description: x402Config.routes.premiumRisk.description,
                    mimeType: 'application/json',
                },
                'GET /api/risk-assessment/premium/history': {
                    accepts: [
                        {
                            scheme: 'exact' as const,
                            price: x402Config.routes.premiumHistory.price,
                            network: NETWORK,
                            payTo: RECEIVER_ADDRESS,
                        },
                    ],
                    description: x402Config.routes.premiumHistory.description,
                    mimeType: 'application/json',
                },
            },
            resourceServer,
        );

        x402Initialized = true;
        logger.info(`✅ x402 payment middleware initialized — Network: ${NETWORK}, Receiver: ${RECEIVER_ADDRESS}`);
        return true;
    } catch (error) {
        logger.warn('⚠️ x402 packages not available — premium endpoints will work without payment gates');
        logger.warn(`   Install with: npm install @x402/express @x402/core @x402/evm`);
        return false;
    }
}

// Middleware function — applies x402 if initialized, passthrough otherwise
export function x402Gate(req: Request, res: Response, next: NextFunction) {
    if (x402PaymentMiddleware && x402Initialized) {
        return x402PaymentMiddleware(req, res, next);
    }
    // If x402 not available, pass through (free access)
    next();
}

// Route to check x402 payment configuration
export function getX402Status(_req: Request, res: Response) {
    res.json({
        x402Enabled: x402Initialized,
        network: NETWORK,
        facilitator: FACILITATOR_URL,
        receiver: RECEIVER_ADDRESS,
        endpoints: [
            {
                route: 'POST /api/risk-assessment/premium',
                price: x402Config.routes.premiumRisk.price,
                description: x402Config.routes.premiumRisk.description,
            },
            {
                route: 'GET /api/risk-assessment/premium/history',
                price: x402Config.routes.premiumHistory.price,
                description: x402Config.routes.premiumHistory.description,
            },
        ],
    });
}
