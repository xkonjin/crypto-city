# PHASER ENGINE - AGENTS KNOWLEDGE BASE

Pure rendering layer. Reads grid, never writes. MainScene.ts is 3000 lines.

## STRUCTURE

```
phaser/
├── MainScene.ts        # CORE - all rendering, entities, camera (3000 lines)
├── PhaserGame.tsx      # React wrapper with imperative handle
├── entities/           # Character, Car sprite logic
├── GIFLoader.ts        # gifuct-js integration for walking animations
└── config.ts           # Phaser game config
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Tile rendering | MainScene.renderTile() | Sprite creation |
| Building rendering | MainScene.renderBuilding() | Multi-tile, orientation |
| Depth sorting | MainScene.calculateDepth() | Layer offsets critical |
| Character movement | MainScene.updateCharacters() | Pathfinding on roads |
| Car movement | MainScene.updateCars() | Road-only, intersection logic |
| Camera controls | MainScene.setupCamera() | Zoom, pan, bounds |
| React bridge | PhaserGame.tsx | useImperativeHandle exports |

## DEPTH SYSTEM (CRITICAL)

```
Layer offsets in MainScene:
0.00 - Ground tiles
0.03 - Back fences (future)
0.04 - Lamp glow
0.05 - Buildings
0.06 - Props/trees
0.07 - Front fences (future)
0.10 - Cars
0.20 - Characters
```

Formula: `depth = (x + y) * DEPTH_Y_MULT + layerOffset`

## KEY PATTERNS

### React → Phaser (via ref)
```typescript
// PhaserGame exposes:
ref.current.spawnCharacter(x, y, type)
ref.current.updateGrid(newGrid)
ref.current.shakeScreen()
ref.current.setVisualSettings(settings)
```

### Phaser → React (via callbacks)
```typescript
// Passed as props:
onTileClick(x, y, button)
onTilesDrag(tiles[])
onCameraChange(zoom, position)
```

### GIF Animation (Characters)
```typescript
// Uses gifuct-js, NOT Phaser animations
const frames = await loadGif(path);
// Frames manually cycled in update()
```

## ANTI-PATTERNS

- **Never import Phaser at top level** - Dynamic import only (SSR breaks)
- **Never store game state** - Read from grid prop
- **Never mutate grid** - Emit events to React
- **Avoid Phaser's built-in animation** - GIF system is custom

## PERFORMANCE

- Sprites are pooled and reused
- Dirty tile tracking for partial re-renders
- Camera bounds prevent over-scroll
- Character/car counts capped at spawn
