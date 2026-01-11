/**
 * NPC Spawner for Crypto City
 * 
 * Handles spawning NPCs at residential buildings with appropriate
 * occupations based on available city buildings.
 */

import { NPCManager } from './NPCManager';
import { CryptoNPC, Occupation, ALL_OCCUPATIONS } from '@/games/isocity/types/npc';
import { BuildingType, RESIDENTIAL_BUILDINGS, COMMERCIAL_BUILDINGS, INDUSTRIAL_BUILDINGS } from '@/games/isocity/types/buildings';
import type { Tile } from '@/types/game';

/** Initial NPC count range */
const MIN_INITIAL_NPCS = 10;
const MAX_INITIAL_NPCS = 15;

/**
 * Occupation weights based on city building types
 * Higher weight = more likely to be selected
 */
const BASE_OCCUPATION_WEIGHTS: Record<Occupation, number> = {
  trader: 15,      // Always popular in Crypto City
  miner: 10,       // Common but needs infrastructure
  developer: 12,   // Tech-heavy city
  shop_owner: 8,   // Depends on commercial buildings
  bartender: 5,    // Service workers
  artist: 8,       // NFT creators
  security: 5,     // Guards and protocol auditors
  unemployed: 10,  // Always some degens between jobs
};

/**
 * Building types that increase specific occupation weights
 */
const BUILDING_OCCUPATION_BOOSTS: Partial<Record<BuildingType, Partial<Record<Occupation, number>>>> = {
  // Commercial buildings boost shop owners and bartenders
  shop_small: { shop_owner: 5, bartender: 3 },
  shop_medium: { shop_owner: 8, bartender: 5 },
  mall: { shop_owner: 15, bartender: 8, security: 5 },
  
  // Office buildings boost traders and developers
  office_low: { trader: 5, developer: 5 },
  office_high: { trader: 10, developer: 10, security: 3 },
  
  // Industrial buildings boost miners
  factory_small: { miner: 5 },
  factory_medium: { miner: 10 },
  factory_large: { miner: 15 },
  warehouse: { miner: 3, security: 2 },
  
  // Cultural buildings boost artists
  museum: { artist: 10 },
  stadium: { artist: 5, security: 5 },
  
  // Power infrastructure boosts miners significantly
  power_plant: { miner: 20 },
  
  // Entertainment
  amusement_park: { bartender: 5, artist: 3, security: 5 },
};

/**
 * NPCSpawner class
 * 
 * Handles the logic for spawning NPCs at appropriate locations
 * with contextually relevant occupations.
 */
class NPCSpawnerClass {
  private static instance: NPCSpawnerClass | null = null;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): NPCSpawnerClass {
    if (!NPCSpawnerClass.instance) {
      NPCSpawnerClass.instance = new NPCSpawnerClass();
    }
    return NPCSpawnerClass.instance;
  }

  /**
   * Calculate occupation weights based on city buildings
   * 
   * @param grid The city grid
   * @param gridSize Size of the grid
   * @returns Weighted occupation probabilities
   */
  calculateOccupationWeights(grid: Tile[][] | null, gridSize: number): Map<Occupation, number> {
    const weights = new Map<Occupation, number>();
    
    // Start with base weights
    for (const occupation of ALL_OCCUPATIONS) {
      weights.set(occupation, BASE_OCCUPATION_WEIGHTS[occupation]);
    }
    
    if (!grid) return weights;
    
    // Scan the city for buildings that affect occupation weights
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = grid[y]?.[x];
        if (!tile) continue;
        
        const buildingType = tile.building.type;
        const boosts = BUILDING_OCCUPATION_BOOSTS[buildingType];
        
        if (boosts) {
          for (const [occupation, boost] of Object.entries(boosts)) {
            const current = weights.get(occupation as Occupation) || 0;
            weights.set(occupation as Occupation, current + boost);
          }
        }
      }
    }
    
    return weights;
  }

  /**
   * Select a random occupation based on weights
   * 
   * @param weights Occupation weight map
   * @returns Selected occupation
   */
  selectOccupation(weights: Map<Occupation, number>): Occupation {
    const totalWeight = Array.from(weights.values()).reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (const [occupation, weight] of weights) {
      random -= weight;
      if (random <= 0) {
        return occupation;
      }
    }
    
    // Fallback (shouldn't happen)
    return 'unemployed';
  }

  /**
   * Find residential building positions in the grid
   * 
   * @param grid The city grid
   * @param gridSize Size of the grid
   * @returns Array of residential building positions
   */
  findResidentialBuildings(grid: Tile[][] | null, gridSize: number): { x: number; y: number; buildingId: string }[] {
    const residentials: { x: number; y: number; buildingId: string }[] = [];
    
    if (!grid) return residentials;
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = grid[y]?.[x];
        if (!tile) continue;
        
        if (RESIDENTIAL_BUILDINGS.includes(tile.building.type)) {
          residentials.push({
            x,
            y,
            buildingId: `building-${x}-${y}`,
          });
        }
      }
    }
    
    return residentials;
  }

  /**
   * Find workplace building positions in the grid
   * 
   * @param grid The city grid
   * @param gridSize Size of the grid
   * @returns Array of workplace building positions
   */
  findWorkplaces(grid: Tile[][] | null, gridSize: number): { x: number; y: number; buildingId: string; type: BuildingType }[] {
    const workplaces: { x: number; y: number; buildingId: string; type: BuildingType }[] = [];
    
    if (!grid) return workplaces;
    
    const workplaceTypes = [...COMMERCIAL_BUILDINGS, ...INDUSTRIAL_BUILDINGS];
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = grid[y]?.[x];
        if (!tile) continue;
        
        if (workplaceTypes.includes(tile.building.type)) {
          workplaces.push({
            x,
            y,
            buildingId: `building-${x}-${y}`,
            type: tile.building.type,
          });
        }
      }
    }
    
    return workplaces;
  }

  /**
   * Spawn initial NPCs for the city
   * 
   * @param grid The city grid (optional, for occupation weighting)
   * @param gridSize Size of the grid
   * @returns Number of NPCs spawned
   */
  spawnInitialNPCs(grid: Tile[][] | null = null, gridSize: number = 50): number {
    // Determine how many NPCs to spawn
    const count = Math.floor(Math.random() * (MAX_INITIAL_NPCS - MIN_INITIAL_NPCS + 1)) + MIN_INITIAL_NPCS;
    
    // Calculate occupation weights based on city buildings
    const occupationWeights = this.calculateOccupationWeights(grid, gridSize);
    
    // Find residential buildings for spawning
    const residentials = this.findResidentialBuildings(grid, gridSize);
    
    // Find workplaces for assignment
    const workplaces = this.findWorkplaces(grid, gridSize);
    
    let spawned = 0;
    
    for (let i = 0; i < count; i++) {
      // Determine spawn position
      let spawnX: number;
      let spawnY: number;
      let residenceId: string | undefined;
      
      if (residentials.length > 0) {
        // Spawn at a residential building
        const residential = residentials[Math.floor(Math.random() * residentials.length)];
        spawnX = residential.x;
        spawnY = residential.y;
        residenceId = residential.buildingId;
      } else {
        // No residential buildings, spawn at random position
        spawnX = Math.floor(Math.random() * gridSize);
        spawnY = Math.floor(Math.random() * gridSize);
      }
      
      // Select occupation
      const occupation = this.selectOccupation(occupationWeights);
      
      // Optionally assign a workplace
      let workplaceId: string | undefined;
      if (occupation !== 'unemployed' && workplaces.length > 0) {
        const workplace = workplaces[Math.floor(Math.random() * workplaces.length)];
        workplaceId = workplace.buildingId;
      }
      
      // Spawn the NPC
      NPCManager.spawnNPC({
        gridX: spawnX,
        gridY: spawnY,
        occupation,
        residenceId,
        workplaceId,
      });
      
      spawned++;
    }
    
    return spawned;
  }

  /**
   * Spawn a single NPC at a specific residential building
   * 
   * @param residentialX X position of the residential building
   * @param residentialY Y position of the residential building
   * @param grid Optional grid for occupation weighting
   * @param gridSize Grid size
   * @returns The spawned NPC
   */
  spawnAtResidential(
    residentialX: number,
    residentialY: number,
    grid: Tile[][] | null = null,
    gridSize: number = 50
  ): CryptoNPC {
    const occupationWeights = this.calculateOccupationWeights(grid, gridSize);
    const occupation = this.selectOccupation(occupationWeights);
    const workplaces = this.findWorkplaces(grid, gridSize);
    
    let workplaceId: string | undefined;
    if (occupation !== 'unemployed' && workplaces.length > 0) {
      const workplace = workplaces[Math.floor(Math.random() * workplaces.length)];
      workplaceId = workplace.buildingId;
    }
    
    return NPCManager.spawnNPC({
      gridX: residentialX,
      gridY: residentialY,
      occupation,
      residenceId: `building-${residentialX}-${residentialY}`,
      workplaceId,
    });
  }
}

/**
 * Export the singleton instance
 */
export const NPCSpawner = NPCSpawnerClass.getInstance();

/**
 * Also export the class for type purposes
 */
export type { NPCSpawnerClass };
