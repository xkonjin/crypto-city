# Crypto City Builder Audit

Date: 2025-02-14

## Scope and limitations
- GitHub issues/PRs could not be fetched from the network in this environment. If you provide a `gh issue list`/`gh pr list` dump, I can merge it into this audit.
- Playwright web server could not bind to port 3005 in the sandbox (EPERM), so E2E smoke coverage is incomplete here.

## Open issues / PRs
- Expected: 32 open issues, 1 PR (not accessible from this sandbox).

## Lint and test results
- `npm run lint`: 0 errors, 8 warnings.
- `npm run test` (Playwright): failed to start web server (EPERM on 0.0.0.0:3005).
- `npm run test:unit` (Vitest): 2 files, 33 tests, all passed.

## High-priority issues fixed
1) SSR crash risk in graphics settings
- File: `src/lib/graphicsSettings.ts`
- Problem: `detectDeviceCapabilities()` accessed `navigator`/`document` unguarded, and `graphicsManager` was constructed at module scope. If this module is imported by a server component (or during SSR evaluation), it can throw `ReferenceError: navigator is not defined` and prevent the game from loading.
- Fix: Added server-safe guards and sane defaults so the module can be evaluated without a DOM, and removed `@ts-ignore` suppressions.

2) Type suppression in mobile hook
- File: `src/hooks/useMobile.ts`
- Problem: `@ts-expect-error` used for legacy `msMaxTouchPoints`, which violates repo coding rules.
- Fix: Introduced a typed navigator alias and guarded access without suppressions.

## Lint warnings (actionable)
- `src/components/PerformanceOverlay.tsx`: unused eslint-disable directive.
- `src/components/game/CryptoParticleSystem.tsx`: cleanup uses `poolRef.current` directly; copy to local variable in effect to avoid stale ref warning.
- `src/components/game/ScreenshotShare.tsx`: `<img>` used instead of `next/image` (LCP warning).
- `src/components/game/panels/AdvisorsPanel.tsx`: `useEffect` missing dependencies.
- `src/hooks/useSound.ts`: unused eslint-disable directive.
- `src/lib/buildingAnimations.ts`: anonymous default export warning.
- `src/lib/reactOptimization.ts`: non-literal dependency array + missing deps.

## Game load verification
- Manual runtime verification (Playwright) was blocked by sandbox port restrictions.
- No SSR crash hazards remain in `graphicsSettings.ts` after the fix; client-only modules that are already marked `use client` remain safe.

## Files changed
- `src/lib/graphicsSettings.ts`
- `src/hooks/useMobile.ts`
