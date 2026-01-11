/**
 * USDT0 Balance Hook
 * 
 * Hook for querying and displaying USDT0 balance on Plasma.
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { createPublicClient, http, formatUnits } from 'viem';
import { usePlasmaWallet } from './usePlasmaWallet';
import {
  PLASMA_RPC_URL,
  USDT0_ADDRESS,
  USDT0_DECIMALS,
  ERC20_BALANCE_ABI,
  plasmaChain,
} from '@/lib/plasma/constants';
import type { USDT0BalanceState } from '@/lib/plasma/types';

// Create a public client for reading from Plasma
const publicClient = createPublicClient({
  chain: plasmaChain,
  transport: http(PLASMA_RPC_URL),
});

/**
 * Hook for USDT0 balance with auto-refresh
 * 
 * @returns Balance state with formatted value and refresh function
 * 
 * @example
 * ```tsx
 * const { formatted, loading, refresh } = useUSDT0Balance();
 * return <span>${formatted} USDT0</span>;
 * ```
 */
export function useUSDT0Balance(): USDT0BalanceState {
  const { address, isConnected } = usePlasmaWallet();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await publicClient.readContract({
        address: USDT0_ADDRESS,
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      setBalance(result as bigint);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(message);
      console.error('Balance fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Format balance for display
  const formatted = useMemo(() => {
    if (balance === null) return null;
    return formatUnits(balance, USDT0_DECIMALS);
  }, [balance]);

  // Auto-refresh on wallet connection
  useEffect(() => {
    if (isConnected && address) {
      refresh();
    } else {
      setBalance(null);
    }
  }, [isConnected, address, refresh]);

  return {
    balance,
    formatted,
    loading,
    error,
    refresh,
  };
}

export default useUSDT0Balance;
