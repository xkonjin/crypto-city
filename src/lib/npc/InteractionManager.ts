/**
 * InteractionManager - Manages NPC social interactions
 * 
 * This manager handles:
 * - Determining when NPCs should initiate interactions
 * - Selecting appropriate interaction targets
 * - Choosing interaction types based on personality and relationships
 * - Processing interactions and determining outcomes
 * - Applying effects to relationships and needs
 * - Generating placeholder dialogue
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import {
  InteractionType,
  InteractionRequest,
  InteractionResult,
  NPCRelationship,
  ACCEPTANCE_WEIGHTS,
  INTERACTION_EFFECTS,
  SOCIAL_SATISFACTION,
  ALL_INTERACTION_TYPES,
  createDefaultInteractionRelationship,
  getRelationshipKey,
  clampRelationshipValue,
  randomInRange,
} from './interactions';

/**
 * Dialogue templates for different interaction types.
 * Uses %INITIATOR% and %TARGET% as placeholders for NPC names.
 */
const DIALOGUE_TEMPLATES: Record<InteractionType, { success: string[]; failure: string[] }> = {
  greet: {
    success: [
      "%INITIATOR%: 'Yo, wagmi!'",
      "%TARGET%: 'LFG! Good to see you.'",
    ],
    failure: [
      "%INITIATOR%: 'Hey—'",
      "%TARGET%: *walks away without acknowledging*",
    ],
  },
  chat: {
    success: [
      "%INITIATOR%: 'Did you see the charts today?'",
      "%TARGET%: 'Number go up is my favorite number.'",
      "%INITIATOR%: 'Based.'",
    ],
    failure: [
      "%INITIATOR%: 'So, about the market...'",
      "%TARGET%: 'I'm not really in the mood for small talk.'",
    ],
  },
  gossip: {
    success: [
      "%INITIATOR%: 'Did you hear about that whale wallet?'",
      "%TARGET%: 'No! Spill the alpha!'",
      "%INITIATOR%: 'They're accumulating hard. Very bullish.'",
    ],
    failure: [
      "%INITIATOR%: 'I heard something interesting...'",
      "%TARGET%: 'I don't do rumors. DYOR or gtfo.'",
    ],
  },
  debate: {
    success: [
      "%INITIATOR%: 'BTC is the only real store of value.'",
      "%TARGET%: 'ETH has more utility though.'",
      "%INITIATOR%: 'Fair point. We can both be right.'",
    ],
    failure: [
      "%INITIATOR%: 'Your coin is basically a scam.'",
      "%TARGET%: 'NGMI with that attitude. I'm done here.'",
    ],
  },
  flirt: {
    success: [
      "%INITIATOR%: 'Are you a smart contract? Because you've got my interest locked up.'",
      "%TARGET%: *blushes* 'That's... actually kind of sweet.'",
    ],
    failure: [
      "%INITIATOR%: 'Is your name ETH? Because you've got me burning gas.'",
      "%TARGET%: 'Sir, this is a DEX.'",
    ],
  },
  argue: {
    success: [
      "%INITIATOR%: 'You're completely wrong about this!'",
      "%TARGET%: 'Maybe, but at least I have conviction.'",
      "*They part ways with grudging respect*",
    ],
    failure: [
      "%INITIATOR%: 'I can't believe you're defending that position!'",
      "%TARGET%: 'And I can't believe you exist. Blocked.'",
    ],
  },
  trade_talk: {
    success: [
      "%INITIATOR%: 'What's your take on the market?'",
      "%TARGET%: 'Accumulation phase. DCA is the way.'",
      "%INITIATOR%: 'This is the way.'",
    ],
    failure: [
      "%INITIATOR%: 'Want to talk trading strategies?'",
      "%TARGET%: 'My strategy is none of your business.'",
    ],
  },
  share_alpha: {
    success: [
      "%INITIATOR%: 'I've got some alpha for you...'",
      "%TARGET%: 'I'm all ears.'",
      "%INITIATOR%: *shares valuable information*",
      "%TARGET%: 'This is gold. Thank you, fren.'",
    ],
    failure: [
      "%INITIATOR%: 'I've got some alpha—'",
      "%TARGET%: 'The last alpha you shared dumped 90%.'",
    ],
  },
  ask_favor: {
    success: [
      "%INITIATOR%: 'Hey, could you help me out with something?'",
      "%TARGET%: 'Of course, frens help frens.'",
    ],
    failure: [
      "%INITIATOR%: 'I need a favor...'",
      "%TARGET%: 'Sorry, I'm already overleveraged.'",
    ],
  },
  do_favor: {
    success: [
      "%INITIATOR%: 'Let me help you with that.'",
      "%TARGET%: 'Really? That's very based of you.'",
      "%INITIATOR%: 'WAGMI, fren.'",
    ],
    failure: [
      "%INITIATOR%: 'I could help you—'",
      "%TARGET%: 'No thanks, I prefer self-custody.'",
    ],
  },
  celebrate: {
    success: [
      "%INITIATOR%: 'We're all gonna make it!'",
      "%TARGET%: 'LFG! 🚀'",
      "*They celebrate together*",
    ],
    failure: [
      "%INITIATOR%: 'Want to celebrate the gains?'",
      "%TARGET%: 'What gains? I bought the top.'",
    ],
  },
  console: {
    success: [
      "%INITIATOR%: 'Hey, you okay? Markets are rough.'",
      "%TARGET%: 'It's been hard...'",
      "%INITIATOR%: 'Diamond hands, fren. We'll get through this.'",
    ],
    failure: [
      "%INITIATOR%: 'You look down. Want to talk?'",
      "%TARGET%: 'I don't need your pity. I'm fine.'",
    ],
  },
  insult: {
    success: [
      "%INITIATOR%: 'Your portfolio is as trash as your opinions.'",
      "%TARGET%: *stunned silence*",
      "%INITIATOR%: 'NGMI.'",
    ],
    failure: [
      "%INITIATOR%: 'You're literally the worst—'",
      "%TARGET%: 'I'm rubber, you're glue. Also, blocked.'",
    ],
  },
};

/**
 * InteractionManager handles all NPC social interactions.
 */
export class InteractionManager {
  /** Store of relationships between NPCs */
  private relationships: Map<string, NPCRelationship> = new Map();

  /**
   * Determine if an NPC should initiate a social interaction.
   * Based primarily on their social need level.
   * 
   * @param npc - The NPC to check
   * @returns Whether the NPC should try to interact
   */
  shouldInitiateInteraction(npc: CryptoNPC): boolean {
    const socialNeed = npc.needs.social.current;
    const threshold = npc.needs.social.criticalThreshold + 20; // Want to interact before critical
    
    // Higher chance when social need is lower
    if (socialNeed <= npc.needs.social.criticalThreshold) {
      return Math.random() < 0.8;  // 80% chance when critical
    }
    
    if (socialNeed <= threshold) {
      return Math.random() < 0.5;  // 50% chance when getting low
    }
    
    // Extraverts still want to interact even with high social
    const extraversion = npc.personality.bigFive.extraversion;
    if (socialNeed > 70) {
      return Math.random() < extraversion * 0.3;  // Up to 30% for max extraversion
    }
    
    return Math.random() < 0.2;  // 20% base chance
  }

  /**
   * Select an appropriate interaction target from nearby NPCs.
   * Prefers NPCs with existing relationships or compatible personalities.
   * 
   * @param npc - The initiating NPC
   * @param nearbyNPCs - Array of NPCs that are nearby
   * @returns Selected target or null if none suitable
   */
  selectInteractionTarget(npc: CryptoNPC, nearbyNPCs: CryptoNPC[]): CryptoNPC | null {
    // Filter out self
    const candidates = nearbyNPCs.filter(candidate => candidate.id !== npc.id);
    
    if (candidates.length === 0) {
      return null;
    }
    
    // Score each candidate
    const scored = candidates.map(candidate => {
      let score = 10;  // Base score
      
      // Bonus for existing relationship
      const relationship = this.getRelationship(npc.id, candidate.id);
      score += relationship.familiarity * 0.2;
      score += relationship.trust * 0.1;
      
      // Bonus for compatible personality (similar extraversion)
      const extraversionDiff = Math.abs(
        npc.personality.bigFive.extraversion - 
        candidate.personality.bigFive.extraversion
      );
      score += (1 - extraversionDiff) * 5;
      
      // Add some randomness
      score += Math.random() * 10;
      
      return { candidate, score };
    });
    
    // Sort by score and return top candidate
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.candidate || null;
  }

  /**
   * Select an appropriate interaction type based on relationship and personality.
   * 
   * @param npc - The initiating NPC
   * @param target - The target NPC
   * @returns The interaction type to attempt
   */
  selectInteractionType(npc: CryptoNPC, target: CryptoNPC): InteractionType {
    const relationship = this.getRelationship(npc.id, target.id);
    const personality = npc.personality;
    
    // Build weighted options
    const weights: Array<{ type: InteractionType; weight: number }> = [];
    
    // Enemies more likely to argue/insult
    if (relationship.trust < -30) {
      if (Math.random() < 0.7) {
        return Math.random() < 0.7 ? 'argue' : 'insult';
      }
    }
    
    // High attraction → flirt
    if (relationship.attraction > 40 && Math.random() < 0.3) {
      return 'flirt';
    }
    
    // High extraversion → more social interactions
    if (personality.bigFive.extraversion > 0.7) {
      weights.push({ type: 'chat', weight: 3 });
      weights.push({ type: 'gossip', weight: 2 });
      weights.push({ type: 'celebrate', weight: 2 });
      weights.push({ type: 'trade_talk', weight: 2 });
    }
    
    // Low agreeableness → more confrontational
    if (personality.bigFive.agreeableness < 0.3) {
      weights.push({ type: 'debate', weight: 3 });
      weights.push({ type: 'argue', weight: 2 });
    } else if (personality.bigFive.agreeableness > 0.7) {
      // High agreeableness → more supportive
      weights.push({ type: 'chat', weight: 2 });
      weights.push({ type: 'do_favor', weight: 2 });
      weights.push({ type: 'console', weight: 2 });
      weights.push({ type: 'celebrate', weight: 2 });
    }
    
    // High risk tolerance → trade talk and alpha sharing
    if (personality.crypto.riskTolerance > 0.6) {
      weights.push({ type: 'trade_talk', weight: 3 });
      if (relationship.trust > 30) {
        weights.push({ type: 'share_alpha', weight: 2 });
      }
    }
    
    // Default weights if nothing specific applies
    if (weights.length === 0) {
      weights.push({ type: 'greet', weight: 3 });
      weights.push({ type: 'chat', weight: 4 });
      weights.push({ type: 'trade_talk', weight: 2 });
    }
    
    // Always add some default options
    weights.push({ type: 'greet', weight: 2 });
    weights.push({ type: 'chat', weight: 2 });
    
    // Select based on weights
    return this.weightedRandomSelect(weights);
  }

  /**
   * Select randomly from weighted options.
   */
  private weightedRandomSelect(options: Array<{ type: InteractionType; weight: number }>): InteractionType {
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const option of options) {
      random -= option.weight;
      if (random <= 0) {
        return option.type;
      }
    }
    
    return options[0]?.type || 'greet';
  }

  /**
   * Determine if target will accept the interaction.
   * 
   * @param target - The target NPC
   * @param request - The interaction request
   * @returns Whether the target accepts
   */
  willAcceptInteraction(target: CryptoNPC, request: InteractionRequest): boolean {
    const weights = ACCEPTANCE_WEIGHTS[request.type];
    const relationship = this.getRelationship(request.initiatorId, request.targetId);
    
    // Calculate acceptance probability
    let probability = weights.base;
    
    // Apply trust modifier
    // Trust ranges from -100 to 100, normalize to -1 to 1
    const normalizedTrust = relationship.trust / 100;
    probability += weights.trustMod * normalizedTrust;
    
    // For flirt, also consider attraction
    if (request.type === 'flirt') {
      const normalizedAttraction = relationship.attraction / 100;
      probability += normalizedAttraction * 0.3;
    }
    
    // Personality modifiers
    if (target.personality.bigFive.agreeableness > 0.7) {
      probability += 0.1;  // More agreeable = more accepting
    }
    
    // Mood modifier (low fun = less accepting)
    const moodFactor = (target.needs.fun.current / 100) * 0.1;
    probability += moodFactor - 0.05;  // ±5% based on mood
    
    // Clamp to valid range
    probability = Math.max(0, Math.min(1, probability));
    
    return Math.random() < probability;
  }

  /**
   * Process an interaction and generate results.
   * 
   * @param request - The interaction request
   * @param initiator - The initiating NPC
   * @param target - The target NPC
   * @returns The interaction result
   */
  processInteraction(
    request: InteractionRequest,
    initiator: CryptoNPC,
    target: CryptoNPC
  ): InteractionResult {
    const accepted = this.willAcceptInteraction(target, request);
    const effects = INTERACTION_EFFECTS[request.type];
    
    // Calculate success (accepted interactions can still fail based on compatibility)
    let success = accepted;
    if (accepted) {
      // Additional success check based on personality compatibility
      const compatibility = this.calculateCompatibility(initiator, target, request.type);
      success = Math.random() < (0.5 + compatibility * 0.5);
    }
    
    const effectSet = success ? effects.success : effects.failure;
    
    // Generate relationship changes
    const relationshipChanges = {
      trust: Math.round(randomInRange(effectSet.trust[0], effectSet.trust[1])),
      respect: Math.round(randomInRange(effectSet.respect[0], effectSet.respect[1])),
      familiarity: Math.round(randomInRange(effectSet.familiarity[0], effectSet.familiarity[1])),
      attraction: Math.round(randomInRange(effectSet.attraction[0], effectSet.attraction[1])),
    };
    
    // Generate mood effect
    const moodEffect = randomInRange(effectSet.moodEffect[0], effectSet.moodEffect[1]);
    
    // Generate memory descriptions
    const memoriesCreated = this.generateMemoryDescriptions(
      request,
      success,
      initiator,
      target
    );
    
    return {
      success,
      type: request.type,
      participants: [initiator.id, target.id],
      relationshipChanges,
      memoriesCreated,
      moodEffect,
    };
  }

  /**
   * Calculate personality compatibility for an interaction type.
   * Returns -1 to 1 where higher is better.
   */
  private calculateCompatibility(
    initiator: CryptoNPC,
    target: CryptoNPC,
    type: InteractionType
  ): number {
    const i = initiator.personality;
    const t = target.personality;
    let compatibility = 0;
    
    // Base compatibility from agreeableness
    compatibility += (i.bigFive.agreeableness + t.bigFive.agreeableness) / 4;
    
    // Type-specific modifiers
    switch (type) {
      case 'debate':
        // Debates work better with lower neuroticism
        compatibility -= (i.bigFive.neuroticism + t.bigFive.neuroticism) / 4;
        break;
      case 'flirt':
        // Flirting needs extraversion
        compatibility += (i.bigFive.extraversion + t.bigFive.extraversion) / 4;
        break;
      case 'trade_talk':
      case 'share_alpha':
        // Trading conversations need similar risk profiles
        const riskDiff = Math.abs(i.crypto.riskTolerance - t.crypto.riskTolerance);
        compatibility -= riskDiff / 2;
        break;
      case 'argue':
      case 'insult':
        // Negative interactions have lower base compatibility
        compatibility -= 0.3;
        break;
    }
    
    // Mood impacts
    const initiatorMood = initiator.needs.fun.current / 100;
    const targetMood = target.needs.fun.current / 100;
    compatibility += (initiatorMood + targetMood - 1) * 0.2;
    
    return Math.max(-1, Math.min(1, compatibility));
  }

  /**
   * Generate memory descriptions for the interaction.
   */
  private generateMemoryDescriptions(
    request: InteractionRequest,
    success: boolean,
    initiator: CryptoNPC,
    target: CryptoNPC
  ): string[] {
    const memories: string[] = [];
    const outcome = success ? 'positive' : 'negative';
    
    const memoryTemplates: Record<InteractionType, { positive: string; negative: string }> = {
      greet: {
        positive: `Had a friendly greeting with ${target.name}`,
        negative: `Was ignored by ${target.name} when trying to say hello`,
      },
      chat: {
        positive: `Had a pleasant conversation with ${target.name}`,
        negative: `Awkward chat with ${target.name} that didn't go well`,
      },
      gossip: {
        positive: `Shared interesting gossip with ${target.name}`,
        negative: `${target.name} wasn't receptive to gossip`,
      },
      debate: {
        positive: `Had an engaging debate with ${target.name}`,
        negative: `Heated argument with ${target.name} about crypto`,
      },
      flirt: {
        positive: `Flirted successfully with ${target.name}`,
        negative: `Flirting attempt with ${target.name} was awkward`,
      },
      argue: {
        positive: `Argued with ${target.name} but maintained some respect`,
        negative: `Big argument with ${target.name} - things got heated`,
      },
      trade_talk: {
        positive: `Good trading discussion with ${target.name}`,
        negative: `Trading talk with ${target.name} didn't go well`,
      },
      share_alpha: {
        positive: `Shared valuable alpha with ${target.name}`,
        negative: `${target.name} didn't appreciate the alpha`,
      },
      ask_favor: {
        positive: `${target.name} agreed to help`,
        negative: `${target.name} refused to help`,
      },
      do_favor: {
        positive: `Helped ${target.name} out`,
        negative: `Tried to help ${target.name} but it wasn't wanted`,
      },
      celebrate: {
        positive: `Celebrated together with ${target.name}`,
        negative: `${target.name} wasn't in the mood to celebrate`,
      },
      console: {
        positive: `Comforted ${target.name} during a tough time`,
        negative: `${target.name} didn't want to be comforted`,
      },
      insult: {
        positive: `Insulted ${target.name} (felt cathartic)`,
        negative: `Insult backfired with ${target.name}`,
      },
    };
    
    memories.push(memoryTemplates[request.type][outcome]);
    
    return memories;
  }

  /**
   * Apply the effects of an interaction to both NPCs.
   * 
   * @param result - The interaction result
   * @param npc1 - First NPC
   * @param npc2 - Second NPC
   */
  applyInteractionEffects(
    result: InteractionResult,
    npc1: CryptoNPC,
    npc2: CryptoNPC
  ): void {
    // Update relationship
    const key = getRelationshipKey(npc1.id, npc2.id);
    const relationship = this.relationships.get(key) || createDefaultInteractionRelationship(npc1.id, npc2.id);
    
    // Apply relationship changes with clamping
    if (result.relationshipChanges.trust !== undefined) {
      relationship.trust = clampRelationshipValue(
        relationship.trust + result.relationshipChanges.trust,
        'trust'
      );
    }
    if (result.relationshipChanges.respect !== undefined) {
      relationship.respect = clampRelationshipValue(
        relationship.respect + result.relationshipChanges.respect,
        'respect'
      );
    }
    if (result.relationshipChanges.familiarity !== undefined) {
      relationship.familiarity = clampRelationshipValue(
        relationship.familiarity + result.relationshipChanges.familiarity,
        'familiarity'
      );
    }
    if (result.relationshipChanges.attraction !== undefined) {
      relationship.attraction = clampRelationshipValue(
        relationship.attraction + result.relationshipChanges.attraction,
        'attraction'
      );
    }
    
    // Update interaction tracking
    relationship.interactionCount += 1;
    relationship.lastInteraction = Date.now();
    
    // Store updated relationship
    this.relationships.set(key, relationship);
    
    // Update social need for both NPCs
    const socialSatisfaction = SOCIAL_SATISFACTION[result.type];
    if (result.success) {
      npc1.needs.social.current = Math.min(
        npc1.needs.social.max,
        npc1.needs.social.current + socialSatisfaction
      );
      npc2.needs.social.current = Math.min(
        npc2.needs.social.max,
        npc2.needs.social.current + socialSatisfaction * 0.7  // Target gets less
      );
    } else {
      // Failed interactions still provide some social need
      npc1.needs.social.current = Math.min(
        npc1.needs.social.max,
        npc1.needs.social.current + socialSatisfaction * 0.3
      );
      npc2.needs.social.current = Math.min(
        npc2.needs.social.max,
        npc2.needs.social.current + socialSatisfaction * 0.2
      );
    }
  }

  /**
   * Generate dialogue for an interaction (placeholder for LLM integration).
   * 
   * @param request - The interaction request
   * @param result - The interaction result
   * @param initiator - The initiating NPC
   * @param target - The target NPC
   * @returns Array of dialogue lines
   */
  generateDialogue(
    request: InteractionRequest,
    result: InteractionResult,
    initiator: CryptoNPC,
    target: CryptoNPC
  ): string[] {
    const templates = DIALOGUE_TEMPLATES[request.type];
    const dialogueSet = result.success ? templates.success : templates.failure;
    
    // Replace placeholders with actual names
    return dialogueSet.map(line =>
      line
        .replace(/%INITIATOR%/g, initiator.name)
        .replace(/%TARGET%/g, target.name)
    );
  }

  /**
   * Get the relationship between two NPCs.
   * Creates a default relationship if none exists.
   * 
   * @param npcId1 - First NPC ID
   * @param npcId2 - Second NPC ID
   * @returns The relationship between the NPCs
   */
  getRelationship(npcId1: string, npcId2: string): NPCRelationship {
    const key = getRelationshipKey(npcId1, npcId2);
    return this.relationships.get(key) || createDefaultInteractionRelationship(npcId1, npcId2);
  }

  /**
   * Set a relationship between two NPCs (for testing or initialization).
   * 
   * @param npcId1 - First NPC ID
   * @param npcId2 - Second NPC ID
   * @param values - Values to set on the relationship
   */
  setRelationship(
    npcId1: string,
    npcId2: string,
    values: Partial<Omit<NPCRelationship, 'npcId1' | 'npcId2'>>
  ): void {
    const key = getRelationshipKey(npcId1, npcId2);
    const existing = this.relationships.get(key) || createDefaultInteractionRelationship(npcId1, npcId2);
    
    this.relationships.set(key, {
      ...existing,
      ...values,
    });
  }

  /**
   * Get all relationships for an NPC.
   * 
   * @param npcId - The NPC ID
   * @returns Array of relationships involving this NPC
   */
  getRelationshipsForNPC(npcId: string): NPCRelationship[] {
    return Array.from(this.relationships.values()).filter(
      (relationship) => relationship.npcId1 === npcId || relationship.npcId2 === npcId
    );
  }

  /**
   * Clear all relationships (for testing).
   */
  clearRelationships(): void {
    this.relationships.clear();
  }
}
