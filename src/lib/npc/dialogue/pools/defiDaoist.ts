// Stub file for Defi DAOist dialogue pool
import type { DialoguePool } from "../types";

export const DEFI_DAOIST_POOLS: DialoguePool[] = [
  {
    archetype: 'defi_daoist',
    context: 'greeting',
    marketCondition: 'bull',
    relationshipLevel: 'friend',
    lines: [
      {
        text: "Have you voted in the latest proposal?",
        weight: 1,
        cooldown: 30000,
      },
    ],
  },
];
