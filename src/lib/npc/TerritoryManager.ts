/**
 * TerritoryManager - Manages gang warfare and territory control in Crypto City
 *
 * Handles territory claims, turf wars, raids, protection rackets, and ambushes.
 * Provides methods for faction-based territory control and gang warfare mechanics.
 */

import type {
  Territory,
  TurfWar,
  TurfWarStage,
  Raid,
  ProtectionRacket,
  Ambush,
  GridBounds,
  GridLocation,
  Skirmish,
  RaidOutcome,
} from './gangWarfare';
import {
  createDefaultTerritory,
  calculateTerritorySize,
  generateGangWarfareId,
} from './gangWarfare';

/**
 * Turf war strength registration for combat resolution
 */
interface TurfWarStrength {
  attackerStrength: number;
  defenderStrength: number;
}

/**
 * Faction presence for territory contest resolution
 */
interface FactionPresence {
  npcCount: number;
  combatStrength: number;
}

/**
 * Raid stats for success calculation
 */
interface RaidStats {
  attackerStrength: number;
  buildingSecurity: number;
}

/**
 * Ambush execution options
 */
interface AmbushOptions {
  attackerStealth?: number;
  targetAwareness?: number;
  forceOutcome?: 'success' | 'failure';
}

/**
 * Serialized state for persistence
 */
interface SerializedTerritoryManager {
  territories: Territory[];
  turfWars: TurfWar[];
  raids: Raid[];
  protectionRackets: ProtectionRacket[];
  ambushes: Ambush[];
  idCounter: number;
}

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * TerritoryManager handles all gang warfare operations
 */
export class TerritoryManager {
  /** All territories */
  private territories: Map<string, Territory> = new Map();

  /** Active turf wars */
  private turfWars: Map<string, TurfWar> = new Map();

  /** All raids */
  private raids: Map<string, Raid> = new Map();

  /** Active protection rackets */
  private protectionRackets: Map<string, ProtectionRacket> = new Map();

  /** All ambushes */
  private ambushes: Map<string, Ambush> = new Map();

  /** Faction presence tracking for territory contests */
  private territoryPresence: Map<string, Map<string, FactionPresence>> = new Map();

  /** Turf war strength tracking */
  private turfWarStrengths: Map<string, TurfWarStrength> = new Map();

  /** Raid stats tracking */
  private raidStats: Map<string, RaidStats> = new Map();

  /** Counter for generating unique IDs */
  private idCounter: number = 0;

  /**
   * Generate a unique ID
   */
  private generateId(prefix: string): string {
    this.idCounter++;
    return `${prefix}_${Date.now()}_${this.idCounter}`;
  }

  // ==========================================================================
  // Territory Management
  // ==========================================================================

  /**
   * Create a new territory
   *
   * @param bounds - The grid boundaries of the territory
   * @returns The created territory
   */
  createTerritory(bounds: GridBounds): Territory {
    const territory = createDefaultTerritory({
      id: this.generateId('territory'),
      gridBounds: bounds,
    });

    this.territories.set(territory.id, territory);
    return territory;
  }

  /**
   * Get a territory by ID
   *
   * @param territoryId - The territory's unique ID
   * @returns The territory or undefined
   */
  getTerritory(territoryId: string): Territory | undefined {
    return this.territories.get(territoryId);
  }

  /**
   * Get all territories
   *
   * @returns Array of all territories
   */
  getAllTerritories(): Territory[] {
    return Array.from(this.territories.values());
  }

  /**
   * Claim an unclaimed territory for a faction
   *
   * @param territoryId - The territory to claim
   * @param factionId - The faction claiming the territory
   * @returns True if claim was successful
   */
  claimTerritory(territoryId: string, factionId: string): boolean {
    const territory = this.territories.get(territoryId);
    if (!territory) return false;

    // Cannot claim already controlled territory
    if (territory.controlledBy !== null) return false;

    territory.controlledBy = factionId;
    return true;
  }

  /**
   * Get all territories controlled by a faction
   *
   * @param factionId - The faction to get territories for
   * @returns Array of territories controlled by the faction
   */
  getTerritoriesByFaction(factionId: string): Territory[] {
    const results: Territory[] = [];
    for (const territory of this.territories.values()) {
      if (territory.controlledBy === factionId) {
        results.push(territory);
      }
    }
    return results;
  }

  // ==========================================================================
  // Territory Contests
  // ==========================================================================

  /**
   * Start contesting a controlled territory
   *
   * @param territoryId - The territory to contest
   * @param attackerFactionId - The faction starting the contest
   * @returns True if contest was started
   */
  contestTerritory(territoryId: string, attackerFactionId: string): boolean {
    const territory = this.territories.get(territoryId);
    if (!territory) return false;

    // Cannot contest unclaimed territory
    if (territory.controlledBy === null) return false;

    // Cannot contest own territory
    if (territory.controlledBy === attackerFactionId) return false;

    // Already contesting - don't add duplicate
    if (territory.contestedBy.includes(attackerFactionId)) return true;

    territory.contestedBy.push(attackerFactionId);
    return true;
  }

  /**
   * Register a faction's presence in a territory for contest resolution
   *
   * @param territoryId - The territory
   * @param factionId - The faction
   * @param npcCount - Number of NPCs present
   * @param combatStrength - Total combat strength
   */
  registerFactionPresence(
    territoryId: string,
    factionId: string,
    npcCount: number,
    combatStrength: number
  ): void {
    if (!this.territoryPresence.has(territoryId)) {
      this.territoryPresence.set(territoryId, new Map());
    }

    this.territoryPresence.get(territoryId)!.set(factionId, {
      npcCount,
      combatStrength,
    });
  }

  /**
   * Resolve a territory contest and determine the winner
   *
   * @param territoryId - The territory to resolve
   * @returns The winning faction ID or null if no contest
   */
  resolveContest(territoryId: string): string | null {
    const territory = this.territories.get(territoryId);
    if (!territory) return null;
    if (territory.contestedBy.length === 0) return null;

    const presences = this.territoryPresence.get(territoryId);
    if (!presences) {
      // No presence data - defender wins by default
      territory.contestedBy = [];
      return territory.controlledBy;
    }

    // Calculate total strength for each faction
    let maxStrength = 0;
    let winner: string | null = null;

    // Include defender
    if (territory.controlledBy) {
      const defenderPresence = presences.get(territory.controlledBy);
      if (defenderPresence) {
        const strength = defenderPresence.npcCount * 10 + defenderPresence.combatStrength;
        if (strength > maxStrength) {
          maxStrength = strength;
          winner = territory.controlledBy;
        }
      }
    }

    // Check contestants
    for (const factionId of territory.contestedBy) {
      const presence = presences.get(factionId);
      if (presence) {
        const strength = presence.npcCount * 10 + presence.combatStrength;
        if (strength > maxStrength) {
          maxStrength = strength;
          winner = factionId;
        }
      }
    }

    // Transfer control if challenger won
    if (winner && winner !== territory.controlledBy) {
      territory.controlledBy = winner;
    }

    // Clear contest
    territory.contestedBy = [];
    this.territoryPresence.delete(territoryId);

    return winner;
  }

  // ==========================================================================
  // Territory Income
  // ==========================================================================

  /**
   * Calculate the income generated by a territory
   *
   * @param territoryId - The territory to calculate income for
   * @returns The income amount (0 if unclaimed)
   */
  calculateTerritoryIncome(territoryId: string): number {
    const territory = this.territories.get(territoryId);
    if (!territory) return 0;

    // Unclaimed territories generate no income
    if (territory.controlledBy === null) return 0;

    // Base income scales with territory size
    const size = calculateTerritorySize(territory.gridBounds);
    const baseIncome = Math.floor(size * 0.5); // 0.5 per grid cell

    return baseIncome + territory.incomeBonus;
  }

  // ==========================================================================
  // Turf Wars
  // ==========================================================================

  /**
   * Start a turf war for a territory
   *
   * @param attackerFactionId - The attacking faction
   * @param defenderFactionId - The defending faction
   * @param territoryId - The territory being fought over
   * @returns The new turf war or null if invalid
   */
  startTurfWar(
    attackerFactionId: string,
    defenderFactionId: string,
    territoryId: string
  ): TurfWar | null {
    const territory = this.territories.get(territoryId);
    if (!territory) return null;

    // Territory must be claimed
    if (territory.controlledBy === null) return null;

    // Attacker cannot be current controller
    if (territory.controlledBy === attackerFactionId) return null;

    // Defender must be current controller
    if (territory.controlledBy !== defenderFactionId) return null;

    const war: TurfWar = {
      id: this.generateId('turfwar'),
      attackerFactionId,
      defenderFactionId,
      territoryId,
      stage: 'intimidation',
      startedAt: Date.now(),
      skirmishes: [],
    };

    this.turfWars.set(war.id, war);
    this.turfWarStrengths.set(war.id, { attackerStrength: 0, defenderStrength: 0 });

    return war;
  }

  /**
   * Get a turf war by ID
   *
   * @param warId - The turf war's unique ID
   * @returns The turf war or undefined
   */
  getTurfWar(warId: string): TurfWar | undefined {
    return this.turfWars.get(warId);
  }

  /**
   * Escalate a turf war to the next stage
   *
   * @param warId - The turf war to escalate
   */
  escalateTurfWar(warId: string): void {
    const war = this.turfWars.get(warId);
    if (!war) return;

    const stageOrder: TurfWarStage[] = [
      'intimidation',
      'skirmishes',
      'all_out_war',
      'conquest',
      'resolved',
    ];

    const currentIndex = stageOrder.indexOf(war.stage);
    if (currentIndex < stageOrder.length - 2) {
      // Don't auto-escalate to resolved
      war.stage = stageOrder[currentIndex + 1];
    }
  }

  /**
   * Add a skirmish to a turf war
   *
   * @param warId - The turf war
   * @param attackerIds - NPCs on attacker side
   * @param defenderIds - NPCs on defender side
   * @returns The created skirmish
   */
  addSkirmish(
    warId: string,
    attackerIds: string[],
    defenderIds: string[]
  ): Skirmish | null {
    const war = this.turfWars.get(warId);
    if (!war) return null;

    // Simple combat resolution
    const attackerPower = attackerIds.length * (10 + Math.random() * 20);
    const defenderPower = defenderIds.length * (10 + Math.random() * 20);

    let winner: 'attacker' | 'defender' | 'draw';
    if (attackerPower > defenderPower * 1.2) {
      winner = 'attacker';
    } else if (defenderPower > attackerPower * 1.2) {
      winner = 'defender';
    } else {
      winner = 'draw';
    }

    const skirmish: Skirmish = {
      id: this.generateId('skirmish'),
      attackerIds,
      defenderIds,
      timestamp: Date.now(),
      winner,
      casualties: {
        attackers: Math.floor(Math.random() * attackerIds.length * 0.3),
        defenders: Math.floor(Math.random() * defenderIds.length * 0.3),
      },
    };

    war.skirmishes.push(skirmish);
    return skirmish;
  }

  /**
   * Register combat strength for turf war resolution
   *
   * @param warId - The turf war
   * @param factionId - The faction
   * @param strength - Combat strength value
   */
  registerTurfWarStrength(warId: string, factionId: string, strength: number): void {
    const war = this.turfWars.get(warId);
    if (!war) return;

    const strengths = this.turfWarStrengths.get(warId);
    if (!strengths) return;

    if (factionId === war.attackerFactionId) {
      strengths.attackerStrength = strength;
    } else if (factionId === war.defenderFactionId) {
      strengths.defenderStrength = strength;
    }
  }

  /**
   * Resolve a turf war and determine the winner
   *
   * @param warId - The turf war to resolve
   * @returns The winning faction ID
   */
  resolveTurfWar(warId: string): string | null {
    const war = this.turfWars.get(warId);
    if (!war) return null;

    const strengths = this.turfWarStrengths.get(warId);
    if (!strengths) {
      war.stage = 'resolved';
      return war.defenderFactionId;
    }

    // Determine winner based on strength
    let winner: string;
    if (strengths.attackerStrength > strengths.defenderStrength) {
      winner = war.attackerFactionId;
      // Transfer territory control
      const territory = this.territories.get(war.territoryId);
      if (territory) {
        territory.controlledBy = winner;
      }
    } else {
      winner = war.defenderFactionId;
    }

    war.stage = 'resolved';
    return winner;
  }

  // ==========================================================================
  // Raids
  // ==========================================================================

  /**
   * Create a raid on a building
   *
   * @param attackerIds - NPCs participating in the raid
   * @param targetBuildingId - Building being raided
   * @returns The created raid
   */
  createRaid(attackerIds: string[], targetBuildingId: string): Raid {
    const raid: Raid = {
      id: this.generateId('raid'),
      attackerIds,
      targetBuildingId,
      timestamp: Date.now(),
      outcome: 'pending',
      lootValue: 0,
    };

    this.raids.set(raid.id, raid);
    this.raidStats.set(raid.id, { attackerStrength: 0, buildingSecurity: 0 });

    return raid;
  }

  /**
   * Set the attacker strength for a raid
   *
   * @param raidId - The raid
   * @param strength - Combat strength of attackers
   */
  setRaidStrength(raidId: string, strength: number): void {
    const stats = this.raidStats.get(raidId);
    if (stats) {
      stats.attackerStrength = strength;
    }
  }

  /**
   * Set the building security for a raid
   *
   * @param raidId - The raid
   * @param security - Security level of the building
   */
  setBuildingSecurity(raidId: string, security: number): void {
    const stats = this.raidStats.get(raidId);
    if (stats) {
      stats.buildingSecurity = security;
    }
  }

  /**
   * Calculate the success chance of a raid
   *
   * @param raidId - The raid
   * @returns Success probability (0-1)
   */
  calculateRaidSuccessChance(raidId: string): number {
    const stats = this.raidStats.get(raidId);
    if (!stats) return 0.5;

    const total = stats.attackerStrength + stats.buildingSecurity;
    if (total === 0) return 0.5;

    return clamp(stats.attackerStrength / total, 0, 1);
  }

  /**
   * Execute a raid and determine outcome
   *
   * @param raidId - The raid to execute
   */
  executeRaid(raidId: string): void {
    const raid = this.raids.get(raidId);
    if (!raid) return;

    const successChance = this.calculateRaidSuccessChance(raidId);
    const roll = Math.random();

    if (roll < successChance) {
      raid.outcome = 'success';
      // Loot scales with building value (using security as proxy)
      const stats = this.raidStats.get(raidId);
      const baseLoot = stats ? stats.buildingSecurity * 10 : 100;
      raid.lootValue = Math.floor(baseLoot * (0.5 + Math.random() * 0.5));
    } else {
      raid.outcome = 'failure';
      raid.lootValue = 0;
    }
  }

  /**
   * Get all raids targeting a building
   *
   * @param buildingId - The building
   * @returns Array of raids on the building
   */
  getRaidsForBuilding(buildingId: string): Raid[] {
    const results: Raid[] = [];
    for (const raid of this.raids.values()) {
      if (raid.targetBuildingId === buildingId) {
        results.push(raid);
      }
    }
    return results;
  }

  // ==========================================================================
  // Protection Rackets
  // ==========================================================================

  /**
   * Setup a protection racket for buildings
   *
   * @param factionId - The faction running the racket
   * @param buildingIds - Buildings to protect
   * @param feePercentage - Percentage of income taken (0-1)
   * @returns The created protection racket
   */
  setupProtectionRacket(
    factionId: string,
    buildingIds: string[],
    feePercentage: number
  ): ProtectionRacket {
    const racket: ProtectionRacket = {
      id: this.generateId('racket'),
      factionId,
      buildingIds: [...buildingIds],
      feePercentage: clamp(feePercentage, 0, 1),
      enforcerIds: [],
    };

    this.protectionRackets.set(racket.id, racket);
    return racket;
  }

  /**
   * Get a protection racket by ID
   *
   * @param racketId - The racket's unique ID
   * @returns The protection racket or undefined
   */
  getProtectionRacket(racketId: string): ProtectionRacket | undefined {
    return this.protectionRackets.get(racketId);
  }

  /**
   * Assign enforcers to a protection racket
   *
   * @param racketId - The racket
   * @param enforcerIds - NPCs to assign as enforcers
   */
  assignEnforcers(racketId: string, enforcerIds: string[]): void {
    const racket = this.protectionRackets.get(racketId);
    if (!racket) return;

    racket.enforcerIds = [...enforcerIds];
  }

  /**
   * Calculate the protection fee for a building's income
   *
   * @param racketId - The protection racket
   * @param buildingIncome - The building's income
   * @returns The fee amount
   */
  calculateProtectionFee(racketId: string, buildingIncome: number): number {
    const racket = this.protectionRackets.get(racketId);
    if (!racket) return 0;

    return Math.floor(buildingIncome * racket.feePercentage);
  }

  /**
   * Get the protection racket for a building
   *
   * @param buildingId - The building
   * @returns The racket or null
   */
  getProtectionRacketForBuilding(buildingId: string): ProtectionRacket | null {
    for (const racket of this.protectionRackets.values()) {
      if (racket.buildingIds.includes(buildingId)) {
        return racket;
      }
    }
    return null;
  }

  /**
   * Get all rackets run by a faction
   *
   * @param factionId - The faction
   * @returns Array of protection rackets
   */
  getRacketsForFaction(factionId: string): ProtectionRacket[] {
    const results: ProtectionRacket[] = [];
    for (const racket of this.protectionRackets.values()) {
      if (racket.factionId === factionId) {
        results.push(racket);
      }
    }
    return results;
  }

  // ==========================================================================
  // Ambushes
  // ==========================================================================

  /**
   * Calculate the success chance of an ambush
   *
   * @param attackerStealth - Stealth level of attackers (0-1)
   * @param targetAwareness - Awareness level of target (0-1)
   * @returns Success probability (0-1)
   */
  calculateAmbushSuccessChance(attackerStealth: number, targetAwareness: number): number {
    // Base chance is 50%
    // Stealth increases chance, awareness decreases it
    const base = 0.5;
    const stealthBonus = attackerStealth * 0.4;
    const awarenessPenalty = targetAwareness * 0.4;

    return clamp(base + stealthBonus - awarenessPenalty, 0.05, 0.95);
  }

  /**
   * Execute an ambush on a target NPC
   *
   * @param attackerIds - NPCs participating in the ambush
   * @param targetId - The NPC being ambushed
   * @param location - Where the ambush occurs
   * @param options - Optional parameters for stealth/awareness
   * @returns The ambush result
   */
  executeAmbush(
    attackerIds: string[],
    targetId: string,
    location: GridLocation,
    options: AmbushOptions = {}
  ): Ambush {
    const {
      attackerStealth = 0.5,
      targetAwareness = 0.5,
      forceOutcome,
    } = options;

    let success: boolean;
    if (forceOutcome !== undefined) {
      success = forceOutcome === 'success';
    } else {
      const successChance = this.calculateAmbushSuccessChance(attackerStealth, targetAwareness);
      success = Math.random() < successChance;
    }

    // Calculate casualties
    let casualties = 0;
    if (!success) {
      // Failed ambush can result in attacker casualties
      casualties = Math.floor(Math.random() * attackerIds.length * 0.5);
    }

    const ambush: Ambush = {
      id: this.generateId('ambush'),
      attackerIds,
      targetId,
      location,
      success,
      casualties,
    };

    this.ambushes.set(ambush.id, ambush);
    return ambush;
  }

  /**
   * Get all ambushes targeting an NPC
   *
   * @param targetId - The target NPC
   * @returns Array of ambushes
   */
  getAmbushesForTarget(targetId: string): Ambush[] {
    const results: Ambush[] = [];
    for (const ambush of this.ambushes.values()) {
      if (ambush.targetId === targetId) {
        results.push(ambush);
      }
    }
    return results;
  }

  // ==========================================================================
  // Serialization
  // ==========================================================================

  /**
   * Serialize all gang warfare data for storage
   *
   * @returns Serialized data
   */
  serialize(): SerializedTerritoryManager {
    return {
      territories: Array.from(this.territories.values()),
      turfWars: Array.from(this.turfWars.values()),
      raids: Array.from(this.raids.values()),
      protectionRackets: Array.from(this.protectionRackets.values()),
      ambushes: Array.from(this.ambushes.values()),
      idCounter: this.idCounter,
    };
  }

  /**
   * Deserialize gang warfare data from storage
   *
   * @param data - Serialized data
   */
  deserialize(data: SerializedTerritoryManager): void {
    this.territories.clear();
    this.turfWars.clear();
    this.raids.clear();
    this.protectionRackets.clear();
    this.ambushes.clear();

    for (const territory of data.territories) {
      this.territories.set(territory.id, territory);
    }

    for (const war of data.turfWars) {
      this.turfWars.set(war.id, war);
      this.turfWarStrengths.set(war.id, { attackerStrength: 0, defenderStrength: 0 });
    }

    for (const raid of data.raids) {
      this.raids.set(raid.id, raid);
      this.raidStats.set(raid.id, { attackerStrength: 0, buildingSecurity: 0 });
    }

    for (const racket of data.protectionRackets) {
      this.protectionRackets.set(racket.id, racket);
    }

    for (const ambush of data.ambushes) {
      this.ambushes.set(ambush.id, ambush);
    }

    this.idCounter = data.idCounter;
  }
}
