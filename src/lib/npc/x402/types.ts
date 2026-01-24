// Stub file for NPC transaction types
export interface NPCTransaction {
  id: string;
  fromNpcId: string;
  toNpcId: string;
  amount: bigint;
  timestamp: number;
}
