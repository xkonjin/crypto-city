# CONTEXT PROVIDERS

React Context for global game state and multiplayer. 2 files.

## STRUCTURE

```
context/
├── GameContext.tsx        # Main game state (62KB - large file!)
└── MultiplayerContext.tsx # Co-op room management
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Game state management | `GameContext.tsx` |
| Add new game action | `GameContext.tsx` |
| Multiplayer rooms | `MultiplayerContext.tsx` |
| Player sync | `MultiplayerContext.tsx` |

## GameContext.tsx (CRITICAL FILE)

The heart of the game - manages all state and actions.

### State Shape
```typescript
interface GameState {
  // Grid
  grid: Tile[][];
  gridSize: number;
  
  // City info
  cityName: string;
  year: number;
  month: number;
  
  // Economy
  stats: {
    population: number;
    money: number;
    happiness: number;
  };
  budget: BudgetState;
  
  // Tools
  selectedTool: ToolType;
  selectedBuilding: BuildingType | null;
  
  // Simulation
  simSpeed: SimSpeed;
  simData: SimulationData;
  
  // UI
  overlayMode: OverlayMode;
  showGrid: boolean;
  
  // Crypto integration
  cryptoEffects: CryptoEffects;
}
```

### Key Actions
```typescript
// Building placement
placeBuilding(x, y, buildingType, orientation);
demolishBuilding(x, y);

// Zones
paintZone(tiles, zoneType, density);
removeZone(tiles);

// Tools
setSelectedTool(tool);
setSelectedBuilding(building);

// Simulation
setSimSpeed(speed);
runSimulationTick();

// Save/Load
saveGame();
loadGame(saveData);
exportCity();
```

### Provider Usage
```typescript
// Wrap app in provider
<GameProvider startFresh={false}>
  <Game />
</GameProvider>

// Access in components
const { state, dispatch, actions } = useGame();
```

## MultiplayerContext.tsx

Manages co-op game sessions.

### State
```typescript
interface MultiplayerState {
  roomCode: string | null;
  isHost: boolean;
  players: Player[];
  isConnected: boolean;
}
```

### Actions
```typescript
createRoom();           // Host creates room
joinRoom(code);         // Guest joins
leaveRoom();           // Disconnect
broadcastAction(action); // Sync state to others
```

## CONVENTIONS

### Reducer Pattern
```typescript
// GameContext uses useReducer for complex state
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_BUILDING':
      return { ...state, grid: updatedGrid };
    // ...
  }
}
```

### Performance
- Memoize expensive computations
- Split context if needed (avoided here for simplicity)
- Use `useMemo` for derived state

### Persistence
- Auto-save to localStorage on state changes
- Compressed with lz-string
- Web Worker for heavy saves

## ANTI-PATTERNS

- **Don't modify state directly** - Use dispatch/actions
- **Don't put UI state here** - Only game logic state
- **Don't skip memoization** - Large state = re-render issues
- **Don't block main thread** - Heavy ops go to Worker

## NOTES

- GameContext.tsx is 62KB - consider splitting if it grows more
- Multiplayer syncs via Supabase realtime
- State shape matches save file format
- Crypto effects applied via realityBlender
