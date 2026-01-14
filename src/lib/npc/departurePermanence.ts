/**
 * NPC Departure and Permanence System
 * 
 * NPCs can permanently leave the city under certain conditions,
 * creating emotional stakes and meaningful consequences.
 * 
 * Issue #139: NPC departure and permanence system
 */

import type { CryptoNPC, Occupation } from '@/games/isocity/types/npc';

// =============================================================================
// TYPES
// =============================================================================

export type DepartureReason =
  | 'financial_ruin'
  | 'better_opportunity'
  | 'relationship_ended'
  | 'health_decline'
  | 'burned_out'
  | 'rugged_too_hard'
  | 'taxes'
  | 'family_obligations'
  | 'adventure'
  | 'exile';

export type NPCLifecycleState = 
  | 'thriving'
  | 'stable'
  | 'struggling'
  | 'at_risk'
  | 'departing'
  | 'departed';

export interface DepartureWarning {
  npcId: string;
  reason: DepartureReason;
  severity: number;  // 1-10
  daysUntilDeparture: number;
  preventable: boolean;
  preventionOptions: PreventionOption[];
  dialogue: string;
}

export interface PreventionOption {
  id: string;
  description: string;
  requirements: PreventionRequirement[];
  successChance: number;
  relationshipBonus: number;
}

export interface PreventionRequirement {
  type: 'money' | 'relationship' | 'building' | 'job' | 'time';
  amount?: number;
  buildingType?: string;
  minRelationship?: number;
}

export interface DepartedNPC {
  npc: CryptoNPC;
  departedAt: number;
  reason: DepartureReason;
  playerTriedToPrevent: boolean;
  finalMessage: string;
  canReturn: boolean;
  returnConditions?: string;
}

export interface NPCLifecycleStats {
  daysInCity: number;
  wealthLevel: number;          // 0-100
  happinessLevel: number;       // 0-100
  connectionLevel: number;      // 0-100 (relationships)
  stressLevel: number;          // 0-100
  rugPullsExperienced: number;
  crisesExperienced: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Departure reasons with conditions and dialogue
 */
export const DEPARTURE_DEFINITIONS: Record<DepartureReason, {
  conditions: (stats: NPCLifecycleStats) => boolean;
  probability: number;
  messages: string[];
  farewells: string[];
  canReturn: boolean;
  returnCondition?: string;
}> = {
  financial_ruin: {
    conditions: (stats) => stats.wealthLevel < 10 && stats.daysInCity > 30,
    probability: 0.15,
    messages: [
      "I can't afford to stay here anymore. I'm broke.",
      "The markets have destroyed me. I need to leave and start over.",
      "I've lost everything. There's nothing left for me here.",
    ],
    farewells: [
      "Maybe one day I'll come back, when I've recovered.",
      "Thanks for everything. I hope we meet again.",
      "This isn't goodbye forever... I hope.",
    ],
    canReturn: true,
    returnCondition: "Returns if city prosperity reaches 80%",
  },
  
  better_opportunity: {
    conditions: (stats) => stats.wealthLevel > 70 && stats.connectionLevel < 40,
    probability: 0.08,
    messages: [
      "I got an offer I can't refuse. It's time to move on.",
      "There's this opportunity abroad... I have to take it.",
      "I've outgrown this city. Time for bigger things.",
    ],
    farewells: [
      "Don't worry, I'll visit. Probably.",
      "You should come with me! ...No? Okay.",
      "Keep in touch! Here's my Discord.",
    ],
    canReturn: true,
    returnCondition: "May return randomly after 60 days",
  },
  
  relationship_ended: {
    conditions: (stats) => stats.connectionLevel < 20 && stats.happinessLevel < 30,
    probability: 0.1,
    messages: [
      "Too many bad memories here. I need a fresh start.",
      "Everyone I cared about is gone or hates me.",
      "This city reminds me of everything I've lost.",
    ],
    farewells: [
      "I need to go find myself or whatever.",
      "Don't forget me, okay?",
      "Maybe distance will help.",
    ],
    canReturn: true,
    returnCondition: "Returns if a former friend reaches out",
  },
  
  health_decline: {
    conditions: (stats) => stats.stressLevel > 90 && stats.daysInCity > 100,
    probability: 0.05,
    messages: [
      "My health is failing. I need to take care of myself.",
      "The stress here is killing me. Literally.",
      "Doctor's orders: I have to leave the crypto life behind.",
    ],
    farewells: [
      "Take care of yourself. Don't end up like me.",
      "The grind isn't worth your health. Remember that.",
      "I'll miss this place, but I have to go.",
    ],
    canReturn: false,
  },
  
  burned_out: {
    conditions: (stats) => stats.stressLevel > 80 && stats.happinessLevel < 25,
    probability: 0.12,
    messages: [
      "I'm so tired. I can't keep doing this.",
      "The charts, the drama, the constant anxiety... I'm done.",
      "I used to love this. Now I just feel empty.",
    ],
    farewells: [
      "I'm going off-grid for a while. Maybe forever.",
      "NGMI, and honestly? I don't care anymore.",
      "Touch grass, they said. So I'm going to touch ALL the grass.",
    ],
    canReturn: true,
    returnCondition: "May return after major bull market",
  },
  
  rugged_too_hard: {
    conditions: (stats) => stats.rugPullsExperienced >= 3 && stats.wealthLevel < 30,
    probability: 0.2,
    messages: [
      "Three rug pulls. THREE. I'm out.",
      "I trusted this space. It ruined me.",
      "Never again. I'm going back to tradfi.",
    ],
    farewells: [
      "Have fun staying poor. Oh wait, that's me.",
      "Tell the devs I said 'thanks for nothing'.",
      "Not your keys, not your coins. Also, everyone is lying.",
    ],
    canReturn: true,
    returnCondition: "Returns during maximum FOMO periods",
  },
  
  taxes: {
    conditions: (stats) => stats.wealthLevel > 80 && Math.random() < 0.1,
    probability: 0.03,
    messages: [
      "Tax situation got too complicated. Moving somewhere... friendlier.",
      "The IRS sent a letter. I'm moving to Portugal.",
      "Time to become a digital nomad for 'reasons'.",
    ],
    farewells: [
      "See you in the metaverse!",
      "I'll be on the beach if you need me.",
      "Bearish on taxes, bullish on freedom.",
    ],
    canReturn: true,
    returnCondition: "Returns if crypto tax laws change",
  },
  
  family_obligations: {
    conditions: (stats) => stats.daysInCity > 200 && Math.random() < 0.05,
    probability: 0.05,
    messages: [
      "Family needs me back home. I have to go.",
      "There's stuff happening with my parents. I need to be there.",
      "Real life called. I have to answer.",
    ],
    farewells: [
      "Family first, you know?",
      "I'll try to stay in touch.",
      "Maybe I can set up a node at my parents' house...",
    ],
    canReturn: true,
    returnCondition: "May return after family situation resolves",
  },
  
  adventure: {
    conditions: (stats) => stats.happinessLevel > 60 && stats.daysInCity > 365,
    probability: 0.04,
    messages: [
      "I've been here long enough. Time for a new adventure!",
      "There's a whole world out there. I want to see it.",
      "This city is great, but I need change.",
    ],
    farewells: [
      "It's not goodbye, it's 'see you later'!",
      "Follow my travel blog! ...I'll start one, I promise.",
      "WAGMI, wherever we go!",
    ],
    canReturn: true,
    returnCondition: "Returns randomly, bringing stories",
  },
  
  exile: {
    conditions: (stats) => stats.connectionLevel < 5,
    probability: 0.15,
    messages: [
      "Nobody wants me here. Message received.",
      "I've burned every bridge. Time to go.",
      "When everyone hates you, it's time to leave.",
    ],
    farewells: [
      "Fine. I didn't like any of you anyway.",
      "I hope you all get rugged.",
      "*leaves without saying goodbye*",
    ],
    canReturn: false,
  },
};

// =============================================================================
// LIFECYCLE MANAGEMENT
// =============================================================================

/**
 * Calculate NPC lifecycle state
 */
export function calculateLifecycleState(stats: NPCLifecycleStats): NPCLifecycleState {
  const score = (
    stats.wealthLevel * 0.3 +
    stats.happinessLevel * 0.3 +
    stats.connectionLevel * 0.2 +
    (100 - stats.stressLevel) * 0.2
  );
  
  if (score > 75) return 'thriving';
  if (score > 55) return 'stable';
  if (score > 35) return 'struggling';
  if (score > 15) return 'at_risk';
  return 'departing';
}

/**
 * Check if NPC is at risk of departing
 */
export function checkDepartureRisk(
  npc: CryptoNPC,
  stats: NPCLifecycleStats
): DepartureWarning | null {
  const state = calculateLifecycleState(stats);
  
  if (state !== 'at_risk' && state !== 'departing') {
    return null;
  }
  
  // Find matching departure reason
  for (const [reason, def] of Object.entries(DEPARTURE_DEFINITIONS)) {
    if (def.conditions(stats) && Math.random() < def.probability) {
      return createDepartureWarning(npc, reason as DepartureReason, stats);
    }
  }
  
  return null;
}

/**
 * Create a departure warning
 */
function createDepartureWarning(
  npc: CryptoNPC,
  reason: DepartureReason,
  stats: NPCLifecycleStats
): DepartureWarning {
  const def = DEPARTURE_DEFINITIONS[reason];
  const severity = reason === 'exile' || reason === 'health_decline' ? 10 : 7;
  
  const preventionOptions: PreventionOption[] = [];
  
  // Generate prevention options based on reason
  if (reason === 'financial_ruin') {
    preventionOptions.push({
      id: 'loan',
      description: 'Provide financial assistance',
      requirements: [{ type: 'money', amount: 10000 }],
      successChance: 0.9,
      relationshipBonus: 50,
    });
  }
  
  if (reason === 'relationship_ended' || reason === 'exile') {
    preventionOptions.push({
      id: 'reconcile',
      description: 'Help them reconnect with others',
      requirements: [{ type: 'relationship', minRelationship: 50 }],
      successChance: 0.6,
      relationshipBonus: 40,
    });
  }
  
  if (reason === 'burned_out' || reason === 'health_decline') {
    preventionOptions.push({
      id: 'support',
      description: 'Provide emotional support',
      requirements: [{ type: 'time' }],
      successChance: 0.5,
      relationshipBonus: 35,
    });
  }
  
  return {
    npcId: npc.id,
    reason,
    severity,
    daysUntilDeparture: severity > 8 ? 3 : 7,
    preventable: def.canReturn && preventionOptions.length > 0,
    preventionOptions,
    dialogue: def.messages[Math.floor(Math.random() * def.messages.length)],
  };
}

/**
 * Process NPC departure
 */
export function processDeparture(
  npc: CryptoNPC,
  reason: DepartureReason,
  playerTriedToPrevent: boolean
): DepartedNPC {
  const def = DEPARTURE_DEFINITIONS[reason];
  
  return {
    npc,
    departedAt: Date.now(),
    reason,
    playerTriedToPrevent,
    finalMessage: def.farewells[Math.floor(Math.random() * def.farewells.length)],
    canReturn: def.canReturn,
    returnConditions: def.returnCondition,
  };
}

/**
 * Attempt to prevent departure
 */
export function attemptPrevention(
  warning: DepartureWarning,
  optionId: string,
  meetsRequirements: boolean
): { success: boolean; message: string; relationshipChange: number } {
  const option = warning.preventionOptions.find(o => o.id === optionId);
  
  if (!option) {
    return {
      success: false,
      message: "That's not an option.",
      relationshipChange: 0,
    };
  }
  
  if (!meetsRequirements) {
    return {
      success: false,
      message: "You don't have what's needed to help.",
      relationshipChange: 0,
    };
  }
  
  const success = Math.random() < option.successChance;
  
  if (success) {
    return {
      success: true,
      message: "You've convinced them to stay! They're grateful for your help.",
      relationshipChange: option.relationshipBonus,
    };
  }
  
  return {
    success: false,
    message: "You tried, but their mind is made up. They appreciated the effort.",
    relationshipChange: Math.floor(option.relationshipBonus * 0.3),
  };
}

/**
 * Check if a departed NPC should return
 */
export function checkForReturn(
  departed: DepartedNPC,
  cityProsperity: number,
  marketPhase: string,
  daysSinceDeparture: number
): boolean {
  if (!departed.canReturn) return false;
  if (daysSinceDeparture < 30) return false;  // Minimum 30 days away
  
  const { reason } = departed;
  const def = DEPARTURE_DEFINITIONS[reason];
  
  // Check specific return conditions
  switch (reason) {
    case 'financial_ruin':
      return cityProsperity > 80 && Math.random() < 0.1;
    
    case 'better_opportunity':
      return daysSinceDeparture > 60 && Math.random() < 0.05;
    
    case 'burned_out':
      return marketPhase === 'bull' && Math.random() < 0.08;
    
    case 'rugged_too_hard':
      return marketPhase === 'fomo' && Math.random() < 0.15;
    
    case 'adventure':
      return Math.random() < 0.03;
    
    default:
      return Math.random() < 0.02;
  }
}

/**
 * Generate return message
 */
export function generateReturnMessage(reason: DepartureReason): string {
  const messages: Record<DepartureReason, string[]> = {
    financial_ruin: [
      "I'm back! Saved up enough to give it another shot.",
      "Couldn't stay away. Let's try this again.",
    ],
    better_opportunity: [
      "That opportunity didn't pan out. Home sweet home!",
      "Turns out the grass wasn't greener. Missed this place.",
    ],
    relationship_ended: [
      "I've had time to heal. Ready to reconnect.",
      "Fresh start, same city. Here we go.",
    ],
    burned_out: [
      "Recharged and ready to grind again!",
      "Took some time off. Feeling much better now.",
    ],
    rugged_too_hard: [
      "Okay, I got FOMO. Sue me.",
      "Number went up. I had to come back.",
    ],
    taxes: [
      "Sorted out the tax situation. I'm back!",
      "Portugal was nice but I missed the action.",
    ],
    family_obligations: [
      "Family stuff is handled. Back in the game!",
      "Home situation improved. Time to return.",
    ],
    adventure: [
      "Had amazing adventures! But there's no place like home.",
      "Saw the world. Now I'm ready to build here again.",
    ],
    health_decline: [""],  // Can't return
    exile: [""],  // Can't return
  };
  
  const opts = messages[reason];
  return opts[Math.floor(Math.random() * opts.length)] || "I'm back!";
}
