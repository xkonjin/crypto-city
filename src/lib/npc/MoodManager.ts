/**
 * MoodManager - Manages NPC internal mood states
 * 
 * This manager handles:
 * - Calculating mood based on needs, personality, and recent events
 * - Processing mood-affecting events
 * - Generating thoughts based on triggers and personality
 * - Managing beliefs and desires
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { PersonalityArchetype } from './personality';
import type { NeedType } from './needs';
import {
  Mood,
  Thought,
  Belief,
  Desire,
  InternalWorld,
  MoodEvent,
  MOOD_LEVELS,
  createThought,
  createDefaultInternalWorld,
} from './mood';

/**
 * Maximum number of thoughts to keep in memory.
 */
const MAX_THOUGHTS = 10;

/**
 * Thought templates by personality archetype and trigger.
 * These provide personality-appropriate responses to events.
 */
const THOUGHT_TEMPLATES: Partial<Record<PersonalityArchetype, Partial<Record<string, string[]>>>> = {
  bitcoin_maxi: {
    eth_pump: [
      "Fiat games. Number go up is irrelevant when fundamentals are wrong.",
      "Shitcoin casino is open again. Wake me when it's over.",
      "Temporary. Bitcoin fixes this.",
      "Meanwhile, Bitcoin just keeps doing its thing.",
    ],
    trading_loss: [
      "Doesn't matter. I only hold BTC.",
      "Paper hands get rekt. Diamond hands prevail.",
      "This is why you hold Bitcoin, not... whatever that was.",
    ],
    price_pump: [
      "This is the way. Number go up.",
      "Have fun staying poor, nocoiners.",
      "Bitcoin is inevitable.",
    ],
    market_volatility: [
      "Zoom out. Bitcoin doesn't care.",
      "Volatility is the price of truth.",
      "Weak hands fold. We remain.",
    ],
  },
  degen_trader: {
    trading_loss: [
      "It's not a loss until you sell. Diamond hands. This is fine.",
      "Just need one 100x to make it all back.",
      "Unrealized losses don't count anyway.",
      "Buy the dip? I AM the dip.",
    ],
    trading_win: [
      "WAGMI! Called it!",
      "Let it ride! House money now!",
      "This is just the beginning!",
    ],
    eth_pump: [
      "LFG! Should've aped harder!",
      "Bullish! What's next?",
    ],
    price_pump: [
      "UP ONLY! NGMI if you sold!",
      "I KNEW IT! Should've used more leverage!",
    ],
    market_volatility: [
      "Volatility is opportunity!",
      "Time to trade! Chop is profit!",
    ],
  },
  normie_investor: {
    trading_loss: [
      "Is... is that bad? Should I call someone?",
      "My cousin said this would happen...",
      "Maybe I should have stuck with my 401k...",
    ],
    trading_win: [
      "Wait, I'm actually making money?",
      "Should I sell? Is this the top?",
      "This crypto thing might actually work!",
    ],
    market_volatility: [
      "Why is it doing that? Is this normal?",
      "My heart can't take this.",
      "Maybe I should check less often...",
    ],
    price_pump: [
      "Is this good? This looks good.",
      "Should I buy more? Wait, is this a trap?",
    ],
    eth_pump: [
      "I think I own some of that?",
      "My coworker mentioned this one.",
    ],
  },
  privacy_maxi: {
    trading_loss: [
      "At least it was private.",
      "The taxman will never know.",
    ],
    trading_win: [
      "Nice. And nobody knows but me.",
      "Privacy + profit. Perfect.",
    ],
    market_volatility: [
      "The surveillance state can't track my stress.",
      "Volatile markets, private transactions.",
    ],
    price_pump: [
      "Up or down, at least it's private.",
    ],
  },
  eth_builder: {
    trading_loss: [
      "Should've built more, traded less.",
      "Back to coding. Markets are noise.",
    ],
    trading_win: [
      "Nice, but shipping code matters more.",
      "Profit to fund more gas fees!",
    ],
    eth_pump: [
      "Good for the ecosystem!",
      "More resources for builders!",
    ],
    market_volatility: [
      "Markets fluctuate. Code ships.",
    ],
    price_pump: [
      "Good for adoption. Back to work.",
    ],
  },
  nft_flipper: {
    trading_loss: [
      "Floor is temporary. Art is forever.",
      "Just need the right jpeg to moon.",
    ],
    trading_win: [
      "Flipped it! NFTs are the future!",
      "Right click that, losers!",
    ],
    price_pump: [
      "NFT season incoming!",
    ],
    eth_pump: [
      "ETH pumps = NFT pumps! LFG!",
    ],
    market_volatility: [
      "Volatility creates opportunities to snipe floors.",
    ],
  },
  staking_grandma: {
    trading_loss: [
      "Good thing I'm not trading.",
      "My yields don't care about the price.",
    ],
    trading_win: [
      "Slow and steady wins the race.",
      "Staking rewards keep coming either way.",
    ],
    market_volatility: [
      "Doesn't affect my APY.",
      "Young people and their trading...",
    ],
    price_pump: [
      "Nice. My stake is worth more now.",
    ],
  },
  protocol_politician: {
    trading_loss: [
      "Time to propose some stabilization measures.",
      "This affects governance participation...",
    ],
    trading_win: [
      "Good for treasury. Good for DAO.",
      "More resources for proposals!",
    ],
    market_volatility: [
      "The community needs to come together.",
      "Time for a governance discussion.",
    ],
    price_pump: [
      "Great news for token holders!",
    ],
  },
};

/**
 * Generic thought templates by mood when no archetype-specific match.
 */
const GENERIC_THOUGHTS: Partial<Record<Mood, Record<string, string[]>>> = {
  happy: {
    default: [
      "Things are looking up!",
      "Could be worse. Could be fiat.",
      "Today is a good day.",
    ],
  },
  sad: {
    default: [
      "Why do I keep doing this to myself?",
      "Maybe tomorrow will be better.",
      "Number went down. Feeling went with it.",
    ],
  },
  anxious: {
    default: [
      "What if it keeps going down?",
      "Should I have sold?",
      "The charts don't look good...",
    ],
  },
  angry: {
    default: [
      "This is manipulation!",
      "Somebody's going to pay for this!",
      "Unbelievable!",
    ],
  },
  ecstatic: {
    default: [
      "I'M GONNA MAKE IT!",
      "LIFE IS BEAUTIFUL!",
      "Nothing can stop me now!",
    ],
  },
  neutral: {
    default: [
      "Just another day.",
      "Waiting for something to happen.",
      "Could go either way from here.",
    ],
  },
  content: {
    default: [
      "All good.",
      "No complaints.",
      "Smooth sailing.",
    ],
  },
  depressed: {
    default: [
      "What's even the point?",
      "I should have stayed in fiat.",
      "Everything is rugged eventually.",
    ],
  },
};

/**
 * MoodManager handles all operations related to NPC mood states.
 */
export class MoodManager {
  /**
   * Calculate the current mood based on all factors.
   * 
   * @param npc - The NPC to calculate mood for
   * @returns Calculated mood and intensity
   */
  calculateMood(npc: CryptoNPC): { mood: Mood; intensity: number } {
    // Ensure internal world exists
    this.ensureInternalWorld(npc);

    // Calculate base mood score from needs (-1 to +1)
    const needsScore = this.calculateNeedsMoodScore(npc);
    
    // Apply personality modifier
    const personalityModifier = this.getPersonalityMoodModifier(npc);
    
    // Combined score
    let moodScore = needsScore + personalityModifier;
    
    // Clamp to -2 to +2 range
    moodScore = Math.max(-2, Math.min(2, moodScore));
    
    // Map score to mood
    const mood = this.scoreTomood(moodScore);
    
    // Calculate intensity (how strongly the mood is felt)
    const intensity = Math.abs(moodScore) / 2;

    return { mood, intensity };
  }

  /**
   * Calculate mood contribution from needs satisfaction.
   * @returns Score from -1 (all critical) to +1 (all satisfied)
   */
  private calculateNeedsMoodScore(npc: CryptoNPC): number {
    const needs = npc.needs;
    let totalScore = 0;
    let totalWeight = 0;

    const needTypes: NeedType[] = ['hunger', 'energy', 'social', 'fun', 'wealth', 'purpose'];
    
    for (const needType of needTypes) {
      const need = needs[needType];
      // Normalize to 0-1, then shift to -0.5 to +0.5
      const normalizedValue = (need.current / need.max) - 0.5;
      totalScore += normalizedValue * need.weight;
      totalWeight += need.weight;
    }

    // Return weighted average, scaled
    return totalWeight > 0 ? (totalScore / totalWeight) * 2 : 0;
  }

  /**
   * Get mood modifier from personality traits.
   * High neuroticism skews negative, high extraversion skews positive.
   */
  private getPersonalityMoodModifier(npc: CryptoNPC): number {
    const personality = npc.personality;
    let modifier = 0;

    // High neuroticism = more negative mood tendency
    modifier -= (personality.bigFive.neuroticism - 0.5) * 0.5;

    // High extraversion = slight positive mood tendency
    modifier += (personality.bigFive.extraversion - 0.5) * 0.2;

    // High agreeableness = slight positive tendency
    modifier += (personality.bigFive.agreeableness - 0.5) * 0.1;

    return modifier;
  }

  /**
   * Map a numeric score to a mood.
   */
  private scoreTomood(score: number): Mood {
    if (score >= 1.5) return 'ecstatic';
    if (score >= 0.5) return 'happy';
    if (score >= 0.1) return 'content';
    if (score >= -0.1) return 'neutral';
    if (score >= -0.5) return 'anxious';
    if (score >= -1.0) return 'sad';
    if (score >= -1.5) return 'angry';
    return 'depressed';
  }

  /**
   * Process an event that affects mood.
   * 
   * @param npc - The NPC to update
   * @param event - The mood event to process
   */
  processEvent(npc: CryptoNPC, event: MoodEvent): void {
    this.ensureInternalWorld(npc);

    const world = npc.internalWorld!;
    const currentLevel = MOOD_LEVELS[world.currentMood];
    
    // Determine mood change based on event type
    const moodChange = this.getEventMoodChange(event);
    
    // Apply change
    let newLevel = currentLevel + moodChange;
    newLevel = Math.max(-2, Math.min(2, newLevel));
    
    // Convert back to mood
    world.currentMood = this.levelToMood(newLevel, event);
    world.moodIntensity = Math.min(1, world.moodIntensity + event.magnitude * 0.3);

    // Generate and add thought about the event
    const thought = this.generateThought(npc, event.type);
    this.addThought(npc, thought);
  }

  /**
   * Get mood change from event type and magnitude.
   */
  private getEventMoodChange(event: MoodEvent): number {
    const positiveEvents = ['trading_win', 'social_positive', 'need_satisfied', 'work_success'];
    const negativeEvents = ['trading_loss', 'social_negative', 'need_critical', 'work_failure'];

    if (positiveEvents.includes(event.type)) {
      return event.magnitude * 1.5; // Max +1.5 for high magnitude positive event
    }
    if (negativeEvents.includes(event.type)) {
      return -event.magnitude * 1.5; // Max -1.5 for high magnitude negative event
    }
    return 0;
  }

  /**
   * Convert level back to mood, preferring certain moods based on event context.
   */
  private levelToMood(level: number, event?: MoodEvent): Mood {
    // Round to nearest 0.5
    const rounded = Math.round(level * 2) / 2;

    if (rounded >= 2) return 'ecstatic';
    if (rounded >= 1) return 'happy';
    if (rounded >= 0.5) return 'content';
    if (rounded > -0.5) return 'neutral';
    
    // For negative moods, context matters
    if (event) {
      if (event.type === 'trading_loss' || event.type === 'social_negative') {
        if (rounded <= -1.5) return 'depressed';
        return 'sad';
      }
      if (event.type === 'need_critical' || event.type === 'work_failure') {
        if (rounded <= -1.5) return 'depressed';
        return 'anxious';
      }
    }

    // Default negative mood selection
    if (rounded <= -1.5) return 'depressed';
    if (rounded <= -1) return 'sad';
    return 'anxious';
  }

  /**
   * Generate a thought based on the NPC's personality and current state.
   * 
   * @param npc - The NPC generating the thought
   * @param trigger - What triggered this thought
   * @returns Generated thought
   */
  generateThought(npc: CryptoNPC, trigger: string): Thought {
    this.ensureInternalWorld(npc);

    const archetype = npc.personalityArchetype;
    const mood = npc.internalWorld!.currentMood;
    let content: string;

    // Try to find archetype-specific thought
    if (archetype && THOUGHT_TEMPLATES[archetype]) {
      const archetypeThoughts = THOUGHT_TEMPLATES[archetype];
      if (archetypeThoughts && archetypeThoughts[trigger]) {
        const options = archetypeThoughts[trigger]!;
        content = options[Math.floor(Math.random() * options.length)];
      } else if (archetypeThoughts && archetypeThoughts['default']) {
        const options = archetypeThoughts['default']!;
        content = options[Math.floor(Math.random() * options.length)];
      } else {
        content = this.getGenericThought(mood, trigger);
      }
    } else {
      content = this.getGenericThought(mood, trigger);
    }

    return createThought({
      content,
      trigger,
      mood,
    });
  }

  /**
   * Get a generic thought based on mood.
   */
  private getGenericThought(mood: Mood, trigger: string): string {
    const moodThoughts = GENERIC_THOUGHTS[mood];
    if (moodThoughts) {
      const triggerThoughts = moodThoughts[trigger] || moodThoughts['default'];
      if (triggerThoughts) {
        return triggerThoughts[Math.floor(Math.random() * triggerThoughts.length)];
      }
    }
    return `Thinking about ${trigger}...`;
  }

  /**
   * Add a thought to the NPC's internal world, maintaining the limit.
   * 
   * @param npc - The NPC
   * @param thought - The thought to add
   */
  addThought(npc: CryptoNPC, thought: Thought): void {
    this.ensureInternalWorld(npc);

    const thoughts = npc.internalWorld!.thoughts;
    thoughts.push(thought);

    // Keep only the most recent thoughts
    if (thoughts.length > MAX_THOUGHTS) {
      npc.internalWorld!.thoughts = thoughts.slice(-MAX_THOUGHTS);
    }
  }

  /**
   * Add a belief to the NPC's internal world.
   * If a belief about the same subject exists, update it instead.
   * 
   * @param npc - The NPC
   * @param belief - The belief to add
   */
  addBelief(npc: CryptoNPC, belief: Belief): void {
    this.ensureInternalWorld(npc);

    const beliefs = npc.internalWorld!.beliefs;
    const existingIndex = beliefs.findIndex(b => b.subject === belief.subject);

    if (existingIndex >= 0) {
      // Update existing belief
      beliefs[existingIndex] = belief;
    } else {
      beliefs.push(belief);
    }
  }

  /**
   * Update the confidence of an existing belief.
   * 
   * @param npc - The NPC
   * @param subject - The belief subject to update
   * @param newConfidence - New confidence value (0-1)
   */
  updateBelief(npc: CryptoNPC, subject: string, newConfidence: number): void {
    this.ensureInternalWorld(npc);

    const belief = npc.internalWorld!.beliefs.find(b => b.subject === subject);
    if (belief) {
      belief.confidence = Math.max(0, Math.min(1, newConfidence));
    }
  }

  /**
   * Add a desire to the NPC's internal world.
   * 
   * @param npc - The NPC
   * @param desire - The desire to add
   */
  addDesire(npc: CryptoNPC, desire: Desire): void {
    this.ensureInternalWorld(npc);

    const desires = npc.internalWorld!.desires;
    const existingIndex = desires.findIndex(d => d.target === desire.target);

    if (existingIndex >= 0) {
      // Update existing desire
      desires[existingIndex] = desire;
    } else {
      desires.push(desire);
    }
  }

  /**
   * Get the NPC's strongest desire.
   * 
   * @param npc - The NPC
   * @returns The desire with highest intensity, or null if none
   */
  getStrongestDesire(npc: CryptoNPC): Desire | null {
    this.ensureInternalWorld(npc);

    const desires = npc.internalWorld!.desires;
    if (desires.length === 0) {
      return null;
    }

    return desires.reduce((strongest, current) =>
      current.intensity > strongest.intensity ? current : strongest
    );
  }

  /**
   * Ensure the NPC has an internal world initialized.
   * 
   * @param npc - The NPC to check/initialize
   */
  ensureInternalWorld(npc: CryptoNPC): void {
    if (!npc.internalWorld) {
      (npc as { internalWorld: InternalWorld }).internalWorld = createDefaultInternalWorld();
    }
  }

  /**
   * Get a human-readable description of the NPC's current mood.
   * 
   * @param npc - The NPC
   * @returns Mood description
   */
  getMoodDescription(npc: CryptoNPC): string {
    this.ensureInternalWorld(npc);
    const { MOOD_DESCRIPTIONS } = require('./mood');
    return MOOD_DESCRIPTIONS[npc.internalWorld!.currentMood];
  }

  /**
   * Decay mood intensity over time (moods should fade).
   * 
   * @param npc - The NPC
   * @param deltaMinutes - Time elapsed in game minutes
   */
  decayMoodIntensity(npc: CryptoNPC, deltaMinutes: number): void {
    this.ensureInternalWorld(npc);

    const decayRate = 0.01; // 1% per game minute
    npc.internalWorld!.moodIntensity = Math.max(
      0.3, // Minimum intensity (moods don't fully fade)
      npc.internalWorld!.moodIntensity - decayRate * deltaMinutes
    );
  }

  /**
   * Recalculate and update the NPC's mood based on current state.
   * 
   * @param npc - The NPC to update
   */
  updateMood(npc: CryptoNPC): void {
    const { mood, intensity } = this.calculateMood(npc);
    this.ensureInternalWorld(npc);
    npc.internalWorld!.currentMood = mood;
    npc.internalWorld!.moodIntensity = intensity;
  }
}
