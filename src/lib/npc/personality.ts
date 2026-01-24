// Stub file for NPC personality
export interface BigFiveTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface CryptoTraits {
  riskTolerance: number;
  fomo: number;
  degenLevel: number;
  technicalKnowledge: number;
  socialInfluence: number;
  marketSentiment: string;
  trustInInstitutions: number;
}

export interface NPCPersonality {
  bigFive: BigFiveTraits;
  crypto: CryptoTraits;
}

export type PersonalityArchetype =
  | 'normie_investor'
  | 'bitcoin_maxi'
  | 'eth_builder'
  | 'degen_trader'
  | 'privacy_maxi'
  | 'nft_flipper'
  | 'staking_grandma'
  | 'defi_daoist'
  | 'protocol_politician';

export interface PersonalityArchetypeData {
  id: PersonalityArchetype;
  name: string;
  description: string;
  bigFive: BigFiveTraits;
  crypto: CryptoTraits;
}

export const TRAIT_DESCRIPTIONS: Record<string, string> = {
  openness: 'Openness to new experiences and ideas',
  conscientiousness: 'Self-discipline and organization',
  extraversion: 'Social energy and outgoing nature',
  agreeableness: 'Cooperation and concern for others',
  neuroticism: 'Emotional stability and stress tolerance',
};

export const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  'normie_investor': 'A typical investor who follows market trends.',
  'bitcoin_maxi': 'A hardcore Bitcoin believer who won\'t touch alts.',
  'eth_builder': 'An Ethereum developer building the next big DApp.',
  'degen_trader': 'A risk-seeking trader chasing the next 100x.',
  'privacy_maxi': 'A privacy-focused user who values anonymity.',
  'nft_flipper': 'An NFT collector and trader.',
  'staking_grandma': 'A long-term HODLer earning passive income.',
  'defi_daoist': 'A DAO governance participant.',
  'protocol_politician': 'A protocol governance participant.',
};

const createBaseTraits = (): { bigFive: BigFiveTraits; crypto: CryptoTraits } => ({
  bigFive: {
    openness: 0.5,
    conscientiousness: 0.5,
    extraversion: 0.5,
    agreeableness: 0.5,
    neuroticism: 0.5,
  },
  crypto: {
    riskTolerance: 0.5,
    fomo: 0.5,
    degenLevel: 0.5,
    technicalKnowledge: 0.5,
    socialInfluence: 0.5,
    marketSentiment: 'neutral',
    trustInInstitutions: 0.5,
  },
});

export function createBigFiveTraits(): BigFiveTraits {
  return {
    openness: 0.5,
    conscientiousness: 0.5,
    extraversion: 0.5,
    agreeableness: 0.5,
    neuroticism: 0.5,
  };
}

export function createCryptoTraits(): CryptoTraits {
  return {
    riskTolerance: 0.5,
    fomo: 0.5,
    degenLevel: 0.5,
    technicalKnowledge: 0.5,
    socialInfluence: 0.5,
    marketSentiment: 'neutral',
    trustInInstitutions: 0.5,
  };
}

export function createDefaultPersonality(archetype: PersonalityArchetype): NPCPersonality {
  const base = createBaseTraits();
  return {
    bigFive: base.bigFive,
    crypto: base.crypto,
  };
}

export const ALL_ARCHETYPES: PersonalityArchetype[] = [
  'normie_investor',
  'bitcoin_maxi',
  'eth_builder',
  'degen_trader',
  'privacy_maxi',
  'nft_flipper',
  'staking_grandma',
  'defi_daoist',
  'protocol_politician',
];

export const ARCHETYPE_PROFILES: Record<PersonalityArchetype, PersonalityArchetypeData> = {
  normie_investor: { id: 'normie_investor', name: 'Normie Investor', description: ARCHETYPE_DESCRIPTIONS.normie_investor, ...createBaseTraits() },
  bitcoin_maxi: { id: 'bitcoin_maxi', name: 'Bitcoin Maxi', description: ARCHETYPE_DESCRIPTIONS.bitcoin_maxi, ...createBaseTraits() },
  eth_builder: { id: 'eth_builder', name: 'ETH Builder', description: ARCHETYPE_DESCRIPTIONS.eth_builder, ...createBaseTraits() },
  degen_trader: { id: 'degen_trader', name: 'Degen Trader', description: ARCHETYPE_DESCRIPTIONS.degen_trader, ...createBaseTraits() },
  privacy_maxi: { id: 'privacy_maxi', name: 'Privacy Maxi', description: ARCHETYPE_DESCRIPTIONS.privacy_maxi, ...createBaseTraits() },
  nft_flipper: { id: 'nft_flipper', name: 'NFT Flipper', description: ARCHETYPE_DESCRIPTIONS.nft_flipper, ...createBaseTraits() },
  staking_grandma: { id: 'staking_grandma', name: 'Staking Grandma', description: ARCHETYPE_DESCRIPTIONS.staking_grandma, ...createBaseTraits() },
  defi_daoist: { id: 'defi_daoist', name: 'DeFi DAOist', description: ARCHETYPE_DESCRIPTIONS.defi_daoist, ...createBaseTraits() },
  protocol_politician: { id: 'protocol_politician', name: 'Protocol Politician', description: ARCHETYPE_DESCRIPTIONS.protocol_politician, ...createBaseTraits() },
};
