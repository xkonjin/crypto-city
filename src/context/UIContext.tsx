/**
 * UIContext - UI-related state management
 * 
 * Manages:
 * - activePanel state (which panel is open)
 * - selectedTool state (current building/action tool)
 * - selectedCryptoBuilding state (for crypto building placement)
 * - UI-related actions
 */
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { Tool, GameState } from "@/types/game";

export type ActivePanel = GameState["activePanel"];

export interface UIContextValue {
  // State
  activePanel: ActivePanel;
  selectedTool: Tool;
  selectedCryptoBuilding: string | null;
  
  // Actions
  setActivePanel: (panel: ActivePanel) => void;
  setTool: (tool: Tool) => void;
  setSelectedCryptoBuilding: (buildingId: string | null) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanelState] = useState<ActivePanel>("none");
  const [selectedTool, setSelectedToolState] = useState<Tool>("select");
  const [selectedCryptoBuilding, setSelectedCryptoBuildingState] = useState<string | null>(null);

  const setActivePanel = useCallback((panel: ActivePanel) => {
    setActivePanelState(panel);
  }, []);

  const setTool = useCallback((tool: Tool) => {
    setSelectedToolState(tool);
    // Close panel when selecting a tool
    setActivePanelState("none");
  }, []);

  const setSelectedCryptoBuilding = useCallback((buildingId: string | null) => {
    setSelectedCryptoBuildingState(buildingId);
  }, []);

  const value: UIContextValue = {
    activePanel,
    selectedTool,
    selectedCryptoBuilding,
    setActivePanel,
    setTool,
    setSelectedCryptoBuilding,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return ctx;
}

export { UIContext };
