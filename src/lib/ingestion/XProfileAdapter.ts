/**
 * X/Twitter Profile Adapter
 *
 * Adapter pattern for fetching X/Twitter profiles. Like the Babel Fish of social media
 * ingestion, it translates the gibberish of various APIs into a format our NPCs can understand.
 *
 * Supports multiple backends:
 * - MockAdapter: Returns fabricated but believable data for testing
 * - ApifyAdapter: Production adapter using Apify's Twitter scraper (stub)
 *
 * The guide entry would note: "Twitter profiles, much like their owners,
 * contain both profound wisdom and absolute nonsense in equal measure."
 */

/**
 * A single tweet from an X/Twitter profile.
 * Contains just enough context to extract personality,
 * but not enough to start any flame wars.
 */
export interface XTweet {
  /** Unique tweet identifier */
  id: string;
  /** The actual tweet text - may contain wisdom or shitposts */
  text: string;
  /** When this profound statement was made */
  createdAt: string;
  /** How many people acknowledged this with a heart */
  likeCount: number;
  /** How many people wanted their followers to see this too */
  retweetCount: number;
  /** How many people felt compelled to respond */
  replyCount: number;
}

/**
 * Complete X/Twitter profile data.
 * Everything we need to create an NPC, nothing more.
 */
export interface XProfile {
  /** Twitter's internal ID for this account */
  id: string;
  /** The @handle - their identity in 280 characters or less */
  username: string;
  /** What they call themselves (often a pun or meme reference) */
  displayName: string;
  /** Their life story in 160 characters or less */
  bio: string;
  /** URL to their profile picture */
  profileImageUrl: string;
  /** Recent tweets for personality extraction */
  recentTweets: XTweet[];
  /** Number of followers (social proof metric) */
  followerCount: number;
  /** Number of accounts they follow */
  followingCount: number;
  /** When they joined the platform */
  joinedAt?: string;
  /** Location if provided (often fake or meme) */
  location?: string;
  /** Whether the account is verified */
  isVerified?: boolean;
}

/**
 * Configuration options for profile fetching.
 */
export interface XProfileFetchOptions {
  /** Maximum number of tweets to fetch (default: 20) */
  maxTweets?: number;
  /** Include replies in tweet fetch (default: false) */
  includeReplies?: boolean;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Result of a profile fetch operation.
 * Either succeeds gloriously or fails with an explanation.
 */
export type XProfileFetchResult =
  | { success: true; profile: XProfile }
  | { success: false; error: string; code: XProfileErrorCode };

/**
 * Error codes for profile fetch failures.
 */
export type XProfileErrorCode =
  | 'NOT_FOUND' // Profile doesn't exist
  | 'SUSPENDED' // Account suspended
  | 'PRIVATE' // Account is private
  | 'RATE_LIMITED' // Too many requests
  | 'API_ERROR' // Generic API error
  | 'TIMEOUT' // Request timed out
  | 'INVALID_USERNAME'; // Username format invalid

/**
 * Interface for X/Twitter profile adapters.
 * Implement this to add new data sources.
 */
export interface XProfileAdapter {
  /** Unique identifier for this adapter */
  id: string;
  /** Human-readable name */
  displayName: string;
  /** Fetch a profile by username */
  fetchProfile(
    username: string,
    options?: XProfileFetchOptions
  ): Promise<XProfileFetchResult>;
  /** Check if the adapter is available/configured */
  isAvailable(): boolean;
}

// =============================================================================
// MOCK ADAPTER
// =============================================================================

/**
 * Mock crypto personality templates for generating believable fake profiles.
 */
const MOCK_PERSONALITIES: Array<{
  bio: string;
  tweets: string[];
  style: 'builder' | 'trader' | 'maxi' | 'degen' | 'analyst';
}> = [
  {
    bio: '🔨 Building the future of DeFi | @SomeProtocol core contributor | Not financial advice | DMs closed',
    tweets: [
      'Just shipped v2.3 - new yield optimization strategy is 🔥',
      'Thread: Why composability is the killer feature of DeFi 🧵',
      "Security audit passed. We take this stuff seriously. Your funds are safu.",
      'Another day, another vulnerability report fixed. This is the way.',
      "Building in bear markets hits different. LFG 🚀",
    ],
    style: 'builder',
  },
  {
    bio: 'Full-time degen | Part-time philosopher | 0x... | My opinions are my own',
    tweets: [
      'WAGMI',
      'Just aped into this new thing. NFA but looks promising 👀',
      "If you're not farming, you're ngmi",
      'We are so early',
      'Rug pull? What rug pull? I only see opportunity',
    ],
    style: 'degen',
  },
  {
    bio: 'Bitcoin only. Orange pill your friends. HODL forever. ⚡️',
    tweets: [
      'Altcoins are a distraction from the signal.',
      "If you understand Bitcoin, you don't need anything else.",
      'Number go up technology is the best technology.',
      'Have fun staying poor.',
      "Bitcoin fixes this. Yes, that too. All of it.",
    ],
    style: 'maxi',
  },
  {
    bio: 'Charts don\'t lie | TA enthusiast | Risk management is key | Join my Discord',
    tweets: [
      'This ascending triangle is looking bullish 📈',
      'RSI overbought on the 4H. Expecting a pullback before continuation.',
      "Support held. Now we wait for confirmation.",
      "Don't fight the trend. Trade what you see, not what you think.",
      'Position closed at target. +42%. Back to the charts.',
    ],
    style: 'trader',
  },
  {
    bio: 'On-chain analyst | Data > Narratives | Dune dashboards in bio',
    tweets: [
      'Thread: Analyzing whale movements over the past 30 days 🐋🧵',
      'Exchange outflows continue. Accumulation phase confirmed.',
      "Metrics don't lie. The fundamentals are stronger than ever.",
      "New dashboard up: Real-time liquidation tracking across top 10 perps.",
      "Follow the smart money. Here's what they're buying.",
    ],
    style: 'analyst',
  },
];

/**
 * Generates a deterministic but varied mock profile based on username.
 */
function generateMockProfile(username: string): XProfile {
  // Use username to deterministically select personality
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const personality = MOCK_PERSONALITIES[hash % MOCK_PERSONALITIES.length];

  // Generate follower count based on username length (longer = more established = more followers)
  const baseFollowers = 1000 + (hash % 10000);
  const multiplier = username.length > 10 ? 10 : username.length > 5 ? 5 : 1;
  const followerCount = baseFollowers * multiplier;

  // Generate tweets with mock engagement
  const recentTweets: XTweet[] = personality.tweets.map((text, i) => ({
    id: `mock-tweet-${username}-${i}`,
    text,
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    likeCount: Math.floor(Math.random() * followerCount * 0.1),
    retweetCount: Math.floor(Math.random() * followerCount * 0.02),
    replyCount: Math.floor(Math.random() * followerCount * 0.01),
  }));

  return {
    id: `mock-${username}`,
    username,
    displayName: username
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    bio: personality.bio,
    profileImageUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
    recentTweets,
    followerCount,
    followingCount: Math.floor(followerCount * (0.1 + Math.random() * 0.3)),
    joinedAt: new Date(2017 + (hash % 7), hash % 12, (hash % 28) + 1).toISOString(),
    location: ['NYC', 'SF', 'Miami', 'Dubai', 'Singapore', 'Decentralized'][hash % 6],
    isVerified: followerCount > 50000,
  };
}

/**
 * Mock adapter for testing X/Twitter profile ingestion.
 *
 * Returns believable but entirely fabricated profile data.
 * Perfect for development and testing without hitting rate limits
 * or violating any terms of service.
 */
export const MockXProfileAdapter: XProfileAdapter = {
  id: 'mock',
  displayName: 'Mock Adapter (Testing)',

  async fetchProfile(
    username: string,
    options?: XProfileFetchOptions
  ): Promise<XProfileFetchResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

    // Validate username format
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
      return {
        success: false,
        error: 'Invalid username format',
        code: 'INVALID_USERNAME',
      };
    }

    // Simulate various error conditions for testing
    const lowerUsername = username.toLowerCase();
    if (lowerUsername === 'notfound' || lowerUsername === 'deleted') {
      return {
        success: false,
        error: 'Profile not found',
        code: 'NOT_FOUND',
      };
    }
    if (lowerUsername === 'suspended') {
      return {
        success: false,
        error: 'Account suspended',
        code: 'SUSPENDED',
      };
    }
    if (lowerUsername === 'private') {
      return {
        success: false,
        error: 'Account is private',
        code: 'PRIVATE',
      };
    }
    if (lowerUsername === 'ratelimit') {
      return {
        success: false,
        error: 'Rate limited',
        code: 'RATE_LIMITED',
      };
    }

    // Generate mock profile
    const profile = generateMockProfile(username);

    // Apply options
    if (options?.maxTweets && options.maxTweets < profile.recentTweets.length) {
      profile.recentTweets = profile.recentTweets.slice(0, options.maxTweets);
    }

    return { success: true, profile };
  },

  isAvailable(): boolean {
    return true; // Mock is always available
  },
};

// =============================================================================
// X API v2 ADAPTER
// =============================================================================

/**
 * X/Twitter API v2 adapter for production profile fetching.
 * Uses the official X API with Bearer Token authentication.
 * Requires X_BEARER_TOKEN environment variable.
 */
export const XApiAdapter: XProfileAdapter = {
  id: 'xapi',
  displayName: 'X API v2',

  async fetchProfile(
    username: string,
    options?: XProfileFetchOptions
  ): Promise<XProfileFetchResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'X API Bearer Token not configured',
        code: 'API_ERROR',
      };
    }

    if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
      return {
        success: false,
        error: 'Invalid username format',
        code: 'INVALID_USERNAME',
      };
    }

    const bearerToken = process.env.X_BEARER_TOKEN;
    const timeout = options?.timeout ?? 30000;
    const maxTweets = options?.maxTweets ?? 20;

    try {
      // Fetch user by username
      const userFields = 'id,name,username,description,profile_image_url,public_metrics,verified,location,created_at';
      const userUrl = `https://api.twitter.com/2/users/by/username/${username}?user.fields=${userFields}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const userResponse = await fetch(userUrl, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          return { success: false, error: 'Profile not found', code: 'NOT_FOUND' };
        }
        if (userResponse.status === 429) {
          return { success: false, error: 'Rate limited', code: 'RATE_LIMITED' };
        }
        if (userResponse.status === 401 || userResponse.status === 403) {
          const errorData = await userResponse.json().catch(() => ({}));
          if (errorData?.errors?.[0]?.detail?.includes('suspended')) {
            return { success: false, error: 'Account suspended', code: 'SUSPENDED' };
          }
          return { success: false, error: 'API authorization failed', code: 'API_ERROR' };
        }
        return { success: false, error: `API error: ${userResponse.status}`, code: 'API_ERROR' };
      }

      const userData = await userResponse.json();
      
      if (!userData.data) {
        return { success: false, error: 'Profile not found', code: 'NOT_FOUND' };
      }

      const user = userData.data;

      // Fetch user's tweets
      const tweetFields = 'id,text,created_at,public_metrics';
      const tweetsUrl = `https://api.twitter.com/2/users/${user.id}/tweets?max_results=${Math.min(maxTweets, 100)}&tweet.fields=${tweetFields}${options?.includeReplies ? '' : '&exclude=replies'}`;

      const tweetsController = new AbortController();
      const tweetsTimeoutId = setTimeout(() => tweetsController.abort(), timeout);

      const tweetsResponse = await fetch(tweetsUrl, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        signal: tweetsController.signal,
      });

      clearTimeout(tweetsTimeoutId);

      let recentTweets: XTweet[] = [];

      if (tweetsResponse.ok) {
        const tweetsData = await tweetsResponse.json();
        if (tweetsData.data && Array.isArray(tweetsData.data)) {
          recentTweets = tweetsData.data.map((tweet: {
            id: string;
            text: string;
            created_at: string;
            public_metrics?: {
              like_count?: number;
              retweet_count?: number;
              reply_count?: number;
            };
          }) => ({
            id: tweet.id,
            text: tweet.text,
            createdAt: tweet.created_at,
            likeCount: tweet.public_metrics?.like_count ?? 0,
            retweetCount: tweet.public_metrics?.retweet_count ?? 0,
            replyCount: tweet.public_metrics?.reply_count ?? 0,
          }));
        }
      }

      const profile: XProfile = {
        id: user.id,
        username: user.username,
        displayName: user.name,
        bio: user.description || '',
        profileImageUrl: user.profile_image_url?.replace('_normal', '_400x400') || '',
        recentTweets,
        followerCount: user.public_metrics?.followers_count ?? 0,
        followingCount: user.public_metrics?.following_count ?? 0,
        joinedAt: user.created_at,
        location: user.location,
        isVerified: user.verified ?? false,
      };

      return { success: true, profile };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Request timed out', code: 'TIMEOUT' };
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        code: 'API_ERROR' 
      };
    }
  },

  isAvailable(): boolean {
    return typeof process !== 'undefined' && !!process.env?.X_BEARER_TOKEN;
  },
};

// =============================================================================
// FIRECRAWL ADAPTER
// =============================================================================

/**
 * Firecrawl adapter for scraping X/Twitter profiles.
 * Uses Firecrawl's web scraping API as a fallback when X API is unavailable.
 * Requires FIRECRAWL_API_KEY environment variable.
 */
export const FirecrawlXProfileAdapter: XProfileAdapter = {
  id: 'firecrawl',
  displayName: 'Firecrawl Scraper',

  async fetchProfile(
    username: string,
    options?: XProfileFetchOptions
  ): Promise<XProfileFetchResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Firecrawl API key not configured',
        code: 'API_ERROR',
      };
    }

    if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
      return {
        success: false,
        error: 'Invalid username format',
        code: 'INVALID_USERNAME',
      };
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    const timeout = options?.timeout ?? 30000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Use Firecrawl to scrape the X profile page
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://x.com/${username}`,
          formats: ['markdown', 'extract'],
          extract: {
            schema: {
              type: 'object',
              properties: {
                displayName: { type: 'string', description: 'Display name of the user' },
                username: { type: 'string', description: 'Username/handle' },
                bio: { type: 'string', description: 'User bio/description' },
                followerCount: { type: 'string', description: 'Number of followers' },
                followingCount: { type: 'string', description: 'Number of accounts following' },
                location: { type: 'string', description: 'User location' },
                joinedDate: { type: 'string', description: 'When the user joined' },
                isVerified: { type: 'boolean', description: 'Whether user is verified' },
                recentTweets: { 
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                      likes: { type: 'string' },
                      retweets: { type: 'string' },
                      replies: { type: 'string' },
                    }
                  },
                  description: 'Recent tweets from the user'
                },
                profileImageUrl: { type: 'string', description: 'URL of profile picture' },
              },
              required: ['displayName', 'username', 'bio'],
            },
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          return { success: false, error: 'Rate limited', code: 'RATE_LIMITED' };
        }
        return { success: false, error: `Firecrawl error: ${response.status}`, code: 'API_ERROR' };
      }

      const data = await response.json();

      if (!data.success || !data.data?.extract) {
        return { success: false, error: 'Failed to extract profile data', code: 'API_ERROR' };
      }

      const extracted = data.data.extract;

      // Parse numeric values from strings
      const parseCount = (value: string | number | undefined): number => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        const cleaned = String(value).replace(/[,\s]/g, '').toLowerCase();
        if (cleaned.includes('k')) return Math.floor(parseFloat(cleaned) * 1000);
        if (cleaned.includes('m')) return Math.floor(parseFloat(cleaned) * 1000000);
        return parseInt(cleaned, 10) || 0;
      };

      // Map extracted tweets
      const recentTweets: XTweet[] = (extracted.recentTweets || []).slice(0, options?.maxTweets ?? 20).map(
        (tweet: { text?: string; likes?: string | number; retweets?: string | number; replies?: string | number }, i: number) => ({
          id: `firecrawl-${username}-${i}`,
          text: tweet.text || '',
          createdAt: new Date().toISOString(),
          likeCount: parseCount(tweet.likes),
          retweetCount: parseCount(tweet.retweets),
          replyCount: parseCount(tweet.replies),
        })
      );

      const profile: XProfile = {
        id: `firecrawl-${username}`,
        username: extracted.username || username,
        displayName: extracted.displayName || username,
        bio: extracted.bio || '',
        profileImageUrl: extracted.profileImageUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
        recentTweets,
        followerCount: parseCount(extracted.followerCount),
        followingCount: parseCount(extracted.followingCount),
        joinedAt: extracted.joinedDate,
        location: extracted.location,
        isVerified: extracted.isVerified ?? false,
      };

      return { success: true, profile };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Request timed out', code: 'TIMEOUT' };
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        code: 'API_ERROR' 
      };
    }
  },

  isAvailable(): boolean {
    return typeof process !== 'undefined' && !!process.env?.FIRECRAWL_API_KEY;
  },
};

// =============================================================================
// ADAPTER REGISTRY
// =============================================================================

/**
 * Registry of available X/Twitter profile adapters.
 */
export const X_PROFILE_ADAPTERS: Record<string, XProfileAdapter> = {
  mock: MockXProfileAdapter,
  xapi: XApiAdapter,
  firecrawl: FirecrawlXProfileAdapter,
};

/**
 * Get the best available adapter for the current environment.
 * Priority: X API v2 > Firecrawl > Mock
 */
export function getDefaultXProfileAdapter(): XProfileAdapter {
  // Prefer official X API v2 if configured
  if (XApiAdapter.isAvailable()) {
    return XApiAdapter;
  }

  // Fall back to Firecrawl if configured
  if (FirecrawlXProfileAdapter.isAvailable()) {
    return FirecrawlXProfileAdapter;
  }

  // Fall back to mock for development/testing
  return MockXProfileAdapter;
}
