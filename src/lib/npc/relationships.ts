
export type RelationshipType = 
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'best_friend'
  | 'rival'
  | 'enemy'
  | 'nemesis'
  | 'romantic_interest'
  | 'partner'
  | 'business_partner'
  | 'mentor'
  | 'mentee';

export interface RelationshipThresholds {
  trust?: number;
  friendship?: number;
  romantic?: number;
  respect?: number;
  familiarity?: number;
  attraction?: number;
}

export type RelationshipThresholdType = 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend';

export const RELATIONSHIP_THRESHOLDS: Record<RelationshipThresholdType, RelationshipThresholds> = {
  stranger: {},
  acquaintance: { friendship: 20 },
  friend: { friendship: 50, trust: 30 },
  close_friend: { friendship: 70, trust: 60 },
  best_friend: { friendship: 90, trust: 80 },
};

export const RELATIONSHIP_THRESHOLDS_ALL: Record<RelationshipType, RelationshipThresholds> = {
  stranger: {},
  acquaintance: { friendship: 20 },
  friend: { friendship: 50, trust: 30 },
  close_friend: { friendship: 70, trust: 60 },
  best_friend: { friendship: 90, trust: 80 },
  rival: { trust: -20, respect: -30 },
  enemy: { trust: -50, respect: -60 },
  nemesis: { trust: -70, respect: -80 },
  romantic_interest: { romantic: 60, attraction: 50 },
  partner: { romantic: 80, friendship: 75, trust: 70 },
  business_partner: { respect: 60, trust: 40 },
  mentor: { respect: 70, trust: 50 },
  mentee: { respect: 50, trust: 30 },
};

export const ALL_RELATIONSHIP_TYPES: RelationshipType[] = [
  'stranger',
  'acquaintance',
  'friend',
  'close_friend',
  'best_friend',
  'rival',
  'enemy',
  'nemesis',
  'romantic_interest',
  'partner',
  'business_partner',
  'mentor',
  'mentee',
];

export function createDefaultRelationship(targetId: string): Relationship {
  return {
    targetId,
    type: 'stranger',
    trust: 0,
    friendship: 0,
    romantic: 0,
    respect: 50,
    familiarity: 0,
    attraction: 0,
    interactionCount: 0,
    lastInteraction: Date.now(),
    owedFavors: 0,
    firstMet: Date.now(),
  };
}

export function clampMetric(value: number, ...args: any[]): number {
  if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number') {
    const min = args[0];
    const max = args[1];
    return Math.max(min, Math.min(max, value));
  }
  if (args.length === 1 && typeof args[0] === 'string') {
    const metric = args[0] as keyof typeof METRIC_RANGES;
    const range = METRIC_RANGES[metric];
    if (range) {
      return Math.max(range.min, Math.min(range.max, value));
    }
    return Math.max(0, Math.min(100, value));
  }
  return value;
}

const METRIC_RANGES: Record<string, { min: number; max: number }> = {
  trust: { min: 0, max: 100 },
  friendship: { min: 0, max: 100 },
  romantic: { min: 0, max: 100 },
  respect: { min: 0, max: 100 },
  familiarity: { min: 0, max: 100 },
  attraction: { min: 0, max: 100 },
};

export const RELATIONSHIP_DESCRIPTIONS: Record<RelationshipType, string> = {
  stranger: 'Someone you\'ve never met before.',
  acquaintance: 'Someone you know by name but haven\'t spoken to much.',
  friend: 'A person you get along well with.',
  close_friend: 'Someone you trust and enjoy spending time with.',
  best_friend: 'Your closest companion who knows all your secrets.',
  rival: 'Someone you compete with professionally or personally.',
  enemy: 'A person you actively dislike and avoid.',
  nemesis: 'Your sworn enemy who opposes everything you stand for.',
  romantic_interest: 'Someone you have romantic feelings for.',
  partner: 'Your significant other or life partner.',
  business_partner: 'Someone you work closely with on business matters.',
  mentor: 'A wise person who guides and teaches you.',
  mentee: 'Someone you mentor and help develop.',
};
