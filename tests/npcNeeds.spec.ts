import { test, expect } from "@playwright/test";

/**
 * Tests for NPC Needs System (Issue #99)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * This implements The Sims-style needs system where NPCs have motives that decay over time.
 */

// Import the types and functions we're going to implement
// These imports will fail initially - that's expected in TDD!
import type { Need, NPCNeeds } from "@/lib/npc/needs";
import {
  DECAY_RATES,
  CRITICAL_THRESHOLDS,
  DEFAULT_WEIGHTS,
  NEED_DESCRIPTIONS,
  createDefaultNeeds,
  createNeed,
} from "@/lib/npc/needs";
import {
  NeedsManager,
} from "@/lib/npc/NeedsManager";

/**
 * Test Suite: Need Interface
 * Tests the basic Need data structure
 */
test.describe("Need Interface", () => {
  test("should have correct properties", async () => {
    const need: Need = {
      current: 75,
      max: 100,
      decayRate: 0.5,
      criticalThreshold: 20,
      weight: 1.0,
    };

    expect(need.current).toBe(75);
    expect(need.max).toBe(100);
    expect(need.decayRate).toBe(0.5);
    expect(need.criticalThreshold).toBe(20);
    expect(need.weight).toBe(1.0);
  });

  test("createNeed should create a need with defaults", async () => {
    const need = createNeed({ current: 80 });
    
    expect(need.current).toBe(80);
    expect(need.max).toBe(100);
    expect(need.decayRate).toBeGreaterThan(0);
    expect(need.criticalThreshold).toBeGreaterThan(0);
    expect(need.weight).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: Decay Rates
 * Tests the default decay rates for each need type
 */
test.describe("Decay Rates", () => {
  test("should define decay rates for all need types", async () => {
    expect(DECAY_RATES.hunger).toBe(0.5);
    expect(DECAY_RATES.energy).toBe(0.3);
    expect(DECAY_RATES.social).toBe(0.2);
    expect(DECAY_RATES.fun).toBe(0.4);
    expect(DECAY_RATES.wealth).toBe(0.1);
    expect(DECAY_RATES.purpose).toBe(0.15);
  });

  test("hunger should decay faster than energy", async () => {
    expect(DECAY_RATES.hunger).toBeGreaterThan(DECAY_RATES.energy);
  });

  test("wealth should decay slowest", async () => {
    expect(DECAY_RATES.wealth).toBeLessThan(DECAY_RATES.hunger);
    expect(DECAY_RATES.wealth).toBeLessThan(DECAY_RATES.energy);
    expect(DECAY_RATES.wealth).toBeLessThan(DECAY_RATES.social);
    expect(DECAY_RATES.wealth).toBeLessThan(DECAY_RATES.fun);
    expect(DECAY_RATES.wealth).toBeLessThan(DECAY_RATES.purpose);
  });
});

/**
 * Test Suite: Critical Thresholds
 * Tests the threshold values below which needs become urgent
 */
test.describe("Critical Thresholds", () => {
  test("should define critical thresholds for all need types", async () => {
    expect(CRITICAL_THRESHOLDS.hunger).toBe(20);
    expect(CRITICAL_THRESHOLDS.energy).toBe(15);
    expect(CRITICAL_THRESHOLDS.social).toBe(25);
    expect(CRITICAL_THRESHOLDS.fun).toBe(20);
    expect(CRITICAL_THRESHOLDS.wealth).toBe(30);
    expect(CRITICAL_THRESHOLDS.purpose).toBe(25);
  });

  test("all thresholds should be between 0 and 50", async () => {
    Object.values(CRITICAL_THRESHOLDS).forEach(threshold => {
      expect(threshold).toBeGreaterThanOrEqual(0);
      expect(threshold).toBeLessThanOrEqual(50);
    });
  });
});

/**
 * Test Suite: NPCNeeds Structure
 * Tests creating and managing all NPC needs together
 */
test.describe("NPCNeeds Structure", () => {
  test("createDefaultNeeds should return all six need types", async () => {
    const needs = createDefaultNeeds();

    expect(needs.hunger).toBeDefined();
    expect(needs.energy).toBeDefined();
    expect(needs.social).toBeDefined();
    expect(needs.fun).toBeDefined();
    expect(needs.wealth).toBeDefined();
    expect(needs.purpose).toBeDefined();
  });

  test("createDefaultNeeds should initialize with randomized values 50-100", async () => {
    // Run multiple times to check randomization
    for (let i = 0; i < 10; i++) {
      const needs = createDefaultNeeds();
      
      Object.values(needs).forEach(need => {
        expect(need.current).toBeGreaterThanOrEqual(50);
        expect(need.current).toBeLessThanOrEqual(100);
      });
    }
  });

  test("each need should use correct decay rate", async () => {
    const needs = createDefaultNeeds();

    expect(needs.hunger.decayRate).toBe(DECAY_RATES.hunger);
    expect(needs.energy.decayRate).toBe(DECAY_RATES.energy);
    expect(needs.social.decayRate).toBe(DECAY_RATES.social);
    expect(needs.fun.decayRate).toBe(DECAY_RATES.fun);
    expect(needs.wealth.decayRate).toBe(DECAY_RATES.wealth);
    expect(needs.purpose.decayRate).toBe(DECAY_RATES.purpose);
  });

  test("each need should use correct critical threshold", async () => {
    const needs = createDefaultNeeds();

    expect(needs.hunger.criticalThreshold).toBe(CRITICAL_THRESHOLDS.hunger);
    expect(needs.energy.criticalThreshold).toBe(CRITICAL_THRESHOLDS.energy);
    expect(needs.social.criticalThreshold).toBe(CRITICAL_THRESHOLDS.social);
    expect(needs.fun.criticalThreshold).toBe(CRITICAL_THRESHOLDS.fun);
    expect(needs.wealth.criticalThreshold).toBe(CRITICAL_THRESHOLDS.wealth);
    expect(needs.purpose.criticalThreshold).toBe(CRITICAL_THRESHOLDS.purpose);
  });
});

/**
 * Test Suite: NeedsManager - updateNeeds
 * Tests the decay functionality over time
 */
test.describe("NeedsManager - updateNeeds", () => {
  test("should decay all needs over time", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    // Set all to 80 for predictable testing
    Object.values(needs).forEach(need => {
      need.current = 80;
    });

    const deltaMinutes = 10;
    const updatedNeeds = manager.updateNeeds(needs, deltaMinutes);

    // Each need should have decayed by decayRate * deltaMinutes
    expect(updatedNeeds.hunger.current).toBe(80 - DECAY_RATES.hunger * deltaMinutes);
    expect(updatedNeeds.energy.current).toBe(80 - DECAY_RATES.energy * deltaMinutes);
    expect(updatedNeeds.social.current).toBe(80 - DECAY_RATES.social * deltaMinutes);
    expect(updatedNeeds.fun.current).toBe(80 - DECAY_RATES.fun * deltaMinutes);
    expect(updatedNeeds.wealth.current).toBe(80 - DECAY_RATES.wealth * deltaMinutes);
    expect(updatedNeeds.purpose.current).toBe(80 - DECAY_RATES.purpose * deltaMinutes);
  });

  test("should not decay below 0", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    // Set all to very low values
    Object.values(needs).forEach(need => {
      need.current = 2;
    });

    const deltaMinutes = 100; // Long time to ensure going negative
    const updatedNeeds = manager.updateNeeds(needs, deltaMinutes);

    Object.values(updatedNeeds).forEach(need => {
      expect(need.current).toBeGreaterThanOrEqual(0);
    });
  });

  test("should handle zero delta time", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    Object.values(needs).forEach(need => {
      need.current = 80;
    });

    const updatedNeeds = manager.updateNeeds(needs, 0);

    Object.values(updatedNeeds).forEach(need => {
      expect(need.current).toBe(80);
    });
  });
});

/**
 * Test Suite: NeedsManager - satisfyNeed
 * Tests fulfilling specific needs
 */
test.describe("NeedsManager - satisfyNeed", () => {
  test("should increase the specified need", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    needs.hunger.current = 30;

    const updatedNeeds = manager.satisfyNeed(needs, 'hunger', 50);

    expect(updatedNeeds.hunger.current).toBe(80);
  });

  test("should not exceed max value", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    needs.hunger.current = 80;

    const updatedNeeds = manager.satisfyNeed(needs, 'hunger', 50);

    expect(updatedNeeds.hunger.current).toBe(100);
  });

  test("should not affect other needs", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    needs.hunger.current = 30;
    needs.energy.current = 40;
    needs.social.current = 50;

    const updatedNeeds = manager.satisfyNeed(needs, 'hunger', 50);

    expect(updatedNeeds.energy.current).toBe(40);
    expect(updatedNeeds.social.current).toBe(50);
  });

  test("should handle all need types", async () => {
    const manager = new NeedsManager();
    const needTypes = ['hunger', 'energy', 'social', 'fun', 'wealth', 'purpose'] as const;

    for (const needType of needTypes) {
      const needs = createDefaultNeeds();
      needs[needType].current = 20;

      const updatedNeeds = manager.satisfyNeed(needs, needType, 30);
      expect(updatedNeeds[needType].current).toBe(50);
    }
  });
});

/**
 * Test Suite: NeedsManager - getMostUrgentNeed
 * Tests finding the most critical need
 */
test.describe("NeedsManager - getMostUrgentNeed", () => {
  test("should return the need with lowest current value", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    needs.hunger.current = 50;
    needs.energy.current = 60;
    needs.social.current = 70;
    needs.fun.current = 80;
    needs.wealth.current = 10; // Lowest
    needs.purpose.current = 90;

    const urgent = manager.getMostUrgentNeed(needs);

    expect(urgent.name).toBe('wealth');
    expect(urgent.need).toBe(needs.wealth);
  });

  test("should factor in weight when determining urgency", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    // Set all to same low value
    Object.values(needs).forEach(need => {
      need.current = 20;
    });
    
    // The need with highest weight should be most urgent when values are equal
    const urgent = manager.getMostUrgentNeed(needs);
    
    // With equal values, the one with highest weight * (1 - current/max) should win
    expect(urgent).toBeDefined();
    expect(urgent.name).toBeDefined();
  });

  test("should return critical needs first", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    needs.hunger.current = 50;
    needs.energy.current = 10; // Below critical threshold (15)
    needs.social.current = 60;
    needs.fun.current = 70;
    needs.wealth.current = 40;
    needs.purpose.current = 80;

    const urgent = manager.getMostUrgentNeed(needs);

    // Energy is below its critical threshold, so it should be most urgent
    expect(urgent.name).toBe('energy');
  });

  test("should handle all needs at max", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    Object.values(needs).forEach(need => {
      need.current = 100;
    });

    const urgent = manager.getMostUrgentNeed(needs);

    // Should still return something, even if all are satisfied
    expect(urgent).toBeDefined();
    expect(urgent.name).toBeDefined();
  });
});

/**
 * Test Suite: NeedsManager - getNeedsSatisfiers
 * Tests getting activities that satisfy specific needs
 */
test.describe("NeedsManager - getNeedsSatisfiers", () => {
  test("should return satisfiers for hunger", async () => {
    const manager = new NeedsManager();
    const satisfiers = manager.getNeedsSatisfiers('hunger');

    expect(satisfiers).toContain('eating_restaurant');
    expect(satisfiers).toContain('eating_home');
    expect(satisfiers.length).toBeGreaterThan(0);
  });

  test("should return satisfiers for energy", async () => {
    const manager = new NeedsManager();
    const satisfiers = manager.getNeedsSatisfiers('energy');

    expect(satisfiers).toContain('sleeping_home');
    expect(satisfiers.length).toBeGreaterThan(0);
  });

  test("should return satisfiers for social", async () => {
    const manager = new NeedsManager();
    const satisfiers = manager.getNeedsSatisfiers('social');

    expect(satisfiers).toContain('conversation');
    expect(satisfiers.length).toBeGreaterThan(0);
  });

  test("should return satisfiers for fun", async () => {
    const manager = new NeedsManager();
    const satisfiers = manager.getNeedsSatisfiers('fun');

    expect(satisfiers).toContain('entertainment_venue');
    expect(satisfiers.length).toBeGreaterThan(0);
  });

  test("should return satisfiers for wealth", async () => {
    const manager = new NeedsManager();
    const satisfiers = manager.getNeedsSatisfiers('wealth');

    expect(satisfiers).toContain('trading');
    expect(satisfiers).toContain('earning');
    expect(satisfiers.length).toBeGreaterThan(0);
  });

  test("should return satisfiers for purpose", async () => {
    const manager = new NeedsManager();
    const satisfiers = manager.getNeedsSatisfiers('purpose');

    expect(satisfiers).toContain('working');
    expect(satisfiers.length).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: Utility AI Scoring
 * Tests scoring actions based on need satisfaction
 */
test.describe("Utility AI Scoring", () => {
  test("should score actions higher when they satisfy urgent needs", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    needs.hunger.current = 10; // Very hungry
    needs.energy.current = 90; // Well rested

    const eatAction = {
      id: 'eat',
      needEffects: { hunger: 50 },
    };

    const sleepAction = {
      id: 'sleep',
      needEffects: { energy: 30 },
    };

    const eatScore = manager.scoreAction(eatAction, needs);
    const sleepScore = manager.scoreAction(sleepAction, needs);

    expect(eatScore).toBeGreaterThan(sleepScore);
  });

  test("should factor in need weights", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    // Set all needs to same value
    Object.values(needs).forEach(need => {
      need.current = 30;
    });

    // Actions that satisfy different needs with same amount
    const hungerAction = { id: 'eat', needEffects: { hunger: 30 } };
    const socialAction = { id: 'chat', needEffects: { social: 30 } };

    const hungerScore = manager.scoreAction(hungerAction, needs);
    const socialScore = manager.scoreAction(socialAction, needs);

    // Score should differ based on weights
    expect(hungerScore !== socialScore || DEFAULT_WEIGHTS.hunger === DEFAULT_WEIGHTS.social).toBe(true);
  });

  test("should return 0 for actions with no need effects", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();

    const noEffectAction = { id: 'idle', needEffects: {} };
    const score = manager.scoreAction(noEffectAction, needs);

    expect(score).toBe(0);
  });

  test("should handle actions that satisfy multiple needs", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    needs.social.current = 30;
    needs.fun.current = 30;

    const partyAction = {
      id: 'party',
      needEffects: { social: 40, fun: 30 },
    };

    const chatAction = {
      id: 'chat',
      needEffects: { social: 40 },
    };

    const partyScore = manager.scoreAction(partyAction, needs);
    const chatScore = manager.scoreAction(chatAction, needs);

    expect(partyScore).toBeGreaterThan(chatScore);
  });
});

/**
 * Test Suite: Hitchhiker's Guide Descriptions
 * Tests the sardonic descriptions for each need
 */
test.describe("Hitchhiker's Guide Descriptions", () => {
  test("should have description for hunger", async () => {
    expect(NEED_DESCRIPTIONS.hunger).toContain("primal urge");
    expect(NEED_DESCRIPTIONS.hunger).toContain("Bitcoin");
  });

  test("should have description for energy", async () => {
    expect(NEED_DESCRIPTIONS.energy).toContain("degen");
    expect(NEED_DESCRIPTIONS.energy).toContain("airdrop");
  });

  test("should have description for wealth", async () => {
    expect(NEED_DESCRIPTIONS.wealth).toContain("WAGMI");
  });

  test("should have descriptions for all need types", async () => {
    expect(NEED_DESCRIPTIONS.hunger).toBeDefined();
    expect(NEED_DESCRIPTIONS.energy).toBeDefined();
    expect(NEED_DESCRIPTIONS.social).toBeDefined();
    expect(NEED_DESCRIPTIONS.fun).toBeDefined();
    expect(NEED_DESCRIPTIONS.wealth).toBeDefined();
    expect(NEED_DESCRIPTIONS.purpose).toBeDefined();
  });
});

/**
 * Test Suite: isNeedCritical helper
 */
test.describe("isNeedCritical helper", () => {
  test("should return true when need is below critical threshold", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    needs.hunger.current = 10; // Below 20 threshold

    expect(manager.isNeedCritical(needs.hunger, 'hunger')).toBe(true);
  });

  test("should return false when need is above critical threshold", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    needs.hunger.current = 50; // Above 20 threshold

    expect(manager.isNeedCritical(needs.hunger, 'hunger')).toBe(false);
  });

  test("should return true when need equals critical threshold", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    needs.hunger.current = 20; // Exactly at threshold

    expect(manager.isNeedCritical(needs.hunger, 'hunger')).toBe(true);
  });
});

/**
 * Test Suite: getAllCriticalNeeds helper
 */
test.describe("getAllCriticalNeeds helper", () => {
  test("should return all needs below their critical thresholds", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    needs.hunger.current = 10; // Below 20
    needs.energy.current = 10; // Below 15
    needs.social.current = 50; // Above 25
    needs.fun.current = 50;    // Above 20
    needs.wealth.current = 20; // Below 30
    needs.purpose.current = 50; // Above 25

    const criticalNeeds = manager.getAllCriticalNeeds(needs);

    expect(criticalNeeds).toContain('hunger');
    expect(criticalNeeds).toContain('energy');
    expect(criticalNeeds).toContain('wealth');
    expect(criticalNeeds).not.toContain('social');
    expect(criticalNeeds).not.toContain('fun');
    expect(criticalNeeds).not.toContain('purpose');
  });

  test("should return empty array when no needs are critical", async () => {
    const manager = new NeedsManager();
    const needs = createDefaultNeeds();
    
    Object.values(needs).forEach(need => {
      need.current = 80;
    });

    const criticalNeeds = manager.getAllCriticalNeeds(needs);

    expect(criticalNeeds).toHaveLength(0);
  });
});
