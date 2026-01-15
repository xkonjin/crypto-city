# CryptoCity Issues Tracker

**Last Updated**: 2026-01-15  
**Test Status**: 3,791 tests (~97% passing)  
**Build**: ✅ Passes  
**Lint**: ✅ Passes

---

## Critical Issues

### C1. CryptoNPCs Not Rendered on Canvas
**Status**: Open  
**Priority**: Critical  
**Files**: `src/components/game/CanvasIsometricGrid.tsx`, `src/lib/npc/NPCManager.ts`

**Description**: The full simulation NPCs (CryptoNPCs) with custom avatars, ingested X profiles, and AI personalities are **invisible in-game**. The `NPCManager.getAllNPCs()` is imported but only used for hit detection, hover highlighting, and selection glow. There is no `drawCryptoNPCs()` function.

**Impact**: The entire NPC simulation system runs but players never see the simulated NPCs - only decorative pedestrians.

**Fix Required**:
1. Add `drawCryptoNPCs()` function to render NPCManager NPCs on cars-canvas
2. Implement position interpolation using `movementManager.getTileProgress()`
3. Connect custom avatar spritesheets to the rendering pipeline
4. Apply LOD visual optimizations matching pedestrian system

---

## High Priority Issues

### H1. Duplicate `insertionSortByDepth` Function
**Status**: Open  
**Priority**: High  
**Files**: `src/components/game/CanvasIsometricGrid.tsx:1156`, `src/components/game/canvas/CanvasUtils.ts:83`

**Description**: Function is defined inline in render AND imported from canvas module (line 90).

**Fix**: Remove inline definition, use only imported version from CanvasUtils.ts.

---

### H2. Duplicate `formatNumber` Functions (7+ instances)
**Status**: Open  
**Priority**: High  
**Files**: Multiple files with identical implementations

**Locations**:
- `src/lib/achievementShare.ts:171`
- `src/lib/screenshot/ScreenshotService.ts:131`
- `src/hooks/useTopBarState.ts:68`
- `src/components/crypto/HarvestButton.tsx:32`
- `src/components/crypto/YieldBoostButton.tsx:31`
- `src/components/game/DailyGoalsPanel.tsx:16`
- `src/components/game/DaySummaryModal.tsx:47`

**Fix**: Create single `formatNumber()` in `src/lib/formatters.ts` and import everywhere.

---

### H3. validateSprite.ts ES Module Bug
**Status**: Open  
**Priority**: High  
**Files**: `scripts/validateSprite.ts:52`

**Description**: Uses `__dirname` without proper ES module imports. Script fails to run.

**Fix**: Add at top of file:
```typescript
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

---

### H4. Console Logging in Production
**Status**: Open  
**Priority**: High  
**Files**: `src/components/game/imageLoader.ts:183-240`

**Description**: Background filtering logs pixel counts on every sprite load.

**Fix**: Gate behind `process.env.NODE_ENV === 'development'`:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Starting background color filtering...');
}
```

---

## Medium Priority Issues

### M1. Inconsistent Dialog Sizes (11 different values)
**Status**: Open  
**Priority**: Medium  
**Files**: `src/components/game/panels/*.tsx`

**Variants Found**:
- `max-w-[400px]` - SettingsPanel
- `max-w-[420px]` - NPCInspectorPanel
- `max-w-[450px]` - ReferralPanel
- `max-w-[500px]` - BudgetPanel, ChallengesPanel, DisasterPanel, PetitionsPanel
- `max-w-[520px]` - EventsPanel
- `max-w-[600px]` - OrdinancePanel, StatisticsPanel, EconomyStatsPanel, AdvisorsPanel, MilestonePanel
- `max-w-[700px]` - FinancialReportPanel, SpriteTestPanel
- `max-w-sm` - PrestigePanel (confirmation)
- `max-w-md` - LeaderboardPanel
- `max-w-lg` - CityAIPanel

**Fix**: Standardize to 3 sizes with CSS variables:
- `--dialog-sm`: 420px (simple panels)
- `--dialog-md`: 550px (standard panels)
- `--dialog-lg`: 700px (data-rich panels)

---

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

### L3. SpriteValidator MAX_COLORS Too Restrictive
**Status**: Open  
**Priority**: Low  
**Files**: `src/lib/sprites/SpriteValidator.ts`

**Description**: `MAX_PIXEL_ART_COLORS = 24` may be too restrictive for AI-generated sprites.

**Fix**: Increase to 64 for AI-generated content.

---

### L4. AvatarGenerator API Key Exposure
**Status**: Open  
**Priority**: Low  
**Files**: `src/lib/ingestion/AvatarGenerator.ts`

**Description**: Uses `NEXT_PUBLIC_GEMINI_API_KEY` (visible in browser).

**Fix**: Move API calls to server-side route handler.

---

### L5. Missing NPC Animation Blending
**Status**: Open  
**Priority**: Low  
**Files**: `src/lib/npc/movement.ts`

**Description**: When NPCs transition between states (idle→walking→entering_building), there's no animation blend. Frame counter resets.

**Fix**: Store last animation frame and blend over 2-3 frames during state transitions.

---

### L6. X Ingestion Panel Entity Type UI Not Implemented
**Status**: Open  
**Priority**: Low  
**Files**: `src/components/game/panels/XIngestionPanel.tsx`

**Description**: Company/building ingestion spec calls for entity type selector but UI not updated.

---

### L7. Building Generation API Key Not Configured
**Status**: Open (Expected)  
**Priority**: Low

**Description**: Building sprite generation requires `NEXT_PUBLIC_GEMINI_API_KEY`.

---

### L8. Preloaded Resources Not Used
**Status**: Open  
**Priority**: Low

**Description**: Console warning about preloaded resources (`water.webp`, `sprites_red_water_new.webp`) not being used.

---

### L9. Privy Wallet Warnings
**Status**: Open (Expected in dev)  
**Priority**: Low

**Description**: Console warnings about `useWallets` called outside PrivyProvider.

---

### L10. Dynamic Require in CryptoEconomyManager
**Status**: Open  
**Priority**: Low  
**Files**: `src/games/isocity/crypto/CryptoEconomyManager.ts:~1803`

**Description**: Uses `require('../../../lib/portfolio')`.

---

### L11. No Exponential Backoff for API Rate Limits
**Status**: Open  
**Priority**: Low

**Description**: No exponential backoff for rate limit errors in API calls.

---

### L12. Suspension Bridge Tower Overdraw
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

## Resolved Issues

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
| Critical | 1 | 0 |
| High | 4 | 2 |
| Medium | 6 | 4 |
| Low | 12 | 3 |
| **Total** | **23** | **9** |

---

## Quick Wins (Fix in <10 min each)

1. ✅ Remove duplicate `insertionSortByDepth` (H1)
2. ✅ Fix validateSprite.ts ES module (H3)
3. ✅ Gate console logs in imageLoader.ts (H4)
4. ✅ Increase SpriteValidator MAX_COLORS (L3)
5. ✅ Remove Python background script (L2)

---

## Notes

- **CryptoNPC rendering** is the #1 visual issue - simulation runs invisibly
- **UI consistency** needs standardization pass on dialog sizes
- **Code redundancy** mainly in formatNumber/formatTime utilities
- **Sprite quality** is good except CT category needs regeneration
