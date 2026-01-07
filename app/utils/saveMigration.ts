// =============================================================================
// SAVE FILE MIGRATION SYSTEM
// =============================================================================
// Handles versioned save files with automatic migration between versions.
// This allows saves from older versions to be loaded in newer game versions.

import { GridCell, VisualSettings, CryptoEconomyState, CryptoEvent } from '../components/game/types';
import { SAVE_CONFIG, SIMULATION_CONFIG } from '../config/gameConfig';
import { PlacedBuilding } from '../simulation/economy/BuildingRegistry';

// =============================================================================
// VERSION TYPES
// =============================================================================

/**
 * Current save file format (version 2)
 */
export interface SaveFileV2 {
  meta: {
    version: 2;
    savedAt: string;
    gameVersion: string;
    name: string;
  };
  grid: {
    version: 1;
    width: number;
    height: number;
    data: GridCell[][];
  };
  economy: {
    version: 1;
    treasury: number;
    treasuryHistory: number[];
    sentiment: number;
    sentimentHistory: number[];
    currentTick: number;
  };
  buildings: {
    version: 1;
    data: PlacedBuilding[];
  };
  events: {
    version: 1;
    active: CryptoEvent[];
    history: CryptoEvent[];
  };
  entities: {
    version: 1;
    characterCount: number;
    carCount: number;
  };
  camera: {
    version: 1;
    zoom: number;
  };
  settings: {
    version: 1;
    visual: VisualSettings;
  };
}

/**
 * Legacy save file format (version 1 - original)
 */
export interface SaveFileV1 {
  version: 1;
  grid: GridCell[][];
  characterCount: number;
  carCount: number;
  zoom: number;
  visualSettings: VisualSettings;
  name?: string;
}

/**
 * Union of all supported save file versions
 */
export type SaveFile = SaveFileV1 | SaveFileV2;

// =============================================================================
// MIGRATION RESULT
// =============================================================================

export interface MigrationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings: string[];
  migratedFrom?: number;
}

// =============================================================================
// VERSION DETECTION
// =============================================================================

/**
 * Detect the version of a save file
 */
export function detectSaveVersion(data: unknown): number {
  if (!data || typeof data !== 'object') {
    return 0; // Invalid
  }

  const obj = data as Record<string, unknown>;

  // V2: Has meta.version = 2
  if (
    obj.meta &&
    typeof obj.meta === 'object' &&
    (obj.meta as Record<string, unknown>).version === 2
  ) {
    return 2;
  }

  // V1: Has version = 1 and grid directly
  if (obj.version === 1 && Array.isArray(obj.grid)) {
    return 1;
  }

  // Unknown version
  return 0;
}

// =============================================================================
// MIGRATION FUNCTIONS
// =============================================================================

/**
 * Migrate V1 save to V2 format
 */
function migrateV1ToV2(v1: SaveFileV1): SaveFileV2 {
  const now = new Date().toISOString();
  
  return {
    meta: {
      version: 2,
      savedAt: now,
      gameVersion: '2.0.0', // Current game version
      name: v1.name ?? 'Migrated Save',
    },
    grid: {
      version: 1,
      width: v1.grid[0]?.length ?? 0,
      height: v1.grid.length,
      data: v1.grid,
    },
    economy: {
      version: 1,
      treasury: SIMULATION_CONFIG.STARTING_TREASURY, // V1 didn't have treasury
      treasuryHistory: [SIMULATION_CONFIG.STARTING_TREASURY],
      sentiment: 0,
      sentimentHistory: [0],
      currentTick: 0,
    },
    buildings: {
      version: 1,
      data: [], // V1 didn't track buildings separately - would need to scan grid
    },
    events: {
      version: 1,
      active: [],
      history: [],
    },
    entities: {
      version: 1,
      characterCount: v1.characterCount ?? 0,
      carCount: v1.carCount ?? 0,
    },
    camera: {
      version: 1,
      zoom: v1.zoom ?? 1,
    },
    settings: {
      version: 1,
      visual: v1.visualSettings ?? {
        showGrid: false,
        showPaths: false,
        showStats: true,
        ambientParticles: true,
        screenShake: true,
        musicEnabled: true,
        soundEnabled: true,
      },
    },
  };
}

/**
 * Migration function registry
 */
const MIGRATIONS: Record<number, (data: unknown) => unknown> = {
  1: (data) => migrateV1ToV2(data as SaveFileV1),
  // Future migrations:
  // 2: (data) => migrateV2ToV3(data as SaveFileV2),
};

// =============================================================================
// MAIN MIGRATION FUNCTION
// =============================================================================

/**
 * Migrate a save file to the current version
 */
export function migrateSave(data: unknown): MigrationResult<SaveFileV2> {
  const warnings: string[] = [];
  
  // Detect version
  let version = detectSaveVersion(data);
  
  if (version === 0) {
    return {
      success: false,
      error: 'Unable to detect save file version. File may be corrupted.',
      warnings,
    };
  }

  if (version < SAVE_CONFIG.MIN_SUPPORTED_VERSION) {
    return {
      success: false,
      error: `Save file version ${version} is too old. Minimum supported: ${SAVE_CONFIG.MIN_SUPPORTED_VERSION}`,
      warnings,
    };
  }

  const originalVersion = version;
  let currentData = data;

  // Apply migrations sequentially
  while (version < SAVE_CONFIG.CURRENT_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) {
      return {
        success: false,
        error: `No migration path from version ${version}`,
        warnings,
      };
    }

    try {
      currentData = migrate(currentData);
      warnings.push(`Migrated from v${version} to v${version + 1}`);
      version++;
    } catch (error) {
      return {
        success: false,
        error: `Migration from v${version} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings,
      };
    }
  }

  return {
    success: true,
    data: currentData as SaveFileV2,
    warnings,
    migratedFrom: originalVersion !== SAVE_CONFIG.CURRENT_VERSION ? originalVersion : undefined,
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate a V2 save file structure
 */
export function validateSaveV2(data: SaveFileV2): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!data.meta) errors.push('Missing meta section');
  if (!data.grid) errors.push('Missing grid section');
  if (!data.economy) errors.push('Missing economy section');
  if (!data.settings) errors.push('Missing settings section');

  // Grid validation
  if (data.grid) {
    if (!Array.isArray(data.grid.data)) {
      errors.push('Grid data is not an array');
    } else if (data.grid.data.length === 0) {
      errors.push('Grid is empty');
    }
  }

  // Economy validation
  if (data.economy) {
    if (typeof data.economy.treasury !== 'number') {
      errors.push('Treasury is not a number');
    }
    if (typeof data.economy.sentiment !== 'number') {
      errors.push('Sentiment is not a number');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// SAVE CREATION HELPERS
// =============================================================================

/**
 * Create a new V2 save file from current game state
 */
export function createSaveFileV2(
  name: string,
  grid: GridCell[][],
  economy: {
    treasury: number;
    treasuryHistory: number[];
    sentiment: number;
    sentimentHistory: number[];
    currentTick: number;
  },
  buildings: PlacedBuilding[],
  events: {
    active: CryptoEvent[];
    history: CryptoEvent[];
  },
  entities: {
    characterCount: number;
    carCount: number;
  },
  camera: {
    zoom: number;
  },
  settings: {
    visual: VisualSettings;
  }
): SaveFileV2 {
  return {
    meta: {
      version: 2,
      savedAt: new Date().toISOString(),
      gameVersion: '2.0.0',
      name,
    },
    grid: {
      version: 1,
      width: grid[0]?.length ?? 0,
      height: grid.length,
      data: grid,
    },
    economy: {
      version: 1,
      ...economy,
    },
    buildings: {
      version: 1,
      data: buildings,
    },
    events: {
      version: 1,
      ...events,
    },
    entities: {
      version: 1,
      ...entities,
    },
    camera: {
      version: 1,
      ...camera,
    },
    settings: {
      version: 1,
      ...settings,
    },
  };
}

// =============================================================================
// BACKUP UTILITIES
// =============================================================================

/**
 * Create a backup before loading a new save
 */
export function createBackup(currentState: unknown): string {
  const backup = {
    timestamp: Date.now(),
    data: currentState,
  };
  return JSON.stringify(backup);
}

/**
 * Restore from a backup string
 */
export function restoreBackup(backupString: string): unknown {
  try {
    const backup = JSON.parse(backupString);
    return backup.data;
  } catch {
    throw new Error('Failed to parse backup');
  }
}

// =============================================================================
// LOCAL STORAGE HELPERS
// =============================================================================

/**
 * Get all save names from localStorage
 */
export function getSaveNames(): string[] {
  const saves: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(SAVE_CONFIG.STORAGE_KEY_PREFIX)) {
      saves.push(key.replace(SAVE_CONFIG.STORAGE_KEY_PREFIX, ''));
    }
  }
  return saves;
}

/**
 * Load a save file from localStorage
 */
export function loadSaveFromStorage(name: string): MigrationResult<SaveFileV2> {
  const key = `${SAVE_CONFIG.STORAGE_KEY_PREFIX}${name}`;
  const raw = localStorage.getItem(key);
  
  if (!raw) {
    return {
      success: false,
      error: `Save "${name}" not found`,
      warnings: [],
    };
  }

  try {
    const data = JSON.parse(raw);
    return migrateSave(data);
  } catch {
    return {
      success: false,
      error: 'Failed to parse save file',
      warnings: [],
    };
  }
}

/**
 * Save a game to localStorage
 */
export function saveToStorage(name: string, save: SaveFileV2): boolean {
  try {
    const key = `${SAVE_CONFIG.STORAGE_KEY_PREFIX}${name}`;
    localStorage.setItem(key, JSON.stringify(save));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * Delete a save from localStorage
 */
export function deleteSaveFromStorage(name: string): boolean {
  try {
    const key = `${SAVE_CONFIG.STORAGE_KEY_PREFIX}${name}`;
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

