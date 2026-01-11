/**
 * Plasma Wallet Hook
 * 
 * Main hook for accessing Privy wallet authentication state.
 * Provides login/logout functions and wallet address.
 */

'use client';

import { useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import type { Address } from 'viem';
import type { PlasmaWalletState } from '@/lib/plasma/types';

/**
 * Hook for wallet authentication state and actions
 * 
 * @returns PlasmaWalletState with connection status, address, and auth functions
 * 
 * @example
 * ```tsx
 * const { isConnected, address, login, logout } = usePlasmaWallet();
 * 
 * if (!isConnected) {
 *   return <button onClick={login}>Connect Wallet</button>;
 * }
 * ```
 */
export function usePlasmaWallet(): PlasmaWalletState {
  const { authenticated, ready, login, logout } = usePrivy();
  const { wallets } = useWallets();

  // Find the embedded wallet (or first available wallet)
  const address = useMemo(() => {
    if (!wallets || wallets.length === 0) return null;
    
    // Prefer Privy embedded wallet
    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
    if (embeddedWallet) return embeddedWallet.address as Address;
    
    // Fall back to first connected wallet
    return wallets[0]?.address as Address | null;
  }, [wallets]);

  return {
    isConnected: authenticated && !!address,
    isReady: ready,
    address,
    login,
    logout,
  };
}

export default usePlasmaWallet;
