'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NPCNeedsDisplay } from './NPCNeedsDisplay';
import { X, MessageCircle, Users, MapPin } from 'lucide-react';
import type { CryptoNPC } from '@/games/isocity/types/npc';

interface NPCInfoPanelProps {
  npc: CryptoNPC;
  onClose: () => void;
  onTalk: () => void;
  onFollow: () => void;
  onViewRelationships?: () => void;
}

/**
 * Emoji representation for each mood
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
 * Emoji representation for each activity
 */
const ACTIVITY_EMOJIS: Record<string, string> = {
  idle: '🧍',
  walking: '🚶',
  working: '💼',
  eating: '🍽️',
  sleeping: '😴',
  socializing: '💬',
  shopping: '🛒',
};

/**
 * Truncates a wallet address for display
 */
function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats a number as currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * Panel showing detailed NPC information when clicked.
 * Displays avatar, identity, needs, mood, and action buttons.
 */
export function NPCInfoPanel({
  npc,
  onClose,
  onTalk,
  onFollow,
  onViewRelationships,
}: NPCInfoPanelProps) {
  const mood = npc.internalWorld?.currentMood ?? 'neutral';
  const moodEmoji = MOOD_EMOJIS[mood] ?? '😐';
  const activityEmoji = npc.currentActivity ? ACTIVITY_EMOJIS[npc.currentActivity] ?? '🧍' : '🧍';
  const netWorth = npc.finances?.netWorth ?? 0;

  return (
    <Card className="w-80 bg-sidebar/95 backdrop-blur-sm border-sidebar-border shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar/Sprite placeholder */}
            <div className="size-12 rounded-sm bg-muted flex items-center justify-center text-2xl shrink-0">
              {moodEmoji}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{npc.name}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {truncateAddress(npc.walletAddress)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="shrink-0"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Demographics */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Occupation:</span>
            <span className="font-medium">{capitalize(npc.occupation)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Age:</span>
            <span className="font-medium">{npc.age}</span>
          </div>
        </div>

        {/* Mood & Activity */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Mood:</span>
            <span className="flex items-center gap-1">
              <span>{moodEmoji}</span>
              <span className="font-medium">{capitalize(mood)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Activity:</span>
            <span className="flex items-center gap-1">
              <span>{activityEmoji}</span>
              <span className="font-medium">{npc.currentActivity ? capitalize(npc.currentActivity) : 'Idle'}</span>
            </span>
          </div>
        </div>

        {/* Net Worth */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Net Worth:</span>
          <span className={cn(
            'font-semibold tabular-nums',
            netWorth >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {formatCurrency(netWorth)}
          </span>
        </div>

        {/* Needs */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Needs
          </h4>
          <NPCNeedsDisplay needs={npc.needs} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={onTalk}
            className="flex-1 gap-1.5"
          >
            <MessageCircle className="size-4" />
            <span>Talk</span>
          </Button>
          {onViewRelationships && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewRelationships}
              className="flex-1 gap-1.5"
            >
              <Users className="size-4" />
              <span>Relations</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onFollow}
            className="flex-1 gap-1.5"
          >
            <MapPin className="size-4" />
            <span>Follow</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default NPCInfoPanel;
