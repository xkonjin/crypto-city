/**
 * X/Twitter Profile Ingestion Pipeline
 *
 * The main orchestration module for turning Twitter profiles into Crypto City NPCs.
 * Like a factory assembly line, but instead of cars, we produce digital citizens
 * with questionable investment strategies.
 *
 * The Hitchhiker's Guide notes: "The ingestion pipeline is the closest thing
 * to digital reincarnation - your Twitter presence, distilled into a few
 * personality traits and sardonic dialogue options."
 *
 * Pipeline stages:
 * 1. FETCH: Retrieve profile data from X/Twitter
 * 2. EXTRACT: Analyze personality and generate traits
 * 3. HOUSING: Assign appropriate residence based on archetype
 * 4. WALLET: Create x402 wallet for on-chain transactions
 * 5. SPAWN: Create the NPC entity in the game world
 */

import type { Tile } from '@/types/game';
import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { NPCPersonality, PersonalityArchetype } from '@/lib/npc/personality';
import type { Occupation } from '@/games/isocity/types/npc';
import type {
  XProfile,
  XProfileAdapter,
  XProfileFetchOptions,
  XProfileErrorCode,
} from './XProfileAdapter';
import type { ExtractedTraits, ExtractionOptions } from './PersonalityExtractor';
import { MockXProfileAdapter, getDefaultXProfileAdapter } from './XProfileAdapter';
import { extractPersonalityFromProfile } from './PersonalityExtractor';
import { spawnIngestedNPC, type IngestedProfile } from './spawnIngestedNPC';
import { AvatarQueue } from './avatarQueue';
import IngestedNPCStore, { type PersistedIngestedNPC } from './IngestedNPCStore';
import IngestedEntityStore, { type IngestionRecord } from './IngestedEntityStore';
import { detectEntityType, type EntityType, type EntityTypeResult } from './EntityTypeDetector';
import { generateBuilding, type IngestedBuildingDefinition } from './BuildingGenerator';
import IngestedBuildingStore, { type PersistedIngestedBuilding } from './IngestedBuildingStore';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Current stage of the ingestion pipeline.
 */
export type IngestionStage =
  | 'idle'
  | 'fetching'
  | 'extracting'
  | 'generating_avatar'
  | 'assigning_housing'
  | 'creating_wallet'
  | 'spawning'
  | 'completed'
  | 'failed';

/**
 * Progress update during ingestion.
 */
export interface IngestionProgress {
  stage: IngestionStage;
  progress: number; // 0-100
  message: string;
}

/**
 * Successful ingestion result.
 */
export interface IngestionSuccess {
  success: true;
  npc: CryptoNPC;
  profile: XProfile;
  traits: ExtractedTraits;
  duration: number;
}

/**
 * Failed ingestion result.
 */
export interface IngestionFailure {
  success: false;
  error: string;
  code: IngestionErrorCode;
  stage: IngestionStage;
  duration: number;
}

/**
 * Ingestion result - either success or failure.
 */
export type IngestionResult = IngestionSuccess | IngestionFailure;

/**
 * Error codes for ingestion failures.
 */
export type IngestionErrorCode =
  | XProfileErrorCode
  | 'EXTRACTION_FAILED'
  | 'AVATAR_GENERATION_FAILED'
  | 'HOUSING_ASSIGNMENT_FAILED'
  | 'WALLET_CREATION_FAILED'
  | 'SPAWN_FAILED'
  | 'BUILDING_GENERATION_FAILED'
  | 'RATE_LIMITED'
  | 'DUPLICATE'
  | 'CANCELLED';

/**
 * Options for the ingestion pipeline.
 */
export interface IngestionOptions {
  /** Profile adapter to use (default: auto-detect best available) */
  adapter?: XProfileAdapter;
  /** Options for profile fetching */
  fetchOptions?: XProfileFetchOptions;
  /** Options for personality extraction */
  extractionOptions?: ExtractionOptions;
  /** Whether to generate custom avatar sprite (default: false - uses generic) */
  generateAvatar?: boolean;
  /** Whether to create x402 wallet (default: true) */
  createX402Wallet?: boolean;
  /** Callback for progress updates */
  onProgress?: (progress: IngestionProgress) => void;
  /** Game grid for housing assignment */
  grid?: Tile[][] | null;
  /** Grid size for housing/spawn calculations */
  gridSize?: number;
  /** Force specific spawn position */
  spawnPosition?: { x: number; y: number };
  /** Force entity type (skip auto-detection) */
  forceEntityType?: EntityType;
  /** Whether to generate building for companies (default: true) */
  generateBuilding?: boolean;
  /** How to handle duplicates: 'skip' | 'update' | 'force' */
  duplicateHandling?: 'skip' | 'update' | 'force';
}

/**
 * Preview of what an ingested NPC will look like before spawning.
 */
export interface IngestionPreview {
  username: string;
  displayName: string;
  bio: string;
  profileImageUrl: string;
  archetype: PersonalityArchetype;
  occupation: Occupation;
  dialogueSeeds: string[];
  personality: NPCPersonality;
  confidence: number;
  /** Detected entity type */
  entityType: EntityTypeResult;
  /** Whether this username has already been ingested */
  isDuplicate: boolean;
  /** Existing record if duplicate */
  existingRecord?: IngestionRecord;
}

/**
 * Extended ingestion result for company ingestion (includes building)
 */
export interface CompanyIngestionSuccess extends IngestionSuccess {
  /** Generated building definition */
  building?: IngestedBuildingDefinition;
  /** Entity type detected */
  entityType: EntityType;
}

export type ExtendedIngestionResult = IngestionSuccess | CompanyIngestionSuccess | IngestionFailure;

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Simple rate limiter for ingestion requests.
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getTimeUntilAvailable(): number {
    if (this.canMakeRequest()) return 0;
    const oldest = Math.min(...this.requests);
    return oldest + this.windowMs - Date.now();
  }

  /** Reset the rate limiter - for testing only */
  reset(): void {
    this.requests = [];
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// Avatar generation queue
const avatarQueue = new AvatarQueue();

/**
 * Reset the rate limiter - for testing purposes only.
 * @internal
 */
export function resetRateLimiter(): void {
  rateLimiter.reset();
}

// =============================================================================
// PIPELINE IMPLEMENTATION
// =============================================================================

/**
 * Updates progress and calls the callback if provided.
 */
function updateProgress(
  stage: IngestionStage,
  progress: number,
  message: string,
  onProgress?: (p: IngestionProgress) => void
): void {
  onProgress?.({ stage, progress, message });
}

/**
 * Fetches a profile preview without spawning an NPC.
 * Useful for showing the user what will be created before confirming.
 */
export async function previewIngestion(
  username: string,
  options: IngestionOptions = {}
): Promise<IngestionPreview | { error: string; code: IngestionErrorCode }> {
  const adapter = options.adapter ?? getDefaultXProfileAdapter();

  // Clean username (remove @ if present)
  const cleanUsername = username.replace(/^@/, '').trim();

  // Fetch profile
  const fetchResult = await adapter.fetchProfile(cleanUsername, options.fetchOptions);

  if (!fetchResult.success) {
    return { error: fetchResult.error, code: fetchResult.code };
  }

  const profile = fetchResult.profile;

  // Extract personality
  const traits = await extractPersonalityFromProfile(profile, options.extractionOptions);

  // Detect entity type
  const entityType = options.forceEntityType 
    ? { type: options.forceEntityType, confidence: 1, signals: {} as EntityTypeResult['signals'], reason: 'Forced by user' }
    : detectEntityType(profile);
  
  // Check for duplicates
  const duplicationCheck = await IngestedEntityStore.checkDuplication(cleanUsername);
  
  return {
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    profileImageUrl: profile.profileImageUrl,
    archetype: traits.archetype,
    occupation: traits.occupation,
    dialogueSeeds: traits.dialogueSeeds,
    personality: traits.personality,
    confidence: traits.confidence,
    entityType,
    isDuplicate: duplicationCheck.isDuplicate,
    existingRecord: duplicationCheck.existingRecord,
  };
}

/**
 * Main ingestion pipeline - fetches, extracts, and spawns an NPC from a Twitter profile.
 *
 * @param username - X/Twitter username (with or without @)
 * @param options - Pipeline options
 * @returns IngestionResult with the spawned NPC or error details
 */
export async function ingestXProfile(
  username: string,
  options: IngestionOptions = {}
): Promise<IngestionResult> {
  const startTime = Date.now();
  const adapter = options.adapter ?? getDefaultXProfileAdapter();
  const { onProgress, grid, gridSize = 50 } = options;

  // Clean username
  const cleanUsername = username.replace(/^@/, '').trim();

  // Check rate limit
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = Math.ceil(rateLimiter.getTimeUntilAvailable() / 1000);
    return {
      success: false,
      error: `Rate limited. Please wait ${waitTime} seconds.`,
      code: 'RATE_LIMITED',
      stage: 'idle',
      duration: Date.now() - startTime,
    };
  }

  rateLimiter.recordRequest();

  // Default grid to null if undefined
  const gridValue = grid ?? null;
  
  // Check for duplicates (unless forcing)
  const duplicateHandling = options.duplicateHandling || 'skip';
  if (duplicateHandling !== 'force') {
    const dupeCheck = await IngestedEntityStore.checkDuplication(cleanUsername);
    if (dupeCheck.isDuplicate && duplicateHandling === 'skip') {
      return {
        success: false,
        error: `@${cleanUsername} has already been ingested. Use "force" to regenerate.`,
        code: 'DUPLICATE',
        stage: 'idle',
        duration: Date.now() - startTime,
      };
    }
  }

  try {
    // ==========
    // STAGE 1: FETCH PROFILE
    // ==========
    updateProgress('fetching', 10, `Fetching @${cleanUsername}'s profile...`, onProgress);

    const fetchResult = await adapter.fetchProfile(cleanUsername, options.fetchOptions);

    if (!fetchResult.success) {
      return {
        success: false,
        error: fetchResult.error,
        code: fetchResult.code,
        stage: 'fetching',
        duration: Date.now() - startTime,
      };
    }

    const profile = fetchResult.profile;
    updateProgress('fetching', 25, 'Profile fetched successfully', onProgress);

    // ==========
    // STAGE 2: EXTRACT PERSONALITY
    // ==========
    updateProgress('extracting', 30, 'Analyzing personality from tweets...', onProgress);

    let traits: ExtractedTraits;
    try {
      traits = await extractPersonalityFromProfile(profile, options.extractionOptions);
    } catch (error) {
      return {
        success: false,
        error: `Personality extraction failed: ${error}`,
        code: 'EXTRACTION_FAILED',
        stage: 'extracting',
        duration: Date.now() - startTime,
      };
    }

    updateProgress('extracting', 50, `Detected: ${traits.archetype}`, onProgress);

    // ==========
    // STAGE 3: GENERATE AVATAR (Optional)
    // ==========
    let avatarSpritesheet: string | undefined;
    let avatarSpritesheetImage: HTMLImageElement | undefined;

    if (options.generateAvatar && profile.profileImageUrl) {
      updateProgress('generating_avatar', 55, 'Generating pixel art avatar...', onProgress);

      // Queue avatar generation and wait for completion
      const avatarJob = avatarQueue.enqueue(
        profile.id,
        profile.username,
        profile.profileImageUrl
      );

      // Wait for avatar generation to complete (with timeout)
      const startWait = Date.now();
      const maxWaitMs = 30000; // 30 second timeout
      while (avatarJob.status === 'queued' || avatarJob.status === 'processing') {
        if (Date.now() - startWait > maxWaitMs) {
          console.warn('[Ingestion] Avatar generation timeout, using procedural');
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        const updatedJob = avatarQueue.getJob(avatarJob.id);
        if (updatedJob) {
          if (updatedJob.progress) {
            updateProgress(
              'generating_avatar',
              55 + updatedJob.progress.progress * 0.1,
              updatedJob.progress.message,
              onProgress
            );
          }
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            break;
          }
        }
      }

      const completedJob = avatarQueue.getJob(avatarJob.id);
      if (completedJob?.status === 'completed') {
        avatarSpritesheet = completedJob.outputPath;
        avatarSpritesheetImage = completedJob.spritesheetImage;
      }

      updateProgress('generating_avatar', 65, 'Avatar generated', onProgress);
    }

    // ==========
    // STAGE 4: ASSIGN HOUSING
    // ==========
    updateProgress('assigning_housing', 65, 'Finding suitable residence...', onProgress);

    // Housing is assigned in spawnIngestedNPC based on traits
    // This is just a status update
    updateProgress('assigning_housing', 70, 'Residence selected', onProgress);

    // ==========
    // STAGE 5: CREATE WALLET (Optional)
    // ==========
    let x402WalletAddress: string | undefined;

    if (options.createX402Wallet !== false) {
      updateProgress('creating_wallet', 75, 'Creating x402 wallet...', onProgress);

      // Generate a deterministic wallet address from profile ID
      // In production, this would create an actual on-chain wallet
      x402WalletAddress = `0x${hashString(profile.id).substring(0, 40)}`;

      updateProgress('creating_wallet', 80, 'Wallet created', onProgress);
    }

    // ==========
    // STAGE 6: SPAWN NPC
    // ==========
    updateProgress('spawning', 85, 'Spawning NPC into Crypto City...', onProgress);

    const ingestedProfile: IngestedProfile = {
      profileId: profile.id,
      displayName: profile.displayName,
      avatarSpritesheet,
      avatarSpritesheetImage,
      traits: traits.personality,
      dialogueSeeds: traits.dialogueSeeds,
    };

    let npc: CryptoNPC;
    try {
      npc = spawnIngestedNPC(ingestedProfile, {
        grid: gridValue,
        gridSize,
        spawnX: options.spawnPosition?.x,
        spawnY: options.spawnPosition?.y,
      });

      // Set additional ingested user properties
      npc.isIngestedUser = true;
      npc.xUsername = profile.username;
      npc.personalityArchetype = traits.archetype;
      npc.occupation = traits.occupation;

      if (x402WalletAddress) {
        npc.hasX402Wallet = true;
        npc.x402WalletAddress = x402WalletAddress;
      }
    } catch (error) {
      return {
        success: false,
        error: `NPC spawn failed: ${error}`,
        code: 'SPAWN_FAILED',
        stage: 'spawning',
        duration: Date.now() - startTime,
      };
    }

    // ==========
    // STAGE 7: DETECT ENTITY TYPE & GENERATE BUILDING (if company)
    // ==========
    const entityType = options.forceEntityType || detectEntityType(profile).type;
    let building: IngestedBuildingDefinition | undefined;
    
    // Generate building for companies/protocols if enabled
    const shouldGenerateBuilding = 
      options.generateBuilding !== false && 
      (entityType === 'company' || entityType === 'protocol');
    
    if (shouldGenerateBuilding) {
      updateProgress('spawning', 88, 'Generating company building...', onProgress);
      
      try {
        const buildingResult = await generateBuilding({ profile });
        
        if (buildingResult.success && buildingResult.buildingDefinition) {
          building = buildingResult.buildingDefinition;
          
          // Persist the building
          const persistedBuilding: PersistedIngestedBuilding = {
            buildingId: building.id,
            profileId: profile.id,
            username: profile.username.toLowerCase(),
            name: building.name,
            category: 'ingested',
            footprint: building.footprint,
            icon: building.icon,
            tier: building.crypto.tier,
            chain: building.crypto.chain,
            description: building.crypto.description,
            cost: building.cost,
            effects: building.crypto.effects,
            spriteBase64: buildingResult.spriteBase64 || '',
            spriteBlobUrl: buildingResult.spriteBlobUrl,
            profileImageUrl: profile.profileImageUrl,
            ingestedAt: Date.now(),
            lastUpdatedAt: Date.now(),
            isPlaced: false,
            placementCount: 0,
          };
          await IngestedBuildingStore.save(persistedBuilding);
          
          console.log(`[Ingestion] Generated building: ${building.name}`);
        }
      } catch (buildingError) {
        console.warn('[Ingestion] Building generation failed:', buildingError);
        // Don't fail the whole ingestion if building generation fails
      }
    }

    // ==========
    // STAGE 8: PERSIST TO INDEXEDDB
    // ==========
    updateProgress('completed', 95, 'Saving to database...', onProgress);

    try {
      const persistedNPC: PersistedIngestedNPC = {
        profileId: profile.id,
        username: profile.username.toLowerCase(),
        displayName: profile.displayName,
        profileImageUrl: profile.profileImageUrl,
        avatarSpritesheetBase64: avatarSpritesheet 
          ? IngestedNPCStore.dataUrlToBase64(avatarSpritesheet)
          : undefined,
        archetype: traits.archetype,
        occupation: traits.occupation,
        dialogueSeeds: traits.dialogueSeeds,
        lastPosition: { x: npc.gridX, y: npc.gridY },
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        x402WalletAddress,
      };
      await IngestedNPCStore.save(persistedNPC);
      
      // Save to unified entity registry
      const ingestionRecord: IngestionRecord = {
        username: profile.username.toLowerCase(),
        profileId: profile.id,
        entityType,
        npcId: npc.id,
        buildingId: building?.id,
        ingestedAt: Date.now(),
        lastCheckedAt: Date.now(),
        displayName: profile.displayName,
        profileImageUrl: profile.profileImageUrl,
      };
      await IngestedEntityStore.save(ingestionRecord);
    } catch (persistError) {
      console.warn('[Ingestion] Failed to persist NPC:', persistError);
      // Don't fail the whole ingestion if persistence fails
    }

    const completionMessage = building 
      ? `@${cleanUsername} is now a citizen with ${building.name}!`
      : `@${cleanUsername} is now a citizen!`;
    updateProgress('completed', 100, completionMessage, onProgress);

    // Return extended result for companies
    if (building) {
      return {
        success: true,
        npc,
        profile,
        traits,
        duration: Date.now() - startTime,
        building,
        entityType,
      } as CompanyIngestionSuccess;
    }

    return {
      success: true,
      npc,
      profile,
      traits,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error}`,
      code: 'SPAWN_FAILED',
      stage: 'failed',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Simple string hashing for deterministic wallet address generation.
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and pad
  const hex = Math.abs(hash).toString(16);
  return hex.padStart(40, '0').repeat(2).substring(0, 40);
}

// =============================================================================
// BATCH INGESTION
// =============================================================================

/**
 * Options for batch ingestion.
 */
export interface BatchIngestionOptions extends IngestionOptions {
  /** Delay between ingestions in ms (default: 2000) */
  delayBetween?: number;
  /** Maximum concurrent ingestions (default: 1) */
  concurrency?: number;
  /** Callback when each ingestion completes */
  onEachComplete?: (
    username: string,
    result: IngestionResult,
    index: number,
    total: number
  ) => void;
}

/**
 * Batch ingestion result.
 */
export interface BatchIngestionResult {
  successful: Array<{ username: string; npc: CryptoNPC }>;
  failed: Array<{ username: string; error: string }>;
  totalDuration: number;
}

/**
 * Ingest multiple Twitter profiles in sequence.
 * Useful for populating a city with Crypto Twitter personalities.
 */
export async function batchIngestXProfiles(
  usernames: string[],
  options: BatchIngestionOptions = {}
): Promise<BatchIngestionResult> {
  const startTime = Date.now();
  const { delayBetween = 2000, onEachComplete } = options;

  const successful: Array<{ username: string; npc: CryptoNPC }> = [];
  const failed: Array<{ username: string; error: string }> = [];

  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];

    // Delay between requests (except first)
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetween));
    }

    const result = await ingestXProfile(username, options);

    if (result.success) {
      successful.push({ username, npc: result.npc });
    } else {
      failed.push({ username, error: result.error });
    }

    onEachComplete?.(username, result, i, usernames.length);
  }

  return {
    successful,
    failed,
    totalDuration: Date.now() - startTime,
  };
}

// =============================================================================
// CURATED CRYPTO TWITTER LIST
// =============================================================================

/**
 * Curated list of notable Crypto Twitter personalities.
 * For demo/testing purposes - these would create interesting NPCs.
 */
export const CURATED_CT_PROFILES = [
  // Note: These are illustrative examples for the mock adapter
  'cobie',
  'vitalikbuterin',
  'cz_binance',
  'SBF_FTX', // For historical drama
  'hasufl',
  'AutismCapital',
  'DegenSpartan',
  'CryptoCobain',
  'inversebrah',
  'zaborow',
] as const;

/**
 * Ingests a curated selection of Crypto Twitter profiles.
 * Great for demo cities or testing the system.
 */
export async function ingestCuratedCTProfiles(
  options: BatchIngestionOptions = {}
): Promise<BatchIngestionResult> {
  // Use mock adapter for curated list to avoid rate limits
  const mockOptions = {
    ...options,
    adapter: MockXProfileAdapter,
  };

  return batchIngestXProfiles([...CURATED_CT_PROFILES], mockOptions);
}

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

export { detectEntityType, isKnownProtocol, suggestBuildingCategory } from './EntityTypeDetector';
export type { EntityType, EntityTypeResult } from './EntityTypeDetector';

export { generateBuilding } from './BuildingGenerator';
export type { IngestedBuildingDefinition, BuildingGenerationResult } from './BuildingGenerator';

export { default as IngestedEntityStore } from './IngestedEntityStore';
export type { IngestionRecord, DuplicationCheckResult } from './IngestedEntityStore';

export { default as IngestedBuildingStore } from './IngestedBuildingStore';
export type { PersistedIngestedBuilding } from './IngestedBuildingStore';
