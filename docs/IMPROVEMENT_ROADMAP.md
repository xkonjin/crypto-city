# CryptoCity Improvement Roadmap

> Generated from comprehensive codebase analysis on 2026-01-12

## Executive Summary

After deep analysis of the codebase, game design documents, user stories, and UI components, this roadmap outlines a prioritized plan to improve CryptoCity across 6 major areas:

1. **UI Simplification** - Design system consistency, component refactoring
2. **Game Balance** - Economy, rug risk, market cycles
3. **User Experience** - Tutorial, feedback, tooltips
4. **Hero Pet Completion** - Titan sprite rendering, polish
5. **Performance** - Canvas optimization, NPC LOD
6. **Viral Features** - Sharing, leaderboards, referrals

## Priority Matrix

### Phase 1: Quick Wins (1-2 weeks)
High impact, low effort items to ship immediately.

| Issue | Title | Impact | Effort |
|-------|-------|--------|--------|
| #152 | City screenshot sharing | High | Low |
| #151 | Building placement feedback | High | Low |
| #160 | Enhanced tooltips | High | Low |
| #142 | Standardize design tokens | Medium | Low |

### Phase 2: Core Systems (2-4 weeks)
Foundation work enabling future features.

| Issue | Title | Impact | Effort |
|-------|-------|--------|--------|
| #148 | Time system | High | Medium |
| #147 | Rug risk events | High | Medium |
| #150 | Tutorial system | High | High |
| #143 | Split Game.tsx | Medium | Medium |

### Phase 3: Major Features (1-2 months)
Complete feature implementations.

| Issue | Title | Impact | Effort |
|-------|-------|--------|--------|
| #153 | Titan system completion | High | High |
| #161 | Leaderboard system | Medium | Medium |
| #155 | Performance optimization | High | High |
| #144 | Responsive components | Medium | Medium |

### Phase 4: Polish & Scale (Ongoing)
Long-term improvements.

| Issue | Title | Impact | Effort |
|-------|-------|--------|--------|
| #157 | NPC LOD system | Medium | High |
| #156 | Dirty region rendering | Medium | High |
| #162 | Aesthetic cohesion | Low | Medium |

## Epics Overview

### Epic #141: UI Simplification
**Goal:** Consistent, maintainable design system

Sub-issues:
- #142 - Standardize design tokens
- #143 - Split Game.tsx
- #144 - Responsive components
- #145 - Spacing scale documentation

**Success Metrics:**
- No hardcoded colors in components
- No file > 30KB
- Single responsive components

### Epic #146: Game Balance
**Goal:** Fair, engaging economy

Sub-issues:
- #147 - Rug risk events
- #148 - Time system
- #159 - Balance spreadsheet

**Success Metrics:**
- Player feedback "exciting but fair"
- Documented balance values
- Market cycles affect gameplay

### Epic #149: User Experience
**Goal:** 5-minute onboarding, satisfying feedback

Sub-issues:
- #150 - Interactive tutorial
- #151 - Building feedback
- #152 - Screenshot sharing
- #160 - Enhanced tooltips

**Success Metrics:**
- New players understand game in 5 minutes
- Satisfying feedback on every action
- Measurable sharing increase

### Epic #153: Hero Pet (Titan)
**Goal:** Ship trainable companion feature

Sub-issues:
- #154 - Sprite rendering integration

**Success Metrics:**
- Titan visible and animated
- God Hand controls intuitive
- All 21 test files pass

### Epic #155: Performance
**Goal:** 60 FPS on large cities

Sub-issues:
- #156 - Dirty region tracking
- #157 - NPC LOD system

**Success Metrics:**
- 60 FPS with 100+ buildings
- Simulation tick < 16ms
- Stable memory over 1 hour

### Epic #158: Viral Features
**Goal:** Drive organic growth

Sub-issues:
- #152 - Screenshot sharing (shared with UX epic)
- #161 - Leaderboards

**Success Metrics:**
- Increased social media mentions
- Measurable referral traffic
- Recurring engagement from events

## Implementation Order

```
Week 1-2: Quick Wins
├── #152 Screenshot sharing
├── #151 Building feedback
├── #160 Tooltips
└── #142 Design tokens

Week 3-4: Core Systems
├── #148 Time system
├── #147 Rug risk events
└── #143 Split Game.tsx

Week 5-6: Tutorial & UX
├── #150 Tutorial system
├── #145 Design system docs
└── #144 Responsive components

Week 7-8: Hero Pet
├── #154 Titan sprite rendering
└── #153 Complete Titan epic

Week 9-10: Performance
├── #156 Dirty region tracking
└── #157 NPC LOD system

Week 11-12: Social Features
├── #161 Leaderboards
└── #162 Aesthetic cohesion

Ongoing: Balance & Polish
├── #159 Balance spreadsheet
└── Continuous playtesting
```

## Technical Debt to Address

1. **Game.tsx (70KB)** - Split into focused modules
2. **Mobile/Desktop duplication** - Unified responsive components
3. **Hardcoded colors** - CSS custom properties everywhere
4. **Canvas performance** - Dirty region optimization
5. **NPC memory growth** - Cleanup and limits

## Key Architectural Decisions

### Simulation vs Rendering
- React owns all game state (simulation)
- Canvas only renders (pictures of numbers)
- NPCs/vehicles are cosmetic (never modify state)

### NPC Tiering
- 50-100 "real" NPCs with full AI
- 500+ "simulated" NPCs following flow lanes
- Abstract population as numbers in zones

### Titan Integration
- Singleton TitanManager
- Separate canvas layer
- BDI AI with reinforcement learning

## Success Criteria

### MVP Improvements (4 weeks)
- [ ] Screenshot sharing live
- [ ] Satisfying build feedback
- [ ] Rug events trigger
- [ ] Time system working
- [ ] Tutorial playable

### Full Improvement (12 weeks)
- [ ] All 6 epics closed
- [ ] 60 FPS on large cities
- [ ] Titan feature complete
- [ ] Leaderboards active
- [ ] Balance documented

## Resources

- **Issues:** #141-#162 (22 new issues)
- **Specs:** specs/*.md
- **User Stories:** USER_STORIES.md
- **Technical Roadmap:** ROADMAP.md

---

*This roadmap prioritizes delivering visible value quickly while building foundation for larger features. Re-prioritize based on player feedback and business needs.*
