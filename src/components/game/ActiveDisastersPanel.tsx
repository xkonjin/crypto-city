'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveDisaster } from '@/lib/disasters';

// =============================================================================
// TYPES
// =============================================================================

export interface ActiveDisastersPanelProps {
  activeDisasters: ActiveDisaster[];
  currentTick: number;
  ticksPerDay?: number;
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTimeRemaining(endTick: number, currentTick: number, ticksPerDay: number): string {
  const ticksRemaining = endTick - currentTick;
  if (ticksRemaining <= 0) return 'Ending...';
  
  const daysRemaining = ticksRemaining / ticksPerDay;
  
  if (daysRemaining >= 1) {
    const days = Math.floor(daysRemaining);
    const hours = Math.round((daysRemaining - days) * 24);
    if (hours > 0) {
      return `${days}d ${hours}h`;
    }
    return `${days}d`;
  }
  
  const hoursRemaining = daysRemaining * 24;
  if (hoursRemaining >= 1) {
    return `${Math.floor(hoursRemaining)}h`;
  }
  
  const minutesRemaining = hoursRemaining * 60;
  return `${Math.floor(minutesRemaining)}m`;
}

function getProgressPercent(startTick: number, endTick: number, currentTick: number): number {
  const total = endTick - startTick;
  const elapsed = currentTick - startTick;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

// =============================================================================
// DISASTER ITEM COMPONENT
// =============================================================================

interface DisasterItemProps {
  disaster: ActiveDisaster;
  currentTick: number;
  ticksPerDay: number;
}

function DisasterItem({ disaster, currentTick, ticksPerDay }: DisasterItemProps) {
  const disasterDef = disaster.disaster;
  const isPositive = disasterDef.isPositive || false;
  const timeRemaining = formatTimeRemaining(disaster.endTick, currentTick, ticksPerDay);
  const progressPercent = getProgressPercent(disaster.startTick, disaster.endTick, currentTick);

  return (
    <div
      className={cn(
        'relative p-2.5 rounded-lg border transition-all',
        isPositive
          ? 'bg-green-900/30 border-green-500/40 hover:border-green-500/60'
          : disasterDef.severity === 'catastrophic'
            ? 'bg-red-900/30 border-red-500/40 hover:border-red-500/60'
            : disasterDef.severity === 'major'
              ? 'bg-orange-900/30 border-orange-500/40 hover:border-orange-500/60'
              : 'bg-yellow-900/30 border-yellow-500/40 hover:border-yellow-500/60'
      )}
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b-lg overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            isPositive
              ? 'bg-green-500'
              : disasterDef.severity === 'catastrophic'
                ? 'bg-red-500'
                : disasterDef.severity === 'major'
                  ? 'bg-orange-500'
                  : 'bg-yellow-500'
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Icon */}
        <span className="text-xl flex-shrink-0">{disasterDef.icon}</span>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-white truncate">
              {disasterDef.name}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
              <Clock className="w-3 h-3" />
              <span>{timeRemaining}</span>
            </div>
          </div>
          
          {/* Effects summary */}
          <div className="flex items-center gap-2 mt-0.5">
            {disasterDef.effect.yieldMultiplier !== undefined && (
              <span className={cn(
                'text-xs',
                disasterDef.effect.yieldMultiplier >= 1 ? 'text-green-400' : 'text-red-400'
              )}>
                Yields {disasterDef.effect.yieldMultiplier >= 1 ? '+' : ''}
                {Math.round((disasterDef.effect.yieldMultiplier - 1) * 100)}%
              </span>
            )}
            {disasterDef.effect.sentimentImpact !== undefined && (
              <span className={cn(
                'text-xs',
                disasterDef.effect.sentimentImpact >= 0 ? 'text-green-400' : 'text-yellow-400'
              )}>
                Sentiment {disasterDef.effect.sentimentImpact >= 0 ? '+' : ''}{disasterDef.effect.sentimentImpact}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ActiveDisastersPanel({
  activeDisasters,
  currentTick,
  ticksPerDay = 288,
  className,
}: ActiveDisastersPanelProps) {
  // Separate positive and negative events
  const { positiveEvents, negativeEvents } = useMemo(() => {
    const positive: ActiveDisaster[] = [];
    const negative: ActiveDisaster[] = [];
    
    for (const disaster of activeDisasters) {
      if (disaster.disaster.isPositive) {
        positive.push(disaster);
      } else {
        negative.push(disaster);
      }
    }
    
    return { positiveEvents: positive, negativeEvents: negative };
  }, [activeDisasters]);

  // Don't render if no active disasters
  if (activeDisasters.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="active-disasters-panel"
      className={cn(
        'bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center gap-2">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-medium text-white">Active Events</span>
        <span className="text-xs text-gray-400">({activeDisasters.length})</span>
      </div>

      {/* Events list */}
      <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
        {/* Negative events first (more urgent) */}
        {negativeEvents.map((disaster) => (
          <DisasterItem
            key={disaster.instanceId}
            disaster={disaster}
            currentTick={currentTick}
            ticksPerDay={ticksPerDay}
          />
        ))}
        
        {/* Positive events */}
        {positiveEvents.map((disaster) => (
          <DisasterItem
            key={disaster.instanceId}
            disaster={disaster}
            currentTick={currentTick}
            ticksPerDay={ticksPerDay}
          />
        ))}
      </div>
    </div>
  );
}

export default ActiveDisastersPanel;
