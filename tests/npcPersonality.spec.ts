import { test, expect } from "@playwright/test";

/**
 * NPC Personality System Tests (#104)
 * 
 * TDD Phase 1: Tests for the NPC personality system including:
 * - Big Five (OCEAN) personality traits
 * - Crypto-specific traits
 * - Personality archetypes
 * - PersonalityManager class
 */

// Import types and classes directly for unit testing
import type { BigFiveTraits, CryptoTraits, NPCPersonality, PersonalityArchetype } from "@/lib/npc/personality";
import {
  ARCHETYPE_DESCRIPTIONS,
  ARCHETYPE_PROFILES,
  ALL_ARCHETYPES,
  TRAIT_DESCRIPTIONS,
  createBigFiveTraits,
  createCryptoTraits,
  createDefaultPersonality,
} from "@/lib/npc/personality";
import { PersonalityManager } from "@/lib/npc/PersonalityManager";

/**
 * Test Suite: Personality Types
 */
test.describe("Personality Types", () => {
  test("should define BigFiveTraits interface with all OCEAN traits", async () => {
    const manager = new PersonalityManager();
    const personality = manager.generateRandomPersonality();
    const bigFive = personality.bigFive;

    expect(typeof bigFive.openness).toBe('number');
    expect(typeof bigFive.conscientiousness).toBe('number');
    expect(typeof bigFive.extraversion).toBe('number');
    expect(typeof bigFive.agreeableness).toBe('number');
    expect(typeof bigFive.neuroticism).toBe('number');
  });

  test("should define CryptoTraits interface with all crypto-specific traits", async () => {
    const manager = new PersonalityManager();
    const personality = manager.generateRandomPersonality();
    const crypto = personality.crypto;

    expect(typeof crypto.riskTolerance).toBe('number');
    expect(typeof crypto.fomo).toBe('number');
    expect(typeof crypto.trustInInstitutions).toBe('number');
    expect(typeof crypto.technicalKnowledge).toBe('number');
    expect(typeof crypto.degenLevel).toBe('number');
  });

  test("should generate traits in valid 0-1 range", async () => {
    const manager = new PersonalityManager();
    const isInRange = (val: number) => val >= 0 && val <= 1;

    // Generate multiple personalities to test range
    for (let i = 0; i < 100; i++) {
      const personality = manager.generateRandomPersonality();
      const bf = personality.bigFive;
      const cr = personality.crypto;

      expect(isInRange(bf.openness)).toBe(true);
      expect(isInRange(bf.conscientiousness)).toBe(true);
      expect(isInRange(bf.extraversion)).toBe(true);
      expect(isInRange(bf.agreeableness)).toBe(true);
      expect(isInRange(bf.neuroticism)).toBe(true);
      expect(isInRange(cr.riskTolerance)).toBe(true);
      expect(isInRange(cr.fomo)).toBe(true);
      expect(isInRange(cr.trustInInstitutions)).toBe(true);
      expect(isInRange(cr.technicalKnowledge)).toBe(true);
      expect(isInRange(cr.degenLevel)).toBe(true);
    }
  });

  test("createBigFiveTraits should create traits with defaults", async () => {
    const traits = createBigFiveTraits();
    
    expect(traits.openness).toBe(0.5);
    expect(traits.conscientiousness).toBe(0.5);
    expect(traits.extraversion).toBe(0.5);
    expect(traits.agreeableness).toBe(0.5);
    expect(traits.neuroticism).toBe(0.5);
  });

  test("createBigFiveTraits should allow overrides", async () => {
    const traits = createBigFiveTraits({ openness: 0.9, neuroticism: 0.1 });
    
    expect(traits.openness).toBe(0.9);
    expect(traits.conscientiousness).toBe(0.5);
    expect(traits.neuroticism).toBe(0.1);
  });

  test("createCryptoTraits should create traits with defaults", async () => {
    const traits = createCryptoTraits();
    
    expect(traits.riskTolerance).toBe(0.5);
    expect(traits.fomo).toBe(0.5);
    expect(traits.trustInInstitutions).toBe(0.5);
    expect(traits.technicalKnowledge).toBe(0.5);
    expect(traits.degenLevel).toBe(0.5);
  });

  test("createDefaultPersonality should create full personality", async () => {
    const personality = createDefaultPersonality();
    
    expect(personality.bigFive).toBeDefined();
    expect(personality.crypto).toBeDefined();
    expect(personality.bigFive.openness).toBe(0.5);
    expect(personality.crypto.riskTolerance).toBe(0.5);
  });
});

/**
 * Test Suite: Personality Archetypes
 */
test.describe("Personality Archetypes", () => {
  test("should define all 8 archetypes", async () => {
    expect(ALL_ARCHETYPES.length).toBe(8);
    expect(ALL_ARCHETYPES).toContain('bitcoin_maxi');
    expect(ALL_ARCHETYPES).toContain('eth_builder');
    expect(ALL_ARCHETYPES).toContain('degen_trader');
    expect(ALL_ARCHETYPES).toContain('privacy_maxi');
    expect(ALL_ARCHETYPES).toContain('normie_investor');
    expect(ALL_ARCHETYPES).toContain('nft_flipper');
    expect(ALL_ARCHETYPES).toContain('staking_grandma');
    expect(ALL_ARCHETYPES).toContain('protocol_politician');
  });

  test("should generate personality from all archetypes", async () => {
    const manager = new PersonalityManager();
    
    for (const archetype of ALL_ARCHETYPES) {
      const personality = manager.generateFromArchetype(archetype);
      expect(personality).toBeDefined();
      expect(personality.bigFive).toBeDefined();
      expect(personality.crypto).toBeDefined();
    }
  });

  test("should have archetype descriptions for all archetypes", async () => {
    for (const archetype of ALL_ARCHETYPES) {
      const description = ARCHETYPE_DESCRIPTIONS[archetype];
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    }
  });

  test("should have archetype profiles for all archetypes", async () => {
    for (const archetype of ALL_ARCHETYPES) {
      const profile = ARCHETYPE_PROFILES[archetype];
      expect(profile).toBeDefined();
      expect(profile.bigFive).toBeDefined();
      expect(profile.crypto).toBeDefined();
    }
  });

  test("bitcoin_maxi should have low openness and low trust", async () => {
    const manager = new PersonalityManager();
    const personality = manager.generateFromArchetype('bitcoin_maxi');

    expect(personality.bigFive.openness).toBeLessThan(0.4);
    expect(personality.bigFive.conscientiousness).toBeGreaterThan(0.6);
    expect(personality.crypto.trustInInstitutions).toBeLessThan(0.4);
  });

  test("degen_trader should have high risk and high fomo", async () => {
    const manager = new PersonalityManager();
    const personality = manager.generateFromArchetype('degen_trader');

    expect(personality.crypto.riskTolerance).toBeGreaterThan(0.7);
    expect(personality.crypto.fomo).toBeGreaterThan(0.7);
    expect(personality.bigFive.conscientiousness).toBeLessThan(0.4);
    expect(personality.crypto.degenLevel).toBeGreaterThan(0.7);
  });

  test("eth_builder should have high openness and high technical", async () => {
    const manager = new PersonalityManager();
    const personality = manager.generateFromArchetype('eth_builder');

    expect(personality.bigFive.openness).toBeGreaterThan(0.6);
    expect(personality.crypto.technicalKnowledge).toBeGreaterThan(0.7);
    expect(personality.crypto.riskTolerance).toBeGreaterThanOrEqual(0.3);
    expect(personality.crypto.riskTolerance).toBeLessThanOrEqual(0.7);
  });

  test("normie_investor should have low technical and high trust", async () => {
    const manager = new PersonalityManager();
    const personality = manager.generateFromArchetype('normie_investor');

    expect(personality.crypto.technicalKnowledge).toBeLessThan(0.4);
    expect(personality.crypto.riskTolerance).toBeLessThan(0.4);
    expect(personality.crypto.trustInInstitutions).toBeGreaterThan(0.6);
  });

  test("privacy_maxi should have very low trust and high technical", async () => {
    const manager = new PersonalityManager();
    const personality = manager.generateFromArchetype('privacy_maxi');

    expect(personality.crypto.trustInInstitutions).toBeLessThan(0.2);
    expect(personality.crypto.technicalKnowledge).toBeGreaterThan(0.7);
  });

  test("staking_grandma should have low risk and high conscientiousness", async () => {
    const manager = new PersonalityManager();
    const personality = manager.generateFromArchetype('staking_grandma');

    expect(personality.crypto.riskTolerance).toBeLessThan(0.3);
    expect(personality.crypto.degenLevel).toBeLessThan(0.2);
    expect(personality.bigFive.conscientiousness).toBeGreaterThan(0.7);
  });

  test("nft_flipper should have high extraversion and fomo", async () => {
    const manager = new PersonalityManager();
    const personality = manager.generateFromArchetype('nft_flipper');

    expect(personality.bigFive.extraversion).toBeGreaterThan(0.7);
    expect(personality.crypto.fomo).toBeGreaterThan(0.7);
  });

  test("protocol_politician should have high extraversion and agreeableness", async () => {
    const manager = new PersonalityManager();
    const personality = manager.generateFromArchetype('protocol_politician');

    expect(personality.bigFive.extraversion).toBeGreaterThan(0.7);
    expect(personality.bigFive.agreeableness).toBeGreaterThan(0.6);
  });

  test("archetype variance should keep traits close to base profile", async () => {
    const manager = new PersonalityManager();
    const baseProfile = ARCHETYPE_PROFILES['bitcoin_maxi'];
    
    // Generate multiple personalities and check variance
    for (let i = 0; i < 50; i++) {
      const personality = manager.generateFromArchetype('bitcoin_maxi');
      
      // Variance should be within ±0.15 of base (allowing for randomness)
      expect(Math.abs(personality.bigFive.openness - baseProfile.bigFive.openness)).toBeLessThan(0.15);
      expect(Math.abs(personality.crypto.riskTolerance - baseProfile.crypto.riskTolerance)).toBeLessThan(0.15);
    }
  });
});

/**
 * Test Suite: PersonalityManager
 */
test.describe("PersonalityManager", () => {
  test("should get dialogue tone based on personality", async () => {
    const manager = new PersonalityManager();

    // Chaotic tone: high degen, low conscientiousness
    const chaoticPersonality = createDefaultPersonality({
      bigFive: { conscientiousness: 0.2 },
      crypto: { degenLevel: 0.9 },
    });
    expect(manager.getDialogueTone(chaoticPersonality)).toBe('chaotic');

    // Suspicious tone: low trust, high neuroticism
    const suspiciousPersonality = createDefaultPersonality({
      bigFive: { neuroticism: 0.8 },
      crypto: { trustInInstitutions: 0.1 },
    });
    expect(manager.getDialogueTone(suspiciousPersonality)).toBe('suspicious');

    // Friendly tone: high extraversion, high agreeableness
    const friendlyPersonality = createDefaultPersonality({
      bigFive: { extraversion: 0.8, agreeableness: 0.8 },
    });
    expect(manager.getDialogueTone(friendlyPersonality)).toBe('friendly');
  });

  test("should get social preference based on extraversion", async () => {
    const manager = new PersonalityManager();

    // High extraversion = seek social interaction
    const extravert = createDefaultPersonality({
      bigFive: { extraversion: 0.9, agreeableness: 0.7 },
    });
    expect(manager.getSocialPreference(extravert)).toBe('seek');

    // Low extraversion = avoid social interaction
    const introvert = createDefaultPersonality({
      bigFive: { extraversion: 0.1, agreeableness: 0.3 },
    });
    expect(manager.getSocialPreference(introvert)).toBe('avoid');

    // Middle extraversion = neutral
    const neutral = createDefaultPersonality({
      bigFive: { extraversion: 0.5, agreeableness: 0.5 },
    });
    expect(manager.getSocialPreference(neutral)).toBe('neutral');
  });

  test("should get risk behavior based on crypto traits", async () => {
    const manager = new PersonalityManager();

    // Conservative: low risk, low degen, low fomo
    const conservative = createDefaultPersonality({
      crypto: { riskTolerance: 0.1, degenLevel: 0.1, fomo: 0.1 },
    });
    expect(manager.getRiskBehavior(conservative)).toBe('conservative');

    // YOLO: high risk, high degen, high fomo
    const yolo = createDefaultPersonality({
      crypto: { riskTolerance: 0.95, degenLevel: 0.95, fomo: 0.9 },
    });
    expect(manager.getRiskBehavior(yolo)).toBe('yolo');

    // Aggressive: above moderate but not quite yolo
    const aggressive = createDefaultPersonality({
      crypto: { riskTolerance: 0.7, degenLevel: 0.6, fomo: 0.5 },
    });
    expect(manager.getRiskBehavior(aggressive)).toBe('aggressive');

    // Moderate: middle range
    const moderate = createDefaultPersonality({
      crypto: { riskTolerance: 0.4, degenLevel: 0.4, fomo: 0.3 },
    });
    expect(manager.getRiskBehavior(moderate)).toBe('moderate');
  });

  test("should modify action scores based on personality", async () => {
    const manager = new PersonalityManager();

    // Social butterfly vs introvert on social action
    const socialButterfly = createDefaultPersonality({
      bigFive: { extraversion: 0.9, agreeableness: 0.8 },
    });
    const introvert = createDefaultPersonality({
      bigFive: { extraversion: 0.1, agreeableness: 0.3 },
    });

    const socialAction = { id: 'socializing', needEffects: { social: 30 } };
    
    const butterflyMod = manager.getActionModifier(socialButterfly, socialAction);
    const introvertMod = manager.getActionModifier(introvert, socialAction);

    expect(typeof butterflyMod).toBe('number');
    expect(typeof introvertMod).toBe('number');
    expect(butterflyMod).toBeGreaterThan(introvertMod);

    // High risk vs conservative on trading action
    const highRisk = createDefaultPersonality({
      crypto: { riskTolerance: 0.9, degenLevel: 0.9 },
    });
    const lowRisk = createDefaultPersonality({
      crypto: { riskTolerance: 0.1, degenLevel: 0.1 },
    });

    const tradingAction = { id: 'trading', needEffects: { wealth: 20 } };
    
    expect(manager.getActionModifier(highRisk, tradingAction)).toBeGreaterThan(
      manager.getActionModifier(lowRisk, tradingAction)
    );
  });

  test("should describe personality in natural language", async () => {
    const manager = new PersonalityManager();
    const personality = manager.generateFromArchetype('bitcoin_maxi');
    const description = manager.describePersonality(personality);

    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(10);
    expect(description).toContain('crypto citizen');
  });

  test("should get archetype description", async () => {
    const manager = new PersonalityManager();
    
    for (const archetype of ALL_ARCHETYPES) {
      const description = manager.getArchetypeDescription(archetype);
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    }
  });

  test("should find closest archetype for a personality", async () => {
    const manager = new PersonalityManager();

    // Generate from archetype and find should return same or similar
    const bitcoinMaxi = ARCHETYPE_PROFILES['bitcoin_maxi'];
    const closest = manager.findClosestArchetype(bitcoinMaxi);
    expect(closest).toBe('bitcoin_maxi');

    // Random personality should find some archetype
    const random = manager.generateRandomPersonality();
    const closestToRandom = manager.findClosestArchetype(random);
    expect(ALL_ARCHETYPES).toContain(closestToRandom);
  });

  test("generateWithRandomArchetype should return both personality and archetype", async () => {
    const manager = new PersonalityManager();
    const result = manager.generateWithRandomArchetype();

    expect(result.personality).toBeDefined();
    expect(result.archetype).toBeDefined();
    expect(ALL_ARCHETYPES).toContain(result.archetype);
  });

  test("action modifier should be bounded between 0.5 and 1.5", async () => {
    const manager = new PersonalityManager();

    // Test extreme personalities
    const extremePersonality = createDefaultPersonality({
      bigFive: {
        openness: 1.0,
        conscientiousness: 1.0,
        extraversion: 1.0,
        agreeableness: 1.0,
        neuroticism: 1.0,
      },
      crypto: {
        riskTolerance: 1.0,
        fomo: 1.0,
        trustInInstitutions: 1.0,
        technicalKnowledge: 1.0,
        degenLevel: 1.0,
      },
    });

    const actions = [
      { id: 'socializing', needEffects: { social: 30 } },
      { id: 'trading', needEffects: { wealth: 20 } },
      { id: 'working', needEffects: { purpose: 25 } },
      { id: 'defi_experiment', needEffects: { fun: 15 } },
    ];

    for (const action of actions) {
      const mod = manager.getActionModifier(extremePersonality, action);
      expect(mod).toBeGreaterThanOrEqual(0.5);
      expect(mod).toBeLessThanOrEqual(1.5);
    }
  });
});

/**
 * Test Suite: Trait Descriptions
 */
test.describe("Trait Descriptions", () => {
  test("should define trait descriptions for all Big Five traits", async () => {
    const bigFiveTraits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    
    for (const trait of bigFiveTraits) {
      expect(TRAIT_DESCRIPTIONS[trait]).toBeDefined();
      expect(TRAIT_DESCRIPTIONS[trait].high).toBeDefined();
      expect(TRAIT_DESCRIPTIONS[trait].low).toBeDefined();
    }
  });

  test("should define trait descriptions for all crypto traits", async () => {
    const cryptoTraits = ['riskTolerance', 'fomo', 'trustInInstitutions', 'technicalKnowledge', 'degenLevel'];
    
    for (const trait of cryptoTraits) {
      expect(TRAIT_DESCRIPTIONS[trait]).toBeDefined();
      expect(TRAIT_DESCRIPTIONS[trait].high).toBeDefined();
      expect(TRAIT_DESCRIPTIONS[trait].low).toBeDefined();
    }
  });
});
