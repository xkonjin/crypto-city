# Titan BDI AI Core Implementation

## Checkpoints
**Task:** Implement BDI (Belief-Desire-Intention) AI Core for Titan Pet
**Last Updated:** 2026-01-11

### Phase Status
- Phase 1 (Tests Written): ✓ VALIDATED
- Phase 2 (Implementation): ✓ VALIDATED
- Phase 3 (Refactoring): ✓ VALIDATED

### Resume Context
- Current focus: Implementation complete
- Next action: None - task fully completed

---

## Implementation Summary

### Files Created
1. `src/lib/titan/TitanAI.ts` - Main BDI implementation
2. `tests/titanAI.spec.ts` - 59 comprehensive tests

### Files Modified
1. `src/lib/titan/index.ts` - Added exports for TitanAI module

---

## TitanBDI Class API

### Types Exported

```typescript
interface TitanObservation {
  type: 'npc_action' | 'player_action' | 'environment' | 'self_action';
  subject?: string;
  action?: string;
  outcome?: 'success' | 'failure' | 'neutral';
  location?: { x: number; y: number };
  timestamp: number;
}

interface TitanDesire {
  type: string;
  priority: number; // 0-1
  source: 'need' | 'mood' | 'curiosity' | 'command' | 'learned';
  target?: string | { x: number; y: number };
  reason: string;
}

interface TitanAction {
  type: string;
  target?: string | { x: number; y: number };
  duration?: number;
}

interface TitanIntention {
  goal: TitanGoal;
  plan: TitanAction[];
  currentStep: number;
  started: number;
  maxDuration: number;
}
```

### Class Methods

**Belief Management:**
- `updateBeliefs(observation: TitanObservation): void`
- `setWorldKnowledge(key: string, value: unknown): void`
- `getWorldKnowledge<T>(key: string): T | undefined`
- `setNPCOpinion(npcId: string, opinion: number): void`
- `getNPCOpinion(npcId: string): number`

**Desire Computation:**
- `computeDesires(titan: TitanPet): TitanDesire[]`
- `getPriorityDesires(count: number): TitanDesire[]`

**Intention Formation:**
- `formIntention(desires: TitanDesire[], titan: TitanPet): TitanIntention | null`
- `getCurrentIntention(): TitanIntention | null`
- `clearIntention(): void`

**Execution:**
- `executeIntention(titan: TitanPet): TitanAction | null`

**Decay:**
- `decayBeliefs(deltaMinutes: number): void`

**Serialization:**
- `toState(): TitanBDIState`
- `static fromState(state: TitanBDIState): TitanBDI`

---

## Key Features Implemented

### 1. Desire Computation Sources
- **Needs:** Low needs create desires (hunger → seek_food, energy → rest)
- **Mood:** Mood states affect desires (sad → seek_social, happy → explore)
- **Curiosity:** Exploration desires from personality/beliefs
- **Commands:** Player commands create high-priority (0.95) desires
- **Learned:** Positive NPC opinions and successful actions create repeat desires

### 2. Priority Formula
```typescript
priority = baseNeedPriority * (1 + personalityModifier) * urgencyMultiplier
```
- `baseNeedPriority`: (1 - current/max) * weight
- `personalityModifier`: Varies by need type (-0.1 to +0.15)
- `urgencyMultiplier`: 2.0 if below critical threshold

### 3. Plan Generation
Plans are 1-5 actions based on desire type:
- `seek_food`: move → eat (or wander → seek_food if no food location)
- `rest`: sit → sleep
- `seek_social`: move to NPC → interact (or wander → look_for_npc)
- `explore`: move to target → look_around
- `help_npc`: move to NPC → help

### 4. Belief Decay
- NPC opinions decay toward 0 at 0.5 per day
- World knowledge persists (doesn't decay)

---

## Test Coverage

59 tests covering:
- Type definitions (TitanObservation, TitanDesire, TitanAction, TitanIntention)
- Constructor behavior (default and initial state)
- Belief management (observations, world knowledge, NPC opinions)
- Desire computation (needs, mood, curiosity, commands, learned)
- Intention formation (plan creation, timestamps, duration)
- Execution (action retrieval, step advancement)
- Belief decay (NPC opinion decay, world knowledge persistence)
- Serialization (round-trip preservation)
- Integration (full BDI loop)

---

## Usage Example

```typescript
import { TitanBDI } from '@/lib/titan';

// Create BDI instance
const bdi = new TitanBDI();

// Observe environment
bdi.updateBeliefs({
  type: 'environment',
  action: 'discovered_food',
  location: { x: 10, y: 15 },
  timestamp: Date.now(),
});

// Compute desires based on titan state
const desires = bdi.computeDesires(titan);

// Form intention from highest priority desire
const intention = bdi.formIntention(desires, titan);

// Execute current action
const action = bdi.executeIntention(titan);

// Decay beliefs over time
bdi.decayBeliefs(deltaMinutes);

// Serialize for persistence
const state = bdi.toState();
const restored = TitanBDI.fromState(state);
```

---

## Notes

1. The implementation follows the existing patterns in TitanNeeds.ts and TitanAlignment.ts
2. Desire priority is clamped to 0-1 range
3. NPC opinions are clamped to -1 to +1 range
4. Plans are limited to 5 actions maximum
5. Default intention max duration is 5 minutes (300000ms)
