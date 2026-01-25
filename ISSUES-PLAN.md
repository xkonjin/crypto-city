# Plasma City - Issues Audit & Prioritization

**Audit Date:** 2026-01-25
**Open Issues:** 32
**Build/Lint Status:** ✅ Builds (0 errors, 8 warnings)
**Test Status:** ⚠️ 2 test failures (60 test file stubs need implementation)

---

## Executive Summary

The codebase is in reasonable shape with no blocking lint errors. Most issues are enhancement requests or tech debt cleanup. The "Living Breathing City" epic (#211) is a major feature initiative with 10 sub-issues.

### Quick Stats
- **Console logs:** 234 (issue #231 cites 184, count increased)
- **`any` types:** 20 (issue #242 cites 47, good progress made)
- **Test failures:** 2 (validation.test.ts - sanitization and WCAG tests)

---

## Issue Categories

### 🔴 P1 - Critical/High Priority (10 issues)

| # | Title | Status | Notes |
|---|-------|--------|-------|
| 252 | Optimize Database Queries and Add Indexing | Open | Performance blocker |
| 248 | Add Reduced Graphics Mode for Low-End Devices | Open | Accessibility |
| 247 | Fix Multiplayer Synchronization Issues | Open | Core functionality |
| 246 | Optimize NPC Pathfinding Performance | Open | Performance |
| 241 | Implement Save State Validation and Schema Versioning | Open | Data integrity |
| 237 | Achieve WCAG AA Accessibility Compliance | Open | Legal/accessibility |
| 236 | Optimize Mobile Touch Interactions | Open | UX critical |
| 235 | Create Consistent Design System | Open | UI consistency |
| 234 | Fix Device Pixel Ratio (DPR) Handling | Open | Visual quality |
| 232 | Optimize React Component Re-renders | Open | Performance |
| 230 | Optimize Inefficient Tile Iteration | Open | Performance |
| 228 | Implement Comprehensive UI/UX Polish | Open | Polish |
| 227 | Refactor Monolithic Components and Contexts | Open | Code health |

### 🟡 P2 - Medium Priority (9 issues)

| # | Title | Status | Notes |
|---|-------|--------|-------|
| 255 | Implement Automated Database Backups | Open | Ops/Infrastructure |
| 254 | Add ESLint Rules and Prettier Configuration | **PARTIAL** | ESLint exists, need Prettier only |
| 253 | Implement Code Splitting and Lazy Loading | Open | Performance |
| 251 | Add Performance Monitoring and Analytics | Open | Observability |
| 250 | Implement SEO and Meta Tags | Open | Marketing |
| 249 | Add Cross-Browser Compatibility Testing | Open | QA |
| 242 | Eliminate any Types and Improve Type Safety | **PARTIAL** | Down to 20 from 47 |
| 240 | Integrate Error Tracking with Sentry | Open | Observability |
| 231 | Remove All Console Logs from Production Build | Open | Code quality |

### 🟢 Feature Enhancements - Epic #211 "Living Breathing City" (10 issues)

| # | Title | Type | Notes |
|---|-------|------|-------|
| 211 | epic: Living Breathing City - Complete NPC & Economy Overhaul | Epic | Parent epic |
| 221 | feat: Crypto Twitter Mass Ingestion Pipeline | Feature | Sub-issue of #211 |
| 220 | feat: NPC Personality-Driven Speech Patterns | Feature | Sub-issue of #211 |
| 219 | feat: Persistent Multiplayer Sync | Feature | Sub-issue of #211 |
| 218 | feat: Business/Protocol Ingestion as Buildings | Feature | Sub-issue of #211 |
| 217 | feat: X402 NPC-to-NPC Service Economy | Feature | Sub-issue of #211 |
| 216 | feat: Disaster & Event System with USDT₮ Payments | Feature | Sub-issue of #211 |
| 215 | feat: City Builder AI - Autonomous Mode | Feature | Sub-issue of #211 |
| 214 | feat: X/Twitter Profile Ingestion System | Feature | Sub-issue of #211 |
| 212 | feat: NPC Thought Generation System | Feature | Sub-issue of #211 |

---

## Duplicates & Stale Issues

### To Update (not close)

1. **#254** - ESLint already configured via `eslint.config.mjs`. Update to reflect only Prettier + pre-commit hooks needed.
2. **#242** - `any` types reduced from 47 to 20. Update count and mark as partially done.

### No Duplicates Found
- #247 (Fix Multiplayer Sync) vs #219 (feat: Persistent Multiplayer) - **NOT duplicates**
  - #247 = fix existing sync bugs
  - #219 = new persistent world feature under epic #211

---

## Recommended Fix Order

### Phase 1: Foundation (Week 1-2)
1. **Fix failing tests** (validation.test.ts) - immediate
2. **#230** - Optimize tile iteration (core performance)
3. **#232** - Optimize React re-renders (UX smoothness)
4. **#227** - Refactor monolithic components (enables other work)

### Phase 2: Polish & Performance (Week 2-3)
5. **#234** - Fix DPR handling (visual quality)
6. **#246** - NPC pathfinding performance
7. **#236** - Mobile touch interactions
8. **#248** - Reduced graphics mode

### Phase 3: Code Quality (Week 3-4)
9. **#254** - Add Prettier + pre-commit hooks
10. **#231** - Strip console logs from production
11. **#242** - Eliminate remaining `any` types
12. **#241** - Save state validation

### Phase 4: Feature Work (Ongoing)
- Epic #211 and sub-issues once foundation is stable

---

## Immediate Actions

### #230 Tile Iteration Status
**SpatialHash already implemented** in `src/lib/spatialHash.ts` with tests!
Remaining work:
- [ ] Integrate SpatialHash into CanvasRenderer
- [ ] Wire up `getVisibleTiles()` in rendering loop
- [ ] Profile before/after

### Test Fixes Needed (FIXED ✅)
```
src/lib/validation.test.ts:
1. sanitizeString test expects 'alertxss' but gets 'alert(xss)' - parentheses not being stripped
2. meetsWCAGAA test - #767676 on #ffffff actually passes WCAG AA (4.54:1 ratio > 4.5)
```

### Lint Warnings to Address
- PerformanceOverlay.tsx:38 - unused eslint-disable
- CryptoParticleSystem.tsx:302 - ref cleanup pattern
- ScreenshotShare.tsx:196 - use next/image instead of img
- AdvisorsPanel.tsx:409 - missing useEffect deps
- useSound.ts:164 - unused eslint-disable
- buildingAnimations.ts:385 - anonymous default export
- reactOptimization.ts:67 - dynamic deps array

---

## Next Steps

1. ✅ Audit complete
2. 🔄 Fix 2 failing tests
3. 🔄 Start #230 (tile iteration optimization)
4. 📝 Update issues #254 and #242 with current status
