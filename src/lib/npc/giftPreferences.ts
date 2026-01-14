/**
 * Token Gift Preference System
 * 
 * NPCs have preferred tokens for gifts, creating strategic gifting
 * similar to Stardew Valley's gift system.
 * 
 * Issue #136: Token gift preference system
 */

import type { CryptoNPC, Occupation } from '@/games/isocity/types/npc';

// =============================================================================
// TYPES
// =============================================================================

export type GiftReaction = 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated';

export interface GiftPreference {
  tokenId: string;
  reaction: GiftReaction;
  reason?: string;  // Why they feel this way
}

export interface GiftResult {
  reaction: GiftReaction;
  relationshipChange: number;
  dialogue: string;
  reason?: string;
}

export interface NPCGiftProfile {
  lovedTokens: string[];
  likedTokens: string[];
  dislikedTokens: string[];
  hatedTokens: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Relationship points for each reaction type
 */
export const GIFT_RELATIONSHIP_POINTS: Record<GiftReaction, number> = {
  loved: 80,
  liked: 45,
  neutral: 20,
  disliked: -20,
  hated: -40,
};

/**
 * Birthday multiplier for gift reactions
 */
export const BIRTHDAY_MULTIPLIER = 3;

/**
 * Weekly gift limit per NPC
 */
export const WEEKLY_GIFT_LIMIT = 2;

/**
 * Token categories for preference generation
 */
export const TOKEN_CATEGORIES = {
  bluechip: ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC'],
  defi: ['AAVE', 'UNI', 'CRV', 'MKR', 'COMP', 'SUSHI'],
  meme: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK'],
  stablecoin: ['USDC', 'USDT', 'DAI', 'FRAX'],
  nft: ['APE', 'BLUR', 'LOOKS', 'X2Y2'],
  layer2: ['ARB', 'OP', 'IMX', 'LRC'],
  privacy: ['XMR', 'ZEC', 'SCRT'],
  ai: ['FET', 'OCEAN', 'AGIX', 'RNDR'],
} as const;

/**
 * All tokens flattened
 */
export const ALL_TOKENS = Object.values(TOKEN_CATEGORIES).flat();

// =============================================================================
// PREFERENCE GENERATION
// =============================================================================

/**
 * Generate gift preferences based on occupation and personality
 */
export function generateGiftPreferences(
  occupation: Occupation,
  personality: { riskTolerance: number; technicalKnowledge: number; degenLevel: number }
): NPCGiftProfile {
  const profile: NPCGiftProfile = {
    lovedTokens: [],
    likedTokens: [],
    dislikedTokens: [],
    hatedTokens: [],
  };
  
  // Occupation-based preferences
  const occupationPrefs = OCCUPATION_PREFERENCES[occupation] || {};
  
  // Add occupation loved tokens
  if (occupationPrefs.loved) {
    profile.lovedTokens.push(...occupationPrefs.loved);
  }
  
  // Add occupation disliked tokens
  if (occupationPrefs.disliked) {
    profile.dislikedTokens.push(...occupationPrefs.disliked);
  }
  
  // Personality-based preferences
  
  // High risk tolerance = loves memes
  if (personality.riskTolerance > 0.7) {
    profile.lovedTokens.push(...TOKEN_CATEGORIES.meme.slice(0, 2));
  } else if (personality.riskTolerance < 0.3) {
    profile.dislikedTokens.push(...TOKEN_CATEGORIES.meme);
    profile.likedTokens.push(...TOKEN_CATEGORIES.bluechip);
  }
  
  // Technical knowledge = loves DeFi
  if (personality.technicalKnowledge > 0.7) {
    profile.lovedTokens.push(...TOKEN_CATEGORIES.defi.slice(0, 2));
    profile.likedTokens.push(...TOKEN_CATEGORIES.layer2);
  }
  
  // Degen level affects meme preferences
  if (personality.degenLevel > 0.8) {
    profile.lovedTokens.push('PEPE', 'BONK');
    profile.hatedTokens.push(...TOKEN_CATEGORIES.stablecoin);
  }
  
  // Everyone has some neutral/liked tokens
  const remainingTokens = ALL_TOKENS.filter(t => 
    !profile.lovedTokens.includes(t) &&
    !profile.likedTokens.includes(t) &&
    !profile.dislikedTokens.includes(t) &&
    !profile.hatedTokens.includes(t)
  );
  
  // Add some liked tokens randomly
  const shuffled = [...remainingTokens].sort(() => Math.random() - 0.5);
  profile.likedTokens.push(...shuffled.slice(0, 3));
  
  // Remove duplicates
  profile.lovedTokens = [...new Set(profile.lovedTokens)];
  profile.likedTokens = [...new Set(profile.likedTokens)];
  profile.dislikedTokens = [...new Set(profile.dislikedTokens)];
  profile.hatedTokens = [...new Set(profile.hatedTokens)];
  
  return profile;
}

/**
 * Occupation-specific token preferences
 */
const OCCUPATION_PREFERENCES: Partial<Record<Occupation, { loved?: string[]; disliked?: string[] }>> = {
  trader: {
    loved: ['BTC', 'ETH', 'SOL'],
    disliked: ['USDT'], // Traders want volatility
  },
  developer: {
    loved: ['ETH', 'SOL', 'ARB', 'OP'],
    disliked: ['DOGE', 'SHIB'],
  },
  miner: {
    loved: ['BTC', 'ETH', 'LTC'],
    disliked: ['USDC'],
  },
  shop_owner: {
    loved: ['USDC', 'DAI'], // Stability for business
    disliked: ['PEPE', 'FLOKI'],
  },
  bartender: {
    loved: ['DOGE', 'PEPE'], // Fun tokens
  },
  artist: {
    loved: ['APE', 'BLUR', 'RNDR'],
    disliked: ['USDT'],
  },
  security: {
    loved: ['XMR', 'ZEC'], // Privacy focused
    disliked: ['SHIB'],
  },
  unemployed: {
    loved: ['PEPE', 'BONK', 'FLOKI'], // Lottery tickets
  },
};

// =============================================================================
// GIFT PROCESSING
// =============================================================================

/**
 * Process a gift and return the result
 */
export function processGift(
  tokenId: string,
  giftProfile: NPCGiftProfile,
  isBirthday: boolean = false
): GiftResult {
  let reaction: GiftReaction = 'neutral';
  let reason: string | undefined;
  
  // Check preference lists
  if (giftProfile.lovedTokens.includes(tokenId)) {
    reaction = 'loved';
    reason = `${tokenId} is one of their favorites!`;
  } else if (giftProfile.hatedTokens.includes(tokenId)) {
    reaction = 'hated';
    reason = `They really don't like ${tokenId}...`;
  } else if (giftProfile.likedTokens.includes(tokenId)) {
    reaction = 'liked';
  } else if (giftProfile.dislikedTokens.includes(tokenId)) {
    reaction = 'disliked';
    reason = `${tokenId} isn't their thing.`;
  }
  
  // Calculate relationship change
  let relationshipChange = GIFT_RELATIONSHIP_POINTS[reaction];
  if (isBirthday) {
    relationshipChange *= BIRTHDAY_MULTIPLIER;
  }
  
  // Generate dialogue
  const dialogue = generateGiftDialogue(tokenId, reaction, isBirthday);
  
  return {
    reaction,
    relationshipChange,
    dialogue,
    reason,
  };
}

/**
 * Generate dialogue for gift reaction
 */
function generateGiftDialogue(
  tokenId: string,
  reaction: GiftReaction,
  isBirthday: boolean
): string {
  const dialogues: Record<GiftReaction, string[]> = {
    loved: [
      `${tokenId}?! You remembered! This is exactly what I wanted!`,
      `No way... ${tokenId}! You're amazing, thank you so much!`,
      `I can't believe it... ${tokenId}! This made my day!`,
      `${tokenId}!! How did you know?! I'm holding this forever!`,
    ],
    liked: [
      `Oh nice, ${tokenId}! Thanks, I appreciate it.`,
      `${tokenId}, solid choice. Thank you!`,
      `Hey, I like ${tokenId}! Thanks for thinking of me.`,
    ],
    neutral: [
      `${tokenId}? Thanks, I guess. Not really my thing but I appreciate the thought.`,
      `Oh, ${tokenId}. Thanks... I'll find something to do with it.`,
      `${tokenId}, huh. Well, it's the thought that counts!`,
    ],
    disliked: [
      `${tokenId}...? Um, thanks I guess. Not really my style though.`,
      `Oh... ${tokenId}. I mean, thanks but... yeah.`,
      `${tokenId}? Do you... not know me at all?`,
    ],
    hated: [
      `${tokenId}?! Are you serious? This is basically an insult.`,
      `You got me ${tokenId}? Did I do something to offend you?`,
      `${tokenId}... wow. I don't even know what to say.`,
      `Please tell me this is a joke. ${tokenId}? Really?`,
    ],
  };
  
  const options = dialogues[reaction];
  let dialogue = options[Math.floor(Math.random() * options.length)];
  
  if (isBirthday && reaction === 'loved') {
    dialogue = `On my birthday too?! ` + dialogue;
  } else if (isBirthday && reaction === 'hated') {
    dialogue = `On my BIRTHDAY?! ` + dialogue;
  }
  
  return dialogue;
}

/**
 * Check if NPC can receive more gifts this week
 */
export function canReceiveGift(
  giftsThisWeek: number
): boolean {
  return giftsThisWeek < WEEKLY_GIFT_LIMIT;
}

/**
 * Get a hint about NPC preferences through dialogue
 */
export function getPreferenceHint(
  profile: NPCGiftProfile,
  relationshipLevel: number
): string | null {
  // Only give hints if relationship is decent
  if (relationshipLevel < 30) return null;
  
  // 30% chance to give a hint
  if (Math.random() > 0.3) return null;
  
  const hintType = Math.random();
  
  if (hintType < 0.4 && profile.lovedTokens.length > 0) {
    // Hint at loved token
    const token = profile.lovedTokens[Math.floor(Math.random() * profile.lovedTokens.length)];
    return `You know, I've been really into ${token} lately. Just saying...`;
  } else if (hintType < 0.7 && profile.hatedTokens.length > 0) {
    // Warn about hated token
    const token = profile.hatedTokens[Math.floor(Math.random() * profile.hatedTokens.length)];
    return `Ugh, don't even get me started on ${token}. Can't stand it.`;
  } else if (profile.likedTokens.length > 0) {
    // Hint at liked token
    const token = profile.likedTokens[Math.floor(Math.random() * profile.likedTokens.length)];
    return `${token}'s pretty cool, I think.`;
  }
  
  return null;
}
