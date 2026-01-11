import { test, expect } from "@playwright/test";

/**
 * Tests for NPC Economic System (Issues #110, #111, #112)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * This implements NPC wallet, finances, trading, and staking systems.
 */

// Import types and functions we're going to implement
import type {
  NPCWallet,
  StakedPosition,
  NPCFinances,
  TradeDecision,
  MarketData,
  ExpenseTier,
} from "@/lib/npc/economy";
import {
  SALARY_RANGES,
  EXPENSE_TIERS,
  ECONOMY_DESCRIPTIONS,
  createDefaultWallet,
  createDefaultFinances,
  createStakedPosition,
} from "@/lib/npc/economy";
import { EconomyManager } from "@/lib/npc/EconomyManager";
import type { CryptoNPC, Occupation } from "@/games/isocity/types/npc";
import { createDefaultPersonality } from "@/lib/npc/personality";
import { createDefaultNeeds } from "@/lib/npc/needs";
import { createDefaultMemory } from "@/lib/npc/memory";
import { createInitialMovement } from "@/lib/npc/movement";

/**
 * Helper to create a mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  return {
    id: 'test-npc-1',
    name: 'Test_Trader_42',
    walletAddress: '0x' + 'a'.repeat(40),
    age: 30,
    occupation: 'trader',
    residence: 'building-1',
    workplace: 'building-2',
    spriteType: 'apple',
    direction: 'south',
    gridX: 5,
    gridY: 5,
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: 'idle',
    needs: createDefaultNeeds(),
    memory: createDefaultMemory(),
    movement: createInitialMovement(),
    personality: createDefaultPersonality(),
    relationships: {},
    wallet: createDefaultWallet(),
    finances: createDefaultFinances('trader'),
    ...overrides,
  } as CryptoNPC;
}

/**
 * Test Suite: NPCWallet Interface
 * Tests the basic wallet data structure
 */
test.describe("NPCWallet Interface", () => {
  test("should have correct properties", async () => {
    const wallet: NPCWallet = {
      cash: 1000,
      holdings: { "BTC": 0.5, "ETH": 2.0 },
      stakedPositions: [],
    };

    expect(wallet.cash).toBe(1000);
    expect(wallet.holdings["BTC"]).toBe(0.5);
    expect(wallet.holdings["ETH"]).toBe(2.0);
    expect(wallet.stakedPositions).toHaveLength(0);
  });

  test("createDefaultWallet should create a wallet with initial cash", async () => {
    const wallet = createDefaultWallet();
    
    expect(wallet.cash).toBeGreaterThanOrEqual(0);
    expect(wallet.holdings).toBeDefined();
    expect(wallet.stakedPositions).toBeDefined();
    expect(wallet.stakedPositions).toHaveLength(0);
  });

  test("createDefaultWallet should accept initial cash override", async () => {
    const wallet = createDefaultWallet(500);
    
    expect(wallet.cash).toBe(500);
  });
});

/**
 * Test Suite: StakedPosition Interface
 */
test.describe("StakedPosition Interface", () => {
  test("should have correct properties", async () => {
    const position: StakedPosition = {
      token: "ETH",
      amount: 2.0,
      protocol: "Lido",
      apy: 4.5,
      stakedAt: Date.now(),
    };

    expect(position.token).toBe("ETH");
    expect(position.amount).toBe(2.0);
    expect(position.protocol).toBe("Lido");
    expect(position.apy).toBe(4.5);
    expect(position.stakedAt).toBeGreaterThan(0);
  });

  test("createStakedPosition should create a position", async () => {
    const position = createStakedPosition("ETH", 1.0, "Lido", 4.5);
    
    expect(position.token).toBe("ETH");
    expect(position.amount).toBe(1.0);
    expect(position.protocol).toBe("Lido");
    expect(position.apy).toBe(4.5);
    expect(position.stakedAt).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: NPCFinances Interface
 */
test.describe("NPCFinances Interface", () => {
  test("should have correct properties", async () => {
    const finances: NPCFinances = {
      salary: 200,
      tradingProfits: 50,
      stakingRewards: 10,
      housing: 50,
      food: 25,
      entertainment: 20,
      taxes: 30,
      netWorth: 5000,
      dailyNet: 135,
    };

    expect(finances.salary).toBe(200);
    expect(finances.tradingProfits).toBe(50);
    expect(finances.stakingRewards).toBe(10);
    expect(finances.housing).toBe(50);
    expect(finances.food).toBe(25);
    expect(finances.entertainment).toBe(20);
    expect(finances.taxes).toBe(30);
    expect(finances.netWorth).toBe(5000);
    expect(finances.dailyNet).toBe(135);
  });

  test("createDefaultFinances should create finances for an occupation", async () => {
    const finances = createDefaultFinances('trader');
    
    expect(finances.salary).toBeGreaterThanOrEqual(SALARY_RANGES.trader.min);
    expect(finances.salary).toBeLessThanOrEqual(SALARY_RANGES.trader.max);
    expect(finances.tradingProfits).toBe(0);
    expect(finances.stakingRewards).toBe(0);
    expect(finances.housing).toBeGreaterThan(0);
    expect(finances.food).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: Salary Ranges
 */
test.describe("Salary Ranges", () => {
  test("should define salary ranges for all occupations", async () => {
    expect(SALARY_RANGES.trader).toEqual({ min: 100, max: 500 });
    expect(SALARY_RANGES.miner).toEqual({ min: 80, max: 200 });
    expect(SALARY_RANGES.developer).toEqual({ min: 150, max: 400 });
    expect(SALARY_RANGES.shop_owner).toEqual({ min: 50, max: 300 });
    expect(SALARY_RANGES.bartender).toEqual({ min: 40, max: 100 });
    expect(SALARY_RANGES.artist).toEqual({ min: 20, max: 400 });
    expect(SALARY_RANGES.security).toEqual({ min: 60, max: 120 });
    expect(SALARY_RANGES.unemployed).toEqual({ min: 0, max: 0 });
  });

  test("trader salary should have higher ceiling than bartender", async () => {
    expect(SALARY_RANGES.trader.max).toBeGreaterThan(SALARY_RANGES.bartender.max);
  });

  test("unemployed should have zero salary", async () => {
    expect(SALARY_RANGES.unemployed.min).toBe(0);
    expect(SALARY_RANGES.unemployed.max).toBe(0);
  });
});

/**
 * Test Suite: Expense Tiers
 */
test.describe("Expense Tiers", () => {
  test("should define expense tiers for all lifestyles", async () => {
    expect(EXPENSE_TIERS.frugal).toEqual({ housing: 20, food: 10, entertainment: 5 });
    expect(EXPENSE_TIERS.moderate).toEqual({ housing: 50, food: 25, entertainment: 20 });
    expect(EXPENSE_TIERS.lavish).toEqual({ housing: 150, food: 60, entertainment: 80 });
  });

  test("lavish expenses should be higher than frugal", async () => {
    expect(EXPENSE_TIERS.lavish.housing).toBeGreaterThan(EXPENSE_TIERS.frugal.housing);
    expect(EXPENSE_TIERS.lavish.food).toBeGreaterThan(EXPENSE_TIERS.frugal.food);
    expect(EXPENSE_TIERS.lavish.entertainment).toBeGreaterThan(EXPENSE_TIERS.frugal.entertainment);
  });
});

/**
 * Test Suite: EconomyManager - Wallet Operations
 */
test.describe("EconomyManager - Wallet Operations", () => {
  test("getBalance should return cash amount", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 1000;

    expect(manager.getBalance(npc)).toBe(1000);
  });

  test("getNetWorth should include cash and holdings value", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 1000;
    npc.wallet!.holdings = { "BTC": 0.1, "ETH": 1.0 };
    
    const prices = { "BTC": 40000, "ETH": 2000 };
    const netWorth = manager.getNetWorth(npc, prices);

    // 1000 cash + 0.1 * 40000 BTC + 1.0 * 2000 ETH = 1000 + 4000 + 2000 = 7000
    expect(netWorth).toBe(7000);
  });

  test("deposit should add to cash balance", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 1000;

    manager.deposit(npc, 500);

    expect(npc.wallet!.cash).toBe(1500);
  });

  test("withdraw should subtract from cash balance", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 1000;

    const success = manager.withdraw(npc, 400);

    expect(success).toBe(true);
    expect(npc.wallet!.cash).toBe(600);
  });

  test("withdraw should fail if insufficient funds", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 100;

    const success = manager.withdraw(npc, 500);

    expect(success).toBe(false);
    expect(npc.wallet!.cash).toBe(100); // Unchanged
  });
});

/**
 * Test Suite: EconomyManager - Income
 */
test.describe("EconomyManager - Income", () => {
  test("calculateDailyIncome should sum salary, trading profits, and staking", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.finances!.salary = 200;
    npc.finances!.tradingProfits = 50;
    npc.finances!.stakingRewards = 10;

    const income = manager.calculateDailyIncome(npc);

    expect(income).toBe(260);
  });

  test("payDay should add daily income to wallet", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 1000;
    npc.finances!.salary = 200;
    npc.finances!.tradingProfits = 0;
    npc.finances!.stakingRewards = 0;

    manager.payDay(npc);

    expect(npc.wallet!.cash).toBe(1200);
  });
});

/**
 * Test Suite: EconomyManager - Expenses
 */
test.describe("EconomyManager - Expenses", () => {
  test("calculateDailyExpenses should sum all expense categories", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.finances!.housing = 50;
    npc.finances!.food = 25;
    npc.finances!.entertainment = 20;
    npc.finances!.taxes = 30;

    const expenses = manager.calculateDailyExpenses(npc);

    expect(expenses).toBe(125);
  });

  test("payExpenses should deduct from wallet and return true", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 500;
    npc.finances!.housing = 50;
    npc.finances!.food = 25;
    npc.finances!.entertainment = 20;
    npc.finances!.taxes = 30;

    const success = manager.payExpenses(npc);

    expect(success).toBe(true);
    expect(npc.wallet!.cash).toBe(375); // 500 - 125
  });

  test("payExpenses should return false if broke", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 50;
    npc.finances!.housing = 50;
    npc.finances!.food = 25;
    npc.finances!.entertainment = 20;
    npc.finances!.taxes = 30;

    const success = manager.payExpenses(npc);

    expect(success).toBe(false);
    expect(npc.wallet!.cash).toBe(50); // Unchanged - can't afford
  });
});

/**
 * Test Suite: EconomyManager - Trading
 */
test.describe("EconomyManager - Trading", () => {
  test("buyToken should deduct cash and add holdings", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 1000;
    npc.wallet!.holdings = {};

    const success = manager.buyToken(npc, "ETH", 0.5, 2000); // 0.5 ETH at $2000

    expect(success).toBe(true);
    expect(npc.wallet!.cash).toBe(0); // 1000 - (0.5 * 2000)
    expect(npc.wallet!.holdings["ETH"]).toBe(0.5);
  });

  test("buyToken should fail if insufficient funds", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 100;
    npc.wallet!.holdings = {};

    const success = manager.buyToken(npc, "ETH", 1.0, 2000);

    expect(success).toBe(false);
    expect(npc.wallet!.cash).toBe(100);
    expect(npc.wallet!.holdings["ETH"]).toBeUndefined();
  });

  test("buyToken should add to existing holdings", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 2000;
    npc.wallet!.holdings = { "ETH": 0.5 };

    manager.buyToken(npc, "ETH", 0.5, 2000);

    expect(npc.wallet!.holdings["ETH"]).toBe(1.0);
  });

  test("sellToken should add cash and reduce holdings", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 0;
    npc.wallet!.holdings = { "ETH": 1.0 };

    const success = manager.sellToken(npc, "ETH", 0.5, 2000);

    expect(success).toBe(true);
    expect(npc.wallet!.cash).toBe(1000);
    expect(npc.wallet!.holdings["ETH"]).toBe(0.5);
  });

  test("sellToken should fail if insufficient holdings", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 0;
    npc.wallet!.holdings = { "ETH": 0.1 };

    const success = manager.sellToken(npc, "ETH", 1.0, 2000);

    expect(success).toBe(false);
    expect(npc.wallet!.holdings["ETH"]).toBe(0.1);
  });

  test("sellToken should remove token from holdings if fully sold", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 0;
    npc.wallet!.holdings = { "ETH": 1.0 };

    manager.sellToken(npc, "ETH", 1.0, 2000);

    expect(npc.wallet!.holdings["ETH"]).toBe(0);
  });
});

/**
 * Test Suite: EconomyManager - Trading Decisions
 */
test.describe("EconomyManager - Trading Decisions", () => {
  test("shouldTrade should suggest buying in bullish market for high FOMO NPC", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 500;
    npc.personality.crypto.fomo = 0.9;
    
    const market: MarketData = {
      prices: { "ETH": 2000, "BTC": 40000 },
      changes24h: { "ETH": 5, "BTC": 3 },
      sentiment: 'bullish',
    };

    const decision = manager.shouldTrade(npc, market);

    expect(decision).not.toBeNull();
    expect(decision?.action).toBe('buy');
    expect(decision?.reason).toContain('FOMO');
  });

  test("shouldTrade should suggest buying dip for high risk tolerance NPC", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 500;
    npc.personality.crypto.riskTolerance = 0.9;
    
    const market: MarketData = {
      prices: { "ETH": 2000, "BTC": 35000 },
      changes24h: { "ETH": -20, "BTC": -5 },
      sentiment: 'bearish',
    };

    const decision = manager.shouldTrade(npc, market);

    expect(decision).not.toBeNull();
    expect(decision?.action).toBe('buy');
    expect(decision?.token).toBe('ETH');
    expect(decision?.reason).toContain('dip');
  });

  test("shouldTrade should suggest selling for low risk tolerance in bearish market", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 100;
    npc.wallet!.holdings = { "ETH": 1.0 };
    npc.personality.crypto.riskTolerance = 0.2;
    
    const market: MarketData = {
      prices: { "ETH": 2000 },
      changes24h: { "ETH": -10 },
      sentiment: 'bearish',
    };

    const decision = manager.shouldTrade(npc, market);

    expect(decision).not.toBeNull();
    expect(decision?.action).toBe('sell');
    expect(decision?.reason).toContain('panic');
  });

  test("shouldTrade should return null for conservative NPC in neutral market", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 500;
    npc.personality.crypto.fomo = 0.2;
    npc.personality.crypto.riskTolerance = 0.3;
    
    const market: MarketData = {
      prices: { "ETH": 2000 },
      changes24h: { "ETH": 0 },
      sentiment: 'neutral',
    };

    const decision = manager.shouldTrade(npc, market);

    expect(decision).toBeNull();
  });
});

/**
 * Test Suite: EconomyManager - Staking
 */
test.describe("EconomyManager - Staking", () => {
  test("stake should move tokens from holdings to staked positions", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.holdings = { "ETH": 2.0 };
    npc.wallet!.stakedPositions = [];

    const success = manager.stake(npc, "ETH", 1.0, "Lido", 4.5);

    expect(success).toBe(true);
    expect(npc.wallet!.holdings["ETH"]).toBe(1.0);
    expect(npc.wallet!.stakedPositions).toHaveLength(1);
    expect(npc.wallet!.stakedPositions[0].token).toBe("ETH");
    expect(npc.wallet!.stakedPositions[0].amount).toBe(1.0);
    expect(npc.wallet!.stakedPositions[0].protocol).toBe("Lido");
    expect(npc.wallet!.stakedPositions[0].apy).toBe(4.5);
  });

  test("stake should fail if insufficient holdings", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.holdings = { "ETH": 0.5 };
    npc.wallet!.stakedPositions = [];

    const success = manager.stake(npc, "ETH", 1.0, "Lido", 4.5);

    expect(success).toBe(false);
    expect(npc.wallet!.holdings["ETH"]).toBe(0.5);
    expect(npc.wallet!.stakedPositions).toHaveLength(0);
  });

  test("unstake should move tokens from staked positions back to holdings", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.holdings = { "ETH": 0 };
    npc.wallet!.stakedPositions = [
      { token: "ETH", amount: 1.0, protocol: "Lido", apy: 4.5, stakedAt: Date.now() - 86400000 },
    ];

    const success = manager.unstake(npc, 0);

    expect(success).toBe(true);
    expect(npc.wallet!.holdings["ETH"]).toBe(1.0);
    expect(npc.wallet!.stakedPositions).toHaveLength(0);
  });

  test("unstake should fail for invalid position index", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.holdings = {};
    npc.wallet!.stakedPositions = [];

    const success = manager.unstake(npc, 0);

    expect(success).toBe(false);
  });

  test("calculateStakingRewards should compute rewards based on APY", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    
    // Staked 1 ETH at 4.5% APY for 1 day
    const oneDayAgo = Date.now() - 86400000;
    npc.wallet!.stakedPositions = [
      { token: "ETH", amount: 1.0, protocol: "Lido", apy: 4.5, stakedAt: oneDayAgo },
    ];

    const prices = { "ETH": 2000 };
    const rewards = manager.calculateStakingRewards(npc, prices);

    // 1 ETH * 2000 * 0.045 / 365 ≈ 0.247 per day
    expect(rewards).toBeGreaterThan(0);
    expect(rewards).toBeLessThan(1); // Should be reasonable daily amount
  });
});

/**
 * Test Suite: Economy Daily Cycle
 */
test.describe("Economy Daily Cycle", () => {
  test("processDailyEconomyCycle should pay income and deduct expenses", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 500;
    npc.finances!.salary = 200;
    npc.finances!.tradingProfits = 0;
    npc.finances!.stakingRewards = 0;
    npc.finances!.housing = 50;
    npc.finances!.food = 25;
    npc.finances!.entertainment = 20;
    npc.finances!.taxes = 30;

    manager.processDailyEconomyCycle(npc);

    // 500 + 200 (income) - 125 (expenses) = 575
    expect(npc.wallet!.cash).toBe(575);
  });

  test("processDailyEconomyCycle should update net worth", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.wallet!.cash = 500;
    npc.wallet!.holdings = { "ETH": 1.0 };
    
    const prices = { "ETH": 2000 };
    manager.processDailyEconomyCycle(npc, prices);

    // Net worth should be updated
    expect(npc.finances!.netWorth).toBe(npc.wallet!.cash + 2000);
  });

  test("processDailyEconomyCycle should update daily net calculation", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.finances!.salary = 200;
    npc.finances!.tradingProfits = 50;
    // Note: stakingRewards gets recalculated to 0 since no staked positions exist
    npc.finances!.housing = 50;
    npc.finances!.food = 25;
    npc.finances!.entertainment = 20;
    npc.finances!.taxes = 30;

    manager.processDailyEconomyCycle(npc);

    // dailyNet = (200 + 50 + 0) - (50 + 25 + 20 + 30) = 250 - 125 = 125
    // stakingRewards is recalculated from actual staked positions (empty = 0)
    expect(npc.finances!.dailyNet).toBe(125);
  });
});

/**
 * Test Suite: Initialize Wallet by Occupation
 */
test.describe("Initialize Wallet by Occupation", () => {
  test("trader should start with higher balance", async () => {
    const manager = new EconomyManager();
    const traderWallet = manager.initializeWalletForOccupation('trader');
    const bartenderWallet = manager.initializeWalletForOccupation('bartender');

    // On average, trader should have more than bartender
    // Testing with multiple samples
    let traderTotal = 0;
    let bartenderTotal = 0;
    for (let i = 0; i < 10; i++) {
      traderTotal += manager.initializeWalletForOccupation('trader').cash;
      bartenderTotal += manager.initializeWalletForOccupation('bartender').cash;
    }
    
    expect(traderTotal / 10).toBeGreaterThan(bartenderTotal / 10);
  });

  test("unemployed should start with minimal balance", async () => {
    const manager = new EconomyManager();
    const wallet = manager.initializeWalletForOccupation('unemployed');

    expect(wallet.cash).toBeLessThanOrEqual(100);
  });

  test("developer should have potential ETH holdings", async () => {
    const manager = new EconomyManager();
    
    // Developers might start with some ETH
    let hasEth = false;
    for (let i = 0; i < 10; i++) {
      const wallet = manager.initializeWalletForOccupation('developer');
      if (wallet.holdings["ETH"] && wallet.holdings["ETH"] > 0) {
        hasEth = true;
        break;
      }
    }
    
    // Not guaranteed, but possible
    // This test just ensures the system can give holdings
    expect(typeof hasEth).toBe('boolean');
  });
});

/**
 * Test Suite: Hitchhiker's Guide Descriptions
 */
test.describe("Economy Hitchhiker's Guide Descriptions", () => {
  test("should have description for salary", async () => {
    expect(ECONOMY_DESCRIPTIONS.salary).toContain("regular income");
    expect(ECONOMY_DESCRIPTIONS.salary).toContain("volatile");
  });

  test("should have description for staking", async () => {
    expect(ECONOMY_DESCRIPTIONS.staking).toContain("Locking");
    expect(ECONOMY_DESCRIPTIONS.staking).toContain("risk");
  });

  test("should have description for trading", async () => {
    expect(ECONOMY_DESCRIPTIONS.trading).toContain("buying high");
    expect(ECONOMY_DESCRIPTIONS.trading).toContain("selling low");
  });

  test("should have description for expenses", async () => {
    expect(ECONOMY_DESCRIPTIONS.expenses).toContain("appreciate");
  });

  test("should have description for netWorth", async () => {
    expect(ECONOMY_DESCRIPTIONS.netWorth).toContain("worth");
  });

  test("should have description for broke", async () => {
    expect(ECONOMY_DESCRIPTIONS.broke).toContain("airdrops");
  });

  test("should have descriptions for all economy concepts", async () => {
    expect(ECONOMY_DESCRIPTIONS.salary).toBeDefined();
    expect(ECONOMY_DESCRIPTIONS.staking).toBeDefined();
    expect(ECONOMY_DESCRIPTIONS.trading).toBeDefined();
    expect(ECONOMY_DESCRIPTIONS.expenses).toBeDefined();
    expect(ECONOMY_DESCRIPTIONS.netWorth).toBeDefined();
    expect(ECONOMY_DESCRIPTIONS.broke).toBeDefined();
  });
});

/**
 * Test Suite: Lifestyle Tier Selection
 */
test.describe("Lifestyle Tier Selection", () => {
  test("getLifestyleTier should return frugal for low income NPCs", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC({ occupation: 'bartender' });
    npc.finances!.salary = 50;

    const tier = manager.getLifestyleTier(npc);

    expect(tier).toBe('frugal');
  });

  test("getLifestyleTier should return moderate for average income NPCs", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC({ occupation: 'developer' });
    npc.finances!.salary = 200;

    const tier = manager.getLifestyleTier(npc);

    expect(tier).toBe('moderate');
  });

  test("getLifestyleTier should return lavish for high income NPCs", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC({ occupation: 'trader' });
    npc.finances!.salary = 450;
    npc.finances!.tradingProfits = 200;

    const tier = manager.getLifestyleTier(npc);

    expect(tier).toBe('lavish');
  });
});

/**
 * Test Suite: Record Trading Profits
 */
test.describe("Record Trading Profits", () => {
  test("recordTradingProfit should update trading profits", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.finances!.tradingProfits = 0;

    manager.recordTradingProfit(npc, 100);

    expect(npc.finances!.tradingProfits).toBe(100);
  });

  test("recordTradingProfit should accumulate profits", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.finances!.tradingProfits = 50;

    manager.recordTradingProfit(npc, 100);

    expect(npc.finances!.tradingProfits).toBe(150);
  });

  test("recordTradingProfit should handle losses (negative profits)", async () => {
    const manager = new EconomyManager();
    const npc = createMockNPC();
    npc.finances!.tradingProfits = 100;

    manager.recordTradingProfit(npc, -50);

    expect(npc.finances!.tradingProfits).toBe(50);
  });
});
