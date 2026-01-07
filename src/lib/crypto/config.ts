/**
 * =============================================================================
 * CRYPTO API CONFIGURATION
 * =============================================================================
 * Centralized configuration for all external API connections.
 * 
 * API keys are loaded from environment variables for security.
 * Rate limits and endpoints are defined here for easy maintenance.
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_PERPLEXITY_API_KEY: For AI-powered news fetching
 * - NEXT_PUBLIC_TWITTER_BEARER_TOKEN: For Twitter/X API access
 * - NEXT_PUBLIC_COINGECKO_API_KEY: (Optional) For higher rate limits
 */

// =============================================================================
// API KEYS (from environment)
// =============================================================================

/**
 * Perplexity API key for AI-powered news summarization
 * Required for news fetching functionality
 */
export const PERPLEXITY_API_KEY = 
  typeof process !== 'undefined' 
    ? process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || ''
    : '';

/**
 * Twitter/X API Bearer token for CT tweet fetching
 * Required for Twitter integration
 * Note: Twitter API Basic tier costs ~$100/month
 */
export const TWITTER_BEARER_TOKEN = 
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_TWITTER_BEARER_TOKEN || ''
    : '';

/**
 * CoinGecko API key for higher rate limits
 * Optional - the free tier works but has lower rate limits
 */
export const COINGECKO_API_KEY = 
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_COINGECKO_API_KEY || ''
    : '';

// =============================================================================
// API ENDPOINTS
// =============================================================================

/**
 * DeFi Llama API endpoints (free, no auth required)
 */
export const DEFILLAMA_API = {
  /** Base URL for DeFi Llama API */
  BASE_URL: 'https://api.llama.fi',
  /** Protocol TVL data */
  PROTOCOLS: '/protocols',
  /** TVL by chain */
  CHAINS: '/v2/chains',
  /** Yield pools */
  YIELDS: 'https://yields.llama.fi/pools',
} as const;

/**
 * CoinGecko API endpoints
 */
export const COINGECKO_API = {
  /** Base URL (free tier) */
  BASE_URL: 'https://api.coingecko.com/api/v3',
  /** Pro API base URL (with API key) */
  PRO_BASE_URL: 'https://pro-api.coingecko.com/api/v3',
  /** Get prices for multiple coins */
  SIMPLE_PRICE: '/simple/price',
  /** Get coin list with market data */
  COINS_MARKETS: '/coins/markets',
  /** Global market data */
  GLOBAL: '/global',
} as const;

/**
 * Fear & Greed Index API (alternative.me)
 */
export const FEAR_GREED_API = {
  /** Base URL */
  BASE_URL: 'https://api.alternative.me',
  /** Fear & Greed endpoint */
  FNG: '/fng/',
} as const;

/**
 * Perplexity AI API endpoints
 */
export const PERPLEXITY_API = {
  /** Base URL */
  BASE_URL: 'https://api.perplexity.ai',
  /** Chat completions endpoint */
  CHAT: '/chat/completions',
} as const;

/**
 * Twitter/X API v2 endpoints
 */
export const TWITTER_API = {
  /** Base URL */
  BASE_URL: 'https://api.twitter.com/2',
  /** Search recent tweets */
  SEARCH_RECENT: '/tweets/search/recent',
  /** Get tweets by user ID */
  USER_TWEETS: '/users/:id/tweets',
  /** Get user by username */
  USER_BY_USERNAME: '/users/by/username/:username',
} as const;

// =============================================================================
// RATE LIMITS
// =============================================================================

/**
 * Rate limit configuration (requests per minute)
 */
export const RATE_LIMITS = {
  /** CoinGecko free tier: 30 requests/minute */
  COINGECKO_FREE: 30,
  /** CoinGecko pro tier: 500 requests/minute */
  COINGECKO_PRO: 500,
  /** DeFi Llama: Very generous, effectively unlimited for our use */
  DEFILLAMA: 300,
  /** Fear & Greed: No explicit limit, be nice (~60/min) */
  FEAR_GREED: 60,
  /** Perplexity: Depends on plan, default to conservative */
  PERPLEXITY: 60,
  /** Twitter Basic: ~10k tweets/month total */
  TWITTER: 100, // Be conservative
} as const;

// =============================================================================
// REFRESH INTERVALS
// =============================================================================

/**
 * How often to poll each API (in milliseconds)
 * These are minimum intervals - actual polling may be slower
 */
export const REFRESH_INTERVALS = {
  /** Price data: every 1 minute */
  PRICES: 60 * 1000,
  /** DeFi TVL/yields: every 5 minutes */
  DEFI: 5 * 60 * 1000,
  /** Fear & Greed: every 10 minutes (updates once daily anyway) */
  FEAR_GREED: 10 * 60 * 1000,
  /** News: every 10 minutes */
  NEWS: 10 * 60 * 1000,
  /** Twitter: every 5 minutes */
  TWITTER: 5 * 60 * 1000,
} as const;

// =============================================================================
// TRACKED TOKENS
// =============================================================================

/**
 * Tokens to track for price data
 * CoinGecko IDs mapped to display symbols
 */
export const TRACKED_TOKENS: Record<string, string> = {
  // Major coins
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  
  // Layer 2s
  'arbitrum': 'ARB',
  'optimism': 'OP',
  'polygon-ecosystem-token': 'POL',
  'base': 'BASE', // Note: BASE token may not exist yet
  
  // DeFi blue chips
  'uniswap': 'UNI',
  'aave': 'AAVE',
  'maker': 'MKR',
  'curve-dao-token': 'CRV',
  'lido-dao': 'LDO',
  'compound-governance-token': 'COMP',
  
  // Infrastructure
  'chainlink': 'LINK',
  'the-graph': 'GRT',
  
  // Stablecoins (for reference)
  'tether': 'USDT',
  'usd-coin': 'USDC',
  'dai': 'DAI',
  'ethena-usde': 'USDe',
  
  // Other notable
  'avalanche-2': 'AVAX',
  'bnb': 'BNB',
  'sui': 'SUI',
  'aptos': 'APT',
} as const;

/**
 * CoinGecko IDs as a comma-separated string for API calls
 */
export const TRACKED_TOKEN_IDS = Object.keys(TRACKED_TOKENS).join(',');

// =============================================================================
// CT (CRYPTO TWITTER) ACCOUNTS
// =============================================================================

/**
 * Curated list of Crypto Twitter accounts to follow
 * These are influential voices whose tweets affect the game
 */
export const CT_ACCOUNTS = [
  // Founders & Builders
  { handle: 'VitalikButerin', name: 'Vitalik Buterin', category: 'founder' },
  { handle: 'caborek', name: 'Hayden Adams', category: 'founder' },
  { handle: 'StaniKulechov', name: 'Stani Kulechov', category: 'founder' },
  { handle: 'rleshner', name: 'Robert Leshner', category: 'founder' },
  
  // Analysts & Researchers
  { handle: 'DefiIgnas', name: 'Ignas', category: 'analyst' },
  { handle: 'Route2FI', name: 'Route 2 FI', category: 'analyst' },
  { handle: 'theaborodinov', name: 'Anton Borodinov', category: 'analyst' },
  
  // Traders & Degens
  { handle: 'Ansem', name: 'Ansem', category: 'trader' },
  { handle: 'blknoiz06', name: 'Blknoiz06', category: 'trader' },
  { handle: 'CryptoHayes', name: 'Arthur Hayes', category: 'trader' },
  { handle: 'GiganticRebirth', name: 'GCR', category: 'trader' },
  
  // News & Alpha
  { handle: 'lookonchain', name: 'Lookonchain', category: 'news' },
  { handle: 'WuBlockchain', name: 'Wu Blockchain', category: 'news' },
  { handle: 'tier10k', name: 'Tier10k', category: 'news' },
  
  // Culture & Memes
  { handle: 'punk6529', name: 'punk6529', category: 'culture' },
  { handle: 'cobie', name: 'Cobie', category: 'culture' },
  { handle: 'CryptoCobain', name: 'Crypto Cobain', category: 'culture' },
] as const;

/**
 * Twitter handles as array for API queries
 */
export const CT_HANDLES = CT_ACCOUNTS.map(a => a.handle);

// =============================================================================
// REALITY BLENDER SETTINGS
// =============================================================================

/**
 * Configuration for how real-world data affects gameplay
 * These are the "knobs" for balancing the game
 */
export const BLENDER_CONFIG = {
  /**
   * Weight of real data vs simulated data (0-1)
   * 0 = fully simulated, 1 = fully real
   * Default 0.5 = 50/50 blend
   */
  REAL_DATA_WEIGHT: 0.5,

  /**
   * How fast sentiment changes (0-1)
   * Lower = smoother transitions, higher = more responsive
   */
  SENTIMENT_SMOOTHING: 0.1,

  /**
   * Minimum yield multiplier from real data
   * Prevents yields from going too low during crashes
   */
  YIELD_CLAMP_MIN: 0.5,

  /**
   * Maximum yield multiplier from real data
   * Prevents yields from going too high during pumps
   */
  YIELD_CLAMP_MAX: 1.5,

  /**
   * Price change threshold to trigger events (as decimal)
   * 0.1 = 10% change triggers event consideration
   */
  EVENT_TRIGGER_THRESHOLD: 0.1,

  /**
   * Minimum engagement for tweets to appear in ticker
   * Filters out low-quality content
   */
  MIN_TWEET_ENGAGEMENT: 100,

  /**
   * Maximum age for news items (in milliseconds)
   * News older than this won't trigger events
   */
  MAX_NEWS_AGE: 24 * 60 * 60 * 1000, // 24 hours

  /**
   * Probability multiplier for real-news-triggered events
   * Higher = more events from real news
   */
  NEWS_EVENT_PROBABILITY: 0.3,
} as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

/**
 * Feature flags for enabling/disabling real data sources
 * Useful for debugging or when APIs are unavailable
 */
export const FEATURES = {
  /** Enable CoinGecko price fetching */
  ENABLE_PRICES: true,
  /** Enable DeFi Llama data fetching */
  ENABLE_DEFI: true,
  /** Enable Fear & Greed index */
  ENABLE_FEAR_GREED: true,
  /** Enable Perplexity news */
  ENABLE_NEWS: !!PERPLEXITY_API_KEY,
  /** Enable Twitter/X integration */
  ENABLE_TWITTER: !!TWITTER_BEARER_TOKEN,
  /** Enable reality blending (false = pure simulation) */
  ENABLE_BLENDING: true,
  /** Show debug information in console */
  DEBUG_MODE: process.env.NODE_ENV === 'development',
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if all required API keys are configured
 */
export function checkApiKeysConfigured(): {
  perplexity: boolean;
  twitter: boolean;
  coingecko: boolean;
  allOptionalConfigured: boolean;
} {
  return {
    perplexity: !!PERPLEXITY_API_KEY,
    twitter: !!TWITTER_BEARER_TOKEN,
    coingecko: !!COINGECKO_API_KEY,
    allOptionalConfigured: !!PERPLEXITY_API_KEY && !!TWITTER_BEARER_TOKEN,
  };
}

/**
 * Get the appropriate CoinGecko base URL based on API key availability
 */
export function getCoinGeckoBaseUrl(): string {
  return COINGECKO_API_KEY 
    ? COINGECKO_API.PRO_BASE_URL 
    : COINGECKO_API.BASE_URL;
}

/**
 * Get rate limit for CoinGecko based on API key availability
 */
export function getCoinGeckoRateLimit(): number {
  return COINGECKO_API_KEY 
    ? RATE_LIMITS.COINGECKO_PRO 
    : RATE_LIMITS.COINGECKO_FREE;
}

