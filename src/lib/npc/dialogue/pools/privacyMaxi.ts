/**
 * Privacy Maxi Dialogue Pool (US-005)
 * 
 * Dialogue pool for the privacy_maxi archetype. 50+ unique lines
 * covering all dialogue contexts, market conditions, and relationship levels.
 * 
 * Voice characteristics:
 * - Paranoid about surveillance
 * - Values anonymity above all
 * - Uses: "they're watching", "on-chain footprint", "KYC is slavery"
 * - References: Monero, Tornado Cash, mixers, zero-knowledge proofs
 * - Speaks in hushed, conspiratorial tones
 * - Distrustful of centralized exchanges
 * - May use coded language
 * - Sardonic about "nothing to hide" people
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
 * General greeting pool - paranoid, cautious greetings
 */
const greetingPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'greeting',
  lines: [
    { text: "*looks around* We can talk here. For now.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Don't use my name. They're always listening.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "Ah, a fellow shadow dweller. Good to see someone off-grid.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Did anyone follow you? ...No, forget I asked. Don't look back.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Leave your phone at the door. Good. We can speak freely now.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "You're not wearing a smartwatch, right? Those things are surveillance devices.", weight: 0.65, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Bull market greeting pool - suspicious of attention
 */
const greetingBullPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'greeting',
  marketCondition: 'bull',
  lines: [
    { text: "Everyone's getting rich. Which means everyone's getting tracked.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Bull market brings the taxman. Stay invisible, friend.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "More profits means more attention. Keep your head down.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "The IRS is working overtime right now. Trust me.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Bear market greeting pool - darkly satisfied
 */
const greetingBearPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'greeting',
  marketCondition: 'bear',
  lines: [
    { text: "Bear market. At least they stop watching when there's nothing to take.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Fewer eyes on us now. Perfect time to move in silence.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "When the noise dies down, the truly private can operate.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Good time to accumulate XMR. Just saying.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// MARKET COMMENTARY POOLS
// ============================================================================

/**
 * Bull market commentary - suspicious of transparency
 */
const marketBullPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'market_commentary',
  marketCondition: 'bull',
  lines: [
    { text: "Charts are surveillance. I trade in shadows.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Everyone's celebrating on-chain. Might as well paint a target on their backs.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "The blockchain remembers everything. Your gains. Your losses. Your patterns.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Bull market means chain analysis firms are salivating.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Green candles attract attention. Stay fungible, stay free.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Bear market commentary - cynically vindicated
 */
const marketBearPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'market_commentary',
  marketCondition: 'bear',
  lines: [
    { text: "Another CEX got hacked. Shocking. Truly shocking.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Everyone who used KYC is getting doxxed in the bankruptcy filings.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "The transparent chains are showing exactly who's liquidated. Privacy is protection.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Bear markets expose who gave away their data for 'convenience'.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "Funny how 'regulated' exchanges keep losing customer funds.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Crab market commentary - quietly accumulating
 */
const marketCrabPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'market_commentary',
  marketCondition: 'crab',
  lines: [
    { text: "Boring market. Good. Less attention on those who value privacy.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "While they're distracted by the crab, I'm perfecting my OPSEC.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Sideways action. Time to learn about zero-knowledge proofs.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "The calm before the storm. Make sure your tracks are covered.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Volatile market commentary - paranoid about patterns
 */
const marketVolatilePool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'market_commentary',
  marketCondition: 'volatile',
  lines: [
    { text: "Volatility creates patterns. Patterns create fingerprints. Stay random.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Every trade in chaos is another data point for them.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Market chaos is when surveillance firms make their best connections.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Don't panic trade. Your behavior is your signature.", weight: 0.75, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// PLAYER REACTION POOLS
// ============================================================================

/**
 * Player using CEX reactions (deeply concerned)
 */
const playerUsedCexPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'player_reaction',
  lines: [
    { 
      text: "You're using Coinbase? Oh, honey... they know everything.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'used_cex' }],
    },
    { 
      text: "A centralized exchange? Your data is already in seventeen government databases.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'used_cex' }],
    },
    { 
      text: "KYC is slavery. Every selfie you send is a permanent record.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'used_cex' }],
    },
    { 
      text: "Not your keys, not your coins. Not your privacy either.", 
      weight: 0.75, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'used_cex' }],
    },
  ],
};

/**
 * Player using privacy coins reactions (approval)
 */
const playerUsedPrivacyPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'player_reaction',
  lines: [
    { 
      text: "Monero? Finally, someone who understands. You can't trace what they can't see.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'used_privacy_coin' }],
    },
    { 
      text: "A privacy transaction. Smart. No footprints, no problems.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'used_privacy_coin' }],
    },
    { 
      text: "Zero-knowledge proofs. The math that sets us free.", 
      weight: 0.8, 
      cooldown: COOLDOWN_MEDIUM,
      requirements: [{ type: 'player_trait', value: 'used_privacy_coin' }],
    },
  ],
};

/**
 * Player exposed wallet reactions (alarm)
 */
const playerExposedWalletPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'player_reaction',
  lines: [
    { 
      text: "You linked that wallet to your identity? *long silence* They know everything about you now.", 
      weight: 0.9, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'exposed_wallet' }],
    },
    { 
      text: "Your on-chain footprint is permanent. Every transaction. Forever. Linked to you.", 
      weight: 0.85, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'exposed_wallet' }],
    },
    { 
      text: "The blockchain is a panopticon. And you just walked into the spotlight.", 
      weight: 0.8, 
      cooldown: COOLDOWN_LONG,
      requirements: [{ type: 'player_trait', value: 'exposed_wallet' }],
    },
  ],
};

// ============================================================================
// IDLE CHATTER POOLS
// ============================================================================

/**
 * General idle chatter - privacy philosophy and paranoia
 */
const idleChatterPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'idle_chatter',
  lines: [
    { text: "The 'innocent have no secrets' crowd? They're either naive or selling surveillance.", weight: 0.9, cooldown: COOLDOWN_MEDIUM },
    { text: "Fungibility isn't a feature. It's the foundation of freedom.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Every IP address logged. Every transaction traced. Unless you take precautions.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "The metadata tells them more than the content ever could.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "Transparent blockchains are surveillance networks with extra steps.", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Chain analysis firms are the new surveillance state. But decentralized.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "Your wallet history is your diary. Would you publish your diary?", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Mixers aren't about hiding crime. They're about preserving the right to privacy.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "They shut down Tornado Cash. They'll come for every privacy tool eventually.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "The only safe transaction is the one they don't know happened.", weight: 0.85, cooldown: COOLDOWN_SHORT },
    { text: "I use a different address for every transaction. You should too.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
    { text: "Your real name should never touch a blockchain. Ever.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "Remember: Bitcoin isn't anonymous. It's pseudonymous. Big difference.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "ZK-proofs are the future. Prove you can, without showing how.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "The government didn't ban privacy. They just made it... inconvenient.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "Every DeFi protocol with KYC is a honeypot waiting to happen.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
  ],
};

// ============================================================================
// RELATIONSHIP LEVEL POOLS
// ============================================================================

/**
 * Stranger relationship dialogue - extremely guarded
 */
const relationshipStrangerPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'relationship_level',
  relationshipLevel: 'stranger',
  lines: [
    { text: "I don't know you. Keep it that way. It's safer for both of us.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Why are you talking to me? *suspicious glance* What do you want to know?", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "Don't tell me your wallet address. I don't want to know.", weight: 0.8, cooldown: COOLDOWN_MEDIUM },
    { text: "New face. New potential leak. Be careful what you share.", weight: 0.7, cooldown: COOLDOWN_MEDIUM },
  ],
};

/**
 * Friend relationship dialogue - slightly less paranoid
 */
const relationshipFriendPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'relationship_level',
  relationshipLevel: 'friend',
  lines: [
    { text: "I trust you. That's saying a lot. Don't make me regret it.", weight: 0.9, cooldown: COOLDOWN_SHORT },
    { text: "Between us: have you considered running your own node through Tor?", weight: 0.85, cooldown: COOLDOWN_MEDIUM },
    { text: "You're learning. The less they know about you, the freer you are.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "Here's a tip: atomic swaps. No exchange. No trace. Think about it.", weight: 0.75, cooldown: COOLDOWN_MEDIUM },
    { text: "You're not like the others. You actually care about OPSEC.", weight: 0.7, cooldown: COOLDOWN_LONG },
  ],
};

/**
 * Close friend relationship dialogue - reveals more
 */
const relationshipCloseFriendPool: DialoguePool = {
  archetype: 'privacy_maxi',
  context: 'relationship_level',
  relationshipLevel: 'close_friend',
  lines: [
    { text: "I'll tell you something I don't tell anyone: my cold storage is in three countries. Plausible deniability.", weight: 0.9, cooldown: COOLDOWN_LONG },
    { text: "The reason I disappeared for two years? I was building an air-gapped setup. Worth every second.", weight: 0.85, cooldown: COOLDOWN_LONG },
    { text: "Between you and me... I haven't touched a KYC exchange in five years. It can be done.", weight: 0.8, cooldown: COOLDOWN_LONG },
    { text: "I'm going to trust you with something: signal phrase is 'the weather is nice'. You'll know when.", weight: 0.75, cooldown: COOLDOWN_LONG },
    { text: "One day the surveillance state will collapse. And we'll be the only ones who remember what freedom felt like.", weight: 0.7, cooldown: COOLDOWN_LONG },
    { text: "My threat model assumes nation-state actors. Paranoid? Maybe. But I sleep well.", weight: 0.85, cooldown: COOLDOWN_LONG },
  ],
};

// ============================================================================
// EXPORT
// ============================================================================

/**
 * All Privacy Maxi dialogue pools.
 * Contains 50+ unique lines across all contexts, market conditions,
 * and relationship levels.
 */
export const PRIVACY_MAXI_POOLS: DialoguePool[] = [
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
  playerUsedCexPool,
  playerUsedPrivacyPool,
  playerExposedWalletPool,
  
  // Idle chatter
  idleChatterPool,
  
  // Relationship levels
  relationshipStrangerPool,
  relationshipFriendPool,
  relationshipCloseFriendPool,
];
