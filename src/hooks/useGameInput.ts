/**
 * useGameInput Hook
 * 
 * Manages keyboard shortcuts and input handling for the game.
 * Extracted from Game.tsx for better separation of concerns.
 * 
 * Issue #143: Split Game.tsx into smaller components
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { Tool } from '@/types/game';
import { OverlayMode } from '@/components/game/types';
import { getOverlayForTool } from '@/components/game/overlays';

interface UseGameInputProps {
  overlayMode: OverlayMode;
  setOverlayMode: (mode: OverlayMode) => void;
  selectedTile: { x: number; y: number } | null;
  setSelectedTile: (tile: { x: number; y: number } | null) => void;
  setShowCodex: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useGameInput({
  overlayMode,
  setOverlayMode,
  selectedTile,
  setSelectedTile,
  setShowCodex,
}: UseGameInputProps) {
  const { state, setTool, setActivePanel, setSpeed } = useGame();
  
  const isInitialMount = useRef(true);
  const initialSelectedToolRef = useRef<Tool | null>(null);
  const previousSelectedToolRef = useRef<Tool | null>(null);
  const hasCapturedInitialTool = useRef(false);
  const currentSelectedToolRef = useRef<Tool>(state.selectedTool);

  // Keep currentSelectedToolRef in sync with state
  useEffect(() => {
    currentSelectedToolRef.current = state.selectedTool;
  }, [state.selectedTool]);

  // Track the initial selectedTool after localStorage loads
  useEffect(() => {
    if (!hasCapturedInitialTool.current) {
      const timeoutId = setTimeout(() => {
        initialSelectedToolRef.current = currentSelectedToolRef.current;
        previousSelectedToolRef.current = currentSelectedToolRef.current;
        hasCapturedInitialTool.current = true;
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Auto-set overlay when selecting utility tools
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Select tool always resets overlay to none
    if (state.selectedTool === "select") {
      setTimeout(() => {
        setOverlayMode("none");
      }, 0);
      previousSelectedToolRef.current = state.selectedTool;
      return;
    }

    // Subway tool sets overlay
    if (
      state.selectedTool === "subway" ||
      state.selectedTool === "subway_station"
    ) {
      setTimeout(() => {
        setOverlayMode("subway");
      }, 0);
      previousSelectedToolRef.current = state.selectedTool;
      return;
    }

    // Don't auto-set overlay until we've captured the initial tool
    if (!hasCapturedInitialTool.current) {
      return;
    }

    // Don't auto-set overlay if this matches the initial tool from localStorage
    if (
      initialSelectedToolRef.current !== null &&
      initialSelectedToolRef.current === state.selectedTool
    ) {
      return;
    }

    // Don't auto-set overlay if tool hasn't changed
    if (previousSelectedToolRef.current === state.selectedTool) {
      return;
    }

    // Update previous tool reference
    previousSelectedToolRef.current = state.selectedTool;

    setTimeout(() => {
      setOverlayMode(getOverlayForTool(state.selectedTool));
    }, 0);
  }, [state.selectedTool, setOverlayMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (overlayMode !== "none") {
          setOverlayMode("none");
        } else if (state.activePanel !== "none") {
          setActivePanel("none");
        } else if (selectedTile) {
          setSelectedTile(null);
        } else if (state.selectedTool !== "select") {
          setTool("select");
        }
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setTool("bulldoze");
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setSpeed(state.speed === 0 ? 1 : 0);
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setShowCodex(prev => !prev);
      } else if (e.key === "z" || e.key === "Z") {
        // Zone overlay toggle (Issue #208)
        e.preventDefault();
        setOverlayMode(overlayMode === "zone" ? "none" : "zone");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.activePanel,
    state.selectedTool,
    state.speed,
    selectedTile,
    setActivePanel,
    setTool,
    setSpeed,
    overlayMode,
    setOverlayMode,
    setSelectedTile,
    setShowCodex,
  ]);
}
