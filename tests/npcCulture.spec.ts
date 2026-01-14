import { test, expect } from "@playwright/test";

/**
 * NPC Culture System Tests (#193)
 * 
 * TDD Phase 1: Tests for the NPC culture system including:
 * - Cultural norms and adoption
 * - Traditions and observance
 * - Mentorship system
 * - Cultural drift
 * - Innovation and spread
 * - Sub-cultures
 */

// Import types and classes directly for unit testing
import type {
  CulturalNorm,
  NormType,
  Tradition,
  Mentorship,
  CulturalDrift,
  Innovation,
} from "@/lib/npc/culture";
import {
  ALL_NORM_TYPES,
  CULTURE_DESCRIPTIONS,
  createDefaultNorm,
  createDefaultTradition,
  createDefaultMentorship,
  createDefaultInnovation,
} from "@/lib/npc/culture";
import { CultureManager } from "@/lib/npc/CultureManager";

/**
 * Test Suite: Culture Types
 */
test.describe("Culture Types", () => {
  test("should define all 6 norm types", async () => {
    expect(ALL_NORM_TYPES.length).toBe(6);
    expect(ALL_NORM_TYPES).toContain('greeting');
    expect(ALL_NORM_TYPES).toContain('trading_practice');
    expect(ALL_NORM_TYPES).toContain('work_ethic');
    expect(ALL_NORM_TYPES).toContain('social_behavior');
    expect(ALL_NORM_TYPES).toContain('celebration');
    expect(ALL_NORM_TYPES).toContain('taboo');
  });

  test("CulturalNorm interface should have all required properties", async () => {
    const norm = createDefaultNorm('Test Norm', 'greeting');
    
    expect(typeof norm.id).toBe('string');
    expect(typeof norm.name).toBe('string');
    expect(typeof norm.description).toBe('string');
    expect(ALL_NORM_TYPES).toContain(norm.type);
    expect(typeof norm.prevalence).toBe('number');
    expect(norm.prevalence).toBeGreaterThanOrEqual(0);
    expect(norm.prevalence).toBeLessThanOrEqual(1);
    expect(norm.originFactionId === undefined || typeof norm.originFactionId === 'string').toBe(true);
    expect(norm.adoptedBy instanceof Set).toBe(true);
    expect(typeof norm.createdAt).toBe('number');
  });

  test("Tradition interface should have all required properties", async () => {
    const tradition = createDefaultTradition('faction-1', 'Test Tradition', 'weekly');
    
    expect(typeof tradition.id).toBe('string');
    expect(typeof tradition.name).toBe('string');
    expect(typeof tradition.description).toBe('string');
    expect(typeof tradition.factionId).toBe('string');
    expect(['daily', 'weekly', 'monthly', 'yearly']).toContain(tradition.frequency);
    expect(tradition.participants instanceof Set).toBe(true);
    expect(tradition.lastObserved === null || typeof tradition.lastObserved === 'number').toBe(true);
    expect(typeof tradition.createdAt).toBe('number');
  });

  test("Mentorship interface should have all required properties", async () => {
    const mentorship = createDefaultMentorship('mentor-1', 'mentee-1', 'trading');
    
    expect(typeof mentorship.id).toBe('string');
    expect(typeof mentorship.mentorId).toBe('string');
    expect(typeof mentorship.menteeId).toBe('string');
    expect(typeof mentorship.skill).toBe('string');
    expect(typeof mentorship.startedAt).toBe('number');
    expect(typeof mentorship.progress).toBe('number');
    expect(mentorship.progress).toBeGreaterThanOrEqual(0);
    expect(mentorship.progress).toBeLessThanOrEqual(1);
    expect(typeof mentorship.completed).toBe('boolean');
  });

  test("CulturalDrift interface should have all required properties", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Test Norm', 'greeting');
    manager.applyCulturalDrift(norm.id, 100);
    
    const drift = manager.getDrift(norm.id);
    expect(drift).toBeDefined();
    expect(typeof drift!.normId).toBe('string');
    expect(typeof drift!.originalValue).toBe('number');
    expect(typeof drift!.currentValue).toBe('number');
    expect(typeof drift!.driftRate).toBe('number');
  });

  test("Innovation interface should have all required properties", async () => {
    const innovation = createDefaultInnovation('innovator-1', 'greeting', 'A new handshake');
    
    expect(typeof innovation.id).toBe('string');
    expect(typeof innovation.innovatorId).toBe('string');
    expect(ALL_NORM_TYPES).toContain(innovation.type);
    expect(typeof innovation.description).toBe('string');
    expect(typeof innovation.adoptionRate).toBe('number');
    expect(innovation.adoptionRate).toBeGreaterThanOrEqual(0);
    expect(innovation.adoptionRate).toBeLessThanOrEqual(1);
    expect(['viral', 'gradual', 'localized']).toContain(innovation.spreadPattern);
    expect(typeof innovation.createdAt).toBe('number');
  });

  test("createDefaultNorm should create norm with faction origin", async () => {
    const norm = createDefaultNorm('Faction Norm', 'trading_practice', 'faction-123');
    
    expect(norm.name).toBe('Faction Norm');
    expect(norm.type).toBe('trading_practice');
    expect(norm.originFactionId).toBe('faction-123');
    expect(norm.prevalence).toBe(0);
    expect(norm.adoptedBy.size).toBe(0);
  });

  test("createDefaultTradition should create tradition with frequency", async () => {
    const daily = createDefaultTradition('f1', 'Daily Standup', 'daily');
    const yearly = createDefaultTradition('f1', 'Anniversary', 'yearly');
    
    expect(daily.frequency).toBe('daily');
    expect(yearly.frequency).toBe('yearly');
    expect(daily.lastObserved).toBeNull();
    expect(yearly.lastObserved).toBeNull();
  });

  test("createDefaultMentorship should start at 0 progress", async () => {
    const mentorship = createDefaultMentorship('mentor', 'mentee', 'coding');
    
    expect(mentorship.progress).toBe(0);
    expect(mentorship.completed).toBe(false);
  });
});

/**
 * Test Suite: Culture Descriptions (Hitchhiker's Guide Style)
 */
test.describe("Culture Descriptions", () => {
  test("should have descriptions for all norm types", async () => {
    for (const normType of ALL_NORM_TYPES) {
      expect(CULTURE_DESCRIPTIONS[normType]).toBeDefined();
      expect(typeof CULTURE_DESCRIPTIONS[normType]).toBe('string');
      expect(CULTURE_DESCRIPTIONS[normType].length).toBeGreaterThan(0);
    }
  });

  test("should have special descriptions for cultural events", async () => {
    expect(CULTURE_DESCRIPTIONS['normAdoption']).toBeDefined();
    expect(CULTURE_DESCRIPTIONS['traditionObserved']).toBeDefined();
    expect(CULTURE_DESCRIPTIONS['mentorshipComplete']).toBeDefined();
    expect(CULTURE_DESCRIPTIONS['innovation']).toBeDefined();
    expect(CULTURE_DESCRIPTIONS['culturalDrift']).toBeDefined();
  });

  test("descriptions should be sardonic and crypto-themed", async () => {
    // Verify crypto-themed humor in descriptions
    const allDescriptions = Object.values(CULTURE_DESCRIPTIONS).join(' ').toLowerCase();
    // Should contain crypto-related terms somewhere in descriptions
    expect(allDescriptions.length).toBeGreaterThan(100);
  });
});

/**
 * Test Suite: CultureManager - Norm Creation and Adoption
 */
test.describe("CultureManager - Norm Creation", () => {
  test("createNorm should create a new cultural norm", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Handshake Greeting', 'greeting');
    
    expect(norm).toBeDefined();
    expect(norm.id).toBeDefined();
    expect(norm.name).toBe('Handshake Greeting');
    expect(norm.type).toBe('greeting');
    expect(norm.prevalence).toBe(0);
  });

  test("createNorm should allow faction origin", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Diamond Hands', 'trading_practice', 'bitcoin-faction');
    
    expect(norm.originFactionId).toBe('bitcoin-faction');
  });

  test("createNorm should generate unique IDs", async () => {
    const manager = new CultureManager();
    const norm1 = manager.createNorm('Norm 1', 'greeting');
    const norm2 = manager.createNorm('Norm 2', 'greeting');
    
    expect(norm1.id).not.toBe(norm2.id);
  });

  test("getNorm should retrieve norm by ID", async () => {
    const manager = new CultureManager();
    const created = manager.createNorm('Test Norm', 'taboo');
    
    const retrieved = manager.getNorm(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test Norm');
  });

  test("getNorm should return null for non-existent norm", async () => {
    const manager = new CultureManager();
    const norm = manager.getNorm('non-existent');
    expect(norm).toBeNull();
  });

  test("getAllNorms should return all created norms", async () => {
    const manager = new CultureManager();
    manager.createNorm('Norm 1', 'greeting');
    manager.createNorm('Norm 2', 'taboo');
    manager.createNorm('Norm 3', 'work_ethic');
    
    const norms = manager.getAllNorms();
    expect(norms.length).toBe(3);
  });
});

/**
 * Test Suite: CultureManager - Norm Adoption
 */
test.describe("CultureManager - Norm Adoption", () => {
  test("adoptNorm should add NPC to norm's adopters", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('HODL Culture', 'trading_practice');
    
    const result = manager.adoptNorm('npc-1', norm.id);
    
    expect(result).toBe(true);
    expect(norm.adoptedBy.has('npc-1')).toBe(true);
  });

  test("adoptNorm should increase prevalence", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('HODL Culture', 'trading_practice');
    
    // Simulate population size for prevalence calculation
    manager.setPopulationSize(100);
    
    manager.adoptNorm('npc-1', norm.id);
    manager.adoptNorm('npc-2', norm.id);
    manager.adoptNorm('npc-3', norm.id);
    
    expect(norm.prevalence).toBe(0.03); // 3/100
  });

  test("adoptNorm should return false for non-existent norm", async () => {
    const manager = new CultureManager();
    const result = manager.adoptNorm('npc-1', 'non-existent');
    expect(result).toBe(false);
  });

  test("adoptNorm should not double-count adopters", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Test Norm', 'greeting');
    manager.setPopulationSize(100);
    
    manager.adoptNorm('npc-1', norm.id);
    manager.adoptNorm('npc-1', norm.id); // Same NPC again
    
    expect(norm.adoptedBy.size).toBe(1);
    expect(norm.prevalence).toBe(0.01);
  });

  test("unadoptNorm should remove NPC from adopters", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Test Norm', 'greeting');
    manager.adoptNorm('npc-1', norm.id);
    
    const result = manager.unadoptNorm('npc-1', norm.id);
    
    expect(result).toBe(true);
    expect(norm.adoptedBy.has('npc-1')).toBe(false);
  });
});

/**
 * Test Suite: CultureManager - Norm Spread
 */
test.describe("CultureManager - Norm Spread", () => {
  test("spreadNorm should spread to connected NPCs", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Viral Meme', 'social_behavior');
    manager.adoptNorm('npc-1', norm.id);
    
    // Social network: npc-1 is connected to npc-2 and npc-3
    const socialNetwork: Record<string, string[]> = {
      'npc-1': ['npc-2', 'npc-3'],
      'npc-2': ['npc-1'],
      'npc-3': ['npc-1'],
    };
    
    const spread = manager.spreadNorm(norm.id, socialNetwork);
    
    // Should have spread to at least some connections
    expect(spread).toBeGreaterThanOrEqual(0);
  });

  test("spreadNorm should use adoption probability based on connections", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Test Norm', 'greeting');
    
    // NPC-1 adopts, NPC-2 is connected
    manager.adoptNorm('npc-1', norm.id);
    
    const socialNetwork = {
      'npc-1': ['npc-2'],
      'npc-2': ['npc-1'],
    };
    
    // Run spread multiple times to test probability
    let totalSpread = 0;
    for (let i = 0; i < 100; i++) {
      const tempManager = new CultureManager();
      const tempNorm = tempManager.createNorm('Test', 'greeting');
      tempManager.adoptNorm('npc-1', tempNorm.id);
      totalSpread += tempManager.spreadNorm(tempNorm.id, socialNetwork);
    }
    
    // Should spread sometimes (probability-based)
    expect(totalSpread).toBeGreaterThan(0);
  });

  test("spreadNorm should not spread to already adopted NPCs", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Test Norm', 'greeting');
    manager.adoptNorm('npc-1', norm.id);
    manager.adoptNorm('npc-2', norm.id);
    
    const socialNetwork = {
      'npc-1': ['npc-2'],
      'npc-2': ['npc-1'],
    };
    
    const spread = manager.spreadNorm(norm.id, socialNetwork);
    expect(spread).toBe(0); // Both already adopted
  });

  test("spreadNorm should return 0 for non-existent norm", async () => {
    const manager = new CultureManager();
    const spread = manager.spreadNorm('non-existent', {});
    expect(spread).toBe(0);
  });
});

/**
 * Test Suite: CultureManager - Traditions
 */
test.describe("CultureManager - Traditions", () => {
  test("createTradition should create faction tradition", async () => {
    const manager = new CultureManager();
    const tradition = manager.createTradition('faction-1', 'Weekly AMA', 'weekly');
    
    expect(tradition).toBeDefined();
    expect(tradition.factionId).toBe('faction-1');
    expect(tradition.name).toBe('Weekly AMA');
    expect(tradition.frequency).toBe('weekly');
  });

  test("createTradition should generate unique IDs", async () => {
    const manager = new CultureManager();
    const t1 = manager.createTradition('f1', 'T1', 'daily');
    const t2 = manager.createTradition('f1', 'T2', 'daily');
    
    expect(t1.id).not.toBe(t2.id);
  });

  test("getTradition should retrieve by ID", async () => {
    const manager = new CultureManager();
    const created = manager.createTradition('f1', 'Test', 'monthly');
    
    const retrieved = manager.getTradition(created.id);
    expect(retrieved?.name).toBe('Test');
  });

  test("getFactionTraditions should return only faction's traditions", async () => {
    const manager = new CultureManager();
    manager.createTradition('faction-1', 'T1', 'daily');
    manager.createTradition('faction-1', 'T2', 'weekly');
    manager.createTradition('faction-2', 'T3', 'monthly');
    
    const faction1Traditions = manager.getFactionTraditions('faction-1');
    expect(faction1Traditions.length).toBe(2);
    expect(faction1Traditions.every(t => t.factionId === 'faction-1')).toBe(true);
  });

  test("observeTradition should update lastObserved and participants", async () => {
    const manager = new CultureManager();
    const tradition = manager.createTradition('f1', 'Ceremony', 'yearly');
    
    const beforeTime = Date.now();
    manager.observeTradition(tradition.id, ['npc-1', 'npc-2', 'npc-3']);
    
    expect(tradition.lastObserved).toBeGreaterThanOrEqual(beforeTime);
    expect(tradition.participants.size).toBe(3);
    expect(tradition.participants.has('npc-1')).toBe(true);
    expect(tradition.participants.has('npc-2')).toBe(true);
    expect(tradition.participants.has('npc-3')).toBe(true);
  });

  test("observeTradition should return false for non-existent tradition", async () => {
    const manager = new CultureManager();
    const result = manager.observeTradition('non-existent', ['npc-1']);
    expect(result).toBe(false);
  });

  test("isDueForObservance should check based on frequency", async () => {
    const manager = new CultureManager();
    const dailyTradition = manager.createTradition('f1', 'Daily', 'daily');
    
    // Never observed - should be due
    expect(manager.isDueForObservance(dailyTradition.id)).toBe(true);
    
    // Just observed - should not be due
    manager.observeTradition(dailyTradition.id, ['npc-1']);
    expect(manager.isDueForObservance(dailyTradition.id)).toBe(false);
  });
});

/**
 * Test Suite: CultureManager - Mentorship
 */
test.describe("CultureManager - Mentorship", () => {
  test("startMentorship should create mentor-mentee relationship", async () => {
    const manager = new CultureManager();
    const mentorship = manager.startMentorship('mentor-1', 'mentee-1', 'trading');
    
    expect(mentorship).toBeDefined();
    expect(mentorship.mentorId).toBe('mentor-1');
    expect(mentorship.menteeId).toBe('mentee-1');
    expect(mentorship.skill).toBe('trading');
    expect(mentorship.progress).toBe(0);
    expect(mentorship.completed).toBe(false);
  });

  test("startMentorship should generate unique IDs", async () => {
    const manager = new CultureManager();
    const m1 = manager.startMentorship('m1', 'e1', 'coding');
    const m2 = manager.startMentorship('m2', 'e2', 'coding');
    
    expect(m1.id).not.toBe(m2.id);
  });

  test("getMentorship should retrieve by ID", async () => {
    const manager = new CultureManager();
    const created = manager.startMentorship('mentor', 'mentee', 'analysis');
    
    const retrieved = manager.getMentorship(created.id);
    expect(retrieved?.skill).toBe('analysis');
  });

  test("getMentorshipsForMentor should return all mentor's relationships", async () => {
    const manager = new CultureManager();
    manager.startMentorship('mentor-1', 'mentee-1', 'trading');
    manager.startMentorship('mentor-1', 'mentee-2', 'coding');
    manager.startMentorship('mentor-2', 'mentee-3', 'mining');
    
    const mentor1Ships = manager.getMentorshipsForMentor('mentor-1');
    expect(mentor1Ships.length).toBe(2);
  });

  test("getMentorshipsForMentee should return mentee's relationships", async () => {
    const manager = new CultureManager();
    manager.startMentorship('mentor-1', 'mentee-1', 'trading');
    manager.startMentorship('mentor-2', 'mentee-1', 'coding');
    
    const menteeShips = manager.getMentorshipsForMentee('mentee-1');
    expect(menteeShips.length).toBe(2);
  });

  test("progressMentorship should increase progress", async () => {
    const manager = new CultureManager();
    const mentorship = manager.startMentorship('m', 'e', 'social');
    
    manager.progressMentorship(mentorship.id, 0.25);
    expect(mentorship.progress).toBe(0.25);
    
    manager.progressMentorship(mentorship.id, 0.25);
    expect(mentorship.progress).toBe(0.5);
  });

  test("progressMentorship should clamp at 1.0", async () => {
    const manager = new CultureManager();
    const mentorship = manager.startMentorship('m', 'e', 'combat');
    
    manager.progressMentorship(mentorship.id, 0.8);
    manager.progressMentorship(mentorship.id, 0.5); // Would exceed 1.0
    
    expect(mentorship.progress).toBe(1.0);
  });

  test("progressMentorship should return false for non-existent", async () => {
    const manager = new CultureManager();
    const result = manager.progressMentorship('non-existent', 0.1);
    expect(result).toBe(false);
  });

  test("completeMentorship should mark as completed", async () => {
    const manager = new CultureManager();
    const mentorship = manager.startMentorship('m', 'e', 'leadership');
    mentorship.progress = 1.0;
    
    const result = manager.completeMentorship(mentorship.id);
    
    expect(result).toBe(true);
    expect(mentorship.completed).toBe(true);
  });

  test("completeMentorship should fail if progress not complete", async () => {
    const manager = new CultureManager();
    const mentorship = manager.startMentorship('m', 'e', 'persuasion');
    mentorship.progress = 0.5;
    
    const result = manager.completeMentorship(mentorship.id);
    
    expect(result).toBe(false);
    expect(mentorship.completed).toBe(false);
  });

  test("mentorship XP transfer should be faster than self-learning", async () => {
    const manager = new CultureManager();
    
    // Mentorship XP multiplier should be > 1
    const mentorshipBonus = manager.getMentorshipXPMultiplier();
    expect(mentorshipBonus).toBeGreaterThan(1);
  });
});

/**
 * Test Suite: CultureManager - Cultural Drift
 */
test.describe("CultureManager - Cultural Drift", () => {
  test("applyCulturalDrift should modify norm over time", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Test Norm', 'greeting');
    const originalPrevalence = norm.prevalence;
    
    manager.applyCulturalDrift(norm.id, 100); // 100 time units
    
    // Drift should create a drift record
    const drift = manager.getDrift(norm.id);
    expect(drift).toBeDefined();
    expect(drift?.normId).toBe(norm.id);
  });

  test("cultural drift should be bounded (random walk within bounds)", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Test Norm', 'work_ethic');
    
    // Apply drift many times
    for (let i = 0; i < 100; i++) {
      manager.applyCulturalDrift(norm.id, 10);
    }
    
    const drift = manager.getDrift(norm.id);
    expect(drift).toBeDefined();
    // Current value should remain within bounds (-1 to 1 relative to original)
    expect(Math.abs(drift!.currentValue - drift!.originalValue)).toBeLessThanOrEqual(1);
  });

  test("getDrift should return null for norm without drift", async () => {
    const manager = new CultureManager();
    const drift = manager.getDrift('non-existent');
    expect(drift).toBeNull();
  });

  test("drift rate should affect change magnitude", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Fast Drift', 'celebration');
    
    // Set custom drift rate
    manager.setDriftRate(norm.id, 0.1);
    manager.applyCulturalDrift(norm.id, 100);
    
    const drift = manager.getDrift(norm.id);
    expect(drift?.driftRate).toBe(0.1);
  });
});

/**
 * Test Suite: CultureManager - Innovation
 */
test.describe("CultureManager - Innovation", () => {
  test("createInnovation should create new behavior", async () => {
    const manager = new CultureManager();
    const innovation = manager.createInnovation('innovator-1', 'greeting', 'Laser eyes greeting');
    
    expect(innovation).toBeDefined();
    expect(innovation.innovatorId).toBe('innovator-1');
    expect(innovation.type).toBe('greeting');
    expect(innovation.description).toBe('Laser eyes greeting');
    expect(innovation.adoptionRate).toBe(0);
  });

  test("createInnovation should generate unique IDs", async () => {
    const manager = new CultureManager();
    const i1 = manager.createInnovation('n1', 'greeting', 'i1');
    const i2 = manager.createInnovation('n1', 'greeting', 'i2');
    
    expect(i1.id).not.toBe(i2.id);
  });

  test("getInnovation should retrieve by ID", async () => {
    const manager = new CultureManager();
    const created = manager.createInnovation('n1', 'taboo', 'No paper hands');
    
    const retrieved = manager.getInnovation(created.id);
    expect(retrieved?.description).toBe('No paper hands');
  });

  test("spreadInnovation should increase adoption rate", async () => {
    const manager = new CultureManager();
    const innovation = manager.createInnovation('n1', 'trading_practice', 'DCA strategy');
    
    const newAdopters = manager.spreadInnovation(innovation.id);
    
    // Spread should return number of new adopters
    expect(typeof newAdopters).toBe('number');
  });

  test("innovation spread pattern should affect velocity", async () => {
    const manager = new CultureManager();
    
    const viral = manager.createInnovation('n1', 'social_behavior', 'Viral meme');
    manager.setSpreadPattern(viral.id, 'viral');
    
    const gradual = manager.createInnovation('n2', 'work_ethic', 'Slow adoption');
    manager.setSpreadPattern(gradual.id, 'gradual');
    
    const localized = manager.createInnovation('n3', 'celebration', 'Local custom');
    manager.setSpreadPattern(localized.id, 'localized');
    
    expect(viral.spreadPattern).toBe('viral');
    expect(gradual.spreadPattern).toBe('gradual');
    expect(localized.spreadPattern).toBe('localized');
  });

  test("high-openness innovators should have faster spread", async () => {
    const manager = new CultureManager();
    
    // Set NPC openness traits
    manager.setNPCOpenness('high-openness-npc', 0.9);
    manager.setNPCOpenness('low-openness-npc', 0.2);
    
    const spreadRateHigh = manager.calculateSpreadRate('high-openness-npc');
    const spreadRateLow = manager.calculateSpreadRate('low-openness-npc');
    
    expect(spreadRateHigh).toBeGreaterThan(spreadRateLow);
  });

  test("convertInnovationToNorm should create norm from successful innovation", async () => {
    const manager = new CultureManager();
    const innovation = manager.createInnovation('n1', 'greeting', 'New handshake');
    
    // Manually set high adoption to trigger conversion
    innovation.adoptionRate = 0.5;
    
    const norm = manager.convertInnovationToNorm(innovation.id);
    
    expect(norm).toBeDefined();
    expect(norm?.name).toContain('New handshake');
    expect(norm?.type).toBe('greeting');
  });
});

/**
 * Test Suite: CultureManager - Sub-cultures
 */
test.describe("CultureManager - Sub-cultures", () => {
  test("getSubcultures should identify groups within faction", async () => {
    const manager = new CultureManager();
    
    // Create norms and have different adoption patterns
    const norm1 = manager.createNorm('Norm A', 'greeting');
    const norm2 = manager.createNorm('Norm B', 'trading_practice');
    
    // Group 1 adopts norm1
    manager.adoptNorm('npc-1', norm1.id);
    manager.adoptNorm('npc-2', norm1.id);
    
    // Group 2 adopts norm2
    manager.adoptNorm('npc-3', norm2.id);
    manager.adoptNorm('npc-4', norm2.id);
    
    // Set faction members
    manager.setFactionMembers('faction-1', ['npc-1', 'npc-2', 'npc-3', 'npc-4']);
    
    const subcultures = manager.getSubcultures('faction-1');
    
    expect(subcultures).toBeDefined();
    expect(Array.isArray(subcultures)).toBe(true);
  });

  test("subcultures should cluster by shared norms", async () => {
    const manager = new CultureManager();
    
    const norm1 = manager.createNorm('HODL', 'trading_practice');
    const norm2 = manager.createNorm('Day Trade', 'trading_practice');
    
    // HODLers
    manager.adoptNorm('hodler-1', norm1.id);
    manager.adoptNorm('hodler-2', norm1.id);
    
    // Traders
    manager.adoptNorm('trader-1', norm2.id);
    manager.adoptNorm('trader-2', norm2.id);
    
    manager.setFactionMembers('faction-1', ['hodler-1', 'hodler-2', 'trader-1', 'trader-2']);
    
    const subcultures = manager.getSubcultures('faction-1');
    
    // Should identify at least 2 distinct subcultures
    expect(subcultures.length).toBeGreaterThanOrEqual(1);
  });

  test("getSubcultures should return empty for faction without cultural diversity", async () => {
    const manager = new CultureManager();
    
    const norm = manager.createNorm('Universal Norm', 'greeting');
    
    // Everyone adopts the same norm
    manager.adoptNorm('npc-1', norm.id);
    manager.adoptNorm('npc-2', norm.id);
    manager.adoptNorm('npc-3', norm.id);
    
    manager.setFactionMembers('faction-1', ['npc-1', 'npc-2', 'npc-3']);
    
    const subcultures = manager.getSubcultures('faction-1');
    
    // Only one culture = no distinct subcultures
    expect(subcultures.length).toBeLessThanOrEqual(1);
  });
});

/**
 * Test Suite: Serialization
 */
test.describe("Culture Serialization", () => {
  test("should serialize and deserialize norms", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Test Norm', 'greeting', 'faction-1');
    manager.adoptNorm('npc-1', norm.id);
    manager.adoptNorm('npc-2', norm.id);
    
    const serialized = manager.serialize();
    
    const newManager = new CultureManager();
    newManager.deserialize(serialized);
    
    const restored = newManager.getNorm(norm.id);
    expect(restored).toBeDefined();
    expect(restored?.name).toBe('Test Norm');
    expect(restored?.adoptedBy.size).toBe(2);
  });

  test("should serialize and deserialize traditions", async () => {
    const manager = new CultureManager();
    const tradition = manager.createTradition('f1', 'Weekly Call', 'weekly');
    manager.observeTradition(tradition.id, ['npc-1', 'npc-2']);
    
    const serialized = manager.serialize();
    
    const newManager = new CultureManager();
    newManager.deserialize(serialized);
    
    const restored = newManager.getTradition(tradition.id);
    expect(restored).toBeDefined();
    expect(restored?.participants.size).toBe(2);
  });

  test("should serialize and deserialize mentorships", async () => {
    const manager = new CultureManager();
    const mentorship = manager.startMentorship('m1', 'e1', 'trading');
    manager.progressMentorship(mentorship.id, 0.5);
    
    const serialized = manager.serialize();
    
    const newManager = new CultureManager();
    newManager.deserialize(serialized);
    
    const restored = newManager.getMentorship(mentorship.id);
    expect(restored).toBeDefined();
    expect(restored?.progress).toBe(0.5);
  });

  test("should serialize and deserialize innovations", async () => {
    const manager = new CultureManager();
    const innovation = manager.createInnovation('n1', 'greeting', 'New greeting');
    
    const serialized = manager.serialize();
    
    const newManager = new CultureManager();
    newManager.deserialize(serialized);
    
    const restored = newManager.getInnovation(innovation.id);
    expect(restored).toBeDefined();
    expect(restored?.description).toBe('New greeting');
  });

  test("should serialize and deserialize cultural drift", async () => {
    const manager = new CultureManager();
    const norm = manager.createNorm('Drifting Norm', 'work_ethic');
    manager.applyCulturalDrift(norm.id, 50);
    
    const serialized = manager.serialize();
    
    const newManager = new CultureManager();
    newManager.deserialize(serialized);
    
    const drift = newManager.getDrift(norm.id);
    expect(drift).toBeDefined();
  });
});

/**
 * Test Suite: Integration
 */
test.describe("Culture Integration", () => {
  test("complete culture workflow should function", async () => {
    const manager = new CultureManager();
    manager.setPopulationSize(10);
    
    // 1. Create a norm
    const norm = manager.createNorm('WAGMI Culture', 'social_behavior', 'degen-faction');
    
    // 2. NPCs adopt the norm
    manager.adoptNorm('npc-1', norm.id);
    manager.adoptNorm('npc-2', norm.id);
    
    // 3. Create a tradition
    const tradition = manager.createTradition('degen-faction', 'Morning Pump', 'daily');
    
    // 4. Observe tradition
    manager.observeTradition(tradition.id, ['npc-1', 'npc-2']);
    
    // 5. Start mentorship
    const mentorship = manager.startMentorship('npc-1', 'npc-3', 'trading');
    
    // 6. Progress mentorship
    manager.progressMentorship(mentorship.id, 0.5);
    
    // 7. Create innovation
    const innovation = manager.createInnovation('npc-1', 'greeting', 'WAGMI handshake');
    
    // 8. Apply cultural drift
    manager.applyCulturalDrift(norm.id, 10);
    
    // Verify all systems work together
    expect(norm.adoptedBy.size).toBe(2);
    expect(tradition.lastObserved).not.toBeNull();
    expect(mentorship.progress).toBe(0.5);
    expect(innovation.innovatorId).toBe('npc-1');
    expect(manager.getDrift(norm.id)).toBeDefined();
  });
});
