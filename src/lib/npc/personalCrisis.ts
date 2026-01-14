/**
 * NPC Personal Crisis System
 * 
 * NPCs experience personal crises that players can help resolve,
 * creating emotional investment and memorable interactions.
 * 
 * Issue #137: NPC Personal Crisis system
 */

import type { CryptoNPC, Occupation } from '@/games/isocity/types/npc';

// =============================================================================
// TYPES
// =============================================================================

export type CrisisType =
  | 'financial_trouble'
  | 'relationship_drama'
  | 'health_scare'
  | 'career_crisis'
  | 'housing_issue'
  | 'family_emergency'
  | 'existential_doubt'
  | 'rug_pull_victim'
  | 'liquidation_panic'
  | 'fomo_regret';

export type CrisisPhase = 'building' | 'peak' | 'resolution' | 'aftermath';

export interface PersonalCrisis {
  id: string;
  npcId: string;
  type: CrisisType;
  phase: CrisisPhase;
  severity: number;  // 1-10
  startedAt: number;
  peakAt?: number;
  resolvedAt?: number;
  description: string;
  possibleResolutions: CrisisResolution[];
  playerInvolved: boolean;
  outcome?: CrisisOutcome;
}

export interface CrisisResolution {
  id: string;
  description: string;
  requirements: CrisisRequirement[];
  relationshipBonus: number;
  successChance: number;
  dialogue: {
    offer: string;
    accept: string;
    success: string;
    failure: string;
  };
}

export interface CrisisRequirement {
  type: 'money' | 'item' | 'relationship' | 'time' | 'skill';
  amount?: number;
  itemId?: string;
  minRelationship?: number;
}

export interface CrisisOutcome {
  resolved: boolean;
  playerHelped: boolean;
  resolutionId?: string;
  permanentEffects: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Crisis definitions with possible resolutions
 */
export const CRISIS_DEFINITIONS: Record<CrisisType, {
  descriptions: string[];
  baseDuration: number;  // days
  resolutions: Omit<CrisisResolution, 'id'>[];
}> = {
  financial_trouble: {
    descriptions: [
      "lost most of their savings in a bad trade",
      "is struggling to pay rent after a market downturn",
      "got margin called and is in deep debt",
    ],
    baseDuration: 7,
    resolutions: [
      {
        description: "Lend them money",
        requirements: [{ type: 'money', amount: 5000 }],
        relationshipBonus: 60,
        successChance: 0.95,
        dialogue: {
          offer: "I could lend you some to get back on your feet...",
          accept: "You'd really do that? I... I don't know what to say.",
          success: "I paid you back! With interest. Thank you for believing in me.",
          failure: "I'm so sorry... the market tanked again. I'll make it up to you somehow.",
        },
      },
      {
        description: "Help them find work",
        requirements: [{ type: 'relationship', minRelationship: 40 }],
        relationshipBonus: 40,
        successChance: 0.7,
        dialogue: {
          offer: "I know some people. Let me see if I can help you find something.",
          accept: "That would be amazing. I'm desperate at this point.",
          success: "I got the job! Thank you so much for the connection!",
          failure: "They passed on me... but thanks for trying.",
        },
      },
    ],
  },
  
  rug_pull_victim: {
    descriptions: [
      "lost everything in a rug pull",
      "got rugged by a project they believed in",
      "trusted the wrong dev and paid the price",
    ],
    baseDuration: 10,
    resolutions: [
      {
        description: "Share your own rug pull story",
        requirements: [{ type: 'relationship', minRelationship: 20 }],
        relationshipBonus: 35,
        successChance: 0.9,
        dialogue: {
          offer: "I've been rugged too. Want to grab a drink and commiserate?",
          accept: "Misery loves company, I guess. Yeah, let's do it.",
          success: "Thanks for listening. And sharing. We're all gonna make it.",
          failure: "I appreciate you trying, but I just need to be alone right now.",
        },
      },
      {
        description: "Help them DYOR next time",
        requirements: [{ type: 'skill' }],
        relationshipBonus: 50,
        successChance: 0.8,
        dialogue: {
          offer: "Want me to show you how to spot red flags? So this doesn't happen again?",
          accept: "Yeah... I clearly need help with that.",
          success: "I think I'm getting it now. This is really helpful.",
          failure: "This is all so confusing... maybe crypto isn't for me.",
        },
      },
    ],
  },
  
  liquidation_panic: {
    descriptions: [
      "is about to get liquidated and is panicking",
      "leveraged too hard and the market is moving against them",
      "needs emergency funds to avoid liquidation",
    ],
    baseDuration: 1,  // Urgent!
    resolutions: [
      {
        description: "Emergency loan",
        requirements: [{ type: 'money', amount: 10000 }],
        relationshipBonus: 80,
        successChance: 0.85,
        dialogue: {
          offer: "How much do you need? I can help right now.",
          accept: "Are you serious?! Thank you! I'll pay you back double!",
          success: "Position saved! Here's everything I owe you. You're a lifesaver.",
          failure: "The dump was too fast... I'm sorry. I lost your money too.",
        },
      },
    ],
  },
  
  relationship_drama: {
    descriptions: [
      "just went through a bad breakup",
      "is fighting with their best friend",
      "found out their partner was cheating",
    ],
    baseDuration: 14,
    resolutions: [
      {
        description: "Be a good listener",
        requirements: [{ type: 'time' }],
        relationshipBonus: 45,
        successChance: 0.95,
        dialogue: {
          offer: "I'm here if you want to talk about it.",
          accept: "I... yeah. I think I need that. Thanks.",
          success: "Thanks for listening. I feel a lot better just getting it off my chest.",
          failure: "I don't think I'm ready to talk about it yet.",
        },
      },
    ],
  },
  
  existential_doubt: {
    descriptions: [
      "is questioning if crypto is all worth it",
      "is having a quarter-life crisis",
      "doesn't know what they're doing with their life",
    ],
    baseDuration: 21,
    resolutions: [
      {
        description: "Share perspective",
        requirements: [{ type: 'relationship', minRelationship: 30 }],
        relationshipBonus: 40,
        successChance: 0.7,
        dialogue: {
          offer: "For what it's worth, I think you're doing fine. Better than most.",
          accept: "You really think so? I feel so lost sometimes.",
          success: "You know what? You're right. I need to stop comparing myself to others.",
          failure: "I appreciate you saying that, but I'm not sure I believe it.",
        },
      },
    ],
  },
  
  fomo_regret: {
    descriptions: [
      "missed the pump and is devastated",
      "sold too early and watched it moon",
      "didn't buy when they had the chance",
    ],
    baseDuration: 5,
    resolutions: [
      {
        description: "Remind them of the bigger picture",
        requirements: [{ type: 'relationship', minRelationship: 20 }],
        relationshipBonus: 25,
        successChance: 0.8,
        dialogue: {
          offer: "There's always another opportunity. The market will cycle.",
          accept: "I know, I know... it just hurts right now.",
          success: "You're right. I need to zoom out. Thanks for the perspective.",
          failure: "Easy for you to say... *sighs*",
        },
      },
    ],
  },
  
  health_scare: {
    descriptions: [
      "had a health scare and is worried",
      "hasn't been feeling well lately",
      "is dealing with burnout",
    ],
    baseDuration: 10,
    resolutions: [
      {
        description: "Check in on them",
        requirements: [{ type: 'time' }],
        relationshipBonus: 35,
        successChance: 0.9,
        dialogue: {
          offer: "Hey, just checking in. How are you feeling?",
          accept: "Not great, honestly. But thanks for asking.",
          success: "I'm doing better. Your check-ins meant a lot.",
          failure: "I'm... not ready to talk about it.",
        },
      },
    ],
  },
  
  career_crisis: {
    descriptions: [
      "got fired from their job",
      "is burned out and thinking of quitting",
      "is questioning their career path",
    ],
    baseDuration: 14,
    resolutions: [
      {
        description: "Offer networking help",
        requirements: [{ type: 'relationship', minRelationship: 35 }],
        relationshipBonus: 50,
        successChance: 0.75,
        dialogue: {
          offer: "I know some people in the industry. Want me to make introductions?",
          accept: "That would be incredible. I'm running out of options.",
          success: "I start next week! Your connections came through!",
          failure: "No luck yet, but thanks for trying.",
        },
      },
    ],
  },
  
  housing_issue: {
    descriptions: [
      "is getting evicted",
      "has roommate problems",
      "needs to find a new place to live",
    ],
    baseDuration: 14,
    resolutions: [
      {
        description: "Help with deposit",
        requirements: [{ type: 'money', amount: 3000 }],
        relationshipBonus: 55,
        successChance: 0.9,
        dialogue: {
          offer: "I could help with the deposit if you find a place.",
          accept: "You'd really do that? I'll pay you back, I promise.",
          success: "Got a new place! Here's your money back. Thank you so much.",
          failure: "I couldn't find anything in time... I'm moving away.",
        },
      },
    ],
  },
  
  family_emergency: {
    descriptions: [
      "has a family member in the hospital",
      "received bad news from home",
      "needs to deal with a family situation",
    ],
    baseDuration: 7,
    resolutions: [
      {
        description: "Offer support",
        requirements: [{ type: 'time' }],
        relationshipBonus: 40,
        successChance: 0.95,
        dialogue: {
          offer: "I'm here for you. Whatever you need.",
          accept: "Thank you... I really appreciate it.",
          success: "Things are better now. Your support meant everything.",
          failure: "I need some space right now.",
        },
      },
    ],
  },
};

// =============================================================================
// CRISIS GENERATION
// =============================================================================

/**
 * Check if NPC should experience a crisis
 */
export function shouldTriggerCrisis(
  npc: CryptoNPC,
  hasActiveCrisis: boolean,
  daysSinceLastCrisis: number
): boolean {
  if (hasActiveCrisis) return false;
  if (daysSinceLastCrisis < 30) return false;  // Minimum 30 days between crises
  
  // Lower happiness = higher crisis chance
  const happinessModifier = (100 - (npc.needs?.fun?.current || 50)) / 100;
  const baseProbability = 0.02;  // 2% daily base chance
  
  return Math.random() < (baseProbability * (1 + happinessModifier));
}

/**
 * Generate a crisis for an NPC
 */
export function generateCrisis(npc: CryptoNPC): PersonalCrisis {
  // Select crisis type based on occupation and personality
  const crisisType = selectCrisisType(npc);
  const definition = CRISIS_DEFINITIONS[crisisType];
  
  const crisis: PersonalCrisis = {
    id: `crisis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    npcId: npc.id,
    type: crisisType,
    phase: 'building',
    severity: Math.floor(Math.random() * 5) + 5,  // 5-10
    startedAt: Date.now(),
    description: definition.descriptions[Math.floor(Math.random() * definition.descriptions.length)],
    possibleResolutions: definition.resolutions.map((r, i) => ({
      ...r,
      id: `resolution_${i}`,
    })),
    playerInvolved: false,
  };
  
  return crisis;
}

/**
 * Select appropriate crisis type based on NPC characteristics
 */
function selectCrisisType(npc: CryptoNPC): CrisisType {
  const weights: Record<CrisisType, number> = {
    financial_trouble: 1,
    relationship_drama: 1,
    health_scare: 0.5,
    career_crisis: 1,
    housing_issue: 0.5,
    family_emergency: 0.5,
    existential_doubt: 1,
    rug_pull_victim: 1.5,  // Common in crypto
    liquidation_panic: 1,
    fomo_regret: 1.5,
  };
  
  // Occupation influences
  if (npc.occupation === 'trader') {
    weights.liquidation_panic *= 2;
    weights.fomo_regret *= 2;
  } else if (npc.occupation === 'developer') {
    weights.career_crisis *= 1.5;
    weights.existential_doubt *= 1.5;
  }
  
  // Personality influences
  if (npc.personality?.crypto?.riskTolerance && npc.personality.crypto.riskTolerance > 0.7) {
    weights.liquidation_panic *= 2;
    weights.rug_pull_victim *= 1.5;
  }
  
  // Weighted random selection
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const [type, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return type as CrisisType;
  }
  
  return 'financial_trouble';  // Fallback
}

/**
 * Update crisis phase based on time
 */
export function updateCrisisPhase(crisis: PersonalCrisis): PersonalCrisis {
  const definition = CRISIS_DEFINITIONS[crisis.type];
  const elapsedDays = (Date.now() - crisis.startedAt) / DAY_MS;
  
  if (crisis.phase === 'building' && elapsedDays > definition.baseDuration * 0.3) {
    return { ...crisis, phase: 'peak', peakAt: Date.now() };
  }
  
  if (crisis.phase === 'peak' && elapsedDays > definition.baseDuration * 0.7) {
    // Auto-resolve without player if not involved
    if (!crisis.playerInvolved) {
      return {
        ...crisis,
        phase: 'aftermath',
        resolvedAt: Date.now(),
        outcome: {
          resolved: Math.random() > 0.3,  // 70% self-resolution
          playerHelped: false,
          permanentEffects: [],
        },
      };
    }
  }
  
  return crisis;
}

/**
 * Attempt to resolve a crisis
 */
export function attemptResolution(
  crisis: PersonalCrisis,
  resolutionId: string,
  playerMeetsRequirements: boolean
): PersonalCrisis {
  const resolution = crisis.possibleResolutions.find(r => r.id === resolutionId);
  if (!resolution) return crisis;
  
  if (!playerMeetsRequirements) {
    return crisis;  // Can't attempt without meeting requirements
  }
  
  const success = Math.random() < resolution.successChance;
  
  return {
    ...crisis,
    phase: 'aftermath',
    resolvedAt: Date.now(),
    playerInvolved: true,
    outcome: {
      resolved: success,
      playerHelped: true,
      resolutionId,
      permanentEffects: success 
        ? ['increased_trust', 'friendship_strengthened']
        : ['attempted_help'],
    },
  };
}

/**
 * Get crisis dialogue based on phase
 */
export function getCrisisDialogue(
  crisis: PersonalCrisis,
  relationship: number
): string {
  const { phase, description, severity } = crisis;
  
  if (phase === 'building') {
    if (relationship > 50) {
      return `Something's been bothering me... I ${description}.`;
    }
    return `*seems distracted* Hm? Oh, it's nothing...`;
  }
  
  if (phase === 'peak') {
    if (relationship > 40) {
      return `I'm really struggling here. I ${description}. I don't know what to do.`;
    }
    return `*clearly stressed* Things aren't going well for me right now.`;
  }
  
  if (phase === 'aftermath' && crisis.outcome) {
    if (crisis.outcome.playerHelped && crisis.outcome.resolved) {
      return `I can't thank you enough for what you did. I'll never forget it.`;
    } else if (crisis.outcome.playerHelped) {
      return `Thanks for trying to help. It means a lot, even if things didn't work out.`;
    } else if (crisis.outcome.resolved) {
      return `I managed to figure things out. It was rough, but I'm okay now.`;
    }
    return `That was a dark time. I'm trying to move on.`;
  }
  
  return `*seems preoccupied*`;
}
