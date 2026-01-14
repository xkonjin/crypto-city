/**
 * LLM Integration for Dynamic Dialogue Variety
 * 
 * Optional LLM integration that can enhance NPC dialogue with
 * dynamic, contextual responses while falling back gracefully
 * to template-based dialogue.
 * 
 * Issue #140: LLM integration for dynamic dialogue variety
 */

import type { CryptoNPC, Occupation } from '@/games/isocity/types/npc';
import type { DialogueMemory } from './memoryDialogue';
import type { PersonalCrisis } from './personalCrisis';

// =============================================================================
// TYPES
// =============================================================================

export interface LLMConfig {
  enabled: boolean;
  provider: 'openai' | 'anthropic' | 'local' | 'mock';
  apiEndpoint?: string;
  apiKey?: string;
  model?: string;
  maxTokens: number;
  temperature: number;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerDay: number;
  };
}

export interface DialogueContext {
  npc: NPCDialogueProfile;
  player: PlayerContext;
  situation: SituationContext;
  memories: DialogueMemory[];
  currentCrisis?: PersonalCrisis;
}

export interface NPCDialogueProfile {
  name: string;
  occupation: Occupation;
  personalityTraits: string[];
  speakingStyle: string;
  cryptoKnowledge: 'novice' | 'intermediate' | 'expert' | 'degen';
  currentMood: string;
  relationshipWithPlayer: number;  // 0-100
  dialogueSeeds?: string[];
}

export interface PlayerContext {
  recentActions: string[];
  reputation: number;
  knownPreferences: string[];
}

export interface SituationContext {
  location: string;
  timeOfDay: string;
  recentCityEvents: string[];
  marketCondition: 'bull' | 'bear' | 'crab' | 'volatile';
  conversationHistory: string[];
}

export interface DialogueRequest {
  context: DialogueContext;
  promptType: DialoguePromptType;
  additionalContext?: string;
}

export type DialoguePromptType =
  | 'greeting'
  | 'farewell'
  | 'idle_chat'
  | 'market_reaction'
  | 'crisis_discussion'
  | 'gift_reaction'
  | 'memory_reference'
  | 'gossip'
  | 'advice'
  | 'complaint'
  | 'celebration';

export interface DialogueResponse {
  text: string;
  emotion: string;
  followUpTopics: string[];
  usedLLM: boolean;
  tokensUsed?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: LLMConfig = {
  enabled: false,
  provider: 'mock',
  maxTokens: 100,
  temperature: 0.7,
  rateLimit: {
    requestsPerMinute: 10,
    tokensPerDay: 10000,
  },
};

/**
 * System prompt for NPC dialogue generation
 */
const SYSTEM_PROMPT = `You are a dialogue generator for NPCs in CryptoCity, a city-builder game with cryptocurrency themes.

Your responses should be:
- In-character for the NPC's personality and occupation
- Short (1-3 sentences max)
- Crypto-native (use appropriate slang when fitting the character)
- Emotionally appropriate to the situation
- Never break the fourth wall
- Never use explicit content or slurs

Crypto slang examples: WAGMI, NGMI, rug pull, diamond hands, paper hands, moon, degen, ser, fren, gm, probably nothing, few understand, touch grass

DO NOT include quotation marks around the dialogue. Just output the NPC's words directly.`;

// =============================================================================
// FALLBACK TEMPLATES
// =============================================================================

/**
 * Template-based fallbacks when LLM is unavailable or rate-limited
 */
const FALLBACK_TEMPLATES: Record<DialoguePromptType, Record<string, string[]>> = {
  greeting: {
    happy: ["Hey! Great to see you!", "What's up? Ready for gains?", "Gm! How's the portfolio?"],
    neutral: ["Oh, hey.", "What's going on?", "Sup."],
    sad: ["Hey...", "Oh. It's you.", "*sighs* Hi."],
  },
  farewell: {
    happy: ["See you around!", "WAGMI! Catch you later!", "Stay based!"],
    neutral: ["Later.", "See ya.", "Bye."],
    sad: ["Whatever.", "Yeah, bye.", "*walks away*"],
  },
  idle_chat: {
    happy: ["Can you believe this market? Things are looking up!", "Life is good, you know?", "Having a great day!"],
    neutral: ["Just another day in crypto...", "Charts are charting.", "Same old, same old."],
    sad: ["Markets are rough right now.", "I've seen better days.", "Don't really feel like talking."],
  },
  market_reaction: {
    bull: ["LFG! Everything is pumping!", "We're all gonna make it!", "This is it! The flippening!"],
    bear: ["Not looking great out there.", "Hopefully just a dip...", "Diamond hands, I guess."],
    crab: ["Going sideways. Boring.", "When moon? When moon...", "This crab market is killing me."],
    volatile: ["What a rollercoaster!", "My heart can't take this.", "Up, down, up, down..."],
  },
  crisis_discussion: {
    default: ["It's been rough...", "I'm going through some stuff.", "Not my best week."],
  },
  gift_reaction: {
    default: ["Thanks for thinking of me.", "Oh, a gift? Interesting.", "You got me something?"],
  },
  memory_reference: {
    default: ["Remember when...", "That reminds me of before.", "We've come a long way."],
  },
  gossip: {
    default: ["Did you hear?", "Between us...", "So I heard something interesting."],
  },
  advice: {
    default: ["Here's what I think...", "My two sats?", "Word of advice:"],
  },
  complaint: {
    default: ["Don't even get me started.", "Ugh, this again.", "Can you believe it?"],
  },
  celebration: {
    default: ["Amazing!", "This calls for celebration!", "WAGMI!"],
  },
};

// =============================================================================
// RATE LIMITER
// =============================================================================

interface RateLimitState {
  requestsThisMinute: number;
  tokensToday: number;
  minuteStartTime: number;
  dayStartTime: number;
}

let rateLimitState: RateLimitState = {
  requestsThisMinute: 0,
  tokensToday: 0,
  minuteStartTime: Date.now(),
  dayStartTime: Date.now(),
};

function checkRateLimit(config: LLMConfig): boolean {
  const now = Date.now();
  
  // Reset minute counter
  if (now - rateLimitState.minuteStartTime > 60000) {
    rateLimitState.requestsThisMinute = 0;
    rateLimitState.minuteStartTime = now;
  }
  
  // Reset day counter
  if (now - rateLimitState.dayStartTime > 86400000) {
    rateLimitState.tokensToday = 0;
    rateLimitState.dayStartTime = now;
  }
  
  return (
    rateLimitState.requestsThisMinute < config.rateLimit.requestsPerMinute &&
    rateLimitState.tokensToday < config.rateLimit.tokensPerDay
  );
}

function recordUsage(tokens: number): void {
  rateLimitState.requestsThisMinute++;
  rateLimitState.tokensToday += tokens;
}

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

/**
 * Build the user prompt for dialogue generation
 */
function buildUserPrompt(request: DialogueRequest): string {
  const { context, promptType, additionalContext } = request;
  const { npc, player, situation } = context;
  
  let prompt = `Generate a ${promptType} dialogue line for this NPC:\n\n`;
  
  prompt += `NPC Name: ${npc.name}\n`;
  prompt += `Occupation: ${npc.occupation}\n`;
  prompt += `Personality: ${npc.personalityTraits.join(', ')}\n`;
  prompt += `Speaking Style: ${npc.speakingStyle}\n`;
  prompt += `Crypto Knowledge: ${npc.cryptoKnowledge}\n`;
  prompt += `Current Mood: ${npc.currentMood}\n`;
  prompt += `Relationship with Player: ${npc.relationshipWithPlayer}/100\n\n`;
  
  prompt += `Situation:\n`;
  prompt += `- Location: ${situation.location}\n`;
  prompt += `- Time: ${situation.timeOfDay}\n`;
  prompt += `- Market: ${situation.marketCondition}\n`;
  
  if (situation.recentCityEvents.length > 0) {
    prompt += `- Recent Events: ${situation.recentCityEvents.slice(0, 3).join('; ')}\n`;
  }
  
  if (context.memories.length > 0) {
    prompt += `\nRelevant Memories:\n`;
    context.memories.slice(0, 3).forEach(m => {
      prompt += `- ${m.description}\n`;
    });
  }
  
  if (context.currentCrisis) {
    prompt += `\nCurrently experiencing: ${context.currentCrisis.description}\n`;
  }
  
  if (additionalContext) {
    prompt += `\nAdditional Context: ${additionalContext}\n`;
  }
  
  prompt += `\nGenerate a single, short dialogue line (1-3 sentences). No quotes.`;
  
  return prompt;
}

// =============================================================================
// LLM PROVIDERS
// =============================================================================

/**
 * Mock provider for testing
 */
async function mockProvider(request: DialogueRequest): Promise<DialogueResponse> {
  const { context, promptType } = request;
  const mood = context.npc.currentMood;
  
  const templates = FALLBACK_TEMPLATES[promptType];
  const moodTemplates = templates[mood] || templates['default'] || templates['neutral'] || [];
  const text = moodTemplates[Math.floor(Math.random() * moodTemplates.length)] || "...";
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    text,
    emotion: mood,
    followUpTopics: [],
    usedLLM: false,
    tokensUsed: 0,
  };
}

/**
 * OpenAI provider
 */
async function openAIProvider(
  request: DialogueRequest,
  config: LLMConfig
): Promise<DialogueResponse> {
  if (!config.apiKey) throw new Error('OpenAI API key required');
  
  const response = await fetch(config.apiEndpoint || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(request) },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  const tokensUsed = data.usage?.total_tokens || 0;
  
  recordUsage(tokensUsed);
  
  return {
    text: text.trim(),
    emotion: request.context.npc.currentMood,
    followUpTopics: [],
    usedLLM: true,
    tokensUsed,
  };
}

/**
 * Anthropic provider
 */
async function anthropicProvider(
  request: DialogueRequest,
  config: LLMConfig
): Promise<DialogueResponse> {
  if (!config.apiKey) throw new Error('Anthropic API key required');
  
  const response = await fetch(config.apiEndpoint || 'https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-haiku-20240307',
      max_tokens: config.maxTokens,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(request) },
      ],
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const text = data.content[0]?.text || '';
  const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
  
  recordUsage(tokensUsed);
  
  return {
    text: text.trim(),
    emotion: request.context.npc.currentMood,
    followUpTopics: [],
    usedLLM: true,
    tokensUsed,
  };
}

// =============================================================================
// MAIN API
// =============================================================================

let currentConfig: LLMConfig = { ...DEFAULT_CONFIG };

/**
 * Configure LLM integration
 */
export function configureLLM(config: Partial<LLMConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get current LLM configuration
 */
export function getLLMConfig(): LLMConfig {
  return { ...currentConfig };
}

/**
 * Generate dialogue using LLM or fallback
 */
export async function generateDialogue(
  request: DialogueRequest
): Promise<DialogueResponse> {
  // Always use fallback if LLM is disabled
  if (!currentConfig.enabled) {
    return mockProvider(request);
  }
  
  // Check rate limits
  if (!checkRateLimit(currentConfig)) {
    console.warn('LLM rate limit reached, using fallback');
    return mockProvider(request);
  }
  
  try {
    switch (currentConfig.provider) {
      case 'openai':
        return await openAIProvider(request, currentConfig);
      
      case 'anthropic':
        return await anthropicProvider(request, currentConfig);
      
      case 'mock':
      default:
        return mockProvider(request);
    }
  } catch (error) {
    console.error('LLM provider error:', error);
    return mockProvider(request);
  }
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(): {
  requestsRemaining: number;
  tokensRemaining: number;
  resetsIn: { minutes: number; hours: number };
} {
  const now = Date.now();
  
  return {
    requestsRemaining: Math.max(0, currentConfig.rateLimit.requestsPerMinute - rateLimitState.requestsThisMinute),
    tokensRemaining: Math.max(0, currentConfig.rateLimit.tokensPerDay - rateLimitState.tokensToday),
    resetsIn: {
      minutes: Math.ceil((60000 - (now - rateLimitState.minuteStartTime)) / 60000),
      hours: Math.ceil((86400000 - (now - rateLimitState.dayStartTime)) / 3600000),
    },
  };
}

/**
 * Create dialogue context from NPC and game state
 */
export function createDialogueContext(
  npc: CryptoNPC,
  playerRelationship: number,
  location: string,
  timeOfDay: string,
  marketCondition: 'bull' | 'bear' | 'crab' | 'volatile',
  memories: DialogueMemory[] = [],
  currentCrisis?: PersonalCrisis
): DialogueContext {
  // Map personality to traits
  const traits: string[] = [];
  const p = npc.personality;
  
  if (p?.bigFive) {
    if (p.bigFive.extraversion > 0.7) traits.push('outgoing');
    if (p.bigFive.extraversion < 0.3) traits.push('introverted');
    if (p.bigFive.agreeableness > 0.7) traits.push('friendly');
    if (p.bigFive.agreeableness < 0.3) traits.push('blunt');
    if (p.bigFive.conscientiousness > 0.7) traits.push('careful');
    if (p.bigFive.neuroticism > 0.7) traits.push('anxious');
    if (p.bigFive.openness > 0.7) traits.push('curious');
  }
  
  // Determine speaking style
  let speakingStyle = 'casual';
  if (npc.occupation === 'developer') speakingStyle = 'technical';
  if (npc.occupation === 'trader') speakingStyle = 'finance-bro';
  if (npc.occupation === 'artist') speakingStyle = 'creative';
  if (p?.crypto?.degenLevel && p.crypto.degenLevel > 0.8) speakingStyle = 'degen';
  
  // Determine crypto knowledge
  let cryptoKnowledge: NPCDialogueProfile['cryptoKnowledge'] = 'intermediate';
  if (p?.crypto?.technicalKnowledge) {
    if (p.crypto.technicalKnowledge > 0.8) cryptoKnowledge = 'expert';
    else if (p.crypto.technicalKnowledge > 0.5) cryptoKnowledge = 'intermediate';
    else cryptoKnowledge = 'novice';
  }
  if (p?.crypto?.degenLevel && p.crypto.degenLevel > 0.9) cryptoKnowledge = 'degen';
  
  // Determine mood from needs
  let currentMood = 'neutral';
  if (npc.needs) {
    const avgNeed = (
      (npc.needs.fun?.current || 50) +
      (npc.needs.social?.current || 50) +
      (npc.needs.wealth?.current || 50)
    ) / 3;
    
    if (avgNeed > 70) currentMood = 'happy';
    else if (avgNeed < 30) currentMood = 'sad';
  }
  
  return {
    npc: {
      name: npc.name,
      occupation: npc.occupation,
      personalityTraits: traits,
      speakingStyle,
      cryptoKnowledge,
      currentMood,
      relationshipWithPlayer: playerRelationship,
      dialogueSeeds: npc.ingestedProfile?.dialogueSeeds,
    },
    player: {
      recentActions: [],
      reputation: 50,
      knownPreferences: [],
    },
    situation: {
      location,
      timeOfDay,
      recentCityEvents: [],
      marketCondition,
      conversationHistory: [],
    },
    memories,
    currentCrisis,
  };
}
