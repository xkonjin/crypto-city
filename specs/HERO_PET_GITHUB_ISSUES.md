# Hero Pet System - GitHub Issues

## Epic: Hero Pet System (Black & White Inspired)

Create a trainable companion creature system inspired by Lionhead Studios' Black & White, featuring a Hero Pet that learns through observation and reinforcement, morphs visually based on alignment, and interacts deeply with the NPC system.

**Related Spec:** `specs/HERO_PET_SYSTEM.md`

---

## Phase 1: Core Titan Infrastructure (MVP)

### Issue #1: Core Titan Type Definitions
**Labels:** `feature`, `titan`, `types`, `phase-1`
**Estimate:** 2-3 hours

**Description:**
Create the foundational TypeScript types for the Titan Pet system.

**Tasks:**
- [ ] Create `src/games/isocity/types/titan.ts` with:
  - `TitanSpecies` enum (Doge, Bull, Bear, Ape, Whale, Phoenix)
  - `AlignmentState` type (-1.0 to +1.0 scale)
  - `TitanSkill` type (strength, speed, intelligence, etc.)
  - `TitanGoal` type for BDI system
  - `ActionBelief` interface for learning system
  - `TitanNeeds` interface extending NPCNeeds
  - `TitanMood` interface extending InternalWorld
  - `TitanBDI` interface (beliefs, desires, intentions)
  - `TitanPet` main interface
  - `SerializedTitan` for persistence

**Acceptance Criteria:**
- All types compile without errors
- Types are properly exported
- Types integrate with existing NPC type system
- JSDoc comments on all public interfaces

---

### Issue #2: TitanManager Singleton
**Labels:** `feature`, `titan`, `core`, `phase-1`
**Estimate:** 3-4 hours

**Description:**
Create the singleton manager class for the Titan, similar to NPCManager.

**Tasks:**
- [ ] Create `src/lib/titan/TitanManager.ts` with:
  - Singleton pattern implementation
  - `spawnTitan(species, position)` method
  - `getTitan()` method
  - `despawnTitan()` method
  - `updateTitan(deltaTime)` method
  - `saveToStorage()` method
  - `loadFromStorage()` method
  - `clearStorage()` method

**Acceptance Criteria:**
- Only one Titan can exist at a time
- Titan persists across page reloads
- Manager integrates with existing game loop

**Dependencies:** Issue #1

---

### Issue #3: Titan Needs System
**Labels:** `feature`, `titan`, `needs`, `phase-1`
**Estimate:** 2-3 hours

**Description:**
Extend the NPC needs system for the Titan with additional needs.

**Tasks:**
- [ ] Create `src/lib/titan/TitanNeeds.ts` with:
  - Extended needs: attention, growth
  - Modified decay rates for Titan-specific needs
  - `createDefaultTitanNeeds()` function
  - `updateTitanNeeds(needs, deltaMinutes)` function
  - `satisfyTitanNeed(needs, needType, amount)` function
  - `getMostUrgentTitanNeed(needs)` function

**Acceptance Criteria:**
- Titan needs decay over time
- Needs can be satisfied through appropriate actions
- Urgent needs trigger behavior changes
- Integrates with existing NeedsManager pattern

**Dependencies:** Issue #1

---

### Issue #4: Basic Titan Spawner
**Labels:** `feature`, `titan`, `spawning`, `phase-1`
**Estimate:** 2 hours

**Description:**
Create the system for spawning and initializing a new Titan.

**Tasks:**
- [ ] Create `src/lib/titan/TitanSpawner.ts` with:
  - `createTitan(options: TitanSpawnOptions)` function
  - Default personality generation per species
  - Initial stats based on species
  - Name generation for Titan

**Acceptance Criteria:**
- Can spawn a Titan at specified position
- Titan initializes with correct default values
- Different species have different base stats

**Dependencies:** Issue #1, #3

---

### Issue #5: Titan Alignment System
**Labels:** `feature`, `titan`, `alignment`, `phase-1`
**Estimate:** 3-4 hours

**Description:**
Implement the good/evil alignment system that affects Titan behavior and appearance.

**Tasks:**
- [ ] Create `src/lib/titan/TitanAlignment.ts` with:
  - `calculateAlignment(titan)` function
  - `shiftAlignment(titan, delta)` function
  - `getAlignmentState(alignment)` function (angelic/good/neutral/evil/demonic)
  - `ALIGNMENT_ACTION_IMPACTS` constant map
  - Good actions list (help, protect, heal, teach, donate)
  - Evil actions list (steal, scare, attack, destroy)
  - Alignment decay toward neutral over time

**Acceptance Criteria:**
- Alignment correctly calculated from action history
- Actions appropriately shift alignment
- Alignment bounded to -1.0 to +1.0
- Alignment state correctly categorized

**Dependencies:** Issue #1

---

### Issue #6: Titan Integration with Game Loop
**Labels:** `feature`, `titan`, `integration`, `phase-1`
**Estimate:** 2-3 hours

**Description:**
Integrate the Titan into the main game simulation loop.

**Tasks:**
- [ ] Modify `src/lib/npc/NPCSimulation.ts` to:
  - Include Titan update in tick cycle
  - Handle Titan-NPC proximity detection
  - Apply LOD to Titan updates
- [ ] Create `src/hooks/useTitan.ts` hook:
  - Expose Titan state to React
  - Provide Titan action methods
  - Handle real-time updates

**Acceptance Criteria:**
- Titan updates every simulation tick
- Titan state accessible from React components
- Performance impact minimal

**Dependencies:** Issues #1-5

---

## Phase 2: Learning & Training System

### Issue #7: BDI (Belief-Desire-Intention) AI Core
**Labels:** `feature`, `titan`, `ai`, `phase-2`
**Estimate:** 5-6 hours

**Description:**
Implement the Belief-Desire-Intention architecture for Titan decision making.

**Tasks:**
- [ ] Create `src/lib/titan/TitanAI.ts` with:
  - `TitanBDI` class implementation
  - `updateBeliefs(titan, observation)` method
  - `computeDesires(titan)` method
  - `formIntention(titan, desires)` method
  - `executeIntention(titan)` method
  - Belief decay system
  - Desire prioritization algorithm

**Acceptance Criteria:**
- Titan makes autonomous decisions based on BDI
- Beliefs update based on observations
- Intentions form logical plans
- Plans execute step by step

**Dependencies:** Issue #1

---

### Issue #8: Action Belief Learning System
**Labels:** `feature`, `titan`, `learning`, `phase-2`
**Estimate:** 4-5 hours

**Description:**
Implement the system where Titan learns which actions are good/bad through reinforcement.

**Tasks:**
- [ ] Create `src/lib/titan/TitanLearning.ts` with:
  - `ActionBeliefMap` class
  - `reinforceAction(action, isGood)` method
  - `getActionBelief(action)` method
  - `decayBeliefs(deltaTime)` method
  - Confidence calculation
  - LRU eviction for old beliefs (max 100)
- [ ] Track action history (last 500 actions)

**Acceptance Criteria:**
- Titan remembers if actions were praised/punished
- Confidence increases with repeated reinforcement
- Old beliefs decay if not reinforced
- Action history persists across saves

**Dependencies:** Issues #1, #7

---

### Issue #9: Observation Learning from NPCs
**Labels:** `feature`, `titan`, `learning`, `phase-2`
**Estimate:** 4-5 hours

**Description:**
Allow Titan to learn by observing NPC behaviors.

**Tasks:**
- [ ] Extend `TitanLearning.ts` with:
  - `onObserveNPC(npc, action)` method
  - `recordObservation(observation)` method
  - Mimicry chance calculation based on personality
  - Learning from observed outcomes
- [ ] Integrate with NPC interaction system

**Acceptance Criteria:**
- Titan notices nearby NPC actions
- Titan may attempt to mimic observed actions
- Learning from observation is slower than direct training
- Personality affects mimicry likelihood

**Dependencies:** Issues #7, #8

---

### Issue #10: God Hand Cursor System
**Labels:** `feature`, `titan`, `ui`, `god-hand`, `phase-2`
**Estimate:** 4-5 hours

**Description:**
Implement the God Hand cursor mode for divine interaction.

**Tasks:**
- [ ] Create `src/components/titan/GodHandCursor.tsx`:
  - Custom cursor rendering
  - Cursor state management (default/active/grasping/praising/punishing)
  - Drag gesture detection
  - Visual feedback (particles, glow)
- [ ] Add keyboard shortcut (G) to toggle God Hand mode
- [ ] Create cursor sprite variants in `/public/UI/GodHand/`

**Acceptance Criteria:**
- Cursor visually changes in God Hand mode
- Drag gestures correctly detected
- Visual feedback for praise/punish clear
- Can toggle mode on/off

**Dependencies:** None (can be developed in parallel)

---

### Issue #11: Praise/Punish Training Mechanics
**Labels:** `feature`, `titan`, `training`, `phase-2`
**Estimate:** 4-5 hours

**Description:**
Implement the core training loop: action → player feedback → learning.

**Tasks:**
- [ ] Create `src/lib/titan/TitanTraining.ts` with:
  - `praise(titan)` method
  - `punish(titan)` method
  - `recordAction(titan, action)` method
  - Timing window (3 seconds after action)
  - Integration with ActionBeliefMap
- [ ] Create `src/components/titan/TitanTrainingFeedback.tsx`:
  - Floating text feedback
  - Particle effects
  - Sound effect triggers

**Acceptance Criteria:**
- Player can praise/punish Titan via God Hand
- Training only effective within timing window
- Visual/audio feedback clear
- Alignment shifts appropriately

**Dependencies:** Issues #8, #10

---

### Issue #12: Training Feedback UI
**Labels:** `feature`, `titan`, `ui`, `phase-2`
**Estimate:** 3-4 hours

**Description:**
Create clear visual feedback for training interactions.

**Tasks:**
- [ ] Create particle effects:
  - Rainbow particles for praise
  - Red particles for punishment
- [ ] Create floating text:
  - "+✓ Good [action]!" for praise
  - "-✗ Bad [action]!" for punishment
- [ ] Add sound effects:
  - `praise_chime.mp3`
  - `punish_negative.mp3`
- [ ] Create Titan reaction animations:
  - Happy bounce for praise
  - Sad droop for punishment

**Acceptance Criteria:**
- Feedback immediate and clear
- Particles render correctly
- Sounds play at appropriate times
- Animations smooth

**Dependencies:** Issue #11

---

## Phase 3: Visual & Animation System

### Issue #13: Titan Sprite System Architecture
**Labels:** `feature`, `titan`, `rendering`, `phase-3`
**Estimate:** 4-5 hours

**Description:**
Create the sprite loading and management system for Titan.

**Tasks:**
- [ ] Create `src/lib/titan/TitanSprite.ts` with:
  - Sprite sheet loading for species/alignment
  - Animation state machine
  - Direction handling (4 directions)
  - Frame interpolation
- [ ] Define sprite sheet format and naming convention
- [ ] Create sprite loading queue

**Acceptance Criteria:**
- Sprites load correctly for all states
- Animation transitions smooth
- Direction changes handled
- Performance acceptable

**Dependencies:** Issue #1

---

### Issue #14: Alignment Visual Morphing
**Labels:** `feature`, `titan`, `visuals`, `phase-3`
**Estimate:** 5-6 hours

**Description:**
Implement visual changes based on alignment state.

**Tasks:**
- [ ] Create 5 visual variants for Doge:
  - Angelic: White/golden glow, halo
  - Good: Lighter colors, friendly
  - Neutral: Base appearance
  - Evil: Darker, red eyes
  - Demonic: Dark aura, spikes
- [ ] Create transition animations between states
- [ ] Implement gradual morphing during gameplay
- [ ] Add particle effects for aligned states

**Acceptance Criteria:**
- Visual changes match alignment state
- Transitions smooth and noticeable
- Particles enhance the effect
- Performance maintained

**Dependencies:** Issue #13

---

### Issue #15: Core Animation Set (Doge)
**Labels:** `assets`, `titan`, `animation`, `phase-3`
**Estimate:** 8-10 hours (art work)

**Description:**
Create the core animation sprite sheets for the Doge species.

**Tasks:**
- [ ] Create idle animations (4 directions × 5 alignments)
- [ ] Create walk animations (4 directions × 5 alignments)
- [ ] Create eat animation (5 alignments)
- [ ] Create sleep animation (5 alignments)
- [ ] Create happy/sad/angry animations (5 alignments)
- [ ] Create pet_reaction animation (5 alignments)
- [ ] Create punish_reaction animation (5 alignments)
- [ ] Export as GIF with consistent timing

**Acceptance Criteria:**
- All animations 64x64 pixels
- 8 frames per animation minimum
- Consistent art style with game
- All alignment variants complete

**Dependencies:** None (art task)

---

### Issue #16: God Hand Cursor Sprites
**Labels:** `assets`, `titan`, `ui`, `phase-3`
**Estimate:** 2-3 hours (art work)

**Description:**
Create the God Hand cursor sprite variants.

**Tasks:**
- [ ] Create `hand_default.png` (32x32)
- [ ] Create `hand_active.png` (glowing)
- [ ] Create `hand_grasping.png` (closed)
- [ ] Create `hand_praising.gif` (with sparkles)
- [ ] Create `hand_punishing.gif` (with red glow)
- [ ] Create `hand_good.png` (golden variant)
- [ ] Create `hand_evil.png` (red/clawed variant)

**Acceptance Criteria:**
- Clear visual distinction between states
- Animated variants smooth
- Style matches game aesthetic

**Dependencies:** None (art task)

---

## Phase 4: NPC Integration

### Issue #17: Titan-NPC Interaction System
**Labels:** `feature`, `titan`, `npc`, `phase-4`
**Estimate:** 5-6 hours

**Description:**
Implement the full range of Titan-NPC interactions.

**Tasks:**
- [ ] Create `src/lib/titan/TitanInteractions.ts` with:
  - `InteractionType` enum (greet, help, play, protect, steal, scare, attack, heal, teach)
  - `initiateInteraction(titan, npc, type)` method
  - `processInteraction(titan, npc, type)` method
  - `INTERACTION_ALIGNMENT_IMPACTS` constant
  - `INTERACTION_EFFECTS` on relationships
- [ ] Create interaction animations

**Acceptance Criteria:**
- All interaction types functional
- Correct alignment impact
- Relationship changes appropriate
- Animations play correctly

**Dependencies:** Issues #1, #7, existing NPC interaction system

---

### Issue #18: NPC Reactions to Titan
**Labels:** `feature`, `titan`, `npc`, `phase-4`
**Estimate:** 3-4 hours

**Description:**
Make NPCs react appropriately to the Titan based on alignment and relationship.

**Tasks:**
- [ ] Create `src/lib/titan/NPCTitanReactions.ts` with:
  - `getNPCReaction(npc, titan)` function
  - Reaction types: approach, ignore, flee, worship
  - Alignment-based fear calculation
  - Relationship-based trust calculation
- [ ] Modify NPC pathfinding to avoid/approach Titan
- [ ] Add NPC reaction animations

**Acceptance Criteria:**
- NPCs flee from evil Titans
- NPCs approach friendly Titans
- Reactions consider relationship history
- Visual feedback clear

**Dependencies:** Issue #17

---

### Issue #19: Titan Relationship Tracking
**Labels:** `feature`, `titan`, `relationships`, `phase-4`
**Estimate:** 3-4 hours

**Description:**
Track Titan's relationships with individual NPCs.

**Tasks:**
- [ ] Extend Titan type with `relationships: Record<string, TitanRelationship>`
- [ ] Create relationship update methods
- [ ] Integrate with existing RelationshipManager patterns
- [ ] Track fear, trust, familiarity per NPC
- [ ] Persist relationships in save data

**Acceptance Criteria:**
- Relationships update from interactions
- Relationships affect future interactions
- Relationships persist across sessions
- UI can display relationship info

**Dependencies:** Issues #1, #17

---

## Phase 5: Advanced Features

### Issue #20: Titan Skill Progression System
**Labels:** `feature`, `titan`, `skills`, `phase-5`
**Estimate:** 4-5 hours

**Description:**
Implement the skill leveling system for Titan.

**Tasks:**
- [ ] Create `src/lib/titan/TitanSkills.ts` with:
  - All skill types (strength, speed, intelligence, etc.)
  - XP thresholds (matching NPC system)
  - `grantXP(skill, amount)` method
  - `getSkillLevel(skill)` method
  - `getSkillModifier(skill)` method
  - Species aptitude modifiers
- [ ] Skill decay for unused skills

**Acceptance Criteria:**
- Skills level up through use
- Different species have different aptitudes
- Skills affect Titan performance
- Skills persist in save data

**Dependencies:** Issue #1

---

### Issue #21: Miracles System
**Labels:** `feature`, `titan`, `miracles`, `phase-5`
**Estimate:** 5-6 hours

**Description:**
Implement special abilities (miracles) for high-level Titans.

**Tasks:**
- [ ] Create `src/lib/titan/TitanMiracles.ts` with:
  - Miracle types (heal, bless, shield, curse, storm, fire, growth, food)
  - Alignment requirements per miracle
  - Skill requirements per miracle
  - `canUseMiracle(titan, miracle)` method
  - `useMiracle(titan, miracle, target)` method
  - Cooldown system
- [ ] Create miracle visual effects
- [ ] Create miracle sound effects

**Acceptance Criteria:**
- Miracles require correct alignment/skills
- Effects match miracle descriptions
- Cooldowns prevent spam
- Visual/audio feedback clear

**Dependencies:** Issues #5, #20

---

### Issue #22: Multiple Species Implementation
**Labels:** `feature`, `titan`, `species`, `phase-5`
**Estimate:** 6-8 hours (per additional species)

**Description:**
Implement additional Titan species beyond Doge.

**Tasks:**
- [ ] Define base stats for each species:
  - Bull: High strength, low speed
  - Bear: High defense, cautious
  - Ape: High intelligence
  - Whale: Massive, slow, powerful
  - Phoenix: Fast regeneration
- [ ] Create sprite sheets for each species (separate art tasks)
- [ ] Create unlock conditions
- [ ] Create species selection UI

**Acceptance Criteria:**
- Each species has unique stats
- Species can be unlocked through gameplay
- Player can switch species (with restrictions)
- All species have complete animations

**Dependencies:** Issues #13, #14, #15

---

### Issue #23: Titan Den Building
**Labels:** `feature`, `titan`, `building`, `phase-5`
**Estimate:** 4-5 hours

**Description:**
Create the special Titan Den building.

**Tasks:**
- [ ] Add `titan_den` to buildings registry
- [ ] Create 5 upgrade levels with different features
- [ ] Implement den mechanics:
  - Feeding bowl (satisfies hunger)
  - Water bowl
  - Sleeping area (energy boost)
  - Training dummy (skill XP)
  - Miracle altar
- [ ] Create den sprites (5 levels × 4 directions)

**Acceptance Criteria:**
- Den placeable in city
- Features unlock with upgrades
- Titan uses den appropriately
- Visual upgrades clear

**Dependencies:** Issue #1

---

### Issue #24: Evolution/Species Change
**Labels:** `feature`, `titan`, `evolution`, `phase-5`
**Estimate:** 4-5 hours

**Description:**
Allow Titan to evolve or change species at max den level.

**Tasks:**
- [ ] Create evolution chamber mechanic
- [ ] Implement species swap (keeps mind/training)
- [ ] Create evolution animation
- [ ] Define evolution requirements
- [ ] Create evolution UI

**Acceptance Criteria:**
- Can change species at den level 5
- Skills/beliefs transfer
- Visual evolution sequence
- New species unlocked properly

**Dependencies:** Issues #22, #23

---

## Phase 6: UI & Polish

### Issue #25: Titan Status Panel UI
**Labels:** `feature`, `titan`, `ui`, `phase-6`
**Estimate:** 3-4 hours

**Description:**
Create the persistent UI panel showing Titan status.

**Tasks:**
- [ ] Create `src/components/titan/TitanStatusPanel.tsx`:
  - Titan name and species icon
  - Alignment bar with visual indicator
  - Needs bars (hunger, energy, social, fun, attention)
  - Current mood display
  - Current goal display
  - Quick action buttons (Feed, Pet, Command, Status)
- [ ] Make panel collapsible
- [ ] Add keyboard shortcuts

**Acceptance Criteria:**
- Panel shows all key information
- Updates in real-time
- Collapsible to save space
- Accessible and clear

**Dependencies:** Issues #1, #3, #5

---

### Issue #26: Titan Detail View UI
**Labels:** `feature`, `titan`, `ui`, `phase-6`
**Estimate:** 4-5 hours

**Description:**
Create the full-screen detailed Titan view.

**Tasks:**
- [ ] Create `src/components/titan/TitanDetailView.tsx`:
  - Large Titan sprite display (animated)
  - Full skill breakdown with XP bars
  - Relationship list with NPCs
  - Action history log
  - Beliefs inspector (toggle for debug)
  - Customization options
- [ ] Add tabs for different sections
- [ ] Create modal overlay

**Acceptance Criteria:**
- All Titan data viewable
- Smooth animations
- Easy navigation
- Debug info toggleable

**Dependencies:** Issues #19, #20, #25

---

### Issue #27: Tutorial Integration
**Labels:** `feature`, `titan`, `tutorial`, `phase-6`
**Estimate:** 3-4 hours

**Description:**
Add tutorial steps for the Titan system.

**Tasks:**
- [ ] Add tutorial steps:
  1. "Meet your Titan" - introduction
  2. "Feeding your Titan" - needs tutorial
  3. "The God Hand" - cursor mode tutorial
  4. "Training basics" - praise/punish tutorial
  5. "Alignment" - good/evil explanation
- [ ] Create tutorial overlay graphics
- [ ] Add skip option

**Acceptance Criteria:**
- Tutorial teaches core concepts
- Can be skipped by experienced players
- Integrates with existing tutorial system

**Dependencies:** Issues #10, #11, #25

---

### Issue #28: Sound Effects Integration
**Labels:** `feature`, `titan`, `audio`, `phase-6`
**Estimate:** 2-3 hours

**Description:**
Add all Titan-related sound effects.

**Tasks:**
- [ ] Create/source sound effects:
  - `titan_happy.mp3`
  - `titan_sad.mp3`
  - `titan_eat.mp3`
  - `titan_learn.mp3`
  - `miracle_cast.mp3`
  - `alignment_shift.mp3`
  - `god_hand_activate.mp3`
- [ ] Integrate with existing sound system
- [ ] Add volume controls

**Acceptance Criteria:**
- All sounds play at correct times
- Sounds match game aesthetic
- Volume controllable

**Dependencies:** Issues #11, #21

---

### Issue #29: Performance Optimization
**Labels:** `optimization`, `titan`, `phase-6`
**Estimate:** 3-4 hours

**Description:**
Optimize Titan system for performance.

**Tasks:**
- [ ] Implement belief map LRU eviction
- [ ] Optimize sprite loading (lazy load alignment variants)
- [ ] Reduce action history memory (cap at 500)
- [ ] Profile and optimize BDI update loop
- [ ] Add LOD for Titan when zoomed out

**Acceptance Criteria:**
- No noticeable performance degradation
- Memory usage bounded
- Works on lower-end devices

**Dependencies:** All previous issues

---

### Issue #30: Comprehensive Testing
**Labels:** `testing`, `titan`, `phase-6`
**Estimate:** 4-5 hours

**Description:**
Create full test suite for Titan system.

**Tasks:**
- [ ] Unit tests for:
  - TitanAlignment
  - TitanLearning
  - TitanNeeds
  - TitanAI/BDI
  - TitanSkills
- [ ] Integration tests for:
  - Titan-NPC interactions
  - Save/load persistence
  - God Hand controls
- [ ] E2E tests (Playwright):
  - Spawn and basic control
  - Training workflow
  - Alignment changes

**Acceptance Criteria:**
- 80%+ code coverage
- All critical paths tested
- Tests pass in CI

**Dependencies:** All previous issues

---

## Issue Dependencies Graph

```
Phase 1 (Core):
#1 Types ──┬──► #2 Manager
           ├──► #3 Needs
           ├──► #4 Spawner ──► #6 Integration
           └──► #5 Alignment

Phase 2 (Learning):
#7 BDI AI ──┬──► #8 Action Beliefs ──► #9 Observation
            └──► #11 Training ◄── #10 God Hand
                     └──► #12 Feedback UI

Phase 3 (Visuals):
#13 Sprite System ──► #14 Alignment Morphing
#15 Doge Animations (parallel art task)
#16 God Hand Sprites (parallel art task)

Phase 4 (NPC Integration):
#17 Titan-NPC Interactions ──┬──► #18 NPC Reactions
                             └──► #19 Relationships

Phase 5 (Advanced):
#20 Skills ──┬──► #21 Miracles
             └──► #22 Species
#23 Den Building ──► #24 Evolution

Phase 6 (Polish):
#25 Status Panel ──► #26 Detail View
#27 Tutorial
#28 Sound Effects
#29 Performance
#30 Testing
```

---

## Milestone Summary

| Milestone | Issues | Est. Hours | Description |
|-----------|--------|------------|-------------|
| **M1: Core** | #1-6 | 15-20 | Basic Titan that spawns and has needs |
| **M2: Training** | #7-12 | 25-30 | Learning system with God Hand |
| **M3: Visuals** | #13-16 | 20-25 | Full visual implementation |
| **M4: NPCs** | #17-19 | 12-14 | NPC interaction system |
| **M5: Advanced** | #20-24 | 25-30 | Skills, miracles, species, den |
| **M6: Polish** | #25-30 | 20-25 | UI, audio, optimization, testing |

**Total Estimated Hours:** 115-145 hours

---

## Labels to Create

- `titan` - All Titan-related issues
- `god-hand` - God Hand cursor system
- `alignment` - Good/evil alignment system
- `phase-1` through `phase-6` - Development phases
- `assets` - Art/audio assets needed
- `npc-integration` - Integration with NPC system
- `miracles` - Special abilities

---

## Getting Started Commands

```bash
# Create issues from this spec
gh issue create --title "Core Titan Type Definitions" --body-file issue1.md --label "feature,titan,types,phase-1"

# Or use the Ralph system to process:
# 1. Convert this to prd.json format
# 2. Run Ralph autonomous implementation loop
```

---

*Generated: January 2026*
*Issues Version: 1.0*
