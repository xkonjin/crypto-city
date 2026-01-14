---
name: implement-npc-behavior
description: Add new NPC need, activity, or interaction to the NPC simulation system. Use when extending NPC behaviors.
---

# Implement NPC Behavior

Complete workflow for adding new NPC behaviors to CryptoCity.

## Behavior Types

| Type | Description | Files to Modify |
|------|-------------|-----------------|
| Need | New motivation (e.g., "creativity") | needs.ts, NPCSimulation.ts |
| Activity | New idle behavior (e.g., "street_performing") | activities.ts, drawPedestrians.ts |
| Interaction | New social action (e.g., "teach_crypto") | InteractionManager.ts |
| Schedule | New routine pattern | ScheduleManager.ts |

## Adding a New Need

### 1. Define Need Type

Edit `src/lib/npc/needs.ts`:

```typescript
export interface NPCNeeds {
  hunger: number;
  energy: number;
  social: number;
  fun: number;
  wealth: number;
  purpose: number;
  security: number;
  attention: number;
  creativity: number;  // New need
}

export const DEFAULT_NEEDS: NPCNeeds = {
  // ... existing
  creativity: 70,
};

export const NEED_DECAY_RATES: Record<keyof NPCNeeds, number> = {
  // ... existing
  creativity: 0.3,  // Decays slowly
};
```

### 2. Add Satisfaction Logic

Edit `src/lib/npc/NPCSimulation.ts`:

```typescript
function satisfyNeed(npc: NPC, need: keyof NPCNeeds, amount: number) {
  npc.needs[need] = Math.min(100, npc.needs[need] + amount);
}

// In handleUrgentNeed:
case 'creativity':
  // Find art gallery, studio, or street corner
  const creativeSpot = findNearestCreativeSpot(npc);
  if (creativeSpot) {
    npc.destination = creativeSpot;
    npc.currentActivity = 'creating_art';
  }
  break;
```

### 3. Add Building Satisfaction

Edit `src/lib/npc/buildingSatisfaction.ts`:

```typescript
export const BUILDING_NEED_SATISFACTION: Record<string, Partial<NPCNeeds>> = {
  // ... existing
  'nft-gallery': { creativity: 30, fun: 15 },
  'art-studio': { creativity: 50, purpose: 20 },
};
```

## Adding a New Activity

### 1. Define Activity

Edit `src/lib/npc/activities.ts`:

```typescript
export type NPCActivity = 
  | 'walking'
  | 'idle'
  // ... existing
  | 'street_performing';

export const ACTIVITY_DURATIONS: Record<NPCActivity, number> = {
  // ... existing
  street_performing: 300,  // 5 game minutes
};

export const ACTIVITY_NEED_EFFECTS: Record<NPCActivity, Partial<NPCNeeds>> = {
  // ... existing
  street_performing: { creativity: 20, social: 10, attention: 15 },
};
```

### 2. Add Visual Rendering

Edit `src/components/game/drawPedestrians.ts`:

```typescript
function drawPedestrianActivity(
  ctx: CanvasRenderingContext2D,
  npc: NPC,
  screenPos: { x: number; y: number }
) {
  switch (npc.currentActivity) {
    // ... existing cases
    case 'street_performing':
      drawStreetPerformer(ctx, npc, screenPos);
      break;
  }
}

function drawStreetPerformer(ctx, npc, pos) {
  // Draw NPC with musical notes or performance indicator
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y - 20, 4, 0, Math.PI * 2);
  ctx.fill();
  // Musical note animation
}
```

### 3. Add Activity Selection Logic

Edit `src/lib/npc/NPCSimulation.ts`:

```typescript
function selectIdleActivity(npc: NPC): NPCActivity {
  // If creative and low creativity need
  if (npc.personality.openness > 0.7 && npc.needs.creativity < 40) {
    return 'street_performing';
  }
  // ... existing logic
}
```

## Adding a New Interaction

### 1. Define Interaction Type

Edit `src/lib/npc/InteractionManager.ts`:

```typescript
export type InteractionType = 
  | 'greeting'
  | 'conversation'
  // ... existing
  | 'teach_crypto';

export const INTERACTION_CONFIG: Record<InteractionType, InteractionConfig> = {
  // ... existing
  teach_crypto: {
    duration: 120,  // 2 game minutes
    initiatorRequirements: { degenLevel: 0.6 },
    targetRequirements: { trustInInstitutions: 0.3 },
    outcomes: {
      success: {
        initiator: { social: 15, purpose: 20 },
        target: { wealth: 10, security: -5 },
        relationshipChange: 10,
      },
      failure: {
        initiator: { social: -5 },
        target: { trust: -10 },
        relationshipChange: -5,
      },
    },
    successChance: (initiator, target) => {
      return 0.3 + initiator.personality.extraversion * 0.3 
             + (1 - target.personality.neuroticism) * 0.2;
    },
  },
};
```

### 2. Add Interaction Trigger

Edit `src/lib/npc/NPCSimulation.ts`:

```typescript
function checkForInteractionOpportunity(npc: NPC, nearbyNPCs: NPC[]) {
  // ... existing logic
  
  // Check for teach_crypto opportunity
  if (npc.personality.degenLevel > 0.6 && Math.random() < 0.1) {
    const target = nearbyNPCs.find(n => 
      n.personality.trustInInstitutions < 0.5 &&
      !n.hasBeenTaughtCrypto
    );
    if (target) {
      initiateInteraction(npc, target, 'teach_crypto');
    }
  }
}
```

## Testing

Create `tests/npcNewBehavior.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('NPC Creativity Need', () => {
  test('creativity decays over time', async () => {
    // Test need decay
  });

  test('art gallery satisfies creativity', async () => {
    // Test building satisfaction
  });
});

test.describe('Street Performing Activity', () => {
  test('NPC performs when creativity low', async () => {
    // Test activity selection
  });
});
```

## Success Criteria

- [ ] Type definitions added
- [ ] Decay/satisfaction logic implemented
- [ ] Visual rendering added (if activity)
- [ ] Interaction config complete (if interaction)
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Behavior visible in game

## Common Patterns

### Personality-Based Selection
```typescript
const chance = npc.personality.openness * 0.5 + Math.random() * 0.5;
if (chance > 0.6) selectActivity();
```

### Need Threshold Check
```typescript
if (npc.needs.creativity < URGENT_THRESHOLD) {
  handleUrgentNeed(npc, 'creativity');
}
```

### Relationship Effect
```typescript
npc.relationships.set(target.id, {
  ...existing,
  trust: existing.trust + change,
});
```
