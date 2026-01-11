/**
 * Client-side Providers
 * 
 * Wraps all client-side context providers including Plasma wallet.
 */

'use client';

import { ReactNode } from 'react';
import { SoundProvider } from '@/context/SoundContext';
import { PlasmaProvider } from '@/components/wallet/PlasmaProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PlasmaProvider>
      <SoundProvider>
        {children}
      </SoundProvider>
    </PlasmaProvider>
  );
}
