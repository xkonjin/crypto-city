/**
 * Titan Module Exports
 * 
 * Central export point for the Titan Pet system.
 */

export * from './TitanManager';
export { TitanManager } from './TitanManager';

export * from './TitanNeeds';
export {
  createDefaultTitanNeeds,
  updateTitanNeeds,
  satisfyTitanNeed,
  getMostUrgentTitanNeed,
  getTitanNeedStatus,
} from './TitanNeeds';

export * from './TitanSpawner';
export {
  createTitan,
  generateTitanId,
  generateTitanName,
  getSpeciesBaseStats,
  generateSpeciesPersonality,
} from './TitanSpawner';

export * from './TitanAlignment';
export {
  ALIGNMENT_ACTION_IMPACTS,
  GOOD_ACTIONS,
  EVIL_ACTIONS,
  NEUTRAL_ACTIONS,
  calculateAlignment,
  shiftAlignment,
  getAlignmentState,
  getActionAlignmentImpact,
  decayAlignment,
} from './TitanAlignment';

export * from './TitanAI';
export {
  TitanBDI,
  MAX_WORLD_KNOWLEDGE,
  MAX_NPC_OPINIONS,
  MIN_BDI_UPDATE_INTERVAL,
} from './TitanAI';
export type {
  TitanObservation,
  TitanDesire,
  TitanAction,
  TitanIntention,
  TitanBeliefs,
  TitanBDIState,
} from './TitanAI';

export * from './TitanLearning';
export {
  ActionBeliefMap,
  ActionHistoryTracker,
  ObservationTracker,
  DEFAULT_MAX_BELIEFS,
  DEFAULT_MAX_HISTORY,
  DEFAULT_MAX_OBSERVATIONS,
  TRAINING_WINDOW_MS,
  BELIEF_DECAY_RATE,
  MIMICRY_LEARNING_MAGNITUDE,
  calculateMimicryChance,
  shouldMimicAction,
  processObservation,
  learnFromMimicry,
} from './TitanLearning';
export type { ObservedBehavior } from './TitanLearning';

export * from './TitanTraining';
export {
  praiseTitan,
  punishTitan,
  recordTitanAction,
  getTrainableAction,
  TitanTrainer,
  PRAISE_MESSAGES,
  PUNISH_MESSAGES,
  WINDOW_EXPIRED_MESSAGE,
  NO_ACTION_MESSAGE,
} from './TitanTraining';
export type { TrainingResult } from './TitanTraining';

export * from './TitanSprite';
export {
  // Constants
  ALL_TITAN_ANIMATIONS,
  ALL_TITAN_DIRECTIONS,
  DIRECTIONAL_ANIMATIONS,
  NON_DIRECTIONAL_ANIMATIONS,
  LOOPING_ANIMATIONS,
  NON_LOOPING_ANIMATIONS,
  ESSENTIAL_ANIMATIONS,
  ANIMATION_FRAME_COUNTS,
  ANIMATION_FRAME_DURATION,
  ALIGNMENT_PLACEHOLDER_COLORS,
  // Functions
  getTitanSpritePath,
  getTitanSpritePathNoDirection,
  getSpritePath,
  isDirectionalAnimation,
  getDirectionFromDelta,
  getDirectionToTarget,
  createPlaceholderSprite,
  placeholderToImage,
  // Classes
  TitanSpriteLoader,
  TitanAnimationState,
} from './TitanSprite';
export type { TitanAnimation, TitanDirection } from './TitanSprite';

export * from './TitanVisualEffects';
export {
  // Constants
  ALIGNMENT_VISUALS,
  TRANSITION_DURATION_MS,
  MAX_PARTICLES,
  // Classes
  AlignmentTransitionManager,
  AlignmentParticleSystem,
  // Functions
  interpolateVisuals,
  interpolateColor,
  shouldTriggerMorphAnimation,
  getMorphAnimation,
  drawAlignmentGlow,
  drawAlignmentParticles,
  applyAlignmentFilter,
  getTitanVisualState,
  getAlignmentVisualsForValue,
} from './TitanVisualEffects';
export type {
  AlignmentVisualProperties,
  AlignmentTransition,
  AlignmentParticle,
} from './TitanVisualEffects';

export * from './NPCTitanReactions';
export {
  // Constants
  ALL_NPC_REACTIONS,
  REACTION_PRIORITIES,
  REACTION_ANIMATIONS,
  REACTION_MESSAGES,
  // Functions
  getNPCReaction,
  getNPCReactionDetailed,
  calculateFearLevel,
  calculateTrustLevel,
  shouldAvoidPosition,
  getAvoidanceRadius,
  getApproachRadius,
  processNPCTitanProximity,
} from './NPCTitanReactions';
export type {
  NPCReaction,
  NPCReactionPriority,
  NPCReactionDetailed,
  ReactionAnimation,
  ProximityResult,
} from './NPCTitanReactions';

export * from './TitanInteractions';
export {
  // Constants
  ALL_TITAN_INTERACTIONS,
  TITAN_INTERACTION_ALIGNMENT,
  TITAN_INTERACTION_EFFECTS,
  INTERACTION_XP_REWARDS,
  INTERACTION_MESSAGES,
  // Functions
  canInteract,
  calculateInteractionSuccess,
  processInteraction,
  applyInteractionEffects,
  selectInteractionType,
} from './TitanInteractions';
export type {
  TitanInteractionType,
  TitanInteractionEffect,
  TitanInteractionEffectConfig,
  InteractionXPReward,
  InteractionMessageConfig,
  TitanInteractionRequest,
  TitanInteractionResult,
  CanInteractResult,
} from './TitanInteractions';

export * from './TitanRelationships';
export {
  // Constants
  TITAN_RELATIONSHIP_DECAY_RATES,
  RELATIONSHIP_MILESTONES,
  // Functions
  createDefaultTitanRelationship,
  clampRelationshipValue,
  getRelationshipSentiment,
  decayRelationship,
  checkForRelationshipEvent,
  // Classes
  TitanRelationshipManager,
} from './TitanRelationships';
export type {
  RelationshipSentiment,
  RelationshipEvent,
  RelationshipMetric,
} from './TitanRelationships';

export * from './TitanSkills';
export {
  // Constants
  SKILL_LEVEL_THRESHOLDS,
  SPECIES_APTITUDES,
  SKILL_DECAY_RATE,
  TITAN_SKILL_DESCRIPTIONS,
  // Functions
  getSkillAptitude,
  initializeSkillProgressions,
  calculateSkillLevel,
  getXPForNextLevel,
  getXPProgress,
  grantSkillXP,
  getSkillModifier,
  decayUnusedSkills,
  markSkillUsed,
  getSkillSummary,
  getSkillsAboveLevel,
} from './TitanSkills';
export type {
  GrantSkillXPResult,
  SkillSummary,
} from './TitanSkills';

export * from './TitanMiracles';
export {
  // Constants
  ALL_MIRACLES,
  MIRACLE_CONFIGS,
  MIRACLE_MESSAGES,
  // Classes
  MiracleCooldownTracker,
  // Functions
  canUseMiracle,
  performMiracle,
  getAvailableMiracles,
  getUnlockedMiracles,
  isMiracleUnlocked,
} from './TitanMiracles';
export type {
  Miracle,
  MiracleConfig,
  MiracleCooldownState,
  MiracleEffect,
  MiracleResult,
} from './TitanMiracles';

export * from './TitanDen';
export {
  // Constants
  MAX_DEN_LEVEL,
  MIN_DEN_LEVEL,
  DEN_LEVEL_CONFIG,
  DEN_FEATURE_EFFECTS,
  // Functions
  createTitanDen,
  upgradeDen,
  canUpgradeDen,
  applyDenEffects,
  isTitanAtDen,
  getDenFeatures,
  useFeedingBowl,
  useWaterBowl,
  useSleepingArea,
  useTrainingDummy,
  useMiracleAltar,
  shouldPreventBeliefDecay,
  hasEvolutionChamber,
} from './TitanDen';
export type {
  TitanDen,
  TitanDenFeatures,
  DenLevelConfig,
  DenFeatureEffect,
  DenUseResult,
  TrainingDummyResult,
  MiracleAltarResult,
} from './TitanDen';

export * from './TitanPerformance';
export {
  TITAN_MEMORY_LIMITS,
  getTitanMemoryUsage,
  optimizeTitanMemory,
  checkMemoryWarnings,
} from './TitanPerformance';
export type { TitanMemoryUsage } from './TitanPerformance';
