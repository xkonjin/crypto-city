/**
 * TierGroup Component
 * 
 * Collapsible group showing buildings by tier.
 * Issue #203: Progressive Disclosure Level 2.
 */

'use client';

import React from 'react';
import { CryptoTier, CryptoBuildingDefinition } from '../../games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

interface TierGroupProps {
  tier: CryptoTier;
  buildings: CryptoBuildingDefinition[];
  isExpanded: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TIER_CONFIG: Record<CryptoTier, { label: string; color: string; icon: string }> = {
  institution: {
    label: 'Institution',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: '🏛️',
  },
  whale: {
    label: 'Whale',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: '🐋',
  },
  degen: {
    label: 'Degen',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: '🎰',
  },
  retail: {
    label: 'Retail',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: '🏠',
  },
};

// =============================================================================
// HELPERS
// =============================================================================

function calculateTierStats(buildings: CryptoBuildingDefinition[]) {
  if (buildings.length === 0) {
    return { avgYield: 0, avgRisk: 0, totalCost: 0 };
  }

  let totalYield = 0;
  let totalRisk = 0;
  let totalCost = 0;

  for (const building of buildings) {
    totalYield += building.crypto?.effects?.yieldRate ?? 0;
    totalRisk += building.crypto?.effects?.rugRisk ?? 0;
    totalCost += building.cost ?? 0;
  }

  return {
    avgYield: Math.round(totalYield / buildings.length),
    avgRisk: totalRisk / buildings.length,
    totalCost,
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function TierGroup({
  tier,
  buildings,
  isExpanded,
  onClick,
  children,
}: TierGroupProps) {
  const config = TIER_CONFIG[tier];
  const stats = calculateTierStats(buildings);

  return (
    <div data-testid="tier-group" data-tier={tier} className="mb-2">
      {/* Header - Clickable */}
      <button
        onClick={onClick}
        className={`
          w-full flex items-center gap-3 p-3 rounded-lg
          ${config.color} border
          transition-all duration-200
          ${isExpanded ? 'ring-2 ring-white/10' : 'hover:ring-1 hover:ring-white/5'}
        `}
      >
        {/* Tier Icon & Name */}
        <span className="text-xl">{config.icon}</span>
        <div className="flex-1 text-left">
          <div data-testid="tier-name" className="font-semibold">
            {config.label}
          </div>
          <div data-testid="tier-building-count" className="text-xs opacity-70">
            {buildings.length} building{buildings.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="opacity-70">Yield: </span>
            <span className="text-green-400">+{stats.avgYield}</span>
          </div>
          <div>
            <span className="opacity-70">Risk: </span>
            <span className={stats.avgRisk > 0.05 ? 'text-red-400' : 'text-yellow-400'}>
              {(stats.avgRisk * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Expand Arrow */}
        <span className={`opacity-50 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && children && (
        <div className="mt-2 pl-4 border-l-2 border-gray-700/50">
          {children}
        </div>
      )}
    </div>
  );
}
