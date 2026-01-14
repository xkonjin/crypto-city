'use client';

/**
 * Disaster Visual Effects Hook
 * 
 * "The ships hung in the sky in much the same way that bricks don't.
 * Similarly, these visual effects float across the screen in much
 * the same way that calm, peaceful gameplay doesn't."
 * 
 * Provides state and utilities for rendering disaster visual effects
 * on the game canvas, including screen shake, tints, and particles.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  playerDisasterManager,
  type ActivePlayerDisaster,
  type DamagedBuildingFromDisaster,
} from '@/lib/disasters/index';
import {
  getDisasterVisualEffect,
  getDamagedBuildingOverlay,
  calculateShakeOffset,
  getCombinedScreenTint,
  getCombinedShakeConfig,
  hasActiveScreenShake,
  DEFAULT_DAMAGED_OVERLAY,
  type DisasterVisualEffect,
  type DamagedBuildingOverlay,
  type DisasterParticleConfig,
} from '@/lib/disasters/visualEffects';

// =============================================================================
// TYPES
// =============================================================================

export interface DisasterVisualsState {
  /** Currently active disaster IDs */
  activeDisasterIds: string[];
  /** Active disaster objects for detailed info */
  activeDisasters: ActivePlayerDisaster[];
  /** Buildings that are damaged and need repair */
  damagedBuildings: DamagedBuildingFromDisaster[];
  /** Combined screen tint color */
  screenTint: string;
  /** Current screen shake offset */
  shakeOffset: { x: number; y: number };
  /** Whether screen shake is active */
  isShaking: boolean;
  /** All particle configs to spawn */
  particleConfigs: Array<{
    config: DisasterParticleConfig;
    buildingId?: string;
    position?: { x: number; y: number };
  }>;
}

export interface DamagedBuildingMarker {
  /** Building instance ID */
  buildingId: string;
  /** Grid position */
  gridX: number;
  gridY: number;
  /** Overlay style */
  overlay: DamagedBuildingOverlay;
  /** Disaster that caused damage */
  disasterId: string;
  /** Repair cost in USDT₮ */
  repairCost: number;
}

// =============================================================================
// HOOK
// =============================================================================

export interface UseDisasterVisualsReturn {
  /** Current visual state */
  state: DisasterVisualsState;
  /** Get marker info for a damaged building */
  getDamagedBuildingMarker: (buildingId: string) => DamagedBuildingMarker | null;
  /** Get all damaged building markers */
  getAllDamagedMarkers: () => DamagedBuildingMarker[];
  /** Check if a building is affected by an active disaster */
  isBuildingAffected: (buildingId: string) => boolean;
  /** Get visual effect config for active disaster affecting a building */
  getBuildingDisasterEffect: (buildingId: string) => DisasterVisualEffect | null;
}

export function useDisasterVisuals(): UseDisasterVisualsReturn {
  const [state, setState] = useState<DisasterVisualsState>({
    activeDisasterIds: [],
    activeDisasters: [],
    damagedBuildings: [],
    screenTint: 'transparent',
    shakeOffset: { x: 0, y: 0 },
    isShaking: false,
    particleConfigs: [],
  });

  // Animation refs
  const animationFrameRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const shakeStartTimeRef = useRef<number>(0);

  // Update state from disaster manager
  useEffect(() => {
    const updateFromManager = () => {
      const managerState = playerDisasterManager.getState();
      const activeDisasters = managerState.activeDisasters;
      const activeIds = activeDisasters.map((d: ActivePlayerDisaster) => d.disaster.id);
      const damagedBuildings = managerState.damagedBuildings;

      // Get particle configs from active disasters
      const particleConfigs: DisasterVisualsState['particleConfigs'] = [];
      for (const disaster of activeDisasters) {
        const effect = getDisasterVisualEffect(disaster.disaster.id);
        if (effect) {
          for (const particleConfig of effect.particles) {
            // For building-specific particles, add for each affected building
            if (disaster.affectedBuildingIds.length > 0) {
              for (const buildingId of disaster.affectedBuildingIds) {
                particleConfigs.push({ config: particleConfig, buildingId });
              }
            } else {
              // Global particles (like market crash chart icons)
              particleConfigs.push({ config: particleConfig });
            }
          }
        }
      }

      setState(prev => ({
        ...prev,
        activeDisasterIds: activeIds,
        activeDisasters,
        damagedBuildings,
        screenTint: getCombinedScreenTint(activeIds),
        isShaking: hasActiveScreenShake(activeIds),
        particleConfigs,
      }));
    };

    // Initial update
    updateFromManager();

    // Subscribe to disaster events
    const unsubscribe = playerDisasterManager.subscribe(() => {
      updateFromManager();
      shakeStartTimeRef.current = performance.now();
    });

    // Poll for updates (for smooth animations)
    const interval = setInterval(updateFromManager, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Screen shake animation loop - uses ref to store shake offset for performance
  const shakeOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!state.isShaking) {
      // Reset shake offset when not shaking
      shakeOffsetRef.current = { x: 0, y: 0 };
      return;
    }

    const animate = (time: number) => {
      const shakeConfig = getCombinedShakeConfig(state.activeDisasterIds);
      if (shakeConfig) {
        const elapsed = time - shakeStartTimeRef.current;
        const offset = calculateShakeOffset(shakeConfig, elapsed);
        shakeOffsetRef.current = offset;
        // Update state periodically for components that depend on it
        setState(prev => {
          if (prev.shakeOffset.x !== offset.x || prev.shakeOffset.y !== offset.y) {
            return { ...prev, shakeOffset: offset };
          }
          return prev;
        });
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [state.isShaking, state.activeDisasterIds]);

  // Get damaged building marker
  const getDamagedBuildingMarker = useCallback(
    (buildingId: string): DamagedBuildingMarker | null => {
      const damaged = state.damagedBuildings.find(b => b.buildingId === buildingId);
      if (!damaged) return null;

      const overlay = getDamagedBuildingOverlay(damaged.disasterId) || DEFAULT_DAMAGED_OVERLAY;

      return {
        buildingId: damaged.buildingId,
        gridX: damaged.gridX,
        gridY: damaged.gridY,
        overlay,
        disasterId: damaged.disasterId,
        repairCost: damaged.repairCostUSDT,
      };
    },
    [state.damagedBuildings]
  );

  // Get all damaged building markers
  const getAllDamagedMarkers = useCallback((): DamagedBuildingMarker[] => {
    return state.damagedBuildings.map(damaged => {
      const overlay = getDamagedBuildingOverlay(damaged.disasterId) || DEFAULT_DAMAGED_OVERLAY;
      return {
        buildingId: damaged.buildingId,
        gridX: damaged.gridX,
        gridY: damaged.gridY,
        overlay,
        disasterId: damaged.disasterId,
        repairCost: damaged.repairCostUSDT,
      };
    });
  }, [state.damagedBuildings]);

  // Check if building is affected by active disaster
  const isBuildingAffected = useCallback(
    (buildingId: string): boolean => {
      return state.activeDisasters.some(d => d.affectedBuildingIds.includes(buildingId));
    },
    [state.activeDisasters]
  );

  // Get visual effect for building's disaster
  const getBuildingDisasterEffect = useCallback(
    (buildingId: string): DisasterVisualEffect | null => {
      const affecting = state.activeDisasters.find(d =>
        d.affectedBuildingIds.includes(buildingId)
      );
      if (!affecting) return null;
      return getDisasterVisualEffect(affecting.disaster.id);
    },
    [state.activeDisasters]
  );

  return {
    state,
    getDamagedBuildingMarker,
    getAllDamagedMarkers,
    isBuildingAffected,
    getBuildingDisasterEffect,
  };
}

export default useDisasterVisuals;
