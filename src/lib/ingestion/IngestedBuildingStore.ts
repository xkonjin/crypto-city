/**
 * IndexedDB Store for Ingested Buildings
 * 
 * Persists AI-generated building sprites and definitions for ingested companies.
 * Buildings survive page refreshes and can be placed multiple times.
 * 
 * The Hitchhiker's Guide notes: "A building in IndexedDB is like a building
 * in your imagination - it takes up no physical space, yet somehow manages
 * to slow everything down anyway."
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { CryptoTier, CryptoChain, CryptoEffects } from '@/games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Persisted ingested building data
 */
export interface PersistedIngestedBuilding {
  /** Unique building ID (e.g., 'ingested_uniswap') */
  buildingId: string;
  /** X profile ID */
  profileId: string;
  /** X username (without @) */
  username: string;
  /** Display name for the building */
  name: string;
  /** Building category */
  category: 'ingested';
  /** Building footprint */
  footprint: { width: number; height: number };
  /** Icon emoji */
  icon: string;
  /** Crypto tier */
  tier: CryptoTier;
  /** Primary chain */
  chain: CryptoChain;
  /** Building description */
  description: string;
  /** Building cost */
  cost: number;
  /** Crypto effects */
  effects: CryptoEffects;
  /** Base64 encoded sprite PNG */
  spriteBase64: string;
  /** Cached blob URL (regenerated on load) */
  spriteBlobUrl?: string;
  /** Profile image URL (for reference) */
  profileImageUrl: string;
  /** When first ingested */
  ingestedAt: number;
  /** When last updated */
  lastUpdatedAt: number;
  /** Whether building has been placed in the city */
  isPlaced: boolean;
  /** Current placement location (if placed) */
  placedAt?: { x: number; y: number };
  /** Number of times this building has been placed */
  placementCount: number;
}

/**
 * IndexedDB schema for ingested buildings
 */
interface IngestedBuildingDBSchema extends DBSchema {
  'ingested-buildings': {
    key: string;  // buildingId
    value: PersistedIngestedBuilding;
    indexes: {
      'by-username': string;
      'by-profile-id': string;
      'by-ingested-at': number;
      'by-tier': CryptoTier;
    };
  };
}

// =============================================================================
// DATABASE SETUP
// =============================================================================

const DB_NAME = 'crypto-city-ingested-buildings';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<IngestedBuildingDBSchema>> | null = null;

/** Error type for IndexedDB quota exceeded */
export class IndexedDBQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IndexedDBQuotaError';
  }
}

/**
 * Get or create the IndexedDB database
 * Handles quota exceeded and blocked errors with retry
 */
async function getDB(): Promise<IDBPDatabase<IngestedBuildingDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<IngestedBuildingDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('ingested-buildings', {
          keyPath: 'buildingId',
        });
        store.createIndex('by-username', 'username');
        store.createIndex('by-profile-id', 'profileId');
        store.createIndex('by-ingested-at', 'ingestedAt');
        store.createIndex('by-tier', 'tier');
      },
      blocked() {
        console.warn('[IngestedBuildingStore] Database blocked - close other tabs');
      },
      blocking() {
        console.warn('[IngestedBuildingStore] Database blocking other connections');
      },
    }).catch(error => {
      // Reset promise so next call can retry
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

/**
 * Handle IndexedDB write errors with quota detection
 */
function handleWriteError(error: unknown, operation: string): never {
  if (error instanceof Error) {
    // Check for quota exceeded error
    if (error.name === 'QuotaExceededError' || 
        error.message.includes('quota') ||
        error.message.includes('storage')) {
      throw new IndexedDBQuotaError(
        `Storage quota exceeded during ${operation}. Clear some data or request more storage.`
      );
    }
  }
  throw error;
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Save an ingested building to IndexedDB
 * @throws {IndexedDBQuotaError} If storage quota is exceeded
 */
export async function saveIngestedBuilding(building: PersistedIngestedBuilding): Promise<void> {
  try {
    const db = await getDB();
    // Normalize username
    const normalizedBuilding = {
      ...building,
      username: building.username.toLowerCase(),
    };
    await db.put('ingested-buildings', normalizedBuilding);
    console.log(`[IngestedBuildingStore] Saved building ${building.buildingId}`);
  } catch (error) {
    handleWriteError(error, 'saveIngestedBuilding');
  }
}

/**
 * Get an ingested building by ID
 */
export async function getIngestedBuilding(buildingId: string): Promise<PersistedIngestedBuilding | undefined> {
  const db = await getDB();
  const building = await db.get('ingested-buildings', buildingId);
  
  // Regenerate blob URL if needed
  if (building && building.spriteBase64 && !building.spriteBlobUrl) {
    building.spriteBlobUrl = `data:image/png;base64,${building.spriteBase64}`;
  }
  
  return building;
}

/**
 * Get an ingested building by username
 */
export async function getIngestedBuildingByUsername(username: string): Promise<PersistedIngestedBuilding | undefined> {
  const db = await getDB();
  const building = await db.getFromIndex('ingested-buildings', 'by-username', username.toLowerCase());
  
  // Regenerate blob URL if needed
  if (building && building.spriteBase64 && !building.spriteBlobUrl) {
    building.spriteBlobUrl = `data:image/png;base64,${building.spriteBase64}`;
  }
  
  return building;
}

/**
 * Get all ingested buildings
 */
export async function getAllIngestedBuildings(): Promise<PersistedIngestedBuilding[]> {
  const db = await getDB();
  const buildings = await db.getAll('ingested-buildings');
  
  // Regenerate blob URLs
  return buildings.map(building => {
    if (building.spriteBase64 && !building.spriteBlobUrl) {
      building.spriteBlobUrl = `data:image/png;base64,${building.spriteBase64}`;
    }
    return building;
  });
}

/**
 * Get ingested buildings by tier
 */
export async function getIngestedBuildingsByTier(tier: CryptoTier): Promise<PersistedIngestedBuilding[]> {
  const db = await getDB();
  const buildings = await db.getAllFromIndex('ingested-buildings', 'by-tier', tier);
  
  return buildings.map(building => {
    if (building.spriteBase64 && !building.spriteBlobUrl) {
      building.spriteBlobUrl = `data:image/png;base64,${building.spriteBase64}`;
    }
    return building;
  });
}

/**
 * Delete an ingested building
 */
export async function deleteIngestedBuilding(buildingId: string): Promise<void> {
  const db = await getDB();
  await db.delete('ingested-buildings', buildingId);
  console.log(`[IngestedBuildingStore] Deleted building ${buildingId}`);
}

/**
 * Update building placement status
 */
export async function updateBuildingPlacement(
  buildingId: string,
  isPlaced: boolean,
  position?: { x: number; y: number }
): Promise<void> {
  const db = await getDB();
  const building = await db.get('ingested-buildings', buildingId);
  
  if (building) {
    building.isPlaced = isPlaced;
    building.placedAt = position;
    if (isPlaced) {
      building.placementCount = (building.placementCount || 0) + 1;
    }
    building.lastUpdatedAt = Date.now();
    await db.put('ingested-buildings', building);
    console.log(`[IngestedBuildingStore] Updated placement for ${buildingId}`);
  }
}

/**
 * Get the count of ingested buildings
 */
export async function getIngestedBuildingCount(): Promise<number> {
  const db = await getDB();
  return db.count('ingested-buildings');
}

/**
 * Check if a building has been ingested for a username
 */
export async function hasBuildingBeenIngested(username: string): Promise<boolean> {
  const building = await getIngestedBuildingByUsername(username);
  return building !== undefined;
}

/**
 * Clear all ingested buildings (for testing/reset)
 */
export async function clearAllIngestedBuildings(): Promise<void> {
  const db = await getDB();
  await db.clear('ingested-buildings');
  console.log('[IngestedBuildingStore] Cleared all ingested buildings');
}

// =============================================================================
// SPRITE UTILITIES
// =============================================================================

/**
 * Load a sprite image from a persisted building
 */
export function loadSpriteImage(building: PersistedIngestedBuilding): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load building sprite'));
    img.src = building.spriteBlobUrl || `data:image/png;base64,${building.spriteBase64}`;
  });
}

/**
 * Preload all ingested building sprites
 */
export async function preloadAllSprites(): Promise<Map<string, HTMLImageElement>> {
  const sprites = new Map<string, HTMLImageElement>();
  const buildings = await getAllIngestedBuildings();
  
  await Promise.all(
    buildings.map(async (building) => {
      try {
        const img = await loadSpriteImage(building);
        sprites.set(building.buildingId, img);
      } catch (error) {
        console.warn(`[IngestedBuildingStore] Failed to load sprite for ${building.buildingId}:`, error);
      }
    })
  );
  
  return sprites;
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about ingested buildings
 */
export async function getBuildingStats(): Promise<{
  total: number;
  placed: number;
  byTier: Record<CryptoTier, number>;
  totalPlacements: number;
}> {
  const buildings = await getAllIngestedBuildings();
  
  const byTier: Record<CryptoTier, number> = {
    retail: 0,
    degen: 0,
    whale: 0,
    institution: 0,
  };
  
  let placed = 0;
  let totalPlacements = 0;
  
  for (const building of buildings) {
    byTier[building.tier]++;
    if (building.isPlaced) placed++;
    totalPlacements += building.placementCount || 0;
  }
  
  return {
    total: buildings.length,
    placed,
    byTier,
    totalPlacements,
  };
}

// =============================================================================
// EXPORT SINGLETON PATTERN
// =============================================================================

const IngestedBuildingStore = {
  // CRUD
  save: saveIngestedBuilding,
  get: getIngestedBuilding,
  getByUsername: getIngestedBuildingByUsername,
  getAll: getAllIngestedBuildings,
  getByTier: getIngestedBuildingsByTier,
  delete: deleteIngestedBuilding,
  updatePlacement: updateBuildingPlacement,
  count: getIngestedBuildingCount,
  hasBeenIngested: hasBuildingBeenIngested,
  clearAll: clearAllIngestedBuildings,
  
  // Sprites
  loadSprite: loadSpriteImage,
  preloadSprites: preloadAllSprites,
  
  // Stats
  getStats: getBuildingStats,
};

export default IngestedBuildingStore;
