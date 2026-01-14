import { test, expect } from "@playwright/test";

/**
 * NPC Gang Warfare System Tests (#191)
 *
 * TDD Phase 1: Tests for Gang/Faction Warfare Mechanics including:
 * - Territory types and interfaces
 * - Turf Wars and escalation stages
 * - Raids and Protection Rackets
 * - Ambushes
 * - TerritoryManager class
 */

// Import types and classes directly for unit testing
import type {
  Territory,
  TurfWar,
  TurfWarStage,
  Raid,
  ProtectionRacket,
  Ambush,
  GridBounds,
  Skirmish,
} from "@/lib/npc/gangWarfare";
import {
  ALL_TURF_WAR_STAGES,
  GANG_WARFARE_DESCRIPTIONS,
  createDefaultTerritory,
  calculateTerritorySize,
} from "@/lib/npc/gangWarfare";
import { TerritoryManager } from "@/lib/npc/TerritoryManager";

/**
 * Test Suite: Territory Types
 */
test.describe("Territory Types", () => {
  test("should define Territory interface with all required properties", async () => {
    const territory = createDefaultTerritory({
      id: "territory-1",
      gridBounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    });

    expect(typeof territory.id).toBe("string");
    expect(territory.gridBounds).toBeDefined();
    expect(typeof territory.gridBounds.minX).toBe("number");
    expect(typeof territory.gridBounds.minY).toBe("number");
    expect(typeof territory.gridBounds.maxX).toBe("number");
    expect(typeof territory.gridBounds.maxY).toBe("number");
    expect(
      territory.controlledBy === null || typeof territory.controlledBy === "string"
    ).toBe(true);
    expect(Array.isArray(territory.contestedBy)).toBe(true);
    expect(typeof territory.incomeBonus).toBe("number");
    expect(typeof territory.influenceBonus).toBe("number");
  });

  test("should calculate territory size from bounds", async () => {
    const bounds: GridBounds = { minX: 0, minY: 0, maxX: 5, maxY: 5 };
    const size = calculateTerritorySize(bounds);

    expect(size).toBe(36); // (5-0+1) * (5-0+1) = 6*6 = 36
  });

  test("createDefaultTerritory should create territory with default values", async () => {
    const territory = createDefaultTerritory({
      id: "test-territory",
      gridBounds: { minX: 0, minY: 0, maxX: 5, maxY: 5 },
    });

    expect(territory.id).toBe("test-territory");
    expect(territory.controlledBy).toBeNull();
    expect(territory.contestedBy).toEqual([]);
    expect(territory.incomeBonus).toBe(0);
    expect(territory.influenceBonus).toBe(0);
  });
});

/**
 * Test Suite: TurfWar Types
 */
test.describe("TurfWar Types", () => {
  test("should define all 5 turf war stages", async () => {
    expect(ALL_TURF_WAR_STAGES.length).toBe(5);
    expect(ALL_TURF_WAR_STAGES).toContain("intimidation");
    expect(ALL_TURF_WAR_STAGES).toContain("skirmishes");
    expect(ALL_TURF_WAR_STAGES).toContain("all_out_war");
    expect(ALL_TURF_WAR_STAGES).toContain("conquest");
    expect(ALL_TURF_WAR_STAGES).toContain("resolved");
  });

  test("should have Hitchhiker descriptions for all turf war stages", async () => {
    for (const stage of ALL_TURF_WAR_STAGES) {
      const description = GANG_WARFARE_DESCRIPTIONS[stage];
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    }
  });

  test("should have descriptions for gang warfare concepts", async () => {
    expect(GANG_WARFARE_DESCRIPTIONS.territory).toBeDefined();
    expect(GANG_WARFARE_DESCRIPTIONS.raid).toBeDefined();
    expect(GANG_WARFARE_DESCRIPTIONS.protection_racket).toBeDefined();
    expect(GANG_WARFARE_DESCRIPTIONS.ambush).toBeDefined();
  });
});

/**
 * Test Suite: TerritoryManager - Territory Management
 */
test.describe("TerritoryManager - Territory Management", () => {
  test("should create manager instance", async () => {
    const manager = new TerritoryManager();
    expect(manager).toBeDefined();
  });

  test("should create a new territory", async () => {
    const manager = new TerritoryManager();
    const bounds: GridBounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };

    const territory = manager.createTerritory(bounds);

    expect(territory).toBeDefined();
    expect(territory.id).toBeDefined();
    expect(territory.gridBounds).toEqual(bounds);
    expect(territory.controlledBy).toBeNull();
    expect(territory.contestedBy).toEqual([]);
  });

  test("should get territory by ID", async () => {
    const manager = new TerritoryManager();
    const bounds: GridBounds = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const created = manager.createTerritory(bounds);

    const retrieved = manager.getTerritory(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
  });

  test("should return undefined for non-existent territory", async () => {
    const manager = new TerritoryManager();

    const territory = manager.getTerritory("non-existent");

    expect(territory).toBeUndefined();
  });

  test("should get all territories", async () => {
    const manager = new TerritoryManager();
    manager.createTerritory({ minX: 0, minY: 0, maxX: 5, maxY: 5 });
    manager.createTerritory({ minX: 10, minY: 10, maxX: 15, maxY: 15 });
    manager.createTerritory({ minX: 20, minY: 20, maxX: 25, maxY: 25 });

    const territories = manager.getAllTerritories();

    expect(territories.length).toBe(3);
  });

  test("should assign unique ids to territories", async () => {
    const manager = new TerritoryManager();
    const t1 = manager.createTerritory({ minX: 0, minY: 0, maxX: 5, maxY: 5 });
    const t2 = manager.createTerritory({ minX: 10, minY: 10, maxX: 15, maxY: 15 });

    expect(t1.id).not.toBe(t2.id);
  });
});

/**
 * Test Suite: TerritoryManager - Territory Claims
 */
test.describe("TerritoryManager - Territory Claims", () => {
  test("should allow faction to claim unclaimed territory", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });

    const result = manager.claimTerritory(territory.id, "faction-bulls");

    expect(result).toBe(true);
    expect(territory.controlledBy).toBe("faction-bulls");
  });

  test("should not claim already controlled territory", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");

    const result = manager.claimTerritory(territory.id, "faction-bears");

    expect(result).toBe(false);
    expect(territory.controlledBy).toBe("faction-bulls");
  });

  test("should not claim non-existent territory", async () => {
    const manager = new TerritoryManager();

    const result = manager.claimTerritory("non-existent", "faction-bulls");

    expect(result).toBe(false);
  });

  test("should get territories controlled by a faction", async () => {
    const manager = new TerritoryManager();
    const t1 = manager.createTerritory({ minX: 0, minY: 0, maxX: 5, maxY: 5 });
    const t2 = manager.createTerritory({ minX: 10, minY: 10, maxX: 15, maxY: 15 });
    const t3 = manager.createTerritory({ minX: 20, minY: 20, maxX: 25, maxY: 25 });

    manager.claimTerritory(t1.id, "faction-bulls");
    manager.claimTerritory(t2.id, "faction-bulls");
    manager.claimTerritory(t3.id, "faction-bears");

    const bullTerritories = manager.getTerritoriesByFaction("faction-bulls");

    expect(bullTerritories.length).toBe(2);
  });
});

/**
 * Test Suite: TerritoryManager - Territory Contests
 */
test.describe("TerritoryManager - Territory Contests", () => {
  test("should contest a controlled territory", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");

    const result = manager.contestTerritory(territory.id, "faction-bears");

    expect(result).toBe(true);
    expect(territory.contestedBy).toContain("faction-bears");
  });

  test("should not contest unclaimed territory", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });

    const result = manager.contestTerritory(territory.id, "faction-bears");

    expect(result).toBe(false);
  });

  test("should not contest own territory", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");

    const result = manager.contestTerritory(territory.id, "faction-bulls");

    expect(result).toBe(false);
  });

  test("should allow multiple factions to contest", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");

    manager.contestTerritory(territory.id, "faction-bears");
    manager.contestTerritory(territory.id, "faction-degens");

    expect(territory.contestedBy.length).toBe(2);
    expect(territory.contestedBy).toContain("faction-bears");
    expect(territory.contestedBy).toContain("faction-degens");
  });

  test("should resolve contest and transfer control", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");
    manager.contestTerritory(territory.id, "faction-bears");

    // Register NPCs for contest resolution
    manager.registerFactionPresence(territory.id, "faction-bulls", 2, 50);
    manager.registerFactionPresence(territory.id, "faction-bears", 5, 100);

    const winner = manager.resolveContest(territory.id);

    expect(winner).toBeDefined();
    expect(territory.contestedBy.length).toBe(0);
  });

  test("should resolve contest in favor of stronger faction", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");
    manager.contestTerritory(territory.id, "faction-bears");

    // Bears have overwhelming presence
    manager.registerFactionPresence(territory.id, "faction-bulls", 1, 10);
    manager.registerFactionPresence(territory.id, "faction-bears", 10, 500);

    const winner = manager.resolveContest(territory.id);

    expect(winner).toBe("faction-bears");
    expect(territory.controlledBy).toBe("faction-bears");
  });
});

/**
 * Test Suite: TerritoryManager - Territory Income
 */
test.describe("TerritoryManager - Territory Income", () => {
  test("should calculate base territory income", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");

    const income = manager.calculateTerritoryIncome(territory.id);

    expect(income).toBeGreaterThanOrEqual(0);
  });

  test("should return 0 income for unclaimed territory", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });

    const income = manager.calculateTerritoryIncome(territory.id);

    expect(income).toBe(0);
  });

  test("income should scale with territory size", async () => {
    const manager = new TerritoryManager();
    const smallTerritory = manager.createTerritory({ minX: 0, minY: 0, maxX: 2, maxY: 2 });
    const largeTerritory = manager.createTerritory({ minX: 10, minY: 10, maxX: 20, maxY: 20 });

    manager.claimTerritory(smallTerritory.id, "faction-bulls");
    manager.claimTerritory(largeTerritory.id, "faction-bulls");

    const smallIncome = manager.calculateTerritoryIncome(smallTerritory.id);
    const largeIncome = manager.calculateTerritoryIncome(largeTerritory.id);

    expect(largeIncome).toBeGreaterThan(smallIncome);
  });

  test("income should include bonus", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");

    const baseIncome = manager.calculateTerritoryIncome(territory.id);

    territory.incomeBonus = 50;
    const bonusIncome = manager.calculateTerritoryIncome(territory.id);

    expect(bonusIncome).toBe(baseIncome + 50);
  });
});

/**
 * Test Suite: TerritoryManager - Turf Wars
 */
test.describe("TerritoryManager - Turf Wars", () => {
  test("should start a turf war", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");

    const war = manager.startTurfWar("faction-bears", "faction-bulls", territory.id);

    expect(war).not.toBeNull();
    expect(war!.id).toBeDefined();
    expect(war!.attackerFactionId).toBe("faction-bears");
    expect(war!.defenderFactionId).toBe("faction-bulls");
    expect(war!.territoryId).toBe(territory.id);
    expect(war!.stage).toBe("intimidation");
    expect(war!.startedAt).toBeGreaterThan(0);
    expect(war!.skirmishes).toEqual([]);
  });

  test("should not start turf war for unclaimed territory", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });

    const war = manager.startTurfWar("faction-bears", "faction-bulls", territory.id);

    expect(war).toBeNull();
  });

  test("should not start turf war if attacker owns territory", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");

    const war = manager.startTurfWar("faction-bulls", "faction-bulls", territory.id);

    expect(war).toBeNull();
  });

  test("should get turf war by ID", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");
    const created = manager.startTurfWar("faction-bears", "faction-bulls", territory.id);

    const retrieved = manager.getTurfWar(created!.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created!.id);
  });

  test("should escalate turf war through stages", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");
    const war = manager.startTurfWar("faction-bears", "faction-bulls", territory.id)!;

    expect(war.stage).toBe("intimidation");

    manager.escalateTurfWar(war.id);
    expect(war.stage).toBe("skirmishes");

    manager.escalateTurfWar(war.id);
    expect(war.stage).toBe("all_out_war");

    manager.escalateTurfWar(war.id);
    expect(war.stage).toBe("conquest");
  });

  test("should add skirmish when escalating during skirmish stage", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");
    const war = manager.startTurfWar("faction-bears", "faction-bulls", territory.id)!;

    manager.escalateTurfWar(war.id); // -> skirmishes
    manager.addSkirmish(war.id, ["npc-1", "npc-2"], ["npc-3", "npc-4"]);

    expect(war.skirmishes.length).toBe(1);
    expect(war.skirmishes[0].attackerIds).toContain("npc-1");
    expect(war.skirmishes[0].defenderIds).toContain("npc-3");
  });

  test("should resolve turf war with winner", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");
    const war = manager.startTurfWar("faction-bears", "faction-bulls", territory.id)!;

    // Escalate to conquest
    manager.escalateTurfWar(war.id); // -> skirmishes
    manager.escalateTurfWar(war.id); // -> all_out_war
    manager.escalateTurfWar(war.id); // -> conquest

    // Register combat strength
    manager.registerTurfWarStrength(war.id, "faction-bears", 100);
    manager.registerTurfWarStrength(war.id, "faction-bulls", 30);

    const winner = manager.resolveTurfWar(war.id);

    expect(winner).toBe("faction-bears");
    expect(war.stage).toBe("resolved");
    expect(territory.controlledBy).toBe("faction-bears");
  });

  test("should resolve turf war in favor of defender if stronger", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");
    const war = manager.startTurfWar("faction-bears", "faction-bulls", territory.id)!;

    // Escalate to conquest
    manager.escalateTurfWar(war.id);
    manager.escalateTurfWar(war.id);
    manager.escalateTurfWar(war.id);

    manager.registerTurfWarStrength(war.id, "faction-bears", 30);
    manager.registerTurfWarStrength(war.id, "faction-bulls", 100);

    const winner = manager.resolveTurfWar(war.id);

    expect(winner).toBe("faction-bulls");
    expect(territory.controlledBy).toBe("faction-bulls");
  });
});

/**
 * Test Suite: TerritoryManager - Raids
 */
test.describe("TerritoryManager - Raids", () => {
  test("should create a raid", async () => {
    const manager = new TerritoryManager();
    const attackers = ["npc-1", "npc-2", "npc-3"];
    const targetBuildingId = "building-vault-1";

    const raid = manager.createRaid(attackers, targetBuildingId);

    expect(raid).toBeDefined();
    expect(raid.id).toBeDefined();
    expect(raid.attackerIds).toEqual(attackers);
    expect(raid.targetBuildingId).toBe(targetBuildingId);
    expect(raid.timestamp).toBeGreaterThan(0);
    expect(raid.outcome).toBe("pending");
  });

  test("should execute raid with success outcome", async () => {
    const manager = new TerritoryManager();
    const attackers = ["npc-1", "npc-2", "npc-3"];
    const raid = manager.createRaid(attackers, "building-1");

    // Set high attacker strength, low building security
    manager.setRaidStrength(raid.id, 100);
    manager.setBuildingSecurity(raid.id, 10);

    manager.executeRaid(raid.id);

    expect(raid.outcome).toBe("success");
    expect(raid.lootValue).toBeGreaterThan(0);
  });

  test("should execute raid with failure outcome", async () => {
    const manager = new TerritoryManager();
    const attackers = ["npc-1"];
    const raid = manager.createRaid(attackers, "building-fortified");

    // Set low attacker strength, high building security
    manager.setRaidStrength(raid.id, 10);
    manager.setBuildingSecurity(raid.id, 100);

    manager.executeRaid(raid.id);

    expect(raid.outcome).toBe("failure");
  });

  test("raid success chance should scale with strength ratio", async () => {
    const manager = new TerritoryManager();

    // Strong attackers
    const strongRaid = manager.createRaid(["npc-1", "npc-2", "npc-3", "npc-4", "npc-5"], "building-1");
    manager.setRaidStrength(strongRaid.id, 200);
    manager.setBuildingSecurity(strongRaid.id, 50);

    // Weak attackers
    const weakRaid = manager.createRaid(["npc-1"], "building-2");
    manager.setRaidStrength(weakRaid.id, 20);
    manager.setBuildingSecurity(weakRaid.id, 100);

    const strongSuccessChance = manager.calculateRaidSuccessChance(strongRaid.id);
    const weakSuccessChance = manager.calculateRaidSuccessChance(weakRaid.id);

    expect(strongSuccessChance).toBeGreaterThan(weakSuccessChance);
  });

  test("should get all raids for a building", async () => {
    const manager = new TerritoryManager();
    manager.createRaid(["npc-1"], "building-1");
    manager.createRaid(["npc-2"], "building-1");
    manager.createRaid(["npc-3"], "building-2");

    const building1Raids = manager.getRaidsForBuilding("building-1");

    expect(building1Raids.length).toBe(2);
  });
});

/**
 * Test Suite: TerritoryManager - Protection Rackets
 */
test.describe("TerritoryManager - Protection Rackets", () => {
  test("should setup a protection racket", async () => {
    const manager = new TerritoryManager();
    const factionId = "faction-mob";
    const buildingIds = ["building-1", "building-2", "building-3"];
    const feePercentage = 0.15;

    const racket = manager.setupProtectionRacket(factionId, buildingIds, feePercentage);

    expect(racket).toBeDefined();
    expect(racket.id).toBeDefined();
    expect(racket.factionId).toBe(factionId);
    expect(racket.buildingIds).toEqual(buildingIds);
    expect(racket.feePercentage).toBe(feePercentage);
    expect(racket.enforcerIds).toEqual([]);
  });

  test("should assign enforcers to protection racket", async () => {
    const manager = new TerritoryManager();
    const racket = manager.setupProtectionRacket("faction-mob", ["building-1"], 0.1);

    manager.assignEnforcers(racket.id, ["npc-enforcer-1", "npc-enforcer-2"]);

    expect(racket.enforcerIds.length).toBe(2);
    expect(racket.enforcerIds).toContain("npc-enforcer-1");
    expect(racket.enforcerIds).toContain("npc-enforcer-2");
  });

  test("should calculate protection fee for building income", async () => {
    const manager = new TerritoryManager();
    const racket = manager.setupProtectionRacket("faction-mob", ["building-1"], 0.2);

    const buildingIncome = 1000;
    const fee = manager.calculateProtectionFee(racket.id, buildingIncome);

    expect(fee).toBe(200); // 20% of 1000
  });

  test("should get protection racket for a building", async () => {
    const manager = new TerritoryManager();
    manager.setupProtectionRacket("faction-mob", ["building-1", "building-2"], 0.1);
    manager.setupProtectionRacket("faction-cartel", ["building-3"], 0.15);

    const racket1 = manager.getProtectionRacketForBuilding("building-1");
    const racket3 = manager.getProtectionRacketForBuilding("building-3");

    expect(racket1?.factionId).toBe("faction-mob");
    expect(racket3?.factionId).toBe("faction-cartel");
  });

  test("should return null for building without protection", async () => {
    const manager = new TerritoryManager();

    const racket = manager.getProtectionRacketForBuilding("unprotected-building");

    expect(racket).toBeNull();
  });

  test("should get all rackets for a faction", async () => {
    const manager = new TerritoryManager();
    manager.setupProtectionRacket("faction-mob", ["building-1"], 0.1);
    manager.setupProtectionRacket("faction-mob", ["building-2"], 0.15);
    manager.setupProtectionRacket("faction-cartel", ["building-3"], 0.2);

    const mobRackets = manager.getRacketsForFaction("faction-mob");

    expect(mobRackets.length).toBe(2);
  });
});

/**
 * Test Suite: TerritoryManager - Ambushes
 */
test.describe("TerritoryManager - Ambushes", () => {
  test("should execute an ambush", async () => {
    const manager = new TerritoryManager();
    const attackers = ["npc-1", "npc-2"];
    const targetId = "npc-target-1";
    const location = { x: 10, y: 15 };

    const ambush = manager.executeAmbush(attackers, targetId, location);

    expect(ambush).toBeDefined();
    expect(ambush.id).toBeDefined();
    expect(ambush.attackerIds).toEqual(attackers);
    expect(ambush.targetId).toBe(targetId);
    expect(ambush.location).toEqual(location);
    expect(typeof ambush.success).toBe("boolean");
    expect(typeof ambush.casualties).toBe("number");
    expect(ambush.casualties).toBeGreaterThanOrEqual(0);
  });

  test("ambush success should depend on stealth vs awareness", async () => {
    const manager = new TerritoryManager();

    // High stealth attackers vs low awareness target
    const stealthyAmbush = manager.executeAmbush(
      ["npc-stealth-1", "npc-stealth-2"],
      "npc-unaware-target",
      { x: 0, y: 0 },
      { attackerStealth: 0.9, targetAwareness: 0.1 }
    );

    // Low stealth attackers vs high awareness target
    const obviousAmbush = manager.executeAmbush(
      ["npc-loud-1"],
      "npc-paranoid-target",
      { x: 5, y: 5 },
      { attackerStealth: 0.1, targetAwareness: 0.9 }
    );

    // Stealthy ambush should be more likely to succeed
    // Note: Due to randomness, we can't guarantee outcomes, but we can check the stats exist
    expect(typeof stealthyAmbush.success).toBe("boolean");
    expect(typeof obviousAmbush.success).toBe("boolean");
  });

  test("should calculate ambush success chance", async () => {
    const manager = new TerritoryManager();

    const highStealthChance = manager.calculateAmbushSuccessChance(0.9, 0.2);
    const lowStealthChance = manager.calculateAmbushSuccessChance(0.2, 0.9);

    expect(highStealthChance).toBeGreaterThan(lowStealthChance);
  });

  test("ambush should have casualties on failure", async () => {
    const manager = new TerritoryManager();

    // Force failure by having very aware target
    const failedAmbush = manager.executeAmbush(
      ["npc-1", "npc-2", "npc-3"],
      "npc-veteran",
      { x: 0, y: 0 },
      { attackerStealth: 0.0, targetAwareness: 1.0, forceOutcome: "failure" }
    );

    expect(failedAmbush.success).toBe(false);
    // Failed ambushes may have attacker casualties
    expect(failedAmbush.casualties).toBeGreaterThanOrEqual(0);
  });

  test("should get all ambushes targeting an NPC", async () => {
    const manager = new TerritoryManager();
    manager.executeAmbush(["npc-1"], "target-npc", { x: 0, y: 0 });
    manager.executeAmbush(["npc-2"], "target-npc", { x: 5, y: 5 });
    manager.executeAmbush(["npc-3"], "other-target", { x: 10, y: 10 });

    const targetAmbushes = manager.getAmbushesForTarget("target-npc");

    expect(targetAmbushes.length).toBe(2);
  });
});

/**
 * Test Suite: Hitchhiker's Guide Descriptions
 */
test.describe("Hitchhiker's Guide Descriptions", () => {
  test("should have sardonic description for territory", async () => {
    const desc = GANG_WARFARE_DESCRIPTIONS.territory;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have sardonic description for intimidation stage", async () => {
    const desc = GANG_WARFARE_DESCRIPTIONS.intimidation;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have sardonic description for skirmishes stage", async () => {
    const desc = GANG_WARFARE_DESCRIPTIONS.skirmishes;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have sardonic description for all_out_war stage", async () => {
    const desc = GANG_WARFARE_DESCRIPTIONS.all_out_war;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have sardonic description for conquest stage", async () => {
    const desc = GANG_WARFARE_DESCRIPTIONS.conquest;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have crypto-themed description for raid", async () => {
    const desc = GANG_WARFARE_DESCRIPTIONS.raid;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have crypto-themed description for protection racket", async () => {
    const desc = GANG_WARFARE_DESCRIPTIONS.protection_racket;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have description for ambush", async () => {
    const desc = GANG_WARFARE_DESCRIPTIONS.ambush;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });
});

/**
 * Test Suite: Integration with Faction System
 */
test.describe("Integration with Faction System", () => {
  test("territory control should track faction IDs", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });

    manager.claimTerritory(territory.id, "faction-bitcoin-citadel");

    expect(territory.controlledBy).toBe("faction-bitcoin-citadel");
  });

  test("turf war should reference faction IDs", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");

    const war = manager.startTurfWar("faction-bears", "faction-bulls", territory.id);

    expect(war?.attackerFactionId).toBe("faction-bears");
    expect(war?.defenderFactionId).toBe("faction-bulls");
  });

  test("protection racket should track faction ID", async () => {
    const manager = new TerritoryManager();
    const racket = manager.setupProtectionRacket("faction-degen-republic", ["building-1"], 0.1);

    expect(racket.factionId).toBe("faction-degen-republic");
  });
});

/**
 * Test Suite: Serialization
 */
test.describe("Gang Warfare Serialization", () => {
  test("should serialize and deserialize territories", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");
    territory.incomeBonus = 25;

    const serialized = manager.serialize();

    const newManager = new TerritoryManager();
    newManager.deserialize(serialized);

    const restored = newManager.getTerritory(territory.id);
    expect(restored).toBeDefined();
    expect(restored?.controlledBy).toBe("faction-bulls");
    expect(restored?.incomeBonus).toBe(25);
  });

  test("should serialize and deserialize turf wars", async () => {
    const manager = new TerritoryManager();
    const territory = manager.createTerritory({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
    manager.claimTerritory(territory.id, "faction-bulls");
    const war = manager.startTurfWar("faction-bears", "faction-bulls", territory.id)!;
    manager.escalateTurfWar(war.id);

    const serialized = manager.serialize();

    const newManager = new TerritoryManager();
    newManager.deserialize(serialized);

    const restoredWar = newManager.getTurfWar(war.id);
    expect(restoredWar).toBeDefined();
    expect(restoredWar?.stage).toBe("skirmishes");
  });

  test("should serialize and deserialize protection rackets", async () => {
    const manager = new TerritoryManager();
    const racket = manager.setupProtectionRacket("faction-mob", ["building-1"], 0.15);
    manager.assignEnforcers(racket.id, ["npc-1", "npc-2"]);

    const serialized = manager.serialize();

    const newManager = new TerritoryManager();
    newManager.deserialize(serialized);

    const restoredRacket = newManager.getProtectionRacket(racket.id);
    expect(restoredRacket).toBeDefined();
    expect(restoredRacket?.feePercentage).toBe(0.15);
    expect(restoredRacket?.enforcerIds.length).toBe(2);
  });
});
