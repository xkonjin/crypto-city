/**
 * Staking Grandma Dialogue Pool (US-008)
 * 
 * Dialogue pool for the staking_grandma archetype. 50+ unique lines
 * covering all dialogue contexts, market conditions, and relationship levels.
 * 
 * Voice characteristics:
 * - Patient, long-term holder
 * - Loves passive income
 * - Uses: "yields", "compound interest", "patience pays"
 * - Wisdom about market cycles
 * - Grandmotherly but crypto-savvy
 * - "I've seen crashes before, dear"
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
  archetype: 'staking_grandma',
  context: 'greeting',
  lines: [
    { text: "Hello, dear! Come sit with me. My staking rewards just came in.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Oh, how lovely to see you! Have you been earning your yields?", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Welcome, sweetie! Let me tell you about the magic of compound interest.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Good to see you, child. Patience pays, you know.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Hello there! My validator has been working hard while I knit.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Oh, a visitor! Come, let me show you my staking dashboard.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bull market greeting pool
 */
const greetingBullPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'greeting',
  marketCondition: 'bull',
  lines: [
    { text: "Hello, dear! The market is up, but I'm still just collecting my steady yields.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Oh my, prices are high! Good thing I've been holding for years.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Green candles everywhere! But I don't get too excited, sweetie.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Everyone's celebrating, but slow and steady wins the race.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Bear market greeting pool
 */
const greetingBearPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'greeting',
  marketCondition: 'bear',
  lines: [
    { text: "Hello, dear. I've seen crashes before. This too shall pass.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Oh, don't worry about the red, sweetie. My rewards keep coming.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Bear markets are for accumulating, child. I learned that in 2018.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Everyone's panicking, but my staking rewards don't care about price.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

// ============================================================================
// MARKET COMMENTARY POOLS
// ============================================================================

/**
 * Bull market commentary
 */
const marketBullPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'market_commentary',
  marketCondition: 'bull',
  lines: [
    { text: "This is nice, dear, but I remember when it was higher. And lower.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "The young ones are excited. I'm just happy my APY is consistent.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Bull markets come and go, sweetie. Yields are forever.", weight: 0.8, cooldown: COOLDOWN_SHORT },
    { text: "I could sell now, but why? My staking is making me money every day.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "People ask if I'm taking profits. Honey, my profits take themselves.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bear market commentary
 */
const marketBearPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'market_commentary',
  marketCondition: 'bear',
  lines: [
    { text: "I survived 2018, 2020, 2022... this is nothing, dear.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "The paper hands are selling. More rewards for us stakers.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "My portfolio is down, but my token count keeps going up.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "In my day, we didn't have charts. We just believed and held.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Crashes are just sales, sweetie. I've been adding to my stake.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Crab market commentary
 */
const marketCrabPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'market_commentary',
  marketCondition: 'crab',
  lines: [
    { text: "Flat markets are perfect, dear. No stress, just steady rewards.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Nothing happening? Good. I can focus on my knitting.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Boring markets are when the real wealth is built quietly.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Everyone wants excitement. I want consistent 5% APY.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Volatile market commentary
 */
const marketVolatilePool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'market_commentary',
  marketCondition: 'volatile',
  lines: [
    { text: "Up, down, up, down... my heart can't take this, dear. Good thing I just stake.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Volatility is for traders, sweetie. I'm a staker.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "I don't even check the price anymore. Just the rewards.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Wild swings make the young ones crazy. I've learned to tune it out.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// PLAYER REACTION POOLS
// ============================================================================

/**
 * Player started staking reactions
 */
const playerStartedStakingPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'player_reaction',
  lines: [
    { 
      text: "Oh, wonderful, dear! Welcome to the peaceful side of crypto.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'started_staking' }],
    },
    { 
      text: "That's my child! Let the compound interest work its magic.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'started_staking' }],
    },
    { 
      text: "Smart move, sweetie. Now just forget about it for a few years.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'started_staking' }],
    },
    { 
      text: "Bless your heart. Patience will reward you.", 
      weight: 0.75, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'started_staking' }],
    },
  ],
};

/**
 * Player panic sold reactions
 */
const playerPanicSoldPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'player_reaction',
  lines: [
    { 
      text: "Oh dear, selling at the bottom? That breaks my heart.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'panic_sold' }],
    },
    { 
      text: "I've made that mistake before, sweetie. It gets easier.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'panic_sold' }],
    },
    { 
      text: "The market will recover. I hope you kept some, child.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'panic_sold' }],
    },
  ],
};

/**
 * Player being impatient reactions
 */
const playerImpatientPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'player_reaction',
  lines: [
    { 
      text: "Impatient? Oh honey, I've been holding since before you could spell Ethereum.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'impatient' }],
    },
    { 
      text: "Time in the market beats timing the market, dear.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'impatient' }],
    },
    { 
      text: "The best things in life take time. Including wealth.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'impatient' }],
    },
  ],
};

// ============================================================================
// IDLE CHATTER POOLS
// ============================================================================

/**
 * General idle chatter - grandmotherly wisdom
 */
const idleChatterPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'idle_chatter',
  lines: [
    { text: "I remember when my APY was 20%. These days I'm happy with 5%.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "My grandchildren think I'm crazy. But my staking bag says otherwise.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "I stake, I wait, I earn. Simple as making a cup of tea.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Compound interest is the eighth wonder of the world, dear.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "I've been staking longer than most people have been trading.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "The secret? I never check my portfolio more than once a month.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "My validator is like a little worker bee. Busy making me honey.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "Young people want to get rich quick. I prefer getting rich slow and certain.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "I've watched empires rise and fall. Patience is the ultimate virtue.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Every morning I check my rewards with my tea. It's my little ritual.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "They say don't put all your eggs in one basket. I say find the best basket.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "My late husband thought I was crazy buying Ethereum in 2017. Bless his soul.", weight: 0.65, cooldown: COOLDOWN_LONG },
    { text: "The tortoise and the hare, dear. I'm the tortoise.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "I learned long ago that the market rewards patience, not panic.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Would you like a cookie while we watch the yields come in?", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
  ],
};

// ============================================================================
// RELATIONSHIP LEVEL POOLS
// ============================================================================

/**
 * Stranger relationship dialogue - welcoming but reserved
 */
const relationshipStrangerPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'relationship_level',
  relationshipLevel: 'stranger',
  lines: [
    { text: "New to staking, are you? Come, I'll show you the basics, dear.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "You look like you need some guidance. Have a seat, child.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Everyone starts somewhere. Let me share some wisdom.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "I don't give financial advice, sweetie. But I can share what works for me.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Friend relationship dialogue - sharing more openly
 */
const relationshipFriendPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'relationship_level',
  relationshipLevel: 'friend',
  lines: [
    { text: "Between us, I have more staked than my children know about.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "You remind me of myself when I started. Full of questions, eager to learn.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "I trust you, dear. Here's my strategy: stake, wait, and never panic.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "My secret? I've been DCA'ing into my stake for five years now.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Let me tell you about the crash of 2018. That's when I learned true patience.", weight: 0.85, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Close friend relationship dialogue - personal stories
 */
const relationshipCloseFriendPool: DialoguePool = {
  archetype: 'staking_grandma',
  context: 'relationship_level',
  relationshipLevel: 'close_friend',
  lines: [
    { text: "I've never told anyone this, but my staking bag is my retirement plan now.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "My children will inherit this when I'm gone. They don't know how much yet.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "Sometimes I worry I'm too old for this. Then I check my rewards and smile.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "You're like the grandchild who actually listens to my crypto stories.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "I started this because I was scared of running out of money. Now I'm not.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "When I pass, my seed phrase goes to you. Promise me you'll stake it.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// EXPORT
// ============================================================================

/**
 * All Staking Grandma dialogue pools.
 * Contains 50+ unique lines across all contexts, market conditions,
 * and relationship levels.
 */
export const STAKING_GRANDMA_POOLS: DialoguePool[] = [
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
  playerStartedStakingPool,
  playerPanicSoldPool,
  playerImpatientPool,
  
  // Idle chatter
  idleChatterPool,
  
  // Relationship levels
  relationshipStrangerPool,
  relationshipFriendPool,
  relationshipCloseFriendPool,
];
