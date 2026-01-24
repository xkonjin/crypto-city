// Stub file for NPC relationships
export interface Relationship {
  targetId: string;
  type: RelationshipType;
  trust: number;
  friendship: number;
  romantic: number;
  respect: number;
  familiarity: number;
  attraction: number;
}

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

export type RelationshipThreshold = 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend';

export const RELATIONSHIP_THRESHOLDS: Record<RelationshipThreshold, number> = {
  stranger: 0,
  acquaintance: 20,
  friend: 50,
  close_friend: 70,
  best_friend: 90,
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
