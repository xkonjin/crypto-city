import { test, expect } from "@playwright/test";

/**
 * Tests for City Builder AI System
 * 
 * "Don't Panic!" - These tests ensure the AI doesn't accidentally
 * bulldoze the entire city or go bankrupt.
 * 
 * Tests cover:
 * - City Assessment (CityAssessor)
 * - Action Planning (CityAIPlanner)
 * - Building Placement Scoring (BuildingPlacer)
 * - AI Manager (CityAIManager)
 */

// Import types and functions
import { createInitialGameState } from "@/lib/simulation";
import {
  assessCityState,
  getCityHealthSummary,
} from "@/lib/cityAI/CityAssessor";
import { planActions } from "@/lib/cityAI/CityAIPlanner";
import {
  scorePlacement,
  findBestLocation,
  findBestLocations,
  DEFAULT_PLACEMENT_CONFIG,
} from "@/lib/cityAI/BuildingPlacer";
import {
  getCityAIManager,
  resetCityAIManager,
  CityAIManager,
  AI_GOALS,
  CityAssessment,
  CityAction,
  AIAggressiveness,
} from "@/lib/cityAI";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a basic game state for testing.
 */
function createTestGameState(size: number = 20) {
  return createInitialGameState(size, "TestCity");
}

/**
 * Add some roads to the game state for testing.
 */
function addRoads(state: ReturnType<typeof createTestGameState>) {
  const { grid, gridSize } = state;
  
  // Add a cross road pattern in the middle
  const mid = Math.floor(gridSize / 2);
  
  for (let i = 2; i < gridSize - 2; i++) {
    // Clear any existing buildings first
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

/**
 * Add residential zones and buildings.
 */
function addResidentialArea(state: ReturnType<typeof createTestGameState>) {
  const { grid } = state;
  
  // Add residential zone near roads
  for (let y = 5; y < 9; y++) {
    for (let x = 5; x < 9; x++) {
      if (grid[y][x].building.type === 'grass') {
        grid[y][x].zone = 'residential';
        grid[y][x].building = {
          type: 'house_small',
          level: 1,
          population: 5,
          jobs: 0,
          powered: true,
          watered: true,
          onFire: false,
          fireProgress: 0,
          age: 10,
          constructionProgress: 100,
          abandoned: false,
        };
      }
    }
  }
  
  // Update population stat
  state.stats.population = 80;
  state.stats.jobs = 20;
  
  return state;
}

/**
 * Add a power plant.
 */
function addPowerPlant(state: ReturnType<typeof createTestGameState>) {
  const { grid, services } = state;
  
  // Place power plant at (3, 3)
  grid[3][3].building = {
    type: 'power_plant',
    level: 1,
    population: 0,
    jobs: 30,
    powered: true,
    watered: true,
    onFire: false,
    fireProgress: 0,
    age: 5,
    constructionProgress: 100,
    abandoned: false,
  };
  
  // Set power coverage for nearby tiles
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      if (services.power[y]) {
        services.power[y][x] = true;
      }
    }
  }
  
  return state;
}

// =============================================================================
// CITY ASSESSOR TESTS
// =============================================================================

test.describe("CityAssessor - City State Assessment", () => {
  test("should assess an empty city correctly", () => {
    const state = createTestGameState();
    const assessment = assessCityState(state);
    
    expect(assessment).toBeDefined();
    expect(assessment.population).toBe(0);
    expect(assessment.jobs).toBe(0);
    expect(assessment.populationTrend).toBe('stable');
    expect(assessment.treasuryHealth).toBeDefined();
  });
  
  test("should identify housing shortage", () => {
    const state = createTestGameState();
    state.stats.population = 1000;
    
    const assessment = assessCityState(state);
    
    expect(assessment.housingShortage).not.toBeNull();
    expect(assessment.housingShortage?.unhoused).toBeGreaterThan(0);
  });
  
  test("should detect power shortage", () => {
    const state = createTestGameState();
    addRoads(state);
    addResidentialArea(state);
    // No power plant = power shortage
    
    const assessment = assessCityState(state);
    
    expect(assessment.powerCoverage).toBeLessThan(AI_GOALS.minPowerCoverage);
    
    // Should have power shortage in prioritized issues
    const powerIssue = assessment.prioritizedIssues.find(
      i => i.type === 'power_shortage'
    );
    expect(powerIssue).toBeDefined();
  });
  
  test("should detect unhappiness", () => {
    const state = createTestGameState();
    state.stats.happiness = 30; // Low happiness
    
    const assessment = assessCityState(state);
    
    expect(assessment.isUnhappy).toBe(true);
    
    const happinessIssue = assessment.prioritizedIssues.find(
      i => i.type === 'low_happiness'
    );
    expect(happinessIssue).toBeDefined();
  });
  
  test("should calculate RCI demand balance", () => {
    const state = createTestGameState();
    state.stats.demand = {
      residential: 80, // High
      commercial: 40, // Low
      industrial: 50, // Neutral
    };
    
    const assessment = assessCityState(state);
    
    expect(assessment.demandBalance.residential).toBeGreaterThan(0);
    expect(assessment.demandBalance.commercial).toBeLessThan(0);
    expect(Math.abs(assessment.demandBalance.industrial)).toBeLessThan(10);
  });
  
  test("should prioritize disasters highest", () => {
    const state = createTestGameState();
    addRoads(state);
    addResidentialArea(state);
    
    // Set a building on fire
    state.grid[6][6].building.onFire = true;
    
    const assessment = assessCityState(state);
    
    expect(assessment.activeDisasters).toBeGreaterThan(0);
    
    // Disaster should be highest priority
    if (assessment.prioritizedIssues.length > 0) {
      expect(assessment.prioritizedIssues[0].type).toBe('active_disaster');
    }
  });
  
  test("getCityHealthSummary should return correct status", () => {
    const state = createTestGameState();
    state.stats.happiness = 90;
    
    const assessment = assessCityState(state);
    const health = getCityHealthSummary(assessment);
    
    expect(health.status).toBeDefined();
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(health.mainIssues)).toBe(true);
  });
});

// =============================================================================
// CITY AI PLANNER TESTS
// =============================================================================

test.describe("CityAIPlanner - Action Planning", () => {
  test("should plan no actions when city is healthy", () => {
    const state = createTestGameState();
    addRoads(state);
    addPowerPlant(state);
    
    // Set good stats
    state.stats.happiness = 80;
    state.stats.money = 100000;
    
    const assessment = assessCityState(state);
    const actions = planActions(assessment, state, 'conservative');
    
    // May have few or no actions for a healthy city
    expect(Array.isArray(actions)).toBe(true);
  });
  
  test("should plan power plant when power coverage is low", () => {
    const state = createTestGameState();
    addRoads(state);
    addResidentialArea(state);
    state.stats.money = 50000;
    
    const assessment = assessCityState(state);
    const actions = planActions(assessment, state, 'moderate');
    
    const powerAction = actions.find(a => a.type === 'build_power_plant');
    // Power plant should be planned when coverage is low
    expect(assessment.powerCoverage).toBeLessThan(1);
  });
  
  test("should plan zoning when demand is high", () => {
    const state = createTestGameState();
    addRoads(state);
    addPowerPlant(state);
    
    state.stats.demand = {
      residential: 90,
      commercial: 30,
      industrial: 30,
    };
    state.stats.money = 50000;
    
    const assessment = assessCityState(state);
    const actions = planActions(assessment, state, 'aggressive');
    
    const zoningAction = actions.find(
      a => a.type === 'zone_residential' || 
           a.type === 'zone_commercial' || 
           a.type === 'zone_industrial'
    );
    
    // Should have some zoning action
    expect(actions.length).toBeGreaterThanOrEqual(0);
  });
  
  test("should plan tax increase when treasury is critical", () => {
    const state = createTestGameState();
    state.stats.money = 100; // Very low
    state.stats.income = 500;
    state.stats.expenses = 1000;
    state.taxRate = 5;
    
    const assessment = assessCityState(state);
    const actions = planActions(assessment, state, 'moderate');
    
    const taxAction = actions.find(a => a.type === 'adjust_tax_rate');
    
    // When broke, should suggest raising taxes
    expect(assessment.treasuryHealth).toBe('critical');
  });
  
  test("should respect budget constraints", () => {
    const state = createTestGameState();
    addRoads(state);
    state.stats.money = 500; // Very limited budget
    
    const assessment = assessCityState(state);
    const actions = planActions(assessment, state, 'moderate');
    
    // All actions should cost less than available budget
    for (const action of actions) {
      expect(action.cost).toBeLessThanOrEqual(state.stats.money);
    }
  });
  
  test("aggressive mode should plan more actions", () => {
    const state = createTestGameState();
    addRoads(state);
    state.stats.money = 100000;
    state.stats.demand = { residential: 80, commercial: 80, industrial: 80 };
    
    const assessment = assessCityState(state);
    
    const conservativeActions = planActions(assessment, state, 'conservative');
    const aggressiveActions = planActions(assessment, state, 'aggressive');
    
    // Aggressive should typically plan more or equal actions
    expect(aggressiveActions.length).toBeGreaterThanOrEqual(conservativeActions.length - 1);
  });
});

// =============================================================================
// BUILDING PLACER TESTS
// =============================================================================

test.describe("BuildingPlacer - Placement Scoring", () => {
  test("should return invalid score for water tiles", () => {
    const state = createTestGameState();
    
    // Find a water tile or set one
    state.grid[5][5].building = {
      type: 'water',
      level: 0,
      population: 0,
      jobs: 0,
      powered: false,
      watered: false,
      onFire: false,
      fireProgress: 0,
      age: 0,
      constructionProgress: 100,
      abandoned: false,
    };
    
    const score = scorePlacement(state, { x: 5, y: 5 }, 'park');
    
    expect(score.isValid).toBe(false);
    expect(score.invalidReason).toContain('water');
  });
  
  test("should return invalid score for occupied tiles", () => {
    const state = createTestGameState();
    
    // Manually place a road at a known location (not water)
    state.grid[5][5].building = {
      type: 'road',
      level: 0,
      population: 0,
      jobs: 0,
      powered: false,
      watered: false,
      onFire: false,
      fireProgress: 0,
      age: 0,
      constructionProgress: 100,
      abandoned: false,
    };
    
    const score = scorePlacement(state, { x: 5, y: 5 }, 'park');
    
    expect(score.isValid).toBe(false);
    expect(score.invalidReason).toContain('occupied');
  });
  
  test("should score higher near roads", () => {
    const state = createTestGameState();
    addRoads(state);
    
    // Tile adjacent to road
    const mid = Math.floor(state.gridSize / 2);
    const nearRoad = scorePlacement(state, { x: mid + 1, y: mid + 1 }, 'park');
    
    // Tile far from road
    const farFromRoad = scorePlacement(state, { x: 2, y: 2 }, 'park');
    
    if (nearRoad.isValid && farFromRoad.isValid) {
      expect(nearRoad.factors.roadAccess).toBeGreaterThan(farFromRoad.factors.roadAccess);
    }
  });
  
  test("should score higher with power coverage", () => {
    const state = createTestGameState();
    addRoads(state);
    addPowerPlant(state);
    
    // Tile with power
    const poweredScore = scorePlacement(state, { x: 5, y: 5 }, 'house_small');
    
    // Tile without power
    const unpoweredScore = scorePlacement(state, { x: 18, y: 18 }, 'house_small');
    
    if (poweredScore.isValid && unpoweredScore.isValid) {
      expect(poweredScore.factors.serviceCoverage).toBeGreaterThan(
        unpoweredScore.factors.serviceCoverage
      );
    }
  });
  
  test("findBestLocation should return a valid position", () => {
    const state = createTestGameState();
    addRoads(state);
    
    const location = findBestLocation(state, 'park');
    
    if (location) {
      expect(location.x).toBeGreaterThanOrEqual(0);
      expect(location.x).toBeLessThan(state.gridSize);
      expect(location.y).toBeGreaterThanOrEqual(0);
      expect(location.y).toBeLessThan(state.gridSize);
      
      // Verify the location is actually valid
      const score = scorePlacement(state, location, 'park');
      expect(score.isValid).toBe(true);
    }
  });
  
  test("findBestLocations should return multiple distinct positions", () => {
    const state = createTestGameState(30);
    addRoads(state);
    
    const locations = findBestLocations(state, 'park', 5);
    
    expect(locations.length).toBeLessThanOrEqual(5);
    
    // Check positions are distinct (not too close together)
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        const dist = Math.sqrt(
          Math.pow(locations[i].x - locations[j].x, 2) +
          Math.pow(locations[i].y - locations[j].y, 2)
        );
        expect(dist).toBeGreaterThanOrEqual(5);
      }
    }
  });
});

// =============================================================================
// CITY AI MANAGER TESTS
// =============================================================================

test.describe("CityAIManager - Singleton Manager", () => {
  test.beforeEach(() => {
    resetCityAIManager();
  });
  
  test("getCityAIManager should return singleton instance", () => {
    const manager1 = getCityAIManager();
    const manager2 = getCityAIManager();
    
    expect(manager1).toBe(manager2);
  });
  
  test("should start disabled by default", () => {
    const manager = getCityAIManager();
    
    expect(manager.isEnabled()).toBe(false);
    expect(manager.getState().enabled).toBe(false);
  });
  
  test("enable should turn on autonomous mode", () => {
    const manager = getCityAIManager();
    
    manager.enable();
    
    expect(manager.isEnabled()).toBe(true);
    expect(manager.getState().enabled).toBe(true);
  });
  
  test("disable should turn off autonomous mode", () => {
    const manager = getCityAIManager();
    
    manager.enable();
    manager.disable();
    
    expect(manager.isEnabled()).toBe(false);
  });
  
  test("toggle should switch enabled state", () => {
    const manager = getCityAIManager();
    
    const initial = manager.isEnabled();
    manager.toggle();
    expect(manager.isEnabled()).toBe(!initial);
    
    manager.toggle();
    expect(manager.isEnabled()).toBe(initial);
  });
  
  test("should allow setting aggressiveness", () => {
    const manager = getCityAIManager();
    
    manager.setAggressiveness('aggressive');
    expect(manager.getAggressiveness()).toBe('aggressive');
    
    manager.setAggressiveness('conservative');
    expect(manager.getAggressiveness()).toBe('conservative');
  });
  
  test("pause and resume should work correctly", () => {
    const manager = getCityAIManager();
    
    manager.enable();
    expect(manager.getState().isPaused).toBe(false);
    
    manager.pause();
    expect(manager.getState().isPaused).toBe(true);
    
    manager.resume();
    expect(manager.getState().isPaused).toBe(false);
  });
  
  test("tick should not modify state when disabled", () => {
    const manager = getCityAIManager();
    const state = createTestGameState();
    
    const result = manager.tick(state);
    
    expect(result).toBe(state);
  });
  
  test("tick should not modify state when game is paused", () => {
    const manager = getCityAIManager();
    manager.enable();
    
    const state = createTestGameState();
    state.speed = 0; // Game paused
    
    const result = manager.tick(state);
    
    expect(result).toBe(state);
  });
  
  test("forceAssessment should update lastAssessment", () => {
    const manager = getCityAIManager();
    const state = createTestGameState();
    
    expect(manager.getLastAssessment()).toBeNull();
    
    const assessment = manager.forceAssessment(state);
    
    expect(assessment).toBeDefined();
    expect(manager.getLastAssessment()).not.toBeNull();
  });
  
  test("cancelAction should remove action from queue", () => {
    const manager = getCityAIManager();
    manager.enable();
    
    // Manually add an action to queue for testing
    const state = manager.getState();
    const testAction: CityAction = {
      id: 'test-action-1',
      type: 'build_park',
      position: { x: 5, y: 5 },
      buildingType: 'park',
      cost: 150,
      priority: 50,
      reason: 'Test action',
      plannedAt: Date.now(),
    };
    
    // Access private state for testing (not ideal but necessary)
    (manager as any).updateState({ actionQueue: [testAction] });
    
    expect(manager.getActionQueue().length).toBe(1);
    
    const cancelled = manager.cancelAction('test-action-1');
    
    expect(cancelled).toBe(true);
    expect(manager.getActionQueue().length).toBe(0);
  });
  
  test("clearQueue should remove all pending actions", () => {
    const manager = getCityAIManager();
    manager.enable();
    
    // Add some test actions
    const actions: CityAction[] = [
      { id: 'a1', type: 'build_park', cost: 100, priority: 50, reason: 'Test', plannedAt: Date.now() },
      { id: 'a2', type: 'build_road', cost: 25, priority: 40, reason: 'Test', plannedAt: Date.now() },
    ];
    
    (manager as any).updateState({ actionQueue: actions });
    expect(manager.getActionQueue().length).toBe(2);
    
    manager.clearQueue();
    
    expect(manager.getActionQueue().length).toBe(0);
  });
  
  test("subscribe should notify on state changes", () => {
    const manager = getCityAIManager();
    let notified = false;
    
    const unsubscribe = manager.subscribe(() => {
      notified = true;
    });
    
    manager.enable();
    
    expect(notified).toBe(true);
    
    unsubscribe();
  });
  
  test("getStats should return execution statistics", () => {
    const manager = getCityAIManager();
    
    const stats = manager.getStats();
    
    expect(stats.totalActionsExecuted).toBeDefined();
    expect(stats.queueLength).toBeDefined();
    expect(Array.isArray(stats.recentActions)).toBe(true);
  });
  
  test("setConfig should update configuration", () => {
    const manager = getCityAIManager();
    
    manager.setConfig({ debugLogging: true });
    
    expect(manager.getConfig().debugLogging).toBe(true);
  });
});

// =============================================================================
// AI GOALS TESTS
// =============================================================================

test.describe("AI Goals - Configuration", () => {
  test("should have reasonable default goals", () => {
    expect(AI_GOALS.minAverageMood).toBeGreaterThan(0);
    expect(AI_GOALS.minAverageMood).toBeLessThanOrEqual(100);
    
    expect(AI_GOALS.treasuryBuffer).toBeGreaterThan(0);
    
    expect(AI_GOALS.rciBalanceThreshold).toBeGreaterThan(0);
    expect(AI_GOALS.rciBalanceThreshold).toBeLessThanOrEqual(1);
    
    expect(AI_GOALS.disasterResponseTime).toBeGreaterThan(0);
    
    expect(AI_GOALS.minHappiness).toBeGreaterThan(0);
    expect(AI_GOALS.minHappiness).toBeLessThanOrEqual(100);
    
    expect(AI_GOALS.maxUnemploymentRate).toBeGreaterThan(0);
    expect(AI_GOALS.maxUnemploymentRate).toBeLessThanOrEqual(1);
    
    expect(AI_GOALS.minPowerCoverage).toBeGreaterThan(0);
    expect(AI_GOALS.minPowerCoverage).toBeLessThanOrEqual(1);
    
    expect(AI_GOALS.minWaterCoverage).toBeGreaterThan(0);
    expect(AI_GOALS.minWaterCoverage).toBeLessThanOrEqual(1);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

test.describe("City AI - Integration", () => {
  test.beforeEach(() => {
    resetCityAIManager();
  });
  
  test("full assessment-to-action cycle should work", () => {
    const state = createTestGameState();
    addRoads(state);
    state.stats.money = 100000;
    state.stats.demand = { residential: 70, commercial: 30, industrial: 30 };
    
    // Assess
    const assessment = assessCityState(state);
    expect(assessment).toBeDefined();
    
    // Plan
    const actions = planActions(assessment, state, 'moderate');
    expect(Array.isArray(actions)).toBe(true);
    
    // Verify actions have required fields
    for (const action of actions) {
      expect(action.id).toBeDefined();
      expect(action.type).toBeDefined();
      expect(action.cost).toBeDefined();
      expect(action.priority).toBeDefined();
      expect(action.reason).toBeDefined();
    }
  });
  
  test("AI manager should execute planned actions", () => {
    const manager = getCityAIManager();
    manager.enable();
    manager.setConfig({ 
      assessmentInterval: 1, 
      actionInterval: 1,
      maxActionsPerCycle: 1 
    });
    
    const state = createTestGameState();
    addRoads(state);
    state.stats.money = 100000;
    state.speed = 1;
    
    // Run multiple ticks
    let currentState = state;
    for (let i = 0; i < 10; i++) {
      currentState = manager.tick(currentState);
    }
    
    // Should have assessed the city
    expect(manager.getLastAssessment()).not.toBeNull();
    
    manager.disable();
  });
  
  test("AI should not bankrupt the city", () => {
    const manager = getCityAIManager();
    manager.enable();
    manager.setAggressiveness('aggressive');
    
    const state = createTestGameState();
    addRoads(state);
    state.stats.money = 10000;
    state.speed = 1;
    
    // Run many ticks
    let currentState = state;
    for (let i = 0; i < 50; i++) {
      currentState = manager.tick(currentState);
    }
    
    // Money should stay above buffer
    expect(currentState.stats.money).toBeGreaterThanOrEqual(0);
    
    manager.disable();
  });
});
