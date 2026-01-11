/**
 * Gasless Transfer Hook
 * 
 * Hook for creating signed EIP-3009 transfer authorizations.
 * Returns a function to sign transfers that can be relayed.
 */

'use client';

import { useState, useCallback } from 'react';
import { useWallets } from '@privy-io/react-auth';
import type { Address, Hex } from 'viem';
import { usePlasmaWallet } from './usePlasmaWallet';
import {
  buildTransferTypedData,
  splitSignature,
  formatTypedDataForSigning,
} from '@/lib/plasma/eip3009';
import type { GaslessTransferOptions, GaslessTransferResult } from '@/lib/plasma/types';

interface UseGaslessTransferReturn {
  signTransfer: (options: GaslessTransferOptions) => Promise<GaslessTransferResult>;
  loading: boolean;
  error: string | null;
  ready: boolean;
}

/**
 * Hook for signing gasless transfers
 * 
 * @returns Object with signTransfer function and status
 * 
 * @example
 * ```tsx
 * const { signTransfer, loading, ready } = useGaslessTransfer();
 * 
 * const result = await signTransfer({
 *   to: merchantAddress,
 *   amount: toAtomicUnits(9.99),
 * });
 * 
 * if (result.success) {
 *   // Send result.signature and result.typedData to relay API
 * }
 * ```
 */
export function useGaslessTransfer(): UseGaslessTransferReturn {
  const { address, isConnected } = usePlasmaWallet();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signTransfer = useCallback(
    async (options: GaslessTransferOptions): Promise<GaslessTransferResult> => {
      if (!address || !isConnected) {
        return { success: false, error: 'Wallet not connected' };
      }

      // Find the wallet to sign with
      const wallet = wallets.find(w => w.address.toLowerCase() === address.toLowerCase());
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      setLoading(true);
      setError(null);

      try {
        // Build EIP-712 typed data
        const typedData = buildTransferTypedData(
          address,
          options.to,
          options.amount,
          options.validityPeriod ? { validBefore: Math.floor(Date.now() / 1000) + options.validityPeriod } : undefined
        );

        // Get ethereum provider
        const provider = await wallet.getEthereumProvider();

        // Sign the typed data
        const signature = await provider.request({
          method: 'eth_signTypedData_v4',
          params: [address, formatTypedDataForSigning(typedData)],
        }) as Hex;

        return {
          success: true,
          signature,
          typedData,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Signing failed';
        setError(message);
        
        // Handle user rejection specifically
        if (message.includes('rejected') || message.includes('denied')) {
          return { success: false, error: 'Transaction rejected by user' };
        }
        
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [address, isConnected, wallets]
  );

  return {
    signTransfer,
    loading,
    error,
    ready: isConnected && !!address,
  };
}

export default useGaslessTransfer;
