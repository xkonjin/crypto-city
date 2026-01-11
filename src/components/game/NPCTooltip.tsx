'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { CryptoNPC } from '@/games/isocity/types/npc';

interface NPCTooltipProps {
  npc: CryptoNPC;
  position: { x: number; y: number };
}

/**
 * Mood emoji mapping
 */
const MOOD_EMOJIS: Record<string, string> = {
  ecstatic: '🤩',
  happy: '😊',
  content: '😌',
  neutral: '😐',
  anxious: '😰',
  sad: '😢',
  angry: '😠',
  depressed: '😞',
};

/**
 * Capitalize first letter and replace underscores with spaces
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * Quick hover tooltip showing basic NPC info.
 * Displays name, occupation, and mood emoji.
 * Position is controlled by the parent component.
 */
export function NPCTooltip({ npc, position }: NPCTooltipProps) {
  const mood = npc.internalWorld?.currentMood ?? 'neutral';
  const moodEmoji = MOOD_EMOJIS[mood] ?? '😐';

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none',
        'px-3 py-1.5 rounded-sm',
        'bg-popover/95 backdrop-blur-sm',
        'border border-sidebar-border shadow-lg',
        'text-sm text-popover-foreground',
        'animate-in fade-in-0 zoom-in-95 duration-150'
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-8px)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium truncate max-w-32">{npc.name}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground text-xs capitalize">
          {capitalize(npc.occupation)}
        </span>
        <span>{moodEmoji}</span>
      </div>
    </div>
  );
}

export default NPCTooltip;
