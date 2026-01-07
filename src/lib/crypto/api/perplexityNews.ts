/**
 * =============================================================================
 * PERPLEXITY AI NEWS FETCHER
 * =============================================================================
 * Fetches and summarizes crypto news using Perplexity AI's API.
 * 
 * Perplexity AI is used to:
 * - Search for recent crypto news
 * - Summarize headlines
 * - Analyze sentiment
 * - Extract relevant chains/tokens mentioned
 * 
 * Requires API key (paid service).
 * Cost: ~$5-20/month depending on usage.
 * 
 * API Docs: https://docs.perplexity.ai/
 */

import { PERPLEXITY_API, PERPLEXITY_API_KEY, FEATURES, BLENDER_CONFIG } from '../config';
import { CryptoNewsItem, NewsData, NewsSentiment } from '../cache/types';
import { CryptoChain } from '../../../games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Perplexity API message format
 */
interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Perplexity API request body
 */
interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  return_citations?: boolean;
  search_domain_filter?: string[];
  return_images?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: 'month' | 'week' | 'day' | 'hour';
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

/**
 * Perplexity API response
 */
interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Parsed news item from AI response
 */
interface ParsedNewsItem {
  headline: string;
  summary: string;
  sentiment: NewsSentiment;
  chains: string[];
  source: string;
  impactLevel: number;
}

// =============================================================================
// CHAIN DETECTION
// =============================================================================

/**
 * Keywords to chain mapping for detecting mentions
 */
const CHAIN_KEYWORDS: Record<string, CryptoChain[]> = {
  // Ethereum ecosystem
  'ethereum': ['ethereum'],
  'eth': ['ethereum'],
  'erc-20': ['ethereum'],
  'erc20': ['ethereum'],
  'uniswap': ['ethereum'],
  'aave': ['ethereum'],
  'maker': ['ethereum'],
  'lido': ['ethereum'],
  
  // Solana
  'solana': ['solana'],
  'sol': ['solana'],
  'phantom': ['solana'],
  'jupiter': ['solana'],
  
  // Bitcoin
  'bitcoin': ['bitcoin'],
  'btc': ['bitcoin'],
  'lightning': ['bitcoin'],
  
  // Layer 2s
  'arbitrum': ['arbitrum'],
  'arb': ['arbitrum'],
  'optimism': ['optimism'],
  'op': ['optimism'],
  'base': ['base'],
  'polygon': ['polygon'],
  'matic': ['polygon'],
  'zksync': ['zksync'],
  'scroll': ['scroll'],
  'linea': ['linea'],
  'blast': ['blast'],
  'mantle': ['mantle'],
  
  // Other L1s
  'avalanche': ['avalanche'],
  'avax': ['avalanche'],
  'bnb': ['bnb'],
  'binance': ['bnb'],
  'bsc': ['bnb'],
  'sui': ['sui'],
  'aptos': ['aptos'],
  'apt': ['aptos'],
};

/**
 * Extract chains mentioned in text
 */
function extractChains(text: string): CryptoChain[] {
  const lowerText = text.toLowerCase();
  const chains = new Set<CryptoChain>();
  
  for (const [keyword, chainList] of Object.entries(CHAIN_KEYWORDS)) {
    // Check for word boundary to avoid false positives
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lowerText)) {
      chainList.forEach(chain => chains.add(chain));
    }
  }
  
  return Array.from(chains);
}

// =============================================================================
// PROMPT ENGINEERING
// =============================================================================

/**
 * System prompt for the AI
 */
const SYSTEM_PROMPT = `You are a crypto news analyst. Your job is to provide the latest cryptocurrency news in a structured JSON format.

For each news item, you must provide:
1. headline: A concise headline (max 100 characters)
2. summary: A brief summary (max 200 characters)
3. sentiment: One of "positive", "negative", or "neutral"
4. chains: Array of blockchain names mentioned (ethereum, solana, bitcoin, arbitrum, optimism, polygon, base, avalanche, bnb, sui, aptos, zksync, scroll, linea, blast, mantle)
5. source: The original news source name
6. impactLevel: 1-5, where 5 is most impactful for markets

Focus on news that would affect crypto markets, DeFi protocols, or major blockchain projects.
Prioritize: hacks, airdrops, regulatory news, major protocol updates, whale movements, and market-moving events.

Always respond with valid JSON array format.`;

/**
 * Generate user prompt for news fetching
 */
function generateNewsPrompt(): string {
  return `Find the 5 most important cryptocurrency and DeFi news stories from the last 24 hours.

Return the response as a JSON array with this exact format:
[
  {
    "headline": "Short headline here",
    "summary": "Brief summary of what happened",
    "sentiment": "positive" or "negative" or "neutral",
    "chains": ["ethereum", "solana"],
    "source": "Source Name",
    "impactLevel": 4
  }
]

Important: Only return the JSON array, no other text.`;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Call Perplexity API with the news query
 */
async function queryPerplexity(prompt: string): Promise<string> {
  const url = `${PERPLEXITY_API.BASE_URL}${PERPLEXITY_API.CHAT}`;
  
  const requestBody: PerplexityRequest = {
    model: 'llama-3.1-sonar-small-128k-online', // Online model for real-time search
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1500,
    temperature: 0.1, // Low temperature for consistent output
    search_recency_filter: 'day', // Only last 24 hours
    return_citations: false,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data: PerplexityResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from Perplexity');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('[Perplexity] API call failed:', error);
    throw error;
  }
}

/**
 * Parse AI response into structured news items
 */
function parseNewsResponse(response: string): ParsedNewsItem[] {
  try {
    // Try to extract JSON from the response
    // Sometimes the model wraps it in markdown code blocks
    let jsonStr = response;
    
    // Remove markdown code blocks if present
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    // Try to find JSON array in the response
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Validate and transform each item
    return parsed.map((item: Record<string, unknown>) => ({
      headline: String(item.headline || '').slice(0, 150),
      summary: String(item.summary || '').slice(0, 300),
      sentiment: validateSentiment(item.sentiment),
      chains: validateChains(item.chains),
      source: String(item.source || 'Unknown'),
      impactLevel: Math.min(5, Math.max(1, Number(item.impactLevel) || 3)),
    }));
  } catch (error) {
    console.error('[Perplexity] Failed to parse response:', error);
    console.error('[Perplexity] Raw response:', response);
    return [];
  }
}

/**
 * Validate sentiment value
 */
function validateSentiment(value: unknown): NewsSentiment {
  const valid: NewsSentiment[] = ['positive', 'negative', 'neutral'];
  if (typeof value === 'string' && valid.includes(value as NewsSentiment)) {
    return value as NewsSentiment;
  }
  return 'neutral';
}

/**
 * Validate and normalize chains array
 */
function validateChains(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string')
    .map(v => v.toLowerCase());
}

// =============================================================================
// MAIN FETCH FUNCTION
// =============================================================================

/**
 * Fetch crypto news from Perplexity AI
 * This is the main function called by the data sync layer
 * 
 * @returns News data for caching
 */
export async function fetchPerplexityNews(): Promise<NewsData> {
  if (!FEATURES.ENABLE_NEWS) {
    throw new Error('News fetching is disabled');
  }

  if (!PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured');
  }

  console.log('[Perplexity] Fetching news...');
  const startTime = Date.now();

  // Query Perplexity for news
  const prompt = generateNewsPrompt();
  const rawResponse = await queryPerplexity(prompt);
  
  // Parse the response
  const parsedItems = parseNewsResponse(rawResponse);
  
  // Transform to our format
  const now = Date.now();
  const items: CryptoNewsItem[] = parsedItems.map((item, index) => {
    // Extract chains from headline and summary if not provided
    const extractedChains = [
      ...item.chains,
      ...extractChains(item.headline),
      ...extractChains(item.summary),
    ];
    const uniqueChains = [...new Set(extractedChains)] as CryptoChain[];

    return {
      id: `news-${now}-${index}`,
      headline: item.headline,
      summary: item.summary,
      sentiment: item.sentiment,
      relevantChains: uniqueChains,
      source: item.source,
      publishedAt: now - (index * 3600000), // Stagger by 1 hour for variety
      fetchedAt: now,
      impactLevel: item.impactLevel,
    };
  });

  // Filter out items older than max age
  const maxAge = BLENDER_CONFIG.MAX_NEWS_AGE;
  const recentItems = items.filter(item => now - item.publishedAt < maxAge);

  const elapsed = Date.now() - startTime;
  console.log(`[Perplexity] Fetched in ${elapsed}ms: ${recentItems.length} news items`);

  return {
    items: recentItems,
    lastFetch: now,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get news items by sentiment
 */
export function getNewsBySentiment(
  data: NewsData,
  sentiment: NewsSentiment
): CryptoNewsItem[] {
  return data.items.filter(item => item.sentiment === sentiment);
}

/**
 * Get news affecting a specific chain
 */
export function getNewsByChain(
  data: NewsData,
  chain: CryptoChain
): CryptoNewsItem[] {
  return data.items.filter(item => 
    item.relevantChains.includes(chain)
  );
}

/**
 * Get high-impact news (impactLevel >= 4)
 */
export function getHighImpactNews(data: NewsData): CryptoNewsItem[] {
  return data.items.filter(item => item.impactLevel >= 4);
}

/**
 * Get overall news sentiment score (-1 to +1)
 */
export function getOverallNewsSentiment(data: NewsData): number {
  if (data.items.length === 0) return 0;
  
  let score = 0;
  for (const item of data.items) {
    const weight = item.impactLevel / 5; // Weight by impact
    if (item.sentiment === 'positive') score += weight;
    else if (item.sentiment === 'negative') score -= weight;
  }
  
  return score / data.items.length;
}

/**
 * Format news item for display
 */
export function formatNewsForDisplay(item: CryptoNewsItem): string {
  const emoji = item.sentiment === 'positive' ? '📈' : 
                item.sentiment === 'negative' ? '📉' : '📰';
  return `${emoji} ${item.headline} — ${item.source}`;
}

/**
 * Check if Perplexity API is accessible
 */
export async function checkPerplexityHealth(): Promise<boolean> {
  if (!PERPLEXITY_API_KEY) return false;
  
  try {
    // Simple ping by checking if we can reach the API
    // Don't actually make a request to save costs
    const response = await fetch(PERPLEXITY_API.BASE_URL, {
      method: 'HEAD',
    });
    return response.status !== 404;
  } catch {
    return false;
  }
}

