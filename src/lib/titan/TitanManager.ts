/**
 * TitanManager - Singleton Manager for the Titan Pet
 * 
 * Manages the single Titan creature that can exist in Crypto City.
 * Follows the singleton pattern (similar to NPCManager) but enforces
 * a single-Titan constraint - only one Titan can exist at a time.
 * 
 * Key responsibilities:
 * - Spawning and despawning the Titan
 * - Position updates and queries
 * - State updates (needs decay, age progression)
 * - Persistence via localStorage
 * 
 * "There can be only one. Unless you're talking about blockchain forks,
 * then there can be confusingly many." - Hitchhiker's Guide to Crypto City
 */

import {
  TitanPet,
  TitanSpawnOptions,
  SerializedTitan,
  SerializedTitanBDI,
  TitanSpecies,
  TitanSkill,
  TitanSkillProgression,
  TitanNeeds,
  TitanMood,
  TitanBDI,
  TitanRelationship,
  AlignmentState,
  TITAN_STORAGE_KEY,
  ALIGNMENT_RANGES,
  ALL_TITAN_SKILLS,
} from '@/games/isocity/types/titan';

import type { NPCDirection } from '@/games/isocity/types/npc';
import { DECAY_RATES, CRITICAL_THRESHOLDS, DEFAULT_WEIGHTS } from '@/lib/npc/needs';
import { generateSpeciesPersonality } from './TitanSpawner';
import { TitanRelationshipManager } from './TitanRelationships';

/**
 * Crypto-themed name prefixes for each species
 */
const SPECIES_NAME_PREFIXES: Record<TitanSpecies, string[]> = {
  doge: ['Moon', 'Hodl', 'Much', 'Wow', 'Shiba', 'Diamond', 'Rocket', 'Degen'],
  bull: ['Pump', 'Green', 'Alpha', 'Chad', 'Mega', 'Super', 'Ultra', 'Power'],
  bear: ['Hedge', 'Short', 'Safe', 'Steady', 'Cold', 'Winter', 'Frost', 'Ice'],
  ape: ['Strong', 'Diamond', 'Ape', 'Gorilla', 'Kong', 'Banan', 'Together', 'Hodl'],
  whale: ['Deep', 'Big', 'Mega', 'Massive', 'Ocean', 'Blue', 'Giant', 'Market'],
  phoenix: ['Rise', 'Rebirth', 'Fire', 'Ash', 'Blaze', 'Eternal', 'Undying', 'Flame'],
};

/**
 * Crypto-themed name suffixes
 */
const NAME_SUFFIXES = [
  'Hodler', 'Degen', 'Maxi', 'Chad', 'Hands', 'Moon', 'Pump', 'Gains',
  'Bags', 'Stack', 'Coin', 'Token', 'Satoshi', 'Vitalik', 'Nakamoto', 'WAGMI',
];

/**
 * TitanManager Singleton Class
 * 
 * Manages the single Titan creature in Crypto City.
 */
class TitanManagerClass {
  private static instance: TitanManagerClass | null = null;
  private titan: TitanPet | null = null;
  private nextIdNum: number = 1;
  private relationshipManager: TitanRelationshipManager | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Private constructor ensures singleton
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): TitanManagerClass {
    if (!TitanManagerClass.instance) {
      TitanManagerClass.instance = new TitanManagerClass();
    }
    return TitanManagerClass.instance;
  }

  // ============================================================================
  // ID AND NAME GENERATION
  // ============================================================================

  /**
   * Generate a unique Titan ID
   */
  private generateTitanId(): string {
    return `titan-${this.nextIdNum++}-${Date.now()}`;
  }

  /**
   * Generate a crypto-themed name for the Titan based on species
   */
  private generateTitanName(species: TitanSpecies): string {
    const prefixes = SPECIES_NAME_PREFIXES[species];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
    return `${prefix}${suffix}`;
  }

  // ============================================================================
  // SPAWN AND DESPAWN
  // ============================================================================

  /**
   * Spawn a new Titan at the specified position.
   * If a Titan already exists, it will be despawned first.
   * 
   * @param options Spawn options including position and optional overrides
   * @returns The newly created Titan
   */
  spawnTitan(options: TitanSpawnOptions): TitanPet {
    // Despawn existing Titan if any
    if (this.titan) {
      this.despawnTitan();
    }

    const species = options.species ?? 'doge';
    const name = options.name ?? this.generateTitanName(species);
    const direction = options.direction ?? 'south';
    const alignment = options.initialAlignment ?? 0;

    const titan: TitanPet = {
      id: this.generateTitanId(),
      species,
      name,
      age: 0,
      alignment,
      currentAppearance: this.getAlignmentState(alignment),
      gridX: options.gridX,
      gridY: options.gridY,
      direction,
      isInsideBuilding: false,
      currentBuildingId: null,
      currentActivity: 'idle',
      needs: this.createDefaultTitanNeeds(),
      mood: this.createDefaultTitanMood(),
      bdi: this.createDefaultBDI(),
      skills: this.createDefaultSkills(species),
      personality: generateSpeciesPersonality(species),
      actionHistory: [],
      relationships: {},
    };

    this.titan = titan;
    return titan;
  }

  /**
   * Get the current Titan, or null if none exists
   */
  getTitan(): TitanPet | null {
    return this.titan;
  }

  /**
   * Check if a Titan currently exists
   */
  hasTitan(): boolean {
    return this.titan !== null;
  }

  /**
   * Despawn (remove) the current Titan
   * 
   * @returns true if a Titan was removed, false if none existed
   */
  despawnTitan(): boolean {
    if (!this.titan) {
      return false;
    }
    this.titan = null;
    this.relationshipManager = null;
    this.miracleCooldowns = null;
    this.titanDen = null;
    return true;
  }

  // ============================================================================
  // POSITION METHODS
  // ============================================================================

  /**
   * Update the Titan's position
   * 
   * @param gridX New X coordinate
   * @param gridY New Y coordinate
   * @param direction Optional new direction
   */
  updateTitanPosition(gridX: number, gridY: number, direction?: NPCDirection): void {
    if (!this.titan) {
      return;
    }
    this.titan.gridX = gridX;
    this.titan.gridY = gridY;
    if (direction) {
      this.titan.direction = direction;
    }
  }

  /**
   * Get the Titan's current position
   * 
   * @returns Position object or null if no Titan exists
   */
  getTitanPosition(): { gridX: number; gridY: number } | null {
    if (!this.titan) {
      return null;
    }
    return {
      gridX: this.titan.gridX,
      gridY: this.titan.gridY,
    };
  }

  // ============================================================================
  // UPDATE METHODS
  // ============================================================================

  /**
   * Update the Titan's state over time
   * 
   * @param deltaMinutes Number of game minutes that have passed
   */
  updateTitan(deltaMinutes: number): void {
    if (!this.titan) {
      return;
    }

    // Update age (1440 minutes = 1 day)
    this.titan.age += deltaMinutes / 1440;

    // Decay needs
    this.decayNeeds(deltaMinutes);

    // Update appearance based on alignment
    this.titan.currentAppearance = this.getAlignmentState(this.titan.alignment);
  }

  /**
   * Decay the Titan's needs over time
   */
  private decayNeeds(deltaMinutes: number): void {
    if (!this.titan) return;

    const needs = this.titan.needs;
    
    // Decay each need
    needs.hunger.current = Math.max(0, needs.hunger.current - needs.hunger.decayRate * deltaMinutes);
    needs.energy.current = Math.max(0, needs.energy.current - needs.energy.decayRate * deltaMinutes);
    needs.social.current = Math.max(0, needs.social.current - needs.social.decayRate * deltaMinutes);
    needs.fun.current = Math.max(0, needs.fun.current - needs.fun.decayRate * deltaMinutes);
    needs.wealth.current = Math.max(0, needs.wealth.current - needs.wealth.decayRate * deltaMinutes);
    needs.purpose.current = Math.max(0, needs.purpose.current - needs.purpose.decayRate * deltaMinutes);
    // Titan-specific needs
    needs.attention.current = Math.max(0, needs.attention.current - needs.attention.decayRate * deltaMinutes);
    needs.growth.current = Math.max(0, needs.growth.current - needs.growth.decayRate * deltaMinutes);
  }

  // ============================================================================
  // RELATIONSHIP METHODS
  // ============================================================================

  /**
   * Get the TitanRelationshipManager for the current Titan.
   * Returns null if no Titan exists.
   * 
   * @returns The relationship manager, or null if no Titan exists
   */
  getRelationshipManager(): TitanRelationshipManager | null {
    if (!this.titan) {
      return null;
    }
    
    // Lazily create the relationship manager if needed
    if (!this.relationshipManager) {
      this.relationshipManager = new TitanRelationshipManager(this.titan.relationships);
    }
    
    return this.relationshipManager;
  }

  /**
   * Update a relationship with an NPC via the TitanManager.
   * Convenience method that delegates to TitanRelationshipManager.
   * 
   * @param npcId - The NPC's ID
   * @param changes - Partial relationship changes to apply
   * @returns The updated relationship, or null if no Titan exists
   */
  updateTitanRelationship(
    npcId: string,
    changes: Partial<Pick<TitanRelationship, 'trust' | 'respect' | 'familiarity' | 'fear'>>
  ): TitanRelationship | null {
    const manager = this.getRelationshipManager();
    if (!manager || !this.titan) {
      return null;
    }
    
    const rel = manager.updateRelationship(npcId, changes);
    
    // Sync back to Titan's relationships record
    this.titan.relationships = manager.toRecord();
    
    return rel;
  }

  /**
   * Get a relationship with an NPC via the TitanManager.
   * Convenience method that delegates to TitanRelationshipManager.
   * 
   * @param npcId - The NPC's ID
   * @returns The relationship, or null if no Titan exists or no relationship found
   */
  getTitanRelationship(npcId: string): TitanRelationship | null {
    const manager = this.getRelationshipManager();
    if (!manager) {
      return null;
    }
    
    return manager.getRelationship(npcId);
  }

  // ============================================================================
  // MIRACLE METHODS
  // ============================================================================

  /** Miracle cooldown tracker instance */
  private miracleCooldowns: import('./TitanMiracles').MiracleCooldownTracker | null = null;

  /**
   * Get the miracle cooldown tracker for the current Titan.
   * Creates a new tracker if one doesn't exist.
   * 
   * @returns The cooldown tracker, or null if no Titan exists
   */
  getMiracleCooldowns(): import('./TitanMiracles').MiracleCooldownTracker | null {
    if (!this.titan) {
      return null;
    }
    
    // Lazily create the cooldown tracker if needed
    if (!this.miracleCooldowns) {
      const { MiracleCooldownTracker } = require('./TitanMiracles');
      this.miracleCooldowns = new MiracleCooldownTracker();
    }
    
    return this.miracleCooldowns;
  }

  /**
   * Check if the Titan can use a specific miracle.
   * 
   * @param miracle - The miracle to check
   * @returns Object with canUse and optional reason, or null if no Titan exists
   */
  canTitanUseMiracle(miracle: import('./TitanMiracles').Miracle): { canUse: boolean; reason?: string } | null {
    if (!this.titan) {
      return null;
    }
    
    const tracker = this.getMiracleCooldowns();
    if (!tracker) {
      return null;
    }
    
    const { canUseMiracle } = require('./TitanMiracles');
    return canUseMiracle(this.titan, miracle, tracker);
  }

  /**
   * Have the Titan use a miracle.
   * 
   * @param miracle - The miracle to use
   * @param target - Target position or NPC ID
   * @returns MiracleResult, or null if no Titan exists
   */
  titanUseMiracle(
    miracle: import('./TitanMiracles').Miracle,
    target: { x: number; y: number } | string
  ): import('./TitanMiracles').MiracleResult | null {
    if (!this.titan) {
      return null;
    }
    
    const tracker = this.getMiracleCooldowns();
    if (!tracker) {
      return null;
    }
    
    const { performMiracle } = require('./TitanMiracles');
    return performMiracle(this.titan, miracle, target, tracker);
  }

  // ============================================================================
  // PERSISTENCE METHODS
  // ============================================================================

  /**
   * Save the current Titan to localStorage
   */
  saveToStorage(): void {
    if (!this.titan) {
      return;
    }

    try {
      const serialized = this.serializeTitan(this.titan);
      localStorage.setItem(TITAN_STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error('[TitanManager] Failed to save Titan to storage:', error);
    }
  }

  /**
   * Load a Titan from localStorage
   * 
   * @returns true if a Titan was loaded, false otherwise
   */
  loadFromStorage(): boolean {
    try {
      const stored = localStorage.getItem(TITAN_STORAGE_KEY);
      if (!stored) {
        return false;
      }

      const data: SerializedTitan = JSON.parse(stored);
      this.titan = this.deserializeTitan(data);
      // Reset relationship manager so it gets recreated with loaded data
      this.relationshipManager = null;
      return true;
    } catch (error) {
      console.error('[TitanManager] Failed to load Titan from storage:', error);
      return false;
    }
  }

  /**
   * Clear stored Titan data from localStorage
   */
  clearStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(TITAN_STORAGE_KEY);
    } catch (error) {
      console.error('[TitanManager] Failed to clear storage:', error);
    }
  }

  // ============================================================================
  // SERIALIZATION HELPERS
  // ============================================================================

  /**
   * Serialize a Titan for storage
   */
  private serializeTitan(titan: TitanPet): SerializedTitan {
    return {
      species: titan.species,
      name: titan.name,
      age: titan.age,
      gridX: titan.gridX,
      gridY: titan.gridY,
      direction: titan.direction,
      alignment: titan.alignment,
      currentAppearance: titan.currentAppearance,
      skills: titan.skills,
      personality: titan.personality,
      needs: titan.needs,
      mood: titan.mood,
      bdi: this.serializeBDI(titan.bdi),
      actionHistory: titan.actionHistory,
      relationships: titan.relationships,
    };
  }

  /**
   * Serialize BDI (convert Maps to arrays)
   */
  private serializeBDI(bdi: TitanBDI): SerializedTitanBDI {
    return {
      beliefs: {
        worldKnowledge: Array.from(bdi.beliefs.worldKnowledge.entries()),
        actionBeliefs: Array.from(bdi.beliefs.actionBeliefs.entries()),
        npcOpinions: Array.from(bdi.beliefs.npcOpinions.entries()),
        playerRelationship: bdi.beliefs.playerRelationship,
      },
      desires: bdi.desires,
      intentions: bdi.intentions,
    };
  }

  /**
   * Deserialize a Titan from storage
   */
  private deserializeTitan(data: SerializedTitan): TitanPet {
    // Extract the highest ID number for nextIdNum tracking
    const match = data.name?.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num >= this.nextIdNum) {
        this.nextIdNum = num + 1;
      }
    }

    return {
      id: this.generateTitanId(),
      species: data.species,
      name: data.name,
      age: data.age,
      alignment: data.alignment,
      currentAppearance: data.currentAppearance,
      gridX: data.gridX,
      gridY: data.gridY,
      direction: data.direction,
      isInsideBuilding: false,
      currentBuildingId: null,
      currentActivity: 'idle',
      needs: data.needs,
      mood: data.mood,
      bdi: this.deserializeBDI(data.bdi),
      skills: data.skills,
      personality: data.personality || generateSpeciesPersonality(data.species),
      actionHistory: data.actionHistory || [],
      relationships: data.relationships || {},
    };
  }

  /**
   * Deserialize BDI (convert arrays back to Maps)
   */
  private deserializeBDI(data: SerializedTitanBDI): TitanBDI {
    return {
      beliefs: {
        worldKnowledge: new Map(data.beliefs.worldKnowledge),
        actionBeliefs: new Map(data.beliefs.actionBeliefs),
        npcOpinions: new Map(data.beliefs.npcOpinions),
        playerRelationship: data.beliefs.playerRelationship,
      },
      desires: data.desires,
      intentions: data.intentions,
    };
  }

  // ============================================================================
  // FACTORY HELPERS
  // ============================================================================

  /**
   * Get the alignment state based on alignment value
   */
  private getAlignmentState(alignment: number): AlignmentState {
    if (alignment <= ALIGNMENT_RANGES.angelic.max) return 'angelic';
    if (alignment <= ALIGNMENT_RANGES.good.max) return 'good';
    if (alignment <= ALIGNMENT_RANGES.neutral.max) return 'neutral';
    if (alignment <= ALIGNMENT_RANGES.evil.max) return 'evil';
    return 'demonic';
  }

  /**
   * Create default Titan needs (extended from NPC needs)
   */
  private createDefaultTitanNeeds(): TitanNeeds {
    const randomInitial = () => Math.floor(Math.random() * 51) + 50; // 50-100

    return {
      hunger: {
        current: randomInitial(),
        max: 100,
        decayRate: DECAY_RATES.hunger,
        criticalThreshold: CRITICAL_THRESHOLDS.hunger,
        weight: DEFAULT_WEIGHTS.hunger,
      },
      energy: {
        current: randomInitial(),
        max: 100,
        decayRate: DECAY_RATES.energy,
        criticalThreshold: CRITICAL_THRESHOLDS.energy,
        weight: DEFAULT_WEIGHTS.energy,
      },
      social: {
        current: randomInitial(),
        max: 100,
        decayRate: DECAY_RATES.social,
        criticalThreshold: CRITICAL_THRESHOLDS.social,
        weight: DEFAULT_WEIGHTS.social,
      },
      fun: {
        current: randomInitial(),
        max: 100,
        decayRate: DECAY_RATES.fun,
        criticalThreshold: CRITICAL_THRESHOLDS.fun,
        weight: DEFAULT_WEIGHTS.fun,
      },
      wealth: {
        current: randomInitial(),
        max: 100,
        decayRate: DECAY_RATES.wealth,
        criticalThreshold: CRITICAL_THRESHOLDS.wealth,
        weight: DEFAULT_WEIGHTS.wealth,
      },
      purpose: {
        current: randomInitial(),
        max: 100,
        decayRate: DECAY_RATES.purpose,
        criticalThreshold: CRITICAL_THRESHOLDS.purpose,
        weight: DEFAULT_WEIGHTS.purpose,
      },
      // Titan-specific needs
      attention: {
        current: randomInitial(),
        max: 100,
        decayRate: 0.4, // Similar to fun
        criticalThreshold: 20,
        weight: 1.0,
      },
      growth: {
        current: randomInitial(),
        max: 100,
        decayRate: 0.2, // Similar to social
        criticalThreshold: 25,
        weight: 0.8,
      },
    };
  }

  /**
   * Create default Titan mood
   */
  private createDefaultTitanMood(): TitanMood {
    return {
      currentMood: 'neutral',
      moodIntensity: 0.5,
      thoughts: [],
      beliefs: [],
      desires: [],
      beliefsAboutPlayer: {
        trust: 0.5,
        fear: 0.0,
        affection: 0.5,
      },
    };
  }

  /**
   * Create default BDI structure
   */
  private createDefaultBDI(): TitanBDI {
    return {
      beliefs: {
        worldKnowledge: new Map(),
        actionBeliefs: new Map(),
        npcOpinions: new Map(),
        playerRelationship: {
          trust: 0.5,
          fear: 0.0,
          affection: 0.5,
        },
      },
      desires: [],
      intentions: null,
    };
  }

  /**
   * Create default skills for a new Titan
   * @param species - The species to get aptitudes for
   */
  private createDefaultSkills(species: TitanSpecies): Record<TitanSkill, TitanSkillProgression> {
    // Delegate to TitanSkills module for proper aptitude handling
    const { initializeSkillProgressions } = require('./TitanSkills');
    return initializeSkillProgressions(species);
  }

  // ============================================================================
  // DEN MANAGEMENT METHODS
  // ============================================================================

  /** The Titan's den, or null if not set */
  private titanDen: import('./TitanDen').TitanDen | null = null;

  /**
   * Get the Titan's current den.
   * 
   * @returns The den, or null if no den is set
   */
  getTitanDen(): import('./TitanDen').TitanDen | null {
    return this.titanDen;
  }

  /**
   * Set the Titan's den.
   * 
   * @param den - The den to set
   */
  setTitanDen(den: import('./TitanDen').TitanDen): void {
    this.titanDen = den;
  }

  /**
   * Remove the Titan's den.
   */
  removeTitanDen(): void {
    this.titanDen = null;
  }

  /**
   * Check if the Titan's den can be upgraded.
   * 
   * @returns Object with canUpgrade and optional reason, or null if no Titan/den
   */
  canUpgradeTitanDen(): { canUpgrade: boolean; reason?: string } | null {
    if (!this.titan || !this.titanDen) {
      return null;
    }

    const { canUpgradeDen } = require('./TitanDen');
    return canUpgradeDen(this.titanDen, this.titan);
  }

  /**
   * Upgrade the Titan's den to the next level.
   * 
   * @returns true if upgrade succeeded, false otherwise
   */
  upgradeTitanDen(): boolean {
    if (!this.titan || !this.titanDen) {
      return false;
    }

    const { upgradeDen, canUpgradeDen } = require('./TitanDen');
    
    // Check if upgrade is possible
    const checkResult = canUpgradeDen(this.titanDen, this.titan);
    if (!checkResult.canUpgrade) {
      return false;
    }

    // Perform upgrade
    const upgraded = upgradeDen(this.titanDen);
    if (upgraded) {
      this.titanDen = upgraded;
      return true;
    }

    return false;
  }

  // ============================================================================
  // SKILL CONVENIENCE METHODS
  // ============================================================================

  /**
   * Grant XP to the Titan's skill.
   * Convenience method that delegates to TitanSkills module.
   * 
   * @param skill - The skill to grant XP to
   * @param amount - Base XP amount (before aptitude modifier)
   * @returns Result with leveledUp status and newLevel, or null if no Titan
   */
  grantTitanSkillXP(skill: TitanSkill, amount: number): { leveledUp: boolean; newLevel: number } | null {
    if (!this.titan) {
      return null;
    }

    const { grantSkillXP } = require('./TitanSkills');
    const result = grantSkillXP(this.titan.skills, skill, amount);
    
    // Update Titan's skills
    this.titan.skills = result.progressions;
    
    return {
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
    };
  }

  /**
   * Get the Titan's skill level for a specific skill.
   * 
   * @param skill - The skill to get level for
   * @returns The skill level (1-10), or null if no Titan
   */
  getTitanSkillLevel(skill: TitanSkill): number | null {
    if (!this.titan) {
      return null;
    }

    return this.titan.skills[skill].level;
  }
}

/**
 * Export the singleton instance
 */
export const TitanManager = TitanManagerClass.getInstance();

/**
 * Also export the class for type purposes
 */
export type { TitanManagerClass };
