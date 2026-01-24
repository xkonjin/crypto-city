/**
 * Plasma Wallet Provider
 * 
 * Wraps the app with Privy authentication configured for Plasma chain.
 * Handles hydration and missing configuration gracefully.
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { PLASMA_CHAIN_ID, PLASMA_RPC_URL } from '@/lib/plasma/constants';

interface PlasmaProviderProps {
  children: ReactNode;
}

// Plasma brand accent color
const PLASMA_ACCENT_COLOR: `#${string}` = '#00D4FF';

/**
 * Loading spinner shown during hydration
 */
function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function PlasmaProvider({ children }: PlasmaProviderProps) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // During SSR or before hydration, render children without Privy
  // This prevents hydration mismatches
  if (!isMounted) {
    return <>{children}</>;
  }

  // If Privy is not configured, render children without wallet features
  if (!privyAppId) {
    console.warn('NEXT_PUBLIC_PRIVY_APP_ID not set - wallet features disabled');
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['email', 'google', 'apple', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: PLASMA_ACCENT_COLOR,
          walletList: [
            'metamask',
            'rabby_wallet',
            'coinbase_wallet',
            'wallet_connect',
            'rainbow',
            'detected_wallets',
          ],
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: {
          id: PLASMA_CHAIN_ID,
          name: 'Plasma',
          network: 'plasma',
          rpcUrls: {
            default: { http: [PLASMA_RPC_URL] },
          },
          nativeCurrency: {
            name: 'XPL',
            symbol: 'XPL',
            decimals: 18,
          },
        },
        supportedChains: [
          {
            id: PLASMA_CHAIN_ID,
            name: 'Plasma',
            network: 'plasma',
            rpcUrls: {
              default: { http: [PLASMA_RPC_URL] },
            },
            nativeCurrency: {
              name: 'XPL',
              symbol: 'XPL',
              decimals: 18,
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}

export default PlasmaProvider;
