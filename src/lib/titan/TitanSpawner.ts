/**
 * TitanSpawner - System for spawning and initializing new Titans
 * 
 * Creates and initializes a new Titan with full defaults including:
 * - Species-specific base stats (aptitudes)
 * - Crypto-themed name generation
 * - Species-based personality generation
 * - Full system initialization (needs, mood, BDI, skills)
 * 
 * "And on the first day of the new blockchain, a Titan was born.
 * Much like deploying a smart contract, except with more fur and fewer gas fees."
 * 
 * @see specs/HERO_PET_SYSTEM.md for full design documentation
 */

import type {
  TitanPet,
  TitanSpawnOptions,
  TitanSpecies,
  TitanSkill,
  TitanSkillProgression,
  TitanNeeds,
  TitanMood,
  TitanBDI,
  AlignmentState,
} from '@/games/isocity/types/titan';

import { ALIGNMENT_RANGES, ALL_TITAN_SKILLS } from '@/games/isocity/types/titan';
import type { NPCPersonality } from '@/lib/npc/personality';
import { createDefaultTitanNeeds } from './TitanNeeds';

// ============================================================================
// SPECIES BASE STATS
// ============================================================================

/**
 * Base aptitude stats for each Titan species.
 * Values range from 0.5 to 2.0 representing multipliers.
 * 
 * Stats include:
 * - strength: Physical power, carrying, combat
 * - speed: Movement and reaction time
 * - intelligence: Learning speed, puzzle solving
 * - charisma: NPC interaction success
 * - endurance: Stamina and need decay rate
 */
interface SpeciesBaseStats {
  strength: number;
  speed: number;
  intelligence: number;
  charisma: number;
  endurance: number;
}

/**
 * Species base stats configuration per the specification.
 * 
 * | Species | Strength | Speed | Intelligence | Charisma | Endurance |
 * |---------|----------|-------|--------------|----------|-----------|
 * | doge    | 1.0      | 1.0   | 1.0          | 1.2      | 1.0       |
 * | bull    | 1.5      | 0.7   | 0.8          | 0.9      | 1.3       |
 * | bear    | 1.3      | 0.8   | 1.0          | 0.7      | 1.5       |
 * | ape     | 0.9      | 1.0   | 1.5          | 1.1      | 0.9       |
 * | whale   | 1.8      | 0.5   | 1.2          | 0.8      | 2.0       |
 * | phoenix | 0.8      | 1.5   | 1.1          | 1.3      | 0.7       |
 */
const SPECIES_BASE_STATS: Record<TitanSpecies, SpeciesBaseStats> = {
  doge: {
    strength: 1.0,
    speed: 1.0,
    intelligence: 1.0,
    charisma: 1.2,
    endurance: 1.0,
  },
  bull: {
    strength: 1.5,
    speed: 0.7,
    intelligence: 0.8,
    charisma: 0.9,
    endurance: 1.3,
  },
  bear: {
    strength: 1.3,
    speed: 0.8,
    intelligence: 1.0,
    charisma: 0.7,
    endurance: 1.5,
  },
  ape: {
    strength: 0.9,
    speed: 1.0,
    intelligence: 1.5,
    charisma: 1.1,
    endurance: 0.9,
  },
  whale: {
    strength: 1.8,
    speed: 0.5,
    intelligence: 1.2,
    charisma: 0.8,
    endurance: 2.0,
  },
  phoenix: {
    strength: 0.8,
    speed: 1.5,
    intelligence: 1.1,
    charisma: 1.3,
    endurance: 0.7,
  },
};

/**
 * Get species base stats as a record mapping core skills to aptitudes.
 * 
 * @param species - The Titan species
 * @returns Record mapping skill names to aptitude multipliers
 */
export function getSpeciesBaseStats(species: TitanSpecies): SpeciesBaseStats {
  return SPECIES_BASE_STATS[species];
}

// ============================================================================
// NAME GENERATION
// ============================================================================

/**
 * Crypto-themed name parts by species.
 * Each species has its own themed prefixes and suffixes.
 */
const SPECIES_NAME_PARTS: Record<TitanSpecies, { prefixes: string[]; suffixes: string[] }> = {
  doge: {
    prefixes: ['Much_Wow', 'Very_Moon', 'Such_Gains', 'Moon_Doge', 'Wow_Such', 'Diamond_Paws', 'Shiba_Moon'],
    suffixes: ['_123', '_HODL', '_WOW', '_Moon', '_Doge', '_Shib', '_Inu'],
  },
  bull: {
    prefixes: ['Bull_Run', 'Pump_Master', 'Green_Candle', 'Chad_Bull', 'Alpha_Bull', 'Mega_Pump', 'Super_Bull'],
    suffixes: ['_Chad', '_Pump', '_Green', '_Run', '_Alpha', '_Bull', '_Gains'],
  },
  bear: {
    prefixes: ['Bear_Market', 'Short_Seller', 'Diamond_Paws', 'Hedge_Bear', 'Cold_Winter', 'Frost_Bear', 'Ice_Market'],
    suffixes: ['_Bob', '_Short', '_Safe', '_Bear', '_Winter', '_Frost', '_Cold'],
  },
  ape: {
    prefixes: ['Ape_Strong', 'NFT_Hodler', 'Together_Moon', 'Diamond_Hands', 'Kong_Strong', 'Gorilla_Grip', 'Banan_King'],
    suffixes: ['_APE', '_Together', '_Strong', '_NFT', '_Diamond', '_Moon', '_Hodl'],
  },
  whale: {
    prefixes: ['Whale_Alert', 'Market_Mover', 'Big_Stack', 'Deep_Ocean', 'Mega_Whale', 'Giant_Stack', 'Blue_Whale'],
    suffixes: ['_Alert', '_Mover', '_Stack', '_Whale', '_Deep', '_Big', '_Mega'],
  },
  phoenix: {
    prefixes: ['Rise_Again', 'From_Ashes', 'Rebirth_Era', 'Fire_Bird', 'Blaze_Phoenix', 'Eternal_Flame', 'Undying_Hope'],
    suffixes: ['_Rise', '_Ashes', '_Rebirth', '_Fire', '_Flame', '_Era', '_Phoenix'],
  },
};

/**
 * Counter for generating unique name numbers
 */
let nameCounter = 0;

/**
 * Generate a crypto-themed name for a Titan based on species.
 * 
 * @param species - The Titan species
 * @returns A crypto-themed name string
 */
export function generateTitanName(species: TitanSpecies): string {
  const parts = SPECIES_NAME_PARTS[species];
  const prefix = parts.prefixes[Math.floor(Math.random() * parts.prefixes.length)];
  const suffix = parts.suffixes[Math.floor(Math.random() * parts.suffixes.length)];
  
  // Add uniqueness with counter or random number
  nameCounter++;
  const uniqueNum = nameCounter + Math.floor(Math.random() * 100);
  
  // Return different name formats randomly
  const formats = [
    `${prefix}${suffix}`,
    `${prefix}_${uniqueNum}`,
    prefix,
  ];
  
  return formats[Math.floor(Math.random() * formats.length)];
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Counter for unique ID generation
 */
let idCounter = 0;

/**
 * Generate a unique Titan ID.
 * Format: titan-{timestamp}-{random}
 * 
 * @returns A unique ID string
 */
export function generateTitanId(): string {
  idCounter++;
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `titan-${timestamp}-${idCounter}-${random}`;
}

// ============================================================================
// PERSONALITY GENERATION
// ============================================================================

/**
 * Species personality profiles defining Big Five + Crypto traits.
 * Each species has a distinct personality archetype:
 * - doge: Friendly, moderate everything
 * - bull: Aggressive, high risk tolerance
 * - bear: Cautious, low risk tolerance
 * - ape: Curious, high technical knowledge
 * - whale: Confident, high trust in institutions
 * - phoenix: Optimistic, high openness
 */
const SPECIES_PERSONALITY_PROFILES: Record<TitanSpecies, NPCPersonality> = {
  doge: {
    bigFive: {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.6,
      agreeableness: 0.7,
      neuroticism: 0.4,
    },
    crypto: {
      riskTolerance: 0.5,
      fomo: 0.5,
      trustInInstitutions: 0.5,
      technicalKnowledge: 0.4,
      degenLevel: 0.5,
    },
  },
  bull: {
    bigFive: {
      openness: 0.6,
      conscientiousness: 0.4,
      extraversion: 0.8,
      agreeableness: 0.3,
      neuroticism: 0.3,
    },
    crypto: {
      riskTolerance: 0.8,
      fomo: 0.7,
      trustInInstitutions: 0.4,
      technicalKnowledge: 0.5,
      degenLevel: 0.7,
    },
  },
  bear: {
    bigFive: {
      openness: 0.3,
      conscientiousness: 0.8,
      extraversion: 0.3,
      agreeableness: 0.4,
      neuroticism: 0.6,
    },
    crypto: {
      riskTolerance: 0.2,
      fomo: 0.1,
      trustInInstitutions: 0.3,
      technicalKnowledge: 0.6,
      degenLevel: 0.1,
    },
  },
  ape: {
    bigFive: {
      openness: 0.8,
      conscientiousness: 0.4,
      extraversion: 0.7,
      agreeableness: 0.6,
      neuroticism: 0.4,
    },
    crypto: {
      riskTolerance: 0.6,
      fomo: 0.6,
      trustInInstitutions: 0.3,
      technicalKnowledge: 0.7,
      degenLevel: 0.6,
    },
  },
  whale: {
    bigFive: {
      openness: 0.4,
      conscientiousness: 0.7,
      extraversion: 0.4,
      agreeableness: 0.5,
      neuroticism: 0.2,
    },
    crypto: {
      riskTolerance: 0.5,
      fomo: 0.2,
      trustInInstitutions: 0.7,
      technicalKnowledge: 0.6,
      degenLevel: 0.3,
    },
  },
  phoenix: {
    bigFive: {
      openness: 0.8,
      conscientiousness: 0.5,
      extraversion: 0.6,
      agreeableness: 0.6,
      neuroticism: 0.3,
    },
    crypto: {
      riskTolerance: 0.6,
      fomo: 0.5,
      trustInInstitutions: 0.5,
      technicalKnowledge: 0.5,
      degenLevel: 0.4,
    },
  },
};

/**
 * Add small random variance to a trait value.
 * @param value Base trait value
 * @param variance Maximum variance (default ±0.1)
 * @returns Value with variance applied, clamped to 0-1
 */
function addVariance(value: number, variance: number = 0.1): number {
  const adjustment = (Math.random() - 0.5) * 2 * variance;
  return Math.max(0, Math.min(1, value + adjustment));
}

/**
 * Generate a personality for a Titan based on species archetype.
 * Applies small random variance to base traits for uniqueness.
 * 
 * @param species - The Titan species
 * @returns NPCPersonality with Big Five and Crypto traits
 */
export function generateSpeciesPersonality(species: TitanSpecies): NPCPersonality {
  const base = SPECIES_PERSONALITY_PROFILES[species];
  
  return {
    bigFive: {
      openness: addVariance(base.bigFive.openness),
      conscientiousness: addVariance(base.bigFive.conscientiousness),
      extraversion: addVariance(base.bigFive.extraversion),
      agreeableness: addVariance(base.bigFive.agreeableness),
      neuroticism: addVariance(base.bigFive.neuroticism),
    },
    crypto: {
      riskTolerance: addVariance(base.crypto.riskTolerance),
      fomo: addVariance(base.crypto.fomo),
      trustInInstitutions: addVariance(base.crypto.trustInInstitutions),
      technicalKnowledge: addVariance(base.crypto.technicalKnowledge),
      degenLevel: addVariance(base.crypto.degenLevel),
    },
  };
}

// ============================================================================
// ALIGNMENT HELPERS
// ============================================================================

/**
 * Get the alignment state based on alignment value.
 * 
 * @param alignment - Numeric alignment (-1.0 to +1.0)
 * @returns AlignmentState string
 */
function getAlignmentState(alignment: number): AlignmentState {
  if (alignment <= ALIGNMENT_RANGES.angelic.max) return 'angelic';
  if (alignment <= ALIGNMENT_RANGES.good.max) return 'good';
  if (alignment <= ALIGNMENT_RANGES.neutral.max) return 'neutral';
  if (alignment <= ALIGNMENT_RANGES.evil.max) return 'evil';
  return 'demonic';
}

// ============================================================================
// INITIALIZATION HELPERS
// ============================================================================

/**
 * Create default Titan mood with neutral state.
 */
function createDefaultTitanMood(): TitanMood {
  return {
    currentMood: 'neutral',
    moodIntensity: 0.5,
    thoughts: [],
    beliefs: [],
    desires: [],
    beliefsAboutPlayer: {
      trust: 0.5,
      fear: 0.0,
      affection: 0.5,
    },
  };
}

/**
 * Create default BDI structure with empty beliefs/desires/intentions.
 */
function createDefaultBDI(): TitanBDI {
  return {
    beliefs: {
      worldKnowledge: new Map(),
      actionBeliefs: new Map(),
      npcOpinions: new Map(),
      playerRelationship: {
        trust: 0.5,
        fear: 0.0,
        affection: 0.5,
      },
    },
    desires: [],
    intentions: null,
  };
}

/**
 * Create skills with species-specific aptitudes.
 * All skills start at level 1 with 0 XP.
 * 
 * @param species - The Titan species for aptitude calculation
 * @returns Record of all skills with progression data
 */
function createSkillsWithAptitudes(species: TitanSpecies): Record<TitanSkill, TitanSkillProgression> {
  const baseStats = getSpeciesBaseStats(species);
  const skills = {} as Record<TitanSkill, TitanSkillProgression>;
  
  // Map base stats to skill aptitudes
  const aptitudeMap: Record<TitanSkill, number> = {
    // Physical - directly from base stats
    strength: baseStats.strength,
    speed: baseStats.speed,
    endurance: baseStats.endurance,
    // Mental - derived from intelligence
    intelligence: baseStats.intelligence,
    awareness: baseStats.intelligence,
    memory: baseStats.intelligence,
    // Social - derived from charisma
    charisma: baseStats.charisma,
    intimidation: baseStats.strength * 0.8 + baseStats.charisma * 0.2, // Strength-based intimidation
    empathy: baseStats.charisma,
    // Special - balanced
    miracles: (baseStats.intelligence + baseStats.charisma) / 2,
    stealth: baseStats.speed * 0.7 + baseStats.intelligence * 0.3,
    gathering: (baseStats.endurance + baseStats.speed) / 2,
  };
  
  const now = Date.now();
  for (const skill of ALL_TITAN_SKILLS) {
    skills[skill] = {
      skill,
      level: 1,
      experience: 0,
      aptitude: aptitudeMap[skill],
      lastUsed: now,
    };
  }
  
  return skills;
}

// ============================================================================
// MAIN CREATE FUNCTION
// ============================================================================

/**
 * Create a new Titan with full defaults.
 * 
 * This is the main spawning function that:
 * 1. Generates unique ID
 * 2. Uses species defaults or provided options
 * 3. Generates crypto-themed name if not provided
 * 4. Initializes all systems (needs, mood, BDI, skills)
 * 5. Sets up relationships and action history
 * 
 * @param options - Spawn options including position and optional overrides
 * @returns Fully initialized TitanPet
 */
export function createTitan(options: TitanSpawnOptions): TitanPet {
  const species = options.species ?? 'doge';
  const name = options.name ?? generateTitanName(species);
  const direction = options.direction ?? 'south';
  const alignment = options.initialAlignment ?? 0;
  
  const titan: TitanPet = {
    // Identity
    id: generateTitanId(),
    species,
    name,
    age: 0,
    
    // Alignment
    alignment,
    currentAppearance: getAlignmentState(alignment),
    
    // Position
    gridX: options.gridX,
    gridY: options.gridY,
    direction,
    isInsideBuilding: false,
    currentBuildingId: null,
    
    // State
    currentActivity: 'idle',
    
    // Systems
    needs: createDefaultTitanNeeds(),
    mood: createDefaultTitanMood(),
    bdi: createDefaultBDI(),
    skills: createSkillsWithAptitudes(species),
    personality: generateSpeciesPersonality(species),
    
    // History
    actionHistory: [],
    
    // Relationships
    relationships: {},
  };
  
  return titan;
}
