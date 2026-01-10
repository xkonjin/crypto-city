# CORE TYPES

Foundational TypeScript types for grid and rendering. 2 subdirectories.

## STRUCTURE

```
core/
├── types/
│   └── grid.ts    # Grid cell, tile, building types
└── rendering/     # (if exists) Render pipeline types
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Grid cell structure | `types/grid.ts` |
| Add tile type | `types/grid.ts` |
| Building footprint | `types/grid.ts` |

## KEY TYPES

### Grid Types (from types/grid.ts)
```typescript
// Single grid cell
interface Tile {
  building: Building;
  zone?: Zone;
  terrain?: TerrainType;
}

interface Building {
  type: BuildingType;
  orientation: Direction;
  flipped?: boolean;
  constructionProgress?: number;
  abandoned?: boolean;
}

interface Zone {
  type: 'R' | 'C' | 'I';
  density: 'low' | 'medium' | 'high';
}

type Direction = 'north' | 'east' | 'south' | 'west';

// Grid is 2D array
type Grid = Tile[][];
```

### Coordinate Types
```typescript
interface GridPosition {
  x: number;  // Column (0 to gridSize-1)
  y: number;  // Row (0 to gridSize-1)
}

interface ScreenPosition {
  x: number;  // Pixel X
  y: number;  // Pixel Y
}
```

### Building Footprint
```typescript
interface BuildingFootprint {
  width: number;   // Tiles wide
  height: number;  // Tiles deep
}

// Multi-tile buildings store origin
interface MultiTileBuilding extends Building {
  isOrigin: boolean;
  originX?: number;
  originY?: number;
}
```

## CONVENTIONS

### Type vs Interface
- Use `interface` for objects with methods
- Use `type` for unions, primitives, tuples
- Export types alongside implementations

### Naming
- Types/Interfaces: PascalCase
- Type aliases for unions: PascalCase
- Generic params: Single uppercase (T, K, V)

### Organization
- Group related types in same file
- Re-export from index.ts
- Keep types close to usage

## NOTES

- Most game types defined in `src/types/game.ts`
- Core types are foundational, imported everywhere
- Avoid circular dependencies between type files
