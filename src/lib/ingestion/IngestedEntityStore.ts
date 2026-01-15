/**
 * Ingested Entity Store - Unified Deduplication Registry
 * 
 * Tracks all ingested entities (NPCs and buildings) to prevent duplicates.
 * This is the single source of truth for "has this username been ingested?"
 * 
 * The Hitchhiker's Guide notes: "Deduplication in Crypto City is crucial.
 * Without it, you'd have 47 Vitaliks wandering around, each claiming to be
 * the real one, and frankly, that's too many Vitaliks for any blockchain."
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { EntityType } from './EntityTypeDetector';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Record of an ingested entity (individual or company)
 */
export interface IngestionRecord {
  /** X/Twitter username (lowercase, without @) */
  username: string;
  /** X profile ID */
  profileId: string;
  /** Type of entity */
  entityType: EntityType;
  /** ID of the ingested NPC (if created) */
  npcId?: string;
  /** ID of the ingested building (if created) */
  buildingId?: string;
  /** When first ingested */
  ingestedAt: number;
  /** When last checked/updated */
  lastCheckedAt: number;
  /** Display name for UI */
  displayName: string;
  /** Profile image URL for UI */
  profileImageUrl: string;
}

/**
 * Result of a duplication check
 */
export interface DuplicationCheckResult {
  isDuplicate: boolean;
  existingRecord?: IngestionRecord;
}

/**
 * IndexedDB schema for ingestion registry
 */
interface IngestionRegistryDBSchema extends DBSchema {
  'ingestion-registry': {
    key: string;  // username (lowercase)
    value: IngestionRecord;
    indexes: {
      'by-profile-id': string;
      'by-ingested-at': number;
      'by-entity-type': EntityType;
    };
  };
}

// =============================================================================
// DATABASE SETUP
// =============================================================================

const DB_NAME = 'crypto-city-ingestion-registry';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<IngestionRegistryDBSchema>> | null = null;

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
async function getDB(): Promise<IDBPDatabase<IngestionRegistryDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<IngestionRegistryDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('ingestion-registry', {
          keyPath: 'username',
        });
        store.createIndex('by-profile-id', 'profileId');
        store.createIndex('by-ingested-at', 'ingestedAt');
        store.createIndex('by-entity-type', 'entityType');
      },
      blocked() {
        console.warn('[IngestedEntityStore] Database blocked - close other tabs');
      },
      blocking() {
        console.warn('[IngestedEntityStore] Database blocking other connections');
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
 * Save an ingestion record
 * @throws {IndexedDBQuotaError} If storage quota is exceeded
 */
export async function saveIngestionRecord(record: IngestionRecord): Promise<void> {
  try {
    const db = await getDB();
    // Ensure username is lowercase
    const normalizedRecord = {
      ...record,
      username: record.username.toLowerCase(),
    };
    await db.put('ingestion-registry', normalizedRecord);
    console.log(`[IngestedEntityStore] Saved record for @${record.username}`);
  } catch (error) {
    handleWriteError(error, 'saveIngestionRecord');
  }
}

/**
 * Get an ingestion record by username
 */
export async function getIngestionRecord(username: string): Promise<IngestionRecord | undefined> {
  const db = await getDB();
  return db.get('ingestion-registry', username.toLowerCase());
}

/**
 * Get an ingestion record by profile ID
 */
export async function getIngestionRecordByProfileId(profileId: string): Promise<IngestionRecord | undefined> {
  const db = await getDB();
  return db.getFromIndex('ingestion-registry', 'by-profile-id', profileId);
}

/**
 * Get all ingestion records
 */
export async function getAllIngestionRecords(): Promise<IngestionRecord[]> {
  const db = await getDB();
  return db.getAll('ingestion-registry');
}

/**
 * Get records by entity type
 */
export async function getRecordsByType(entityType: EntityType): Promise<IngestionRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('ingestion-registry', 'by-entity-type', entityType);
}

/**
 * Delete an ingestion record
 */
export async function deleteIngestionRecord(username: string): Promise<void> {
  const db = await getDB();
  await db.delete('ingestion-registry', username.toLowerCase());
  console.log(`[IngestedEntityStore] Deleted record for @${username}`);
}

/**
 * Update the last checked timestamp
 */
export async function updateLastChecked(username: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('ingestion-registry', username.toLowerCase());
  if (record) {
    record.lastCheckedAt = Date.now();
    await db.put('ingestion-registry', record);
  }
}

/**
 * Link a building ID to an existing record
 */
export async function linkBuildingToRecord(username: string, buildingId: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('ingestion-registry', username.toLowerCase());
  if (record) {
    record.buildingId = buildingId;
    record.lastCheckedAt = Date.now();
    await db.put('ingestion-registry', record);
    console.log(`[IngestedEntityStore] Linked building ${buildingId} to @${username}`);
  }
}

/**
 * Link an NPC ID to an existing record
 */
export async function linkNPCToRecord(username: string, npcId: string): Promise<void> {
  const db = await getDB();
  const record = await db.get('ingestion-registry', username.toLowerCase());
  if (record) {
    record.npcId = npcId;
    record.lastCheckedAt = Date.now();
    await db.put('ingestion-registry', record);
    console.log(`[IngestedEntityStore] Linked NPC ${npcId} to @${username}`);
  }
}

/**
 * Get the count of ingestion records
 */
export async function getIngestionCount(): Promise<number> {
  const db = await getDB();
  return db.count('ingestion-registry');
}

/**
 * Clear all ingestion records (for testing/reset)
 */
export async function clearAllIngestionRecords(): Promise<void> {
  const db = await getDB();
  await db.clear('ingestion-registry');
  console.log('[IngestedEntityStore] Cleared all ingestion records');
}

// =============================================================================
// DEDUPLICATION LOGIC
// =============================================================================

/**
 * Check if a username has already been ingested
 */
export async function checkDuplication(username: string): Promise<DuplicationCheckResult> {
  const record = await getIngestionRecord(username);
  
  if (!record) {
    return { isDuplicate: false };
  }
  
  return {
    isDuplicate: true,
    existingRecord: record,
  };
}

/**
 * Check if a username has been ingested as a specific type
 */
export async function hasBeenIngested(
  username: string, 
  entityType?: EntityType
): Promise<boolean> {
  const record = await getIngestionRecord(username);
  
  if (!record) {
    return false;
  }
  
  if (entityType && record.entityType !== entityType) {
    return false;
  }
  
  return true;
}

/**
 * Check if a profile ID has been ingested
 */
export async function hasProfileBeenIngested(profileId: string): Promise<boolean> {
  const record = await getIngestionRecordByProfileId(profileId);
  return record !== undefined;
}

/**
 * Get statistics about ingested entities
 */
export async function getIngestionStats(): Promise<{
  total: number;
  individuals: number;
  companies: number;
  protocols: number;
  withBuildings: number;
  withNPCs: number;
}> {
  const records = await getAllIngestionRecords();
  
  return {
    total: records.length,
    individuals: records.filter(r => r.entityType === 'individual').length,
    companies: records.filter(r => r.entityType === 'company').length,
    protocols: records.filter(r => r.entityType === 'protocol').length,
    withBuildings: records.filter(r => r.buildingId).length,
    withNPCs: records.filter(r => r.npcId).length,
  };
}

// =============================================================================
// EXPORT SINGLETON PATTERN
// =============================================================================

const IngestedEntityStore = {
  // CRUD
  save: saveIngestionRecord,
  get: getIngestionRecord,
  getByProfileId: getIngestionRecordByProfileId,
  getAll: getAllIngestionRecords,
  getByType: getRecordsByType,
  delete: deleteIngestionRecord,
  updateLastChecked,
  linkBuilding: linkBuildingToRecord,
  linkNPC: linkNPCToRecord,
  count: getIngestionCount,
  clearAll: clearAllIngestionRecords,
  
  // Deduplication
  checkDuplication,
  hasBeenIngested,
  hasProfileBeenIngested,
  getStats: getIngestionStats,
};

export default IngestedEntityStore;
