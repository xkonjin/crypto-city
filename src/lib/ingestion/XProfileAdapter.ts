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
// APIFY ADAPTER (STUB)
// =============================================================================

/**
 * Apify adapter for production X/Twitter profile fetching.
 *
 * Uses Apify's Twitter scraper actors to fetch real profile data.
 * Requires APIFY_API_TOKEN environment variable.
 *
 * NOTE: This is a stub implementation. Full implementation would use:
 * - https://apify.com/apidojo/twitter-user-scraper
 * - https://apify.com/apidojo/tweet-scraper
 */
export const ApifyXProfileAdapter: XProfileAdapter = {
  id: 'apify',
  displayName: 'Apify Twitter Scraper',

  async fetchProfile(
    username: string,
    _options?: XProfileFetchOptions
  ): Promise<XProfileFetchResult> {
    // Check if Apify is configured
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Apify API token not configured',
        code: 'API_ERROR',
      };
    }

    // Validate username
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
      return {
        success: false,
        error: 'Invalid username format',
        code: 'INVALID_USERNAME',
      };
    }

    // TODO: Implement actual Apify API call
    // const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
    // const run = await client.actor('apidojo/twitter-user-scraper').call({
    //   usernames: [username],
    //   tweetsDesired: options?.maxTweets ?? 20,
    // });
    // const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return {
      success: false,
      error: 'Apify adapter not yet implemented - use mock adapter for testing',
      code: 'API_ERROR',
    };
  },

  isAvailable(): boolean {
    return typeof process !== 'undefined' && !!process.env?.APIFY_API_TOKEN;
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
  apify: ApifyXProfileAdapter,
};

/**
 * Get the best available adapter for the current environment.
 * Prefers real adapters in production, falls back to mock.
 */
export function getDefaultXProfileAdapter(): XProfileAdapter {
  // In production, prefer Apify if configured
  if (ApifyXProfileAdapter.isAvailable()) {
    return ApifyXProfileAdapter;
  }

  // Fall back to mock for development/testing
  return MockXProfileAdapter;
}
