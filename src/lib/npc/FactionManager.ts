/**
 * FactionManager - Manages NPC factions in Crypto City
 * 
 * Handles faction creation, membership, leadership, relations, and treasury.
 * Provides ideology alignment calculations to suggest appropriate factions for NPCs.
 */

import type {
  Faction,
  FactionRelation,
  RelationStatus,
  SerializedFaction,
} from './factions';
import {
  FACTION_TEMPLATES,
  createDefaultFaction,
  serializeFaction,
  deserializeFaction,
} from './factions';
import type { CryptoNPC } from '@/games/isocity/types/npc';

/**
 * Income entry for tax collection
 */
export interface TaxableIncome {
  npcId: string;
  income: number;
}

/**
 * Manager class for faction operations
 */
export class FactionManager {
  /** Registry of all factions */
  private factions: Map<string, Faction> = new Map();
  
  /** Mapping of NPC ID to their faction ID for quick lookup */
  private npcFactionMap: Map<string, string> = new Map();
  
  /** Counter for generating unique faction IDs */
  private factionIdCounter: number = 0;

  /**
   * Generate a unique faction ID
   */
  private generateFactionId(): string {
    return `faction-${Date.now()}-${this.factionIdCounter++}`;
  }

  // ==================== CRUD Operations ====================

  /**
   * Create a new faction from a template
   * @param template - Template key from FACTION_TEMPLATES
   * @param founderId - NPC ID of the faction founder who becomes leader
   * @returns The created faction
   */
  createFaction(template: string, founderId: string): Faction {
    const templateData = FACTION_TEMPLATES[template];
    if (!templateData) {
      throw new Error(`Unknown faction template: ${template}`);
    }

    const faction = createDefaultFaction({
      id: this.generateFactionId(),
      name: templateData.name ?? 'Unnamed Faction',
      description: templateData.description ?? '',
      ideology: templateData.ideology,
      leaderId: founderId,
      motto: templateData.motto ?? '',
      foundedAt: Date.now(),
    });

    // Founder automatically joins
    faction.memberIds.add(founderId);
    
    this.factions.set(faction.id, faction);
    this.npcFactionMap.set(founderId, faction.id);

    return faction;
  }

  /**
   * Get a faction by ID
   * @param id - Faction ID
   * @returns The faction or null if not found
   */
  getFaction(id: string): Faction | null {
    return this.factions.get(id) ?? null;
  }

  /**
   * Get all factions
   * @returns Array of all factions
   */
  getAllFactions(): Faction[] {
    return Array.from(this.factions.values());
  }

  // ==================== Membership ====================

  /**
   * Add an NPC to a faction
   * @param npcId - NPC ID to join
   * @param factionId - Faction ID to join
   * @returns True if successful, false if faction not found or NPC already in a faction
   */
  joinFaction(npcId: string, factionId: string): boolean {
    // Check if NPC is already in a faction
    if (this.npcFactionMap.has(npcId)) {
      return false;
    }

    const faction = this.factions.get(factionId);
    if (!faction) {
      return false;
    }

    faction.memberIds.add(npcId);
    this.npcFactionMap.set(npcId, factionId);
    return true;
  }

  /**
   * Remove an NPC from their faction
   * @param npcId - NPC ID to leave
   * @returns True if successful, false if NPC not in any faction
   */
  leaveFaction(npcId: string): boolean {
    const factionId = this.npcFactionMap.get(npcId);
    if (!factionId) {
      return false;
    }

    const faction = this.factions.get(factionId);
    if (faction) {
      faction.memberIds.delete(npcId);
      
      // If leaving NPC was leader, clear leadership
      if (faction.leaderId === npcId) {
        faction.leaderId = null;
      }
      
      // Remove from council if present
      faction.councilIds = faction.councilIds.filter(id => id !== npcId);
    }

    this.npcFactionMap.delete(npcId);
    return true;
  }

  /**
   * Get the faction an NPC belongs to
   * @param npcId - NPC ID to look up
   * @returns The faction or null if NPC not in any faction
   */
  getNPCFaction(npcId: string): Faction | null {
    const factionId = this.npcFactionMap.get(npcId);
    if (!factionId) {
      return null;
    }
    return this.factions.get(factionId) ?? null;
  }

  /**
   * Get all members of a faction
   * @param factionId - Faction ID
   * @returns Array of member NPC IDs, empty array if faction not found
   */
  getFactionMembers(factionId: string): string[] {
    const faction = this.factions.get(factionId);
    if (!faction) {
      return [];
    }
    return Array.from(faction.memberIds);
  }

  // ==================== Leadership ====================

  /**
   * Elect a new leader from faction members
   * @param factionId - Faction ID
   * @returns The new leader ID or null if faction not found or empty
   */
  electLeader(factionId: string): string | null {
    const faction = this.factions.get(factionId);
    if (!faction || faction.memberIds.size === 0) {
      return null;
    }

    // Simple random election - in a real game this could be more sophisticated
    const members = Array.from(faction.memberIds);
    const newLeader = members[Math.floor(Math.random() * members.length)];
    
    faction.leaderId = newLeader;
    return newLeader;
  }

  /**
   * Appoint council members
   * @param factionId - Faction ID
   * @param npcIds - Array of NPC IDs to appoint (must be faction members)
   */
  appointCouncil(factionId: string, npcIds: string[]): void {
    const faction = this.factions.get(factionId);
    if (!faction) {
      return;
    }

    // Only appoint NPCs who are actually faction members
    faction.councilIds = npcIds.filter(id => faction.memberIds.has(id));
  }

  // ==================== Relations ====================

  /**
   * Update relationship between two factions
   * @param factionId - First faction ID
   * @param targetId - Second faction ID
   * @param delta - Change in standing (-100 to +100)
   */
  updateRelation(factionId: string, targetId: string, delta: number): void {
    const faction1 = this.factions.get(factionId);
    const faction2 = this.factions.get(targetId);
    
    if (!faction1 || !faction2) {
      return;
    }

    // Update or create relation for faction1 -> faction2
    const relation1 = faction1.relations[targetId] ?? {
      targetFactionId: targetId,
      standing: 0,
      status: 'neutral' as RelationStatus,
    };
    
    relation1.standing = Math.max(-100, Math.min(100, relation1.standing + delta));
    relation1.status = this.standingToStatus(relation1.standing);
    faction1.relations[targetId] = relation1;

    // Update or create relation for faction2 -> faction1 (bidirectional)
    const relation2 = faction2.relations[factionId] ?? {
      targetFactionId: factionId,
      standing: 0,
      status: 'neutral' as RelationStatus,
    };
    
    relation2.standing = Math.max(-100, Math.min(100, relation2.standing + delta));
    relation2.status = this.standingToStatus(relation2.standing);
    faction2.relations[factionId] = relation2;
  }

  /**
   * Convert standing score to status
   */
  private standingToStatus(standing: number): RelationStatus {
    if (standing >= 75) return 'allied';
    if (standing >= 25) return 'friendly';
    if (standing >= -24) return 'neutral';
    if (standing >= -74) return 'hostile';
    return 'war';
  }

  /**
   * Get relation status between two factions
   * @param faction1Id - First faction ID
   * @param faction2Id - Second faction ID
   * @returns Relation status, defaults to 'neutral' if no relation exists
   */
  getRelationStatus(faction1Id: string, faction2Id: string): RelationStatus {
    const faction = this.factions.get(faction1Id);
    if (!faction) {
      return 'neutral';
    }

    const relation = faction.relations[faction2Id];
    return relation?.status ?? 'neutral';
  }

  // ==================== Treasury ====================

  /**
   * Collect taxes from faction members
   * @param factionId - Faction ID
   * @param incomes - Array of member incomes to tax
   * @returns Total taxes collected
   */
  collectTaxes(factionId: string, incomes: TaxableIncome[]): number {
    const faction = this.factions.get(factionId);
    if (!faction) {
      return 0;
    }

    let totalTax = 0;
    for (const { npcId, income } of incomes) {
      if (faction.memberIds.has(npcId)) {
        const tax = income * faction.taxRate;
        totalTax += tax;
      }
    }

    faction.treasury += totalTax;
    return totalTax;
  }

  /**
   * Pay from faction treasury
   * @param factionId - Faction ID
   * @param amount - Amount to pay
   * @returns True if payment successful, false if insufficient funds
   */
  payFromTreasury(factionId: string, amount: number): boolean {
    const faction = this.factions.get(factionId);
    if (!faction || faction.treasury < amount) {
      return false;
    }

    faction.treasury -= amount;
    return true;
  }

  // ==================== Ideology Alignment ====================

  /**
   * Calculate how well an NPC's personality aligns with a faction's ideology
   * @param npc - The NPC to evaluate
   * @param faction - The faction to compare against
   * @returns Alignment score from 0 to 1
   */
  calculateIdeologyAlignment(npc: CryptoNPC, faction: Faction): number {
    const personality = npc.personality;
    let alignment = 0;
    const ideology = faction.ideology;

    // BTC maxi alignment
    if (ideology.cryptoPhilosophy === 'btc_maxi') {
      // Less open = more maxi (prefer established BTC)
      alignment += (1 - personality.bigFive.openness) * 0.3;
      // High conscientiousness = disciplined hodler
      alignment += personality.bigFive.conscientiousness * 0.2;
      // Low degen level = not chasing shitcoins
      alignment += (1 - personality.crypto.degenLevel) * 0.2;
      // Low trust in institutions (self-custody ethos)
      alignment += (1 - personality.crypto.trustInInstitutions) * 0.15;
    }

    // ETH aligned
    if (ideology.cryptoPhilosophy === 'eth_aligned') {
      // High openness = willing to explore DeFi
      alignment += personality.bigFive.openness * 0.25;
      // High technical knowledge = understands smart contracts
      alignment += personality.crypto.technicalKnowledge * 0.3;
      // Moderate risk tolerance
      const riskMod = 1 - Math.abs(personality.crypto.riskTolerance - 0.5) * 2;
      alignment += riskMod * 0.15;
    }

    // Degen alignment (multi_chain + anarchy)
    if (ideology.cryptoPhilosophy === 'multi_chain' && ideology.governance === 'anarchy') {
      // High risk tolerance = willing to ape
      alignment += personality.crypto.riskTolerance * 0.4;
      // High degen level = full ape mode
      alignment += personality.crypto.degenLevel * 0.3;
      // High FOMO = can't miss the next moon
      alignment += personality.crypto.fomo * 0.15;
    }

    // Privacy alignment
    if (ideology.cryptoPhilosophy === 'privacy_first') {
      // Low trust in institutions = government is watching
      alignment += (1 - personality.crypto.trustInInstitutions) * 0.5;
      // High neuroticism = paranoid about surveillance
      alignment += personality.bigFive.neuroticism * 0.2;
      // High technical knowledge = understands privacy tech
      alignment += personality.crypto.technicalKnowledge * 0.15;
    }

    // TradFi hybrid alignment
    if (ideology.cryptoPhilosophy === 'tradfi_hybrid') {
      // High trust in institutions = comfortable with regulation
      alignment += personality.crypto.trustInInstitutions * 0.35;
      // Low risk tolerance = prefers regulated markets
      alignment += (1 - personality.crypto.riskTolerance) * 0.25;
      // High conscientiousness = follows the rules
      alignment += personality.bigFive.conscientiousness * 0.2;
    }

    // DAO governance bonus for high agreeableness
    if (ideology.governance === 'dao') {
      alignment += personality.bigFive.agreeableness * 0.1;
    }

    // Autocracy/oligarchy penalty for high agreeableness
    if (ideology.governance === 'autocracy' || ideology.governance === 'oligarchy') {
      alignment -= personality.bigFive.agreeableness * 0.05;
    }

    return Math.max(0, Math.min(1, alignment));
  }

  /**
   * Suggest the best faction for an NPC based on personality
   * @param npc - The NPC to find a faction for
   * @returns The suggested faction or null if no factions exist
   */
  suggestFaction(npc: CryptoNPC): Faction | null {
    const factions = this.getAllFactions();
    if (factions.length === 0) {
      return null;
    }

    let bestFaction: Faction | null = null;
    let bestAlignment = -1;

    for (const faction of factions) {
      const alignment = this.calculateIdeologyAlignment(npc, faction);
      if (alignment > bestAlignment) {
        bestAlignment = alignment;
        bestFaction = faction;
      }
    }

    return bestFaction;
  }

  // ==================== Serialization ====================

  /**
   * Serialize all faction data for storage
   * @returns Serialized faction data
   */
  serialize(): {
    factions: SerializedFaction[];
    npcFactionMap: [string, string][];
    factionIdCounter: number;
  } {
    return {
      factions: this.getAllFactions().map(serializeFaction),
      npcFactionMap: Array.from(this.npcFactionMap.entries()),
      factionIdCounter: this.factionIdCounter,
    };
  }

  /**
   * Deserialize faction data from storage
   * @param data - Serialized faction data
   */
  deserialize(data: {
    factions: SerializedFaction[];
    npcFactionMap: [string, string][];
    factionIdCounter: number;
  }): void {
    this.factions.clear();
    this.npcFactionMap.clear();

    for (const serialized of data.factions) {
      const faction = deserializeFaction(serialized);
      this.factions.set(faction.id, faction);
    }

    for (const [npcId, factionId] of data.npcFactionMap) {
      this.npcFactionMap.set(npcId, factionId);
    }

    this.factionIdCounter = data.factionIdCounter;
  }
}
