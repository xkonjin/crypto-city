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
  | 'RATE_LIMITED'
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
}

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

    if (options.generateAvatar) {
      updateProgress('generating_avatar', 55, 'Queuing avatar generation...', onProgress);

      // Queue avatar generation (async, don't wait)
      const avatarJob = avatarQueue.enqueue(profile.id);
      avatarSpritesheet = avatarJob.outputPath;

      updateProgress('generating_avatar', 60, 'Avatar queued for generation', onProgress);
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

    updateProgress('completed', 100, `@${cleanUsername} is now a citizen!`, onProgress);

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
