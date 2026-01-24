/**
 * PersonalityManager - Manages NPC personality generation and effects
 * 
 * This manager handles:
 * - Generating random personalities
 * - Generating personalities from archetypes
 * - Getting personality effects on behavior
 * - Providing dialogue tones based on personality
 * - Describing personalities in natural language
 */

import type { NPCAction } from './NeedsManager';
import {
  NPCPersonality,
  BigFiveTraits,
  CryptoTraits,
  PersonalityArchetype,
  ARCHETYPE_PROFILES,
  ARCHETYPE_DESCRIPTIONS,
  ALL_ARCHETYPES,
} from './personality';

/** Social interaction preference */
export type SocialPreference = 'avoid' | 'neutral' | 'seek';

/** Risk-taking behavior */
export type RiskBehavior = 'conservative' | 'moderate' | 'aggressive' | 'yolo';

/** Dialogue tone for NPC interactions */
export type DialogueTone =
  | 'friendly'
  | 'aggressive'
  | 'nervous'
  | 'confident'
  | 'suspicious'
  | 'enthusiastic'
  | 'calm'
  | 'chaotic';

/**
 * PersonalityManager handles all operations related to NPC personalities.
 */
export class PersonalityManager {
  /**
   * Generate a completely random personality.
   * Each trait is uniformly distributed between 0 and 1.
   */
  generateRandomPersonality(): NPCPersonality {
    return {
      bigFive: {
        openness: Math.random(),
        conscientiousness: Math.random(),
        extraversion: Math.random(),
        agreeableness: Math.random(),
        neuroticism: Math.random(),
      },
      crypto: {
        riskTolerance: Math.random(),
        fomo: Math.random(),
        trustInInstitutions: Math.random(),
        technicalKnowledge: Math.random(),
        degenLevel: Math.random(),
        socialInfluence: Math.random(),
        marketSentiment: 'neutral',
      },
    };
  }

  /**
   * Generate a personality based on an archetype with slight variance.
   * Applies ±0.1 variance to make each NPC unique while fitting the archetype.
   * 
   * @param archetype - The archetype to base the personality on
   * @returns Personality with traits typical of that archetype
   */
  generateFromArchetype(archetype: PersonalityArchetype): NPCPersonality {
    const profile = ARCHETYPE_PROFILES[archetype];
    if (!profile) {
      // Fall back to random if invalid archetype
      return this.generateRandomPersonality();
    }

    const variance = 0.1;
    const applyVariance = (value: number): number => {
      const newValue = value + (Math.random() - 0.5) * 2 * variance;
      return Math.max(0, Math.min(1, newValue));
    };

    return {
      bigFive: {
        openness: applyVariance(profile.bigFive.openness),
        conscientiousness: applyVariance(profile.bigFive.conscientiousness),
        extraversion: applyVariance(profile.bigFive.extraversion),
        agreeableness: applyVariance(profile.bigFive.agreeableness),
        neuroticism: applyVariance(profile.bigFive.neuroticism),
      },
      crypto: {
        riskTolerance: applyVariance(profile.crypto.riskTolerance),
        fomo: applyVariance(profile.crypto.fomo),
        trustInInstitutions: applyVariance(profile.crypto.trustInInstitutions),
        technicalKnowledge: applyVariance(profile.crypto.technicalKnowledge),
        degenLevel: applyVariance(profile.crypto.degenLevel),
        socialInfluence: applyVariance(profile.crypto.socialInfluence ?? 0.5),
        marketSentiment: profile.crypto.marketSentiment ?? 'neutral',
      },
    };
  }

  /**
   * Generate a random archetype and create a personality from it.
   */
  generateWithRandomArchetype(): { personality: NPCPersonality; archetype: PersonalityArchetype } {
    const archetype = ALL_ARCHETYPES[Math.floor(Math.random() * ALL_ARCHETYPES.length)];
    return {
      personality: this.generateFromArchetype(archetype),
      archetype,
    };
  }

  /**
   * Get a modifier for action scoring based on personality.
   * 
   * Different actions appeal differently to different personalities:
   * - Socializing is more appealing to extraverts
   * - Trading is more appealing to risk-tolerant NPCs
   * - Building/working is more appealing to conscientious NPCs
   * 
   * @param personality - The NPC's personality
   * @param action - The action being considered
   * @returns A multiplier (0.5-1.5) to apply to the action's utility score
   */
  getActionModifier(personality: NPCPersonality, action: NPCAction): number {
    let modifier = 1.0;
    const actionId = action.id.toLowerCase();

    // Social actions modified by extraversion and agreeableness
    if (actionId.includes('social') || actionId.includes('conversation') || 
        actionId.includes('party') || actionId.includes('discord')) {
      modifier *= 0.7 + personality.bigFive.extraversion * 0.6; // 0.7-1.3
      modifier *= 0.85 + personality.bigFive.agreeableness * 0.3; // 0.85-1.15
    }

    // Trading/financial actions modified by risk tolerance and degen level
    if (actionId.includes('trad') || actionId.includes('invest') || 
        actionId.includes('stake') || actionId.includes('farm')) {
      modifier *= 0.7 + personality.crypto.riskTolerance * 0.6;
      modifier *= 0.8 + personality.crypto.degenLevel * 0.4;
    }

    // Work/building actions modified by conscientiousness
    if (actionId.includes('work') || actionId.includes('build') || 
        actionId.includes('develop') || actionId.includes('creat')) {
      modifier *= 0.7 + personality.bigFive.conscientiousness * 0.6;
    }

    // New protocols/DeFi modified by openness
    if (actionId.includes('defi') || actionId.includes('new') || 
        actionId.includes('experiment') || actionId.includes('explore')) {
      modifier *= 0.6 + personality.bigFive.openness * 0.8; // 0.6-1.4
    }

    // FOMO-triggering actions modified by fomo trait
    if (actionId.includes('hype') || actionId.includes('pump') || 
        actionId.includes('trend') || actionId.includes('influencer')) {
      modifier *= 0.5 + personality.crypto.fomo * 1.0; // 0.5-1.5
    }

    // Nervous/checking actions modified by neuroticism
    if (actionId.includes('check') || actionId.includes('monitor') || 
        actionId.includes('panic') || actionId.includes('worry')) {
      modifier *= 0.7 + personality.bigFive.neuroticism * 0.6;
    }

    // Technical actions modified by technical knowledge
    if (actionId.includes('audit') || actionId.includes('code') || 
        actionId.includes('smart_contract') || actionId.includes('protocol')) {
      modifier *= 0.5 + personality.crypto.technicalKnowledge * 1.0;
    }

    // Cap modifier between 0.5 and 1.5
    return Math.max(0.5, Math.min(1.5, modifier));
  }

  /**
   * Get the dialogue tone based on personality traits.
   * 
   * The dominant traits determine how an NPC speaks:
   * - High extraversion + high agreeableness = friendly
   * - High neuroticism + low agreeableness = aggressive
   * - High neuroticism + high agreeableness = nervous
   * - Low neuroticism + high conscientiousness = calm
   * - High openness + high extraversion = enthusiastic
   * - Low trust + high neuroticism = suspicious
   * - High degen + low conscientiousness = chaotic
   * - Default = confident
   * 
   * @param personality - The NPC's personality
   * @returns The dialogue tone
   */
  getDialogueTone(personality: NPCPersonality): DialogueTone {
    const { bigFive, crypto } = personality;

    // Check for chaotic first (high degen, low conscientiousness)
    if (crypto.degenLevel > 0.7 && bigFive.conscientiousness < 0.3) {
      return 'chaotic';
    }

    // Check for suspicious (low trust, high neuroticism)
    if (crypto.trustInInstitutions < 0.3 && bigFive.neuroticism > 0.6) {
      return 'suspicious';
    }

    // Check for nervous (high neuroticism, high agreeableness)
    if (bigFive.neuroticism > 0.7 && bigFive.agreeableness > 0.5) {
      return 'nervous';
    }

    // Check for aggressive (high neuroticism, low agreeableness)
    if (bigFive.neuroticism > 0.6 && bigFive.agreeableness < 0.4) {
      return 'aggressive';
    }

    // Check for enthusiastic (high openness, high extraversion)
    if (bigFive.openness > 0.7 && bigFive.extraversion > 0.6) {
      return 'enthusiastic';
    }

    // Check for friendly (high extraversion, high agreeableness)
    if (bigFive.extraversion > 0.6 && bigFive.agreeableness > 0.6) {
      return 'friendly';
    }

    // Check for calm (low neuroticism, high conscientiousness)
    if (bigFive.neuroticism < 0.4 && bigFive.conscientiousness > 0.6) {
      return 'calm';
    }

    // Default to confident
    return 'confident';
  }

  /**
   * Get social preference based on extraversion and agreeableness.
   * 
   * @param personality - The NPC's personality
   * @returns Whether the NPC seeks, avoids, or is neutral to social interaction
   */
  getSocialPreference(personality: NPCPersonality): SocialPreference {
    const socialScore = (personality.bigFive.extraversion * 0.7 + 
                        personality.bigFive.agreeableness * 0.3);

    if (socialScore > 0.65) {
      return 'seek';
    } else if (socialScore < 0.35) {
      return 'avoid';
    }
    return 'neutral';
  }

  /**
   * Get risk-taking behavior based on crypto traits.
   * 
   * Combines riskTolerance, fomo, and degenLevel to determine overall risk behavior.
   * 
   * @param personality - The NPC's personality
   * @returns The risk behavior category
   */
  getRiskBehavior(personality: NPCPersonality): RiskBehavior {
    const { crypto } = personality;
    
    // Weighted average of risk-related traits
    const riskScore = (
      crypto.riskTolerance * 0.4 +
      crypto.degenLevel * 0.4 +
      crypto.fomo * 0.2
    );

    if (riskScore > 0.75) {
      return 'yolo';
    } else if (riskScore > 0.5) {
      return 'aggressive';
    } else if (riskScore > 0.25) {
      return 'moderate';
    }
    return 'conservative';
  }

  /**
   * Generate a natural language description of the personality.
   * 
   * @param personality - The NPC's personality
   * @returns A human-readable description
   */
  describePersonality(personality: NPCPersonality): string {
    const { bigFive, crypto } = personality;
    const traits: string[] = [];

    // Big Five descriptions
    if (bigFive.openness > 0.7) {
      traits.push("curious and adventurous");
    } else if (bigFive.openness < 0.3) {
      traits.push("traditional and skeptical");
    }

    if (bigFive.conscientiousness > 0.7) {
      traits.push("disciplined and organized");
    } else if (bigFive.conscientiousness < 0.3) {
      traits.push("spontaneous and flexible");
    }

    if (bigFive.extraversion > 0.7) {
      traits.push("outgoing and energetic");
    } else if (bigFive.extraversion < 0.3) {
      traits.push("reserved and introspective");
    }

    if (bigFive.agreeableness > 0.7) {
      traits.push("cooperative and trusting");
    } else if (bigFive.agreeableness < 0.3) {
      traits.push("competitive and skeptical");
    }

    if (bigFive.neuroticism > 0.7) {
      traits.push("anxious and emotionally reactive");
    } else if (bigFive.neuroticism < 0.3) {
      traits.push("calm and emotionally stable");
    }

    // Crypto trait descriptions
    if (crypto.riskTolerance > 0.7) {
      traits.push("a high-risk investor");
    } else if (crypto.riskTolerance < 0.3) {
      traits.push("a conservative investor");
    }

    if (crypto.fomo > 0.7) {
      traits.push("susceptible to FOMO");
    } else if (crypto.fomo < 0.3) {
      traits.push("immune to hype");
    }

    if (crypto.trustInInstitutions < 0.3) {
      traits.push("deeply suspicious of institutions");
    } else if (crypto.trustInInstitutions > 0.7) {
      traits.push("trusting of traditional finance");
    }

    if (crypto.technicalKnowledge > 0.7) {
      traits.push("technically sophisticated");
    } else if (crypto.technicalKnowledge < 0.3) {
      traits.push("a crypto newcomer");
    }

    if (crypto.degenLevel > 0.7) {
      traits.push("a full degen");
    } else if (crypto.degenLevel < 0.3) {
      traits.push("measured and careful");
    }

    // Build description
    if (traits.length === 0) {
      return "An average crypto citizen with balanced traits.";
    }

    if (traits.length === 1) {
      return `A crypto citizen who is ${traits[0]}.`;
    }

    const lastTrait = traits.pop();
    return `A crypto citizen who is ${traits.join(', ')}, and ${lastTrait}.`;
  }

  /**
   * Get the archetype description for display in UI.
   * 
   * @param archetype - The archetype to describe
   * @returns The Hitchhiker's Guide style description
   */
  getArchetypeDescription(archetype: PersonalityArchetype): string {
    return ARCHETYPE_DESCRIPTIONS[archetype] || "A mysterious crypto citizen.";
  }

  /**
   * Find the closest archetype that matches a given personality.
   * Useful for categorizing randomly generated personalities.
   * 
   * @param personality - The personality to match
   * @returns The closest archetype
   */
  findClosestArchetype(personality: NPCPersonality): PersonalityArchetype {
    let closestArchetype: PersonalityArchetype = 'normie_investor';
    let minDistance = Infinity;

    for (const archetype of ALL_ARCHETYPES) {
      const profile = ARCHETYPE_PROFILES[archetype];
      const distance = this.calculatePersonalityDistance(personality, profile);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestArchetype = archetype;
      }
    }

    return closestArchetype;
  }

  /**
   * Calculate Euclidean distance between two personalities.
   * Used for finding the closest archetype.
   */
  private calculatePersonalityDistance(a: NPCPersonality, b: NPCPersonality): number {
    let sumSquares = 0;

    // Big Five traits
    sumSquares += Math.pow(a.bigFive.openness - b.bigFive.openness, 2);
    sumSquares += Math.pow(a.bigFive.conscientiousness - b.bigFive.conscientiousness, 2);
    sumSquares += Math.pow(a.bigFive.extraversion - b.bigFive.extraversion, 2);
    sumSquares += Math.pow(a.bigFive.agreeableness - b.bigFive.agreeableness, 2);
    sumSquares += Math.pow(a.bigFive.neuroticism - b.bigFive.neuroticism, 2);

    // Crypto traits
    sumSquares += Math.pow(a.crypto.riskTolerance - b.crypto.riskTolerance, 2);
    sumSquares += Math.pow(a.crypto.fomo - b.crypto.fomo, 2);
    sumSquares += Math.pow(a.crypto.trustInInstitutions - b.crypto.trustInInstitutions, 2);
    sumSquares += Math.pow(a.crypto.technicalKnowledge - b.crypto.technicalKnowledge, 2);
    sumSquares += Math.pow(a.crypto.degenLevel - b.crypto.degenLevel, 2);

    return Math.sqrt(sumSquares);
  }
}
