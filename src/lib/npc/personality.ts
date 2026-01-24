// Stub file for NPC personality
export interface PersonalityArchetype {
  id: string;
  name: string;
  description: string;
}

export const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {};

export const ALL_ARCHETYPES: PersonalityArchetype[] = [];

export const ARCHETYPE_PROFILES: Record<string, PersonalityArchetype> = {};
