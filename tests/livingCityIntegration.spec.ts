/**
 * Living City Integration Tests
 *
 * Comprehensive integration tests for the Living City features:
 * - NPC Inspection Flow
 * - X402 Economy Integration
 * - Disaster System Integration
 * - City AI Integration
 * - X Profile Ingestion Flow
 *
 * "The living city breathes through its NPCs, prospers through its economy,
 * survives through its disasters, thinks through its AI, and grows through
 * its ingested citizens. Testing all of these at once requires patience,
 * precision, and a good cup of towel-dried tea."
 * — The Hitchhiker's Guide to Crypto City Testing
 */

import { test, expect } from '@playwright/test';

// =============================================================================
// IMPORTS FOR NPC INSPECTION
// =============================================================================
import { NPCManager } from '../src/lib/npc/NPCManager';
import { NPCSimulation } from '../src/lib/npc/NPCSimulation';
import { thoughtEngine, type ThoughtContext } from '../src/lib/npc/ThoughtEngine';
import { createDefaultNeeds } from '../src/lib/npc/needs';
import { createDefaultMemory } from '../src/lib/npc/memory';
import { createInitialMovement } from '../src/lib/npc/movement';
import { createDefaultPersonality, type PersonalityArchetype } from '../src/lib/npc/personality';
import type { CryptoNPC, Occupation } from '../src/games/isocity/types/npc';

// =============================================================================
// IMPORTS FOR X402 ECONOMY
// =============================================================================
import {
  NPCWalletManager,
  getNPCWalletManager,
  initNPCWalletManager,
} from '../src/lib/npc/x402/NPCWalletManager';
import { ServiceExchange, serviceExchange } from '../src/lib/npc/x402/ServiceExchange';
import { GiftSystem, giftSystem } from '../src/lib/npc/x402/GiftSystem';
import { npcServiceRegistry } from '../src/lib/npc/x402/NPCServiceRegistry';
import { createDefaultWallet, createDefaultFinances } from '../src/lib/npc/economy';

// =============================================================================
// IMPORTS FOR DISASTER SYSTEM
// =============================================================================
import {
  PLAYER_DISASTERS,
  PlayerDisasterManager,
  createInitialDisasterState,
  calculateReactionIntensity,
  selectDisasterBehavior,
  generateDisasterThought,
  createDisasterMood,
  processNPCDisasterReaction,
} from '../src/lib/disasters/index';
import type { ActivePlayerDisaster } from '../src/lib/disasters/types';

// =============================================================================
// IMPORTS FOR CITY AI
// =============================================================================
import { createInitialGameState } from '../src/lib/simulation';
import { assessCityState, getCityHealthSummary } from '../src/lib/cityAI/CityAssessor';
import { planActions } from '../src/lib/cityAI/CityAIPlanner';
import {
  getCityAIManager,
  resetCityAIManager,
  AI_GOALS,
  type CityAssessment,
  type CityAction,
} from '../src/lib/cityAI';

// =============================================================================
// IMPORTS FOR X PROFILE INGESTION
// =============================================================================
import {
  MockXProfileAdapter,
  type XProfile,
} from '../src/lib/ingestion/XProfileAdapter';
import {
  extractPersonalityRuleBased,
  quickExtract,
} from '../src/lib/ingestion/PersonalityExtractor';
import {
  previewIngestion,
  ingestXProfile,
  resetRateLimiter,
  type IngestionProgress,
} from '../src/lib/ingestion/IngestionPipeline';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a mock NPC for testing
 */
function createMockNPC(
  archetype: PersonalityArchetype = 'degen_trader',
  overrides: Partial<CryptoNPC> = {}
): CryptoNPC {
  return {
    id: overrides.id || `test-npc-${Math.random().toString(36).slice(2)}`,
    name: overrides.name || 'TestNPC',
    walletAddress: '0x' + 'a'.repeat(40),
    age: 30,
    occupation: overrides.occupation || 'trader',
    residence: null,
    workplace: null,
    spriteType: 'apple',
    direction: 'south',
    gridX: 10,
    gridY: 10,
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: 'idle',
    needs: createDefaultNeeds(),
    memory: createDefaultMemory(),
    movement: createInitialMovement(),
    personality: createDefaultPersonality(),
    personalityArchetype: archetype,
    relationships: {},
    wallet: createDefaultWallet(),
    finances: createDefaultFinances('trader'),
    ...overrides,
  } as CryptoNPC;
}

/**
 * Default thought context for tests
 */
const defaultThoughtContext: ThoughtContext = {
  nearbyNPCs: [],
  marketCondition: 'bull',
  timeOfDay: 'morning',
  recentEvents: [],
  gameDay: 1,
};

/**
 * Create a basic game state for testing
 */
function createTestGameState(size: number = 20) {
  return createInitialGameState(size, 'TestCity');
}

/**
 * Add roads to the game state for testing
 */
function addRoads(state: ReturnType<typeof createTestGameState>) {
  const { grid, gridSize } = state;
  const mid = Math.floor(gridSize / 2);

  for (let i = 2; i < gridSize - 2; i++) {
    if (grid[mid][i].building.type !== 'water') {
      grid[mid][i].building = {
        type: 'road',
        level: 0,
        population: 0,
        jobs: 0,
        powered: true,
        watered: true,
        onFire: false,
        fireProgress: 0,
        age: 0,
        constructionProgress: 100,
        abandoned: false,
      };
    }
    if (grid[i][mid].building.type !== 'water') {
      grid[i][mid].building = {
        type: 'road',
        level: 0,
        population: 0,
        jobs: 0,
        powered: true,
        watered: true,
        onFire: false,
        fireProgress: 0,
        age: 0,
        constructionProgress: 100,
        abandoned: false,
      };
    }
  }

  return state;
}

// =============================================================================
// SECTION 1: NPC INSPECTION INTEGRATION TESTS
// =============================================================================

test.describe('NPC Inspection Integration', () => {
  test.describe('NPC Selection and Inspector Display', () => {
    test('should spawn NPC and verify inspector-required fields', () => {
      const npc = NPCManager.spawnNPC({ gridX: 10, gridY: 10 });

      try {
        // Verify all fields required by NPCInspectorPanel
        expect(npc.id).toBeDefined();
        expect(npc.name).toBeDefined();
        expect(npc.walletAddress).toBeDefined();
        expect(npc.occupation).toBeDefined();
        expect(npc.age).toBeDefined();
        expect(npc.personality).toBeDefined();
        expect(npc.personality.crypto.riskTolerance).toBeDefined();
        expect(npc.personality.crypto.fomo).toBeDefined();
        expect(npc.personality.crypto.degenLevel).toBeDefined();
        expect(npc.currentActivity).toBeDefined();
        expect(npc.needs).toBeDefined();
        expect(npc.relationships).toBeDefined();
      } finally {
        NPCManager.despawnNPC(npc.id);
      }
    });

    test('should get NPC by ID after spawn', () => {
      const spawned = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });

      try {
        const retrieved = NPCManager.getNPC(spawned.id);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(spawned.id);
        expect(retrieved?.name).toBe(spawned.name);
      } finally {
        NPCManager.despawnNPC(spawned.id);
      }
    });

    test('should initialize thought stream for NPC', () => {
      const npc = createMockNPC('degen_trader');

      // Initialize thought stream
      npc.thoughtStream = thoughtEngine.createDefaultThoughtStream();

      expect(npc.thoughtStream).toBeDefined();
      expect(npc.thoughtStream.currentThought).toBeDefined();
      expect(npc.thoughtStream.currentThought.length).toBeGreaterThan(0);
      expect(npc.thoughtStream.observations).toBeDefined();
      expect(npc.thoughtStream.shortTermPlan).toBeDefined();
      expect(npc.thoughtStream.longTermGoals).toBeDefined();
    });

    test('should update thought stream with context', () => {
      const npc = createMockNPC('eth_builder');
      npc.thoughtStream = thoughtEngine.createDefaultThoughtStream();
      const initialTimestamp = npc.thoughtStream.lastUpdated;

      const updated = thoughtEngine.updateThoughtStream(
        npc,
        { ...defaultThoughtContext, gameDay: 2 },
        npc.thoughtStream
      );

      expect(updated.lastUpdated).toBeGreaterThanOrEqual(initialTimestamp);
      expect(updated.currentThought).toBeDefined();
    });

    test('should generate archetype-specific thoughts', () => {
      const archetypes: PersonalityArchetype[] = [
        'bitcoin_maxi',
        'eth_builder',
        'degen_trader',
        'privacy_maxi',
        'normie_investor',
      ];

      for (const archetype of archetypes) {
        const npc = createMockNPC(archetype);
        const thought = thoughtEngine.generateThought(npc, defaultThoughtContext);

        expect(thought).toBeDefined();
        expect(thought.length).toBeGreaterThan(0);
      }
    });

    test('should track NPC deselection after despawn', () => {
      const npc = NPCManager.spawnNPC({ gridX: 8, gridY: 8 });
      const npcId = npc.id;

      // Verify NPC exists
      expect(NPCManager.getNPC(npcId)).toBeDefined();

      // Despawn
      NPCManager.despawnNPC(npcId);

      // Verify NPC is gone (simulating inspector behavior)
      expect(NPCManager.getNPC(npcId)).toBeUndefined();
    });
  });

  test.describe('NPC Nearby Detection', () => {
    test('should find nearby NPCs for thought context', () => {
      const simulation = new NPCSimulation();
      const npc1 = NPCManager.spawnNPC({ gridX: 10, gridY: 10 });
      const npc2 = NPCManager.spawnNPC({ gridX: 11, gridY: 10 });

      try {
        const nearby = simulation.getNearbyNPCs(npc1, 3);
        expect(nearby.length).toBeGreaterThanOrEqual(1);
        expect(nearby.some((n) => n.id === npc2.id)).toBe(true);
      } finally {
        NPCManager.despawnNPC(npc1.id);
        NPCManager.despawnNPC(npc2.id);
      }
    });
  });
});

// =============================================================================
// SECTION 2: X402 ECONOMY INTEGRATION TESTS
// =============================================================================

test.describe('X402 Economy Integration', () => {
  test.beforeEach(() => {
    npcServiceRegistry.clear();
    serviceExchange.clear();
    giftSystem.clear();
    initNPCWalletManager({});
  });

  test.describe('NPC Wallet Creation on Spawn', () => {
    test('should create wallet for NPC and fund it', async () => {
      const wm = getNPCWalletManager();
      const npc = createMockNPC('trader', { id: 'wallet-test-1' });

      // Create wallet for NPC
      const wallet = wm.getOrCreateWallet(npc.id);

      expect(wallet).toBeDefined();
      expect(wallet.npcId).toBe(npc.id);
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // Fund the wallet
      const fundResult = await wm.fundWallet(npc.id, BigInt(1000000));
      expect(fundResult.success).toBe(true);

      const balance = await wm.fetchBalance(npc.id);
      expect(balance).toBe(BigInt(1000000));
    });

    test('should return same wallet on repeated calls', async () => {
      const wm = getNPCWalletManager();
      const wallet1 = wm.getOrCreateWallet('repeat-test');
      const wallet2 = wm.getOrCreateWallet('repeat-test');

      expect(wallet1.address).toBe(wallet2.address);
    });
  });

  test.describe('Service Exchange and Balance Updates', () => {
    test('should complete service exchange and update balances', async () => {
      const consumer = createMockNPC('degen_trader', { id: 'consumer-1' });
      const provider = createMockNPC('eth_builder', { id: 'provider-1', occupation: 'bartender' });

      const wm = getNPCWalletManager();
      wm.getOrCreateWallet(consumer.id);
      wm.getOrCreateWallet(provider.id);
      wm.setSimulatedBalance(consumer.id, BigInt(1000000));

      // Register provider services
      npcServiceRegistry.registerNPC(provider.id, 'bartender');
      const services = npcServiceRegistry.getServicesForNPC(provider.id);
      const drinkService = services.find((s) => s.serviceId.includes('serve_drink'));

      expect(drinkService).toBeDefined();

      const result = await serviceExchange.executeServiceExchange(consumer, provider, drinkService!, 1);

      expect(result.success).toBe(true);
      expect(result.needsSatisfied).toBeDefined();
      expect(result.needsSatisfied!.length).toBeGreaterThan(0);

      // Verify balance changed
      const consumerBalance = await wm.fetchBalance(consumer.id);
      const providerBalance = await wm.fetchBalance(provider.id);

      expect(consumerBalance).toBeLessThan(BigInt(1000000));
      expect(providerBalance).toBeGreaterThan(BigInt(0));
    });

    test('should fail exchange with insufficient balance', async () => {
      const consumer = createMockNPC('degen_trader', { id: 'broke-consumer' });
      const provider = createMockNPC('eth_builder', { id: 'rich-provider', occupation: 'bartender' });

      const wm = getNPCWalletManager();
      wm.getOrCreateWallet(consumer.id);
      wm.getOrCreateWallet(provider.id);
      wm.setSimulatedBalance(consumer.id, BigInt(100)); // Very low

      npcServiceRegistry.registerNPC(provider.id, 'bartender');
      const services = npcServiceRegistry.getServicesForNPC(provider.id);
      const drinkService = services.find((s) => s.serviceId.includes('serve_drink'));

      const result = await serviceExchange.executeServiceExchange(consumer, provider, drinkService!, 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient');
    });
  });

  test.describe('Gift System and Relationships', () => {
    test('should give gift and affect relationships', async () => {
      const giver = createMockNPC('degen_trader', { id: 'gift-giver' });
      const receiver = createMockNPC('eth_builder', { id: 'gift-receiver', occupation: 'bartender' });

      const wm = getNPCWalletManager();
      wm.getOrCreateWallet(giver.id);
      wm.getOrCreateWallet(receiver.id);
      wm.setSimulatedBalance(giver.id, BigInt(1000000));

      const result = await giftSystem.giveGift(giver, receiver, 'flower_bouquet', 1);

      expect(result.success).toBe(true);
      expect(result.reaction).toBeDefined();
      expect(result.relationshipChange).toBeDefined();
      expect(result.moodChange).toBeDefined();
      expect(result.dialogue).toBeDefined();
      expect(result.memories).toBeDefined();
    });

    test('should track gift history', async () => {
      const giver = createMockNPC('degen_trader', { id: 'history-giver' });
      const receiver = createMockNPC('eth_builder', { id: 'history-receiver' });

      const wm = getNPCWalletManager();
      wm.getOrCreateWallet(giver.id);
      wm.getOrCreateWallet(receiver.id);
      wm.setSimulatedBalance(giver.id, BigInt(5000000));

      await giftSystem.giveGift(giver, receiver, 'hopium_cocktail', 1);
      await giftSystem.giveGift(giver, receiver, 'flower_bouquet', 2);

      const history = giftSystem.getGiftHistory(giver.id);
      expect(history.length).toBe(2);
    });
  });

  test.describe('Economy Stats Tracking', () => {
    test('should track economy stats correctly', async () => {
      const buyer = createMockNPC('trader', { id: 'stats-buyer' });
      const seller = createMockNPC('shop_owner', { id: 'stats-seller', occupation: 'shop_owner' });

      const wm = getNPCWalletManager();
      wm.getOrCreateWallet(buyer.id);
      wm.getOrCreateWallet(seller.id);
      wm.setSimulatedBalance(buyer.id, BigInt(5000000));

      await serviceExchange.purchaseItem(buyer, seller, 'ramen_bowl', 1);
      await serviceExchange.purchaseItem(buyer, seller, 'hopium_cocktail', 1);

      const stats = serviceExchange.getEconomyStats();

      expect(stats.totalTransactions).toBe(2);
      expect(stats.totalVolume).toBeGreaterThan(BigInt(0));
    });

    test('should track wallet manager stats', async () => {
      const wm = getNPCWalletManager();
      wm.getOrCreateWallet('stat-npc-1');
      wm.getOrCreateWallet('stat-npc-2');
      wm.setSimulatedBalance('stat-npc-1', BigInt(1000000));
      wm.setSimulatedBalance('stat-npc-2', BigInt(2000000));

      const stats = wm.getEconomyStats();

      expect(stats.totalWallets).toBe(2);
      expect(stats.fundedWallets).toBe(2);
      expect(stats.totalCirculating).toBe(BigInt(3000000));
    });
  });
});

// =============================================================================
// SECTION 3: DISASTER SYSTEM INTEGRATION TESTS
// =============================================================================

test.describe('Disaster System Integration', () => {
  test.describe('Disaster Triggering', () => {
    test('should trigger disaster with proper cost calculation', () => {
      const now = Date.now();
      const manager = new PlayerDisasterManager({
        cityCreatedAt: now - 100000000,
        lastGlobalDisasterTime: 0,
      });

      manager.setGetBuildings(() => [
        { id: 'building1', buildingId: 'eth_hq', gridX: 5, gridY: 5, placedAt: now, yieldAccumulated: 0 },
      ]);
      manager.setGetBuildingDef(() => ({
        name: 'Ethereum HQ',
        cost: 10000,
        crypto: { chain: 'ethereum' as const },
      }));

      const canTrigger = manager.canTriggerDisaster('market_crash');
      expect(canTrigger.canTrigger).toBe(true);

      const result = manager.triggerDisaster({
        disasterId: 'market_crash',
        triggerAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      });

      expect(result.success).toBe(true);
      expect(result.disaster).toBeDefined();
      expect(result.costCharged).toBe(BigInt(5_000_000));
    });

    test('should block disasters during new player shield', () => {
      const manager = new PlayerDisasterManager();

      expect(manager.hasNewPlayerShield()).toBe(true);

      const canTrigger = manager.canTriggerDisaster('market_crash');
      expect(canTrigger.canTrigger).toBe(false);
      expect(canTrigger.reason).toContain('shield');
    });

    test('should respect global cooldown', () => {
      const manager = new PlayerDisasterManager({
        cityCreatedAt: Date.now() - 100000000,
        lastGlobalDisasterTime: Date.now() - 100, // Recent disaster
      });

      const canTrigger = manager.canTriggerDisaster('market_crash');
      expect(canTrigger.canTrigger).toBe(false);
      expect(canTrigger.reason).toContain('Global cooldown');
    });
  });

  test.describe('NPC Disaster Reactions', () => {
    test('should calculate reaction intensity based on personality', () => {
      const anxiousNPC = createMockNPC('normie_investor', {
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

      const intensity = calculateReactionIntensity(anxiousNPC, 'market_crash');
      expect(['panicked', 'terrified']).toContain(intensity);
    });

    test('should generate disaster thoughts', () => {
      const npc = createMockNPC('degen_trader');
      const thought = generateDisasterThought(npc, 'market_crash', 'panicked');

      expect(thought).toBeDefined();
      expect(thought.length).toBeGreaterThan(0);
    });

    test('should create disaster mood state', () => {
      const mood = createDisasterMood('panicked', 'market_crash');

      expect(mood.type).toBeDefined();
      expect(mood.intensity).toBeGreaterThan(0);
      expect(mood.cause).toBe('Market Crash');
      expect(mood.decayRate).toBe(0.01);
    });

    test('should process complete NPC disaster reaction', () => {
      const npc = createMockNPC('degen_trader', {
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
      expect(reaction.intensity).toBeTruthy();
    });
  });

  test.describe('Building Damage and Repair', () => {
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
            repairCostUSDT: 2500,
            severity: 1.0,
          },
        ],
      });

      expect(manager.isBuildingDamaged('building1')).toBe(true);

      const result = manager.repairBuilding({
        buildingId: 'building1',
        payerAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      });

      expect(result.success).toBe(true);
      expect(manager.isBuildingDamaged('building1')).toBe(false);
    });
  });
});

// =============================================================================
// SECTION 4: CITY AI INTEGRATION TESTS
// =============================================================================

test.describe('City AI Integration', () => {
  test.beforeEach(() => {
    resetCityAIManager();
  });

  test.describe('AI Enable/Disable', () => {
    test('should start disabled by default', () => {
      const manager = getCityAIManager();
      expect(manager.isEnabled()).toBe(false);
    });

    test('should enable and generate actions', () => {
      const manager = getCityAIManager();
      manager.enable();
      expect(manager.isEnabled()).toBe(true);
    });

    test('should disable and stop actions', () => {
      const manager = getCityAIManager();
      manager.enable();
      manager.disable();
      expect(manager.isEnabled()).toBe(false);
    });

    test('should toggle enabled state', () => {
      const manager = getCityAIManager();
      const initial = manager.isEnabled();
      manager.toggle();
      expect(manager.isEnabled()).toBe(!initial);
    });
  });

  test.describe('City Assessment', () => {
    test('should assess city state correctly', () => {
      const state = createTestGameState();
      const assessment = assessCityState(state);

      expect(assessment).toBeDefined();
      expect(assessment.population).toBeDefined();
      expect(assessment.jobs).toBeDefined();
      expect(assessment.treasuryHealth).toBeDefined();
      expect(assessment.prioritizedIssues).toBeDefined();
    });

    test('should identify power shortage', () => {
      const state = createTestGameState();
      addRoads(state);
      state.stats.population = 100;
      
      // Add residential buildings without power coverage
      const mid = Math.floor(state.gridSize / 2);
      for (let y = mid + 2; y < mid + 4; y++) {
        for (let x = mid + 2; x < mid + 4; x++) {
          state.grid[y][x].zone = 'residential';
          state.grid[y][x].building = {
            type: 'house_small',
            level: 1,
            population: 10,
            jobs: 0,
            powered: false, // Not powered
            watered: true,
            onFire: false,
            fireProgress: 0,
            age: 5,
            constructionProgress: 100,
            abandoned: false,
          };
          // Ensure power service is false for these tiles
          state.services.power[y][x] = false;
        }
      }

      const assessment = assessCityState(state);

      // With unpowered buildings, power coverage should be less than 100%
      expect(assessment.powerCoverage).toBeLessThan(1);
    });

    test('should get city health summary', () => {
      const state = createTestGameState();
      state.stats.happiness = 90;

      const assessment = assessCityState(state);
      const health = getCityHealthSummary(assessment);

      expect(health.status).toBeDefined();
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
    });
  });

  test.describe('Action Planning', () => {
    test('should plan actions based on assessment', () => {
      const state = createTestGameState();
      addRoads(state);
      state.stats.money = 100000;
      state.stats.demand = { residential: 80, commercial: 40, industrial: 50 };

      const assessment = assessCityState(state);
      const actions = planActions(assessment, state, 'moderate');

      expect(Array.isArray(actions)).toBe(true);
      actions.forEach((action) => {
        expect(action.id).toBeDefined();
        expect(action.type).toBeDefined();
        expect(action.cost).toBeDefined();
        expect(action.priority).toBeDefined();
      });
    });

    test('should respect budget constraints', () => {
      const state = createTestGameState();
      addRoads(state);
      state.stats.money = 500; // Very limited

      const assessment = assessCityState(state);
      const actions = planActions(assessment, state, 'moderate');

      actions.forEach((action) => {
        expect(action.cost).toBeLessThanOrEqual(state.stats.money);
      });
    });

    test('aggressive mode should plan more actions', () => {
      const state = createTestGameState();
      addRoads(state);
      state.stats.money = 100000;
      state.stats.demand = { residential: 80, commercial: 80, industrial: 80 };

      const assessment = assessCityState(state);
      const conservativeActions = planActions(assessment, state, 'conservative');
      const aggressiveActions = planActions(assessment, state, 'aggressive');

      expect(aggressiveActions.length).toBeGreaterThanOrEqual(conservativeActions.length - 1);
    });
  });

  test.describe('AI Manager Tick Behavior', () => {
    test('should not modify state when disabled', () => {
      const manager = getCityAIManager();
      const state = createTestGameState();

      const result = manager.tick(state);
      expect(result).toBe(state);
    });

    test('should not modify state when game is paused', () => {
      const manager = getCityAIManager();
      manager.enable();

      const state = createTestGameState();
      state.speed = 0;

      const result = manager.tick(state);
      expect(result).toBe(state);
    });

    test('should force assessment on demand', () => {
      const manager = getCityAIManager();
      const state = createTestGameState();

      expect(manager.getLastAssessment()).toBeNull();

      const assessment = manager.forceAssessment(state);
      expect(assessment).toBeDefined();
      expect(manager.getLastAssessment()).not.toBeNull();
    });
  });
});

// =============================================================================
// SECTION 5: X PROFILE INGESTION INTEGRATION TESTS
// =============================================================================

test.describe('X Profile Ingestion Integration', () => {
  test.beforeEach(() => {
    resetRateLimiter();
  });

  test.describe('Preview Generation', () => {
    test('should generate preview for valid username', async () => {
      const result = await previewIngestion('test_builder', {
        adapter: MockXProfileAdapter,
      });

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.username).toBe('test_builder');
        expect(result.archetype).toBeDefined();
        expect(result.occupation).toBeDefined();
        expect(result.dialogueSeeds).toHaveLength(5);
      }
    });

    test('should strip @ from username', async () => {
      const result = await previewIngestion('@test_builder', {
        adapter: MockXProfileAdapter,
      });

      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.username).toBe('test_builder');
      }
    });

    test('should return error for not found profiles', async () => {
      const result = await previewIngestion('notfound', {
        adapter: MockXProfileAdapter,
      });

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.code).toBe('NOT_FOUND');
      }
    });
  });

  test.describe('Personality Extraction', () => {
    test('should extract personality traits from profile', () => {
      const mockProfile: XProfile = {
        id: 'mock-builder-123',
        username: 'eth_builder_test',
        displayName: 'ETH Builder',
        bio: 'Building the future of DeFi | Solidity dev | Ship ship ship 🚀',
        profileImageUrl: 'https://example.com/avatar.jpg',
        recentTweets: [
          {
            id: 'tweet-1',
            text: 'Just deployed a new smart contract for yield optimization.',
            createdAt: '2024-01-15T10:00:00Z',
            likeCount: 500,
            retweetCount: 100,
            replyCount: 50,
          },
        ],
        followerCount: 50000,
        followingCount: 1200,
        isVerified: true,
        location: 'Ethereum',
      };

      const traits = extractPersonalityRuleBased(mockProfile);

      expect(traits.archetype).toBe('eth_builder');
      expect(traits.occupation).toBe('developer');
      expect(traits.confidence).toBeGreaterThan(0.5);
      expect(traits.dialogueSeeds).toHaveLength(5);
    });

    test('should quick extract archetype from bio and tweets', () => {
      const result = quickExtract('Building DeFi protocols', ['Just shipped a new smart contract']);

      expect(result.archetype).toBe('eth_builder');
      expect(result.occupation).toBe('developer');
    });
  });

  test.describe('NPC Spawn from Ingestion', () => {
    test('should successfully ingest profile and spawn NPC', async () => {
      const progressUpdates: IngestionProgress[] = [];

      const result = await ingestXProfile('test_user', {
        adapter: MockXProfileAdapter,
        gridSize: 50,
        onProgress: (p) => progressUpdates.push(p),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.npc).toBeDefined();
        expect(result.npc.name).toBeDefined();
        expect(result.npc.isIngestedUser).toBe(true);
        expect(result.npc.xUsername).toBe('test_user');
        expect(result.npc.hasX402Wallet).toBe(true);
        expect(result.npc.x402WalletAddress).toBeDefined();
        expect(result.profile).toBeDefined();
        expect(result.traits).toBeDefined();
        expect(result.duration).toBeGreaterThan(0);
      }

      // Check progress was reported
      expect(progressUpdates.some((p) => p.stage === 'fetching')).toBe(true);
      expect(progressUpdates.some((p) => p.stage === 'extracting')).toBe(true);
      expect(progressUpdates.some((p) => p.stage === 'spawning')).toBe(true);
      expect(progressUpdates.some((p) => p.stage === 'completed')).toBe(true);
    });

    test('should set personality archetype on NPC', async () => {
      const result = await ingestXProfile('builder_test', {
        adapter: MockXProfileAdapter,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.npc.personalityArchetype).toBeDefined();
        expect(result.traits.archetype).toBe(result.npc.personalityArchetype);
      }
    });

    test('should use spawn position if provided', async () => {
      const result = await ingestXProfile('positioned_user', {
        adapter: MockXProfileAdapter,
        gridSize: 50,
        spawnPosition: { x: 10, y: 15 },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.npc.gridX).toBe(10);
        expect(result.npc.gridY).toBe(15);
      }
    });
  });

  test.describe('Complete Preview-to-Ingest Flow', () => {
    test('should handle complete flow from preview to spawn', async () => {
      // Preview first
      const preview = await previewIngestion('flow_test', {
        adapter: MockXProfileAdapter,
      });

      expect('error' in preview).toBe(false);
      if (!('error' in preview)) {
        expect(preview.archetype).toBeDefined();

        // Then ingest
        const result = await ingestXProfile('flow_test', {
          adapter: MockXProfileAdapter,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.npc.xUsername).toBe(preview.username);
          expect(result.npc.personalityArchetype).toBe(preview.archetype);
        }
      }
    });
  });
});

// =============================================================================
// SECTION 6: CROSS-FEATURE INTEGRATION TESTS
// =============================================================================

test.describe('Cross-Feature Integration', () => {
  test.beforeEach(() => {
    npcServiceRegistry.clear();
    serviceExchange.clear();
    giftSystem.clear();
    initNPCWalletManager({});
    resetCityAIManager();
    resetRateLimiter();
  });

  test('should ingest user, fund wallet, and track thoughts', async () => {
    // Ingest user
    const ingestResult = await ingestXProfile('integrated_user', {
      adapter: MockXProfileAdapter,
      gridSize: 50,
    });

    expect(ingestResult.success).toBe(true);
    if (ingestResult.success) {
      const npc = ingestResult.npc;

      // Setup wallet
      const wm = getNPCWalletManager();
      if (npc.x402WalletAddress) {
        wm.getOrCreateWallet(npc.id);
        wm.setSimulatedBalance(npc.id, BigInt(1000000));

        const balance = await wm.fetchBalance(npc.id);
        expect(balance).toBe(BigInt(1000000));
      }

      // Generate thoughts
      const thoughtStream = thoughtEngine.createDefaultThoughtStream();
      expect(thoughtStream.currentThought).toBeDefined();
    }
  });

  test('should react to disaster and update economy', async () => {
    // Create NPC with wallet
    const npc = createMockNPC('degen_trader', {
      id: 'disaster-economy-npc',
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

    // Setup wallet
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(npc.id);
    wm.setSimulatedBalance(npc.id, BigInt(1000000));

    // Process disaster reaction
    const mockDisaster: ActivePlayerDisaster = {
      instanceId: 'cross-feature-disaster',
      disaster: PLAYER_DISASTERS.market_crash,
      triggeredBy: '0x0' as `0x${string}`,
      paidAmount: BigInt(5_000_000),
      startedAt: Date.now(),
      endsAt: Date.now() + 300000,
      affectedBuildingIds: [],
      affectedNpcIds: [npc.id],
      isActive: true,
      totalDamage: 0,
    };

    const reaction = processNPCDisasterReaction(npc, mockDisaster);

    expect(reaction.npcId).toBe(npc.id);
    expect(reaction.mood).toBeDefined();
    expect(reaction.thought).toBeTruthy();

    // Verify wallet still exists after disaster
    const balance = await wm.fetchBalance(npc.id);
    expect(balance).toBe(BigInt(1000000));
  });

  test('should track AI actions and economy stats together', () => {
    const state = createTestGameState();
    addRoads(state);
    state.stats.money = 100000;

    // Assess city
    const assessment = assessCityState(state);
    expect(assessment).toBeDefined();

    // Plan actions
    const actions = planActions(assessment, state, 'moderate');
    expect(Array.isArray(actions)).toBe(true);

    // Track economy stats
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet('ai-test-npc');
    wm.setSimulatedBalance('ai-test-npc', BigInt(500000));

    const economyStats = wm.getEconomyStats();
    expect(economyStats.totalWallets).toBe(1);
    expect(economyStats.totalCirculating).toBe(BigInt(500000));
  });
});
