/**
 * DialogueManager - Central dialogue selection and cooldown management
 *
 * The DialogueManager is the brain behind NPC dialogue selection. It:
 * - Imports and manages all 8 archetype dialogue pools
 * - Tracks cooldowns per NPC to prevent repetitive dialogue
 * - Selects appropriate dialogue based on archetype, context, market condition, and relationship
 * - Uses weighted random selection for natural variety
 * - Provides metrics on dialogue variety (repetition rate)
 *
 * Think of it as a DJ that knows exactly what to play, when to play it,
 * and never plays the same track twice in a row (unless the crowd really wants it).
 *
 * @see DialoguePool from ./types.ts for pool structure
 * @see PersonalityArchetype from ../personality.ts for NPC archetypes
 */

import type { CryptoNPC } from "@/games/isocity/types/npc";
import type { PersonalityArchetype } from "@/lib/npc/personality";
import type {
  DialogueContext,
  DialoguePool,
  DialogueSelection,
  MarketCondition,
  RelationshipLevel,
  WeightedDialogue,
} from "./types";
import {
  meetsRelationshipRequirement,
  RELATIONSHIP_LEVEL_VALUES,
} from "./types";

// Import all 8 archetype pools
import { BITCOIN_MAXI_POOLS } from "./pools/bitcoinMaxi";
import { ETH_BUILDER_POOLS } from "./pools/ethBuilder";
import { DEGEN_TRADER_POOLS } from "./pools/degenTrader";
import { PRIVACY_MAXI_POOLS } from "./pools/privacyMaxi";
import { NORMIE_INVESTOR_POOLS } from "./pools/normieInvestor";
import { NFT_FLIPPER_POOLS } from "./pools/nftFlipper";
import { STAKING_GRANDMA_POOLS } from "./pools/stakingGrandma";
import { PROTOCOL_POLITICIAN_POOLS } from "./pools/protocolPolitician";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for dialogue selection
 */
export interface DialogueOptions {
  /** Current market condition to filter by */
  marketCondition?: MarketCondition;
  /** Relationship level with target to filter by */
  relationshipLevel?: RelationshipLevel;
  /** Target NPC ID for social context (optional) */
  targetNpcId?: string;
}

/**
 * Internal tracking for dialogue cooldowns per NPC
 */
interface CooldownEntry {
  /** The dialogue text that was used */
  text: string;
  /** Unix timestamp when the cooldown expires */
  expiresAt: number;
}

/**
 * Internal tracking for dialogue usage history per NPC
 */
interface UsageHistory {
  /** All dialogue texts used by this NPC (for repetition tracking) */
  history: string[];
  /** Currently active cooldowns for this NPC */
  cooldowns: CooldownEntry[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Map of all archetype pools for quick lookup
 */
const ALL_POOLS: Record<PersonalityArchetype, DialoguePool[]> = {
  bitcoin_maxi: BITCOIN_MAXI_POOLS,
  eth_builder: ETH_BUILDER_POOLS,
  degen_trader: DEGEN_TRADER_POOLS,
  privacy_maxi: PRIVACY_MAXI_POOLS,
  normie_investor: NORMIE_INVESTOR_POOLS,
  nft_flipper: NFT_FLIPPER_POOLS,
  staking_grandma: STAKING_GRANDMA_POOLS,
  protocol_politician: PROTOCOL_POLITICIAN_POOLS,
};

/** Maximum history size to track per NPC for repetition calculation */
const MAX_HISTORY_SIZE = 200;

// ============================================================================
// DIALOGUE MANAGER CLASS
// ============================================================================

/**
 * Central manager for NPC dialogue selection and cooldown tracking.
 *
 * Uses weighted random selection with cooldowns to ensure NPCs have
 * varied, contextually appropriate dialogue without repetition.
 *
 * @example
 * ```ts
 * const manager = new DialogueManager();
 * const dialogue = manager.getDialogue(npc, 'greeting', {
 *   marketCondition: 'bull',
 *   relationshipLevel: 'friend'
 * });
 * if (dialogue) {
 *   manager.recordDialogueUsed(npc.id, dialogue.text);
 *   displayDialogue(dialogue.text);
 * }
 * ```
 */
export class DialogueManager {
  /** Per-NPC dialogue usage and cooldown tracking */
  private npcUsage: Map<string, UsageHistory>;

  constructor() {
    this.npcUsage = new Map();
  }

  /**
   * Get appropriate dialogue for an NPC based on context and options.
   *
   * Selects from the NPC's archetype pool, filtering by:
   * - Context (greeting, market_commentary, etc.)
   * - Market condition (if provided)
   * - Relationship level (if provided)
   * - Cooldowns (excludes recently used lines)
   *
   * Uses weighted random selection for natural variety.
   *
   * @param npc - The NPC requesting dialogue
   * @param context - The dialogue context
   * @param options - Optional filtering options
   * @returns DialogueSelection or null if no suitable dialogue found
   */
  getDialogue(
    npc: CryptoNPC,
    context: DialogueContext,
    options?: DialogueOptions
  ): DialogueSelection {
    const archetype = this.getArchetype(npc);
    const pools = ALL_POOLS[archetype] || [];

    // Get candidate pools matching context
    const matchingPools = this.filterPools(pools, context, options);

    // Get all candidate lines from matching pools
    const candidates = this.getCandidateLines(
      npc.id,
      matchingPools,
      options
    );

    // Select a line using weighted random selection
    const selected = this.weightedRandomSelect(candidates);

    if (!selected) {
      // Fallback: try to get any line from the archetype's pools
      const fallbackCandidates = this.getFallbackCandidates(
        npc.id,
        pools,
        context
      );
      const fallbackSelected = this.weightedRandomSelect(fallbackCandidates);

      if (!fallbackSelected) {
        // Ultimate fallback: return a generic line
        return this.createFallbackSelection(archetype, context);
      }

      // Auto-add cooldown for the selected line to prevent immediate re-selection
      this.addInternalCooldown(npc.id, fallbackSelected);
      return this.createSelection(archetype, context, fallbackSelected);
    }

    // Auto-add cooldown for the selected line to prevent immediate re-selection
    this.addInternalCooldown(npc.id, selected);
    return this.createSelection(archetype, context, selected);
  }

  /**
   * Record that a dialogue was used by an NPC.
   *
   * This updates the cooldown tracking and usage history for
   * repetition rate calculation.
   *
   * @param npcId - The NPC's unique ID
   * @param text - The dialogue text that was used
   */
  recordDialogueUsed(npcId: string, text: string): void {
    const usage = this.getOrCreateUsage(npcId);

    // Add to history (for repetition tracking)
    usage.history.push(text);
    if (usage.history.length > MAX_HISTORY_SIZE) {
      usage.history.shift(); // Remove oldest entry
    }

    // Add cooldown (5 minute default)
    const cooldownDuration = 300000; // 5 minutes
    usage.cooldowns.push({
      text,
      expiresAt: Date.now() + cooldownDuration,
    });

    // Clean up expired cooldowns
    this.cleanupExpiredCooldowns(npcId);
  }

  /**
   * Calculate the repetition rate for an NPC's dialogue history.
   *
   * Repetition rate = (number of repeated lines) / (total lines - 1)
   * A rate of 0 means no repetition, 1 means every line was a repeat.
   *
   * @param npcId - The NPC's unique ID
   * @returns Repetition rate between 0 and 1
   */
  getRepetitionRate(npcId: string): number {
    const usage = this.npcUsage.get(npcId);
    if (!usage || usage.history.length < 2) {
      return 0;
    }

    // Count how many times a line appears more than once
    const seen = new Set<string>();
    let repetitions = 0;

    for (const text of usage.history) {
      if (seen.has(text)) {
        repetitions++;
      }
      seen.add(text);
    }

    // Rate is repetitions / (total - 1) since first occurrence isn't a repeat
    return repetitions / (usage.history.length - 1);
  }

  /**
   * Clear cooldowns and optionally history for NPCs.
   *
   * @param npcId - Optional NPC ID to clear. If not provided, clears all.
   */
  clearCooldowns(npcId?: string): void {
    if (npcId) {
      this.npcUsage.delete(npcId);
    } else {
      this.npcUsage.clear();
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get the NPC's archetype, with fallbacks
   */
  private getArchetype(npc: CryptoNPC): PersonalityArchetype {
    // Try personalityArchetype first (stored directly on NPC)
    if (npc.personalityArchetype) {
      return npc.personalityArchetype;
    }
    // Default fallback - personality system doesn't store archetype directly
    // If no archetype is set, default to bitcoin_maxi
    return "bitcoin_maxi";
  }

  /**
   * Filter pools by context and options
   */
  private filterPools(
    pools: DialoguePool[],
    context: DialogueContext,
    options?: DialogueOptions
  ): DialoguePool[] {
    return pools.filter((pool) => {
      // Must match context
      if (pool.context !== context) {
        return false;
      }

      // If options specify market condition, prefer matching pools
      // but don't exclude neutral pools (no marketCondition set)
      if (options?.marketCondition && pool.marketCondition) {
        if (pool.marketCondition !== options.marketCondition) {
          return false;
        }
      }

      // If options specify relationship level, filter appropriately
      if (options?.relationshipLevel && pool.relationshipLevel) {
        if (pool.relationshipLevel !== options.relationshipLevel) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get candidate lines from pools, filtering by cooldowns and requirements
   */
  private getCandidateLines(
    npcId: string,
    pools: DialoguePool[],
    options?: DialogueOptions
  ): WeightedDialogue[] {
    const candidates: WeightedDialogue[] = [];
    const activeCooldowns = this.getActiveCooldowns(npcId);

    for (const pool of pools) {
      for (const line of pool.lines) {
        // Skip if on cooldown
        if (activeCooldowns.has(line.text)) {
          continue;
        }

        // Check requirements if any
        if (line.requirements && !this.meetsRequirements(line, options)) {
          continue;
        }

        candidates.push(line);
      }
    }

    return candidates;
  }

  /**
   * Get fallback candidates when primary selection fails
   */
  private getFallbackCandidates(
    npcId: string,
    pools: DialoguePool[],
    context: DialogueContext
  ): WeightedDialogue[] {
    const candidates: WeightedDialogue[] = [];
    const activeCooldowns = this.getActiveCooldowns(npcId);

    // Try context-matching pools first, ignoring other filters
    const contextPools = pools.filter((p) => p.context === context);

    for (const pool of contextPools) {
      for (const line of pool.lines) {
        if (!activeCooldowns.has(line.text)) {
          candidates.push(line);
        }
      }
    }

    // If still nothing, try any pool
    if (candidates.length === 0) {
      for (const pool of pools) {
        for (const line of pool.lines) {
          if (!activeCooldowns.has(line.text)) {
            candidates.push(line);
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Get active cooldowns as a Set for fast lookup
   */
  private getActiveCooldowns(npcId: string): Set<string> {
    this.cleanupExpiredCooldowns(npcId);
    const usage = this.npcUsage.get(npcId);
    if (!usage) {
      return new Set();
    }
    return new Set(usage.cooldowns.map((c) => c.text));
  }

  /**
   * Clean up expired cooldowns for an NPC
   */
  private cleanupExpiredCooldowns(npcId: string): void {
    const usage = this.npcUsage.get(npcId);
    if (!usage) {
      return;
    }
    const now = Date.now();
    usage.cooldowns = usage.cooldowns.filter((c) => c.expiresAt > now);
  }

  /**
   * Check if a line meets its requirements based on options
   */
  private meetsRequirements(
    line: WeightedDialogue,
    options?: DialogueOptions
  ): boolean {
    if (!line.requirements) {
      return true;
    }

    for (const req of line.requirements) {
      switch (req.type) {
        case "market_condition":
          if (options?.marketCondition && req.value !== options.marketCondition) {
            return false;
          }
          break;
        case "relationship_level":
          if (options?.relationshipLevel && req.value !== options.relationshipLevel) {
            return false;
          }
          break;
        case "min_relationship":
          if (options?.relationshipLevel) {
            const minLevel = req.value as RelationshipLevel;
            if (!meetsRelationshipRequirement(options.relationshipLevel, minLevel)) {
              return false;
            }
          }
          break;
        // player_trait, time_of_day, has_memory not checked here
        // they would need additional context passed in
      }
    }

    return true;
  }

  /**
   * Weighted random selection from candidates
   */
  private weightedRandomSelect(
    candidates: WeightedDialogue[]
  ): WeightedDialogue | null {
    if (candidates.length === 0) {
      return null;
    }

    // Calculate total weight
    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);

    if (totalWeight === 0) {
      // All weights are 0, just pick randomly
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Select based on weight
    let random = Math.random() * totalWeight;
    for (const candidate of candidates) {
      random -= candidate.weight;
      if (random <= 0) {
        return candidate;
      }
    }

    // Fallback to last candidate
    return candidates[candidates.length - 1];
  }

  /**
   * Create a DialogueSelection from a selected line
   */
  private createSelection(
    archetype: PersonalityArchetype,
    context: DialogueContext,
    line: WeightedDialogue
  ): DialogueSelection {
    return {
      text: line.text,
      sourcePool: archetype,
      context,
      cooldownUntil: Date.now() + line.cooldown,
      originalWeight: line.weight,
      requirements: line.requirements,
    };
  }

  /**
   * Create a fallback selection when no suitable dialogue found
   */
  private createFallbackSelection(
    archetype: PersonalityArchetype,
    context: DialogueContext
  ): DialogueSelection {
    const fallbackText = this.getFallbackText(context);
    return {
      text: fallbackText,
      sourcePool: archetype,
      context,
      cooldownUntil: Date.now() + 60000, // 1 minute cooldown
    };
  }

  /**
   * Get generic fallback text for a context
   */
  private getFallbackText(context: DialogueContext): string {
    switch (context) {
      case "greeting":
        return "Hey there.";
      case "market_commentary":
        return "Interesting times we live in.";
      case "player_reaction":
        return "Hmm, interesting.";
      case "idle_chatter":
        return "So... how about those markets?";
      case "relationship_level":
        return "Good to see you.";
      default:
        return "...";
    }
  }

  /**
   * Get or create usage tracking for an NPC
   */
  private getOrCreateUsage(npcId: string): UsageHistory {
    let usage = this.npcUsage.get(npcId);
    if (!usage) {
      usage = {
        history: [],
        cooldowns: [],
      };
      this.npcUsage.set(npcId, usage);
    }
    return usage;
  }

  /**
   * Add an internal cooldown when a line is selected (before recordDialogueUsed is called)
   * This prevents immediate re-selection of the same line within a single session
   */
  private addInternalCooldown(npcId: string, line: WeightedDialogue): void {
    const usage = this.getOrCreateUsage(npcId);

    // Check if already on cooldown to avoid duplicates
    const alreadyOnCooldown = usage.cooldowns.some((c) => c.text === line.text);
    if (alreadyOnCooldown) {
      return;
    }

    // Add cooldown using the line's configured cooldown duration
    usage.cooldowns.push({
      text: line.text,
      expiresAt: Date.now() + line.cooldown,
    });
  }
}

/**
 * Singleton instance for convenience
 */
export const dialogueManager = new DialogueManager();
