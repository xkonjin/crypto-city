/**
 * =============================================================================
 * REAL DATA SETTINGS COMPONENT
 * =============================================================================
 * Settings panel for configuring real-world crypto data integration.
 * 
 * Features:
 * - Toggle real data on/off
 * - View API configuration status
 * - Configure refresh intervals
 * - View cache statistics
 * - Clear cached data
 */

'use client';

import React, { useState } from 'react';
import { 
  checkApiKeysConfigured, 
  REFRESH_INTERVALS,
  CT_ACCOUNTS,
} from '../../lib/crypto/config';
import { useCacheStats } from '../../hooks/useRealCryptoData';

// =============================================================================
// TYPES
// =============================================================================

interface RealDataSettingsProps {
  /** Whether real data integration is enabled */
  enabled: boolean;
  /** Callback to toggle enabled state */
  onEnabledChange: (enabled: boolean) => void;
  /** Callback to clear cache */
  onClearCache?: () => Promise<void>;
  /** Callback to refresh all data */
  onRefresh?: () => Promise<void>;
  /** Whether a refresh is in progress */
  isRefreshing?: boolean;
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function RealDataSettings({
  enabled,
  onEnabledChange,
  onClearCache,
  onRefresh,
  isRefreshing = false,
  isLoading = false,
  className = '',
}: RealDataSettingsProps) {
  // Check API key configuration (computed once on mount)
  // Using lazy initializer instead of useEffect to avoid cascading renders
  const [apiStatus] = useState<ReturnType<typeof checkApiKeysConfigured>>(() => 
    checkApiKeysConfigured()
  );
  const cacheStats = useCacheStats();

  // Format age for display
  const formatAge = (age: number): string => {
    const seconds = Math.floor(age / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <div className={`
      bg-gray-800/90 backdrop-blur-sm rounded-lg p-4
      border border-gray-700/50
      ${className}
    `}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>🌐</span>
        <span>Real-World Data</span>
      </h3>

      {/* Main Toggle */}
      <div className="flex items-center justify-between mb-6 p-3 bg-gray-700/50 rounded-lg">
        <div>
          <div className="text-white font-medium">Enable Real Data</div>
          <div className="text-xs text-gray-400 mt-0.5">
            Blend real crypto data with game simulation
          </div>
        </div>
        <button
          onClick={() => onEnabledChange(!enabled)}
          className={`
            relative w-12 h-6 rounded-full transition-colors duration-200
            ${enabled ? 'bg-green-500' : 'bg-gray-600'}
          `}
        >
          <span className={`
            absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
            transition-transform duration-200
            ${enabled ? 'translate-x-6' : 'translate-x-0'}
          `} />
        </button>
      </div>

      {/* API Status */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">API Configuration</h4>
        <div className="space-y-2">
          <ApiStatusRow
            name="CoinGecko"
            description="Token prices (free tier available)"
            configured={true} // Always available
            required={false}
            icon="💰"
          />
          <ApiStatusRow
            name="DeFi Llama"
            description="TVL & yields (free, no key)"
            configured={true}
            required={false}
            icon="🏦"
          />
          <ApiStatusRow
            name="Fear & Greed"
            description="Market sentiment (free, no key)"
            configured={true}
            required={false}
            icon="📊"
          />
          <ApiStatusRow
            name="Perplexity"
            description="AI-powered news"
            configured={apiStatus?.perplexity ?? false}
            required={false}
            icon="📰"
          />
          <ApiStatusRow
            name="Twitter/X"
            description="Crypto Twitter feeds"
            configured={apiStatus?.twitter ?? false}
            required={false}
            icon="🐦"
          />
        </div>
      </div>

      {/* Cache Status */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Cache Status</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <CacheStatusRow
            name="Prices"
            stats={cacheStats?.prices}
            formatAge={formatAge}
          />
          <CacheStatusRow
            name="DeFi"
            stats={cacheStats?.defi}
            formatAge={formatAge}
          />
          <CacheStatusRow
            name="Sentiment"
            stats={cacheStats?.fearGreed}
            formatAge={formatAge}
          />
          <CacheStatusRow
            name="News"
            stats={cacheStats?.news}
            formatAge={formatAge}
          />
          <CacheStatusRow
            name="Twitter"
            stats={cacheStats?.twitter}
            formatAge={formatAge}
          />
        </div>
      </div>

      {/* Refresh Intervals Info */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Auto-Refresh Intervals</h4>
        <div className="text-xs text-gray-500 space-y-1">
          <div>Prices: {REFRESH_INTERVALS.PRICES / 1000}s</div>
          <div>DeFi: {REFRESH_INTERVALS.DEFI / 1000 / 60}m</div>
          <div>News: {REFRESH_INTERVALS.NEWS / 1000 / 60}m</div>
          <div>Twitter: {REFRESH_INTERVALS.TWITTER / 1000 / 60}m</div>
        </div>
      </div>

      {/* CT Accounts Preview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Tracked CT Accounts</h4>
        <div className="flex flex-wrap gap-1">
          {CT_ACCOUNTS.slice(0, 8).map(account => (
            <span
              key={account.handle}
              className="text-xs px-2 py-0.5 bg-gray-700/50 rounded text-gray-400"
            >
              @{account.handle}
            </span>
          ))}
          {CT_ACCOUNTS.length > 8 && (
            <span className="text-xs px-2 py-0.5 text-gray-500">
              +{CT_ACCOUNTS.length - 8} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
            className={`
              flex-1 py-2 px-4 rounded-lg font-medium text-sm
              transition-colors
              ${isRefreshing || isLoading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              }
            `}
          >
            {isRefreshing ? '⟳ Syncing...' : '↻ Refresh Now'}
          </button>
        )}
        {onClearCache && (
          <button
            onClick={onClearCache}
            disabled={isRefreshing}
            className={`
              py-2 px-4 rounded-lg font-medium text-sm
              transition-colors
              ${isRefreshing
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }
            `}
          >
            🗑 Clear Cache
          </button>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700/50 text-xs text-gray-500">
        <p>
          Real data is blended with game simulation using configurable weights.
          Works offline using cached data. Configure API keys in{' '}
          <code className="text-gray-400">.env.local</code> for full functionality.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ApiStatusRowProps {
  name: string;
  description: string;
  configured: boolean;
  required: boolean;
  icon: string;
}

function ApiStatusRow({ name, description, configured, required, icon }: ApiStatusRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-700/30 rounded">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <div>
          <div className="text-sm text-white">{name}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
      <div className={`
        px-2 py-0.5 rounded text-xs font-medium
        ${configured
          ? 'bg-green-500/20 text-green-400'
          : required
            ? 'bg-red-500/20 text-red-400'
            : 'bg-gray-500/20 text-gray-400'
        }
      `}>
        {configured ? '✓' : required ? '!' : '○'}
      </div>
    </div>
  );
}

interface CacheStatusRowProps {
  name: string;
  stats: { fresh: boolean; age: number } | null | undefined;
  formatAge: (age: number) => string;
}

function CacheStatusRow({ name, stats, formatAge }: CacheStatusRowProps) {
  return (
    <div className="flex items-center justify-between py-1 px-2 bg-gray-700/30 rounded">
      <span className="text-gray-400">{name}</span>
      <div className="flex items-center gap-1">
        <span className="text-gray-500">
          {stats ? formatAge(stats.age) : '-'}
        </span>
        <span className={
          !stats ? 'text-gray-500' :
          stats.fresh ? 'text-green-400' : 'text-yellow-400'
        }>
          {!stats ? '○' : stats.fresh ? '●' : '◐'}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORT HOOK FOR EXTERNAL USE
// =============================================================================

/**
 * Hook to manage real data settings state
 * Uses lazy initialization to read from localStorage
 */
export function useRealDataSettings(defaultEnabled = true) {
  // Use lazy initializer to read from localStorage (avoids useEffect setState issue)
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return defaultEnabled;
    const stored = localStorage.getItem('crypto-city-real-data-enabled');
    return stored !== null ? stored === 'true' : defaultEnabled;
  });
  
  const handleEnabledChange = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crypto-city-real-data-enabled', String(newEnabled));
    }
  };
  
  return {
    enabled,
    setEnabled: handleEnabledChange,
  };
}

