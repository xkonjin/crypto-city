/**
 * NPC Types for Crypto City
 * 
 * Core type definitions for the AI NPC Living City system.
 * NPCs are autonomous citizens with crypto-themed identities that live and work in the city.
 * 
 * The needs system (Sims-style motives) is defined in src/lib/npc/needs.ts
 * and integrated here via the NPCNeeds interface.
 * 
 * The memory system (Stanford Generative Agents-style) is defined in src/lib/npc/memory.ts
 * and provides episodic, semantic, procedural, and working memory.
 * 
 * The movement system is defined in src/lib/npc/movement.ts and provides
 * A* pathfinding and state machine for walking between buildings.
 */

import type { NPCNeeds } from '@/lib/npc/needs';
import type { NPCMemory } from '@/lib/npc/memory';
import type { NPCMovement } from '@/lib/npc/movement';
import type { NPCPersonality, PersonalityArchetype } from '@/lib/npc/personality';
import type { Relationship } from '@/lib/npc/relationships';
import type { InternalWorld } from '@/lib/npc/mood';
import type { NPCWallet, NPCFinances } from '@/lib/npc/economy';
import type { NPCLearning } from '@/lib/npc/learning';

/**
 * Occupation types for NPCs - each with their own crypto-flavored sardonic descriptions
 */
export type Occupation = 
  | 'trader'      // Stares at charts until they stare back. Hasn't touched grass since 2017.
  | 'miner'       // Believes heat is just 'recycled hashrate'. Their basement sounds like a jet engine.
  | 'developer'   // Writes code that's 'decentralized' but still pushes to a single GitHub repo.
  | 'shop_owner'  // Accepts 47 different cryptocurrencies but still can't make change for a $20.
  | 'bartender'   // Pours drinks while explaining why their favorite altcoin will moon 'any day now'.
  | 'artist'      // Creates NFTs of things that were already free on the internet.
  | 'security'    // Protects digital assets but still uses 'password123' for their email.
  | 'unemployed'; // 'Between opportunities' aka waiting for their bags to pump.

/**
 * Occupation descriptions in Hitchhiker's Guide style
 */
export const OCCUPATION_DESCRIPTIONS: Record<Occupation, string> = {
  trader: "Stares at charts until they stare back. Hasn't touched grass since 2017.",
  miner: "Believes heat is just 'recycled hashrate'. Their basement sounds like a jet engine.",
  developer: "Writes code that's 'decentralized' but still pushes to a single GitHub repo.",
  shop_owner: "Accepts 47 different cryptocurrencies but still can't make change for a $20.",
  bartender: "Pours drinks while explaining why their favorite altcoin will moon 'any day now'.",
  artist: "Creates NFTs of things that were already free on the internet.",
  security: "Protects digital assets but still uses 'password123' for their email.",
  unemployed: "'Between opportunities' aka waiting for their bags to pump.",
};

/**
 * Activity states for NPCs
 */
export type NPCActivity = 
  | 'idle'        // Standing around, probably checking their portfolio
  | 'walking'     // Moving from A to B, phone in hand
  | 'working'     // Pretending to be productive while refreshing CoinGecko
  | 'eating'      // Consuming sustenance, funded by paper gains
  | 'sleeping'    // The only time they're not checking prices
  | 'socializing' // Discussing crypto with anyone who makes eye contact
  | 'shopping';   // Converting fiat to goods before it inflates further

/**
 * Cardinal directions for NPC facing/movement
 */
export type NPCDirection = 'north' | 'south' | 'east' | 'west';

/**
 * Available sprite types based on /public/Characters/
 */
export type NPCSpriteType = 'apple' | 'banana';

/**
 * Core NPC entity interface
 * 
 * Represents a single citizen in Crypto City with their crypto-themed identity,
 * position, and current state.
 */
export interface CryptoNPC {
  // === IDENTITY ===
  /** Unique identifier for this NPC */
  id: string;
  
  /** Crypto-themed display name (e.g., "Satoshi_Maxi_42", "HODL_Queen") */
  name: string;
  
  /** Simulated wallet address for this NPC */
  walletAddress: string;
  
  // === DEMOGRAPHICS ===
  /** Age of the NPC (18-80) */
  age: number;
  
  /** What they do for a living (or don't) */
  occupation: Occupation;
  
  /** Building ID of their home, null if homeless */
  residence: string | null;
  
  /** Building ID of their workplace, null if unemployed/WFH */
  workplace: string | null;
  
  // === VISUAL ===
  /** Which character sprite to use */
  spriteType: NPCSpriteType;
  
  /** Which way they're facing */
  direction: NPCDirection;
  
  // === POSITION ===
  /** Grid X coordinate */
  gridX: number;
  
  /** Grid Y coordinate */
  gridY: number;
  
  /** Whether the NPC is currently inside a building */
  isInsideBuilding: boolean;
  
  /** ID of the building they're in, null if outside */
  currentBuildingId: string | null;
  
  // === STATE ===
  /** What they're currently doing */
  currentActivity: NPCActivity | null;
  
  // === NEEDS SYSTEM ===
  /** 
   * Sims-style needs that decay over time and drive NPC behavior.
   * Includes: hunger, energy, social, fun, wealth, purpose
   * @see src/lib/npc/needs.ts for the needs system implementation
   */
  needs: NPCNeeds;
  
  // === MEMORY SYSTEM ===
  /**
   * Stanford Generative Agents-style memory system.
   * Includes: episodic (events), semantic (facts), procedural (skills), working (context)
   * @see src/lib/npc/memory.ts for the memory system implementation
   */
  memory: NPCMemory;
  
  // === MOVEMENT SYSTEM ===
  /**
   * A* pathfinding and state machine for NPC movement.
   * Handles walking between tiles, entering/exiting buildings, and smooth transitions.
   * @see src/lib/npc/movement.ts for the movement system implementation
   */
  movement: NPCMovement;
  
  // === PERSONALITY SYSTEM ===
  /**
   * Big Five (OCEAN) + crypto-specific personality traits.
   * Affects behavior, dialogue tone, risk tolerance, and social preferences.
   * @see src/lib/npc/personality.ts for the personality system implementation
   */
  personality: NPCPersonality;
  
  /** 
   * The archetype this NPC's personality is based on.
   * Used for quick categorization and description lookup.
   */
  personalityArchetype?: PersonalityArchetype;
  
  // === RELATIONSHIP SYSTEM ===
  /**
   * Inworld-style relationship tracking with other NPCs.
   * Includes trust, respect, familiarity, and attraction metrics.
   * @see src/lib/npc/relationships.ts for the relationship system implementation
   */
  relationships: Record<string, Relationship>;
  
  // === INTERNAL WORLD (MOOD SYSTEM) ===
  /**
   * The NPC's internal world including mood, thoughts, beliefs, and desires.
   * Drives behavior and dialogue based on emotional state.
   * @see src/lib/npc/mood.ts for the mood system implementation
   */
  internalWorld?: InternalWorld;
  
  // === ECONOMY SYSTEM ===
  /**
   * The NPC's wallet containing cash, token holdings, and staked positions.
   * Manages all financial assets and investments.
   * @see src/lib/npc/economy.ts for the economy system implementation
   */
  wallet?: NPCWallet;
  
  /**
   * The NPC's finances including income (salary, trading, staking) and expenses.
   * Tracks daily cash flow and net worth.
   * @see src/lib/npc/economy.ts for the economy system implementation
   */
  finances?: NPCFinances;
  
  // === FACTION SYSTEM ===
  /**
   * ID of the faction this NPC belongs to, null if unaffiliated.
   * Faction membership affects interactions, trust, and access to faction resources.
   * @see src/lib/npc/factions.ts for the faction system implementation
   */
  factionId?: string | null;
  
  // === LEARNING SYSTEM ===
  /**
   * Skill learning, progression, and social learning from other NPCs.
   * NPCs develop skills through practice and learn from observing others.
   * @see src/lib/npc/learning.ts for the learning system implementation
   */
  learning?: NPCLearning;
}

/**
 * Options for spawning a new NPC
 */
export interface NPCSpawnOptions {
  /** Grid X position to spawn at */
  gridX: number;
  
  /** Grid Y position to spawn at */
  gridY: number;
  
  /** Optional: Force specific occupation */
  occupation?: Occupation;
  
  /** Optional: Force specific sprite type */
  spriteType?: NPCSpriteType;
  
  /** Optional: Starting direction */
  direction?: NPCDirection;
  
  /** Optional: Associated residence building ID */
  residenceId?: string;
  
  /** Optional: Associated workplace building ID */
  workplaceId?: string;
}

/**
 * Serialized NPC data for localStorage persistence
 */
export interface SerializedNPC {
  id: string;
  name: string;
  walletAddress: string;
  age: number;
  occupation: Occupation;
  residence: string | null;
  workplace: string | null;
  spriteType: NPCSpriteType;
  direction: NPCDirection;
  gridX: number;
  gridY: number;
  isInsideBuilding: boolean;
  currentBuildingId: string | null;
  currentActivity: NPCActivity | null;
  /** Serialized needs state */
  needs: NPCNeeds;
  /** Serialized memory state */
  memory: NPCMemory;
  /** Serialized movement state */
  movement: NPCMovement;
  /** Serialized personality state */
  personality: NPCPersonality;
  /** Personality archetype (if assigned) */
  personalityArchetype?: PersonalityArchetype;
  /** Serialized relationships state */
  relationships: Record<string, Relationship>;
  /** Serialized internal world (mood) state */
  internalWorld?: InternalWorld;
  /** Serialized wallet state */
  wallet?: NPCWallet;
  /** Serialized finances state */
  finances?: NPCFinances;
  /** Serialized faction membership */
  factionId?: string | null;
  /** Serialized learning state */
  learning?: NPCLearning;
}

/**
 * All valid occupations as an array for iteration/validation
 */
export const ALL_OCCUPATIONS: Occupation[] = [
  'trader', 'miner', 'developer', 'shop_owner',
  'bartender', 'artist', 'security', 'unemployed'
];

/**
 * All valid activities as an array for iteration/validation
 */
export const ALL_ACTIVITIES: NPCActivity[] = [
  'idle', 'walking', 'working', 'eating',
  'sleeping', 'socializing', 'shopping'
];

/**
 * All valid sprite types
 */
export const ALL_SPRITE_TYPES: NPCSpriteType[] = ['apple', 'banana'];

/**
 * All valid directions
 */
export const ALL_DIRECTIONS: NPCDirection[] = ['north', 'south', 'east', 'west'];
