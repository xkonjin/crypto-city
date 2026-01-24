// Stub file for NPC relationships
export interface Relationship {
  trust: number;
  friendship: number;
  romantic: number;
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
