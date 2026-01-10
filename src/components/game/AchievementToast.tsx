'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Share2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Achievement } from '@/types/game';
import { getCobieAchievementQuip } from '@/lib/achievementShare';

export interface AchievementToastProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onDismiss: () => void;
  onShare: () => void;
}

// Get category color
function getCategoryColor(category: string): string {
  switch (category) {
    case 'population':
      return 'border-green-500/50';
    case 'economy':
      return 'border-yellow-500/50';
    case 'buildings':
      return 'border-blue-500/50';
    case 'services':
      return 'border-purple-500/50';
    case 'longevity':
      return 'border-orange-500/50';
    default:
      return 'border-primary/50';
  }
}

// Get category gradient
function getCategoryGradient(category: string): string {
  switch (category) {
    case 'population':
      return 'from-green-500/20 via-green-500/10 to-transparent';
    case 'economy':
      return 'from-yellow-500/20 via-yellow-500/10 to-transparent';
    case 'buildings':
      return 'from-blue-500/20 via-blue-500/10 to-transparent';
    case 'services':
      return 'from-purple-500/20 via-purple-500/10 to-transparent';
    case 'longevity':
      return 'from-orange-500/20 via-orange-500/10 to-transparent';
    default:
      return 'from-primary/20 via-primary/10 to-transparent';
  }
}

// Get category label
function getCategoryLabel(category: string): string {
  switch (category) {
    case 'population':
      return 'POPULATION';
    case 'economy':
      return 'ECONOMY';
    case 'buildings':
      return 'BUILDING';
    case 'services':
      return 'SERVICES';
    case 'longevity':
      return 'VETERAN';
    default:
      return 'ACHIEVEMENT';
  }
}

function AchievementToastContent({ achievement, isVisible, onDismiss, onShare }: AchievementToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cobieQuip, setCobieQuip] = useState('');

  useEffect(() => {
    if (isVisible && achievement) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: animation state must sync with visibility
      setShouldRender(true);
      setCobieQuip(getCobieAchievementQuip(achievement.id));
      
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
  }, [isVisible, achievement, onDismiss]);

  if (!shouldRender || !achievement) return null;

  const borderColor = getCategoryColor(achievement.category);
  const gradientColor = getCategoryGradient(achievement.category);
  const categoryLabel = getCategoryLabel(achievement.category);

  return (
    <div
      data-testid="achievement-toast"
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
        borderColor
      )}>
        {/* Top accent gradient */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
          gradientColor
        )} />
        
        {/* Celebration particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-30" />
          <div className="absolute top-4 right-8 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping opacity-40 delay-100" />
          <div className="absolute top-6 left-12 w-1 h-1 bg-yellow-300 rounded-full animate-ping opacity-50 delay-200" />
        </div>
        
        {/* Content */}
        <div className="p-4 flex items-start gap-3">
          {/* Achievement Icon */}
          <div className="flex-shrink-0 relative">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-14 h-14 rounded-lg bg-yellow-400/20 blur-md -z-10" />
          </div>
          
          {/* Message */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold tracking-wider">
                {categoryLabel}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-0.5">
              🏆 {achievement.name}
            </h3>
            <p className="text-sm text-gray-300">
              {achievement.description}
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
        
        {/* Cobie Quote */}
        <div className="px-4 pb-3">
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
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
                  &ldquo;{cobieQuip}&rdquo;
                </p>
                <p className="text-xs text-yellow-500 font-medium mt-1">— Cobie</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action button */}
        <div className="px-4 pb-4 flex items-center justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={onShare}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-semibold gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
        
        {/* Decorative corners */}
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-yellow-500/30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-yellow-500/30" />
      </div>
    </div>
  );
}

export function AchievementToast(props: AchievementToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: client-side portal mounting detection
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AchievementToastContent {...props} />,
    document.body
  );
}

export default AchievementToast;
