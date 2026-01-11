/**
 * Degen Trader Dialogue Pool (US-004)
 * 
 * Dialogue pool for the degen_trader archetype. 50+ unique lines
 * covering all dialogue contexts, market conditions, and relationship levels.
 * 
 * Voice characteristics:
 * - Lives for the thrill of high-risk trades
 * - YOLO mentality, apes into everything
 * - Uses: "aping", "LFG", "to the moon", "rekt", "bags", "100x or nothing"
 * - Talks about leverage, liquidations, memecoins
 * - No regrets, even when losing everything
 * - Sardonic humor about their own gambling addiction
 * - References: PEPE, WIF, "I'm financially ruined", "sir this is a casino"
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
 * General greeting pool - high energy degen vibes
 */
const greetingPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'greeting',
  lines: [
    { text: "Yo! What's pumping today? I need a play!", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "LFG! You got any alpha? I'm ready to ape!", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Sir, this is a casino. And I'm the house's worst nightmare.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Gm! My portfolio is down 90% but my vibes are UP!", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Another day, another opportunity to get rekt! Let's gooo!", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
    { text: "You trading or are you just here to watch me lose money?", weight: 0.65, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bull market greeting pool - maximum euphoria
 */
const greetingBullPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'greeting',
  marketCondition: 'bull',
  lines: [
    { text: "EVERYTHING IS PUMPING LFG!!! Where's my leverage?!", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Bull market baby! Time to turn $100 into $1M or $0!", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "To the moon! *apes into random memecoin*", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Green candles everywhere! I'm literally crying rn!", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Bear market greeting pool - cope and hopium
 */
const greetingBearPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'greeting',
  marketCondition: 'bear',
  lines: [
    { text: "Buying the dip. And the dip of the dip. And the dip of the...", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Down 80%. This is fine. *nervous laughter*", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Bear market? More like discount season! *maxes leverage*", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "I'm not crying, you're crying. Also I'm crying.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// MARKET COMMENTARY POOLS
// ============================================================================

/**
 * Bull market commentary - euphoria overload
 */
const marketBullPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'market_commentary',
  marketCondition: 'bull',
  lines: [
    { text: "NUMBER GO UP TECHNOLOGY ACTIVATED! LFG!!!", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "100x leverage long, this can't go wrong!", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "My dog coin is up 500%! I'm basically a genius!", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Bears are SO rekt right now! NGMI ser!", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Bull markets make everyone a genius. I was always a genius tho.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bear market commentary - copium maximum
 */
const marketBearPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'market_commentary',
  marketCondition: 'bear',
  lines: [
    { text: "Just need one 100x to make it all back. Easy.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "I'm not trapped, I'm early. Very early. Extremely early.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Generational buying opportunity! *is down 95%*", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "It's not a loss until you sell. I'm diamond handing this to zero.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Cope? This isn't cope. This is STRATEGY. Big difference.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Crab market commentary - boredom gambling
 */
const marketCrabPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'market_commentary',
  marketCondition: 'crab',
  lines: [
    { text: "This crab is killing me. I need volatility or I'll explode.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Sideways? Boring! Time to find some obscure 1000x gem.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "When market won't pump, you make it pump. *opens leverage*", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Crab market? More like YOLO into random presales market.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Volatile market commentary - chaos is home
 */
const marketVolatilePool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'market_commentary',
  marketCondition: 'volatile',
  lines: [
    { text: "Volatility! This is what I LIVE for! SEND IT!!!", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Got liquidated three times today. Fourth time's the charm!", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Charts looking like my EKG when I check my portfolio.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Chaos is a ladder, and I'm climbing it with 100x leverage!", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// PLAYER REACTION POOLS
// ============================================================================

/**
 * Player made money reactions
 */
const playerWonPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'player_reaction',
  lines: [
    { 
      text: "SHEEEESH! You're a genius! Now do it again with leverage!", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'made_profit' }],
    },
    { 
      text: "Based! But gains aren't real until they're 100x gains.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'made_profit' }],
    },
    { 
      text: "Nice! Now let it ride on a memecoin!", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'made_profit' }],
    },
  ],
};

/**
 * Player got rekt reactions (empathy through shared pain)
 */
const playerRektPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'player_reaction',
  lines: [
    { 
      text: "Welcome to the club! First liquidation is always free.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'got_rekt' }],
    },
    { 
      text: "Oof. Been there. Many times. Like, SO many times.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'got_rekt' }],
    },
    { 
      text: "It's just money. You can always ape back in and lose more!", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'got_rekt' }],
    },
  ],
};

/**
 * Player sold reactions (paper hands energy)
 */
const playerSoldPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'player_reaction',
  lines: [
    { 
      text: "Paper hands detected. NGMI ser.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'sold' }],
    },
    { 
      text: "You sold?! It's gonna pump now. It always pumps after you sell.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'sold' }],
    },
    { 
      text: "Weak. Diamond hands or nothing, ser.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'sold' }],
    },
  ],
};

/**
 * Player bought memecoin reactions
 */
const playerBoughtMemecoinPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'player_reaction',
  lines: [
    { 
      text: "Ayyyy memecoin gang! One of us! ONE OF US!", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_memecoin' }],
    },
    { 
      text: "Based! PEPE or WIF? Either way, LFG!", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_memecoin' }],
    },
  ],
};

// ============================================================================
// IDLE CHATTER POOLS
// ============================================================================

/**
 * General idle chatter - pure degen energy
 */
const idleChatterPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'idle_chatter',
  lines: [
    { text: "I'm financially ruined but spiritually enlightened. WAGMI.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Sir, this is a casino. And I keep coming back.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "100x or nothing. That's not a strategy, that's a lifestyle.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "My portfolio looks like a crime scene. Beautiful.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Just ape'd into a coin because the ticker was funny. No regrets.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "FOMO is just another word for being early... to losses.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "I don't need therapy. I need a 100x. Same thing basically.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Diamond hands? More like diamond brain. Smooth and hard.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Leverage is like spice. A little is fine. I use a LOT.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
    { text: "My exit strategy is Lambo or food stamps. No in between.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "The charts said no. My hopium said yes. I listened to hopium.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Another day, another bad decision. Consistency is key.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "I once held through a 99% dump. Still holding. Diamond hands baby.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "They call me a degen. I prefer 'high-risk visionary.'", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
    { text: "Risk management? Never heard of her.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "The real gains were the liquidations we met along the way.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "Sleep is for people who aren't watching 1-minute candles.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "My investment thesis: funny dog = moon. It's simple math.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

// ============================================================================
// RELATIONSHIP LEVEL POOLS
// ============================================================================

/**
 * Stranger relationship dialogue - recruiting new degens
 */
const relationshipStrangerPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'relationship_level',
  relationshipLevel: 'stranger',
  lines: [
    { text: "New face! You look like someone who'd enjoy losing money!", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Yo! You trade? I got a hot tip. It's probably terrible.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Welcome! Do you have money? Soon you won't. It's great here.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "First time? Don't worry, the losses get easier. Kinda.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Friend relationship dialogue - sharing bad alpha
 */
const relationshipFriendPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'relationship_level',
  relationshipLevel: 'friend',
  lines: [
    { text: "Yo fren! I found another gem! (Last five were rugs but this one...)", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Bro! Let's do a coordinated ape! Strength in numbers!", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Good to see you! My portfolio is down but my friendship is up!", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Between us... I'm NEVER selling. Even when I should. Especially then.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Wanna split a 50x leveraged position? Two degens, one trade!", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Close friend relationship dialogue - deep degen confessions
 */
const relationshipCloseFriendPool: DialoguePool = {
  archetype: 'degen_trader',
  context: 'relationship_level',
  relationshipLevel: 'close_friend',
  lines: [
    { text: "Real talk: I've lost enough to buy a house. I'm still having fun.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "You're one of the few who gets it. We're not gambling. We're... vibing.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "I told my family I'm 'in tech.' They don't need to know about the liquidations.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Between us? The adrenaline is the real profit. Money is just keeping score.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "If I ever stop degening, check my pulse. I'm probably dead.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "You know what's weird? I've never been happier. Poorer, but happier.", weight: 0.85, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// EXPORT
// ============================================================================

/**
 * All Degen Trader dialogue pools.
 * Contains 50+ unique lines across all contexts, market conditions,
 * and relationship levels.
 */
export const DEGEN_TRADER_POOLS: DialoguePool[] = [
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
  playerWonPool,
  playerRektPool,
  playerSoldPool,
  playerBoughtMemecoinPool,
  
  // Idle chatter
  idleChatterPool,
  
  // Relationship levels
  relationshipStrangerPool,
  relationshipFriendPool,
  relationshipCloseFriendPool,
];
