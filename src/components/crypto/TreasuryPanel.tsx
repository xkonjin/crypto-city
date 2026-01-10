/**
 * Treasury Panel Component
 * 
 * Top bar UI component displaying the crypto city's economic status.
 * Shows treasury balance, daily yield, market sentiment, and TVL.
 * 
 * Adapted for IsoCity engine.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CryptoEconomyState } from '../../games/isocity/crypto/types';
import { cryptoEconomy } from '../../games/isocity/crypto';

// =============================================================================
// TYPES
// =============================================================================

interface TreasuryPanelProps {
  economyState: CryptoEconomyState;
  compact?: boolean;
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

function getSentimentColor(sentiment: number): string {
  if (sentiment < 20) return '#EF4444';
  if (sentiment < 40) return '#F97316';
  if (sentiment < 60) return '#EAB308';
  if (sentiment < 80) return '#84CC16';
  return '#22C55E';
}

function getSentimentLabel(sentiment: number): string {
  if (sentiment < 20) return 'Extreme Fear';
  if (sentiment < 40) return 'Fear';
  if (sentiment < 60) return 'Neutral';
  if (sentiment < 80) return 'Greed';
  return 'Extreme Greed';
}

function getMarketEmoji(sentiment: number): string {
  if (sentiment < 20) return '😱';
  if (sentiment < 40) return '😰';
  if (sentiment < 60) return '😐';
  if (sentiment < 80) return '🤑';
  return '🚀';
}

// =============================================================================
// ANIMATED COUNTER COMPONENT
// =============================================================================

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
  // Track the current animation timer to prevent memory leaks
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const diff = value - previousValue.current;
    if (Math.abs(diff) < 1) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }

    // Clear any existing animation before starting a new one
    // This prevents multiple intervals running simultaneously
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const steps = 20;
    const stepValue = diff / steps;
    let currentStep = 0;

    timerRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        previousValue.current = value;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        setDisplayValue(prev => prev + stepValue);
      }
    }, 25);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
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

function SentimentMeter({ sentiment }: { sentiment: number }) {
  const position = sentiment;
  const color = getSentimentColor(sentiment);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1 text-xs">
        <span>{getMarketEmoji(sentiment)}</span>
        <span style={{ color }}>{getSentimentLabel(sentiment)}</span>
      </div>
      
      <div className="w-24 h-2 rounded-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 relative">
        <div 
          className="absolute top-0 w-1 h-2 bg-white rounded-full shadow-md transition-all duration-300"
          style={{ 
            left: `calc(${position}% - 2px)`,
            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
          }}
        />
      </div>
      
      <div className="text-[10px] text-gray-400">
        {sentiment.toFixed(0)}/100
      </div>
    </div>
  );
}

// =============================================================================
// CITY BONUS INDICATOR COMPONENT (Issue #44)
// =============================================================================

function CityBonusIndicator() {
  const cityStats = cryptoEconomy.getCityIntegrationStats();
  const populationBonusPercent = ((cityStats.populationBonus - 1) * 100).toFixed(0);
  const serviceMultiplierPercent = (cityStats.serviceMultiplier * 100).toFixed(0);
  
  // Determine overall status
  const isOptimal = cityStats.hasPower && cityStats.serviceMultiplier >= 0.9;
  const hasIssues = !cityStats.hasPower || cityStats.serviceMultiplier < 0.75;
  
  return (
    <div className="flex items-center gap-3 px-4 border-l border-r border-gray-700/50">
      {/* Population Bonus */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-wider text-gray-400">
          Pop Boost
        </span>
        <span className={`text-base font-semibold ${
          cityStats.population > 0 ? 'text-cyan-400' : 'text-gray-500'
        }`}>
          +{populationBonusPercent}%
        </span>
      </div>
      
      {/* Service Status */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase tracking-wider text-gray-400">
          Services
        </span>
        <div className="flex items-center gap-1">
          <span className={cityStats.hasPower ? 'text-yellow-400' : 'text-gray-600'}>⚡</span>
          <span className={cityStats.hasWater ? 'text-blue-400' : 'text-gray-600'}>💧</span>
          <span className={`text-xs font-semibold ${
            isOptimal ? 'text-green-400' : hasIssues ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {serviceMultiplierPercent}%
          </span>
        </div>
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
  const yieldTrend = economyState.dailyYield >= 0 ? 'up' : 'down';

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
      {/* Treasury balance */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg">
          <span className="text-lg">💰</span>
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

      {/* Yield rate */}
      <div className="flex items-center gap-2 px-4 border-l border-gray-700/50">
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
      </div>

      {/* City Integration Bonus (Issue #44) */}
      {!compact && (
        <CityBonusIndicator />
      )}

      {/* Market sentiment */}
      <div className="flex items-center gap-4">
        <SentimentMeter sentiment={economyState.marketSentiment} />

        {!compact && (
          <div className="flex flex-col items-end border-l border-gray-700/50 pl-4">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              TVL
            </span>
            <span className="text-base font-semibold text-blue-400">
              {formatTVL(economyState.tvl)}
            </span>
          </div>
        )}

        {!compact && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              Buildings
            </span>
            <span className="text-base font-semibold text-purple-400">
              {economyState.buildingCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MINI TREASURY DISPLAY
// =============================================================================

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
      <span className="text-lg">💰</span>
      <span className="font-mono font-bold text-amber-400">
        {formatNumber(treasury)}
      </span>
      
      <span className="text-gray-600">|</span>
      
      <span className="text-green-400 text-sm">
        +{formatNumber(dailyYield)}/d
      </span>
      
      <span className="text-lg">{getMarketEmoji(sentiment)}</span>
    </div>
  );
}

