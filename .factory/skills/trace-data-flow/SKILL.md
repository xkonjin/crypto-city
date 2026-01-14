---
name: trace-data-flow
description: Trace state flow from simulation through context to canvas rendering. Use when debugging state synchronization issues.
---

# Trace Data Flow

Systematic approach to tracing data through CryptoCity's layered architecture.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: SIMULATION (Source of Truth)                      │
│  Files: simulation.ts, GameContext.tsx                      │
│  State: GameState, grid, stats, budget                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ React state / refs
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: RENDERING (Visualization)                         │
│  Files: CanvasIsometricGrid.tsx                             │
│  Reads: latestStateRef (mutable ref for performance)        │
└─────────────────────────────────────────────────────────────┘
                      │ reads grid
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: AGENTS (Cosmetic)                                 │
│  Files: NPCSimulation.ts, vehicleSystems                    │
│  Read-only grid access, never writes                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Data Flows

### 1. User Places Building

```
User clicks canvas
    │
    ▼ (CanvasIsometricGrid.tsx)
handleCanvasClick(screenX, screenY)
    │
    ▼ (convert to grid coords)
screenToGrid(screenX, screenY) → { gridX, gridY }
    │
    ▼ (GameContext.tsx)
placeAtTile(gridX, gridY)
    │
    ▼ (simulation.ts)
placeBuilding(state, x, y, buildingType, zoneType)
    │
    ▼ (returns new state)
setState(newState)
    │
    ├─► latestStateRef.current = newState (immediate)
    │
    └─► React re-render (throttled 500ms) → UI updates
    │
    ▼ (next render frame)
Canvas reads latestStateRef → draws building
```

### 2. Simulation Tick

```
setInterval (GameContext.tsx)
    │
    ▼
simulateTick(latestStateRef.current)
    │
    ├─► calculateServiceCoverage()
    ├─► calculateStats()
    ├─► evolveBuildings()
    ├─► handleDisasters()
    │
    ▼ (returns newState)
latestStateRef.current = newState (immediate)
    │
    ├─► Canvas sees changes immediately
    │
    └─► setState (every 500ms) → React UI updates
```

### 3. NPC Updates

```
NPCSimulation.tick()
    │
    ├─► forEach NPC:
    │       updateNeeds(npc)
    │       updatePosition(npc)
    │       checkInteractions(npc)
    │
    ▼ (reads grid for pathfinding)
grid = latestStateRef.current.grid
    │
    ├─► hasRoadAccess(grid, x, y)
    ├─► findPath(grid, start, end)
    │
    ▼ (updates NPC state)
NPCManager.updateNPC(npc)
    │
    ▼ (next render frame)
drawPedestrians() reads NPCManager state
```

### 4. Crypto Economy

```
CryptoEconomyManager.tick()
    │
    ├─► calculateYields(buildings)
    ├─► applySynergies()
    ├─► processEvents()
    │
    ▼ (emits updates)
economyState.subscribe(callback)
    │
    ▼ (Game.tsx listens)
onEconomyUpdate(newEconomyState)
    │
    ├─► Update overlay data
    ├─► Calculate crypto tax revenue
    │
    ▼
setCryptoTaxRevenue(revenue) → GameContext
    │
    ▼
Budget includes crypto income
```

## Tracing Methodology

### Step 1: Identify the Symptom

| Symptom | Likely Layer |
|---------|--------------|
| Value wrong in UI | Layer 1 (state) or React render |
| Building not showing | Layer 2 (canvas render) |
| NPC behavior wrong | Layer 3 (agent logic) |
| Stat not updating | Layer 1 (simulation tick) |

### Step 2: Find Entry Point

```bash
# Search for where value is set
Grep: "setState.*propertyName"
Grep: "propertyName ="
Grep: "propertyName:"

# Search for where value is read
Grep: "state.propertyName"
Grep: "propertyName}"
```

### Step 3: Trace Forward

Starting from the source, follow the data:

1. Where is it calculated?
2. Where is it stored?
3. Where is it read?
4. Where is it displayed?

### Step 4: Check Each Hop

At each step, verify:
- Is the value correct here?
- Is it being transformed correctly?
- Are there timing issues?

## Common Data Paths

### Grid State
```
simulation.ts: placeBuilding()
    → GameContext: setState({ grid: newGrid })
    → latestStateRef.current.grid
    → CanvasIsometricGrid: reads grid for rendering
```

### Population
```
simulation.ts: calculateStats()
    → GameState.stats.population
    → GameContext: state.stats.population
    → TopBar/MobileTopBar: displays population
```

### Crypto Yield
```
CryptoEconomyManager: calculateYields()
    → economyState.buildings[id].currentYield
    → Game.tsx: subscription callback
    → BuildingTooltip: displays yield
```

### NPC Position
```
NPCSimulation: updatePosition()
    → NPC.position = { x, y }
    → NPCManager.npcs
    → drawPedestrians: reads positions
```

## Debug Output Format

```
Data Flow Trace: [symptom description]

Source:
  File: <file>
  Function: <function>
  Value: <value at source>

Transformations:
  1. <file:function> → <transformation> → <value>
  2. <file:function> → <transformation> → <value>

Destination:
  File: <file>
  Function: <function>
  Value: <value at destination>

Issue Found:
  Location: <file:line>
  Problem: <description>
  
Fix:
  <code change>
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Stale value in UI | Missing useEffect dependency | Add dependency |
| Canvas shows old state | Reading React state instead of ref | Use latestStateRef |
| NPC sees old grid | Timing: read before write | Ensure tick order |
| Yield not updating | Subscription not firing | Check subscribe/emit |
