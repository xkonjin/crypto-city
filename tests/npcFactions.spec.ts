import { test, expect } from "@playwright/test";

/**
 * NPC Faction System Tests (#113)
 * 
 * TDD Phase 1: Tests for the NPC faction system including:
 * - Faction types and interfaces
 * - Faction templates
 * - FactionManager class
 * - Ideology alignment calculations
 * - Faction relationships
 */

// Import types and classes directly for unit testing
import type {
  Faction,
  FactionIdeology,
  FactionRelation,
} from "@/lib/npc/factions";
import {
  FACTION_TEMPLATES,
  FACTION_DESCRIPTIONS,
  createDefaultFaction,
  createFactionIdeology,
} from "@/lib/npc/factions";
import { FactionManager } from "@/lib/npc/FactionManager";
import { createDefaultPersonality } from "@/lib/npc/personality";
import type { CryptoNPC } from "@/lib/npc";

/**
 * Test Suite: Faction Types
 */
test.describe("Faction Types", () => {
  test("should define Faction interface with all required properties", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'founder-npc-1');

    expect(typeof faction.id).toBe('string');
    expect(typeof faction.name).toBe('string');
    expect(typeof faction.description).toBe('string');
    expect(faction.ideology).toBeDefined();
    
    // Leadership
    expect(faction.leaderId).toBeDefined();
    expect(Array.isArray(faction.councilIds)).toBe(true);
    
    // Members
    expect(faction.memberIds instanceof Set).toBe(true);
    
    // Territory
    expect(faction.headquartersBuilding === null || typeof faction.headquartersBuilding === 'string').toBe(true);
    expect(Array.isArray(faction.controlledBuildings)).toBe(true);
    
    // Resources
    expect(typeof faction.treasury).toBe('number');
    
    // Relations
    expect(typeof faction.relations).toBe('object');
    
    // Rules
    expect(typeof faction.taxRate).toBe('number');
    expect(faction.taxRate).toBeGreaterThanOrEqual(0);
    expect(faction.taxRate).toBeLessThanOrEqual(1);
    
    // Culture
    expect(typeof faction.motto).toBe('string');
    expect(typeof faction.foundedAt).toBe('number');
  });

  test("should define FactionIdeology with all required properties", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'founder-1');
    const ideology = faction.ideology;

    expect(['communist', 'socialist', 'mixed', 'capitalist', 'ancap']).toContain(ideology.economic);
    expect(['autocracy', 'oligarchy', 'democracy', 'dao', 'anarchy']).toContain(ideology.governance);
    expect(['btc_maxi', 'eth_aligned', 'multi_chain', 'tradfi_hybrid', 'privacy_first']).toContain(ideology.cryptoPhilosophy);
  });

  test("should define FactionRelation with all required properties", async () => {
    const manager = new FactionManager();
    const faction1 = manager.createFaction('bitcoin_citadel', 'founder-1');
    const faction2 = manager.createFaction('ethereum_collective', 'founder-2');

    manager.updateRelation(faction1.id, faction2.id, -30);

    const relation = faction1.relations[faction2.id];
    expect(relation).toBeDefined();
    expect(typeof relation.targetFactionId).toBe('string');
    expect(typeof relation.standing).toBe('number');
    expect(relation.standing).toBeGreaterThanOrEqual(-100);
    expect(relation.standing).toBeLessThanOrEqual(100);
    expect(['allied', 'friendly', 'neutral', 'hostile', 'war']).toContain(relation.status);
  });

  test("createDefaultFaction should create faction with default values", async () => {
    const faction = createDefaultFaction({
      id: 'test-faction',
      name: 'Test Faction',
      leaderId: 'leader-1',
    });

    expect(faction.id).toBe('test-faction');
    expect(faction.name).toBe('Test Faction');
    expect(faction.leaderId).toBe('leader-1');
    expect(faction.treasury).toBe(0);
    expect(faction.taxRate).toBe(0.1);
    expect(faction.memberIds.size).toBe(0);
  });

  test("createFactionIdeology should create ideology with defaults", async () => {
    const ideology = createFactionIdeology();

    expect(ideology.economic).toBe('mixed');
    expect(ideology.governance).toBe('democracy');
    expect(ideology.cryptoPhilosophy).toBe('multi_chain');
  });

  test("createFactionIdeology should allow overrides", async () => {
    const ideology = createFactionIdeology({
      economic: 'ancap',
      cryptoPhilosophy: 'btc_maxi',
    });

    expect(ideology.economic).toBe('ancap');
    expect(ideology.governance).toBe('democracy');
    expect(ideology.cryptoPhilosophy).toBe('btc_maxi');
  });
});

/**
 * Test Suite: Faction Templates
 */
test.describe("Faction Templates", () => {
  test("should define all 5 predefined faction templates", async () => {
    const templates = Object.keys(FACTION_TEMPLATES);
    
    expect(templates.length).toBeGreaterThanOrEqual(5);
    expect(templates).toContain('bitcoin_citadel');
    expect(templates).toContain('ethereum_collective');
    expect(templates).toContain('degen_republic');
    expect(templates).toContain('privacy_underground');
    expect(templates).toContain('tradfi_heights');
  });

  test("bitcoin_citadel should have correct ideology", async () => {
    const template = FACTION_TEMPLATES['bitcoin_citadel'];

    expect(template.name).toBe("The Bitcoin Citadel");
    expect(template.ideology?.economic).toBe('capitalist');
    expect(template.ideology?.governance).toBe('oligarchy');
    expect(template.ideology?.cryptoPhilosophy).toBe('btc_maxi');
    expect(template.motto).toBe("There is no second best.");
  });

  test("ethereum_collective should have DAO governance", async () => {
    const template = FACTION_TEMPLATES['ethereum_collective'];

    expect(template.name).toBe("The Ethereum Collective");
    expect(template.ideology?.governance).toBe('dao');
    expect(template.ideology?.cryptoPhilosophy).toBe('eth_aligned');
    expect(template.motto).toBe("Code is law.");
  });

  test("degen_republic should have anarchy governance", async () => {
    const template = FACTION_TEMPLATES['degen_republic'];

    expect(template.name).toBe("Degen Republic");
    expect(template.ideology?.economic).toBe('ancap');
    expect(template.ideology?.governance).toBe('anarchy');
    expect(template.ideology?.cryptoPhilosophy).toBe('multi_chain');
    expect(template.motto).toBe("YOLO or go home.");
  });

  test("privacy_underground should be privacy focused", async () => {
    const template = FACTION_TEMPLATES['privacy_underground'];

    expect(template.name).toBe("The Privacy Underground");
    expect(template.ideology?.cryptoPhilosophy).toBe('privacy_first');
    expect(template.motto).toBe("If they can see it, they can seize it.");
  });

  test("tradfi_heights should be tradfi hybrid", async () => {
    const template = FACTION_TEMPLATES['tradfi_heights'];

    expect(template.name).toBe("TradFi Heights");
    expect(template.ideology?.cryptoPhilosophy).toBe('tradfi_hybrid');
    expect(template.ideology?.governance).toBe('democracy');
    expect(template.motto).toBe("Regulation is our friend.");
  });

  test("all templates should have descriptions", async () => {
    for (const [key, template] of Object.entries(FACTION_TEMPLATES)) {
      expect(typeof template.description).toBe('string');
      expect(template.description!.length).toBeGreaterThan(0);
    }
  });

  test("all templates should have mottos", async () => {
    for (const [key, template] of Object.entries(FACTION_TEMPLATES)) {
      expect(typeof template.motto).toBe('string');
      expect(template.motto!.length).toBeGreaterThan(0);
    }
  });
});

/**
 * Test Suite: FactionManager - CRUD Operations
 */
test.describe("FactionManager - CRUD Operations", () => {
  test("should create faction from template", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'founder-npc-1');

    expect(faction).toBeDefined();
    expect(faction.id).toBeDefined();
    expect(faction.name).toBe("The Bitcoin Citadel");
    expect(faction.leaderId).toBe('founder-npc-1');
    expect(faction.memberIds.has('founder-npc-1')).toBe(true);
    expect(faction.foundedAt).toBeGreaterThan(0);
  });

  test("should get faction by id", async () => {
    const manager = new FactionManager();
    const created = manager.createFaction('bitcoin_citadel', 'founder-1');

    const retrieved = manager.getFaction(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.name).toBe("The Bitcoin Citadel");
  });

  test("should return null for non-existent faction", async () => {
    const manager = new FactionManager();
    const faction = manager.getFaction('non-existent');
    expect(faction).toBeNull();
  });

  test("should get all factions", async () => {
    const manager = new FactionManager();
    manager.createFaction('bitcoin_citadel', 'founder-1');
    manager.createFaction('ethereum_collective', 'founder-2');
    manager.createFaction('degen_republic', 'founder-3');

    const factions = manager.getAllFactions();
    expect(factions.length).toBe(3);
  });

  test("should assign unique ids to factions", async () => {
    const manager = new FactionManager();
    const f1 = manager.createFaction('bitcoin_citadel', 'founder-1');
    const f2 = manager.createFaction('bitcoin_citadel', 'founder-2');

    expect(f1.id).not.toBe(f2.id);
  });
});

/**
 * Test Suite: FactionManager - Membership
 */
test.describe("FactionManager - Membership", () => {
  test("should allow NPC to join faction", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');

    const result = manager.joinFaction('npc-1', faction.id);

    expect(result).toBe(true);
    expect(faction.memberIds.has('npc-1')).toBe(true);
  });

  test("should not join non-existent faction", async () => {
    const manager = new FactionManager();

    const result = manager.joinFaction('npc-1', 'non-existent');

    expect(result).toBe(false);
  });

  test("should track NPC faction membership", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');
    manager.joinFaction('npc-1', faction.id);

    const npcFaction = manager.getNPCFaction('npc-1');

    expect(npcFaction).toBeDefined();
    expect(npcFaction?.id).toBe(faction.id);
  });

  test("should return null for NPC not in any faction", async () => {
    const manager = new FactionManager();

    const npcFaction = manager.getNPCFaction('npc-without-faction');

    expect(npcFaction).toBeNull();
  });

  test("should allow NPC to leave faction", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');
    manager.joinFaction('npc-1', faction.id);

    const result = manager.leaveFaction('npc-1');

    expect(result).toBe(true);
    expect(faction.memberIds.has('npc-1')).toBe(false);
    expect(manager.getNPCFaction('npc-1')).toBeNull();
  });

  test("should not leave if not in any faction", async () => {
    const manager = new FactionManager();

    const result = manager.leaveFaction('npc-not-in-faction');

    expect(result).toBe(false);
  });

  test("should get all faction members", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');
    manager.joinFaction('npc-1', faction.id);
    manager.joinFaction('npc-2', faction.id);
    manager.joinFaction('npc-3', faction.id);

    const members = manager.getFactionMembers(faction.id);

    expect(members.length).toBe(4); // leader + 3 NPCs
    expect(members).toContain('leader-1');
    expect(members).toContain('npc-1');
    expect(members).toContain('npc-2');
    expect(members).toContain('npc-3');
  });

  test("should prevent joining multiple factions", async () => {
    const manager = new FactionManager();
    const faction1 = manager.createFaction('bitcoin_citadel', 'leader-1');
    const faction2 = manager.createFaction('ethereum_collective', 'leader-2');

    manager.joinFaction('npc-1', faction1.id);
    const result = manager.joinFaction('npc-1', faction2.id);

    expect(result).toBe(false);
    expect(manager.getNPCFaction('npc-1')?.id).toBe(faction1.id);
  });
});

/**
 * Test Suite: FactionManager - Leadership
 */
test.describe("FactionManager - Leadership", () => {
  test("founder should become leader", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'founder-1');

    expect(faction.leaderId).toBe('founder-1');
  });

  test("should elect new leader", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'original-leader');
    manager.joinFaction('npc-1', faction.id);
    manager.joinFaction('npc-2', faction.id);
    manager.joinFaction('npc-3', faction.id);

    const newLeaderId = manager.electLeader(faction.id);

    expect(newLeaderId).toBeDefined();
    expect(faction.memberIds.has(newLeaderId!)).toBe(true);
    expect(faction.leaderId).toBe(newLeaderId);
  });

  test("should return null for empty faction election", async () => {
    const manager = new FactionManager();

    const result = manager.electLeader('non-existent');

    expect(result).toBeNull();
  });

  test("should appoint council members", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');
    manager.joinFaction('council-1', faction.id);
    manager.joinFaction('council-2', faction.id);

    manager.appointCouncil(faction.id, ['council-1', 'council-2']);

    expect(faction.councilIds.length).toBe(2);
    expect(faction.councilIds).toContain('council-1');
    expect(faction.councilIds).toContain('council-2');
  });

  test("should only appoint members as council", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');
    manager.joinFaction('member-1', faction.id);

    manager.appointCouncil(faction.id, ['member-1', 'non-member']);

    expect(faction.councilIds.length).toBe(1);
    expect(faction.councilIds).toContain('member-1');
  });
});

/**
 * Test Suite: FactionManager - Relations
 */
test.describe("FactionManager - Relations", () => {
  test("should update relation between factions", async () => {
    const manager = new FactionManager();
    const f1 = manager.createFaction('bitcoin_citadel', 'leader-1');
    const f2 = manager.createFaction('ethereum_collective', 'leader-2');

    manager.updateRelation(f1.id, f2.id, 30);

    const relation = f1.relations[f2.id];
    expect(relation).toBeDefined();
    expect(relation.standing).toBe(30);
    expect(relation.status).toBe('friendly');
  });

  test("should update relation bidirectionally", async () => {
    const manager = new FactionManager();
    const f1 = manager.createFaction('bitcoin_citadel', 'leader-1');
    const f2 = manager.createFaction('ethereum_collective', 'leader-2');

    manager.updateRelation(f1.id, f2.id, -50);

    expect(f1.relations[f2.id].standing).toBe(-50);
    expect(f2.relations[f1.id].standing).toBe(-50);
  });

  test("should clamp relation standing to -100 to 100", async () => {
    const manager = new FactionManager();
    const f1 = manager.createFaction('bitcoin_citadel', 'leader-1');
    const f2 = manager.createFaction('ethereum_collective', 'leader-2');

    manager.updateRelation(f1.id, f2.id, 200);
    expect(f1.relations[f2.id].standing).toBe(100);

    manager.updateRelation(f1.id, f2.id, -200);
    expect(f1.relations[f2.id].standing).toBeLessThanOrEqual(-100);
  });

  test("should derive correct relation status from standing", async () => {
    const manager = new FactionManager();
    const f1 = manager.createFaction('bitcoin_citadel', 'leader-1');
    const f2 = manager.createFaction('ethereum_collective', 'leader-2');

    // Allied: 75+
    manager.updateRelation(f1.id, f2.id, 80);
    expect(manager.getRelationStatus(f1.id, f2.id)).toBe('allied');

    // Reset and test other statuses
    f1.relations = {};
    f2.relations = {};

    // Friendly: 25 to 74
    manager.updateRelation(f1.id, f2.id, 40);
    expect(manager.getRelationStatus(f1.id, f2.id)).toBe('friendly');

    // Reset
    f1.relations = {};
    f2.relations = {};

    // Neutral: -24 to 24
    manager.updateRelation(f1.id, f2.id, 0);
    expect(manager.getRelationStatus(f1.id, f2.id)).toBe('neutral');

    // Reset
    f1.relations = {};
    f2.relations = {};

    // Hostile: -25 to -74
    manager.updateRelation(f1.id, f2.id, -50);
    expect(manager.getRelationStatus(f1.id, f2.id)).toBe('hostile');

    // Reset
    f1.relations = {};
    f2.relations = {};

    // War: -75 or below
    manager.updateRelation(f1.id, f2.id, -80);
    expect(manager.getRelationStatus(f1.id, f2.id)).toBe('war');
  });

  test("should return neutral for unrelated factions", async () => {
    const manager = new FactionManager();
    const f1 = manager.createFaction('bitcoin_citadel', 'leader-1');
    const f2 = manager.createFaction('ethereum_collective', 'leader-2');

    const status = manager.getRelationStatus(f1.id, f2.id);
    expect(status).toBe('neutral');
  });
});

/**
 * Test Suite: FactionManager - Treasury
 */
test.describe("FactionManager - Treasury", () => {
  test("should collect taxes from members", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');
    faction.taxRate = 0.1;

    // Simulate having income to tax
    const collected = manager.collectTaxes(faction.id, [
      { npcId: 'leader-1', income: 100 },
    ]);

    expect(collected).toBe(10);
    expect(faction.treasury).toBe(10);
  });

  test("should pay from treasury", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');
    faction.treasury = 100;

    const result = manager.payFromTreasury(faction.id, 30);

    expect(result).toBe(true);
    expect(faction.treasury).toBe(70);
  });

  test("should not pay more than treasury balance", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');
    faction.treasury = 50;

    const result = manager.payFromTreasury(faction.id, 100);

    expect(result).toBe(false);
    expect(faction.treasury).toBe(50);
  });

  test("should return 0 for non-existent faction taxes", async () => {
    const manager = new FactionManager();

    const collected = manager.collectTaxes('non-existent', []);

    expect(collected).toBe(0);
  });
});

/**
 * Test Suite: FactionManager - Ideology Alignment
 */
test.describe("FactionManager - Ideology Alignment", () => {
  test("should calculate alignment for BTC maxi personality with Bitcoin Citadel", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');

    // BTC maxi personality: low openness, high conscientiousness
    const personality = createDefaultPersonality({
      bigFive: { openness: 0.2, conscientiousness: 0.8 },
      crypto: { trustInInstitutions: 0.1, riskTolerance: 0.3 },
    });

    const mockNPC = { personality } as CryptoNPC;
    const alignment = manager.calculateIdeologyAlignment(mockNPC, faction);

    expect(alignment).toBeGreaterThan(0.5);
  });

  test("should calculate lower alignment for degen with Bitcoin Citadel", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');

    // Degen personality: high openness, high risk, high degen
    const personality = createDefaultPersonality({
      bigFive: { openness: 0.9, conscientiousness: 0.2 },
      crypto: { riskTolerance: 0.9, degenLevel: 0.9 },
    });

    const mockNPC = { personality } as CryptoNPC;
    const alignment = manager.calculateIdeologyAlignment(mockNPC, faction);

    expect(alignment).toBeLessThan(0.5);
  });

  test("should calculate high alignment for degen with Degen Republic", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('degen_republic', 'leader-1');

    // Degen personality
    const personality = createDefaultPersonality({
      bigFive: { conscientiousness: 0.2 },
      crypto: { riskTolerance: 0.9, degenLevel: 0.9 },
    });

    const mockNPC = { personality } as CryptoNPC;
    const alignment = manager.calculateIdeologyAlignment(mockNPC, faction);

    expect(alignment).toBeGreaterThan(0.5);
  });

  test("should calculate high alignment for privacy-focused NPC with Privacy Underground", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('privacy_underground', 'leader-1');

    // Privacy-focused personality
    const personality = createDefaultPersonality({
      crypto: { trustInInstitutions: 0.1 },
    });

    const mockNPC = { personality } as CryptoNPC;
    const alignment = manager.calculateIdeologyAlignment(mockNPC, faction);

    expect(alignment).toBeGreaterThan(0.3);
  });

  test("alignment should be between 0 and 1", async () => {
    const manager = new FactionManager();

    for (const templateKey of Object.keys(FACTION_TEMPLATES)) {
      const faction = manager.createFaction(templateKey, 'leader-1');

      // Test with extreme personalities
      const extremePersonality = createDefaultPersonality({
        bigFive: {
          openness: Math.random(),
          conscientiousness: Math.random(),
          extraversion: Math.random(),
          agreeableness: Math.random(),
          neuroticism: Math.random(),
        },
        crypto: {
          riskTolerance: Math.random(),
          fomo: Math.random(),
          trustInInstitutions: Math.random(),
          technicalKnowledge: Math.random(),
          degenLevel: Math.random(),
        },
      });

      const mockNPC = { personality: extremePersonality } as CryptoNPC;
      const alignment = manager.calculateIdeologyAlignment(mockNPC, faction);

      expect(alignment).toBeGreaterThanOrEqual(0);
      expect(alignment).toBeLessThanOrEqual(1);
    }
  });

  test("should suggest faction for NPC based on personality", async () => {
    const manager = new FactionManager();
    manager.createFaction('bitcoin_citadel', 'leader-1');
    manager.createFaction('degen_republic', 'leader-2');
    manager.createFaction('privacy_underground', 'leader-3');

    // BTC maxi personality
    const btcMaxiPersonality = createDefaultPersonality({
      bigFive: { openness: 0.2, conscientiousness: 0.8 },
      crypto: { trustInInstitutions: 0.1, riskTolerance: 0.3 },
    });

    const btcMaxiNPC = { personality: btcMaxiPersonality } as CryptoNPC;
    const suggested = manager.suggestFaction(btcMaxiNPC);

    expect(suggested).toBeDefined();
  });

  test("should return null if no factions exist", async () => {
    const manager = new FactionManager();

    const personality = createDefaultPersonality();
    const mockNPC = { personality } as CryptoNPC;
    const suggested = manager.suggestFaction(mockNPC);

    expect(suggested).toBeNull();
  });
});

/**
 * Test Suite: Hitchhiker's Guide Descriptions
 */
test.describe("Faction Descriptions", () => {
  test("should have all required Hitchhiker's Guide descriptions", async () => {
    expect(FACTION_DESCRIPTIONS.joining).toBeDefined();
    expect(FACTION_DESCRIPTIONS.leadership).toBeDefined();
    expect(FACTION_DESCRIPTIONS.treasury).toBeDefined();
    expect(FACTION_DESCRIPTIONS.taxes).toBeDefined();
    expect(FACTION_DESCRIPTIONS.relations).toBeDefined();
  });

  test("descriptions should be sardonic and crypto-themed", async () => {
    expect(FACTION_DESCRIPTIONS.joining.toLowerCase()).toContain('decentralized');
    expect(FACTION_DESCRIPTIONS.leadership.toLowerCase()).toContain('tokens');
    expect(FACTION_DESCRIPTIONS.treasury.toLowerCase()).toContain('honeypot');
    expect(FACTION_DESCRIPTIONS.taxes.toLowerCase()).toContain('collective');
    expect(FACTION_DESCRIPTIONS.relations.toLowerCase()).toContain('wrong');
  });
});

/**
 * Test Suite: Serialization
 */
test.describe("Faction Serialization", () => {
  test("should serialize and deserialize factions", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');
    manager.joinFaction('npc-1', faction.id);
    manager.joinFaction('npc-2', faction.id);

    const serialized = manager.serialize();
    
    const newManager = new FactionManager();
    newManager.deserialize(serialized);

    const restored = newManager.getFaction(faction.id);
    expect(restored).toBeDefined();
    expect(restored?.name).toBe(faction.name);
    expect(restored?.memberIds.size).toBe(faction.memberIds.size);
  });

  test("should restore NPC-faction mappings after deserialization", async () => {
    const manager = new FactionManager();
    const faction = manager.createFaction('bitcoin_citadel', 'leader-1');
    manager.joinFaction('npc-1', faction.id);

    const serialized = manager.serialize();
    
    const newManager = new FactionManager();
    newManager.deserialize(serialized);

    expect(newManager.getNPCFaction('npc-1')?.id).toBe(faction.id);
  });
});
