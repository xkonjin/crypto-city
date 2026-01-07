/**
 * =============================================================================
 * COINGECKO API CLIENT
 * =============================================================================
 * Fetches token price and market data from CoinGecko.
 * 
 * CoinGecko is a comprehensive crypto data platform.
 * Free tier: 30 requests/minute
 * Pro tier: 500 requests/minute (with API key)
 * 
 * Data fetched:
 * - Token prices in USD
 * - 24h/7d price changes
 * - Market caps
 * - Trading volumes
 * - Global market data (BTC dominance, total market cap)
 * 
 * API Docs: https://www.coingecko.com/api/documentation
 */

import {
  getCoinGeckoBaseUrl,
  COINGECKO_API,
  COINGECKO_API_KEY,
  TRACKED_TOKEN_IDS,
  TRACKED_TOKENS,
  FEATURES,
} from '../config';
import { PriceData, TokenPrice } from '../cache/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Raw coin market data from CoinGecko /coins/markets endpoint
 */
interface RawCoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

/**
 * Raw global market data from CoinGecko /global endpoint
 */
interface RawGlobalData {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

// =============================================================================
// API HELPERS
// =============================================================================

/**
 * Build request headers with optional API key
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };

  // Add API key header if available (for Pro tier)
  if (COINGECKO_API_KEY) {
    headers['x-cg-pro-api-key'] = COINGECKO_API_KEY;
  }

  return headers;
}

/**
 * Add delay to respect rate limits
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch market data for tracked tokens
 * 
 * @returns Array of token market data
 */
async function fetchCoinMarkets(): Promise<RawCoinMarket[]> {
  const baseUrl = getCoinGeckoBaseUrl();
  
  // Build URL with query parameters
  const params = new URLSearchParams({
    vs_currency: 'usd',
    ids: TRACKED_TOKEN_IDS,
    order: 'market_cap_desc',
    per_page: '100',
    page: '1',
    sparkline: 'false',
    price_change_percentage: '24h,7d',
  });

  const url = `${baseUrl}${COINGECKO_API.COINS_MARKETS}?${params}`;

  try {
    const response = await fetch(url, { headers: getHeaders() });

    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 429) {
        console.warn('[CoinGecko] Rate limited, waiting...');
        await delay(60000); // Wait 1 minute
        throw new Error('Rate limited');
      }
      throw new Error(`CoinGecko markets API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[CoinGecko] Failed to fetch markets:', error);
    throw error;
  }
}

/**
 * Fetch global market data
 * 
 * @returns Global crypto market stats
 */
async function fetchGlobalData(): Promise<RawGlobalData> {
  const baseUrl = getCoinGeckoBaseUrl();
  const url = `${baseUrl}${COINGECKO_API.GLOBAL}`;

  try {
    const response = await fetch(url, { headers: getHeaders() });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[CoinGecko] Rate limited on global data');
        throw new Error('Rate limited');
      }
      throw new Error(`CoinGecko global API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[CoinGecko] Failed to fetch global data:', error);
    throw error;
  }
}

/**
 * Transform raw market data to our TokenPrice format
 */
function transformMarketData(raw: RawCoinMarket): TokenPrice {
  return {
    symbol: TRACKED_TOKENS[raw.id] || raw.symbol.toUpperCase(),
    id: raw.id,
    priceUsd: raw.current_price,
    change24h: raw.price_change_percentage_24h || 0,
    change7d: raw.price_change_percentage_7d_in_currency || 0,
    marketCap: raw.market_cap,
    volume24h: raw.total_volume,
  };
}

// =============================================================================
// MAIN FETCH FUNCTION
// =============================================================================

/**
 * Fetch all CoinGecko price data
 * This is the main function called by the data sync layer
 * 
 * @returns Complete price data for caching
 */
export async function fetchCoinGeckoData(): Promise<PriceData> {
  if (!FEATURES.ENABLE_PRICES) {
    throw new Error('Price fetching is disabled');
  }

  console.log('[CoinGecko] Fetching data...');
  const startTime = Date.now();

  // Fetch market data and global data in parallel
  // Add small delay between to be nice to free tier
  const [marketsData, globalData] = await Promise.all([
    fetchCoinMarkets(),
    delay(500).then(() => fetchGlobalData()),
  ]);

  // Transform market data to our format
  const tokens: Record<string, TokenPrice> = {};
  for (const coin of marketsData) {
    const tokenPrice = transformMarketData(coin);
    tokens[tokenPrice.symbol] = tokenPrice;
  }

  // Extract global stats
  const btcDominance = globalData.data.market_cap_percentage['btc'] || 0;
  const totalMarketCap = globalData.data.total_market_cap['usd'] || 0;

  const elapsed = Date.now() - startTime;
  console.log(`[CoinGecko] Fetched in ${elapsed}ms: ${Object.keys(tokens).length} tokens`);

  return {
    tokens,
    btcDominance,
    totalMarketCap,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get price for a specific token symbol
 */
export function getTokenPrice(data: PriceData, symbol: string): TokenPrice | undefined {
  return data.tokens[symbol.toUpperCase()];
}

/**
 * Get BTC price specifically (commonly needed)
 */
export function getBtcPrice(data: PriceData): number {
  return data.tokens['BTC']?.priceUsd || 0;
}

/**
 * Get ETH price specifically (commonly needed)
 */
export function getEthPrice(data: PriceData): number {
  return data.tokens['ETH']?.priceUsd || 0;
}

/**
 * Calculate portfolio value from token amounts
 */
export function calculatePortfolioValue(
  data: PriceData,
  holdings: Record<string, number>
): number {
  let total = 0;
  for (const [symbol, amount] of Object.entries(holdings)) {
    const price = data.tokens[symbol]?.priceUsd || 0;
    total += price * amount;
  }
  return total;
}

/**
 * Get tokens with significant price movement (for event triggering)
 * 
 * @param data - Price data
 * @param threshold - Minimum absolute percentage change to consider significant
 * @returns Tokens with significant 24h moves
 */
export function getSignificantMovers(
  data: PriceData,
  threshold = 10
): { gainers: TokenPrice[]; losers: TokenPrice[] } {
  const allTokens = Object.values(data.tokens);
  
  const gainers = allTokens
    .filter(t => t.change24h >= threshold)
    .sort((a, b) => b.change24h - a.change24h);
    
  const losers = allTokens
    .filter(t => t.change24h <= -threshold)
    .sort((a, b) => a.change24h - b.change24h);

  return { gainers, losers };
}

/**
 * Get average market change (for overall sentiment)
 */
export function getAverageMarketChange(data: PriceData): number {
  const tokens = Object.values(data.tokens);
  if (tokens.length === 0) return 0;
  
  const totalChange = tokens.reduce((sum, t) => sum + t.change24h, 0);
  return totalChange / tokens.length;
}

/**
 * Check if CoinGecko API is accessible
 */
export async function checkCoinGeckoHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getCoinGeckoBaseUrl()}/ping`, {
      headers: getHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}

