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
 * Event emitted when something significant happens to an NPC
 */
export interface NPCEvent {
  /** Type of event */
  type: 'spawn' | 'despawn' | 'interaction' | 'trade' | 'conflict' | 'level_up' | 'mood_change';
  /** ID of the NPC involved */
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

    // Update each NPC
    for (const npc of NPCManager.getAllNPCs()) {
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

    // Periodic updates (not every tick)
    if (this.state.tickCount % 10 === 0) {
      this.processInteractions();
      this.updateRelationships();
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
    // 1. Update needs (decay)
    npc.needs = this.needsManager.updateNeeds(npc.needs, deltaMinutes);

    // 2. Check schedule
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

    // 3. Check for urgent needs override
    const urgentNeed = this.needsManager.getMostUrgentNeed(npc.needs);
    const shouldOverride =
      urgentNeed && urgentNeed.need.current < urgentNeed.need.criticalThreshold;

    // 4. Decide what to do
    if (shouldOverride) {
      this.handleUrgentNeed(npc, urgentNeed);
    } else if (scheduledActivity) {
      this.followSchedule(npc, scheduledActivity);
    } else {
      this.doIdleActivity(npc);
    }

    // 5. Update movement
    this.movementManager.update(npc, deltaMinutes / 60); // Convert to seconds

    // 6. Update mood
    this.moodManager.decayMoodIntensity(npc, deltaMinutes);

    // 7. Process interactions if near other NPCs and should interact
    if (this.interactionManager.shouldInitiateInteraction(npc)) {
      const nearbyNPCs = this.getNearbyNPCs(npc, 3); // Within 3 tiles
      if (nearbyNPCs.length > 0) {
        const target = this.interactionManager.selectInteractionTarget(npc, nearbyNPCs);
        if (target) {
          this.processInteraction(npc, target);
        }
      }
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
