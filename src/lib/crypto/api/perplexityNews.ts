/**
 * Perplexity AI News Integration
 * 
 * Fetches real-time crypto news using Perplexity's Sonar API.
 * Maps news to game events with sardonic, Hitchhiker's Guide-style commentary.
 * 
 * "The crypto market is a lot like the Restaurant at the End of the Universe -
 * everyone's convinced they know what's happening, but nobody actually does."
 */

import type { TickerItem } from '../types';
import type { CryptoEvent, CryptoEventType } from '../../../games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

interface PerplexitySearchResult {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

interface PerplexitySearchResponse {
  results: PerplexitySearchResult[];
  id: string;
}

interface NewsToEventMapping {
  keywords: string[];
  eventType: CryptoEventType;
  sentiment: 'positive' | 'negative' | 'neutral';
  sardonicTemplates: string[];
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/search';

// News-to-event mappings with sardonic commentary templates
const NEWS_EVENT_MAPPINGS: NewsToEventMapping[] = [
  {
    keywords: ['all-time high', 'ath', 'record high', 'new high', 'surge', 'soar', 'rally'],
    eventType: 'bull_run',
    sentiment: 'positive',
    sardonicTemplates: [
      "Number went up. Again. Shocking absolutely nobody who's been watching charts instead of sleeping.",
      "ATH achieved! Time for Twitter to pretend they called it all along.",
      "Markets surging. Your uncle who bought at the top in 2021 might actually break even.",
      "Bull run confirmed. Don't panic - just HODL and pretend you planned this.",
    ],
  },
  {
    keywords: ['crash', 'plunge', 'tumble', 'collapse', 'bear', 'dump', 'selloff', 'drop'],
    eventType: 'bear_market',
    sentiment: 'negative',
    sardonicTemplates: [
      "Markets are down. This is fine. Everything is fine. *nervous laughter*",
      "Red candles everywhere. Time to zoom out... way out... like, to 2009.",
      "Paper hands activate! Diamond hands pretend they're not crying.",
      "The dip has dipped. The dip's dip is also dipping. Dips all the way down.",
    ],
  },
  {
    keywords: ['hack', 'exploit', 'breach', 'stolen', 'drained', 'attack'],
    eventType: 'hack',
    sentiment: 'negative',
    sardonicTemplates: [
      "Another protocol got hacked. SAFU? More like SORRY-FU.",
      "Funds are not SAFU. Shocked Pikachu face intensifies.",
      "Smart contracts doing dumb things again. Code is law, but law is breakable.",
      "Security incident detected. Translation: Someone's having a very bad day.",
    ],
  },
  {
    keywords: ['airdrop', 'token distribution', 'claim', 'free tokens'],
    eventType: 'airdrop',
    sentiment: 'positive',
    sardonicTemplates: [
      "Free money! (Terms and Vesting Schedules may apply for 4 years)",
      "Airdrop incoming! Time to pretend you've been using this protocol all along.",
      "Tokens from the sky! Your 47 testnet transactions finally paying off.",
      "Congratulations on your airdrop! Now enjoy explaining it to the tax man.",
    ],
  },
  {
    keywords: ['rug pull', 'rug', 'scam', 'fraud', 'ponzi', 'exit scam'],
    eventType: 'rug_pull',
    sentiment: 'negative',
    sardonicTemplates: [
      "Another project rugged. The 420x gains were too good to be true. Who knew?",
      "Rug pulled! At least the Discord had great memes while it lasted.",
      "Team went on 'vacation'. With all the liquidity. Very relaxing.",
      "DYOR they said. DYOR is hard when developers are anonymous cartoon animals.",
    ],
  },
  {
    keywords: ['whale', 'large transfer', 'big buy', 'accumulation', 'massive purchase'],
    eventType: 'whale_entry',
    sentiment: 'positive',
    sardonicTemplates: [
      "Whale alert! Someone's moving more money than your entire net worth.",
      "Big fish entering the pond. Hope you're not the plankton.",
      "Institutional money flowing in. Bullish for 'decentralization'.",
      "A wild whale appears! It uses Buy The Dip. It's super effective!",
    ],
  },
  {
    keywords: ['sec', 'regulation', 'lawsuit', 'enforcement', 'ban', 'illegal'],
    eventType: 'regulatory_fud',
    sentiment: 'negative',
    sardonicTemplates: [
      "Regulators gonna regulate. Time for the 'we're not a security' dance.",
      "SEC enters chat. Everyone suddenly develops amnesia about their token sale.",
      "New regulations incoming. Compliance teams in shambles. Lawyers rejoicing.",
      "The government has opinions about your magic internet money. How quaint.",
    ],
  },
  {
    keywords: ['upgrade', 'launch', 'mainnet', 'v2', 'new version', 'release'],
    eventType: 'protocol_upgrade',
    sentiment: 'positive',
    sardonicTemplates: [
      "Protocol upgrade successful! The previous bugs are now features.",
      "V2 is live! Same protocol, now with 50% more governance tokens.",
      "Mainnet launch! Time for the 'real' FUD to begin.",
      "New version deployed. 'This time it's different' says everyone, again.",
    ],
  },
  {
    keywords: ['liquidation', 'margin call', 'leverage', 'liquidated', 'wrecked'],
    eventType: 'liquidation_cascade',
    sentiment: 'negative',
    sardonicTemplates: [
      "Liquidation cascade! 100x leverage was maybe not the move.",
      "Longs liquidated. Somewhere, a degen is explaining to their spouse.",
      "Margin calls answered. The exchange sends its regards.",
      "Leverage traders finding out why Vitalik tweeted 'don't use leverage'.",
    ],
  },
  {
    keywords: ['halving', 'bitcoin halving', 'block reward'],
    eventType: 'halving',
    sentiment: 'positive',
    sardonicTemplates: [
      "Halving complete! Mining rewards cut in half, hopium doubled.",
      "The halving happened. Stock-to-flow believers emerging from caves.",
      "Block rewards reduced. Miners now need to be 'extra efficient'.",
      "Satoshi's gift keeps giving... less and less, technically.",
    ],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get sardonic commentary for a news item
 */
function getSardonicCommentary(mapping: NewsToEventMapping): string {
  const templates = mapping.sardonicTemplates;
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Detect which event type a news headline/snippet matches
 */
function detectEventType(text: string): NewsToEventMapping | null {
  const lowerText = text.toLowerCase();
  
  for (const mapping of NEWS_EVENT_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return mapping;
      }
    }
  }
  
  return null;
}

/**
 * Format news result as a ticker item with sardonic flair
 */
function formatAsTickerItem(
  result: PerplexitySearchResult,
  mapping: NewsToEventMapping | null
): TickerItem {
  const id = `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // If we matched an event type, use sardonic commentary
  if (mapping) {
    return {
      id,
      type: 'news',
      text: getSardonicCommentary(mapping),
      sentiment: mapping.sentiment,
      source: 'CT Oracle',
      timestamp: Date.now(),
    };
  }
  
  // Otherwise, add light sardonic framing to the original title
  const sardonicPrefixes = [
    'Breaking (we think): ',
    'ICYMI (you probably did): ',
    'Sources say (trust us bro): ',
    'Hot take: ',
    'Plot twist: ',
    'In case you care: ',
  ];
  
  const prefix = sardonicPrefixes[Math.floor(Math.random() * sardonicPrefixes.length)];
  
  return {
    id,
    type: 'news',
    text: prefix + result.title,
    sentiment: 'neutral',
    source: 'Crypto Wire',
    timestamp: Date.now(),
  };
}

// =============================================================================
// MAIN API FUNCTIONS
// =============================================================================

/**
 * Fetch crypto news from Perplexity API
 */
export async function fetchCryptoNews(options: {
  maxResults?: number;
  queries?: string[];
} = {}): Promise<{
  tickerItems: TickerItem[];
  events: Partial<CryptoEvent>[];
  raw: PerplexitySearchResult[];
}> {
  const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.warn('Perplexity API key not found. Using simulated news.');
    return generateSimulatedNews();
  }
  
  const maxResults = options.maxResults || 10;
  const queries = options.queries || [
    'cryptocurrency news today',
    'bitcoin ethereum price movement',
    'DeFi protocol updates',
    'crypto twitter drama',
  ];
  
  try {
    const results: PerplexitySearchResult[] = [];
    
    // Fetch news for each query
    for (const query of queries) {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          max_results: Math.ceil(maxResults / queries.length),
          search_domain_filter: [
            'coindesk.com',
            'cointelegraph.com',
            'theblock.co',
            'decrypt.co',
            'cryptoslate.com',
          ],
        }),
      });
      
      if (!response.ok) {
        console.error(`Perplexity API error: ${response.status}`);
        continue;
      }
      
      const data: PerplexitySearchResponse = await response.json();
      results.push(...data.results);
    }
    
    // Process results
    const tickerItems: TickerItem[] = [];
    const events: Partial<CryptoEvent>[] = [];
    
    for (const result of results) {
      const combinedText = `${result.title} ${result.snippet}`;
      const mapping = detectEventType(combinedText);
      
      // Add as ticker item
      tickerItems.push(formatAsTickerItem(result, mapping));
      
      // If matched an event type, create a potential game event
      if (mapping) {
        events.push({
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: mapping.eventType,
          name: result.title.substring(0, 50),
          description: getSardonicCommentary(mapping),
          icon: getEventIcon(mapping.eventType),
          magnitude: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
          active: true,
        });
      }
    }
    
    return { tickerItems, events, raw: results };
    
  } catch (error) {
    console.error('Failed to fetch crypto news:', error);
    return generateSimulatedNews();
  }
}

/**
 * Get icon for event type
 */
function getEventIcon(type: CryptoEventType): string {
  const icons: Record<CryptoEventType, string> = {
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
  return icons[type] || '📰';
}

/**
 * Generate simulated news when API is unavailable
 * These are sardonic, Hitchhiker's Guide-style headlines
 */
function generateSimulatedNews(): {
  tickerItems: TickerItem[];
  events: Partial<CryptoEvent>[];
  raw: PerplexitySearchResult[];
} {
  const simulatedHeadlines = [
    {
      text: "BTC consolidating at levels that 'experts' definitely predicted",
      sentiment: 'neutral' as const,
    },
    {
      text: "New memecoin promises 'revolutionary' technology. Source: trust me bro",
      sentiment: 'neutral' as const,
    },
    {
      text: "ETH gas fees briefly affordable. Users in disbelief.",
      sentiment: 'positive' as const,
    },
    {
      text: "Influencer calls bottom. Again. For the 47th time this month.",
      sentiment: 'neutral' as const,
    },
    {
      text: "DeFi protocol announces governance token. Democracy has never been so... tokenized.",
      sentiment: 'neutral' as const,
    },
    {
      text: "Whale moves $500M. Twitter analysts have 500M theories.",
      sentiment: 'neutral' as const,
    },
    {
      text: "NFT market showing 'signs of life' say people holding many NFTs",
      sentiment: 'neutral' as const,
    },
    {
      text: "Layer 2 adoption growing. Layer 1 fees remain astronomical. Balance achieved.",
      sentiment: 'positive' as const,
    },
    {
      text: "Crypto Twitter has opinions about thing. Other opinions disagree.",
      sentiment: 'neutral' as const,
    },
    {
      text: "New stablecoin claims to be 'fully backed'. No further questions please.",
      sentiment: 'neutral' as const,
    },
    {
      text: "Vitalik tweets something. Interpretation varies wildly.",
      sentiment: 'neutral' as const,
    },
    {
      text: "Altseason imminent say people holding altcoins. Film at 11.",
      sentiment: 'positive' as const,
    },
    {
      text: "Exchange promises 'proof of reserves'. Pinky swear included.",
      sentiment: 'neutral' as const,
    },
    {
      text: "Market moves sideways. Analysts call it 'accumulation' or 'distribution' depending on bags.",
      sentiment: 'neutral' as const,
    },
    {
      text: "Your favorite protocol's TVL changed by 0.3%. This means everything. Or nothing.",
      sentiment: 'neutral' as const,
    },
  ];
  
  const tickerItems: TickerItem[] = simulatedHeadlines.map((headline, i) => ({
    id: `sim-${Date.now()}-${i}`,
    type: 'news',
    text: headline.text,
    sentiment: headline.sentiment,
    source: 'CT Oracle (Sim)',
    timestamp: Date.now(),
  }));
  
  return {
    tickerItems: tickerItems.slice(0, 10),
    events: [],
    raw: [],
  };
}

/**
 * Fetch news and trigger game events based on real-world happenings
 * Call this periodically (e.g., every 5-15 minutes)
 */
export async function syncNewsToGameEvents(options: {
  onNewEvent?: (event: Partial<CryptoEvent>) => void;
  onTickerUpdate?: (items: TickerItem[]) => void;
} = {}): Promise<void> {
  const { tickerItems, events } = await fetchCryptoNews();
  
  if (options.onTickerUpdate && tickerItems.length > 0) {
    options.onTickerUpdate(tickerItems);
  }
  
  if (options.onNewEvent) {
    for (const event of events) {
      // Only trigger significant events (random chance to avoid spam)
      if (Math.random() < 0.3) {
        options.onNewEvent(event);
      }
    }
  }
}

/**
 * Check if Perplexity API is available
 */
export async function checkPerplexityHealth(): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY;
  // Return true if we have an API key, false otherwise (simulated mode)
  return Boolean(apiKey);
}

const perplexityNewsAPI = {
  fetchCryptoNews,
  syncNewsToGameEvents,
  generateSimulatedNews,
  checkPerplexityHealth,
};

export default perplexityNewsAPI;
