'use client';

import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EngagementStreak } from '@/lib/engagementHooks';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface StreakIndicatorProps {
  streak: EngagementStreak;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBonus?: boolean;
}

const sizeClasses = {
  sm: {
    container: 'px-2 py-1 gap-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
  },
  md: {
    container: 'px-3 py-1.5 gap-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
  },
  lg: {
    container: 'px-4 py-2 gap-2',
    icon: 'w-5 h-5',
    text: 'text-base',
  },
};

export function StreakIndicator({
  streak,
  className,
  size = 'md',
  showBonus = true,
}: StreakIndicatorProps) {
  // Don't render if no streak
  if (streak.currentStreak <= 0) {
    return null;
  }

  const styles = sizeClasses[size];
  
  // Determine flame intensity based on streak length
  const flameColor = streak.currentStreak >= 30
    ? 'text-purple-400' // Diamond streak
    : streak.currentStreak >= 7
    ? 'text-orange-400' // Hot streak
    : streak.currentStreak >= 3
    ? 'text-yellow-400' // Warming up
    : 'text-gray-400';  // Just started

  const bgColor = streak.currentStreak >= 30
    ? 'bg-purple-500/20 border-purple-500/30'
    : streak.currentStreak >= 7
    ? 'bg-orange-500/20 border-orange-500/30'
    : streak.currentStreak >= 3
    ? 'bg-yellow-500/20 border-yellow-500/30'
    : 'bg-gray-500/20 border-gray-500/30';

  // Format bonus display
  const bonusPercent = streak.streakBonus > 0 
    ? `+${(streak.streakBonus * 100).toFixed(0)}%` 
    : null;

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium">
        {streak.currentStreak} day{streak.currentStreak !== 1 ? 's' : ''} streak 🔥
      </div>
      {streak.streakBonus > 0 && (
        <div className="text-green-400 text-sm">
          +{(streak.streakBonus * 100).toFixed(0)}% yield bonus active
        </div>
      )}
      {streak.highestStreak > streak.currentStreak && (
        <div className="text-gray-400 text-xs">
          Best: {streak.highestStreak} days
        </div>
      )}
      <div className="text-gray-500 text-xs mt-1">
        Play daily to keep your streak!
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            data-testid="streak-indicator"
            className={cn(
              'inline-flex items-center rounded-full border cursor-default',
              'transition-all duration-200 hover:scale-105',
              styles.container,
              bgColor,
              className
            )}
          >
            <Flame className={cn(styles.icon, flameColor, 'animate-pulse')} />
            <span className={cn(styles.text, 'font-medium text-white')}>
              {streak.currentStreak}
            </span>
            {showBonus && bonusPercent && (
              <span className={cn(styles.text, 'text-green-400 font-medium')}>
                {bonusPercent}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default StreakIndicator;
