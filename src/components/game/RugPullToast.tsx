'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, AlertTriangle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RugPullEvent, ANIMATION_PHASES } from '@/lib/rugPullEffect';

// =============================================================================
// TYPES
// =============================================================================

export interface RugPullToastProps {
  event: RugPullEvent | null;
  isVisible: boolean;
  onDismiss: () => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTreasuryLoss(amount: number): string {
  if (amount >= 1000000) {
    return `-$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `-$${(amount / 1000).toFixed(1)}K`;
  }
  return `-$${amount.toLocaleString()}`;
}

// =============================================================================
// TOAST CONTENT
// =============================================================================

function RugPullToastContent({ event, isVisible, onDismiss }: RugPullToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible && event) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: animation state must sync with visibility
      setShouldRender(true);
      
      // Trigger entrance animation
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });

      // Auto-dismiss after 5 seconds
      const dismissTimer = setTimeout(() => {
        onDismiss();
      }, ANIMATION_PHASES.toastAutoClose.duration);

      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(dismissTimer);
      };
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, event, onDismiss]);

  if (!shouldRender || !event) {
    return null;
  }

  return (
    <div
      data-testid="rug-pull-toast"
      className={cn(
        'fixed z-[9999] pointer-events-auto',
        'transition-all duration-300 ease-out',
        // Mobile: bottom position
        'bottom-20 left-3 right-3',
        // Desktop: bottom right position
        'md:bottom-24 md:left-auto md:right-4 md:max-w-md',
        isAnimating
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-95'
      )}
    >
      <div className="relative bg-gray-900/95 backdrop-blur-sm border-2 border-red-500/70 rounded-lg shadow-2xl overflow-hidden">
        {/* Top accent - red danger stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

        {/* Danger pulse effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 bg-red-500/10"
            style={{ animation: 'rugFlash 1s ease-in-out infinite' }}
          />
        </div>

        {/* Content */}
        <div className="p-4 flex items-start gap-3">
          {/* Warning Icon */}
          <div className="flex-shrink-0 relative">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-14 h-14 rounded-lg bg-red-500/30 blur-md -z-10" />
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-red-500/30 text-red-400 font-bold tracking-wider">
                RUG PULL
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-0.5">
              💀 {event.buildingName}
            </h3>
            <p className="text-sm text-gray-300">
              has been rugged!
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Treasury Loss Display */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 p-3 bg-red-900/30 rounded-lg border border-red-500/30">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-400">Treasury Loss</p>
              <p className="text-xl font-bold text-red-400">
                {formatTreasuryLoss(event.treasuryLoss)}
              </p>
            </div>
          </div>
        </div>

        {/* Cobie Quote */}
        <div className="px-4 pb-4">
          <div
            data-testid="cobie-comment"
            className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src="/assets/cobie-avatar.svg"
                  alt="Cobie"
                  width={32}
                  height={32}
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  &ldquo;{event.cobieQuip}&rdquo;
                </p>
                <p className="text-xs text-yellow-500 font-medium mt-1">— Cobie</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative corners */}
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-red-500/50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-red-500/50" />
      </div>
    </div>
  );
}

// =============================================================================
// PORTAL WRAPPER
// =============================================================================

export function RugPullToast(props: RugPullToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: client-side portal mounting detection
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <RugPullToastContent {...props} />,
    document.body
  );
}

export default RugPullToast;
