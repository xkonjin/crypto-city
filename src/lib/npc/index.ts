/**
 * NPC System for Crypto City
 * 
 * Core NPC system exports for managing AI-powered citizens in the city.
 */

// Types
export * from '@/games/isocity/types/npc';

// Manager
export { NPCManager } from './NPCManager';
export type { NPCManagerClass } from './NPCManager';

// Name generation
export { generateNPCName, generateWalletAddress, generateUniqueNames } from './nameGenerator';

// Spawner
export { NPCSpawner } from './NPCSpawner';
export type { NPCSpawnerClass } from './NPCSpawner';

// Needs system (Sims-style motives that decay over time)
export * from './needs';
export { NeedsManager, type NPCAction, type UrgentNeedResult } from './NeedsManager';

// Personality system (Big Five + crypto-specific traits)
export * from './personality';
export {
  PersonalityManager,
  type SocialPreference,
  type RiskBehavior,
  type DialogueTone,
} from './PersonalityManager';

// Memory system (Stanford Generative Agents-style)
export * from './memory';
export { MemoryManager } from './MemoryManager';

// Pathfinding system (A* algorithm for grid navigation)
export {
  findPath,
  findPathCached,
  isWalkable,
  getBuildingEntrance,
  manhattanDistance,
  reconstructPath,
  clearPathCache,
  DEFAULT_PATHFINDING_OPTIONS,
  type GridPosition,
  type PathNode,
  type PathfindingOptions,
} from './pathfinding';

// Movement system (state machine for NPC movement)
export {
  MovementManager,
  movementManager,
  createInitialMovement,
  MOVEMENT_DESCRIPTIONS,
  type MovementState,
  type NPCMovement,
} from './movement';

// Schedule system (daily routines based on occupation)
export {
  SCHEDULE_TEMPLATES,
  ACTIVITY_DESCRIPTIONS,
  OCCUPATIONS,
  getScheduleForOccupation,
  getActivityDescription,
  type NPCActivity as ScheduleActivity,
  type Occupation as ScheduleOccupation,
  type ActivityLocation,
  type ScheduledActivity,
  type DailySchedule,
} from './schedule';

export {
  ScheduleManager,
  type Position as SchedulePosition,
  type NPCNeeds as ScheduleNPCNeeds,
  type SchedulableNPC,
} from './ScheduleManager';

// Relationship system (Inworld-style relationship tracking)
export * from './relationships';
export { RelationshipManager } from './RelationshipManager';

// Mood system (Internal world - mood, thoughts, beliefs, desires)
export * from './mood';
export { MoodManager } from './MoodManager';

// Social interaction system (NPC-to-NPC social interactions)
export * from './interactions';
export { InteractionManager } from './InteractionManager';

// Conflict system (Personal feuds and faction warfare)
export * from './conflicts';
export { ConflictManager } from './ConflictManager';

// Faction system (Groups with shared ideologies and goals)
export * from './factions';
export { FactionManager, type TaxableIncome } from './FactionManager';

// Economy system (Wallets, trading, staking, income/expenses)
export * from './economy';
export { EconomyManager } from './EconomyManager';

// Learning system (Skill progression and social learning)
export * from './learning';
export { LearningManager, type ExperienceGainResult } from './LearningManager';

// Simulation engine (Main orchestration loop)
export {
  NPCSimulation,
  npcSimulation,
  DEFAULT_SIMULATION_CONFIG,
  LOD_UPDATE_FREQUENCY,
  type SimulationConfig,
  type SimulationState,
  type NPCEvent,
  type NPCLODLevel,
} from './NPCSimulation';
