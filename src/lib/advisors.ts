/**
 * Proactive Advisor System (Issue #63)
 * 
 * Implements a system of competing advisors who proactively provide advice
 * based on game state and crypto economy conditions. Each advisor has a
 * distinct personality and specialty area.
 */

import type { GameState } from '@/types/game';
import type { CryptoEconomyState, PlacedCryptoBuilding } from '@/games/isocity/crypto';
import { getCryptoBuilding, cryptoEconomy } from '@/games/isocity/crypto';

// =============================================================================
// TYPES
// =============================================================================

export type AdvisorSpecialty = 'risk' | 'yield' | 'growth' | 'stability';

export type AdvisorPersonality = 'cautious' | 'aggressive' | 'methodical' | 'balanced';

export type AdvicePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Advisor {
  id: string;
  name: string;
  specialty: AdvisorSpecialty;
  avatar: string;
  personality: AdvisorPersonality;
  description: string;
}

export interface AdvisorAdvice {
  advisorId: string;
  message: string;
  priority: AdvicePriority;
  actionSuggestion?: string;
  timestamp: number;
}

export interface AdvisorDebate {
  id: string;
  topic: string;
  positions: { advisorId: string; stance: string }[];
  playerChoice?: string;
  createdAt: number;
}

export interface AdvisorPrediction {
  prediction: string;
  outcome: boolean | null;  // null = not yet resolved
  createdAt: number;
  resolvedAt?: number;
}

export interface AdvisorReputation {
  advisorId: string;
  accuracy: number;  // % of correct predictions (0-100)
  predictions: AdvisorPrediction[];
  totalPredictions: number;
  correctPredictions: number;
}

export interface AdvisorState {
  reputations: AdvisorReputation[];
  currentAdvice: AdvisorAdvice[];
  activeDebate: AdvisorDebate | null;
  pastDebates: AdvisorDebate[];
  lastUpdated: number;
}

// =============================================================================
// ADVISOR DEFINITIONS
// =============================================================================

export const ADVISORS: Advisor[] = [
  {
    id: 'risk_manager',
    name: 'Rupert Risk',
    specialty: 'risk',
    avatar: '🛡️',
    personality: 'cautious',
    description: 'Former insurance actuary turned crypto risk analyst. Always warns about the worst-case scenario.',
  },
  {
    id: 'yield_hunter',
    name: 'Yolanda Yield',
    specialty: 'yield',
    avatar: '💰',
    personality: 'aggressive',
    description: 'DeFi degen extraordinaire. If there\'s yield to be farmed, she\'ll find it.',
  },
  {
    id: 'city_planner',
    name: 'Percy Planner',
    specialty: 'growth',
    avatar: '🏗️',
    personality: 'methodical',
    description: 'Believes in sustainable growth through careful city planning and infrastructure.',
  },
  {
    id: 'stability_expert',
    name: 'Sally Stable',
    specialty: 'stability',
    avatar: '⚖️',
    personality: 'balanced',
    description: 'Portfolio diversity advocate. Preaches the gospel of risk-adjusted returns.',
  },
];

// =============================================================================
// ADVICE MESSAGES
// =============================================================================

interface AdviceTemplate {
  condition: (gameState: GameState, economyState: CryptoEconomyState) => boolean;
  message: string;
  priority: AdvicePriority;
  actionSuggestion?: string;
}

// Helper to get placed buildings from the crypto economy manager
function getPlacedBuildings(): PlacedCryptoBuilding[] {
  return cryptoEconomy.getPlacedBuildings();
}

const RISK_MANAGER_ADVICE: AdviceTemplate[] = [
  {
    condition: () => {
      const buildings = getPlacedBuildings();
      const degenCount = buildings.filter((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        return def?.crypto.tier === 'degen';
      }).length;
      const total = buildings.length;
      return total > 0 && degenCount / total > 0.6;
    },
    message: "Your portfolio is 70% degen. That's a heart attack waiting to happen.",
    priority: 'critical',
    actionSuggestion: 'Consider building more stable protocol buildings.',
  },
  {
    condition: () => {
      const buildings = getPlacedBuildings();
      // Check for protection buildings (auditors, insurance)
      const hasProtection = buildings.some((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        return def?.crypto.effects.protectionRadius || def?.crypto.effects.insuranceRadius;
      });
      return buildings.length > 5 && !hasProtection;
    },
    message: "No protection buildings? Bold strategy.",
    priority: 'high',
    actionSuggestion: 'Build an auditor or insurance building.',
  },
  {
    condition: (_, eco) => {
      const buildings = getPlacedBuildings();
      const degenWithHighRug = buildings.filter((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        return def && def.crypto.effects.rugRisk > 0.3;
      }).length;
      return degenWithHighRug >= 3 && eco.treasury < 50000;
    },
    message: "You're one rug away from bankruptcy.",
    priority: 'critical',
    actionSuggestion: 'Build up your treasury reserves.',
  },
  {
    condition: (_, eco) => eco.marketSentiment < 30,
    message: "Market fear is high. Be cautious with new investments.",
    priority: 'medium',
  },
  {
    condition: () => {
      const buildings = getPlacedBuildings();
      const avgRugRisk = buildings.length > 0
        ? buildings.reduce((sum: number, b: PlacedCryptoBuilding) => {
            const def = getCryptoBuilding(b.buildingId);
            return sum + (def?.crypto.effects.rugRisk || 0);
          }, 0) / buildings.length
        : 0;
      return avgRugRisk > 0.2;
    },
    message: "Average rug risk is elevated. Consider rebalancing.",
    priority: 'medium',
    actionSuggestion: 'Replace high-risk buildings with institutional ones.',
  },
];

const YIELD_HUNTER_ADVICE: AdviceTemplate[] = [
  {
    condition: () => {
      const buildings = getPlacedBuildings();
      const defiCount = buildings.filter((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        return def?.category === 'defi';
      }).length;
      return defiCount < 3 && buildings.length > 5;
    },
    message: "DeFi synergies are underutilized. More DEXes would boost yields.",
    priority: 'medium',
    actionSuggestion: 'Build more DeFi protocol buildings.',
  },
  {
    condition: (_, eco) => eco.marketSentiment > 70,
    message: "Market's greedy - time to build aggressively!",
    priority: 'medium',
    actionSuggestion: 'Take advantage of the bull market.',
  },
  {
    condition: () => {
      const buildings = getPlacedBuildings();
      const institutionCount = buildings.filter((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        return def?.crypto.tier === 'institution';
      }).length;
      return institutionCount > buildings.length * 0.5;
    },
    message: "Those institution buildings are dragging down your APY.",
    priority: 'low',
    actionSuggestion: 'Consider adding some higher-yield degen buildings.',
  },
  {
    condition: (_, eco) => eco.dailyYield < 1000 && eco.buildingCount > 3,
    message: "Your daily yield is disappointing. Let's juice those numbers!",
    priority: 'high',
    actionSuggestion: 'Focus on high-yield buildings.',
  },
  {
    condition: () => {
      const buildings = getPlacedBuildings();
      // Check for airdrop potential
      const airdropBuildings = buildings.filter((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        return def && (def.crypto.effects.airdropChance || 0) > 0;
      }).length;
      return airdropBuildings < 2;
    },
    message: "Missing out on airdrop opportunities. Build some community-focused buildings!",
    priority: 'low',
  },
];

const CITY_PLANNER_ADVICE: AdviceTemplate[] = [
  {
    condition: (game) => game.stats.population < 500 && game.stats.happiness < 60,
    message: "Population growth is stalling. Build more residential zones.",
    priority: 'medium',
    actionSuggestion: 'Zone more residential areas.',
  },
  {
    condition: () => {
      const buildings = getPlacedBuildings();
      // Check chain diversity
      const chains = new Set<string>();
      buildings.forEach((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        if (def) chains.add(def.crypto.chain);
      });
      return chains.size < 3 && buildings.length > 5;
    },
    message: "Your city layout is inefficient. Consider clustering by chain for synergy bonuses.",
    priority: 'medium',
    actionSuggestion: 'Group buildings from the same chain together.',
  },
  {
    condition: (game) => {
      // Check for infrastructure coverage
      const hasPolice = game.grid.some(row => 
        row.some(tile => tile.building.type === 'police_station')
      );
      const hasFire = game.grid.some(row => 
        row.some(tile => tile.building.type === 'fire_station')
      );
      return !hasPolice || !hasFire;
    },
    message: "Infrastructure is lacking. Services need attention.",
    priority: 'high',
    actionSuggestion: 'Build police and fire stations.',
  },
  {
    condition: (game) => {
      const roadCount = game.grid.flat().filter(t => t.building.type === 'road').length;
      const totalBuildings = game.grid.flat().filter(t => 
        t.building.type !== 'grass' && t.building.type !== 'water'
      ).length;
      return totalBuildings > 20 && roadCount < totalBuildings * 0.3;
    },
    message: "Road network needs expansion. Connect your buildings!",
    priority: 'medium',
    actionSuggestion: 'Build more roads to connect districts.',
  },
  {
    condition: (game) => game.stats.happiness > 70 && game.stats.population > 1000,
    message: "City is thriving! Consider expanding to new districts.",
    priority: 'low',
  },
];

const STABILITY_EXPERT_ADVICE: AdviceTemplate[] = [
  {
    condition: () => {
      const buildings = getPlacedBuildings();
      // Check tier distribution
      const tiers: Record<string, number> = { retail: 0, degen: 0, whale: 0, institution: 0 };
      buildings.forEach((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        if (def) tiers[def.crypto.tier]++;
      });
      const total = buildings.length;
      if (total < 4) return false;
      const maxRatio = Math.max(...Object.values(tiers)) / total;
      return maxRatio < 0.4;
    },
    message: "Portfolio is well-balanced. Maintain course.",
    priority: 'low',
  },
  {
    condition: () => {
      const buildings = getPlacedBuildings();
      const chains = new Set<string>();
      buildings.forEach((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        if (def) chains.add(def.crypto.chain);
      });
      return chains.size < 3 && buildings.length > 5;
    },
    message: "Consider diversifying across more chains.",
    priority: 'medium',
    actionSuggestion: 'Build on different blockchain networks.',
  },
  {
    condition: () => {
      const buildings = getPlacedBuildings();
      const tiers: Record<string, number> = { retail: 0, degen: 0, whale: 0, institution: 0 };
      buildings.forEach((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        if (def) tiers[def.crypto.tier]++;
      });
      return tiers.retail > 0 && tiers.degen > 0 && tiers.whale > 0 && tiers.institution > 0;
    },
    message: "Good mix of risk tiers. Very sustainable.",
    priority: 'low',
  },
  {
    condition: () => {
      const buildings = getPlacedBuildings();
      const stableCount = buildings.filter((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        return def?.crypto.effects.sentimentImmune;
      }).length;
      return stableCount < 2 && buildings.length > 5;
    },
    message: "Add some stablecoin buildings to weather market volatility.",
    priority: 'medium',
    actionSuggestion: 'Build stablecoin protocol buildings.',
  },
  {
    condition: (_, eco) => eco.marketSentiment >= 40 && eco.marketSentiment <= 60,
    message: "Market sentiment is neutral. Good time to rebalance if needed.",
    priority: 'low',
  },
];

// =============================================================================
// DEBATE TOPICS
// =============================================================================

interface DebateTopic {
  topic: string;
  condition: (gameState: GameState, economyState: CryptoEconomyState) => boolean;
  positions: { advisorId: string; stance: string }[];
}

const DEBATE_TOPICS: DebateTopic[] = [
  {
    topic: "Should we build more degen buildings?",
    condition: (_, eco) => eco.buildingCount > 3 && eco.treasury > 50000,
    positions: [
      { advisorId: 'risk_manager', stance: "Absolutely not. Rug risk is already too high." },
      { advisorId: 'yield_hunter', stance: "Go for it! High risk, high reward!" },
    ],
  },
  {
    topic: "Is it time to expand to a new chain?",
    condition: (_, eco) => {
      const buildings = getPlacedBuildings();
      const chains = new Set(buildings.map((b: PlacedCryptoBuilding) => {
        const def = getCryptoBuilding(b.buildingId);
        return def?.crypto.chain;
      }));
      return chains.size < 3 && eco.tvl > 100000;
    },
    positions: [
      { advisorId: 'stability_expert', stance: "Yes, diversification reduces overall risk." },
      { advisorId: 'city_planner', stance: "Focus on maximizing synergies on current chains first." },
    ],
  },
  {
    topic: "Should we take advantage of the bull market?",
    condition: (_, eco) => eco.marketSentiment > 70,
    positions: [
      { advisorId: 'yield_hunter', stance: "Absolutely! Build aggressively while sentiment is high!" },
      { advisorId: 'risk_manager', stance: "Be cautious. Extreme greed often precedes crashes." },
    ],
  },
  {
    topic: "How should we respond to market fear?",
    condition: (_, eco) => eco.marketSentiment < 30,
    positions: [
      { advisorId: 'risk_manager', stance: "Hold tight. Wait for conditions to improve." },
      { advisorId: 'yield_hunter', stance: "Buy the dip! This is when fortunes are made!" },
    ],
  },
  {
    topic: "Should we prioritize protection over yield?",
    condition: () => {
      const buildings = getPlacedBuildings();
      const avgRugRisk = buildings.length > 0
        ? buildings.reduce((sum: number, b: PlacedCryptoBuilding) => {
            const def = getCryptoBuilding(b.buildingId);
            return sum + (def?.crypto.effects.rugRisk || 0);
          }, 0) / buildings.length
        : 0;
      return avgRugRisk > 0.15;
    },
    positions: [
      { advisorId: 'risk_manager', stance: "Protection is paramount. Build auditor and insurance buildings." },
      { advisorId: 'yield_hunter', stance: "Protection buildings waste resources. Stay agile instead." },
    ],
  },
];

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

const STORAGE_KEY = 'cryptoCityAdvisors';

export function createInitialAdvisorState(): AdvisorState {
  return {
    reputations: ADVISORS.map(advisor => ({
      advisorId: advisor.id,
      accuracy: 50, // Start at 50%
      predictions: [],
      totalPredictions: 0,
      correctPredictions: 0,
    })),
    currentAdvice: [],
    activeDebate: null,
    pastDebates: [],
    lastUpdated: Date.now(),
  };
}

export function loadAdvisorState(): AdvisorState {
  if (typeof window === 'undefined') return createInitialAdvisorState();
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate structure
      if (parsed && parsed.reputations && parsed.currentAdvice !== undefined) {
        return parsed as AdvisorState;
      }
    }
  } catch (e) {
    console.error('Failed to load advisor state:', e);
  }
  
  return createInitialAdvisorState();
}

export function saveAdvisorState(state: AdvisorState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save advisor state:', e);
  }
}

// =============================================================================
// ADVICE GENERATION
// =============================================================================

export function getAdvisor(advisorId: string): Advisor | undefined {
  return ADVISORS.find(a => a.id === advisorId);
}

function getAdviceTemplates(advisorId: string): AdviceTemplate[] {
  switch (advisorId) {
    case 'risk_manager':
      return RISK_MANAGER_ADVICE;
    case 'yield_hunter':
      return YIELD_HUNTER_ADVICE;
    case 'city_planner':
      return CITY_PLANNER_ADVICE;
    case 'stability_expert':
      return STABILITY_EXPERT_ADVICE;
    default:
      return [];
  }
}

export function generateAdvice(
  advisor: Advisor,
  gameState: GameState,
  economyState: CryptoEconomyState
): AdvisorAdvice | null {
  const templates = getAdviceTemplates(advisor.id);
  
  // Find first matching condition (higher priority first)
  const sortedTemplates = [...templates].sort((a, b) => {
    const priorityOrder: Record<AdvicePriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  for (const template of sortedTemplates) {
    try {
      if (template.condition(gameState, economyState)) {
        return {
          advisorId: advisor.id,
          message: template.message,
          priority: template.priority,
          actionSuggestion: template.actionSuggestion,
          timestamp: Date.now(),
        };
      }
    } catch {
      // Skip if condition throws
      continue;
    }
  }
  
  return null;
}

export function generateAllAdvice(
  gameState: GameState,
  economyState: CryptoEconomyState
): AdvisorAdvice[] {
  const advice: AdvisorAdvice[] = [];
  
  for (const advisor of ADVISORS) {
    const advisorAdvice = generateAdvice(advisor, gameState, economyState);
    if (advisorAdvice) {
      advice.push(advisorAdvice);
    }
  }
  
  return advice;
}

// =============================================================================
// DEBATE GENERATION
// =============================================================================

export function generateDebate(
  gameState: GameState,
  economyState: CryptoEconomyState
): AdvisorDebate | null {
  // Find first matching debate topic
  for (const topic of DEBATE_TOPICS) {
    try {
      if (topic.condition(gameState, economyState)) {
        return {
          id: `debate-${Date.now()}`,
          topic: topic.topic,
          positions: topic.positions,
          createdAt: Date.now(),
        };
      }
    } catch {
      continue;
    }
  }
  
  return null;
}

// =============================================================================
// REPUTATION MANAGEMENT
// =============================================================================

export function recordPrediction(
  state: AdvisorState,
  advisorId: string,
  prediction: string
): AdvisorState {
  const reputations = state.reputations.map(rep => {
    if (rep.advisorId !== advisorId) return rep;
    
    return {
      ...rep,
      predictions: [
        ...rep.predictions,
        {
          prediction,
          outcome: null,
          createdAt: Date.now(),
        },
      ],
    };
  });
  
  return { ...state, reputations, lastUpdated: Date.now() };
}

export function resolvePrediction(
  state: AdvisorState,
  advisorId: string,
  predictionIndex: number,
  outcome: boolean
): AdvisorState {
  const reputations = state.reputations.map(rep => {
    if (rep.advisorId !== advisorId) return rep;
    
    const predictions = [...rep.predictions];
    if (predictions[predictionIndex]) {
      predictions[predictionIndex] = {
        ...predictions[predictionIndex],
        outcome,
        resolvedAt: Date.now(),
      };
    }
    
    const resolved = predictions.filter(p => p.outcome !== null);
    const correct = resolved.filter(p => p.outcome === true).length;
    const accuracy = resolved.length > 0 ? (correct / resolved.length) * 100 : 50;
    
    return {
      ...rep,
      predictions,
      totalPredictions: resolved.length,
      correctPredictions: correct,
      accuracy: Math.round(accuracy),
    };
  });
  
  return { ...state, reputations, lastUpdated: Date.now() };
}

export function recordDebateChoice(
  state: AdvisorState,
  debateId: string,
  advisorId: string
): AdvisorState {
  if (!state.activeDebate || state.activeDebate.id !== debateId) {
    return state;
  }
  
  const resolvedDebate: AdvisorDebate = {
    ...state.activeDebate,
    playerChoice: advisorId,
  };
  
  return {
    ...state,
    activeDebate: null,
    pastDebates: [...state.pastDebates, resolvedDebate],
    lastUpdated: Date.now(),
  };
}

// =============================================================================
// UPDATE CYCLE
// =============================================================================

export function updateAdvisorState(
  state: AdvisorState,
  gameState: GameState,
  economyState: CryptoEconomyState
): AdvisorState {
  // Generate new advice
  const currentAdvice = generateAllAdvice(gameState, economyState);
  
  // Maybe generate a new debate (if no active debate)
  let activeDebate = state.activeDebate;
  if (!activeDebate && Math.random() < 0.1) { // 10% chance per update
    activeDebate = generateDebate(gameState, economyState);
  }
  
  return {
    ...state,
    currentAdvice,
    activeDebate,
    lastUpdated: Date.now(),
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getHighestPriorityAdvice(advice: AdvisorAdvice[]): AdvisorAdvice | null {
  if (advice.length === 0) return null;
  
  const priorityOrder: Record<AdvicePriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  
  return [...advice].sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  )[0];
}

export function getCriticalAdvice(advice: AdvisorAdvice[]): AdvisorAdvice[] {
  return advice.filter(a => a.priority === 'critical');
}

export function getAdvisorReputation(
  state: AdvisorState,
  advisorId: string
): AdvisorReputation | undefined {
  return state.reputations.find(r => r.advisorId === advisorId);
}

export function getPriorityColor(priority: AdvicePriority): string {
  switch (priority) {
    case 'critical':
      return '#EF4444'; // red-500
    case 'high':
      return '#F97316'; // orange-500
    case 'medium':
      return '#EAB308'; // yellow-500
    case 'low':
      return '#22C55E'; // green-500
  }
}

export function getSpecialtyColor(specialty: AdvisorSpecialty): string {
  switch (specialty) {
    case 'risk':
      return '#EF4444'; // red
    case 'yield':
      return '#F59E0B'; // amber
    case 'growth':
      return '#10B981'; // emerald
    case 'stability':
      return '#3B82F6'; // blue
  }
}
