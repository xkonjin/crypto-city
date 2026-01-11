/**
 * EIP-3009 Utilities
 * 
 * Functions for building and signing EIP-3009 transferWithAuthorization
 * typed data for gasless USDT0 transfers on Plasma.
 */

import type { Address, Hex } from 'viem';
import {
  PLASMA_CHAIN_ID,
  USDT0_ADDRESS,
  USDT0_EIP712_DOMAIN,
  DEFAULT_VALIDITY_PERIOD,
} from './constants';
import type { EIP712TypedData, SplitSignature } from './types';

/**
 * Generate a random 32-byte nonce for EIP-3009 transfers
 */
export function generateNonce(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return ('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')) as Hex;
}

/**
 * Build EIP-712 typed data for transferWithAuthorization
 */
export function buildTransferTypedData(
  from: Address,
  to: Address,
  amount: bigint,
  options?: {
    validAfter?: number;
    validBefore?: number;
    nonce?: Hex;
  }
): EIP712TypedData {
  const now = Math.floor(Date.now() / 1000);
  const validAfter = options?.validAfter ?? now - 1;
  const validBefore = options?.validBefore ?? now + DEFAULT_VALIDITY_PERIOD;
  const nonce = options?.nonce ?? generateNonce();

  return {
    domain: {
      name: USDT0_EIP712_DOMAIN.name,
      version: USDT0_EIP712_DOMAIN.version,
      chainId: PLASMA_CHAIN_ID,
      verifyingContract: USDT0_ADDRESS,
    },
    types: {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization',
    message: {
      from,
      to,
      value: amount.toString(),
      validAfter,
      validBefore,
      nonce,
    },
  };
}

/**
 * Split a signature hex string into v, r, s components
 */
export function splitSignature(signature: Hex): SplitSignature {
  // Remove 0x prefix
  const sig = signature.slice(2);
  
  // Signature is 65 bytes: r (32) + s (32) + v (1)
  const r = ('0x' + sig.slice(0, 64)) as Hex;
  const s = ('0x' + sig.slice(64, 128)) as Hex;
  let v = parseInt(sig.slice(128, 130), 16);
  
  // Handle EIP-155 v values
  if (v < 27) {
    v += 27;
  }
  
  return { v, r, s };
}

/**
 * Convert decimal amount to atomic units (6 decimals for USDT0)
 */
export function toAtomicUnits(amount: number | string): bigint {
  const [integer, decimal = ''] = String(amount).split('.');
  const paddedDecimal = (decimal + '000000').slice(0, 6);
  const combined = `${integer || '0'}${paddedDecimal}`.replace(/^0+(?=\d)/, '');
  return BigInt(combined || '0');
}

/**
 * Convert atomic units to decimal string
 */
export function fromAtomicUnits(amount: bigint): string {
  const str = amount.toString().padStart(7, '0');
  const integer = str.slice(0, -6) || '0';
  const decimal = str.slice(-6).replace(/0+$/, '');
  return decimal ? `${integer}.${decimal}` : integer;
}

/**
 * Format typed data for eth_signTypedData_v4 request
 */
export function formatTypedDataForSigning(typedData: EIP712TypedData): string {
  return JSON.stringify({
    domain: typedData.domain,
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ...typedData.types,
    },
    primaryType: typedData.primaryType,
    message: typedData.message,
  });
}
