/**
 * Milestones System (Issue #56)
 * 
 * Implements escalating milestones with story progression, population tiers,
 * and building unlocks to create strategic depth and varied playstyles.
 */

import type { GameState } from '@/types/game';
import type { CryptoEconomyState } from '@/games/isocity/crypto';

// =============================================================================
// TYPES
// =============================================================================

export type MilestoneTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export type MilestoneRequirementType = 
  | 'tvl' 
  | 'treasury' 
  | 'buildings' 
  | 'days' 
  | 'population' 
  | 'happiness'
  | 'survive_rug';

export interface MilestoneRequirement {
  type: MilestoneRequirementType;
  value: number;
  chain?: string;   // Optional chain filter (e.g., 'eth', 'sol')
  tier?: string;    // Optional building tier filter
}

export interface MilestoneReward {
  treasury?: number;
  prestigePoints?: number;
  yieldBonus?: number;
  newBuildings?: string[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  requirement: MilestoneRequirement;
  reward: MilestoneReward;
  tier: MilestoneTier;
  unlocks?: string[]; // Building IDs unlocked
  icon: string;
}

export interface StoryMission {
  id: string;
  title: string;
  narrative: string;  // "A VC wants to see $500k TVL by end of quarter"
  deadline: number;   // Game days to complete
  objective: MilestoneRequirement;
  reward: MilestoneReward;
  penalty?: MilestoneReward; // What happens on failure
  icon: string;
}

export interface PopulationTier {
  population: number;
  name: string;
  unlocks: string[];
  description: string;
  icon: string;
}

export interface MilestoneProgress {
  milestoneId: string;
  progress: number; // 0-100
  completed: boolean;
  completedAt?: number;
  claimed: boolean;
}

export interface StoryMissionProgress {
  missionId: string;
  startedAt: number;
  daysRemaining: number;
  progress: number; // 0-100
  completed: boolean;
  failed: boolean;
  claimed: boolean;
}

export interface MilestoneState {
  milestones: MilestoneProgress[];
  activeMission: StoryMissionProgress | null;
  completedMissions: string[];
  currentPopulationTier: number;
  unlockedBuildings: string[];
  totalYieldBonus: number;
  totalPrestigePoints: number;
  lastUpdated: number;
  rugPullsSurvived: number;
}

// =============================================================================
// MILESTONE DEFINITIONS
// =============================================================================

export const MILESTONES: Milestone[] = [
  // ===================== BRONZE TIER (Early Game) =====================
  {
    id: 'first_yield_10k',
    name: 'First Yields',
    description: 'Earn your first $10,000 in yield',
    requirement: { type: 'treasury', value: 10000 },
    reward: { treasury: 2000, newBuildings: ['basic_dex', 'nft_gallery'] },
    tier: 'bronze',
    unlocks: ['basic_dex', 'nft_gallery'],
    icon: '💰',
  },
  {
    id: 'place_5_buildings',
    name: 'Builder',
    description: 'Place 5 crypto buildings',
    requirement: { type: 'buildings', value: 5 },
    reward: { treasury: 2000 },
    tier: 'bronze',
    icon: '🏗️',
  },
  {
    id: 'survive_10_days',
    name: 'Survivor',
    description: 'Survive 10 game days',
    requirement: { type: 'days', value: 10 },
    reward: { treasury: 1500, newBuildings: ['nft_marketplace'] },
    tier: 'bronze',
    unlocks: ['nft_marketplace'],
    icon: '📅',
  },
  {
    id: 'population_100',
    name: 'Early Adopters',
    description: 'Reach 100 citizens',
    requirement: { type: 'population', value: 100 },
    reward: { treasury: 1000 },
    tier: 'bronze',
    icon: '👥',
  },
  
  // ===================== SILVER TIER (Mid Game) =====================
  {
    id: 'reach_100k_tvl',
    name: 'TVL Milestone',
    description: 'Reach $100,000 TVL',
    requirement: { type: 'tvl', value: 100000 },
    reward: { treasury: 5000, newBuildings: ['lending_protocol', 'yield_farm'] },
    tier: 'silver',
    unlocks: ['lending_protocol', 'yield_farm'],
    icon: '📈',
  },
  {
    id: 'have_20_buildings',
    name: 'Protocol Architect',
    description: 'Have 20 crypto buildings',
    requirement: { type: 'buildings', value: 20 },
    reward: { yieldBonus: 0.05 },
    tier: 'silver',
    icon: '🏛️',
  },
  {
    id: 'survive_rug_pull',
    name: 'Battle Tested',
    description: 'Survive a rug pull',
    requirement: { type: 'survive_rug', value: 1 },
    reward: { treasury: 7500, newBuildings: ['insurance_protocol'] },
    tier: 'silver',
    unlocks: ['insurance_protocol'],
    icon: '💪',
  },
  {
    id: 'happiness_80',
    name: 'Community Vibes',
    description: 'Maintain 80% happiness',
    requirement: { type: 'happiness', value: 80 },
    reward: { treasury: 3000 },
    tier: 'silver',
    icon: '😊',
  },
  
  // ===================== GOLD TIER (Late Game) =====================
  {
    id: 'reach_500k_tvl',
    name: 'DeFi Heavyweight',
    description: 'Reach $500,000 TVL',
    requirement: { type: 'tvl', value: 500000 },
    reward: { treasury: 15000, newBuildings: ['legend_dex', 'crypto_casino'] },
    tier: 'gold',
    unlocks: ['legend_dex', 'crypto_casino'],
    icon: '🏆',
  },
  {
    id: 'have_50_buildings',
    name: 'Empire Builder',
    description: 'Have 50 crypto buildings',
    requirement: { type: 'buildings', value: 50 },
    reward: { yieldBonus: 0.10 },
    tier: 'gold',
    icon: '👑',
  },
  {
    id: 'survive_50_days',
    name: 'Veteran',
    description: 'Survive 50 game days',
    requirement: { type: 'days', value: 50 },
    reward: { prestigePoints: 10, newBuildings: ['whale_lounge'] },
    tier: 'gold',
    unlocks: ['whale_lounge'],
    icon: '🎖️',
  },
  {
    id: 'population_5000',
    name: 'Metropolis',
    description: 'Reach 5,000 citizens',
    requirement: { type: 'population', value: 5000 },
    reward: { treasury: 10000 },
    tier: 'gold',
    icon: '🏙️',
  },
  
  // ===================== DIAMOND TIER (End Game) =====================
  {
    id: 'reach_1m_tvl',
    name: 'TVL Millionaire',
    description: 'Reach $1,000,000 TVL (Win Condition)',
    requirement: { type: 'tvl', value: 1000000 },
    reward: { treasury: 50000, prestigePoints: 25 },
    tier: 'diamond',
    icon: '💎',
  },
  {
    id: 'have_100_buildings',
    name: 'Protocol Kingdom',
    description: 'Have 100 crypto buildings',
    requirement: { type: 'buildings', value: 100 },
    reward: { yieldBonus: 0.20 },
    tier: 'diamond',
    icon: '🏰',
  },
  {
    id: 'complete_all_gold',
    name: 'Completionist',
    description: 'Complete all gold tier milestones',
    requirement: { type: 'buildings', value: 0 }, // Special check
    reward: { prestigePoints: 50, newBuildings: ['legendary_monument'] },
    tier: 'diamond',
    unlocks: ['legendary_monument'],
    icon: '✨',
  },
  {
    id: 'survive_3_rugs',
    name: 'Diamond Hands',
    description: 'Survive 3 rug pulls',
    requirement: { type: 'survive_rug', value: 3 },
    reward: { treasury: 25000, prestigePoints: 15 },
    tier: 'diamond',
    icon: '💎🙌',
  },
];

// =============================================================================
// STORY MISSION DEFINITIONS
// =============================================================================

export const STORY_MISSIONS: StoryMission[] = [
  {
    id: 'vc_meeting',
    title: 'The VC Meeting',
    narrative: 'A prominent VC firm wants to see $200k TVL before they invest. Show them what you\'ve got!',
    deadline: 20,
    objective: { type: 'tvl', value: 200000 },
    reward: { treasury: 25000, prestigePoints: 5 },
    penalty: { treasury: -5000 },
    icon: '💼',
  },
  {
    id: 'regulatory_compliance',
    title: 'Regulatory Compliance',
    narrative: 'Regulators are watching. Build 3 auditor buildings to prove your legitimacy.',
    deadline: 10,
    objective: { type: 'buildings', value: 3 },
    reward: { treasury: 15000, newBuildings: ['compliance_center'] },
    penalty: { treasury: -10000 },
    icon: '📋',
  },
  {
    id: 'the_merge',
    title: 'The Merge',
    narrative: 'The community is demanding ETH-chain integration. Place 5 ETH buildings in 15 days.',
    deadline: 15,
    objective: { type: 'buildings', value: 5 },
    reward: { treasury: 20000, yieldBonus: 0.05 },
    penalty: { treasury: -7500 },
    icon: '🔗',
  },
  {
    id: 'population_surge',
    title: 'Population Surge',
    narrative: 'A viral tweet brought attention to your city. Reach 2,000 citizens to capitalize on it!',
    deadline: 25,
    objective: { type: 'population', value: 2000 },
    reward: { treasury: 10000, prestigePoints: 3 },
    icon: '📈',
  },
  {
    id: 'yield_target',
    title: 'Yield Target',
    narrative: 'Investors expect returns. Generate $50,000 in treasury within 30 days.',
    deadline: 30,
    objective: { type: 'treasury', value: 50000 },
    reward: { treasury: 15000, yieldBonus: 0.03 },
    penalty: { treasury: -3000 },
    icon: '💵',
  },
  {
    id: 'happiness_campaign',
    title: 'Happiness Campaign',
    narrative: 'Citizens are getting restless. Achieve 85% happiness to boost morale.',
    deadline: 15,
    objective: { type: 'happiness', value: 85 },
    reward: { treasury: 8000, prestigePoints: 2 },
    icon: '😄',
  },
];

// =============================================================================
// POPULATION TIER DEFINITIONS
// =============================================================================

export const POPULATION_TIERS: PopulationTier[] = [
  {
    population: 0,
    name: 'Settlement',
    unlocks: [],
    description: 'A small crypto settlement',
    icon: '🏕️',
  },
  {
    population: 100,
    name: 'Village',
    unlocks: ['basic_dex', 'nft_gallery'],
    description: 'A growing crypto village',
    icon: '🏘️',
  },
  {
    population: 500,
    name: 'Town',
    unlocks: ['lending_protocol', 'staking_pool'],
    description: 'A thriving crypto town',
    icon: '🏙️',
  },
  {
    population: 2000,
    name: 'City',
    unlocks: ['defi_hub', 'crypto_bank'],
    description: 'A bustling crypto city',
    icon: '🌆',
  },
  {
    population: 5000,
    name: 'Metropolis',
    unlocks: ['legend_building', 'whale_sanctuary'],
    description: 'A crypto metropolis',
    icon: '🌃',
  },
  {
    population: 10000,
    name: 'Megacity',
    unlocks: ['legendary_monument', 'cosmic_vault'],
    description: 'A legendary crypto megacity',
    icon: '🏛️',
  },
];

// =============================================================================
// TIER COLORS & STYLING
// =============================================================================

export const TIER_COLORS: Record<MilestoneTier, { bg: string; text: string; border: string }> = {
  bronze: { bg: 'bg-amber-900/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  silver: { bg: 'bg-gray-400/20', text: 'text-gray-300', border: 'border-gray-400/30' },
  gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  diamond: { bg: 'bg-cyan-400/20', text: 'text-cyan-300', border: 'border-cyan-400/30' },
};

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Create initial milestone state
 */
export function createInitialMilestoneState(): MilestoneState {
  return {
    milestones: MILESTONES.map(m => ({
      milestoneId: m.id,
      progress: 0,
      completed: false,
      claimed: false,
    })),
    activeMission: null,
    completedMissions: [],
    currentPopulationTier: 0,
    unlockedBuildings: [],
    totalYieldBonus: 0,
    totalPrestigePoints: 0,
    lastUpdated: Date.now(),
    rugPullsSurvived: 0,
  };
}

// =============================================================================
// PROGRESS CALCULATION
// =============================================================================

/**
 * Check progress for a single milestone
 */
export function checkMilestoneProgress(
  milestone: Milestone,
  state: GameState,
  crypto: CryptoEconomyState,
  milestoneState: MilestoneState
): number {
  const { requirement } = milestone;
  
  // Special case: completionist milestone
  if (milestone.id === 'complete_all_gold') {
    const goldMilestones = MILESTONES.filter(m => m.tier === 'gold');
    const completedGold = milestoneState.milestones.filter(
      mp => goldMilestones.some(gm => gm.id === mp.milestoneId) && mp.completed
    ).length;
    return Math.min(100, Math.floor((completedGold / goldMilestones.length) * 100));
  }
  
  switch (requirement.type) {
    case 'tvl':
      return Math.min(100, Math.floor((crypto.tvl / requirement.value) * 100));
      
    case 'treasury':
      return Math.min(100, Math.floor((crypto.treasury / requirement.value) * 100));
      
    case 'buildings':
      return Math.min(100, Math.floor((crypto.buildingCount / requirement.value) * 100));
      
    case 'days':
      return Math.min(100, Math.floor((crypto.gameDays / requirement.value) * 100));
      
    case 'population':
      return Math.min(100, Math.floor((state.stats.population / requirement.value) * 100));
      
    case 'happiness':
      return state.stats.happiness >= requirement.value ? 100 : 
        Math.floor((state.stats.happiness / requirement.value) * 100);
      
    case 'survive_rug':
      return Math.min(100, Math.floor((milestoneState.rugPullsSurvived / requirement.value) * 100));
      
    default:
      return 0;
  }
}

/**
 * Update all milestone progress
 */
export function updateMilestonesProgress(
  milestoneState: MilestoneState,
  state: GameState,
  crypto: CryptoEconomyState
): MilestoneState {
  const updatedMilestones = milestoneState.milestones.map(mp => {
    if (mp.claimed) {
      return mp; // Don't update claimed milestones
    }
    
    const milestone = MILESTONES.find(m => m.id === mp.milestoneId);
    if (!milestone) return mp;
    
    const progress = checkMilestoneProgress(milestone, state, crypto, milestoneState);
    const completed = progress >= 100;
    
    return {
      ...mp,
      progress,
      completed,
      completedAt: completed && !mp.completedAt ? Date.now() : mp.completedAt,
    };
  });
  
  // Check for newly completed milestones and collect new unlocks
  const newUnlocks: string[] = [];
  let newYieldBonus = milestoneState.totalYieldBonus;
  
  updatedMilestones.forEach(mp => {
    if (mp.completed && !mp.claimed) {
      const milestone = MILESTONES.find(m => m.id === mp.milestoneId);
      if (milestone?.unlocks) {
        milestone.unlocks.forEach(buildingId => {
          if (!milestoneState.unlockedBuildings.includes(buildingId)) {
            newUnlocks.push(buildingId);
          }
        });
      }
    }
  });
  
  return {
    ...milestoneState,
    milestones: updatedMilestones,
    unlockedBuildings: [...milestoneState.unlockedBuildings, ...newUnlocks],
    totalYieldBonus: newYieldBonus,
    lastUpdated: Date.now(),
  };
}

/**
 * Check story mission progress
 */
export function checkMissionProgress(
  mission: StoryMission,
  state: GameState,
  crypto: CryptoEconomyState
): number {
  const { objective } = mission;
  
  switch (objective.type) {
    case 'tvl':
      return Math.min(100, Math.floor((crypto.tvl / objective.value) * 100));
      
    case 'treasury':
      return Math.min(100, Math.floor((crypto.treasury / objective.value) * 100));
      
    case 'buildings':
      return Math.min(100, Math.floor((crypto.buildingCount / objective.value) * 100));
      
    case 'population':
      return Math.min(100, Math.floor((state.stats.population / objective.value) * 100));
      
    case 'happiness':
      return state.stats.happiness >= objective.value ? 100 : 
        Math.floor((state.stats.happiness / objective.value) * 100);
      
    default:
      return 0;
  }
}

/**
 * Update active story mission progress
 */
export function updateMissionProgress(
  milestoneState: MilestoneState,
  state: GameState,
  crypto: CryptoEconomyState,
  daysPassed: number
): MilestoneState {
  if (!milestoneState.activeMission) {
    return milestoneState;
  }
  
  const mission = STORY_MISSIONS.find(m => m.id === milestoneState.activeMission?.missionId);
  if (!mission) return milestoneState;
  
  const progress = checkMissionProgress(mission, state, crypto);
  const daysRemaining = Math.max(0, milestoneState.activeMission.daysRemaining - daysPassed);
  const completed = progress >= 100;
  const failed = daysRemaining <= 0 && !completed;
  
  return {
    ...milestoneState,
    activeMission: {
      ...milestoneState.activeMission,
      progress,
      daysRemaining,
      completed,
      failed,
    },
    lastUpdated: Date.now(),
  };
}

/**
 * Get current population tier
 */
export function getCurrentPopulationTier(population: number): PopulationTier {
  let currentTier = POPULATION_TIERS[0];
  
  for (const tier of POPULATION_TIERS) {
    if (population >= tier.population) {
      currentTier = tier;
    } else {
      break;
    }
  }
  
  return currentTier;
}

/**
 * Get population tier index
 */
export function getPopulationTierIndex(population: number): number {
  let index = 0;
  
  for (let i = 0; i < POPULATION_TIERS.length; i++) {
    if (population >= POPULATION_TIERS[i].population) {
      index = i;
    } else {
      break;
    }
  }
  
  return index;
}

// =============================================================================
// CLAIM & REWARD HANDLING
// =============================================================================

/**
 * Claim a completed milestone reward
 */
export function claimMilestoneReward(
  milestoneState: MilestoneState,
  milestoneId: string
): { treasuryReward: number; yieldBonus: number; prestigePoints: number; newBuildings: string[]; updatedState: MilestoneState } {
  const mpIndex = milestoneState.milestones.findIndex(m => m.milestoneId === milestoneId);
  
  if (mpIndex === -1) {
    return { treasuryReward: 0, yieldBonus: 0, prestigePoints: 0, newBuildings: [], updatedState: milestoneState };
  }
  
  const mp = milestoneState.milestones[mpIndex];
  
  if (!mp.completed || mp.claimed) {
    return { treasuryReward: 0, yieldBonus: 0, prestigePoints: 0, newBuildings: [], updatedState: milestoneState };
  }
  
  const milestone = MILESTONES.find(m => m.id === milestoneId);
  if (!milestone) {
    return { treasuryReward: 0, yieldBonus: 0, prestigePoints: 0, newBuildings: [], updatedState: milestoneState };
  }
  
  // Mark as claimed
  const updatedMilestones = [...milestoneState.milestones];
  updatedMilestones[mpIndex] = { ...mp, claimed: true };
  
  const updatedState: MilestoneState = {
    ...milestoneState,
    milestones: updatedMilestones,
    totalYieldBonus: milestoneState.totalYieldBonus + (milestone.reward.yieldBonus || 0),
    totalPrestigePoints: milestoneState.totalPrestigePoints + (milestone.reward.prestigePoints || 0),
    lastUpdated: Date.now(),
  };
  
  return {
    treasuryReward: milestone.reward.treasury || 0,
    yieldBonus: milestone.reward.yieldBonus || 0,
    prestigePoints: milestone.reward.prestigePoints || 0,
    newBuildings: milestone.reward.newBuildings || [],
    updatedState,
  };
}

/**
 * Claim a completed mission reward
 */
export function claimMissionReward(
  milestoneState: MilestoneState
): { treasuryReward: number; yieldBonus: number; prestigePoints: number; newBuildings: string[]; updatedState: MilestoneState } {
  if (!milestoneState.activeMission || !milestoneState.activeMission.completed || milestoneState.activeMission.claimed) {
    return { treasuryReward: 0, yieldBonus: 0, prestigePoints: 0, newBuildings: [], updatedState: milestoneState };
  }
  
  const mission = STORY_MISSIONS.find(m => m.id === milestoneState.activeMission?.missionId);
  if (!mission) {
    return { treasuryReward: 0, yieldBonus: 0, prestigePoints: 0, newBuildings: [], updatedState: milestoneState };
  }
  
  const updatedState: MilestoneState = {
    ...milestoneState,
    activeMission: {
      ...milestoneState.activeMission,
      claimed: true,
    },
    completedMissions: [...milestoneState.completedMissions, mission.id],
    totalYieldBonus: milestoneState.totalYieldBonus + (mission.reward.yieldBonus || 0),
    totalPrestigePoints: milestoneState.totalPrestigePoints + (mission.reward.prestigePoints || 0),
    lastUpdated: Date.now(),
  };
  
  return {
    treasuryReward: mission.reward.treasury || 0,
    yieldBonus: mission.reward.yieldBonus || 0,
    prestigePoints: mission.reward.prestigePoints || 0,
    newBuildings: mission.reward.newBuildings || [],
    updatedState,
  };
}

/**
 * Apply mission failure penalty
 */
export function applyMissionPenalty(
  milestoneState: MilestoneState
): { treasuryPenalty: number; updatedState: MilestoneState } {
  if (!milestoneState.activeMission || !milestoneState.activeMission.failed) {
    return { treasuryPenalty: 0, updatedState: milestoneState };
  }
  
  const mission = STORY_MISSIONS.find(m => m.id === milestoneState.activeMission?.missionId);
  const penalty = mission?.penalty?.treasury || 0;
  
  const updatedState: MilestoneState = {
    ...milestoneState,
    activeMission: null,
    lastUpdated: Date.now(),
  };
  
  return {
    treasuryPenalty: Math.abs(penalty),
    updatedState,
  };
}

/**
 * Start a new story mission
 */
export function startMission(
  milestoneState: MilestoneState,
  missionId: string
): MilestoneState {
  const mission = STORY_MISSIONS.find(m => m.id === missionId);
  if (!mission) return milestoneState;
  
  // Can't start a mission if one is active
  if (milestoneState.activeMission && !milestoneState.activeMission.completed && !milestoneState.activeMission.failed) {
    return milestoneState;
  }
  
  // Can't start a completed mission
  if (milestoneState.completedMissions.includes(missionId)) {
    return milestoneState;
  }
  
  return {
    ...milestoneState,
    activeMission: {
      missionId,
      startedAt: Date.now(),
      daysRemaining: mission.deadline,
      progress: 0,
      completed: false,
      failed: false,
      claimed: false,
    },
    lastUpdated: Date.now(),
  };
}

/**
 * Clear active mission (after claiming or penalty applied)
 */
export function clearActiveMission(milestoneState: MilestoneState): MilestoneState {
  return {
    ...milestoneState,
    activeMission: null,
    lastUpdated: Date.now(),
  };
}

/**
 * Record a rug pull survival
 */
export function recordRugPullSurvived(milestoneState: MilestoneState): MilestoneState {
  return {
    ...milestoneState,
    rugPullsSurvived: milestoneState.rugPullsSurvived + 1,
    lastUpdated: Date.now(),
  };
}

// =============================================================================
// LOCAL STORAGE
// =============================================================================

const STORAGE_KEY = 'cryptoCityMilestones';

/**
 * Load milestone state from localStorage
 */
export function loadMilestoneState(): MilestoneState {
  if (typeof window === 'undefined') {
    return createInitialMilestoneState();
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as MilestoneState;
      
      // Validate basic structure
      if (
        Array.isArray(parsed.milestones) &&
        typeof parsed.currentPopulationTier === 'number'
      ) {
        // Merge with current milestone definitions to handle new milestones added in updates
        const mergedMilestones = MILESTONES.map(def => {
          const saved = parsed.milestones.find(m => m.milestoneId === def.id);
          return saved || {
            milestoneId: def.id,
            progress: 0,
            completed: false,
            claimed: false,
          };
        });
        
        return {
          ...parsed,
          milestones: mergedMilestones,
        };
      }
    }
  } catch {
    // Ignore parse errors
  }
  
  return createInitialMilestoneState();
}

/**
 * Save milestone state to localStorage
 */
export function saveMilestoneState(state: MilestoneState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear milestone state (for testing or full reset)
 */
export function clearMilestoneState(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get unclaimed completed milestones count
 */
export function getUnclaimedMilestonesCount(state: MilestoneState): number {
  return state.milestones.filter(m => m.completed && !m.claimed).length;
}

/**
 * Get milestones by tier
 */
export function getMilestonesByTier(tier: MilestoneTier): Milestone[] {
  return MILESTONES.filter(m => m.tier === tier);
}

/**
 * Get completed milestones by tier
 */
export function getCompletedMilestonesByTier(state: MilestoneState, tier: MilestoneTier): number {
  const tierMilestones = getMilestonesByTier(tier);
  return state.milestones.filter(
    mp => tierMilestones.some(tm => tm.id === mp.milestoneId) && mp.completed
  ).length;
}

/**
 * Get next available story mission
 */
export function getNextAvailableMission(state: MilestoneState): StoryMission | null {
  for (const mission of STORY_MISSIONS) {
    if (!state.completedMissions.includes(mission.id)) {
      return mission;
    }
  }
  return null;
}

/**
 * Check if a building is unlocked
 */
export function isBuildingUnlocked(state: MilestoneState, buildingId: string): boolean {
  return state.unlockedBuildings.includes(buildingId);
}

/**
 * Get all buildings unlocked by current population tier
 */
export function getBuildingsUnlockedByPopulation(population: number): string[] {
  const unlocked: string[] = [];
  
  for (const tier of POPULATION_TIERS) {
    if (population >= tier.population) {
      unlocked.push(...tier.unlocks);
    } else {
      break;
    }
  }
  
  return unlocked;
}
