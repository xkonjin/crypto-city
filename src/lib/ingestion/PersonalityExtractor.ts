/**
 * Personality Extractor
 *
 * Extracts NPC personality traits from X/Twitter profiles using LLM analysis.
 * Like a psychoanalyst, but for tweets instead of dreams, and considerably less Freudian.
 *
 * The Hitchhiker's Guide notes: "Personality extraction from social media is
 * remarkably accurate, primarily because most humans reveal far more about
 * themselves in 280 characters than they ever would in an hour of therapy."
 */

import type { NPCPersonality, PersonalityArchetype } from '@/lib/npc/personality';
import type { Occupation } from '@/games/isocity/types/npc';
import type { XProfile, XTweet } from './XProfileAdapter';
import { sanitizeText } from './safetyFilters';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of personality extraction from an X/Twitter profile.
 */
export interface ExtractedTraits {
  /** Determined personality archetype */
  archetype: PersonalityArchetype;
  /** Suitable NPC occupation based on profile */
  occupation: Occupation;
  /** Five dialogue seeds generated from tweets */
  dialogueSeeds: string[];
  /** Full personality trait values */
  personality: NPCPersonality;
  /** Confidence score (0-1) for the extraction */
  confidence: number;
  /** Brief explanation of the extraction reasoning */
  reasoning?: string;
}

/**
 * Options for personality extraction.
 */
export interface ExtractionOptions {
  /** Whether to use LLM for extraction (false = rule-based) */
  useLLM?: boolean;
  /** Model to use for LLM extraction */
  model?: string;
  /** Include reasoning in result */
  includeReasoning?: boolean;
}

// =============================================================================
// PROMPT TEMPLATE
// =============================================================================

/**
 * Structured prompt for LLM personality extraction.
 * Designed to produce consistent JSON output for parsing.
 */
export function buildExtractionPrompt(profile: XProfile): string {
  const tweetsText = profile.recentTweets
    .slice(0, 10)
    .map((t) => `- "${t.text}"`)
    .join('\n');

  return `Analyze this Twitter/X profile to create an NPC for a crypto city-builder game.

## Profile Data
- **Username**: @${profile.username}
- **Display Name**: ${profile.displayName}
- **Bio**: ${profile.bio || 'No bio provided'}
- **Followers**: ${profile.followerCount.toLocaleString()}
- **Following**: ${profile.followingCount.toLocaleString()}
- **Verified**: ${profile.isVerified ? 'Yes' : 'No'}
- **Location**: ${profile.location || 'Unknown'}

## Recent Tweets
${tweetsText || 'No tweets available'}

## Your Task
Determine the following for this person as an NPC in Crypto City:

### 1. PERSONALITY ARCHETYPE
Choose ONE from:
- bitcoin_maxi: Bitcoin maximalist, distrusts altcoins
- eth_builder: Ethereum developer, builds dApps
- degen_trader: High-risk trader, apes into everything
- privacy_maxi: Values privacy, paranoid about surveillance
- normie_investor: New to crypto, uses exchanges
- nft_flipper: Trades NFTs, follows trends
- staking_grandma: Conservative, prefers yield farming
- protocol_politician: Governance participant, political

### 2. OCCUPATION
Choose ONE from:
- trader: Trades crypto full-time
- miner: Runs mining/staking operations
- developer: Builds crypto projects
- shop_owner: Runs a crypto business
- bartender: Service industry, crypto side-hustle
- artist: Creates NFTs or crypto art
- security: Works in crypto security
- unemployed: Between opportunities

### 3. DIALOGUE SEEDS
Generate 5 short phrases (max 50 chars each) this person might say in-game.
Base these on their tweets and personality. Make them crypto-themed and sardonic.

### 4. PERSONALITY TRAITS (all values 0.0 to 1.0)

**Big Five Traits:**
- openness: Curiosity, trying new protocols (0 = sticks to BTC only, 1 = tries everything)
- conscientiousness: Organization, discipline (0 = chaotic degen, 1 = strict schedule)
- extraversion: Social energy (0 = lurker, 1 = always in Twitter Spaces)
- agreeableness: Cooperation (0 = confrontational, 1 = helps newbies)
- neuroticism: Emotional volatility (0 = diamond hands, 1 = panic seller)

**Crypto Traits:**
- riskTolerance: Willingness to take risks (0 = stablecoins only, 1 = 100x leverage)
- fomo: Susceptibility to hype (0 = ignores trends, 1 = apes everything)
- trustInInstitutions: Trust in exchanges/banks (0 = self-custody only, 1 = trusts Coinbase)
- technicalKnowledge: Technical understanding (0 = can't setup wallet, 1 = audits contracts)
- degenLevel: Willingness to ape in (0 = months of research, 1 = buys first asks never)

## Response Format
Respond ONLY with valid JSON in this exact format:
\`\`\`json
{
  "archetype": "chosen_archetype",
  "occupation": "chosen_occupation",
  "dialogueSeeds": ["phrase1", "phrase2", "phrase3", "phrase4", "phrase5"],
  "personality": {
    "bigFive": {
      "openness": 0.5,
      "conscientiousness": 0.5,
      "extraversion": 0.5,
      "agreeableness": 0.5,
      "neuroticism": 0.5
    },
    "crypto": {
      "riskTolerance": 0.5,
      "fomo": 0.5,
      "trustInInstitutions": 0.5,
      "technicalKnowledge": 0.5,
      "degenLevel": 0.5
    }
  },
  "confidence": 0.8,
  "reasoning": "Brief explanation of your analysis"
}
\`\`\``;
}

// =============================================================================
// RULE-BASED EXTRACTION (Fallback)
// =============================================================================

/**
 * Keywords indicating specific archetypes.
 */
const ARCHETYPE_KEYWORDS: Record<PersonalityArchetype, string[]> = {
  bitcoin_maxi: [
    'bitcoin',
    'btc',
    'satoshi',
    'hodl',
    'orange pill',
    'laser eyes',
    '₿',
    'lightning',
  ],
  eth_builder: [
    'ethereum',
    'eth',
    'solidity',
    'smart contract',
    'dapp',
    'defi',
    'build',
    'ship',
  ],
  degen_trader: ['ape', 'degen', 'wagmi', 'ngmi', 'send it', 'leverage', 'perps', 'rekt'],
  privacy_maxi: ['privacy', 'monero', 'xmr', 'zcash', 'tornado', 'self-custody', 'kyc'],
  normie_investor: ['coinbase', 'robinhood', 'invest', 'portfolio', 'diversify', 'safe'],
  nft_flipper: ['nft', 'jpeg', 'pfp', 'mint', 'floor', 'opensea', 'blur', 'art'],
  staking_grandma: ['stake', 'yield', 'apy', 'compound', 'passive', 'earn', 'farming'],
  protocol_politician: ['governance', 'vote', 'dao', 'proposal', 'delegate', 'snapshot'],
};

/**
 * Keywords indicating specific occupations.
 */
const OCCUPATION_KEYWORDS: Record<Occupation, string[]> = {
  trader: ['trade', 'chart', 'ta', 'analysis', 'position', 'long', 'short', 'pnl'],
  miner: ['mine', 'hash', 'validator', 'staking', 'node', 'infrastructure'],
  developer: ['dev', 'code', 'build', 'ship', 'deploy', 'contract', 'protocol'],
  shop_owner: ['business', 'merchant', 'accept', 'payment', 'store', 'startup'],
  bartender: ['gm', 'gn', 'vibes', 'chill', 'community', 'frens'],
  artist: ['art', 'create', 'design', 'nft', 'collection', 'drop'],
  security: ['audit', 'security', 'bug', 'bounty', 'hack', 'exploit', 'vulnerability'],
  unemployed: ['unemployed', 'jobless', 'neet', 'between jobs', 'full-time degen'],
};

/**
 * Analyzes tweet text to count keyword matches.
 */
function countKeywordMatches(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  return keywords.filter((kw) => lowerText.includes(kw.toLowerCase())).length;
}

/**
 * Extracts personality using rule-based heuristics.
 * Used as fallback when LLM is unavailable or for testing.
 */
export function extractPersonalityRuleBased(profile: XProfile): ExtractedTraits {
  // Combine bio and tweets for analysis
  const allText = [
    profile.bio,
    ...profile.recentTweets.map((t) => t.text),
  ].join(' ');

  // Determine archetype by keyword matching
  let bestArchetype: PersonalityArchetype = 'normie_investor';
  let bestArchetypeScore = 0;

  for (const [archetype, keywords] of Object.entries(ARCHETYPE_KEYWORDS)) {
    const score = countKeywordMatches(allText, keywords);
    if (score > bestArchetypeScore) {
      bestArchetypeScore = score;
      bestArchetype = archetype as PersonalityArchetype;
    }
  }

  // Determine occupation by keyword matching
  let bestOccupation: Occupation = 'unemployed';
  let bestOccupationScore = 0;

  for (const [occupation, keywords] of Object.entries(OCCUPATION_KEYWORDS)) {
    const score = countKeywordMatches(allText, keywords);
    if (score > bestOccupationScore) {
      bestOccupationScore = score;
      bestOccupation = occupation as Occupation;
    }
  }

  // Generate dialogue seeds from tweets
  const dialogueSeeds = generateDialogueSeedsFromTweets(profile.recentTweets);

  // Generate personality traits based on archetype and profile metrics
  const personality = generatePersonalityFromArchetype(bestArchetype, profile);

  // Calculate confidence based on keyword match strength
  const confidence = Math.min(
    0.5 + bestArchetypeScore * 0.1 + bestOccupationScore * 0.05,
    0.9
  );

  return {
    archetype: bestArchetype,
    occupation: bestOccupation,
    dialogueSeeds,
    personality,
    confidence,
    reasoning: `Detected ${bestArchetypeScore} archetype keywords and ${bestOccupationScore} occupation keywords`,
  };
}

/**
 * Generates dialogue seeds from recent tweets.
 */
function generateDialogueSeedsFromTweets(tweets: XTweet[]): string[] {
  const seeds: string[] = [];

  for (const tweet of tweets.slice(0, 5)) {
    // Extract short phrases from tweets
    let seed = tweet.text;

    // Remove URLs
    seed = seed.replace(/https?:\/\/\S+/g, '').trim();

    // Remove mentions
    seed = seed.replace(/@\w+/g, '').trim();

    // Truncate to max 50 chars
    if (seed.length > 50) {
      seed = seed.substring(0, 47) + '...';
    }

    // Sanitize
    seed = sanitizeText(seed);

    if (seed.length > 5) {
      seeds.push(seed);
    }
  }

  // Ensure we have at least 5 seeds
  const fallbackSeeds = [
    'gm frens',
    'wagmi',
    'have you seen the charts?',
    'not financial advice',
    "we're all gonna make it",
  ];

  while (seeds.length < 5) {
    seeds.push(fallbackSeeds[seeds.length] || 'probably nothing');
  }

  return seeds.slice(0, 5);
}

/**
 * Generates personality traits based on archetype with some variance.
 */
function generatePersonalityFromArchetype(
  archetype: PersonalityArchetype,
  profile: XProfile
): NPCPersonality {
  // Base profiles for each archetype
  const baseProfiles: Record<PersonalityArchetype, NPCPersonality> = {
    bitcoin_maxi: {
      bigFive: {
        openness: 0.2,
        conscientiousness: 0.8,
        extraversion: 0.5,
        agreeableness: 0.3,
        neuroticism: 0.4,
      },
      crypto: {
        riskTolerance: 0.4,
        fomo: 0.2,
        trustInInstitutions: 0.1,
        technicalKnowledge: 0.7,
        degenLevel: 0.2,
      },
    },
    eth_builder: {
      bigFive: {
        openness: 0.8,
        conscientiousness: 0.7,
        extraversion: 0.5,
        agreeableness: 0.6,
        neuroticism: 0.3,
      },
      crypto: {
        riskTolerance: 0.5,
        fomo: 0.3,
        trustInInstitutions: 0.4,
        technicalKnowledge: 0.9,
        degenLevel: 0.4,
      },
    },
    degen_trader: {
      bigFive: {
        openness: 0.7,
        conscientiousness: 0.2,
        extraversion: 0.7,
        agreeableness: 0.4,
        neuroticism: 0.6,
      },
      crypto: {
        riskTolerance: 0.9,
        fomo: 0.9,
        trustInInstitutions: 0.3,
        technicalKnowledge: 0.5,
        degenLevel: 0.95,
      },
    },
    privacy_maxi: {
      bigFive: {
        openness: 0.4,
        conscientiousness: 0.8,
        extraversion: 0.2,
        agreeableness: 0.3,
        neuroticism: 0.7,
      },
      crypto: {
        riskTolerance: 0.3,
        fomo: 0.1,
        trustInInstitutions: 0.05,
        technicalKnowledge: 0.9,
        degenLevel: 0.2,
      },
    },
    normie_investor: {
      bigFive: {
        openness: 0.4,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.7,
        neuroticism: 0.6,
      },
      crypto: {
        riskTolerance: 0.2,
        fomo: 0.5,
        trustInInstitutions: 0.8,
        technicalKnowledge: 0.2,
        degenLevel: 0.1,
      },
    },
    nft_flipper: {
      bigFive: {
        openness: 0.8,
        conscientiousness: 0.3,
        extraversion: 0.9,
        agreeableness: 0.5,
        neuroticism: 0.5,
      },
      crypto: {
        riskTolerance: 0.7,
        fomo: 0.9,
        trustInInstitutions: 0.4,
        technicalKnowledge: 0.4,
        degenLevel: 0.7,
      },
    },
    staking_grandma: {
      bigFive: {
        openness: 0.3,
        conscientiousness: 0.9,
        extraversion: 0.4,
        agreeableness: 0.8,
        neuroticism: 0.2,
      },
      crypto: {
        riskTolerance: 0.1,
        fomo: 0.1,
        trustInInstitutions: 0.6,
        technicalKnowledge: 0.2,
        degenLevel: 0.05,
      },
    },
    protocol_politician: {
      bigFive: {
        openness: 0.6,
        conscientiousness: 0.6,
        extraversion: 0.9,
        agreeableness: 0.8,
        neuroticism: 0.4,
      },
      crypto: {
        riskTolerance: 0.5,
        fomo: 0.4,
        trustInInstitutions: 0.5,
        technicalKnowledge: 0.6,
        degenLevel: 0.3,
      },
    },
  };

  const base = baseProfiles[archetype];

  // Add variance based on follower count and engagement
  const influenceFactor = Math.min(Math.log10(profile.followerCount + 1) / 6, 1);

  return {
    bigFive: {
      openness: clamp(base.bigFive.openness + randomVariance()),
      conscientiousness: clamp(base.bigFive.conscientiousness + randomVariance()),
      extraversion: clamp(base.bigFive.extraversion + influenceFactor * 0.2),
      agreeableness: clamp(base.bigFive.agreeableness + randomVariance()),
      neuroticism: clamp(base.bigFive.neuroticism + randomVariance()),
    },
    crypto: {
      riskTolerance: clamp(base.crypto.riskTolerance + randomVariance()),
      fomo: clamp(base.crypto.fomo + randomVariance()),
      trustInInstitutions: clamp(base.crypto.trustInInstitutions + randomVariance()),
      technicalKnowledge: clamp(base.crypto.technicalKnowledge + randomVariance()),
      degenLevel: clamp(base.crypto.degenLevel + randomVariance()),
    },
  };
}

/**
 * Clamps a value between 0 and 1.
 */
function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Returns a small random variance.
 */
function randomVariance(): number {
  return (Math.random() - 0.5) * 0.2;
}

// =============================================================================
// LLM EXTRACTION
// =============================================================================

/**
 * Parses LLM JSON response into ExtractedTraits.
 */
export function parseLLMResponse(responseText: string): ExtractedTraits | null {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;

    const parsed = JSON.parse(jsonText.trim());

    // Validate required fields
    if (
      !parsed.archetype ||
      !parsed.occupation ||
      !parsed.dialogueSeeds ||
      !parsed.personality
    ) {
      return null;
    }

    // Validate and sanitize dialogue seeds
    const dialogueSeeds = (parsed.dialogueSeeds as string[])
      .slice(0, 5)
      .map((s) => sanitizeText(String(s).substring(0, 50)));

    while (dialogueSeeds.length < 5) {
      dialogueSeeds.push('gm');
    }

    return {
      archetype: parsed.archetype as PersonalityArchetype,
      occupation: parsed.occupation as Occupation,
      dialogueSeeds,
      personality: {
        bigFive: {
          openness: clamp(parsed.personality.bigFive?.openness ?? 0.5),
          conscientiousness: clamp(parsed.personality.bigFive?.conscientiousness ?? 0.5),
          extraversion: clamp(parsed.personality.bigFive?.extraversion ?? 0.5),
          agreeableness: clamp(parsed.personality.bigFive?.agreeableness ?? 0.5),
          neuroticism: clamp(parsed.personality.bigFive?.neuroticism ?? 0.5),
        },
        crypto: {
          riskTolerance: clamp(parsed.personality.crypto?.riskTolerance ?? 0.5),
          fomo: clamp(parsed.personality.crypto?.fomo ?? 0.5),
          trustInInstitutions: clamp(parsed.personality.crypto?.trustInInstitutions ?? 0.5),
          technicalKnowledge: clamp(parsed.personality.crypto?.technicalKnowledge ?? 0.5),
          degenLevel: clamp(parsed.personality.crypto?.degenLevel ?? 0.5),
        },
      },
      confidence: clamp(parsed.confidence ?? 0.7),
      reasoning: parsed.reasoning,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// MAIN EXTRACTION FUNCTION
// =============================================================================

/**
 * Extracts personality traits from an X/Twitter profile.
 *
 * Uses LLM when available, falls back to rule-based extraction otherwise.
 * Either way, you get a fully-formed personality suitable for NPC generation.
 *
 * @param profile - The X/Twitter profile to analyze
 * @param options - Extraction options (LLM preference, model choice)
 * @returns Extracted personality traits, occupation, and dialogue seeds
 */
export async function extractPersonalityFromProfile(
  profile: XProfile,
  options: ExtractionOptions = {}
): Promise<ExtractedTraits> {
  const { useLLM = false } = options;

  // If LLM extraction requested and available
  if (useLLM) {
    try {
      // Build the extraction prompt
      const prompt = buildExtractionPrompt(profile);

      // TODO: Call LLM API (Gemini, OpenAI, etc.)
      // For now, we use rule-based as fallback
      // Example implementation would be:
      // const response = await callLLM(prompt, options.model);
      // const parsed = parseLLMResponse(response);
      // if (parsed) return parsed;

      console.warn('LLM extraction not yet implemented, using rule-based fallback');
    } catch (error) {
      console.warn('LLM extraction failed, using rule-based fallback:', error);
    }
  }

  // Fall back to rule-based extraction
  return extractPersonalityRuleBased(profile);
}

/**
 * Quick extraction for testing - returns archetype and occupation only.
 */
export function quickExtract(bio: string, tweets: string[]): {
  archetype: PersonalityArchetype;
  occupation: Occupation;
} {
  const mockProfile: XProfile = {
    id: 'quick-extract',
    username: 'test',
    displayName: 'Test User',
    bio,
    profileImageUrl: '',
    recentTweets: tweets.map((text, i) => ({
      id: `tweet-${i}`,
      text,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      retweetCount: 0,
      replyCount: 0,
    })),
    followerCount: 1000,
    followingCount: 500,
  };

  const result = extractPersonalityRuleBased(mockProfile);
  return {
    archetype: result.archetype,
    occupation: result.occupation,
  };
}
