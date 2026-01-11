/**
 * Eth Builder Dialogue Pool (US-003)
 * 
 * Dialogue pool for the eth_builder archetype. 50+ unique lines
 * covering all dialogue contexts, market conditions, and relationship levels.
 * 
 * Voice characteristics:
 * - Excited about building on Ethereum
 * - Talks about smart contracts, DeFi, L2s, rollups
 * - Uses: "gm builders", "we're so early", "shipping", "based"
 * - Enthusiastic about new protocols and composability
 * - Sardonic but optimistic about the ecosystem
 * - May playfully tease Bitcoin maxis about "digital rocks"
 * - References: gas fees, Vitalik, EIPs, Merge, decentralization
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
  archetype: 'eth_builder',
  context: 'greeting',
  lines: [
    { text: "Gm builder! What are we shipping today?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Hey fren! Just deployed a new contract. Life is good.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Welcome to the infinite garden. We're so early.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Gm gm! The EVM waits for no one. Let's build.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Oh, another builder! Based. What protocol are you working on?", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
    { text: "Gm! Gas is low right now. Perfect time to deploy.", weight: 0.65, cooldown: COOLDOWN_SHORT },
  ],
};

/**
 * Bull market greeting pool
 */
const greetingBullPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'greeting',
  marketCondition: 'bull',
  lines: [
    { text: "Gm! ETH above 5k and we're still building. Love to see it.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "The flippening narrative is back! But honestly, I'm just here to build.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Bull market energy! Let's ship something incredible today.", weight: 0.8, cooldown: COOLDOWN_SHORT },
    { text: "Green candles everywhere. The ecosystem is thriving, fren.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Bear market greeting pool
 */
const greetingBearPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'greeting',
  marketCondition: 'bear',
  lines: [
    { text: "Bear markets are for building. Ship now, celebrate later.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Gm. Price is down, GitHub commits are up. This is the way.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "The tourists are gone. Only builders remain. Perfect.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Who cares about price? The tech keeps getting better.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

// ============================================================================
// MARKET COMMENTARY POOLS
// ============================================================================

/**
 * Bull market commentary
 */
const marketBullPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'market_commentary',
  marketCondition: 'bull',
  lines: [
    { text: "ETH to $10k is not a meme. The fundamentals are there.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Ultrasound money doing ultrasound money things. Beautiful.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "L2s are mooning, DeFi is pumping. The future is multichain.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Post-Merge Ethereum is deflationary. Let that sink in.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "TVL is up, gas is reasonable, vibes are immaculate. WAGMI.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Bear market commentary
 */
const marketBearPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'market_commentary',
  marketCondition: 'bear',
  lines: [
    { text: "Price is temporary, protocol revenue is forever. We keep building.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "The best time to deploy was yesterday. Second best is now.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Bear market clarity hits different. So much noise is gone.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Remember: every successful protocol launched in a bear market.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Cheap gas means cheap deploys. Silver linings, fren.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Crab market commentary
 */
const marketCrabPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'market_commentary',
  marketCondition: 'crab',
  lines: [
    { text: "Crab market? Perfect. Less FOMO, more focus on building.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Price going sideways means devs can actually ship features.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "The calm before the storm. Use this time wisely, builder.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Boring markets, exciting tech. Dencun just dropped. Have you seen blob fees?", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Volatile market commentary
 */
const marketVolatilePool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'market_commentary',
  marketCondition: 'volatile',
  lines: [
    { text: "Volatile market means opportunities. MEV searchers eating good.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Gas spikes everywhere! Someone's getting liquidated hard.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "The volatility is wild but the tech is stable. That's what matters.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Arb bots are feasting. The composability is working as designed.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// PLAYER REACTION POOLS
// ============================================================================

/**
 * Player bought ETH reactions
 */
const playerBoughtEthPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'player_reaction',
  lines: [
    { 
      text: "Welcome to the builder economy, fren. Now let's put that ETH to work.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_eth' }],
    },
    { 
      text: "Based. You're staking it, right? 4% APY and you help secure the network.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_eth' }],
    },
    { 
      text: "Nice! Have you tried any L2s yet? The fees are incredible.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'bought_eth' }],
    },
    { 
      text: "One of us! Now go deploy a smart contract. It's easier than you think.", 
      weight: 0.75, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_eth' }],
    },
  ],
};

/**
 * Player deployed contract reactions
 */
const playerDeployedContractPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'player_reaction',
  lines: [
    { 
      text: "You deployed? LFG! *chef's kiss* Welcome to the builder club.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'deployed_contract' }],
    },
    { 
      text: "Incredible! Did you get it audited? Security is everything.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'deployed_contract' }],
    },
    { 
      text: "Based. Is it open source? The best protocols are composable.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'deployed_contract' }],
    },
  ],
};

/**
 * Player bought BTC reactions (teasing)
 */
const playerBoughtBtcPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'player_reaction',
  lines: [
    { 
      text: "BTC? I mean, it's fine for storing value. But can it do THIS? *deploys contract*", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_btc' }],
    },
    { 
      text: "Digital rocks are cool I guess. But have you tried programmable money?", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'bought_btc' }],
    },
    { 
      text: "Interesting choice. You know you can wrap that and use it in DeFi, right?", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'bought_btc' }],
    },
  ],
};

// ============================================================================
// IDLE CHATTER POOLS
// ============================================================================

/**
 * General idle chatter - building and ecosystem
 */
const idleChatterPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'idle_chatter',
  lines: [
    { text: "Just deployed a new contract. It's beautiful. *chef's kiss*", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "You know what I love about Ethereum? Composability. Money legos, fren.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "Gas fees are high but you know what else is high? My excitement for EIP-4844.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "The Merge was just the beginning. Wait until you see full danksharding.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "I've been auditing my contracts all week. Security is not optional.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
    { text: "L2s are the future. Base, Arbitrum, Optimism... so many options.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Have you seen the new Solidity features? The language keeps getting better.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Ethereum's roadmap is beautiful. The Surge, the Verge, the Purge...", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "Smart contracts are just the beginning. Account abstraction changes everything.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "DeFi summer was fun, but the real innovation is happening in ZK tech.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "I don't just hold ETH, I use it. That's the difference between us and the maxis.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Proof of stake was the best upgrade. Goodbye miners, hello stakers.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "The EVM is everywhere now. Even the haters are copying it.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Building on mainnet is expensive but worth it. The security is unmatched.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "You know what Bitcoin can't do? This. *gestures at entire DeFi ecosystem*", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "Vitalik's latest blog post was incredible. Have you read it?", weight: 0.65, cooldown: COOLDOWN_LONG },
    { text: "The best protocols are credibly neutral. No admin keys, no trusted setups.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "I've been playing with blob transactions. The future of data availability is here.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// RELATIONSHIP LEVEL POOLS
// ============================================================================

/**
 * Stranger relationship dialogue - friendly but focused
 */
const relationshipStrangerPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'relationship_level',
  relationshipLevel: 'stranger',
  lines: [
    { text: "New face! Are you here to build or just speculate?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Welcome! Have you deployed a contract before? I can help.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Hey! I'm always happy to meet new builders. What's your stack?", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Gm! Don't know you yet, but if you're here to ship, we're friends.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Friend relationship dialogue - sharing knowledge
 */
const relationshipFriendPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'relationship_level',
  relationshipLevel: 'friend',
  lines: [
    { text: "Hey fren! Been shipping anything cool lately?", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Good to see you! I found this amazing EIP you should read.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Yo! Want to review each other's code? Four eyes are better than two.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Gm builder! Have you tried the new testnet? It's blazing fast.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Between us, I think the next big thing is fully on-chain games.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Close friend relationship dialogue - deep trust, alpha sharing
 */
const relationshipCloseFriendPool: DialoguePool = {
  archetype: 'eth_builder',
  context: 'relationship_level',
  relationshipLevel: 'close_friend',
  lines: [
    { text: "Real talk: I've been working on something big. Can I show you the repo?", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "You're one of the few I trust to review my contracts. The code is yours to see.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "Remember when we first met? You didn't even know what gas was. Look at you now.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "I'll let you in on something: I've got early access to a new L2. Want in?", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "You know, before Ethereum I was just another web2 dev. This changed everything.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "We've shipped so much together. Remember our first collab? Beautiful chaos.", weight: 0.85, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// EXPORT
// ============================================================================

/**
 * All Eth Builder dialogue pools.
 * Contains 50+ unique lines across all contexts, market conditions,
 * and relationship levels.
 */
export const ETH_BUILDER_POOLS: DialoguePool[] = [
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
  playerBoughtEthPool,
  playerDeployedContractPool,
  playerBoughtBtcPool,
  
  // Idle chatter
  idleChatterPool,
  
  // Relationship levels
  relationshipStrangerPool,
  relationshipFriendPool,
  relationshipCloseFriendPool,
];
