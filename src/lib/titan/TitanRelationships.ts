/**
 * TitanRelationships - Relationship Tracking System for Titan Pet
 * 
 * Manages the Titan's relationships with individual NPCs in Crypto City.
 * Tracks trust, respect, familiarity, and fear metrics with decay over time.
 * 
 * Reference: specs/HERO_PET_SYSTEM.md Section 6.2
 * 
 * "In the crypto world, your relationships are like your portfolio:
 * constantly shifting, often surprising, and occasionally devastating."
 * - Hitchhiker's Guide to Crypto City
 */

import type { TitanRelationship } from '@/games/isocity/types/titan';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Decay rates per game day for relationship metrics.
 * Trust and respect decay slowly, familiarity never decays, fear decays fastest.
 */
export const TITAN_RELATIONSHIP_DECAY_RATES = {
  trust: 0.5,       // Trust decays slowly
  respect: 0.3,     // Respect decays very slowly
  familiarity: 0,   // Familiarity doesn't decay (memories persist)
  fear: 1.0,        // Fear decays faster (they get used to the Titan)
} as const;

/**
 * Relationship milestones that trigger events.
 * Based on familiarity, trust, and fear thresholds.
 */
export const RELATIONSHIP_MILESTONES = {
  // Familiarity milestones
  first_meeting: 0,
  acquaintance: 20,
  familiar: 40,
  friend: 60,
  close_friend: 80,
  best_friend: 95,
  // Trust milestones
  trusted: 50,
  highly_trusted: 80,
  // Fear milestones
  feared: 50,
  terrified: 80,
} as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Relationship sentiment categories based on trust level.
 */
export type RelationshipSentiment = 'hostile' | 'negative' | 'neutral' | 'positive' | 'friendly';

/**
 * Relationship event type when significant changes occur.
 */
export interface RelationshipEvent {
  /** Type of event */
  type: 'improved' | 'worsened' | 'milestone';
  /** NPC involved */
  npcId: string;
  /** Which metric changed */
  metric: 'trust' | 'respect' | 'familiarity' | 'fear';
  /** Previous value */
  oldValue: number;
  /** New value */
  newValue: number;
  /** When the event occurred */
  timestamp: number;
}

/**
 * Valid relationship metrics that can be updated.
 */
export type RelationshipMetric = 'trust' | 'respect' | 'familiarity' | 'fear';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a default relationship with an NPC.
 * All metrics start at 0 (neutral).
 * 
 * @param npcId - The ID of the NPC
 * @returns A new TitanRelationship with default values
 */
export function createDefaultTitanRelationship(npcId: string): TitanRelationship {
  const now = Date.now();
  return {
    npcId,
    trust: 0,
    respect: 0,
    familiarity: 0,
    fear: 0,
    firstMet: now,
    lastInteraction: now,
    interactionCount: 0,
  };
}

/**
 * Clamp a relationship value to its valid range based on metric type.
 * 
 * - trust: -100 to +100
 * - respect: -100 to +100
 * - familiarity: 0 to 100 (can't have negative familiarity)
 * - fear: 0 to 100 (can't have negative fear)
 * 
 * @param value - The value to clamp
 * @param type - The relationship metric type
 * @returns The clamped value
 */
export function clampRelationshipValue(
  value: number,
  type: RelationshipMetric
): number {
  if (type === 'familiarity' || type === 'fear') {
    // These metrics are 0-100 only
    return Math.max(0, Math.min(100, value));
  }
  // trust and respect are -100 to +100
  return Math.max(-100, Math.min(100, value));
}

/**
 * Calculate the relationship sentiment based on trust level.
 * 
 * | Sentiment | Trust Range |
 * |-----------|-------------|
 * | hostile   | < -50       |
 * | negative  | -50 to -20  |
 * | neutral   | -20 to +30  |
 * | positive  | +30 to +60  |
 * | friendly  | > +60       |
 * 
 * @param relationship - The relationship to evaluate
 * @returns The sentiment category
 */
export function getRelationshipSentiment(
  relationship: TitanRelationship
): RelationshipSentiment {
  const { trust } = relationship;
  
  if (trust < -50) return 'hostile';
  if (trust < -20) return 'negative';
  if (trust < 30) return 'neutral';
  if (trust < 60) return 'positive';
  return 'friendly';
}

/**
 * Apply time-based decay to a single relationship.
 * Trust and respect decay toward 0, familiarity never decays, fear decays toward 0.
 * 
 * @param relationship - The relationship to decay
 * @param daysPassed - Number of game days that have passed
 * @returns A new relationship with decayed values
 */
export function decayRelationship(
  relationship: TitanRelationship,
  daysPassed: number
): TitanRelationship {
  // Calculate decay amounts
  const trustDecay = TITAN_RELATIONSHIP_DECAY_RATES.trust * daysPassed;
  const respectDecay = TITAN_RELATIONSHIP_DECAY_RATES.respect * daysPassed;
  const fearDecay = TITAN_RELATIONSHIP_DECAY_RATES.fear * daysPassed;
  
  // Apply decay toward zero
  const decayTowardZero = (value: number, decay: number): number => {
    if (value > 0) {
      return Math.max(0, value - decay);
    } else if (value < 0) {
      return Math.min(0, value + decay);
    }
    return 0;
  };
  
  return {
    ...relationship,
    trust: decayTowardZero(relationship.trust, trustDecay),
    respect: decayTowardZero(relationship.respect, respectDecay),
    // familiarity never decays
    fear: Math.max(0, relationship.fear - fearDecay),
  };
}

/**
 * Check if a relationship change triggers a significant event.
 * Events are triggered when:
 * - A milestone threshold is crossed (familiarity, trust, fear)
 * - Trust crosses from positive to negative or vice versa (major change)
 * 
 * @param oldRel - Previous relationship state
 * @param newRel - Current relationship state
 * @returns A RelationshipEvent if significant, null otherwise
 */
export function checkForRelationshipEvent(
  oldRel: TitanRelationship,
  newRel: TitanRelationship
): RelationshipEvent | null {
  const timestamp = Date.now();
  
  // Check trust milestones
  const trustMilestones = [
    { threshold: RELATIONSHIP_MILESTONES.trusted, direction: 'up' },
    { threshold: RELATIONSHIP_MILESTONES.highly_trusted, direction: 'up' },
  ];
  
  for (const { threshold } of trustMilestones) {
    if (oldRel.trust < threshold && newRel.trust >= threshold) {
      return {
        type: 'milestone',
        npcId: newRel.npcId,
        metric: 'trust',
        oldValue: oldRel.trust,
        newValue: newRel.trust,
        timestamp,
      };
    }
  }
  
  // Check if trust crossed from positive to negative (worsened)
  if (oldRel.trust >= 0 && newRel.trust < 0) {
    return {
      type: 'worsened',
      npcId: newRel.npcId,
      metric: 'trust',
      oldValue: oldRel.trust,
      newValue: newRel.trust,
      timestamp,
    };
  }
  
  // Check familiarity milestones
  const familiarityMilestones = [
    RELATIONSHIP_MILESTONES.acquaintance,
    RELATIONSHIP_MILESTONES.familiar,
    RELATIONSHIP_MILESTONES.friend,
    RELATIONSHIP_MILESTONES.close_friend,
    RELATIONSHIP_MILESTONES.best_friend,
  ];
  
  for (const threshold of familiarityMilestones) {
    if (oldRel.familiarity < threshold && newRel.familiarity >= threshold) {
      return {
        type: 'milestone',
        npcId: newRel.npcId,
        metric: 'familiarity',
        oldValue: oldRel.familiarity,
        newValue: newRel.familiarity,
        timestamp,
      };
    }
  }
  
  // Check fear milestones
  const fearMilestones = [
    RELATIONSHIP_MILESTONES.feared,
    RELATIONSHIP_MILESTONES.terrified,
  ];
  
  for (const threshold of fearMilestones) {
    if (oldRel.fear < threshold && newRel.fear >= threshold) {
      return {
        type: 'milestone',
        npcId: newRel.npcId,
        metric: 'fear',
        oldValue: oldRel.fear,
        newValue: newRel.fear,
        timestamp,
      };
    }
  }
  
  return null;
}

// ============================================================================
// TITAN RELATIONSHIP MANAGER CLASS
// ============================================================================

/**
 * TitanRelationshipManager - Manages all of the Titan's relationships with NPCs.
 * 
 * Provides methods to:
 * - Get, update, and record interactions with NPCs
 * - Query relationships by various criteria (friendly, hostile, feared)
 * - Apply time-based decay to all relationships
 * - Serialize/deserialize for persistence
 * 
 * "Managing relationships is like managing a portfolio - diversification is key,
 * but you should probably keep track of who you've antagonized."
 */
export class TitanRelationshipManager {
  private relationships: Map<string, TitanRelationship>;
  
  /**
   * Create a new TitanRelationshipManager.
   * 
   * @param initialRelationships - Optional record of existing relationships
   */
  constructor(initialRelationships?: Record<string, TitanRelationship>) {
    this.relationships = new Map();
    
    if (initialRelationships) {
      for (const [npcId, rel] of Object.entries(initialRelationships)) {
        this.relationships.set(npcId, { ...rel });
      }
    }
  }
  
  // ============================================================================
  // CORE METHODS
  // ============================================================================
  
  /**
   * Get the relationship with a specific NPC.
   * 
   * @param npcId - The NPC's ID
   * @returns The relationship, or null if no relationship exists
   */
  getRelationship(npcId: string): TitanRelationship | null {
    return this.relationships.get(npcId) ?? null;
  }
  
  /**
   * Update a relationship with an NPC.
   * Creates a new relationship if one doesn't exist.
   * 
   * @param npcId - The NPC's ID
   * @param changes - Partial relationship changes to apply
   * @returns The updated relationship
   */
  updateRelationship(
    npcId: string,
    changes: Partial<Pick<TitanRelationship, 'trust' | 'respect' | 'familiarity' | 'fear'>>
  ): TitanRelationship {
    let rel = this.relationships.get(npcId);
    
    if (!rel) {
      rel = createDefaultTitanRelationship(npcId);
    }
    
    // Apply changes with clamping
    const updated: TitanRelationship = {
      ...rel,
      trust: clampRelationshipValue(
        changes.trust !== undefined ? changes.trust : rel.trust,
        'trust'
      ),
      respect: clampRelationshipValue(
        changes.respect !== undefined ? changes.respect : rel.respect,
        'respect'
      ),
      familiarity: clampRelationshipValue(
        changes.familiarity !== undefined ? changes.familiarity : rel.familiarity,
        'familiarity'
      ),
      fear: clampRelationshipValue(
        changes.fear !== undefined ? changes.fear : rel.fear,
        'fear'
      ),
      lastInteraction: Date.now(),
    };
    
    this.relationships.set(npcId, updated);
    return updated;
  }
  
  /**
   * Record an interaction with an NPC.
   * Creates a relationship if one doesn't exist, increments interaction count,
   * and updates the lastInteraction timestamp.
   * 
   * @param npcId - The NPC's ID
   */
  recordInteraction(npcId: string): void {
    let rel = this.relationships.get(npcId);
    
    if (!rel) {
      rel = createDefaultTitanRelationship(npcId);
    }
    
    const updated: TitanRelationship = {
      ...rel,
      interactionCount: rel.interactionCount + 1,
      lastInteraction: Date.now(),
    };
    
    this.relationships.set(npcId, updated);
  }
  
  /**
   * Apply time-based decay to all relationships.
   * 
   * @param daysPassed - Number of game days that have passed
   */
  decayRelationships(daysPassed: number): void {
    for (const [npcId, rel] of this.relationships.entries()) {
      const decayed = decayRelationship(rel, daysPassed);
      this.relationships.set(npcId, decayed);
    }
  }
  
  // ============================================================================
  // QUERY METHODS
  // ============================================================================
  
  /**
   * Get all relationships.
   * 
   * @returns Array of all relationships
   */
  getAllRelationships(): TitanRelationship[] {
    return Array.from(this.relationships.values());
  }
  
  /**
   * Get the top N relationships by familiarity.
   * 
   * @param count - Number of relationships to return
   * @returns Array of top relationships sorted by familiarity (descending)
   */
  getTopRelationships(count: number): TitanRelationship[] {
    return Array.from(this.relationships.values())
      .sort((a, b) => b.familiarity - a.familiarity)
      .slice(0, count);
  }
  
  /**
   * Get IDs of NPCs who are friendly to the Titan (high trust).
   * 
   * @param threshold - Minimum trust level (default: 50)
   * @returns Array of NPC IDs
   */
  getFriendlyNPCs(threshold: number = 50): string[] {
    return Array.from(this.relationships.entries())
      .filter(([, rel]) => rel.trust >= threshold)
      .map(([npcId]) => npcId);
  }
  
  /**
   * Get IDs of NPCs who are hostile to the Titan (low trust).
   * 
   * @param threshold - Maximum trust level (default: -50)
   * @returns Array of NPC IDs
   */
  getHostileNPCs(threshold: number = -50): string[] {
    return Array.from(this.relationships.entries())
      .filter(([, rel]) => rel.trust <= threshold)
      .map(([npcId]) => npcId);
  }
  
  /**
   * Get IDs of NPCs who fear the Titan.
   * 
   * @param threshold - Minimum fear level (default: 50)
   * @returns Array of NPC IDs
   */
  getFearedBy(threshold: number = 50): string[] {
    return Array.from(this.relationships.entries())
      .filter(([, rel]) => rel.fear >= threshold)
      .map(([npcId]) => npcId);
  }
  
  // ============================================================================
  // SERIALIZATION
  // ============================================================================
  
  /**
   * Export all relationships as a plain object for serialization.
   * 
   * @returns Record of relationships keyed by NPC ID
   */
  toRecord(): Record<string, TitanRelationship> {
    const record: Record<string, TitanRelationship> = {};
    for (const [npcId, rel] of this.relationships.entries()) {
      record[npcId] = { ...rel };
    }
    return record;
  }
  
  /**
   * Create a TitanRelationshipManager from a serialized record.
   * 
   * @param record - Record of relationships keyed by NPC ID
   * @returns A new TitanRelationshipManager
   */
  static fromRecord(record: Record<string, TitanRelationship>): TitanRelationshipManager {
    return new TitanRelationshipManager(record);
  }
}
