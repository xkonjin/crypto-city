// Stub file for NPC personality
export interface NPCPersonality {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  crypto: {
    riskTolerance: number;
    fomo: number;
    degenLevel: number;
    technicalKnowledge: number;
    socialInfluence: number;
    marketSentiment: string;
  };
}

export interface PersonalityArchetype {
  id: string;
  name: string;
  description: string;
}

export const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  'normie_investor': 'A typical investor who follows market trends.',
};

export const ALL_ARCHETYPES: PersonalityArchetype[] = [];

export const ARCHETYPE_PROFILES: Record<string, PersonalityArchetype> = {};
