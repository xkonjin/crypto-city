/**
 * MemoryManager - Manages NPC memory operations
 * 
 * This manager handles:
 * - Adding memories (episodic, semantic, procedural)
 * - Memory decay over time
 * - Memory retrieval with relevance scoring
 * - Memory consolidation (strengthening important memories)
 * - Working memory management
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import {
  EpisodicMemory,
  SemanticMemory,
  EpisodicMemoryInput,
  SemanticMemoryInput,
  MEMORY_DECAY_CONFIG,
  createEpisodicMemory,
  createSemanticMemory,
} from './memory';

/**
 * MemoryManager handles all operations related to NPC memory.
 */
export class MemoryManager {
  /**
   * Add an episodic memory to an NPC.
   * 
   * @param npc - The NPC to add the memory to
   * @param memory - The memory data (without auto-generated fields)
   */
  addEpisodicMemory(
    npc: CryptoNPC,
    memory: EpisodicMemoryInput
  ): void {
    const episodicMemory = createEpisodicMemory(memory);
    npc.memory.episodic.push(episodicMemory);
  }

  /**
   * Add a semantic memory (fact) to an NPC.
   * If a fact with the same subject+predicate exists, it updates instead of adding.
   * 
   * @param npc - The NPC to add the memory to
   * @param memory - The memory data (without auto-generated fields)
   */
  addSemanticMemory(
    npc: CryptoNPC,
    memory: SemanticMemoryInput
  ): void {
    // Check if a fact with same subject+predicate already exists
    const existingIndex = npc.memory.semantic.findIndex(
      (m) => m.subject === memory.subject && m.predicate === memory.predicate
    );

    if (existingIndex !== -1) {
      // Update existing fact
      const existing = npc.memory.semantic[existingIndex];
      npc.memory.semantic[existingIndex] = {
        ...existing,
        object: memory.object,
        confidence: memory.confidence,
        source: memory.source,
        timestamp: Date.now(),
      };
    } else {
      // Add new fact
      const semanticMemory = createSemanticMemory(memory);
      npc.memory.semantic.push(semanticMemory);
    }
  }

  /**
   * Decay all episodic memories over time.
   * More important and emotional memories decay slower.
   * 
   * @param npc - The NPC whose memories to decay
   * @param gameDaysPassed - Number of game days that have passed
   */
  decayMemories(npc: CryptoNPC, gameDaysPassed: number): void {
    const { 
      baseDecayRate, 
      importanceDecayResistance, 
      emotionalDecayResistance,
      accessCountBonus
    } = MEMORY_DECAY_CONFIG;

    for (const memory of npc.memory.episodic) {
      // Calculate decay resistance based on memory properties
      const importanceResistance = memory.importance * importanceDecayResistance;
      const emotionalResistance = Math.abs(memory.emotionalValence) * emotionalDecayResistance;
      const accessResistance = Math.min(memory.accessCount * accessCountBonus, 0.2);
      
      // Total resistance (max 0.9 to ensure some decay always happens)
      const totalResistance = Math.min(
        importanceResistance + emotionalResistance + accessResistance,
        0.9
      );
      
      // Calculate effective decay
      const effectiveDecay = baseDecayRate * (1 - totalResistance) * gameDaysPassed;
      
      // Apply decay
      memory.strength = Math.max(0, memory.strength - effectiveDecay);
    }
  }

  /**
   * Retrieve memories matching a query, sorted by relevance.
   * Updates access count and last accessed time for retrieved memories.
   * 
   * @param npc - The NPC to retrieve memories from
   * @param query - Search query string
   * @param limit - Maximum number of memories to return (default: 10)
   * @returns Array of matching episodic memories
   */
  retrieveMemories(
    npc: CryptoNPC,
    query: string,
    limit: number = 10
  ): EpisodicMemory[] {
    const queryLower = query.toLowerCase();
    
    // Filter memories that match the query
    const matchingMemories = npc.memory.episodic.filter((memory) => {
      const eventLower = memory.event.toLowerCase();
      const participantsStr = memory.participants.join(' ').toLowerCase();
      return eventLower.includes(queryLower) || participantsStr.includes(queryLower);
    });

    // Sort by relevance (importance * strength * (1 + emotionalValence))
    matchingMemories.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a);
      const scoreB = this.calculateRelevanceScore(b);
      return scoreB - scoreA;
    });

    // Take top results and update access tracking
    const results = matchingMemories.slice(0, limit);
    const now = Date.now();
    
    for (const memory of results) {
      memory.accessCount += 1;
      memory.lastAccessed = now;
    }

    return results;
  }

  /**
   * Calculate relevance score for a memory.
   * Higher scores indicate more relevant/important memories.
   */
  private calculateRelevanceScore(memory: EpisodicMemory): number {
    const importanceScore = memory.importance / 10;
    const strengthScore = memory.strength;
    const emotionalScore = 1 + Math.abs(memory.emotionalValence) * 0.5;
    const recencyBonus = memory.accessCount > 0 ? 0.1 : 0;
    
    return importanceScore * strengthScore * emotionalScore + recencyBonus;
  }

  /**
   * Get all facts (semantic memories) about a subject.
   * Sorted by confidence level.
   * 
   * @param npc - The NPC to query
   * @param subject - The subject to get facts about
   * @returns Array of semantic memories about the subject
   */
  getFactsAbout(npc: CryptoNPC, subject: string): SemanticMemory[] {
    const facts = npc.memory.semantic.filter(
      (memory) => memory.subject === subject
    );

    // Sort by confidence (highest first)
    facts.sort((a, b) => b.confidence - a.confidence);

    return facts;
  }

  /**
   * Consolidate memories - strengthen frequently accessed memories,
   * remove weak unimportant memories.
   * 
   * @param npc - The NPC whose memories to consolidate
   */
  consolidateMemories(npc: CryptoNPC): void {
    const { forgetThreshold } = MEMORY_DECAY_CONFIG;

    // Strengthen frequently accessed memories
    for (const memory of npc.memory.episodic) {
      if (memory.accessCount > 0) {
        const accessBonus = Math.min(memory.accessCount * 0.05, 0.3);
        memory.strength = Math.min(1.0, memory.strength + accessBonus);
      }
    }

    // Remove weak, unimportant memories
    npc.memory.episodic = npc.memory.episodic.filter((memory) => {
      // Keep if strength is above threshold
      if (memory.strength >= forgetThreshold) {
        return true;
      }
      
      // Keep important memories even with low strength
      if (memory.importance >= 8) {
        return true;
      }
      
      // Keep highly emotional memories even with low strength
      if (Math.abs(memory.emotionalValence) >= 0.8) {
        return true;
      }
      
      // Forget this memory
      return false;
    });
  }

  /**
   * Calculate importance score for a memory event.
   * Factors in NPC involvement, emotional content, and base importance.
   * 
   * @param memory - The memory input to score
   * @param npcId - The NPC's ID (for self-involvement scoring)
   * @returns Adjusted importance score (1-10)
   */
  calculateImportance(
    memory: EpisodicMemoryInput,
    npcId: string
  ): number {
    let importance = memory.importance;

    // Boost for NPC being directly involved
    if (memory.participants.includes(npcId)) {
      importance += 2;
    }

    // Boost for emotional content
    const emotionalBoost = Math.abs(memory.emotionalValence) * 2;
    importance += emotionalBoost;

    // Cap at 10
    return Math.min(10, Math.max(1, importance));
  }

  /**
   * Add an event to working memory.
   * Maintains a rolling buffer of recent events (max 10).
   * 
   * @param npc - The NPC to update
   * @param event - The event description to add
   */
  addToWorkingMemory(npc: CryptoNPC, event: string): void {
    npc.memory.working.recentEvents.push(event);
    
    // Keep only the last 10 events
    if (npc.memory.working.recentEvents.length > 10) {
      npc.memory.working.recentEvents = npc.memory.working.recentEvents.slice(-10);
    }
  }

  /**
   * Set the NPC's current goal.
   * 
   * @param npc - The NPC to update
   * @param goal - The goal to set (or null to clear)
   */
  setCurrentGoal(npc: CryptoNPC, goal: string | null): void {
    npc.memory.working.currentGoal = goal;
  }

  /**
   * Set the NPC's current context.
   * 
   * @param npc - The NPC to update
   * @param context - The context description
   */
  setCurrentContext(npc: CryptoNPC, context: string): void {
    npc.memory.working.currentContext = context;
  }

  /**
   * Get a summary of what the NPC knows.
   * Useful for AI prompting and decision making.
   * 
   * @param npc - The NPC to summarize
   * @returns Summary object with key memory information
   */
  getMemorySummary(npc: CryptoNPC): {
    recentEvents: string[];
    currentGoal: string | null;
    context: string;
    strongMemoriesCount: number;
    knownFactsCount: number;
    skillsCount: number;
  } {
    const strongMemories = npc.memory.episodic.filter(
      (m) => m.strength >= 0.5
    );

    return {
      recentEvents: npc.memory.working.recentEvents,
      currentGoal: npc.memory.working.currentGoal,
      context: npc.memory.working.currentContext,
      strongMemoriesCount: strongMemories.length,
      knownFactsCount: npc.memory.semantic.length,
      skillsCount: npc.memory.procedural.length,
    };
  }
}
