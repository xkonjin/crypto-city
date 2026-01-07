/**
 * News Ticker Component
 * 
 * Scrolling news ticker displaying crypto events and headlines.
 * Shows recent events, market updates, and CT drama.
 * 
 * Adapted for IsoCity engine.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CryptoEvent, CryptoEventType } from '../../games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

interface NewsTickerProps {
  events: CryptoEvent[];
  headlines?: string[];
  scrollSpeed?: number;
  pauseOnHover?: boolean;
  className?: string;
  onEventClick?: (event: CryptoEvent) => void;
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
  onClick?: () => void;
}

function NewsItem({ event, headline, onClick }: NewsItemProps) {
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
  scrollSpeed = 50,
  pauseOnHover = true,
  className = '',
  onEventClick,
}: NewsTickerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Build items list
  const items: Array<CryptoEvent | { headline: string; key: string }> = events.length > 0 
    ? events 
    : headlines.map((h, i) => ({ headline: h, key: `static-${i}` }));

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

  const isCryptoEvent = (item: CryptoEvent | { headline: string; key: string }): item is CryptoEvent => {
    return 'type' in item;
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
      {/* Breaking news label */}
      <div className="flex-shrink-0 bg-gradient-to-r from-red-600 to-red-500 px-3 py-1 font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 h-full">
        <span className="animate-pulse">●</span>
        <span>LIVE</span>
      </div>
      
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
            <React.Fragment key={isCryptoEvent(item) ? item.id : item.key}>
              {isCryptoEvent(item) ? (
                <NewsItem 
                  event={item}
                  onClick={() => onEventClick?.(item)}
                />
              ) : (
                <NewsItem headline={item.headline} />
              )}
              {index < items.length - 1 && (
                <span className="text-gray-600 mx-2">•</span>
              )}
            </React.Fragment>
          ))}
          
          {/* Spacer */}
          <span className="mx-8" />
          
          {/* Second pass for seamless loop */}
          {items.map((item, index) => (
            <React.Fragment key={`dup-${isCryptoEvent(item) ? item.id : item.key}`}>
              {isCryptoEvent(item) ? (
                <NewsItem 
                  event={item}
                  onClick={() => onEventClick?.(item)}
                />
              ) : (
                <NewsItem headline={item.headline} />
              )}
              {index < items.length - 1 && (
                <span className="text-gray-600 mx-2">•</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
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

