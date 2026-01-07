// =============================================================================
// GAME STORE - ZUSTAND STATE MANAGEMENT
// =============================================================================
// Centralized state management for the Crypto City game.
// Replaces scattered useState calls with a single source of truth.
//
// Benefits:
// - No prop drilling
// - Components can subscribe to only the state they need
// - Easier debugging and state inspection
// - State persistence built-in

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  GridCell,
  TileType,
  ToolType,
  Direction,
  VisualSettings,
  CryptoEconomyState,
  CryptoEvent,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../components/game/types';
import { SIMULATION_CONFIG, UI_CONFIG } from '../config/gameConfig';

// =============================================================================
// STATE INTERFACE
// =============================================================================

export interface GameState {
  // ----- Grid State -----
  grid: GridCell[][];
  
  // ----- Tool State -----
  selectedTool: ToolType;
  selectedBuildingId: string | null;
  buildingOrientation: Direction;
  
  // ----- Camera State -----
  zoom: number;
  
  // ----- Economy State -----
  economyState: CryptoEconomyState;
  currentTick: number;
  
  // ----- Event State -----
  activeEvents: CryptoEvent[];
  eventHistory: CryptoEvent[];
  selectedEvent: CryptoEvent | null;
  
  // ----- UI State -----
  showLoadWindow: boolean;
  showModal: boolean;
  modalTitle: string;
  modalChildren: React.ReactNode;
  showPrompt: boolean;
  promptMessage: string;
  promptPlaceholder: string;
  promptDefaultValue: string;
  
  // ----- Visual Settings -----
  visualSettings: VisualSettings;
  
  // ----- Device State -----
  isMobile: boolean;
}

// =============================================================================
// ACTIONS INTERFACE
// =============================================================================

export interface GameActions {
  // ----- Grid Actions -----
  setGrid: (grid: GridCell[][]) => void;
  updateCell: (x: number, y: number, updates: Partial<GridCell>) => void;
  updateCells: (updates: Array<{ x: number; y: number; cell: Partial<GridCell> }>) => void;
  resetGrid: () => void;
  
  // ----- Tool Actions -----
  setSelectedTool: (tool: ToolType) => void;
  setSelectedBuildingId: (id: string | null) => void;
  setBuildingOrientation: (orientation: Direction) => void;
  rotateBuildingClockwise: () => void;
  
  // ----- Camera Actions -----
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  
  // ----- Economy Actions -----
  setEconomyState: (state: CryptoEconomyState) => void;
  setCurrentTick: (tick: number) => void;
  
  // ----- Event Actions -----
  addActiveEvent: (event: CryptoEvent) => void;
  removeActiveEvent: (eventId: string) => void;
  setActiveEvents: (events: CryptoEvent[]) => void;
  addToEventHistory: (event: CryptoEvent) => void;
  setSelectedEvent: (event: CryptoEvent | null) => void;
  
  // ----- UI Actions -----
  setShowLoadWindow: (show: boolean) => void;
  openModal: (title: string, children: React.ReactNode) => void;
  closeModal: () => void;
  openPrompt: (message: string, placeholder?: string, defaultValue?: string) => void;
  closePrompt: () => void;
  
  // ----- Visual Settings Actions -----
  setVisualSettings: (settings: VisualSettings) => void;
  updateVisualSetting: <K extends keyof VisualSettings>(key: K, value: VisualSettings[K]) => void;
  
  // ----- Device Actions -----
  setIsMobile: (isMobile: boolean) => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create an empty grass grid
 */
function createEmptyGrid(): GridCell[][] {
  return Array.from({ length: GRID_HEIGHT }, (_, y) =>
    Array.from({ length: GRID_WIDTH }, (_, x) => ({
      type: TileType.Grass,
      x,
      y,
      isOrigin: true,
    }))
  );
}

/**
 * Create initial visual settings
 */
function createInitialVisualSettings(): VisualSettings {
  return {
    blueness: 0,
    contrast: 1.0,
    saturation: 1.0,
    brightness: 1.0,
    showGrid: false,
    showPaths: false,
    showStats: true,
    ambientParticles: true,
    screenShake: true,
    musicEnabled: true,
    soundEnabled: true,
  };
}

/**
 * Create initial economy state
 */
function createInitialEconomy(): CryptoEconomyState {
  return {
    treasury: SIMULATION_CONFIG.STARTING_TREASURY,
    dailyYield: 0,
    totalTVL: 0,
    marketSentiment: 0,
    globalYieldMultiplier: 1.0,
    globalVolatilityMultiplier: 1.0,
    cryptoBuildingCount: 0,
    buildingsByTier: {
      degen: 0,
      retail: 0,
      whale: 0,
      institution: 0,
      shark: 0,
      fish: 0,
    },
    buildingsByChain: {},
    treasuryHistory: [SIMULATION_CONFIG.STARTING_TREASURY],
    sentimentHistory: [0],
  };
}

/**
 * Get next zoom level
 */
function getNextZoom(currentZoom: number, direction: 'in' | 'out'): number {
  const levels = UI_CONFIG.ZOOM_LEVELS;
  const currentIndex = levels.indexOf(currentZoom as typeof levels[number]);
  
  if (currentIndex === -1) {
    // Find closest zoom level
    const closestIndex = levels.reduce((closest, z, i) =>
      Math.abs(z - currentZoom) < Math.abs(levels[closest] - currentZoom) ? i : closest, 0);
    return levels[closestIndex];
  }
  
  if (direction === 'in') {
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  } else {
    return levels[Math.max(currentIndex - 1, 0)];
  }
}

/**
 * Rotate direction clockwise
 */
function rotateClockwise(dir: Direction): Direction {
  const order = [Direction.Down, Direction.Left, Direction.Up, Direction.Right];
  const currentIndex = order.indexOf(dir);
  return order[(currentIndex + 1) % 4];
}

// =============================================================================
// STORE CREATION
// =============================================================================

export const useGameStore = create<GameState & GameActions>()(
  subscribeWithSelector((set, get) => ({
    // ----- Initial State -----
    grid: createEmptyGrid(),
    selectedTool: ToolType.None,
    selectedBuildingId: null,
    buildingOrientation: Direction.Down,
    zoom: 1,
    economyState: createInitialEconomy(),
    currentTick: 0,
    activeEvents: [],
    eventHistory: [],
    selectedEvent: null,
    showLoadWindow: false,
    showModal: false,
    modalTitle: '',
    modalChildren: null,
    showPrompt: false,
    promptMessage: '',
    promptPlaceholder: '',
    promptDefaultValue: '',
    visualSettings: createInitialVisualSettings(),
    isMobile: false,

    // ----- Grid Actions -----
    setGrid: (grid) => set({ grid }),
    
    updateCell: (x, y, updates) => set((state) => {
      const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
      if (newGrid[y]?.[x]) {
        newGrid[y][x] = { ...newGrid[y][x], ...updates };
      }
      return { grid: newGrid };
    }),
    
    updateCells: (updates) => set((state) => {
      const newGrid = state.grid.map((row) => row.map((cell) => ({ ...cell })));
      for (const { x, y, cell } of updates) {
        if (newGrid[y]?.[x]) {
          newGrid[y][x] = { ...newGrid[y][x], ...cell };
        }
      }
      return { grid: newGrid };
    }),
    
    resetGrid: () => set({ grid: createEmptyGrid() }),

    // ----- Tool Actions -----
    setSelectedTool: (tool) => set({ selectedTool: tool }),
    
    setSelectedBuildingId: (id) => set({ 
      selectedBuildingId: id,
      // Reset orientation when selecting new building
      buildingOrientation: Direction.Down,
    }),
    
    setBuildingOrientation: (orientation) => set({ buildingOrientation: orientation }),
    
    rotateBuildingClockwise: () => set((state) => ({
      buildingOrientation: rotateClockwise(state.buildingOrientation),
    })),

    // ----- Camera Actions -----
    setZoom: (zoom) => set({ zoom }),
    
    zoomIn: () => set((state) => ({
      zoom: getNextZoom(state.zoom, 'in'),
    })),
    
    zoomOut: () => set((state) => ({
      zoom: getNextZoom(state.zoom, 'out'),
    })),

    // ----- Economy Actions -----
    setEconomyState: (economyState) => set({ economyState }),
    
    setCurrentTick: (currentTick) => set({ currentTick }),

    // ----- Event Actions -----
    addActiveEvent: (event) => set((state) => ({
      activeEvents: [...state.activeEvents, event],
    })),
    
    removeActiveEvent: (eventId) => set((state) => ({
      activeEvents: state.activeEvents.filter((e) => e.id !== eventId),
    })),
    
    setActiveEvents: (events) => set({ activeEvents: events }),
    
    addToEventHistory: (event) => set((state) => ({
      eventHistory: [...state.eventHistory.slice(-49), event],
    })),
    
    setSelectedEvent: (event) => set({ selectedEvent: event }),

    // ----- UI Actions -----
    setShowLoadWindow: (show) => set({ showLoadWindow: show }),
    
    openModal: (title, children) => set({
      showModal: true,
      modalTitle: title,
      modalChildren: children,
    }),
    
    closeModal: () => set({
      showModal: false,
      modalTitle: '',
      modalChildren: null,
    }),
    
    openPrompt: (message, placeholder = '', defaultValue = '') => set({
      showPrompt: true,
      promptMessage: message,
      promptPlaceholder: placeholder,
      promptDefaultValue: defaultValue,
    }),
    
    closePrompt: () => set({
      showPrompt: false,
      promptMessage: '',
      promptPlaceholder: '',
      promptDefaultValue: '',
    }),

    // ----- Visual Settings Actions -----
    setVisualSettings: (settings) => set({ visualSettings: settings }),
    
    updateVisualSetting: (key, value) => set((state) => ({
      visualSettings: { ...state.visualSettings, [key]: value },
    })),

    // ----- Device Actions -----
    setIsMobile: (isMobile) => set({ isMobile }),
  }))
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================
// Use these for optimized re-renders - components only update when their
// selected state changes

export const useGrid = () => useGameStore((s) => s.grid);
export const useSelectedTool = () => useGameStore((s) => s.selectedTool);
export const useSelectedBuildingId = () => useGameStore((s) => s.selectedBuildingId);
export const useBuildingOrientation = () => useGameStore((s) => s.buildingOrientation);
export const useZoom = () => useGameStore((s) => s.zoom);
export const useEconomyState = () => useGameStore((s) => s.economyState);
export const useActiveEvents = () => useGameStore((s) => s.activeEvents);
export const useEventHistory = () => useGameStore((s) => s.eventHistory);
export const useSelectedEvent = () => useGameStore((s) => s.selectedEvent);
export const useVisualSettings = () => useGameStore((s) => s.visualSettings);
export const useIsMobile = () => useGameStore((s) => s.isMobile);

// UI state selectors
export const useShowLoadWindow = () => useGameStore((s) => s.showLoadWindow);
export const useShowModal = () => useGameStore((s) => s.showModal);
export const useModalContent = () => useGameStore((s) => ({
  title: s.modalTitle,
  children: s.modalChildren,
}));

// Action selectors (these never change, so no re-renders)
export const useGameActions = () => useGameStore((s) => ({
  setGrid: s.setGrid,
  updateCell: s.updateCell,
  updateCells: s.updateCells,
  resetGrid: s.resetGrid,
  setSelectedTool: s.setSelectedTool,
  setSelectedBuildingId: s.setSelectedBuildingId,
  setBuildingOrientation: s.setBuildingOrientation,
  rotateBuildingClockwise: s.rotateBuildingClockwise,
  setZoom: s.setZoom,
  zoomIn: s.zoomIn,
  zoomOut: s.zoomOut,
  setEconomyState: s.setEconomyState,
  setCurrentTick: s.setCurrentTick,
  addActiveEvent: s.addActiveEvent,
  removeActiveEvent: s.removeActiveEvent,
  setActiveEvents: s.setActiveEvents,
  addToEventHistory: s.addToEventHistory,
  setSelectedEvent: s.setSelectedEvent,
  setShowLoadWindow: s.setShowLoadWindow,
  openModal: s.openModal,
  closeModal: s.closeModal,
  openPrompt: s.openPrompt,
  closePrompt: s.closePrompt,
  setVisualSettings: s.setVisualSettings,
  updateVisualSetting: s.updateVisualSetting,
  setIsMobile: s.setIsMobile,
}));

// =============================================================================
// STORE UTILITIES
// =============================================================================

/**
 * Get the current state (for use outside React components)
 */
export const getGameState = () => useGameStore.getState();

/**
 * Subscribe to state changes (for use outside React components)
 */
export const subscribeToStore = useGameStore.subscribe;

/**
 * Reset the entire store to initial state
 */
export const resetGameStore = () => useGameStore.setState({
  grid: createEmptyGrid(),
  selectedTool: ToolType.None,
  selectedBuildingId: null,
  buildingOrientation: Direction.Down,
  zoom: 1,
  economyState: createInitialEconomy(),
  currentTick: 0,
  activeEvents: [],
  eventHistory: [],
  selectedEvent: null,
  showLoadWindow: false,
  showModal: false,
  modalTitle: '',
  modalChildren: null,
  showPrompt: false,
  promptMessage: '',
  promptPlaceholder: '',
  promptDefaultValue: '',
  visualSettings: createInitialVisualSettings(),
});

