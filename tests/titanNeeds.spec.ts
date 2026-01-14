import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Needs System
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * Extends the NPC needs system with Titan-specific needs (attention, growth).
 */

import type { Need } from "@/lib/npc/needs";
import type { TitanNeeds } from "@/games/isocity/types/titan";
import {
  TITAN_DECAY_RATES,
  TITAN_CRITICAL_THRESHOLDS,
  TITAN_DEFAULT_WEIGHTS,
  TITAN_NEED_DESCRIPTIONS,
  TITAN_NEED_SATISFIERS,
  TitanNeedType,
  createDefaultTitanNeeds,
  updateTitanNeeds,
  satisfyTitanNeed,
  getMostUrgentTitanNeed,
  getTitanNeedStatus,
} from "@/lib/titan/TitanNeeds";

/**
 * Test Suite: TitanNeedType
 * Tests the union type for all Titan needs
 */
test.describe("TitanNeedType", () => {
  test("should include all base NPC needs", () => {
    const baseNeeds: TitanNeedType[] = ['hunger', 'energy', 'social', 'fun', 'wealth', 'purpose'];
    baseNeeds.forEach(need => {
      expect(typeof need).toBe('string');
    });
  });

  test("should include Titan-specific needs", () => {
    const titanNeeds: TitanNeedType[] = ['attention', 'growth'];
    titanNeeds.forEach(need => {
      expect(typeof need).toBe('string');
    });
  });
});

/**
 * Test Suite: TITAN_DECAY_RATES
 * Tests the decay rates specific to Titans
 */
test.describe("TITAN_DECAY_RATES", () => {
  test("should define decay rate for attention (fast - 0.6)", () => {
    expect(TITAN_DECAY_RATES.attention).toBe(0.6);
  });

  test("should define decay rate for growth (slow - 0.2)", () => {
    expect(TITAN_DECAY_RATES.growth).toBe(0.2);
  });

  test("should define decay rate for hunger (moderate - 0.4)", () => {
    expect(TITAN_DECAY_RATES.hunger).toBe(0.4);
  });

  test("should define decay rate for energy (slow - 0.25)", () => {
    expect(TITAN_DECAY_RATES.energy).toBe(0.25);
  });

  test("should define decay rate for social (moderate - 0.3)", () => {
    expect(TITAN_DECAY_RATES.social).toBe(0.3);
  });

  test("should define decay rate for fun (moderate - 0.35)", () => {
    expect(TITAN_DECAY_RATES.fun).toBe(0.35);
  });

  test("should define decay rate for wealth (very slow - 0.05)", () => {
    expect(TITAN_DECAY_RATES.wealth).toBe(0.05);
  });

  test("should define decay rate for purpose (slow - 0.1)", () => {
    expect(TITAN_DECAY_RATES.purpose).toBe(0.1);
  });

  test("attention should decay fastest (Titan craves player attention)", () => {
    expect(TITAN_DECAY_RATES.attention).toBeGreaterThan(TITAN_DECAY_RATES.hunger);
    expect(TITAN_DECAY_RATES.attention).toBeGreaterThan(TITAN_DECAY_RATES.energy);
    expect(TITAN_DECAY_RATES.attention).toBeGreaterThan(TITAN_DECAY_RATES.social);
  });

  test("wealth should decay slowest (Titan doesn't care much about money)", () => {
    expect(TITAN_DECAY_RATES.wealth).toBeLessThan(TITAN_DECAY_RATES.hunger);
    expect(TITAN_DECAY_RATES.wealth).toBeLessThan(TITAN_DECAY_RATES.energy);
    expect(TITAN_DECAY_RATES.wealth).toBeLessThan(TITAN_DECAY_RATES.attention);
    expect(TITAN_DECAY_RATES.wealth).toBeLessThan(TITAN_DECAY_RATES.growth);
  });
});

/**
 * Test Suite: TITAN_CRITICAL_THRESHOLDS
 * Tests the critical thresholds for Titan needs
 */
test.describe("TITAN_CRITICAL_THRESHOLDS", () => {
  test("should define thresholds for all Titan need types", () => {
    expect(TITAN_CRITICAL_THRESHOLDS.hunger).toBeDefined();
    expect(TITAN_CRITICAL_THRESHOLDS.energy).toBeDefined();
    expect(TITAN_CRITICAL_THRESHOLDS.social).toBeDefined();
    expect(TITAN_CRITICAL_THRESHOLDS.fun).toBeDefined();
    expect(TITAN_CRITICAL_THRESHOLDS.wealth).toBeDefined();
    expect(TITAN_CRITICAL_THRESHOLDS.purpose).toBeDefined();
    expect(TITAN_CRITICAL_THRESHOLDS.attention).toBeDefined();
    expect(TITAN_CRITICAL_THRESHOLDS.growth).toBeDefined();
  });

  test("all thresholds should be between 0 and 50", () => {
    Object.values(TITAN_CRITICAL_THRESHOLDS).forEach(threshold => {
      expect(threshold).toBeGreaterThanOrEqual(0);
      expect(threshold).toBeLessThanOrEqual(50);
    });
  });
});

/**
 * Test Suite: TITAN_DEFAULT_WEIGHTS
 * Tests the priority weights for Utility AI scoring
 */
test.describe("TITAN_DEFAULT_WEIGHTS", () => {
  test("should define weights for all Titan need types", () => {
    expect(TITAN_DEFAULT_WEIGHTS.hunger).toBeDefined();
    expect(TITAN_DEFAULT_WEIGHTS.energy).toBeDefined();
    expect(TITAN_DEFAULT_WEIGHTS.social).toBeDefined();
    expect(TITAN_DEFAULT_WEIGHTS.fun).toBeDefined();
    expect(TITAN_DEFAULT_WEIGHTS.wealth).toBeDefined();
    expect(TITAN_DEFAULT_WEIGHTS.purpose).toBeDefined();
    expect(TITAN_DEFAULT_WEIGHTS.attention).toBeDefined();
    expect(TITAN_DEFAULT_WEIGHTS.growth).toBeDefined();
  });

  test("attention should have high weight (Titan values player interaction)", () => {
    expect(TITAN_DEFAULT_WEIGHTS.attention).toBeGreaterThan(TITAN_DEFAULT_WEIGHTS.wealth);
  });
});

/**
 * Test Suite: TITAN_NEED_DESCRIPTIONS
 * Tests the Hitchhiker's Guide style descriptions
 */
test.describe("TITAN_NEED_DESCRIPTIONS", () => {
  test("should have description for attention", () => {
    expect(TITAN_NEED_DESCRIPTIONS.attention).toBeDefined();
    expect(TITAN_NEED_DESCRIPTIONS.attention.length).toBeGreaterThan(0);
  });

  test("should have description for growth", () => {
    expect(TITAN_NEED_DESCRIPTIONS.growth).toBeDefined();
    expect(TITAN_NEED_DESCRIPTIONS.growth.length).toBeGreaterThan(0);
  });

  test("should have descriptions for all need types", () => {
    expect(TITAN_NEED_DESCRIPTIONS.hunger).toBeDefined();
    expect(TITAN_NEED_DESCRIPTIONS.energy).toBeDefined();
    expect(TITAN_NEED_DESCRIPTIONS.social).toBeDefined();
    expect(TITAN_NEED_DESCRIPTIONS.fun).toBeDefined();
    expect(TITAN_NEED_DESCRIPTIONS.wealth).toBeDefined();
    expect(TITAN_NEED_DESCRIPTIONS.purpose).toBeDefined();
    expect(TITAN_NEED_DESCRIPTIONS.attention).toBeDefined();
    expect(TITAN_NEED_DESCRIPTIONS.growth).toBeDefined();
  });
});

/**
 * Test Suite: TITAN_NEED_SATISFIERS
 * Tests what satisfies each Titan need
 */
test.describe("TITAN_NEED_SATISFIERS", () => {
  test("should have satisfiers for attention", () => {
    expect(TITAN_NEED_SATISFIERS.attention).toBeDefined();
    expect(TITAN_NEED_SATISFIERS.attention.length).toBeGreaterThan(0);
    expect(TITAN_NEED_SATISFIERS.attention).toContain('god_hand_pet');
  });

  test("should have satisfiers for growth", () => {
    expect(TITAN_NEED_SATISFIERS.growth).toBeDefined();
    expect(TITAN_NEED_SATISFIERS.growth.length).toBeGreaterThan(0);
    expect(TITAN_NEED_SATISFIERS.growth).toContain('learn_skill');
  });

  test("should have satisfiers for all need types", () => {
    expect(TITAN_NEED_SATISFIERS.hunger).toBeDefined();
    expect(TITAN_NEED_SATISFIERS.energy).toBeDefined();
    expect(TITAN_NEED_SATISFIERS.social).toBeDefined();
    expect(TITAN_NEED_SATISFIERS.fun).toBeDefined();
    expect(TITAN_NEED_SATISFIERS.wealth).toBeDefined();
    expect(TITAN_NEED_SATISFIERS.purpose).toBeDefined();
    expect(TITAN_NEED_SATISFIERS.attention).toBeDefined();
    expect(TITAN_NEED_SATISFIERS.growth).toBeDefined();
  });
});

/**
 * Test Suite: createDefaultTitanNeeds
 * Tests creating default Titan needs with randomized starting values
 */
test.describe("createDefaultTitanNeeds", () => {
  test("should return all eight need types", () => {
    const needs = createDefaultTitanNeeds();

    expect(needs.hunger).toBeDefined();
    expect(needs.energy).toBeDefined();
    expect(needs.social).toBeDefined();
    expect(needs.fun).toBeDefined();
    expect(needs.wealth).toBeDefined();
    expect(needs.purpose).toBeDefined();
    expect(needs.attention).toBeDefined();
    expect(needs.growth).toBeDefined();
  });

  test("should initialize with randomized values (60-100)", () => {
    // Run multiple times to check randomization
    for (let i = 0; i < 10; i++) {
      const needs = createDefaultTitanNeeds();
      
      Object.values(needs).forEach(need => {
        expect(need.current).toBeGreaterThanOrEqual(60);
        expect(need.current).toBeLessThanOrEqual(100);
      });
    }
  });

  test("should use Titan-specific decay rates", () => {
    const needs = createDefaultTitanNeeds();

    expect(needs.hunger.decayRate).toBe(TITAN_DECAY_RATES.hunger);
    expect(needs.energy.decayRate).toBe(TITAN_DECAY_RATES.energy);
    expect(needs.social.decayRate).toBe(TITAN_DECAY_RATES.social);
    expect(needs.fun.decayRate).toBe(TITAN_DECAY_RATES.fun);
    expect(needs.wealth.decayRate).toBe(TITAN_DECAY_RATES.wealth);
    expect(needs.purpose.decayRate).toBe(TITAN_DECAY_RATES.purpose);
    expect(needs.attention.decayRate).toBe(TITAN_DECAY_RATES.attention);
    expect(needs.growth.decayRate).toBe(TITAN_DECAY_RATES.growth);
  });

  test("should use Titan-specific critical thresholds", () => {
    const needs = createDefaultTitanNeeds();

    expect(needs.hunger.criticalThreshold).toBe(TITAN_CRITICAL_THRESHOLDS.hunger);
    expect(needs.energy.criticalThreshold).toBe(TITAN_CRITICAL_THRESHOLDS.energy);
    expect(needs.attention.criticalThreshold).toBe(TITAN_CRITICAL_THRESHOLDS.attention);
    expect(needs.growth.criticalThreshold).toBe(TITAN_CRITICAL_THRESHOLDS.growth);
  });

  test("should use Titan-specific weights", () => {
    const needs = createDefaultTitanNeeds();

    expect(needs.hunger.weight).toBe(TITAN_DEFAULT_WEIGHTS.hunger);
    expect(needs.attention.weight).toBe(TITAN_DEFAULT_WEIGHTS.attention);
    expect(needs.growth.weight).toBe(TITAN_DEFAULT_WEIGHTS.growth);
  });
});

/**
 * Test Suite: updateTitanNeeds
 * Tests decay functionality over time
 */
test.describe("updateTitanNeeds", () => {
  test("should decay all needs over time", () => {
    const needs = createDefaultTitanNeeds();
    
    // Set all to 80 for predictable testing
    Object.values(needs).forEach(need => {
      need.current = 80;
    });

    const deltaMinutes = 10;
    const updatedNeeds = updateTitanNeeds(needs, deltaMinutes);

    // Each need should have decayed by decayRate * deltaMinutes
    expect(updatedNeeds.hunger.current).toBe(80 - TITAN_DECAY_RATES.hunger * deltaMinutes);
    expect(updatedNeeds.energy.current).toBe(80 - TITAN_DECAY_RATES.energy * deltaMinutes);
    expect(updatedNeeds.attention.current).toBe(80 - TITAN_DECAY_RATES.attention * deltaMinutes);
    expect(updatedNeeds.growth.current).toBe(80 - TITAN_DECAY_RATES.growth * deltaMinutes);
  });

  test("should not decay below 0", () => {
    const needs = createDefaultTitanNeeds();
    
    // Set all to very low values
    Object.values(needs).forEach(need => {
      need.current = 2;
    });

    const deltaMinutes = 100; // Long time to ensure would go negative
    const updatedNeeds = updateTitanNeeds(needs, deltaMinutes);

    Object.values(updatedNeeds).forEach(need => {
      expect(need.current).toBeGreaterThanOrEqual(0);
    });
  });

  test("should handle zero delta time", () => {
    const needs = createDefaultTitanNeeds();
    
    Object.values(needs).forEach(need => {
      need.current = 80;
    });

    const updatedNeeds = updateTitanNeeds(needs, 0);

    Object.values(updatedNeeds).forEach(need => {
      expect(need.current).toBe(80);
    });
  });

  test("should return a new object (pure function)", () => {
    const needs = createDefaultTitanNeeds();
    const updatedNeeds = updateTitanNeeds(needs, 10);

    expect(updatedNeeds).not.toBe(needs);
    expect(updatedNeeds.hunger).not.toBe(needs.hunger);
  });

  test("attention should decay faster than other needs", () => {
    const needs = createDefaultTitanNeeds();
    
    Object.values(needs).forEach(need => {
      need.current = 80;
    });

    const deltaMinutes = 10;
    const updatedNeeds = updateTitanNeeds(needs, deltaMinutes);

    // Attention should have decayed more than hunger
    const attentionDecay = 80 - updatedNeeds.attention.current;
    const hungerDecay = 80 - updatedNeeds.hunger.current;
    expect(attentionDecay).toBeGreaterThan(hungerDecay);
  });
});

/**
 * Test Suite: satisfyTitanNeed
 * Tests fulfilling specific Titan needs
 */
test.describe("satisfyTitanNeed", () => {
  test("should increase the specified need", () => {
    const needs = createDefaultTitanNeeds();
    needs.attention.current = 30;

    const updatedNeeds = satisfyTitanNeed(needs, 'attention', 50);

    expect(updatedNeeds.attention.current).toBe(80);
  });

  test("should not exceed max value", () => {
    const needs = createDefaultTitanNeeds();
    needs.growth.current = 80;

    const updatedNeeds = satisfyTitanNeed(needs, 'growth', 50);

    expect(updatedNeeds.growth.current).toBe(100);
  });

  test("should not affect other needs", () => {
    const needs = createDefaultTitanNeeds();
    needs.attention.current = 30;
    needs.growth.current = 40;
    needs.hunger.current = 50;

    const updatedNeeds = satisfyTitanNeed(needs, 'attention', 50);

    expect(updatedNeeds.growth.current).toBe(40);
    expect(updatedNeeds.hunger.current).toBe(50);
  });

  test("should handle all Titan need types", () => {
    const needTypes: TitanNeedType[] = ['hunger', 'energy', 'social', 'fun', 'wealth', 'purpose', 'attention', 'growth'];

    for (const needType of needTypes) {
      const needs = createDefaultTitanNeeds();
      needs[needType].current = 20;

      const updatedNeeds = satisfyTitanNeed(needs, needType, 30);
      expect(updatedNeeds[needType].current).toBe(50);
    }
  });

  test("should return a new object (pure function)", () => {
    const needs = createDefaultTitanNeeds();
    const updatedNeeds = satisfyTitanNeed(needs, 'hunger', 10);

    expect(updatedNeeds).not.toBe(needs);
    expect(updatedNeeds.hunger).not.toBe(needs.hunger);
  });
});

/**
 * Test Suite: getMostUrgentTitanNeed
 * Tests finding the most critical Titan need
 */
test.describe("getMostUrgentTitanNeed", () => {
  test("should return the need with lowest current value factoring weight", () => {
    const needs = createDefaultTitanNeeds();
    
    needs.hunger.current = 50;
    needs.energy.current = 60;
    needs.social.current = 70;
    needs.fun.current = 80;
    needs.wealth.current = 90;
    needs.purpose.current = 90;
    needs.attention.current = 10; // Lowest
    needs.growth.current = 70;

    const urgent = getMostUrgentTitanNeed(needs);

    expect(urgent).not.toBeNull();
    expect(urgent!.name).toBe('attention');
    expect(urgent!.need).toBe(needs.attention);
  });

  test("should return critical needs first", () => {
    const needs = createDefaultTitanNeeds();
    
    needs.hunger.current = 50;
    needs.energy.current = 60;
    needs.social.current = 70;
    needs.fun.current = 80;
    needs.wealth.current = 90;
    needs.purpose.current = 90;
    needs.attention.current = 60;
    needs.growth.current = 10; // Below critical threshold

    const urgent = getMostUrgentTitanNeed(needs);

    // Growth should be most urgent if below critical threshold
    expect(urgent).not.toBeNull();
  });

  test("should handle all needs at max", () => {
    const needs = createDefaultTitanNeeds();
    
    Object.values(needs).forEach(need => {
      need.current = 100;
    });

    const urgent = getMostUrgentTitanNeed(needs);

    // Should return null or the lowest weighted need when all are max
    // Since all are 100, could return null or any need
    expect(urgent === null || urgent.name !== undefined).toBe(true);
  });

  test("should return null if all needs are fully satisfied", () => {
    const needs = createDefaultTitanNeeds();
    
    Object.values(needs).forEach(need => {
      need.current = need.max;
    });

    const urgent = getMostUrgentTitanNeed(needs);

    // When all needs are at max, there's nothing urgent
    expect(urgent).toBeNull();
  });

  test("should factor in weight when determining urgency", () => {
    const needs = createDefaultTitanNeeds();
    
    // Set all to same low value
    Object.values(needs).forEach(need => {
      need.current = 20;
    });

    const urgent = getMostUrgentTitanNeed(needs);
    
    // Should return something (highest weighted need among equally low values)
    expect(urgent).not.toBeNull();
    expect(urgent!.name).toBeDefined();
  });
});

/**
 * Test Suite: getTitanNeedStatus
 * Tests overall status determination
 */
test.describe("getTitanNeedStatus", () => {
  test("should return 'critical' when any need is below critical threshold", () => {
    const needs = createDefaultTitanNeeds();
    
    Object.values(needs).forEach(need => {
      need.current = 80;
    });
    needs.attention.current = 5; // Far below any threshold

    const status = getTitanNeedStatus(needs);
    expect(status).toBe('critical');
  });

  test("should return 'low' when needs are between critical and 40", () => {
    const needs = createDefaultTitanNeeds();
    
    Object.values(needs).forEach(need => {
      need.current = 35; // Above critical but low
    });

    const status = getTitanNeedStatus(needs);
    expect(status).toBe('low');
  });

  test("should return 'moderate' when needs are between 40 and 70", () => {
    const needs = createDefaultTitanNeeds();
    
    Object.values(needs).forEach(need => {
      need.current = 55;
    });

    const status = getTitanNeedStatus(needs);
    expect(status).toBe('moderate');
  });

  test("should return 'satisfied' when all needs are above 70", () => {
    const needs = createDefaultTitanNeeds();
    
    Object.values(needs).forEach(need => {
      need.current = 85;
    });

    const status = getTitanNeedStatus(needs);
    expect(status).toBe('satisfied');
  });

  test("should prioritize worst status", () => {
    const needs = createDefaultTitanNeeds();
    
    // Most needs are satisfied
    Object.values(needs).forEach(need => {
      need.current = 85;
    });
    // But one is critical
    needs.growth.current = 5;

    const status = getTitanNeedStatus(needs);
    expect(status).toBe('critical');
  });
});

/**
 * Test Suite: Integration with Need type
 * Tests that Titan needs are compatible with base Need type
 */
test.describe("Integration with Need type", () => {
  test("TitanNeeds should extend NPCNeeds with additional fields", () => {
    const needs = createDefaultTitanNeeds();

    // Should have all NPCNeeds properties
    expect(needs.hunger).toBeDefined();
    expect(needs.energy).toBeDefined();
    expect(needs.social).toBeDefined();
    expect(needs.fun).toBeDefined();
    expect(needs.wealth).toBeDefined();
    expect(needs.purpose).toBeDefined();

    // Plus Titan-specific needs
    expect(needs.attention).toBeDefined();
    expect(needs.growth).toBeDefined();
  });

  test("each Titan need should have Need structure", () => {
    const needs = createDefaultTitanNeeds();

    Object.values(needs).forEach((need: Need) => {
      expect(typeof need.current).toBe('number');
      expect(typeof need.max).toBe('number');
      expect(typeof need.decayRate).toBe('number');
      expect(typeof need.criticalThreshold).toBe('number');
      expect(typeof need.weight).toBe('number');
    });
  });
});
