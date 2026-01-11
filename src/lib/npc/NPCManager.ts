/**
 * NPC Manager - Global Registry for Crypto City NPCs
 * 
 * Singleton pattern manager that handles:
 * - NPC spawning and despawning
 * - NPC lookups by ID, position, etc.
 * - Persistence to localStorage
 */

import {
  CryptoNPC,
  NPCSpawnOptions,
  SerializedNPC,
  Occupation,
  NPCDirection,
  NPCSpriteType,
  NPCActivity,
  ALL_OCCUPATIONS,
  ALL_SPRITE_TYPES,
  ALL_DIRECTIONS,
} from '@/games/isocity/types/npc';
import { generateNPCName, generateWalletAddress } from './nameGenerator';
import { createDefaultNeeds } from './needs';
import { createDefaultMemory } from './memory';
import { createInitialMovement } from './movement';
import { PersonalityManager } from './PersonalityManager';

/** Storage key for NPC persistence */
const STORAGE_KEY = 'crypto-city-npcs';

/**
 * NPCManager Singleton
 * 
 * Global registry for managing all NPCs in Crypto City.
 */
class NPCManagerClass {
  private npcs: Map<string, CryptoNPC> = new Map();
  private nextId: number = 1;
  private static instance: NPCManagerClass | null = null;
  private personalityManager: PersonalityManager = new PersonalityManager();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): NPCManagerClass {
    if (!NPCManagerClass.instance) {
      NPCManagerClass.instance = new NPCManagerClass();
    }
    return NPCManagerClass.instance;
  }

  /**
   * Generate a unique NPC ID
   */
  private generateId(): string {
    return `npc-${this.nextId++}-${Date.now()}`;
  }

  /**
   * Pick a random element from an array
   */
  private randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Generate a random age between 18 and 80
   */
  private generateAge(): number {
    return Math.floor(Math.random() * 63) + 18; // 18-80
  }

  /**
   * Spawn a new NPC at the specified position
   * 
   * @param options Spawn options including position and optional overrides
   * @returns The newly created NPC
   */
  spawnNPC(options: NPCSpawnOptions): CryptoNPC {
    const id = this.generateId();
    const name = generateNPCName();
    const walletAddress = generateWalletAddress();
    
    // Generate personality with random archetype
    const { personality, archetype } = this.personalityManager.generateWithRandomArchetype();
    
    const npc: CryptoNPC = {
      id,
      name,
      walletAddress,
      age: this.generateAge(),
      occupation: options.occupation || this.randomPick(ALL_OCCUPATIONS),
      residence: options.residenceId || null,
      workplace: options.workplaceId || null,
      spriteType: options.spriteType || this.randomPick(ALL_SPRITE_TYPES),
      direction: options.direction || this.randomPick(ALL_DIRECTIONS),
      gridX: options.gridX,
      gridY: options.gridY,
      isInsideBuilding: false,
      currentBuildingId: null,
      currentActivity: 'idle' as NPCActivity,
      // Initialize needs with randomized values (50-100)
      needs: createDefaultNeeds(),
      // Initialize empty memory
      memory: createDefaultMemory(),
      // Initialize movement in idle state
      movement: createInitialMovement(),
      // Initialize personality with archetype
      personality,
      personalityArchetype: archetype,
      // Initialize empty relationships
      relationships: {},
    };

    this.npcs.set(id, npc);
    return npc;
  }

  /**
   * Get an NPC by their ID
   * 
   * @param id The NPC's unique identifier
   * @returns The NPC or undefined if not found
   */
  getNPC(id: string): CryptoNPC | undefined {
    return this.npcs.get(id);
  }

  /**
   * Get all NPCs currently at a specific grid position
   * 
   * @param x Grid X coordinate
   * @param y Grid Y coordinate
   * @returns Array of NPCs at that position
   */
  getNPCsAt(x: number, y: number): CryptoNPC[] {
    return Array.from(this.npcs.values()).filter(
      npc => npc.gridX === x && npc.gridY === y && !npc.isInsideBuilding
    );
  }

  /**
   * Get all NPCs in the city
   * 
   * @returns Array of all NPCs
   */
  getAllNPCs(): CryptoNPC[] {
    return Array.from(this.npcs.values());
  }

  /**
   * Get NPCs by occupation
   * 
   * @param occupation The occupation to filter by
   * @returns Array of NPCs with that occupation
   */
  getNPCsByOccupation(occupation: Occupation): CryptoNPC[] {
    return Array.from(this.npcs.values()).filter(npc => npc.occupation === occupation);
  }

  /**
   * Get NPCs currently in a specific building
   * 
   * @param buildingId The building's identifier
   * @returns Array of NPCs in that building
   */
  getNPCsInBuilding(buildingId: string): CryptoNPC[] {
    return Array.from(this.npcs.values()).filter(
      npc => npc.isInsideBuilding && npc.currentBuildingId === buildingId
    );
  }

  /**
   * Despawn (remove) an NPC by their ID
   * 
   * @param id The NPC's unique identifier
   * @returns true if the NPC was removed, false if not found
   */
  despawnNPC(id: string): boolean {
    return this.npcs.delete(id);
  }

  /**
   * Update an NPC's position
   * 
   * @param id NPC ID
   * @param gridX New X position
   * @param gridY New Y position
   * @param direction Optional new direction
   */
  updateNPCPosition(id: string, gridX: number, gridY: number, direction?: NPCDirection): void {
    const npc = this.npcs.get(id);
    if (npc) {
      npc.gridX = gridX;
      npc.gridY = gridY;
      if (direction) {
        npc.direction = direction;
      }
    }
  }

  /**
   * Update an NPC's activity state
   * 
   * @param id NPC ID
   * @param activity New activity
   */
  updateNPCActivity(id: string, activity: NPCActivity | null): void {
    const npc = this.npcs.get(id);
    if (npc) {
      npc.currentActivity = activity;
    }
  }

  /**
   * Move an NPC into a building
   * 
   * @param id NPC ID
   * @param buildingId Building to enter
   */
  enterBuilding(id: string, buildingId: string): void {
    const npc = this.npcs.get(id);
    if (npc) {
      npc.isInsideBuilding = true;
      npc.currentBuildingId = buildingId;
    }
  }

  /**
   * Move an NPC out of a building
   * 
   * @param id NPC ID
   */
  exitBuilding(id: string): void {
    const npc = this.npcs.get(id);
    if (npc) {
      npc.isInsideBuilding = false;
      npc.currentBuildingId = null;
    }
  }

  /**
   * Get the total NPC count
   */
  getCount(): number {
    return this.npcs.size;
  }

  /**
   * Clear all NPCs (for testing or reset)
   */
  clear(): void {
    this.npcs.clear();
    this.nextId = 1;
  }

  /**
   * Serialize NPC data for persistence
   */
  private serializeNPC(npc: CryptoNPC): SerializedNPC {
    return {
      id: npc.id,
      name: npc.name,
      walletAddress: npc.walletAddress,
      age: npc.age,
      occupation: npc.occupation,
      residence: npc.residence,
      workplace: npc.workplace,
      spriteType: npc.spriteType,
      direction: npc.direction,
      gridX: npc.gridX,
      gridY: npc.gridY,
      isInsideBuilding: npc.isInsideBuilding,
      currentBuildingId: npc.currentBuildingId,
      currentActivity: npc.currentActivity,
      needs: npc.needs,
      memory: npc.memory,
      movement: npc.movement,
      personality: npc.personality,
      personalityArchetype: npc.personalityArchetype,
      relationships: npc.relationships,
    };
  }

  /**
   * Deserialize NPC data from storage
   */
  private deserializeNPC(data: SerializedNPC): CryptoNPC {
    // Handle legacy saves without personality by generating a new one
    let personality = data.personality;
    let personalityArchetype = data.personalityArchetype;
    if (!personality) {
      const generated = this.personalityManager.generateWithRandomArchetype();
      personality = generated.personality;
      personalityArchetype = generated.archetype;
    }

    return {
      id: data.id,
      name: data.name,
      walletAddress: data.walletAddress,
      age: data.age,
      occupation: data.occupation,
      residence: data.residence,
      workplace: data.workplace,
      spriteType: data.spriteType,
      direction: data.direction,
      gridX: data.gridX,
      gridY: data.gridY,
      isInsideBuilding: data.isInsideBuilding,
      currentBuildingId: data.currentBuildingId,
      currentActivity: data.currentActivity,
      // Use stored needs or create default if loading old save
      needs: data.needs || createDefaultNeeds(),
      // Use stored memory or create default if loading old save
      memory: data.memory || createDefaultMemory(),
      // Use stored movement or create default if loading old save
      movement: data.movement || createInitialMovement(),
      // Use stored personality or create default if loading old save
      personality,
      personalityArchetype,
      // Use stored relationships or create empty if loading old save
      relationships: data.relationships || {},
    };
  }

  /**
   * Save all NPCs to localStorage
   */
  saveToStorage(): void {
    try {
      const npcsArray = Array.from(this.npcs.values()).map(npc => this.serializeNPC(npc));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(npcsArray));
    } catch (error) {
      console.error('[NPCManager] Failed to save NPCs to storage:', error);
    }
  }

  /**
   * Load NPCs from localStorage
   * 
   * @returns Number of NPCs loaded
   */
  loadFromStorage(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return 0;

      const npcsData: SerializedNPC[] = JSON.parse(stored);
      
      // Clear existing NPCs before loading
      this.npcs.clear();
      
      // Find the highest ID number to continue from
      let maxIdNum = 0;
      
      for (const data of npcsData) {
        const npc = this.deserializeNPC(data);
        this.npcs.set(npc.id, npc);
        
        // Extract numeric part from ID for nextId tracking
        const match = npc.id.match(/npc-(\d+)-/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxIdNum) maxIdNum = num;
        }
      }
      
      this.nextId = maxIdNum + 1;
      return npcsData.length;
    } catch (error) {
      console.error('[NPCManager] Failed to load NPCs from storage:', error);
      return 0;
    }
  }

  /**
   * Clear stored NPC data from localStorage
   */
  clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[NPCManager] Failed to clear storage:', error);
    }
  }
}

/**
 * Export the singleton instance
 */
export const NPCManager = NPCManagerClass.getInstance();

/**
 * Also export the class for type purposes
 */
export type { NPCManagerClass };
