/**
 * RelationshipManager for Crypto City NPCs
 *
 * Manages NPC relationships including creation, updates, queries, and decay.
 * Implements Inworld-style relationship tracking with trust, respect, familiarity, and attraction.
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { Relationship, RelationshipType, RelationshipThresholds } from './relationships';
import {
  RELATIONSHIP_THRESHOLDS,
  RELATIONSHIP_THRESHOLDS_ALL,
  RELATIONSHIP_DESCRIPTIONS,
  createDefaultRelationship,
  clampMetric,
} from './relationships';

/**
 * Decay rates for relationship metrics (per day)
 */
const DECAY_RATES = {
  /** Familiarity decays slowly over time */
  familiarity: 0.5,
  /** Trust decays towards neutral */
  trustDecayRate: 0.3,
  /** Attraction decays towards neutral */
  attractionDecayRate: 0.2,
};

/**
 * Interaction effects on metrics
 */
const INTERACTION_EFFECTS = {
  positive: {
    trust: 3,
    familiarity: 2,
    respect: 1,
  },
  negative: {
    trust: -5,
    familiarity: 1, // Still increases familiarity even with negative interactions
    respect: -2,
  },
};

/**
 * RelationshipManager handles all relationship operations for NPCs
 */
export class RelationshipManager {
  /**
   * Get an existing relationship between an NPC and a target
   *
   * @param npc - The NPC whose relationships to check
   * @param targetId - The ID of the target NPC
   * @returns The relationship if it exists, null otherwise
   */
  getRelationship(npc: CryptoNPC, targetId: string): Relationship | null {
    if (!npc.relationships || !npc.relationships[targetId]) {
      return null;
    }
    return npc.relationships[targetId];
  }

  /**
   * Get an existing relationship or create a new one if it doesn't exist
   *
   * @param npc - The NPC whose relationships to check/modify
   * @param targetId - The ID of the target NPC
   * @returns The existing or newly created relationship
   */
  getOrCreateRelationship(npc: CryptoNPC, targetId: string): Relationship {
    // Initialize relationships object if it doesn't exist
    if (!npc.relationships) {
      npc.relationships = {};
    }

    // Return existing relationship if found
    if (npc.relationships[targetId]) {
      return npc.relationships[targetId];
    }

    // Create new relationship
    const relationship = createDefaultRelationship(targetId);
    npc.relationships[targetId] = relationship;
    return relationship;
  }

  /**
   * Update a specific metric for a relationship
   *
   * @param npc - The NPC whose relationship to update
   * @param targetId - The ID of the target NPC
   * @param metric - The metric to update
   * @param delta - The amount to change the metric by
   */
  updateMetric(
    npc: CryptoNPC,
    targetId: string,
    metric: 'trust' | 'respect' | 'familiarity' | 'attraction',
    delta: number
  ): void {
    const relationship = this.getOrCreateRelationship(npc, targetId);
    relationship[metric] = clampMetric(relationship[metric] + delta, 0, 100);
    relationship.type = this.deriveRelationshipType(relationship);
  }

  /**
   * Record an interaction between NPCs
   *
   * @param npc - The NPC recording the interaction
   * @param targetId - The ID of the target NPC
   * @param positive - Whether the interaction was positive
   */
  recordInteraction(npc: CryptoNPC, targetId: string, positive: boolean): void {
    const relationship = this.getOrCreateRelationship(npc, targetId);
    const effects = positive ? INTERACTION_EFFECTS.positive : INTERACTION_EFFECTS.negative;

    // Update metrics
    relationship.trust = clampMetric(relationship.trust + effects.trust, 'trust');
    relationship.familiarity = clampMetric(relationship.familiarity + effects.familiarity, 'familiarity');
    relationship.respect = clampMetric(relationship.respect + effects.respect, 'respect');

    // Update history
    relationship.interactionCount++;
    relationship.lastInteraction = Date.now();

    // Update derived type
    relationship.type = this.deriveRelationshipType(relationship);
  }

  /**
   * Derive the relationship type from current metrics
   *
   * Uses a priority-based system where more specific types are checked first.
   *
   * @param relationship - The relationship to evaluate
   * @returns The derived relationship type
   */
  deriveRelationshipType(relationship: Relationship): RelationshipType {
    // Check types in priority order (most specific first)
    const typeCheckOrder: Array<Exclude<RelationshipType, 'stranger'>> = [
      // Extreme relationships first
      'nemesis',
      'best_friend',
      'partner',
      // Then specific types
      'mentor',
      'mentee',
      'romantic_interest',
      'close_friend',
      'business_partner',
      'rival',
      'enemy',
      'friend',
      // Finally generic types
      'acquaintance',
    ];

    for (const type of typeCheckOrder) {
      if (this.meetsThreshold(relationship, type)) {
        return type;
      }
    }

    return 'stranger';
  }

  /**
   * Check if a relationship meets the threshold for a given type
   *
   * @param relationship - The relationship to check
   * @param type - The relationship type to check against
   * @returns True if all thresholds are met
   */
  private meetsThreshold(relationship: Relationship, type: Exclude<RelationshipType, 'stranger'>): boolean {
    const threshold = RELATIONSHIP_THRESHOLDS_ALL[type as RelationshipType];
    if (!threshold) return false;

    // Check each threshold - for negative thresholds, the value must be <= threshold
    // For positive thresholds, the value must be >= threshold
    if (threshold.trust !== undefined) {
      if (threshold.trust < 0) {
        if (relationship.trust > threshold.trust) return false;
      } else {
        if (relationship.trust < threshold.trust) return false;
      }
    }

    if (threshold.respect !== undefined) {
      if (threshold.respect < 0) {
        if (relationship.respect > threshold.respect) return false;
      } else {
        if (relationship.respect < threshold.respect) return false;
      }
    }

    if (threshold.familiarity !== undefined) {
      if (relationship.familiarity < threshold.familiarity) return false;
    }

    if (threshold.attraction !== undefined) {
      if (relationship.attraction < threshold.attraction) return false;
    }

    return true;
  }

  /**
   * Get all NPCs that this NPC considers friends
   *
   * @param npc - The NPC to check
   * @returns Array of target IDs who are friends
   */
  getFriends(npc: CryptoNPC): string[] {
    if (!npc.relationships) return [];

    const friendTypes: RelationshipType[] = ['friend', 'close_friend', 'best_friend'];
    const relationships = Object.values(npc.relationships) as Relationship[];
    return relationships
      .filter((rel) => friendTypes.includes(rel.type))
      .map((rel) => rel.targetId);
  }

  /**
   * Get all NPCs that this NPC considers enemies
   *
   * @param npc - The NPC to check
   * @returns Array of target IDs who are enemies
   */
  getEnemies(npc: CryptoNPC): string[] {
    if (!npc.relationships) return [];

    const enemyTypes: RelationshipType[] = ['rival', 'enemy', 'nemesis'];
    const relationships = Object.values(npc.relationships) as Relationship[];
    return relationships
      .filter((rel) => enemyTypes.includes(rel.type))
      .map((rel) => rel.targetId);
  }

  /**
   * Get the closest relationships for an NPC, sorted by familiarity
   *
   * @param npc - The NPC to check
   * @param limit - Maximum number of relationships to return (default: all)
   * @returns Array of relationships sorted by familiarity (highest first)
   */
  getClosestRelationships(npc: CryptoNPC, limit?: number): Relationship[] {
    if (!npc.relationships) return [];

    const relationships = Object.values(npc.relationships) as Relationship[];
    const sorted = relationships.sort(
      (a, b) => b.familiarity - a.familiarity
    );

    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Decay all relationships for an NPC over time
   *
   * - Familiarity decays towards 0
   * - Trust decays towards 0 (neutral)
   * - Attraction decays towards 0 (neutral)
   *
   * @param npc - The NPC whose relationships to decay
   * @param daysPassed - Number of game days that have passed
   */
  decayRelationships(npc: CryptoNPC, daysPassed: number): void {
    if (!npc.relationships) return;

    const relationships = Object.values(npc.relationships) as Relationship[];
    for (const relationship of relationships) {
      // Decay familiarity towards 0
      const familiarityDecay = DECAY_RATES.familiarity * daysPassed;
      relationship.familiarity = clampMetric(
        relationship.familiarity - familiarityDecay,
        'familiarity'
      );

      // Decay trust towards 0
      if (relationship.trust !== 0) {
        const trustDecay = DECAY_RATES.trustDecayRate * daysPassed;
        if (relationship.trust > 0) {
          relationship.trust = clampMetric(
            Math.max(0, relationship.trust - trustDecay),
            'trust'
          );
        } else {
          relationship.trust = clampMetric(
            Math.min(0, relationship.trust + trustDecay),
            'trust'
          );
        }
      }

      // Decay attraction towards 0
      if (relationship.attraction !== 0) {
        const attractionDecay = DECAY_RATES.attractionDecayRate * daysPassed;
        if (relationship.attraction > 0) {
          relationship.attraction = clampMetric(
            Math.max(0, relationship.attraction - attractionDecay),
            'attraction'
          );
        } else {
          relationship.attraction = clampMetric(
            Math.min(0, relationship.attraction + attractionDecay),
            'attraction'
          );
        }
      }

      // Update derived type after decay
      relationship.type = this.deriveRelationshipType(relationship);
    }
  }

  /**
   * Add or remove favors from a relationship
   *
   * @param npc - The NPC whose relationship to update
   * @param targetId - The ID of the target NPC
   * @param delta - Amount to change favors by (positive = they owe us more)
   */
  addFavor(npc: CryptoNPC, targetId: string, delta: number): void {
    const relationship = this.getOrCreateRelationship(npc, targetId);
    relationship.owedFavors += delta;
  }

  /**
   * Get a Hitchhiker's Guide style description for a relationship type
   *
   * @param type - The relationship type
   * @returns The sardonic description
   */
  getRelationshipDescription(type: RelationshipType): string {
    return RELATIONSHIP_DESCRIPTIONS[type];
  }
}
