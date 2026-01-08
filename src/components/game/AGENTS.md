# GAME SYSTEMS

Core isometric rendering and game mechanics. 41 files, canvas-based.

## STRUCTURE

```
game/
├── CanvasIsometricGrid.tsx  # Main React canvas component
├── constants.ts             # TILE_WIDTH, TILE_HEIGHT, grid sizes
├── types.ts                 # TileType, ToolType, Direction enums
├── panels/                  # UI panels (budget, advisors, stats)
│
├── # RENDERING
├── drawing.ts               # Core canvas draw routines
├── renderHelpers.ts         # Depth sorting, sprite helpers
├── buildingSprite.ts        # Building texture management
├── buildingHelpers.ts       # Building registry + placement
├── overlays.ts              # Data visualization layers
├── lightingSystem.ts        # Day/night cycle
│
├── # ENTITY SYSTEMS
├── pedestrianSystem.ts      # NPC spawning + pathfinding
├── drawPedestrians.ts       # NPC rendering
├── trafficSystem.ts         # Car AI
├── vehicleSystems.ts        # All vehicle types
├── trainSystem.ts           # Rail vehicles
├── boatSystem.ts            # Water vehicles
├── seaplaneSystem.ts        # Aircraft
├── aircraftSystems.ts       # Helicopters, planes
├── bargeSystem.ts           # Cargo boats
│
├── # INFRASTRUCTURE
├── roadDrawing.ts           # Road auto-connect logic
├── railSystem.ts            # Rail track connections
├── bridgeSystem.ts          # Bridge placement
├── bridgeDrawing.ts         # Bridge rendering
│
├── # UTILITIES
├── utils.ts                 # gridToScreen(), screenToGrid()
├── gridFinders.ts           # Find tiles by type
├── imageLoader.ts           # Sprite loading + caching
├── effectsSystems.ts        # Particles, animations
└── incidentData.ts          # Event definitions
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Canvas rendering | `CanvasIsometricGrid.tsx` → `drawing.ts` |
| Add building type | `buildingHelpers.ts` + sprites in `/public/Building/` |
| NPC behavior | `pedestrianSystem.ts` |
| Car behavior | `trafficSystem.ts`, `vehicleSystems.ts` |
| Road connections | `roadDrawing.ts` |
| Depth sorting | `renderHelpers.ts` |
| Grid constants | `constants.ts` |

## CONVENTIONS

### Coordinate Systems
```typescript
// Grid → Screen
screenX = (gridX - gridY) * (TILE_WIDTH / 2)
screenY = (gridX + gridY) * (TILE_HEIGHT / 2)

// Screen → Grid (reverse)
gridX = floor(screenX / TILE_WIDTH + screenY / TILE_HEIGHT)
gridY = floor(screenY / TILE_HEIGHT - screenX / TILE_WIDTH)
```

### Depth Layers
```
0.00 - Ground tiles
0.03 - Back fences
0.05 - Buildings
0.06 - Props/trees
0.10 - Cars
0.20 - Characters
```

### Entity Systems Pattern
Each system exports: `spawn*()`, `update*()`, `draw*()` functions.
Systems read grid for pathfinding but never mutate it.

## ANTI-PATTERNS

- **Don't mutate grid** - Emit events back to React instead
- **Don't skip depth calculation** - Causes rendering glitches
- **Don't hardcode 44/22** - Use TILE_WIDTH/TILE_HEIGHT constants
- **Don't render outside canvas bounds** - Check viewport first

## NOTES

- `CanvasIsometricGrid.tsx` is the single entry point for rendering
- `panels/` are React components rendered outside canvas
- Vehicle systems share similar interfaces for consistency
