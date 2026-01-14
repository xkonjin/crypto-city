/**
 * X402 NPC Economy Types
 * 
 * TypeScript definitions for the X402-enabled NPC economy.
 */

import type { Address, Hex } from 'viem';
import type { NPCTransactionType, NPCServiceCategory } from './constants';

/**
 * NPC On-Chain Wallet
 * Represents the real blockchain wallet associated with an NPC
 */
export interface NPCOnChainWallet {
  /** NPC ID this wallet belongs to */
  npcId: string;
  /** Ethereum address derived from HD path */
  address: Address;
  /** Index in HD derivation path */
  derivationIndex: number;
  /** Cached USDT₮ balance (atomic units) */
  balanceCached: bigint;
  /** Last time balance was synced from chain */
  lastSynced: number;
  /** Whether wallet has been funded */
  isFunded: boolean;
}

/**
 * NPC Service Definition
 * A service that an NPC can offer for payment
 */
export interface NPCService {
  /** Unique service identifier */
  serviceId: string;
  /** NPC ID providing this service */
  npcId: string;
  /** Display name */
  name: string;
  /** Description (Hitchhiker's Guide style) */
  description: string;
  /** Price in atomic USDT₮ units (6 decimals) */
  price: bigint;
  /** Service category */
  category: NPCServiceCategory;
  /** Cooldown between uses (milliseconds) */
  cooldownMs?: number;
  /** Maximum uses per day */
  dailyLimit?: number;
}

/**
 * NPC Transaction Record
 * Records all on-chain transactions between NPCs
 */
export interface NPCTransaction {
  /** Unique transaction ID */
  id: string;
  /** Sender NPC ID */
  fromNpcId: string;
  /** Receiver NPC ID */
  toNpcId: string;
  /** Amount in atomic units */
  amount: bigint;
  /** Type of transaction */
  type: NPCTransactionType;
  /** Optional reason/description */
  reason?: string;
  /** Blockchain transaction hash (if submitted) */
  txHash?: Hex;
  /** Transaction status */
  status: 'pending' | 'confirmed' | 'failed';
  /** Timestamp */
  timestamp: number;
  /** Game day when transaction occurred */
  gameDay: number;
}

/**
 * X402 Payment Request
 * Sent in HTTP 402 response body
 */
export interface X402PaymentRequest {
  x402Version: string;
  accepts: X402PaymentOption[];
}

/**
 * X402 Payment Option
 * One of potentially multiple ways to pay
 */
export interface X402PaymentOption {
  /** Network identifier (e.g., 'plasma-testnet') */
  network: string;
  /** Recipient address */
  address: Address;
  /** Asset symbol (e.g., 'USDT0') */
  asset: string;
  /** Amount in atomic units */
  amount: string;
  /** Payment description */
  description: string;
}

/**
 * X402 Payment Proof
 * Sent in X-PAYMENT header to prove payment
 */
export interface X402PaymentProof {
  /** Transaction hash */
  txHash: Hex;
  /** Network it was submitted on */
  network: string;
}

/**
 * NPC Economy State
 * Global state of the NPC economy
 */
export interface NPCEconomyState {
  /** Total USDT₮ in NPC wallets */
  totalCirculating: bigint;
  /** Number of funded NPC wallets */
  fundedWallets: number;
  /** Transactions today */
  dailyTransactions: number;
  /** Total volume today (atomic units) */
  dailyVolume: bigint;
  /** Current game day */
  currentDay: number;
  /** Whether economy is running on-chain */
  isOnChain: boolean;
}

/**
 * Payment Result
 * Result of attempting an NPC-to-NPC payment
 */
export interface PaymentResult {
  success: boolean;
  txHash?: Hex;
  error?: string;
  gasUsed?: bigint;
}

/**
 * NPC Wallet Manager Configuration
 */
export interface NPCWalletManagerConfig {
  /** HD wallet seed (server-side only) */
  seed?: string;
  /** RPC URL for Plasma testnet */
  rpcUrl: string;
  /** Chain ID */
  chainId: number;
  /** USDT0 contract address */
  usdtAddress: Address;
  /** Treasury address for funding */
  treasuryAddress?: Address;
  /** Enable on-chain transactions */
  enableOnChain: boolean;
}

/**
 * Service Request
 * Request from one NPC to use another NPC's service
 */
export interface ServiceRequest {
  /** Requesting NPC ID */
  requesterId: string;
  /** Provider NPC ID */
  providerId: string;
  /** Service being requested */
  serviceId: string;
  /** Payment already made (if any) */
  payment?: X402PaymentProof;
  /** Request timestamp */
  timestamp: number;
}

/**
 * Service Response
 * Response after service is fulfilled
 */
export interface ServiceResponse {
  success: boolean;
  /** Service-specific result data */
  result?: unknown;
  error?: string;
}
