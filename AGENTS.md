# PROJECT KNOWLEDGE BASE

**Project:** Pogicity/crypto-city - Isometric city builder with real-time crypto data integration  
**Stack:** Next.js 16 + React 19 + TypeScript 5 + Canvas/Phaser 3.90 + Tailwind CSS 4

## COMMANDS

```bash
# Development
npm run dev           # Dev server (localhost:3000)
npm run build         # Production build (runs type check)
npm run lint          # ESLint (eslint-config-next)

# Testing (Playwright)
npm run test          # Run all tests headless
npm run test:ui       # Interactive test UI
npm run test:headed   # Run with visible browser

# Single test file
npx playwright test tests/game.spec.ts

# Single test by name
npx playwright test -g "should load the game canvas"

# Type check only
npx tsc --noEmit
```

## CODE STYLE

### TypeScript

- **Strict mode enabled** - `strict: true` in tsconfig
- **Path alias:** `@/*` maps to `./src/*`
- **Target:** ES2017
- **No type suppressions:** Never use `as any`, `@ts-ignore`, `@ts-expect-error`

### Naming Conventions

| Type             | Convention                     | Example                            |
| ---------------- | ------------------------------ | ---------------------------------- |
| Components       | PascalCase                     | `CanvasIsometricGrid.tsx`          |
| Functions        | camelCase                      | `gridToScreen()`                   |
| Constants        | SCREAMING_SNAKE                | `TILE_WIDTH`, `DEFAULT_GRID_SIZE`  |
| Types/Interfaces | PascalCase                     | `GridPosition`, `GameState`        |
| Enums            | PascalCase values              | `ZoneType.Residential`             |
| Building IDs     | kebab-case                     | `"factory-small"`, `"house-large"` |
| Files            | camelCase.ts or PascalCase.tsx | `utils.ts`, `GameBoard.tsx`        |

### Imports

```typescript
// Order: React → External → Internal (@/) → Relative → Types
import React, { useState, useCallback } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { simulateTick } from "@/lib/simulation";
import { TILE_WIDTH } from "./constants";
import type { GameState, Building } from "@/types/game";
```

### Components (React 19)

```typescript
// Client components require 'use client' directive
'use client';

// Use forwardRef for components that expose refs
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => {
    return <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />;
  }
);
Button.displayName = "Button";

// Export component and its variants
export { Button, buttonVariants };
```

### Hooks

```typescript
// Prefix with 'use', return typed object
export function useRealCryptoData(
  options: UseRealCryptoDataOptions,
): UseRealCryptoDataReturn {
  const [data, setData] = useState<RealWorldCryptoData | null>(null);
  // ...
  return { data, isLoading, error, refetch };
}
```

### Error Handling

```typescript
// API clients: return typed errors, never throw unhandled
async function fetchData(): Promise<DataResult> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { data: null, error: new Error(`HTTP ${res.status}`) };
    }
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

// Components: use error boundaries or null checks
{error && <ErrorDisplay message={error.message} />}
{data && <DataView data={data} />}
```

### Types

```typescript
// Prefer interfaces for objects, types for unions/primitives
interface GridPosition {
  x: number;
  y: number;
}

type CardinalDirection = "north" | "east" | "south" | "west";
type ZoneType = "R" | "C" | "I";

// Export types alongside implementations
export type { UseRealCryptoDataReturn };
export { useRealCryptoData };
```

## STRUCTURE

```
src/
├── app/                   # Next.js App Router pages
├── components/
│   ├── game/             # Canvas renderer, systems (SEE: game/AGENTS.md)
│   ├── ui/               # shadcn/ui + Radix components
│   ├── crypto/           # Crypto data display components
│   └── mobile/           # Mobile-specific UI
├── lib/                  # Utilities, APIs (SEE: lib/AGENTS.md)
├── games/isocity/        # Engine types (SEE: isocity/AGENTS.md)
├── core/                 # Core types (grid, rendering)
├── hooks/                # React hooks
├── context/              # GameContext, MultiplayerContext
└── types/                # Shared TypeScript types
tests/
└── *.spec.ts            # Playwright E2E tests
```

## KEY FILES

| Task           | Location                                      |
| -------------- | --------------------------------------------- |
| Add buildings  | `src/components/game/buildingHelpers.ts`      |
| Game rendering | `src/components/game/CanvasIsometricGrid.tsx` |
| Road logic     | `src/components/game/roadDrawing.ts`          |
| Game state     | `src/context/GameContext.tsx`                 |
| Simulation     | `src/lib/simulation.ts`                       |
| Crypto APIs    | `src/lib/crypto/api/`                         |
| Grid types     | `src/core/types/grid.ts`                      |

## ARCHITECTURE

```
React (source of truth) ────► Canvas/Phaser (renders)
         │                           │
         │ grid, simData             │ click events
         ▼                           ▼
  GameContext.tsx            callbacks to React
```

- **React manages:** grid state (48x48), UI, tool selection, simulation
- **Canvas manages:** rendering, characters, cars, animations
- **React → Canvas:** via props/context
- **Canvas → React:** via callbacks (`onTileClick`, `onTilesDrag`)

## ISOMETRIC SYSTEM

```typescript
// Constants
const TILE_WIDTH = 64;
const HEIGHT_RATIO = 0.6;
const TILE_HEIGHT = TILE_WIDTH * HEIGHT_RATIO; // 38.4

// Grid → Screen conversion
screenX = (gridX - gridY) * (TILE_WIDTH / 2);
screenY = (gridX + gridY) * (TILE_HEIGHT / 2);

// Screen → Grid conversion
gridX = floor(screenX / TILE_WIDTH + screenY / TILE_HEIGHT);
gridY = floor(screenY / TILE_HEIGHT - screenX / TILE_WIDTH);

// Depth layers (lower = further back)
// 0.00 - Ground tiles
// 0.03 - Back fences
// 0.05 - Buildings
// 0.06 - Props/trees
// 0.10 - Cars
// 0.20 - Characters
```

## TESTING

```typescript
// Playwright tests in tests/*.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Feature", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    // Start game if needed
  });

  test("should do something", async ({ page }) => {
    const element = page.locator("text=/Expected/i").first();
    await expect(element).toBeVisible({ timeout: 10000 });
  });
});
```

## ANTI-PATTERNS

| Never Do                     | Why                                        |
| ---------------------------- | ------------------------------------------ |
| SSR Phaser                   | Dynamic import only, check `typeof window` |
| Mutate grid in Phaser        | React owns state, Phaser renders           |
| Hardcode tile sizes          | Use constants from `constants.ts`          |
| Call APIs from components    | Use hooks + cache (rate limits)            |
| Skip cache for crypto APIs   | Rate limits will block you                 |
| Block main thread            | Heavy saves go to Web Worker               |
| Use `as any` or `@ts-ignore` | Fix the type properly                      |
| Empty catch blocks           | Log or handle errors explicitly            |

## NOTIFICATIONS

Play system sound when:

```bash
# Finishing long task, needing input, or hitting error
afplay /System/Library/Sounds/Ping.aiff
```

## DEPENDENCIES

**Core:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4  
**UI:** Radix UI, class-variance-authority, lucide-react  
**State:** Zustand, SWR  
**Data:** Supabase, idb (IndexedDB)  
**Game:** Phaser 3.90 (dynamic import), gifuct-js  
**Testing:** Playwright

## KNOWN ISSUES

**Turbopack + iCloud Drive incompatibility (Next.js 16)**:  
Turbopack cannot handle paths with spaces. If project is in iCloud (`~/Library/Mobile Documents/`), Turbopack will fail with:

```
TurbopackInternalError: reading dir /Users/.../Mobile Documents
Operation not permitted (os error 1)
```

**Resolution (IMPLEMENTED):**  
The `package.json` scripts now use `--webpack` flag to bypass Turbopack:

```json
"scripts": {
  "dev": "next dev --webpack",
  "build": "next build --webpack",
  ...
}
```

This allows development on iCloud paths. All `npm run dev`, `npm run build`, and `npm run test` commands work correctly.

**Alternative workarounds (if needed):**

1. Move project to a path without spaces (e.g., `~/Projects/crypto-city`)
2. Use symlink: `ln -s "path/with spaces" ~/crypto-city`

## NOTES

- **Crypto data** caches in IndexedDB via `idb` package
- **Multiplayer** uses Supabase realtime (optional)
- **Character sprites** in `/public/Characters/` are PROPRIETARY - don't redistribute
- **See ROADMAP.md** for simulation/zoning vision
- **See subdirectory AGENTS.md** files for detailed module docs
