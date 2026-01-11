/**
 * Yield Boost Button Component (Issue #55)
 * 
 * Button for activating yield boosts on individual buildings.
 * Yield boosts multiply yields but also increase rug risk.
 */

'use client';

import React, { useState } from 'react';
import { cryptoEconomy, ECONOMY_CONFIG } from '@/games/isocity/crypto';
import type { YieldBoost, ActiveYieldBoost } from '@/games/isocity/crypto';

// =============================================================================
// TYPES
// =============================================================================

interface YieldBoostButtonProps {
  buildingId: string;
  buildingName: string;
  activeBoost: ActiveYieldBoost | null;
  treasury: number;
  currentTick: number;
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
}

function getRiskColor(riskIncrease: number): string {
  if (riskIncrease <= 1) return 'text-yellow-400';
  if (riskIncrease <= 2) return 'text-orange-400';
  return 'text-red-400';
}

// =============================================================================
// BOOST OPTION COMPONENT
// =============================================================================

interface BoostOptionProps {
  boost: YieldBoost;
  canAfford: boolean;
  onActivate: () => void;
}

function BoostOption({ boost, canAfford, onActivate }: BoostOptionProps) {
  return (
    <button
      onClick={onActivate}
      disabled={!canAfford}
      className={`
        w-full p-3 rounded-lg border transition-all text-left
        ${canAfford
          ? 'bg-gray-800/80 border-gray-700/50 hover:border-amber-500/50 hover:bg-gray-700/80'
          : 'bg-gray-900/50 border-gray-800/50 opacity-60 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-white">{boost.name}</span>
        <span className="text-xs font-mono text-amber-400">${formatNumber(boost.cost)}</span>
      </div>
      
      <div className="text-[10px] text-gray-400 mb-2">{boost.description}</div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[10px] text-gray-500">Yield</div>
          <div className="text-sm font-medium text-green-400">{boost.yieldMultiplier}x</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">Risk</div>
          <div className={`text-sm font-medium ${getRiskColor(boost.riskIncrease)}`}>
            +{boost.riskIncrease * 100}%
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">Duration</div>
          <div className="text-sm font-mono text-gray-300">{Math.floor(boost.duration * 5 / 60)}m</div>
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// ACTIVE BOOST DISPLAY
// =============================================================================

interface ActiveBoostDisplayProps {
  boost: ActiveYieldBoost;
  currentTick: number;
}

function ActiveBoostDisplay({ boost, currentTick }: ActiveBoostDisplayProps) {
  const ticksRemaining = Math.max(0, boost.expiresAt - currentTick);
  const secondsRemaining = ticksRemaining * 5;
  const progress = ((boost.expiresAt - currentTick) / boost.boost.duration) * 100;
  
  return (
    <div className="p-3 bg-amber-900/30 rounded-lg border border-amber-500/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg animate-pulse">⚡</span>
          <span className="font-medium text-sm text-amber-300">{boost.boost.name}</span>
        </div>
        <span className="text-xs font-mono text-amber-400">
          {Math.floor(secondsRemaining / 60)}:{String(Math.floor(secondsRemaining % 60)).padStart(2, '0')}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-center text-xs mb-2">
        <div>
          <span className="text-gray-400">Yield: </span>
          <span className="text-green-400">{boost.boost.yieldMultiplier}x</span>
        </div>
        <div>
          <span className="text-gray-400">Risk: </span>
          <span className={getRiskColor(boost.boost.riskIncrease)}>+{boost.boost.riskIncrease * 100}%</span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function YieldBoostButton({
  buildingId,
  buildingName,
  activeBoost,
  treasury,
  currentTick,
  className = '',
}: YieldBoostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const availableBoosts = cryptoEconomy.getAvailableYieldBoosts();
  
  const handleActivateBoost = (boostId: string) => {
    const success = cryptoEconomy.activateYieldBoost(buildingId, boostId);
    if (success) {
      setIsOpen(false);
    }
  };
  
  // If there's an active boost, show the status
  if (activeBoost) {
    return (
      <div className={className}>
        <ActiveBoostDisplay boost={activeBoost} currentTick={currentTick} />
      </div>
    );
  }
  
  // No active boost - show activate button
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 rounded-lg border border-gray-700/50 hover:border-amber-500/50 hover:bg-gray-700/80 transition-all"
      >
        <span className="text-lg">⚡</span>
        <span className="text-sm text-gray-300">Boost Yields</span>
        <span className={`text-xs transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 p-3 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-xl z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">Boost {buildingName}</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            {availableBoosts.map(boost => (
              <BoostOption
                key={boost.id}
                boost={boost}
                canAfford={treasury >= boost.cost}
                onActivate={() => handleActivateBoost(boost.id)}
              />
            ))}
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-700/50 text-[10px] text-gray-500">
            ⚠️ Yield boosts increase rug risk! Use with caution.
          </div>
        </div>
      )}
    </div>
  );
}
