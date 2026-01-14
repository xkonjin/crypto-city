/**
 * Tests for Player-Triggered Disaster System
 * 
 * "The History of every major Galactic Civilization tends to pass through
 * three distinct and recognizable phases, those of Survival, Inquiry and
 * Sophistication, otherwise known as the How, Why, and Where phases.
 * For instance, the first phase is characterized by the question 'How can
 * we pay USDT₮ to trigger disasters in our cities?'"
 */

import { test, expect } from '@playwright/test';
import {
  PLAYER_DISASTERS,
  DEFAULT_BALANCE_CONFIG,
  createInitialDisasterState,
  PlayerDisasterManager,
  calculateReactionIntensity,
  selectDisasterBehavior,
  generateDisasterThought,
  createDisasterMood,
  processNPCDisasterReaction,
} from '../src/lib/disasters/index';
import type { CryptoNPC } from '../src/games/isocity/types/npc';
import type { ActivePlayerDisaster } from '../src/lib/disasters/types';

// =============================================================================
// UNIT TESTS - TYPES & DEFINITIONS
// =============================================================================

test.describe('Disaster Type Definitions', () => {
  test('should have all required disaster types defined', () => {
    const expectedDisasters = [
      'market_crash',
      'rug_pull',
      'fire',
      'earthquake',
      'whale_dump',
      'fifty_one_attack',
      'sec_raid',
    ];

    for (const id of expectedDisasters) {
      expect(PLAYER_DISASTERS[id]).toBeDefined();
      expect(PLAYER_DISASTERS[id].id).toBe(id);
      expect(PLAYER_DISASTERS[id].name).toBeTruthy();
      expect(PLAYER_DISASTERS[id].description).toBeTruthy();
      expect(PLAYER_DISASTERS[id].baseCostUSDT).toBeGreaterThan(0);
      expect(PLAYER_DISASTERS[id].durationSeconds).toBeGreaterThan(0);
      expect(PLAYER_DISASTERS[id].cooldownSeconds).toBeGreaterThan(0);
      expect(PLAYER_DISASTERS[id].cobieQuote).toBeTruthy();
    }
  });

  test('should have valid damage types', () => {
    const validDamageTypes = [
      'npc_panic',
      'building_destroy',
      'spread_damage',
      'random_damage',
      'market_manipulation',
      'chain_offline',
      'exchange_raid',
    ];

    for (const disaster of Object.values(PLAYER_DISASTERS)) {
      expect(validDamageTypes).toContain(disaster.damageType);
    }
  });

  test('market_crash should have npc_panic damage type', () => {
    expect(PLAYER_DISASTERS.market_crash.damageType).toBe('npc_panic');
    expect(PLAYER_DISASTERS.market_crash.baseCostUSDT).toBe(5);
  });

  test('rug_pull should have building_destroy damage type', () => {
    expect(PLAYER_DISASTERS.rug_pull.damageType).toBe('building_destroy');
    expect(PLAYER_DISASTERS.rug_pull.baseCostUSDT).toBe(10);
  });

  test('fire should have spread_damage type', () => {
    expect(PLAYER_DISASTERS.fire.damageType).toBe('spread_damage');
  });

  test('earthquake should have highest base cost', () => {
    expect(PLAYER_DISASTERS.earthquake.baseCostUSDT).toBe(25);
    expect(PLAYER_DISASTERS.earthquake.damageType).toBe('random_damage');
  });
});

test.describe('Balance Configuration', () => {
  test('should have sensible default values', () => {
    expect(DEFAULT_BALANCE_CONFIG.globalCooldownSeconds).toBe(300); // 5 min
    expect(DEFAULT_BALANCE_CONFIG.perTypeCooldownSeconds).toBe(1800); // 30 min
    expect(DEFAULT_BALANCE_CONFIG.maxBuildingsAffectedCap).toBe(0.1); // 10%
    expect(DEFAULT_BALANCE_CONFIG.npcRecoveryGuarantee).toBe(true);
    expect(DEFAULT_BALANCE_CONFIG.newPlayerShieldSeconds).toBe(86400); // 24h
  });

  test('createInitialDisasterState should return valid state', () => {
    const state = createInitialDisasterState();
    
    expect(state.activeDisasters).toEqual([]);
    expect(state.damagedBuildings).toEqual([]);
    expect(state.lastGlobalDisasterTime).toBe(0);
    expect(state.totalDisasterSpend).toBe(BigInt(0));
    expect(state.totalRepairSpend).toBe(BigInt(0));
    expect(state.cityCreatedAt).toBeGreaterThan(0);
    expect(state.balanceConfig).toEqual(DEFAULT_BALANCE_CONFIG);
  });
});

// =============================================================================
// UNIT TESTS - DISASTER MANAGER
// =============================================================================

test.describe('PlayerDisasterManager', () => {
  test('should initialize with empty state', () => {
    const manager = new PlayerDisasterManager();
    const state = manager.getState();
    
    expect(state.activeDisasters).toHaveLength(0);
    expect(state.damagedBuildings).toHaveLength(0);
  });

  test('should calculate disaster cost correctly', () => {
    const manager = new PlayerDisasterManager();
    
    // Market crash base cost is $5
    const cost = manager.calculateDisasterCost('market_crash');
    expect(cost).toBe(BigInt(5_000_000)); // 5 USDT with 6 decimals
  });

  test('should scale cost with population', () => {
    const manager = new PlayerDisasterManager();
    manager.setGetCityPopulation(() => 1000); // 1000 residents
    
    const cost = manager.calculateDisasterCost('market_crash');
    // Base 5 + (1000/100 * 0.01) = 5.1 USDT
    expect(cost).toBe(BigInt(5_100_000));
  });

  test('should block disasters during new player shield', () => {
    const manager = new PlayerDisasterManager();
    
    // New city should have shield
    expect(manager.hasNewPlayerShield()).toBe(true);
    
    const canTrigger = manager.canTriggerDisaster('market_crash');
    expect(canTrigger.canTrigger).toBe(false);
    expect(canTrigger.reason).toContain('shield');
  });

  test('should respect global cooldown', () => {
    const manager = new PlayerDisasterManager({
      cityCreatedAt: Date.now() - 100000000, // Old city
      lastGlobalDisasterTime: Date.now() - 100, // Recent disaster
    });

    const canTrigger = manager.canTriggerDisaster('market_crash');
    expect(canTrigger.canTrigger).toBe(false);
    expect(canTrigger.reason).toContain('Global cooldown');
  });

  test('should respect per-type cooldown', () => {
    const now = Date.now();
    const manager = new PlayerDisasterManager({
      cityCreatedAt: now - 100000000,
      lastGlobalDisasterTime: now - 400000, // Long ago
      lastDisasterTimeByType: {
        market_crash: now - 100, // Recent market crash
      },
    });

    const canTrigger = manager.canTriggerDisaster('market_crash');
    expect(canTrigger.canTrigger).toBe(false);
    expect(canTrigger.reason).toContain('Market Crash');
    expect(canTrigger.reason).toContain('cooldown');
  });

  test('should allow different disaster types', () => {
    const now = Date.now();
    const manager = new PlayerDisasterManager({
      cityCreatedAt: now - 100000000,
      lastGlobalDisasterTime: now - 400000,
      lastDisasterTimeByType: {
        market_crash: now - 100, // Recent market crash
      },
    });

    // Different disaster type should be allowed
    const canTrigger = manager.canTriggerDisaster('fire');
    expect(canTrigger.canTrigger).toBe(true);
  });

  test('should trigger disaster successfully', () => {
    const now = Date.now();
    const manager = new PlayerDisasterManager({
      cityCreatedAt: now - 100000000,
      lastGlobalDisasterTime: 0,
    });

    // Mock building getter
    manager.setGetBuildings(() => [
      { id: 'building1', buildingId: 'eth_hq', gridX: 5, gridY: 5, placedAt: now, yieldAccumulated: 0 },
    ]);
    manager.setGetBuildingDef(() => ({
      name: 'Ethereum HQ',
      cost: 10000,
      crypto: { chain: 'ethereum' as const },
    }));

    const result = manager.triggerDisaster({
      disasterId: 'market_crash',
      triggerAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    });

    expect(result.success).toBe(true);
    expect(result.disaster).toBeDefined();
    expect(result.costCharged).toBe(BigInt(5_000_000));
  });

  test('should track damaged buildings', () => {
    const now = Date.now();
    const manager = new PlayerDisasterManager({
      cityCreatedAt: now - 100000000,
    });

    manager.setGetBuildings(() => [
      { id: 'building1', buildingId: 'eth_hq', gridX: 5, gridY: 5, placedAt: now, yieldAccumulated: 0 },
    ]);
    manager.setGetBuildingDef(() => ({
      name: 'Ethereum HQ',
      cost: 10000,
      crypto: { chain: 'ethereum' as const },
    }));

    // Trigger a rug pull (building_destroy type)
    const result = manager.triggerDisaster({
      disasterId: 'rug_pull',
      triggerAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    });

    expect(result.success).toBe(true);
    
    const damagedBuildings = manager.getDamagedBuildings();
    expect(damagedBuildings.length).toBeGreaterThan(0);
  });

  test('should repair buildings correctly', () => {
    const now = Date.now();
    const manager = new PlayerDisasterManager({
      cityCreatedAt: now - 100000000,
      damagedBuildings: [
        {
          buildingId: 'building1',
          buildingDefId: 'eth_hq',
          buildingName: 'Ethereum HQ',
          gridX: 5,
          gridY: 5,
          disasterId: 'rug_pull',
          disasterInstanceId: 'test_instance',
          damagedAt: now - 1000,
          originalCost: 10000,
          repairCostUSDT: 2500, // 25% of original
          severity: 1.0,
        },
      ],
    });

    expect(manager.getDamagedBuildings()).toHaveLength(1);
    expect(manager.isBuildingDamaged('building1')).toBe(true);

    const result = manager.repairBuilding({
      buildingId: 'building1',
      payerAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    });

    expect(result.success).toBe(true);
    expect(result.costCharged).toBe(BigInt(2500_000_000)); // 2500 USDT in atomic
    expect(manager.getDamagedBuildings()).toHaveLength(0);
    expect(manager.isBuildingDamaged('building1')).toBe(false);
  });

  test('should handle tick updates and expire disasters', async () => {
    const now = Date.now();
    const manager = new PlayerDisasterManager({
      cityCreatedAt: now - 100000000,
      activeDisasters: [
        {
          instanceId: 'expired_disaster',
          disaster: PLAYER_DISASTERS.market_crash,
          triggeredBy: '0x0' as `0x${string}`,
          paidAmount: BigInt(5_000_000),
          startedAt: now - 10000,
          endsAt: now - 1000, // Already ended
          affectedBuildingIds: [],
          affectedNpcIds: [],
          isActive: true,
          totalDamage: 0,
        } as ActivePlayerDisaster,
      ],
    });

    expect(manager.getActiveDisasters()).toHaveLength(1);

    const result = manager.tick();

    expect(result.expiredDisasters).toHaveLength(1);
    expect(manager.getActiveDisasters()).toHaveLength(0);
  });

  test('should export and import state correctly', () => {
    const now = Date.now();
    const originalManager = new PlayerDisasterManager({
      cityCreatedAt: now - 100000000,
      totalDisasterSpend: BigInt(50_000_000),
      totalRepairSpend: BigInt(25_000_000),
    });

    const exported = originalManager.exportState();
    
    const newManager = new PlayerDisasterManager();
    newManager.importState(exported);

    const newState = newManager.getState();
    expect(newState.cityCreatedAt).toBe(exported.cityCreatedAt);
  });
});

// =============================================================================
// UNIT TESTS - NPC REACTIONS
// =============================================================================

test.describe('NPC Disaster Reactions', () => {
  // Mock NPC for testing
  const createMockNPC = (overrides: Partial<CryptoNPC> = {}): CryptoNPC => ({
    id: 'npc_test_1',
    name: 'Test NPC',
    walletAddress: '0xtest',
    age: 30,
    occupation: 'trader',
    residence: 'building1',
    workplace: 'building2',
    spriteType: 'apple',
    direction: 'south',
    gridX: 10,
    gridY: 10,
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: 'idle',
    needs: {
      hunger: { current: 80, max: 100, decayRate: 0.5, criticalThreshold: 20 },
      energy: { current: 80, max: 100, decayRate: 0.5, criticalThreshold: 20 },
      social: { current: 80, max: 100, decayRate: 0.5, criticalThreshold: 20 },
      fun: { current: 80, max: 100, decayRate: 0.5, criticalThreshold: 20 },
      wealth: { current: 80, max: 100, decayRate: 0.5, criticalThreshold: 20 },
      purpose: { current: 80, max: 100, decayRate: 0.5, criticalThreshold: 20 },
    },
    memory: {
      episodic: [],
      semantic: [],
      procedural: [],
      working: [],
    },
    movement: {
      state: 'idle',
      speed: 1,
      currentPath: null,
      targetX: null,
      targetY: null,
    },
    personality: {
      bigFive: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      },
      crypto: {
        riskTolerance: 0.5,
        fomo: 0.5,
        trustInInstitutions: 0.5,
        technicalKnowledge: 0.5,
        degenLevel: 0.5,
      },
    },
    relationships: {},
    ...overrides,
  } as CryptoNPC);

  test('should calculate reaction intensity based on personality', () => {
    // High neuroticism = more panic
    const anxiousNPC = createMockNPC({
      personality: {
        bigFive: {
          openness: 0.5,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.9, // High neuroticism
        },
        crypto: {
          riskTolerance: 0.3, // Low risk tolerance
          fomo: 0.5,
          trustInInstitutions: 0.5,
          technicalKnowledge: 0.5,
          degenLevel: 0.5,
        },
      },
    });

    const anxiousIntensity = calculateReactionIntensity(anxiousNPC, 'market_crash');
    expect(['panicked', 'terrified']).toContain(anxiousIntensity);

    // High risk tolerance = less panic
    const calmNPC = createMockNPC({
      personality: {
        bigFive: {
          openness: 0.5,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.2, // Low neuroticism
        },
        crypto: {
          riskTolerance: 0.9, // High risk tolerance
          fomo: 0.5,
          trustInInstitutions: 0.5,
          technicalKnowledge: 0.5,
          degenLevel: 0.5,
        },
      },
    });

    const calmIntensity = calculateReactionIntensity(calmNPC, 'market_crash');
    expect(['calm', 'concerned', 'anxious']).toContain(calmIntensity);
  });

  test('should select appropriate behavior based on personality', () => {
    // High risk tolerance during market crash = buy the dip
    const degenNPC = createMockNPC({
      personality: {
        bigFive: {
          openness: 0.5,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.3,
        },
        crypto: {
          riskTolerance: 0.9, // High risk tolerance
          fomo: 0.8,
          trustInInstitutions: 0.3,
          technicalKnowledge: 0.6,
          degenLevel: 0.9,
        },
      },
    });

    const behavior = selectDisasterBehavior(degenNPC, 'concerned', 'market_crash');
    expect(behavior).toBe('buy_dip');
  });

  test('should generate disaster thoughts', () => {
    const npc = createMockNPC();
    
    const thought = generateDisasterThought(npc, 'market_crash', 'panicked');
    expect(thought).toBeTruthy();
    expect(typeof thought).toBe('string');
    expect(thought.length).toBeGreaterThan(0);
  });

  test('should create disaster mood with correct properties', () => {
    const mood = createDisasterMood('panicked', 'market_crash');
    
    // 'panicked' maps to 'angry' (closest available mood to fearful)
    expect(mood.type).toBe('angry');
    expect(mood.intensity).toBe(0.85);
    expect(mood.cause).toBe('Market Crash');
    expect(mood.lastUpdate).toBeGreaterThan(0);
    expect(mood.decayRate).toBe(0.01);
  });

  test('should process complete NPC disaster reaction', () => {
    const npc = createMockNPC({
      internalWorld: {
        currentMood: 'content',
        moodIntensity: 0.5,
        thoughts: [],
        beliefs: [],
        desires: [],
      },
      thoughtStream: {
        currentThought: '',
        lastUpdated: 0,
        observations: [],
        shortTermPlan: [],
        longTermGoals: [],
        reflections: [],
      },
    });

    const mockDisaster: ActivePlayerDisaster = {
      instanceId: 'test_instance',
      disaster: PLAYER_DISASTERS.market_crash,
      triggeredBy: '0x0' as `0x${string}`,
      paidAmount: BigInt(5_000_000),
      startedAt: Date.now(),
      endsAt: Date.now() + 300000,
      affectedBuildingIds: [],
      affectedNpcIds: [],
      isActive: true,
      totalDamage: 0,
    };

    const reaction = processNPCDisasterReaction(npc, mockDisaster);

    expect(reaction.npcId).toBe(npc.id);
    expect(reaction.mood).toBeDefined();
    expect(reaction.thought).toBeTruthy();
    expect(reaction.behavior).toBeTruthy();
    expect(reaction.memory).toBeDefined();
    expect(reaction.intensity).toBeTruthy();
  });
});

// =============================================================================
// E2E TESTS
// =============================================================================

// E2E tests require a running server - skip in isolated test runs
test.describe.skip('Disaster Panel E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to load
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Start or continue game
    const startButton = page.locator('button').filter({ hasText: /New Game|Continue/i }).first();
    try {
      await startButton.waitFor({ state: 'visible', timeout: 20000 });
      await startButton.click({ force: true });
      await page.waitForSelector('canvas', { state: 'visible', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(4000);
    } catch {
      // Game might already be started
    }

    // Dismiss any popups
    const gotItButton = page.getByRole('button', { name: /Got it/i });
    if (await gotItButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gotItButton.click({ force: true });
      await page.waitForTimeout(500);
    }

    const dismissButton = page.getByRole('button', { name: /Dismiss Tutorial/i });
    if (await dismissButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dismissButton.click({ force: true });
      await page.waitForTimeout(500);
    }
  });

  test('should have disaster control accessible in settings or menu', async ({ page }) => {
    // This test verifies the UI can be accessed
    // The actual panel might be accessed through different UI paths
    const hasCanvas = await page.locator('canvas').isVisible();
    expect(hasCanvas).toBe(true);
  });
});
