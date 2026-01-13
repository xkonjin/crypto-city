/**
 * Client-side Providers
 * 
 * Wraps all client-side context providers including Plasma wallet.
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { SoundProvider } from '@/context/SoundContext';
import { PlasmaProvider } from '@/components/wallet/PlasmaProvider';
import { initPostHog } from '@/lib/posthog';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <PlasmaProvider>
      <SoundProvider>
        {children}
      </SoundProvider>
    </PlasmaProvider>
  );
}
