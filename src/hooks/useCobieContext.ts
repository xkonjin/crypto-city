'use client';

/**
 * useCobieContext Hook - Issue #174
 * 
 * Provides access to the CobieContext for the Floating Cobie Head system.
 * Throws an error if used outside of CobieProvider.
 */

import { useContext } from 'react';
import { CobieContext, type CobieContextValue } from '@/context/CobieContext';

/**
 * Hook to access the Cobie context
 * @throws Error if used outside of CobieProvider
 */
export function useCobieContext(): CobieContextValue {
  const context = useContext(CobieContext);
  
  if (context === null) {
    throw new Error(
      'useCobieContext must be used within a CobieProvider. ' +
      'Wrap your component tree with <CobieProvider>.'
    );
  }
  
  return context;
}

/**
 * Hook to optionally access the Cobie context
 * Returns null if used outside of CobieProvider (doesn't throw)
 */
export function useCobieContextOptional(): CobieContextValue | null {
  return useContext(CobieContext);
}
