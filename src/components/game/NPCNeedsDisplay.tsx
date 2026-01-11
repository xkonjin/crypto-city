'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { NPCNeeds, NeedType } from '@/lib/npc/needs';

interface NPCNeedsDisplayProps {
  needs: NPCNeeds;
  compact?: boolean;
}

/**
 * Need name labels for display
 */
const NEED_LABELS: Record<NeedType, string> = {
  hunger: 'Hunger',
  energy: 'Energy',
  social: 'Social',
  fun: 'Fun',
  wealth: 'Wealth',
  purpose: 'Purpose',
};

/**
 * Emoji indicators for each need type
 */
const NEED_EMOJIS: Record<NeedType, string> = {
  hunger: '🍕',
  energy: '⚡',
  social: '👥',
  fun: '🎮',
  wealth: '💰',
  purpose: '🎯',
};

/**
 * Get color class based on need value
 * Green: 60-100 (satisfied)
 * Yellow: 30-59 (moderate)
 * Red: 0-29 (critical)
 */
function getNeedColor(value: number): string {
  if (value >= 60) return 'bg-green-500';
  if (value >= 30) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Get background track color based on need value
 */
function getTrackColor(value: number): string {
  if (value >= 60) return 'bg-green-500/20';
  if (value >= 30) return 'bg-yellow-500/20';
  return 'bg-red-500/20';
}

/**
 * Visual bars showing NPC need levels with color coding.
 * Green indicates satisfied needs (60-100), yellow moderate (30-59), red critical (0-29).
 */
export function NPCNeedsDisplay({ needs, compact = false }: NPCNeedsDisplayProps) {
  const needTypes: NeedType[] = ['hunger', 'energy', 'social', 'fun', 'wealth', 'purpose'];

  if (compact) {
    return (
      <div className="flex gap-1.5 flex-wrap">
        {needTypes.map((needType) => {
          const need = needs[needType];
          const value = Math.round(need.current);
          return (
            <div
              key={needType}
              className="flex items-center gap-1 text-xs"
              title={`${NEED_LABELS[needType]}: ${value}%`}
            >
              <span>{NEED_EMOJIS[needType]}</span>
              <div className={cn('size-2 rounded-full', getNeedColor(value))} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {needTypes.map((needType) => {
        const need = needs[needType];
        const value = Math.round(need.current);
        const isCritical = value < need.criticalThreshold;

        return (
          <div key={needType} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span>{NEED_EMOJIS[needType]}</span>
                <span className={cn('font-medium', isCritical && 'text-red-400')}>
                  {NEED_LABELS[needType]}
                </span>
              </div>
              <span className={cn('tabular-nums', isCritical && 'text-red-400 font-semibold')}>
                {value}%
              </span>
            </div>
            <div className={cn('h-2 w-full rounded-full overflow-hidden', getTrackColor(value))}>
              <div
                className={cn('h-full rounded-full transition-all duration-300', getNeedColor(value))}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NPCNeedsDisplay;
