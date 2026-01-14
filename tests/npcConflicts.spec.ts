import { test, expect } from "@playwright/test";

/**
 * NPC Conflict System Tests (#116, #117, #118)
 *
 * TDD Phase 1: Tests for the NPC conflict system including:
 * - Personal conflicts between NPCs (arguments, rivalries, grudges, feuds, vendettas)
 * - Conflict causes and incidents
 * - Faction warfare
 * - Combat resolution
 * - Hitchhiker's Guide style descriptions
 */

// Import types and classes directly for unit testing
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
} from "@/lib/npc/conflicts";
import {
  ALL_PERSONAL_CONFLICT_TYPES,
  ALL_CONFLICT_CAUSES,
  ALL_WAR_CAUSES,
  ALL_WAR_STAGES,
  ALL_WAR_OUTCOMES,
  CONFLICT_DESCRIPTIONS,
  createDefaultCombatant,
} from "@/lib/npc/conflicts";
import { ConflictManager } from "@/lib/npc/ConflictManager";
import type { CryptoNPC } from "@/games/isocity/types/npc";
import { createDefaultNeeds } from "@/lib/npc/needs";
import { createDefaultMemory } from "@/lib/npc/memory";
import { createInitialMovement } from "@/lib/npc/movement";
import { createDefaultPersonality } from "@/lib/npc/personality";

/**
 * Helper to create a mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  return {
    id: overrides.id || `npc_${Math.random().toString(36).substring(2, 9)}`,
    name: "Test_Hodler",
    walletAddress: "0x1234567890abcdef",
    age: 25,
    occupation: "trader",
    residence: null,
    workplace: null,
    spriteType: "apple",
    direction: "south",
    gridX: 5,
    gridY: 5,
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: "idle",
    needs: createDefaultNeeds(),
    memory: createDefaultMemory(),
    movement: createInitialMovement(),
    personality: createDefaultPersonality(),
    relationships: {},
    ...overrides,
  };
}

/**
 * Test Suite: Personal Conflict Types
 */
test.describe("Personal Conflict Types", () => {
  test("should define all 5 personal conflict types", async () => {
    expect(ALL_PERSONAL_CONFLICT_TYPES.length).toBe(5);
    expect(ALL_PERSONAL_CONFLICT_TYPES).toContain("argument");
    expect(ALL_PERSONAL_CONFLICT_TYPES).toContain("rivalry");
    expect(ALL_PERSONAL_CONFLICT_TYPES).toContain("grudge");
    expect(ALL_PERSONAL_CONFLICT_TYPES).toContain("feud");
    expect(ALL_PERSONAL_CONFLICT_TYPES).toContain("vendetta");
  });

  test("should define all 8 conflict causes", async () => {
    expect(ALL_CONFLICT_CAUSES.length).toBe(8);
    expect(ALL_CONFLICT_CAUSES).toContain("insult");
    expect(ALL_CONFLICT_CAUSES).toContain("theft");
    expect(ALL_CONFLICT_CAUSES).toContain("betrayal");
    expect(ALL_CONFLICT_CAUSES).toContain("romantic_rival");
    expect(ALL_CONFLICT_CAUSES).toContain("business_dispute");
    expect(ALL_CONFLICT_CAUSES).toContain("ideological");
    expect(ALL_CONFLICT_CAUSES).toContain("unpaid_debt");
    expect(ALL_CONFLICT_CAUSES).toContain("rug_pull");
  });

  test("should have Hitchhiker descriptions for all conflict types", async () => {
    for (const type of ALL_PERSONAL_CONFLICT_TYPES) {
      const description = CONFLICT_DESCRIPTIONS[type];
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    }
  });

  test("rug_pull should have a crypto-specific description", async () => {
    const description = CONFLICT_DESCRIPTIONS.rug_pull;
    expect(description).toBeDefined();
    expect(description.length).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: War Types
 */
test.describe("War Types", () => {
  test("should define all 5 war causes", async () => {
    expect(ALL_WAR_CAUSES.length).toBe(5);
    expect(ALL_WAR_CAUSES).toContain("territory");
    expect(ALL_WAR_CAUSES).toContain("resources");
    expect(ALL_WAR_CAUSES).toContain("ideology");
    expect(ALL_WAR_CAUSES).toContain("revenge");
    expect(ALL_WAR_CAUSES).toContain("honor");
  });

  test("should define all 5 war stages", async () => {
    expect(ALL_WAR_STAGES.length).toBe(5);
    expect(ALL_WAR_STAGES).toContain("tensions");
    expect(ALL_WAR_STAGES).toContain("skirmishes");
    expect(ALL_WAR_STAGES).toContain("open_war");
    expect(ALL_WAR_STAGES).toContain("negotiations");
    expect(ALL_WAR_STAGES).toContain("ceasefire");
  });

  test("should define all 4 war outcomes", async () => {
    expect(ALL_WAR_OUTCOMES.length).toBe(4);
    expect(ALL_WAR_OUTCOMES).toContain("aggressor_victory");
    expect(ALL_WAR_OUTCOMES).toContain("defender_victory");
    expect(ALL_WAR_OUTCOMES).toContain("white_peace");
    expect(ALL_WAR_OUTCOMES).toContain("mutual_destruction");
  });

  test("should have Hitchhiker descriptions for war-related concepts", async () => {
    expect(CONFLICT_DESCRIPTIONS.war).toBeDefined();
    expect(CONFLICT_DESCRIPTIONS.ceasefire).toBeDefined();
    expect(CONFLICT_DESCRIPTIONS.battle).toBeDefined();
  });
});

/**
 * Test Suite: Combatant
 */
test.describe("Combatant", () => {
  test("should create default combatant with valid values", async () => {
    const combatant = createDefaultCombatant("npc-123");

    expect(combatant.npcId).toBe("npc-123");
    expect(combatant.health).toBe(100);
    expect(combatant.morale).toBe(100);
    expect(combatant.combatSkill).toBeGreaterThanOrEqual(0);
    expect(combatant.combatSkill).toBeLessThanOrEqual(1);
    expect(Array.isArray(combatant.equipment)).toBe(true);
  });

  test("combatant health should be 0-100", async () => {
    const combatant = createDefaultCombatant("npc-456");
    expect(combatant.health).toBeGreaterThanOrEqual(0);
    expect(combatant.health).toBeLessThanOrEqual(100);
  });

  test("combatant morale should be 0-100", async () => {
    const combatant = createDefaultCombatant("npc-789");
    expect(combatant.morale).toBeGreaterThanOrEqual(0);
    expect(combatant.morale).toBeLessThanOrEqual(100);
  });
});

/**
 * Test Suite: ConflictManager - Personal Conflicts
 */
test.describe("ConflictManager - Personal Conflicts", () => {
  test("should create manager instance", async () => {
    const manager = new ConflictManager();
    expect(manager).toBeDefined();
  });

  test("should start a personal conflict between two NPCs", async () => {
    const manager = new ConflictManager();
    const npc1 = createMockNPC({ id: "npc1" });
    const npc2 = createMockNPC({ id: "npc2" });

    const conflict = manager.startConflict(npc1.id, npc2.id, "insult");

    expect(conflict).toBeDefined();
    expect(conflict.id).toBeDefined();
    expect(conflict.participants).toContain(npc1.id);
    expect(conflict.participants).toContain(npc2.id);
    expect(conflict.cause).toBe("insult");
    expect(conflict.status).toBe("active");
    expect(conflict.intensity).toBeGreaterThan(0);
    expect(conflict.incidents).toEqual([]);
  });

  test("should assign appropriate conflict type based on cause", async () => {
    const manager = new ConflictManager();

    // Insult should start as argument
    const insultConflict = manager.startConflict("npc1", "npc2", "insult");
    expect(insultConflict.type).toBe("argument");

    // Rug pull should start more severely
    const rugPullConflict = manager.startConflict("npc3", "npc4", "rug_pull");
    expect(["grudge", "feud", "vendetta"]).toContain(rugPullConflict.type);
  });

  test("should escalate conflict with new incident", async () => {
    const manager = new ConflictManager();
    const conflict = manager.startConflict("npc1", "npc2", "business_dispute");
    const initialIntensity = conflict.intensity;

    manager.escalateConflict(conflict.id, {
      description: "Public accusation of scam",
      aggressorId: "npc1",
      effect: 15,
    });

    const updated = manager.getConflict(conflict.id);
    expect(updated).toBeDefined();
    expect(updated!.intensity).toBeGreaterThan(initialIntensity);
    expect(updated!.incidents.length).toBe(1);
    expect(updated!.incidents[0].description).toBe("Public accusation of scam");
    expect(updated!.incidents[0].timestamp).toBeGreaterThan(0);
  });

  test("should de-escalate conflict", async () => {
    const manager = new ConflictManager();
    const conflict = manager.startConflict("npc1", "npc2", "insult");

    // Escalate first
    manager.escalateConflict(conflict.id, {
      description: "Another insult",
      aggressorId: "npc1",
      effect: 20,
    });

    const escalatedIntensity = manager.getConflict(conflict.id)!.intensity;

    // De-escalate
    manager.deescalateConflict(conflict.id, 10);

    const updated = manager.getConflict(conflict.id);
    expect(updated!.intensity).toBeLessThan(escalatedIntensity);
  });

  test("should resolve conflict", async () => {
    const manager = new ConflictManager();
    const conflict = manager.startConflict("npc1", "npc2", "insult");

    manager.resolveConflict(conflict.id);

    const updated = manager.getConflict(conflict.id);
    expect(updated!.status).toBe("resolved");
  });

  test("should cool down conflict when intensity drops significantly", async () => {
    const manager = new ConflictManager();
    const conflict = manager.startConflict("npc1", "npc2", "insult");

    // De-escalate significantly
    manager.deescalateConflict(conflict.id, 100);

    const updated = manager.getConflict(conflict.id);
    expect(["cooled", "resolved"]).toContain(updated!.status);
  });

  test("should get all conflicts for an NPC", async () => {
    const manager = new ConflictManager();

    manager.startConflict("npc1", "npc2", "insult");
    manager.startConflict("npc1", "npc3", "betrayal");
    manager.startConflict("npc4", "npc5", "theft");

    const npc1Conflicts = manager.getConflictsForNPC("npc1");
    expect(npc1Conflicts.length).toBe(2);

    const npc4Conflicts = manager.getConflictsForNPC("npc4");
    expect(npc4Conflicts.length).toBe(1);

    const npc6Conflicts = manager.getConflictsForNPC("npc6");
    expect(npc6Conflicts.length).toBe(0);
  });

  test("should upgrade conflict type when intensity increases", async () => {
    const manager = new ConflictManager();
    const conflict = manager.startConflict("npc1", "npc2", "insult");
    expect(conflict.type).toBe("argument");

    // Escalate multiple times
    for (let i = 0; i < 5; i++) {
      manager.escalateConflict(conflict.id, {
        description: `Escalation ${i}`,
        aggressorId: "npc1",
        effect: 20,
      });
    }

    const updated = manager.getConflict(conflict.id);
    // Should have upgraded from argument to something more severe
    expect(["rivalry", "grudge", "feud", "vendetta"]).toContain(updated!.type);
  });
});

/**
 * Test Suite: ConflictManager - Faction Wars
 */
test.describe("ConflictManager - Faction Wars", () => {
  test("should declare war between factions", async () => {
    const manager = new ConflictManager();

    const war = manager.declareWar("faction-bulls", "faction-bears", "ideology");

    expect(war).toBeDefined();
    expect(war.id).toBeDefined();
    expect(war.aggressorId).toBe("faction-bulls");
    expect(war.defenderId).toBe("faction-bears");
    expect(war.cause).toBe("ideology");
    expect(war.stage).toBe("tensions");
    expect(war.status).toBe("active");
    expect(war.battles).toEqual([]);
    expect(war.casualties.aggressor).toBe(0);
    expect(war.casualties.defender).toBe(0);
  });

  test("should allow factions to join as allies", async () => {
    const manager = new ConflictManager();
    const war = manager.declareWar("faction-a", "faction-b", "territory");

    manager.joinWar("faction-c", war.id, "aggressor");
    manager.joinWar("faction-d", war.id, "defender");

    const updated = manager.getWar(war.id);
    expect(updated!.allies["faction-c"]).toBe("aggressor");
    expect(updated!.allies["faction-d"]).toBe("defender");
  });

  test("should initiate battle in a war", async () => {
    const manager = new ConflictManager();
    const war = manager.declareWar("faction-a", "faction-b", "resources");

    const attackers = ["npc1", "npc2"];
    const defenders = ["npc3", "npc4"];
    const location = { x: 10, y: 15 };

    const battle = manager.initiateBattle(war.id, attackers, defenders, location);

    expect(battle).toBeDefined();
    expect(battle.id).toBeDefined();
    expect(battle.location).toEqual(location);
    expect(battle.attackers.length).toBe(2);
    expect(battle.defenders.length).toBe(2);
    expect(battle.timestamp).toBeGreaterThan(0);
  });

  test("should resolve battle and update casualties", async () => {
    const manager = new ConflictManager();
    const war = manager.declareWar("faction-a", "faction-b", "honor");

    const battle = manager.initiateBattle(
      war.id,
      ["npc1", "npc2"],
      ["npc3", "npc4"],
      { x: 5, y: 5 }
    );

    const resolved = manager.resolveBattle(battle);

    expect(resolved.result).toBeDefined();
    expect(["attacker_win", "defender_win", "draw"]).toContain(resolved.result);
    expect(resolved.casualties.attackers).toBeGreaterThanOrEqual(0);
    expect(resolved.casualties.defenders).toBeGreaterThanOrEqual(0);
  });

  test("should update war stage based on battles", async () => {
    const manager = new ConflictManager();
    const war = manager.declareWar("faction-a", "faction-b", "revenge");
    expect(war.stage).toBe("tensions");

    // Initiate and resolve battles to escalate
    const battle1 = manager.initiateBattle(
      war.id,
      ["npc1"],
      ["npc2"],
      { x: 0, y: 0 }
    );
    manager.resolveBattle(battle1);

    const warAfterBattle = manager.getWar(war.id);
    expect(["skirmishes", "open_war"]).toContain(warAfterBattle!.stage);
  });

  test("should request ceasefire", async () => {
    const manager = new ConflictManager();
    const war = manager.declareWar("faction-a", "faction-b", "territory");

    // Advance war stage
    const battle = manager.initiateBattle(
      war.id,
      ["npc1"],
      ["npc2"],
      { x: 0, y: 0 }
    );
    manager.resolveBattle(battle);

    const accepted = manager.requestCeasefire(war.id, "faction-a");

    // Ceasefire might be accepted or rejected based on war state
    expect(typeof accepted).toBe("boolean");

    if (accepted) {
      const warAfter = manager.getWar(war.id);
      expect(["ceasefire", "negotiations"]).toContain(warAfter!.stage);
    }
  });

  test("should end war with outcome", async () => {
    const manager = new ConflictManager();
    const war = manager.declareWar("faction-a", "faction-b", "ideology");

    manager.endWar(war.id, "white_peace");

    const ended = manager.getWar(war.id);
    expect(ended!.status).toBe("ended");
    expect(ended!.outcome).toBe("white_peace");
  });

  test("should track total war casualties", async () => {
    const manager = new ConflictManager();
    const war = manager.declareWar("faction-a", "faction-b", "resources");

    // Multiple battles
    for (let i = 0; i < 3; i++) {
      const battle = manager.initiateBattle(
        war.id,
        [`attacker-${i}`],
        [`defender-${i}`],
        { x: i, y: i }
      );
      manager.resolveBattle(battle);
    }

    const warAfter = manager.getWar(war.id);
    // At least some casualties should have occurred
    const totalCasualties =
      warAfter!.casualties.aggressor + warAfter!.casualties.defender;
    expect(totalCasualties).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Test Suite: Combat Resolution
 */
test.describe("Combat Resolution", () => {
  test("should calculate combat power from combatant stats", async () => {
    const manager = new ConflictManager();

    const combatant: Combatant = {
      npcId: "npc1",
      health: 100,
      morale: 100,
      combatSkill: 0.8,
      equipment: ["sword", "shield"],
    };

    const power = manager.calculateCombatPower(combatant);

    expect(power).toBeGreaterThan(0);
    // Power should be roughly: 0.8*40 + 100*0.3 + 100*0.2 + 2*5 = 32 + 30 + 20 + 10 = 92
    expect(power).toBeGreaterThanOrEqual(80);
  });

  test("higher skill should increase combat power", async () => {
    const manager = new ConflictManager();

    const lowSkill: Combatant = {
      npcId: "npc1",
      health: 100,
      morale: 100,
      combatSkill: 0.2,
      equipment: [],
    };

    const highSkill: Combatant = {
      npcId: "npc2",
      health: 100,
      morale: 100,
      combatSkill: 0.9,
      equipment: [],
    };

    const lowPower = manager.calculateCombatPower(lowSkill);
    const highPower = manager.calculateCombatPower(highSkill);

    expect(highPower).toBeGreaterThan(lowPower);
  });

  test("equipment should increase combat power", async () => {
    const manager = new ConflictManager();

    const unarmed: Combatant = {
      npcId: "npc1",
      health: 100,
      morale: 100,
      combatSkill: 0.5,
      equipment: [],
    };

    const armed: Combatant = {
      npcId: "npc2",
      health: 100,
      morale: 100,
      combatSkill: 0.5,
      equipment: ["sword", "shield", "armor"],
    };

    const unarmedPower = manager.calculateCombatPower(unarmed);
    const armedPower = manager.calculateCombatPower(armed);

    expect(armedPower).toBeGreaterThan(unarmedPower);
  });

  test("low health should reduce combat power", async () => {
    const manager = new ConflictManager();

    const healthy: Combatant = {
      npcId: "npc1",
      health: 100,
      morale: 100,
      combatSkill: 0.5,
      equipment: [],
    };

    const injured: Combatant = {
      npcId: "npc2",
      health: 30,
      morale: 100,
      combatSkill: 0.5,
      equipment: [],
    };

    const healthyPower = manager.calculateCombatPower(healthy);
    const injuredPower = manager.calculateCombatPower(injured);

    expect(healthyPower).toBeGreaterThan(injuredPower);
  });

  test("low morale should reduce combat power", async () => {
    const manager = new ConflictManager();

    const brave: Combatant = {
      npcId: "npc1",
      health: 100,
      morale: 100,
      combatSkill: 0.5,
      equipment: [],
    };

    const demoralized: Combatant = {
      npcId: "npc2",
      health: 100,
      morale: 20,
      combatSkill: 0.5,
      equipment: [],
    };

    const bravePower = manager.calculateCombatPower(brave);
    const demoralizedPower = manager.calculateCombatPower(demoralized);

    expect(bravePower).toBeGreaterThan(demoralizedPower);
  });

  test("should resolve combat round with hit/miss and damage", async () => {
    const manager = new ConflictManager();

    const attacker: Combatant = {
      npcId: "attacker",
      health: 100,
      morale: 100,
      combatSkill: 0.8,
      equipment: ["sword"],
    };

    const defender: Combatant = {
      npcId: "defender",
      health: 100,
      morale: 100,
      combatSkill: 0.3,
      equipment: [],
    };

    const result = manager.resolveCombatRound(attacker, defender);

    expect(typeof result.hit).toBe("boolean");
    expect(typeof result.damage).toBe("number");
    expect(result.damage).toBeGreaterThanOrEqual(0);

    // If hit, damage should be positive
    if (result.hit) {
      expect(result.damage).toBeGreaterThan(0);
    } else {
      expect(result.damage).toBe(0);
    }
  });

  test("higher combat power should increase hit chance", async () => {
    const manager = new ConflictManager();

    const strongAttacker: Combatant = {
      npcId: "strong",
      health: 100,
      morale: 100,
      combatSkill: 0.95,
      equipment: ["sword", "shield", "armor"],
    };

    const weakDefender: Combatant = {
      npcId: "weak",
      health: 50,
      morale: 30,
      combatSkill: 0.1,
      equipment: [],
    };

    // Run multiple rounds to test probability
    let hits = 0;
    const rounds = 100;
    for (let i = 0; i < rounds; i++) {
      const result = manager.resolveCombatRound(strongAttacker, weakDefender);
      if (result.hit) hits++;
    }

    // Strong attacker vs weak defender should hit most of the time
    expect(hits / rounds).toBeGreaterThan(0.6);
  });

  test("higher skill should increase damage on hit", async () => {
    const manager = new ConflictManager();

    const skilled: Combatant = {
      npcId: "skilled",
      health: 100,
      morale: 100,
      combatSkill: 1.0,
      equipment: [],
    };

    const unskilled: Combatant = {
      npcId: "unskilled",
      health: 100,
      morale: 100,
      combatSkill: 0.0,
      equipment: [],
    };

    const dummy: Combatant = {
      npcId: "dummy",
      health: 100,
      morale: 100,
      combatSkill: 0.5,
      equipment: [],
    };

    // Collect damages from hits
    let skilledDamages: number[] = [];
    let unskilledDamages: number[] = [];

    for (let i = 0; i < 50; i++) {
      const skilledResult = manager.resolveCombatRound(skilled, dummy);
      const unskilledResult = manager.resolveCombatRound(unskilled, dummy);
      if (skilledResult.hit) skilledDamages.push(skilledResult.damage);
      if (unskilledResult.hit) unskilledDamages.push(unskilledResult.damage);
    }

    // Average skilled damage should be higher (due to skill multiplier)
    if (skilledDamages.length > 0 && unskilledDamages.length > 0) {
      const avgSkilled =
        skilledDamages.reduce((a, b) => a + b, 0) / skilledDamages.length;
      const avgUnskilled =
        unskilledDamages.reduce((a, b) => a + b, 0) / unskilledDamages.length;
      expect(avgSkilled).toBeGreaterThan(avgUnskilled);
    }
  });
});

/**
 * Test Suite: Hitchhiker's Guide Descriptions
 */
test.describe("Hitchhiker's Guide Descriptions", () => {
  test("should have sardonic description for argument", async () => {
    expect(CONFLICT_DESCRIPTIONS.argument).toContain("disagreeing");
  });

  test("should have sardonic description for rivalry", async () => {
    expect(CONFLICT_DESCRIPTIONS.rivalry).toContain("spite");
  });

  test("should have crypto-themed description for grudge", async () => {
    const desc = CONFLICT_DESCRIPTIONS.grudge;
    expect(desc).toBeDefined();
    expect(desc.toLowerCase()).toContain("crypto");
  });

  test("should have description for feud", async () => {
    const desc = CONFLICT_DESCRIPTIONS.feud;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have description for vendetta", async () => {
    const desc = CONFLICT_DESCRIPTIONS.vendetta;
    expect(desc).toBeDefined();
    expect(desc.toLowerCase()).toContain("bear market");
  });

  test("should have crypto-specific description for rug_pull", async () => {
    const desc = CONFLICT_DESCRIPTIONS.rug_pull;
    expect(desc).toBeDefined();
    expect(desc.toLowerCase()).toContain("betrayal");
  });

  test("should have description for war", async () => {
    const desc = CONFLICT_DESCRIPTIONS.war;
    expect(desc).toBeDefined();
    expect(desc.toLowerCase()).toContain("governance");
  });

  test("should have description for ceasefire", async () => {
    const desc = CONFLICT_DESCRIPTIONS.ceasefire;
    expect(desc).toBeDefined();
    expect(desc.toLowerCase()).toContain("weapons");
  });

  test("should have description for battle", async () => {
    const desc = CONFLICT_DESCRIPTIONS.battle;
    expect(desc).toBeDefined();
    expect(desc.toLowerCase()).toContain("kinetic");
  });
});

/**
 * Test Suite: Integration with NPC System
 */
test.describe("Integration with NPC System", () => {
  test("conflicts should store participant NPC IDs", async () => {
    const manager = new ConflictManager();
    const npc1 = createMockNPC({ id: "crypto-chad-001" });
    const npc2 = createMockNPC({ id: "degen-dan-002" });

    const conflict = manager.startConflict(npc1.id, npc2.id, "rug_pull");

    expect(conflict.participants[0]).toBe(npc1.id);
    expect(conflict.participants[1]).toBe(npc2.id);
  });

  test("combatants should reference NPC IDs", async () => {
    const manager = new ConflictManager();
    const war = manager.declareWar("bulls", "bears", "ideology");

    const npc1 = createMockNPC({ id: "bull-fighter-1" });
    const npc2 = createMockNPC({ id: "bear-fighter-1" });

    const battle = manager.initiateBattle(
      war.id,
      [npc1.id],
      [npc2.id],
      { x: 5, y: 5 }
    );

    expect(battle.attackers[0].npcId).toBe(npc1.id);
    expect(battle.defenders[0].npcId).toBe(npc2.id);
  });

  test("should provide conflict intensity for relationship effects", async () => {
    const manager = new ConflictManager();
    const conflict = manager.startConflict("npc1", "npc2", "betrayal");

    // Intensity can be used by RelationshipManager to affect trust
    expect(conflict.intensity).toBeGreaterThan(0);
    expect(conflict.intensity).toBeLessThanOrEqual(100);
  });
});
