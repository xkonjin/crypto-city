# CryptoCity Issues Tracker

**Last Updated**: 2026-01-15  
**Test Status**: 3,791 tests (~96% passing)  
**Build**: ✅ Passes  
**Lint**: ✅ Passes

---

## Critical Issues

*None currently*

---

## High Priority Issues

### 1. Strict Mode Violations in Tests
**Status**: Open  
**Priority**: High  
**Files**: `tests/moneySinks.spec.ts`, `tests/advisors.spec.ts`  
**Impact**: ~11 test failures

**Description**: Multiple elements matching generic selectors like `canvas` or `[role="dialog"]` cause Playwright strict mode violations.

**Error Example**:
```
strict mode violation: locator('canvas') resolved to 7 elements
```

**Fix**:
```typescript
// Bad
const canvas = page.locator('canvas');
// Good
const canvas = page.locator('canvas').first();
// Or add data-testid
const canvas = page.locator('[data-testid="game-canvas"]');
```

**Files to Fix**:
- `tests/moneySinks.spec.ts` - All 8 tests (canvas selector)
- `tests/advisors.spec.ts` - 3 tests (dialog selector)

---

### 2. Cobie Narrator Test Failures
**Status**: Open  
**Priority**: High  
**Files**: `tests/cobieNarrator.spec.ts`  
**Impact**: 2+ test failures

**Description**: Crypto building panel tests fail due to selector mismatch.

**Failed Tests**:
- `cobieNarrator.spec.ts:193` - should open crypto building panel
- `cobieNarrator.spec.ts:208` - should display building categories

**Fix**: Update selectors to match current UI structure.

---

## Medium Priority Issues

### 3. Type Safety - `any` Types in API Handling
**Status**: Open  
**Priority**: Medium  
**Files**: `src/lib/ingestion/AvatarGenerator.ts`, `src/lib/ingestion/BuildingGenerator.ts`

**Description**: Gemini API response parsing uses `any` types, risking silent failures if API format changes.

| File:Line | Issue |
|-----------|-------|
| `AvatarGenerator.ts:215` | `(window as any).__GEMINI_API_KEY` |
| `AvatarGenerator.ts:297` | `(part: any)` for API response |
| `BuildingGenerator.ts:195-202` | Inline type assertion for `part.inlineData` |

**Fix**: Create proper TypeScript interfaces for Gemini API responses.

---

### 4. Missing Error Propagation in Ingestion Pipeline
**Status**: Open  
**Priority**: Medium  
**Files**: `src/lib/ingestion/IngestionPipeline.ts`

**Description**: Building generation is fire-and-forget without proper error bubbling. If building generation fails silently, the entity is recorded but without a building.

| Location | Issue |
|----------|-------|
| `IngestionPipeline.ts:514-543` | Building generation errors not propagated |
| `IngestionPipeline.ts:587` | NPC persistence failure only logged |

**Fix**: Add error propagation and UI notification for failed building generation.

---

### 5. Missing Dialog Accessibility Attributes
**Status**: Open  
**Priority**: Medium  
**Files**: Various panel components

**Description**: Many Dialog components lack `DialogDescription` - assistive technologies won't provide context.

**Fix**: Add `DialogDescription` component or `aria-describedby={undefined}` to all `DialogContent` components.

---

### 6. Test Timeout Issues
**Status**: Open (Flaky)  
**Priority**: Medium  
**Files**: `tests/game.spec.ts`, `tests/crypto-economy-integration.spec.ts`

**Failed Tests**:
- `game.spec.ts:802` - should persist game after reload (30s timeout)
- `crypto-economy-integration.spec.ts:74` - should display crypto tax revenue
- `crypto-economy-integration.spec.ts:107` - should show income breakdown

**Fix**: Increase timeouts or add explicit waits:
```typescript
await page.waitForSelector('[data-testid="treasury-panel"]', { timeout: 45000 });
```

---

### 7. IndexedDB Error Handling
**Status**: Open  
**Priority**: Medium  
**Files**: `src/lib/ingestion/IngestedBuildingStore.ts`, `src/lib/ingestion/IngestedEntityStore.ts`

**Description**: No error handling for IndexedDB quota exceeded errors. `getDB()` caches the promise - if DB open fails, subsequent calls return failed promise.

**Fix**: Add quota exceeded handling and retry logic.

---

## Low Priority Issues

### 8. X Ingestion Panel Entity Type UI Not Implemented
**Status**: Open  
**Priority**: Low  
**Files**: `src/components/game/panels/XIngestionPanel.tsx`

**Description**: The company/building ingestion spec calls for entity type selector but UI not updated.

**Implementation Needed**:
- Add RadioGroup for entity type selection (auto/individual/company)
- Show building preview for company accounts
- Display duplication warnings
- Add "Buildings" tab to Find My Character panel

---

### 9. Building Generation API Key Not Configured
**Status**: Open (Expected)  
**Priority**: Low  

**Description**: Building sprite generation requires `NEXT_PUBLIC_GEMINI_API_KEY`. Without it, building generation fails silently.

**Fix**: Document the required environment variable and add graceful error handling in UI.

---

### 10. Preloaded Resources Not Used
**Status**: Open  
**Priority**: Low  
**Files**: Asset loading

**Description**: Console warning about preloaded resources (`water.webp`, `sprites_red_water_new.webp`) not being used.

**Fix**: Either use the preloaded resources or remove the preload hints.

---

### 11. Privy Wallet Warnings
**Status**: Open (Expected in dev)  
**Priority**: Low  

**Description**: Console warnings about `useWallets` called outside PrivyProvider when `NEXT_PUBLIC_PRIVY_APP_ID` not set.

**Fix**: Conditionally render wallet components only when Privy is configured.

---

### 12. Dynamic Require in CryptoEconomyManager
**Status**: Open  
**Priority**: Low  
**Files**: `src/games/isocity/crypto/CryptoEconomyManager.ts:~1803`

**Description**: Uses `require('../../../lib/portfolio')` which may cause issues in some build environments.

**Fix**: Convert to static import.

---

### 13. Unused Constant in BuildingGenerator
**Status**: Open  
**Priority**: Low  
**Files**: `src/lib/ingestion/BuildingGenerator.ts:35-42`

**Description**: `TILE_HEIGHT_RATIO = 0.8` is defined but never used.

**Fix**: Remove or use the constant.

---

### 14. No Exponential Backoff for API Rate Limits
**Status**: Open  
**Priority**: Low  
**Files**: Crypto data fetching layer

**Description**: No exponential backoff for rate limit errors in CoinGecko/DeFi Llama API calls.

**Fix**: Add retry logic with exponential backoff.

---

## Test Infrastructure Issues

### 15. Connection Refused in Parallel Tests
**Status**: Open (Infrastructure)  
**Priority**: Low  
**Files**: `tests/disasters.spec.ts`

**Description**: Server not started or port conflict when running parallel workers.

**Error**: `net::ERR_CONNECTION_REFUSED at http://localhost:3001/`

**Fix**: Ensure `reuseExistingServer: true` in `playwright.config.ts` or fix webServer startup race conditions.

---

### 16. Slow Test Suite
**Status**: Open  
**Priority**: Low  

**Description**: Full test suite takes >10 minutes to run.

**Recommendations**:
- Consider test parallelization
- Use test sharding
- Cache browser downloads

---

## Enhancement Requests

### E1. Ingested Buildings Integration with Building Panel
**Status**: Planned  
**Spec**: `specs/COMPANY_BUILDING_INGESTION.md`

**Description**: Ingested buildings should appear in the Crypto Buildings panel under a "Custom" category.

---

### E2. Find My Character Panel - Buildings Tab
**Status**: Planned  

**Description**: Add a Buildings tab to the Find My Character panel to show ingested buildings.

---

## Resolved Issues

### [FIXED] Crypto Buildings Test Selector Issues
**Resolved**: 2026-01-15  
**Commit**: Pending

**Description**: Three crypto building tests failed because button selectors didn't match DOM structure.

**Solution**: Updated tests to use "Show All" checkbox to bypass accordion navigation, and simplified selectors.

**Fixed Tests**:
- `should select a crypto building` ✅
- `should place crypto building and update jobs` ✅
- `should switch between crypto building categories` ✅

---

## Summary by Priority

| Priority | Open | In Progress | Resolved |
|----------|------|-------------|----------|
| Critical | 0 | 0 | 0 |
| High | 2 | 0 | 0 |
| Medium | 5 | 0 | 0 |
| Low | 9 | 0 | 1 |
| **Total** | **16** | **0** | **1** |

---

## Notes

- Economy system audit: **HEALTHY** ✅ - No critical bugs found
- Type safety: ~5 `any` types need fixing (non-critical)
- NaN protection: Properly handled throughout codebase
- 'ingested' category: Fully integrated in all systems
