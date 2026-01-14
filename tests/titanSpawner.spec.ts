import { test, expect } from "@playwright/test";

/**
 * Tests for TitanSpawner
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * The TitanSpawner system is responsible for creating and initializing new Titans
 * with full defaults including species-specific base stats, names, and personalities.
 */

import type { TitanPet, TitanSpawnOptions, TitanSpecies, TitanSkill } from "@/games/isocity/types/titan";
import type { NPCPersonality } from "@/lib/npc/personality";

// Import TitanSpawner functions (will fail until implementation)
import {
  createTitan,
  generateTitanId,
  generateTitanName,
  getSpeciesBaseStats,
  generateSpeciesPersonality,
} from "@/lib/titan/TitanSpawner";

// ============================================================================
// SPECIES BASE STATS
// ============================================================================

/**
 * Test Suite: Species Base Stats
 * Each species should have different base aptitudes (0.5 to 2.0 multipliers)
 */
test.describe("getSpeciesBaseStats", () => {
  test("should return base stats for doge (balanced)", () => {
    const stats = getSpeciesBaseStats("doge");
    expect(stats.strength).toBe(1.0);
    expect(stats.speed).toBe(1.0);
    expect(stats.intelligence).toBe(1.0);
    expect(stats.charisma).toBe(1.2);
    expect(stats.endurance).toBe(1.0);
  });

  test("should return base stats for bull (high strength, low speed)", () => {
    const stats = getSpeciesBaseStats("bull");
    expect(stats.strength).toBe(1.5);
    expect(stats.speed).toBe(0.7);
    expect(stats.intelligence).toBe(0.8);
    expect(stats.charisma).toBe(0.9);
    expect(stats.endurance).toBe(1.3);
  });

  test("should return base stats for bear (high endurance)", () => {
    const stats = getSpeciesBaseStats("bear");
    expect(stats.strength).toBe(1.3);
    expect(stats.speed).toBe(0.8);
    expect(stats.intelligence).toBe(1.0);
    expect(stats.charisma).toBe(0.7);
    expect(stats.endurance).toBe(1.5);
  });

  test("should return base stats for ape (high intelligence)", () => {
    const stats = getSpeciesBaseStats("ape");
    expect(stats.strength).toBe(0.9);
    expect(stats.speed).toBe(1.0);
    expect(stats.intelligence).toBe(1.5);
    expect(stats.charisma).toBe(1.1);
    expect(stats.endurance).toBe(0.9);
  });

  test("should return base stats for whale (massive, slow, high endurance)", () => {
    const stats = getSpeciesBaseStats("whale");
    expect(stats.strength).toBe(1.8);
    expect(stats.speed).toBe(0.5);
    expect(stats.intelligence).toBe(1.2);
    expect(stats.charisma).toBe(0.8);
    expect(stats.endurance).toBe(2.0);
  });

  test("should return base stats for phoenix (fast, low endurance)", () => {
    const stats = getSpeciesBaseStats("phoenix");
    expect(stats.strength).toBe(0.8);
    expect(stats.speed).toBe(1.5);
    expect(stats.intelligence).toBe(1.1);
    expect(stats.charisma).toBe(1.3);
    expect(stats.endurance).toBe(0.7);
  });

  test("should return stats within valid range (0.5-2.0)", () => {
    const allSpecies: TitanSpecies[] = ["doge", "bull", "bear", "ape", "whale", "phoenix"];
    
    for (const species of allSpecies) {
      const stats = getSpeciesBaseStats(species);
      
      for (const value of Object.values(stats)) {
        expect(value).toBeGreaterThanOrEqual(0.5);
        expect(value).toBeLessThanOrEqual(2.0);
      }
    }
  });

  test("should return stats for all skill types", () => {
    const stats = getSpeciesBaseStats("doge");
    
    // Core aptitude stats
    expect(stats.strength).toBeDefined();
    expect(stats.speed).toBeDefined();
    expect(stats.intelligence).toBeDefined();
    expect(stats.charisma).toBeDefined();
    expect(stats.endurance).toBeDefined();
  });
});

// ============================================================================
// NAME GENERATION
// ============================================================================

/**
 * Test Suite: Name Generation
 * Crypto-themed names by species
 */
test.describe("generateTitanName", () => {
  test("should generate doge-themed names", () => {
    // Known doge name patterns
    const dogePatterns = ["Much_", "Very_", "Such_", "Moon_", "Wow_"];
    const names: string[] = [];
    
    for (let i = 0; i < 20; i++) {
      names.push(generateTitanName("doge"));
    }

    // At least some names should match doge patterns or contain doge-themed words
    const hasDogeTheme = names.some(name => 
      dogePatterns.some(pattern => name.includes(pattern)) ||
      name.includes("Doge") ||
      name.includes("Moon") ||
      name.includes("Wow") ||
      name.includes("Much") ||
      name.includes("Such")
    );
    expect(hasDogeTheme).toBe(true);
  });

  test("should generate bull-themed names", () => {
    const names: string[] = [];
    
    for (let i = 0; i < 20; i++) {
      names.push(generateTitanName("bull"));
    }

    // Bull names should have bullish themes
    const hasBullTheme = names.some(name =>
      name.includes("Bull") ||
      name.includes("Pump") ||
      name.includes("Green") ||
      name.includes("Chad") ||
      name.includes("Run") ||
      name.includes("Candle")
    );
    expect(hasBullTheme).toBe(true);
  });

  test("should generate bear-themed names", () => {
    const names: string[] = [];
    
    for (let i = 0; i < 20; i++) {
      names.push(generateTitanName("bear"));
    }

    // Bear names should have bearish themes
    const hasBearTheme = names.some(name =>
      name.includes("Bear") ||
      name.includes("Short") ||
      name.includes("Market") ||
      name.includes("Diamond") ||
      name.includes("Paws") ||
      name.includes("Seller")
    );
    expect(hasBearTheme).toBe(true);
  });

  test("should generate ape-themed names", () => {
    const names: string[] = [];
    
    for (let i = 0; i < 20; i++) {
      names.push(generateTitanName("ape"));
    }

    // Ape names should have ape themes
    const hasApeTheme = names.some(name =>
      name.includes("Ape") ||
      name.includes("Strong") ||
      name.includes("Together") ||
      name.includes("Hodler") ||
      name.includes("NFT") ||
      name.includes("Moon")
    );
    expect(hasApeTheme).toBe(true);
  });

  test("should generate whale-themed names", () => {
    const names: string[] = [];
    
    for (let i = 0; i < 20; i++) {
      names.push(generateTitanName("whale"));
    }

    // Whale names should have whale themes
    const hasWhaleTheme = names.some(name =>
      name.includes("Whale") ||
      name.includes("Market") ||
      name.includes("Mover") ||
      name.includes("Big") ||
      name.includes("Stack") ||
      name.includes("Alert")
    );
    expect(hasWhaleTheme).toBe(true);
  });

  test("should generate phoenix-themed names", () => {
    const names: string[] = [];
    
    for (let i = 0; i < 20; i++) {
      names.push(generateTitanName("phoenix"));
    }

    // Phoenix names should have rebirth themes
    const hasPhoenixTheme = names.some(name =>
      name.includes("Rise") ||
      name.includes("Ashes") ||
      name.includes("Rebirth") ||
      name.includes("Again") ||
      name.includes("Phoenix") ||
      name.includes("Fire")
    );
    expect(hasPhoenixTheme).toBe(true);
  });

  test("should generate unique names (with high probability)", () => {
    const names = new Set<string>();
    
    for (let i = 0; i < 50; i++) {
      names.add(generateTitanName("doge"));
    }

    // Should have at least 10 unique names out of 50 attempts
    expect(names.size).toBeGreaterThanOrEqual(10);
  });

  test("should generate non-empty names", () => {
    const allSpecies: TitanSpecies[] = ["doge", "bull", "bear", "ape", "whale", "phoenix"];
    
    for (const species of allSpecies) {
      const name = generateTitanName(species);
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Test Suite: ID Generation
 */
test.describe("generateTitanId", () => {
  test("should generate unique IDs", () => {
    const ids = new Set<string>();
    
    for (let i = 0; i < 100; i++) {
      ids.add(generateTitanId());
    }

    expect(ids.size).toBe(100);
  });

  test("should generate IDs with 'titan-' prefix", () => {
    const id = generateTitanId();
    expect(id.startsWith("titan-")).toBe(true);
  });

  test("should include timestamp in ID", () => {
    const id = generateTitanId();
    // ID format: titan-{timestamp}-{random}
    const parts = id.split("-");
    expect(parts.length).toBeGreaterThanOrEqual(2);
    // Timestamp should be a number
    const timestampPart = parts[1];
    expect(Number.isNaN(parseInt(timestampPart, 10))).toBe(false);
  });
});

// ============================================================================
// PERSONALITY GENERATION
// ============================================================================

/**
 * Test Suite: Species Personality Generation
 * Generate Big Five + Crypto traits per species archetype
 */
test.describe("generateSpeciesPersonality", () => {
  test("should generate doge personality (friendly, moderate)", () => {
    const personality = generateSpeciesPersonality("doge");
    
    // Doge: Friendly, moderate everything
    expect(personality.bigFive.agreeableness).toBeGreaterThanOrEqual(0.5);
    expect(personality.bigFive.extraversion).toBeGreaterThanOrEqual(0.4);
    // All traits should be in valid range
    expect(personality.bigFive.openness).toBeGreaterThanOrEqual(0);
    expect(personality.bigFive.openness).toBeLessThanOrEqual(1);
  });

  test("should generate bull personality (aggressive, high risk)", () => {
    const personality = generateSpeciesPersonality("bull");
    
    // Bull: Aggressive, high risk tolerance
    expect(personality.crypto.riskTolerance).toBeGreaterThanOrEqual(0.6);
    expect(personality.bigFive.agreeableness).toBeLessThanOrEqual(0.6);
  });

  test("should generate bear personality (cautious, low risk)", () => {
    const personality = generateSpeciesPersonality("bear");
    
    // Bear: Cautious, low risk tolerance
    expect(personality.crypto.riskTolerance).toBeLessThanOrEqual(0.4);
    expect(personality.bigFive.neuroticism).toBeGreaterThanOrEqual(0.4);
  });

  test("should generate ape personality (curious, high technical)", () => {
    const personality = generateSpeciesPersonality("ape");
    
    // Ape: Curious, high technical knowledge
    expect(personality.crypto.technicalKnowledge).toBeGreaterThanOrEqual(0.5);
    expect(personality.bigFive.openness).toBeGreaterThanOrEqual(0.5);
  });

  test("should generate whale personality (confident, high trust)", () => {
    const personality = generateSpeciesPersonality("whale");
    
    // Whale: Confident, high trust in institutions
    expect(personality.crypto.trustInInstitutions).toBeGreaterThanOrEqual(0.5);
    expect(personality.bigFive.conscientiousness).toBeGreaterThanOrEqual(0.5);
  });

  test("should generate phoenix personality (optimistic, high openness)", () => {
    const personality = generateSpeciesPersonality("phoenix");
    
    // Phoenix: Optimistic, high openness
    expect(personality.bigFive.openness).toBeGreaterThanOrEqual(0.6);
    expect(personality.bigFive.neuroticism).toBeLessThanOrEqual(0.5);
  });

  test("should generate valid personality structure", () => {
    const allSpecies: TitanSpecies[] = ["doge", "bull", "bear", "ape", "whale", "phoenix"];
    
    for (const species of allSpecies) {
      const personality = generateSpeciesPersonality(species);
      
      // Check Big Five traits exist and are in range
      expect(personality.bigFive).toBeDefined();
      expect(personality.bigFive.openness).toBeGreaterThanOrEqual(0);
      expect(personality.bigFive.openness).toBeLessThanOrEqual(1);
      expect(personality.bigFive.conscientiousness).toBeGreaterThanOrEqual(0);
      expect(personality.bigFive.conscientiousness).toBeLessThanOrEqual(1);
      expect(personality.bigFive.extraversion).toBeGreaterThanOrEqual(0);
      expect(personality.bigFive.extraversion).toBeLessThanOrEqual(1);
      expect(personality.bigFive.agreeableness).toBeGreaterThanOrEqual(0);
      expect(personality.bigFive.agreeableness).toBeLessThanOrEqual(1);
      expect(personality.bigFive.neuroticism).toBeGreaterThanOrEqual(0);
      expect(personality.bigFive.neuroticism).toBeLessThanOrEqual(1);
      
      // Check Crypto traits exist and are in range
      expect(personality.crypto).toBeDefined();
      expect(personality.crypto.riskTolerance).toBeGreaterThanOrEqual(0);
      expect(personality.crypto.riskTolerance).toBeLessThanOrEqual(1);
      expect(personality.crypto.fomo).toBeGreaterThanOrEqual(0);
      expect(personality.crypto.fomo).toBeLessThanOrEqual(1);
      expect(personality.crypto.trustInInstitutions).toBeGreaterThanOrEqual(0);
      expect(personality.crypto.trustInInstitutions).toBeLessThanOrEqual(1);
      expect(personality.crypto.technicalKnowledge).toBeGreaterThanOrEqual(0);
      expect(personality.crypto.technicalKnowledge).toBeLessThanOrEqual(1);
      expect(personality.crypto.degenLevel).toBeGreaterThanOrEqual(0);
      expect(personality.crypto.degenLevel).toBeLessThanOrEqual(1);
    }
  });
});

// ============================================================================
// CREATE TITAN (Main Function)
// ============================================================================

/**
 * Test Suite: createTitan Main Function
 * Create a full TitanPet with all defaults
 */
test.describe("createTitan", () => {
  test("should create a valid TitanPet with required fields", () => {
    const options: TitanSpawnOptions = {
      gridX: 10,
      gridY: 20,
    };

    const titan = createTitan(options);

    expect(titan).toBeDefined();
    expect(titan.id).toBeDefined();
    expect(titan.gridX).toBe(10);
    expect(titan.gridY).toBe(20);
  });

  test("should use default species 'doge' when not specified", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.species).toBe("doge");
  });

  test("should use provided species", () => {
    const titan = createTitan({ gridX: 5, gridY: 5, species: "whale" });
    expect(titan.species).toBe("whale");
  });

  test("should generate name when not provided", () => {
    const titan = createTitan({ gridX: 5, gridY: 5, species: "bull" });
    expect(titan.name).toBeDefined();
    expect(titan.name.length).toBeGreaterThan(0);
  });

  test("should use provided name", () => {
    const titan = createTitan({ gridX: 5, gridY: 5, name: "CustomName" });
    expect(titan.name).toBe("CustomName");
  });

  test("should default direction to 'south'", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.direction).toBe("south");
  });

  test("should use provided direction", () => {
    const titan = createTitan({ gridX: 5, gridY: 5, direction: "north" });
    expect(titan.direction).toBe("north");
  });

  test("should default alignment to 0 (neutral)", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.alignment).toBe(0);
  });

  test("should use provided initial alignment", () => {
    const titan = createTitan({ gridX: 5, gridY: 5, initialAlignment: -0.5 });
    expect(titan.alignment).toBe(-0.5);
  });

  test("should set correct appearance based on alignment", () => {
    const neutralTitan = createTitan({ gridX: 5, gridY: 5, initialAlignment: 0 });
    expect(neutralTitan.currentAppearance).toBe("neutral");

    const goodTitan = createTitan({ gridX: 5, gridY: 5, initialAlignment: -0.4 });
    expect(goodTitan.currentAppearance).toBe("good");

    const evilTitan = createTitan({ gridX: 5, gridY: 5, initialAlignment: 0.4 });
    expect(evilTitan.currentAppearance).toBe("evil");

    const angelicTitan = createTitan({ gridX: 5, gridY: 5, initialAlignment: -0.8 });
    expect(angelicTitan.currentAppearance).toBe("angelic");

    const demonicTitan = createTitan({ gridX: 5, gridY: 5, initialAlignment: 0.8 });
    expect(demonicTitan.currentAppearance).toBe("demonic");
  });

  test("should generate unique ID with titan prefix", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.id).toMatch(/^titan-/);
  });

  test("should generate unique IDs for multiple titans", () => {
    const ids = new Set<string>();
    
    for (let i = 0; i < 50; i++) {
      const titan = createTitan({ gridX: i, gridY: i });
      ids.add(titan.id);
    }

    expect(ids.size).toBe(50);
  });

  test("should initialize age to 0", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.age).toBe(0);
  });

  test("should initialize isInsideBuilding to false", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.isInsideBuilding).toBe(false);
  });

  test("should initialize currentBuildingId to null", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.currentBuildingId).toBeNull();
  });

  test("should initialize currentActivity", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.currentActivity).toBeDefined();
  });

  test("should initialize relationships as empty record", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.relationships).toBeDefined();
    expect(Object.keys(titan.relationships).length).toBe(0);
  });

  test("should initialize actionHistory as empty array", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.actionHistory).toBeDefined();
    expect(titan.actionHistory.length).toBe(0);
  });
});

// ============================================================================
// NEEDS INITIALIZATION
// ============================================================================

/**
 * Test Suite: Needs Initialization
 */
test.describe("createTitan - Needs Initialization", () => {
  test("should initialize all needs with createDefaultTitanNeeds()", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });

    expect(titan.needs).toBeDefined();
    expect(titan.needs.hunger).toBeDefined();
    expect(titan.needs.energy).toBeDefined();
    expect(titan.needs.social).toBeDefined();
    expect(titan.needs.fun).toBeDefined();
    expect(titan.needs.wealth).toBeDefined();
    expect(titan.needs.purpose).toBeDefined();
    expect(titan.needs.attention).toBeDefined();
    expect(titan.needs.growth).toBeDefined();
  });

  test("should have valid need values (60-100 range)", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });

    // All needs should be in valid starting range
    const needs = titan.needs;
    Object.values(needs).forEach(need => {
      expect(need.current).toBeGreaterThanOrEqual(60);
      expect(need.current).toBeLessThanOrEqual(100);
    });
  });
});

// ============================================================================
// SKILLS INITIALIZATION
// ============================================================================

/**
 * Test Suite: Skills Initialization with Species Aptitudes
 */
test.describe("createTitan - Skills Initialization", () => {
  test("should initialize all skills", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });

    expect(titan.skills).toBeDefined();
    expect(titan.skills.strength).toBeDefined();
    expect(titan.skills.speed).toBeDefined();
    expect(titan.skills.endurance).toBeDefined();
    expect(titan.skills.intelligence).toBeDefined();
    expect(titan.skills.awareness).toBeDefined();
    expect(titan.skills.memory).toBeDefined();
    expect(titan.skills.charisma).toBeDefined();
    expect(titan.skills.intimidation).toBeDefined();
    expect(titan.skills.empathy).toBeDefined();
    expect(titan.skills.miracles).toBeDefined();
    expect(titan.skills.stealth).toBeDefined();
    expect(titan.skills.gathering).toBeDefined();
  });

  test("should initialize skills with level 1", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });

    Object.values(titan.skills).forEach(skill => {
      expect(skill.level).toBe(1);
    });
  });

  test("should initialize skills with 0 XP", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });

    Object.values(titan.skills).forEach(skill => {
      expect(skill.experience).toBe(0);
    });
  });

  test("should apply species aptitudes to skills", () => {
    const dogeTitan = createTitan({ gridX: 5, gridY: 5, species: "doge" });
    const whaleTitan = createTitan({ gridX: 5, gridY: 5, species: "whale" });

    // Doge has balanced stats
    expect(dogeTitan.skills.strength.aptitude).toBe(1.0);
    expect(dogeTitan.skills.charisma.aptitude).toBe(1.2);

    // Whale has high strength and endurance
    expect(whaleTitan.skills.strength.aptitude).toBe(1.8);
    expect(whaleTitan.skills.endurance.aptitude).toBe(2.0);
    expect(whaleTitan.skills.speed.aptitude).toBe(0.5);
  });

  test("should apply different aptitudes for each species", () => {
    const allSpecies: TitanSpecies[] = ["doge", "bull", "bear", "ape", "whale", "phoenix"];

    for (const species of allSpecies) {
      const titan = createTitan({ gridX: 5, gridY: 5, species });
      const baseStats = getSpeciesBaseStats(species);

      expect(titan.skills.strength.aptitude).toBe(baseStats.strength);
      expect(titan.skills.speed.aptitude).toBe(baseStats.speed);
      expect(titan.skills.intelligence.aptitude).toBe(baseStats.intelligence);
      expect(titan.skills.charisma.aptitude).toBe(baseStats.charisma);
      expect(titan.skills.endurance.aptitude).toBe(baseStats.endurance);
    }
  });
});

// ============================================================================
// MOOD INITIALIZATION
// ============================================================================

/**
 * Test Suite: Mood Initialization
 */
test.describe("createTitan - Mood Initialization", () => {
  test("should initialize mood with neutral state", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });

    expect(titan.mood).toBeDefined();
    expect(titan.mood.currentMood).toBe("neutral");
  });

  test("should initialize mood intensity", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.mood.moodIntensity).toBeDefined();
    expect(titan.mood.moodIntensity).toBeGreaterThanOrEqual(0);
    expect(titan.mood.moodIntensity).toBeLessThanOrEqual(1);
  });

  test("should initialize empty thoughts array", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.mood.thoughts).toBeDefined();
    expect(titan.mood.thoughts.length).toBe(0);
  });

  test("should initialize empty beliefs array", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.mood.beliefs).toBeDefined();
    expect(titan.mood.beliefs.length).toBe(0);
  });

  test("should initialize empty desires array", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.mood.desires).toBeDefined();
    expect(titan.mood.desires.length).toBe(0);
  });

  test("should initialize beliefsAboutPlayer", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.mood.beliefsAboutPlayer).toBeDefined();
    expect(titan.mood.beliefsAboutPlayer.trust).toBeDefined();
    expect(titan.mood.beliefsAboutPlayer.fear).toBeDefined();
    expect(titan.mood.beliefsAboutPlayer.affection).toBeDefined();
  });
});

// ============================================================================
// BDI INITIALIZATION
// ============================================================================

/**
 * Test Suite: BDI (Belief-Desire-Intention) Initialization
 */
test.describe("createTitan - BDI Initialization", () => {
  test("should initialize BDI structure", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });

    expect(titan.bdi).toBeDefined();
    expect(titan.bdi.beliefs).toBeDefined();
    expect(titan.bdi.desires).toBeDefined();
    expect(titan.bdi.intentions).toBeDefined();
  });

  test("should initialize empty beliefs Maps", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });

    expect(titan.bdi.beliefs.worldKnowledge).toBeInstanceOf(Map);
    expect(titan.bdi.beliefs.actionBeliefs).toBeInstanceOf(Map);
    expect(titan.bdi.beliefs.npcOpinions).toBeInstanceOf(Map);
    expect(titan.bdi.beliefs.worldKnowledge.size).toBe(0);
    expect(titan.bdi.beliefs.actionBeliefs.size).toBe(0);
    expect(titan.bdi.beliefs.npcOpinions.size).toBe(0);
  });

  test("should initialize playerRelationship in beliefs", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });

    expect(titan.bdi.beliefs.playerRelationship).toBeDefined();
    expect(titan.bdi.beliefs.playerRelationship.trust).toBeDefined();
    expect(titan.bdi.beliefs.playerRelationship.fear).toBeDefined();
    expect(titan.bdi.beliefs.playerRelationship.affection).toBeDefined();
  });

  test("should initialize empty desires array", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.bdi.desires).toBeDefined();
    expect(titan.bdi.desires.length).toBe(0);
  });

  test("should initialize intentions to null", () => {
    const titan = createTitan({ gridX: 5, gridY: 5 });
    expect(titan.bdi.intentions).toBeNull();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

/**
 * Test Suite: Integration
 */
test.describe("createTitan - Integration", () => {
  test("should create complete valid TitanPet for all species", () => {
    const allSpecies: TitanSpecies[] = ["doge", "bull", "bear", "ape", "whale", "phoenix"];

    for (const species of allSpecies) {
      const titan = createTitan({ gridX: 5, gridY: 5, species });

      // All required fields should be populated
      expect(titan.id).toBeDefined();
      expect(titan.species).toBe(species);
      expect(titan.name).toBeDefined();
      expect(titan.age).toBe(0);
      expect(titan.alignment).toBe(0);
      expect(titan.currentAppearance).toBe("neutral");
      expect(titan.gridX).toBe(5);
      expect(titan.gridY).toBe(5);
      expect(titan.direction).toBe("south");
      expect(titan.isInsideBuilding).toBe(false);
      expect(titan.currentBuildingId).toBeNull();
      expect(titan.needs).toBeDefined();
      expect(titan.mood).toBeDefined();
      expect(titan.bdi).toBeDefined();
      expect(titan.skills).toBeDefined();
      expect(titan.actionHistory).toBeDefined();
      expect(titan.relationships).toBeDefined();
    }
  });

  test("should create different titans with different characteristics", () => {
    const dogeTitan = createTitan({ gridX: 5, gridY: 5, species: "doge" });
    const whaleTitan = createTitan({ gridX: 5, gridY: 5, species: "whale" });

    // Different IDs
    expect(dogeTitan.id).not.toBe(whaleTitan.id);

    // Different aptitudes
    expect(dogeTitan.skills.strength.aptitude).not.toBe(whaleTitan.skills.strength.aptitude);
    expect(dogeTitan.skills.speed.aptitude).not.toBe(whaleTitan.skills.speed.aptitude);
  });
});
