// =============================================================================
// TREASURY PANEL COMPONENT
// =============================================================================
// Top bar UI component displaying the crypto city's economic status.
// Shows treasury balance, daily yield, market sentiment, and TVL.
//
// Features:
// - Animated token counter that smoothly updates
// - Fear/Greed meter with gradient colors
// - Daily yield rate with trend indicator
// - Compact mode for smaller screens

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CryptoEconomyState } from '../game/types';

// =============================================================================
// TYPES
// =============================================================================

interface TreasuryPanelProps {
  /**
   * Current economy state from the simulation
   */
  economyState: CryptoEconomyState;
  
  /**
   * Optional: Compact mode for smaller layouts
   */
  compact?: boolean;
  
  /**
   * Optional: Additional CSS classes
   */
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format large numbers with K, M, B suffixes
 * e.g., 1500 -> "1.5K", 2500000 -> "2.5M"
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
}

/**
 * Format TVL with $ prefix
 */
function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000_000) {
    return '$' + (tvl / 1_000_000_000).toFixed(2) + 'B';
  }
  if (tvl >= 1_000_000) {
    return '$' + (tvl / 1_000_000).toFixed(1) + 'M';
  }
  if (tvl >= 1_000) {
    return '$' + (tvl / 1_000).toFixed(0) + 'K';
  }
  return '$' + tvl.toFixed(0);
}

/**
 * Get color based on sentiment value
 * -100 (extreme fear) = red
 * 0 (neutral) = yellow
 * +100 (extreme greed) = green
 */
function getSentimentColor(sentiment: number): string {
  // Normalize to 0-1 range
  const normalized = (sentiment + 100) / 200;
  
  if (normalized < 0.25) {
    // Extreme fear: dark red
    return '#EF4444';
  } else if (normalized < 0.4) {
    // Fear: orange-red
    return '#F97316';
  } else if (normalized < 0.6) {
    // Neutral: yellow
    return '#EAB308';
  } else if (normalized < 0.75) {
    // Greed: lime
    return '#84CC16';
  } else {
    // Extreme greed: green
    return '#22C55E';
  }
}

/**
 * Get sentiment label text
 */
function getSentimentLabel(sentiment: number): string {
  if (sentiment <= -60) return 'Extreme Fear';
  if (sentiment <= -20) return 'Fear';
  if (sentiment <= 20) return 'Neutral';
  if (sentiment <= 60) return 'Greed';
  return 'Extreme Greed';
}

/**
 * Get market phase emoji
 */
function getMarketEmoji(sentiment: number): string {
  if (sentiment <= -60) return '😱';
  if (sentiment <= -20) return '😰';
  if (sentiment <= 20) return '😐';
  if (sentiment <= 60) return '🤑';
  return '🚀';
}

// =============================================================================
// ANIMATED COUNTER COMPONENT
// =============================================================================

/**
 * Counter that animates smoothly between values
 */
function AnimatedCounter({ 
  value, 
  prefix = '', 
  suffix = '',
  className = '' 
}: { 
  value: number; 
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const diff = value - previousValue.current;
    if (Math.abs(diff) < 1) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }

    // Animate over ~500ms
    const steps = 20;
    const stepValue = diff / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        previousValue.current = value;
        clearInterval(timer);
      } else {
        setDisplayValue(prev => prev + stepValue);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={className}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  );
}

// =============================================================================
// SENTIMENT METER COMPONENT
// =============================================================================

/**
 * Visual fear/greed meter
 */
function SentimentMeter({ sentiment }: { sentiment: number }) {
  // Convert -100 to 100 into 0% to 100% position
  const position = ((sentiment + 100) / 200) * 100;
  const color = getSentimentColor(sentiment);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Label */}
      <div className="flex items-center gap-1 text-xs">
        <span>{getMarketEmoji(sentiment)}</span>
        <span style={{ color }}>{getSentimentLabel(sentiment)}</span>
      </div>
      
      {/* Meter bar */}
      <div className="w-24 h-2 rounded-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 relative">
        {/* Indicator needle */}
        <div 
          className="absolute top-0 w-1 h-2 bg-white rounded-full shadow-md transition-all duration-300"
          style={{ 
            left: `calc(${position}% - 2px)`,
            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
          }}
        />
      </div>
      
      {/* Value */}
      <div className="text-[10px] text-gray-400">
        {sentiment > 0 ? '+' : ''}{sentiment.toFixed(0)}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN TREASURY PANEL COMPONENT
// =============================================================================

export default function TreasuryPanel({ 
  economyState, 
  compact = false,
  className = '' 
}: TreasuryPanelProps) {
  // Calculate yield trend (up/down compared to average)
  const yieldTrend = economyState.globalYieldMultiplier >= 1 ? 'up' : 'down';

  return (
    <div 
      className={`
        bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95
        backdrop-blur-md border-b border-gray-700/50
        px-4 py-2 flex items-center justify-between gap-4
        font-mono text-sm
        ${className}
      `}
    >
      {/* Left section: Treasury balance */}
      <div className="flex items-center gap-3">
        {/* Token icon */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg">
          <span className="text-lg">🪙</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">
            Treasury
          </span>
          <AnimatedCounter 
            value={economyState.treasury} 
            className="text-xl font-bold text-amber-400"
          />
        </div>
      </div>

      {/* Center section: Yield rate */}
      <div className="flex items-center gap-2 px-4 border-l border-r border-gray-700/50">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">
            Daily Yield
          </span>
          <div className="flex items-center gap-1">
            <span className={`text-lg font-semibold ${yieldTrend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {yieldTrend === 'up' ? '▲' : '▼'}
            </span>
            <AnimatedCounter 
              value={economyState.dailyYield}
              prefix="+"
              suffix="/day"
              className="text-base font-semibold text-green-400"
            />
          </div>
        </div>

        {/* Yield multiplier badge */}
        <div 
          className={`
            px-2 py-0.5 rounded text-xs font-bold
            ${economyState.globalYieldMultiplier >= 1.2 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : economyState.globalYieldMultiplier <= 0.8 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }
          `}
        >
          {economyState.globalYieldMultiplier.toFixed(2)}x
        </div>
      </div>

      {/* Right section: Market sentiment */}
      <div className="flex items-center gap-4">
        {/* Sentiment meter */}
        <SentimentMeter sentiment={economyState.marketSentiment} />

        {/* TVL display (if not compact) */}
        {!compact && (
          <div className="flex flex-col items-end border-l border-gray-700/50 pl-4">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              Total TVL
            </span>
            <span className="text-base font-semibold text-blue-400">
              {formatTVL(economyState.totalTVL)}
            </span>
          </div>
        )}

        {/* Building count (if not compact) */}
        {!compact && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              Buildings
            </span>
            <span className="text-base font-semibold text-purple-400">
              {economyState.cryptoBuildingCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MINI TREASURY DISPLAY (for overlay/HUD)
// =============================================================================

/**
 * Compact treasury display for in-game HUD
 */
export function MiniTreasury({ 
  treasury, 
  dailyYield,
  sentiment 
}: { 
  treasury: number; 
  dailyYield: number;
  sentiment: number;
}) {
  return (
    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-700/50">
      {/* Token */}
      <span className="text-lg">🪙</span>
      <span className="font-mono font-bold text-amber-400">
        {formatNumber(treasury)}
      </span>
      
      {/* Divider */}
      <span className="text-gray-600">|</span>
      
      {/* Yield */}
      <span className="text-green-400 text-sm">
        +{formatNumber(dailyYield)}/d
      </span>
      
      {/* Sentiment emoji */}
      <span className="text-lg">{getMarketEmoji(sentiment)}</span>
    </div>
  );
}

