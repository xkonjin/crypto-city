/**
 * ThoughtEngine - NPC Thought Generation System
 * 
 * Generates human-like internal monologue for NPCs based on:
 * - Current perception (nearby NPCs, buildings, events)
 * - Need state (hungry, lonely, broke)
 * - Personality traits (how they interpret events)
 * - Memory retrieval (relevant past experiences)
 * - Relationships (who they like/dislike nearby)
 * 
 * "The unexamined NPC life is not worth simulating."
 * — Socrates, probably, if he were a game developer
 */

import type { CryptoNPC, Occupation, NPCActivity } from '@/games/isocity/types/npc';
import type { PersonalityArchetype, ARCHETYPE_DESCRIPTIONS } from './personality';
import type { EpisodicMemory } from './memory';
import type { Relationship } from './relationships';
import { NPCDetailLevel } from './LODManager';

// =============================================================================
// LLM THOUGHT TYPES (Issue #212)
// =============================================================================

/**
 * Configuration for LLM-powered thought generation
 */
export interface LLMThoughtConfig {
  /** Whether LLM thought generation is enabled */
  enabled: boolean;
  /** LLM provider to use */
  provider: 'openai' | 'anthropic' | 'mock' | 'local';
  /** API endpoint (optional, uses default if not provided) */
  apiEndpoint?: string;
  /** API key (required for non-mock providers) */
  apiKey?: string;
  /** Model to use */
  model?: string;
  /** Max tokens for thought generation */
  maxTokens: number;
  /** Temperature for generation (0-1) */
  temperature: number;
  /** Cooldown between LLM calls per NPC (ms) */
  cooldownMs: number;
  /** Rate limiting configuration */
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerDay: number;
  };
}

/**
 * Request for LLM thought generation
 */
export interface LLMThoughtRequest {
  npcId: string;
  personality: PersonalityArchetype | string;
  context: ThoughtContext;
  previousThoughts: string[];
}

/**
 * Response from LLM thought generation
 */
export interface LLMThoughtResponse {
  /** The generated thought */
  thought: string;
  /** Detected emotion in the thought */
  emotion: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether LLM was actually used (vs fallback) */
  usedLLM: boolean;
  /** Tokens used (if LLM was used) */
  tokensUsed?: number;
}

// =============================================================================
// TYPES
// =============================================================================

export interface ThoughtStream {
  /** What the NPC is thinking RIGHT NOW */
  currentThought: string;
  /** Timestamp of last thought update */
  lastUpdated: number;
  /** Recent observations */
  observations: Observation[];
  /** Plans for immediate future */
  shortTermPlan: string[];
  /** Life goals and aspirations */
  longTermGoals: string[];
  /** Insights derived from memories */
  reflections: Reflection[];
}

export interface Observation {
  /** Type of thing observed */
  type: 'npc' | 'building' | 'event' | 'market' | 'environment';
  /** What was observed */
  description: string;
  /** Timestamp */
  timestamp: number;
  /** Emotional reaction (-1 to 1) */
  emotionalValence: number;
}

export interface Reflection {
  /** The insight */
  insight: string;
  /** Memories that led to this reflection */
  sourceMemories: string[];
  /** When the reflection was formed */
  timestamp: number;
  /** Importance (1-10) */
  importance: number;
}

export interface ThoughtContext {
  /** Nearby NPCs within perception range */
  nearbyNPCs: CryptoNPC[];
  /** Current market condition */
  marketCondition: 'bull' | 'bear' | 'crab' | 'volatile';
  /** Time of day */
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  /** Recent city events */
  recentEvents: string[];
  /** Game day */
  gameDay: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Thought templates by archetype - base thoughts modified by context */
const ARCHETYPE_THOUGHT_STYLES: Record<PersonalityArchetype, {
  vocabulary: string[];
  exclamations: string[];
  concerns: string[];
  optimistic: string[];
  pessimistic: string[];
}> = {
  bitcoin_maxi: {
    vocabulary: ['sats', 'stacking', 'sound money', 'fiat', 'shitcoins', 'laser eyes'],
    exclamations: ['Few understand.', 'HFSP.', 'Tick tock next block.'],
    concerns: ['altcoins', 'regulations', 'centralization', 'paper hands'],
    optimistic: ['Bitcoin fixes this.', 'Stack sats, stay humble.', 'Number go up technology.'],
    pessimistic: ['More time to stack.', 'Weak hands selling.', 'Fiat is dying anyway.'],
  },
  eth_builder: {
    vocabulary: ['gas', 'L2', 'merge', 'rollups', 'smart contracts', 'decentralized'],
    exclamations: ['Ultrasound money!', 'The roadmap is clear.', 'Build build build.'],
    concerns: ['gas fees', 'scalability', 'competition', 'fragmentation'],
    optimistic: ['ETH is inevitable.', 'The merge was just the beginning.', 'L2 summer is coming.'],
    pessimistic: ['Gas is too high for retail.', 'Solana is fast but...', 'We need more adoption.'],
  },
  degen_trader: {
    vocabulary: ['ape', 'moon', 'pump', 'rekt', 'leverage', 'liquidated', '100x', 'ser'],
    exclamations: ['LFG!', 'WAGMI!', 'THIS IS IT!', 'SER!'],
    concerns: ['missing pumps', 'paper hands', 'whales dumping', 'getting rugged'],
    optimistic: ['This one is different!', 'Easy 10x from here.', 'Just aped in, feeling good.'],
    pessimistic: ['Should have taken profits...', 'Why do I always buy the top?', 'Down bad but diamond hands.'],
  },
  privacy_maxi: {
    vocabulary: ['surveillance', 'privacy', 'self-custody', 'KYC', 'anonymous', 'permissionless'],
    exclamations: ['Not your keys, not your coins.', 'Privacy is a right.', 'Trust no one.'],
    concerns: ['government', 'exchanges', 'tracking', 'doxxing'],
    optimistic: ['At least my privacy is intact.', 'They can\'t track what they can\'t see.'],
    pessimistic: ['They\'re always watching.', 'KYC everywhere now.', 'Privacy is under attack.'],
  },
  normie_investor: {
    vocabulary: ['portfolio', 'diversified', 'long-term', 'investment', 'returns', 'market'],
    exclamations: ['Interesting...', 'I should research more.', 'My cousin mentioned this.'],
    concerns: ['volatility', 'scams', 'complexity', 'losing money'],
    optimistic: ['Maybe this crypto thing has potential.', 'At least I\'m learning.'],
    pessimistic: ['Why is it going down?', 'Should I have bought stocks instead?', 'This is confusing.'],
  },
  nft_flipper: {
    vocabulary: ['floor', 'mint', 'roadmap', 'community', 'vibes', 'generational', 'art'],
    exclamations: ['GENERATIONAL!', 'The art speaks to me.', 'Few understand this project.'],
    concerns: ['floor price', 'paper hands', 'rug pulls', 'royalties'],
    optimistic: ['This collection will moon.', 'The community is strong.', 'Floor is lava!'],
    pessimistic: ['Floor is dropping...', 'Nobody appreciates real art.', 'Another project going to zero.'],
  },
  staking_grandma: {
    vocabulary: ['yield', 'APY', 'passive', 'compound', 'steady', 'patient'],
    exclamations: ['Patience, dear.', 'Slow and steady.', 'Let it grow.'],
    concerns: ['impermanent loss', 'smart contract risk', 'slashing'],
    optimistic: ['Another day, another yield.', 'Compounding is magical.', 'Set it and forget it.'],
    pessimistic: ['Yields are lower these days.', 'At least it\'s still earning.', 'Better than a savings account.'],
  },
  protocol_politician: {
    vocabulary: ['governance', 'proposal', 'vote', 'delegate', 'quorum', 'tokenomics'],
    exclamations: ['We need consensus.', 'Let\'s put it to a vote.', 'The community decides.'],
    concerns: ['voter apathy', 'whale dominance', 'centralization', 'bad proposals'],
    optimistic: ['Democracy in action.', 'The DAO is thriving.', 'Our voice matters.'],
    pessimistic: ['Nobody votes...', 'Whales control everything.', 'Governance theater.'],
  },
};

/** Need-based thought triggers */
const NEED_THOUGHTS: Record<string, { low: string[]; critical: string[] }> = {
  hunger: {
    low: ['Getting a bit hungry...', 'Should grab something to eat soon.', 'Food sounds good.'],
    critical: ['So hungry I can\'t think straight.', 'Need food NOW.', 'My stomach is eating itself.'],
  },
  energy: {
    low: ['Getting tired...', 'A nap would be nice.', 'Running low on energy.'],
    critical: ['Can barely keep my eyes open.', 'Need sleep desperately.', 'About to pass out.'],
  },
  social: {
    low: ['Haven\'t talked to anyone in a while.', 'Feeling a bit lonely.', 'Should find someone to chat with.'],
    critical: ['So isolated...', 'Need human connection.', 'Why won\'t anyone talk to me?'],
  },
  fun: {
    low: ['This is getting boring.', 'Need some entertainment.', 'Life is dull today.'],
    critical: ['So bored I might die.', 'There has to be something fun to do.', 'This is torture.'],
  },
  wealth: {
    low: ['Running low on funds...', 'Should make some money.', 'Need to work more.'],
    critical: ['Completely broke.', 'How will I afford rent?', 'Desperate for income.'],
  },
  purpose: {
    low: ['What am I even doing?', 'Need to find meaning.', 'Feeling aimless.'],
    critical: ['What\'s the point of all this?', 'Existential crisis mode.', 'Need purpose in life.'],
  },
};

/** Activity-based thoughts */
const ACTIVITY_THOUGHTS: Record<NPCActivity, string[]> = {
  idle: [
    'Just standing here, thinking about life.',
    'Wonder what everyone else is up to.',
    'Should probably do something productive.',
    'Taking a moment to appreciate the city.',
  ],
  walking: [
    'On my way...',
    'Nice day for a walk.',
    'Getting some steps in.',
    'Wonder what I\'ll find over there.',
  ],
  working: [
    'Back to the grind.',
    'Making that money.',
    'Work never ends in crypto.',
    'At least I enjoy what I do... mostly.',
  ],
  eating: [
    'This hits different when you\'re hungry.',
    'Food is fuel.',
    'Can\'t trade on an empty stomach.',
    'Eating my feelings today.',
  ],
  sleeping: [
    'Zzz...',
    '*dreams of green candles*',
    '*mumbles about charts*',
    '*peaceful slumber*',
  ],
  socializing: [
    'Good to catch up with people.',
    'Love a good crypto conversation.',
    'Making connections in this city.',
    'The real alpha is friendship.',
  ],
  shopping: [
    'Time to treat myself.',
    'Need to stock up.',
    'Money is meant to be spent... on crypto.',
    'Retail therapy engaged.',
  ],
};

/** Market condition thoughts */
const MARKET_THOUGHTS: Record<string, Record<string, string[]>> = {
  bull: {
    high_risk: ['Everything is pumping! Time to leverage!', 'This is the moment I\'ve been waiting for!', 'GAINS INCOMING!'],
    low_risk: ['Nice to see green for once.', 'Maybe I should take some profits.', 'Don\'t get too excited...'],
  },
  bear: {
    high_risk: ['Blood in the streets! Time to accumulate!', 'This is just a discount.', 'Buying the dip!'],
    low_risk: ['This is concerning...', 'Maybe I should de-risk.', 'How much lower can it go?'],
  },
  crab: {
    high_risk: ['So boring... need volatility!', 'Wake me up when something happens.', 'This sideways action is killing me.'],
    low_risk: ['Stability is nice actually.', 'At least it\'s not going down.', 'Calm before the storm?'],
  },
  volatile: {
    high_risk: ['THIS IS WHAT I LIVE FOR!', 'Volatility = opportunity!', 'Riding the waves!'],
    low_risk: ['What is happening?!', 'My heart can\'t take this.', 'Should I even look at prices?'],
  },
};

// =============================================================================
// LLM THOUGHT CONSTANTS (Issue #212)
// =============================================================================

/** Default LLM configuration */
const DEFAULT_LLM_CONFIG: LLMThoughtConfig = {
  enabled: false,
  provider: 'mock',
  maxTokens: 50,
  temperature: 0.8,
  cooldownMs: 5000,
  rateLimit: {
    requestsPerMinute: 30,
    tokensPerDay: 50000,
  },
};

/** System prompt for LLM thought generation */
const LLM_THOUGHT_SYSTEM_PROMPT = `You are generating internal thoughts for an NPC in CryptoCity, a crypto-themed city builder game.

Generate a single SHORT thought (1-2 sentences max) that:
- Matches the NPC's personality archetype and speaking style
- References their current context (market conditions, nearby people, needs)
- Uses appropriate crypto slang for their archetype
- Never breaks the fourth wall
- Is emotionally appropriate to their current state

DO NOT use quotation marks. Output only the thought itself.`;

/** Archetype-specific speaking styles for LLM prompts */
const ARCHETYPE_SPEAKING_STYLES: Record<PersonalityArchetype, string> = {
  bitcoin_maxi: 'speaks with conviction about Bitcoin superiority, dismissive of altcoins, uses terms like "sats", "HODL", "fiat", "sound money"',
  eth_builder: 'technical and optimistic, talks about building, gas fees, L2s, roadmaps, uses dev terminology',
  degen_trader: 'hyped and FOMO-driven, uses "ape", "moon", "LFG", "WAGMI", "ser", speaks in excited exclamations',
  privacy_maxi: 'paranoid and cautious, concerned about surveillance, values anonymity, trusts no one',
  normie_investor: 'confused but curious, asks basic questions, compares crypto to stocks, cautious',
  nft_flipper: 'art-focused and trend-aware, talks about "floor", "vibes", "community", "generational"',
  staking_grandma: 'patient and steady, focuses on yields and passive income, not interested in trading',
  protocol_politician: 'governance-focused, talks about voting, proposals, DAOs, community decisions',
};

/** LOD levels that allow LLM thoughts */
const LLM_ALLOWED_LOD_LEVELS: Set<NPCDetailLevel> = new Set([
  NPCDetailLevel.FULL,
  NPCDetailLevel.HIGH,
]);

// =============================================================================
// LLM RATE LIMITER STATE
// =============================================================================

interface LLMRateLimitState {
  requestsThisMinute: number;
  tokensToday: number;
  minuteStartTime: number;
  dayStartTime: number;
}

let llmRateLimitState: LLMRateLimitState = {
  requestsThisMinute: 0,
  tokensToday: 0,
  minuteStartTime: Date.now(),
  dayStartTime: Date.now(),
};

// =============================================================================
// THOUGHT ENGINE CLASS
// =============================================================================

/**
 * ThoughtEngine generates contextual, personality-driven thoughts for NPCs.
 */
export class ThoughtEngine {
  // LLM configuration
  private llmConfig: LLMThoughtConfig = { ...DEFAULT_LLM_CONFIG };
  
  // Per-NPC cooldown tracking
  private npcLLMCooldowns: Map<string, number> = new Map();
  
  /**
   * Generate a thought for an NPC based on their current context
   */
  generateThought(npc: CryptoNPC, context: ThoughtContext): string {
    const candidates: Array<{ thought: string; priority: number }> = [];
    
    // 1. Check urgent needs first (highest priority)
    const needThought = this.generateNeedThought(npc);
    if (needThought) {
      candidates.push({ thought: needThought, priority: 10 });
    }
    
    // 2. React to nearby NPCs (high priority)
    const socialThought = this.generateSocialThought(npc, context.nearbyNPCs);
    if (socialThought) {
      candidates.push({ thought: socialThought, priority: 7 });
    }
    
    // 3. React to market conditions (medium priority)
    const marketThought = this.generateMarketThought(npc, context.marketCondition);
    if (marketThought) {
      candidates.push({ thought: marketThought, priority: 5 });
    }
    
    // 4. Activity-based thoughts (low priority)
    const activityThought = this.generateActivityThought(npc);
    if (activityThought) {
      candidates.push({ thought: activityThought, priority: 3 });
    }
    
    // 5. Memory-triggered thoughts (variable priority)
    const memoryThought = this.generateMemoryThought(npc);
    if (memoryThought) {
      candidates.push({ thought: memoryThought.thought, priority: memoryThought.priority });
    }
    
    // 6. Random archetype flavor (lowest priority fallback)
    const flavorThought = this.generateArchetypeFlavor(npc);
    candidates.push({ thought: flavorThought, priority: 1 });
    
    // Select based on weighted priority with some randomness
    return this.selectThought(candidates);
  }

  /**
   * Generate need-based thought if needs are low
   */
  private generateNeedThought(npc: CryptoNPC): string | null {
    const needs = npc.needs;
    const urgentNeeds: Array<{ need: string; current: number; critical: number }> = [];
    
    // Check each need - use 50 as "low" threshold (halfway point)
    const LOW_THRESHOLD = 50;
    
    if (needs.hunger.current < needs.hunger.criticalThreshold) {
      urgentNeeds.push({ need: 'hunger', current: needs.hunger.current, critical: needs.hunger.criticalThreshold });
    } else if (needs.hunger.current < LOW_THRESHOLD) {
      const thought = this.pickRandom(NEED_THOUGHTS.hunger.low);
      if (Math.random() < 0.3) return thought;
    }
    
    if (needs.energy.current < needs.energy.criticalThreshold) {
      urgentNeeds.push({ need: 'energy', current: needs.energy.current, critical: needs.energy.criticalThreshold });
    } else if (needs.energy.current < LOW_THRESHOLD) {
      const thought = this.pickRandom(NEED_THOUGHTS.energy.low);
      if (Math.random() < 0.3) return thought;
    }
    
    if (needs.social.current < needs.social.criticalThreshold) {
      urgentNeeds.push({ need: 'social', current: needs.social.current, critical: needs.social.criticalThreshold });
    }
    
    if (needs.fun.current < needs.fun.criticalThreshold) {
      urgentNeeds.push({ need: 'fun', current: needs.fun.current, critical: needs.fun.criticalThreshold });
    }
    
    // Return most urgent need thought
    if (urgentNeeds.length > 0) {
      const mostUrgent = urgentNeeds.sort((a, b) => a.current - b.current)[0];
      return this.pickRandom(NEED_THOUGHTS[mostUrgent.need]?.critical || NEED_THOUGHTS[mostUrgent.need]?.low || []);
    }
    
    return null;
  }

  /**
   * Generate thought about nearby NPCs
   */
  private generateSocialThought(npc: CryptoNPC, nearbyNPCs: CryptoNPC[]): string | null {
    if (nearbyNPCs.length === 0) return null;
    
    // Find NPC with strongest relationship
    let strongestRelation: { npc: CryptoNPC; relationship: Relationship } | null = null;
    let strongestScore = 0;
    
    for (const nearby of nearbyNPCs) {
      const rel = npc.relationships[nearby.id];
      if (rel) {
        const score = Math.abs(rel.trust) + Math.abs(rel.respect) + rel.familiarity;
        if (score > strongestScore) {
          strongestScore = score;
          strongestRelation = { npc: nearby, relationship: rel };
        }
      }
    }
    
    if (strongestRelation) {
      const { npc: other, relationship } = strongestRelation;
      
      // Positive relationship
      if (relationship.trust > 0.5 && relationship.respect > 0.5) {
        return this.pickRandom([
          `Oh, there's ${other.name}! Always good to see them.`,
          `${other.name} is here. One of the good ones.`,
          `Nice, ${other.name} is around. Should say hi.`,
        ]);
      }
      
      // Negative relationship
      if (relationship.trust < -0.3 || relationship.respect < -0.3) {
        return this.pickRandom([
          `Ugh, ${other.name} is here. Better avoid them.`,
          `${other.name}... I'm still not over that incident.`,
          `Why is ${other.name} always around when I'm here?`,
        ]);
      }
      
      // Familiar but neutral
      if (relationship.familiarity > 0.5) {
        return this.pickRandom([
          `Oh, ${other.name}. We've talked before.`,
          `${other.name} is here. Wonder what they're up to.`,
          `I know ${other.name} from somewhere...`,
        ]);
      }
    }
    
    // Unknown NPC
    const randomNearby = this.pickRandom(nearbyNPCs);
    return this.pickRandom([
      `Don't think I've met ${randomNearby.name} before.`,
      `Wonder who that ${randomNearby.occupation} is.`,
      `New face in the neighborhood.`,
    ]);
  }

  /**
   * Generate market condition thought
   */
  private generateMarketThought(npc: CryptoNPC, marketCondition: string): string | null {
    if (Math.random() > 0.4) return null; // Don't always think about markets
    
    const riskLevel = npc.personality.crypto.riskTolerance > 0.5 ? 'high_risk' : 'low_risk';
    const thoughts = MARKET_THOUGHTS[marketCondition]?.[riskLevel];
    
    if (!thoughts) return null;
    return this.pickRandom(thoughts);
  }

  /**
   * Generate activity-based thought
   */
  private generateActivityThought(npc: CryptoNPC): string | null {
    const activity = npc.currentActivity;
    if (!activity) return null;
    
    const thoughts = ACTIVITY_THOUGHTS[activity];
    if (!thoughts || Math.random() > 0.3) return null;
    
    return this.pickRandom(thoughts);
  }

  /**
   * Generate thought triggered by a memory
   */
  private generateMemoryThought(npc: CryptoNPC): { thought: string; priority: number } | null {
    if (!npc.memory || npc.memory.episodic.length === 0) return null;
    if (Math.random() > 0.2) return null; // Only occasionally reference memories
    
    // Get a recent, important memory
    const recentMemories = npc.memory.episodic
      .filter(m => m.strength > 0.3)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);
    
    if (recentMemories.length === 0) return null;
    
    const memory = this.pickRandom(recentMemories);
    const priority = memory.importance > 7 ? 8 : 4;
    
    const thought = this.pickRandom([
      `This reminds me of ${memory.event}...`,
      `Can't stop thinking about ${memory.event}.`,
      `${memory.event}... that was something.`,
    ]);
    
    return { thought, priority };
  }

  /**
   * Generate archetype-specific flavor thought
   */
  private generateArchetypeFlavor(npc: CryptoNPC): string {
    const archetype = npc.personalityArchetype || 'normie_investor';
    const style = ARCHETYPE_THOUGHT_STYLES[archetype];
    
    if (!style) {
      return 'Just another day in Crypto City...';
    }
    
    // Mix vocabulary with general thoughts
    const useOptimistic = Math.random() > 0.4;
    const thoughts = useOptimistic ? style.optimistic : style.pessimistic;
    
    return this.pickRandom(thoughts);
  }

  /**
   * Select final thought based on weighted priorities
   */
  private selectThought(candidates: Array<{ thought: string; priority: number }>): string {
    if (candidates.length === 0) {
      return 'Just thinking...';
    }
    
    // Calculate weights
    const totalWeight = candidates.reduce((sum, c) => sum + c.priority, 0);
    let random = Math.random() * totalWeight;
    
    for (const candidate of candidates) {
      random -= candidate.priority;
      if (random <= 0) {
        return candidate.thought;
      }
    }
    
    return candidates[0].thought;
  }

  /**
   * Helper: Pick random item from array
   */
  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Create default thought stream for new NPCs
   */
  createDefaultThoughtStream(): ThoughtStream {
    return {
      currentThought: 'Just arrived in Crypto City...',
      lastUpdated: Date.now(),
      observations: [],
      shortTermPlan: [],
      longTermGoals: [],
      reflections: [],
    };
  }

  /**
   * Update NPC's thought stream with new context
   */
  updateThoughtStream(
    npc: CryptoNPC, 
    context: ThoughtContext,
    stream: ThoughtStream
  ): ThoughtStream {
    const newThought = this.generateThought(npc, context);
    
    return {
      ...stream,
      currentThought: newThought,
      lastUpdated: Date.now(),
      observations: stream.observations.slice(-10), // Keep last 10
      shortTermPlan: stream.shortTermPlan.slice(0, 3), // Keep top 3 plans
    };
  }

  /**
   * Add an observation to the thought stream
   */
  addObservation(
    stream: ThoughtStream,
    observation: Omit<Observation, 'timestamp'>
  ): ThoughtStream {
    return {
      ...stream,
      observations: [
        ...stream.observations.slice(-9),
        { ...observation, timestamp: Date.now() },
      ],
    };
  }

  /**
   * Generate a reflection from recent memories (periodic)
   */
  generateReflection(npc: CryptoNPC): Reflection | null {
    if (!npc.memory || npc.memory.episodic.length < 3) return null;
    
    // Find patterns in memories
    const recentMemories = npc.memory.episodic.slice(-10);
    
    // Count recurring participants
    const participantCounts: Record<string, number> = {};
    for (const memory of recentMemories) {
      for (const participant of memory.participants) {
        participantCounts[participant] = (participantCounts[participant] || 0) + 1;
      }
    }
    
    // Generate insight about frequent interactions
    const frequentParticipant = Object.entries(participantCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (frequentParticipant && frequentParticipant[1] >= 3) {
      return {
        insight: `I've been spending a lot of time with ${frequentParticipant[0]} lately.`,
        sourceMemories: recentMemories
          .filter(m => m.participants.includes(frequentParticipant[0]))
          .map(m => m.id),
        timestamp: Date.now(),
        importance: 5,
      };
    }
    
    return null;
  }

  // ===========================================================================
  // LLM THOUGHT GENERATION (Issue #212)
  // ===========================================================================

  /**
   * Configure LLM thought generation
   */
  configureLLMThoughts(config: Partial<LLMThoughtConfig>): void {
    this.llmConfig = { ...this.llmConfig, ...config };
  }

  /**
   * Get current LLM thought configuration
   */
  getLLMThoughtConfig(): LLMThoughtConfig {
    return { ...this.llmConfig };
  }

  /**
   * Check if LLM thought generation is enabled
   */
  isLLMThoughtEnabled(): boolean {
    return this.llmConfig.enabled;
  }

  /**
   * Get remaining cooldown for an NPC's LLM thought generation
   */
  getLLMThoughtCooldownRemaining(npcId: string): number {
    const lastCall = this.npcLLMCooldowns.get(npcId);
    if (!lastCall) return 0;
    
    const elapsed = Date.now() - lastCall;
    const remaining = this.llmConfig.cooldownMs - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Check if LLM thoughts should be used for a given LOD level
   */
  shouldUseLLMThought(lodLevel: NPCDetailLevel): boolean {
    return LLM_ALLOWED_LOD_LEVELS.has(lodLevel);
  }

  /**
   * Get LLM rate limit status
   */
  getLLMRateLimitStatus(): {
    requestsRemaining: number;
    tokensRemaining: number;
    resetsIn: { minutes: number; hours: number };
  } {
    const now = Date.now();
    const rateLimit = this.llmConfig.rateLimit || DEFAULT_LLM_CONFIG.rateLimit!;
    
    // Reset minute counter if needed
    if (now - llmRateLimitState.minuteStartTime > 60000) {
      llmRateLimitState.requestsThisMinute = 0;
      llmRateLimitState.minuteStartTime = now;
    }
    
    // Reset day counter if needed
    if (now - llmRateLimitState.dayStartTime > 86400000) {
      llmRateLimitState.tokensToday = 0;
      llmRateLimitState.dayStartTime = now;
    }
    
    return {
      requestsRemaining: Math.max(0, rateLimit.requestsPerMinute - llmRateLimitState.requestsThisMinute),
      tokensRemaining: Math.max(0, rateLimit.tokensPerDay - llmRateLimitState.tokensToday),
      resetsIn: {
        minutes: Math.ceil((60000 - (now - llmRateLimitState.minuteStartTime)) / 60000),
        hours: Math.ceil((86400000 - (now - llmRateLimitState.dayStartTime)) / 3600000),
      },
    };
  }

  /**
   * Check if rate limit allows another LLM call
   */
  private checkLLMRateLimit(): boolean {
    const status = this.getLLMRateLimitStatus();
    return status.requestsRemaining > 0 && status.tokensRemaining > 0;
  }

  /**
   * Record LLM usage for rate limiting
   */
  private recordLLMUsage(tokens: number): void {
    llmRateLimitState.requestsThisMinute++;
    llmRateLimitState.tokensToday += tokens;
  }

  /**
   * Build LLM prompt for thought generation
   */
  buildLLMThoughtPrompt(npc: CryptoNPC, context: ThoughtContext): string {
    const archetype = npc.personalityArchetype || 'normie_investor';
    const speakingStyle = ARCHETYPE_SPEAKING_STYLES[archetype] || ARCHETYPE_SPEAKING_STYLES.normie_investor;
    
    let prompt = `Generate a thought for this NPC:\n\n`;
    
    // NPC Identity
    prompt += `Name: ${npc.name}\n`;
    prompt += `Archetype: ${archetype}\n`;
    prompt += `Speaking Style: ${speakingStyle}\n`;
    prompt += `Occupation: ${npc.occupation}\n`;
    
    // Personality traits
    if (npc.personality) {
      prompt += `\nPersonality Traits:\n`;
      prompt += `- Risk Tolerance: ${Math.round(npc.personality.crypto.riskTolerance * 100)}%\n`;
      prompt += `- FOMO Level: ${Math.round(npc.personality.crypto.fomo * 100)}%\n`;
      prompt += `- Degen Level: ${Math.round(npc.personality.crypto.degenLevel * 100)}%\n`;
      prompt += `- Technical Knowledge: ${Math.round(npc.personality.crypto.technicalKnowledge * 100)}%\n`;
    }
    
    // Current context
    prompt += `\nCurrent Context:\n`;
    prompt += `- Time: ${context.timeOfDay}\n`;
    prompt += `- Market: ${context.marketCondition}\n`;
    prompt += `- Day: ${context.gameDay}\n`;
    
    // Nearby NPCs
    if (context.nearbyNPCs.length > 0) {
      const nearbyNames = context.nearbyNPCs.slice(0, 3).map(n => n.name);
      prompt += `- Nearby: ${nearbyNames.join(', ')}\n`;
    }
    
    // NPC needs (if available)
    if (npc.needs) {
      const lowNeeds: string[] = [];
      if (npc.needs.hunger.current < 50) lowNeeds.push(`hunger (${Math.round(npc.needs.hunger.current)}%)`);
      if (npc.needs.energy.current < 50) lowNeeds.push(`energy (${Math.round(npc.needs.energy.current)}%)`);
      if (npc.needs.social.current < 50) lowNeeds.push(`social (${Math.round(npc.needs.social.current)}%)`);
      if (npc.needs.fun.current < 50) lowNeeds.push(`fun (${Math.round(npc.needs.fun.current)}%)`);
      
      if (lowNeeds.length > 0) {
        prompt += `- Low Needs: ${lowNeeds.join(', ')}\n`;
      }
    }
    
    // Recent memories (limit to prevent token overflow)
    if (npc.memory && npc.memory.episodic.length > 0) {
      const recentMemories = npc.memory.episodic
        .filter(m => m.strength > 0.5)
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 3);
      
      if (recentMemories.length > 0) {
        prompt += `\nRecent Memories:\n`;
        for (const mem of recentMemories) {
          prompt += `- ${mem.event}\n`;
        }
      }
    }
    
    prompt += `\nGenerate a single short thought (1-2 sentences). No quotes.`;
    
    return prompt;
  }

  /**
   * Generate thought using LLM with fallback
   */
  async generateLLMThought(
    npc: CryptoNPC,
    context: ThoughtContext,
    lodLevel: NPCDetailLevel = NPCDetailLevel.FULL
  ): Promise<LLMThoughtResponse> {
    // Check LOD level
    if (!this.shouldUseLLMThought(lodLevel)) {
      return this.generateFallbackThought(npc, context);
    }
    
    // Check if LLM is enabled
    if (!this.llmConfig.enabled) {
      return this.generateFallbackThought(npc, context);
    }
    
    // Check NPC cooldown
    if (this.getLLMThoughtCooldownRemaining(npc.id) > 0) {
      return this.generateFallbackThought(npc, context);
    }
    
    // Check rate limits
    if (!this.checkLLMRateLimit()) {
      return this.generateFallbackThought(npc, context);
    }
    
    try {
      const response = await this.callLLMProvider(npc, context);
      
      // Record cooldown
      this.npcLLMCooldowns.set(npc.id, Date.now());
      
      return response;
    } catch (error) {
      console.warn('LLM thought generation failed, using fallback:', error);
      return this.generateFallbackThought(npc, context);
    }
  }

  /**
   * Generate fallback thought (template-based)
   */
  private generateFallbackThought(npc: CryptoNPC, context: ThoughtContext): LLMThoughtResponse {
    const thought = this.generateThought(npc, context);
    
    // Determine emotion from needs/mood
    let emotion = 'neutral';
    if (npc.internalWorld?.currentMood) {
      emotion = npc.internalWorld.currentMood;
    } else if (npc.needs) {
      const avgNeed = (
        npc.needs.fun.current +
        npc.needs.social.current +
        npc.needs.wealth?.current || 50
      ) / 3;
      
      if (avgNeed > 70) emotion = 'happy';
      else if (avgNeed < 30) emotion = 'sad';
    }
    
    return {
      thought,
      emotion,
      confidence: 0.7,
      usedLLM: false,
    };
  }

  /**
   * Call LLM provider for thought generation
   */
  private async callLLMProvider(npc: CryptoNPC, context: ThoughtContext): Promise<LLMThoughtResponse> {
    const prompt = this.buildLLMThoughtPrompt(npc, context);
    
    switch (this.llmConfig.provider) {
      case 'openai':
        return this.callOpenAI(prompt, npc);
      case 'anthropic':
        return this.callAnthropic(prompt, npc);
      case 'mock':
      default:
        return this.callMockProvider(prompt, npc, context);
    }
  }

  /**
   * Mock LLM provider for testing
   */
  private async callMockProvider(
    prompt: string,
    npc: CryptoNPC,
    context: ThoughtContext
  ): Promise<LLMThoughtResponse> {
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Generate a more contextual mock thought based on archetype
    const archetype = npc.personalityArchetype || 'normie_investor';
    const style = ARCHETYPE_THOUGHT_STYLES[archetype];
    
    let thought: string;
    
    // Context-aware mock thoughts
    if (context.marketCondition === 'bull' && style) {
      thought = this.pickRandom(style.optimistic);
    } else if (context.marketCondition === 'bear' && style) {
      thought = this.pickRandom(style.pessimistic);
    } else if (context.nearbyNPCs.length > 0) {
      const nearbyName = context.nearbyNPCs[0].name;
      thought = `Hmm, ${nearbyName} is around. Wonder what they're up to.`;
    } else if (style) {
      thought = this.pickRandom([...style.optimistic, ...style.pessimistic]);
    } else {
      thought = this.generateThought(npc, context);
    }
    
    // Record usage for rate limiting
    this.recordLLMUsage(25);
    
    return {
      thought,
      emotion: 'neutral',
      confidence: 0.85,
      usedLLM: true,
      tokensUsed: 25,
    };
  }

  /**
   * Call OpenAI API for thought generation
   */
  private async callOpenAI(prompt: string, npc: CryptoNPC): Promise<LLMThoughtResponse> {
    if (!this.llmConfig.apiKey) {
      throw new Error('OpenAI API key required');
    }
    
    const response = await fetch(
      this.llmConfig.apiEndpoint || 'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.llmConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: this.llmConfig.model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: LLM_THOUGHT_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          max_tokens: this.llmConfig.maxTokens,
          temperature: this.llmConfig.temperature,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const thought = data.choices[0]?.message?.content?.trim() || '';
    const tokensUsed = data.usage?.total_tokens || 0;
    
    this.recordLLMUsage(tokensUsed);
    
    return {
      thought,
      emotion: npc.internalWorld?.currentMood || 'neutral',
      confidence: 0.9,
      usedLLM: true,
      tokensUsed,
    };
  }

  /**
   * Call Anthropic API for thought generation
   */
  private async callAnthropic(prompt: string, npc: CryptoNPC): Promise<LLMThoughtResponse> {
    if (!this.llmConfig.apiKey) {
      throw new Error('Anthropic API key required');
    }
    
    const response = await fetch(
      this.llmConfig.apiEndpoint || 'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.llmConfig.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.llmConfig.model || 'claude-3-haiku-20240307',
          max_tokens: this.llmConfig.maxTokens,
          system: LLM_THOUGHT_SYSTEM_PROMPT,
          messages: [
            { role: 'user', content: prompt },
          ],
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const thought = data.content[0]?.text?.trim() || '';
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    
    this.recordLLMUsage(tokensUsed);
    
    return {
      thought,
      emotion: npc.internalWorld?.currentMood || 'neutral',
      confidence: 0.9,
      usedLLM: true,
      tokensUsed,
    };
  }

  /**
   * Store thought in NPC's episodic memory
   */
  storeThoughtInMemory(npc: CryptoNPC, response: LLMThoughtResponse): void {
    if (!npc.memory) return;
    
    npc.memory.episodic.push({
      id: `thought-${Date.now()}`,
      event: `Had a thought: "${response.thought}"`,
      participants: [npc.id],
      location: { x: npc.gridX, y: npc.gridY },
      timestamp: Date.now(),
      importance: response.usedLLM ? 5 : 3,
      emotionalValence: response.emotion === 'happy' ? 0.5 : response.emotion === 'sad' ? -0.5 : 0,
      strength: 0.8,
    });
  }

  /**
   * Update thought stream with LLM-generated thought
   */
  updateThoughtStreamWithLLM(npc: CryptoNPC, response: LLMThoughtResponse): void {
    if (!npc.thoughtStream) {
      npc.thoughtStream = this.createDefaultThoughtStream();
    }
    
    npc.thoughtStream.currentThought = response.thought;
    npc.thoughtStream.lastUpdated = Date.now();
    
    // Add observation about LLM thought
    npc.thoughtStream.observations = [
      ...npc.thoughtStream.observations.slice(-9),
      {
        type: 'event' as const,
        description: `Generated ${response.usedLLM ? 'LLM' : 'template'} thought with ${response.emotion} emotion`,
        timestamp: Date.now(),
        emotionalValence: response.emotion === 'happy' ? 0.5 : response.emotion === 'sad' ? -0.5 : 0,
      },
    ];
  }
}

// Singleton instance
export const thoughtEngine = new ThoughtEngine();

// Export helper for integration with NPCSimulation
export function generateNPCThought(npc: CryptoNPC, context: ThoughtContext): string {
  return thoughtEngine.generateThought(npc, context);
}
