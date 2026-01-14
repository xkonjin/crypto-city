/**
 * IndexedDB Store for Ingested NPCs
 * 
 * Persists ingested X/Twitter users so they survive page refreshes.
 * Stores the NPC data and their custom avatar spritesheets.
 * 
 * The Hitchhiker's Guide notes: "Persistence is the polite term for
 * keeping your digital citizens in a database instead of letting them
 * vanish into the void every time you refresh."
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Persisted ingested NPC data
 */
export interface PersistedIngestedNPC {
  /** Profile ID from X/Twitter */
  profileId: string;
  /** X/Twitter username (without @) */
  username: string;
  /** Display name */
  displayName: string;
  /** Profile image URL (for regenerating avatar if needed) */
  profileImageUrl: string;
  /** Base64 encoded spritesheet PNG */
  avatarSpritesheetBase64?: string;
  /** Personality archetype */
  archetype: string;
  /** Occupation */
  occupation: string;
  /** Dialogue seeds for NPC conversations */
  dialogueSeeds: string[];
  /** Grid position where NPC was last seen */
  lastPosition: { x: number; y: number };
  /** When the NPC was first ingested */
  createdAt: number;
  /** When the NPC was last active */
  lastActiveAt: number;
  /** x402 wallet address if created */
  x402WalletAddress?: string;
}

/**
 * IndexedDB schema for ingested NPCs
 */
interface IngestedNPCDBSchema extends DBSchema {
  'ingested-npcs': {
    key: string;  // profileId
    value: PersistedIngestedNPC;
    indexes: {
      'by-username': string;
      'by-created': number;
    };
  };
}

// =============================================================================
// DATABASE SETUP
// =============================================================================

const DB_NAME = 'crypto-city-ingested-npcs';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<IngestedNPCDBSchema>> | null = null;

/**
 * Get or create the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase<IngestedNPCDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<IngestedNPCDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('ingested-npcs', {
          keyPath: 'profileId',
        });
        store.createIndex('by-username', 'username');
        store.createIndex('by-created', 'createdAt');
      },
    });
  }
  return dbPromise;
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Save an ingested NPC to IndexedDB
 */
export async function saveIngestedNPC(npc: PersistedIngestedNPC): Promise<void> {
  const db = await getDB();
  await db.put('ingested-npcs', npc);
  console.log(`[IngestedNPCStore] Saved @${npc.username}`);
}

/**
 * Get an ingested NPC by profile ID
 */
export async function getIngestedNPC(profileId: string): Promise<PersistedIngestedNPC | undefined> {
  const db = await getDB();
  return db.get('ingested-npcs', profileId);
}

/**
 * Get an ingested NPC by username
 */
export async function getIngestedNPCByUsername(username: string): Promise<PersistedIngestedNPC | undefined> {
  const db = await getDB();
  return db.getFromIndex('ingested-npcs', 'by-username', username.toLowerCase());
}

/**
 * Get all ingested NPCs
 */
export async function getAllIngestedNPCs(): Promise<PersistedIngestedNPC[]> {
  const db = await getDB();
  return db.getAll('ingested-npcs');
}

/**
 * Delete an ingested NPC
 */
export async function deleteIngestedNPC(profileId: string): Promise<void> {
  const db = await getDB();
  await db.delete('ingested-npcs', profileId);
  console.log(`[IngestedNPCStore] Deleted profile ${profileId}`);
}

/**
 * Update the last active timestamp and position
 */
export async function updateIngestedNPCPosition(
  profileId: string,
  position: { x: number; y: number }
): Promise<void> {
  const db = await getDB();
  const npc = await db.get('ingested-npcs', profileId);
  if (npc) {
    npc.lastPosition = position;
    npc.lastActiveAt = Date.now();
    await db.put('ingested-npcs', npc);
  }
}

/**
 * Get the count of ingested NPCs
 */
export async function getIngestedNPCCount(): Promise<number> {
  const db = await getDB();
  return db.count('ingested-npcs');
}

/**
 * Check if a user has been ingested
 */
export async function hasBeenIngested(username: string): Promise<boolean> {
  const npc = await getIngestedNPCByUsername(username);
  return npc !== undefined;
}

/**
 * Clear all ingested NPCs (for testing/reset)
 */
export async function clearAllIngestedNPCs(): Promise<void> {
  const db = await getDB();
  await db.clear('ingested-npcs');
  console.log('[IngestedNPCStore] Cleared all ingested NPCs');
}

// =============================================================================
// AVATAR IMAGE UTILITIES
// =============================================================================

/**
 * Load a spritesheet image from base64
 */
export function loadSpritesheetFromBase64(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load spritesheet from base64'));
    img.src = `data:image/png;base64,${base64}`;
  });
}

/**
 * Convert an HTMLImageElement to base64
 */
export function imageToBase64(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl.replace('data:image/png;base64,', '');
}

/**
 * Convert a data URL to base64
 */
export function dataUrlToBase64(dataUrl: string): string {
  if (dataUrl.startsWith('data:')) {
    return dataUrl.split(',')[1];
  }
  return dataUrl;
}

// =============================================================================
// EXPORT SINGLETON PATTERN
// =============================================================================

const IngestedNPCStore = {
  save: saveIngestedNPC,
  get: getIngestedNPC,
  getByUsername: getIngestedNPCByUsername,
  getAll: getAllIngestedNPCs,
  delete: deleteIngestedNPC,
  updatePosition: updateIngestedNPCPosition,
  count: getIngestedNPCCount,
  hasBeenIngested,
  clearAll: clearAllIngestedNPCs,
  loadSpritesheetFromBase64,
  imageToBase64,
  dataUrlToBase64,
};

export default IngestedNPCStore;
