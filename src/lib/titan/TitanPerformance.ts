/**
 * Titan Performance Utilities
 * 
 * Provides performance monitoring and memory management utilities for the Titan system.
 * Includes memory limits, usage tracking, and optimization functions.
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 11.3 on Performance
 */

import type { TitanPet } from '@/games/isocity/types/titan';

// ============================================================================
// MEMORY LIMIT CONSTANTS
// ============================================================================

/**
 * Memory limits for Titan collections to prevent unbounded growth.
 * These values are chosen to balance performance with memory usage.
 */
export const TITAN_MEMORY_LIMITS = {
  /** Maximum number of action beliefs (LRU eviction) */
  maxBeliefs: 100,
  /** Maximum number of action history entries */
  maxHistory: 500,
  /** Maximum number of world knowledge entries */
  maxWorldKnowledge: 200,
  /** Maximum number of NPC opinions tracked */
  maxNPCOpinions: 100,
  /** Maximum number of observations tracked */
  maxObservations: 50,
  /** Maximum number of NPC relationships */
  maxRelationships: 100,
} as const;

// ============================================================================
// MEMORY ESTIMATION
// ============================================================================

/**
 * Estimated bytes per entry for different collection types.
 * These are rough estimates for memory budgeting purposes.
 */
const BYTES_PER_BELIEF = 150;  // action, goodness, confidence, timestamps
const BYTES_PER_HISTORY = 80;  // action, timestamp, impact
const BYTES_PER_KNOWLEDGE = 200; // key + serialized value
const BYTES_PER_OPINION = 50;  // npcId + opinion value
const BYTES_PER_OBSERVATION = 100; // observation record
const BYTES_PER_RELATIONSHIP = 150; // relationship data

/**
 * Memory usage statistics for a Titan.
 */
export interface TitanMemoryUsage {
  /** Number of beliefs tracked */
  beliefs: number;
  /** Number of history entries */
  history: number;
  /** Number of world knowledge entries */
  worldKnowledge: number;
  /** Number of NPC opinions */
  npcOpinions: number;
  /** Number of observations */
  observations: number;
  /** Number of relationships */
  relationships: number;
  /** Estimated total memory usage in bytes */
  totalEstimated: number;
}

/**
 * Calculate estimated memory usage for a Titan.
 * 
 * @param titan - The Titan pet to analyze
 * @returns Memory usage statistics
 */
export function getTitanMemoryUsage(titan: TitanPet): TitanMemoryUsage {
  const beliefs = titan.bdi.beliefs.actionBeliefs.size;
  const history = titan.actionHistory?.length ?? 0;
  const worldKnowledge = titan.bdi.beliefs.worldKnowledge.size;
  const npcOpinions = titan.bdi.beliefs.npcOpinions.size;
  // Note: observations are tracked separately in ObservationTracker, not in TitanPet
  const observations = 0;
  const relationships = Object.keys(titan.relationships || {}).length;

  const totalEstimated = 
    beliefs * BYTES_PER_BELIEF +
    history * BYTES_PER_HISTORY +
    worldKnowledge * BYTES_PER_KNOWLEDGE +
    npcOpinions * BYTES_PER_OPINION +
    observations * BYTES_PER_OBSERVATION +
    relationships * BYTES_PER_RELATIONSHIP;

  return {
    beliefs,
    history,
    worldKnowledge,
    npcOpinions,
    observations,
    relationships,
    totalEstimated,
  };
}

// ============================================================================
// MEMORY OPTIMIZATION
// ============================================================================

/**
 * Force cleanup of all capped collections on a Titan.
 * This ensures all collections are within their limits.
 * 
 * @param titan - The Titan pet to optimize
 */
export function optimizeTitanMemory(titan: TitanPet): void {
  // Optimize action beliefs (LRU eviction)
  if (titan.bdi.beliefs.actionBeliefs.size > TITAN_MEMORY_LIMITS.maxBeliefs) {
    evictOldestBeliefs(titan, TITAN_MEMORY_LIMITS.maxBeliefs);
  }

  // Optimize world knowledge
  if (titan.bdi.beliefs.worldKnowledge.size > TITAN_MEMORY_LIMITS.maxWorldKnowledge) {
    evictOldestWorldKnowledge(titan, TITAN_MEMORY_LIMITS.maxWorldKnowledge);
  }

  // Optimize NPC opinions
  if (titan.bdi.beliefs.npcOpinions.size > TITAN_MEMORY_LIMITS.maxNPCOpinions) {
    evictOldestNPCOpinions(titan, TITAN_MEMORY_LIMITS.maxNPCOpinions);
  }

  // Optimize action history
  if (titan.actionHistory && titan.actionHistory.length > TITAN_MEMORY_LIMITS.maxHistory) {
    titan.actionHistory = titan.actionHistory.slice(-TITAN_MEMORY_LIMITS.maxHistory);
  }

  // Note: Observations are tracked in separate ObservationTracker
  // and have their own limit enforcement in that class
}

/**
 * Evict oldest beliefs to fit within limit.
 * Uses LRU eviction based on lastReinforced timestamp.
 */
function evictOldestBeliefs(titan: TitanPet, limit: number): void {
  const beliefs = titan.bdi.beliefs.actionBeliefs;
  
  while (beliefs.size > limit) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, belief] of beliefs.entries()) {
      if (belief.lastReinforced < oldestTime) {
        oldestTime = belief.lastReinforced;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      beliefs.delete(oldestKey);
    } else {
      break; // Safety: no more beliefs to evict
    }
  }
}

/**
 * Evict oldest world knowledge entries (FIFO based on Map insertion order).
 */
function evictOldestWorldKnowledge(titan: TitanPet, limit: number): void {
  const knowledge = titan.bdi.beliefs.worldKnowledge;
  
  while (knowledge.size > limit) {
    const firstKey = knowledge.keys().next().value;
    if (firstKey !== undefined) {
      knowledge.delete(firstKey);
    } else {
      break;
    }
  }
}

/**
 * Evict oldest NPC opinions (FIFO based on Map insertion order).
 */
function evictOldestNPCOpinions(titan: TitanPet, limit: number): void {
  const opinions = titan.bdi.beliefs.npcOpinions;
  
  while (opinions.size > limit) {
    const firstKey = opinions.keys().next().value;
    if (firstKey !== undefined) {
      opinions.delete(firstKey);
    } else {
      break;
    }
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Check if a Titan is approaching memory limits.
 * 
 * @param titan - The Titan to check
 * @param threshold - Percentage threshold (0-1) to trigger warning
 * @returns Object indicating which collections are near limits
 */
export function checkMemoryWarnings(
  titan: TitanPet,
  threshold: number = 0.8
): Record<string, boolean> {
  const usage = getTitanMemoryUsage(titan);
  const limits = TITAN_MEMORY_LIMITS;

  return {
    beliefs: usage.beliefs >= limits.maxBeliefs * threshold,
    history: usage.history >= limits.maxHistory * threshold,
    worldKnowledge: usage.worldKnowledge >= limits.maxWorldKnowledge * threshold,
    npcOpinions: usage.npcOpinions >= limits.maxNPCOpinions * threshold,
    observations: usage.observations >= limits.maxObservations * threshold,
    relationships: usage.relationships >= limits.maxRelationships * threshold,
  };
}
