// Stub file for Defi DAOist dialogue pool
import type { DialoguePool } from "../types";

export const DEFI_DAOIST_POOLS: DialoguePool[] = [
  {
    id: 'defi_daoist_generic',
    archetype: 'defi_daoist',
    category: 'greeting',
    marketCondition: 'bull',
    relationshipLevel: 'neutral',
    dialogues: [
      {
        text: "Have you voted in the latest proposal?",
        weight: 1,
      },
    ],
  },
];
