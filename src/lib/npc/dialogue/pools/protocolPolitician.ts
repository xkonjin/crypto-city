/**
 * Protocol Politician Dialogue Pool (US-009)
 * 
 * Dialogue pool for the protocol_politician archetype. 50+ unique lines
 * covering all dialogue contexts, market conditions, and relationship levels.
 * 
 * Voice characteristics:
 * - Governance obsessed
 * - Uses: "proposal", "quorum", "delegation", "voter turnout"
 * - References: DAOs, on-chain voting, treasury management
 * - Always campaigning for something
 * - "Have you voted on the new proposal?"
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
  archetype: 'protocol_politician',
  context: 'greeting',
  lines: [
    { text: "Greetings, fellow token holder! Have you voted on the latest proposal?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Ah, a constituent! Let me tell you about my governance platform.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Welcome! Are you delegating your voting power to anyone?", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Good to see active community members! Voter turnout has been low.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Hello! I'm gathering support for an amendment. Interested?", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Every token counts! Have you checked the forum lately?", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bull market greeting pool
 */
const greetingBullPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'greeting',
  marketCondition: 'bull',
  lines: [
    { text: "Great timing! Treasury is flush. We need to vote on allocations!", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Prices up means more responsibility! Join me in the governance forum.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Bull market brings new participants. Have you registered to vote?", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "With great gains comes great governance responsibility!", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Bear market greeting pool
 */
const greetingBearPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'greeting',
  marketCondition: 'bear',
  lines: [
    { text: "Tough times require strong governance! We need your vote.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Bear market? That's when true believers shape the protocol.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Treasury management is critical now. Please review the proposals.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Crisis reveals character. Our governance must stand strong.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

// ============================================================================
// MARKET COMMENTARY POOLS
// ============================================================================

/**
 * Bull market commentary
 */
const marketBullPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'market_commentary',
  marketCondition: 'bull',
  lines: [
    { text: "Treasury is at all-time highs! I've proposed a community fund expansion.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Price doesn't matter if governance fails. Stay focused on proposals!", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "More holders means more voters! Let's onboard them to governance.", weight: 0.8, cooldown: COOLDOWN_SHORT },
    { text: "I'm drafting a proposal to diversify the treasury. Your support matters!", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Bull markets are won by builders, not voters. We need both!", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bear market commentary
 */
const marketBearPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'market_commentary',
  marketCondition: 'bear',
  lines: [
    { text: "The treasury proposal for cost reduction needs your vote urgently.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Governance is how we survive this. Please delegate if you can't vote.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Bear markets test our governance framework. So far, we're strong.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "I've proposed emergency measures. Check the forum for details.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "This is when the DAO truly matters. United we stand!", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Crab market commentary
 */
const marketCrabPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'market_commentary',
  marketCondition: 'crab',
  lines: [
    { text: "Quiet markets are perfect for governance work. Join me in the forum!", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "No price action? Great time to review pending proposals.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "While everyone's bored, I'm writing constitutional amendments.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Stability means we can focus on long-term governance improvements.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Volatile market commentary
 */
const marketVolatilePool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'market_commentary',
  marketCondition: 'volatile',
  lines: [
    { text: "Volatility is no excuse for governance apathy! Vote!", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Markets may be chaotic, but our governance must be stable.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Now is when snap proposals get passed. Stay vigilant!", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Don't let market noise distract you from governance duties.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// PLAYER REACTION POOLS
// ============================================================================

/**
 * Player voted reactions
 */
const playerVotedPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'player_reaction',
  lines: [
    { 
      text: "A vote cast is a voice heard! Thank you for participating.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'voted' }],
    },
    { 
      text: "Democracy in action! Your vote helps shape our protocol.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'voted' }],
    },
    { 
      text: "Excellent civic duty! Consider delegating to amplify your voice.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'voted' }],
    },
    { 
      text: "You voted! We reached quorum because of people like you.", 
      weight: 0.75, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'voted' }],
    },
  ],
};

/**
 * Player delegated to them reactions
 */
const playerDelegatedPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'player_reaction',
  lines: [
    { 
      text: "Your delegation means everything! I will represent you honorably.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'delegated_to_them' }],
    },
    { 
      text: "Thank you for your trust! I'll vote in the community's best interest.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'delegated_to_them' }],
    },
    { 
      text: "A delegation! My voting power grows. Together we're stronger.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'delegated_to_them' }],
    },
  ],
};

/**
 * Player ignored governance reactions
 */
const playerIgnoredGovPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'player_reaction',
  lines: [
    { 
      text: "Not voting is a vote for the status quo! Please reconsider.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'ignored_governance' }],
    },
    { 
      text: "Every abstention weakens our quorum. Your voice matters!", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'ignored_governance' }],
    },
    { 
      text: "Apathy is how bad proposals pass. Please engage!", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'ignored_governance' }],
    },
  ],
};

// ============================================================================
// IDLE CHATTER POOLS
// ============================================================================

/**
 * General idle chatter - governance obsession
 */
const idleChatterPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'idle_chatter',
  lines: [
    { text: "Did you see? Voter turnout hit 12% last week! That's actually good for DAOs.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "I've been in the forum for six hours. These proposals need thorough debate.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "On-chain governance is pure democracy. No middlemen, no corruption.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Some say token voting is plutocracy. I say it's meritocracy.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Snapshot votes are convenient, but on-chain votes are trustless.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "The treasury management committee needs new members. Interested?", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Quadratic voting could solve the whale problem. I'm drafting a proposal.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Every protocol should have a constitution. I'm working on ours.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "Delegated voting power is a sacred trust. Never take it lightly.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "The forum is where decisions are really made. Voting is just the finale.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "I dream about reaching 30% voter turnout someday.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "Protocol politics is real politics now. We're building a new system.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "My delegate platform: transparency, accountability, community-first.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Some whales don't even vote. It's a waste of governance power.", weight: 0.65, cooldown: COOLDOWN_LONG },
    { text: "I read every proposal. All 47 pages of the last one.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
  ],
};

// ============================================================================
// RELATIONSHIP LEVEL POOLS
// ============================================================================

/**
 * Stranger relationship dialogue - campaigning
 */
const relationshipStrangerPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'relationship_level',
  relationshipLevel: 'stranger',
  lines: [
    { text: "Hello there! Are you registered to vote on our governance platform?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "A new face! Let me tell you about our upcoming treasury vote.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Welcome! Every token holder is a constituent to me.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "I represent the community interest. How can I earn your delegation?", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Friend relationship dialogue - more personal
 */
const relationshipFriendPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'relationship_level',
  relationshipLevel: 'friend',
  lines: [
    { text: "Between us, the next proposal is controversial. I need allies.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "You've been a consistent voter. That means more than you know.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "I trust your judgment. What do you think about the fee proposal?", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Your delegation would really help. I'm up against some whales.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "The governance game is exhausting sometimes. But it matters.", weight: 0.85, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Close friend relationship dialogue - confessional
 */
const relationshipCloseFriendPool: DialoguePool = {
  archetype: 'protocol_politician',
  context: 'relationship_level',
  relationshipLevel: 'close_friend',
  lines: [
    { text: "I've been doxxed by angry voters before. This work has real costs.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "Sometimes I wonder if anyone actually reads my proposals.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "The whale cartels are real. I've seen them coordinate votes.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "I don't do this for the token compensation. I believe in decentralization.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "If I could change one thing? Make voting mandatory. But that's not crypto.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "You're the only one who gets why I spend 40 hours a week on governance.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// EXPORT
// ============================================================================

/**
 * All Protocol Politician dialogue pools.
 * Contains 50+ unique lines across all contexts, market conditions,
 * and relationship levels.
 */
export const PROTOCOL_POLITICIAN_POOLS: DialoguePool[] = [
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
  playerVotedPool,
  playerDelegatedPool,
  playerIgnoredGovPool,
  
  // Idle chatter
  idleChatterPool,
  
  // Relationship levels
  relationshipStrangerPool,
  relationshipFriendPool,
  relationshipCloseFriendPool,
];
