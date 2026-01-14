import { test, expect } from "@playwright/test";

/**
 * NPC Diplomacy System Tests (#192)
 *
 * TDD Phase 1: Tests for the Peace Treaties & Diplomacy system including:
 * - Treaty types and terms
 * - Treaty negotiations (propose, counter, accept, reject)
 * - Treaty violations and expiration
 * - Alliances (form, join, leave, dissolve)
 * - Diplomatic stance and reputation
 * - Hitchhiker's Guide style descriptions
 */

// Import types and classes directly for unit testing
import type {
  Treaty,
  TreatyType,
  TreatyTerm,
  TermType,
  Alliance,
  DiplomaticStance,
  NegotiationSession,
} from "@/lib/npc/diplomacy";
import {
  ALL_TREATY_TYPES,
  ALL_TERM_TYPES,
  ALL_DIPLOMATIC_STANCES,
  DIPLOMACY_DESCRIPTIONS,
  createDefaultTreaty,
  createDefaultAlliance,
  createDefaultNegotiationSession,
} from "@/lib/npc/diplomacy";
import { DiplomacyManager } from "@/lib/npc/DiplomacyManager";

// ============================================================================
// Test Suite: Treaty Types
// ============================================================================
test.describe("Treaty Types", () => {
  test("should define all 5 treaty types", async () => {
    expect(ALL_TREATY_TYPES.length).toBe(5);
    expect(ALL_TREATY_TYPES).toContain("peace");
    expect(ALL_TREATY_TYPES).toContain("alliance");
    expect(ALL_TREATY_TYPES).toContain("trade");
    expect(ALL_TREATY_TYPES).toContain("non_aggression");
    expect(ALL_TREATY_TYPES).toContain("mutual_defense");
  });

  test("should define all 5 term types", async () => {
    expect(ALL_TERM_TYPES.length).toBe(5);
    expect(ALL_TERM_TYPES).toContain("reparations");
    expect(ALL_TERM_TYPES).toContain("territory_exchange");
    expect(ALL_TERM_TYPES).toContain("trade_access");
    expect(ALL_TERM_TYPES).toContain("military_support");
    expect(ALL_TERM_TYPES).toContain("tribute");
  });

  test("should define all 4 diplomatic stances", async () => {
    expect(ALL_DIPLOMATIC_STANCES.length).toBe(4);
    expect(ALL_DIPLOMATIC_STANCES).toContain("friendly");
    expect(ALL_DIPLOMATIC_STANCES).toContain("neutral");
    expect(ALL_DIPLOMATIC_STANCES).toContain("hostile");
    expect(ALL_DIPLOMATIC_STANCES).toContain("war");
  });

  test("should have Hitchhiker descriptions for all treaty types", async () => {
    for (const type of ALL_TREATY_TYPES) {
      const description = DIPLOMACY_DESCRIPTIONS[type];
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    }
  });

  test("should have Hitchhiker descriptions for all term types", async () => {
    for (const type of ALL_TERM_TYPES) {
      const description = DIPLOMACY_DESCRIPTIONS[type];
      expect(typeof description).toBe("string");
      expect(description.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Test Suite: Treaty Interface
// ============================================================================
test.describe("Treaty Interface", () => {
  test("should create default treaty with valid values", async () => {
    const treaty = createDefaultTreaty({
      id: "treaty-001",
      parties: ["faction-a", "faction-b"],
      type: "peace",
    });

    expect(treaty.id).toBe("treaty-001");
    expect(treaty.parties).toEqual(["faction-a", "faction-b"]);
    expect(treaty.type).toBe("peace");
    expect(treaty.terms).toEqual([]);
    expect(treaty.status).toBe("active");
    expect(treaty.signedAt).toBeGreaterThan(0);
    expect(treaty.expiresAt).toBeGreaterThan(treaty.signedAt);
  });

  test("treaty should support custom terms", async () => {
    const terms: TreatyTerm[] = [
      { type: "reparations", description: "Pay 1000 tokens", value: 1000, factionId: "faction-b" },
      { type: "territory_exchange", description: "Transfer building X" },
    ];

    const treaty = createDefaultTreaty({
      id: "treaty-002",
      parties: ["faction-a", "faction-b"],
      type: "peace",
      terms,
    });

    expect(treaty.terms.length).toBe(2);
    expect(treaty.terms[0].type).toBe("reparations");
    expect(treaty.terms[0].value).toBe(1000);
    expect(treaty.terms[1].type).toBe("territory_exchange");
  });

  test("treaty should have expiration date", async () => {
    const treaty = createDefaultTreaty({
      id: "treaty-003",
      parties: ["faction-a", "faction-b"],
      type: "non_aggression",
      expiresAt: Date.now() + 100000,
    });

    expect(treaty.expiresAt).toBeGreaterThan(treaty.signedAt);
  });
});

// ============================================================================
// Test Suite: Alliance Interface
// ============================================================================
test.describe("Alliance Interface", () => {
  test("should create default alliance with valid values", async () => {
    const alliance = createDefaultAlliance({
      id: "alliance-001",
      memberFactionIds: ["faction-a", "faction-b"],
      leaderId: "faction-a",
    });

    expect(alliance.id).toBe("alliance-001");
    expect(alliance.memberFactionIds).toContain("faction-a");
    expect(alliance.memberFactionIds).toContain("faction-b");
    expect(alliance.leaderId).toBe("faction-a");
    expect(alliance.foundedAt).toBeGreaterThan(0);
    expect(alliance.strength).toBeGreaterThanOrEqual(0);
    expect(alliance.strength).toBeLessThanOrEqual(100);
  });

  test("alliance strength should default to member count based value", async () => {
    const smallAlliance = createDefaultAlliance({
      id: "alliance-small",
      memberFactionIds: ["faction-a", "faction-b"],
      leaderId: "faction-a",
    });

    const largeAlliance = createDefaultAlliance({
      id: "alliance-large",
      memberFactionIds: ["faction-a", "faction-b", "faction-c", "faction-d"],
      leaderId: "faction-a",
    });

    // More members should result in higher base strength
    expect(largeAlliance.strength).toBeGreaterThanOrEqual(smallAlliance.strength);
  });
});

// ============================================================================
// Test Suite: NegotiationSession Interface
// ============================================================================
test.describe("NegotiationSession Interface", () => {
  test("should create default negotiation session", async () => {
    const session = createDefaultNegotiationSession({
      id: "session-001",
      initiatorFactionId: "faction-a",
      targetFactionId: "faction-b",
    });

    expect(session.id).toBe("session-001");
    expect(session.initiatorFactionId).toBe("faction-a");
    expect(session.targetFactionId).toBe("faction-b");
    expect(session.proposedTerms).toEqual([]);
    expect(session.counterTerms).toBeNull();
    expect(session.stage).toBe("proposed");
  });

  test("negotiation session should track stage progression", async () => {
    const session = createDefaultNegotiationSession({
      id: "session-002",
      initiatorFactionId: "faction-a",
      targetFactionId: "faction-b",
      stage: "counter_offered",
    });

    expect(session.stage).toBe("counter_offered");
  });
});

// ============================================================================
// Test Suite: DiplomacyManager - Treaty Proposals
// ============================================================================
test.describe("DiplomacyManager - Treaty Proposals", () => {
  test("should create manager instance", async () => {
    const manager = new DiplomacyManager();
    expect(manager).toBeDefined();
  });

  test("should propose a treaty between factions", async () => {
    const manager = new DiplomacyManager();
    const terms: TreatyTerm[] = [
      { type: "reparations", description: "War reparations", value: 500 },
    ];

    const session = manager.proposeTreaty("faction-a", "faction-b", "peace", terms);

    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
    expect(session.initiatorFactionId).toBe("faction-a");
    expect(session.targetFactionId).toBe("faction-b");
    expect(session.proposedTerms.length).toBe(1);
    expect(session.stage).toBe("proposed");
  });

  test("should get negotiation session by ID", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "trade", []);

    const retrieved = manager.getNegotiationSession(session.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(session.id);
  });

  test("should store proposed treaty type in session", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "mutual_defense", []);

    expect(session.proposedType).toBe("mutual_defense");
  });
});

// ============================================================================
// Test Suite: DiplomacyManager - Counter Proposals
// ============================================================================
test.describe("DiplomacyManager - Counter Proposals", () => {
  test("should counter-propose with new terms", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "peace", [
      { type: "reparations", description: "Pay 1000", value: 1000 },
    ]);

    const counterTerms: TreatyTerm[] = [
      { type: "reparations", description: "Pay 500 instead", value: 500 },
    ];

    const updated = manager.counterPropose(session.id, counterTerms);

    expect(updated).toBeDefined();
    expect(updated!.counterTerms).not.toBeNull();
    expect(updated!.counterTerms!.length).toBe(1);
    expect(updated!.counterTerms![0].value).toBe(500);
    expect(updated!.stage).toBe("counter_offered");
  });

  test("should track multiple counter-offers", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "trade", []);

    manager.counterPropose(session.id, [
      { type: "trade_access", description: "Market access" },
    ]);

    const updated = manager.getNegotiationSession(session.id);
    expect(updated!.negotiationRounds).toBe(1);
  });

  test("should fail to counter-propose on non-existent session", async () => {
    const manager = new DiplomacyManager();

    const result = manager.counterPropose("fake-session", []);
    expect(result).toBeNull();
  });
});

// ============================================================================
// Test Suite: DiplomacyManager - Accept/Reject Treaties
// ============================================================================
test.describe("DiplomacyManager - Accept/Reject Treaties", () => {
  test("should accept treaty and create active treaty", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "peace", [
      { type: "reparations", description: "Pay 500", value: 500 },
    ]);

    const treaty = manager.acceptTreaty(session.id);

    expect(treaty).toBeDefined();
    expect(treaty!.id).toBeDefined();
    expect(treaty!.parties).toContain("faction-a");
    expect(treaty!.parties).toContain("faction-b");
    expect(treaty!.type).toBe("peace");
    expect(treaty!.status).toBe("active");
    expect(treaty!.terms.length).toBe(1);
  });

  test("should close negotiation session after acceptance", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "trade", []);

    manager.acceptTreaty(session.id);

    const closedSession = manager.getNegotiationSession(session.id);
    expect(closedSession!.stage).toBe("accepted");
  });

  test("should reject treaty and close session", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "alliance", []);

    const result = manager.rejectTreaty(session.id);

    expect(result).toBe(true);
    const rejectedSession = manager.getNegotiationSession(session.id);
    expect(rejectedSession!.stage).toBe("rejected");
  });

  test("should fail to accept non-existent session", async () => {
    const manager = new DiplomacyManager();

    const treaty = manager.acceptTreaty("fake-session");
    expect(treaty).toBeNull();
  });

  test("should use counter-terms if present when accepting", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "peace", [
      { type: "reparations", description: "Pay 1000", value: 1000 },
    ]);

    manager.counterPropose(session.id, [
      { type: "reparations", description: "Pay 750", value: 750 },
    ]);

    const treaty = manager.acceptTreaty(session.id);

    expect(treaty!.terms[0].value).toBe(750);
  });
});

// ============================================================================
// Test Suite: DiplomacyManager - Treaty Violations
// ============================================================================
test.describe("DiplomacyManager - Treaty Violations", () => {
  test("should record treaty violation", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "non_aggression", []);
    const treaty = manager.acceptTreaty(session.id);

    const result = manager.violateTreaty(treaty!.id, "faction-a");

    expect(result).toBe(true);
    const violated = manager.getTreaty(treaty!.id);
    expect(violated!.status).toBe("violated");
    expect(violated!.violatorId).toBe("faction-a");
  });

  test("should damage violator diplomatic reputation", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "peace", []);
    const treaty = manager.acceptTreaty(session.id);

    const repBefore = manager.getDiplomaticReputation("faction-a");
    manager.violateTreaty(treaty!.id, "faction-a");
    const repAfter = manager.getDiplomaticReputation("faction-a");

    expect(repAfter).toBeLessThan(repBefore);
  });

  test("should fail to violate non-existent treaty", async () => {
    const manager = new DiplomacyManager();

    const result = manager.violateTreaty("fake-treaty", "faction-a");
    expect(result).toBe(false);
  });

  test("should fail to violate already ended treaty", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "trade", []);
    const treaty = manager.acceptTreaty(session.id);
    manager.expireTreaty(treaty!.id);

    const result = manager.violateTreaty(treaty!.id, "faction-a");
    expect(result).toBe(false);
  });
});

// ============================================================================
// Test Suite: DiplomacyManager - Treaty Expiration
// ============================================================================
test.describe("DiplomacyManager - Treaty Expiration", () => {
  test("should expire treaty naturally", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "peace", []);
    const treaty = manager.acceptTreaty(session.id);

    const result = manager.expireTreaty(treaty!.id);

    expect(result).toBe(true);
    const expired = manager.getTreaty(treaty!.id);
    expect(expired!.status).toBe("expired");
  });

  test("should not damage reputation on natural expiration", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "trade", []);
    const treaty = manager.acceptTreaty(session.id);

    const repBefore = manager.getDiplomaticReputation("faction-a");
    manager.expireTreaty(treaty!.id);
    const repAfter = manager.getDiplomaticReputation("faction-a");

    expect(repAfter).toBe(repBefore);
  });

  test("should fail to expire non-existent treaty", async () => {
    const manager = new DiplomacyManager();

    const result = manager.expireTreaty("fake-treaty");
    expect(result).toBe(false);
  });

  test("should get all active treaties for a faction", async () => {
    const manager = new DiplomacyManager();

    // Create multiple treaties
    const session1 = manager.proposeTreaty("faction-a", "faction-b", "peace", []);
    manager.acceptTreaty(session1.id);

    const session2 = manager.proposeTreaty("faction-a", "faction-c", "trade", []);
    manager.acceptTreaty(session2.id);

    const session3 = manager.proposeTreaty("faction-b", "faction-c", "alliance", []);
    manager.acceptTreaty(session3.id);

    const factionATreaties = manager.getActiveTreatiesForFaction("faction-a");
    expect(factionATreaties.length).toBe(2);

    const factionBTreaties = manager.getActiveTreatiesForFaction("faction-b");
    expect(factionBTreaties.length).toBe(2);
  });
});

// ============================================================================
// Test Suite: DiplomacyManager - Alliances
// ============================================================================
test.describe("DiplomacyManager - Alliances", () => {
  test("should form new alliance", async () => {
    const manager = new DiplomacyManager();

    const alliance = manager.formAlliance(["faction-a", "faction-b"], "faction-a");

    expect(alliance).toBeDefined();
    expect(alliance.id).toBeDefined();
    expect(alliance.memberFactionIds).toContain("faction-a");
    expect(alliance.memberFactionIds).toContain("faction-b");
    expect(alliance.leaderId).toBe("faction-a");
    expect(alliance.foundedAt).toBeGreaterThan(0);
  });

  test("should join existing alliance", async () => {
    const manager = new DiplomacyManager();
    const alliance = manager.formAlliance(["faction-a", "faction-b"], "faction-a");

    const result = manager.joinAlliance(alliance.id, "faction-c");

    expect(result).toBe(true);
    const updated = manager.getAlliance(alliance.id);
    expect(updated!.memberFactionIds).toContain("faction-c");
  });

  test("should fail to join non-existent alliance", async () => {
    const manager = new DiplomacyManager();

    const result = manager.joinAlliance("fake-alliance", "faction-c");
    expect(result).toBe(false);
  });

  test("should fail to join alliance if already member", async () => {
    const manager = new DiplomacyManager();
    const alliance = manager.formAlliance(["faction-a", "faction-b"], "faction-a");

    const result = manager.joinAlliance(alliance.id, "faction-a");
    expect(result).toBe(false);
  });

  test("should leave alliance", async () => {
    const manager = new DiplomacyManager();
    const alliance = manager.formAlliance(["faction-a", "faction-b", "faction-c"], "faction-a");

    const result = manager.leaveAlliance(alliance.id, "faction-b");

    expect(result).toBe(true);
    const updated = manager.getAlliance(alliance.id);
    expect(updated!.memberFactionIds).not.toContain("faction-b");
  });

  test("should fail to leave if not member", async () => {
    const manager = new DiplomacyManager();
    const alliance = manager.formAlliance(["faction-a", "faction-b"], "faction-a");

    const result = manager.leaveAlliance(alliance.id, "faction-c");
    expect(result).toBe(false);
  });

  test("should transfer leadership if leader leaves", async () => {
    const manager = new DiplomacyManager();
    const alliance = manager.formAlliance(["faction-a", "faction-b", "faction-c"], "faction-a");

    manager.leaveAlliance(alliance.id, "faction-a");

    const updated = manager.getAlliance(alliance.id);
    expect(updated!.leaderId).not.toBe("faction-a");
    expect(["faction-b", "faction-c"]).toContain(updated!.leaderId);
  });

  test("should dissolve alliance", async () => {
    const manager = new DiplomacyManager();
    const alliance = manager.formAlliance(["faction-a", "faction-b"], "faction-a");

    const result = manager.dissolveAlliance(alliance.id);

    expect(result).toBe(true);
    const dissolved = manager.getAlliance(alliance.id);
    expect(dissolved!.status).toBe("dissolved");
  });

  test("should dissolve alliance if only one member remains", async () => {
    const manager = new DiplomacyManager();
    const alliance = manager.formAlliance(["faction-a", "faction-b"], "faction-a");

    manager.leaveAlliance(alliance.id, "faction-b");

    const updated = manager.getAlliance(alliance.id);
    expect(updated!.status).toBe("dissolved");
  });

  test("should get all active alliances for a faction", async () => {
    const manager = new DiplomacyManager();

    manager.formAlliance(["faction-a", "faction-b"], "faction-a");
    manager.formAlliance(["faction-a", "faction-c"], "faction-c");
    manager.formAlliance(["faction-b", "faction-c"], "faction-b");

    const factionAAlliances = manager.getAlliancesForFaction("faction-a");
    expect(factionAAlliances.length).toBe(2);
  });
});

// ============================================================================
// Test Suite: DiplomacyManager - Diplomatic Stance
// ============================================================================
test.describe("DiplomacyManager - Diplomatic Stance", () => {
  test("should get diplomatic stance between factions", async () => {
    const manager = new DiplomacyManager();

    const stance = manager.getDiplomaticStance("faction-a", "faction-b");
    expect(ALL_DIPLOMATIC_STANCES).toContain(stance);
  });

  test("should default to neutral stance", async () => {
    const manager = new DiplomacyManager();

    const stance = manager.getDiplomaticStance("faction-x", "faction-y");
    expect(stance).toBe("neutral");
  });

  test("should return friendly stance with active alliance", async () => {
    const manager = new DiplomacyManager();
    manager.formAlliance(["faction-a", "faction-b"], "faction-a");

    const stance = manager.getDiplomaticStance("faction-a", "faction-b");
    expect(stance).toBe("friendly");
  });

  test("should return hostile stance after treaty violation", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "peace", []);
    const treaty = manager.acceptTreaty(session.id);
    manager.violateTreaty(treaty!.id, "faction-a");

    const stance = manager.getDiplomaticStance("faction-a", "faction-b");
    expect(stance).toBe("hostile");
  });
});

// ============================================================================
// Test Suite: DiplomacyManager - Diplomatic Reputation
// ============================================================================
test.describe("DiplomacyManager - Diplomatic Reputation", () => {
  test("should get diplomatic reputation", async () => {
    const manager = new DiplomacyManager();

    const rep = manager.getDiplomaticReputation("faction-a");
    expect(typeof rep).toBe("number");
    expect(rep).toBeGreaterThanOrEqual(0);
    expect(rep).toBeLessThanOrEqual(100);
  });

  test("should default to 50 reputation", async () => {
    const manager = new DiplomacyManager();

    const rep = manager.getDiplomaticReputation("new-faction");
    expect(rep).toBe(50);
  });

  test("should update diplomatic reputation", async () => {
    const manager = new DiplomacyManager();

    manager.updateDiplomaticReputation("faction-a", 10, "honored_treaty");
    const rep = manager.getDiplomaticReputation("faction-a");
    expect(rep).toBe(60);
  });

  test("should clamp reputation between 0 and 100", async () => {
    const manager = new DiplomacyManager();

    manager.updateDiplomaticReputation("faction-a", -100, "major_betrayal");
    const repLow = manager.getDiplomaticReputation("faction-a");
    expect(repLow).toBe(0);

    manager.updateDiplomaticReputation("faction-b", 100, "great_honor");
    const repHigh = manager.getDiplomaticReputation("faction-b");
    expect(repHigh).toBe(100);
  });

  test("should track reputation changes with reason", async () => {
    const manager = new DiplomacyManager();

    manager.updateDiplomaticReputation("faction-a", -20, "treaty_violation");

    const history = manager.getReputationHistory("faction-a");
    expect(history.length).toBeGreaterThan(0);
    expect(history[history.length - 1].reason).toBe("treaty_violation");
  });
});

// ============================================================================
// Test Suite: Hitchhiker's Guide Descriptions
// ============================================================================
test.describe("Hitchhiker's Guide Descriptions", () => {
  test("should have sardonic description for peace treaty", async () => {
    const desc = DIPLOMACY_DESCRIPTIONS.peace;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have sardonic description for alliance", async () => {
    const desc = DIPLOMACY_DESCRIPTIONS.alliance;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have crypto-themed description for trade treaty", async () => {
    const desc = DIPLOMACY_DESCRIPTIONS.trade;
    expect(desc).toBeDefined();
    expect(desc.toLowerCase()).toMatch(/token|market|trade|liquidity/);
  });

  test("should have description for reparations", async () => {
    const desc = DIPLOMACY_DESCRIPTIONS.reparations;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have description for tribute", async () => {
    const desc = DIPLOMACY_DESCRIPTIONS.tribute;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have description for negotiation", async () => {
    const desc = DIPLOMACY_DESCRIPTIONS.negotiation;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });

  test("should have description for diplomatic reputation", async () => {
    const desc = DIPLOMACY_DESCRIPTIONS.reputation;
    expect(desc).toBeDefined();
    expect(desc.length).toBeGreaterThan(10);
  });
});

// ============================================================================
// Test Suite: Integration with Faction System
// ============================================================================
test.describe("Integration with Faction System", () => {
  test("treaties should store faction IDs", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("bitcoin-citadel", "ethereum-collective", "peace", []);
    const treaty = manager.acceptTreaty(session.id);

    expect(treaty!.parties).toContain("bitcoin-citadel");
    expect(treaty!.parties).toContain("ethereum-collective");
  });

  test("alliances should store faction IDs", async () => {
    const manager = new DiplomacyManager();
    const alliance = manager.formAlliance(
      ["degen-republic", "privacy-underground"],
      "degen-republic"
    );

    expect(alliance.memberFactionIds).toContain("degen-republic");
    expect(alliance.memberFactionIds).toContain("privacy-underground");
  });

  test("term factionId should reference valid faction", async () => {
    const manager = new DiplomacyManager();
    const terms: TreatyTerm[] = [
      { type: "tribute", description: "Monthly tribute", value: 100, factionId: "faction-b" },
    ];

    const session = manager.proposeTreaty("faction-a", "faction-b", "peace", terms);
    const treaty = manager.acceptTreaty(session.id);

    expect(treaty!.terms[0].factionId).toBe("faction-b");
  });
});

// ============================================================================
// Test Suite: Mutual Defense Trigger
// ============================================================================
test.describe("Mutual Defense Trigger", () => {
  test("should check if mutual defense applies", async () => {
    const manager = new DiplomacyManager();
    manager.formAlliance(["faction-a", "faction-b"], "faction-a");

    const applies = manager.checkMutualDefense("faction-a", "faction-c");

    // faction-c attacks faction-a, should trigger mutual defense from faction-b
    expect(applies).toBeDefined();
    expect(applies.length).toBeGreaterThan(0);
    expect(applies).toContain("faction-b");
  });

  test("should not trigger mutual defense without alliance", async () => {
    const manager = new DiplomacyManager();

    const applies = manager.checkMutualDefense("faction-a", "faction-c");
    expect(applies.length).toBe(0);
  });

  test("should check mutual defense treaty", async () => {
    const manager = new DiplomacyManager();
    const session = manager.proposeTreaty("faction-a", "faction-b", "mutual_defense", []);
    manager.acceptTreaty(session.id);

    const applies = manager.checkMutualDefense("faction-a", "faction-c");
    expect(applies).toContain("faction-b");
  });
});

// ============================================================================
// Test Suite: Serialization
// ============================================================================
test.describe("Serialization", () => {
  test("should serialize diplomacy state", async () => {
    const manager = new DiplomacyManager();

    // Create some state
    const session = manager.proposeTreaty("faction-a", "faction-b", "peace", []);
    manager.acceptTreaty(session.id);
    manager.formAlliance(["faction-a", "faction-c"], "faction-a");
    manager.updateDiplomaticReputation("faction-a", 10, "test");

    const serialized = manager.serialize();

    expect(serialized.treaties).toBeDefined();
    expect(serialized.alliances).toBeDefined();
    expect(serialized.reputations).toBeDefined();
    expect(serialized.sessions).toBeDefined();
  });

  test("should deserialize diplomacy state", async () => {
    const manager1 = new DiplomacyManager();
    const session = manager1.proposeTreaty("faction-a", "faction-b", "trade", []);
    manager1.acceptTreaty(session.id);
    manager1.formAlliance(["faction-x", "faction-y"], "faction-x");

    const serialized = manager1.serialize();

    const manager2 = new DiplomacyManager();
    manager2.deserialize(serialized);

    const treaties = manager2.getActiveTreatiesForFaction("faction-a");
    expect(treaties.length).toBe(1);

    const alliances = manager2.getAlliancesForFaction("faction-x");
    expect(alliances.length).toBe(1);
  });
});
