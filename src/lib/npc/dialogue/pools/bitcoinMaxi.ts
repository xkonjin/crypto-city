/**
 * Bitcoin Maxi Dialogue Pool (US-002)
 * 
 * Dialogue pool for the bitcoin_maxi archetype. 50+ unique lines
 * covering all dialogue contexts, market conditions, and relationship levels.
 * 
 * Voice characteristics:
 * - Absolute conviction in Bitcoin
 * - Dismissive of altcoins ("shitcoins")
 * - Uses: "ser", "anon", "have fun staying poor", "number go up"
 * - References: halving cycles, 21 million cap, Satoshi
 * - Sardonic, slightly superior attitude
 * - Deep distrust of fiat and CBDCs
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
 * General greeting pool - used for time-aware greetings
 */
const greetingPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'greeting',
  lines: [
    { text: "gm. Stack sats, stay humble.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Another day, another chance to stack.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Ah, a fellow traveler. Have you stacked today?", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "gm, anon. The citadel awaits.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
    { text: "Good day to you. Bitcoin fixes this.", weight: 0.8, cooldown: COOLDOWN_SHORT },
    { text: "Welcome. We're all going to make it... those of us who hold Bitcoin, anyway.", weight: 0.65, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bull market greeting pool
 */
const greetingBullPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'greeting',
  marketCondition: 'bull',
  lines: [
    { text: "Another green day. As it should be. Bitcoin fixes this.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "gm, ser. Laser eyes activated.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Number go up technology doing its thing.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Feels good, doesn't it? Patience rewarded.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Bear market greeting pool
 */
const greetingBearPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'greeting',
  marketCondition: 'bear',
  lines: [
    { text: "The weak are selling. The strong are stacking.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Bear market? More like bear discount.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "gm. If you're not stacking at these prices, NGMI.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Few understand. You'll wish you bought more later.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// MARKET COMMENTARY POOLS
// ============================================================================

/**
 * Bull market commentary
 */
const marketBullPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'market_commentary',
  marketCondition: 'bull',
  lines: [
    { text: "Number go up. As predicted. As always.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "This is just the beginning. Wait until the halving catches up.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "The fiat printers have created this. Bitcoin absorbs it all.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Laser eyes were never a meme. They were a prophecy.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "The institutions are coming. Slowly, then all at once.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bear market commentary
 */
const marketBearPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'market_commentary',
  marketCondition: 'bear',
  lines: [
    { text: "This is the accumulation phase they'll write about in textbooks.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Shitcoins are dying. Bitcoin endures. As it always does.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "The Fed will pivot. They always do. And then...", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Have fun staying poor if you're selling now.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Diamond hands aren't forged in bull markets, anon.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Crab market commentary
 */
const marketCrabPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'market_commentary',
  marketCondition: 'crab',
  lines: [
    { text: "Accumulation zone. The calm before the pump.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "The crab walks sideways before it climbs. Patience.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Volatility is compressed. The spring is coiling.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Boring? Good. Boring is when you stack. Exciting is when you wish you had.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Volatile market commentary
 */
const marketVolatilePool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'market_commentary',
  marketCondition: 'volatile',
  lines: [
    { text: "Volatility is the price of admission. Worth every sat.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Leverage liquidations. Nature healing itself.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "The market is teaching lessons today. Expensive ones.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Chaos is a ladder, ser. For those who hold.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// PLAYER REACTION POOLS
// ============================================================================

/**
 * Player bought BTC reactions
 */
const playerBoughtBtcPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'player_reaction',
  lines: [
    { 
      text: "Welcome to the citadel, anon. Diamond hands from here.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_btc' }],
    },
    { 
      text: "You get it. 21 million. Fixed supply. Nothing else matters.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_btc' }],
    },
    { 
      text: "Stack sats, stay humble. This is the way.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'bought_btc' }],
    },
    { 
      text: "Few understand. But you... you understand.", 
      weight: 0.75, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_btc' }],
    },
  ],
};

/**
 * Player sold BTC reactions (disappointed/dismissive)
 */
const playerSoldBtcPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'player_reaction',
  lines: [
    { 
      text: "...Why would you do that? Have fun staying poor.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'sold_btc' }],
    },
    { 
      text: "Paper hands. You'll be back. They always come back.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'sold_btc' }],
    },
    { 
      text: "NGMI. Satoshi weeps.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'sold_btc' }],
    },
  ],
};

/**
 * Player bought altcoins reactions (deeply disappointed)
 */
const playerBoughtAltPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'player_reaction',
  lines: [
    { 
      text: "...A shitcoin? After everything I've told you? NGMI.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_alt' }],
    },
    { 
      text: "That casino chip will be worthless in two cycles. Mark my words.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_alt' }],
    },
    { 
      text: "Have fun with your centralized database with extra steps.", 
      weight: 0.8, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_alt' }],
    },
  ],
};

// ============================================================================
// IDLE CHATTER POOLS
// ============================================================================

/**
 * General idle chatter - crypto philosophy
 */
const idleChatterPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'idle_chatter',
  lines: [
    { text: "You know what the real problem is? Central banks. Bitcoin fixes this.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "21 million. That's it. No more. Ever. Beautiful, isn't it?", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Satoshi gave us a gift. Most are too blind to see it.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "The halving is inevitable. The math is pure.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "Store of value? Sound money? Digital gold? It's all three, ser.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "You either understand, or you don't. There is no middle ground.", weight: 0.65, cooldown: COOLDOWN_LONG },
    { text: "Fiat is the disease. Bitcoin is the cure.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Every shitcoin is just pre-mined fiat with extra steps.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "They call us maxis. I prefer 'correct.'", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
    { text: "CBDC? Surveillance money. No thank you.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "The money printer goes brrr. My portfolio goes up. Simple physics.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "There is no second best. Only Bitcoin.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "First they ignore you. Then they laugh. Then they fight. Then they buy.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "I don't trust. I verify. That's the whole point.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "The timechain never forgets. Unlike your altcoin's promises.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// RELATIONSHIP LEVEL POOLS
// ============================================================================

/**
 * Stranger relationship dialogue - guarded, evangelizing
 */
const relationshipStrangerPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'relationship_level',
  relationshipLevel: 'stranger',
  lines: [
    { text: "Are you here to talk about Bitcoin, or waste my time with shitcoins?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "New here? Good. Less to unlearn.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "I'll say this once: Bitcoin is the only exit. Remember that.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Don't know you yet. Don't trust you yet. But we're all in this together.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Friend relationship dialogue - warmer, still teaching
 */
const relationshipFriendPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'relationship_level',
  relationshipLevel: 'friend',
  lines: [
    { text: "Ah, my friend. Still stacking? Good. WAGMI.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "You're starting to get it. Few do.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Let me tell you about the halving cycles. This is important...", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "I'm glad you're here. Real ones stack together.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Between us? The altcoin casino will collapse. Stay sharp.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Close friend relationship dialogue - personal, trusting
 */
const relationshipCloseFriendPool: DialoguePool = {
  archetype: 'bitcoin_maxi',
  context: 'relationship_level',
  relationshipLevel: 'close_friend',
  lines: [
    { text: "You know, before Bitcoin... I was lost. Just like everyone else.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "I'll let you in on something. My cold storage? Three locations. Steel backups.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "Some nights I just stare at the blockchain. It's beautiful, you know?", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "When the citadel comes... you'll have a place. I've made sure of it.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Don't tell anyone, but I once owned ETH. Dark times. I was young.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "Real talk: the inflation numbers are worse than they tell us. Much worse.", weight: 0.85, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// EXPORT
// ============================================================================

/**
 * All Bitcoin Maxi dialogue pools.
 * Contains 50+ unique lines across all contexts, market conditions,
 * and relationship levels.
 */
export const BITCOIN_MAXI_POOLS: DialoguePool[] = [
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
  playerBoughtBtcPool,
  playerSoldBtcPool,
  playerBoughtAltPool,
  
  // Idle chatter
  idleChatterPool,
  
  // Relationship levels
  relationshipStrangerPool,
  relationshipFriendPool,
  relationshipCloseFriendPool,
];
