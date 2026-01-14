/**
 * useNPCInspector - Hook for NPC Inspector UI State
 * 
 * Manages the selected NPC state for the progressive disclosure inspector panel.
 * Provides NPC selection, favorites, and real-time thought stream updates.
 * 
 * "The unexamined NPC life is not worth simulating."
 * — Socrates, probably, if he were a game developer
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { NPCManager } from '@/lib/npc/NPCManager';
import { thoughtEngine, type ThoughtContext } from '@/lib/npc/ThoughtEngine';
import type { CryptoNPC } from '@/games/isocity/types/npc';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for the useNPCInspector hook
 */
export interface UseNPCInspectorOptions {
  /** Interval for polling NPC updates (ms) */
  updateInterval?: number;
  /** Context for thought generation */
  thoughtContext?: ThoughtContext;
}

/**
 * Return type for the useNPCInspector hook
 */
export interface UseNPCInspectorReturn {
  /** Currently selected NPC */
  selectedNPC: CryptoNPC | null;
  /** Select an NPC by ID */
  selectNPC: (npcId: string | null) => void;
  /** Clear the selected NPC */
  clearSelection: () => void;
  /** Whether an NPC is selected */
  hasSelection: boolean;
  /** Set of favorited NPC IDs */
  favorites: Set<string>;
  /** Toggle favorite status for an NPC */
  toggleFavorite: (npcId: string) => void;
  /** Check if an NPC is favorited */
  isFavorited: (npcId: string) => boolean;
  /** Recent thoughts for the selected NPC */
  recentThoughts: string[];
  /** Force a thought update for the selected NPC */
  refreshThoughts: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_UPDATE_INTERVAL = 100; // ms
const MAX_RECENT_THOUGHTS = 5;
const FAVORITES_STORAGE_KEY = 'crypto-city-npc-favorites';

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * React hook for managing NPC inspector state
 */
export function useNPCInspector(
  options: UseNPCInspectorOptions = {}
): UseNPCInspectorReturn {
  const {
    updateInterval = DEFAULT_UPDATE_INTERVAL,
    thoughtContext = {
      nearbyNPCs: [],
      marketCondition: 'crab' as const,
      timeOfDay: 'afternoon' as const,
      recentEvents: [],
      gameDay: 1,
    },
  } = options;

  // State
  const [selectedNPCId, setSelectedNPCId] = useState<string | null>(null);
  const [selectedNPC, setSelectedNPC] = useState<CryptoNPC | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        try {
          return new Set(JSON.parse(stored));
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });
  const [recentThoughts, setRecentThoughts] = useState<string[]>([]);

  // Refs for stable callbacks - update in effect to avoid render-time ref access
  const thoughtContextRef = useRef(thoughtContext);
  
  // Update ref in effect to comply with React 19 lint rules
  useEffect(() => {
    thoughtContextRef.current = thoughtContext;
  }, [thoughtContext]);

  // Select an NPC by ID
  const selectNPC = useCallback((npcId: string | null) => {
    setSelectedNPCId(npcId);
    if (npcId) {
      const npc = NPCManager.getNPC(npcId);
      setSelectedNPC(npc || null);
      // Initialize recent thoughts from thought stream if available
      if (npc?.thoughtStream?.currentThought) {
        setRecentThoughts([npc.thoughtStream.currentThought]);
      } else {
        setRecentThoughts([]);
      }
    } else {
      setSelectedNPC(null);
      setRecentThoughts([]);
    }
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedNPCId(null);
    setSelectedNPC(null);
    setRecentThoughts([]);
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback((npcId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(npcId)) {
        next.delete(npcId);
      } else {
        next.add(npcId);
      }
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...next]));
      }
      return next;
    });
  }, []);

  // Check if NPC is favorited
  const isFavorited = useCallback(
    (npcId: string) => favorites.has(npcId),
    [favorites]
  );

  // Refresh thoughts for selected NPC
  const refreshThoughts = useCallback(() => {
    if (!selectedNPC) return;
    
    const newThought = thoughtEngine.generateThought(
      selectedNPC,
      thoughtContextRef.current
    );
    
    setRecentThoughts((prev) => {
      // Don't add duplicate thoughts
      if (prev[0] === newThought) return prev;
      return [newThought, ...prev.slice(0, MAX_RECENT_THOUGHTS - 1)];
    });
  }, [selectedNPC]);

  // Poll for NPC updates when selected
  useEffect(() => {
    if (!selectedNPCId) return;

    const interval = setInterval(() => {
      const updated = NPCManager.getNPC(selectedNPCId);
      if (updated) {
        setSelectedNPC(updated);
        // Update thoughts from thought stream if changed
        if (
          updated.thoughtStream?.currentThought &&
          updated.thoughtStream.currentThought !== recentThoughts[0]
        ) {
          setRecentThoughts((prev) => [
            updated.thoughtStream!.currentThought,
            ...prev.slice(0, MAX_RECENT_THOUGHTS - 1),
          ]);
        }
      } else {
        // NPC was removed, clear selection
        clearSelection();
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [selectedNPCId, updateInterval, recentThoughts, clearSelection]);

  return {
    selectedNPC,
    selectNPC,
    clearSelection,
    hasSelection: selectedNPC !== null,
    favorites,
    toggleFavorite,
    isFavorited,
    recentThoughts,
    refreshThoughts,
  };
}

export default useNPCInspector;
