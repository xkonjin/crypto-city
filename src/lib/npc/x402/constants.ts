/**
 * X402 NPC Economy Constants
 * 
 * Configuration for the X402 payment protocol integration with NPCs.
 * Uses Plasma testnet for all NPC transactions.
 */

// Plasma Testnet Configuration
export const PLASMA_TESTNET_CHAIN_ID = 9746;
export const PLASMA_TESTNET_RPC_URL = 'https://testnet-rpc.plasma.to';
export const PLASMA_TESTNET_EXPLORER_URL = 'https://testnet.explorer.plasma.to';

// USDT0 on testnet (placeholder - update with actual testnet address)
export const USDT0_TESTNET_ADDRESS = '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb' as const;

// NPC Economy Configuration
export const NPC_WALLET_DERIVATION_PATH = "m/44'/60'/0'/0";
export const NPC_INITIAL_BALANCE = BigInt(1000000); // 1 USDT in atomic units (6 decimals)
export const MAX_NPC_TRANSACTION_PER_DAY = 100;
export const NPC_BALANCE_CACHE_TTL = 60000; // 1 minute

// Service Prices (in atomic units - 6 decimals)
export const NPC_SERVICE_PRICES = {
  drink: BigInt(50000),           // $0.05
  food: BigInt(100000),           // $0.10
  alpha_call: BigInt(250000),     // $0.25
  security_escort: BigInt(500000), // $0.50
  tip_small: BigInt(10000),       // $0.01
  tip_medium: BigInt(50000),      // $0.05
  tip_large: BigInt(100000),      // $0.10
  rent_daily: BigInt(200000),     // $0.20
  entertainment: BigInt(75000),   // $0.075
} as const;

// Salary Ranges (daily, in atomic units)
export const NPC_SALARY_RANGES = {
  trader: { min: BigInt(500000), max: BigInt(2000000) },      // $0.50 - $2.00
  miner: { min: BigInt(400000), max: BigInt(1000000) },       // $0.40 - $1.00
  developer: { min: BigInt(750000), max: BigInt(2000000) },   // $0.75 - $2.00
  shop_owner: { min: BigInt(250000), max: BigInt(1500000) },  // $0.25 - $1.50
  bartender: { min: BigInt(200000), max: BigInt(500000) },    // $0.20 - $0.50
  artist: { min: BigInt(100000), max: BigInt(2000000) },      // $0.10 - $2.00
  security: { min: BigInt(300000), max: BigInt(600000) },     // $0.30 - $0.60
  unemployed: { min: BigInt(0), max: BigInt(50000) },         // $0 - $0.05 (welfare)
} as const;

// X402 Protocol Constants
export const X402_VERSION = '1';
export const X402_FACILITATOR_URL = 'https://x402.org/facilitator';

// Transaction Types
export type NPCTransactionType = 
  | 'salary'
  | 'rent'
  | 'food'
  | 'drink'
  | 'entertainment'
  | 'tip'
  | 'trade'
  | 'service'
  | 'gift'
  | 'tax';

// Service Categories
export type NPCServiceCategory = 
  | 'hospitality'  // bartender, food vendor
  | 'trading'      // trader, alpha calls
  | 'security'     // security escort
  | 'creative'     // artist, NFT creation
  | 'housing'      // landlord, property
  | 'social';      // tips, gifts
