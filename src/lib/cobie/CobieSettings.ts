/**
 * CobieSettings - Settings management for the Floating Cobie Head
 * Issue #181
 * 
 * Manages user preferences for the Cobie assistant:
 * - Enabled/disabled state
 * - Position (bottom-left or bottom-right)
 * - Scale (small, medium, large)
 * - Talkativeness (quiet, normal, chatty)
 * - Idle behaviors visibility
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Position options for the floating head
 */
export type CobiePosition = 'bottom-left' | 'bottom-right';

/**
 * Scale options for the floating head
 */
export type CobieScale = 'small' | 'medium' | 'large';

/**
 * Talkativeness levels that control message frequency
 * - quiet: Only important messages (milestones, rugs)
 * - normal: Standard frequency
 * - chatty: All messages including low-priority commentary
 */
export type CobieTalkativeness = 'quiet' | 'normal' | 'chatty';

/**
 * Full settings interface for the Cobie assistant
 */
export interface CobieSettings {
  /** Whether the floating head is enabled */
  enabled: boolean;
  /** Screen position */
  position: CobiePosition;
  /** Size scale */
  scale: CobieScale;
  /** How often Cobie speaks */
  talkativeness: CobieTalkativeness;
  /** Whether to show idle animations (looking around, sleeping) */
  showIdleBehaviors: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Storage key for the new settings format */
export const COBIE_SETTINGS_STORAGE_KEY = 'cryptocity-cobie-head-settings';

/** Old storage key for migration (from useCobieNarrator) */
export const OLD_COBIE_DISABLED_KEY = 'cryptocity-cobie-disabled';

/** Valid position values */
const VALID_POSITIONS: CobiePosition[] = ['bottom-left', 'bottom-right'];

/** Valid scale values */
const VALID_SCALES: CobieScale[] = ['small', 'medium', 'large'];

/** Valid talkativeness values */
const VALID_TALKATIVENESS: CobieTalkativeness[] = ['quiet', 'normal', 'chatty'];

/**
 * Default settings for new users
 */
export const DEFAULT_COBIE_SETTINGS: CobieSettings = {
  enabled: true,
  position: 'bottom-left',
  scale: 'medium',
  talkativeness: 'normal',
  showIdleBehaviors: true,
};

// =============================================================================
// MESSAGE PRIORITY
// =============================================================================

/**
 * Priority levels for messages
 * Lower number = higher priority
 */
export const MessagePriority = {
  /** High priority - always shown (milestones, rugs, warnings) */
  HIGH: 0,
  /** Medium priority - shown for normal and chatty */
  MEDIUM: 5,
  /** Low priority - only shown for chatty */
  LOW: 10,
} as const;

export type MessagePriorityValue = typeof MessagePriority[keyof typeof MessagePriority];

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if a value is a valid CobiePosition
 */
export function isValidPosition(value: string): value is CobiePosition {
  return VALID_POSITIONS.includes(value as CobiePosition);
}

/**
 * Check if a value is a valid CobieScale
 */
export function isValidScale(value: string): value is CobieScale {
  return VALID_SCALES.includes(value as CobieScale);
}

/**
 * Check if a value is a valid CobieTalkativeness
 */
export function isValidTalkativeness(value: string): value is CobieTalkativeness {
  return VALID_TALKATIVENESS.includes(value as CobieTalkativeness);
}

// =============================================================================
// TALKATIVENESS FILTERING
// =============================================================================

/**
 * Determine if a message should be shown based on talkativeness setting
 * 
 * @param talkativeness - Current talkativeness setting
 * @param priority - Message priority level
 * @returns true if the message should be shown
 */
export function shouldShowMessage(
  talkativeness: CobieTalkativeness,
  priority: MessagePriorityValue
): boolean {
  switch (talkativeness) {
    case 'quiet':
      // Only show high priority messages
      return priority <= MessagePriority.HIGH;
    case 'normal':
      // Show high and medium priority messages
      return priority <= MessagePriority.MEDIUM;
    case 'chatty':
      // Show all messages
      return true;
    default:
      // Default to normal behavior
      return priority <= MessagePriority.MEDIUM;
  }
}

/**
 * Determine if idle behaviors should be shown
 * 
 * @param showIdleBehaviors - Setting value
 * @returns true if idle behaviors should be displayed
 */
export function shouldShowIdleBehavior(showIdleBehaviors: boolean): boolean {
  return showIdleBehaviors;
}

// =============================================================================
// PERSISTENCE FUNCTIONS
// =============================================================================

/**
 * Load Cobie settings from localStorage
 * Handles migration from old format and corrupted data gracefully
 * 
 * @returns CobieSettings object (defaults if not found or corrupted)
 */
export function loadCobieSettings(): CobieSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_COBIE_SETTINGS;
  }

  try {
    // First, check if new settings exist
    const stored = localStorage.getItem(COBIE_SETTINGS_STORAGE_KEY);
    
    if (stored) {
      // Parse and merge with defaults (handles partial settings)
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_COBIE_SETTINGS, ...parsed };
    }
    
    // No new settings - check for old format to migrate
    const oldDisabled = localStorage.getItem(OLD_COBIE_DISABLED_KEY);
    if (oldDisabled !== null) {
      // Migrate from old format
      const wasDisabled = oldDisabled === 'true';
      const migratedSettings: CobieSettings = {
        ...DEFAULT_COBIE_SETTINGS,
        enabled: !wasDisabled,
      };
      
      // Save in new format
      saveCobieSettings(migratedSettings);
      
      // Remove old key
      localStorage.removeItem(OLD_COBIE_DISABLED_KEY);
      
      return migratedSettings;
    }
    
    // No settings found, return defaults
    return DEFAULT_COBIE_SETTINGS;
  } catch (error) {
    console.error('Failed to load Cobie settings:', error);
    return DEFAULT_COBIE_SETTINGS;
  }
}

/**
 * Save Cobie settings to localStorage
 * 
 * @param settings - Settings to save
 */
export function saveCobieSettings(settings: CobieSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(COBIE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save Cobie settings:', error);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

const CobieSettingsModule = {
  DEFAULT_COBIE_SETTINGS,
  COBIE_SETTINGS_STORAGE_KEY,
  OLD_COBIE_DISABLED_KEY,
  MessagePriority,
  loadCobieSettings,
  saveCobieSettings,
  isValidPosition,
  isValidScale,
  isValidTalkativeness,
  shouldShowMessage,
  shouldShowIdleBehavior,
};

export default CobieSettingsModule;
