/**
 * NPC Personality System
 * 
 * Implements Big Five (OCEAN) personality traits plus crypto-specific traits
 * that affect NPC behavior, dialogue, and decision-making.
 * 
 * The Big Five model is the most widely accepted personality model in psychology:
 * - Openness: Curiosity, creativity, trying new things
 * - Conscientiousness: Organization, discipline, following rules
 * - Extraversion: Social energy, talkativeness
 * - Agreeableness: Cooperation, trust, kindness
 * - Neuroticism: Emotional volatility, anxiety
 * 
 * Crypto-specific traits capture behaviors unique to the crypto space.
 */

/**
 * Big Five (OCEAN) personality traits.
 * All values are 0-1 where 0.5 is average.
 */
export interface BigFiveTraits {
  /** 0-1: curiosity, creativity, trying new things */
  openness: number;
  /** 0-1: organization, discipline, following rules */
  conscientiousness: number;
  /** 0-1: social energy, talkativeness */
  extraversion: number;
  /** 0-1: cooperation, trust, kindness */
  agreeableness: number;
  /** 0-1: emotional volatility, anxiety */
  neuroticism: number;
}

/**
 * Crypto-specific personality traits.
 * All values are 0-1 where 0.5 is average.
 */
export interface CryptoTraits {
  /** 0-1: HODL vs leverage trading - willingness to take financial risks */
  riskTolerance: number;
  /** 0-1: susceptibility to hype, fear of missing out */
  fomo: number;
  /** 0-1: banks vs self-custody - trust in traditional institutions */
  trustInInstitutions: number;
  /** 0-1: normie to protocol architect - technical understanding */
  technicalKnowledge: number;
  /** 0-1: conservative to full ape - willingness to "ape in" */
  degenLevel: number;
}

/**
 * Complete NPC personality combining Big Five and crypto traits.
 */
export interface NPCPersonality {
  bigFive: BigFiveTraits;
  crypto: CryptoTraits;
}

/**
 * Personality archetypes for easy NPC generation.
 * Each archetype has preset trait ranges that define their behavior.
 */
export type PersonalityArchetype =
  | 'bitcoin_maxi'       // Low openness, high conscientiousness, low trust
  | 'eth_builder'        // High openness, high technical, moderate risk
  | 'degen_trader'       // High risk, high fomo, low conscientiousness
  | 'privacy_maxi'       // Low trust, high technical, paranoid
  | 'normie_investor'    // Low technical, low risk, high trust
  | 'nft_flipper'        // High extraversion, high fomo, low conscientiousness
  | 'staking_grandma'    // Low technical, high conscientiousness, low risk
  | 'protocol_politician'; // High extraversion, high agreeableness, moderate everything

/**
 * Hitchhiker's Guide to the Galaxy style archetype descriptions.
 * Sardonic, educational, and crypto-native.
 */
export const ARCHETYPE_DESCRIPTIONS: Record<PersonalityArchetype, string> = {
  bitcoin_maxi: "Believes Bitcoin is the only true cryptocurrency. Has strong opinions about fiat, laser eyes, and why your altcoin is a scam. Probably correct about at least one of these things.",
  eth_builder: "Spends weekends writing smart contracts and weekdays explaining why gas fees are 'actually fine'. Dreams in Solidity.",
  degen_trader: "YOLO is not just an acronym, it's a lifestyle. Has ape'd into more rugs than a carpet warehouse. No regrets, only lessons.",
  privacy_maxi: "Pays for coffee in Monero. Uses Tor to check the weather. Trusts no one, especially not you.",
  normie_investor: "Bought Bitcoin at the top because their cousin mentioned it at Thanksgiving. Checks portfolio hourly. Doesn't know what a private key is.",
  nft_flipper: "Has strong opinions about JPEGs. Somehow made rent last month by right-clicking. Art is subjective.",
  staking_grandma: "Set it and forgot it. Earns 4% APY while you panic trade. The tortoise wins the race.",
  protocol_politician: "Votes on every governance proposal. Has opinions about tokenomics. Running for delegate.",
};

/**
 * All valid archetypes as an array for iteration.
 */
export const ALL_ARCHETYPES: PersonalityArchetype[] = [
  'bitcoin_maxi',
  'eth_builder',
  'degen_trader',
  'privacy_maxi',
  'normie_investor',
  'nft_flipper',
  'staking_grandma',
  'protocol_politician',
];

/**
 * Trait descriptions explaining what high/low values mean.
 */
export const TRAIT_DESCRIPTIONS: Record<string, { high: string; low: string }> = {
  openness: {
    high: "Tries new protocols, explores DeFi",
    low: "Sticks to Bitcoin, distrusts new projects",
  },
  conscientiousness: {
    high: "Follows schedule strictly, keeps records",
    low: "Chaotic schedule, impulse decisions",
  },
  extraversion: {
    high: "Seeks social interaction, active in Discord",
    low: "Prefers solitude, lurker mentality",
  },
  agreeableness: {
    high: "Cooperative, helps onboard newbies",
    low: "Competitive, enjoys debate",
  },
  neuroticism: {
    high: "Panics during dips, checks portfolio constantly",
    low: "Diamond hands, unfazed by volatility",
  },
  riskTolerance: {
    high: "Leverage trades, high exposure",
    low: "Only stablecoins, minimal risk",
  },
  fomo: {
    high: "Buys every pump, follows influencers",
    low: "Ignores hype, does own research",
  },
  trustInInstitutions: {
    high: "Uses exchanges, trusts banks",
    low: "Self-custody only, full paranoia",
  },
  technicalKnowledge: {
    high: "Can audit smart contracts",
    low: "Struggles with wallet setup",
  },
  degenLevel: {
    high: "Ape mode: buys first, reads whitepaper never",
    low: "Research mode: weeks of DD before any position",
  },
};

/**
 * Base trait profiles for each archetype.
 * Values define the center point with ±0.1 variance applied.
 */
export const ARCHETYPE_PROFILES: Record<PersonalityArchetype, NPCPersonality> = {
  bitcoin_maxi: {
    bigFive: {
      openness: 0.2,
      conscientiousness: 0.8,
      extraversion: 0.5,
      agreeableness: 0.3,
      neuroticism: 0.4,
    },
    crypto: {
      riskTolerance: 0.4,
      fomo: 0.2,
      trustInInstitutions: 0.1,
      technicalKnowledge: 0.7,
      degenLevel: 0.2,
    },
  },
  eth_builder: {
    bigFive: {
      openness: 0.8,
      conscientiousness: 0.7,
      extraversion: 0.5,
      agreeableness: 0.6,
      neuroticism: 0.3,
    },
    crypto: {
      riskTolerance: 0.5,
      fomo: 0.3,
      trustInInstitutions: 0.4,
      technicalKnowledge: 0.9,
      degenLevel: 0.4,
    },
  },
  degen_trader: {
    bigFive: {
      openness: 0.7,
      conscientiousness: 0.2,
      extraversion: 0.7,
      agreeableness: 0.4,
      neuroticism: 0.6,
    },
    crypto: {
      riskTolerance: 0.9,
      fomo: 0.9,
      trustInInstitutions: 0.3,
      technicalKnowledge: 0.5,
      degenLevel: 0.95,
    },
  },
  privacy_maxi: {
    bigFive: {
      openness: 0.4,
      conscientiousness: 0.8,
      extraversion: 0.2,
      agreeableness: 0.3,
      neuroticism: 0.7,
    },
    crypto: {
      riskTolerance: 0.3,
      fomo: 0.1,
      trustInInstitutions: 0.05,
      technicalKnowledge: 0.9,
      degenLevel: 0.2,
    },
  },
  normie_investor: {
    bigFive: {
      openness: 0.4,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.7,
      neuroticism: 0.6,
    },
    crypto: {
      riskTolerance: 0.2,
      fomo: 0.5,
      trustInInstitutions: 0.8,
      technicalKnowledge: 0.2,
      degenLevel: 0.1,
    },
  },
  nft_flipper: {
    bigFive: {
      openness: 0.8,
      conscientiousness: 0.3,
      extraversion: 0.9,
      agreeableness: 0.5,
      neuroticism: 0.5,
    },
    crypto: {
      riskTolerance: 0.7,
      fomo: 0.9,
      trustInInstitutions: 0.4,
      technicalKnowledge: 0.4,
      degenLevel: 0.7,
    },
  },
  staking_grandma: {
    bigFive: {
      openness: 0.3,
      conscientiousness: 0.9,
      extraversion: 0.4,
      agreeableness: 0.8,
      neuroticism: 0.2,
    },
    crypto: {
      riskTolerance: 0.1,
      fomo: 0.1,
      trustInInstitutions: 0.6,
      technicalKnowledge: 0.2,
      degenLevel: 0.05,
    },
  },
  protocol_politician: {
    bigFive: {
      openness: 0.6,
      conscientiousness: 0.6,
      extraversion: 0.9,
      agreeableness: 0.8,
      neuroticism: 0.4,
    },
    crypto: {
      riskTolerance: 0.5,
      fomo: 0.4,
      trustInInstitutions: 0.5,
      technicalKnowledge: 0.6,
      degenLevel: 0.3,
    },
  },
};

/**
 * Create default Big Five traits with optional overrides.
 */
export function createBigFiveTraits(overrides: Partial<BigFiveTraits> = {}): BigFiveTraits {
  return {
    openness: overrides.openness ?? 0.5,
    conscientiousness: overrides.conscientiousness ?? 0.5,
    extraversion: overrides.extraversion ?? 0.5,
    agreeableness: overrides.agreeableness ?? 0.5,
    neuroticism: overrides.neuroticism ?? 0.5,
  };
}

/**
 * Create default Crypto traits with optional overrides.
 */
export function createCryptoTraits(overrides: Partial<CryptoTraits> = {}): CryptoTraits {
  return {
    riskTolerance: overrides.riskTolerance ?? 0.5,
    fomo: overrides.fomo ?? 0.5,
    trustInInstitutions: overrides.trustInInstitutions ?? 0.5,
    technicalKnowledge: overrides.technicalKnowledge ?? 0.5,
    degenLevel: overrides.degenLevel ?? 0.5,
  };
}

/**
 * Create a default personality with optional overrides.
 */
export function createDefaultPersonality(
  overrides: { bigFive?: Partial<BigFiveTraits>; crypto?: Partial<CryptoTraits> } = {}
): NPCPersonality {
  return {
    bigFive: createBigFiveTraits(overrides.bigFive),
    crypto: createCryptoTraits(overrides.crypto),
  };
}
