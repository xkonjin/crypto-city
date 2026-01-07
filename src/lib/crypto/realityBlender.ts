/**
 * =============================================================================
 * REALITY BLENDER
 * =============================================================================
 * Core module that translates real-world crypto data into balanced game effects.
 * 
 * This is the "brain" that connects external data to the game simulation.
 * It takes raw data from APIs and produces game-compatible effects with:
 * - Smoothed sentiment values (prevents jarring swings)
 * - Clamped yield adjustments (prevents game-breaking values)
 * - Event triggers from price actions and news
 * - News ticker items from real headlines and tweets
 * 
 * The blender respects the BLENDER_CONFIG settings to ensure gameplay balance.
 */

import { BLENDER_CONFIG, FEATURES } from './config';
import {
  RealWorldCryptoData,
  PriceData,
  FearGreedData,
  DefiLlamaData,
  NewsData,
  TwitterData,
  CryptoNewsItem,
  CTTweet,
  TokenPrice,
} from './cache/types';
import { CryptoEventType, CryptoChain } from '../../games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Blended sentiment output for the game
 */
export interface BlendedSentiment {
  /** Final blended sentiment value (-100 to +100) */
  value: number;
  /** Raw value from Fear & Greed API (0-100) */
  realValue: number | null;
  /** Classification string */
  classification: string;
  /** Whether real data was available */
  hasRealData: boolean;
}

/**
 * Yield adjustment for buildings
 */
export interface YieldAdjustment {
  /** Global yield multiplier (0.5 to 1.5 typically) */
  globalMultiplier: number;
  /** Per-chain multipliers based on real yields */
  chainMultipliers: Partial<Record<CryptoChain, number>>;
  /** Per-protocol multipliers for specific buildings */
  protocolMultipliers: Record<string, number>;
  /** Whether real data was available */
  hasRealData: boolean;
}

/**
 * Event trigger from real-world data
 */
export interface EventTrigger {
  /** Event type to trigger */
  type: CryptoEventType;
  /** Probability of actually triggering (0-1) */
  probability: number;
  /** Affected chains (if any) */
  affectedChains: CryptoChain[];
  /** Source description for news ticker */
  source: string;
  /** Custom name for the event */
  customName?: string;
  /** Custom description */
  customDescription?: string;
}

/**
 * News ticker item (can be from real news, tweets, or generated)
 */
export interface TickerItem {
  /** Unique ID */
  id: string;
  /** Display text */
  text: string;
  /** Item type for styling */
  type: 'news' | 'tweet' | 'event' | 'price';
  /** Sentiment for coloring */
  sentiment: 'positive' | 'negative' | 'neutral';
  /** Original source (optional) */
  source?: string;
  /** Timestamp */
  timestamp: number;
  /** Additional metadata */
  meta?: {
    handle?: string; // For tweets
    url?: string; // For news
    priceChange?: number; // For price alerts
  };
}

/**
 * Complete blended output from the Reality Blender
 */
export interface BlendedGameData {
  /** Blended market sentiment */
  sentiment: BlendedSentiment;
  /** Yield adjustments */
  yields: YieldAdjustment;
  /** Potential events to trigger */
  eventTriggers: EventTrigger[];
  /** Items for the news ticker */
  tickerItems: TickerItem[];
  /** Data freshness info */
  dataStatus: {
    isOnline: boolean;
    lastSync: number | null;
    staleness: number;
    hasAnyData: boolean;
  };
}

// =============================================================================
// BLENDING STATE
// =============================================================================

/**
 * State for smoothing values over time
 */
interface BlenderState {
  /** Previous blended sentiment (for smoothing) */
  previousSentiment: number;
  /** Previous yield multiplier (for smoothing) */
  previousYieldMultiplier: number;
  /** Recently triggered events (to prevent spam) */
  recentEventTypes: Set<CryptoEventType>;
  /** Last price data for change detection */
  lastPrices: Record<string, number>;
}

// Global blender state (persists between calls)
const blenderState: BlenderState = {
  previousSentiment: 0,
  previousYieldMultiplier: 1.0,
  recentEventTypes: new Set(),
  lastPrices: {},
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Linear interpolation for smoothing
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert Fear & Greed (0-100) to game sentiment (-100 to +100)
 */
function fearGreedToGameSentiment(fearGreedValue: number): number {
  return (fearGreedValue - 50) * 2;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// SENTIMENT BLENDING
// =============================================================================

/**
 * Blend real Fear & Greed with simulated sentiment
 * 
 * @param realData - Real-world data from APIs
 * @param simulatedSentiment - Current simulated sentiment from game
 * @returns Blended sentiment
 */
export function blendSentiment(
  realData: RealWorldCryptoData,
  simulatedSentiment: number
): BlendedSentiment {
  // If no real data or blending disabled, return simulated
  if (!FEATURES.ENABLE_BLENDING || !realData.fearGreed) {
    return {
      value: simulatedSentiment,
      realValue: null,
      classification: getClassificationFromValue(simulatedSentiment),
      hasRealData: false,
    };
  }

  const realFearGreed = realData.fearGreed.data.value;
  const realSentiment = fearGreedToGameSentiment(realFearGreed);

  // Blend based on weight configuration
  const weight = BLENDER_CONFIG.REAL_DATA_WEIGHT;
  const targetSentiment = realSentiment * weight + simulatedSentiment * (1 - weight);

  // Apply smoothing to prevent jarring changes
  const smoothing = BLENDER_CONFIG.SENTIMENT_SMOOTHING;
  const smoothedSentiment = lerp(
    blenderState.previousSentiment,
    targetSentiment,
    smoothing
  );

  // Update state for next call
  blenderState.previousSentiment = smoothedSentiment;

  return {
    value: Math.round(smoothedSentiment),
    realValue: realFearGreed,
    classification: realData.fearGreed.data.classification,
    hasRealData: true,
  };
}

/**
 * Get sentiment classification from value
 */
function getClassificationFromValue(sentiment: number): string {
  if (sentiment <= -60) return 'Extreme Fear';
  if (sentiment <= -20) return 'Fear';
  if (sentiment <= 20) return 'Neutral';
  if (sentiment <= 60) return 'Greed';
  return 'Extreme Greed';
}

// =============================================================================
// YIELD ADJUSTMENT
// =============================================================================

/**
 * Calculate yield adjustments based on real DeFi data
 * 
 * @param realData - Real-world data from APIs
 * @returns Yield adjustment factors
 */
export function calculateYieldAdjustment(
  realData: RealWorldCryptoData
): YieldAdjustment {
  // Default multipliers
  const result: YieldAdjustment = {
    globalMultiplier: 1.0,
    chainMultipliers: {},
    protocolMultipliers: {},
    hasRealData: false,
  };

  if (!FEATURES.ENABLE_BLENDING || !realData.defi) {
    return result;
  }

  const defiData = realData.defi.data;
  result.hasRealData = true;

  // Calculate average yield across all pools
  if (defiData.yields.length > 0) {
    const avgApy = defiData.yields.reduce((sum, y) => sum + y.apy, 0) / defiData.yields.length;
    
    // Expected "normal" APY is around 5-10%
    const expectedApy = 7.5;
    const rawMultiplier = avgApy / expectedApy;
    
    // Clamp to prevent extreme values
    result.globalMultiplier = clamp(
      rawMultiplier,
      BLENDER_CONFIG.YIELD_CLAMP_MIN,
      BLENDER_CONFIG.YIELD_CLAMP_MAX
    );

    // Apply smoothing
    result.globalMultiplier = lerp(
      blenderState.previousYieldMultiplier,
      result.globalMultiplier,
      BLENDER_CONFIG.SENTIMENT_SMOOTHING
    );
    blenderState.previousYieldMultiplier = result.globalMultiplier;
  }

  // Calculate per-chain multipliers based on TVL changes
  for (const protocol of defiData.protocols) {
    const chain = protocol.chain as CryptoChain;
    const change = protocol.change24h;
    
    // Positive TVL change = higher yields, negative = lower
    // Scale: ±10% TVL change = ±5% yield adjustment
    const chainAdjustment = 1 + (change / 100) * 0.5;
    
    // Average with existing multiplier if present
    if (result.chainMultipliers[chain]) {
      result.chainMultipliers[chain] = 
        (result.chainMultipliers[chain]! + chainAdjustment) / 2;
    } else {
      result.chainMultipliers[chain] = clamp(
        chainAdjustment,
        BLENDER_CONFIG.YIELD_CLAMP_MIN,
        BLENDER_CONFIG.YIELD_CLAMP_MAX
      );
    }
  }

  // Calculate per-protocol multipliers for specific buildings
  for (const protocol of defiData.protocols) {
    const protocolName = protocol.name.toLowerCase();
    const change = protocol.change24h;
    
    // Protocol-specific adjustment
    const adjustment = 1 + (change / 100) * 0.3;
    result.protocolMultipliers[protocolName] = clamp(
      adjustment,
      BLENDER_CONFIG.YIELD_CLAMP_MIN,
      BLENDER_CONFIG.YIELD_CLAMP_MAX
    );
  }

  return result;
}

// =============================================================================
// EVENT TRIGGERS
// =============================================================================

/**
 * Generate potential event triggers from real-world data
 * 
 * @param realData - Real-world data from APIs
 * @returns Array of potential events to trigger
 */
export function generateEventTriggers(
  realData: RealWorldCryptoData
): EventTrigger[] {
  const triggers: EventTrigger[] = [];

  if (!FEATURES.ENABLE_BLENDING) {
    return triggers;
  }

  // Check price-based triggers
  if (realData.prices) {
    const priceTriggers = generatePriceTriggers(realData.prices.data);
    triggers.push(...priceTriggers);
  }

  // Check news-based triggers
  if (realData.news) {
    const newsTriggers = generateNewsTriggers(realData.news.data);
    triggers.push(...newsTriggers);
  }

  // Check sentiment-based triggers
  if (realData.fearGreed) {
    const sentimentTriggers = generateSentimentTriggers(realData.fearGreed.data);
    triggers.push(...sentimentTriggers);
  }

  // Filter out recently triggered events
  const filteredTriggers = triggers.filter(
    t => !blenderState.recentEventTypes.has(t.type)
  );

  return filteredTriggers;
}

/**
 * Generate triggers from price movements
 */
function generatePriceTriggers(priceData: PriceData): EventTrigger[] {
  const triggers: EventTrigger[] = [];
  const threshold = BLENDER_CONFIG.EVENT_TRIGGER_THRESHOLD * 100; // Convert to percentage

  for (const token of Object.values(priceData.tokens)) {
    // Bull run trigger: BTC or ETH up more than threshold
    if ((token.symbol === 'BTC' || token.symbol === 'ETH') && token.change24h >= threshold) {
      triggers.push({
        type: 'bull_run',
        probability: Math.min(0.8, token.change24h / 20), // More pump = higher prob
        affectedChains: token.symbol === 'ETH' ? ['ethereum'] : ['bitcoin'],
        source: `${token.symbol} up ${token.change24h.toFixed(1)}% in 24h`,
        customName: `🐂 ${token.symbol} Rally!`,
        customDescription: `${token.symbol} is pumping ${token.change24h.toFixed(1)}% today!`,
      });
    }

    // Bear market trigger: Major tokens down significantly
    if ((token.symbol === 'BTC' || token.symbol === 'ETH') && token.change24h <= -threshold) {
      triggers.push({
        type: 'bear_market',
        probability: Math.min(0.7, Math.abs(token.change24h) / 25),
        affectedChains: token.symbol === 'ETH' ? ['ethereum'] : ['bitcoin'],
        source: `${token.symbol} down ${Math.abs(token.change24h).toFixed(1)}% in 24h`,
        customName: `🐻 ${token.symbol} Dump!`,
        customDescription: `${token.symbol} is down ${Math.abs(token.change24h).toFixed(1)}% today!`,
      });
    }

    // Whale entry trigger: SOL or other alts pumping hard
    if (['SOL', 'ARB', 'OP', 'AVAX'].includes(token.symbol) && token.change24h >= threshold * 1.5) {
      triggers.push({
        type: 'whale_entry',
        probability: 0.4,
        affectedChains: [getChainFromSymbol(token.symbol)],
        source: `${token.symbol} up ${token.change24h.toFixed(1)}%`,
        customName: `🐋 ${token.symbol} Whale Alert!`,
        customDescription: `Big money flowing into ${token.symbol}!`,
      });
    }
  }

  return triggers;
}

/**
 * Map token symbol to chain
 */
function getChainFromSymbol(symbol: string): CryptoChain {
  const map: Record<string, CryptoChain> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    SOL: 'solana',
    ARB: 'arbitrum',
    OP: 'optimism',
    AVAX: 'avalanche',
    MATIC: 'polygon',
    BNB: 'bnb',
    SUI: 'sui',
    APT: 'aptos',
  };
  return map[symbol] || 'ethereum';
}

/**
 * Generate triggers from news items
 */
function generateNewsTriggers(newsData: NewsData): EventTrigger[] {
  const triggers: EventTrigger[] = [];
  const baseProbability = BLENDER_CONFIG.NEWS_EVENT_PROBABILITY;

  for (const item of newsData.items) {
    const headline = item.headline.toLowerCase();
    const summary = item.summary.toLowerCase();
    const combined = `${headline} ${summary}`;

    // Hack/exploit news
    if (combined.includes('hack') || combined.includes('exploit') || combined.includes('drained')) {
      triggers.push({
        type: 'hack',
        probability: baseProbability * item.impactLevel / 5,
        affectedChains: item.relevantChains,
        source: item.source,
        customName: `🔓 ${item.headline}`,
        customDescription: item.summary,
      });
    }

    // Rug pull news
    if (combined.includes('rug') || combined.includes('scam') || combined.includes('exit')) {
      triggers.push({
        type: 'rug_pull',
        probability: baseProbability * 0.5, // Lower prob, high impact
        affectedChains: item.relevantChains,
        source: item.source,
        customName: `🔴 ${item.headline}`,
        customDescription: item.summary,
      });
    }

    // Airdrop news
    if (combined.includes('airdrop') || combined.includes('token claim') || combined.includes('snapshot')) {
      triggers.push({
        type: 'airdrop',
        probability: baseProbability * 1.2,
        affectedChains: item.relevantChains,
        source: item.source,
        customName: `🪂 ${item.headline}`,
        customDescription: item.summary,
      });
    }

    // Protocol upgrade
    if (combined.includes('upgrade') || combined.includes('v2') || combined.includes('launch')) {
      triggers.push({
        type: 'protocol_upgrade',
        probability: baseProbability * 0.8,
        affectedChains: item.relevantChains,
        source: item.source,
        customName: `⬆️ ${item.headline}`,
        customDescription: item.summary,
      });
    }

    // Regulatory FUD
    if (combined.includes('sec') || combined.includes('regulation') || combined.includes('lawsuit')) {
      triggers.push({
        type: 'regulatory_fud',
        probability: baseProbability * item.impactLevel / 5,
        affectedChains: item.relevantChains,
        source: item.source,
        customName: `⚖️ ${item.headline}`,
        customDescription: item.summary,
      });
    }
  }

  return triggers;
}

/**
 * Generate triggers from sentiment extremes
 */
function generateSentimentTriggers(fgData: FearGreedData): EventTrigger[] {
  const triggers: EventTrigger[] = [];

  // Extreme greed -> potential bull run
  if (fgData.value >= 80) {
    triggers.push({
      type: 'bull_run',
      probability: 0.3,
      affectedChains: [],
      source: 'Fear & Greed Index at Extreme Greed',
      customName: '🚀 Extreme Greed Activated!',
      customDescription: 'The market is euphoric. Moon soon?',
    });
  }

  // Extreme fear -> potential bear market
  if (fgData.value <= 20) {
    triggers.push({
      type: 'bear_market',
      probability: 0.3,
      affectedChains: [],
      source: 'Fear & Greed Index at Extreme Fear',
      customName: '❄️ Extreme Fear Detected!',
      customDescription: 'Panic in the markets. Diamond hands time?',
    });
  }

  // Sentiment reversal (big change from previous)
  const change = fgData.value - fgData.previousValue;
  if (Math.abs(change) >= 15) {
    if (change > 0) {
      triggers.push({
        type: 'whale_entry',
        probability: 0.25,
        affectedChains: [],
        source: 'Market sentiment shifting rapidly',
        customName: '📈 Sentiment Reversal!',
        customDescription: `Fear & Greed jumped ${change} points!`,
      });
    }
  }

  return triggers;
}

/**
 * Mark an event type as recently triggered (to prevent spam)
 */
export function markEventTriggered(type: CryptoEventType): void {
  blenderState.recentEventTypes.add(type);
  
  // Clear after 5 minutes
  setTimeout(() => {
    blenderState.recentEventTypes.delete(type);
  }, 5 * 60 * 1000);
}

// =============================================================================
// TICKER ITEMS
// =============================================================================

/**
 * Generate news ticker items from all data sources
 * 
 * @param realData - Real-world data from APIs
 * @returns Array of ticker items
 */
export function generateTickerItems(
  realData: RealWorldCryptoData
): TickerItem[] {
  const items: TickerItem[] = [];

  // Add news items
  if (realData.news?.data.items) {
    for (const news of realData.news.data.items.slice(0, 5)) {
      items.push(createNewsTickerItem(news));
    }
  }

  // Add tweets
  if (realData.twitter?.data.tweets) {
    for (const tweet of realData.twitter.data.tweets.slice(0, 5)) {
      items.push(createTweetTickerItem(tweet));
    }
  }

  // Add price alerts for significant movers
  if (realData.prices?.data.tokens) {
    const priceAlerts = createPriceTickerItems(realData.prices.data);
    items.push(...priceAlerts);
  }

  // Sort by timestamp (newest first) and dedupe
  items.sort((a, b) => b.timestamp - a.timestamp);

  return items;
}

/**
 * Create ticker item from news
 */
function createNewsTickerItem(news: CryptoNewsItem): TickerItem {
  const emoji = news.sentiment === 'positive' ? '📈' : 
                news.sentiment === 'negative' ? '📉' : '📰';
  
  return {
    id: news.id,
    text: `${emoji} ${news.headline} — ${news.source}`,
    type: 'news',
    sentiment: news.sentiment,
    source: news.source,
    timestamp: news.publishedAt,
    meta: {
      url: news.url,
    },
  };
}

/**
 * Create ticker item from tweet
 */
function createTweetTickerItem(tweet: CTTweet): TickerItem {
  // Truncate long tweets
  const maxLength = 120;
  let content = tweet.content;
  if (content.length > maxLength) {
    content = content.substring(0, maxLength - 3) + '...';
  }

  const sentiment = tweet.sentiment === 'bullish' ? 'positive' :
                    tweet.sentiment === 'bearish' ? 'negative' : 'neutral';

  return {
    id: tweet.id,
    text: `🐦 @${tweet.handle}: ${content}`,
    type: 'tweet',
    sentiment,
    source: 'Twitter',
    timestamp: tweet.createdAt,
    meta: {
      handle: tweet.handle,
    },
  };
}

/**
 * Create ticker items for significant price movements
 */
function createPriceTickerItems(priceData: PriceData): TickerItem[] {
  const items: TickerItem[] = [];
  const threshold = 5; // 5% threshold for ticker

  for (const token of Object.values(priceData.tokens)) {
    if (Math.abs(token.change24h) >= threshold) {
      const isUp = token.change24h > 0;
      const emoji = isUp ? '🟢' : '🔴';
      const direction = isUp ? '+' : '';
      
      items.push({
        id: generateId(),
        text: `${emoji} ${token.symbol}: $${token.priceUsd.toLocaleString()} (${direction}${token.change24h.toFixed(1)}%)`,
        type: 'price',
        sentiment: isUp ? 'positive' : 'negative',
        timestamp: Date.now(),
        meta: {
          priceChange: token.change24h,
        },
      });
    }
  }

  return items.slice(0, 3); // Limit to top 3 movers
}

// =============================================================================
// MAIN BLEND FUNCTION
// =============================================================================

/**
 * Blend all real-world data into game-compatible effects
 * This is the main function called by the game integration
 * 
 * @param realData - Real-world data from APIs
 * @param simulatedSentiment - Current simulated sentiment from game
 * @returns Complete blended game data
 */
export function blendRealityData(
  realData: RealWorldCryptoData,
  simulatedSentiment: number = 0
): BlendedGameData {
  return {
    sentiment: blendSentiment(realData, simulatedSentiment),
    yields: calculateYieldAdjustment(realData),
    eventTriggers: generateEventTriggers(realData),
    tickerItems: generateTickerItems(realData),
    dataStatus: {
      isOnline: realData.isOnline,
      lastSync: realData.lastSync,
      staleness: realData.staleness,
      hasAnyData: realData.isComplete || !!(realData.prices || realData.fearGreed),
    },
  };
}

/**
 * Reset blender state (useful for testing or new game)
 */
export function resetBlenderState(): void {
  blenderState.previousSentiment = 0;
  blenderState.previousYieldMultiplier = 1.0;
  blenderState.recentEventTypes.clear();
  blenderState.lastPrices = {};
}

