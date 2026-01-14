'use client';

/**
 * useFloatingCobie - Unified hook for the Floating Cobie Head
 * Issue #181
 * 
 * Combines all Cobie systems into a single hook:
 * - Settings management (CobieSettings)
 * - Narrator dialogue (useCobieNarrator)
 * - Brain/mood logic (useCobieBrain)
 * - Idle behaviors
 * 
 * Provides all props needed by FloatingCobieHead component.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { GameState } from '@/types/game';
import type { CryptoEvent, CryptoBuildingDefinition, CryptoEconomyState } from '@/games/isocity/crypto/types';
import type { FloatingCobieHeadProps } from '@/components/game/FloatingCobieHead';
import type { CobieExpression, CobieMood, LookDirection, CobieContext } from '@/lib/cobie/types';
import type { CobieSettings, CobieTalkativeness } from '@/lib/cobie/CobieSettings';
import {
  DEFAULT_COBIE_SETTINGS,
  loadCobieSettings,
  saveCobieSettings,
  shouldShowMessage,
  shouldShowIdleBehavior,
  MessagePriority,
  type MessagePriorityValue,
} from '@/lib/cobie/CobieSettings';
import { useCobieNarrator } from './useCobieNarrator';
import { useCobieBrain, type CobieContextValue } from './useCobieBrain';
import { calculateBoredomLevel, shouldEnterSleep, shouldWakeUp } from '@/lib/cobie';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Return type for useFloatingCobie hook
 */
export interface UseFloatingCobieReturn {
  /** Props to pass to FloatingCobieHead component */
  headProps: FloatingCobieHeadProps;
  /** Current settings */
  settings: CobieSettings;
  /** Update settings (partial updates supported) */
  updateSettings: (settings: Partial<CobieSettings>) => void;
  /** Report tile hover event */
  reportHover: (tile: { x: number; y: number } | null, building?: CryptoBuildingDefinition | null) => void;
  /** Report player action for context */
  reportAction: (action: { type: string; details?: Record<string, unknown> }) => void;
  /** Whether the floating head is enabled */
  isEnabled: boolean;
  /** Toggle enabled state */
  toggleEnabled: () => void;
  // Expose narrator triggers for external integration
  triggerReaction: (buildingId: string) => void;
  triggerMilestone: (milestoneId: string) => void;
  triggerRugPull: (buildingName: string, treasuryLoss: number) => void;
  triggerEventReaction: (event: CryptoEvent) => void;
  /** React to economy state updates for reactive commentary */
  onEconomyUpdate: (economyState: CryptoEconomyState) => void;
  // Menu handlers (Issues #200, #201)
  /** Handler for "Ask Cobie" menu option */
  handleAskCobie: () => void;
  /** Handler for "Hot Takes" menu option */
  handleHotTakes: () => void;
  /** Handler for "Settings" menu option */
  handleSettings: () => void;
  /** Handler for "Dismiss" menu option */
  handleDismiss: () => void;
  /** Whether settings panel should be shown */
  showSettingsPanel: boolean;
  /** Toggle settings panel visibility */
  toggleSettingsPanel: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Interval for updating brain context (ms) */
const CONTEXT_UPDATE_INTERVAL = 1000;

// =============================================================================
// HOOK
// =============================================================================

/**
 * Main hook for the Floating Cobie Head system
 * 
 * @param state - Current game state
 * @returns All props and functions needed for the Cobie system
 */
export function useFloatingCobie(state: GameState): UseFloatingCobieReturn {
  // =========================================================================
  // SETTINGS STATE
  // =========================================================================
  
  const [settings, setSettings] = useState<CobieSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_COBIE_SETTINGS;
    return loadCobieSettings();
  });

  // Save settings when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      saveCobieSettings(settings);
    }
  }, [settings]);

  // =========================================================================
  // NARRATOR (existing hook)
  // =========================================================================
  
  const narrator = useCobieNarrator(state);

  // =========================================================================
  // BRAIN (for mood/expression calculations)
  // =========================================================================
  
  const brain = useCobieBrain();
  
  // Track last activity for idle calculations
  const lastActivityRef = useRef(Date.now());
  const [idleSeconds, setIdleSeconds] = useState(0);

  // Update idle time
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      setIdleSeconds(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // =========================================================================
  // CONTEXT TRACKING
  // =========================================================================
  
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<CryptoBuildingDefinition | null>(null);

  // Update brain context periodically
  useEffect(() => {
    const updateContext = () => {
      const contextValue: CobieContextValue = {
        hoveredTile,
        hoveredBuilding: hoveredBuilding ? {
          category: hoveredBuilding.category, // category is at root level
          crypto: hoveredBuilding.crypto ? {
            effects: hoveredBuilding.crypto.effects,
          } : undefined,
        } : null,
        treasury: state.stats.money,
        previousTreasury: undefined, // Would need to track this
        marketSentiment: 50, // Would come from crypto economy
        gameSpeed: state.speed,
        currentHour: state.hour,
        lastActionTimestamp: lastActivityRef.current,
      };
      brain.updateContext(contextValue);
    };

    const interval = setInterval(updateContext, CONTEXT_UPDATE_INTERVAL);
    updateContext(); // Initial update
    return () => clearInterval(interval);
  }, [hoveredTile, hoveredBuilding, state.stats.money, state.speed, state.hour, brain]);

  // =========================================================================
  // SETTINGS HANDLERS
  // =========================================================================
  
  const updateSettings = useCallback((updates: Partial<CobieSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleEnabled = useCallback(() => {
    setSettings(prev => {
      const newSettings = { ...prev, enabled: !prev.enabled };
      // Also update narrator's enabled state for compatibility
      narrator.setCobieEnabled(newSettings.enabled);
      return newSettings;
    });
  }, [narrator]);

  // Sync settings.enabled with narrator on initial load
  useEffect(() => {
    if (settings.enabled !== narrator.cobieEnabled) {
      narrator.setCobieEnabled(settings.enabled);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================================
  // MENU HANDLERS (Issues #200, #201)
  // =========================================================================
  
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  /**
   * Handle "Ask Cobie" - triggers context-aware commentary based on current game state
   */
  const handleAskCobie = useCallback(() => {
    // Reset activity tracking
    lastActivityRef.current = Date.now();
    setIdleSeconds(0);
    
    // Trigger a context-aware reaction based on current state
    if (hoveredBuilding) {
      // Comment on the building being looked at
      const category = hoveredBuilding.category;
      if (category) {
        narrator.triggerHoverReaction(category, 'normal');
      }
    } else {
      // Give general game state commentary
      narrator.triggerPatternReaction('player_action');
    }
  }, [hoveredBuilding, narrator]);

  /**
   * Handle "Hot Takes" - shows a random Cobie-style observation
   * Note: We use triggerPatternReaction which internally shows commentary
   */
  const handleHotTakes = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleSeconds(0);
    
    // Trigger a "hot_take" pattern which shows a commentary-style message
    // The narrator will pick an appropriate message based on this pattern
    narrator.triggerPatternReaction('player_action');
  }, [narrator]);

  /**
   * Handle "Settings" - toggles the settings panel
   */
  const handleSettings = useCallback(() => {
    setShowSettingsPanel(prev => !prev);
  }, []);

  /**
   * Toggle settings panel visibility
   */
  const toggleSettingsPanel = useCallback(() => {
    setShowSettingsPanel(prev => !prev);
  }, []);

  /**
   * Handle "Dismiss" - hides Cobie
   */
  const handleDismiss = useCallback(() => {
    setSettings(prev => {
      const newSettings = { ...prev, enabled: false };
      narrator.setCobieEnabled(false);
      return newSettings;
    });
  }, [narrator]);

  // =========================================================================
  // CONTEXT REPORTING
  // =========================================================================
  
  const reportHover = useCallback((
    tile: { x: number; y: number } | null,
    building?: CryptoBuildingDefinition | null
  ) => {
    setHoveredTile(tile);
    setHoveredBuilding(building ?? null);
    
    // Trigger narrator hover reactions if appropriate
    if (building && building.category) {
      const riskLevel = building.crypto?.effects?.rugRisk 
        ? (building.crypto.effects.rugRisk > 0.3 ? 'high' : 'normal')
        : 'normal';
      narrator.triggerHoverReaction(building.category, riskLevel);
    }
  }, [narrator]);

  const reportAction = useCallback((action: { type: string; details?: Record<string, unknown> }) => {
    lastActivityRef.current = Date.now();
    setIdleSeconds(0);
    
    // Reset idle thresholds in narrator
    narrator.triggerPatternReaction('activity_reset');
  }, [narrator]);

  // =========================================================================
  // IDLE BEHAVIOR CALCULATIONS
  // =========================================================================
  
  const boredomLevel = useMemo(() => {
    return calculateBoredomLevel(idleSeconds);
  }, [idleSeconds]);

  const shouldShowIdle = useMemo(() => {
    return shouldShowIdleBehavior(settings.showIdleBehaviors);
  }, [settings.showIdleBehaviors]);

  // Trigger idle reactions through narrator
  useEffect(() => {
    if (shouldShowIdle && idleSeconds > 0) {
      narrator.triggerIdleReaction(idleSeconds);
    }
  }, [idleSeconds, shouldShowIdle, narrator]);

  // =========================================================================
  // MOOD AND EXPRESSION
  // =========================================================================
  
  // Calculate current mood based on brain state and idle time
  const currentMood = useMemo((): CobieMood => {
    // If idle for a long time and idle behaviors are enabled
    if (shouldShowIdle) {
      if (idleSeconds >= 120) return 'bored';
      if (idleSeconds >= 60) return 'bored';
    }
    
    // Use brain's calculated mood
    return brain.state.currentMood;
  }, [brain.state.currentMood, idleSeconds, shouldShowIdle]);

  // Calculate current expression
  const currentExpression = useMemo((): CobieExpression => {
    // If speaking, show talking expression
    if (narrator.isVisible && narrator.currentMessage) {
      return 'talking';
    }
    
    // Idle expressions if enabled
    if (shouldShowIdle) {
      if (idleSeconds >= 120) return 'sleeping';
      if (idleSeconds >= 60) return 'squint';
    }
    
    // Use brain's expression
    return brain.state.currentExpression;
  }, [narrator.isVisible, narrator.currentMessage, idleSeconds, shouldShowIdle, brain.state.currentExpression]);

  // Look direction
  const lookDirection = useMemo((): LookDirection => {
    // Don't move eyes if sleeping or idle too long
    if (idleSeconds > 5 || currentExpression === 'sleeping') {
      return 'center';
    }
    return brain.state.lookDirection;
  }, [brain.state.lookDirection, idleSeconds, currentExpression]);

  // =========================================================================
  // DIALOGUE FILTERING
  // =========================================================================
  
  // Filter messages based on talkativeness
  const filteredMessage = useMemo(() => {
    if (!narrator.currentMessage) return null;
    
    // Map message types to priorities
    const typeToPrority: Record<string, MessagePriorityValue> = {
      'milestone': MessagePriority.HIGH,
      'event': MessagePriority.HIGH,
      'warning': MessagePriority.HIGH,
      'reaction': MessagePriority.MEDIUM,
      'tip': MessagePriority.MEDIUM,
      'commentary': MessagePriority.LOW,
    };
    
    const priority: MessagePriorityValue = typeToPrority[narrator.currentMessage.type] ?? MessagePriority.MEDIUM;
    
    if (shouldShowMessage(settings.talkativeness, priority)) {
      return narrator.currentMessage.message;
    }
    
    return null;
  }, [narrator.currentMessage, settings.talkativeness]);

  // =========================================================================
  // HEAD PROPS
  // =========================================================================
  
  const headProps = useMemo((): FloatingCobieHeadProps => ({
    expression: currentExpression,
    mood: currentMood,
    dialogue: filteredMessage,
    isSpeaking: narrator.isVisible && !!filteredMessage,
    lookDirection,
    position: settings.position,
    scale: settings.scale,
    enabled: settings.enabled,
    queueLength: 0, // Queue is internal to narrator
    onDismissDialogue: narrator.onDismiss,
    // Menu handlers (Issues #200, #201)
    onAskCobie: handleAskCobie,
    onHotTakes: handleHotTakes,
    onSettings: handleSettings,
    onDismissCobie: handleDismiss,
  }), [
    currentExpression,
    currentMood,
    filteredMessage,
    narrator.isVisible,
    lookDirection,
    settings.position,
    settings.scale,
    settings.enabled,
    narrator.onDismiss,
    handleAskCobie,
    handleHotTakes,
    handleSettings,
    handleDismiss,
  ]);

  // =========================================================================
  // RETURN
  // =========================================================================
  
  return {
    headProps,
    settings,
    updateSettings,
    reportHover,
    reportAction,
    isEnabled: settings.enabled,
    toggleEnabled,
    // Expose narrator triggers
    triggerReaction: narrator.triggerReaction,
    triggerMilestone: narrator.triggerMilestone,
    triggerRugPull: narrator.triggerRugPull,
    triggerEventReaction: narrator.triggerEventReaction,
    onEconomyUpdate: narrator.onEconomyUpdate,
    // Menu handlers (Issues #200, #201)
    handleAskCobie,
    handleHotTakes,
    handleSettings,
    handleDismiss,
    showSettingsPanel,
    toggleSettingsPanel,
  };
}

export default useFloatingCobie;
