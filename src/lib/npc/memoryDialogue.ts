/**
 * Memory-Aware Dialogue System
 * 
 * NPCs reference past interactions naturally, creating a sense of
 * persistent relationship and shared history.
 * 
 * Issue #135: Memory-aware dialogue system ("Remember when...")
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { EpisodicMemory } from './memory';

// =============================================================================
// TYPES
// =============================================================================

export type MemoryType = 'episodic' | 'semantic';

export interface MemoryDialogueTrigger {
  memoryType: MemoryType;
  minImportance: number;
  minAgeInDays: number;  // Don't reference too-recent memories
  maxAgeInDays: number;  // Don't reference forgotten memories
  category?: string;     // Optional category filter
  templates: string[];   // Template strings with {description} placeholder
}

export interface DialogueMemory {
  description: string;
  importance: number;
  timestamp: number;
  category: string;
  emotionalValence: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Memory dialogue triggers by category
 */
export const MEMORY_TRIGGERS: MemoryDialogueTrigger[] = [
  // First meeting memories
  {
    memoryType: 'episodic',
    minImportance: 5,
    minAgeInDays: 7,
    maxAgeInDays: 365,
    category: 'first_meeting',
    templates: [
      "I remember when you first arrived in the city...",
      "Feels like yesterday when we first met. Time flies in crypto.",
      "You know, I still remember our first conversation.",
    ],
  },
  
  // Gift memories
  {
    memoryType: 'episodic',
    minImportance: 6,
    minAgeInDays: 3,
    maxAgeInDays: 30,
    category: 'gift_received',
    templates: [
      "Thanks again for that gift last week. Still makes me smile.",
      "I've been thinking about that {description}. Really appreciated it.",
      "That {description} you gave me? Still holding it. Diamond hands.",
    ],
  },
  
  // Help memories
  {
    memoryType: 'episodic',
    minImportance: 7,
    minAgeInDays: 1,
    maxAgeInDays: 60,
    category: 'help_received',
    templates: [
      "You helped me during my crisis. I won't forget that.",
      "Remember when you helped me with {description}? Meant a lot.",
      "I still owe you for {description}. Seriously.",
    ],
  },
  
  // Shared events
  {
    memoryType: 'episodic',
    minImportance: 8,
    minAgeInDays: 7,
    maxAgeInDays: 90,
    category: 'shared_event',
    templates: [
      "That {description} we survived together? Wild times.",
      "Remember {description}? Can't believe we made it through.",
      "The {description}... now THAT was something.",
    ],
  },
  
  // Market events
  {
    memoryType: 'episodic',
    minImportance: 6,
    minAgeInDays: 3,
    maxAgeInDays: 45,
    category: 'market_event',
    templates: [
      "That {description}... my portfolio is still recovering.",
      "Remember the {description}? What a ride.",
      "I keep thinking about {description}. Taught me a lot.",
    ],
  },
  
  // General positive memories
  {
    memoryType: 'episodic',
    minImportance: 7,
    minAgeInDays: 3,
    maxAgeInDays: 30,
    templates: [
      "I've been thinking about {description}. Good times.",
      "Remember {description}? That was something.",
      "You know what I keep coming back to? {description}.",
    ],
  },
];

/**
 * Inside jokes that develop over repeated positive interactions
 */
export const INSIDE_JOKE_TEMPLATES: string[] = [
  "You know what they say... 'Not your keys, not your coins.' *winks*",
  "This is the way.",
  "Few understand.",
  "WAGMI, right?",
  "Wen moon? *laughs* Sorry, couldn't resist.",
  "Number go up technology, am I right?",
];

// =============================================================================
// MEMORY DIALOGUE GENERATOR
// =============================================================================

/**
 * Check if a memory is eligible for dialogue based on trigger rules
 */
function isMemoryEligible(
  memory: DialogueMemory,
  trigger: MemoryDialogueTrigger,
  currentTime: number
): boolean {
  const ageInDays = (currentTime - memory.timestamp) / DAY_MS;
  
  // Check importance threshold
  if (memory.importance < trigger.minImportance) return false;
  
  // Check age constraints
  if (ageInDays < trigger.minAgeInDays) return false;
  if (ageInDays > trigger.maxAgeInDays) return false;
  
  // Check category if specified
  if (trigger.category && memory.category !== trigger.category) return false;
  
  return true;
}

/**
 * Select a random template from a trigger
 */
function selectTemplate(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Fill template placeholders with memory data
 */
function fillTemplate(template: string, memory: DialogueMemory): string {
  return template.replace(/{description}/g, memory.description);
}

/**
 * Generate memory-aware dialogue for an NPC
 */
export function generateMemoryDialogue(
  memories: DialogueMemory[],
  currentTime: number = Date.now()
): string | null {
  // Filter to eligible memories
  const eligiblePairs: Array<{ memory: DialogueMemory; trigger: MemoryDialogueTrigger }> = [];
  
  for (const memory of memories) {
    for (const trigger of MEMORY_TRIGGERS) {
      if (isMemoryEligible(memory, trigger, currentTime)) {
        eligiblePairs.push({ memory, trigger });
      }
    }
  }
  
  if (eligiblePairs.length === 0) return null;
  
  // Weight by importance and recency
  const weighted = eligiblePairs.map(pair => {
    const ageInDays = (currentTime - pair.memory.timestamp) / DAY_MS;
    const recencyWeight = 1 - (ageInDays / pair.trigger.maxAgeInDays);
    const importanceWeight = pair.memory.importance / 10;
    return {
      ...pair,
      weight: recencyWeight * importanceWeight,
    };
  });
  
  // Select based on weight
  const totalWeight = weighted.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const pair of weighted) {
    random -= pair.weight;
    if (random <= 0) {
      const template = selectTemplate(pair.trigger.templates);
      return fillTemplate(template, pair.memory);
    }
  }
  
  // Fallback
  const fallback = weighted[0];
  const template = selectTemplate(fallback.trigger.templates);
  return fillTemplate(template, fallback.memory);
}

/**
 * Check if NPCs have enough shared history for inside jokes
 */
export function canUseInsideJokes(
  positiveInteractionCount: number,
  relationshipStrength: number
): boolean {
  return positiveInteractionCount >= 10 && relationshipStrength >= 50;
}

/**
 * Generate an inside joke if appropriate
 */
export function generateInsideJoke(
  positiveInteractionCount: number,
  relationshipStrength: number
): string | null {
  if (!canUseInsideJokes(positiveInteractionCount, relationshipStrength)) {
    return null;
  }
  
  // 20% chance to use inside joke
  if (Math.random() > 0.2) return null;
  
  return INSIDE_JOKE_TEMPLATES[Math.floor(Math.random() * INSIDE_JOKE_TEMPLATES.length)];
}

/**
 * Convert episodic memories to dialogue-ready format
 */
export function prepareMemoriesForDialogue(
  episodicMemories: EpisodicMemory[]
): DialogueMemory[] {
  return episodicMemories.map(em => ({
    description: em.event,  // EpisodicMemory uses 'event' field
    importance: em.importance,
    timestamp: em.timestamp,
    category: 'general',  // EpisodicMemory doesn't have category
    emotionalValence: em.emotionalValence,
  }));
}

// =============================================================================
// DIALOGUE CONTEXT
// =============================================================================

export interface DialogueContext {
  speakerId: string;
  listenerId: string;
  currentMood: string;
  relationshipLevel: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  recentEvents: string[];
}

/**
 * Get appropriate dialogue opener based on context
 */
export function getContextualOpener(context: DialogueContext): string {
  const { timeOfDay, currentMood, relationshipLevel } = context;
  
  // Time-based greetings
  const timeGreetings = {
    morning: ["Morning!", "Early bird, huh?", "Gm!"],
    afternoon: ["Hey there.", "What's good?", "Afternoon."],
    evening: ["Evening.", "Still grinding?", "Long day?"],
    night: ["Burning the midnight oil?", "Night owl life.", "Can't sleep either?"],
  };
  
  // Mood-influenced greetings
  if (currentMood === 'happy' && relationshipLevel > 60) {
    return "Great to see you! " + timeGreetings[timeOfDay][0];
  }
  
  if (currentMood === 'sad' && relationshipLevel > 40) {
    return "Hey... you okay?";
  }
  
  return timeGreetings[timeOfDay][Math.floor(Math.random() * timeGreetings[timeOfDay].length)];
}
