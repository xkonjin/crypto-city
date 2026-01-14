/**
 * Titan Components Index
 *
 * Exports all Titan-related UI components.
 *
 * Components:
 * - GodHandCursor: Divine interaction cursor for the Titan
 * - GodHandProvider: Context provider for God Hand state
 * - useGodHand: Hook to access God Hand context
 * - TitanTrainingFeedback: Visual feedback for training interactions
 * - ParticleSystem: Animated particle effects for feedback
 * - triggerTitanReaction: Signal Titan animation reactions
 * - TitanStatusPanel: Persistent UI panel showing Titan status
 * - AlignmentBar: Visual alignment indicator
 * - NeedBar: Individual need progress bar
 * - MoodIndicator: Mood emoji display
 * - ActionButtons: Titan action button row
 * - TitanDetailView: Full-screen detailed Titan view with tabs
 * - StatusTab: Needs, mood, and alignment display
 * - SkillsTab: All 12 skill progressions
 * - RelationshipsTab: NPC relationship list
 * - HistoryTab: Action history log
 * - DebugTab: Developer information
 *
 * "From the humble index file springs forth the exported might
 * of the divine interface. Handle with care, mortal developer."
 */

// God Hand Cursor System
export {
  GodHandCursor,
  GodHandProvider,
  GodHandContext,
  useGodHand,
  GOD_HAND_STATES,
  GOD_HAND_STATE_DESCRIPTIONS,
  type GodHandState,
  type GodHandContextValue,
  type GodHandProviderProps,
  type GodHandCursorProps,
} from "./GodHandCursor";

// Training Feedback System
export {
  TitanTrainingFeedback,
  ParticleSystem,
  triggerTitanReaction,
  getLastTitanReaction,
  playPraiseSound,
  playPunishSound,
  FEEDBACK_DURATION,
  TEXT_FADE_START,
  PARTICLE_DURATION,
  type TrainingFeedbackProps,
  type ParticleSystemProps,
  type TitanReactionType,
} from "./TitanTrainingFeedback";

// Titan Status Panel
export {
  TitanStatusPanel,
  AlignmentBar,
  NeedBar,
  MoodIndicator,
  ActionButtons,
  type TitanStatusPanelProps,
  type AlignmentBarProps,
  type NeedBarProps,
  type MoodIndicatorProps,
  type ActionButtonsProps,
} from "./TitanStatusPanel";

// Titan Detail View
export {
  TitanDetailView,
  StatusTab,
  SkillsTab,
  RelationshipsTab,
  HistoryTab,
  DebugTab,
  SkillCard,
  RelationshipCard,
  ActionLogEntry,
  type TitanDetailViewProps,
  type TabId,
} from "./TitanDetailView";
