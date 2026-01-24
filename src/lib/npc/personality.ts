// Stub file for NPC personality
export interface PersonalityArchetype {
  id: string;
  name: string;
  description: string;
}

export const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  'normie_investor': 'A typical investor who follows the market trends.',
};

export const ALL_ARCHETYPES: PersonalityArchetype[] = [];

export const ARCHETYPE_PROFILES: Record<string, PersonalityArchetype> = {};
