/**
 * TitanAI - Belief-Desire-Intention AI Architecture for Titan Pet
 * 
 * Implements the BDI (Belief-Desire-Intention) architecture for autonomous
 * Titan decision making. Based on Black & White's creature AI design.
 * 
 * "Your Titan thinks, therefore it is... potentially problematic.
 * But mostly adorable." - Hitchhiker's Guide to Crypto City
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 5 on Titan AI
 */

import type { 
  TitanPet, 
  TitanGoal,
  TitanNeeds,
  PlayerBelief,
} from '@/games/isocity/types/titan';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents an observation the Titan makes about the world.
 * Observations update the Titan's beliefs.
 */
export interface TitanObservation {
  /** Type of observation source */
  type: 'npc_action' | 'player_action' | 'environment' | 'self_action';
  /** Subject of the observation (NPC ID or description) */
  subject?: string;
  /** What action was observed */
  action?: string;
  /** Outcome of the observed action */
  outcome?: 'success' | 'failure' | 'neutral';
  /** Location where observation occurred */
  location?: { x: number; y: number };
  /** When the observation was made */
  timestamp: number;
}

/**
 * Represents something the Titan wants to achieve.
 * Desires are computed from needs, mood, curiosity, commands, and learned behaviors.
 */
export interface TitanDesire {
  /** Goal type (e.g., 'seek_food', 'help_npc', 'explore') */
  type: string;
  /** How urgent this desire is (0-1, higher = more urgent) */
  priority: number;
  /** Where this desire originated */
  source: 'need' | 'mood' | 'curiosity' | 'command' | 'learned';
  /** Optional target (NPC ID or position) */
  target?: string | { x: number; y: number };
  /** Why this desire exists */
  reason: string;
}

/**
 * Represents a single action the Titan can take.
 */
export interface TitanAction {
  /** Action type (e.g., 'move', 'eat', 'interact') */
  type: string;
  /** Target of the action (NPC ID or position) */
  target?: string | { x: number; y: number };
  /** Estimated duration of the action in milliseconds */
  duration?: number;
}

/**
 * Represents the Titan's current plan to achieve a goal.
 */
export interface TitanIntention {
  /** The goal this intention aims to achieve */
  goal: TitanGoal;
  /** Sequence of actions to reach the goal */
  plan: TitanAction[];
  /** Current step in the plan (0-indexed) */
  currentStep: number;
  /** When this intention was formed */
  started: number;
  /** Maximum time before abandoning this intention */
  maxDuration: number;
}

/**
 * Serializable representation of Titan beliefs.
 */
export interface TitanBeliefs {
  /** General knowledge about the world (as array for serialization) */
  worldKnowledge: Array<[string, unknown]>;
  /** Opinions about NPCs (as array for serialization) */
  npcOpinions: Array<[string, number]>;
  /** Feelings about the player */
  playerRelationship: PlayerBelief;
}

/**
 * Serializable BDI state for persistence.
 */
export interface TitanBDIState {
  /** Serialized beliefs */
  beliefs: TitanBeliefs;
  /** Current desires */
  desires: TitanDesire[];
  /** Current intention or null */
  currentIntention: TitanIntention | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum world knowledge entries to prevent unbounded memory growth.
 * Uses FIFO eviction when exceeded.
 */
export const MAX_WORLD_KNOWLEDGE = 200;

/**
 * Maximum NPC opinion entries to prevent unbounded memory growth.
 * Uses FIFO eviction when exceeded.
 */
export const MAX_NPC_OPINIONS = 100;

/**
 * Minimum interval between BDI updates in milliseconds.
 * Prevents excessive computation during rapid game loops.
 */
export const MIN_BDI_UPDATE_INTERVAL = 100;

/**
 * NPC opinion decay rate per day (0.5 = opinions halve each day)
 */
const NPC_OPINION_DECAY_PER_DAY = 0.5;

/**
 * Minutes in a day (for decay calculations)
 */
const MINUTES_PER_DAY = 1440;

/**
 * Maximum actions in a plan
 */
const MAX_PLAN_LENGTH = 5;

/**
 * Default intention max duration (5 minutes in milliseconds)
 */
const DEFAULT_MAX_DURATION = 300000;

/**
 * Need to desire type mapping
 */
const NEED_TO_DESIRE: Record<string, string> = {
  hunger: 'seek_food',
  energy: 'rest',
  social: 'seek_social',
  fun: 'play',
  attention: 'seek_attention',
  growth: 'learn',
  wealth: 'gather_resources',
  purpose: 'help_city',
};

/**
 * Base urgency multiplier when need is below critical threshold
 */
const CRITICAL_URGENCY_MULTIPLIER = 2.0;

// ============================================================================
// TITAN BDI CLASS
// ============================================================================

/**
 * TitanBDI - Belief-Desire-Intention architecture for Titan AI.
 * 
 * Manages the Titan's beliefs about the world, desires (goals),
 * and intentions (plans to achieve goals).
 * 
 * The BDI loop:
 * 1. Observe the world → Update beliefs
 * 2. Compute desires based on needs, mood, curiosity, commands, learned behaviors
 * 3. Form intention by selecting highest priority achievable desire
 * 4. Execute intention step by step
 * 5. Repeat
 */
export class TitanBDI {
  /** Map of world knowledge (locations, facts, etc.) */
  private worldKnowledge: Map<string, unknown>;
  
  /** Map of NPC opinions (-1 to 1 scale) */
  private npcOpinions: Map<string, number>;
  
  /** Feelings about the player */
  private playerRelationship: PlayerBelief;
  
  /** Current list of desires */
  private desires: TitanDesire[];
  
  /** Current intention being executed */
  private currentIntention: TitanIntention | null;

  /** Timestamp of last BDI update for throttling */
  private lastBDIUpdate: number = 0;

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  /**
   * Create a new TitanBDI instance.
   * 
   * @param initialBdi - Optional initial state for restoration
   */
  constructor(initialBdi?: TitanBDIState) {
    if (initialBdi) {
      // Restore from serialized state
      this.worldKnowledge = new Map(initialBdi.beliefs.worldKnowledge);
      this.npcOpinions = new Map(initialBdi.beliefs.npcOpinions);
      this.playerRelationship = { ...initialBdi.beliefs.playerRelationship };
      this.desires = [...initialBdi.desires];
      this.currentIntention = initialBdi.currentIntention 
        ? { ...initialBdi.currentIntention }
        : null;
    } else {
      // Create fresh state
      this.worldKnowledge = new Map();
      this.npcOpinions = new Map();
      this.playerRelationship = {
        trust: 0.5,
        fear: 0,
        affection: 0.5,
      };
      this.desires = [];
      this.currentIntention = null;
    }
  }

  // ============================================================================
  // BELIEF MANAGEMENT
  // ============================================================================

  /**
   * Update beliefs based on an observation.
   * 
   * @param observation - What the Titan observed
   */
  updateBeliefs(observation: TitanObservation): void {
    switch (observation.type) {
      case 'npc_action':
        this.processNPCActionObservation(observation);
        break;
      case 'player_action':
        this.processPlayerActionObservation(observation);
        break;
      case 'environment':
        this.processEnvironmentObservation(observation);
        break;
      case 'self_action':
        this.processSelfActionObservation(observation);
        break;
    }
  }

  /**
   * Process an NPC observation for observation learning.
   * 
   * This is a convenience method for recording NPC observations
   * and updating beliefs accordingly. It wraps the internal
   * observation processing for external use.
   * 
   * @param npcId - ID of the NPC being observed
   * @param action - The action the NPC performed
   * @param outcome - Optional outcome of the action
   */
  processNPCObservation(npcId: string, action: string, outcome?: 'success' | 'failure'): void {
    const observation: TitanObservation = {
      type: 'npc_action',
      subject: npcId,
      action,
      outcome: outcome ?? 'neutral',
      timestamp: Date.now(),
    };
    
    this.updateBeliefs(observation);
  }

  /**
   * Process an NPC action observation.
   */
  private processNPCActionObservation(observation: TitanObservation): void {
    if (!observation.subject) return;

    const npcId = observation.subject;
    let opinionChange = 0;

    // Positive actions increase opinion
    if (observation.action === 'help' && observation.outcome === 'success') {
      opinionChange = 0.1;
    } else if (observation.action === 'hostile' || observation.action === 'attack') {
      opinionChange = -0.2;
    } else if (observation.outcome === 'success') {
      opinionChange = 0.05;
    } else if (observation.outcome === 'failure') {
      opinionChange = -0.05;
    }

    if (opinionChange !== 0) {
      const currentOpinion = this.getNPCOpinion(npcId);
      this.setNPCOpinion(npcId, currentOpinion + opinionChange);
    }

    // Store location if provided
    if (observation.location) {
      this.setWorldKnowledge(`npc_location_${npcId}`, observation.location);
    }
  }

  /**
   * Process a player action observation.
   */
  private processPlayerActionObservation(observation: TitanObservation): void {
    if (observation.action === 'praise') {
      this.playerRelationship.trust = Math.min(1, this.playerRelationship.trust + 0.1);
      this.playerRelationship.affection = Math.min(1, this.playerRelationship.affection + 0.1);
      this.playerRelationship.fear = Math.max(0, this.playerRelationship.fear - 0.05);
    } else if (observation.action === 'punish') {
      this.playerRelationship.trust = Math.max(-1, this.playerRelationship.trust - 0.1);
      this.playerRelationship.fear = Math.min(1, this.playerRelationship.fear + 0.15);
      this.playerRelationship.affection = Math.max(-1, this.playerRelationship.affection - 0.05);
    } else if (observation.action === 'command_go_to' && observation.location) {
      // Store command as a pending command belief
      this.setWorldKnowledge('pending_command', {
        type: 'go_to',
        location: observation.location,
        timestamp: observation.timestamp,
      });
    }
  }

  /**
   * Process an environment observation.
   */
  private processEnvironmentObservation(observation: TitanObservation): void {
    if (observation.action === 'discovered_food' && observation.location) {
      this.setWorldKnowledge('food_location', observation.location);
    } else if (observation.action === 'discovered_danger' && observation.location) {
      this.setWorldKnowledge('danger_location', observation.location);
    } else if (observation.location) {
      // Store generic discovery
      this.setWorldKnowledge(`discovered_${observation.timestamp}`, {
        action: observation.action,
        location: observation.location,
      });
    }
  }

  /**
   * Process a self-action observation (Titan's own actions).
   */
  private processSelfActionObservation(observation: TitanObservation): void {
    // Track successful/failed actions for learning
    if (observation.action && observation.outcome) {
      const key = `self_action_${observation.action}`;
      const existing = this.getWorldKnowledge<{ successes: number; failures: number }>(key);
      
      if (existing) {
        if (observation.outcome === 'success') {
          existing.successes++;
        } else if (observation.outcome === 'failure') {
          existing.failures++;
        }
        this.setWorldKnowledge(key, existing);
      } else {
        this.setWorldKnowledge(key, {
          successes: observation.outcome === 'success' ? 1 : 0,
          failures: observation.outcome === 'failure' ? 1 : 0,
        });
      }
    }
  }

  /**
   * Set a world knowledge value.
   * Enforces MAX_WORLD_KNOWLEDGE limit with FIFO eviction.
   * 
   * @param key - Knowledge key
   * @param value - Knowledge value
   */
  setWorldKnowledge(key: string, value: unknown): void {
    // Evict oldest if at limit and this is a new key
    if (!this.worldKnowledge.has(key) && this.worldKnowledge.size >= MAX_WORLD_KNOWLEDGE) {
      // Remove oldest entry (first key in Map insertion order)
      const firstKey = this.worldKnowledge.keys().next().value;
      if (firstKey !== undefined) {
        this.worldKnowledge.delete(firstKey);
      }
    }
    this.worldKnowledge.set(key, value);
  }

  /**
   * Get a world knowledge value.
   * 
   * @param key - Knowledge key
   * @returns The value or undefined if not found
   */
  getWorldKnowledge<T>(key: string): T | undefined {
    return this.worldKnowledge.get(key) as T | undefined;
  }

  /**
   * Set opinion about an NPC.
   * Enforces MAX_NPC_OPINIONS limit with FIFO eviction.
   * 
   * @param npcId - NPC identifier
   * @param opinion - Opinion value (-1 to 1)
   */
  setNPCOpinion(npcId: string, opinion: number): void {
    // Evict oldest if at limit and this is a new NPC
    if (!this.npcOpinions.has(npcId) && this.npcOpinions.size >= MAX_NPC_OPINIONS) {
      // Remove oldest entry (first key in Map insertion order)
      const firstKey = this.npcOpinions.keys().next().value;
      if (firstKey !== undefined) {
        this.npcOpinions.delete(firstKey);
      }
    }
    // Clamp to valid range
    const clampedOpinion = Math.max(-1, Math.min(1, opinion));
    this.npcOpinions.set(npcId, clampedOpinion);
  }

  /**
   * Get opinion about an NPC.
   * 
   * @param npcId - NPC identifier
   * @returns Opinion value (0 for unknown NPCs)
   */
  getNPCOpinion(npcId: string): number {
    return this.npcOpinions.get(npcId) ?? 0;
  }

  // ============================================================================
  // DESIRE COMPUTATION
  // ============================================================================

  /**
   * Compute desires based on current state.
   * 
   * Desires come from:
   * - Needs (low needs create desires to satisfy them)
   * - Mood (mood affects desire priorities)
   * - Curiosity (personality-based exploration desires)
   * - Commands (player commands create high-priority desires)
   * - Learned behaviors (positive beliefs create desires to repeat)
   * 
   * @param titan - The Titan pet
   * @returns Array of desires sorted by priority (descending)
   */
  computeDesires(titan: TitanPet): TitanDesire[] {
    const desires: TitanDesire[] = [];

    // 1. Desires from needs
    this.computeNeedDesires(titan, desires);

    // 2. Desires from mood
    this.computeMoodDesires(titan, desires);

    // 3. Desires from curiosity
    this.computeCuriosityDesires(titan, desires);

    // 4. Desires from commands
    this.computeCommandDesires(desires);

    // 5. Desires from learned behaviors
    this.computeLearnedDesires(titan, desires);

    // Sort by priority (descending)
    desires.sort((a, b) => b.priority - a.priority);

    // Update internal state
    this.desires = desires;

    return desires;
  }

  /**
   * Compute desires from Titan's needs.
   */
  private computeNeedDesires(titan: TitanPet, desires: TitanDesire[]): void {
    const needs = titan.needs;
    
    for (const [needName, need] of Object.entries(needs)) {
      const desireType = NEED_TO_DESIRE[needName];
      if (!desireType) continue;

      // Calculate base priority from need deficit
      const deficit = 1 - need.current / need.max;
      
      // Apply weight and urgency multiplier
      let priority = deficit * need.weight;
      
      // Critical needs get boosted
      if (need.current <= need.criticalThreshold) {
        priority *= CRITICAL_URGENCY_MULTIPLIER;
      }

      // Apply personality modifier (using mood beliefs as proxy)
      const personalityModifier = this.getPersonalityModifier(needName);
      priority *= (1 + personalityModifier);

      // Clamp to 0-1
      priority = Math.min(1, Math.max(0, priority));

      // Only add if priority is meaningful
      if (priority > 0.1) {
        desires.push({
          type: desireType,
          priority,
          source: 'need',
          reason: `${needName} is at ${Math.round(need.current)}%`,
        });
      }
    }
  }

  /**
   * Compute desires from Titan's mood.
   */
  private computeMoodDesires(titan: TitanPet, desires: TitanDesire[]): void {
    const mood = titan.mood;

    // Sad mood creates desire for social/attention
    if (mood.currentMood === 'sad') {
      desires.push({
        type: 'seek_social',
        priority: 0.4 * mood.moodIntensity,
        source: 'mood',
        reason: 'Feeling sad, wants company',
      });
    }

    // Angry mood might create desire to avoid interaction
    if (mood.currentMood === 'angry') {
      desires.push({
        type: 'be_alone',
        priority: 0.3 * mood.moodIntensity,
        source: 'mood',
        reason: 'Feeling angry, needs space',
      });
    }

    // Happy mood increases exploration desires
    if (mood.currentMood === 'happy') {
      desires.push({
        type: 'explore',
        priority: 0.25 * mood.moodIntensity,
        source: 'mood',
        reason: 'Feeling happy, wants to explore',
      });
    }

    // Anxious mood creates desire for safety
    if (mood.currentMood === 'anxious') {
      desires.push({
        type: 'seek_safety',
        priority: 0.5 * mood.moodIntensity,
        source: 'mood',
        reason: 'Feeling anxious, wants safety',
      });
    }
  }

  /**
   * Compute curiosity-driven desires.
   */
  private computeCuriosityDesires(titan: TitanPet, desires: TitanDesire[]): void {
    // Check if there are unexplored areas in beliefs
    const beliefs = titan.mood.beliefs || [];
    
    for (const belief of beliefs) {
      if (belief.subject === 'unexplored_area' && belief.confidence > 0.5) {
        desires.push({
          type: 'explore',
          priority: 0.3 * belief.confidence,
          source: 'curiosity',
          reason: 'Curious about unexplored area',
        });
        break; // Only one curiosity desire
      }
    }

    // Base curiosity if no beliefs
    if (!beliefs.length) {
      desires.push({
        type: 'wander',
        priority: 0.15,
        source: 'curiosity',
        reason: 'Natural curiosity',
      });
    }
  }

  /**
   * Compute desires from player commands.
   */
  private computeCommandDesires(desires: TitanDesire[]): void {
    const pendingCommand = this.getWorldKnowledge<{
      type: string;
      location?: { x: number; y: number };
      timestamp: number;
    }>('pending_command');

    if (pendingCommand) {
      // Commands are high priority
      desires.push({
        type: `command_${pendingCommand.type}`,
        priority: 0.95, // Very high priority
        source: 'command',
        target: pendingCommand.location,
        reason: 'Player commanded',
      });
    }
  }

  /**
   * Compute desires from learned behaviors.
   */
  private computeLearnedDesires(titan: TitanPet, desires: TitanDesire[]): void {
    // Check for positive associations with NPCs
    for (const [npcId, opinion] of this.npcOpinions.entries()) {
      if (opinion > 0.6) {
        // Strong positive opinion creates desire to interact
        desires.push({
          type: 'help_npc',
          priority: 0.3 * opinion,
          source: 'learned',
          target: npcId,
          reason: `Likes ${npcId} and wants to interact`,
        });
      }
    }

    // Check for successful self-actions
    for (const [key, value] of this.worldKnowledge.entries()) {
      if (key.startsWith('self_action_')) {
        const stats = value as { successes: number; failures: number };
        if (stats && stats.successes > stats.failures * 2) {
          const action = key.replace('self_action_', '');
          desires.push({
            type: action,
            priority: Math.min(0.4, 0.1 * stats.successes),
            source: 'learned',
            reason: `Has succeeded at ${action} before`,
          });
        }
      }
    }
  }

  /**
   * Get personality modifier for a need type.
   * This would ideally come from Big Five traits but we use a simple approach.
   */
  private getPersonalityModifier(needName: string): number {
    // Simple modifiers based on need type
    const modifiers: Record<string, number> = {
      hunger: 0,
      energy: 0,
      social: 0.1,
      fun: 0.1,
      attention: 0.15,
      growth: 0.1,
      wealth: -0.1,
      purpose: 0.05,
    };
    return modifiers[needName] ?? 0;
  }

  /**
   * Get top N desires by priority.
   * 
   * @param count - Number of desires to return
   * @returns Top desires
   */
  getPriorityDesires(count: number): TitanDesire[] {
    return this.desires.slice(0, count);
  }

  // ============================================================================
  // INTENTION FORMATION
  // ============================================================================

  /**
   * Form an intention from desires.
   * 
   * Selects the highest priority achievable desire and creates a plan.
   * 
   * @param desires - Available desires
   * @param titan - The Titan pet
   * @returns Formed intention or null if no achievable desire
   */
  formIntention(desires: TitanDesire[], titan: TitanPet): TitanIntention | null {
    if (desires.length === 0) {
      this.currentIntention = null;
      return null;
    }

    // Find highest priority achievable desire
    for (const desire of desires) {
      const plan = this.createPlan(desire, titan);
      if (plan.length > 0) {
        const intention: TitanIntention = {
          goal: this.desireToGoal(desire),
          plan,
          currentStep: 0,
          started: Date.now(),
          maxDuration: this.calculateMaxDuration(plan),
        };
        
        this.currentIntention = intention;
        
        // Clear command if we're executing it
        if (desire.source === 'command') {
          this.worldKnowledge.delete('pending_command');
        }
        
        return intention;
      }
    }

    this.currentIntention = null;
    return null;
  }

  /**
   * Convert a desire to a TitanGoal.
   */
  private desireToGoal(desire: TitanDesire): TitanGoal {
    switch (desire.type) {
      case 'seek_food':
        return { type: 'seek_food' };
      case 'rest':
        return { type: 'rest' };
      case 'seek_social':
      case 'seek_attention':
        return { type: 'seek_attention' };
      case 'play':
        return { type: 'play' };
      case 'explore':
      case 'wander':
        if (desire.target && typeof desire.target === 'object') {
          return { type: 'explore_area', area: desire.target };
        }
        return { type: 'play' }; // Default to play for exploration
      case 'help_npc':
        if (typeof desire.target === 'string') {
          return { type: 'help_npc', npcId: desire.target };
        }
        return { type: 'play' };
      case 'learn':
        if (typeof desire.target === 'string') {
          return { type: 'learn_from', npcId: desire.target };
        }
        return { type: 'play' };
      case 'command_go_to':
        if (desire.target && typeof desire.target === 'object') {
          return { type: 'explore_area', area: desire.target };
        }
        return { type: 'play' };
      default:
        return { type: 'play' };
    }
  }

  /**
   * Create a plan to achieve a desire.
   * Plans are 1-5 actions typically.
   */
  private createPlan(desire: TitanDesire, titan: TitanPet): TitanAction[] {
    const plan: TitanAction[] = [];
    
    switch (desire.type) {
      case 'seek_food':
        this.planSeekFood(plan, titan);
        break;
      case 'rest':
        this.planRest(plan, titan);
        break;
      case 'seek_social':
      case 'seek_attention':
        this.planSeekSocial(plan, titan);
        break;
      case 'play':
        this.planPlay(plan, titan);
        break;
      case 'explore':
      case 'wander':
        this.planExplore(plan, titan, desire.target);
        break;
      case 'help_npc':
        this.planHelpNPC(plan, titan, desire.target);
        break;
      case 'command_go_to':
        this.planGoTo(plan, titan, desire.target);
        break;
      default:
        // Default simple plan
        plan.push({ type: 'idle', duration: 2000 });
    }

    // Ensure plan doesn't exceed max length
    return plan.slice(0, MAX_PLAN_LENGTH);
  }

  /**
   * Plan to seek food.
   */
  private planSeekFood(plan: TitanAction[], titan: TitanPet): void {
    const foodLocation = this.getWorldKnowledge<{ x: number; y: number }>('food_location');
    
    if (foodLocation) {
      // Move to food location
      if (titan.gridX !== foodLocation.x || titan.gridY !== foodLocation.y) {
        plan.push({ 
          type: 'move', 
          target: foodLocation,
          duration: 2000,
        });
      }
      // Eat
      plan.push({ type: 'eat', duration: 3000 });
    } else {
      // Wander to find food
      plan.push({ type: 'wander', duration: 3000 });
      plan.push({ type: 'seek_food', duration: 2000 });
    }
  }

  /**
   * Plan to rest.
   */
  private planRest(plan: TitanAction[], titan: TitanPet): void {
    // Find a safe spot or stay put
    plan.push({ type: 'sit', duration: 1000 });
    plan.push({ type: 'sleep', duration: 10000 });
  }

  /**
   * Plan to seek social interaction.
   */
  private planSeekSocial(plan: TitanAction[], titan: TitanPet): void {
    // Find an NPC with positive opinion
    let targetNPC: string | undefined;
    let bestOpinion = 0;
    
    for (const [npcId, opinion] of this.npcOpinions.entries()) {
      if (opinion > bestOpinion) {
        bestOpinion = opinion;
        targetNPC = npcId;
      }
    }

    if (targetNPC) {
      const npcLocation = this.getWorldKnowledge<{ x: number; y: number }>(`npc_location_${targetNPC}`);
      if (npcLocation) {
        plan.push({ type: 'move', target: npcLocation, duration: 2000 });
      }
      plan.push({ type: 'interact', target: targetNPC, duration: 3000 });
    } else {
      // Wander to find NPCs
      plan.push({ type: 'wander', duration: 3000 });
      plan.push({ type: 'look_for_npc', duration: 2000 });
    }
  }

  /**
   * Plan to play.
   */
  private planPlay(plan: TitanAction[], titan: TitanPet): void {
    plan.push({ type: 'play', duration: 5000 });
  }

  /**
   * Plan to explore.
   */
  private planExplore(plan: TitanAction[], titan: TitanPet, target?: string | { x: number; y: number }): void {
    if (target && typeof target === 'object') {
      plan.push({ type: 'move', target, duration: 3000 });
      plan.push({ type: 'look_around', duration: 2000 });
    } else {
      // Random exploration
      const randomTarget = {
        x: titan.gridX + Math.floor(Math.random() * 10) - 5,
        y: titan.gridY + Math.floor(Math.random() * 10) - 5,
      };
      plan.push({ type: 'move', target: randomTarget, duration: 3000 });
      plan.push({ type: 'look_around', duration: 2000 });
    }
  }

  /**
   * Plan to help an NPC.
   */
  private planHelpNPC(plan: TitanAction[], titan: TitanPet, target?: string | { x: number; y: number }): void {
    if (typeof target === 'string') {
      const npcLocation = this.getWorldKnowledge<{ x: number; y: number }>(`npc_location_${target}`);
      if (npcLocation) {
        plan.push({ type: 'move', target: npcLocation, duration: 2000 });
      }
      plan.push({ type: 'help', target, duration: 4000 });
    } else {
      // Just wander and look for NPCs to help
      plan.push({ type: 'wander', duration: 3000 });
    }
  }

  /**
   * Plan to go to a specific location.
   */
  private planGoTo(plan: TitanAction[], titan: TitanPet, target?: string | { x: number; y: number }): void {
    if (target && typeof target === 'object') {
      plan.push({ type: 'move', target, duration: 3000 });
      plan.push({ type: 'arrive', duration: 500 });
    }
  }

  /**
   * Calculate max duration for a plan.
   */
  private calculateMaxDuration(plan: TitanAction[]): number {
    let total = 0;
    for (const action of plan) {
      total += action.duration ?? 2000;
    }
    // Add buffer
    return Math.max(total * 1.5, DEFAULT_MAX_DURATION);
  }

  /**
   * Get the current intention.
   * 
   * @returns Current intention or null
   */
  getCurrentIntention(): TitanIntention | null {
    return this.currentIntention;
  }

  /**
   * Clear the current intention.
   */
  clearIntention(): void {
    this.currentIntention = null;
  }

  // ============================================================================
  // EXECUTION
  // ============================================================================

  /**
   * Execute the current intention.
   * 
   * Returns the current action to perform, or null if no intention.
   * 
   * @param titan - The Titan pet
   * @returns Current action or null
   */
  executeIntention(titan: TitanPet): TitanAction | null {
    if (!this.currentIntention) {
      return null;
    }

    const intention = this.currentIntention;
    
    // Check if intention has expired
    if (Date.now() - intention.started > intention.maxDuration) {
      this.clearIntention();
      return null;
    }

    // Check if plan is complete
    if (intention.currentStep >= intention.plan.length) {
      this.clearIntention();
      return null;
    }

    // Return current action
    return intention.plan[intention.currentStep];
  }

  // ============================================================================
  // BELIEF DECAY
  // ============================================================================

  /**
   * Decay beliefs over time.
   * 
   * NPC opinions decay toward 0 at 0.5 per day.
   * World knowledge persists (doesn't decay).
   * 
   * @param deltaMinutes - Game minutes elapsed
   */
  decayBeliefs(deltaMinutes: number): void {
    if (deltaMinutes <= 0) return;

    // Calculate decay factor
    const dayFraction = deltaMinutes / MINUTES_PER_DAY;
    const decayAmount = NPC_OPINION_DECAY_PER_DAY * dayFraction;

    // Decay NPC opinions toward 0
    for (const [npcId, opinion] of this.npcOpinions.entries()) {
      if (opinion > 0) {
        const newOpinion = Math.max(0, opinion - decayAmount);
        this.npcOpinions.set(npcId, newOpinion);
      } else if (opinion < 0) {
        const newOpinion = Math.min(0, opinion + decayAmount);
        this.npcOpinions.set(npcId, newOpinion);
      }
    }

    // World knowledge doesn't decay (per spec)
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  /**
   * Serialize the BDI state for persistence.
   * 
   * @returns Serializable state object
   */
  toState(): TitanBDIState {
    return {
      beliefs: {
        worldKnowledge: Array.from(this.worldKnowledge.entries()),
        npcOpinions: Array.from(this.npcOpinions.entries()),
        playerRelationship: { ...this.playerRelationship },
      },
      desires: [...this.desires],
      currentIntention: this.currentIntention 
        ? { ...this.currentIntention }
        : null,
    };
  }

  /**
   * Create a TitanBDI instance from serialized state.
   * 
   * @param state - Serialized state
   * @returns New TitanBDI instance
   */
  static fromState(state: TitanBDIState): TitanBDI {
    return new TitanBDI(state);
  }

  // ============================================================================
  // THROTTLING
  // ============================================================================

  /**
   * Check if enough time has passed since the last BDI update.
   * Used to throttle expensive BDI computations.
   * 
   * @returns true if update should proceed, false if throttled
   */
  shouldUpdate(): boolean {
    const now = Date.now();
    if (now - this.lastBDIUpdate < MIN_BDI_UPDATE_INTERVAL) {
      return false;
    }
    this.lastBDIUpdate = now;
    return true;
  }
}
