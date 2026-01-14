/**
 * NPC Disaster Reactions
 * 
 * "The universe, they point out, is vast, as they never fail to observe,
 * and contains many things. Many of those things are capable of reducing
 * a peaceful NPC's mood to 'panicked' in under 0.3 milliseconds."
 * 
 * Handles NPC mood, behavior, and memory updates during disasters.
 * NPCs react with varying degrees of panic based on personality.
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { Mood, InternalWorld } from '@/lib/npc/mood';
import type { EpisodicMemory } from '@/lib/npc/memory';
import type { ThoughtStream } from '@/lib/npc/ThoughtEngine';
import type { ActivePlayerDisaster } from './types';
import { PLAYER_DISASTERS } from './types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * NPC reaction intensity based on personality and disaster severity
 */
export type ReactionIntensity = 'calm' | 'concerned' | 'anxious' | 'panicked' | 'terrified';

/**
 * Behavioral response to disaster
 */
export type DisasterBehavior =
  | 'flee_home'       // Run to residence
  | 'flee_building'   // Exit current building
  | 'seek_shelter'    // Find nearest building
  | 'buy_dip'         // High risk tolerance - see opportunity
  | 'freeze'          // Too scared to move
  | 'help_others'     // Altruistic response
  | 'continue_work';  // Stoic response

/**
 * Disaster mood state for NPC internal world update
 */
export interface DisasterMoodState {
  /** Mood type */
  type: Mood;
  /** Mood intensity (0-1) */
  intensity: number;
  /** What caused this mood */
  cause: string;
  /** When mood was set */
  lastUpdate: number;
  /** How fast mood decays */
  decayRate: number;
}

/**
 * Result of processing NPC disaster reaction
 */
export interface NPCDisasterReaction {
  /** NPC ID */
  npcId: string;
  /** New mood to set */
  mood: DisasterMoodState;
  /** Current thought to display */
  thought: string;
  /** Behavioral response */
  behavior: DisasterBehavior;
  /** Memory to create */
  memory: Omit<EpisodicMemory, 'id' | 'timestamp'>;
  /** Intensity of reaction */
  intensity: ReactionIntensity;
}

// =============================================================================
// DISASTER THOUGHTS
// =============================================================================

/**
 * Thoughts NPCs might have during each disaster type.
 * Personality affects which thought is selected.
 */
const DISASTER_THOUGHTS: Record<string, { fearful: string[]; greedy: string[]; stoic: string[] }> = {
  market_crash: {
    fearful: [
      'Everything is crashing! My bags are ruined!',
      'Should have sold at the top... again...',
      'This is the end. The final rug.',
      'Why didn\'t I listen to that random anon?!',
    ],
    greedy: [
      'Blood in the streets... time to buy!',
      'Discounts everywhere! Loading up.',
      'Weak hands shaking out. My time has come.',
      'Finally, an entry point that isn\'t the top.',
    ],
    stoic: [
      'Another Tuesday in crypto.',
      'Zoom out. This is nothing.',
      'I\'ve seen worse in 2018.',
      'Diamond hands don\'t panic.',
    ],
  },
  rug_pull: {
    fearful: [
      'They took everything! The developers... gone!',
      'I should have checked the audit report...',
      'Not again! This is the third rug this month!',
      'My life savings... in a meme coin...',
    ],
    greedy: [
      'At least I got out early this time.',
      'Ruggers gonna rug. Next opportunity awaits.',
      'This is why you never go all in.',
      'Paper loss isn\'t real... right?',
    ],
    stoic: [
      'Not your keys, not your coins.',
      'Due diligence exists for a reason.',
      'The market is teaching someone a lesson.',
      'Lesson learned. Moving on.',
    ],
  },
  fire: {
    fearful: [
      'Fire! The mining rigs are exploding!',
      'Why did we put so many GPUs in one building?!',
      'Someone call the fire station! Oh wait...',
      'All that hashrate... gone in flames...',
    ],
    greedy: [
      'Insurance payout incoming.',
      'Time to upgrade to newer ASICs anyway.',
      'This is fine. Everything is fine.',
      'Cheaper electricity bill at least.',
    ],
    stoic: [
      'Should have had better cooling.',
      'Fire suppression systems exist for reasons.',
      'Decentralized... and now distributed ash.',
      'Time to rebuild. Stronger.',
    ],
  },
  earthquake: {
    fearful: [
      'The ground is shaking! Is this... an earthquake?!',
      'My portfolio AND my building are unstable!',
      'First the markets, now the earth itself!',
      'Nothing is solid anymore!',
    ],
    greedy: [
      'Construction contracts incoming.',
      'Disaster capitalism, but make it crypto.',
      'Rebuild better. Bigger. More profitable.',
      'Crisis = opportunity.',
    ],
    stoic: [
      'Natural disasters happen. Prepare accordingly.',
      'Buildings can be rebuilt. Code is forever.',
      'The blockchain doesn\'t care about earthquakes.',
      'Decentralized architecture survives.',
    ],
  },
  whale_dump: {
    fearful: [
      'A whale is dumping! Sell everything!',
      'They knew something! Inside trading!',
      'My stop loss just triggered... 80% down!',
      'Front-run by a whale. Again.',
    ],
    greedy: [
      'Whale dump = retail opportunity.',
      'Market maker games. Play the game.',
      'Set limit orders. Wait for bounce.',
      'Accumulate while they distribute.',
    ],
    stoic: [
      'Whales gonna whale.',
      'Liquidity event. Markets need them.',
      'Price discovery in action.',
      'Long-term thesis unchanged.',
    ],
  },
  fifty_one_attack: {
    fearful: [
      'The chain is under attack! 51%!',
      'Double spends everywhere! Trust nothing!',
      'Centralization has won! We\'ve lost!',
      'All transactions are fake! Nothing is real!',
    ],
    greedy: [
      'Buy the FUD. Attacks get resolved.',
      'Fork incoming. Free tokens.',
      'Hashrate will redistribute. Patience.',
      'Crisis price != real price.',
    ],
    stoic: [
      'Proof of work has trade-offs.',
      'Decentralization is a spectrum.',
      'Network will adapt. It always does.',
      'This is why multi-chain exists.',
    ],
  },
  sec_raid: {
    fearful: [
      'The SEC is here! Hide everything!',
      'I knew those tokens were securities!',
      'Prison! They\'re going to prison!',
      'Delete the Discord! Burn the roadmap!',
    ],
    greedy: [
      'FUD creates buying opportunities.',
      'Regulations mean adoption is real.',
      'Clear legal precedent incoming.',
      'Compliant tokens will moon.',
    ],
    stoic: [
      'Regulators doing their job.',
      'Gray areas getting clarified.',
      'This was inevitable. Adapt.',
      'Legal clarity benefits everyone long-term.',
    ],
  },
};

// =============================================================================
// REACTION CALCULATION
// =============================================================================

/**
 * Calculate reaction intensity based on NPC personality and disaster severity
 */
export function calculateReactionIntensity(
  npc: CryptoNPC,
  disasterId: string
): ReactionIntensity {
  const disaster = PLAYER_DISASTERS[disasterId];
  if (!disaster) return 'concerned';

  // Get personality traits - using bigFive and crypto structure
  const riskTolerance = npc.personality?.crypto?.riskTolerance ?? 0.5;
  const neuroticism = npc.personality?.bigFive?.neuroticism ?? 0.5;
  const extraversion = npc.personality?.bigFive?.extraversion ?? 0.5;

  // Base anxiety from disaster type
  let baseAnxiety = 0.5;
  switch (disaster.damageType) {
    case 'building_destroy':
      baseAnxiety = 0.9;
      break;
    case 'npc_panic':
      baseAnxiety = 0.7;
      break;
    case 'spread_damage':
      baseAnxiety = 0.8;
      break;
    case 'chain_offline':
      baseAnxiety = 0.6;
      break;
    case 'market_manipulation':
      baseAnxiety = 0.5;
      break;
    default:
      baseAnxiety = 0.6;
  }

  // Modify by personality
  let anxietyScore = baseAnxiety;
  
  // High risk tolerance = less panic
  anxietyScore -= (riskTolerance - 0.5) * 0.3;
  
  // High neuroticism = more panic
  anxietyScore += (neuroticism - 0.5) * 0.4;
  
  // High extraversion = slightly less panic (seeks social comfort)
  anxietyScore -= (extraversion - 0.5) * 0.1;

  // Clamp and convert to intensity
  anxietyScore = Math.max(0, Math.min(1, anxietyScore));

  if (anxietyScore < 0.2) return 'calm';
  if (anxietyScore < 0.4) return 'concerned';
  if (anxietyScore < 0.6) return 'anxious';
  if (anxietyScore < 0.8) return 'panicked';
  return 'terrified';
}

/**
 * Select behavior based on personality and reaction intensity
 */
export function selectDisasterBehavior(
  npc: CryptoNPC,
  intensity: ReactionIntensity,
  disasterId: string
): DisasterBehavior {
  const riskTolerance = npc.personality?.crypto?.riskTolerance ?? 0.5;
  const conscientiousness = npc.personality?.bigFive?.conscientiousness ?? 0.5;
  const agreeableness = npc.personality?.bigFive?.agreeableness ?? 0.5;

  // High risk tolerance during market events = buy the dip
  if (
    (disasterId === 'market_crash' || disasterId === 'whale_dump') &&
    riskTolerance > 0.7
  ) {
    return 'buy_dip';
  }

  // Very scared = freeze
  if (intensity === 'terrified' && Math.random() < 0.3) {
    return 'freeze';
  }

  // High agreeableness = help others
  if (agreeableness > 0.8 && Math.random() < 0.4) {
    return 'help_others';
  }

  // High conscientiousness = stoic response
  if (conscientiousness > 0.7 && intensity !== 'terrified') {
    return 'continue_work';
  }

  // Default behaviors based on intensity
  switch (intensity) {
    case 'calm':
      return 'continue_work';
    case 'concerned':
      return Math.random() < 0.5 ? 'continue_work' : 'flee_building';
    case 'anxious':
      return npc.residence ? 'flee_home' : 'seek_shelter';
    case 'panicked':
    case 'terrified':
      return npc.residence ? 'flee_home' : 'flee_building';
  }
}

/**
 * Generate a thought for the NPC based on disaster and personality
 */
export function generateDisasterThought(
  npc: CryptoNPC,
  disasterId: string,
  intensity: ReactionIntensity
): string {
  const thoughts = DISASTER_THOUGHTS[disasterId];
  if (!thoughts) {
    return 'Something is happening... This doesn\'t seem good.';
  }

  const riskTolerance = npc.personality?.crypto?.riskTolerance ?? 0.5;
  const neuroticism = npc.personality?.bigFive?.neuroticism ?? 0.5;

  // Select thought category based on personality
  let category: 'fearful' | 'greedy' | 'stoic';
  
  if (intensity === 'terrified' || intensity === 'panicked' || neuroticism > 0.7) {
    category = 'fearful';
  } else if (riskTolerance > 0.7) {
    category = 'greedy';
  } else {
    category = 'stoic';
  }

  const thoughtList = thoughts[category];
  return thoughtList[Math.floor(Math.random() * thoughtList.length)];
}

/**
 * Create a new mood state for the NPC during disaster
 */
export function createDisasterMood(
  intensity: ReactionIntensity,
  disasterId: string
): DisasterMoodState {
  const disaster = PLAYER_DISASTERS[disasterId];
  
  // Map intensity to mood type
  const moodMap: Record<ReactionIntensity, Mood> = {
    calm: 'content',
    concerned: 'anxious',
    anxious: 'anxious',
    panicked: 'angry', // Using angry as closest to fearful
    terrified: 'depressed',
  };

  const intensityMap: Record<ReactionIntensity, number> = {
    calm: 0.3,
    concerned: 0.5,
    anxious: 0.7,
    panicked: 0.85,
    terrified: 0.95,
  };

  return {
    type: moodMap[intensity],
    intensity: intensityMap[intensity],
    cause: disaster?.name || 'disaster',
    lastUpdate: Date.now(),
    decayRate: 0.01, // Slow decay - disaster effects linger
  };
}

/**
 * Create episodic memory for the disaster event
 */
export function createDisasterMemory(
  npc: CryptoNPC,
  disasterId: string,
  intensity: ReactionIntensity
): Omit<EpisodicMemory, 'id' | 'timestamp'> {
  const disaster = PLAYER_DISASTERS[disasterId];
  
  // Calculate importance based on intensity
  const importanceMap: Record<ReactionIntensity, number> = {
    calm: 3,
    concerned: 5,
    anxious: 6,
    panicked: 8,
    terrified: 9,
  };

  // Calculate emotional valence (negative for disasters)
  const valenceMap: Record<ReactionIntensity, number> = {
    calm: -0.2,
    concerned: -0.4,
    anxious: -0.6,
    panicked: -0.8,
    terrified: -0.95,
  };

  // Create event description with context
  const wasAtWork = npc.currentActivity === 'working';
  const wasHome = npc.currentBuildingId === npc.residence;
  const context = wasAtWork ? ' while working' : wasHome ? ' at home' : '';
  const now = Date.now();
  
  return {
    event: `Experienced ${disaster?.name || 'a disaster'} in the city${context}`,
    participants: [npc.id],
    location: { x: npc.gridX, y: npc.gridY },
    importance: importanceMap[intensity],
    emotionalValence: valenceMap[intensity],
    accessCount: 0,
    lastAccessed: now,
    strength: 1.0, // Fresh memory at full strength
  };
}

// =============================================================================
// MAIN REACTION PROCESSOR
// =============================================================================

/**
 * Process disaster reaction for a single NPC.
 * Returns the complete reaction to be applied.
 */
export function processNPCDisasterReaction(
  npc: CryptoNPC,
  disaster: ActivePlayerDisaster
): NPCDisasterReaction {
  const disasterId = disaster.disaster.id;
  
  // Calculate reaction intensity
  const intensity = calculateReactionIntensity(npc, disasterId);
  
  // Select behavior
  const behavior = selectDisasterBehavior(npc, intensity, disasterId);
  
  // Generate thought
  const thought = generateDisasterThought(npc, disasterId, intensity);
  
  // Create mood
  const mood = createDisasterMood(intensity, disasterId);
  
  // Create memory
  const memory = createDisasterMemory(npc, disasterId, intensity);

  return {
    npcId: npc.id,
    mood,
    thought,
    behavior,
    memory,
    intensity,
  };
}

/**
 * Apply a reaction to an NPC (mutates the NPC object)
 */
export function applyReactionToNPC(npc: CryptoNPC, reaction: NPCDisasterReaction): void {
  // Update internal world mood
  if (npc.internalWorld) {
    npc.internalWorld.currentMood = reaction.mood.type;
    npc.internalWorld.moodIntensity = reaction.mood.intensity;
  }

  // Update thought stream
  if (npc.thoughtStream) {
    npc.thoughtStream.currentThought = reaction.thought;
    npc.thoughtStream.lastUpdated = Date.now();
  }

  // Add memory
  if (npc.memory?.episodic) {
    const newMemory: EpisodicMemory = {
      id: `disaster_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      ...reaction.memory,
    };
    npc.memory.episodic.push(newMemory);
    
    // Keep memory size reasonable
    if (npc.memory.episodic.length > 100) {
      npc.memory.episodic = npc.memory.episodic.slice(-100);
    }
  }

  // Set activity based on behavior
  switch (reaction.behavior) {
    case 'flee_home':
    case 'flee_building':
    case 'seek_shelter':
      npc.currentActivity = 'walking';
      break;
    case 'freeze':
      npc.currentActivity = 'idle';
      break;
    case 'buy_dip':
    case 'continue_work':
      npc.currentActivity = 'working';
      break;
    case 'help_others':
      npc.currentActivity = 'socializing';
      break;
  }
}

/**
 * Process disaster reactions for all affected NPCs
 */
export function processDisasterReactions(
  npcs: CryptoNPC[],
  disaster: ActivePlayerDisaster
): NPCDisasterReaction[] {
  const reactions: NPCDisasterReaction[] = [];

  for (const npc of npcs) {
    // For NPC panic disasters, all NPCs are affected
    // For building disasters, only NPCs near affected buildings
    const isAffected = disaster.disaster.damageType === 'npc_panic' ||
      disaster.affectedBuildingIds.some(buildingId => {
        // Check if NPC is in or near the affected building
        // This is a simplified check - real implementation would use actual building positions
        return npc.currentBuildingId === buildingId;
      });

    if (isAffected || Math.random() < 0.3) { // 30% of other NPCs also react
      const reaction = processNPCDisasterReaction(npc, disaster);
      reactions.push(reaction);
      applyReactionToNPC(npc, reaction);
    }
  }

  return reactions;
}
