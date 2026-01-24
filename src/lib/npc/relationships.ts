// Stub file for NPC relationships
export interface Relationship {
  trust: number;
  friendship: number;
  romantic: number;
}

export type RelationshipType = 'trust' | 'friendship' | 'romantic' | 'hostile' | 'neutral' | 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend';
