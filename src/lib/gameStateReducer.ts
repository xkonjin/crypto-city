/**
 * Game State Reducer
 * Final Optimization: Replace multiple useState with single useReducer
 * 
 * Reduces React re-renders and improves state management
 */

export type GameAction =
  | { type: 'SET_TOOL'; tool: string }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'SET_TAX_RATE'; rate: number }
  | { type: 'SET_ACTIVE_PANEL'; panel: string }
  | { type: 'SET_BUDGET_FUNDING'; key: string; funding: number }
  | { type: 'UPDATE_MONEY'; amount: number }
  | { type: 'UPDATE_POPULATION'; population: number }
  | { type: 'PLACE_TILE'; x: number; y: number; tileData: any }
  | { type: 'REMOVE_TILE'; x: number; y: number }
  | { type: 'BATCH_UPDATE'; updates: Partial<GameState> }
  | { type: 'RESET_GAME' };

export interface GameState {
  // Core game state
  selectedTool: string;
  speed: number;
  taxRate: number;
  activePanel: string;
  
  // Economy
  money: number;
  population: number;
  budget: Record<string, number>;
  
  // Grid
  grid: any[][];
  gridSize: number;
  
  // UI state
  isPaused: boolean;
  currentDay: number;
  
  // Version for save/load
  version: number;
}

/**
 * Initial game state
 */
export const initialGameState: GameState = {
  selectedTool: 'select',
  speed: 1,
  taxRate: 7,
  activePanel: 'none',
  money: 10000,
  population: 0,
  budget: {
    police: 50,
    fire: 50,
    health: 50,
    education: 50,
    parks: 50,
    utilities: 50,
  },
  grid: [],
  gridSize: 64,
  isPaused: false,
  currentDay: 1,
  version: 1,
};

/**
 * Game state reducer
 */
export function gameStateReducer(
  state: GameState,
  action: GameAction
): GameState {
  switch (action.type) {
    case 'SET_TOOL':
      return {
        ...state,
        selectedTool: action.tool,
        activePanel: 'none',
      };
    
    case 'SET_SPEED':
      return {
        ...state,
        speed: action.speed,
        isPaused: action.speed === 0,
      };
    
    case 'SET_TAX_RATE':
      return {
        ...state,
        taxRate: Math.max(0, Math.min(100, action.rate)),
      };
    
    case 'SET_ACTIVE_PANEL':
      return {
        ...state,
        activePanel: action.panel,
      };
    
    case 'SET_BUDGET_FUNDING':
      return {
        ...state,
        budget: {
          ...state.budget,
          [action.key]: Math.max(0, Math.min(100, action.funding)),
        },
      };
    
    case 'UPDATE_MONEY':
      return {
        ...state,
        money: Math.max(0, state.money + action.amount),
      };
    
    case 'UPDATE_POPULATION':
      return {
        ...state,
        population: Math.max(0, action.population),
      };
    
    case 'PLACE_TILE': {
      const newGrid = state.grid.map(row => [...row]);
      if (newGrid[action.y] && newGrid[action.y][action.x] !== undefined) {
        newGrid[action.y][action.x] = action.tileData;
      }
      return {
        ...state,
        grid: newGrid,
      };
    }
    
    case 'REMOVE_TILE': {
      const newGrid = state.grid.map(row => [...row]);
      if (newGrid[action.y] && newGrid[action.y][action.x] !== undefined) {
        newGrid[action.y][action.x] = null;
      }
      return {
        ...state,
        grid: newGrid,
      };
    }
    
    case 'BATCH_UPDATE':
      return {
        ...state,
        ...action.updates,
      };
    
    case 'RESET_GAME':
      return {
        ...initialGameState,
        grid: createEmptyGrid(state.gridSize),
      };
    
    default:
      return state;
  }
}

/**
 * Create empty grid
 */
function createEmptyGrid(size: number): any[][] {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

/**
 * Action creators for type safety
 */
export const GameActions = {
  setTool: (tool: string): GameAction => ({
    type: 'SET_TOOL',
    tool,
  }),
  
  setSpeed: (speed: number): GameAction => ({
    type: 'SET_SPEED',
    speed,
  }),
  
  setTaxRate: (rate: number): GameAction => ({
    type: 'SET_TAX_RATE',
    rate,
  }),
  
  setActivePanel: (panel: string): GameAction => ({
    type: 'SET_ACTIVE_PANEL',
    panel,
  }),
  
  setBudgetFunding: (key: string, funding: number): GameAction => ({
    type: 'SET_BUDGET_FUNDING',
    key,
    funding,
  }),
  
  updateMoney: (amount: number): GameAction => ({
    type: 'UPDATE_MONEY',
    amount,
  }),
  
  updatePopulation: (population: number): GameAction => ({
    type: 'UPDATE_POPULATION',
    population,
  }),
  
  placeTile: (x: number, y: number, tileData: any): GameAction => ({
    type: 'PLACE_TILE',
    x,
    y,
    tileData,
  }),
  
  removeTile: (x: number, y: number): GameAction => ({
    type: 'REMOVE_TILE',
    x,
    y,
  }),
  
  batchUpdate: (updates: Partial<GameState>): GameAction => ({
    type: 'BATCH_UPDATE',
    updates,
  }),
  
  resetGame: (): GameAction => ({
    type: 'RESET_GAME',
  }),
};

/**
 * State selectors for memoization
 */
export const GameSelectors = {
  getMoney: (state: GameState) => state.money,
  getPopulation: (state: GameState) => state.population,
  getTaxRate: (state: GameState) => state.taxRate,
  getBudget: (state: GameState) => state.budget,
  getSpeed: (state: GameState) => state.speed,
  isPaused: (state: GameState) => state.isPaused,
  getSelectedTool: (state: GameState) => state.selectedTool,
  getActivePanel: (state: GameState) => state.activePanel,
  
  getTile: (state: GameState, x: number, y: number) => {
    if (state.grid[y] && state.grid[y][x] !== undefined) {
      return state.grid[y][x];
    }
    return null;
  },
  
  getTaxRevenue: (state: GameState) => {
    return Math.floor(state.population * state.taxRate * 0.1);
  },
  
  getBudgetCost: (state: GameState) => {
    return Object.values(state.budget).reduce((sum, value) => sum + value, 0);
  },
  
  getNetIncome: (state: GameState) => {
    const revenue = GameSelectors.getTaxRevenue(state);
    const cost = GameSelectors.getBudgetCost(state);
    return revenue - cost;
  },
};

/**
 * Middleware for side effects
 */
export type GameMiddleware = (
  state: GameState,
  action: GameAction,
  next: (action: GameAction) => void
) => void;

/**
 * Create middleware-enhanced dispatch
 */
export function createEnhancedDispatch(
  dispatch: React.Dispatch<GameAction>,
  middlewares: GameMiddleware[]
) {
  return (action: GameAction) => {
    // Execute middlewares
    for (const middleware of middlewares) {
      // Middleware can intercept or modify actions
      // For now, just log
    }
    
    // Dispatch original action
    dispatch(action);
  };
}

/**
 * Logging middleware
 */
export const loggingMiddleware: GameMiddleware = (state, action, next) => {
  console.log('[GameState]', action.type, action);
  next(action);
};

/**
 * Analytics middleware
 */
export const analyticsMiddleware: GameMiddleware = (state, action, next) => {
  // Track state changes in analytics
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.trackEvent('GameState', action.type);
  }
  next(action);
};
