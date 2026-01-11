/**
 * Plasma Chain Constants
 * 
 * Core constants for interacting with the Plasma blockchain.
 */

// Chain configuration
export const PLASMA_CHAIN_ID = 9745;
export const PLASMA_RPC_URL = 'https://rpc.plasma.to';
export const PLASMA_EXPLORER_URL = 'https://explorer.plasma.to';

// USDT0 token configuration
export const USDT0_ADDRESS = '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb' as const;
export const USDT0_DECIMALS = 6;
export const USDT0_SYMBOL = 'USDT0';

// EIP-712 domain for USDT0 (important: contract returns 'USDT0' as name)
export const USDT0_EIP712_DOMAIN = {
  name: 'USDT0',
  version: '1',
} as const;

// Default validity period for transfers (10 minutes)
export const DEFAULT_VALIDITY_PERIOD = 600;

// Plasma chain definition for viem/wagmi
export const plasmaChain = {
  id: PLASMA_CHAIN_ID,
  name: 'Plasma',
  network: 'plasma',
  nativeCurrency: {
    name: 'XPL',
    symbol: 'XPL',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [PLASMA_RPC_URL] },
    public: { http: [PLASMA_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Plasma Explorer', url: PLASMA_EXPLORER_URL },
  },
} as const;

// ERC20 ABI for balance queries
export const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// EIP-3009 transferWithAuthorization ABI
export const TRANSFER_WITH_AUTH_ABI = [
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    name: 'transferWithAuthorization',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
