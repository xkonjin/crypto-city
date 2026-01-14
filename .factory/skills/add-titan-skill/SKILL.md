---
name: add-titan-skill
description: Add a new Titan skill with XP progression and species aptitudes. Use when extending the Hero Pet skill system.
---

# Add Titan Skill

Complete workflow for adding a new skill to the Titan (Hero Pet) system.

## Inputs Required

| Input | Description | Example |
|-------|-------------|---------|
| Skill Name | camelCase identifier | "trading" |
| Category | physical, mental, social, special | "special" |
| Description | What the skill does | "Ability to make profitable trades" |
| Base Effects | What it enables | "Unlock crypto trading actions" |
| Species Aptitudes | Which species excel | { whale: 1.5, ape: 1.3 } |

## Steps

### 1. Add Skill Type

Edit `src/games/isocity/types/titan.ts`:

```typescript
export type TitanSkillName = 
  | 'strength'
  | 'speed'
  // ... existing
  | 'trading';  // New skill

export interface TitanSkills {
  // ... existing
  trading: SkillLevel;
}
```

### 2. Configure Skill

Edit `src/lib/titan/TitanSkills.ts`:

```typescript
export const SKILL_CONFIG: Record<TitanSkillName, SkillConfig> = {
  // ... existing skills
  trading: {
    name: 'trading',
    category: 'special',
    description: 'Ability to identify and execute profitable market opportunities',
    baseXPGain: 10,
    levelThresholds: [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000],
    effects: {
      1: 'Can observe market trends',
      3: 'Can make small trades',
      5: 'Can identify arbitrage opportunities',
      7: 'Can predict short-term movements',
      10: 'Master trader - rarely loses',
    },
  },
};

export const SKILL_CATEGORIES: Record<SkillCategory, TitanSkillName[]> = {
  // ... existing
  special: ['miracles', 'stealth', 'gathering', 'trading'],
};
```

### 3. Add Species Aptitudes

Edit `src/lib/titan/TitanSkills.ts`:

```typescript
export const SPECIES_APTITUDES: Record<TitanSpecies, Partial<Record<TitanSkillName, number>>> = {
  doge: { charisma: 1.2, empathy: 1.1 },
  bull: { strength: 1.5, endurance: 1.3, intimidation: 1.2 },
  bear: { strength: 1.3, endurance: 1.5, awareness: 1.2 },
  ape: { intelligence: 1.5, memory: 1.3, awareness: 1.2, trading: 1.3 },  // Apes good at trading
  whale: { strength: 1.8, endurance: 2.0, miracles: 1.3, trading: 1.5 },  // Whales best at trading
  phoenix: { speed: 1.5, miracles: 1.4, charisma: 1.3 },
};
```

### 4. Add XP Gain Actions

Edit `src/lib/titan/TitanLearning.ts`:

```typescript
export const ACTION_SKILL_XP: Record<TitanAction, Partial<Record<TitanSkillName, number>>> = {
  // ... existing
  observe_market: { trading: 5, awareness: 2 },
  execute_trade: { trading: 15, intelligence: 5 },
  analyze_chart: { trading: 10, memory: 3 },
};
```

### 5. Add Skill-Based Actions

Edit `src/lib/titan/TitanAI.ts`:

```typescript
function getAvailableActions(titan: Titan): TitanAction[] {
  const actions: TitanAction[] = ['idle', 'explore', 'rest'];
  
  // ... existing skill checks
  
  // Trading skill unlocks
  if (titan.skills.trading.level >= 1) {
    actions.push('observe_market');
  }
  if (titan.skills.trading.level >= 3) {
    actions.push('execute_trade');
  }
  if (titan.skills.trading.level >= 5) {
    actions.push('analyze_chart');
  }
  
  return actions;
}
```

### 6. Add Visual Indicator

Edit `src/components/titan/TitanDetailView.tsx`:

```typescript
// In skills tab
<SkillBar
  name="Trading"
  level={titan.skills.trading.level}
  xp={titan.skills.trading.xp}
  nextLevelXP={getNextLevelXP('trading', titan.skills.trading.level)}
  icon={<TrendingUp className="w-4 h-4" />}
/>
```

### 7. Write Tests

Add to `tests/titanSkills.spec.ts`:

```typescript
test.describe('Trading Skill', () => {
  test('trading skill gains XP from observe_market', async () => {
    const titan = createTestTitan({ species: 'whale' });
    const initialXP = titan.skills.trading.xp;
    
    performAction(titan, 'observe_market');
    
    // Whale has 1.5x aptitude
    expect(titan.skills.trading.xp).toBe(initialXP + 5 * 1.5);
  });

  test('trading level 3 unlocks execute_trade', async () => {
    const titan = createTestTitan();
    titan.skills.trading.level = 2;
    
    expect(getAvailableActions(titan)).not.toContain('execute_trade');
    
    titan.skills.trading.level = 3;
    expect(getAvailableActions(titan)).toContain('execute_trade');
  });

  test('species aptitudes apply correctly', async () => {
    const whale = createTestTitan({ species: 'whale' });
    const doge = createTestTitan({ species: 'doge' });
    
    performAction(whale, 'observe_market');
    performAction(doge, 'observe_market');
    
    // Whale gains more XP
    expect(whale.skills.trading.xp).toBeGreaterThan(doge.skills.trading.xp);
  });
});
```

### 8. Verify Integration

```bash
# Build check
npm run build

# Run titan tests
npx playwright test tests/titan*.spec.ts

# Visual verification
npm run dev
# Spawn titan, perform trading actions, check XP gain
```

## Success Criteria

- [ ] Skill type added to types/titan.ts
- [ ] Skill config with thresholds and effects
- [ ] Species aptitudes configured
- [ ] XP gain actions defined
- [ ] Skill-based action unlocks work
- [ ] UI displays skill correctly
- [ ] Tests pass
- [ ] Build succeeds

## Skill Balance Guidelines

| Category | XP Rate | Level 5 Effect | Level 10 Effect |
|----------|---------|----------------|-----------------|
| Physical | Fast | Moderate boost | Major boost |
| Mental | Medium | Unlock ability | Master ability |
| Social | Medium | NPC reactions | Reputation |
| Special | Slow | Unique action | Powerful action |

## Common Patterns

### Level Check
```typescript
if (titan.skills.trading.level >= REQUIRED_LEVEL) {
  // Unlock feature
}
```

### XP Calculation with Aptitude
```typescript
const baseXP = ACTION_SKILL_XP[action][skill];
const aptitude = SPECIES_APTITUDES[titan.species][skill] ?? 1.0;
const finalXP = baseXP * aptitude;
```

### Skill Modifier
```typescript
const modifier = getSkillModifier(titan.skills.trading.level);
// Level 1 = 0.5x, Level 10 = 1.5x
const result = baseValue * modifier;
```
