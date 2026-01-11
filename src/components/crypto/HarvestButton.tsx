/**
 * Harvest Button Component (Issue #55)
 * 
 * Button for manually collecting crypto yields.
 * Supports three modes: auto, manual, and locked.
 * 
 * - Auto: Default behavior, yields go straight to treasury
 * - Manual: Yields accumulate, player clicks to collect
 * - Locked: Lock yields at current sentiment multiplier
 */

'use client';

import React, { useState } from 'react';
import { cryptoEconomy, ECONOMY_CONFIG } from '@/games/isocity/crypto';
import type { HarvestMode, MarketTiming } from '@/games/isocity/crypto';

// =============================================================================
// TYPES
// =============================================================================

interface HarvestButtonProps {
  marketTiming: MarketTiming;
  currentSentiment: number;
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

function getSentimentLabel(sentiment: number): string {
  const thresholds = ECONOMY_CONFIG.SENTIMENT_THRESHOLDS;
  if (sentiment < thresholds.extremeFear) return 'Extreme Fear';
  if (sentiment < thresholds.fear) return 'Fear';
  if (sentiment < thresholds.neutral) return 'Neutral';
  if (sentiment < thresholds.greed) return 'Greed';
  return 'Extreme Greed';
}

function getSentimentMultiplier(sentiment: number): number {
  const thresholds = ECONOMY_CONFIG.SENTIMENT_THRESHOLDS;
  const multipliers = ECONOMY_CONFIG.SENTIMENT_MULTIPLIERS;
  
  if (sentiment < thresholds.extremeFear) return multipliers.extremeFear;
  if (sentiment < thresholds.fear) return multipliers.fear;
  if (sentiment < thresholds.neutral) return multipliers.neutral;
  if (sentiment < thresholds.greed) return multipliers.greed;
  return multipliers.extremeGreed;
}

function getSentimentColor(sentiment: number): string {
  if (sentiment < 20) return 'text-red-400';
  if (sentiment < 40) return 'text-orange-400';
  if (sentiment < 60) return 'text-yellow-400';
  if (sentiment < 80) return 'text-lime-400';
  return 'text-green-400';
}

// =============================================================================
// MODE BUTTON COMPONENT
// =============================================================================

interface ModeButtonProps {
  mode: HarvestMode;
  currentMode: HarvestMode;
  label: string;
  icon: string;
  onClick: () => void;
}

function ModeButton({ mode, currentMode, label, icon, onClick }: ModeButtonProps) {
  const isActive = mode === currentMode;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all
        ${isActive 
          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' 
          : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-300 border border-transparent'
        }
      `}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HarvestButton({
  marketTiming,
  currentSentiment,
  className = '',
}: HarvestButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { harvestMode, pendingYields, lockedYields, lockSentiment } = marketTiming;
  
  const currentMultiplier = getSentimentMultiplier(currentSentiment);
  const lockedMultiplier = lockSentiment !== null ? getSentimentMultiplier(lockSentiment) : null;
  
  const hasPending = pendingYields > 0;
  const hasLocked = lockedYields > 0;
  
  // Calculate potential values
  const pendingValue = pendingYields * currentMultiplier;
  const lockedValue = hasLocked && lockedMultiplier ? lockedYields * lockedMultiplier : 0;
  
  const handleModeChange = (mode: HarvestMode) => {
    cryptoEconomy.setHarvestMode(mode);
  };
  
  const handleCollect = () => {
    cryptoEconomy.collectYields();
  };
  
  const handleLock = () => {
    cryptoEconomy.lockYields();
  };
  
  const handleRelease = () => {
    cryptoEconomy.releaseYields();
  };
  
  // Auto mode - just show indicator
  if (harvestMode === 'auto' && !hasPending && !hasLocked) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 rounded-lg border border-gray-700/50 hover:bg-gray-700/80 transition-colors"
        >
          <span className="text-lg">🌾</span>
          <span className="text-xs text-gray-400">Auto Harvest</span>
          <span className="text-[10px] text-gray-500">▼</span>
        </button>
        
        {isExpanded && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-xl z-50 min-w-[200px]">
            <div className="text-xs text-gray-400 mb-2">Harvest Mode</div>
            <div className="flex gap-1">
              <ModeButton mode="auto" currentMode={harvestMode} label="Auto" icon="🤖" onClick={() => handleModeChange('auto')} />
              <ModeButton mode="manual" currentMode={harvestMode} label="Manual" icon="✋" onClick={() => handleModeChange('manual')} />
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Manual or Locked mode with pending/locked yields
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 p-2 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-amber-500/30">
        {/* Mode selector */}
        <div className="flex gap-1 border-r border-gray-700/50 pr-2">
          <ModeButton mode="auto" currentMode={harvestMode} label="Auto" icon="🤖" onClick={() => handleModeChange('auto')} />
          <ModeButton mode="manual" currentMode={harvestMode} label="Manual" icon="✋" onClick={() => handleModeChange('manual')} />
        </div>
        
        {/* Pending yields */}
        {hasPending && (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase">Pending</span>
              <span className="text-sm font-mono text-amber-400">${formatNumber(pendingYields)}</span>
            </div>
            
            <div className="flex flex-col items-center text-[10px]">
              <span className="text-gray-500">×</span>
              <span className={getSentimentColor(currentSentiment)}>{currentMultiplier.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400">= Value</span>
              <span className="text-sm font-mono text-green-400">${formatNumber(pendingValue)}</span>
            </div>
            
            <div className="flex gap-1 ml-2">
              <button
                onClick={handleCollect}
                className="px-3 py-1 bg-green-600/80 hover:bg-green-500 text-white text-xs font-medium rounded transition-colors"
              >
                Harvest
              </button>
              <button
                onClick={handleLock}
                className="px-3 py-1 bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-medium rounded transition-colors"
                title="Lock yields at current sentiment"
              >
                🔒 Lock
              </button>
            </div>
          </div>
        )}
        
        {/* Locked yields */}
        {hasLocked && lockSentiment !== null && (
          <div className="flex items-center gap-2 border-l border-gray-700/50 pl-2">
            <div className="flex items-center gap-1">
              <span className="text-lg">🔒</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase">Locked at {getSentimentLabel(lockSentiment)}</span>
                <span className="text-sm font-mono text-amber-400">${formatNumber(lockedYields)}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center text-[10px]">
              <span className="text-gray-500">×</span>
              <span className={getSentimentColor(lockSentiment)}>{lockedMultiplier?.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400">= Value</span>
              <span className="text-sm font-mono text-green-400">${formatNumber(lockedValue)}</span>
            </div>
            
            <button
              onClick={handleRelease}
              className="px-3 py-1 bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-medium rounded transition-colors ml-2"
            >
              🔓 Release
            </button>
          </div>
        )}
        
        {/* Current sentiment indicator */}
        <div className="flex flex-col items-center border-l border-gray-700/50 pl-2">
          <span className="text-[10px] text-gray-400">Now</span>
          <span className={`text-xs font-medium ${getSentimentColor(currentSentiment)}`}>
            {getSentimentLabel(currentSentiment)}
          </span>
        </div>
      </div>
    </div>
  );
}
