# GAME LAYER - AGENTS KNOWLEDGE BASE

React-Phaser bridge layer. Grid state lives here, Phaser only renders.

## STRUCTURE

```
game/
├── GameBoard.tsx       # ROOT COMPONENT - all grid state, tool handling
├── types.ts            # GridCell, TileType, CryptoEffects, constants
├── roadUtils.ts        # Road connection/snapping logic
├── phaser/             # Phaser engine [SEE AGENTS.md]
└── procedural/         # Terrain generation algorithms
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Grid mutations | GameBoard.tsx | Only place to modify grid |
| Tool handling | GameBoard.tsx | onTileClick, handleBuildingPlace |
| Add new types | types.ts | Enums, interfaces, constants |
| Road behavior | roadUtils.ts | Auto-connect, snap to 4x4 grid |
| Terrain gen | procedural/ | Perlin noise, road patterns |

## KEY PATTERNS

### Grid State Flow
```
User click → Phaser emits → GameBoard handler → setGrid() → Phaser re-renders
```

### Multi-tile Buildings
```typescript
// Origin cell marks top-left, other cells reference it
cell.isOrigin = true;
cell.buildingId = "townhouse";
// Other cells:
cell.originX = originCell.x;
cell.originY = originCell.y;
```

### Tool System
```typescript
currentTool: ToolType       // What action
selectedBuildingId: string  // Which building (if Building tool)
buildingOrientation: Direction
```

## ANTI-PATTERNS

- **Never modify grid in Phaser** - Use React setState only
- **Never read grid synchronously from Phaser** - Use passed reference
- **Avoid prop drilling** - Use refs for Phaser communication

## CONSTANTS (types.ts)

```typescript
GRID_WIDTH = 48
GRID_HEIGHT = 48
TILE_WIDTH = 44  // pixels
TILE_HEIGHT = 22 // pixels
CAR_SPEED = 0.05
CHARACTER_SPEED = 0.015
```
