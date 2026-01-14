/**
 * NPC Generations System Types for Crypto City
 *
 * Implements family formation, trait inheritance, life events, dynasties, and
 * generational wealth tracking for NPCs.
 *
 * "The sins of the father are visited upon the children... especially the bad trades."
 */

/**
 * Family relation types between NPCs
 */
export type FamilyRelation =
  | 'parent'
  | 'child'
  | 'sibling'
  | 'partner'
  | 'grandparent'
  | 'grandchild';

/**
 * All family relation types as an array for iteration/validation
 */
export const FAMILY_RELATION_TYPES: FamilyRelation[] = [
  'parent',
  'child',
  'sibling',
  'partner',
  'grandparent',
  'grandchild',
];

/**
 * Life event types that can occur for NPCs
 */
export type LifeEvent =
  | 'birth'
  | 'partnership'
  | 'separation'
  | 'death'
  | 'inheritance'
  | 'coming_of_age';

/**
 * All life event types as an array for iteration/validation
 */
export const LIFE_EVENT_TYPES: LifeEvent[] = [
  'birth',
  'partnership',
  'separation',
  'death',
  'inheritance',
  'coming_of_age',
];

/**
 * Causes of death for NPCs
 */
export type DeathCause = 'old_age' | 'conflict' | 'accident' | 'illness';

/**
 * Family unit interface - represents a family group
 */
export interface Family {
  /** Unique identifier for this family */
  id: string;
  /** ID of the NPC who founded/started this family unit */
  founderId: string;
  /** ID of the partner NPC, undefined if single parent or dissolved */
  partnerId?: string;
  /** IDs of all children in this family */
  childrenIds: string[];
  /** Number of generations this family spans (1 = founders, 2 = first children, etc.) */
  generationCount: number;
  /** History of total family wealth at each generation milestone */
  wealthHistory: number[];
  /** Timestamp when family was formed */
  formedAt: number;
  /** Whether this family is dissolved (separated/deceased) */
  dissolved: boolean;
}

/**
 * Inheritance record when an NPC passes away
 */
export interface Inheritance {
  /** Unique identifier for this inheritance */
  id: string;
  /** ID of the deceased NPC */
  deceasedId: string;
  /** IDs of NPCs who received inheritance */
  beneficiaryIds: string[];
  /** Assets distributed */
  assets: {
    /** Cash amount distributed */
    cash: number;
    /** Token holdings distributed by symbol */
    tokens: Record<string, number>;
    /** Property IDs distributed */
    property: string[];
  };
  /** Timestamp when inheritance was distributed */
  distributedAt: number;
}

/**
 * Dynasty interface - a long-lasting wealthy family
 */
export interface Dynasty {
  /** Unique identifier for this dynasty */
  id: string;
  /** Name of the dynasty founder */
  founderName: string;
  /** IDs of all families in this dynasty */
  familyIds: string[];
  /** Total accumulated wealth */
  totalWealth: number;
  /** Influence score based on wealth, generations, and family size */
  influenceScore: number;
  /** Timestamp when dynasty was officially formed */
  foundedAt: number;
}

/**
 * Trait inheritance tracking
 */
export interface TraitInheritance {
  /** Name of the trait */
  trait: string;
  /** Average value from parents */
  parentValue: number;
  /** Final value for child after mutation */
  childValue: number;
  /** Amount of mutation applied (-0.1 to +0.1) */
  mutationAmount: number;
}

/**
 * A recorded life event
 */
export interface LifeEventRecord {
  /** Unique identifier for this event */
  id: string;
  /** Type of life event */
  type: LifeEvent;
  /** ID of the NPC this event is about */
  npcId: string;
  /** IDs of related NPCs (partner, parents, beneficiaries, etc.) */
  relatedNpcIds: string[];
  /** Timestamp when event occurred */
  occurredAt: number;
  /** Optional details about the event */
  details?: Record<string, unknown>;
}

/**
 * Family tree structure for queries
 */
export interface FamilyTree {
  /** The NPC being queried */
  npcId: string;
  /** Parent NPCs */
  ancestors: { npcId: string; relation: FamilyRelation }[];
  /** Child NPCs */
  descendants: { npcId: string; relation: FamilyRelation }[];
  /** Sibling NPCs */
  siblings: string[];
  /** Partner NPC if any */
  partner?: string;
}

/**
 * Dynasty wealth threshold - family must exceed this for dynasty status
 */
export const DYNASTY_WEALTH_THRESHOLD = 50000;

/**
 * Minimum generations required for dynasty status
 */
export const DYNASTY_GENERATION_REQUIREMENT = 3;

/**
 * Minimum age for partnership
 */
export const MIN_PARTNERSHIP_AGE = 18;

/**
 * Age range for child-bearing
 */
export const CHILD_BEARING_AGE = { min: 18, max: 45 };

/**
 * Age at which natural death becomes possible
 */
export const NATURAL_DEATH_AGE = 80;

/**
 * Trait mutation range
 */
export const TRAIT_MUTATION_RANGE = 0.1;

/**
 * Hitchhiker's Guide style descriptions for generation events
 */
export const GENERATION_DESCRIPTIONS: Record<string, string> = {
  birth:
    "A new crypto citizen enters the world, blissfully unaware of gas fees and market volatility. Give it time.",
  partnership:
    "Two portfolios merge into one. For richer or poorer, in bull markets and bear markets.",
  separation:
    "The joint wallet is split. Lawyers get involved. The blockchain remembers everything.",
  death:
    "One last transaction: transferring all assets to the next generation. Death is just another state change.",
  inheritance:
    "Generational wealth transfer complete. The heirs promise to HODL, but we've heard that before.",
  coming_of_age:
    "Finally old enough to make their own terrible financial decisions. A proud moment for any family.",
  dynasty:
    "When a family's wealth survives three generations of crypto winters, they earn the title. Respect.",
  family:
    "The basic unit of crypto society. United by blood, divided by which coin to stake.",
};

/**
 * Create a default empty family
 */
export function createDefaultFamily(founderId: string): Family {
  return {
    id: `family-${founderId}-${Date.now()}`,
    founderId,
    partnerId: undefined,
    childrenIds: [],
    generationCount: 1,
    wealthHistory: [],
    formedAt: Date.now(),
    dissolved: false,
  };
}

/**
 * Create a life event record
 */
export function createLifeEvent(
  type: LifeEvent,
  npcId: string,
  relatedNpcIds: string[] = [],
  details?: Record<string, unknown>
): LifeEventRecord {
  return {
    id: `event-${type}-${npcId}-${Date.now()}`,
    type,
    npcId,
    relatedNpcIds,
    occurredAt: Date.now(),
    details,
  };
}
