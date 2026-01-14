/**
 * NPCSimulation - The Brain of the NPC System
 *
 * Main simulation loop that orchestrates all NPC systems together.
 * This is the master controller for the AI Living City, handling:
 * - Game time management
 * - NPC update cycles with Level of Detail (LOD)
 * - Needs, schedules, movement, interactions
 * - Daily cycles with memory/relationship decay
 * - Event emission for UI updates
 *
 * "The city never sleeps, but the simulation occasionally needs a coffee break."
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { NeedType } from './needs';
import type { ScheduledActivity } from './schedule';

import { NPCManager } from './NPCManager';
import { NeedsManager, type UrgentNeedResult } from './NeedsManager';
import { ScheduleManager } from './ScheduleManager';
import { MovementManager, movementManager } from './movement';
import { MemoryManager } from './MemoryManager';
import { MoodManager } from './MoodManager';
import { RelationshipManager } from './RelationshipManager';
import { InteractionManager } from './InteractionManager';
import { EconomyManager } from './EconomyManager';
import { FactionManager } from './FactionManager';
import { ConflictManager } from './ConflictManager';
import { LearningManager } from './LearningManager';
import { thoughtEngine, type ThoughtContext } from './ThoughtEngine';

// X402 Economy imports
import {
  serviceExchange,
  giftSystem,
  getNPCWalletManager,
  ensureNPCHasWallet,
  ensureNPCHasServices,
  processNPCEconomyTick,
  DEFAULT_ECONOMY_OPTIONS,
  type EconomyTickResult,
} from './x402';

// Disaster imports
import {
  processNPCDisasterReaction,
  applyReactionToNPC,
  type NPCDisasterReaction,
} from '@/lib/disasters/npcReactions';
import { playerDisasterManager } from '@/lib/disasters/DisasterManager';
import type { ActivePlayerDisaster } from '@/lib/disasters/types';

// Titan imports
import { TitanManager } from '@/lib/titan';
import { updateTitanNeeds } from '@/lib/titan/TitanNeeds';
import { decayAlignment, getAlignmentState } from '@/lib/titan/TitanAlignment';
import type { TitanPet, AlignmentState } from '@/games/isocity/types/titan';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Configuration for the simulation engine
 */
export interface SimulationConfig {
  /** Real-time milliseconds between ticks */
  tickIntervalMs: number;
  /** Game minutes that pass per tick */
  gameMinutesPerTick: number;
  /** Maximum number of NPCs in the simulation */
  maxNPCs: number;
  /** Whether LLM integration is enabled for dialogue */
  enableLLM: boolean;
  /** Whether Level of Detail optimization is enabled */
  lodEnabled: boolean;
  /** Whether X402 economy is enabled for NPC transactions */
  x402Enabled: boolean;
  /** Initial balance for NPC X402 wallets (in USDT micro units) */
  x402InitialBalance: bigint;
  /** Whether disaster reactions are enabled */
  disasterReactionsEnabled: boolean;
}

/**
 * Current state of the simulation
 */
export interface SimulationState {
  /** Whether the simulation is currently running */
  isRunning: boolean;
  /** Current game time in minutes since midnight (0-1439) */
  currentGameTime: number;
  /** Current game day (starts at 1) */
  currentGameDay: number;
  /** Total number of ticks since simulation started */
  tickCount: number;
}

/**
 * Event emitted when something significant happens to an NPC or Titan
 */
export interface NPCEvent {
  /** Type of event */
  type: 
    | 'spawn' 
    | 'despawn' 
    | 'interaction' 
    | 'trade' 
    | 'conflict' 
    | 'level_up' 
    | 'mood_change' 
    | 'titan_action' 
    | 'titan_level_up' 
    | 'titan_alignment_change'
    | 'service_exchange'   // X402: NPC received a service from another NPC
    | 'gift_given'         // X402: NPC gave a gift to another NPC
    | 'disaster_reaction'; // Disaster: NPC reacted to a disaster
  /** ID of the NPC or Titan involved */
  npcId: string;
  /** Additional event-specific data */
  data: unknown;
  /** When the event occurred */
  timestamp: number;
}

/**
 * Level of Detail levels for NPC updates
 */
export type NPCLODLevel = 'full' | 'high' | 'medium' | 'low' | 'minimal';

/**
 * Camera position for LOD calculations
 */
interface CameraPosition {
  x: number;
  y: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default configuration values
 */
export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  tickIntervalMs: 100,
  gameMinutesPerTick: 1,
  maxNPCs: 100,
  enableLLM: false,
  lodEnabled: true,
  x402Enabled: true,
  x402InitialBalance: BigInt(5_000_000), // $5 USDT in micro units
  disasterReactionsEnabled: true,
};

/**
 * Update frequency based on LOD level
 * Lower number = more frequent updates
 */
export const LOD_UPDATE_FREQUENCY: Record<NPCLODLevel, number> = {
  full: 1,      // Every tick
  high: 2,      // Every 2 ticks
  medium: 5,    // Every 5 ticks
  low: 20,      // Every 20 ticks
  minimal: 100, // Every 100 ticks (statistical)
};

/**
 * Default starting time: 8:00 AM
 */
const DEFAULT_START_TIME = 8 * 60; // 480 minutes

/**
 * Working hours: 9 AM to 5 PM
 */
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;

/**
 * Daytime: 6 AM to 8 PM
 */
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 20;

/**
 * Minutes in a day
 */
const MINUTES_PER_DAY = 24 * 60; // 1440

// =============================================================================
// NPC SIMULATION CLASS
// =============================================================================

/**
 * NPCSimulation - Main simulation engine
 */
export class NPCSimulation {
  private config: SimulationConfig;
  private state: SimulationState;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private cameraPosition: CameraPosition = { x: 0, y: 0 };

  // Managers (some are singletons, some are instantiated)
  private needsManager: NeedsManager;
  private movementManager: MovementManager;
  private memoryManager: MemoryManager;
  private moodManager: MoodManager;
  private relationshipManager: RelationshipManager;
  private interactionManager: InteractionManager;
  private economyManager: EconomyManager;
  private factionManager: FactionManager;
  private conflictManager: ConflictManager;
  private learningManager: LearningManager;

  // Active disaster tracking
  private activeDisaster: ActivePlayerDisaster | null = null;
  private processedDisasterNPCs: Set<string> = new Set();

  // Event callbacks
  public onTick: ((state: SimulationState) => void) | null = null;
  public onDayChange: ((day: number) => void) | null = null;
  public onNPCEvent: ((event: NPCEvent) => void) | null = null;

  /**
   * Create a new NPC simulation
   *
   * @param config - Partial configuration (merged with defaults)
   */
  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_SIMULATION_CONFIG, ...config };

    this.state = {
      isRunning: false,
      currentGameTime: DEFAULT_START_TIME,
      currentGameDay: 1,
      tickCount: 0,
    };

    // Initialize managers
    this.needsManager = new NeedsManager();
    this.movementManager = movementManager;
    this.memoryManager = new MemoryManager();
    this.moodManager = new MoodManager();
    this.relationshipManager = new RelationshipManager();
    this.interactionManager = new InteractionManager();
    this.economyManager = new EconomyManager();
    this.factionManager = new FactionManager();
    this.conflictManager = new ConflictManager();
    this.learningManager = new LearningManager();
  }

  // ===========================================================================
  // LIFECYCLE METHODS
  // ===========================================================================

  /**
   * Start the simulation loop
   */
  start(): void {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.config.tickIntervalMs);
  }

  /**
   * Stop the simulation and reset state
   */
  stop(): void {
    this.state.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Pause the simulation (preserves state)
   */
  pause(): void {
    this.state.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Resume a paused simulation
   */
  resume(): void {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.config.tickIntervalMs);
  }

  // ===========================================================================
  // MAIN SIMULATION LOOP
  // ===========================================================================

  /**
   * Execute one simulation tick
   */
  tick(): void {
    const deltaMinutes = this.config.gameMinutesPerTick;
    this.state.currentGameTime += deltaMinutes;
    this.state.tickCount++;

    // Handle day rollover
    if (this.state.currentGameTime >= MINUTES_PER_DAY) {
      this.state.currentGameTime -= MINUTES_PER_DAY;
      this.advanceDay();
    }

    // Check for active disasters
    if (this.config.disasterReactionsEnabled) {
      this.checkForActiveDisaster();
    }

    // Update each NPC
    const allNPCs = NPCManager.getAllNPCs();
    for (const npc of allNPCs) {
      // Check LOD for this NPC
      if (this.config.lodEnabled) {
        const lod = this.calculateLOD(npc, this.cameraPosition);
        const updateFrequency = LOD_UPDATE_FREQUENCY[lod];

        // Skip update if not this NPC's turn based on LOD
        if (this.state.tickCount % updateFrequency !== 0) {
          continue;
        }
      }

      this.updateNPC(npc, deltaMinutes);
    }

    // Update Titan if exists
    const titan = TitanManager.getTitan();
    if (titan) {
      this.updateTitan(titan, deltaMinutes);
    }

    // Periodic updates (not every tick)
    if (this.state.tickCount % 10 === 0) {
      this.processInteractions();
      this.updateRelationships();
    }

    // X402 Economy tick - process autonomous economic behavior
    // Run every 30 ticks (~3 seconds) to allow economic activity without being overwhelming
    if (this.config.x402Enabled && this.state.tickCount % 30 === 0) {
      this.processX402Economy(allNPCs);
    }

    if (this.state.tickCount % 60 === 0) {
      this.updateFactions();
      this.processConflicts();
    }

    // Emit tick callback
    this.onTick?.(this.state);
  }

  /**
   * Update a single NPC for this tick
   *
   * @param npc - The NPC to update
   * @param deltaMinutes - Game minutes elapsed this tick
   */
  updateNPC(npc: CryptoNPC, deltaMinutes: number): void {
    // 0. Initialize X402 wallet if enabled and not yet done
    // "A wallet in crypto is like a towel in the galaxy - never leave home without it."
    if (this.config.x402Enabled && !npc.hasX402Wallet) {
      this.initializeNPCX402(npc);
    }

    // 1. Check if disaster override applies
    // Disasters override normal behavior - when the sky is falling, you don't check your portfolio
    if (this.activeDisaster && this.config.disasterReactionsEnabled) {
      if (!this.processedDisasterNPCs.has(npc.id)) {
        this.handleDisasterForNPC(npc);
        return; // Skip normal update during disaster reaction
      }
    }

    // 2. Update needs (decay)
    npc.needs = this.needsManager.updateNeeds(npc.needs, deltaMinutes);

    // 3. Check schedule
    const scheduledActivity = ScheduleManager.getCurrentActivity(
      {
        id: npc.id,
        occupation: npc.occupation,
        needs: {
          hunger: 100 - npc.needs.hunger.current,
          energy: 100 - npc.needs.energy.current,
          social: 100 - npc.needs.social.current,
          fun: 100 - npc.needs.fun.current,
        },
        homePosition: npc.residence ? { x: npc.gridX, y: npc.gridY } : undefined,
        workPosition: npc.workplace ? { x: npc.gridX, y: npc.gridY } : undefined,
      },
      this.getGameHour()
    );

    // 4. Check for urgent needs override
    const urgentNeed = this.needsManager.getMostUrgentNeed(npc.needs);
    const shouldOverride =
      urgentNeed && urgentNeed.need.current < urgentNeed.need.criticalThreshold;

    // 5. Decide what to do
    if (shouldOverride) {
      this.handleUrgentNeed(npc, urgentNeed);
    } else if (scheduledActivity) {
      this.followSchedule(npc, scheduledActivity);
    } else {
      this.doIdleActivity(npc);
    }

    // 6. Update movement
    this.movementManager.update(npc, deltaMinutes / 60); // Convert to seconds

    // 7. Update mood
    this.moodManager.decayMoodIntensity(npc, deltaMinutes);

    // 8. Process interactions if near other NPCs and should interact
    if (this.interactionManager.shouldInitiateInteraction(npc)) {
      const nearbyNPCs = this.getNearbyNPCs(npc, 3); // Within 3 tiles
      if (nearbyNPCs.length > 0) {
        const target = this.interactionManager.selectInteractionTarget(npc, nearbyNPCs);
        if (target) {
          this.processInteraction(npc, target);
        }
      }
    }

    // 9. Update thought stream every 10 ticks
    // "The unexamined NPC life is not worth simulating." — Socrates, probably
    if (this.state.tickCount % 10 === 0) {
      this.updateThoughtStream(npc);
    }
  }

  /**
   * Handle an urgent need that overrides the schedule
   */
  private handleUrgentNeed(npc: CryptoNPC, urgentNeed: UrgentNeedResult): void {
    // Set activity based on urgent need
    switch (urgentNeed.name) {
      case 'hunger':
        npc.currentActivity = 'eating';
        // Satisfy need partially (eating takes time)
        npc.needs = this.needsManager.satisfyNeed(npc.needs, 'hunger', 5);
        break;
      case 'energy':
        npc.currentActivity = 'sleeping';
        npc.needs = this.needsManager.satisfyNeed(npc.needs, 'energy', 3);
        break;
      case 'social':
        npc.currentActivity = 'socializing';
        // Social need satisfied through interactions
        break;
      case 'fun':
        npc.currentActivity = 'idle'; // Leisure activity
        npc.needs = this.needsManager.satisfyNeed(npc.needs, 'fun', 2);
        break;
      case 'wealth':
        npc.currentActivity = 'working';
        // Wealth satisfied through work/trading
        break;
      case 'purpose':
        npc.currentActivity = 'working';
        npc.needs = this.needsManager.satisfyNeed(npc.needs, 'purpose', 1);
        break;
    }
  }

  /**
   * Follow the scheduled activity
   */
  private followSchedule(npc: CryptoNPC, activity: ScheduledActivity): void {
    // Map schedule activity to NPC activity
    switch (activity.activity) {
      case 'sleeping':
      case 'waking_up':
        npc.currentActivity = 'sleeping';
        break;
      case 'working':
        npc.currentActivity = 'working';
        // Add purpose and wealth gains from working
        npc.needs = this.needsManager.satisfyNeed(npc.needs, 'purpose', 0.5);
        npc.needs = this.needsManager.satisfyNeed(npc.needs, 'wealth', 0.3);
        break;
      case 'breakfast':
      case 'lunch':
      case 'dinner':
        npc.currentActivity = 'eating';
        npc.needs = this.needsManager.satisfyNeed(npc.needs, 'hunger', 3);
        break;
      case 'commute':
        npc.currentActivity = 'walking';
        break;
      case 'leisure':
        npc.currentActivity = 'idle';
        npc.needs = this.needsManager.satisfyNeed(npc.needs, 'fun', 1);
        break;
      case 'socializing':
        npc.currentActivity = 'socializing';
        break;
      default:
        npc.currentActivity = 'idle';
    }
  }

  /**
   * Default idle behavior when no schedule or urgent need
   */
  private doIdleActivity(npc: CryptoNPC): void {
    npc.currentActivity = 'idle';
    // Slight fun gain from idle time
    npc.needs = this.needsManager.satisfyNeed(npc.needs, 'fun', 0.1);
  }

  // ===========================================================================
  // TITAN METHODS
  // ===========================================================================

  /**
   * Update the Titan for this tick
   *
   * @param titan - The Titan to update
   * @param deltaMinutes - Game minutes elapsed this tick
   */
  private updateTitan(titan: TitanPet, deltaMinutes: number): void {
    // Store previous alignment state for event emission
    const previousAlignment = titan.alignment;
    const previousState = getAlignmentState(previousAlignment);

    // 1. Update needs (decay)
    titan.needs = updateTitanNeeds(titan.needs, deltaMinutes);

    // 2. Update alignment (decay toward neutral)
    titan.alignment = decayAlignment(titan.alignment, deltaMinutes);

    // 3. Update appearance based on alignment
    const newState = getAlignmentState(titan.alignment);
    if (newState !== previousState) {
      titan.currentAppearance = newState;
      // Emit alignment change event
      this.emitNPCEvent({
        type: 'titan_alignment_change',
        npcId: titan.id,
        data: {
          oldAlignment: previousAlignment,
          newAlignment: titan.alignment,
          oldState: previousState,
          newState,
        },
        timestamp: Date.now(),
      });
    }

    // 4. Check for nearby NPCs for potential interactions
    const nearbyNPCs = this.getTitanNearbyNPCs(titan, 3);
    if (nearbyNPCs.length > 0) {
      // Titan might interact with NPCs based on its current state
      // This is a placeholder for more complex Titan AI behavior
      // For now, just satisfy social need slightly if NPCs are nearby
      if (titan.needs.social.current < 80) {
        titan.needs.social.current = Math.min(
          titan.needs.social.max,
          titan.needs.social.current + 0.5
        );
      }
    }

    // 5. Update Titan age
    titan.age += deltaMinutes / 1440; // 1440 minutes = 1 day

    // 6. Update movement if Titan is moving
    // (Movement handled by movement manager if integrated)
    // For now, Titan position updates are handled via TitanManager.updateTitanPosition

    // Note: LOD for Titan is handled in calculateTitanLOD - Titan always gets
    // at least 'medium' LOD to ensure it's always updated reasonably
  }

  /**
   * Get NPCs within a certain distance of the Titan
   *
   * @param titan - The Titan
   * @param maxDistance - Maximum distance in tiles
   * @returns Array of nearby NPCs
   */
  getTitanNearbyNPCs(titan: TitanPet, maxDistance: number): CryptoNPC[] {
    const allNPCs = NPCManager.getAllNPCs();

    return allNPCs.filter((npc) => {
      const distance = Math.sqrt(
        Math.pow(npc.gridX - titan.gridX, 2) + Math.pow(npc.gridY - titan.gridY, 2)
      );
      return distance <= maxDistance;
    });
  }

  /**
   * Calculate the LOD level for the Titan
   * Titan always gets at least 'medium' LOD even when far from camera
   *
   * @param titan - The Titan
   * @returns The LOD level (at least 'medium')
   */
  calculateTitanLOD(titan: TitanPet): NPCLODLevel {
    const distance = Math.sqrt(
      Math.pow(titan.gridX - this.cameraPosition.x, 2) +
        Math.pow(titan.gridY - this.cameraPosition.y, 2)
    );

    // Regular LOD calculation
    if (distance < 5) return 'full';
    if (distance < 15) return 'high';
    // Titan minimum is 'medium' - never goes lower
    return 'medium';
  }

  /**
   * Process an interaction between two NPCs
   */
  private processInteraction(initiator: CryptoNPC, target: CryptoNPC): void {
    const interactionType = this.interactionManager.selectInteractionType(initiator, target);

    const request = {
      initiatorId: initiator.id,
      targetId: target.id,
      type: interactionType,
      context: `At position (${initiator.gridX}, ${initiator.gridY})`,
    };

    const result = this.interactionManager.processInteraction(request, initiator, target);

    // Apply effects
    this.interactionManager.applyInteractionEffects(result, initiator, target);

    // Add memories
    for (const memory of result.memoriesCreated) {
      this.memoryManager.addEpisodicMemory(initiator, {
        event: memory,
        participants: [initiator.id, target.id],
        location: { x: initiator.gridX, y: initiator.gridY },
        timestamp: Date.now(),
        importance: result.success ? 4 : 3,
        emotionalValence: result.success ? 0.3 : -0.2,
      });
    }

    // Emit interaction event
    this.emitNPCEvent({
      type: 'interaction',
      npcId: initiator.id,
      data: {
        targetId: target.id,
        interactionType,
        success: result.success,
      },
      timestamp: Date.now(),
    });

    // Update learning preferences
    this.learningManager.updateActionPreference(
      initiator as CryptoNPC & { learning: NonNullable<CryptoNPC['learning']> },
      interactionType,
      result.success ? 'success' : 'failure'
    );
  }

  /**
   * Process pending interactions (called every 10 ticks)
   */
  private processInteractions(): void {
    // This is a stub - more complex interaction logic could go here
    // For now, individual interactions are handled in updateNPC
  }

  /**
   * Update relationships (called every 10 ticks)
   */
  private updateRelationships(): void {
    // Minor relationship decay over time
    // Full decay happens daily
  }

  /**
   * Update factions (called every 60 ticks)
   */
  private updateFactions(): void {
    // Process faction-level updates
    for (const faction of this.factionManager.getAllFactions()) {
      // Check for faction events, elections, etc.
    }
  }

  /**
   * Process conflicts (called every 60 ticks)
   */
  private processConflicts(): void {
    // De-escalate cooling conflicts
    for (const npc of NPCManager.getAllNPCs()) {
      const conflicts = this.conflictManager.getConflictsForNPC(npc.id);
      for (const conflict of conflicts) {
        if (conflict.status === 'cooled') {
          this.conflictManager.deescalateConflict(conflict.id, 1);
        }
      }
    }
  }

  // ===========================================================================
  // THOUGHT STREAM
  // ===========================================================================

  /**
   * Update an NPC's thought stream based on their current context.
   * Generates new thoughts using the ThoughtEngine and updates the NPC's internal state.
   *
   * @param npc - The NPC to update thoughts for
   */
  private updateThoughtStream(npc: CryptoNPC): void {
    // Initialize thought stream if not present
    if (!npc.thoughtStream) {
      npc.thoughtStream = thoughtEngine.createDefaultThoughtStream();
    }

    // Build thought context from current simulation state
    const nearbyNPCs = this.getNearbyNPCs(npc, 5);
    const context: ThoughtContext = {
      nearbyNPCs,
      marketCondition: this.getCurrentMarketCondition(),
      timeOfDay: this.getTimeOfDay(),
      recentEvents: [], // Could be populated from event log
      gameDay: this.state.currentGameDay,
    };

    // Update the thought stream
    npc.thoughtStream = thoughtEngine.updateThoughtStream(npc, context, npc.thoughtStream);
  }

  /**
   * Get the current market condition based on crypto economy state.
   * Returns 'bull' | 'bear' | 'crab' | 'volatile'
   */
  private getCurrentMarketCondition(): 'bull' | 'bear' | 'crab' | 'volatile' {
    // Placeholder - could integrate with CryptoEconomyManager
    // For now, return a semi-random condition based on game day
    const day = this.state.currentGameDay;
    if (day % 7 < 2) return 'bull';
    if (day % 7 < 4) return 'crab';
    if (day % 7 < 6) return 'bear';
    return 'volatile';
  }

  /**
   * Get the time of day category based on game hour.
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = this.getGameHour();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  // ===========================================================================
  // X402 ECONOMY INTEGRATION
  // ===========================================================================

  /**
   * Initialize X402 wallet and services for an NPC.
   * Called when an NPC is first updated and doesn't have a wallet yet.
   * 
   * "In the beginning, there was the wallet. And the wallet was good.
   * And then came the gas fees, and things got complicated."
   * 
   * @param npc - The NPC to initialize
   */
  private initializeNPCX402(npc: CryptoNPC): void {
    // Create wallet and fund with initial balance
    ensureNPCHasWallet(npc);
    ensureNPCHasServices(npc);
    
    // Set initial balance from config
    const walletManager = getNPCWalletManager();
    walletManager.setSimulatedBalance(npc.id, this.config.x402InitialBalance);
  }

  /**
   * Process autonomous X402 economic behavior for all NPCs.
   * NPCs will seek services when needs are low and occasionally give gifts to friends.
   * 
   * "The economy, much like the universe, is vast and mysterious.
   * Unlike the universe, it's also occasionally profitable."
   * 
   * @param allNPCs - All NPCs in the simulation
   */
  private async processX402Economy(allNPCs: CryptoNPC[]): Promise<void> {
    // Process a subset of NPCs each tick to spread the load
    const npcCount = allNPCs.length;
    const processIndex = this.state.tickCount % Math.max(1, Math.floor(npcCount / 3));
    const npcToProcess = allNPCs[processIndex % npcCount];
    
    if (!npcToProcess || !npcToProcess.hasX402Wallet) return;

    try {
      const result = await processNPCEconomyTick(
        npcToProcess,
        allNPCs,
        this.state.currentGameDay,
        DEFAULT_ECONOMY_OPTIONS
      );

      if (result.hadActivity) {
        this.handleX402EconomyResult(npcToProcess, result);
      }
    } catch (error) {
      // Silently handle errors - economy operations shouldn't crash the simulation
      console.debug('X402 economy tick error:', error);
    }
  }

  /**
   * Handle the result of an X402 economy tick and emit appropriate events.
   * 
   * @param npc - The NPC that performed the action
   * @param result - The result of the economy tick
   */
  private handleX402EconomyResult(npc: CryptoNPC, result: EconomyTickResult): void {
    // Emit service exchange event
    if (result.serviceResult) {
      this.emitNPCEvent({
        type: 'service_exchange',
        npcId: npc.id,
        data: {
          providerId: result.serviceResult.providerId,
          serviceName: result.serviceResult.serviceName,
          needsSatisfied: result.serviceResult.needsSatisfied,
        },
        timestamp: Date.now(),
      });
    }

    // Emit gift given event
    if (result.giftResult) {
      this.emitNPCEvent({
        type: 'gift_given',
        npcId: npc.id,
        data: {
          receiverId: result.giftResult.receiverId,
          itemName: result.giftResult.itemName,
          reaction: result.giftResult.reaction,
        },
        timestamp: Date.now(),
      });
    }

    // Emit item purchase as trade event
    if (result.itemResult) {
      this.emitNPCEvent({
        type: 'trade',
        npcId: npc.id,
        data: {
          sellerId: result.itemResult.sellerId,
          itemName: result.itemResult.itemName,
          needsSatisfied: result.itemResult.needsSatisfied,
        },
        timestamp: Date.now(),
      });
    }
  }

  // ===========================================================================
  // DISASTER REACTION INTEGRATION
  // ===========================================================================

  /**
   * Check for active disasters and update tracking state.
   * When a new disaster starts, reset the processed NPCs set.
   * When a disaster ends, clear the tracking state.
   */
  private checkForActiveDisaster(): void {
    const activeDisasters = playerDisasterManager.getActiveDisasters();
    const currentDisaster = activeDisasters.length > 0 ? activeDisasters[0] : null;
    
    if (currentDisaster && !this.activeDisaster) {
      // New disaster started
      this.activeDisaster = currentDisaster;
      this.processedDisasterNPCs.clear();
    } else if (!currentDisaster && this.activeDisaster) {
      // Disaster ended
      this.activeDisaster = null;
      this.processedDisasterNPCs.clear();
    }
  }

  /**
   * Handle disaster reaction for a single NPC.
   * Processes the NPC's response to the active disaster and emits events.
   * 
   * "Panic is merely a natural response to unnatural circumstances.
   * In crypto, unnatural circumstances are Tuesday."
   * 
   * @param npc - The NPC to process disaster reaction for
   */
  private handleDisasterForNPC(npc: CryptoNPC): void {
    if (!this.activeDisaster) return;

    // Generate reaction based on NPC personality and disaster type
    const reaction = processNPCDisasterReaction(npc, this.activeDisaster);
    
    // Apply reaction to NPC (updates mood, thought, activity, creates memory)
    applyReactionToNPC(npc, reaction);
    
    // Mark as processed for this disaster
    this.processedDisasterNPCs.add(npc.id);

    // Emit disaster reaction event for UI
    this.emitNPCEvent({
      type: 'disaster_reaction',
      npcId: npc.id,
      data: {
        disasterId: this.activeDisaster.disaster.id,
        disasterName: this.activeDisaster.disaster.name,
        intensity: reaction.intensity,
        behavior: reaction.behavior,
        thought: reaction.thought,
        mood: reaction.mood.type,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Get the active disaster if any.
   * Useful for external systems to check disaster state.
   */
  getActiveDisaster(): ActivePlayerDisaster | null {
    return this.activeDisaster;
  }

  /**
   * Set an active disaster manually (for testing purposes).
   * 
   * @param disaster - The disaster to set as active
   */
  setActiveDisaster(disaster: ActivePlayerDisaster | null): void {
    if (disaster && !this.activeDisaster) {
      this.activeDisaster = disaster;
      this.processedDisasterNPCs.clear();
    } else if (!disaster) {
      this.activeDisaster = null;
      this.processedDisasterNPCs.clear();
    }
  }

  // ===========================================================================
  // DAILY CYCLE
  // ===========================================================================

  /**
   * Advance to the next day
   */
  advanceDay(): void {
    this.state.currentGameDay++;

    for (const npc of NPCManager.getAllNPCs()) {
      // Pay salary
      if (npc.wallet && npc.finances) {
        this.economyManager.payDay(npc);
      }

      // Pay expenses
      if (npc.wallet && npc.finances) {
        this.economyManager.payExpenses(npc);
      }

      // Decay memories
      this.memoryManager.decayMemories(npc, 1);

      // Decay relationships slightly
      this.relationshipManager.decayRelationships(npc, 1);

      // Decay unused skills
      if (npc.learning) {
        this.learningManager.decayUnusedSkills(
          npc as CryptoNPC & { learning: NonNullable<CryptoNPC['learning']> },
          1
        );
      }

      // Collect faction taxes
      if (npc.factionId && npc.finances) {
        const income = this.economyManager.calculateDailyIncome(npc);
        this.factionManager.collectTaxes(npc.factionId, [{ npcId: npc.id, income }]);
      }
    }

    this.onDayChange?.(this.state.currentGameDay);
  }

  // ===========================================================================
  // TIME MANAGEMENT
  // ===========================================================================

  /**
   * Get the current game hour (0-23)
   */
  getGameHour(): number {
    return Math.floor(this.state.currentGameTime / 60);
  }

  /**
   * Get the current game minute (0-59)
   */
  getGameMinute(): number {
    return this.state.currentGameTime % 60;
  }

  /**
   * Check if it's working hours (9 AM - 5 PM inclusive)
   */
  isWorkingHours(): boolean {
    const hour = this.getGameHour();
    return hour >= WORK_START_HOUR && hour <= WORK_END_HOUR;
  }

  /**
   * Check if it's daytime (6 AM - 8 PM)
   */
  isDaytime(): boolean {
    const hour = this.getGameHour();
    return hour >= DAY_START_HOUR && hour <= DAY_END_HOUR;
  }

  /**
   * Set the game time directly (for testing/debugging)
   *
   * @param minutes - Minutes since midnight (0-1439)
   */
  setGameTime(minutes: number): void {
    this.state.currentGameTime = Math.max(0, Math.min(MINUTES_PER_DAY - 1, minutes));
  }

  // ===========================================================================
  // LEVEL OF DETAIL (LOD)
  // ===========================================================================

  /**
   * Calculate the LOD level for an NPC based on distance from camera
   *
   * @param npc - The NPC to calculate LOD for
   * @param cameraPosition - Current camera position
   * @returns The LOD level
   */
  calculateLOD(npc: CryptoNPC, cameraPosition: CameraPosition): NPCLODLevel {
    const distance = Math.sqrt(
      Math.pow(npc.gridX - cameraPosition.x, 2) + Math.pow(npc.gridY - cameraPosition.y, 2)
    );

    if (distance < 5) return 'full';
    if (distance < 15) return 'high';
    if (distance < 30) return 'medium';
    if (distance < 50) return 'low';
    return 'minimal';
  }

  /**
   * Set the camera position for LOD calculations
   *
   * @param position - New camera position
   */
  setCameraPosition(position: CameraPosition): void {
    this.cameraPosition = { ...position };
  }

  /**
   * Get the current camera position
   */
  getCameraPosition(): CameraPosition {
    return { ...this.cameraPosition };
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Get all NPCs within a certain distance of an NPC
   *
   * @param npc - The center NPC
   * @param maxDistance - Maximum distance in tiles
   * @returns Array of nearby NPCs (excluding the center NPC)
   */
  getNearbyNPCs(npc: CryptoNPC, maxDistance: number): CryptoNPC[] {
    const allNPCs = NPCManager.getAllNPCs();

    return allNPCs.filter((other) => {
      if (other.id === npc.id) return false;

      const distance = Math.sqrt(
        Math.pow(other.gridX - npc.gridX, 2) + Math.pow(other.gridY - npc.gridY, 2)
      );

      return distance <= maxDistance;
    });
  }

  /**
   * Get the current simulation state
   */
  getState(): SimulationState {
    return { ...this.state };
  }

  /**
   * Emit an NPC event
   *
   * @param event - The event to emit
   */
  emitNPCEvent(event: NPCEvent): void {
    this.onNPCEvent?.(event);
  }

  /**
   * Get access to managers (for advanced usage)
   */
  getManagers() {
    return {
      needs: this.needsManager,
      movement: this.movementManager,
      memory: this.memoryManager,
      mood: this.moodManager,
      relationship: this.relationshipManager,
      interaction: this.interactionManager,
      economy: this.economyManager,
      faction: this.factionManager,
      conflict: this.conflictManager,
      learning: this.learningManager,
    };
  }
}

// Export default instance for convenience
export const npcSimulation = new NPCSimulation();
