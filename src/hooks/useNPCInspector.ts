/**
 * useNPCInspector - Hook for Progressive Disclosure NPC Inspector
 * Issue #213: Progressive Disclosure NPC Inspector UI
 * 
 * Manages NPC selection and progressive disclosure state for the inspector panel.
 * Implements 3-level progressive disclosure:
 * - Level 0: Minimal (name + emoji on hover)
 * - Level 1: Basic (name, personality, action)
 * - Level 2: Full (complete profile, thoughts, transactions)
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
 * Disclosure levels for the NPC inspector
 */
export enum DisclosureLevel {
  /** Minimal: Name and mood emoji (hover tooltip) */
  MINIMAL = 0,
  /** Basic: Name, personality archetype, current action */
  BASIC = 1,
  /** Full: Complete profile, thoughts, transactions, relationships */
  FULL = 2,
}

/**
 * Options for the useNPCInspector hook
 */
export interface UseNPCInspectorOptions {
  /** Interval for polling NPC updates (ms) */
  updateInterval?: number;
  /** Context for thought generation */
  thoughtContext?: ThoughtContext;
  /** Initial disclosure level */
  initialLevel?: DisclosureLevel;
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
  /** Current disclosure level */
  disclosureLevel: DisclosureLevel;
  /** Set disclosure level */
  setDisclosureLevel: (level: DisclosureLevel) => void;
  /** Expand to next disclosure level */
  expandLevel: () => void;
  /** Collapse to previous disclosure level */
  collapseLevel: () => void;
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
  /** NPC being hovered (for Level 0 tooltip) */
  hoveredNPC: CryptoNPC | null;
  /** Set hovered NPC */
  setHoveredNPC: (npc: CryptoNPC | null) => void;
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
 * React hook for managing NPC inspector state with progressive disclosure
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
    initialLevel = DisclosureLevel.MINIMAL,
  } = options;

  // State
  const [selectedNPCId, setSelectedNPCId] = useState<string | null>(null);
  const [selectedNPC, setSelectedNPC] = useState<CryptoNPC | null>(null);
  const [hoveredNPC, setHoveredNPC] = useState<CryptoNPC | null>(null);
  const [disclosureLevel, setDisclosureLevel] = useState<DisclosureLevel>(initialLevel);
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

  // Refs for stable callbacks
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
      // Start at Level 1 when selecting
      setDisclosureLevel(DisclosureLevel.BASIC);
      // Initialize recent thoughts from thought stream if available
      if (npc?.thoughtStream?.currentThought) {
        setRecentThoughts([npc.thoughtStream.currentThought]);
      } else {
        setRecentThoughts([]);
      }
    } else {
      setSelectedNPC(null);
      setDisclosureLevel(DisclosureLevel.MINIMAL);
      setRecentThoughts([]);
    }
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedNPCId(null);
    setSelectedNPC(null);
    setDisclosureLevel(DisclosureLevel.MINIMAL);
    setRecentThoughts([]);
  }, []);

  // Expand to next disclosure level
  const expandLevel = useCallback(() => {
    setDisclosureLevel(prev => Math.min(DisclosureLevel.FULL, prev + 1) as DisclosureLevel);
  }, []);

  // Collapse to previous disclosure level
  const collapseLevel = useCallback(() => {
    setDisclosureLevel(prev => Math.max(DisclosureLevel.MINIMAL, prev - 1) as DisclosureLevel);
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
            (updated.thoughtStream!.currentThought ?? '') as string,
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
    disclosureLevel,
    setDisclosureLevel,
    expandLevel,
    collapseLevel,
    favorites,
    toggleFavorite,
    isFavorited,
    recentThoughts,
    refreshThoughts,
    hoveredNPC,
    setHoveredNPC,
  };
}

export default useNPCInspector;
