// Stub file for NPC Thought Engine
export interface ThoughtContext {
  targetId?: string;
  recentEvents?: string[];
  mood?: string;
  needs?: string[];
}

export function generateThought(npcId: string): string {
  return 'NPC is thinking...';
}

export const thoughtEngine = {
  generateThought
};
