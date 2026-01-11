/**
 * GameProviders - Combined provider component for all game contexts
 * 
 * This component wraps all the split contexts in the correct order,
 * providing a single point of entry for the game's context providers.
 * 
 * Usage:
 * ```tsx
 * import { GameProviders } from '@/context/GameProviders';
 * 
 * function App() {
 *   return (
 *     <GameProviders>
 *       <Game />
 *     </GameProviders>
 *   );
 * }
 * ```
 * 
 * Components can then use:
 * - useGame() for full backward compatibility (orchestrator)
 * - useUI() for UI-specific state
 * - useSimulation() for simulation state
 * - useEconomy() for economy state
 * - useGrid() for grid state
 */
"use client";

import React from "react";
import { UIProvider } from "./UIContext";
import { SimulationProvider } from "./SimulationContext";
import { EconomyProvider } from "./EconomyContext";
import { GridProvider } from "./GridContext";
import { GameProvider } from "./GameContext";

export interface GameProvidersProps {
  children: React.ReactNode;
  startFresh?: boolean;
}

/**
 * Combined provider that wraps all game contexts in the correct order.
 * 
 * The nesting order is:
 * 1. UIProvider (outermost - independent of other contexts)
 * 2. SimulationProvider
 * 3. EconomyProvider
 * 4. GridProvider
 * 5. GameProvider (innermost - orchestrator that combines all)
 */
export function GameProviders({ children, startFresh = false }: GameProvidersProps) {
  return (
    <UIProvider>
      <SimulationProvider>
        <EconomyProvider>
          <GridProvider>
            <GameProvider startFresh={startFresh}>
              {children}
            </GameProvider>
          </GridProvider>
        </EconomyProvider>
      </SimulationProvider>
    </UIProvider>
  );
}

// Re-export all hooks for convenience
export { useGame } from "./GameContext";
export { useUI } from "./UIContext";
export { useSimulation } from "./SimulationContext";
export { useEconomy } from "./EconomyContext";
export { useGrid } from "./GridContext";
