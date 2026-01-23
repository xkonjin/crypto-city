/**
 * Save State Schema Validation
 * Issue #241: Implement Save State Validation and Schema Versioning
 * 
 * Provides Zod schemas for validating game save states
 * Includes schema versioning for backward compatibility
 */

import { z } from 'zod';

/**
 * Current schema version
 * Increment this when making breaking changes to the save format
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Tile schema
 */
const TileSchema = z.object({
  type: z.enum(['grass', 'water', 'road', 'rail', 'subway']),
  building: z.string().nullable().optional(),
  rotation: z.number().min(0).max(3).optional(),
  zone: z.string().nullable().optional(),
});

/**
 * Building schema
 */
const BuildingSchema = z.object({
  type: z.string(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  rotation: z.number().min(0).max(3),
  level: z.number().int().min(1).optional(),
  health: z.number().min(0).max(100).optional(),
});

/**
 * City stats schema
 */
const CityStatsSchema = z.object({
  population: z.number().int().min(0),
  money: z.number(),
  happiness: z.number().min(0).max(100),
  pollution: z.number().min(0).max(100),
  traffic: z.number().min(0).max(100),
  crime: z.number().min(0).max(100),
});

/**
 * Game state schema (v1)
 */
export const GameStateSchemaV1 = z.object({
  version: z.literal(1),
  cityName: z.string().min(1).max(50),
  gridSize: z.number().int().min(16).max(128),
  grid: z.array(z.array(TileSchema)),
  buildings: z.array(BuildingSchema),
  stats: CityStatsSchema,
  timestamp: z.number(),
  playTime: z.number().min(0),
});

export type GameStateV1 = z.infer<typeof GameStateSchemaV1>;

/**
 * Validate a save state against the current schema
 */
export function validateSaveState(data: unknown): { valid: boolean; data?: GameStateV1; error?: string } {
  try {
    const parsed = GameStateSchemaV1.parse(data);
    return { valid: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        error: `Invalid save state: ${error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')}` 
      };
    }
    return { valid: false, error: 'Unknown validation error' };
  }
}

/**
 * Migrate save state from older versions to current version
 */
export function migrateSaveState(data: any): GameStateV1 | null {
  // Check if version exists
  if (!data.version) {
    console.warn('Save state has no version, attempting to migrate from v0');
    // Assume v0 format and add version field
    data.version = 1;
  }
  
  // Handle different versions
  switch (data.version) {
    case 1:
      // Already current version
      return data as GameStateV1;
      
    default:
      console.error(`Unknown save state version: ${data.version}`);
      return null;
  }
}

/**
 * Safe save state loader with validation and migration
 */
export function loadSaveState(jsonString: string): { success: boolean; data?: GameStateV1; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Attempt migration if needed
    const migrated = migrateSaveState(parsed);
    if (!migrated) {
      return { success: false, error: 'Failed to migrate save state' };
    }
    
    // Validate migrated data
    const validation = validateSaveState(migrated);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    return { success: true, data: validation.data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to parse save state' };
  }
}

/**
 * Create a new save state with validation
 */
export function createSaveState(data: Omit<GameStateV1, 'version' | 'timestamp'>): GameStateV1 {
  const saveState: GameStateV1 = {
    ...data,
    version: CURRENT_SCHEMA_VERSION,
    timestamp: Date.now(),
  };
  
  // Validate before returning
  const validation = validateSaveState(saveState);
  if (!validation.valid) {
    throw new Error(`Invalid save state: ${validation.error}`);
  }
  
  return saveState;
}

/**
 * Serialize save state to JSON with validation
 */
export function serializeSaveState(data: GameStateV1): string {
  const validation = validateSaveState(data);
  if (!validation.valid) {
    throw new Error(`Cannot serialize invalid save state: ${validation.error}`);
  }
  
  return JSON.stringify(data);
}
