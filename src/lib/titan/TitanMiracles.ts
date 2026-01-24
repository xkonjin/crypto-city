/**
 * Titan Miracles System
 * 
 * Special abilities (miracles) for high-level Titans. Miracles are powerful
 * actions that require specific alignment, skill levels, and have cooldowns.
 * 
 * Good miracles (require negative alignment):
 * - heal: Restore NPC health
 * - bless: Boost NPC productivity
 * - shield: Protect area from disasters
 * 
 * Evil miracles (require positive alignment):
 * - curse: Debuff NPC
 * - storm: Damage area
 * - fire: Ignite buildings
 * 
 * Neutral miracles (any alignment):
 * - growth: Accelerate plant/resource growth
 * - food: Create food
 * 
 * "In Crypto City, miracles are like airdrops - everyone wants them,
 * few deserve them, and the gas fees are brutal on your energy reserves."
 * 
 * @see specs/HERO_PET_SYSTEM.md Section 7.3 for design documentation
 */

import type { TitanPet, TitanSkill } from '@/games/isocity/types/titan';

// ============================================================================
// MIRACLE TYPES
// ============================================================================

/**
 * All available miracle types.
 * 
 * Good miracles: heal, bless, shield
 * Evil miracles: curse, storm, fire  
 * Neutral miracles: growth, food
 */
export type Miracle =
  | 'heal'      // Restore NPC health
  | 'bless'     // Boost NPC productivity
  | 'shield'    // Protect area from disasters
  | 'curse'     // Debuff NPC
  | 'storm'     // Damage area
  | 'fire'      // Ignite buildings
  | 'growth'    // Accelerate plant/resource growth
  | 'food';     // Create food

/**
 * Array of all miracle types for iteration.
 */
export const ALL_MIRACLES: Miracle[] = [
  'heal',
  'bless',
  'shield',
  'curse',
  'storm',
  'fire',
  'growth',
  'food',
];

// ============================================================================
// MIRACLE CONFIGURATION
// ============================================================================

/**
 * Configuration for a single miracle.
 */
export interface MiracleConfig {
  /** Display name of the miracle */
  name: string;
  /** Description of what the miracle does */
  description: string;
  /** Alignment range required to use this miracle */
  alignmentRequired: {
    /** Minimum alignment (for evil miracles) */
    min?: number;
    /** Maximum alignment (for good miracles) */
    max?: number;
  };
  /** Skill requirement to use this miracle */
  skillRequired: {
    /** Which skill is required */
    skill: TitanSkill;
    /** Minimum level needed */
    level: number;
  };
  /** Cooldown time in milliseconds between uses */
  cooldown: number;
  /** Energy cost from Titan's needs.energy */
  energyCost: number;
  /** Effect radius in tiles (for area effects) */
  radius?: number;
  /** Effect duration in milliseconds */
  duration?: number;
  /** How much using this miracle shifts alignment */
  alignmentImpact: number;
}

/**
 * Configuration for all miracles.
 */
export const MIRACLE_CONFIGS: Record<Miracle, MiracleConfig> = {
  heal: {
    name: 'Healing Touch',
    description: 'Restore an NPC to full health with divine energy.',
    alignmentRequired: { max: 0 },  // Must be good/neutral
    skillRequired: { skill: 'empathy', level: 5 },
    cooldown: 60000,      // 1 minute
    energyCost: 20,
    alignmentImpact: -0.05,
  },
  bless: {
    name: 'Divine Blessing',
    description: 'Grant an NPC increased productivity and happiness.',
    alignmentRequired: { max: -0.3 },  // Must be good
    skillRequired: { skill: 'charisma', level: 7 },
    cooldown: 120000,     // 2 minutes
    energyCost: 30,
    duration: 300000,     // 5 minutes effect
    alignmentImpact: -0.03,
  },
  shield: {
    name: 'Protective Shield',
    description: 'Create a barrier protecting an area from disasters.',
    alignmentRequired: { max: 0 },
    skillRequired: { skill: 'miracles', level: 6 },
    cooldown: 300000,     // 5 minutes
    energyCost: 40,
    radius: 5,
    duration: 600000,     // 10 minutes
    alignmentImpact: -0.05,
  },
  curse: {
    name: 'Dark Curse',
    description: 'Afflict an NPC with reduced productivity and bad luck.',
    alignmentRequired: { min: 0 },  // Must be evil/neutral
    skillRequired: { skill: 'intimidation', level: 5 },
    cooldown: 60000,
    energyCost: 15,
    duration: 300000,
    alignmentImpact: 0.05,
  },
  storm: {
    name: 'Wrath of Storm',
    description: 'Call down lightning to damage an area.',
    alignmentRequired: { min: 0.3 },  // Must be evil
    skillRequired: { skill: 'miracles', level: 8 },
    cooldown: 180000,
    energyCost: 50,
    radius: 3,
    alignmentImpact: 0.1,
  },
  fire: {
    name: 'Inferno',
    description: 'Ignite buildings in an area with unholy fire.',
    alignmentRequired: { min: 0.5 },  // Must be demonic
    skillRequired: { skill: 'miracles', level: 7 },
    cooldown: 240000,
    energyCost: 45,
    radius: 2,
    alignmentImpact: 0.15,
  },
  growth: {
    name: "Nature's Blessing",
    description: 'Accelerate plant growth and resource regeneration.',
    alignmentRequired: {},  // Any alignment
    skillRequired: { skill: 'gathering', level: 6 },
    cooldown: 120000,
    energyCost: 25,
    radius: 4,
    duration: 300000,
    alignmentImpact: 0,
  },
  food: {
    name: 'Conjure Sustenance',
    description: 'Create food from thin air.',
    alignmentRequired: {},  // Any alignment
    skillRequired: { skill: 'gathering', level: 5 },
    cooldown: 90000,
    energyCost: 20,
    alignmentImpact: 0,
  },
};

// ============================================================================
// COOLDOWN STATE TRACKING
// ============================================================================

/**
 * State of a single miracle's cooldown.
 */
export interface MiracleCooldownState {
  /** Which miracle this state tracks */
  miracle: Miracle;
  /** Timestamp when miracle was last used (0 if never) */
  lastUsed: number;
  /** Milliseconds until ready (0 = ready) */
  cooldownRemaining: number;
}

/**
 * Tracks cooldown state for all miracles.
 * 
 * "Cooldowns are like blockchain confirmations - you just have to wait,
 * no matter how much you want to spam that button."
 */
export class MiracleCooldownTracker {
  /** Map of miracle -> last used timestamp */
  private cooldowns: Map<Miracle, number>;

  /**
   * Create a new cooldown tracker.
   * @param initialState Optional initial state as Record<Miracle, timestamp>
   */
  constructor(initialState?: Record<Miracle, number>) {
    this.cooldowns = new Map();
    
    if (initialState) {
      for (const [miracle, timestamp] of Object.entries(initialState)) {
        if (timestamp > 0) {
          this.cooldowns.set(miracle as Miracle, timestamp);
        }
      }
    }
  }

  /**
   * Record that a miracle was used.
   * @param miracle The miracle that was used
   */
  useMiracle(miracle: Miracle): void {
    this.cooldowns.set(miracle, Date.now());
  }

  /**
   * Get the remaining cooldown time for a miracle.
   * @param miracle The miracle to check
   * @returns Milliseconds remaining (0 = ready)
   */
  getCooldownRemaining(miracle: Miracle): number {
    const lastUsed = this.cooldowns.get(miracle);
    if (!lastUsed) {
      return 0;
    }
    
    const config = MIRACLE_CONFIGS[miracle];
    const elapsed = Date.now() - lastUsed;
    const remaining = config.cooldown - elapsed;
    
    return Math.max(0, remaining);
  }

  /**
   * Check if a miracle is ready to use.
   * @param miracle The miracle to check
   * @returns true if ready, false if on cooldown
   */
  isReady(miracle: Miracle): boolean {
    return this.getCooldownRemaining(miracle) === 0;
  }

  /**
   * Update cooldowns by simulating time passage.
   * This method updates the internal timestamps to simulate time passing.
   * @param deltaMs Milliseconds that have passed
   */
  update(deltaMs: number): void {
    // Reduce all timestamps by deltaMs to simulate time passing
    for (const [miracle, timestamp] of this.cooldowns.entries()) {
      // Subtract deltaMs from the "age" of the cooldown
      // This effectively makes the cooldown appear older
      const newTimestamp = timestamp - deltaMs;
      if (newTimestamp < 0) {
        // Cooldown has expired, remove it
        this.cooldowns.delete(miracle);
      } else {
        this.cooldowns.set(miracle, newTimestamp);
      }
    }
  }

  /**
   * Get the state of all miracle cooldowns.
   * @returns Array of cooldown states for all miracles
   */
  getAllStates(): MiracleCooldownState[] {
    return ALL_MIRACLES.map(miracle => ({
      miracle,
      lastUsed: this.cooldowns.get(miracle) ?? 0,
      cooldownRemaining: this.getCooldownRemaining(miracle),
    }));
  }

  /**
   * Convert to a serializable record.
   * @returns Record<Miracle, timestamp> for persistence
   */
  toRecord(): Record<Miracle, number> {
    const record: Record<Miracle, number> = {
      heal: 0,
      bless: 0,
      shield: 0,
      curse: 0,
      storm: 0,
      fire: 0,
      growth: 0,
      food: 0,
    };
    
    for (const [miracle, timestamp] of this.cooldowns.entries()) {
      record[miracle] = timestamp;
    }
    
    return record;
  }

  /**
   * Create a tracker from a serialized record.
   * @param record The serialized state
   * @returns New MiracleCooldownTracker instance
   */
  static fromRecord(record: Record<Miracle, number>): MiracleCooldownTracker {
    return new MiracleCooldownTracker(record);
  }
}

// ============================================================================
// MIRACLE EFFECTS
// ============================================================================

/**
 * Effect produced by a miracle.
 */
export interface MiracleEffect {
  /** Type of effect */
  type: 'heal' | 'buff' | 'debuff' | 'damage' | 'create' | 'protect';
  /** Target of the effect (NPC ID or position) */
  target: string | { x: number; y: number };
  /** Effect magnitude/value */
  value?: number;
  /** Effect duration in milliseconds */
  duration?: number;
}

/**
 * Result of attempting to use a miracle.
 */
export interface MiracleResult {
  /** Whether the miracle was successfully cast */
  success: boolean;
  /** Which miracle was attempted */
  miracle: Miracle;
  /** Energy consumed (0 if failed) */
  energyUsed: number;
  /** Alignment change applied (0 if failed) */
  alignmentChange: number;
  /** Effects produced by the miracle */
  effects: MiracleEffect[];
  /** Message describing the result */
  message: string;
}

// ============================================================================
// MIRACLE MESSAGES
// ============================================================================

/**
 * Messages for miracle casting, success, and failure.
 * Uses {titanName} and {targetName} placeholders.
 */
export const MIRACLE_MESSAGES: Record<Miracle, {
  cast: string[];
  success: string[];
  failure: string[];
}> = {
  heal: {
    cast: [
      '{titanName} channels healing energy...',
      '{titanName} reaches out with a gentle glow...',
      'Divine light emanates from {titanName}...',
    ],
    success: [
      '{targetName} is restored to full health!',
      'The wounds of {targetName} mend before your eyes!',
      '{targetName} feels revitalized!',
    ],
    failure: [
      'The healing energy fizzles out.',
      '{titanName} cannot muster the divine power.',
      'The light flickers and fades.',
    ],
  },
  bless: {
    cast: [
      '{titanName} bestows a divine blessing...',
      'Golden light surrounds {titanName}...',
      '{titanName} speaks words of power...',
    ],
    success: [
      '{targetName} is blessed with divine favor!',
      'A golden aura envelops {targetName}!',
      '{targetName} feels inspired and empowered!',
    ],
    failure: [
      'The blessing fails to take hold.',
      '{titanName} lacks the divine connection.',
      'The golden light dissipates harmlessly.',
    ],
  },
  shield: {
    cast: [
      '{titanName} raises a protective barrier...',
      'A shimmering dome forms around {titanName}...',
      '{titanName} invokes divine protection...',
    ],
    success: [
      'A protective shield covers the area!',
      'The barrier stands firm against all harm!',
      'Divine protection shields this place!',
    ],
    failure: [
      'The shield shatters before forming.',
      '{titanName} cannot maintain the barrier.',
      'The protection spell collapses.',
    ],
  },
  curse: {
    cast: [
      '{titanName} whispers dark words...',
      'Shadow tendrils extend from {titanName}...',
      '{titanName} channels malevolent energy...',
    ],
    success: [
      '{targetName} is cursed with misfortune!',
      'A dark aura afflicts {targetName}!',
      '{targetName} feels their luck drain away!',
    ],
    failure: [
      'The curse rebounds harmlessly.',
      '{titanName} fails to invoke the darkness.',
      'The shadows refuse to obey.',
    ],
  },
  storm: {
    cast: [
      '{titanName} calls upon the fury of the storm...',
      'Dark clouds gather at {titanName}\'s command...',
      'Thunder rumbles as {titanName} raises their power...',
    ],
    success: [
      'Lightning strikes devastate the area!',
      'The storm\'s wrath is unleashed!',
      'Thunder and lightning consume all!',
    ],
    failure: [
      'The clouds disperse without effect.',
      '{titanName} cannot control the storm.',
      'The sky clears mockingly.',
    ],
  },
  fire: {
    cast: [
      '{titanName} summons unholy flames...',
      'Hellfire ignites at {titanName}\'s feet...',
      '{titanName} channels infernal power...',
    ],
    success: [
      'Buildings erupt in unholy flames!',
      'Fire consumes everything in its path!',
      'The inferno rages without mercy!',
    ],
    failure: [
      'The flames sputter and die.',
      '{titanName} cannot summon enough fire.',
      'The infernal connection is severed.',
    ],
  },
  growth: {
    cast: [
      '{titanName} communes with nature...',
      'Green energy flows from {titanName}...',
      '{titanName} channels the power of growth...',
    ],
    success: [
      'Plants spring to life across the area!',
      'The land flourishes with abundance!',
      'Nature responds with bountiful growth!',
    ],
    failure: [
      'The ground remains barren.',
      '{titanName} cannot connect with nature.',
      'The growth energy fades away.',
    ],
  },
  food: {
    cast: [
      '{titanName} conjures sustenance...',
      'Energy coalesces into matter...',
      '{titanName} creates food from nothing...',
    ],
    success: [
      'Delicious food appears from thin air!',
      'A feast materializes before you!',
      'Sustenance is created!',
    ],
    failure: [
      'Only crumbs appear.',
      '{titanName} fails to manifest food.',
      'The conjuration fizzles out.',
    ],
  },
};

// ============================================================================
// CORE MIRACLE FUNCTIONS
// ============================================================================

/**
 * Check if a Titan can use a specific miracle.
 * Validates alignment, skill level, cooldown, and energy.
 * 
 * @param titan The Titan attempting to use the miracle
 * @param miracle The miracle to check
 * @param cooldownTracker The cooldown tracker to check
 * @returns Object with canUse boolean and optional reason string
 */
export function canUseMiracle(
  titan: TitanPet,
  miracle: Miracle,
  cooldownTracker: MiracleCooldownTracker
): { canUse: boolean; reason?: string } {
  const config = MIRACLE_CONFIGS[miracle];
  
  // Check alignment requirement
  if (config.alignmentRequired.min !== undefined) {
    if (titan.alignment < config.alignmentRequired.min) {
      return {
        canUse: false,
        reason: `Requires alignment >= ${config.alignmentRequired.min} (current: ${titan.alignment.toFixed(2)})`,
      };
    }
  }
  if (config.alignmentRequired.max !== undefined) {
    if (titan.alignment > config.alignmentRequired.max) {
      return {
        canUse: false,
        reason: `Requires alignment <= ${config.alignmentRequired.max} (current: ${titan.alignment.toFixed(2)})`,
      };
    }
  }
  
  // Check skill requirement
  const skillLevel = titan.skills[config.skillRequired.skill]?.level ?? 0;
  if (skillLevel < config.skillRequired.level) {
    return {
      canUse: false,
      reason: `Requires ${config.skillRequired.skill} level ${config.skillRequired.level} (current: ${skillLevel})`,
    };
  }
  
  // Check cooldown
  if (!cooldownTracker.isReady(miracle)) {
    const remaining = cooldownTracker.getCooldownRemaining(miracle);
    const seconds = Math.ceil(remaining / 1000);
    return {
      canUse: false,
      reason: `On cooldown for ${seconds} more seconds`,
    };
  }
  
  // Check energy
  if (titan.needs.energy.current < config.energyCost) {
    return {
      canUse: false,
      reason: `Requires ${config.energyCost} energy (current: ${titan.needs.energy.current.toFixed(0)})`,
    };
  }
  
  return { canUse: true };
}

/**
 * Get a random message from an array.
 */
function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Create effects for a miracle based on its type.
 */
function createMiracleEffects(
  miracle: Miracle,
  target: { x: number; y: number } | string
): MiracleEffect[] {
  const config = MIRACLE_CONFIGS[miracle];
  const effects: MiracleEffect[] = [];
  
  switch (miracle) {
    case 'heal':
      effects.push({
        type: 'heal',
        target,
        value: 100, // Full heal
      });
      break;
      
    case 'bless':
      effects.push({
        type: 'buff',
        target,
        value: 1.5, // 50% productivity boost
        duration: config.duration,
      });
      break;
      
    case 'shield':
      effects.push({
        type: 'protect',
        target,
        duration: config.duration,
      });
      break;
      
    case 'curse':
      effects.push({
        type: 'debuff',
        target,
        value: 0.5, // 50% productivity reduction
        duration: config.duration,
      });
      break;
      
    case 'storm':
      effects.push({
        type: 'damage',
        target,
        value: 50, // Damage amount
      });
      break;
      
    case 'fire':
      effects.push({
        type: 'damage',
        target,
        value: 75, // Higher damage
      });
      break;
      
    case 'growth':
      effects.push({
        type: 'buff',
        target,
        value: 2.0, // Double growth rate
        duration: config.duration,
      });
      break;
      
    case 'food':
      effects.push({
        type: 'create',
        target,
        value: 50, // Food amount
      });
      break;
  }
  
  return effects;
}

/**
 * Use a miracle.
 * 
 * @param titan The Titan using the miracle
 * @param miracle The miracle to use
 * @param target Target position or NPC ID
 * @param cooldownTracker The cooldown tracker
 * @returns MiracleResult with success status and effects
 */
export function performMiracle(
  titan: TitanPet,
  miracle: Miracle,
  target: { x: number; y: number } | string,
  cooldownTracker: MiracleCooldownTracker
): MiracleResult {
  const config = MIRACLE_CONFIGS[miracle];
  
  // Check if can use
  const canUse = canUseMiracle(titan, miracle, cooldownTracker);
  if (!canUse.canUse) {
    return {
      success: false,
      miracle,
      energyUsed: 0,
      alignmentChange: 0,
      effects: [],
      message: canUse.reason ?? getRandomMessage(MIRACLE_MESSAGES[miracle].failure),
    };
  }
  
  // Deduct energy
  titan.needs.energy.current -= config.energyCost;
  
  // Apply alignment impact (clamped to -1 to 1)
  titan.alignment = Math.max(-1, Math.min(1, titan.alignment + config.alignmentImpact));
  
  // Put on cooldown
  cooldownTracker.useMiracle(miracle);
  
  // Create effects
  const effects = createMiracleEffects(miracle, target);
  
  // Get success message
  const message = getRandomMessage(MIRACLE_MESSAGES[miracle].success);
  
  return {
    success: true,
    miracle,
    energyUsed: config.energyCost,
    alignmentChange: config.alignmentImpact,
    effects,
    message,
  };
}

// ============================================================================
// MIRACLE DISCOVERY FUNCTIONS
// ============================================================================

/**
 * Check if a miracle is available for a Titan based on alignment.
 * This checks only alignment, not skill requirements.
 */
function isMiracleAvailableByAlignment(titan: TitanPet, miracle: Miracle): boolean {
  const config = MIRACLE_CONFIGS[miracle];
  
  // Check minimum alignment
  if (config.alignmentRequired.min !== undefined) {
    if (titan.alignment < config.alignmentRequired.min) {
      return false;
    }
  }
  
  // Check maximum alignment
  if (config.alignmentRequired.max !== undefined) {
    if (titan.alignment > config.alignmentRequired.max) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get list of miracles a Titan can potentially learn based on alignment.
 * Does not check skill requirements - shows what's available to work toward.
 * 
 * @param titan The Titan to check
 * @returns Array of miracles available for this alignment
 */
export function getAvailableMiracles(titan: TitanPet): Miracle[] {
  return ALL_MIRACLES.filter(miracle => isMiracleAvailableByAlignment(titan, miracle));
}

/**
 * Get list of miracles a Titan has fully unlocked.
 * Checks both alignment and skill requirements.
 * 
 * @param titan The Titan to check
 * @returns Array of unlocked miracles
 */
export function getUnlockedMiracles(titan: TitanPet): Miracle[] {
  return ALL_MIRACLES.filter(miracle => isMiracleUnlocked(titan, miracle));
}

/**
 * Check if a specific miracle is unlocked for a Titan.
 * A miracle is unlocked if both alignment and skill requirements are met.
 * 
 * @param titan The Titan to check
 * @param miracle The miracle to check
 * @returns true if the miracle is unlocked
 */
export function isMiracleUnlocked(titan: TitanPet, miracle: Miracle): boolean {
  const config = MIRACLE_CONFIGS[miracle];
  
  // Check alignment
  if (!isMiracleAvailableByAlignment(titan, miracle)) {
    return false;
  }
  
  // Check skill
  const skillLevel = titan.skills[config.skillRequired.skill]?.level ?? 0;
  if (skillLevel < config.skillRequired.level) {
    return false;
  }
  
  return true;
}
