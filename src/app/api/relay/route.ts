/**
 * Relay API Endpoint
 * 
 * Server-side endpoint to relay signed EIP-3009 transactions on-chain.
 * This allows gasless transfers by submitting the user's signed authorization.
 */

import { NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount as credentialToAccount } from 'viem/accounts';
import {
  PLASMA_RPC_URL,
  PLASMA_CHAIN_ID,
  USDT0_ADDRESS,
  plasmaChain,
  TRANSFER_WITH_AUTH_ABI,
} from '@/lib/plasma/constants';
import type { EIP712TypedData, SplitSignature, RelayResponse } from '@/lib/plasma/types';

// Rate limiting map (address -> last request timestamp)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

// Request counter per window
const requestCountMap = new Map<string, number>();

interface RelayRequestBody {
  typedData: EIP712TypedData;
  signature: SplitSignature;
  itemId?: string;
}

/**
 * Check rate limit for an address
 */
function checkRateLimit(address: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(address) || 0;
  const requestCount = requestCountMap.get(address) || 0;

  // Reset if window has passed
  if (now - lastRequest > RATE_LIMIT_WINDOW_MS) {
    requestCountMap.set(address, 1);
    rateLimitMap.set(address, now);
    return { allowed: true };
  }

  // Check if under limit
  if (requestCount < MAX_REQUESTS_PER_WINDOW) {
    requestCountMap.set(address, requestCount + 1);
    return { allowed: true };
  }

  // Rate limited
  const retryAfter = Math.ceil((lastRequest + RATE_LIMIT_WINDOW_MS - now) / 1000);
  return { allowed: false, retryAfter };
}

/**
 * Validate the relay request
 */
function validateRequest(body: RelayRequestBody): { valid: boolean; error?: string } {
  if (!body.typedData || !body.signature) {
    return { valid: false, error: 'Missing typedData or signature' };
  }

  const { message, domain } = body.typedData;
  
  // Validate domain
  if (domain.chainId !== PLASMA_CHAIN_ID) {
    return { valid: false, error: `Invalid chain ID: expected ${PLASMA_CHAIN_ID}` };
  }

  if (domain.verifyingContract.toLowerCase() !== USDT0_ADDRESS.toLowerCase()) {
    return { valid: false, error: 'Invalid token contract' };
  }

  // Validate message fields
  if (!message.from || !message.to || !message.value) {
    return { valid: false, error: 'Missing required message fields' };
  }

  // Validate amount (max $1000 per transaction for safety)
  const maxAmount = BigInt(1000_000_000); // $1000 in atomic units (6 decimals)
  if (BigInt(message.value) > maxAmount) {
    return { valid: false, error: 'Amount exceeds maximum allowed ($1000)' };
  }

  // Validate validity window
  const now = Math.floor(Date.now() / 1000);
  if (message.validBefore < now) {
    return { valid: false, error: 'Authorization has expired' };
  }

  if (message.validAfter > now) {
    return { valid: false, error: 'Authorization not yet valid' };
  }

  // Validate signature components
  if (!body.signature.v || !body.signature.r || !body.signature.s) {
    return { valid: false, error: 'Invalid signature format' };
  }

  return { valid: true };
}

export async function POST(request: Request): Promise<NextResponse<RelayResponse>> {
  try {
    // Parse request body
    const body: RelayRequestBody = await request.json();

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { typedData, signature } = body;
    const { message } = typedData;

    // Check rate limit
    const rateLimit = checkRateLimit(message.from);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limited. Retry after ${rateLimit.retryAfter}s` },
        { status: 429 }
      );
    }

    // Get relayer wallet credentials from environment
    const relayerCredential = process.env.PLASMA_RELAYER_CREDENTIAL;
    if (!relayerCredential) {
      console.error('PLASMA_RELAYER_CREDENTIAL not configured');
      return NextResponse.json(
        { success: false, error: 'Relay service not configured' },
        { status: 503 }
      );
    }

    // Create wallet client for relayer
    const account = credentialToAccount(relayerCredential as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: plasmaChain,
      transport: http(PLASMA_RPC_URL),
    });

    // Create public client for waiting on receipt
    const publicClient = createPublicClient({
      chain: plasmaChain,
      transport: http(PLASMA_RPC_URL),
    });

    // Encode the transferWithAuthorization call
    const data = encodeFunctionData({
      abi: TRANSFER_WITH_AUTH_ABI,
      functionName: 'transferWithAuthorization',
      args: [
        message.from as `0x${string}`,
        message.to as `0x${string}`,
        BigInt(message.value),
        BigInt(message.validAfter),
        BigInt(message.validBefore),
        message.nonce as `0x${string}`,
        signature.v,
        signature.r as `0x${string}`,
        signature.s as `0x${string}`,
      ],
    });

    // Send transaction
    const txHash = await walletClient.sendTransaction({
      to: USDT0_ADDRESS,
      data,
    });

    console.log(`Relay transaction sent: ${txHash}`);

    // Wait for receipt (optional, can return immediately)
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 30_000,
      });

      if (receipt.status === 'success') {
        return NextResponse.json({
          success: true,
          txHash,
        });
      } else {
        return NextResponse.json({
          success: false,
          txHash,
          error: 'Transaction reverted',
        });
      }
    } catch (receiptError) {
      // Transaction sent but receipt wait timed out - still consider it potentially successful
      return NextResponse.json({
        success: true,
        txHash,
      });
    }
  } catch (error) {
    console.error('Relay error:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle specific errors
    if (message.includes('insufficient funds')) {
      return NextResponse.json(
        { success: false, error: 'Relayer has insufficient funds for gas' },
        { status: 503 }
      );
    }

    if (message.includes('nonce')) {
      return NextResponse.json(
        { success: false, error: 'Authorization already used' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Transaction failed' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  const hasRelayer = !!process.env.PLASMA_RELAYER_CREDENTIAL;
  
  return NextResponse.json({
    status: hasRelayer ? 'ready' : 'not_configured',
    chainId: PLASMA_CHAIN_ID,
    token: 'USDT0',
  });
}
