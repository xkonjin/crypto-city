/**
 * ConflictManager for Crypto City NPCs
 *
 * Manages NPC conflicts including personal feuds and faction warfare.
 * Handles conflict creation, escalation, de-escalation, and resolution.
 * Also manages faction wars, battles, and combat resolution.
 */

import type {
  PersonalConflict,
  PersonalConflictType,
  ConflictCause,
  ConflictIncident,
  FactionWar,
  WarCause,
  WarStage,
  WarOutcome,
  Battle,
  Combatant,
} from './conflicts';
import {
  CAUSE_STARTING_INTENSITY,
  createDefaultCombatant,
  getConflictTypeFromIntensity,
} from './conflicts';

/**
 * Generates a unique ID for conflicts and battles
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * ConflictManager handles all conflict operations for NPCs
 */
export class ConflictManager {
  /** Active personal conflicts */
  private conflicts: Map<string, PersonalConflict> = new Map();

  /** Active faction wars */
  private wars: Map<string, FactionWar> = new Map();

  // ==========================================================================
  // Personal Conflicts
  // ==========================================================================

  /**
   * Start a new conflict between two NPCs
   *
   * @param npc1Id - ID of the first NPC
   * @param npc2Id - ID of the second NPC
   * @param cause - What caused the conflict
   * @returns The newly created conflict
   */
  startConflict(
    npc1Id: string,
    npc2Id: string,
    cause: ConflictCause
  ): PersonalConflict {
    const intensity = CAUSE_STARTING_INTENSITY[cause];
    const type = getConflictTypeFromIntensity(intensity);

    const conflict: PersonalConflict = {
      id: generateId('conflict'),
      participants: [npc1Id, npc2Id],
      type,
      cause,
      intensity,
      startedAt: Date.now(),
      incidents: [],
      status: 'active',
    };

    this.conflicts.set(conflict.id, conflict);
    return conflict;
  }

  /**
   * Get a conflict by ID
   *
   * @param conflictId - The conflict's unique ID
   * @returns The conflict or undefined
   */
  getConflict(conflictId: string): PersonalConflict | undefined {
    return this.conflicts.get(conflictId);
  }

  /**
   * Escalate a conflict with a new incident
   *
   * @param conflictId - The conflict to escalate
   * @param incident - The incident details (timestamp will be added)
   */
  escalateConflict(
    conflictId: string,
    incident: Omit<ConflictIncident, 'timestamp'>
  ): void {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return;

    const fullIncident: ConflictIncident = {
      ...incident,
      timestamp: Date.now(),
    };

    conflict.incidents.push(fullIncident);
    conflict.intensity = clamp(conflict.intensity + incident.effect, 0, 100);
    conflict.type = getConflictTypeFromIntensity(conflict.intensity);

    // Reactivate if it was cooled
    if (conflict.status === 'cooled' && conflict.intensity > 10) {
      conflict.status = 'active';
    }
  }

  /**
   * De-escalate a conflict
   *
   * @param conflictId - The conflict to de-escalate
   * @param amount - How much to reduce intensity by
   */
  deescalateConflict(conflictId: string, amount: number): void {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return;

    conflict.intensity = clamp(conflict.intensity - amount, 0, 100);
    conflict.type = getConflictTypeFromIntensity(conflict.intensity);

    // Cool down if intensity is low enough
    if (conflict.intensity <= 10 && conflict.status === 'active') {
      conflict.status = 'cooled';
    }

    // Resolve if intensity hits 0
    if (conflict.intensity === 0) {
      conflict.status = 'resolved';
    }
  }

  /**
   * Resolve a conflict manually
   *
   * @param conflictId - The conflict to resolve
   */
  resolveConflict(conflictId: string): void {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return;

    conflict.status = 'resolved';
  }

  /**
   * Get all conflicts involving an NPC
   *
   * @param npcId - The NPC to find conflicts for
   * @returns Array of conflicts involving this NPC
   */
  getConflictsForNPC(npcId: string): PersonalConflict[] {
    const results: PersonalConflict[] = [];
    for (const conflict of this.conflicts.values()) {
      if (conflict.participants.includes(npcId)) {
        results.push(conflict);
      }
    }
    return results;
  }

  // ==========================================================================
  // Faction Wars
  // ==========================================================================

  /**
   * Declare war between two factions
   *
   * @param aggressorFactionId - The attacking faction
   * @param defenderFactionId - The defending faction
   * @param cause - Why the war started
   * @returns The newly created war
   */
  declareWar(
    aggressorFactionId: string,
    defenderFactionId: string,
    cause: WarCause
  ): FactionWar {
    const war: FactionWar = {
      id: generateId('war'),
      aggressorId: aggressorFactionId,
      defenderId: defenderFactionId,
      allies: {},
      cause,
      stage: 'tensions',
      startedAt: Date.now(),
      battles: [],
      casualties: { aggressor: 0, defender: 0 },
      status: 'active',
    };

    this.wars.set(war.id, war);
    return war;
  }

  /**
   * Get a war by ID
   *
   * @param warId - The war's unique ID
   * @returns The war or undefined
   */
  getWar(warId: string): FactionWar | undefined {
    return this.wars.get(warId);
  }

  /**
   * A faction joins an existing war as an ally
   *
   * @param factionId - The faction joining
   * @param warId - The war to join
   * @param side - Which side to join
   */
  joinWar(
    factionId: string,
    warId: string,
    side: 'aggressor' | 'defender'
  ): void {
    const war = this.wars.get(warId);
    if (!war) return;

    war.allies[factionId] = side;
  }

  /**
   * Initiate a battle in a war
   *
   * @param warId - The war this battle is part of
   * @param attackerNpcIds - NPCs on the attacking side
   * @param defenderNpcIds - NPCs on the defending side
   * @param location - Where the battle takes place
   * @returns The new battle (not yet resolved)
   */
  initiateBattle(
    warId: string,
    attackerNpcIds: string[],
    defenderNpcIds: string[],
    location: { x: number; y: number }
  ): Battle {
    const attackers = attackerNpcIds.map((id) => createDefaultCombatant(id));
    const defenders = defenderNpcIds.map((id) => createDefaultCombatant(id));

    const battle: Battle = {
      id: generateId('battle'),
      location,
      timestamp: Date.now(),
      attackers,
      defenders,
      result: 'draw', // Will be set when resolved
      casualties: { attackers: 0, defenders: 0 },
    };

    // Add to war's battles
    const war = this.wars.get(warId);
    if (war) {
      war.battles.push(battle);
    }

    return battle;
  }

  /**
   * Resolve a battle and determine outcome
   *
   * @param battle - The battle to resolve
   * @returns The resolved battle with result and casualties
   */
  resolveBattle(battle: Battle): Battle {
    let attackerPower = 0;
    let defenderPower = 0;
    let attackerCasualties = 0;
    let defenderCasualties = 0;

    // Calculate total power for each side
    for (const attacker of battle.attackers) {
      attackerPower += this.calculateCombatPower(attacker);
    }
    for (const defender of battle.defenders) {
      defenderPower += this.calculateCombatPower(defender);
    }

    // Simulate combat rounds
    const rounds = Math.max(3, Math.min(battle.attackers.length, battle.defenders.length) * 2);
    
    for (let i = 0; i < rounds; i++) {
      // Random attacker vs random defender
      if (battle.attackers.length > 0 && battle.defenders.length > 0) {
        const attackerIdx = Math.floor(Math.random() * battle.attackers.length);
        const defenderIdx = Math.floor(Math.random() * battle.defenders.length);
        
        const attacker = battle.attackers[attackerIdx];
        const defender = battle.defenders[defenderIdx];

        // Attacker attacks
        const attackResult = this.resolveCombatRound(attacker, defender);
        if (attackResult.hit) {
          defender.health -= attackResult.damage;
          if (defender.health <= 0) {
            defenderCasualties++;
            defender.health = 0;
          }
        }

        // Defender counter-attacks
        const counterResult = this.resolveCombatRound(defender, attacker);
        if (counterResult.hit) {
          attacker.health -= counterResult.damage;
          if (attacker.health <= 0) {
            attackerCasualties++;
            attacker.health = 0;
          }
        }

        // Update morale based on casualties
        for (const a of battle.attackers) {
          a.morale = clamp(a.morale - defenderCasualties * 0.5, 0, 100);
        }
        for (const d of battle.defenders) {
          d.morale = clamp(d.morale - attackerCasualties * 0.5, 0, 100);
        }
      }
    }

    // Determine winner
    const remainingAttackerHealth = battle.attackers.reduce((sum, a) => sum + a.health, 0);
    const remainingDefenderHealth = battle.defenders.reduce((sum, d) => sum + d.health, 0);

    if (remainingAttackerHealth > remainingDefenderHealth * 1.2) {
      battle.result = 'attacker_win';
    } else if (remainingDefenderHealth > remainingAttackerHealth * 1.2) {
      battle.result = 'defender_win';
    } else {
      battle.result = 'draw';
    }

    battle.casualties = {
      attackers: attackerCasualties,
      defenders: defenderCasualties,
    };

    // Update war casualties and stage
    this.updateWarAfterBattle(battle);

    return battle;
  }

  /**
   * Update war state after a battle
   */
  private updateWarAfterBattle(battle: Battle): void {
    // Find the war this battle belongs to
    for (const war of this.wars.values()) {
      if (war.battles.includes(battle)) {
        // Update total casualties
        war.casualties.aggressor += battle.casualties.attackers;
        war.casualties.defender += battle.casualties.defenders;

        // Escalate war stage based on number of battles
        if (war.stage === 'tensions' && war.battles.length >= 1) {
          war.stage = 'skirmishes';
        } else if (war.stage === 'skirmishes' && war.battles.length >= 3) {
          war.stage = 'open_war';
        }
        break;
      }
    }
  }

  /**
   * Request a ceasefire in a war
   *
   * @param warId - The war to request ceasefire for
   * @param requesterId - The faction requesting ceasefire
   * @returns Whether the ceasefire was accepted
   */
  requestCeasefire(warId: string, requesterId: string): boolean {
    const war = this.wars.get(warId);
    if (!war) return false;

    // Ceasefire acceptance based on war state
    // More likely if both sides have suffered casualties
    const totalCasualties = war.casualties.aggressor + war.casualties.defender;
    const acceptanceChance = Math.min(0.7, totalCasualties * 0.1);

    if (Math.random() < acceptanceChance || war.stage === 'negotiations') {
      war.stage = 'ceasefire';
      war.status = 'ceasefire';
      return true;
    } else {
      // Rejected, but move to negotiations
      // (We know war.stage is not 'negotiations' here due to the condition above)
      war.stage = 'negotiations';
      return false;
    }
  }

  /**
   * End a war with a specific outcome
   *
   * @param warId - The war to end
   * @param outcome - How the war ended
   */
  endWar(warId: string, outcome: WarOutcome): void {
    const war = this.wars.get(warId);
    if (!war) return;

    war.status = 'ended';
    war.outcome = outcome;
  }

  // ==========================================================================
  // Combat Resolution
  // ==========================================================================

  /**
   * Calculate combat power for a combatant
   *
   * @param combatant - The combatant to evaluate
   * @returns Total combat power
   */
  calculateCombatPower(combatant: Combatant): number {
    const skillBonus = combatant.combatSkill * 40;
    const healthBonus = combatant.health * 0.3;
    const moraleBonus = combatant.morale * 0.2;
    const equipmentBonus = combatant.equipment.length * 5;

    return skillBonus + healthBonus + moraleBonus + equipmentBonus;
  }

  /**
   * Resolve a single combat round between attacker and defender
   *
   * @param attacker - The attacking combatant
   * @param defender - The defending combatant
   * @returns Result with hit status and damage dealt
   */
  resolveCombatRound(
    attacker: Combatant,
    defender: Combatant
  ): { damage: number; hit: boolean } {
    const attackPower = this.calculateCombatPower(attacker);
    const defensePower = this.calculateCombatPower(defender);

    const hitChance = attackPower / (attackPower + defensePower);
    const hit = Math.random() < hitChance;

    const baseDamage = 10 + Math.random() * 15;
    const damage = hit ? Math.round(baseDamage * (1 + attacker.combatSkill * 0.5)) : 0;

    return { damage, hit };
  }
}
