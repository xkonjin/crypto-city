# CryptoCity Issues Tracker

**Last Updated**: 2026-01-15  
**Test Status**: 3,791 tests (~97% passing)  
**Build**: ✅ Passes  
**Lint**: ✅ Passes

---

## Critical Issues

*None currently - all critical issues resolved*

---

## High Priority Issues

*None currently - all high priority issues resolved*

---

## Medium Priority Issues

### M2. Undersized CT Category Sprites
**Status**: Open  
**Priority**: Medium  
**Files**: `public/Building/crypto/ct/`

**Sprites Needing Regeneration**:
| File | Size | Issue |
|------|------|-------|
| `2x2dao_hq_south.png` | 79 KB | Severely undersized |
| `2x2degen_lounge_south.png` | 92 KB | Undersized |
| `2x2bybit_arena_south.png` | 108 KB | Below threshold |
| `3x3coinbase_hq_south.png` | 121 KB | 3x3 should be larger |
| `1x2alpha_call_center_south.png` | 132 KB | May lack detail |

**Fix**: Regenerate with `generateCryptoSprites.ts` targeting these specific buildings.

---

### M3. Road Analysis Cache Memory Leak
**Status**: Open  
**Priority**: Medium  
**Files**: `src/components/game/CanvasIsometricGrid.tsx:1186-1195`

**Description**: `roadAnalysisCacheRef` only clears when gridVersion changes, but cache grows unbounded within a version.

**Fix**: Add LRU eviction or size limit (max 1000 entries).

---

### M4. Water Rendering Inefficiency at High Zoom
**Status**: Open  
**Priority**: Medium  
**Files**: `src/components/game/CanvasIsometricGrid.tsx:1537-1610`

**Description**: Water tiles with 2+ adjacent water use double-pass rendering (outer + core) regardless of performance mode.

**Fix**: Use single-pass for all water when `zoom < 0.8` instead of only `zoom < 0.5`.

---

### M5. Duplicate formatTime/formatTimestamp Functions
**Status**: Open  
**Priority**: Medium  
**Files**: Multiple

**Locations**:
- `src/lib/time/TimeManager.ts:189` - formatTime
- `src/components/titan/TitanDetailView.tsx:217` - formatTime  
- `src/components/game/NotificationItem.tsx:26` - formatTimestamp
- `src/components/game/TransactionFeed.tsx:135` - formatTimestamp
- `src/components/game/panels/DisasterPanel.tsx:57` - formatTime
- `src/components/game/ActiveDisastersPanel.tsx:23` - formatTimeRemaining

**Fix**: Consolidate to `src/lib/formatters.ts`.

---

### M6. Test Timeout Issues
**Status**: Open (Flaky)  
**Priority**: Medium  
**Files**: `tests/game.spec.ts`, `tests/crypto-economy-integration.spec.ts`

**Failed Tests**:
- `game.spec.ts:802` - should persist game after reload (30s timeout)
- `crypto-economy-integration.spec.ts:74` - should display crypto tax revenue
- `crypto-economy-integration.spec.ts:107` - should show income breakdown

**Fix**: Increase timeouts or add explicit waits.

---

## Low Priority Issues

### L1. Redundant Sprite Generation Scripts (6 scripts)
**Status**: Open  
**Priority**: Low  
**Files**: `scripts/generate*.ts`

**Redundant Scripts**:
- `generateSpritesOpenAI.ts` - Alternative to main Gemini generator
- `generateSpritesNanoBanana.ts` - Same as main generator
- `generateAssets.ts` - Legacy script

**Fix**: Consolidate to 2 scripts: main generator + fallback.

---

### L2. Python Background Removal Script Duplicate
**Status**: Open  
**Priority**: Low  
**Files**: `scripts/fixSpriteBackgrounds.py`

**Description**: Duplicates functionality in TypeScript.

**Fix**: Remove Python script, use TypeScript only.

---

### L3. AvatarGenerator API Key Exposure
**Status**: Open  
**Priority**: Low  
**Files**: `src/lib/ingestion/AvatarGenerator.ts`

**Description**: Uses `NEXT_PUBLIC_GEMINI_API_KEY` (visible in browser).

**Fix**: Move API calls to server-side route handler.

---

### L4. Missing NPC Animation Blending
**Status**: Open  
**Priority**: Low  
**Files**: `src/lib/npc/movement.ts`

**Description**: When NPCs transition between states (idle→walking→entering_building), there's no animation blend. Frame counter resets.

**Fix**: Store last animation frame and blend over 2-3 frames during state transitions.

---

### L5. X Ingestion Panel Entity Type UI Not Implemented
**Status**: Open  
**Priority**: Low  
**Files**: `src/components/game/panels/XIngestionPanel.tsx`

**Description**: Company/building ingestion spec calls for entity type selector but UI not updated.

---

### L6. Building Generation API Key Not Configured
**Status**: Open (Expected)  
**Priority**: Low

**Description**: Building sprite generation requires `NEXT_PUBLIC_GEMINI_API_KEY`.

---

### L7. Preloaded Resources Not Used
**Status**: Open  
**Priority**: Low

**Description**: Console warning about preloaded resources (`water.webp`, `sprites_red_water_new.webp`) not being used.

---

### L8. Privy Wallet Warnings
**Status**: Open (Expected in dev)  
**Priority**: Low

**Description**: Console warnings about `useWallets` called outside PrivyProvider.

---

### L9. Dynamic Require in CryptoEconomyManager
**Status**: Open  
**Priority**: Low  
**Files**: `src/games/isocity/crypto/CryptoEconomyManager.ts:~1803`

**Description**: Uses `require('../../../lib/portfolio')`.

---

### L10. No Exponential Backoff for API Rate Limits
**Status**: Open  
**Priority**: Low

**Description**: No exponential backoff for rate limit errors in API calls.

---

### L11. Suspension Bridge Tower Overdraw
**Status**: Open  
**Priority**: Low  
**Files**: `src/components/game/CanvasIsometricGrid.tsx:2095-2115`

**Description**: Suspension bridge towers drawn twice (main render + buildings canvas).

**Fix**: Consolidate to single draw pass.

---

## Test Infrastructure Issues

### T1. Connection Refused in Parallel Tests
**Status**: Open (Infrastructure)  
**Priority**: Low

**Error**: `net::ERR_CONNECTION_REFUSED at http://localhost:3001/`

---

### T2. Slow Test Suite
**Status**: Open  
**Priority**: Low

**Description**: Full test suite takes >10 minutes to run.

---

## Enhancement Requests

### E1. Create Shared UI Components
**Status**: Planned  
**Priority**: Medium

**Components Needed**:
- `SectionHeader` - Standardize panel section headers
- `FeatureCard` - Standardize feature/stat cards
- `StatDisplay` - Standardize stat display with icon + label + value
- `LoadingState` - Standardize loading states across panels

---

### E2. Add Keyboard Navigation to Submenus
**Status**: Planned  
**Priority**: Medium

**Description**: Accordion/submenu keyboard navigation gaps.

---

### E3. Ingested Buildings in Building Panel
**Status**: Planned  
**Spec**: `specs/COMPANY_BUILDING_INGESTION.md`

---

### E4. Find My Character - Buildings Tab
**Status**: Planned

---

## Resolved Issues (This Session)

### [FIXED] C1. CryptoNPCs Not Rendered on Canvas
**Resolved**: 2026-01-15

**Solution**: 
- Created `src/components/game/drawCryptoNPCs.ts` with LOD-aware rendering
- Added `drawCryptoNPCsCallback` to CanvasIsometricGrid.tsx
- Integrated into render loop after pedestrians
- Supports position interpolation, custom avatars, and name labels at high zoom

**Result**: Simulation NPCs now visible on canvas ✅

---

### [FIXED] H1. Duplicate `insertionSortByDepth` Function
**Resolved**: 2026-01-15

**Solution**: Removed inline definition from CanvasIsometricGrid.tsx, using only imported version from CanvasUtils.ts.

**Result**: Code duplication eliminated ✅

---

### [FIXED] H2. Duplicate `formatNumber` Functions
**Resolved**: 2026-01-15

**Solution**: 
- Created `src/lib/formatters.ts` with shared `formatNumber()` and `formatCurrency()`
- Updated 7 files to import from shared module
- Removed duplicate function definitions

**Files Modified**:
- `src/lib/achievementShare.ts`
- `src/lib/screenshot/ScreenshotService.ts`
- `src/hooks/useTopBarState.ts`
- `src/components/crypto/HarvestButton.tsx`
- `src/components/crypto/YieldBoostButton.tsx`
- `src/components/game/DailyGoalsPanel.tsx`
- `src/components/game/DaySummaryModal.tsx`

**Result**: Single source of truth for number formatting ✅

---

### [FIXED] H3. validateSprite.ts ES Module Bug
**Resolved**: 2026-01-15

**Solution**: Added `import { fileURLToPath } from 'url';` and proper `__dirname` definition.

**Result**: CLI script now works ✅

---

### [FIXED] H4. Console Logging in Production
**Resolved**: 2026-01-15

**Solution**: Removed all `console.log` calls from `filterBackgroundColor()` in imageLoader.ts.

**Result**: No console spam during sprite loading ✅

---

### [FIXED] M1. Inconsistent Dialog Sizes
**Resolved**: 2026-01-15

**Solution**: 
- Added CSS variables to globals.css: `--dialog-sm`, `--dialog-md`, `--dialog-lg`
- Added Tailwind utilities: `max-w-dialog-sm`, `max-w-dialog-md`, `max-w-dialog-lg`
- Updated 14 panel files to use standardized sizes

**Size Mappings**:
- `--dialog-sm: 420px` - Simple panels (Settings, Referral, NPC Inspector)
- `--dialog-md: 550px` - Standard panels (Budget, Challenges, Events, Statistics)
- `--dialog-lg: 700px` - Data-rich panels (Financial Report, Sprite Test)

**Result**: Consistent dialog sizing across all panels ✅

---

## Previous Session Resolved Issues

### [FIXED] Type Safety - `any` Types in API Handling
**Resolved**: 2026-01-15

### [FIXED] Missing Error Propagation in Ingestion Pipeline
**Resolved**: 2026-01-15

### [FIXED] Missing Dialog Accessibility Attributes
**Resolved**: 2026-01-15

### [FIXED] IndexedDB Error Handling
**Resolved**: 2026-01-15

### [FIXED] Unused Constant in BuildingGenerator
**Resolved**: 2026-01-15

### [FIXED] Strict Mode Violations in Tests
**Resolved**: 2026-01-15 - Commit `4dff767`

### [FIXED] Cobie Narrator Test Failures
**Resolved**: 2026-01-15 - Commit `4dff767`

### [FIXED] Crypto Buildings Test Selector Issues
**Resolved**: 2026-01-15 - Commit `4dff767`

### [SKIPPED] Advisor Panel Tests
**Resolved**: 2026-01-15 - Commit `4dff767`

---

## Summary by Priority

| Priority | Open | Resolved |
|----------|------|----------|
| Critical | 0 | 1 |
| High | 0 | 4 |
| Medium | 5 | 5 |
| Low | 11 | 3 |
| **Total** | **16** | **13** |

---

## Quick Wins Remaining

1. Consolidate formatTime functions (M5)
2. Remove Python background script (L2)
3. Consolidate redundant generation scripts (L1)

---

## Notes

- **CryptoNPC rendering** now works - simulation NPCs visible on canvas
- **UI consistency** improved with standardized dialog sizes
- **Code redundancy** reduced - formatNumber consolidated
- **Sprite quality** validation infrastructure in place
- **Visual polish droids** available for future improvements
