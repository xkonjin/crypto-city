'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Gift, Sparkles, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Milestone, MilestoneTier, TIER_COLORS } from '@/lib/milestones';

export interface UnlockNotificationProps {
  milestone: Milestone | null;
  isVisible: boolean;
  onDismiss: () => void;
}

// Get tier icon
function getTierIcon(tier: MilestoneTier): React.ReactNode {
  switch (tier) {
    case 'bronze':
      return '🥉';
    case 'silver':
      return '🥈';
    case 'gold':
      return '🥇';
    case 'diamond':
      return '💎';
    default:
      return '🏆';
  }
}

function UnlockNotificationContent({ milestone, isVisible, onDismiss }: UnlockNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible && milestone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: animation state must sync with visibility
      setShouldRender(true);
      
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      
      // Auto-dismiss after 5 seconds
      const dismissTimer = setTimeout(() => {
        onDismiss();
      }, 5000);
      
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
  }, [isVisible, milestone, onDismiss]);

  if (!shouldRender || !milestone) return null;

  const tierColors = TIER_COLORS[milestone.tier];

  return (
    <div
      data-testid="unlock-notification"
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
        tierColors.border
      )}>
        {/* Top accent gradient */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
          tierColors.bg
        )} />
        
        {/* Celebration particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            'absolute top-2 left-4 w-2 h-2 rounded-full animate-ping opacity-30',
            tierColors.bg.replace('bg-', 'bg-')
          )} />
          <div className={cn(
            'absolute top-4 right-8 w-1.5 h-1.5 rounded-full animate-ping opacity-40 delay-100',
            tierColors.bg.replace('bg-', 'bg-')
          )} />
        </div>
        
        {/* Content */}
        <div className="p-4 flex items-start gap-3">
          {/* Milestone Icon */}
          <div className="flex-shrink-0 relative">
            <div className={cn(
              'w-14 h-14 rounded-lg flex items-center justify-center shadow-lg',
              tierColors.bg
            )}>
              <span className="text-2xl">{milestone.icon}</span>
            </div>
            {/* Tier badge */}
            <div className="absolute -bottom-1 -right-1 text-lg">
              {getTierIcon(milestone.tier)}
            </div>
          </div>
          
          {/* Message */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded font-bold tracking-wider uppercase',
                tierColors.bg,
                tierColors.text
              )}>
                {milestone.tier} Milestone
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-0.5">
              🎉 {milestone.name}
            </h3>
            <p className="text-sm text-gray-300">
              {milestone.description}
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
        
        {/* Rewards section */}
        <div className="px-4 pb-3">
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="flex items-center gap-4 text-sm">
              {milestone.reward.treasury && (
                <div className="flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-mono">
                    +${milestone.reward.treasury.toLocaleString()}
                  </span>
                </div>
              )}
              {milestone.reward.yieldBonus && (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">
                    +{(milestone.reward.yieldBonus * 100).toFixed(0)}% yield
                  </span>
                </div>
              )}
              {milestone.reward.prestigePoints && (
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400">
                    +{milestone.reward.prestigePoints} PP
                  </span>
                </div>
              )}
            </div>
            
            {milestone.unlocks && milestone.unlocks.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700/50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Unlocked: {milestone.unlocks.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative corners */}
        <div className={cn(
          'absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2',
          tierColors.border
        )} />
        <div className={cn(
          'absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2',
          tierColors.border
        )} />
      </div>
    </div>
  );
}

export function UnlockNotification(props: UnlockNotificationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: client-side portal mounting detection
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <UnlockNotificationContent {...props} />,
    document.body
  );
}

export default UnlockNotification;
