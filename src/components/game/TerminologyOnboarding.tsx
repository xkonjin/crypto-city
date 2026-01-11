'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTerminology } from '@/hooks/useTerminology';
import type { TerminologyMode } from '@/lib/terminology';

/**
 * TerminologyOnboarding Component (Issue #64)
 * 
 * Shows a dialog for first-time players to choose their terminology preference.
 * Asks if they're familiar with crypto terminology.
 */

export interface TerminologyOnboardingProps {
  /** Optional callback when onboarding completes */
  onComplete?: (mode: TerminologyMode) => void;
}

export function TerminologyOnboarding({ onComplete }: TerminologyOnboardingProps) {
  const { shouldShowOnboarding, completeOnboarding } = useTerminology();
  
  const handleChoice = (mode: TerminologyMode) => {
    completeOnboarding(mode);
    onComplete?.(mode);
  };
  
  if (!shouldShowOnboarding) {
    return null;
  }
  
  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Crypto City! 🏙️</DialogTitle>
          <DialogDescription className="pt-2 text-base">
            Before we start building, a quick question...
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-foreground font-medium text-center">
            Are you familiar with crypto terminology?
          </p>
          
          <p className="text-sm text-muted-foreground text-center">
            Terms like &quot;DeFi&quot;, &quot;Rug Pull&quot;, &quot;TVL&quot;, &quot;Yield&quot;, etc.
          </p>
          
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              variant="default" 
              className="w-full h-12"
              onClick={() => handleChoice('crypto')}
            >
              <span className="flex items-center gap-2">
                <span>🚀</span>
                <span>Yes, I know crypto!</span>
              </span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-12"
              onClick={() => handleChoice('classic')}
            >
              <span className="flex items-center gap-2">
                <span>🏠</span>
                <span>New to crypto</span>
              </span>
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center pt-2">
            Don&apos;t worry - you can change this anytime in Settings!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TerminologyOnboarding;
