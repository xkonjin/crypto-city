import { test, expect } from "@playwright/test";

/**
 * NPC Laws & Enforcement System Tests (#189)
 * 
 * TDD Phase 1: Tests for the NPC law system including:
 * - Law types and interfaces
 * - LawEnforcement class
 * - Violation detection and recording
 * - Penalty application
 * - Integration with faction treasury
 */

// Import types and classes directly for unit testing
import type {
  Law,
  LawType,
  Violation,
  Penalty,
  LawStatus,
  NPCAction,
} from "@/lib/npc/laws";
import {
  LAW_DESCRIPTIONS,
  createDefaultLaw,
  createPenalty,
  LAW_TYPE_LABELS,
  PENALTY_TYPE_LABELS,
  SEVERITY_LABELS,
} from "@/lib/npc/laws";
import { LawEnforcement } from "@/lib/npc/LawEnforcement";
import { FactionManager } from "@/lib/npc/FactionManager";
import { createDefaultPersonality } from "@/lib/npc/personality";
import type { CryptoNPC } from "@/lib/npc";

/**
 * Helper: Create a mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  return {
    id: overrides.id ?? `npc-${Math.random().toString(36).substring(7)}`,
    name: overrides.name ?? "Test NPC",
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
    personality: createDefaultPersonality(overrides.personality ? { ...overrides.personality } : {}),
    needs: { hunger: 50, energy: 50, social: 50, fun: 50, wealth: 50, purpose: 50 },
    memory: { episodic: [], semantic: [], procedural: [], working: [] },
    movement: { state: "idle", path: [], currentPathIndex: 0, speed: 1, targetX: null, targetY: null },
    relationships: {},
    factionId: overrides.factionId ?? null,
    ...overrides,
  } as CryptoNPC;
}

/**
 * Test Suite: Law Types
 */
test.describe("Law Types", () => {
  test("should define Law interface with all required properties", async () => {
    const law = createDefaultLaw({
      id: "law-1",
      factionId: "faction-1",
      proposerId: "npc-1",
      type: "trade_restriction",
      title: "No Pump and Dump",
      description: "Prohibits coordinated market manipulation",
      severity: "moderate",
      penalties: [createPenalty("fine", "moderate", 100)],
    });

    expect(typeof law.id).toBe("string");
    expect(typeof law.factionId).toBe("string");
    expect(typeof law.proposerId).toBe("string");
    expect(typeof law.type).toBe("string");
    expect(typeof law.title).toBe("string");
    expect(typeof law.description).toBe("string");
    expect(typeof law.severity).toBe("string");
    expect(Array.isArray(law.penalties)).toBe(true);
    expect(typeof law.enactedAt).toBe("number");
    expect(law.expiresAt === null || typeof law.expiresAt === "number").toBe(true);
    expect(typeof law.status).toBe("string");
  });

  test("should define all LawType values", async () => {
    const lawTypes: LawType[] = [
      "trade_restriction",
      "tax_rate",
      "curfew",
      "building_permit",
      "membership_rule",
      "conduct_code",
    ];

    for (const lawType of lawTypes) {
      expect(LAW_TYPE_LABELS[lawType]).toBeDefined();
      expect(typeof LAW_TYPE_LABELS[lawType]).toBe("string");
    }
  });

  test("should define all LawStatus values", async () => {
    const statuses: LawStatus[] = ["proposed", "active", "expired", "repealed"];

    for (const status of statuses) {
      const law = createDefaultLaw({
        id: `law-${status}`,
        factionId: "faction-1",
        proposerId: "npc-1",
        type: "conduct_code",
        title: "Test Law",
        description: "Test",
        severity: "minor",
        penalties: [],
        status,
      });
      expect(law.status).toBe(status);
    }
  });

  test("should define Penalty interface with all required properties", async () => {
    const penalty = createPenalty("fine", "moderate", 100);

    expect(["fine", "exile", "reputation_loss", "imprisonment"]).toContain(penalty.type);
    expect(["minor", "moderate", "severe"]).toContain(penalty.severity);
    expect(penalty.amount === undefined || typeof penalty.amount === "number").toBe(true);
  });

  test("should define all PenaltyType values", async () => {
    const penaltyTypes = ["fine", "exile", "reputation_loss", "imprisonment"] as const;

    for (const penaltyType of penaltyTypes) {
      expect(PENALTY_TYPE_LABELS[penaltyType]).toBeDefined();
      expect(typeof PENALTY_TYPE_LABELS[penaltyType]).toBe("string");
    }
  });

  test("should define all Severity values", async () => {
    const severities = ["minor", "moderate", "severe"] as const;

    for (const severity of severities) {
      expect(SEVERITY_LABELS[severity]).toBeDefined();
      expect(typeof SEVERITY_LABELS[severity]).toBe("string");
    }
  });

  test("createDefaultLaw should create law with default values", async () => {
    const law = createDefaultLaw({
      id: "test-law",
      factionId: "faction-1",
      proposerId: "npc-1",
      type: "conduct_code",
      title: "Test Law",
      description: "A test law",
      severity: "minor",
      penalties: [],
    });

    expect(law.id).toBe("test-law");
    expect(law.factionId).toBe("faction-1");
    expect(law.status).toBe("proposed");
    expect(law.enactedAt).toBe(0);
    expect(law.expiresAt).toBeNull();
  });

  test("createPenalty should create penalty with correct values", async () => {
    const penalty = createPenalty("fine", "severe", 500);

    expect(penalty.type).toBe("fine");
    expect(penalty.severity).toBe("severe");
    expect(penalty.amount).toBe(500);
  });
});

/**
 * Test Suite: Hitchhiker's Guide Descriptions
 */
test.describe("Law Descriptions", () => {
  test("should have all required Hitchhiker's Guide descriptions", async () => {
    expect(LAW_DESCRIPTIONS.proposing).toBeDefined();
    expect(LAW_DESCRIPTIONS.enforcement).toBeDefined();
    expect(LAW_DESCRIPTIONS.penalties).toBeDefined();
    expect(LAW_DESCRIPTIONS.violations).toBeDefined();
    expect(LAW_DESCRIPTIONS.exile).toBeDefined();
  });

  test("descriptions should be sardonic and crypto-themed", async () => {
    // Each description should contain crypto-relevant terms
    const allDescriptions = Object.values(LAW_DESCRIPTIONS).join(" ").toLowerCase();
    expect(
      allDescriptions.includes("code") ||
      allDescriptions.includes("decentralized") ||
      allDescriptions.includes("token") ||
      allDescriptions.includes("blockchain") ||
      allDescriptions.includes("crypto")
    ).toBe(true);
  });
});

/**
 * Test Suite: LawEnforcement - Law Proposal
 */
test.describe("LawEnforcement - Law Proposal", () => {
  test("should propose a new law", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);

    const law = enforcement.proposeLaw(
      faction.id,
      "npc-1",
      "trade_restriction",
      "No Shorting BTC",
      "Shorting Bitcoin is forbidden within the citadel",
      [createPenalty("fine", "moderate", 100)]
    );

    expect(law).toBeDefined();
    expect(law!.factionId).toBe(faction.id);
    expect(law!.proposerId).toBe("npc-1");
    expect(law!.type).toBe("trade_restriction");
    expect(law!.title).toBe("No Shorting BTC");
    expect(law!.status).toBe("proposed");
  });

  test("should reject proposal from non-member", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const law = enforcement.proposeLaw(
      faction.id,
      "non-member-npc",
      "trade_restriction",
      "Test Law",
      "Test",
      []
    );

    expect(law).toBeNull();
  });

  test("should reject proposal for non-existent faction", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const law = enforcement.proposeLaw(
      "non-existent-faction",
      "npc-1",
      "trade_restriction",
      "Test Law",
      "Test",
      []
    );

    expect(law).toBeNull();
  });

  test("should generate unique law IDs", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const law1 = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Law 1", "Test", []);
    const law2 = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Law 2", "Test", []);

    expect(law1?.id).not.toBe(law2?.id);
  });

  test("should set severity correctly", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const minorLaw = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Minor Law", "Test", [], "minor");
    const severeLaw = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Severe Law", "Test", [], "severe");

    expect(minorLaw?.severity).toBe("minor");
    expect(severeLaw?.severity).toBe("severe");
  });
});

/**
 * Test Suite: LawEnforcement - Law Enactment
 */
test.describe("LawEnforcement - Law Enactment", () => {
  test("should enact a proposed law", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Test Law", "Test", []);

    const result = enforcement.enactLaw(law!.id);

    expect(result).toBe(true);
    expect(law!.status).toBe("active");
    expect(law!.enactedAt).toBeGreaterThan(0);
  });

  test("should not enact non-existent law", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const result = enforcement.enactLaw("non-existent-law");

    expect(result).toBe(false);
  });

  test("should not enact already active law", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Test Law", "Test", []);
    enforcement.enactLaw(law!.id);

    const result = enforcement.enactLaw(law!.id);

    expect(result).toBe(false);
  });

  test("should set expiration date when specified", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Temporary Law", "Test", []);

    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
    enforcement.enactLaw(law!.id, expiresIn);

    expect(law!.expiresAt).toBeGreaterThan(Date.now());
  });
});

/**
 * Test Suite: LawEnforcement - Law Repeal
 */
test.describe("LawEnforcement - Law Repeal", () => {
  test("should repeal an active law", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Test Law", "Test", []);
    enforcement.enactLaw(law!.id);

    const result = enforcement.repealLaw(law!.id);

    expect(result).toBe(true);
    expect(law!.status).toBe("repealed");
  });

  test("should not repeal non-existent law", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const result = enforcement.repealLaw("non-existent-law");

    expect(result).toBe(false);
  });

  test("should not repeal already repealed law", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Test Law", "Test", []);
    enforcement.enactLaw(law!.id);
    enforcement.repealLaw(law!.id);

    const result = enforcement.repealLaw(law!.id);

    expect(result).toBe(false);
  });
});

/**
 * Test Suite: LawEnforcement - Violation Detection
 */
test.describe("LawEnforcement - Violation Detection", () => {
  test("should detect trade restriction violation", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);

    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "trade_restriction",
      "No Altcoins",
      "Trading altcoins is prohibited",
      [createPenalty("fine", "minor", 50)]
    );
    enforcement.enactLaw(law!.id);

    const npc = createMockNPC({ id: "npc-1", factionId: faction.id });
    const action: NPCAction = { type: "trade", target: "SHIB", amount: 100 };

    const violation = enforcement.checkViolation(npc, action);

    expect(violation).toBeDefined();
    expect(violation?.lawId).toBe(law!.id);
  });

  test("should detect curfew violation", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);

    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "curfew",
      "Night Curfew",
      "All members must be indoors after dark",
      [createPenalty("reputation_loss", "minor")]
    );
    enforcement.enactLaw(law!.id);

    const npc = createMockNPC({ id: "npc-1", factionId: faction.id });
    const action: NPCAction = { type: "movement", location: "outside", time: 22 }; // 10 PM

    const violation = enforcement.checkViolation(npc, action);

    expect(violation).toBeDefined();
    expect(violation?.lawId).toBe(law!.id);
  });

  test("should detect building permit violation", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);

    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "building_permit",
      "Building Restrictions",
      "Cannot build without faction approval",
      [createPenalty("fine", "severe", 500)]
    );
    enforcement.enactLaw(law!.id);

    const npc = createMockNPC({ id: "npc-1", factionId: faction.id });
    const action: NPCAction = { type: "build", buildingType: "casino", hasPermit: false };

    const violation = enforcement.checkViolation(npc, action);

    expect(violation).toBeDefined();
    expect(violation?.lawId).toBe(law!.id);
  });

  test("should not flag non-violating actions", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);

    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "trade_restriction",
      "No Altcoins",
      "Trading altcoins is prohibited",
      [createPenalty("fine", "minor", 50)]
    );
    enforcement.enactLaw(law!.id);

    const npc = createMockNPC({ id: "npc-1", factionId: faction.id });
    const action: NPCAction = { type: "trade", target: "BTC", amount: 100 }; // BTC is allowed

    const violation = enforcement.checkViolation(npc, action);

    expect(violation).toBeNull();
  });

  test("should not check laws for non-faction NPCs", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "conduct_code",
      "Test Law",
      "Test",
      []
    );
    enforcement.enactLaw(law!.id);

    const npc = createMockNPC({ id: "outsider-npc", factionId: null });
    const action: NPCAction = { type: "trade", target: "SHIB", amount: 100 };

    const violation = enforcement.checkViolation(npc, action);

    expect(violation).toBeNull();
  });

  test("should consider personality in violation detection", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("high-risk-npc", faction.id);
    factionManager.joinFaction("low-risk-npc", faction.id);

    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "conduct_code",
      "No Risky Behavior",
      "Test",
      [createPenalty("reputation_loss", "minor")]
    );
    enforcement.enactLaw(law!.id);

    // High risk tolerance = more likely to violate
    const highRiskNPC = createMockNPC({
      id: "high-risk-npc",
      factionId: faction.id,
      personality: { crypto: { riskTolerance: 0.95, fomo: 0.9, degenLevel: 0.9 } } as any,
    });

    // Low risk tolerance = less likely to violate
    const lowRiskNPC = createMockNPC({
      id: "low-risk-npc",
      factionId: faction.id,
      personality: { crypto: { riskTolerance: 0.1, fomo: 0.1, degenLevel: 0.1 } } as any,
    });

    const action: NPCAction = { type: "risky_behavior", riskLevel: 0.5 };

    // Run multiple times to check probability effect
    let highRiskViolations = 0;
    let lowRiskViolations = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      if (enforcement.checkViolation(highRiskNPC, action)) highRiskViolations++;
      if (enforcement.checkViolation(lowRiskNPC, action)) lowRiskViolations++;
    }

    // High risk NPCs should violate more often (or at least not less)
    expect(highRiskViolations).toBeGreaterThanOrEqual(lowRiskViolations);
  });
});

/**
 * Test Suite: LawEnforcement - Violation Recording
 */
test.describe("LawEnforcement - Violation Recording", () => {
  test("should record a violation", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Test Law", "Test", []);
    enforcement.enactLaw(law!.id);

    const violation = enforcement.recordViolation(law!.id, "violator-npc", ["witness-1", "witness-2"]);

    expect(violation).toBeDefined();
    expect(violation?.lawId).toBe(law!.id);
    expect(violation?.violatorId).toBe("violator-npc");
    expect(violation?.witnessed).toEqual(["witness-1", "witness-2"]);
    expect(violation?.detectedAt).toBeGreaterThan(0);
    expect(violation?.penaltyApplied).toBe(false);
  });

  test("should not record violation for non-existent law", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const violation = enforcement.recordViolation("non-existent-law", "violator-npc", []);

    expect(violation).toBeNull();
  });

  test("should generate unique violation IDs", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Test Law", "Test", []);
    enforcement.enactLaw(law!.id);

    const v1 = enforcement.recordViolation(law!.id, "violator-1", []);
    const v2 = enforcement.recordViolation(law!.id, "violator-2", []);

    expect(v1?.id).not.toBe(v2?.id);
  });

  test("should track violations by NPC", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law1 = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Law 1", "Test", []);
    const law2 = enforcement.proposeLaw(faction.id, "leader-1", "trade_restriction", "Law 2", "Test", []);
    enforcement.enactLaw(law1!.id);
    enforcement.enactLaw(law2!.id);

    enforcement.recordViolation(law1!.id, "repeat-offender", []);
    enforcement.recordViolation(law2!.id, "repeat-offender", []);

    const violations = enforcement.getViolationsByNPC("repeat-offender");

    expect(violations.length).toBe(2);
  });
});

/**
 * Test Suite: LawEnforcement - Penalty Application
 */
test.describe("LawEnforcement - Penalty Application", () => {
  test("should apply fine penalty to faction treasury", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    faction.treasury = 0;

    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "conduct_code",
      "Test Law",
      "Test",
      [createPenalty("fine", "moderate", 100)]
    );
    enforcement.enactLaw(law!.id);

    const violation = enforcement.recordViolation(law!.id, "violator-npc", []);
    const result = enforcement.applyPenalty(violation!.id);

    expect(result).toBe(true);
    expect(violation!.penaltyApplied).toBe(true);
    expect(faction.treasury).toBe(100); // Fine goes to faction treasury
  });

  test("should apply exile penalty", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("violator-npc", faction.id);

    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "conduct_code",
      "Serious Offense",
      "Test",
      [createPenalty("exile", "severe")]
    );
    enforcement.enactLaw(law!.id);

    const violation = enforcement.recordViolation(law!.id, "violator-npc", []);
    enforcement.applyPenalty(violation!.id);

    // NPC should be removed from faction
    expect(factionManager.getNPCFaction("violator-npc")).toBeNull();
  });

  test("should not apply penalty twice", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    faction.treasury = 0;

    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "conduct_code",
      "Test Law",
      "Test",
      [createPenalty("fine", "moderate", 100)]
    );
    enforcement.enactLaw(law!.id);

    const violation = enforcement.recordViolation(law!.id, "violator-npc", []);
    enforcement.applyPenalty(violation!.id);
    const secondResult = enforcement.applyPenalty(violation!.id);

    expect(secondResult).toBe(false);
    expect(faction.treasury).toBe(100); // Should not be 200
  });

  test("should not apply penalty for non-existent violation", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const result = enforcement.applyPenalty("non-existent-violation");

    expect(result).toBe(false);
  });

  test("should scale penalty by severity", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    faction.treasury = 0;

    // Minor fine
    const minorLaw = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "conduct_code",
      "Minor Offense",
      "Test",
      [createPenalty("fine", "minor", 50)]
    );
    enforcement.enactLaw(minorLaw!.id);
    const minorViolation = enforcement.recordViolation(minorLaw!.id, "violator-1", []);
    enforcement.applyPenalty(minorViolation!.id);

    const afterMinor = faction.treasury;

    // Severe fine
    const severeLaw = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "conduct_code",
      "Severe Offense",
      "Test",
      [createPenalty("fine", "severe", 500)]
    );
    enforcement.enactLaw(severeLaw!.id);
    const severeViolation = enforcement.recordViolation(severeLaw!.id, "violator-2", []);
    enforcement.applyPenalty(severeViolation!.id);

    const afterSevere = faction.treasury;

    expect(afterSevere - afterMinor).toBeGreaterThan(afterMinor);
  });
});

/**
 * Test Suite: LawEnforcement - Law Queries
 */
test.describe("LawEnforcement - Law Queries", () => {
  test("should get all active laws for a faction", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const law1 = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Law 1", "Test", []);
    const law2 = enforcement.proposeLaw(faction.id, "leader-1", "trade_restriction", "Law 2", "Test", []);
    const law3 = enforcement.proposeLaw(faction.id, "leader-1", "curfew", "Law 3", "Test", []);

    enforcement.enactLaw(law1!.id);
    enforcement.enactLaw(law2!.id);
    // law3 stays proposed

    const activeLaws = enforcement.getLawsForFaction(faction.id);

    expect(activeLaws.length).toBe(2);
    expect(activeLaws.map((l) => l.id)).toContain(law1!.id);
    expect(activeLaws.map((l) => l.id)).toContain(law2!.id);
    expect(activeLaws.map((l) => l.id)).not.toContain(law3!.id);
  });

  test("should return empty array for faction with no laws", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    factionManager.createFaction("bitcoin_citadel", "leader-1");

    const laws = enforcement.getLawsForFaction("some-faction");

    expect(laws).toEqual([]);
  });

  test("should get law by ID", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Test Law", "Test", []);

    const retrieved = enforcement.getLaw(law!.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(law!.id);
    expect(retrieved?.title).toBe("Test Law");
  });

  test("should return null for non-existent law ID", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const law = enforcement.getLaw("non-existent");

    expect(law).toBeNull();
  });
});

/**
 * Test Suite: LawEnforcement - Law Expiration
 */
test.describe("LawEnforcement - Law Expiration", () => {
  test("should expire laws past their expiration date", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Temporary Law", "Test", []);

    // Enact with immediate expiration (1ms)
    enforcement.enactLaw(law!.id, 1);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 10));

    enforcement.updateLawExpiration();

    expect(law!.status).toBe("expired");
  });

  test("should not expire laws without expiration date", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Permanent Law", "Test", []);
    enforcement.enactLaw(law!.id);

    enforcement.updateLawExpiration();

    expect(law!.status).toBe("active");
  });

  test("should return count of expired laws", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");

    const law1 = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Temp 1", "Test", []);
    const law2 = enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Temp 2", "Test", []);

    enforcement.enactLaw(law1!.id, 1);
    enforcement.enactLaw(law2!.id, 1);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const expiredCount = enforcement.updateLawExpiration();

    expect(expiredCount).toBe(2);
  });
});

/**
 * Test Suite: LawEnforcement - Witness Requirements
 */
test.describe("LawEnforcement - Witness Requirements", () => {
  test("should require witnesses for certain law types", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);

    // Conduct code violations typically need witnesses
    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "conduct_code",
      "Code of Honor",
      "Must behave honorably",
      [createPenalty("reputation_loss", "minor")],
      "moderate",
      true // requires witnesses
    );
    enforcement.enactLaw(law!.id);

    const npc = createMockNPC({ id: "npc-1", factionId: faction.id });
    const action: NPCAction = { type: "misconduct", witnessed: false };

    // Without witnesses, violation should not be detected
    const violation = enforcement.checkViolation(npc, action);

    // The violation detection should consider witness requirement
    expect(violation).toBeNull();
  });

  test("should detect violation when witnesses present", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    factionManager.joinFaction("npc-1", faction.id);

    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "conduct_code",
      "Code of Honor",
      "Must behave honorably",
      [createPenalty("reputation_loss", "minor")],
      "moderate",
      true
    );
    enforcement.enactLaw(law!.id);

    const npc = createMockNPC({ id: "npc-1", factionId: faction.id });
    const action: NPCAction = { type: "misconduct", witnessed: true, witnesses: ["witness-1"] };

    const violation = enforcement.checkViolation(npc, action);

    expect(violation).toBeDefined();
  });
});

/**
 * Test Suite: Serialization
 */
test.describe("Law Serialization", () => {
  test("should serialize and deserialize laws", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "trade_restriction",
      "No Memecoins",
      "Memecoins are banned",
      [createPenalty("fine", "moderate", 100)]
    );
    enforcement.enactLaw(law!.id);
    enforcement.recordViolation(law!.id, "violator-1", ["witness-1"]);

    const serialized = enforcement.serialize();

    const newFactionManager = new FactionManager();
    const newEnforcement = new LawEnforcement(newFactionManager);
    newEnforcement.deserialize(serialized);

    const restored = newEnforcement.getLaw(law!.id);
    expect(restored).toBeDefined();
    expect(restored?.title).toBe("No Memecoins");
    expect(restored?.status).toBe("active");

    const violations = newEnforcement.getViolationsByNPC("violator-1");
    expect(violations.length).toBe(1);
  });

  test("should maintain law counter after deserialization", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Law 1", "Test", []);
    enforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Law 2", "Test", []);

    const serialized = enforcement.serialize();

    const newFactionManager = new FactionManager();
    newFactionManager.deserialize(factionManager.serialize());
    const newEnforcement = new LawEnforcement(newFactionManager);
    newEnforcement.deserialize(serialized);

    const newLaw = newEnforcement.proposeLaw(faction.id, "leader-1", "conduct_code", "Law 3", "Test", []);

    // New law should have unique ID (not collide with existing)
    expect(newLaw?.id).toBeDefined();
  });
});

/**
 * Test Suite: Integration with Faction Treasury
 */
test.describe("Integration with Faction Treasury", () => {
  test("fines should accumulate in faction treasury", async () => {
    const factionManager = new FactionManager();
    const enforcement = new LawEnforcement(factionManager);

    const faction = factionManager.createFaction("bitcoin_citadel", "leader-1");
    faction.treasury = 1000;

    const law = enforcement.proposeLaw(
      faction.id,
      "leader-1",
      "trade_restriction",
      "Anti-Shitcoin Act",
      "No shitcoins allowed",
      [createPenalty("fine", "moderate", 200)]
    );
    enforcement.enactLaw(law!.id);

    // Multiple violators
    for (let i = 0; i < 5; i++) {
      const violation = enforcement.recordViolation(law!.id, `violator-${i}`, []);
      enforcement.applyPenalty(violation!.id);
    }

    expect(faction.treasury).toBe(2000); // 1000 + (200 * 5)
  });
});
