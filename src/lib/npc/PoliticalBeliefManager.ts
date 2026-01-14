/**
 * PoliticalBeliefManager - Manages NPC political belief formation and evolution
 * 
 * This manager handles:
 * - Initializing beliefs from personality traits
 * - Updating beliefs based on experiences
 * - Applying social influence from relationships
 * - Applying economic influence from wealth changes
 * - Calculating faction alignment
 * - Suggesting factions based on beliefs
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { EpisodicMemory } from './memory';
import type { Relationship } from './relationships';
import type { FactionIdeology } from './factions';
import type { NPCPersonality } from './personality';
import {
  PoliticalBeliefs,
  BeliefInfluence,
  BeliefType,
  ALL_BELIEF_TYPES,
  createDefaultPoliticalBeliefs,
  createBeliefInfluence,
} from './politicalBeliefs';

/**
 * Social influencer with relationship data
 */
export interface SocialInfluencer {
  npc: CryptoNPC;
  relationship: Relationship;
}

/**
 * Faction suggestion result
 */
export interface FactionSuggestion {
  id: string;
  alignment: number;
}

/**
 * Faction input for alignment calculation
 */
export interface FactionInput {
  id: string;
  ideology: FactionIdeology;
}

/**
 * Serialized manager state
 */
export interface SerializedPoliticalBeliefManager {
  influenceHistory: Record<string, BeliefInfluence[]>;
}

/**
 * Keywords in events that affect specific beliefs
 */
const EVENT_BELIEF_MAPPINGS: Record<string, { belief: BeliefType; direction: 'positive' | 'negative' }[]> = {
  // Centralization-related keywords
  'centralized': [{ belief: 'centralAuthority', direction: 'positive' }],
  'decentralized': [{ belief: 'centralAuthority', direction: 'negative' }, { belief: 'decentralizationPurity', direction: 'positive' }],
  'exchange': [{ belief: 'centralAuthority', direction: 'positive' }],
  'cex': [{ belief: 'centralAuthority', direction: 'positive' }],
  'dex': [{ belief: 'centralAuthority', direction: 'negative' }],
  
  // Privacy-related keywords
  'privacy': [{ belief: 'privacyImportance', direction: 'positive' }],
  'kyc': [{ belief: 'privacyImportance', direction: 'negative' }],
  'anonymous': [{ belief: 'privacyImportance', direction: 'positive' }],
  'surveillance': [{ belief: 'privacyImportance', direction: 'positive' }],
  
  // Governance-related keywords
  'dao': [{ belief: 'democraticParticipation', direction: 'positive' }, { belief: 'centralAuthority', direction: 'negative' }],
  'vote': [{ belief: 'democraticParticipation', direction: 'positive' }],
  'governance': [{ belief: 'democraticParticipation', direction: 'positive' }],
  'community': [{ belief: 'democraticParticipation', direction: 'positive' }],
  
  // Regulation-related keywords
  'regulation': [{ belief: 'regulationSupport', direction: 'positive' }],
  'compliance': [{ belief: 'regulationSupport', direction: 'positive' }],
  'banned': [{ belief: 'regulationSupport', direction: 'negative' }],
  'illegal': [{ belief: 'regulationSupport', direction: 'negative' }],
  
  // Economic keywords
  'redistribute': [{ belief: 'wealthRedistribution', direction: 'positive' }],
  'airdrop': [{ belief: 'wealthRedistribution', direction: 'positive' }],
  'tax': [{ belief: 'wealthRedistribution', direction: 'positive' }],
  'profit': [{ belief: 'wealthRedistribution', direction: 'negative' }],
};

/**
 * PoliticalBeliefManager handles all operations related to NPC political beliefs.
 */
export class PoliticalBeliefManager {
  /** Influence history for each NPC */
  private influenceHistory: Map<string, BeliefInfluence[]> = new Map();

  /**
   * Initialize political beliefs from an NPC's personality traits.
   * 
   * Mapping from personality to beliefs:
   * - Openness → Higher decentralizationPurity (open to new ideas)
   * - Conscientiousness → More stable beliefs, higher regulationSupport
   * - Extraversion → Higher democraticParticipation
   * - Agreeableness → Higher wealthRedistribution (cooperative)
   * - Neuroticism → More susceptible to belief changes
   * - Trust in institutions → Lower decentralizationPurity, lower privacyImportance
   * - Technical knowledge → Higher decentralizationPurity
   * 
   * @param npc - The NPC whose beliefs to initialize
   * @returns Initialized political beliefs
   */
  initializeBeliefsFromPersonality(npc: CryptoNPC): PoliticalBeliefs {
    const { bigFive, crypto } = npc.personality;

    // Calculate each belief based on personality traits
    const beliefs = createDefaultPoliticalBeliefs({
      // Wealth redistribution: high agreeableness = more sharing, low = more individualistic
      wealthRedistribution: this.calculateBeliefFromFactors([
        { value: bigFive.agreeableness, weight: 0.4 },
        { value: 1 - crypto.riskTolerance, weight: 0.2 }, // Risk-averse prefer safety nets
        { value: 0.5, weight: 0.4 }, // Base neutral
      ]),

      // Regulation support: conscientious people like rules, low trust dislikes regulation
      regulationSupport: this.calculateBeliefFromFactors([
        { value: bigFive.conscientiousness, weight: 0.3 },
        { value: crypto.trustInInstitutions, weight: 0.4 },
        { value: 1 - crypto.degenLevel, weight: 0.2 }, // Degens hate rules
        { value: 0.5, weight: 0.1 },
      ]),

      // Central authority: trust = central, low trust = decentralized
      centralAuthority: this.calculateBeliefFromFactors([
        { value: crypto.trustInInstitutions, weight: 0.5 },
        { value: 1 - bigFive.openness, weight: 0.2 }, // Open to new = decentralized
        { value: 1 - crypto.technicalKnowledge, weight: 0.2 }, // Technical = decentralized
        { value: 0.5, weight: 0.1 },
      ]),

      // Democratic participation: extraverts engage, conscientious follow through
      democraticParticipation: this.calculateBeliefFromFactors([
        { value: bigFive.extraversion, weight: 0.4 },
        { value: bigFive.conscientiousness, weight: 0.2 },
        { value: bigFive.agreeableness, weight: 0.2 }, // Community-minded
        { value: 0.5, weight: 0.2 },
      ]),

      // Decentralization purity: technical + low trust + open = purist
      decentralizationPurity: this.calculateBeliefFromFactors([
        { value: crypto.technicalKnowledge, weight: 0.3 },
        { value: 1 - crypto.trustInInstitutions, weight: 0.3 },
        { value: bigFive.openness, weight: 0.2 },
        { value: 0.5, weight: 0.2 },
      ]),

      // Privacy importance: low trust + neuroticism = more privacy-focused
      privacyImportance: this.calculateBeliefFromFactors([
        { value: 1 - crypto.trustInInstitutions, weight: 0.4 },
        { value: bigFive.neuroticism, weight: 0.2 }, // Anxious about surveillance
        { value: 1 - bigFive.extraversion, weight: 0.2 }, // Introverts value privacy
        { value: 0.5, weight: 0.2 },
      ]),
    });

    // Record the initial influence
    for (const belief of ALL_BELIEF_TYPES) {
      this.addInfluenceToHistory(npc.id, createBeliefInfluence({
        source: 'personality',
        sourceId: 'initial',
        belief,
        strength: beliefs[belief] - 0.5, // Deviation from neutral
      }));
    }

    return beliefs;
  }

  /**
   * Update beliefs based on an episodic memory/experience.
   * 
   * The emotional valence and importance of the memory determine
   * how much beliefs shift. Negative experiences with centralized
   * entities push toward decentralization, etc.
   * 
   * @param npc - The NPC whose beliefs to update
   * @param experience - The memory/experience affecting beliefs
   * @returns Updated beliefs
   */
  updateBeliefFromExperience(npc: CryptoNPC, experience: EpisodicMemory): PoliticalBeliefs {
    if (!npc.politicalBeliefs) {
      npc.politicalBeliefs = createDefaultPoliticalBeliefs();
    }

    const eventLower = experience.event.toLowerCase();
    const stabilityFactor = this.getStabilityFactor(npc.personality);
    
    // Base shift magnitude from importance and emotional valence
    const baseMagnitude = (experience.importance / 10) * 0.1 * (1 - stabilityFactor * 0.5);

    // Find relevant keywords and apply belief shifts
    for (const [keyword, mappings] of Object.entries(EVENT_BELIEF_MAPPINGS)) {
      if (eventLower.includes(keyword)) {
        for (const mapping of mappings) {
          // Direction depends on emotional valence
          // Positive experience with centralized = more central
          // Negative experience with centralized = less central
          let shiftDirection: number;
          if (mapping.direction === 'positive') {
            shiftDirection = experience.emotionalValence > 0 ? 1 : -1;
          } else {
            shiftDirection = experience.emotionalValence > 0 ? -1 : 1;
          }

          const shift = baseMagnitude * shiftDirection * Math.abs(experience.emotionalValence);
          npc.politicalBeliefs[mapping.belief] = this.clampBelief(
            npc.politicalBeliefs[mapping.belief] + shift
          );

          this.addInfluenceToHistory(npc.id, createBeliefInfluence({
            source: 'experience',
            sourceId: experience.id,
            belief: mapping.belief,
            strength: shift,
          }));
        }
      }
    }

    // Generic shifts based on experience type
    // Negative experiences generally increase skepticism
    if (experience.emotionalValence < -0.5 && experience.importance >= 6) {
      const skepticismShift = baseMagnitude * Math.abs(experience.emotionalValence);
      npc.politicalBeliefs.centralAuthority = this.clampBelief(
        npc.politicalBeliefs.centralAuthority - skepticismShift * 0.3
      );
      npc.politicalBeliefs.privacyImportance = this.clampBelief(
        npc.politicalBeliefs.privacyImportance + skepticismShift * 0.2
      );
    }

    // Positive community experiences increase democratic participation
    if (experience.emotionalValence > 0.5 && experience.participants.length >= 2) {
      const communityShift = baseMagnitude * experience.emotionalValence * 0.3;
      npc.politicalBeliefs.democraticParticipation = this.clampBelief(
        npc.politicalBeliefs.democraticParticipation + communityShift
      );
    }

    return npc.politicalBeliefs;
  }

  /**
   * Apply social influence from friends and social network.
   * 
   * NPCs are influenced by those they trust and respect.
   * The influence is weighted by trust and respect levels.
   * Enemies can have reverse influence.
   * 
   * @param npc - The NPC being influenced
   * @param influencers - List of influencing NPCs with relationships
   */
  applySocialInfluence(npc: CryptoNPC, influencers: SocialInfluencer[]): void {
    if (!npc.politicalBeliefs) {
      npc.politicalBeliefs = createDefaultPoliticalBeliefs();
    }

    const stabilityFactor = this.getStabilityFactor(npc.personality);
    const susceptibility = this.getSusceptibilityFactor(npc.personality);

    for (const { npc: influencer, relationship } of influencers) {
      if (!influencer.politicalBeliefs) continue;

      // Calculate influence weight from relationship metrics
      // Trust and respect are most important
      const trustWeight = relationship.trust / 100; // -1 to 1
      const respectWeight = relationship.respect / 100; // -1 to 1
      const familiarityWeight = relationship.familiarity / 100; // 0 to 1

      // Combined weight: high trust + high respect = strong influence
      // Negative trust can reverse influence
      const combinedWeight = (trustWeight * 0.5 + respectWeight * 0.4 + familiarityWeight * 0.1);
      
      // Base influence magnitude
      const baseMagnitude = 0.05 * susceptibility * (1 - stabilityFactor * 0.3);

      for (const belief of ALL_BELIEF_TYPES) {
        const beliefDiff = influencer.politicalBeliefs[belief] - npc.politicalBeliefs[belief];
        
        // If trust is negative, resist or reverse the influence
        let shift: number;
        if (combinedWeight < 0) {
          // Enemy influence: might move opposite direction
          shift = beliefDiff * baseMagnitude * combinedWeight * 0.5; // Reduced effect
        } else {
          // Friend influence: move toward their beliefs
          shift = beliefDiff * baseMagnitude * combinedWeight;
        }

        if (Math.abs(shift) > 0.001) {
          npc.politicalBeliefs[belief] = this.clampBelief(npc.politicalBeliefs[belief] + shift);

          this.addInfluenceToHistory(npc.id, createBeliefInfluence({
            source: 'social',
            sourceId: influencer.id,
            belief,
            strength: shift,
          }));
        }
      }
    }
  }

  /**
   * Apply economic influence from wealth changes.
   * 
   * Wealth gains tend to decrease support for redistribution.
   * Wealth losses tend to increase support for redistribution.
   * 
   * @param npc - The NPC affected by wealth change
   * @param wealthChange - Amount of wealth gained (positive) or lost (negative)
   */
  applyEconomicInfluence(npc: CryptoNPC, wealthChange: number): void {
    if (!npc.politicalBeliefs) {
      npc.politicalBeliefs = createDefaultPoliticalBeliefs();
    }

    const stabilityFactor = this.getStabilityFactor(npc.personality);
    const susceptibility = this.getSusceptibilityFactor(npc.personality);

    // Calculate magnitude based on wealth change (logarithmic to handle large values)
    const absChange = Math.abs(wealthChange);
    const logMagnitude = Math.log10(Math.max(1, absChange)) / 5; // Normalize
    const baseMagnitude = Math.min(0.15, logMagnitude) * susceptibility * (1 - stabilityFactor * 0.3);

    // Direction: positive wealth = less redistribution, negative = more redistribution
    const direction = wealthChange > 0 ? -1 : 1;
    const shift = baseMagnitude * direction;

    npc.politicalBeliefs.wealthRedistribution = this.clampBelief(
      npc.politicalBeliefs.wealthRedistribution + shift
    );

    this.addInfluenceToHistory(npc.id, createBeliefInfluence({
      source: 'economic',
      sourceId: `wealth_${Date.now()}`,
      belief: 'wealthRedistribution',
      strength: shift,
    }));

    // Secondary effects: large losses may increase skepticism of centralized systems
    if (wealthChange < -500) {
      const skepticismShift = baseMagnitude * 0.3;
      npc.politicalBeliefs.centralAuthority = this.clampBelief(
        npc.politicalBeliefs.centralAuthority - skepticismShift
      );
    }
  }

  /**
   * Get belief strength based on consistency of influences.
   * 
   * A belief is stronger if it has been consistently reinforced
   * from multiple sources over time.
   * 
   * @param npc - The NPC to check
   * @param belief - The belief type to measure
   * @returns Strength score (0-1)
   */
  getBeliefStrength(npc: CryptoNPC, belief: BeliefType): number {
    const history = this.influenceHistory.get(npc.id) || [];
    const beliefHistory = history.filter(h => h.belief === belief);

    if (beliefHistory.length === 0) {
      return 0.5; // Neutral strength
    }

    // Calculate consistency: are influences all in the same direction?
    let positiveCount = 0;
    let negativeCount = 0;
    let totalStrength = 0;

    for (const influence of beliefHistory) {
      totalStrength += Math.abs(influence.strength);
      if (influence.strength > 0) positiveCount++;
      else if (influence.strength < 0) negativeCount++;
    }

    // Consistency ratio: 1 if all same direction, 0 if perfectly split
    const total = positiveCount + negativeCount;
    const consistency = total > 0 
      ? Math.abs(positiveCount - negativeCount) / total 
      : 0;

    // Combine consistency with total influence volume
    const volumeScore = Math.min(1, totalStrength / 2);
    const strength = (consistency * 0.6 + volumeScore * 0.4);

    return Math.max(0, Math.min(1, strength));
  }

  /**
   * Calculate how well an NPC's beliefs align with a faction's ideology.
   * 
   * @param npc - The NPC to check
   * @param ideology - The faction's ideology
   * @returns Alignment score (0-1, higher = better match)
   */
  calculateFactionAlignment(npc: CryptoNPC, ideology: FactionIdeology): number {
    if (!npc.politicalBeliefs) {
      return 0.5; // Neutral alignment
    }

    const beliefs = npc.politicalBeliefs;
    let alignmentScore = 0;
    let weightSum = 0;

    // Map faction ideology to expected belief values
    const ideologyBeliefs = this.ideologyToBeliefs(ideology);

    // Calculate weighted alignment for each belief
    for (const belief of ALL_BELIEF_TYPES) {
      const expected = ideologyBeliefs[belief];
      const actual = beliefs[belief];
      
      // Alignment is 1 - distance (closer = higher alignment)
      const distance = Math.abs(expected - actual);
      const alignment = 1 - distance;
      
      // Weight beliefs by their relevance to the ideology
      const weight = this.getBeliefRelevanceWeight(belief, ideology);
      alignmentScore += alignment * weight;
      weightSum += weight;
    }

    return weightSum > 0 ? alignmentScore / weightSum : 0.5;
  }

  /**
   * Suggest the best faction match for an NPC based on their beliefs.
   * 
   * @param npc - The NPC seeking a faction
   * @param factions - Available factions to choose from
   * @returns Best faction match with alignment score, or null if none
   */
  suggestFactionFromBeliefs(npc: CryptoNPC, factions: FactionInput[]): FactionSuggestion | null {
    if (factions.length === 0) {
      return null;
    }

    let bestFaction: FactionSuggestion | null = null;
    let bestAlignment = -1;

    for (const faction of factions) {
      const alignment = this.calculateFactionAlignment(npc, faction.ideology);
      if (alignment > bestAlignment) {
        bestAlignment = alignment;
        bestFaction = {
          id: faction.id,
          alignment,
        };
      }
    }

    return bestFaction;
  }

  /**
   * Add an influence record to an NPC's history.
   * 
   * @param npcId - The NPC's ID
   * @param influence - The influence to record
   */
  addInfluenceToHistory(npcId: string, influence: BeliefInfluence): void {
    if (!this.influenceHistory.has(npcId)) {
      this.influenceHistory.set(npcId, []);
    }
    const history = this.influenceHistory.get(npcId)!;
    history.push(influence);

    // Keep history manageable (last 100 influences)
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Get influence history for an NPC.
   * 
   * @param npcId - The NPC's ID
   * @returns Array of influence records
   */
  getInfluenceHistory(npcId: string): BeliefInfluence[] {
    return this.influenceHistory.get(npcId) || [];
  }

  /**
   * Serialize manager state for persistence.
   */
  serialize(): SerializedPoliticalBeliefManager {
    const history: Record<string, BeliefInfluence[]> = {};
    for (const [npcId, influences] of this.influenceHistory.entries()) {
      history[npcId] = influences;
    }
    return { influenceHistory: history };
  }

  /**
   * Deserialize manager state from persistence.
   */
  deserialize(data: SerializedPoliticalBeliefManager): void {
    this.influenceHistory.clear();
    for (const [npcId, influences] of Object.entries(data.influenceHistory)) {
      this.influenceHistory.set(npcId, influences);
    }
  }

  // === Private Helper Methods ===

  /**
   * Calculate a belief value from weighted factors.
   */
  private calculateBeliefFromFactors(factors: { value: number; weight: number }[]): number {
    let sum = 0;
    let weightSum = 0;
    for (const { value, weight } of factors) {
      sum += value * weight;
      weightSum += weight;
    }
    return weightSum > 0 ? this.clampBelief(sum / weightSum) : 0.5;
  }

  /**
   * Get stability factor from personality (high conscientiousness = more stable).
   */
  private getStabilityFactor(personality: NPCPersonality): number {
    return personality.bigFive.conscientiousness;
  }

  /**
   * Get susceptibility factor from personality (high neuroticism = more susceptible).
   */
  private getSusceptibilityFactor(personality: NPCPersonality): number {
    // Neuroticism increases susceptibility, conscientiousness decreases it
    return (personality.bigFive.neuroticism * 0.6 + (1 - personality.bigFive.conscientiousness) * 0.4);
  }

  /**
   * Clamp a belief value to 0-1 range.
   */
  private clampBelief(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  /**
   * Convert faction ideology to expected belief values.
   */
  private ideologyToBeliefs(ideology: FactionIdeology): PoliticalBeliefs {
    const beliefs = createDefaultPoliticalBeliefs();

    // Economic ideology mapping
    switch (ideology.economic) {
      case 'communist':
        beliefs.wealthRedistribution = 0.95;
        beliefs.regulationSupport = 0.8;
        break;
      case 'socialist':
        beliefs.wealthRedistribution = 0.75;
        beliefs.regulationSupport = 0.7;
        break;
      case 'mixed':
        beliefs.wealthRedistribution = 0.5;
        beliefs.regulationSupport = 0.5;
        break;
      case 'capitalist':
        beliefs.wealthRedistribution = 0.25;
        beliefs.regulationSupport = 0.4;
        break;
      case 'ancap':
        beliefs.wealthRedistribution = 0.05;
        beliefs.regulationSupport = 0.1;
        break;
    }

    // Governance mapping
    switch (ideology.governance) {
      case 'autocracy':
        beliefs.centralAuthority = 0.95;
        beliefs.democraticParticipation = 0.1;
        break;
      case 'oligarchy':
        beliefs.centralAuthority = 0.75;
        beliefs.democraticParticipation = 0.3;
        break;
      case 'democracy':
        beliefs.centralAuthority = 0.5;
        beliefs.democraticParticipation = 0.8;
        break;
      case 'dao':
        beliefs.centralAuthority = 0.25;
        beliefs.democraticParticipation = 0.9;
        break;
      case 'anarchy':
        beliefs.centralAuthority = 0.05;
        beliefs.democraticParticipation = 0.5;
        break;
    }

    // Crypto philosophy mapping
    switch (ideology.cryptoPhilosophy) {
      case 'btc_maxi':
        beliefs.decentralizationPurity = 0.9;
        beliefs.privacyImportance = 0.7;
        break;
      case 'eth_aligned':
        beliefs.decentralizationPurity = 0.7;
        beliefs.privacyImportance = 0.5;
        break;
      case 'multi_chain':
        beliefs.decentralizationPurity = 0.5;
        beliefs.privacyImportance = 0.5;
        break;
      case 'tradfi_hybrid':
        beliefs.decentralizationPurity = 0.3;
        beliefs.privacyImportance = 0.3;
        break;
      case 'privacy_first':
        beliefs.decentralizationPurity = 0.8;
        beliefs.privacyImportance = 0.95;
        break;
    }

    return beliefs;
  }

  /**
   * Get relevance weight for a belief given a faction ideology.
   */
  private getBeliefRelevanceWeight(belief: BeliefType, ideology: FactionIdeology): number {
    // Default weights
    const weights: Record<BeliefType, number> = {
      wealthRedistribution: 1.0,
      regulationSupport: 0.8,
      centralAuthority: 1.0,
      democraticParticipation: 0.8,
      decentralizationPurity: 1.0,
      privacyImportance: 0.8,
    };

    // Adjust weights based on ideology focus
    if (ideology.cryptoPhilosophy === 'privacy_first') {
      weights.privacyImportance = 1.5;
    }
    if (ideology.cryptoPhilosophy === 'btc_maxi') {
      weights.decentralizationPurity = 1.5;
    }
    if (ideology.governance === 'dao') {
      weights.democraticParticipation = 1.5;
    }
    if (ideology.economic === 'communist' || ideology.economic === 'socialist') {
      weights.wealthRedistribution = 1.5;
    }
    if (ideology.economic === 'ancap') {
      weights.regulationSupport = 1.5;
    }

    return weights[belief];
  }
}
