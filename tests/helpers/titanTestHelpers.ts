/**
 * Test Helper Functions for Titan System
 *
 * Provides reusable mock data and utility functions for Titan-related tests.
 * Centralizes creation of mock objects to ensure consistency across tests.
 */

import type { Page } from "@playwright/test";
import type {
  TitanPet,
  TitanSpecies,
  TitanNeeds,
  TitanMood,
  TitanBDI,
  TitanSkill,
  TitanSkillProgression,
  AlignmentState,
  TitanRelationship,
  ActionHistoryEntry,
} from "@/games/isocity/types/titan";
import type { CryptoNPC } from "@/games/isocity/types/npc";

// ============================================================================
// Type Definitions
// ============================================================================

export interface TitanOverrides {
  id?: string;
  species?: TitanSpecies;
  name?: string;
  age?: number;
  alignment?: number;
  gridX?: number;
  gridY?: number;
  direction?: "north" | "south" | "east" | "west";
  currentActivity?: string | null;
  isInsideBuilding?: boolean;
  currentBuildingId?: string | null;
  skillLevels?: Partial<Record<TitanSkill, number>>;
  needValues?: Partial<Record<keyof TitanNeeds, number>>;
  relationships?: Record<string, TitanRelationship>;
  actionHistory?: ActionHistoryEntry[];
}

export interface NPCOverrides {
  id?: string;
  name?: string;
  gridX?: number;
  gridY?: number;
  occupation?: string;
  neuroticism?: number;
  agreeableness?: number;
  extraversion?: number;
  openness?: number;
  conscientiousness?: number;
  isInsideBuilding?: boolean;
  currentBuildingId?: string | null;
  factionId?: string | null;
  needValues?: Partial<Record<string, number>>;
}

// ============================================================================
// Mock Data Factory Functions
// ============================================================================

/**
 * Create a mock TitanPet with sensible defaults and customizable overrides.
 */
export function createMockTitan(overrides: TitanOverrides = {}): TitanPet {
  const now = Date.now();

  // Build skills with optional level overrides
  const skills: Record<TitanSkill, TitanSkillProgression> = {} as Record<
    TitanSkill,
    TitanSkillProgression
  >;
  const allSkills: TitanSkill[] = [
    "strength",
    "speed",
    "endurance",
    "intelligence",
    "awareness",
    "memory",
    "charisma",
    "intimidation",
    "empathy",
    "miracles",
    "stealth",
    "gathering",
  ];

  for (const skill of allSkills) {
    const level = overrides.skillLevels?.[skill] ?? 1;
    skills[skill] = {
      skill,
      level,
      experience: level > 1 ? getXPForLevel(level) : 0,
      aptitude: 1.0,
      lastUsed: now,
    };
  }

  // Build needs with optional value overrides
  const needs: TitanNeeds = {
    hunger: createNeed(overrides.needValues?.hunger ?? 75),
    energy: createNeed(overrides.needValues?.energy ?? 80),
    social: createNeed(overrides.needValues?.social ?? 60),
    fun: createNeed(overrides.needValues?.fun ?? 70),
    wealth: createNeed(overrides.needValues?.wealth ?? 50),
    purpose: createNeed(overrides.needValues?.purpose ?? 65),
    attention: createNeed(overrides.needValues?.attention ?? 40),
    growth: createNeed(overrides.needValues?.growth ?? 55),
  };

  // Determine appearance from alignment
  const alignment = overrides.alignment ?? 0;
  const currentAppearance = getAlignmentState(alignment);

  // Build mood
  const mood: TitanMood = {
    currentMood: "neutral",
    moodIntensity: 0.5,
    thoughts: [],
    beliefs: [],
    desires: [],
    beliefsAboutPlayer: { trust: 0.5, fear: 0.0, affection: 0.5 },
  };

  // Build BDI
  const bdi: TitanBDI = {
    beliefs: {
      worldKnowledge: new Map(),
      actionBeliefs: new Map(),
      npcOpinions: new Map(),
      playerRelationship: { trust: 0.5, fear: 0.0, affection: 0.5 },
    },
    desires: [],
    intentions: null,
  };

  return {
    id: overrides.id ?? `titan-test-${now}`,
    species: overrides.species ?? "doge",
    name: overrides.name ?? "TestTitan",
    age: overrides.age ?? 1,
    alignment,
    currentAppearance,
    gridX: overrides.gridX ?? 10,
    gridY: overrides.gridY ?? 10,
    direction: overrides.direction ?? "south",
    isInsideBuilding: overrides.isInsideBuilding ?? false,
    currentBuildingId: overrides.currentBuildingId ?? null,
    currentActivity: overrides.currentActivity ?? null,
    needs,
    mood,
    bdi,
    skills,
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
    actionHistory: overrides.actionHistory ?? [],
    relationships: overrides.relationships ?? {},
  } as TitanPet;
}

/**
 * Create a mock CryptoNPC with sensible defaults and customizable overrides.
 */
export function createMockNPC(overrides: NPCOverrides = {}): CryptoNPC {
  const now = Date.now();

  return {
    id: overrides.id ?? `npc-test-${now}`,
    name: overrides.name ?? "TestNPC",
    walletAddress: `0x${Math.random().toString(16).slice(2, 10)}`,
    age: 30,
    occupation: overrides.occupation ?? "trader",
    residence: null,
    workplace: null,
    spriteType: "apple",
    direction: "south",
    gridX: overrides.gridX ?? 11,
    gridY: overrides.gridY ?? 10,
    isInsideBuilding: overrides.isInsideBuilding ?? false,
    currentBuildingId: overrides.currentBuildingId ?? null,
    currentActivity: null,
    needs: {
      hunger: createNeed(overrides.needValues?.hunger ?? 75),
      energy: createNeed(overrides.needValues?.energy ?? 80),
      social: createNeed(overrides.needValues?.social ?? 60),
      fun: createNeed(overrides.needValues?.fun ?? 70),
      wealth: createNeed(overrides.needValues?.wealth ?? 50),
      purpose: createNeed(overrides.needValues?.purpose ?? 65),
    },
    memory: {
      episodic: [],
      semantic: [],
      procedural: [],
      working: { recentContext: [], currentGoal: null },
    },
    movement: {
      state: "idle",
      path: null,
      currentPathIndex: 0,
      targetPosition: null,
      speed: 1,
      interpolation: {
        progress: 0,
        startX: overrides.gridX ?? 11,
        startY: overrides.gridY ?? 10,
        endX: overrides.gridX ?? 11,
        endY: overrides.gridY ?? 10,
      },
    },
    personality: {
      bigFive: {
        openness: overrides.openness ?? 0.5,
        conscientiousness: overrides.conscientiousness ?? 0.5,
        extraversion: overrides.extraversion ?? 0.5,
        agreeableness: overrides.agreeableness ?? 0.5,
        neuroticism: overrides.neuroticism ?? 0.5,
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
    factionId: overrides.factionId ?? null,
  } as unknown as CryptoNPC;
}

/**
 * Create a mock TitanRelationship for testing.
 */
export function createMockRelationship(
  overrides: Partial<TitanRelationship> = {}
): TitanRelationship {
  return {
    npcId: overrides.npcId ?? "npc-test-1",
    trust: overrides.trust ?? 0,
    respect: overrides.respect ?? 0,
    familiarity: overrides.familiarity ?? 0,
    fear: overrides.fear ?? 0,
    firstMet: overrides.firstMet ?? Date.now(),
    lastInteraction: overrides.lastInteraction ?? Date.now(),
    interactionCount: overrides.interactionCount ?? 0,
  };
}

/**
 * Create a mock action history entry.
 */
export function createMockAction(
  action: string,
  alignmentImpact: number = 0,
  minutesAgo: number = 0
): ActionHistoryEntry {
  return {
    action,
    timestamp: Date.now() - minutesAgo * 60 * 1000,
    alignmentImpact,
    relatedNpcId: undefined,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a Need object with the given current value.
 */
function createNeed(current: number) {
  return {
    current,
    max: 100,
    decayRate: 0.5,
    criticalThreshold: 20,
    weight: 1.0,
  };
}

/**
 * Get the alignment state based on alignment value.
 */
function getAlignmentState(alignment: number): AlignmentState {
  if (alignment <= -0.6) return "angelic";
  if (alignment <= -0.2) return "good";
  if (alignment <= 0.2) return "neutral";
  if (alignment <= 0.6) return "evil";
  return "demonic";
}

/**
 * Get the minimum XP required for a given level.
 */
function getXPForLevel(level: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000];
  return thresholds[Math.min(level - 1, 9)] ?? 0;
}

// ============================================================================
// Browser/Page Helper Functions
// ============================================================================

/**
 * Wait for Titan update in the UI (uses polling).
 */
export async function waitForTitanUpdate(page: Page): Promise<void> {
  // Wait for any Titan state change by checking the status panel
  await page.waitForTimeout(500);
  await page.waitForFunction(
    () => {
      // @ts-expect-error - window.__TEST_HOOKS__ is set by providers
      const hooks = window.__TEST_HOOKS__;
      return hooks?.hasTitan?.() === true;
    },
    { timeout: 10000 }
  ).catch(() => {
    // Titan might not be spawned, that's okay
  });
}

/**
 * Spawn a Titan in the browser context.
 */
export async function spawnTitanInBrowser(
  page: Page,
  options: { gridX?: number; gridY?: number; species?: string; name?: string } = {}
): Promise<boolean> {
  return await page.evaluate((opts) => {
    // @ts-expect-error - TitanManager is globally available
    if (typeof window.TitanManager?.spawnTitan === "function") {
      // @ts-expect-error - spawnTitan exists
      window.TitanManager.spawnTitan({
        gridX: opts.gridX ?? 10,
        gridY: opts.gridY ?? 10,
        species: opts.species ?? "doge",
        name: opts.name ?? "TestTitan",
      });
      return true;
    }
    return false;
  }, options);
}

/**
 * Perform a praise gesture in the God Hand mode.
 */
export async function performPraiseGesture(page: Page): Promise<void> {
  // Activate God Hand mode
  await page.keyboard.press("g");
  await page.waitForTimeout(200);

  // Check if Titan is on screen
  const titanSprite = page.locator('[data-testid="titan-sprite"]');
  const isTitanVisible = await titanSprite.isVisible().catch(() => false);

  if (isTitanVisible) {
    // Click on Titan and drag down (praise gesture)
    const box = await titanSprite.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 50);
      await page.mouse.up();
    }
  } else {
    // Fallback: use keyboard shortcut
    await page.keyboard.press("p");
  }
  await page.waitForTimeout(200);
}

/**
 * Perform a punish gesture in the God Hand mode.
 */
export async function performPunishGesture(page: Page): Promise<void> {
  // Activate God Hand mode
  await page.keyboard.press("g");
  await page.waitForTimeout(200);

  // Check if Titan is on screen
  const titanSprite = page.locator('[data-testid="titan-sprite"]');
  const isTitanVisible = await titanSprite.isVisible().catch(() => false);

  if (isTitanVisible) {
    // Click on Titan and drag up (punish gesture)
    const box = await titanSprite.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 50);
      await page.mouse.up();
    }
  } else {
    // Fallback: use keyboard shortcut
    await page.keyboard.press("u");
  }
  await page.waitForTimeout(200);
}

/**
 * Start the game from the main menu.
 * Handles E2E auto-start mode where game may already be running.
 */
export async function startGame(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Check if game is already running (E2E auto-start mode)
  const canvas = page.locator("canvas");
  if (await canvas.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Game already started, wait for it to stabilize
    await page.waitForTimeout(2000);
    return;
  }

  const startButton = page
    .locator("button")
    .filter({ hasText: /New Game|Continue/i })
    .first();

  try {
    await startButton.waitFor({ state: "visible", timeout: 10000 });
    await startButton.click({ force: true });
    await page
      .waitForSelector("canvas", { state: "visible", timeout: 30000 })
      .catch(() => {});
    await page.waitForTimeout(4000);
  } catch {
    // Try Load Example button if available
    const loadExampleButton = page
      .locator("button")
      .filter({ hasText: /Load Example/i })
      .first();
    if (await loadExampleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loadExampleButton.click({ force: true });
      await page
        .waitForSelector("canvas", { state: "visible", timeout: 30000 })
        .catch(() => {});
      await page.waitForTimeout(4000);
    } else {
      // Final fallback: game might already be running without canvas visible yet
      await page.waitForTimeout(5000);
    }
  }
}

/**
 * Navigate to Titan detail view in the UI.
 */
export async function openTitanDetailView(page: Page): Promise<boolean> {
  const statusPanel = page.locator('[data-testid="titan-status-panel"]');
  if (await statusPanel.isVisible().catch(() => false)) {
    // Click the status button to expand details
    const statusButton = page.locator('[data-testid="titan-status-button"]');
    if (await statusButton.isVisible().catch(() => false)) {
      await statusButton.click();
      await page.waitForTimeout(300);
      return true;
    }
  }
  return false;
}

/**
 * Save the game state.
 */
export async function saveGameState(page: Page): Promise<void> {
  await page.evaluate(() => {
    // @ts-expect-error - localStorage save logic
    const gameState = window.__GAME_STATE__;
    if (gameState) {
      localStorage.setItem("crypto-city-save", JSON.stringify(gameState));
    }
  });
}

/**
 * Reload the page and wait for game to initialize.
 */
export async function reloadAndWaitForGame(page: Page): Promise<void> {
  await page.reload();
  await startGame(page);
  await waitForTitanUpdate(page);
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Verify Titan alignment is within expected range.
 */
export function assertAlignmentInRange(
  alignment: number,
  expectedState: AlignmentState
): boolean {
  const state = getAlignmentState(alignment);
  return state === expectedState;
}

/**
 * Calculate expected alignment after applying a series of actions.
 */
export function calculateExpectedAlignment(
  startingAlignment: number,
  actions: { impact: number }[]
): number {
  let alignment = startingAlignment;
  for (const action of actions) {
    alignment += action.impact;
  }
  return Math.max(-1, Math.min(1, alignment));
}

/**
 * Get distance between two grid positions.
 */
export function getGridDistance(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): number {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}
