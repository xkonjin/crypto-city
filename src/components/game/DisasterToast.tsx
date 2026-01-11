'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, AlertTriangle, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveDisaster, Disaster } from '@/lib/disasters';

// =============================================================================
// TYPES
// =============================================================================

export interface DisasterToastProps {
  disaster: ActiveDisaster | null;
  isVisible: boolean;
  onDismiss: () => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDuration(startTick: number, endTick: number, ticksPerDay: number = 288): string {
  const daysRemaining = Math.ceil((endTick - startTick) / ticksPerDay);
  if (daysRemaining <= 0) return 'Ending soon';
  if (daysRemaining === 1) return '1 day';
  return `${daysRemaining} days`;
}

function getSeverityColor(severity: string, isPositive: boolean): {
  border: string;
  bg: string;
  accent: string;
  text: string;
} {
  if (isPositive) {
    return {
      border: 'border-green-500/70',
      bg: 'bg-green-500/10',
      accent: 'from-green-600 via-emerald-500 to-green-600',
      text: 'text-green-400',
    };
  }
  
  switch (severity) {
    case 'catastrophic':
      return {
        border: 'border-red-600/80',
        bg: 'bg-red-500/15',
        accent: 'from-red-700 via-red-500 to-red-700',
        text: 'text-red-400',
      };
    case 'major':
      return {
        border: 'border-orange-500/70',
        bg: 'bg-orange-500/10',
        accent: 'from-orange-600 via-amber-500 to-orange-600',
        text: 'text-orange-400',
      };
    case 'minor':
    default:
      return {
        border: 'border-yellow-500/60',
        bg: 'bg-yellow-500/10',
        accent: 'from-yellow-600 via-yellow-400 to-yellow-600',
        text: 'text-yellow-400',
      };
  }
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case 'catastrophic':
      return 'CATASTROPHIC';
    case 'major':
      return 'MAJOR';
    case 'minor':
    default:
      return 'MINOR';
  }
}

// =============================================================================
// TOAST CONTENT
// =============================================================================

function DisasterToastContent({ disaster, isVisible, onDismiss }: DisasterToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible && disaster) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: animation state must sync with visibility
      setShouldRender(true);
      
      // Trigger entrance animation
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });

      // Auto-dismiss after 8 seconds (longer than rug pull toast for more info)
      const dismissTimer = setTimeout(() => {
        onDismiss();
      }, 8000);

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
  }, [isVisible, disaster, onDismiss]);

  if (!shouldRender || !disaster) {
    return null;
  }

  const disasterDef = disaster.disaster;
  const isPositive = disasterDef.isPositive || false;
  const colors = getSeverityColor(disasterDef.severity, isPositive);

  return (
    <div
      data-testid="disaster-toast"
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
      <div className={cn(
        'relative bg-gray-900/95 backdrop-blur-sm border-2 rounded-lg shadow-2xl overflow-hidden',
        colors.border
      )}>
        {/* Top accent stripe */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
          colors.accent
        )} />

        {/* Pulse effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={cn('absolute inset-0', colors.bg)}
            style={{ animation: 'disasterFlash 1.5s ease-in-out infinite' }}
          />
        </div>

        {/* Content */}
        <div className="p-4 flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 relative">
            <div className={cn(
              'w-14 h-14 rounded-lg flex items-center justify-center shadow-lg text-3xl',
              isPositive
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : disasterDef.severity === 'catastrophic'
                  ? 'bg-gradient-to-br from-red-500 to-red-700'
                  : disasterDef.severity === 'major'
                    ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                    : 'bg-gradient-to-br from-yellow-500 to-amber-500'
            )}>
              {disasterDef.icon}
            </div>
            {/* Glow effect */}
            <div className={cn(
              'absolute inset-0 w-14 h-14 rounded-lg blur-md -z-10',
              isPositive ? 'bg-green-500/30' : 'bg-orange-500/30'
            )} />
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded font-bold tracking-wider',
                isPositive
                  ? 'bg-green-500/30 text-green-400'
                  : disasterDef.severity === 'catastrophic'
                    ? 'bg-red-500/30 text-red-400'
                    : disasterDef.severity === 'major'
                      ? 'bg-orange-500/30 text-orange-400'
                      : 'bg-yellow-500/30 text-yellow-400'
              )}>
                {isPositive ? 'POSITIVE EVENT' : getSeverityLabel(disasterDef.severity)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-0.5">
              {disasterDef.name}
            </h3>
            <p className="text-sm text-gray-300">
              {disasterDef.description}
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

        {/* Effects Display */}
        <div className="px-4 pb-3">
          <div className={cn(
            'flex flex-wrap gap-2 p-3 rounded-lg border',
            isPositive ? 'bg-green-900/30 border-green-500/30' : 'bg-gray-800/50 border-gray-700/50'
          )}>
            {/* Yield effect */}
            {disasterDef.effect.yieldMultiplier !== undefined && (
              <div className="flex items-center gap-1.5">
                {disasterDef.effect.yieldMultiplier >= 1 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={cn(
                  'text-sm font-medium',
                  disasterDef.effect.yieldMultiplier >= 1 ? 'text-green-400' : 'text-red-400'
                )}>
                  Yields {disasterDef.effect.yieldMultiplier >= 1 ? '+' : ''}
                  {Math.round((disasterDef.effect.yieldMultiplier - 1) * 100)}%
                </span>
              </div>
            )}
            
            {/* Sentiment effect */}
            {disasterDef.effect.sentimentImpact !== undefined && (
              <div className="flex items-center gap-1.5">
                <Zap className={cn(
                  'w-4 h-4',
                  disasterDef.effect.sentimentImpact >= 0 ? 'text-green-400' : 'text-yellow-400'
                )} />
                <span className={cn(
                  'text-sm font-medium',
                  disasterDef.effect.sentimentImpact >= 0 ? 'text-green-400' : 'text-yellow-400'
                )}>
                  Sentiment {disasterDef.effect.sentimentImpact >= 0 ? '+' : ''}
                  {disasterDef.effect.sentimentImpact}
                </span>
              </div>
            )}
            
            {/* Duration */}
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="text-sm">⏱️ {disasterDef.duration} day{disasterDef.duration !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Cobie Quote */}
        <div className="px-4 pb-4">
          <div
            data-testid="disaster-cobie-comment"
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
                  &ldquo;{disasterDef.cobieQuote}&rdquo;
                </p>
                <p className="text-xs text-yellow-500 font-medium mt-1">— Cobie</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative corners */}
        <div className={cn(
          'absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2',
          colors.border
        )} />
        <div className={cn(
          'absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2',
          colors.border
        )} />
      </div>
    </div>
  );
}

// =============================================================================
// PORTAL WRAPPER
// =============================================================================

export function DisasterToast(props: DisasterToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: client-side portal mounting detection
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <DisasterToastContent {...props} />,
    document.body
  );
}

// =============================================================================
// CSS ANIMATION (to be added to global styles)
// =============================================================================
// Add to globals.css:
// @keyframes disasterFlash {
//   0%, 100% { opacity: 0.5; }
//   50% { opacity: 1; }
// }

export default DisasterToast;
