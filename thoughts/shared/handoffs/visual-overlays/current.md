## Checkpoints
**Task:** Add visual overlay system for yields, risk, and coverage (Issue #58)
**Last Updated:** 2026-01-11

### Phase Status
- Phase 1 (Tests Written): → IN_PROGRESS
- Phase 2 (Implementation): ○ PENDING
- Phase 3 (Refactoring): ○ PENDING

### Resume Context
- Current focus: Writing failing tests for crypto overlay system
- Next action: Create test file for crypto overlays

### Requirements Summary
1. Create `src/lib/overlays.ts` with crypto overlay types and calculation functions
2. Implement overlay types: yield, risk, protection, density (synergy already exists)
3. Add OverlaySelector UI component
4. Add OverlayLegend UI component
5. Integrate overlays into CanvasIsometricGrid
