/**
 * Player-Triggered Disaster System
 * 
 * "Space is big. Really big. You just won't believe how vastly, hugely,
 * mind-bogglingly big it is. The same could be said about the destruction
 * players can cause when given USDT₮ and a disaster trigger button."
 * 
 * This module provides the player-triggered disaster system with USDT₮ payments.
 * For natural/random disasters, see ../disasters.ts
 */

// Types
export type {
  DisasterDamageType,
  PlayerDisaster,
  DisasterBalanceConfig,
  ActivePlayerDisaster,
  DamagedBuildingFromDisaster,
  TriggerDisasterRequest,
  TriggerDisasterResult,
  RepairBuildingRequest,
  RepairBuildingResult,
  PlayerDisasterSystemState,
} from './types';

export {
  PLAYER_DISASTERS,
  DEFAULT_BALANCE_CONFIG,
  createInitialDisasterState,
} from './types';

// Manager
export {
  PlayerDisasterManager,
  playerDisasterManager,
  type DisasterCallback,
} from './DisasterManager';

// NPC Reactions
export type {
  ReactionIntensity,
  DisasterBehavior,
  NPCDisasterReaction,
  DisasterMoodState,
} from './npcReactions';

export {
  calculateReactionIntensity,
  selectDisasterBehavior,
  generateDisasterThought,
  createDisasterMood,
  createDisasterMemory,
  processNPCDisasterReaction,
  applyReactionToNPC,
  processDisasterReactions,
} from './npcReactions';

// Visual Effects
export type {
  DisasterScreenEffect,
  DisasterParticleConfig,
  DamagedBuildingOverlay,
  DisasterVisualEffect,
} from './visualEffects';

export {
  DISASTER_VISUAL_EFFECTS,
  DEFAULT_DAMAGED_OVERLAY,
  getDisasterVisualEffect,
  getDamagedBuildingOverlay,
  calculateShakeOffset,
  calculateWaveOffset,
  getCombinedScreenTint,
  hasActiveScreenShake,
  getCombinedShakeConfig,
} from './visualEffects';
