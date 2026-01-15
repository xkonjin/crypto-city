# PRD: Fix High-Priority Test Failures

## 1. Introduction/Overview

This PRD addresses 13 high-priority Playwright test failures in CryptoCity caused by selector issues. The tests fail due to Playwright's strict mode violations where generic selectors resolve to multiple elements. This is a test-only fix - no application behavior changes are required.

### Problem Summary

| Test File | Failures | Root Cause |
|-----------|----------|------------|
| `moneySinks.spec.ts` | 8 tests | `canvas` selector resolves to 7+ elements (game has multiple canvas layers) |
| `advisors.spec.ts` | 3 tests | `[role="dialog"]` selector matches multiple dialogs (Radix UI, CobieSpeechBubble, TitanDetailView) |
| `cobieNarrator.spec.ts` | 2 tests | Selector mismatch - looking for elements that may not have proper data-testid |

### Technical Context

**Canvas Elements in the Game (7 total):**
1. Main game canvas (`CanvasIsometricGrid.tsx` - line 3481)
2. Hover canvas (`CanvasIsometricGrid.tsx` - line 3492)
3. Cars canvas (`CanvasIsometricGrid.tsx` - line 3499)
4. Buildings canvas (`CanvasIsometricGrid.tsx` - line 3506)
5. Air canvas (`CanvasIsometricGrid.tsx` - line 3513)
6. Lighting canvas (`CanvasIsometricGrid.tsx` - line 3520)
7. Minimap canvas (`MiniMap.tsx`)
8. Home screen canvas (`page.tsx` - line 306)
9. Cobie screen canvas (`CobieScreen.tsx`)
10. Disaster overlay canvas (`DisasterOverlay.tsx`)
11. Statistics panel canvas (`StatisticsPanel.tsx`)
12. Sprite test panel canvas (`SpriteTestPanel.tsx`)

**Dialog Elements with `role="dialog"`:**
1. Radix UI Dialog components (multiple panels)
2. `CobieSpeechBubble.tsx` (line 75)
3. `TitanDetailView.tsx` (line 953)

## 2. Goals

- [ ] Fix all 8 test failures in `moneySinks.spec.ts`
- [ ] Fix all 3 test failures in `advisors.spec.ts`
- [ ] Fix all 2 test failures in `cobieNarrator.spec.ts`
- [ ] Achieve 100% pass rate for these 13 tests
- [ ] Add `data-testid` attributes to disambiguate canvas elements
- [ ] Add `data-testid` attributes to disambiguate dialog elements
- [ ] Maintain backward compatibility with existing tests

## 3. User Stories

### US-001: Fix Canvas Selector Strict Mode Violations
**Description:** As a developer running tests, I want the `canvas` selector to uniquely identify the main game canvas so that tests don't fail with strict mode violations.

**Acceptance Criteria:**
- [ ] Add `data-testid="game-canvas"` to main canvas in `CanvasIsometricGrid.tsx`
- [ ] Add `data-testid="hover-canvas"` to hover canvas in `CanvasIsometricGrid.tsx`
- [ ] Add `data-testid="cars-canvas"` to cars canvas in `CanvasIsometricGrid.tsx`
- [ ] Add `data-testid="buildings-canvas"` to buildings canvas in `CanvasIsometricGrid.tsx`
- [ ] Add `data-testid="air-canvas"` to air canvas in `CanvasIsometricGrid.tsx`
- [ ] Add `data-testid="lighting-canvas"` to lighting canvas in `CanvasIsometricGrid.tsx`
- [ ] Add `data-testid="minimap-canvas"` to canvas in `MiniMap.tsx`
- [ ] Update `moneySinks.spec.ts` to use `page.locator('[data-testid="game-canvas"]')` instead of `page.locator('canvas')`
- [ ] Typecheck passes
- [ ] Lint passes

### US-002: Fix Dialog Selector Strict Mode Violations
**Description:** As a developer running tests, I want dialog selectors to uniquely identify the intended dialog so that advisor tests don't fail.

**Acceptance Criteria:**
- [ ] Add `data-testid="advisor-dialog"` to DialogContent in `AdvisorsPanel.tsx`
- [ ] Update `advisors.spec.ts` to use `page.locator('[data-testid="advisor-panel"]')` which already exists
- [ ] Remove redundant `page.locator('[role="dialog"]')` calls that match multiple elements
- [ ] Use the existing `data-testid="advisor-panel"` selector consistently
- [ ] All 3 advisor tests pass
- [ ] Typecheck passes
- [ ] Lint passes

### US-003: Fix Cobie Narrator Selector Mismatches
**Description:** As a developer running tests, I want Cobie narrator tests to use stable selectors so that tests reliably pass.

**Acceptance Criteria:**
- [ ] Audit `cobieNarrator.spec.ts` for selectors that don't match actual DOM elements
- [ ] Add missing `data-testid` attributes to Cobie components if needed
- [ ] Update test selectors to match actual component structure
- [ ] Both Cobie narrator tests pass
- [ ] Typecheck passes
- [ ] Lint passes

### US-004: Update Test Utilities
**Description:** As a developer, I want test helper functions to use specific selectors so that they work reliably across all tests.

**Acceptance Criteria:**
- [ ] Update `startGame()` helper to use `data-testid` for canvas visibility check
- [ ] Create helper function `getGameCanvas(page)` that returns `page.locator('[data-testid="game-canvas"]')`
- [ ] Update all affected test files to use the new helper
- [ ] All 13 previously failing tests pass
- [ ] Typecheck passes
- [ ] Lint passes

## 4. Functional Requirements

### FR-1: Canvas Element Identification
The system must add unique `data-testid` attributes to all canvas elements in the game:

| Component | Test ID |
|-----------|---------|
| Main game canvas | `game-canvas` |
| Hover canvas | `hover-canvas` |
| Cars canvas | `cars-canvas` |
| Buildings canvas | `buildings-canvas` |
| Air canvas | `air-canvas` |
| Lighting canvas | `lighting-canvas` |
| Minimap canvas | `minimap-canvas` |

### FR-2: Dialog Element Identification
The system must ensure dialogs have unique identifiers:

| Component | Test ID |
|-----------|---------|
| AdvisorsPanel DialogContent | `advisor-panel` (already exists) |
| CobieSpeechBubble | `cobie-speech-bubble` |

### FR-3: Test File Updates
The following test files must be updated to use specific selectors:

| Test File | Changes Required |
|-----------|-----------------|
| `moneySinks.spec.ts` | Replace `page.locator('canvas')` with `page.locator('[data-testid="game-canvas"]')` |
| `advisors.spec.ts` | Replace `page.locator('[role="dialog"]')` with `page.locator('[data-testid="advisor-panel"]')` |
| `cobieNarrator.spec.ts` | Audit and fix selector mismatches |

### FR-4: Backward Compatibility
Existing tests in `game.spec.ts` and other files that use `page.locator('canvas').first()` must continue to work without modification.

## 5. Non-Goals (Out of Scope)

- **DO NOT** change any application behavior or game logic
- **DO NOT** modify the visual appearance of any components
- **DO NOT** refactor existing component architecture
- **DO NOT** add new features to the game
- **DO NOT** modify tests unrelated to the 13 failing tests
- **DO NOT** change the structure of the advisor system
- **DO NOT** modify how canvas layers are rendered

## 6. Design Considerations

### Selector Strategy
Use `data-testid` attributes for test selectors because:
1. They are decoupled from CSS classes (won't break if styling changes)
2. They are decoupled from text content (won't break if labels change)
3. They clearly indicate the element is used in tests
4. They follow Playwright best practices

### Test ID Naming Convention
Follow the existing project convention:
- Use kebab-case: `game-canvas`, `advisor-panel`
- Be descriptive: `advisor-advice-message` not just `message`
- Group related elements: `advisor-*` for all advisor-related elements

## 7. Technical Considerations

### Files to Modify

**Application Code (add data-testid):**
1. `src/components/game/CanvasIsometricGrid.tsx` - 6 canvas elements
2. `src/components/game/MiniMap.tsx` - 1 canvas element
3. `src/components/game/cobie/CobieSpeechBubble.tsx` - 1 dialog element (if needed)

**Test Code (update selectors):**
1. `tests/moneySinks.spec.ts` - Replace canvas selectors
2. `tests/advisors.spec.ts` - Replace dialog selectors
3. `tests/cobieNarrator.spec.ts` - Fix selector mismatches

### Dependencies
- No new dependencies required
- All changes use existing Playwright patterns

### Performance Impact
- None - `data-testid` attributes have zero runtime performance impact
- They are static HTML attributes with no JavaScript overhead

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| `moneySinks.spec.ts` passing tests | 8/8 (100%) |
| `advisors.spec.ts` passing tests | 3/3 (100%) |
| `cobieNarrator.spec.ts` passing tests | 2/2 (100%) |
| Total fixed tests | 13/13 (100%) |
| Regression in other tests | 0 |
| CI pipeline status | Green |

### Verification Commands
```bash
# Run specific test files
npx playwright test tests/moneySinks.spec.ts
npx playwright test tests/advisors.spec.ts
npx playwright test tests/cobieNarrator.spec.ts

# Run all tests to verify no regressions
npx playwright test

# Verify no TypeScript errors
npm run typecheck

# Verify no lint errors
npm run lint
```

## 9. Open Questions

1. **Q:** Should we update `game.spec.ts` helper functions to use specific selectors proactively?
   **A:** No - only fix what's broken. `game.spec.ts` uses `.first()` which works correctly.

2. **Q:** Should we add `data-testid` to ALL canvas elements including `page.tsx` home screen?
   **A:** Only add to elements in `CanvasIsometricGrid.tsx` and `MiniMap.tsx` since those are the ones causing conflicts in the game view. Home screen canvas is separate context.

3. **Q:** Should we create a shared test utility file?
   **A:** Optional enhancement - out of scope for this PR. Focus on minimal fixes.

## Implementation Checklist

### Phase 1: Add data-testid Attributes
- [ ] `CanvasIsometricGrid.tsx`: Add `data-testid` to 6 canvas elements
- [ ] `MiniMap.tsx`: Add `data-testid="minimap-canvas"` to canvas
- [ ] Verify no TypeScript errors

### Phase 2: Update Test Selectors
- [ ] `moneySinks.spec.ts`: Update canvas selectors
- [ ] `advisors.spec.ts`: Update dialog selectors  
- [ ] `cobieNarrator.spec.ts`: Fix selector mismatches

### Phase 3: Verification
- [ ] Run `npx playwright test tests/moneySinks.spec.ts` - all pass
- [ ] Run `npx playwright test tests/advisors.spec.ts` - all pass
- [ ] Run `npx playwright test tests/cobieNarrator.spec.ts` - all pass
- [ ] Run `npm run typecheck` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Run full test suite - no regressions
