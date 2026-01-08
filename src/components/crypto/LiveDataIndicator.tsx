/**
 * =============================================================================
 * LIVE DATA INDICATOR COMPONENT
 * =============================================================================
 * Visual indicators showing real-time data status.
 * 
 * Features:
 * - Live/Simulated badge
 * - Online/Offline status
 * - Last sync timestamp
 * - Data freshness indicators
 * - Settings toggle for real data
 */

'use client';

import React, { useState, useEffect } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface LiveDataIndicatorProps {
  /** Whether real data is being used */
  hasRealData: boolean;
  /** Whether the app is currently online */
  isOnline: boolean;
  /** Timestamp of last successful sync */
  lastSync: number | null;
  /** Whether real data integration is enabled */
  realDataEnabled: boolean;
  /** Callback to toggle real data */
  onToggleRealData?: (enabled: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Show compact version */
  compact?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format timestamp to human-readable relative time
 */
function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Never';
  
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Get freshness status
 */
function getFreshnessStatus(staleness: number): 'fresh' | 'stale' | 'expired' {
  if (staleness < 60 * 1000) return 'fresh'; // < 1 minute
  if (staleness < 10 * 60 * 1000) return 'stale'; // < 10 minutes
  return 'expired';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LiveDataIndicator({
  hasRealData,
  isOnline,
  lastSync,
  realDataEnabled,
  onToggleRealData,
  className = '',
  compact = false,
}: LiveDataIndicatorProps) {
  // Update relative time every second
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <CompactIndicator
        hasRealData={hasRealData}
        isOnline={isOnline}
        realDataEnabled={realDataEnabled}
        onToggleRealData={onToggleRealData}
        className={className}
      />
    );
  }

  return (
    <div className={`
      flex items-center gap-3 px-3 py-2 
      bg-gray-800/80 backdrop-blur-sm rounded-lg
      border border-gray-700/50
      ${className}
    `}>
      {/* Live/Sim Badge */}
      <div className={`
        flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold
        ${hasRealData 
          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }
      `}>
        <span className={hasRealData ? 'animate-pulse' : ''}>
          {hasRealData ? '●' : '○'}
        </span>
        <span>{hasRealData ? 'LIVE' : 'SIM'}</span>
      </div>

      {/* Online/Offline Status */}
      <div className={`
        flex items-center gap-1.5 text-xs
        ${isOnline ? 'text-gray-400' : 'text-yellow-400'}
      `}>
        <span>{isOnline ? '🌐' : '⚡'}</span>
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Last Sync */}
      {hasRealData && lastSync && (
        <div className="text-xs text-gray-500">
          Synced: {formatRelativeTime(lastSync)}
        </div>
      )}

      {/* Toggle Button */}
      {onToggleRealData && (
        <button
          onClick={() => onToggleRealData(!realDataEnabled)}
          className={`
            ml-auto px-2 py-1 rounded text-xs font-medium transition-colors
            ${realDataEnabled 
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
            }
          `}
        >
          {realDataEnabled ? 'Real Data: ON' : 'Real Data: OFF'}
        </button>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT INDICATOR
// =============================================================================

interface CompactIndicatorProps {
  hasRealData: boolean;
  isOnline: boolean;
  realDataEnabled: boolean;
  onToggleRealData?: (enabled: boolean) => void;
  className?: string;
}

function CompactIndicator({
  hasRealData,
  isOnline,
  realDataEnabled,
  onToggleRealData,
  className = '',
}: CompactIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => onToggleRealData?.(!realDataEnabled)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold
          transition-colors cursor-pointer
          ${hasRealData 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30' 
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
          }
          ${!isOnline ? 'border-yellow-500/30' : ''}
        `}
      >
        <span className={hasRealData ? 'animate-pulse' : ''}>
          {isOnline ? (hasRealData ? '●' : '○') : '⚡'}
        </span>
        <span>{hasRealData ? 'LIVE' : 'SIM'}</span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          px-3 py-2 bg-gray-800 rounded-lg shadow-xl
          border border-gray-700 text-xs whitespace-nowrap
          z-50
        ">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={hasRealData ? 'text-green-400' : 'text-gray-400'}>
                {hasRealData ? '✓' : '○'} Real-world data
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={isOnline ? 'text-green-400' : 'text-yellow-400'}>
                {isOnline ? '✓' : '!'} {isOnline ? 'Online' : 'Offline mode'}
              </span>
            </div>
            <div className="text-gray-500 mt-1 pt-1 border-t border-gray-700">
              Click to toggle real data
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-800" />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// DATA STATUS PANEL
// =============================================================================

interface DataStatusPanelProps {
  /** Prices cache status */
  prices?: { fresh: boolean; age: number } | null;
  /** DeFi cache status */
  defi?: { fresh: boolean; age: number } | null;
  /** Fear & Greed cache status */
  fearGreed?: { fresh: boolean; age: number } | null;
  /** News cache status */
  news?: { fresh: boolean; age: number } | null;
  /** Twitter cache status */
  twitter?: { fresh: boolean; age: number } | null;
  /** Callback to refresh all data */
  onRefresh?: () => void;
  /** Whether a refresh is in progress */
  isRefreshing?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function DataStatusPanel({
  prices,
  defi,
  fearGreed,
  news,
  twitter,
  onRefresh,
  isRefreshing = false,
  className = '',
}: DataStatusPanelProps) {
  const formatAge = (age: number | undefined): string => {
    if (age === undefined) return '-';
    const seconds = Math.floor(age / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  const getStatusColor = (status: { fresh: boolean } | null | undefined): string => {
    if (!status) return 'text-gray-500';
    return status.fresh ? 'text-green-400' : 'text-yellow-400';
  };

  const getStatusIcon = (status: { fresh: boolean } | null | undefined): string => {
    if (!status) return '○';
    return status.fresh ? '●' : '◐';
  };

  const sources = [
    { name: 'Prices', status: prices, icon: '💰' },
    { name: 'DeFi', status: defi, icon: '🏦' },
    { name: 'Sentiment', status: fearGreed, icon: '📊' },
    { name: 'News', status: news, icon: '📰' },
    { name: 'Twitter', status: twitter, icon: '🐦' },
  ];

  return (
    <div className={`
      bg-gray-800/90 backdrop-blur-sm rounded-lg p-4
      border border-gray-700/50
      ${className}
    `}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Data Sources</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`
              px-2 py-1 rounded text-xs font-medium
              transition-colors
              ${isRefreshing 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              }
            `}
          >
            {isRefreshing ? '⟳ Syncing...' : '↻ Refresh'}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {sources.map(({ name, status, icon }) => (
          <div 
            key={name}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <span>{icon}</span>
              <span className="text-gray-300">{name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">
                {status ? formatAge(status.age) : '-'}
              </span>
              <span className={getStatusColor(status)}>
                {getStatusIcon(status)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="text-green-400">●</span> Fresh
          </span>
          <span className="flex items-center gap-1">
            <span className="text-yellow-400">◐</span> Stale
          </span>
          <span className="flex items-center gap-1">
            <span className="text-gray-500">○</span> No data
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FEAR & GREED BADGE
// =============================================================================

interface FearGreedBadgeProps {
  value: number | null;
  classification: string | null;
  isReal: boolean;
  className?: string;
}

export function FearGreedBadge({
  value,
  classification,
  isReal,
  className = '',
}: FearGreedBadgeProps) {
  if (value === null) {
    return null;
  }

  const getColor = (val: number): string => {
    if (val <= 20) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (val <= 40) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (val <= 60) return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    if (val <= 80) return 'text-green-400 bg-green-500/10 border-green-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getEmoji = (val: number): string => {
    if (val <= 20) return '😱';
    if (val <= 40) return '😰';
    if (val <= 60) return '😐';
    if (val <= 80) return '🤑';
    return '🚀';
  };

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-lg border
      ${getColor(value)}
      ${className}
    `}>
      <span className="text-lg">{getEmoji(value)}</span>
      <div className="flex flex-col">
        <span className="text-sm font-bold">{value}</span>
        <span className="text-xs opacity-75">{classification}</span>
      </div>
      {isReal && (
        <span className="text-xs px-1 py-0.5 rounded bg-green-500/20 text-green-400">
          LIVE
        </span>
      )}
    </div>
  );
}

