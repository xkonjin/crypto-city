# CryptoCity User Stories & Feature Roadmap

## Research Summary: What Makes City Builders Fun & Viral

### Core Fun Mechanics (from research)
1. **Creative Freedom** - Express creativity through unique city designs
2. **Strategic Depth** - Balance resources, populations, and planning
3. **Progression Systems** - Unlock new buildings/tech as you advance
4. **Immediate Feedback Loops** - See population grow, resources generate
5. **No Win Condition** - Endless sandbox, your city is never "done"
6. **Iterative Learning** - Build, fail, optimize, admire cycle

### Viral Loop Mechanics
1. **Social Sharing** - Screenshot/share city achievements
2. **Referral Incentives** - Invite friends for bonuses
3. **Competitive Elements** - Leaderboards, city comparisons
4. **Co-op Play** - Build together, stronger emotional investment
5. **Tap-to-Earn Simplicity** - Low friction earning (Hamster Kombat model)
6. **Community Airdrops** - Reward active players with tokens

### Living City Simulation
1. **Autonomous Agents** - NPCs with believable daily routines
2. **Emergent Behavior** - Simple rules → complex city dynamics
3. **Dynamic Schedules** - NPCs respond to time of day, events
4. **Procedural Crowds** - Believable population density
5. **AI-Driven Events** - News/events trigger city changes

---

## EPIC 1: Core Gameplay Loop Enhancement

### US-1.1: Satisfying Build Feedback
**As a player**, I want immediate visual and audio feedback when placing buildings  
**So that** I feel the satisfaction of building my city

**Acceptance Criteria:**
- [ ] Placement sound effect plays on building placement
- [ ] Brief animation/particle effect on successful placement
- [ ] Treasury change displays with +/- animation
- [ ] Haptic feedback on mobile devices

### US-1.2: Clear Progression Path
**As a player**, I want to unlock new buildings as I grow my city  
**So that** I have goals to work toward

**Acceptance Criteria:**
- [ ] Milestone unlocks at population thresholds (100, 500, 1K, 5K, 10K)
- [ ] Premium buildings locked until prerequisites met
- [ ] Achievement badges for city milestones
- [ ] "New!" badge on recently unlocked buildings

### US-1.3: Risk/Reward Balance
**As a player**, I want high-yield buildings to carry risk  
**So that** I make interesting strategic decisions

**Acceptance Criteria:**
- [ ] Rug risk actually triggers building destruction
- [ ] Visual warning when rug risk is high
- [ ] Insurance mechanic to protect buildings
- [ ] Recovery time after rug pull event

---

## EPIC 2: Viral & Social Features

### US-2.1: City Sharing
**As a player**, I want to share my city with friends  
**So that** I can show off my achievements

**Acceptance Criteria:**
- [ ] One-click screenshot with city stats overlay
- [ ] Shareable city link (view-only mode)
- [ ] City stats card (population, TVL, buildings)
- [ ] Twitter/X share integration with sardonic caption

### US-2.2: Referral System
**As a player**, I want to invite friends and earn rewards  
**So that** we can build together and grow faster

**Acceptance Criteria:**
- [ ] Unique referral code per player
- [ ] Bonus treasury for successful referrals
- [ ] Referral leaderboard
- [ ] Special "Referral Whale" building unlocks

### US-2.3: Leaderboards
**As a player**, I want to compare my city to others  
**So that** I have competitive motivation

**Acceptance Criteria:**
- [ ] Global leaderboard by TVL
- [ ] Leaderboard by population
- [ ] Weekly/monthly competitions
- [ ] "My Rank" display in UI

### US-2.4: Social Events
**As a player**, I want city-wide events that encourage sharing  
**So that** the community feels connected

**Acceptance Criteria:**
- [ ] Weekly airdrop events (claim within timeframe)
- [ ] Community challenges (collective goal)
- [ ] Event countdown in UI
- [ ] Sardonic commentary during events

---

## EPIC 3: Co-op Multiplayer Enhancement

### US-3.1: Seamless Co-op Join
**As a player**, I want to easily join a friend's city  
**So that** we can build together without friction

**Acceptance Criteria:**
- [ ] 5-character room codes work reliably
- [ ] QR code for mobile join
- [ ] "Join with link" one-click
- [ ] Voice chat integration (optional)

### US-3.2: Real-time Collaboration
**As a co-op player**, I want to see my friend's cursor and actions  
**So that** we coordinate effectively

**Acceptance Criteria:**
- [ ] Colored cursors for each player
- [ ] "Player X is building..." notifications
- [ ] Undo/redo works across players
- [ ] No conflicts when building same area

### US-3.3: Role Specialization
**As a co-op player**, I want to specialize in different city aspects  
**So that** we divide work efficiently

**Acceptance Criteria:**
- [ ] Assign zones to players (optional)
- [ ] "Finance Mayor" vs "Urban Planner" roles
- [ ] Shared treasury with permissions
- [ ] Activity log per player

### US-3.4: Async Co-op (Turn-based)
**As a casual player**, I want to contribute when I have time  
**So that** I can play with friends in different timezones

**Acceptance Criteria:**
- [ ] Save city state to cloud
- [ ] "Your turn" notifications
- [ ] Time limit per turn (optional)
- [ ] Activity log of changes since last turn

---

## EPIC 4: Living City Simulation

### US-4.1: NPC Daily Routines
**As a player**, I want NPCs to have believable daily schedules  
**So that** the city feels alive

**Acceptance Criteria:**
- [ ] Rush hour traffic patterns (7-9am, 5-7pm)
- [ ] NPCs go to work/shop/home based on time
- [ ] Weekend leisure behavior differs
- [ ] Night owls and early birds variety

### US-4.2: Building Activity Indicators
**As a player**, I want to see which buildings are active  
**So that** I understand city dynamics

**Acceptance Criteria:**
- [ ] Smoke from factories during work hours
- [ ] Lit windows at night for occupied buildings
- [ ] "Open" signs on commercial during hours
- [ ] Glow effects on active DeFi buildings

### US-4.3: Dynamic Events from News
**As a player**, I want real crypto news to affect my city  
**So that** the simulation feels connected to reality

**Acceptance Criteria:**
- [ ] Perplexity AI news triggers events
- [ ] Bull run → increased happiness, yield
- [ ] Hack news → potential rug risk spike
- [ ] Visual city celebration/panic states

### US-4.4: Emergent NPC Stories
**As a player**, I want to follow individual NPCs  
**So that** I feel connected to my citizens

**Acceptance Criteria:**
- [ ] Click NPC to see name/occupation
- [ ] "Track this citizen" feature (max 6)
- [ ] AI-generated personality from seed
- [ ] Chat with NPCs via LLM (optional)

---

## EPIC 5: Crypto Economy Depth

### US-5.1: Chain Ecosystems
**As a player**, I want buildings from same chain to boost each other  
**So that** I strategize building placement

**Acceptance Criteria:**
- [ ] Visual indicator of chain synergies
- [ ] Tooltip showing synergy bonuses
- [ ] "Ethereum District" naming
- [ ] Chain-specific events

### US-5.2: Yield Farming Mini-game
**As a player**, I want to actively manage yields  
**So that** I engage with the crypto theme

**Acceptance Criteria:**
- [ ] Stake/unstake building yields
- [ ] Compound interest mechanic
- [ ] Risk/reward yield tiers
- [ ] APY displayed per building

### US-5.3: Market Cycles
**As a player**, I want to experience bull/bear market cycles  
**So that** the economy feels dynamic

**Acceptance Criteria:**
- [ ] 4-year cycle simulation (halving)
- [ ] Market sentiment affects all yields
- [ ] "Winter" vs "Summer" visual themes
- [ ] Strategy adaptation required

### US-5.4: Token Economics
**As a player**, I want my city's performance to matter  
**So that** there's real-world connection

**Acceptance Criteria:**
- [ ] City NFT representing saved state
- [ ] Achievement tokens (future)
- [ ] Governance voting for features
- [ ] Treasury export stats

---

## EPIC 6: UI/UX Polish

### US-6.1: Onboarding Tutorial
**As a new player**, I want a quick tutorial  
**So that** I understand the crypto city mechanics

**Acceptance Criteria:**
- [ ] 5-step interactive tutorial
- [ ] Skippable for returning players
- [ ] Sardonic advisor character
- [ ] Tutorial completion reward

### US-6.2: Tooltips & Help
**As a player**, I want to understand building effects  
**So that** I make informed decisions

**Acceptance Criteria:**
- [ ] Hover tooltips on all buildings
- [ ] Yield, risk, synergy info displayed
- [ ] "?" icon for detailed explanations
- [ ] Keyboard shortcut hints

### US-6.3: Accessibility
**As a player with disabilities**, I want accessible controls  
**So that** I can enjoy the game

**Acceptance Criteria:**
- [ ] Colorblind mode for zones
- [ ] High contrast option
- [ ] Screen reader support for key info
- [ ] Reduced motion option

### US-6.4: Mobile Optimization
**As a mobile player**, I want smooth touch controls  
**So that** I can play on my phone

**Acceptance Criteria:**
- [ ] Pinch-to-zoom works smoothly
- [ ] Building placement via tap-and-hold
- [ ] Collapsible UI panels
- [ ] 60fps on modern phones

---

## EPIC 7: Content & Humor

### US-7.1: Sardonic Advisor System
**As a player**, I want witty advisor commentary  
**So that** the game entertains me

**Acceptance Criteria:**
- [ ] 5+ advisors with distinct personalities
- [ ] Hitchhiker's Guide style humor
- [ ] Context-aware advice
- [ ] Dismissible but memorable

### US-7.2: Easter Eggs
**As a player**, I want hidden surprises  
**So that** exploration feels rewarding

**Acceptance Criteria:**
- [ ] Secret building combos
- [ ] Rare event triggers
- [ ] Achievement for finding all
- [ ] Community-discovered content

### US-7.3: Seasonal Themes
**As a player**, I want seasonal content  
**So that** the game stays fresh

**Acceptance Criteria:**
- [ ] Christmas crypto theme
- [ ] Halloween rug pull special
- [ ] Bull run celebration week
- [ ] Anniversary events

---

## Priority Matrix

| Story | Impact | Effort | Priority |
|-------|--------|--------|----------|
| US-2.1 City Sharing | High | Low | P1 |
| US-4.3 Dynamic Events | High | Medium | P1 |
| US-1.1 Build Feedback | High | Low | P1 |
| US-3.1 Seamless Co-op | High | Medium | P1 |
| US-6.2 Tooltips | High | Low | P1 |
| US-4.2 Building Activity | Medium | Medium | P2 |
| US-2.3 Leaderboards | Medium | Medium | P2 |
| US-5.1 Chain Ecosystems | Medium | Low | P2 |
| US-6.1 Onboarding | High | High | P2 |
| US-1.2 Progression | Medium | High | P3 |
| US-4.4 NPC Stories | Low | High | P3 |
| US-5.4 Token Economics | Low | High | Future |

---

## Implementation Notes

### Quick Wins (Can ship this week)
1. Screenshot share button
2. Building tooltips with yield/risk
3. Rug risk event triggers
4. Dynamic news → event mapping

### Medium Effort (1-2 weeks)
1. Leaderboard system
2. Referral codes
3. Building unlock progression
4. Enhanced NPC routines

### Major Features (Future)
1. Token economics integration
2. Voice chat co-op
3. LLM NPC conversations
4. City NFT minting

---

*Generated from deep research into city builder mechanics, viral loops, and crypto gaming trends. Updated 2026-01-10.*
