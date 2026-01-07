/**
 * =============================================================================
 * DEFI LLAMA API CLIENT
 * =============================================================================
 * Fetches TVL (Total Value Locked) and yield data from DeFi Llama.
 * 
 * DeFi Llama is a free, open-source DeFi analytics platform.
 * No API key required, generous rate limits.
 * 
 * Data fetched:
 * - Protocol TVL rankings
 * - TVL by blockchain
 * - DeFi yield pools
 * 
 * API Docs: https://defillama.com/docs/api
 */

import { DEFILLAMA_API, FEATURES } from '../config';
import { DefiLlamaData, ProtocolTVL, YieldPool } from '../cache/types';
import { CryptoChain } from '../../../games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Raw protocol response from DeFi Llama /protocols endpoint
 */
interface RawProtocol {
  id: string;
  name: string;
  slug: string;
  tvl: number;
  chainTvls: Record<string, number>;
  chain: string;
  chains: string[];
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  category: string;
  logo: string;
}

/**
 * Raw chain TVL response
 */
interface RawChainTVL {
  gecko_id: string;
  tvl: number;
  tokenSymbol: string;
  cmcId: string;
  name: string;
  chainId: number;
}

/**
 * Raw yield pool response from yields.llama.fi
 */
interface RawYieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number;
  rewardTokens: string[] | null;
  pool: string;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  poolMeta: string | null;
  underlyingTokens: string[] | null;
  il7d: number | null;
  apyBase7d: number | null;
  apyMean30d: number | null;
  volumeUsd1d: number | null;
  volumeUsd7d: number | null;
}

/**
 * Yield pools API response wrapper
 */
interface YieldPoolsResponse {
  status: string;
  data: RawYieldPool[];
}

// =============================================================================
// CHAIN MAPPING
// =============================================================================

/**
 * Map DeFi Llama chain names to our CryptoChain type
 * DeFi Llama uses various naming conventions, so we normalize them
 */
const CHAIN_MAP: Record<string, CryptoChain> = {
  'ethereum': 'ethereum',
  'Ethereum': 'ethereum',
  'solana': 'solana',
  'Solana': 'solana',
  'bitcoin': 'bitcoin',
  'Bitcoin': 'bitcoin',
  'arbitrum': 'arbitrum',
  'Arbitrum': 'arbitrum',
  'optimism': 'optimism',
  'Optimism': 'optimism',
  'polygon': 'polygon',
  'Polygon': 'polygon',
  'base': 'base',
  'Base': 'base',
  'avalanche': 'avalanche',
  'Avalanche': 'avalanche',
  'bsc': 'bnb',
  'BSC': 'bnb',
  'Binance': 'bnb',
  'sui': 'sui',
  'Sui': 'sui',
  'aptos': 'aptos',
  'Aptos': 'aptos',
  'zksync': 'zksync',
  'zkSync Era': 'zksync',
  'scroll': 'scroll',
  'Scroll': 'scroll',
  'linea': 'linea',
  'Linea': 'linea',
  'blast': 'blast',
  'Blast': 'blast',
  'mantle': 'mantle',
  'Mantle': 'mantle',
};

/**
 * Normalize chain name to our CryptoChain type
 */
function normalizeChain(chain: string): CryptoChain {
  return CHAIN_MAP[chain] || 'ethereum'; // Default to ethereum if unknown
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch top protocols by TVL from DeFi Llama
 * 
 * @param limit - Maximum number of protocols to return
 * @returns Array of protocol TVL data
 */
async function fetchProtocols(limit = 50): Promise<ProtocolTVL[]> {
  try {
    const response = await fetch(`${DEFILLAMA_API.BASE_URL}${DEFILLAMA_API.PROTOCOLS}`);
    
    if (!response.ok) {
      throw new Error(`DeFi Llama protocols API error: ${response.status}`);
    }

    const rawProtocols: RawProtocol[] = await response.json();

    // Sort by TVL descending and take top N
    const sortedProtocols = rawProtocols
      .filter(p => p.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);

    // Transform to our format
    return sortedProtocols.map(p => ({
      name: p.name,
      slug: p.slug,
      tvl: p.tvl,
      change24h: p.change_1d ?? 0,
      change7d: p.change_7d ?? 0,
      chain: normalizeChain(p.chain),
      category: p.category || 'Other',
    }));
  } catch (error) {
    console.error('[DefiLlama] Failed to fetch protocols:', error);
    throw error;
  }
}

/**
 * Fetch TVL by chain from DeFi Llama
 * 
 * @returns Map of chain name to TVL in USD
 */
async function fetchChainTVL(): Promise<Record<string, number>> {
  try {
    const response = await fetch(`${DEFILLAMA_API.BASE_URL}${DEFILLAMA_API.CHAINS}`);
    
    if (!response.ok) {
      throw new Error(`DeFi Llama chains API error: ${response.status}`);
    }

    const chains: RawChainTVL[] = await response.json();

    // Build chain -> TVL map, normalizing chain names
    const tvlByChain: Record<string, number> = {};
    
    for (const chain of chains) {
      const normalizedChain = normalizeChain(chain.name);
      // Accumulate if same normalized chain appears multiple times
      tvlByChain[normalizedChain] = (tvlByChain[normalizedChain] || 0) + chain.tvl;
    }

    return tvlByChain;
  } catch (error) {
    console.error('[DefiLlama] Failed to fetch chain TVL:', error);
    throw error;
  }
}

/**
 * Fetch top yield pools from DeFi Llama Yields API
 * 
 * @param limit - Maximum number of pools to return
 * @param minTvl - Minimum TVL to filter out small pools
 * @returns Array of yield pool data
 */
async function fetchYieldPools(limit = 100, minTvl = 1_000_000): Promise<YieldPool[]> {
  try {
    const response = await fetch(DEFILLAMA_API.YIELDS);
    
    if (!response.ok) {
      throw new Error(`DeFi Llama yields API error: ${response.status}`);
    }

    const result: YieldPoolsResponse = await response.json();

    if (result.status !== 'success' || !result.data) {
      throw new Error('Invalid yields response');
    }

    // Filter and sort pools
    const filteredPools = result.data
      .filter(p => p.tvlUsd >= minTvl && p.apy > 0 && p.apy < 1000) // Filter unrealistic APYs
      .sort((a, b) => b.tvlUsd - a.tvlUsd) // Sort by TVL
      .slice(0, limit);

    // Transform to our format
    return filteredPools.map(p => ({
      pool: p.pool,
      protocol: p.project,
      chain: normalizeChain(p.chain),
      symbol: p.symbol,
      apy: p.apy,
      apyBase: p.apyBase ?? 0,
      apyReward: p.apyReward ?? 0,
      tvlUsd: p.tvlUsd,
    }));
  } catch (error) {
    console.error('[DefiLlama] Failed to fetch yields:', error);
    throw error;
  }
}

/**
 * Calculate total TVL from protocol data
 */
function calculateTotalTvl(protocols: ProtocolTVL[]): number {
  return protocols.reduce((sum, p) => sum + p.tvl, 0);
}

// =============================================================================
// MAIN FETCH FUNCTION
// =============================================================================

/**
 * Fetch all DeFi Llama data in parallel
 * This is the main function called by the data sync layer
 * 
 * @returns Complete DeFi Llama data for caching
 */
export async function fetchDefiLlamaData(): Promise<DefiLlamaData> {
  if (!FEATURES.ENABLE_DEFI) {
    throw new Error('DeFi data fetching is disabled');
  }

  console.log('[DefiLlama] Fetching data...');
  const startTime = Date.now();

  // Fetch all data in parallel for speed
  const [protocols, tvlByChain, yields] = await Promise.all([
    fetchProtocols(50),
    fetchChainTVL(),
    fetchYieldPools(100),
  ]);

  const totalTvl = calculateTotalTvl(protocols);

  const elapsed = Date.now() - startTime;
  console.log(`[DefiLlama] Fetched in ${elapsed}ms: ${protocols.length} protocols, ${yields.length} pools`);

  return {
    protocols,
    yields,
    totalTvl,
    tvlByChain,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get protocol by name (case-insensitive)
 */
export function findProtocolByName(
  data: DefiLlamaData,
  name: string
): ProtocolTVL | undefined {
  const lowerName = name.toLowerCase();
  return data.protocols.find(p => p.name.toLowerCase() === lowerName);
}

/**
 * Get average APY for a specific chain
 */
export function getAverageApyByChain(
  data: DefiLlamaData,
  chain: CryptoChain
): number {
  const chainPools = data.yields.filter(y => y.chain === chain);
  if (chainPools.length === 0) return 0;
  
  const totalApy = chainPools.reduce((sum, p) => sum + p.apy, 0);
  return totalApy / chainPools.length;
}

/**
 * Get top protocols by category
 */
export function getProtocolsByCategory(
  data: DefiLlamaData,
  category: string
): ProtocolTVL[] {
  return data.protocols.filter(p => 
    p.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Check if DeFi Llama API is accessible
 */
export async function checkDefiLlamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${DEFILLAMA_API.BASE_URL}${DEFILLAMA_API.PROTOCOLS}`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

