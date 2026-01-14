# Hero Pet System - Black & White Inspired Creature Companion

## Executive Summary

A companion creature system inspired by Lionhead Studios' Black & White (2001), featuring a trainable Hero Pet that:
- Lives in the city and interacts with the NPC system
- Can be fed, trained, praised, and punished via a "God Hand" interface
- Morphs visually between good/evil alignments based on behavior
- Learns from observation and player feedback
- Has needs, moods, and relationships with NPCs

---

## 1. Core Concept: The Titan Pet

### 1.1 What is the Hero Pet?

The Hero Pet (internally: `TitanPet`) is a unique, singular creature that serves as the player's avatar within the city. Unlike regular NPCs who live autonomously, the Titan is:

- **Directly trainable** by the player via praise/punishment
- **Learnable** - observes NPCs and mimics behaviors
- **Moral** - has an alignment that shifts between good (-1.0) and evil (+1.0)
- **Visually morphing** - appearance changes based on alignment
- **Interactive** - player can command it via the God Hand cursor

### 1.2 Design Philosophy

**Black & White's Key Innovations:**
1. Creature learns by observation + reinforcement (not just commands)
2. Moral alignment affects visual appearance dramatically
3. The creature acts autonomously when not being trained
4. Player feels attachment through nurturing mechanics
5. Belief-Desire-Intention (BDI) AI architecture

**Our Adaptation:**
- Crypto-themed personality traits
- Integration with existing NPC needs/mood/relationship systems
- Isometric pixel art style instead of 3D
- Multiple creature species (unlockable)

---

## 2. Creature Types & Visual Design

### 2.1 Available Creature Species

| Species | Unlock Condition | Base Stats | Crypto Flavor |
|---------|-----------------|------------|---------------|
| **Doge** | Default starter | Balanced | "Such wow, very moon" |
| **Bull** | Place 10 commercial | High strength, low speed | "Bull market energy" |
| **Bear** | Survive market crash | High defense, cautious | "Bear market survivor" |
| **Ape** | Own 100 NFTs value | High intelligence | "Together strong" |
| **Whale** | Treasury > 1M | Massive, slow, powerful | "Market mover" |
| **Phoenix** | Rebuild after disaster | Fast regeneration | "From the ashes" |

### 2.2 Visual Morphing System

Each creature has **5 alignment states** with distinct visual changes:

```
ALIGNMENT SCALE
-1.0 ────────────────────── 0.0 ────────────────────── +1.0
 │                          │                          │
 ▼                          ▼                          ▼
ANGELIC                  NEUTRAL                   DEMONIC
```

**Visual Changes by Alignment:**

| Alignment | Value Range | Visual Traits |
|-----------|-------------|---------------|
| Angelic | -1.0 to -0.6 | White/golden glow, halo particles, soft rounded features |
| Good | -0.6 to -0.2 | Lighter colors, friendly expression, subtle glow |
| Neutral | -0.2 to +0.2 | Base creature appearance |
| Evil | +0.2 to +0.6 | Darker colors, red eyes, sharper features |
| Demonic | +0.6 to +1.0 | Dark aura, horns/spikes, fire particles |

### 2.3 Sprite Sheet Structure

Each creature requires the following animations:

**Core Animations (4 directions each):**
- `idle` - Standing, breathing
- `walk` - Moving between tiles
- `run` - Fast movement
- `eat` - Consuming food
- `sleep` - Resting animation
- `sit` - Idle sitting

**Emotional Animations:**
- `happy` - Jumping, tail wagging
- `sad` - Drooping, whimpering
- `angry` - Growling, aggressive stance
- `scared` - Cowering, shaking
- `curious` - Sniffing, looking around

**Interaction Animations:**
- `pet_reaction` - When praised
- `punish_reaction` - When punished
- `learn` - Lightbulb moment
- `help_npc` - Assisting an NPC
- `attack` - Aggressive action

**Special Animations:**
- `morph_good` - Transformation toward good
- `morph_evil` - Transformation toward evil
- `cast_miracle` - Using special abilities

**Sprite Sheet Format:**
```
/public/Pet/[species]/[alignment]/
├── idle_north.gif (8 frames)
├── idle_south.gif
├── idle_east.gif
├── idle_west.gif
├── walk_north.gif (8 frames)
├── walk_south.gif
├── walk_east.gif
├── walk_west.gif
├── ... etc for all animations
```

**Resolution:** 64x64 pixels per frame (larger than NPCs at 44x22)

---

## 3. The God Hand System

### 3.1 What is the God Hand?

The God Hand is a special cursor mode that allows divine interaction with the world. Inspired by Black & White's iconic floating hand.

**God Hand States:**
- **Default** - Normal cursor for UI/building
- **Active** - Glowing hand cursor for divine actions
- **Grasping** - Holding an object/NPC
- **Praising** - Rainbow particles, petting motion
- **Punishing** - Red particles, slapping motion

### 3.2 God Hand Actions

| Action | Trigger | Effect on Titan | Visual Feedback |
|--------|---------|-----------------|-----------------|
| **Pet/Praise** | Click + drag down | +Happiness, reinforces last action as GOOD | Rainbow particles, happy sound |
| **Slap/Punish** | Click + drag up | -Happiness, reinforces last action as BAD | Red particles, sad sound |
| **Pick Up** | Click + hold | Carries Titan to new location | Titan dangles from cursor |
| **Drop** | Release while holding | Places Titan, may affect mood | Landing animation |
| **Point** | Right-click location | Commands Titan to go there | Arrow indicator |
| **Feed** | Drag food to Titan | Satisfies hunger, affects alignment | Eating animation |
| **Throw** | Pick up + fling | Throws object/NPC (evil action) | Arc trajectory |

### 3.3 Teaching Through Reinforcement

**The Core Loop:**
1. Titan performs an action (eat, help NPC, steal, etc.)
2. Player observes the action
3. Player praises (good) or punishes (bad) within 3 seconds
4. Titan learns association: `action → good/bad`
5. Titan's `actionBeliefs` map updates

```typescript
interface ActionBelief {
  action: string;
  goodness: number; // -1.0 (very bad) to +1.0 (very good)
  confidence: number; // 0-1, how sure Titan is
  lastReinforced: number; // timestamp
}
```

**Decay System:**
- Beliefs decay toward neutral if not reinforced
- Confident beliefs (many reinforcements) decay slower
- This creates need for ongoing training

### 3.4 God Hand Visual Design

**Cursor Sprite Variants:**
```
/public/UI/GodHand/
├── hand_default.png
├── hand_active.png
├── hand_grasping.png
├── hand_praising.gif (animated sparkles)
├── hand_punishing.gif (animated red glow)
├── hand_good.png (golden tint at good alignment)
├── hand_evil.png (red tint at evil alignment)
```

The hand's appearance morphs with player's cumulative alignment actions:
- Many good actions → Hand becomes golden, angelic
- Many evil actions → Hand becomes red, clawed

---

## 4. Titan Needs & Mood System

### 4.1 Titan Needs (Extended from NPC)

The Titan shares the base needs system but with modified decay rates and satisfiers:

```typescript
interface TitanNeeds extends NPCNeeds {
  // Inherited: hunger, energy, social, fun, wealth, purpose
  
  // Titan-specific additions:
  attention: Need; // Needs player interaction
  growth: Need;    // Wants to learn new things
}
```

**Titan-Specific Satisfiers:**

| Need | How to Satisfy |
|------|----------------|
| Hunger | Feed directly, eat from city food sources |
| Energy | Sleep in den, nap in parks |
| Social | Interact with NPCs, receive praise |
| Fun | Play with objects, explore new areas |
| Attention | Player interaction via God Hand |
| Growth | Learn new actions, level up skills |

### 4.2 Titan Mood System

Extended from NPC mood with Titan-specific triggers:

```typescript
interface TitanMood extends InternalWorld {
  // Extended beliefs
  beliefsAboutPlayer: {
    trust: number;      // Does Titan trust the player?
    fear: number;       // Is Titan afraid of player?
    affection: number;  // Does Titan love player?
  };
  
  // Extended desires
  currentGoal: TitanGoal | null;
}

type TitanGoal = 
  | { type: 'seek_food' }
  | { type: 'seek_attention' }
  | { type: 'help_npc', npcId: string }
  | { type: 'explore_area', area: Position }
  | { type: 'learn_from', npcId: string }
  | { type: 'rest' }
  | { type: 'play' };
```

### 4.3 Alignment Calculation

Alignment is calculated from:

1. **Action History** - Good actions vs evil actions
2. **Beliefs** - What does Titan think is good/bad?
3. **Recent Behavior** - Weighted toward recent actions

```typescript
function calculateAlignment(titan: TitanPet): number {
  let alignment = 0;
  
  // Recent actions (last 100) weighted by recency
  for (const action of titan.actionHistory.slice(-100)) {
    const weight = getRecencyWeight(action.timestamp);
    alignment += action.alignmentImpact * weight;
  }
  
  // Normalize to -1 to +1
  return Math.max(-1, Math.min(1, alignment / 100));
}
```

---

## 5. Titan AI & Behavior System

### 5.1 Belief-Desire-Intention (BDI) Architecture

Following Black & White's AI design:

```typescript
interface TitanBDI {
  // BELIEFS - What Titan knows/believes about the world
  beliefs: {
    worldKnowledge: Map<string, any>;     // Facts about city
    actionBeliefs: Map<string, ActionBelief>; // Good/bad actions
    npcOpinions: Map<string, number>;     // Like/dislike NPCs
    playerRelationship: PlayerBelief;     // Feelings about player
  };
  
  // DESIRES - What Titan wants (from needs + mood)
  desires: TitanDesire[];
  
  // INTENTIONS - Current plan to achieve desire
  currentIntention: TitanIntention | null;
}

interface TitanDesire {
  type: string;
  priority: number; // Higher = more urgent
  source: 'need' | 'mood' | 'curiosity' | 'command';
}

interface TitanIntention {
  goal: TitanGoal;
  plan: TitanAction[];
  currentStep: number;
}
```

### 5.2 Learning System

**Ways Titan Learns:**

1. **Direct Training** (Player teaches via praise/punishment)
   - Most reliable
   - Creates strong beliefs quickly
   - Can override observed behaviors

2. **Observation Learning** (Watching NPCs)
   - Titan sees NPC perform action
   - Titan may try to mimic
   - Success/failure affects belief
   - Uses existing `NPCLearning` system

3. **Experimentation** (Trial and error)
   - Titan tries random actions
   - Outcomes shape beliefs
   - Curiosity-driven

```typescript
// Learning from observation
function onObserveNPC(titan: TitanPet, npc: CryptoNPC, action: string) {
  // Record observation
  titan.bdi.beliefs.observedBehaviors.push({
    actorId: npc.id,
    action,
    outcome: 'pending',
    observedAt: Date.now()
  });
  
  // Chance to mimic based on curiosity + respect for NPC
  const mimicChance = 
    titan.personality.bigFive.openness * 0.3 +
    (titan.bdi.beliefs.npcOpinions.get(npc.id) ?? 0) * 0.1;
  
  if (Math.random() < mimicChance) {
    titan.queueAction({ type: 'mimic', action, learnedFrom: npc.id });
  }
}
```

### 5.3 Autonomous Behavior

When not receiving commands, Titan follows this priority:

1. **Critical Needs** - If any need < 20%, address it
2. **Player Commands** - If recently commanded, execute
3. **Current Intention** - Continue current plan
4. **Desire-Driven** - Pursue highest priority desire
5. **Curiosity** - Explore, observe, experiment
6. **Idle** - Wander, play, rest

---

## 6. Titan-NPC Interactions

### 6.1 Interaction Types

The Titan can interact with NPCs in various ways:

| Interaction | Alignment Impact | NPC Effect | Learning |
|-------------|------------------|------------|----------|
| **Greet** | Neutral | +Familiarity | Social skill |
| **Help** | Good (+0.05) | +Trust, +Respect | Helping skill |
| **Play** | Neutral | +Fun for both | Social skill |
| **Protect** | Good (+0.1) | +Trust | Combat skill |
| **Steal From** | Evil (+0.1) | -Trust, -Respect | Theft skill |
| **Scare** | Evil (+0.05) | -Trust, Fear | Intimidation |
| **Attack** | Evil (+0.2) | Major damage | Combat skill |
| **Heal** | Good (+0.1) | Restores health | Healing skill |
| **Teach** | Good (+0.05) | NPC learns | Teaching skill |
| **Learn From** | Neutral | Titan learns | Learning skill |

### 6.2 Relationship with NPCs

Titan maintains relationships with NPCs using the existing relationship system:

```typescript
// Titan's view of NPCs
titanRelationships: Record<string, {
  trust: number;      // -100 to +100
  familiarity: number; // 0 to 100
  opinion: number;    // Like/dislike
  fearOf: number;     // How afraid is NPC of Titan?
  lastInteraction: number;
}>;
```

### 6.3 NPC Reactions to Titan

NPCs react to the Titan based on:
- Titan's alignment (good Titans are welcomed, evil are feared)
- Personal relationship history
- Titan's current action

```typescript
function getNPCReactionToTitan(npc: CryptoNPC, titan: TitanPet): NPCReaction {
  const relationship = titan.relationships[npc.id];
  const alignmentFear = titan.alignment > 0.3 ? titan.alignment * 50 : 0;
  
  if (relationship?.fearOf > 50 || alignmentFear > 30) {
    return 'flee';
  }
  if (relationship?.trust > 30 && titan.alignment < 0) {
    return 'approach';
  }
  return 'ignore';
}
```

---

## 7. Titan Skills & Progression

### 7.1 Skill Categories

```typescript
type TitanSkill = 
  // Physical
  | 'strength'    // Carrying, throwing, combat damage
  | 'speed'       // Movement, reaction time
  | 'endurance'   // Need decay rate, stamina
  
  // Mental
  | 'intelligence' // Learning speed, puzzle solving
  | 'awareness'    // Observation range, detail noticed
  | 'memory'       // How long beliefs persist
  
  // Social
  | 'charisma'    // NPC interaction success
  | 'intimidation' // Scare effectiveness
  | 'empathy'     // Understanding NPC needs
  
  // Special
  | 'miracles'    // Special ability power
  | 'stealth'     // Unnoticed actions
  | 'gathering';  // Resource collection
```

### 7.2 Skill Progression

Skills level up through use (1-10 scale):

```typescript
interface TitanSkillProgression {
  skill: TitanSkill;
  level: number;        // 1-10
  experience: number;   // XP toward next level
  aptitude: number;     // Species modifier (0.5-2.0)
}

// XP thresholds (same as NPC system)
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000];
```

### 7.3 Miracles (Special Abilities)

High-level Titans can perform miracles:

| Miracle | Alignment Required | Effect | Skill Required |
|---------|-------------------|--------|----------------|
| **Heal** | Good (-0.3) | Restore NPC health | Empathy 5 |
| **Bless** | Good (-0.5) | Boost NPC productivity | Charisma 7 |
| **Shield** | Good (-0.4) | Protect area from disasters | Miracles 6 |
| **Curse** | Evil (+0.3) | Debuff NPC | Intimidation 5 |
| **Storm** | Evil (+0.5) | Damage area | Miracles 8 |
| **Fire** | Evil (+0.6) | Ignite buildings | Miracles 7 |
| **Growth** | Neutral | Accelerate plant growth | Gathering 6 |
| **Food** | Neutral | Create food | Gathering 5 |

---

## 8. Titan Home (Den)

### 8.1 The Titan Den Building

A special building that serves as the Titan's home:

```typescript
interface TitanDen {
  id: string;
  position: { x: number; y: number };
  level: number;        // 1-5, upgradeable
  size: [number, number]; // Footprint grows with level
  
  // Features unlocked by level
  features: {
    feedingBowl: boolean;    // Level 1
    waterBowl: boolean;      // Level 1
    sleepingArea: boolean;   // Level 1
    toyStorage: boolean;     // Level 2
    trainingDummy: boolean;  // Level 2
    miracleAltar: boolean;   // Level 3
    memoryShrine: boolean;   // Level 4
    evolutionChamber: boolean; // Level 5
  };
}
```

### 8.2 Den Interactions

The den provides:
- Safe sleeping (faster energy recovery)
- Guaranteed food source
- Training opportunities
- Visual customization
- Evolution/species change (at level 5)

---

## 9. Save/Load & Persistence

### 9.1 Titan Serialization

```typescript
interface SerializedTitan {
  // Identity
  species: TitanSpecies;
  name: string;
  age: number; // In-game days since creation
  
  // Position
  gridX: number;
  gridY: number;
  direction: Direction;
  
  // Stats
  alignment: number;
  skills: Record<TitanSkill, TitanSkillProgression>;
  needs: TitanNeeds;
  mood: TitanMood;
  
  // AI State
  bdi: TitanBDI;
  actionHistory: ActionHistoryEntry[];
  
  // Relationships
  relationships: Record<string, TitanRelationship>;
  
  // Visuals
  currentAppearance: AlignmentState;
  customizations: TitanCustomization[];
}
```

### 9.2 Storage

Titan data is stored separately from NPCs for quick access:

```typescript
const TITAN_STORAGE_KEY = 'crypto-city-titan';

// Save
localStorage.setItem(TITAN_STORAGE_KEY, JSON.stringify(serializeTitan(titan)));

// Load
const titanData = JSON.parse(localStorage.getItem(TITAN_STORAGE_KEY) ?? 'null');
if (titanData) {
  titan = deserializeTitan(titanData);
}
```

---

## 10. UI Components

### 10.1 Titan Status Panel

A persistent UI panel showing:

```
┌─────────────────────────────────────┐
│  🐕 Doge the Titan                  │
│  ═══════════════════════════════    │
│                                     │
│  Alignment: [▓▓▓▓░░░░░░] Good       │
│                                     │
│  Needs:                             │
│  🍖 Hunger  [▓▓▓▓▓▓░░░░]           │
│  ⚡ Energy  [▓▓▓▓▓▓▓▓░░]           │
│  💬 Social  [▓▓▓▓▓░░░░░]           │
│  🎮 Fun     [▓▓▓▓▓▓▓░░░]           │
│  👋 Attention [▓▓▓░░░░░░░]         │
│                                     │
│  Mood: 😊 Happy                     │
│  Goal: Seeking food                 │
│                                     │
│  [Feed] [Pet] [Command] [Status]   │
└─────────────────────────────────────┘
```

### 10.2 Titan Detailed View

Full-screen panel with:
- Large Titan sprite display
- Full skill breakdown
- Relationship list
- Action history
- Beliefs inspector (debug mode)
- Customization options

### 10.3 God Hand Mode Toggle

```
┌────────────────────┐
│  🖐️ God Hand Mode  │
│  ═══════════════   │
│  [Activate]        │
│                    │
│  Hotkey: G         │
└────────────────────┘
```

### 10.4 Training Feedback

Visual feedback when training:

**Praise:**
- Rainbow particles emanate from hand
- Musical chime sound
- "+✓ Good [action]!" floating text
- Titan plays happy animation

**Punish:**
- Red particles emanate from hand
- Negative sound
- "-✗ Bad [action]!" floating text
- Titan plays sad animation

---

## 11. Technical Implementation

### 11.1 File Structure

```
src/
├── lib/
│   └── titan/
│       ├── index.ts           # Exports
│       ├── types.ts           # All Titan types
│       ├── TitanManager.ts    # Singleton manager
│       ├── TitanAI.ts         # BDI implementation
│       ├── TitanNeeds.ts      # Extended needs
│       ├── TitanLearning.ts   # Learning system
│       ├── TitanAlignment.ts  # Alignment calculation
│       ├── TitanSkills.ts     # Skill progression
│       ├── TitanMiracles.ts   # Special abilities
│       └── TitanSpawner.ts    # Creation/initialization
│
├── hooks/
│   └── useTitan.ts            # React hook for Titan state
│
├── components/
│   └── titan/
│       ├── TitanStatusPanel.tsx
│       ├── TitanDetailView.tsx
│       ├── TitanTrainingFeedback.tsx
│       └── GodHandCursor.tsx
│
└── games/isocity/types/
    └── titan.ts               # Core type definitions
```

### 11.2 Integration Points

**With NPC System:**
- Uses shared `NPCNeeds` base
- Uses shared `NPCMood` base
- Uses shared `Relationship` types
- Uses shared `NPCLearning` patterns

**With Game Loop:**
- Updated in `NPCSimulation.tick()` or separate `TitanSimulation`
- Camera follows Titan option
- LOD system applies

**With Renderer:**
- Drawn as special entity (larger than NPCs)
- Z-depth always above NPCs
- Particle effects for alignment/miracles

### 11.3 Performance Considerations

- Single Titan instance (singleton pattern)
- Belief map limited to 100 entries with LRU eviction
- Action history capped at 500 entries
- Relationship data only for interacted NPCs

---

## 12. Development Phases

### Phase 1: Core Titan (MVP)
- [ ] Basic Titan types and spawning
- [ ] Single species (Doge)
- [ ] Basic needs system
- [ ] Simple idle/walk animations
- [ ] Basic God Hand (pet/punish)
- [ ] Alignment calculation

### Phase 2: Learning & Training
- [ ] BDI AI implementation
- [ ] Action belief system
- [ ] Praise/punishment reinforcement
- [ ] Observation learning from NPCs
- [ ] Training feedback UI

### Phase 3: Visual Polish
- [ ] All animation states
- [ ] Alignment morphing visuals
- [ ] God Hand cursor variants
- [ ] Particle effects
- [ ] Sound effects

### Phase 4: NPC Integration
- [ ] Titan-NPC interactions
- [ ] Relationship system integration
- [ ] Good/evil action effects on NPCs
- [ ] NPC reactions to Titan

### Phase 5: Advanced Features
- [ ] Multiple species
- [ ] Skill progression
- [ ] Miracles system
- [ ] Titan Den building
- [ ] Evolution mechanics

### Phase 6: Polish & Balance
- [ ] Balance testing
- [ ] Save/load verification
- [ ] Performance optimization
- [ ] Tutorial integration

---

## 13. Asset Requirements

### 13.1 Sprite Sheets Needed

| Asset | Size | Frames | Variants |
|-------|------|--------|----------|
| Doge Idle | 64x64 | 8 | 5 alignments × 4 directions |
| Doge Walk | 64x64 | 8 | 5 alignments × 4 directions |
| Doge Run | 64x64 | 8 | 5 alignments × 4 directions |
| Doge Eat | 64x64 | 12 | 5 alignments |
| Doge Sleep | 64x64 | 4 | 5 alignments |
| Doge Happy | 64x64 | 8 | 5 alignments |
| Doge Sad | 64x64 | 8 | 5 alignments |
| Doge Angry | 64x64 | 8 | 5 alignments |
| Doge Pet Reaction | 64x64 | 8 | 5 alignments |
| Doge Punish Reaction | 64x64 | 8 | 5 alignments |
| God Hand | 32x32 | 1-8 | 7 variants |

**Total for MVP (1 species):** ~45 sprite sheets

### 13.2 Sound Effects

| Sound | Duration | Usage |
|-------|----------|-------|
| praise_chime.mp3 | 0.5s | When praising |
| punish_negative.mp3 | 0.5s | When punishing |
| titan_happy.mp3 | 1s | Happy reaction |
| titan_sad.mp3 | 1s | Sad reaction |
| titan_eat.mp3 | 1s | Eating |
| titan_learn.mp3 | 0.5s | Learning moment |
| miracle_cast.mp3 | 2s | Using miracle |
| alignment_shift.mp3 | 1s | Alignment changes |

---

## 14. Testing Strategy

### 14.1 Unit Tests

```typescript
// Example test cases
describe('TitanAlignment', () => {
  it('should shift toward good when praised for helping', () => {
    const titan = createTestTitan();
    titan.performAction('help_npc');
    titanManager.praise(titan);
    expect(titan.alignment).toBeLessThan(0);
  });
  
  it('should shift toward evil when praised for stealing', () => {
    const titan = createTestTitan();
    titan.performAction('steal');
    titanManager.praise(titan);
    expect(titan.alignment).toBeGreaterThan(0);
  });
});

describe('TitanLearning', () => {
  it('should increase action belief confidence on repeated reinforcement', () => {
    const titan = createTestTitan();
    for (let i = 0; i < 5; i++) {
      titan.performAction('help_npc');
      titanManager.praise(titan);
    }
    expect(titan.bdi.beliefs.actionBeliefs.get('help_npc').confidence).toBeGreaterThan(0.5);
  });
});
```

### 14.2 Integration Tests

- Titan spawns correctly on game load
- Titan persists across save/load
- Titan interacts with NPCs properly
- God Hand controls work
- Visual morphing triggers correctly

### 14.3 E2E Tests (Playwright)

```typescript
test('can train Titan via God Hand', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="titan-sprite"]');
  
  // Activate God Hand
  await page.keyboard.press('g');
  
  // Click Titan
  await page.click('[data-testid="titan-sprite"]');
  
  // Drag down to praise
  await page.mouse.down();
  await page.mouse.move(0, 50);
  await page.mouse.up();
  
  // Verify praise feedback
  await expect(page.locator('[data-testid="praise-particles"]')).toBeVisible();
});
```

---

## 15. References

### 15.1 Black & White Resources
- [Black & White Wiki - Creature](https://blackandwhite.fandom.com/wiki/Creature)
- [Black & White Wiki - Creature Training](https://blackandwhite.fandom.com/wiki/Creature_training)
- [Creature AI Technical Paper](https://wischik.com/lu/senses/bwcreature.html)
- [GDC 2002: Implementing Wittgenstein](https://www.gamedeveloper.com/design/gdc-2002-social-activities-implementing-wittgenstein)

### 15.2 Related Systems in Codebase
- `src/lib/npc/needs.ts` - Base needs system
- `src/lib/npc/mood.ts` - Mood/internal world
- `src/lib/npc/learning.ts` - Learning system
- `src/lib/npc/relationships.ts` - Relationship tracking
- `src/lib/npc/NPCSimulation.ts` - Simulation loop

---

## Appendix A: Crypto-Themed Alignment Actions

### Good Actions (Decrease Alignment)
- Helping NPCs with tasks
- Sharing alpha/information
- Protecting from disasters
- Building community structures
- Donating to treasury
- Teaching new skills
- Healing injured NPCs

### Evil Actions (Increase Alignment)
- Stealing from NPCs
- Scaring/intimidating
- Destroying property
- Hoarding resources
- Spreading FUD
- Market manipulation (if integrated)
- Attacking NPCs

### Neutral Actions
- Eating food
- Sleeping
- Walking/exploring
- Observing
- Playing
- Gathering resources

---

## Appendix B: Example Training Session

```
Day 1, 8:00 AM - Titan spawns in city
Day 1, 8:05 AM - Titan wanders to commercial district
Day 1, 8:10 AM - Titan sees NPC struggling with boxes
Day 1, 8:11 AM - Titan helps NPC carry boxes (neutral action)
Day 1, 8:12 AM - Player praises Titan (✓ Good: help_npc)
Day 1, 8:15 AM - Titan sees food stall
Day 1, 8:16 AM - Titan eats from stall without paying (theft)
Day 1, 8:17 AM - Player punishes Titan (✗ Bad: steal)
Day 1, 8:20 AM - Titan tries to help another NPC
Day 1, 8:21 AM - Player praises again (✓ Good: help_npc)

Result: Titan learns "helping = good", "stealing = bad"
Alignment shifts slightly toward good (-0.05)
Belief confidence for help_npc: 0.3
Belief confidence for steal: -0.2
```

---

*Last Updated: January 2026*
*Spec Version: 1.0*
