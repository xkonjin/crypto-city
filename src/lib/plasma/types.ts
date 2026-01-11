/**
 * Plasma Wallet Types
 * 
 * TypeScript definitions for wallet and payment functionality.
 */

import type { Address, Hex } from 'viem';

// Wallet state returned by usePlasmaWallet hook
export interface PlasmaWalletState {
  isConnected: boolean;
  isReady: boolean;
  address: Address | null;
  login: () => void;
  logout: () => Promise<void>;
}

// Balance state returned by useUSDT0Balance hook
export interface USDT0BalanceState {
  balance: bigint | null;
  formatted: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Gasless transfer options
export interface GaslessTransferOptions {
  to: Address;
  amount: bigint;
  validityPeriod?: number; // seconds
}

// Gasless transfer result
export interface GaslessTransferResult {
  success: boolean;
  signature?: Hex;
  typedData?: EIP712TypedData;
  error?: string;
}

// EIP-712 typed data structure
export interface EIP712TypedData {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: Address;
  };
  types: {
    TransferWithAuthorization: Array<{ name: string; type: string }>;
  };
  primaryType: string;
  message: {
    from: Address;
    to: Address;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: Hex;
  };
}

// Split signature components
export interface SplitSignature {
  v: number;
  r: Hex;
  s: Hex;
}

// Store item for in-game purchases
export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number; // in USDT0 (dollars)
  priceAtomic: bigint; // in atomic units (6 decimals)
  icon: string;
  category: 'credits' | 'expansion' | 'cosmetic' | 'subscription';
  owned?: boolean;
}

// Transaction record for history
export interface TransactionRecord {
  id: string;
  type: 'purchase' | 'transfer';
  amount: string;
  item?: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  to?: Address;
}

// Relay API request payload
export interface RelayRequest {
  typedData: EIP712TypedData;
  signature: SplitSignature;
  itemId?: string;
}

// Relay API response
export interface RelayResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}
