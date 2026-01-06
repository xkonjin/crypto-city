// =============================================================================
// NEWS TICKER COMPONENT
// =============================================================================
// Scrolling news ticker displaying crypto events and headlines.
// Shows recent events, market updates, and CT drama.
//
// Features:
// - Smooth scrolling animation
// - Color-coded event types (positive = green, negative = red)
// - Click to expand event details
// - Pause on hover

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CryptoEvent, CryptoEventType } from '../game/types';

// =============================================================================
// TYPES
// =============================================================================

interface NewsTickerProps {
  /**
   * List of events to display in the ticker
   */
  events: CryptoEvent[];
  
  /**
   * Optional: Static headlines to show when no events
   */
  staticHeadlines?: string[];
  
  /**
   * Optional: Speed of scroll animation (pixels per second)
   */
  scrollSpeed?: number;
  
  /**
   * Optional: Pause scrolling on hover
   */
  pauseOnHover?: boolean;
  
  /**
   * Optional: Additional CSS classes
   */
  className?: string;
  
  /**
   * Optional: Callback when an event is clicked
   */
  onEventClick?: (event: CryptoEvent) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default headlines to show when there are no events
 */
const DEFAULT_HEADLINES = [
  '📊 Markets are crabbing sideways...',
  '☕ GM to all the degens out there',
  '💎 Diamond hands stay winning',
  '🔄 Another day in crypto...',
  '📈 Number go up technology loading...',
  '🌙 Moon soon? Maybe. Probably. Eventually.',
];

/**
 * Event type to icon mapping
 */
const EVENT_ICONS: Record<CryptoEventType, string> = {
  bullRun: '🐂',
  bearMarket: '🐻',
  airdrop: '🪂',
  rugPull: '🔴',
  hack: '🔓',
  protocolUpgrade: '⬆️',
  whaleEntry: '🐋',
  ctDrama: '🍿',
  liquidation: '💥',
  merge: '🔀',
  halving: '⛏️',
  airdropSeason: '🎊',
  memeRally: '🐸',
  regulatoryFUD: '⚖️',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get background gradient based on event positivity
 */
function getEventGradient(isPositive: boolean): string {
  return isPositive
    ? 'from-green-500/10 via-transparent to-green-500/10'
    : 'from-red-500/10 via-transparent to-red-500/10';
}

/**
 * Get text color based on event positivity
 */
function getEventTextColor(isPositive: boolean): string {
  return isPositive ? 'text-green-400' : 'text-red-400';
}

/**
 * Format time ago from tick number
 */
function formatTimeAgo(startTick: number, currentTick: number): string {
  const ticksAgo = currentTick - startTick;
  if (ticksAgo === 0) return 'Just now';
  if (ticksAgo === 1) return '1 day ago';
  return `${ticksAgo} days ago`;
}

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
    const icon = EVENT_ICONS[event.type];
    const textColor = getEventTextColor(event.isPositive);
    
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
  
  // Static headline
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
  staticHeadlines = DEFAULT_HEADLINES,
  scrollSpeed = 50,
  pauseOnHover = true,
  className = '',
  onEventClick,
}: NewsTickerProps) {
  // Ref to the scrolling container
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Animation state
  const [isPaused, setIsPaused] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Combine events and static headlines
  const items = events.length > 0 
    ? events 
    : staticHeadlines.map((h, i) => ({ headline: h, key: `static-${i}` }));

  // Animation loop
  useEffect(() => {
    if (isPaused) return;
    
    const content = contentRef.current;
    if (!content) return;
    
    const contentWidth = content.scrollWidth / 2; // We duplicate content
    
    const animate = () => {
      setScrollPosition(prev => {
        const next = prev + scrollSpeed / 60;
        // Reset when we've scrolled half the content (duplicated)
        if (next >= contentWidth) {
          return 0;
        }
        return next;
      });
    };
    
    const animationFrame = setInterval(animate, 1000 / 60);
    
    return () => clearInterval(animationFrame);
  }, [isPaused, scrollSpeed]);

  return (
    <div 
      className={`
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
      <div 
        ref={scrollRef}
        className="flex-1 overflow-hidden"
      >
        <div 
          ref={contentRef}
          className="inline-flex items-center"
          style={{
            transform: `translateX(-${scrollPosition}px)`,
          }}
        >
          {/* First pass of items */}
          {items.map((item, index) => (
            'type' in item ? (
              <React.Fragment key={item.id}>
                <NewsItem 
                  event={item as CryptoEvent}
                  onClick={() => onEventClick?.(item as CryptoEvent)}
                />
                {index < items.length - 1 && (
                  <span className="text-gray-600 mx-2">•</span>
                )}
              </React.Fragment>
            ) : (
              <React.Fragment key={(item as { headline: string; key: string }).key}>
                <NewsItem headline={(item as { headline: string; key: string }).headline} />
                {index < items.length - 1 && (
                  <span className="text-gray-600 mx-2">•</span>
                )}
              </React.Fragment>
            )
          ))}
          
          {/* Spacer */}
          <span className="mx-8" />
          
          {/* Second pass for seamless loop */}
          {items.map((item, index) => (
            'type' in item ? (
              <React.Fragment key={`dup-${item.id}`}>
                <NewsItem 
                  event={item as CryptoEvent}
                  onClick={() => onEventClick?.(item as CryptoEvent)}
                />
                {index < items.length - 1 && (
                  <span className="text-gray-600 mx-2">•</span>
                )}
              </React.Fragment>
            ) : (
              <React.Fragment key={`dup-${(item as { headline: string; key: string }).key}`}>
                <NewsItem headline={(item as { headline: string; key: string }).headline} />
                {index < items.length - 1 && (
                  <span className="text-gray-600 mx-2">•</span>
                )}
              </React.Fragment>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EVENT DETAIL POPUP
// =============================================================================

interface EventDetailProps {
  event: CryptoEvent;
  currentTick: number;
  onClose: () => void;
}

export function EventDetail({ event, currentTick, onClose }: EventDetailProps) {
  const icon = EVENT_ICONS[event.type];
  const bgGradient = getEventGradient(event.isPositive);
  const textColor = getEventTextColor(event.isPositive);
  
  const ticksRemaining = event.startTick + event.duration - currentTick;
  const isActive = ticksRemaining > 0;

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
              {formatTimeAgo(event.startTick, currentTick)}
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
            {isActive ? `Active (${ticksRemaining} days left)` : 'Ended'}
          </span>
          
          <span className={`
            px-2 py-1 rounded text-xs font-semibold
            ${event.isPositive
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }
          `}>
            {event.isPositive ? 'Positive' : 'Negative'}
          </span>
        </div>
        
        {/* Effects */}
        {Object.keys(event.effects).length > 0 && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Effects:</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(event.effects).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-gray-500">{key}:</span>{' '}
                  <span className={typeof value === 'number' && value > 0 ? 'text-green-400' : 'text-red-400'}>
                    {typeof value === 'number' 
                      ? (value > 0 ? '+' : '') + value.toFixed(1)
                      : String(value)
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
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

// =============================================================================
// COMPACT NEWS BADGE (for notifications)
// =============================================================================

export function EventBadge({ 
  event, 
  onClick 
}: { 
  event: CryptoEvent; 
  onClick?: () => void;
}) {
  const icon = EVENT_ICONS[event.type];
  const bgColor = event.isPositive ? 'bg-green-500/20' : 'bg-red-500/20';
  const borderColor = event.isPositive ? 'border-green-500/30' : 'border-red-500/30';
  const textColor = event.isPositive ? 'text-green-400' : 'text-red-400';

  return (
    <button
      onClick={onClick}
      className={`
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

