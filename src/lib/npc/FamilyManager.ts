/**
 * FamilyManager for Crypto City NPCs
 *
 * Manages NPC families, partnerships, children, inheritance, and dynasties.
 * Implements the generational system for NPCs.
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { NPCPersonality } from './personality';
import { createDefaultPersonality } from './personality';
import type { NPCWallet } from './economy';
import { createDefaultWallet, createDefaultFinances } from './economy';
import { createDefaultNeeds } from './needs';
import { createDefaultMemory } from './memory';
import { createInitialMovement } from './movement';
import { generateNPCName, generateWalletAddress } from './nameGenerator';
import type {
  Family,
  FamilyRelation,
  Inheritance,
  Dynasty,
  TraitInheritance,
  LifeEvent,
  LifeEventRecord,
  FamilyTree,
  DeathCause,
} from './generations';
import {
  createDefaultFamily,
  createLifeEvent,
  DYNASTY_WEALTH_THRESHOLD,
  DYNASTY_GENERATION_REQUIREMENT,
  MIN_PARTNERSHIP_AGE,
  CHILD_BEARING_AGE,
  NATURAL_DEATH_AGE,
  TRAIT_MUTATION_RANGE,
} from './generations';

/**
 * Death processing result
 */
export interface DeathResult {
  success: boolean;
  cause: DeathCause;
  inheritance?: Inheritance;
}

/**
 * FamilyManager handles all family-related operations for NPCs
 */
export class FamilyManager {
  /** Registered NPCs by ID */
  private npcs: Map<string, CryptoNPC> = new Map();

  /** Families by ID */
  private families: Map<string, Family> = new Map();

  /** Life events by NPC ID */
  private lifeEvents: Map<string, LifeEventRecord[]> = new Map();

  /** Map of NPC ID to their family ID (as founder or partner) */
  private npcToFamily: Map<string, string> = new Map();

  /** Map of NPC ID to their parent family ID (family they were born into) */
  private npcToParentFamily: Map<string, string> = new Map();

  /** Deceased NPCs */
  private deceased: Set<string> = new Set();

  /** Dynasties by ID */
  private dynasties: Map<string, Dynasty> = new Map();

  /** Inheritances by deceased ID */
  private inheritances: Map<string, Inheritance> = new Map();

  /**
   * Register an NPC with the family manager
   */
  registerNPC(npc: CryptoNPC): void {
    if (this.npcs.has(npc.id)) {
      throw new Error(`NPC ${npc.id} is already registered`);
    }
    this.npcs.set(npc.id, npc);
    this.lifeEvents.set(npc.id, []);
  }

  /**
   * Get a registered NPC by ID
   */
  getNPC(id: string): CryptoNPC | undefined {
    return this.npcs.get(id);
  }

  /**
   * Form a partnership between two NPCs, creating a new family
   */
  formPartnership(npc1Id: string, npc2Id: string): Family {
    const npc1 = this.npcs.get(npc1Id);
    const npc2 = this.npcs.get(npc2Id);

    if (!npc1 || !npc2) {
      throw new Error('One or both NPCs not found');
    }

    // Validation: Cannot partner with self
    if (npc1Id === npc2Id) {
      throw new Error('Cannot form partnership with self');
    }

    // Validation: Both must be of age
    if (npc1.age < MIN_PARTNERSHIP_AGE || npc2.age < MIN_PARTNERSHIP_AGE) {
      throw new Error(`Both NPCs must be at least ${MIN_PARTNERSHIP_AGE} years old`);
    }

    // Validation: Neither can already have an active partner
    const existingFamily1 = this.getActiveFamily(npc1Id);
    const existingFamily2 = this.getActiveFamily(npc2Id);

    if (existingFamily1 && existingFamily1.partnerId && !this.deceased.has(existingFamily1.partnerId)) {
      throw new Error(`NPC ${npc1Id} already has an active partner`);
    }
    if (existingFamily2 && existingFamily2.partnerId && !this.deceased.has(existingFamily2.partnerId)) {
      throw new Error(`NPC ${npc2Id} already has an active partner`);
    }

    // Create new family
    const family = createDefaultFamily(npc1Id);
    family.partnerId = npc2Id;

    // Determine generation count based on parents
    const parent1Gen = this.getParentGeneration(npc1Id);
    const parent2Gen = this.getParentGeneration(npc2Id);
    family.generationCount = Math.max(parent1Gen, parent2Gen);

    this.families.set(family.id, family);
    this.npcToFamily.set(npc1Id, family.id);
    this.npcToFamily.set(npc2Id, family.id);

    // Record life events
    const event1 = createLifeEvent('partnership', npc1Id, [npc2Id], { familyId: family.id });
    const event2 = createLifeEvent('partnership', npc2Id, [npc1Id], { familyId: family.id });
    this.addLifeEvent(npc1Id, event1);
    this.addLifeEvent(npc2Id, event2);

    return family;
  }

  /**
   * Dissolve a partnership (separation)
   */
  dissolvePartnership(familyId: string): void {
    const family = this.families.get(familyId);
    if (!family) {
      throw new Error(`Family ${familyId} not found`);
    }

    if (!family.partnerId) {
      throw new Error('Family has no partner to dissolve');
    }

    // Record separation events
    const event1 = createLifeEvent('separation', family.founderId, [family.partnerId], {
      familyId,
    });
    const event2 = createLifeEvent('separation', family.partnerId, [family.founderId], {
      familyId,
    });
    this.addLifeEvent(family.founderId, event1);
    this.addLifeEvent(family.partnerId, event2);

    // Remove partner from family (keeps children)
    family.partnerId = undefined;
    family.dissolved = true;

    // Allow both NPCs to form new partnerships
    this.npcToFamily.delete(family.founderId);
    if (family.partnerId) {
      this.npcToFamily.delete(family.partnerId);
    }
  }

  /**
   * Create a child NPC for a family
   */
  createChild(familyId: string, name?: string): CryptoNPC {
    const family = this.families.get(familyId);
    if (!family) {
      throw new Error(`Family ${familyId} not found`);
    }

    const founder = this.npcs.get(family.founderId);
    const partner = family.partnerId ? this.npcs.get(family.partnerId) : undefined;

    if (!founder) {
      throw new Error('Family founder not found');
    }

    // Validation: At least one parent must be of child-bearing age
    const founderCanBear =
      founder.age >= CHILD_BEARING_AGE.min && founder.age <= CHILD_BEARING_AGE.max;
    const partnerCanBear =
      partner && partner.age >= CHILD_BEARING_AGE.min && partner.age <= CHILD_BEARING_AGE.max;

    if (!founderCanBear && !partnerCanBear) {
      throw new Error(
        `At least one parent must be between ${CHILD_BEARING_AGE.min} and ${CHILD_BEARING_AGE.max} years old`
      );
    }

    // Calculate inherited traits
    const parent2 = partner || founder;
    const traitInheritance = this.inheritTraits(founder, parent2);

    // Build child personality from inherited traits
    const childPersonality = this.buildPersonalityFromTraits(traitInheritance);

    // Create child NPC
    const childId = `npc-child-${familyId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const child: CryptoNPC = {
      id: childId,
      name: name || generateNPCName(),
      walletAddress: generateWalletAddress(),
      age: 0,
      occupation: 'unemployed',
      residence: founder.residence,
      workplace: null,
      spriteType: Math.random() > 0.5 ? 'apple' : 'banana',
      direction: 'south',
      gridX: founder.gridX,
      gridY: founder.gridY,
      isInsideBuilding: founder.isInsideBuilding,
      currentBuildingId: founder.currentBuildingId,
      currentActivity: null,
      needs: createDefaultNeeds(),
      memory: createDefaultMemory(),
      movement: createInitialMovement(),
      personality: childPersonality,
      relationships: {},
      wallet: createDefaultWallet(0),
      finances: createDefaultFinances('unemployed'),
    };

    // Register the child
    this.npcs.set(childId, child);
    this.lifeEvents.set(childId, []);

    // Add child to family
    family.childrenIds.push(childId);
    this.npcToParentFamily.set(childId, familyId);

    // Record birth event
    const relatedIds = partner ? [family.founderId, partner.id] : [family.founderId];
    const birthEvent = createLifeEvent('birth', childId, relatedIds, { familyId });
    this.addLifeEvent(childId, birthEvent);

    return child;
  }

  /**
   * Inherit traits from two parents
   */
  inheritTraits(parent1: CryptoNPC, parent2: CryptoNPC): TraitInheritance[] {
    const traits: TraitInheritance[] = [];

    // Big Five traits
    const bigFiveTraits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'] as const;
    for (const trait of bigFiveTraits) {
      const p1Value = parent1.personality.bigFive[trait];
      const p2Value = parent2.personality.bigFive[trait];
      const average = (p1Value + p2Value) / 2;
      const mutation = (Math.random() * 2 - 1) * TRAIT_MUTATION_RANGE;
      const childValue = Math.max(0, Math.min(1, average + mutation));

      traits.push({
        trait,
        parentValue: average,
        childValue,
        mutationAmount: mutation,
      });
    }

    // Crypto traits
    const cryptoTraits = ['riskTolerance', 'fomo', 'trustInInstitutions', 'technicalKnowledge', 'degenLevel'] as const;
    for (const trait of cryptoTraits) {
      const p1Value = parent1.personality.crypto[trait];
      const p2Value = parent2.personality.crypto[trait];
      const average = (p1Value + p2Value) / 2;
      const mutation = (Math.random() * 2 - 1) * TRAIT_MUTATION_RANGE;
      const childValue = Math.max(0, Math.min(1, average + mutation));

      traits.push({
        trait,
        parentValue: average,
        childValue,
        mutationAmount: mutation,
      });
    }

    return traits;
  }

  /**
   * Age an NPC by specified years
   */
  ageNPC(npcId: string, years: number): void {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      throw new Error(`NPC ${npcId} not found`);
    }

    const oldAge = npc.age;
    npc.age += years;

    // Check for coming of age (turning 18)
    if (oldAge < MIN_PARTNERSHIP_AGE && npc.age >= MIN_PARTNERSHIP_AGE) {
      const event = createLifeEvent('coming_of_age', npcId);
      this.addLifeEvent(npcId, event);
    }

    // Check for natural death (80+)
    if (npc.age >= NATURAL_DEATH_AGE && !this.deceased.has(npcId)) {
      this.processNPCDeath(npcId, 'old_age');
    }
  }

  /**
   * Process an NPC's death
   */
  processNPCDeath(npcId: string, cause: DeathCause): DeathResult {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      return { success: false, cause };
    }

    // Mark as deceased
    this.deceased.add(npcId);

    // Record death event
    const event = createLifeEvent('death', npcId, [], { cause });
    this.addLifeEvent(npcId, event);

    return {
      success: true,
      cause,
    };
  }

  /**
   * Distribute inheritance from a deceased NPC
   */
  distributeInheritance(deceasedId: string): Inheritance | null {
    const deceased = this.npcs.get(deceasedId);
    if (!deceased || !this.deceased.has(deceasedId)) {
      return null;
    }

    const wallet = deceased.wallet || createDefaultWallet(0);
    const totalCash = wallet.cash;
    const tokens = { ...wallet.holdings };
    const property: string[] = [];
    if (deceased.residence) property.push(deceased.residence);

    // Get beneficiaries
    const family = this.getFamilyByNPC(deceasedId);
    const beneficiaryIds: string[] = [];
    let partnerShare = 0;
    let childrenShare = totalCash;

    // Partner gets 50%
    if (family?.partnerId && !this.deceased.has(family.partnerId)) {
      beneficiaryIds.push(family.partnerId);
      partnerShare = totalCash * 0.5;
      childrenShare = totalCash * 0.5;

      const partner = this.npcs.get(family.partnerId);
      if (partner && partner.wallet) {
        partner.wallet.cash += partnerShare;
        // Partner gets all tokens for simplicity
        for (const [token, amount] of Object.entries(tokens)) {
          partner.wallet.holdings[token] = (partner.wallet.holdings[token] || 0) + amount * 0.5;
        }
      }
    }

    // Children split the remainder
    const children = this.getChildren(deceasedId);
    if (children.length > 0) {
      const perChildCash = childrenShare / children.length;
      const perChildTokens: Record<string, number> = {};

      // Calculate per-child token share
      const tokenShare = family?.partnerId ? 0.5 : 1;
      for (const [token, amount] of Object.entries(tokens)) {
        perChildTokens[token] = (amount * tokenShare) / children.length;
      }

      for (const childId of children) {
        beneficiaryIds.push(childId);
        const child = this.npcs.get(childId);
        if (child && child.wallet) {
          child.wallet.cash += perChildCash;
          for (const [token, amount] of Object.entries(perChildTokens)) {
            child.wallet.holdings[token] = (child.wallet.holdings[token] || 0) + amount;
          }
        }

        // Record inheritance event for child
        const inheritEvent = createLifeEvent('inheritance', childId, [deceasedId], {
          amount: perChildCash,
          tokens: perChildTokens,
        });
        this.addLifeEvent(childId, inheritEvent);
      }
    } else if (beneficiaryIds.length === 0) {
      // No beneficiaries - assets are lost
      return null;
    }

    const inheritance: Inheritance = {
      id: `inheritance-${deceasedId}-${Date.now()}`,
      deceasedId,
      beneficiaryIds,
      assets: {
        cash: totalCash,
        tokens,
        property,
      },
      distributedAt: Date.now(),
    };

    this.inheritances.set(deceasedId, inheritance);
    return inheritance;
  }

  /**
   * Get the family for an NPC
   */
  getFamily(npcId: string): Family | null {
    // Check if they're a founder or partner
    const familyId = this.npcToFamily.get(npcId);
    if (familyId) {
      return this.families.get(familyId) || null;
    }

    // Check if they're in a family as a child (return parent family)
    const parentFamilyId = this.npcToParentFamily.get(npcId);
    if (parentFamilyId) {
      return this.families.get(parentFamilyId) || null;
    }

    return null;
  }

  /**
   * Get extended family tree for an NPC
   */
  getFamilyTree(npcId: string, generations: number): FamilyTree {
    const tree: FamilyTree = {
      npcId,
      ancestors: [],
      descendants: [],
      siblings: this.getSiblings(npcId),
      partner: undefined,
    };

    // Get partner
    const family = this.getActiveFamily(npcId);
    if (family) {
      if (family.founderId === npcId && family.partnerId) {
        tree.partner = family.partnerId;
      } else if (family.partnerId === npcId) {
        tree.partner = family.founderId;
      }
    }

    // Get ancestors
    const parents = this.getParents(npcId);
    for (const parentId of parents) {
      tree.ancestors.push({ npcId: parentId, relation: 'parent' });

      // Get grandparents if requested
      if (generations > 1) {
        const grandparents = this.getParents(parentId);
        for (const gpId of grandparents) {
          tree.ancestors.push({ npcId: gpId, relation: 'grandparent' });
        }
      }
    }

    // Get descendants
    const children = this.getChildren(npcId);
    for (const childId of children) {
      tree.descendants.push({ npcId: childId, relation: 'child' });

      // Get grandchildren if requested
      if (generations > 1) {
        const grandchildren = this.getChildren(childId);
        for (const gcId of grandchildren) {
          tree.descendants.push({ npcId: gcId, relation: 'grandchild' });
        }
      }
    }

    return tree;
  }

  /**
   * Track if a family qualifies as a dynasty
   */
  trackDynasty(familyId: string): Dynasty | null {
    const family = this.families.get(familyId);
    if (!family) {
      return null;
    }

    // Check generation requirement
    if (family.generationCount < DYNASTY_GENERATION_REQUIREMENT) {
      return null;
    }

    // Check wealth requirement across generations
    const recentWealth = family.wealthHistory.slice(-DYNASTY_GENERATION_REQUIREMENT);
    const meetsWealthReq = recentWealth.every((w) => w >= DYNASTY_WEALTH_THRESHOLD);
    if (recentWealth.length < DYNASTY_GENERATION_REQUIREMENT || !meetsWealthReq) {
      return null;
    }

    // Create dynasty
    const founder = this.npcs.get(family.founderId);
    const dynasty: Dynasty = {
      id: `dynasty-${familyId}-${Date.now()}`,
      founderName: founder?.name || 'Unknown',
      familyIds: [familyId],
      totalWealth: recentWealth[recentWealth.length - 1],
      influenceScore: this.calculateInfluenceScore(family),
      foundedAt: Date.now(),
    };

    this.dynasties.set(dynasty.id, dynasty);
    return dynasty;
  }

  /**
   * Get generational wealth for a family
   */
  getGenerationalWealth(familyId: string): number {
    const family = this.families.get(familyId);
    if (!family) {
      return 0;
    }

    let totalWealth = 0;

    // Add founder's wealth
    const founder = this.npcs.get(family.founderId);
    if (founder?.wallet) {
      totalWealth += founder.wallet.cash;
    }

    // Add partner's wealth
    if (family.partnerId) {
      const partner = this.npcs.get(family.partnerId);
      if (partner?.wallet) {
        totalWealth += partner.wallet.cash;
      }
    }

    // Add children's wealth
    for (const childId of family.childrenIds) {
      const child = this.npcs.get(childId);
      if (child?.wallet) {
        totalWealth += child.wallet.cash;
      }
    }

    return totalWealth;
  }

  /**
   * Record generational wealth snapshot
   */
  recordGenerationalWealth(familyId: string): void {
    const family = this.families.get(familyId);
    if (!family) {
      return;
    }

    const wealth = this.getGenerationalWealth(familyId);
    family.wealthHistory.push(wealth);
  }

  /**
   * Create a solo family (for NPCs without partners)
   */
  createSoloFamily(npcId: string): Family {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      throw new Error(`NPC ${npcId} not found`);
    }

    const family = createDefaultFamily(npcId);

    // Set generation based on parent family
    const parentGen = this.getParentGeneration(npcId);
    family.generationCount = parentGen;

    this.families.set(family.id, family);
    this.npcToFamily.set(npcId, family.id);

    return family;
  }

  /**
   * Get life events for an NPC
   */
  getLifeEvents(npcId: string): LifeEventRecord[] {
    return this.lifeEvents.get(npcId) || [];
  }

  /**
   * Check if an NPC is deceased
   */
  isDeceased(npcId: string): boolean {
    return this.deceased.has(npcId);
  }

  /**
   * Get siblings of an NPC
   */
  getSiblings(npcId: string): string[] {
    const parentFamilyId = this.npcToParentFamily.get(npcId);
    if (!parentFamilyId) {
      return [];
    }

    const family = this.families.get(parentFamilyId);
    if (!family) {
      return [];
    }

    return family.childrenIds.filter((id) => id !== npcId);
  }

  /**
   * Get parents of an NPC
   */
  getParents(npcId: string): string[] {
    const parentFamilyId = this.npcToParentFamily.get(npcId);
    if (!parentFamilyId) {
      return [];
    }

    const family = this.families.get(parentFamilyId);
    if (!family) {
      return [];
    }

    const parents = [family.founderId];
    if (family.partnerId) {
      parents.push(family.partnerId);
    }

    return parents;
  }

  /**
   * Get children of an NPC
   */
  getChildren(npcId: string): string[] {
    const children: string[] = [];

    // Check all families where this NPC is founder or partner
    for (const family of this.families.values()) {
      if (family.founderId === npcId || family.partnerId === npcId) {
        children.push(...family.childrenIds);
      }
    }

    return children;
  }

  /**
   * Set the parent family for an NPC (for manual setup)
   */
  setParentFamily(npcId: string, familyId: string): void {
    this.npcToParentFamily.set(npcId, familyId);
  }

  /**
   * Get relation type between two NPCs
   */
  getRelation(npc1Id: string, npc2Id: string): FamilyRelation | null {
    // Check if npc2 is npc1's child
    const children = this.getChildren(npc1Id);
    if (children.includes(npc2Id)) {
      return 'parent';
    }

    // Check if npc2 is npc1's parent
    const parents = this.getParents(npc1Id);
    if (parents.includes(npc2Id)) {
      return 'child';
    }

    // Check if they're siblings
    const siblings = this.getSiblings(npc1Id);
    if (siblings.includes(npc2Id)) {
      return 'sibling';
    }

    // Check if they're partners
    const family = this.getActiveFamily(npc1Id);
    if (family) {
      if (
        (family.founderId === npc1Id && family.partnerId === npc2Id) ||
        (family.partnerId === npc1Id && family.founderId === npc2Id)
      ) {
        return 'partner';
      }
    }

    // Check grandparent/grandchild relationships
    for (const parentId of parents) {
      const grandparents = this.getParents(parentId);
      if (grandparents.includes(npc2Id)) {
        return 'grandchild';
      }
    }

    for (const childId of children) {
      const grandchildren = this.getChildren(childId);
      if (grandchildren.includes(npc2Id)) {
        return 'grandparent';
      }
    }

    return null;
  }

  /**
   * Get all families
   */
  getAllFamilies(): Family[] {
    return Array.from(this.families.values());
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.npcs.clear();
    this.families.clear();
    this.lifeEvents.clear();
    this.npcToFamily.clear();
    this.npcToParentFamily.clear();
    this.deceased.clear();
    this.dynasties.clear();
    this.inheritances.clear();
  }

  // === Private Helper Methods ===

  /**
   * Get active (non-dissolved) family for an NPC
   */
  private getActiveFamily(npcId: string): Family | null {
    const familyId = this.npcToFamily.get(npcId);
    if (!familyId) {
      return null;
    }

    const family = this.families.get(familyId);
    if (!family || family.dissolved) {
      return null;
    }

    return family;
  }

  /**
   * Get the family by NPC (including as child)
   */
  private getFamilyByNPC(npcId: string): Family | null {
    // First check as founder/partner
    const familyId = this.npcToFamily.get(npcId);
    if (familyId) {
      return this.families.get(familyId) || null;
    }

    return null;
  }

  /**
   * Add a life event for an NPC
   */
  private addLifeEvent(npcId: string, event: LifeEventRecord): void {
    const events = this.lifeEvents.get(npcId);
    if (events) {
      events.push(event);
    }
  }

  /**
   * Get the generation number based on parent family
   */
  private getParentGeneration(npcId: string): number {
    const parentFamilyId = this.npcToParentFamily.get(npcId);
    if (!parentFamilyId) {
      return 1;
    }

    const parentFamily = this.families.get(parentFamilyId);
    if (!parentFamily) {
      return 1;
    }

    return parentFamily.generationCount + 1;
  }

  /**
   * Build personality from trait inheritance
   */
  private buildPersonalityFromTraits(traits: TraitInheritance[]): NPCPersonality {
    const personality = createDefaultPersonality();

    for (const trait of traits) {
      // Big Five traits
      if (trait.trait === 'openness') personality.bigFive.openness = trait.childValue;
      if (trait.trait === 'conscientiousness') personality.bigFive.conscientiousness = trait.childValue;
      if (trait.trait === 'extraversion') personality.bigFive.extraversion = trait.childValue;
      if (trait.trait === 'agreeableness') personality.bigFive.agreeableness = trait.childValue;
      if (trait.trait === 'neuroticism') personality.bigFive.neuroticism = trait.childValue;

      // Crypto traits
      if (trait.trait === 'riskTolerance') personality.crypto.riskTolerance = trait.childValue;
      if (trait.trait === 'fomo') personality.crypto.fomo = trait.childValue;
      if (trait.trait === 'trustInInstitutions') personality.crypto.trustInInstitutions = trait.childValue;
      if (trait.trait === 'technicalKnowledge') personality.crypto.technicalKnowledge = trait.childValue;
      if (trait.trait === 'degenLevel') personality.crypto.degenLevel = trait.childValue;
    }

    return personality;
  }

  /**
   * Calculate influence score for a family
   */
  private calculateInfluenceScore(family: Family): number {
    const wealthFactor = family.wealthHistory.length > 0 
      ? family.wealthHistory[family.wealthHistory.length - 1] / DYNASTY_WEALTH_THRESHOLD 
      : 0;
    const generationFactor = family.generationCount;
    const familySizeFactor = 1 + family.childrenIds.length * 0.1;

    return Math.round(wealthFactor * generationFactor * familySizeFactor * 100);
  }
}
