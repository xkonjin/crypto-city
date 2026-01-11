'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getMode,
  setMode,
  getTerm,
  getTerms,
  getTooltip,
  subscribe,
  translateMessage,
  hasSeenOnboarding,
  markOnboardingShown,
  isFirstTimePlayer,
  type TerminologyMode,
  type TerminologySet,
  type TermTooltip,
} from '@/lib/terminology';

/**
 * useTerminology Hook (Issue #64)
 * 
 * React hook for accessing and managing the terminology system.
 * Provides reactive updates when terminology mode changes.
 */

export interface UseTerminologyReturn {
  /** Current terminology mode */
  mode: TerminologyMode;
  /** Whether using crypto terminology */
  isCryptoMode: boolean;
  /** Whether using classic terminology */
  isClassicMode: boolean;
  /** Set the terminology mode */
  setMode: (mode: TerminologyMode) => void;
  /** Toggle between crypto and classic mode */
  toggleMode: () => void;
  /** Get a specific term */
  getTerm: (key: keyof TerminologySet) => string;
  /** Get all terms for current mode */
  getTerms: () => TerminologySet;
  /** Get tooltip for a term (crypto mode only) */
  getTooltip: (key: keyof TerminologySet) => TermTooltip | null;
  /** Translate a message (replaces crypto terms in classic mode) */
  translateMessage: (message: string) => string;
  /** Whether the onboarding prompt should be shown */
  shouldShowOnboarding: boolean;
  /** Mark onboarding as complete */
  completeOnboarding: (selectedMode: TerminologyMode) => void;
}

export function useTerminology(): UseTerminologyReturn {
  const [mode, setModeState] = useState<TerminologyMode>(() => getMode());
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  
  // Check for first-time player on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkFirstTime = () => {
      const isFirst = isFirstTimePlayer();
      const hasOnboarding = hasSeenOnboarding();
      setShouldShowOnboarding(isFirst && !hasOnboarding);
    };
    
    // Small delay to ensure localStorage is checked after hydration
    const timer = setTimeout(checkFirstTime, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Subscribe to mode changes
  useEffect(() => {
    const unsubscribe = subscribe((newMode) => {
      setModeState(newMode);
    });
    
    // Also listen for storage events (multi-tab sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cryptocity-terminology-mode' && e.newValue) {
        if (e.newValue === 'crypto' || e.newValue === 'classic') {
          setModeState(e.newValue);
        }
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
  
  const handleSetMode = useCallback((newMode: TerminologyMode) => {
    setMode(newMode);
    setModeState(newMode);
  }, []);
  
  const toggleMode = useCallback(() => {
    const newMode = mode === 'crypto' ? 'classic' : 'crypto';
    handleSetMode(newMode);
  }, [mode, handleSetMode]);
  
  const completeOnboarding = useCallback((selectedMode: TerminologyMode) => {
    markOnboardingShown();
    handleSetMode(selectedMode);
    setShouldShowOnboarding(false);
  }, [handleSetMode]);
  
  return {
    mode,
    isCryptoMode: mode === 'crypto',
    isClassicMode: mode === 'classic',
    setMode: handleSetMode,
    toggleMode,
    getTerm,
    getTerms,
    getTooltip,
    translateMessage,
    shouldShowOnboarding,
    completeOnboarding,
  };
}

export default useTerminology;
