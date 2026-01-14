/**
 * useTitan - React Hook for Titan State Management
 *
 * Provides React integration for the Titan Pet system.
 * Manages Titan lifecycle, state updates, and persistence.
 *
 * Features:
 * - Titan state accessible to React components
 * - Action methods (spawn, despawn, move, etc.)
 * - Training methods (praise, punish) for God Hand
 * - Real-time updates via TitanManager
 * - Automatic persistence to localStorage
 *
 * Usage:
 *   const { titan, hasTitan, spawnTitan, praise, punish } = useTitan();
 *
 * "Managing a Titan is like managing a cryptocurrency portfolio:
 * constant attention required, mood swings are inevitable, and
 * sometimes you just need to step away and let it do its thing."
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { TitanManager } from '@/lib/titan/TitanManager';
import { satisfyTitanNeed, type TitanNeedType } from '@/lib/titan/TitanNeeds';
import { getActionAlignmentImpact } from '@/lib/titan/TitanAlignment';
import {
  ActionBeliefMap,
  ActionHistoryTracker,
} from '@/lib/titan/TitanLearning';
import {
  praiseTitan as praiseTitanFn,
  punishTitan as punishTitanFn,
  recordTitanAction as recordTitanActionFn,
  type TrainingResult,
} from '@/lib/titan/TitanTraining';

import type {
  TitanPet,
  TitanSpawnOptions,
  ActionHistoryEntry,
} from '@/games/isocity/types/titan';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Return type for the useTitan hook
 */
export interface UseTitanReturn {
  // State
  /** The current Titan, or null if none exists */
  titan: TitanPet | null;
  /** Whether a Titan currently exists */
  hasTitan: boolean;
  /** Whether the hook is loading (e.g., from storage) */
  isLoading: boolean;

  // Spawn/Despawn
  /** Spawn a new Titan with the given options */
  spawnTitan: (options: Partial<TitanSpawnOptions>) => TitanPet;
  /** Despawn the current Titan */
  despawnTitan: () => void;

  // Actions
  /** Move the Titan to a specific grid position */
  moveTitanTo: (gridX: number, gridY: number) => void;
  /** Record an action the Titan performed */
  recordAction: (action: string) => void;

  // Needs
  /** Satisfy a specific need by an amount */
  satisfyNeed: (needType: TitanNeedType, amount: number) => void;

  // Training (God Hand)
  /** Praise the Titan (reinforces last action as good) */
  praise: () => TrainingResult | null;
  /** Punish the Titan (reinforces last action as bad) */
  punish: () => TrainingResult | null;
  /** Check if training is available (action within window) */
  canTrain: () => boolean;
  /** Get last training result */
  lastTrainingResult: TrainingResult | null;

  // Persistence
  /** Save the current Titan state to localStorage */
  saveTitan: () => void;
  /** Load a Titan from localStorage. Returns true if successful. */
  loadTitan: () => boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Auto-save debounce delay (in ms)
 */
const AUTO_SAVE_DELAY_MS = 1000;

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * React hook for managing Titan state
 */
export function useTitan(): UseTitanReturn {
  // State
  const [titan, setTitan] = useState<TitanPet | null>(() => TitanManager.getTitan());
  const [isLoading, setIsLoading] = useState(true);

  // Refs for debouncing and training state
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beliefMapRef = useRef<ActionBeliefMap>(new ActionBeliefMap());
  const historyTrackerRef = useRef<ActionHistoryTracker>(new ActionHistoryTracker());
  const [lastTrainingResult, setLastTrainingResult] = useState<TrainingResult | null>(null);

  // ===========================================================================
  // SYNC STATE WITH TITAN MANAGER
  // ===========================================================================

  /**
   * Sync React state with TitanManager
   */
  const syncState = useCallback(() => {
    const currentTitan = TitanManager.getTitan();
    setTitan(currentTitan ? { ...currentTitan } : null);
  }, []);

  /**
   * Schedule auto-save after a delay
   */
  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      TitanManager.saveToStorage();
    }, AUTO_SAVE_DELAY_MS);
  }, []);

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  // Load from storage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const loaded = TitanManager.loadFromStorage();
        if (loaded) {
          syncState();
        }
      } catch {
        // Storage might not be available (SSR)
      }
      setIsLoading(false);
    };

    loadFromStorage();

    // Cleanup auto-save timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [syncState]);

  // ===========================================================================
  // SPAWN / DESPAWN
  // ===========================================================================

  /**
   * Spawn a new Titan with the given options.
   * Requires gridX and gridY at minimum.
   */
  const spawnTitan = useCallback(
    (options: Partial<TitanSpawnOptions>): TitanPet => {
      // Ensure required fields have defaults
      const fullOptions: TitanSpawnOptions = {
        gridX: options.gridX ?? 0,
        gridY: options.gridY ?? 0,
        species: options.species,
        name: options.name,
        direction: options.direction,
        initialAlignment: options.initialAlignment,
      };

      const newTitan = TitanManager.spawnTitan(fullOptions);
      syncState();
      scheduleAutoSave();
      return newTitan;
    },
    [syncState, scheduleAutoSave]
  );

  /**
   * Despawn (remove) the current Titan
   */
  const despawnTitan = useCallback(() => {
    TitanManager.despawnTitan();
    syncState();
    TitanManager.clearStorage();
  }, [syncState]);

  // ===========================================================================
  // MOVEMENT
  // ===========================================================================

  /**
   * Move the Titan to a specific grid position
   */
  const moveTitanTo = useCallback(
    (gridX: number, gridY: number) => {
      TitanManager.updateTitanPosition(gridX, gridY);
      syncState();
      scheduleAutoSave();
    },
    [syncState, scheduleAutoSave]
  );

  // ===========================================================================
  // ACTION RECORDING
  // ===========================================================================

  /**
   * Record an action the Titan performed.
   * This is used for alignment tracking and reinforcement learning.
   */
  const recordAction = useCallback(
    (action: string) => {
      const currentTitan = TitanManager.getTitan();
      if (!currentTitan) return;

      // Get alignment impact for this action
      const alignmentImpact = getActionAlignmentImpact(action);

      // Create action history entry
      const entry: ActionHistoryEntry = {
        action,
        timestamp: Date.now(),
        alignmentImpact,
        playerResponse: 'ignored', // Will be updated if praised/punished
      };

      // Add to action history (limit to last 500 entries)
      currentTitan.actionHistory = [
        ...currentTitan.actionHistory.slice(-499),
        entry,
      ];

      // Track in historyTracker for training window
      recordTitanActionFn(currentTitan, action, historyTrackerRef.current);

      // Apply alignment impact immediately (small shift)
      if (alignmentImpact !== 0) {
        currentTitan.alignment = Math.max(
          -1,
          Math.min(1, currentTitan.alignment + alignmentImpact * 0.1)
        );
      }

      syncState();
      scheduleAutoSave();
    },
    [syncState, scheduleAutoSave]
  );

  // ===========================================================================
  // NEEDS SATISFACTION
  // ===========================================================================

  /**
   * Satisfy a specific need by an amount
   */
  const satisfyNeed = useCallback(
    (needType: TitanNeedType, amount: number) => {
      const currentTitan = TitanManager.getTitan();
      if (!currentTitan) return;

      // Use the TitanNeeds helper to satisfy the need
      currentTitan.needs = satisfyTitanNeed(currentTitan.needs, needType, amount);

      syncState();
      scheduleAutoSave();
    },
    [syncState, scheduleAutoSave]
  );

  // ===========================================================================
  // TRAINING (GOD HAND)
  // ===========================================================================

  /**
   * Check if training is currently possible (action within window)
   */
  const canTrain = useCallback((): boolean => {
    return historyTrackerRef.current.getTrainableAction() !== null;
  }, []);

  /**
   * Praise the Titan (reinforces last action as good)
   * Uses TitanTraining module for consistent behavior
   */
  const praise = useCallback((): TrainingResult | null => {
    const currentTitan = TitanManager.getTitan();
    if (!currentTitan) return null;

    const result = praiseTitanFn(
      currentTitan,
      beliefMapRef.current,
      historyTrackerRef.current
    );

    // Also update the action history entry if successful
    if (result.success && result.action) {
      const lastEntry =
        currentTitan.actionHistory[currentTitan.actionHistory.length - 1];
      if (lastEntry && lastEntry.action === result.action) {
        lastEntry.playerResponse = 'praised';
      }

      // Sync belief map to Titan's BDI for persistence
      const belief = beliefMapRef.current.getActionBelief(result.action);
      if (belief) {
        currentTitan.bdi.beliefs.actionBeliefs.set(result.action, belief);
      }

      // Update player relationship beliefs
      currentTitan.mood.beliefsAboutPlayer.affection = Math.min(
        1,
        currentTitan.mood.beliefsAboutPlayer.affection + 0.05
      );
      currentTitan.mood.beliefsAboutPlayer.trust = Math.min(
        1,
        currentTitan.mood.beliefsAboutPlayer.trust + 0.02
      );
    }

    setLastTrainingResult(result);
    syncState();
    scheduleAutoSave();
    return result;
  }, [syncState, scheduleAutoSave]);

  /**
   * Punish the Titan (reinforces last action as bad)
   * Uses TitanTraining module for consistent behavior
   */
  const punish = useCallback((): TrainingResult | null => {
    const currentTitan = TitanManager.getTitan();
    if (!currentTitan) return null;

    const result = punishTitanFn(
      currentTitan,
      beliefMapRef.current,
      historyTrackerRef.current
    );

    // Also update the action history entry if successful
    if (result.success && result.action) {
      const lastEntry =
        currentTitan.actionHistory[currentTitan.actionHistory.length - 1];
      if (lastEntry && lastEntry.action === result.action) {
        lastEntry.playerResponse = 'punished';
      }

      // Sync belief map to Titan's BDI for persistence
      const belief = beliefMapRef.current.getActionBelief(result.action);
      if (belief) {
        currentTitan.bdi.beliefs.actionBeliefs.set(result.action, belief);
      }

      // Update player relationship beliefs
      currentTitan.mood.beliefsAboutPlayer.fear = Math.min(
        1,
        currentTitan.mood.beliefsAboutPlayer.fear + 0.05
      );
    }

    setLastTrainingResult(result);
    syncState();
    scheduleAutoSave();
    return result;
  }, [syncState, scheduleAutoSave]);

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  /**
   * Save the current Titan state to localStorage
   */
  const saveTitan = useCallback(() => {
    TitanManager.saveToStorage();
  }, []);

  /**
   * Load a Titan from localStorage
   * @returns true if a Titan was loaded, false otherwise
   */
  const loadTitan = useCallback((): boolean => {
    const loaded = TitanManager.loadFromStorage();
    if (loaded) {
      syncState();
    }
    return loaded;
  }, [syncState]);

  // ===========================================================================
  // RETURN
  // ===========================================================================

  return {
    // State
    titan,
    hasTitan: titan !== null,
    isLoading,

    // Spawn/Despawn
    spawnTitan,
    despawnTitan,

    // Actions
    moveTitanTo,
    recordAction,

    // Needs
    satisfyNeed,

    // Training (God Hand)
    praise,
    punish,
    canTrain,
    lastTrainingResult,

    // Persistence
    saveTitan,
    loadTitan,
  };
}

export default useTitan;
