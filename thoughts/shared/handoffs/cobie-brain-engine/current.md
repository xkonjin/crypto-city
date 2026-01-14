# CobieBrain Engine Implementation - Issue #175

## Checkpoints
**Task:** CobieBrain Engine for Floating Cobie Head System
**Last Updated:** 2026-01-13

### Phase Status
- Phase 1 (Tests Written): ✓ VALIDATED
- Phase 2 (Implementation): ✓ COMPLETED
- Phase 3 (Hook Implementation): ✓ COMPLETED
- Phase 4 (Test Verification): ✓ VALIDATED
- Phase 5 (Documentation): ✓ COMPLETED

### Resume Context
- Current focus: COMPLETED
- Next action: None - Task fully implemented

---

## Implementation Report: CobieBrain Engine

### TDD Summary
- Tests written: 39
- Tests passing: 39
- Files created: 4

### Files Created
1. `src/lib/cobie/types.ts` - Type definitions for the CobieBrain system
2. `src/lib/cobie/CobieBrain.ts` - Core AI decision engine
3. `src/lib/cobie/index.ts` - Module exports
4. `src/hooks/useCobieBrain.ts` - React hook for brain state management
5. `tests/cobieBrain.spec.ts` - Comprehensive test suite

### Changes Made

#### 1. Types (`src/lib/cobie/types.ts`)
- `CobieMood` - 7 mood states (neutral, amused, concerned, excited, bored, sardonic, thinking)
- `CobieExpression` - 10 expression types for visual rendering
- `LookDirection` - 5 directions (center, left, right, up, down)
- `IdleState` - 4 idle progression states
- `PrioritizedDialogue` - Dialogue entry with priority queue support
- `CobieBrainState` - Complete brain state interface
- `CobieContext` - Input context for state calculation

#### 2. CobieBrain Engine (`src/lib/cobie/CobieBrain.ts`)
Core functions implemented:
- `calculateMoodFromContext()` - Determines mood from game context
- `selectExpression()` - Selects visual expression based on mood/events
- `calculateLookDirection()` - Calculates look direction from cursor position
- `getIdleState()` - Returns idle progression state
- `createDialogueQueue()` / `addToDialogueQueue()` / `dequeueDialogue()` - Dialogue queue management
- `createInitialBrainState()` - Creates default brain state
- `updateBrainState()` - Updates brain state from context

#### 3. useCobieBrain Hook (`src/hooks/useCobieBrain.ts`)
React hook providing:
- `state` - Current CobieBrainState
- `updateContext()` - Update from game context
- `queueDialogue()` - Add dialogue to queue
- `dismissDialogue()` - Show next dialogue
- `startSpeaking()` / `stopSpeaking()` - Control speech state
- `setCobiePosition()` - Set position for look direction
- `reset()` - Reset brain state

### Decision Rules Implemented

1. **Mood from Context:**
   - High risk building hovered (rugRisk > 0.3) → 'concerned'
   - Legend building hovered → 'excited'
   - Treasury dropping → 'concerned'
   - Treasury rising → 'amused'
   - Idle > 30s → 'bored'
   - Default → 'neutral'

2. **Expression from Mood + Events:**
   - Speaking → 'talking' (highest priority)
   - Idle > 120s → 'sleeping'
   - concerned + hover → 'raised_eyebrow'
   - excited + milestone → 'wide_eyes'
   - bored → 'squint'
   - amused → 'smirk'
   - thinking → 'thinking'
   - sardonic → 'concerned'
   - Default → 'idle'

3. **Look Direction:**
   - Based on hovered tile position relative to Cobie
   - Returns to 'center' when idle > 5s
   - Threshold of 50px to prevent jitter

4. **Idle Progression:**
   - 0-30s: neutral
   - 30-60s: bored
   - 60-120s: very_bored (yawning)
   - 120s+: sleeping

### Next Steps
The CobieBrain engine is ready for integration with:
- CobieContextProvider (Issue #174) - Provides context updates
- FloatingCobieHead component (Issue #176) - Visual renderer
- Enhanced dialogue triggers from useCobieNarrator

### Test Coverage
All 39 tests cover:
- Type exports and validation
- Mood calculation from all context scenarios
- Expression selection for all moods
- Look direction calculation
- Idle progression timing
- Dialogue queue operations
- Brain state management
