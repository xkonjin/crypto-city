/**
 * NPC Persistence System
 *
 * Full NPC state persistence with:
 * - Serialization/deserialization of all NPC properties
 * - Differential saves (track what changed since last save)
 * - LZ-string compression for large populations
 * - IndexedDB storage with transaction support
 * - State version tracking for migrations
 * - Corruption recovery (fallback to default state)
 *
 * Target performance: <1s save/load for 200 NPCs
 *
 * @module NPCPersistence
 */

import LZString from "lz-string";
import { openDB, IDBPDatabase } from "idb";
import type {
  CryptoNPC,
  SerializedNPC,
  Occupation,
  NPCDirection,
  NPCSpriteType,
  NPCActivity,
  ALL_OCCUPATIONS,
  ALL_DIRECTIONS,
  ALL_SPRITE_TYPES,
  ALL_ACTIVITIES,
} from "@/games/isocity/types/npc";
import { createDefaultNeeds } from "./needs";
import { createDefaultMemory } from "./memory";
import { createInitialMovement } from "./movement";
import { createDefaultPersonality } from "./personality";
import { createDefaultWallet, createDefaultFinances } from "./economy";
import { createDefaultInternalWorld } from "./mood";
import { createDefaultLearning } from "./learning";
import { createDefaultPoliticalBeliefs } from "./politicalBeliefs";

/**
 * Current state version for migration tracking.
 * Increment this when making breaking changes to the state structure.
 */
export const CURRENT_STATE_VERSION = 1;

/**
 * IndexedDB database name and store name
 */
const DB_NAME = "crypto-city-persistence";
const STORE_NAME = "npc-state";
const DB_VERSION = 1;

/**
 * Error codes for NPCPersistenceError
 */
export type PersistenceErrorCode =
  | "SERIALIZATION_FAILED"
  | "DESERIALIZATION_FAILED"
  | "STORAGE_FAILED"
  | "STORAGE_FULL"
  | "MIGRATION_FAILED"
  | "VALIDATION_FAILED"
  | "RECOVERY_FAILED"
  | "COMPRESSION_FAILED"
  | "DECOMPRESSION_FAILED";

/**
 * Custom error class for persistence operations
 */
export class NPCPersistenceError extends Error {
  code: PersistenceErrorCode;

  constructor(message: string, code: PersistenceErrorCode) {
    super(message);
    this.name = "NPCPersistenceError";
    this.code = code;
  }
}

/**
 * Validation result from validateState
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Recovery statistics from recoverFromCorruption
 */
export interface RecoveryStats {
  totalNPCs: number;
  recoveredNPCs: number;
  failedNPCs: number;
  fieldsFixed: number;
}

/**
 * Recovery result from recoverFromCorruption
 */
export interface RecoveryResult {
  version: number;
  npcs: SerializedNPC[];
  recoveryStats: RecoveryStats;
}

/**
 * Persisted state structure with version tracking
 */
export interface PersistedState {
  version: number;
  npcs: SerializedNPC[];
}

/**
 * Differential update structure
 */
export interface NPCDiff {
  id: string;
  changes: string[];
  data: Partial<SerializedNPC>;
  timestamp: number;
}

// Cached database connection
let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Get or create the IndexedDB database connection
 */
async function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Valid occupations for validation
 */
const VALID_OCCUPATIONS: Occupation[] = [
  "trader",
  "miner",
  "developer",
  "shop_owner",
  "bartender",
  "artist",
  "security",
  "unemployed",
];

/**
 * Valid sprite types for validation
 */
const VALID_SPRITE_TYPES: NPCSpriteType[] = ["apple", "banana"];

/**
 * Valid directions for validation
 */
const VALID_DIRECTIONS: NPCDirection[] = ["north", "south", "east", "west"];

/**
 * Valid activities for validation
 */
const VALID_ACTIVITIES: (NPCActivity | null)[] = [
  "idle",
  "walking",
  "working",
  "eating",
  "sleeping",
  "socializing",
  "shopping",
  null,
];

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serialize an NPC to storable format.
 * Converts the CryptoNPC object to a SerializedNPC that can be stored.
 *
 * @param npc - The NPC to serialize
 * @returns SerializedNPC representation
 */
export function serializeNPC(npc: CryptoNPC): SerializedNPC {
  const serialized: SerializedNPC = {
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
    needs: structuredClone(npc.needs),
    memory: structuredClone(npc.memory),
    movement: structuredClone(npc.movement),
    personality: structuredClone(npc.personality),
    personalityArchetype: npc.personalityArchetype,
    relationships: structuredClone(npc.relationships),
  };

  // Add optional fields if present
  if (npc.internalWorld) {
    serialized.internalWorld = structuredClone(npc.internalWorld);
  }
  if (npc.wallet) {
    serialized.wallet = structuredClone(npc.wallet);
  }
  if (npc.finances) {
    serialized.finances = structuredClone(npc.finances);
  }
  if (npc.factionId !== undefined) {
    serialized.factionId = npc.factionId;
  }
  if (npc.politicalBeliefs) {
    serialized.politicalBeliefs = structuredClone(npc.politicalBeliefs);
  }
  if (npc.learning) {
    serialized.learning = structuredClone(npc.learning);
  }
  if (npc.ingestedProfile) {
    serialized.ingestedProfile = structuredClone(npc.ingestedProfile);
  }

  return serialized;
}

/**
 * Deserialize NPC data from storage.
 * Restores a CryptoNPC from its serialized representation.
 * Provides defaults for missing optional fields.
 *
 * @param data - The serialized NPC data
 * @returns Restored CryptoNPC
 */
export function deserializeNPC(data: SerializedNPC): CryptoNPC {
  const npc: CryptoNPC = {
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
    needs: data.needs ?? createDefaultNeeds(),
    memory: data.memory ?? createDefaultMemory(),
    movement: data.movement ?? createInitialMovement(),
    personality: data.personality ?? createDefaultPersonality(),
    personalityArchetype: data.personalityArchetype,
    relationships: data.relationships ?? {},
  };

  // Restore optional fields with defaults if missing
  npc.internalWorld = data.internalWorld ?? createDefaultInternalWorld();
  npc.wallet = data.wallet ?? createDefaultWallet(0);
  npc.finances = data.finances ?? createDefaultFinances(data.occupation);
  npc.factionId = data.factionId ?? null;
  npc.politicalBeliefs = data.politicalBeliefs ?? createDefaultPoliticalBeliefs();
  npc.learning = data.learning ?? createDefaultLearning();
  npc.ingestedProfile = data.ingestedProfile;

  return npc;
}

// ============================================================================
// BATCH SERIALIZATION WITH COMPRESSION
// ============================================================================

/**
 * Serialize all NPCs to a compressed string.
 * Uses LZ-string compression for efficient storage.
 *
 * @param npcs - Array of NPCs to serialize
 * @returns Compressed string representation
 */
export function serializeAllNPCs(npcs: CryptoNPC[]): string {
  try {
    const serialized = npcs.map(serializeNPC);
    const json = JSON.stringify(serialized);
    const compressed = LZString.compressToUTF16(json);

    if (!compressed) {
      throw new NPCPersistenceError(
        "Compression returned null",
        "COMPRESSION_FAILED"
      );
    }

    return compressed;
  } catch (error) {
    if (error instanceof NPCPersistenceError) {
      throw error;
    }
    throw new NPCPersistenceError(
      `Failed to serialize NPCs: ${error instanceof Error ? error.message : "Unknown error"}`,
      "SERIALIZATION_FAILED"
    );
  }
}

/**
 * Deserialize all NPCs from a compressed string.
 *
 * @param compressed - The compressed string from serializeAllNPCs
 * @returns Array of restored NPCs
 */
export function deserializeAllNPCs(compressed: string): CryptoNPC[] {
  try {
    const json = LZString.decompressFromUTF16(compressed);

    if (!json) {
      throw new NPCPersistenceError(
        "Decompression returned null - invalid compressed data",
        "DECOMPRESSION_FAILED"
      );
    }

    const serialized: SerializedNPC[] = JSON.parse(json);
    return serialized.map(deserializeNPC);
  } catch (error) {
    if (error instanceof NPCPersistenceError) {
      throw error;
    }
    throw new NPCPersistenceError(
      `Failed to deserialize NPCs: ${error instanceof Error ? error.message : "Unknown error"}`,
      "DESERIALIZATION_FAILED"
    );
  }
}

// ============================================================================
// DIFFERENTIAL SAVES
// ============================================================================

/**
 * Deep compare two values
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return a === b;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }

  return true;
}

/**
 * Create a differential update between two NPC states.
 * Returns only the fields that changed.
 *
 * @param previousState - The previous NPC state
 * @param currentState - The current NPC state
 * @returns NPCDiff with changes, or null if nothing changed
 */
export function createDiff(
  previousState: CryptoNPC,
  currentState: CryptoNPC
): NPCDiff | null {
  const changes: string[] = [];
  const data: Partial<SerializedNPC> = {};

  // Fields to compare (excluding id which should never change)
  const fieldsToCompare: (keyof CryptoNPC)[] = [
    "name",
    "walletAddress",
    "age",
    "occupation",
    "residence",
    "workplace",
    "spriteType",
    "direction",
    "gridX",
    "gridY",
    "isInsideBuilding",
    "currentBuildingId",
    "currentActivity",
    "needs",
    "memory",
    "movement",
    "personality",
    "personalityArchetype",
    "relationships",
    "internalWorld",
    "wallet",
    "finances",
    "factionId",
    "politicalBeliefs",
    "learning",
    "ingestedProfile",
  ];

  for (const field of fieldsToCompare) {
    const prev = previousState[field];
    const curr = currentState[field];

    if (!deepEqual(prev, curr)) {
      changes.push(field);
      (data as unknown as Record<string, unknown>)[field] = structuredClone(curr);
    }
  }

  if (changes.length === 0) {
    return null;
  }

  return {
    id: currentState.id,
    changes,
    data,
    timestamp: Date.now(),
  };
}

/**
 * Apply a differential update to a base state.
 *
 * @param baseState - The base NPC state
 * @param diff - The differential update to apply
 * @returns Updated NPC state
 */
export function applyDiff(baseState: CryptoNPC, diff: NPCDiff): CryptoNPC {
  const updated = structuredClone(baseState);

  for (const change of diff.changes) {
    const value = diff.data[change as keyof SerializedNPC];
    if (value !== undefined) {
      // Deep merge for nested objects
      const existingValue = (updated as unknown as Record<string, unknown>)[change];
      if (
        typeof value === "object" &&
        value !== null &&
        typeof existingValue === "object" &&
        existingValue !== null &&
        !Array.isArray(value)
      ) {
        (updated as unknown as Record<string, unknown>)[change] = {
          ...structuredClone(existingValue as object),
          ...structuredClone(value as object),
        };
      } else {
        (updated as unknown as Record<string, unknown>)[change] = structuredClone(value);
      }
    }
  }

  return updated;
}

// ============================================================================
// INDEXEDDB STORAGE
// ============================================================================

/**
 * Save data to IndexedDB storage.
 *
 * @param data - The data to save (compressed string)
 * @param key - The storage key
 */
export async function saveToStorage(data: string, key: string): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, data, key);
  } catch (error) {
    throw new NPCPersistenceError(
      `Failed to save to storage: ${error instanceof Error ? error.message : "Unknown error"}`,
      "STORAGE_FAILED"
    );
  }
}

/**
 * Load data from IndexedDB storage.
 *
 * @param key - The storage key
 * @returns The stored data, or null if not found
 */
export async function loadFromStorage(key: string): Promise<string | null> {
  try {
    const db = await getDB();
    const data = await db.get(STORE_NAME, key);
    return data ?? null;
  } catch (error) {
    throw new NPCPersistenceError(
      `Failed to load from storage: ${error instanceof Error ? error.message : "Unknown error"}`,
      "STORAGE_FAILED"
    );
  }
}

// ============================================================================
// VERSION MIGRATION
// ============================================================================

/**
 * Migrate state from one version to another.
 * Applies incremental migrations from oldVersion to newVersion.
 *
 * @param state - The state to migrate
 * @param oldVersion - The current version of the state
 * @param newVersion - The target version
 * @returns Migrated state
 */
export function migrateState(
  state: PersistedState,
  oldVersion: number,
  newVersion: number
): PersistedState {
  if (oldVersion < 0) {
    throw new NPCPersistenceError(
      `Invalid state version: ${oldVersion}`,
      "MIGRATION_FAILED"
    );
  }

  if (oldVersion === newVersion) {
    return state;
  }

  let migrated = structuredClone(state);

  // Apply migrations incrementally
  for (let v = oldVersion; v < newVersion; v++) {
    migrated = applyMigration(migrated, v, v + 1);
  }

  migrated.version = newVersion;
  return migrated;
}

/**
 * Apply a single migration step
 */
function applyMigration(
  state: PersistedState,
  fromVersion: number,
  toVersion: number
): PersistedState {
  // Migration from v0 to v1: Add default values for new fields
  if (fromVersion === 0 && toVersion === 1) {
    return {
      ...state,
      version: 1,
      npcs: state.npcs.map((npc) => ({
        ...npc,
        internalWorld: npc.internalWorld ?? createDefaultInternalWorld(),
        wallet: npc.wallet ?? createDefaultWallet(0),
        finances: npc.finances ?? createDefaultFinances(npc.occupation),
        factionId: npc.factionId ?? null,
        politicalBeliefs:
          npc.politicalBeliefs ?? createDefaultPoliticalBeliefs(),
        learning: npc.learning ?? createDefaultLearning(),
      })),
    };
  }

  // Migration from v1 to v2 (future): Add new fields
  // if (fromVersion === 1 && toVersion === 2) { ... }

  // Default: no changes needed
  return state;
}

// ============================================================================
// STATE VALIDATION
// ============================================================================

/**
 * Validate the state for corruption.
 * Checks for invalid JSON, missing required fields, and type mismatches.
 *
 * @param state - The state to validate
 * @returns ValidationResult with valid flag and error messages
 */
export function validateState(state: unknown): ValidationResult {
  const errors: string[] = [];

  // Check for null/undefined
  if (state === null || state === undefined) {
    return {
      valid: false,
      errors: ["State is null or undefined"],
    };
  }

  // Check if it's an object
  if (typeof state !== "object") {
    return {
      valid: false,
      errors: ["State is not an object"],
    };
  }

  const stateObj = state as Record<string, unknown>;

  // Check version
  if (typeof stateObj.version !== "number") {
    errors.push("Missing or invalid version field");
  }

  // Check npcs array
  if (!Array.isArray(stateObj.npcs)) {
    errors.push("Missing or invalid npcs array");
    return { valid: false, errors };
  }

  // Validate each NPC
  for (let i = 0; i < stateObj.npcs.length; i++) {
    const npc = stateObj.npcs[i] as Record<string, unknown>;
    const npcErrors = validateNPC(npc, i);
    errors.push(...npcErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single NPC
 */
function validateNPC(npc: Record<string, unknown>, index: number): string[] {
  const errors: string[] = [];
  const prefix = `NPC[${index}]`;

  // Required string fields
  const requiredStrings = ["id", "name", "walletAddress"];
  for (const field of requiredStrings) {
    if (typeof npc[field] !== "string") {
      errors.push(`${prefix}: Missing or invalid type for required field '${field}'`);
    }
  }

  // Required number fields
  const requiredNumbers = ["age", "gridX", "gridY"];
  for (const field of requiredNumbers) {
    if (typeof npc[field] !== "number") {
      errors.push(`${prefix}: Missing or invalid type for required field '${field}'`);
    }
  }

  // Validate occupation
  if (!VALID_OCCUPATIONS.includes(npc.occupation as Occupation)) {
    errors.push(`${prefix}: Invalid occupation value '${npc.occupation}'`);
  }

  // Validate spriteType
  if (!VALID_SPRITE_TYPES.includes(npc.spriteType as NPCSpriteType)) {
    errors.push(`${prefix}: Invalid spriteType value '${npc.spriteType}'`);
  }

  // Validate direction
  if (!VALID_DIRECTIONS.includes(npc.direction as NPCDirection)) {
    errors.push(`${prefix}: Invalid direction value '${npc.direction}'`);
  }

  // Validate currentActivity
  if (
    npc.currentActivity !== null &&
    !VALID_ACTIVITIES.includes(npc.currentActivity as NPCActivity)
  ) {
    errors.push(
      `${prefix}: Invalid currentActivity value '${npc.currentActivity}'`
    );
  }

  // Validate needs range
  if (npc.needs && typeof npc.needs === "object") {
    const needs = npc.needs as Record<string, { current?: number }>;
    for (const needType of ["hunger", "energy", "social", "fun", "wealth", "purpose"]) {
      const need = needs[needType];
      if (need && typeof need.current === "number") {
        if (need.current < 0 || need.current > 100) {
          errors.push(
            `${prefix}: needs.${needType}.current out of range (${need.current})`
          );
        }
      }
    }
  }

  // Validate personality range
  if (npc.personality && typeof npc.personality === "object") {
    const personality = npc.personality as Record<
      string,
      Record<string, number>
    >;
    if (personality.bigFive) {
      for (const trait of [
        "openness",
        "conscientiousness",
        "extraversion",
        "agreeableness",
        "neuroticism",
      ]) {
        const value = personality.bigFive[trait];
        if (typeof value === "number" && (value < 0 || value > 1)) {
          errors.push(
            `${prefix}: personality.bigFive.${trait} out of range (${value})`
          );
        }
      }
    }
  }

  return errors;
}

// ============================================================================
// CORRUPTION RECOVERY
// ============================================================================

/**
 * Attempt best-effort recovery from corrupted data.
 * Recovers as many NPCs as possible and provides defaults for missing fields.
 *
 * @param corruptedData - The corrupted state data
 * @returns RecoveryResult with recovered NPCs and statistics
 */
export function recoverFromCorruption(
  corruptedData: unknown
): RecoveryResult {
  const stats: RecoveryStats = {
    totalNPCs: 0,
    recoveredNPCs: 0,
    failedNPCs: 0,
    fieldsFixed: 0,
  };

  // Handle completely invalid input
  if (corruptedData === null || corruptedData === undefined) {
    return {
      version: CURRENT_STATE_VERSION,
      npcs: [],
      recoveryStats: stats,
    };
  }

  // Handle non-object input (e.g., string that's not JSON)
  if (typeof corruptedData === "string") {
    try {
      corruptedData = JSON.parse(corruptedData);
    } catch {
      return {
        version: CURRENT_STATE_VERSION,
        npcs: [],
        recoveryStats: stats,
      };
    }
  }

  if (typeof corruptedData !== "object") {
    return {
      version: CURRENT_STATE_VERSION,
      npcs: [],
      recoveryStats: stats,
    };
  }

  const data = corruptedData as Record<string, unknown>;
  const npcsData = Array.isArray(data.npcs) ? data.npcs : [];
  stats.totalNPCs = npcsData.length;

  const recoveredNPCs: SerializedNPC[] = [];

  for (const npcData of npcsData) {
    const recovered = recoverNPC(npcData, stats);
    if (recovered) {
      recoveredNPCs.push(recovered);
      stats.recoveredNPCs++;
    } else {
      stats.failedNPCs++;
    }
  }

  return {
    version: CURRENT_STATE_VERSION,
    npcs: recoveredNPCs,
    recoveryStats: stats,
  };
}

/**
 * Attempt to recover a single NPC
 */
function recoverNPC(
  data: unknown,
  stats: RecoveryStats
): SerializedNPC | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const npc = data as Record<string, unknown>;

  // Must have at least an ID
  if (!npc.id) {
    return null;
  }

  // Fix and coerce fields
  const recovered: SerializedNPC = {
    id: String(npc.id),
    name: fixStringRequired(npc.name, `NPC_${npc.id}`, stats),
    walletAddress: fixStringRequired(npc.walletAddress, "0x0", stats),
    age: fixNumber(npc.age, 30, 18, 80, stats),
    occupation: fixEnum(
      npc.occupation,
      VALID_OCCUPATIONS,
      "unemployed",
      stats
    ) as Occupation,
    residence: npc.residence === null ? null : fixStringOptional(npc.residence, stats),
    workplace: npc.workplace === null ? null : fixStringOptional(npc.workplace, stats),
    spriteType: fixEnum(
      npc.spriteType,
      VALID_SPRITE_TYPES,
      "apple",
      stats
    ) as NPCSpriteType,
    direction: fixEnum(
      npc.direction,
      VALID_DIRECTIONS,
      "south",
      stats
    ) as NPCDirection,
    gridX: fixNumber(npc.gridX, 0, 0, 999, stats),
    gridY: fixNumber(npc.gridY, 0, 0, 999, stats),
    isInsideBuilding: fixBoolean(npc.isInsideBuilding, false, stats),
    currentBuildingId:
      npc.currentBuildingId === null
        ? null
        : fixStringOptional(npc.currentBuildingId, stats),
    currentActivity: fixEnum(
      npc.currentActivity,
      VALID_ACTIVITIES,
      null,
      stats
    ) as NPCActivity | null,
    needs: fixNeeds(npc.needs, stats),
    memory: fixMemory(npc.memory, stats),
    movement: fixMovement(npc.movement, stats),
    personality: fixPersonality(npc.personality, stats),
    relationships: fixRelationships(npc.relationships, stats),
  };

  // Optional fields
  if (npc.internalWorld) {
    recovered.internalWorld = fixInternalWorld(npc.internalWorld, stats);
  }
  if (npc.wallet) {
    recovered.wallet = fixWallet(npc.wallet, stats);
  }
  if (npc.finances) {
    recovered.finances = fixFinances(npc.finances, recovered.occupation, stats);
  }
  if (npc.factionId !== undefined) {
    recovered.factionId =
      npc.factionId === null ? null : fixStringOptional(npc.factionId, stats);
  }
  if (npc.politicalBeliefs) {
    recovered.politicalBeliefs = fixPoliticalBeliefs(npc.politicalBeliefs, stats);
  }
  if (npc.learning) {
    recovered.learning = fixLearning(npc.learning, stats);
  }
  if (npc.personalityArchetype) {
    recovered.personalityArchetype = npc.personalityArchetype as typeof recovered.personalityArchetype;
  }
  if (npc.ingestedProfile) {
    recovered.ingestedProfile = npc.ingestedProfile as typeof recovered.ingestedProfile;
  }

  return recovered;
}

// ============================================================================
// RECOVERY HELPERS
// ============================================================================

function fixStringRequired(
  value: unknown,
  defaultValue: string,
  stats: RecoveryStats
): string {
  if (typeof value === "string") return value;
  stats.fieldsFixed++;
  return String(value ?? defaultValue);
}

function fixStringOptional(
  value: unknown,
  stats: RecoveryStats
): string | null {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return null;
  stats.fieldsFixed++;
  return String(value);
}

function fixNumber(
  value: unknown,
  defaultValue: number,
  min: number,
  max: number,
  stats: RecoveryStats
): number {
  let num: number;
  if (typeof value === "number") {
    num = value;
  } else if (typeof value === "string") {
    num = parseFloat(value);
    stats.fieldsFixed++;
  } else {
    stats.fieldsFixed++;
    return defaultValue;
  }

  if (isNaN(num)) {
    stats.fieldsFixed++;
    return defaultValue;
  }

  if (num < min || num > max) {
    stats.fieldsFixed++;
    return Math.max(min, Math.min(max, num));
  }

  return num;
}

function fixBoolean(
  value: unknown,
  defaultValue: boolean,
  stats: RecoveryStats
): boolean {
  if (typeof value === "boolean") return value;
  stats.fieldsFixed++;
  return defaultValue;
}

function fixEnum<T>(
  value: unknown,
  validValues: readonly T[],
  defaultValue: T,
  stats: RecoveryStats
): T {
  if (validValues.includes(value as T)) {
    return value as T;
  }
  stats.fieldsFixed++;
  return defaultValue;
}

function fixNeeds(
  value: unknown,
  stats: RecoveryStats
): ReturnType<typeof createDefaultNeeds> {
  if (!value || typeof value !== "object") {
    stats.fieldsFixed++;
    return createDefaultNeeds();
  }

  const needs = createDefaultNeeds();
  const valueObj = value as Record<string, Record<string, unknown>>;

  for (const needType of ["hunger", "energy", "social", "fun", "wealth", "purpose"] as const) {
    if (valueObj[needType] && typeof valueObj[needType] === "object") {
      const needData = valueObj[needType];
      if (typeof needData.current === "number") {
        needs[needType].current = Math.max(0, Math.min(100, needData.current));
        if (needData.current < 0 || needData.current > 100) {
          stats.fieldsFixed++;
        }
      }
    }
  }

  return needs;
}

function fixMemory(
  value: unknown,
  stats: RecoveryStats
): ReturnType<typeof createDefaultMemory> {
  if (!value || typeof value !== "object") {
    stats.fieldsFixed++;
    return createDefaultMemory();
  }

  const valueObj = value as Record<string, unknown>;
  const memory = createDefaultMemory();

  if (Array.isArray(valueObj.episodic)) {
    memory.episodic = valueObj.episodic;
  }
  if (Array.isArray(valueObj.semantic)) {
    memory.semantic = valueObj.semantic;
  }
  if (Array.isArray(valueObj.procedural)) {
    memory.procedural = valueObj.procedural;
  }
  if (valueObj.working && typeof valueObj.working === "object") {
    memory.working = valueObj.working as typeof memory.working;
  }

  return memory;
}

function fixMovement(
  value: unknown,
  stats: RecoveryStats
): ReturnType<typeof createInitialMovement> {
  if (!value || typeof value !== "object") {
    stats.fieldsFixed++;
    return createInitialMovement();
  }

  return value as ReturnType<typeof createInitialMovement>;
}

function fixPersonality(
  value: unknown,
  stats: RecoveryStats
): ReturnType<typeof createDefaultPersonality> {
  if (!value || typeof value !== "object") {
    stats.fieldsFixed++;
    return createDefaultPersonality();
  }

  const valueObj = value as Record<string, Record<string, unknown>>;
  const personality = createDefaultPersonality();

  // Fix bigFive traits
  if (valueObj.bigFive && typeof valueObj.bigFive === "object") {
    for (const trait of [
      "openness",
      "conscientiousness",
      "extraversion",
      "agreeableness",
      "neuroticism",
    ] as const) {
      const traitValue = valueObj.bigFive[trait];
      if (typeof traitValue === "number") {
        if (traitValue < 0 || traitValue > 1) {
          personality.bigFive[trait] = Math.max(0, Math.min(1, traitValue));
          stats.fieldsFixed++;
        } else {
          personality.bigFive[trait] = traitValue;
        }
      }
    }
  }

  // Fix crypto traits
  if (valueObj.crypto && typeof valueObj.crypto === "object") {
    for (const trait of [
      "riskTolerance",
      "fomo",
      "trustInInstitutions",
      "technicalKnowledge",
      "degenLevel",
    ] as const) {
      const traitValue = valueObj.crypto[trait];
      if (typeof traitValue === "number") {
        if (traitValue < 0 || traitValue > 1) {
          personality.crypto[trait] = Math.max(0, Math.min(1, traitValue));
          stats.fieldsFixed++;
        } else {
          personality.crypto[trait] = traitValue;
        }
      }
    }
  }

  return personality;
}

function fixRelationships(
  value: unknown,
  stats: RecoveryStats
): SerializedNPC["relationships"] {
  if (!value || typeof value !== "object") {
    stats.fieldsFixed++;
    return {};
  }
  return value as SerializedNPC["relationships"];
}

function fixInternalWorld(
  value: unknown,
  stats: RecoveryStats
): ReturnType<typeof createDefaultInternalWorld> {
  if (!value || typeof value !== "object") {
    stats.fieldsFixed++;
    return createDefaultInternalWorld();
  }
  return value as ReturnType<typeof createDefaultInternalWorld>;
}

function fixWallet(
  value: unknown,
  stats: RecoveryStats
): ReturnType<typeof createDefaultWallet> {
  if (!value || typeof value !== "object") {
    stats.fieldsFixed++;
    return createDefaultWallet(0);
  }
  return value as ReturnType<typeof createDefaultWallet>;
}

function fixFinances(
  value: unknown,
  occupation: Occupation,
  stats: RecoveryStats
): ReturnType<typeof createDefaultFinances> {
  if (!value || typeof value !== "object") {
    stats.fieldsFixed++;
    return createDefaultFinances(occupation);
  }
  return value as ReturnType<typeof createDefaultFinances>;
}

function fixPoliticalBeliefs(
  value: unknown,
  stats: RecoveryStats
): ReturnType<typeof createDefaultPoliticalBeliefs> {
  if (!value || typeof value !== "object") {
    stats.fieldsFixed++;
    return createDefaultPoliticalBeliefs();
  }
  return value as ReturnType<typeof createDefaultPoliticalBeliefs>;
}

function fixLearning(
  value: unknown,
  stats: RecoveryStats
): ReturnType<typeof createDefaultLearning> {
  if (!value || typeof value !== "object") {
    stats.fieldsFixed++;
    return createDefaultLearning();
  }
  return value as ReturnType<typeof createDefaultLearning>;
}
