/**
 * NPC Mood System
 * 
 * Implements internal states for NPCs including mood, thoughts, beliefs, and desires.
 * This creates a rich inner life for NPCs that affects their behavior and dialogue.
 * 
 * Moods range from +2 (ecstatic) to -2 (depressed) and are influenced by:
 * - Needs satisfaction level
 * - Recent events (positive/negative)
 * - Relationship quality
 * - Wealth changes (especially important in crypto!)
 * - Market conditions (bull = happier, bear = anxious)
 */

/**
 * Mood types representing the NPC's emotional state.
 * Mapped to levels: +2 (very positive) to -2 (very negative)
 */
export type Mood =
  | 'ecstatic'    // +2: Major win (10x gains, dream job)
  | 'happy'       // +1: Good day, needs met
  | 'content'     // 0: Neutral, fine
  | 'neutral'     // 0: Default state
  | 'anxious'     // -1: Worried about something
  | 'sad'         // -1: Loss, disappointment
  | 'angry'       // -1: Frustrated, wronged
  | 'depressed';  // -2: Multiple bad events

/**
 * Mood level mapping for calculations.
 */
export const MOOD_LEVELS: Record<Mood, number> = {
  ecstatic: 2,
  happy: 1,
  content: 0,
  neutral: 0,
  anxious: -1,
  sad: -1,
  angry: -1,
  depressed: -2,
};

/**
 * Hitchhiker's Guide to the Galaxy style mood descriptions.
 * Sardonic, educational, and crypto-native.
 */
export const MOOD_DESCRIPTIONS: Record<Mood, string> = {
  ecstatic: "Currently experiencing what traders call 'euphoria'. This is either very good or very bad depending on position sizing.",
  happy: "Life is good. Portfolio is green. The sun is shining. Suspicious, really.",
  content: "That rare state of not actively panicking about anything. Enjoy it while it lasts.",
  neutral: "Existing. Neither winning nor losing. The most common state of crypto participants.",
  anxious: "Checking portfolio every 30 seconds. Has memorized the Celsius bankruptcy timeline.",
  sad: "Market made a choice, and it wasn't the right one. Again.",
  angry: "Someone is WRONG on the internet about their favorite protocol.",
  depressed: "Has seen too many rug pulls. Trusts nothing. Probably should touch grass.",
};

/**
 * All mood types as an array for iteration.
 */
export const ALL_MOODS: Mood[] = [
  'ecstatic', 'happy', 'content', 'neutral',
  'anxious', 'sad', 'angry', 'depressed',
];

/**
 * Represents a single thought in the NPC's mind.
 * Thoughts are fleeting and connected to triggers and mood states.
 */
export interface Thought {
  /** The thought content/text */
  content: string;
  /** When the thought occurred */
  timestamp: number;
  /** What triggered this thought */
  trigger: string;
  /** The mood when this thought was generated */
  mood: Mood;
}

/**
 * Represents a belief the NPC holds about something.
 * Beliefs are more persistent than thoughts and influence decision-making.
 */
export interface Belief {
  /** What the belief is about (e.g., "Bitcoin", "DeFi", "Person X") */
  subject: string;
  /** The actual belief content (e.g., "will reach 100k") */
  belief: string;
  /** How confident the NPC is in this belief (0-1) */
  confidence: number;
  /** How the NPC came to hold this belief */
  source: 'observation' | 'told' | 'inference';
}

/**
 * Represents something the NPC wants or is motivated toward.
 */
export interface Desire {
  /** What the NPC wants (e.g., "more BTC", "social recognition") */
  target: string;
  /** How strongly the NPC wants it (0-1) */
  intensity: number;
  /** Why the NPC wants it */
  reason: string;
}

/**
 * The NPC's complete internal world - their subjective experience.
 */
export interface InternalWorld {
  /** Current emotional state */
  currentMood: Mood;
  /** How strongly the mood is felt (0-1) */
  moodIntensity: number;
  /** Recent thoughts (last 10 max) */
  thoughts: Thought[];
  /** Held beliefs */
  beliefs: Belief[];
  /** Current desires */
  desires: Desire[];
}

/**
 * Events that affect NPC mood.
 */
export interface MoodEvent {
  /** Type of event */
  type: 
    | 'trading_win'     // Made profit
    | 'trading_loss'    // Lost money
    | 'social_positive' // Good social interaction
    | 'social_negative' // Bad social interaction
    | 'need_satisfied'  // A need was met
    | 'need_critical'   // A need became critical
    | 'work_success'    // Accomplished something at work
    | 'work_failure';   // Failed at work
  /** How significant the event was (0-1) */
  magnitude: number;
  /** Human-readable description */
  description: string;
}

/**
 * Create a new Thought with defaults.
 */
export function createThought(params: {
  content: string;
  trigger: string;
  mood: Mood;
  timestamp?: number;
}): Thought {
  return {
    content: params.content,
    trigger: params.trigger,
    mood: params.mood,
    timestamp: params.timestamp ?? Date.now(),
  };
}

/**
 * Create a new Belief with validation.
 */
export function createBelief(params: {
  subject: string;
  belief: string;
  confidence: number;
  source: 'observation' | 'told' | 'inference';
}): Belief {
  return {
    subject: params.subject,
    belief: params.belief,
    confidence: Math.max(0, Math.min(1, params.confidence)),
    source: params.source,
  };
}

/**
 * Create a new Desire with validation.
 */
export function createDesire(params: {
  target: string;
  intensity: number;
  reason: string;
}): Desire {
  return {
    target: params.target,
    intensity: Math.max(0, Math.min(1, params.intensity)),
    reason: params.reason,
  };
}

/**
 * Create default internal world for a new NPC.
 */
export function createDefaultInternalWorld(): InternalWorld {
  return {
    currentMood: 'neutral',
    moodIntensity: 0.5,
    thoughts: [],
    beliefs: [],
    desires: [],
  };
}
