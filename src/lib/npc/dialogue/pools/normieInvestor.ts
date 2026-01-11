/**
 * Normie Investor Dialogue Pool (US-006)
 * 
 * Dialogue pool for the normie_investor archetype. 50+ unique lines
 * covering all dialogue contexts, market conditions, and relationship levels.
 * 
 * Voice characteristics:
 * - New to crypto, confused but trying
 * - Uses mainstream terms incorrectly
 * - References: "the Bitcoin", "my financial advisor", "is this safe?"
 * - Cautious, follows the herd
 * - "I heard about this on CNBC"
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
  archetype: 'normie_investor',
  context: 'greeting',
  lines: [
    { text: "Oh hi! Are you into the Bitcoin too?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Hello! My cousin told me to come here. Something about crypto?", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Hi there! Is this where people buy the cryptocurrencies?", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Good to see you! I just downloaded an app for this.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Hey! I heard about this whole thing on CNBC. Thought I'd check it out.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Hello! Do you know if this is safe? My bank said to be careful.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bull market greeting pool
 */
const greetingBullPool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'greeting',
  marketCondition: 'bull',
  lines: [
    { text: "Hi! I heard prices are going up? Should I buy now?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Hello! Everyone at work is talking about crypto. Am I too late?", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Oh wow, my portfolio app is all green! Is that good?", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Hi there! My neighbor just bought a Tesla from his crypto gains!", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Bear market greeting pool
 */
const greetingBearPool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'greeting',
  marketCondition: 'bear',
  lines: [
    { text: "Oh no, my app is showing red everywhere. What's happening?!", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Hi... is this normal? My investment is down 40%...", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Should I be worried? CNBC said crypto is crashing.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Hello... my financial advisor said I should have sold weeks ago.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

// ============================================================================
// MARKET COMMENTARY POOLS
// ============================================================================

/**
 * Bull market commentary
 */
const marketBullPool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'market_commentary',
  marketCondition: 'bull',
  lines: [
    { text: "I can't believe I'm finally making money on this! Should I tell my 401k manager?", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "My cousin was right! He said this would go to the moon. What's a moon though?", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Is now a good time to buy more? Or is it too expensive?", weight: 0.8, cooldown: COOLDOWN_SHORT },
    { text: "The TV said institutional investors are buying. That sounds safe, right?", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Should I put in my emergency fund too? This seems like free money!", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bear market commentary
 */
const marketBearPool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'market_commentary',
  marketCondition: 'bear',
  lines: [
    { text: "Is this the crash everyone warned me about? Should I sell everything?", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "My financial advisor just sent me a very long email...", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "I don't understand. How can it go down if everyone is buying?", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Maybe I should just put this back in my savings account...", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "CNBC is calling it a bubble. I knew I should have stayed in index funds.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Crab market commentary
 */
const marketCrabPool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'market_commentary',
  marketCondition: 'crab',
  lines: [
    { text: "It's not going up or down. Is something wrong with the market?", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "My app hasn't changed in days. Did crypto break?", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "I thought this was supposed to be volatile? Stocks are more exciting.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "At least I'm not losing money... I think? How do I check?", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Volatile market commentary
 */
const marketVolatilePool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'market_commentary',
  marketCondition: 'volatile',
  lines: [
    { text: "My portfolio is giving me anxiety. It changed 20% in an hour!", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Is this normal?! My stocks never move this fast!", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "I refreshed the app and I'm up, then down, then up again. Help?", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "My financial advisor said crypto is too risky. I'm starting to believe him.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// PLAYER REACTION POOLS
// ============================================================================

/**
 * Player helped/explained reactions
 */
const playerHelpedPool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'player_reaction',
  lines: [
    { 
      text: "Oh, that actually makes sense! Thank you for explaining it simply.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'helped_explain' }],
    },
    { 
      text: "So it's like a digital stock but... more complicated? Got it!", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'helped_explain' }],
    },
    { 
      text: "My cousin never explained it that well. You should work at the bank!", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'helped_explain' }],
    },
    { 
      text: "I'm going to write this down so I don't forget. Thanks!", 
      weight: 0.75, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'helped_explain' }],
    },
  ],
};

/**
 * Player used jargon reactions (confused)
 */
const playerUsedJargonPool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'player_reaction',
  lines: [
    { 
      text: "I... I don't know what any of those words mean.", 
      weight: 0.9, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'used_jargon' }],
    },
    { 
      text: "Staking? Like vampire hunting? No? Oh...", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'used_jargon' }],
    },
    { 
      text: "Can you say that again? But in English this time?", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'used_jargon' }],
    },
  ],
};

/**
 * Player recommended risky investment reactions
 */
const playerRiskyAdvicePool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'player_reaction',
  lines: [
    { 
      text: "That sounds risky... Let me ask my financial advisor first.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'risky_advice' }],
    },
    { 
      text: "All in? But what about diversification? That's what CNBC always says.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'risky_advice' }],
    },
    { 
      text: "I appreciate the tip, but I'm more of a 'slow and steady' person.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'risky_advice' }],
    },
  ],
};

// ============================================================================
// IDLE CHATTER POOLS
// ============================================================================

/**
 * General idle chatter - confused normie
 */
const idleChatterPool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'idle_chatter',
  lines: [
    { text: "So wait, there's no actual company behind Bitcoin? Then who runs it?", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "I keep my password in a very safe place. My email drafts folder.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "My bank called to ask about my 'suspicious' transfers. So awkward.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Do I have to pay taxes on this? I should ask my accountant...", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "What's the difference between Bitcoin and Ethereum? Aren't they the same thing?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "I heard there's something called DeFi? Is that like WiFi but for money?", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Someone told me to HODL. Is that a company or something?", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "I tried to buy some NFTs but I don't understand why JPEGs cost so much.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "My nephew said to 'DYOR'. Is that another cryptocurrency?", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Is it weird that I still don't know what blockchain actually does?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "I've had this app for 6 months and I still don't know how to use it properly.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "My financial advisor looked at me funny when I mentioned crypto.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "I wrote my seed phrase on a Post-it note. That's safe, right?", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Everyone talks about wallets but I can't find where to put my credit card.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "I put in $100 because that seemed safe. Is that how much you're supposed to start with?", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

// ============================================================================
// RELATIONSHIP LEVEL POOLS
// ============================================================================

/**
 * Stranger relationship dialogue - polite but clueless
 */
const relationshipStrangerPool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'relationship_level',
  relationshipLevel: 'stranger',
  lines: [
    { text: "Excuse me, are you good with computers? I have some questions...", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "I don't mean to bother you, but do you know about the crypto?", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Sorry to ask, but is this exchange thing legitimate? It looks sketchy.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Hi, I'm new here. Everyone seems to know what they're doing except me.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Friend relationship dialogue - more comfortable asking questions
 */
const relationshipFriendPool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'relationship_level',
  relationshipLevel: 'friend',
  lines: [
    { text: "Can I be honest? I still don't really understand any of this.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "You seem to know a lot. Can you explain it like I'm five?", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Between us, I only bought this because my colleague was bragging about his gains.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "I trust you more than those YouTube videos. What should I actually do?", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "You won't laugh, but I thought the Bitcoin logo was an actual coin.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Close friend relationship dialogue - confessional
 */
const relationshipCloseFriendPool: DialoguePool = {
  archetype: 'normie_investor',
  context: 'relationship_level',
  relationshipLevel: 'close_friend',
  lines: [
    { text: "I haven't told my spouse about my crypto. They think it's all a scam.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "Remember when I said I only put in $100? It was actually my bonus...", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "Sometimes I dream about getting rich from this. Then I check my portfolio.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "I actually really enjoy this, even if I don't understand it. Don't tell anyone.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "My financial advisor says to sell, but... I kind of want to keep going?", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "You're the only person I can talk to about this. No one else gets it.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// EXPORT
// ============================================================================

/**
 * All Normie Investor dialogue pools.
 * Contains 50+ unique lines across all contexts, market conditions,
 * and relationship levels.
 */
export const NORMIE_INVESTOR_POOLS: DialoguePool[] = [
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
  playerHelpedPool,
  playerUsedJargonPool,
  playerRiskyAdvicePool,
  
  // Idle chatter
  idleChatterPool,
  
  // Relationship levels
  relationshipStrangerPool,
  relationshipFriendPool,
  relationshipCloseFriendPool,
];
