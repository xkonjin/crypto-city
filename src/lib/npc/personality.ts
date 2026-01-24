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
    trustInInstitutions: number;
  };
}

export type PersonalityArchetype =
  | 'normie_investor'
  | 'bitcoin_maxi'
  | 'eth_builder'
  | 'degen_trader'
  | 'privacy_maxi'
  | 'nft_flipper'
  | 'staking_grandma'
  | 'defi_daoist';

export interface PersonalityArchetypeData {
  id: string;
  name: string;
  description: string;
}

export const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  'normie_investor': 'A typical investor who follows market trends.',
  'bitcoin_maxi': 'A hardcore Bitcoin believer who won\'t touch alts.',
  'eth_builder': 'An Ethereum developer building the next big DApp.',
  'degen_trader': 'A risk-seeking trader chasing the next 100x.',
  'privacy_maxi': 'A privacy-focused user who values anonymity.',
  'nft_flipper': 'An NFT collector and trader.',
  'staking_grandma': 'A long-term HODLer earning passive income.',
  'defi_daoist': 'A DAO governance participant.',
};

export const ALL_ARCHETYPES: PersonalityArchetypeData[] = [];

export const ARCHETYPE_PROFILES: Record<string, PersonalityArchetypeData> = {};
