/**
 * News Ticker Component
 * 
 * Scrolling news ticker displaying crypto events and headlines.
 * Shows recent events, market updates, and CT drama.
 * 
 * Now enhanced with real-world data integration:
 * - Displays real news from Perplexity AI
 * - Shows CT tweets from Twitter/X API
 * - Price alerts for significant movers
 * - Visual indicators for live vs cached data
 * 
 * Adapted for IsoCity engine.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CryptoEvent, CryptoEventType } from '../../games/isocity/crypto/types';
import type { TickerItem } from '../../lib/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

interface NewsTickerProps {
  /** Active crypto events from the game */
  events: CryptoEvent[];
  /** Static headlines to show when no events/real data */
  headlines?: string[];
  /** Real-world ticker items (news, tweets, price alerts) */
  realTickerItems?: TickerItem[];
  /** Scroll speed in pixels per second */
  scrollSpeed?: number;
  /** Pause scrolling on hover */
  pauseOnHover?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when an event is clicked */
  onEventClick?: (event: CryptoEvent) => void;
  /** Callback when a real ticker item is clicked */
  onTickerItemClick?: (item: TickerItem) => void;
  /** Whether real data is being used */
  hasRealData?: boolean;
  /** Whether the app is online */
  isOnline?: boolean;
  /** Last sync timestamp */
  lastSync?: number | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_HEADLINES = [
  '📊 Markets are crabbing sideways...',
  '☕ GM to all the degens out there',
  '💎 Diamond hands stay winning',
  '🔄 Another day in crypto...',
  '📈 Number go up technology loading...',
  '🌙 Moon soon? Maybe. Probably. Eventually.',
  '🔗 Cross-chain activity increasing',
  '💰 DeFi TVL continues to grow',
];

const EVENT_ICONS: Record<CryptoEventType, string> = {
  bull_run: '🐂',
  bear_market: '🐻',
  airdrop: '🪂',
  rug_pull: '🔴',
  hack: '🔓',
  protocol_upgrade: '⬆️',
  whale_entry: '🐋',
  ct_drama: '🍿',
  liquidation_cascade: '💥',
  merge: '🔀',
  halving: '⛏️',
  airdrop_season: '🎊',
  regulatory_fud: '⚖️',
};

// =============================================================================
// NEWS ITEM COMPONENT
// =============================================================================

interface NewsItemProps {
  event?: CryptoEvent;
  headline?: string;
  tickerItem?: TickerItem;
  onClick?: () => void;
}

/**
 * Individual news item in the ticker
 * Now supports three types: game events, real ticker items, and static headlines
 */
function NewsItem({ event, headline, tickerItem, onClick }: NewsItemProps) {
  // Handle game events
  if (event) {
    const icon = EVENT_ICONS[event.type] || '📰';
    const isPositive = !['bear_market', 'rug_pull', 'hack', 'liquidation_cascade', 'regulatory_fud'].includes(event.type);
    const textColor = isPositive ? 'text-green-400' : 'text-red-400';
    
    return (
      <button
        onClick={onClick}
        className={`
          inline-flex items-center gap-2 px-4 py-1
          hover:bg-white/5 transition-colors rounded cursor-pointer
          whitespace-nowrap
        `}
      >
        <span className="text-lg">{icon}</span>
        <span className={`font-semibold ${textColor}`}>
          {event.name}
        </span>
        <span className="text-gray-400 text-sm">
          — {event.description}
        </span>
      </button>
    );
  }
  
  // Handle real ticker items (news, tweets, price alerts)
  if (tickerItem) {
    const getSentimentColor = (sentiment: TickerItem['sentiment']) => {
      switch (sentiment) {
        case 'positive': return 'text-green-400';
        case 'negative': return 'text-red-400';
        default: return 'text-gray-300';
      }
    };
    
    const getTypeStyle = (type: TickerItem['type']) => {
      switch (type) {
        case 'tweet':
          return 'border-l-2 border-blue-400 pl-2';
        case 'news':
          return 'border-l-2 border-yellow-400 pl-2';
        case 'price':
          return 'border-l-2 border-purple-400 pl-2';
        default:
          return '';
      }
    };
    
    return (
      <button
        onClick={onClick}
        className={`
          inline-flex items-center gap-2 px-4 py-1
          hover:bg-white/5 transition-colors rounded cursor-pointer
          whitespace-nowrap
          ${getTypeStyle(tickerItem.type)}
        `}
      >
        <span className={getSentimentColor(tickerItem.sentiment)}>
          {tickerItem.text}
        </span>
        {tickerItem.source && (
          <span className="text-gray-500 text-xs">
            via {tickerItem.source}
          </span>
        )}
      </button>
    );
  }
  
  // Handle static headlines
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1 whitespace-nowrap text-gray-400">
      {headline}
    </span>
  );
}

// =============================================================================
// MAIN NEWS TICKER COMPONENT
// =============================================================================

export default function NewsTicker({
  events,
  headlines = DEFAULT_HEADLINES,
  realTickerItems = [],
  scrollSpeed = 50,
  pauseOnHover = true,
  className = '',
  onEventClick,
  onTickerItemClick,
  hasRealData = false,
  isOnline = true,
  lastSync = null,
}: NewsTickerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Unified item type for the ticker
  type UnifiedItem = 
    | { type: 'event'; data: CryptoEvent }
    | { type: 'realItem'; data: TickerItem }
    | { type: 'headline'; data: string; key: string };
  
  // Build items list with priority: events > real items > headlines
  const items: UnifiedItem[] = [];
  
  // First, add active game events (highest priority)
  for (const event of events) {
    items.push({ type: 'event', data: event });
  }
  
  // Then, add real ticker items (news, tweets, price alerts)
  for (const item of realTickerItems) {
    items.push({ type: 'realItem', data: item });
  }
  
  // Finally, fill with static headlines if needed
  if (items.length === 0) {
    for (let i = 0; i < headlines.length; i++) {
      items.push({ type: 'headline', data: headlines[i], key: `static-${i}` });
    }
  }

  // Animation loop using requestAnimationFrame for better performance
  useEffect(() => {
    if (isPaused) return;
    
    const content = contentRef.current;
    if (!content) return;
    
    let animationId: number;
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      // Calculate delta time for smooth animation regardless of frame rate
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // Only animate if we have items to scroll
      const contentWidth = content.scrollWidth / 2;
      if (contentWidth <= 0) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      
      // Convert scrollSpeed (pixels per second at 60fps) to actual pixels per frame
      const pixelsPerMs = scrollSpeed / 1000;
      const movement = pixelsPerMs * deltaTime;
      
      setScrollPosition(prev => {
        const next = prev + movement;
        // Reset to beginning for seamless loop
        if (next >= contentWidth) {
          return 0;
        }
        return next;
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPaused, scrollSpeed]);

  // Helper to get item key
  const getItemKey = (item: UnifiedItem, index: number): string => {
    switch (item.type) {
      case 'event': return item.data.id;
      case 'realItem': return item.data.id;
      case 'headline': return item.key;
    }
  };
  
  // Helper to render an item
  const renderItem = (item: UnifiedItem) => {
    switch (item.type) {
      case 'event':
        return (
          <NewsItem 
            event={item.data}
            onClick={() => onEventClick?.(item.data)}
          />
        );
      case 'realItem':
        return (
          <NewsItem 
            tickerItem={item.data}
            onClick={() => onTickerItemClick?.(item.data)}
          />
        );
      case 'headline':
        return <NewsItem headline={item.data} />;
    }
  };
  
  // Track current time for relative formatting (updated every second)
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Format last sync time for display
  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((currentTime - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div 
      className={`
        news-ticker
        bg-gray-900/95 backdrop-blur-md border-t border-gray-700/50
        overflow-hidden h-10 flex items-center
        ${className}
      `}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {/* Breaking news label with real data indicator */}
      <div className={`
        flex-shrink-0 px-3 py-1 font-bold text-white text-xs uppercase tracking-wider 
        flex items-center gap-1.5 h-full
        ${hasRealData 
          ? 'bg-gradient-to-r from-green-600 to-emerald-500' 
          : 'bg-gradient-to-r from-red-600 to-red-500'
        }
      `}>
        <span className={`${isOnline ? 'animate-pulse' : ''}`}>
          {isOnline ? '●' : '○'}
        </span>
        <span>{hasRealData ? 'LIVE' : 'SIM'}</span>
      </div>
      
      {/* Data source indicator (shows on hover) */}
      {hasRealData && (
        <div className="flex-shrink-0 px-2 text-xs text-gray-500 border-r border-gray-700/50 h-full flex items-center">
          Synced: {formatLastSync(lastSync)}
        </div>
      )}
      
      {/* Scrolling content area */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={contentRef}
          className="inline-flex items-center"
          style={{
            transform: `translateX(-${scrollPosition}px)`,
          }}
        >
          {/* First pass of items */}
          {items.map((item, index) => (
            <React.Fragment key={getItemKey(item, index)}>
              {renderItem(item)}
              {index < items.length - 1 && (
                <span className="text-gray-600 mx-2">•</span>
              )}
            </React.Fragment>
          ))}
          
          {/* Spacer */}
          <span className="mx-8" />
          
          {/* Second pass for seamless loop */}
          {items.map((item, index) => (
            <React.Fragment key={`dup-${getItemKey(item, index)}`}>
              {renderItem(item)}
              {index < items.length - 1 && (
                <span className="text-gray-600 mx-2">•</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Offline indicator */}
      {!isOnline && (
        <div className="flex-shrink-0 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium flex items-center gap-1 h-full">
          <span>⚡</span>
          <span>Offline</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EVENT BADGE
// =============================================================================

export function EventBadge({ 
  event, 
  onClick 
}: { 
  event: CryptoEvent; 
  onClick?: () => void;
}) {
  const icon = EVENT_ICONS[event.type] || '📰';
  const isPositive = !['bear_market', 'rug_pull', 'hack', 'liquidation_cascade', 'regulatory_fud'].includes(event.type);
  const bgColor = isPositive ? 'bg-green-500/20' : 'bg-red-500/20';
  const borderColor = isPositive ? 'border-green-500/30' : 'border-red-500/30';
  const textColor = isPositive ? 'text-green-400' : 'text-red-400';

  return (
    <button
      onClick={onClick}
      className={`
        news-item
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        ${bgColor} ${textColor} border ${borderColor}
        text-xs font-semibold
        hover:scale-105 transition-transform cursor-pointer
        animate-pulse
      `}
    >
      <span>{icon}</span>
      <span className="truncate max-w-[150px]">{event.name}</span>
    </button>
  );
}

// =============================================================================
// EVENT DETAIL MODAL
// =============================================================================

interface EventDetailProps {
  event: CryptoEvent;
  onClose: () => void;
}

export function EventDetail({ event, onClose }: EventDetailProps) {
  const icon = EVENT_ICONS[event.type] || '📰';
  const isPositive = !['bear_market', 'rug_pull', 'hack', 'liquidation_cascade', 'regulatory_fud'].includes(event.type);
  const bgGradient = isPositive
    ? 'from-green-500/10 via-transparent to-green-500/10'
    : 'from-red-500/10 via-transparent to-red-500/10';
  const textColor = isPositive ? 'text-green-400' : 'text-red-400';
  
  // Use state + effect to track current time (avoid Date.now() during render)
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const isActive = event.active && currentTime < event.endTime;
  const timeRemaining = Math.max(0, Math.floor((event.endTime - currentTime) / 1000));

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className={`
          bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4
          shadow-2xl bg-gradient-to-br ${bgGradient}
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{icon}</span>
          <div>
            <h3 className={`text-xl font-bold ${textColor}`}>
              {event.name}
            </h3>
            <span className="text-sm text-gray-400">
              {isActive ? `${timeRemaining}s remaining` : 'Ended'}
            </span>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-300 mb-4">
          {event.description}
        </p>
        
        {/* Status */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`
            px-2 py-1 rounded text-xs font-semibold
            ${isActive 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }
          `}>
            {isActive ? 'Active' : 'Ended'}
          </span>
          
          <span className={`
            px-2 py-1 rounded text-xs font-semibold
            ${isPositive
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }
          `}>
            {isPositive ? 'Positive' : 'Negative'}
          </span>
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

