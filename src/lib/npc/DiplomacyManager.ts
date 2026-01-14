/**
 * DiplomacyManager for Crypto City NPCs
 *
 * Manages diplomatic relations between factions including:
 * - Treaty negotiations, acceptance, rejection, and violations
 * - Alliance formation, membership, and dissolution
 * - Diplomatic stance tracking between factions
 * - Reputation management and history tracking
 */

import type {
  Treaty,
  TreatyType,
  TreatyTerm,
  Alliance,
  DiplomaticStance,
  NegotiationSession,
  ReputationChange,
  SerializedDiplomacyState,
} from './diplomacy';
import {
  createDefaultTreaty,
  createDefaultAlliance,
  createDefaultNegotiationSession,
  DEFAULT_TREATY_DURATION,
} from './diplomacy';

/**
 * Generates a unique ID for diplomacy entities
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Default diplomatic reputation for new factions
 */
const DEFAULT_REPUTATION = 50;

/**
 * Reputation penalty for treaty violation
 */
const VIOLATION_REPUTATION_PENALTY = -25;

/**
 * DiplomacyManager handles all diplomatic operations between factions
 */
export class DiplomacyManager {
  /** Active treaties */
  private treaties: Map<string, Treaty> = new Map();

  /** Active alliances */
  private alliances: Map<string, Alliance> = new Map();

  /** Negotiation sessions */
  private sessions: Map<string, NegotiationSession> = new Map();

  /** Diplomatic reputation per faction (0-100) */
  private reputations: Map<string, number> = new Map();

  /** Reputation change history per faction */
  private reputationHistories: Map<string, ReputationChange[]> = new Map();

  /** Diplomatic stances between faction pairs (key: "faction1:faction2") */
  private stances: Map<string, DiplomaticStance> = new Map();

  // ==========================================================================
  // Treaty Proposals
  // ==========================================================================

  /**
   * Propose a treaty to another faction
   *
   * @param initiatorId - Faction proposing the treaty
   * @param targetId - Faction receiving the proposal
   * @param type - Type of treaty being proposed
   * @param terms - Proposed treaty terms
   * @returns The new negotiation session
   */
  proposeTreaty(
    initiatorId: string,
    targetId: string,
    type: TreatyType,
    terms: TreatyTerm[]
  ): NegotiationSession {
    const session = createDefaultNegotiationSession({
      id: generateId('session'),
      initiatorFactionId: initiatorId,
      targetFactionId: targetId,
      proposedType: type,
      proposedTerms: terms,
    });

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get a negotiation session by ID
   *
   * @param sessionId - The session's unique ID
   * @returns The session or undefined
   */
  getNegotiationSession(sessionId: string): NegotiationSession | undefined {
    return this.sessions.get(sessionId);
  }

  // ==========================================================================
  // Counter Proposals
  // ==========================================================================

  /**
   * Counter-propose with new terms
   *
   * @param sessionId - The session to counter-propose in
   * @param newTerms - The counter-proposed terms
   * @returns The updated session or null if not found
   */
  counterPropose(
    sessionId: string,
    newTerms: TreatyTerm[]
  ): NegotiationSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.counterTerms = newTerms;
    session.stage = 'counter_offered';
    session.negotiationRounds += 1;

    return session;
  }

  // ==========================================================================
  // Accept/Reject Treaties
  // ==========================================================================

  /**
   * Accept a treaty proposal and create the active treaty
   *
   * @param sessionId - The session to accept
   * @returns The created treaty or null if session not found
   */
  acceptTreaty(sessionId: string): Treaty | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Use counter-terms if present, otherwise use proposed terms
    const finalTerms = session.counterTerms ?? session.proposedTerms;

    const treaty = createDefaultTreaty({
      id: generateId('treaty'),
      parties: [session.initiatorFactionId, session.targetFactionId],
      type: session.proposedType,
      terms: finalTerms,
    });

    this.treaties.set(treaty.id, treaty);

    // Close the session
    session.stage = 'accepted';

    // Update diplomatic stance to friendly
    this.setStance(session.initiatorFactionId, session.targetFactionId, 'friendly');

    return treaty;
  }

  /**
   * Reject a treaty proposal
   *
   * @param sessionId - The session to reject
   * @returns True if rejected, false if session not found
   */
  rejectTreaty(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.stage = 'rejected';
    return true;
  }

  // ==========================================================================
  // Treaty Management
  // ==========================================================================

  /**
   * Get a treaty by ID
   *
   * @param treatyId - The treaty's unique ID
   * @returns The treaty or undefined
   */
  getTreaty(treatyId: string): Treaty | undefined {
    return this.treaties.get(treatyId);
  }

  /**
   * Violate a treaty
   *
   * @param treatyId - The treaty being violated
   * @param violatorId - The faction violating the treaty
   * @returns True if violation recorded, false if treaty not found or already ended
   */
  violateTreaty(treatyId: string, violatorId: string): boolean {
    const treaty = this.treaties.get(treatyId);
    if (!treaty) return false;
    if (treaty.status !== 'active') return false;

    treaty.status = 'violated';
    treaty.violatorId = violatorId;

    // Damage violator's reputation
    this.updateDiplomaticReputation(violatorId, VIOLATION_REPUTATION_PENALTY, 'treaty_violation');

    // Set hostile stance between parties
    const otherParty = treaty.parties.find(p => p !== violatorId);
    if (otherParty) {
      this.setStance(violatorId, otherParty, 'hostile');
    }

    return true;
  }

  /**
   * Expire a treaty naturally
   *
   * @param treatyId - The treaty to expire
   * @returns True if expired, false if treaty not found
   */
  expireTreaty(treatyId: string): boolean {
    const treaty = this.treaties.get(treatyId);
    if (!treaty) return false;

    treaty.status = 'expired';
    return true;
  }

  /**
   * Get all active treaties for a faction
   *
   * @param factionId - The faction to get treaties for
   * @returns Array of active treaties involving this faction
   */
  getActiveTreatiesForFaction(factionId: string): Treaty[] {
    const results: Treaty[] = [];
    for (const treaty of this.treaties.values()) {
      if (treaty.status === 'active' && treaty.parties.includes(factionId)) {
        results.push(treaty);
      }
    }
    return results;
  }

  // ==========================================================================
  // Alliance Management
  // ==========================================================================

  /**
   * Form a new alliance
   *
   * @param factionIds - Founding faction IDs
   * @param leaderId - Faction to lead the alliance
   * @returns The new alliance
   */
  formAlliance(factionIds: string[], leaderId: string): Alliance {
    const alliance = createDefaultAlliance({
      id: generateId('alliance'),
      memberFactionIds: [...factionIds],
      leaderId,
    });

    this.alliances.set(alliance.id, alliance);

    // Set friendly stance between all members
    for (let i = 0; i < factionIds.length; i++) {
      for (let j = i + 1; j < factionIds.length; j++) {
        this.setStance(factionIds[i], factionIds[j], 'friendly');
      }
    }

    return alliance;
  }

  /**
   * Get an alliance by ID
   *
   * @param allianceId - The alliance's unique ID
   * @returns The alliance or undefined
   */
  getAlliance(allianceId: string): Alliance | undefined {
    return this.alliances.get(allianceId);
  }

  /**
   * Join an existing alliance
   *
   * @param allianceId - The alliance to join
   * @param factionId - The faction joining
   * @returns True if joined, false if alliance not found or already member
   */
  joinAlliance(allianceId: string, factionId: string): boolean {
    const alliance = this.alliances.get(allianceId);
    if (!alliance) return false;
    if (alliance.status !== 'active') return false;
    if (alliance.memberFactionIds.includes(factionId)) return false;

    alliance.memberFactionIds.push(factionId);
    
    // Update strength based on new member count
    alliance.strength = Math.min(100, alliance.memberFactionIds.length * 20);

    // Set friendly stance with all existing members
    for (const memberId of alliance.memberFactionIds) {
      if (memberId !== factionId) {
        this.setStance(factionId, memberId, 'friendly');
      }
    }

    return true;
  }

  /**
   * Leave an alliance
   *
   * @param allianceId - The alliance to leave
   * @param factionId - The faction leaving
   * @returns True if left, false if alliance not found or not a member
   */
  leaveAlliance(allianceId: string, factionId: string): boolean {
    const alliance = this.alliances.get(allianceId);
    if (!alliance) return false;
    if (alliance.status !== 'active') return false;
    
    const index = alliance.memberFactionIds.indexOf(factionId);
    if (index === -1) return false;

    alliance.memberFactionIds.splice(index, 1);

    // Transfer leadership if leader left
    if (alliance.leaderId === factionId && alliance.memberFactionIds.length > 0) {
      alliance.leaderId = alliance.memberFactionIds[0];
    }

    // Update strength
    alliance.strength = Math.min(100, alliance.memberFactionIds.length * 20);

    // Dissolve if only one member remains
    if (alliance.memberFactionIds.length <= 1) {
      alliance.status = 'dissolved';
    }

    return true;
  }

  /**
   * Dissolve an alliance
   *
   * @param allianceId - The alliance to dissolve
   * @returns True if dissolved, false if alliance not found
   */
  dissolveAlliance(allianceId: string): boolean {
    const alliance = this.alliances.get(allianceId);
    if (!alliance) return false;

    alliance.status = 'dissolved';
    return true;
  }

  /**
   * Get all active alliances for a faction
   *
   * @param factionId - The faction to get alliances for
   * @returns Array of active alliances involving this faction
   */
  getAlliancesForFaction(factionId: string): Alliance[] {
    const results: Alliance[] = [];
    for (const alliance of this.alliances.values()) {
      if (alliance.status === 'active' && alliance.memberFactionIds.includes(factionId)) {
        results.push(alliance);
      }
    }
    return results;
  }

  // ==========================================================================
  // Diplomatic Stance
  // ==========================================================================

  /**
   * Get the key for a stance between two factions (order-independent)
   */
  private getStanceKey(faction1Id: string, faction2Id: string): string {
    // Sort to ensure consistent key regardless of order
    const sorted = [faction1Id, faction2Id].sort();
    return `${sorted[0]}:${sorted[1]}`;
  }

  /**
   * Set the diplomatic stance between two factions
   */
  private setStance(faction1Id: string, faction2Id: string, stance: DiplomaticStance): void {
    const key = this.getStanceKey(faction1Id, faction2Id);
    this.stances.set(key, stance);
  }

  /**
   * Get the diplomatic stance between two factions
   *
   * @param faction1Id - First faction
   * @param faction2Id - Second faction
   * @returns The diplomatic stance between them
   */
  getDiplomaticStance(faction1Id: string, faction2Id: string): DiplomaticStance {
    const key = this.getStanceKey(faction1Id, faction2Id);
    return this.stances.get(key) ?? 'neutral';
  }

  // ==========================================================================
  // Diplomatic Reputation
  // ==========================================================================

  /**
   * Get the diplomatic reputation of a faction
   *
   * @param factionId - The faction to get reputation for
   * @returns Reputation value (0-100)
   */
  getDiplomaticReputation(factionId: string): number {
    return this.reputations.get(factionId) ?? DEFAULT_REPUTATION;
  }

  /**
   * Update a faction's diplomatic reputation
   *
   * @param factionId - The faction to update
   * @param change - Amount to change (positive or negative)
   * @param reason - Reason for the change
   */
  updateDiplomaticReputation(factionId: string, change: number, reason: string): void {
    const current = this.getDiplomaticReputation(factionId);
    const newRep = clamp(current + change, 0, 100);
    this.reputations.set(factionId, newRep);

    // Record the change in history
    const history = this.reputationHistories.get(factionId) ?? [];
    history.push({
      timestamp: Date.now(),
      delta: change,
      reason,
    });
    this.reputationHistories.set(factionId, history);
  }

  /**
   * Get the reputation change history for a faction
   *
   * @param factionId - The faction to get history for
   * @returns Array of reputation changes
   */
  getReputationHistory(factionId: string): ReputationChange[] {
    return this.reputationHistories.get(factionId) ?? [];
  }

  // ==========================================================================
  // Mutual Defense
  // ==========================================================================

  /**
   * Check which factions would defend a faction under attack
   *
   * @param defenderId - The faction being attacked
   * @param attackerId - The faction attacking (excluded from results)
   * @returns Array of faction IDs that would defend
   */
  checkMutualDefense(defenderId: string, attackerId: string): string[] {
    const defenders: string[] = [];

    // Check alliances
    for (const alliance of this.alliances.values()) {
      if (alliance.status !== 'active') continue;
      if (alliance.memberFactionIds.includes(defenderId)) {
        for (const memberId of alliance.memberFactionIds) {
          if (memberId !== defenderId && memberId !== attackerId && !defenders.includes(memberId)) {
            defenders.push(memberId);
          }
        }
      }
    }

    // Check mutual defense treaties
    for (const treaty of this.treaties.values()) {
      if (treaty.status !== 'active') continue;
      if (treaty.type !== 'mutual_defense') continue;
      if (treaty.parties.includes(defenderId)) {
        for (const partyId of treaty.parties) {
          if (partyId !== defenderId && partyId !== attackerId && !defenders.includes(partyId)) {
            defenders.push(partyId);
          }
        }
      }
    }

    return defenders;
  }

  // ==========================================================================
  // Serialization
  // ==========================================================================

  /**
   * Serialize all diplomacy data for storage
   *
   * @returns Serialized diplomacy state
   */
  serialize(): SerializedDiplomacyState {
    const stancesObj: Record<string, DiplomaticStance> = {};
    for (const [key, value] of this.stances.entries()) {
      stancesObj[key] = value;
    }

    const reputationsObj: Record<string, number> = {};
    for (const [key, value] of this.reputations.entries()) {
      reputationsObj[key] = value;
    }

    const historiesObj: Record<string, ReputationChange[]> = {};
    for (const [key, value] of this.reputationHistories.entries()) {
      historiesObj[key] = value;
    }

    return {
      treaties: Array.from(this.treaties.values()),
      alliances: Array.from(this.alliances.values()),
      sessions: Array.from(this.sessions.values()),
      reputations: reputationsObj,
      reputationHistories: historiesObj,
      stances: stancesObj,
    };
  }

  /**
   * Deserialize diplomacy data from storage
   *
   * @param data - Serialized diplomacy state
   */
  deserialize(data: SerializedDiplomacyState): void {
    this.treaties.clear();
    this.alliances.clear();
    this.sessions.clear();
    this.reputations.clear();
    this.reputationHistories.clear();
    this.stances.clear();

    for (const treaty of data.treaties) {
      this.treaties.set(treaty.id, treaty);
    }

    for (const alliance of data.alliances) {
      this.alliances.set(alliance.id, alliance);
    }

    for (const session of data.sessions) {
      this.sessions.set(session.id, session);
    }

    for (const [factionId, rep] of Object.entries(data.reputations)) {
      this.reputations.set(factionId, rep);
    }

    for (const [factionId, history] of Object.entries(data.reputationHistories)) {
      this.reputationHistories.set(factionId, history);
    }

    for (const [key, stance] of Object.entries(data.stances)) {
      this.stances.set(key, stance);
    }
  }
}
