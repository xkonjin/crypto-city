/**
 * NFT Flipper Dialogue Pool (US-007)
 * 
 * Dialogue pool for the nft_flipper archetype. 50+ unique lines
 * covering all dialogue contexts, market conditions, and relationship levels.
 * 
 * Voice characteristics:
 * - All about the flip, art secondary
 * - Uses: "floor price", "sweep", "paper hands", "diamond pfp"
 * - References: Bored Apes, floor watching, rarity tools
 * - Hustle mentality, always hunting deals
 * - "This is undervalued, trust me"
 * 
 * @see DialoguePool from ../types.ts
 */

import type { DialoguePool, WeightedDialogue } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Standard cooldown for common lines (3 minutes) */
const COOLDOWN_SHORT = 180000;

/** Medium cooldown for moderate-frequency lines (5 minutes) */
const COOLDOWN_MEDIUM = 300000;

/** Long cooldown for memorable/impactful lines (10 minutes) */
const COOLDOWN_LONG = 600000;

// ============================================================================
// GREETING DIALOGUE POOLS
// ============================================================================

/**
 * General greeting pool
 */
const greetingPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'greeting',
  lines: [
    { text: "Yo! You checking floor prices too?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Nice pfp! Is that from a blue chip collection?", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Gm! Any alpha on new mints today?", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "What's good! You holding or flipping?", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Ayy! You on the whitelist for tonight's drop?", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Looking for deals? Me too. Let's hunt.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bull market greeting pool
 */
const greetingBullPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'greeting',
  marketCondition: 'bull',
  lines: [
    { text: "Floors are pumping everywhere! Time to take profits!", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "This market is crazy! Just flipped three jpegs this morning!", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Everything is up! Even my grails are 10x!", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Yo! You seeing these sweeps? Whales are hungry!", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Bear market greeting pool
 */
const greetingBearPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'greeting',
  marketCondition: 'bear',
  lines: [
    { text: "Floors are brutal right now. But that means deals.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Paper hands are panic selling. Time to accumulate.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Bear market? More like buying season.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "These prices are a gift. People will regret selling.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

// ============================================================================
// MARKET COMMENTARY POOLS
// ============================================================================

/**
 * Bull market commentary
 */
const marketBullPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'market_commentary',
  marketCondition: 'bull',
  lines: [
    { text: "Just swept the floor on a collection. Easy 2x incoming.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Whales are loading up. Follow the smart money.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "This pfp is about to explode. The traits are undervalued.", weight: 0.8, cooldown: COOLDOWN_SHORT },
    { text: "Diamond hands get rewarded. Told you not to paper hand.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Listed at 2 ETH, sold in 30 seconds. This market is insane.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bear market commentary
 */
const marketBearPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'market_commentary',
  marketCondition: 'bear',
  lines: [
    { text: "Floor dropped 50%. Some paper hands are crying right now.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "This is where real collectors are made. Weak hands exit.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Buying the blood. These will be 10x when market turns.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Everyone's delisting. Smart money is scooping everything.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "The art didn't change. Only the price. That's an opportunity.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Crab market commentary
 */
const marketCrabPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'market_commentary',
  marketCondition: 'crab',
  lines: [
    { text: "Volume is dead but I'm still finding deals. You gotta grind.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Crab markets are for building positions. Trust the process.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "No one's buying? Good. More for us.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Floors are stable. Perfect time for some speculative mints.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Volatile market commentary
 */
const marketVolatilePool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'market_commentary',
  marketCondition: 'volatile',
  lines: [
    { text: "Floor's bouncing like crazy. Perfect for quick flips.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Volatility is profit if you know what you're doing.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Just sniped one at the dip. Already up 30%.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Crazy swings mean crazy opportunities. Stay sharp.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// PLAYER REACTION POOLS
// ============================================================================

/**
 * Player bought NFT reactions
 */
const playerBoughtNFTPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'player_reaction',
  lines: [
    { 
      text: "Nice pickup! The rarity on that one is actually solid.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_nft' }],
    },
    { 
      text: "Good eye! That's below floor. Easy flip.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_nft' }],
    },
    { 
      text: "Welcome to the collection. Diamond hands from here, yeah?", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'bought_nft' }],
    },
    { 
      text: "You're gonna make it. That trait combo is fire.", 
      weight: 0.75, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_nft' }],
    },
  ],
};

/**
 * Player sold too early reactions
 */
const playerSoldEarlyPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'player_reaction',
  lines: [
    { 
      text: "You sold already?! That had grail potential, bro.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'sold_early' }],
    },
    { 
      text: "Paper hands! That collection is about to announce utility!", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'sold_early' }],
    },
    { 
      text: "Profit is profit, I guess. But you left money on the table.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'sold_early' }],
    },
  ],
};

/**
 * Player got rugged/scammed reactions
 */
const playerGotRuggedPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'player_reaction',
  lines: [
    { 
      text: "Oof. That project had red flags everywhere. DYOR next time.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'got_rugged' }],
    },
    { 
      text: "That's tough. We've all been there. Learn and move on.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'got_rugged' }],
    },
    { 
      text: "No doxxed team? Anon founders? Those are the warning signs.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'got_rugged' }],
    },
  ],
};

// ============================================================================
// IDLE CHATTER POOLS
// ============================================================================

/**
 * General idle chatter - flipper mentality
 */
const idleChatterPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'idle_chatter',
  lines: [
    { text: "Floor price is everything. Art is subjective, numbers aren't.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "I've got alerts set for every collection. Can't miss a sweep.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "The key is to mint early, flip fast, and never look back.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Rarity tools are my best friend. I study traits like homework.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "This jpeg paid my rent last month. Who's laughing now?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "You gotta spend ETH to make ETH. Gas fees are just the cost of business.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "I don't care about the art. I care about the narrative.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Some call it speculation. I call it pattern recognition.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "Never marry your jpegs. Emotions are for losers.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "The discord alpha groups are where the real plays happen.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "I flipped my first ape into a house deposit. No cap.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "Royalties? I support the artist by buying their stuff. That's enough.", weight: 0.65, cooldown: COOLDOWN_LONG },
    { text: "The best flip is the one you sell before everyone else.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "I'm on like twelve waitlists right now. It's a numbers game.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
    { text: "Utility? The utility is making money. What else do you need?", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
  ],
};

// ============================================================================
// RELATIONSHIP LEVEL POOLS
// ============================================================================

/**
 * Stranger relationship dialogue - hustler vibes
 */
const relationshipStrangerPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'relationship_level',
  relationshipLevel: 'stranger',
  lines: [
    { text: "First time in the space? Let me show you how to read floor charts.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "You got potential. But are you here for art or gains?", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "I don't give out alpha to just anyone. Prove you're serious.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Nice to meet you. What's your win rate on flips?", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Friend relationship dialogue - sharing tips
 */
const relationshipFriendPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'relationship_level',
  relationshipLevel: 'friend',
  lines: [
    { text: "Alright, I'll let you in on something. This collection is about to announce a collab.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "You're one of the good ones. Here's my buy list for the week.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "We should team up on a sweep sometime. Split the profits.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Real talk: I lost big once too. That's how you learn.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "I got you on the next whitelist. Don't tell anyone else.", weight: 0.85, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Close friend relationship dialogue - real talk
 */
const relationshipCloseFriendPool: DialoguePool = {
  archetype: 'nft_flipper',
  context: 'relationship_level',
  relationshipLevel: 'close_friend',
  lines: [
    { text: "Between us? Sometimes I don't know if I actually like any of this art.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "I made 100 ETH last year. But I also lost 50 on rugs. No one talks about that.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "This life is stressful. Always watching charts, always grinding.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "My family thinks I'm gambling. Maybe they're right. But I'm winning.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "The real alpha? Take profits. I've seen too many people ride to zero.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "You're the only one who gets it. Everyone else thinks I'm crazy.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// EXPORT
// ============================================================================

/**
 * All NFT Flipper dialogue pools.
 * Contains 50+ unique lines across all contexts, market conditions,
 * and relationship levels.
 */
export const NFT_FLIPPER_POOLS: DialoguePool[] = [
  // Greetings
  greetingPool,
  greetingBullPool,
  greetingBearPool,
  
  // Market commentary
  marketBullPool,
  marketBearPool,
  marketCrabPool,
  marketVolatilePool,
  
  // Player reactions
  playerBoughtNFTPool,
  playerSoldEarlyPool,
  playerGotRuggedPool,
  
  // Idle chatter
  idleChatterPool,
  
  // Relationship levels
  relationshipStrangerPool,
  relationshipFriendPool,
  relationshipCloseFriendPool,
];
