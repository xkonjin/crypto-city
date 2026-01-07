/**
 * =============================================================================
 * TWITTER/X API CLIENT
 * =============================================================================
 * Fetches tweets from Crypto Twitter (CT) influencers and news accounts.
 * 
 * Uses Twitter API v2 to fetch recent tweets from curated accounts.
 * Requires Bearer Token (Basic tier: ~$100/month).
 * 
 * Data fetched:
 * - Recent tweets from CT influencers
 * - Engagement metrics (likes, retweets, quotes)
 * - AI-analyzed sentiment
 * 
 * API Docs: https://developer.twitter.com/en/docs/twitter-api
 */

import { 
  TWITTER_API, 
  TWITTER_BEARER_TOKEN, 
  CT_ACCOUNTS,
  CT_HANDLES,
  FEATURES, 
  BLENDER_CONFIG 
} from '../config';
import { CTTweet, TwitterData, TweetSentiment } from '../cache/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Raw tweet from Twitter API v2
 */
interface RawTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities?: {
    mentions?: Array<{ username: string }>;
    hashtags?: Array<{ tag: string }>;
    cashtags?: Array<{ tag: string }>;
    urls?: Array<{ expanded_url: string }>;
  };
}

/**
 * Raw user data from Twitter API v2
 */
interface RawUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  verified?: boolean;
}

/**
 * Twitter API v2 response wrapper
 */
interface TwitterResponse {
  data?: RawTweet[];
  includes?: {
    users?: RawUser[];
  };
  meta?: {
    result_count: number;
    next_token?: string;
    newest_id?: string;
    oldest_id?: string;
  };
  errors?: Array<{
    detail: string;
    title: string;
    type: string;
  }>;
}

// =============================================================================
// SENTIMENT ANALYSIS
// =============================================================================

/**
 * Keywords for bullish sentiment
 */
const BULLISH_KEYWORDS = [
  'bullish', 'moon', 'pump', 'ath', 'all time high', 'gains', 'breakout',
  'accumulate', 'accumulating', 'buy', 'buying', 'long', 'longing',
  'wagmi', 'gmi', 'ngmi not', 'lfg', 'lets go', 'green', 'rally',
  'recovery', 'reversal', 'bottom', 'bottomed', 'undervalued', 'cheap',
  '🚀', '📈', '💎', '🐂', '✅', '🔥', '💪'
];

/**
 * Keywords for bearish sentiment
 */
const BEARISH_KEYWORDS = [
  'bearish', 'dump', 'crash', 'rekt', 'liquidated', 'sell', 'selling',
  'short', 'shorting', 'ngmi', 'down', 'falling', 'bleeding', 'red',
  'capitulation', 'fear', 'panic', 'overvalued', 'expensive', 'bubble',
  'scam', 'rug', 'rugged', 'hack', 'hacked', 'exploit', 'vulnerability',
  '📉', '🐻', '💀', '⚠️', '🚨', '❌'
];

/**
 * Keywords for drama
 */
const DRAMA_KEYWORDS = [
  'drama', 'beef', 'fight', 'vs', 'versus', 'ratio', 'ratiod',
  'clown', 'wrong', 'scammer', 'fraud', 'fake', 'exposed', 'thread',
  'unfollow', 'blocked', 'controversy', 'accused', 'allegations',
  '🍿', '🤡', '💩', '🤮'
];

/**
 * Analyze tweet sentiment using keyword matching
 * This is a simple heuristic - could be enhanced with AI
 */
function analyzeSentiment(text: string): TweetSentiment {
  const lowerText = text.toLowerCase();
  
  let bullishScore = 0;
  let bearishScore = 0;
  let dramaScore = 0;
  
  // Count keyword matches
  for (const keyword of BULLISH_KEYWORDS) {
    if (lowerText.includes(keyword)) bullishScore++;
  }
  
  for (const keyword of BEARISH_KEYWORDS) {
    if (lowerText.includes(keyword)) bearishScore++;
  }
  
  for (const keyword of DRAMA_KEYWORDS) {
    if (lowerText.includes(keyword)) dramaScore++;
  }
  
  // Determine sentiment based on scores
  if (dramaScore >= 2) return 'drama';
  if (bullishScore > bearishScore + 1) return 'bullish';
  if (bearishScore > bullishScore + 1) return 'bearish';
  return 'neutral';
}

/**
 * Extract token/chain mentions from tweet
 */
function extractMentions(tweet: RawTweet): string[] {
  const mentions: string[] = [];
  
  // Get cashtags ($BTC, $ETH, etc.)
  if (tweet.entities?.cashtags) {
    for (const cashtag of tweet.entities.cashtags) {
      mentions.push(cashtag.tag.toUpperCase());
    }
  }
  
  // Get relevant hashtags
  if (tweet.entities?.hashtags) {
    const cryptoHashtags = ['bitcoin', 'ethereum', 'solana', 'defi', 'nft', 'crypto', 'web3'];
    for (const hashtag of tweet.entities.hashtags) {
      if (cryptoHashtags.includes(hashtag.tag.toLowerCase())) {
        mentions.push(hashtag.tag.toUpperCase());
      }
    }
  }
  
  return [...new Set(mentions)];
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Build authorization header for Twitter API
 */
function getAuthHeader(): HeadersInit {
  return {
    'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch user IDs for CT accounts
 * Twitter API requires user IDs, not handles
 */
async function fetchUserIds(handles: string[]): Promise<Map<string, RawUser>> {
  const userMap = new Map<string, RawUser>();
  
  // Batch handles (max 100 per request)
  const batches = [];
  for (let i = 0; i < handles.length; i += 100) {
    batches.push(handles.slice(i, i + 100));
  }
  
  for (const batch of batches) {
    const params = new URLSearchParams({
      usernames: batch.join(','),
      'user.fields': 'id,name,username,profile_image_url,verified',
    });
    
    const url = `${TWITTER_API.BASE_URL}/users/by?${params}`;
    
    try {
      const response = await fetch(url, { headers: getAuthHeader() });
      
      if (!response.ok) {
        console.warn(`[Twitter] Failed to fetch users: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.data) {
        for (const user of data.data as RawUser[]) {
          userMap.set(user.id, user);
        }
      }
    } catch (error) {
      console.error('[Twitter] Error fetching user IDs:', error);
    }
  }
  
  return userMap;
}

/**
 * Fetch recent tweets from a specific user
 */
async function fetchUserTweets(userId: string): Promise<RawTweet[]> {
  const params = new URLSearchParams({
    max_results: '10',
    'tweet.fields': 'created_at,public_metrics,entities',
    exclude: 'retweets,replies', // Only original tweets
  });
  
  const url = `${TWITTER_API.BASE_URL}/users/${userId}/tweets?${params}`;
  
  try {
    const response = await fetch(url, { headers: getAuthHeader() });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[Twitter] Rate limited');
        return [];
      }
      console.warn(`[Twitter] Failed to fetch tweets for user ${userId}: ${response.status}`);
      return [];
    }
    
    const data: TwitterResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('[Twitter] Error fetching user tweets:', error);
    return [];
  }
}

/**
 * Search for recent tweets with crypto-related keywords
 * Alternative to per-user fetching
 */
async function searchRecentTweets(): Promise<TwitterResponse> {
  // Build query for CT accounts
  const userQuery = CT_HANDLES.map(h => `from:${h}`).join(' OR ');
  const query = `(${userQuery}) -is:retweet -is:reply`;
  
  const params = new URLSearchParams({
    query: query,
    max_results: '50',
    'tweet.fields': 'created_at,public_metrics,entities,author_id',
    'user.fields': 'name,username',
    expansions: 'author_id',
  });
  
  const url = `${TWITTER_API.BASE_URL}/tweets/search/recent?${params}`;
  
  try {
    const response = await fetch(url, { headers: getAuthHeader() });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twitter search API error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Twitter] Search failed:', error);
    throw error;
  }
}

// =============================================================================
// MAIN FETCH FUNCTION
// =============================================================================

/**
 * Fetch CT tweets from Twitter API
 * This is the main function called by the data sync layer
 * 
 * @returns Twitter data for caching
 */
export async function fetchTwitterData(): Promise<TwitterData> {
  if (!FEATURES.ENABLE_TWITTER) {
    throw new Error('Twitter fetching is disabled');
  }

  if (!TWITTER_BEARER_TOKEN) {
    throw new Error('Twitter Bearer Token not configured');
  }

  console.log('[Twitter] Fetching CT tweets...');
  const startTime = Date.now();

  try {
    // Use search API to get tweets from all CT accounts at once
    const response = await searchRecentTweets();
    
    if (!response.data || response.data.length === 0) {
      console.log('[Twitter] No tweets found');
      return {
        tweets: [],
        lastFetch: Date.now(),
      };
    }
    
    // Build user lookup map
    const userMap = new Map<string, RawUser>();
    if (response.includes?.users) {
      for (const user of response.includes.users) {
        userMap.set(user.id, user);
      }
    }
    
    // Transform raw tweets to our format
    const tweets: CTTweet[] = response.data.map(rawTweet => {
      const user = userMap.get(rawTweet.author_id);
      const metrics = rawTweet.public_metrics;
      const engagement = metrics.like_count + metrics.retweet_count + metrics.quote_count;
      
      return {
        id: rawTweet.id,
        author: user?.name || 'Unknown',
        handle: user?.username || 'unknown',
        content: rawTweet.text,
        createdAt: new Date(rawTweet.created_at).getTime(),
        likes: metrics.like_count,
        retweets: metrics.retweet_count,
        quotes: metrics.quote_count,
        engagement,
        sentiment: analyzeSentiment(rawTweet.text),
        mentions: extractMentions(rawTweet),
        hasMedia: !!rawTweet.entities?.urls?.length,
      };
    });
    
    // Filter by minimum engagement
    const filteredTweets = tweets.filter(
      t => t.engagement >= BLENDER_CONFIG.MIN_TWEET_ENGAGEMENT
    );
    
    // Sort by engagement (highest first)
    filteredTweets.sort((a, b) => b.engagement - a.engagement);

    const elapsed = Date.now() - startTime;
    console.log(`[Twitter] Fetched in ${elapsed}ms: ${filteredTweets.length} tweets (from ${tweets.length} total)`);

    return {
      tweets: filteredTweets,
      lastFetch: Date.now(),
    };
  } catch (error) {
    console.error('[Twitter] Fetch failed:', error);
    throw error;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get tweets by sentiment
 */
export function getTweetsBySentiment(
  data: TwitterData,
  sentiment: TweetSentiment
): CTTweet[] {
  return data.tweets.filter(t => t.sentiment === sentiment);
}

/**
 * Get top N tweets by engagement
 */
export function getTopTweets(data: TwitterData, limit = 10): CTTweet[] {
  return data.tweets.slice(0, limit);
}

/**
 * Get tweets mentioning a specific token/chain
 */
export function getTweetsByMention(
  data: TwitterData,
  mention: string
): CTTweet[] {
  const upperMention = mention.toUpperCase();
  return data.tweets.filter(t => 
    t.mentions.includes(upperMention) ||
    t.content.toUpperCase().includes(upperMention)
  );
}

/**
 * Get overall CT sentiment score (-1 to +1)
 */
export function getOverallCTSentiment(data: TwitterData): number {
  if (data.tweets.length === 0) return 0;
  
  let score = 0;
  let totalWeight = 0;
  
  for (const tweet of data.tweets) {
    // Weight by engagement (log scale to prevent outliers dominating)
    const weight = Math.log10(tweet.engagement + 1);
    totalWeight += weight;
    
    if (tweet.sentiment === 'bullish') score += weight;
    else if (tweet.sentiment === 'bearish') score -= weight;
    else if (tweet.sentiment === 'drama') score -= weight * 0.3; // Drama slightly negative
  }
  
  return totalWeight > 0 ? score / totalWeight : 0;
}

/**
 * Format tweet for news ticker display
 */
export function formatTweetForTicker(tweet: CTTweet): string {
  // Truncate content if too long
  const maxLength = 150;
  let content = tweet.content;
  if (content.length > maxLength) {
    content = content.substring(0, maxLength - 3) + '...';
  }
  
  return `🐦 @${tweet.handle}: ${content}`;
}

/**
 * Get CT account info by handle
 */
export function getCTAccountInfo(handle: string): typeof CT_ACCOUNTS[number] | undefined {
  return CT_ACCOUNTS.find(a => 
    a.handle.toLowerCase() === handle.toLowerCase()
  );
}

/**
 * Check if Twitter API is accessible
 */
export async function checkTwitterHealth(): Promise<boolean> {
  if (!TWITTER_BEARER_TOKEN) return false;
  
  try {
    // Simple health check
    const response = await fetch(`${TWITTER_API.BASE_URL}/users/me`, {
      headers: getAuthHeader(),
    });
    // 401 means auth failed but API is reachable
    // 200 or 401 both indicate the API is up
    return response.status === 200 || response.status === 401;
  } catch {
    return false;
  }
}

