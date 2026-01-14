# Cobie Idle Behaviors - Implementation Checkpoint

## Checkpoints
**Task:** Implement idle behaviors for the Floating Cobie Head (Issue #180)
**Last Updated:** 2026-01-13

### Phase Status
- Phase 1 (Tests Written): ✓ VALIDATED
- Phase 2 (Implementation): ✓ COMPLETED
- Phase 3 (Refactoring): ✓ COMPLETED

### Files Created
1. `src/lib/cobie/CobieIdleBehaviors.ts` - Core idle behaviors system
2. `src/hooks/useCobieIdleBehaviors.ts` - React hook for integration
3. `tests/cobieIdleBehaviors.spec.ts` - 35 comprehensive tests

### Files Modified
1. `src/lib/cobie/index.ts` - Added exports for new module

## Implementation Summary

### CobieIdleBehaviors.ts
Pure functions for idle behavior logic:
- **Configuration exports**: `BLINK_CONFIG`, `LOOK_AROUND_CONFIG`, `BOREDOM_THRESHOLDS`
- **Blink functions**: `generateBlinkInterval()`, `shouldDoubleBlink()`
- **Look functions**: `getRandomLookDirection()`
- **Boredom functions**: `calculateBoredomLevel()`, `shouldTriggerYawn()`
- **Sleep functions**: `shouldEnterSleep()`, `shouldWakeUp()`
- **State management**: `createIdleBehaviorState()`, `updateIdleBehaviorState()`

### useCobieIdleBehaviors Hook
React hook that:
- Takes `idleSeconds` and `isSpeaking` as inputs
- Returns `IdleBehaviorOutput` with current state
- Updates at 100ms intervals for smooth animations
- Handles activity detection and wake up logic

### Behavior Logic
1. **Blinking**: Random 3-8s intervals, 20% double blink chance, disabled while speaking/sleeping
2. **Looking Around**: Random 10-30s intervals, faster when bored, stops on activity
3. **Boredom Progression**: 0-30s normal, 30-60s slightly_bored, 60-90s bored, 90-120s very_bored
4. **Sleep Mode**: After 120s idle, shows ZZZ effect
5. **Wake Up**: Returns startled expression briefly on activity

### Test Coverage
35 tests covering:
- Configuration exports
- Blink timing randomization
- Look direction changes  
- Boredom level progression
- Yawn triggering
- Sleep mode transitions
- Wake up behavior
- State management
- Full idle cycle integration

## Next Steps
- Integration with FloatingCobieHead component
- Add CSS animations for blink/sleep effects
- Connect to CobieContext for activity detection
