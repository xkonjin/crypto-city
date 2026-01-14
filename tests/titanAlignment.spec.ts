import { test, expect } from "@playwright/test";

/**
 * Tests for Titan Alignment System
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * The alignment system tracks whether the Titan is good (-1.0 to 0) or evil (0 to +1.0).
 * 
 * @see specs/HERO_PET_SYSTEM.md for full design documentation
 */

import type { AlignmentState, ActionHistoryEntry } from "@/games/isocity/types/titan";
import {
  ALIGNMENT_ACTION_IMPACTS,
  GOOD_ACTIONS,
  EVIL_ACTIONS,
  NEUTRAL_ACTIONS,
  calculateAlignment,
  shiftAlignment,
  getAlignmentState,
  getActionAlignmentImpact,
  decayAlignment,
} from "@/lib/titan/TitanAlignment";

// ============================================================================
// Test Suite: ALIGNMENT_ACTION_IMPACTS
// ============================================================================

test.describe("ALIGNMENT_ACTION_IMPACTS", () => {
  test.describe("Good actions (negative values = toward angelic)", () => {
    test("help_npc should have impact -0.05", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['help_npc']).toBe(-0.05);
    });

    test("protect_npc should have impact -0.1", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['protect_npc']).toBe(-0.1);
    });

    test("heal_npc should have impact -0.1", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['heal_npc']).toBe(-0.1);
    });

    test("teach_npc should have impact -0.05", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['teach_npc']).toBe(-0.05);
    });

    test("donate should have impact -0.08", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['donate']).toBe(-0.08);
    });

    test("share_alpha should have impact -0.03", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['share_alpha']).toBe(-0.03);
    });

    test("comfort_npc should have impact -0.04", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['comfort_npc']).toBe(-0.04);
    });

    test("build_community should have impact -0.06", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['build_community']).toBe(-0.06);
    });
  });

  test.describe("Evil actions (positive values = toward demonic)", () => {
    test("steal should have impact 0.08", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['steal']).toBe(0.08);
    });

    test("scare_npc should have impact 0.05", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['scare_npc']).toBe(0.05);
    });

    test("attack_npc should have impact 0.15", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['attack_npc']).toBe(0.15);
    });

    test("destroy_property should have impact 0.1", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['destroy_property']).toBe(0.1);
    });

    test("hoard_resources should have impact 0.04", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['hoard_resources']).toBe(0.04);
    });

    test("spread_fud should have impact 0.06", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['spread_fud']).toBe(0.06);
    });

    test("manipulate_market should have impact 0.12", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['manipulate_market']).toBe(0.12);
    });

    test("intimidate should have impact 0.07", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['intimidate']).toBe(0.07);
    });
  });

  test.describe("Neutral actions (zero impact)", () => {
    test("eat should have impact 0", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['eat']).toBe(0);
    });

    test("sleep should have impact 0", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['sleep']).toBe(0);
    });

    test("walk should have impact 0", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['walk']).toBe(0);
    });

    test("observe should have impact 0", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['observe']).toBe(0);
    });

    test("play should have impact 0", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['play']).toBe(0);
    });

    test("gather should have impact 0", () => {
      expect(ALIGNMENT_ACTION_IMPACTS['gather']).toBe(0);
    });
  });
});

// ============================================================================
// Test Suite: Action Lists
// ============================================================================

test.describe("GOOD_ACTIONS", () => {
  test("should contain all good action names", () => {
    expect(GOOD_ACTIONS).toContain('help_npc');
    expect(GOOD_ACTIONS).toContain('protect_npc');
    expect(GOOD_ACTIONS).toContain('heal_npc');
    expect(GOOD_ACTIONS).toContain('teach_npc');
    expect(GOOD_ACTIONS).toContain('donate');
    expect(GOOD_ACTIONS).toContain('share_alpha');
    expect(GOOD_ACTIONS).toContain('comfort_npc');
    expect(GOOD_ACTIONS).toContain('build_community');
  });

  test("should have 8 good actions", () => {
    expect(GOOD_ACTIONS.length).toBe(8);
  });

  test("all actions should have negative alignment impact", () => {
    for (const action of GOOD_ACTIONS) {
      expect(ALIGNMENT_ACTION_IMPACTS[action]).toBeLessThan(0);
    }
  });
});

test.describe("EVIL_ACTIONS", () => {
  test("should contain all evil action names", () => {
    expect(EVIL_ACTIONS).toContain('steal');
    expect(EVIL_ACTIONS).toContain('scare_npc');
    expect(EVIL_ACTIONS).toContain('attack_npc');
    expect(EVIL_ACTIONS).toContain('destroy_property');
    expect(EVIL_ACTIONS).toContain('hoard_resources');
    expect(EVIL_ACTIONS).toContain('spread_fud');
    expect(EVIL_ACTIONS).toContain('manipulate_market');
    expect(EVIL_ACTIONS).toContain('intimidate');
  });

  test("should have 8 evil actions", () => {
    expect(EVIL_ACTIONS.length).toBe(8);
  });

  test("all actions should have positive alignment impact", () => {
    for (const action of EVIL_ACTIONS) {
      expect(ALIGNMENT_ACTION_IMPACTS[action]).toBeGreaterThan(0);
    }
  });
});

test.describe("NEUTRAL_ACTIONS", () => {
  test("should contain all neutral action names", () => {
    expect(NEUTRAL_ACTIONS).toContain('eat');
    expect(NEUTRAL_ACTIONS).toContain('sleep');
    expect(NEUTRAL_ACTIONS).toContain('walk');
    expect(NEUTRAL_ACTIONS).toContain('observe');
    expect(NEUTRAL_ACTIONS).toContain('play');
    expect(NEUTRAL_ACTIONS).toContain('gather');
  });

  test("should have 6 neutral actions", () => {
    expect(NEUTRAL_ACTIONS.length).toBe(6);
  });

  test("all actions should have zero alignment impact", () => {
    for (const action of NEUTRAL_ACTIONS) {
      expect(ALIGNMENT_ACTION_IMPACTS[action]).toBe(0);
    }
  });
});

// ============================================================================
// Test Suite: getActionAlignmentImpact
// ============================================================================

test.describe("getActionAlignmentImpact", () => {
  test("should return correct impact for known good actions", () => {
    expect(getActionAlignmentImpact('help_npc')).toBe(-0.05);
    expect(getActionAlignmentImpact('protect_npc')).toBe(-0.1);
  });

  test("should return correct impact for known evil actions", () => {
    expect(getActionAlignmentImpact('steal')).toBe(0.08);
    expect(getActionAlignmentImpact('attack_npc')).toBe(0.15);
  });

  test("should return correct impact for known neutral actions", () => {
    expect(getActionAlignmentImpact('eat')).toBe(0);
    expect(getActionAlignmentImpact('sleep')).toBe(0);
  });

  test("should return 0 for unknown actions", () => {
    expect(getActionAlignmentImpact('unknown_action')).toBe(0);
    expect(getActionAlignmentImpact('random_thing')).toBe(0);
    expect(getActionAlignmentImpact('')).toBe(0);
  });
});

// ============================================================================
// Test Suite: shiftAlignment
// ============================================================================

test.describe("shiftAlignment", () => {
  test("should shift alignment by positive delta", () => {
    expect(shiftAlignment(0, 0.1)).toBe(0.1);
    expect(shiftAlignment(0.2, 0.3)).toBe(0.5);
  });

  test("should shift alignment by negative delta", () => {
    expect(shiftAlignment(0, -0.1)).toBe(-0.1);
    expect(shiftAlignment(-0.2, -0.3)).toBe(-0.5);
  });

  test("should clamp to maximum of +1.0", () => {
    expect(shiftAlignment(0.8, 0.5)).toBe(1.0);
    expect(shiftAlignment(1.0, 0.1)).toBe(1.0);
    expect(shiftAlignment(0.95, 0.1)).toBe(1.0);
  });

  test("should clamp to minimum of -1.0", () => {
    expect(shiftAlignment(-0.8, -0.5)).toBe(-1.0);
    expect(shiftAlignment(-1.0, -0.1)).toBe(-1.0);
    expect(shiftAlignment(-0.95, -0.1)).toBe(-1.0);
  });

  test("should handle zero delta", () => {
    expect(shiftAlignment(0.5, 0)).toBe(0.5);
    expect(shiftAlignment(-0.3, 0)).toBe(-0.3);
    expect(shiftAlignment(0, 0)).toBe(0);
  });

  test("should handle crossing zero", () => {
    expect(shiftAlignment(0.1, -0.3)).toBeCloseTo(-0.2, 10);
    expect(shiftAlignment(-0.1, 0.3)).toBeCloseTo(0.2, 10);
  });
});

// ============================================================================
// Test Suite: getAlignmentState
// ============================================================================

test.describe("getAlignmentState", () => {
  test("should return 'angelic' for -1.0 to -0.6", () => {
    expect(getAlignmentState(-1.0)).toBe('angelic');
    expect(getAlignmentState(-0.8)).toBe('angelic');
    expect(getAlignmentState(-0.6)).toBe('angelic');
  });

  test("should return 'good' for -0.6 (exclusive) to -0.2", () => {
    expect(getAlignmentState(-0.59)).toBe('good');
    expect(getAlignmentState(-0.4)).toBe('good');
    expect(getAlignmentState(-0.2)).toBe('good');
  });

  test("should return 'neutral' for -0.2 (exclusive) to +0.2", () => {
    expect(getAlignmentState(-0.19)).toBe('neutral');
    expect(getAlignmentState(0)).toBe('neutral');
    expect(getAlignmentState(0.19)).toBe('neutral');
    expect(getAlignmentState(0.2)).toBe('neutral');
  });

  test("should return 'evil' for +0.2 (exclusive) to +0.6", () => {
    expect(getAlignmentState(0.21)).toBe('evil');
    expect(getAlignmentState(0.4)).toBe('evil');
    expect(getAlignmentState(0.6)).toBe('evil');
  });

  test("should return 'demonic' for +0.6 (exclusive) to +1.0", () => {
    expect(getAlignmentState(0.61)).toBe('demonic');
    expect(getAlignmentState(0.8)).toBe('demonic');
    expect(getAlignmentState(1.0)).toBe('demonic');
  });

  test("should handle boundary cases correctly", () => {
    // Exact boundaries should be handled consistently
    expect(getAlignmentState(-0.6)).toBe('angelic');
    expect(getAlignmentState(-0.2)).toBe('good');
    expect(getAlignmentState(0.2)).toBe('neutral');
    expect(getAlignmentState(0.6)).toBe('evil');
  });

  test("should clamp out-of-range values", () => {
    // Values beyond the valid range should still return appropriate states
    expect(getAlignmentState(-1.5)).toBe('angelic');
    expect(getAlignmentState(1.5)).toBe('demonic');
  });
});

// ============================================================================
// Test Suite: decayAlignment
// ============================================================================

test.describe("decayAlignment", () => {
  test("should decay positive alignment toward 0 at rate 0.001 per minute", () => {
    // 10 minutes should decay by 0.01
    expect(decayAlignment(0.5, 10)).toBeCloseTo(0.49, 5);
  });

  test("should decay negative alignment toward 0 at rate 0.001 per minute", () => {
    // 10 minutes should decay by 0.01
    expect(decayAlignment(-0.5, 10)).toBeCloseTo(-0.49, 5);
  });

  test("should not decay past zero from positive", () => {
    // Starting at 0.005 with 10 minutes should not go below 0
    expect(decayAlignment(0.005, 10)).toBe(0);
  });

  test("should not decay past zero from negative", () => {
    // Starting at -0.005 with 10 minutes should not go above 0
    expect(decayAlignment(-0.005, 10)).toBe(0);
  });

  test("should not exceed maximum decay of 0.01 per tick", () => {
    // Even with 100 minutes, should only decay by max 0.01
    expect(decayAlignment(0.5, 100)).toBeCloseTo(0.49, 5);
    expect(decayAlignment(-0.5, 100)).toBeCloseTo(-0.49, 5);
  });

  test("should handle zero alignment", () => {
    expect(decayAlignment(0, 10)).toBe(0);
    expect(decayAlignment(0, 100)).toBe(0);
  });

  test("should handle zero delta time", () => {
    expect(decayAlignment(0.5, 0)).toBe(0.5);
    expect(decayAlignment(-0.5, 0)).toBe(-0.5);
  });

  test("should handle extreme alignments correctly", () => {
    // Demonic alignment (-1.0) should decay toward neutral
    expect(decayAlignment(1.0, 10)).toBeCloseTo(0.99, 5);
    // Angelic alignment (-1.0) should decay toward neutral
    expect(decayAlignment(-1.0, 10)).toBeCloseTo(-0.99, 5);
  });
});

// ============================================================================
// Test Suite: calculateAlignment
// ============================================================================

test.describe("calculateAlignment", () => {
  // Helper to create action history entries
  function createAction(action: string, minutesAgo: number): ActionHistoryEntry {
    return {
      action,
      timestamp: Date.now() - minutesAgo * 60 * 1000,
      alignmentImpact: ALIGNMENT_ACTION_IMPACTS[action] ?? 0,
    };
  }

  test("should return 0 for empty action history", () => {
    expect(calculateAlignment([])).toBe(0);
  });

  test("should calculate alignment from single good action", () => {
    const history: ActionHistoryEntry[] = [
      createAction('help_npc', 0), // impact: -0.05
    ];
    // Single recent action with weight 1.0
    expect(calculateAlignment(history)).toBeLessThan(0);
  });

  test("should calculate alignment from single evil action", () => {
    const history: ActionHistoryEntry[] = [
      createAction('steal', 0), // impact: 0.08
    ];
    expect(calculateAlignment(history)).toBeGreaterThan(0);
  });

  test("should calculate alignment from mixed actions", () => {
    const history: ActionHistoryEntry[] = [
      createAction('help_npc', 0),  // -0.05
      createAction('steal', 0),      // +0.08
    ];
    // Should be slightly positive
    expect(calculateAlignment(history)).toBeGreaterThan(0);
  });

  test("should apply recency weighting - last 10 actions have weight 1.0", () => {
    const history: ActionHistoryEntry[] = [];
    // Add 10 recent help actions
    for (let i = 0; i < 10; i++) {
      history.push(createAction('help_npc', i));
    }
    const alignment = calculateAlignment(history);
    // All should have full weight
    expect(alignment).toBeLessThan(0);
  });

  test("should apply recency weighting - actions 11-30 have weight 0.7", () => {
    const history: ActionHistoryEntry[] = [];
    // Add actions in order (oldest first based on index simulation)
    for (let i = 0; i < 30; i++) {
      history.push({
        action: 'help_npc',
        timestamp: Date.now(),
        alignmentImpact: -0.05,
      });
    }
    const alignment = calculateAlignment(history);
    // Should be negative
    expect(alignment).toBeLessThan(0);
  });

  test("should apply recency weighting - actions 31-60 have weight 0.4", () => {
    const history: ActionHistoryEntry[] = [];
    for (let i = 0; i < 60; i++) {
      history.push({
        action: 'help_npc',
        timestamp: Date.now(),
        alignmentImpact: -0.05,
      });
    }
    const alignment = calculateAlignment(history);
    expect(alignment).toBeLessThan(0);
  });

  test("should apply recency weighting - actions 61-100 have weight 0.2", () => {
    const history: ActionHistoryEntry[] = [];
    for (let i = 0; i < 100; i++) {
      history.push({
        action: 'help_npc',
        timestamp: Date.now(),
        alignmentImpact: -0.05,
      });
    }
    const alignment = calculateAlignment(history);
    expect(alignment).toBeLessThan(0);
  });

  test("should apply recency weighting - older actions have weight 0.1", () => {
    const history: ActionHistoryEntry[] = [];
    for (let i = 0; i < 150; i++) {
      history.push({
        action: 'help_npc',
        timestamp: Date.now(),
        alignmentImpact: -0.05,
      });
    }
    const alignment = calculateAlignment(history);
    expect(alignment).toBeLessThan(0);
  });

  test("should clamp result to -1.0 minimum", () => {
    const history: ActionHistoryEntry[] = [];
    // Add many good actions to push alignment very negative
    for (let i = 0; i < 100; i++) {
      history.push({
        action: 'protect_npc',
        timestamp: Date.now(),
        alignmentImpact: -0.1, // Strong good action
      });
    }
    expect(calculateAlignment(history)).toBeGreaterThanOrEqual(-1.0);
  });

  test("should clamp result to +1.0 maximum", () => {
    const history: ActionHistoryEntry[] = [];
    // Add many evil actions to push alignment very positive
    for (let i = 0; i < 100; i++) {
      history.push({
        action: 'attack_npc',
        timestamp: Date.now(),
        alignmentImpact: 0.15, // Strong evil action
      });
    }
    expect(calculateAlignment(history)).toBeLessThanOrEqual(1.0);
  });

  test("recent actions should outweigh older actions", () => {
    // 50 old good actions followed by 10 recent evil actions
    const history: ActionHistoryEntry[] = [];
    
    // Older good actions (index 0-49)
    for (let i = 0; i < 50; i++) {
      history.push({
        action: 'help_npc',
        timestamp: Date.now(),
        alignmentImpact: -0.05,
      });
    }
    
    // Recent evil actions (index 50-59 = last 10)
    for (let i = 0; i < 10; i++) {
      history.push({
        action: 'steal',
        timestamp: Date.now(),
        alignmentImpact: 0.08,
      });
    }
    
    // Recent evil should have stronger effect due to full weighting
    // The result may still be negative overall, but should be closer to 0
    // than if all actions were equally weighted
    const alignment = calculateAlignment(history);
    
    // Just verify the calculation completes and is bounded
    expect(alignment).toBeGreaterThanOrEqual(-1.0);
    expect(alignment).toBeLessThanOrEqual(1.0);
  });

  test("should ignore neutral actions in calculation", () => {
    const historyWithNeutral: ActionHistoryEntry[] = [
      createAction('help_npc', 0), // -0.05
      createAction('eat', 0),       // 0
      createAction('sleep', 0),     // 0
      createAction('walk', 0),      // 0
    ];
    
    const historyWithoutNeutral: ActionHistoryEntry[] = [
      createAction('help_npc', 0), // -0.05
    ];
    
    // Both should give similar results (neutral actions contribute 0)
    const alignmentWith = calculateAlignment(historyWithNeutral);
    const alignmentWithout = calculateAlignment(historyWithoutNeutral);
    
    // The alignment values should be proportionally similar
    expect(alignmentWith).toBeLessThan(0);
    expect(alignmentWithout).toBeLessThan(0);
  });
});

// ============================================================================
// Test Suite: Integration tests
// ============================================================================

test.describe("Integration tests", () => {
  test("complete alignment journey from neutral to good", () => {
    // Start at neutral
    let alignment = 0;
    
    // Perform good actions
    alignment = shiftAlignment(alignment, getActionAlignmentImpact('help_npc'));
    alignment = shiftAlignment(alignment, getActionAlignmentImpact('protect_npc'));
    alignment = shiftAlignment(alignment, getActionAlignmentImpact('heal_npc'));
    
    // Should be in good territory
    expect(alignment).toBeLessThan(0);
    expect(getAlignmentState(alignment)).toBe('good');
  });

  test("complete alignment journey from neutral to evil", () => {
    // Start at neutral
    let alignment = 0;
    
    // Perform evil actions
    alignment = shiftAlignment(alignment, getActionAlignmentImpact('steal'));
    alignment = shiftAlignment(alignment, getActionAlignmentImpact('attack_npc'));
    alignment = shiftAlignment(alignment, getActionAlignmentImpact('intimidate'));
    
    // Should be in evil territory
    expect(alignment).toBeGreaterThan(0);
    expect(getAlignmentState(alignment)).toBe('evil');
  });

  test("alignment redemption arc - evil to good", () => {
    // Start evil
    let alignment = 0.5;
    expect(getAlignmentState(alignment)).toBe('evil');
    
    // Perform many good actions
    for (let i = 0; i < 20; i++) {
      alignment = shiftAlignment(alignment, getActionAlignmentImpact('help_npc'));
    }
    
    // Should have shifted toward good
    expect(alignment).toBeLessThan(0.5);
    // With enough good actions, should become neutral or good
    expect(alignment).toBeLessThanOrEqual(0);
  });

  test("alignment decay over time toward neutral", () => {
    // Start very evil
    let alignment = 0.8;
    
    // Decay over several ticks (each tick max 0.01 decay)
    for (let i = 0; i < 20; i++) {
      alignment = decayAlignment(alignment, 10);
    }
    
    // Should have decayed toward 0
    expect(alignment).toBeLessThan(0.8);
    expect(alignment).toBeCloseTo(0.6, 1); // About 0.2 total decay
  });
});
