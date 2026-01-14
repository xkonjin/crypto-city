'use client';

/**
 * Disaster Sounds Hook
 * 
 * "The deep, bassy rumble of an earthquake is somewhat spoiled
 * when you realize you triggered it yourself for 25 USDT₮."
 * 
 * Connects disaster events to sound effects.
 */

import { useEffect, useRef } from 'react';
import { playerDisasterManager, type ActivePlayerDisaster } from '@/lib/disasters/index';
import { getDisasterVisualEffect } from '@/lib/disasters/visualEffects';
import { useSound, type SoundEffect, SOUND_EFFECTS } from './useSound';

// =============================================================================
// SOUND MAPPING
// =============================================================================

/**
 * Map disaster IDs to sound effect keys
 */
const DISASTER_SOUND_MAP: Record<string, SoundEffect> = {
  market_crash: 'market_crash',
  rug_pull: 'rugPull',
  fire: 'fire_alarm',
  earthquake: 'earthquake',
  whale_dump: 'whale_dump',
  fifty_one_attack: 'hack_alarm',
  sec_raid: 'siren',
};

// =============================================================================
// HOOK
// =============================================================================

export interface UseDisasterSoundsOptions {
  /** Enable/disable sounds */
  enabled?: boolean;
}

/**
 * Hook to play sounds when disasters start/end
 */
export function useDisasterSounds({ enabled = true }: UseDisasterSoundsOptions = {}) {
  const { playSfx } = useSound();
  const activeDisastersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to disaster events
    const unsubscribe = playerDisasterManager.subscribe(
      (disaster: ActivePlayerDisaster, isStarting: boolean) => {
        if (isStarting) {
          // Play start sound for new disaster
          const soundKey = DISASTER_SOUND_MAP[disaster.disaster.id];
          if (soundKey && soundKey in SOUND_EFFECTS) {
            playSfx(soundKey);
          }
          activeDisastersRef.current.add(disaster.instanceId);
        } else {
          // Disaster ended
          activeDisastersRef.current.delete(disaster.instanceId);
          
          // Could play an "all clear" sound here if desired
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [enabled, playSfx]);

  return {
    /** Play repair sound when building is repaired */
    playRepairSound: () => playSfx('repair'),
    /** Play a specific disaster sound manually */
    playDisasterSound: (disasterId: string) => {
      const soundKey = DISASTER_SOUND_MAP[disasterId];
      if (soundKey && soundKey in SOUND_EFFECTS) {
        playSfx(soundKey);
      }
    },
  };
}

export default useDisasterSounds;
