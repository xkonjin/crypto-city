/**
 * LawEnforcement - Manages faction laws, violations, and penalties
 * 
 * This manager handles:
 * - Law proposal and enactment
 * - Violation detection and recording
 * - Penalty application
 * - Integration with faction treasury for fines
 * 
 * "Justice in crypto is swift and merciless. Your wallet remembers everything."
 * - The Book of Satoshi (apocryphal)
 */

import type { FactionManager } from './FactionManager';
import type { CryptoNPC } from '@/games/isocity/types/npc';
import type {
  Law,
  LawType,
  Violation,
  Penalty,
  LawStatus,
  Severity,
  NPCAction,
  SerializedLaw,
  SerializedViolation,
} from './laws';
import {
  createDefaultLaw,
  serializeLaw,
  deserializeLaw,
  serializeViolation,
  deserializeViolation,
  isRestrictedToken,
  isBTCMaxiApproved,
  DEFAULT_CURFEW_START,
  DEFAULT_CURFEW_END,
} from './laws';

/**
 * LawEnforcement handles all law-related operations for factions.
 */
export class LawEnforcement {
  /** Reference to faction manager for membership checks and treasury operations */
  private factionManager: FactionManager;
  
  /** Registry of all laws by ID */
  private laws: Map<string, Law> = new Map();
  
  /** Registry of all violations by ID */
  private violations: Map<string, Violation> = new Map();
  
  /** Index of violations by NPC ID for quick lookup */
  private violationsByNPC: Map<string, string[]> = new Map();
  
  /** Index of laws by faction ID */
  private lawsByFaction: Map<string, string[]> = new Map();
  
  /** Counter for generating unique law IDs */
  private lawIdCounter: number = 0;
  
  /** Counter for generating unique violation IDs */
  private violationIdCounter: number = 0;

  constructor(factionManager: FactionManager) {
    this.factionManager = factionManager;
  }

  // ==========================================
  // ID GENERATION
  // ==========================================

  /**
   * Generate a unique law ID
   */
  private generateLawId(): string {
    return `law-${Date.now()}-${this.lawIdCounter++}`;
  }

  /**
   * Generate a unique violation ID
   */
  private generateViolationId(): string {
    return `violation-${Date.now()}-${this.violationIdCounter++}`;
  }

  // ==========================================
  // LAW PROPOSAL
  // ==========================================

  /**
   * Propose a new law for a faction.
   * The proposer must be a member of the faction.
   * 
   * @param factionId - ID of the faction
   * @param proposerId - NPC ID of the proposer
   * @param type - Type of law
   * @param title - Display title
   * @param description - Full description
   * @param penalties - Penalties for violations
   * @param severity - Severity level (defaults to 'moderate')
   * @param requiresWitnesses - Whether witnesses are required
   * @returns The proposed law or null if invalid
   */
  proposeLaw(
    factionId: string,
    proposerId: string,
    type: LawType,
    title: string,
    description: string,
    penalties: Penalty[],
    severity: Severity = 'moderate',
    requiresWitnesses: boolean = false
  ): Law | null {
    // Check faction exists
    const faction = this.factionManager.getFaction(factionId);
    if (!faction) {
      return null;
    }

    // Check proposer is a member
    if (!faction.memberIds.has(proposerId)) {
      return null;
    }

    const law = createDefaultLaw({
      id: this.generateLawId(),
      factionId,
      proposerId,
      type,
      title,
      description,
      severity,
      penalties,
      requiresWitnesses,
    });

    this.laws.set(law.id, law);
    
    // Update faction index
    if (!this.lawsByFaction.has(factionId)) {
      this.lawsByFaction.set(factionId, []);
    }
    this.lawsByFaction.get(factionId)!.push(law.id);

    return law;
  }

  // ==========================================
  // LAW ENACTMENT
  // ==========================================

  /**
   * Enact a proposed law, making it active.
   * 
   * @param lawId - ID of the law to enact
   * @param expiresIn - Optional duration in milliseconds until expiration
   * @returns True if enacted successfully
   */
  enactLaw(lawId: string, expiresIn?: number): boolean {
    const law = this.laws.get(lawId);
    if (!law) {
      return false;
    }

    // Can only enact proposed laws
    if (law.status !== 'proposed') {
      return false;
    }

    law.status = 'active';
    law.enactedAt = Date.now();
    
    if (expiresIn !== undefined) {
      law.expiresAt = Date.now() + expiresIn;
    }

    return true;
  }

  // ==========================================
  // LAW REPEAL
  // ==========================================

  /**
   * Repeal an active law.
   * 
   * @param lawId - ID of the law to repeal
   * @returns True if repealed successfully
   */
  repealLaw(lawId: string): boolean {
    const law = this.laws.get(lawId);
    if (!law) {
      return false;
    }

    // Can only repeal active laws
    if (law.status !== 'active') {
      return false;
    }

    law.status = 'repealed';
    return true;
  }

  // ==========================================
  // VIOLATION DETECTION
  // ==========================================

  /**
   * Check if an NPC action violates any active laws.
   * 
   * @param npc - The NPC performing the action
   * @param action - The action being performed
   * @returns A potential violation or null if no violation
   */
  checkViolation(npc: CryptoNPC, action: NPCAction): Violation | null {
    // NPCs without faction membership aren't bound by faction laws
    if (!npc.factionId) {
      return null;
    }

    // Get active laws for this NPC's faction
    const activeLaws = this.getLawsForFaction(npc.factionId);
    
    for (const law of activeLaws) {
      const isViolation = this.doesActionViolateLaw(npc, action, law);
      if (isViolation) {
        // Create and return a violation record
        return this.recordViolation(
          law.id,
          npc.id,
          action.witnesses ?? []
        );
      }
    }

    return null;
  }

  /**
   * Check if a specific action violates a specific law.
   */
  private doesActionViolateLaw(npc: CryptoNPC, action: NPCAction, law: Law): boolean {
    // Check witness requirements first
    if (law.requiresWitnesses && !action.witnessed) {
      return false;
    }

    // Check by law type
    switch (law.type) {
      case 'trade_restriction':
        return this.checkTradeRestriction(action, law);
      
      case 'curfew':
        return this.checkCurfewViolation(action);
      
      case 'building_permit':
        return this.checkBuildingPermit(action);
      
      case 'conduct_code':
        return this.checkConductCode(npc, action);
      
      case 'membership_rule':
        return this.checkMembershipRule(action);
      
      case 'tax_rate':
        // Tax violations are handled differently (by economy system)
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Check trade restriction violations
   */
  private checkTradeRestriction(action: NPCAction, law: Law): boolean {
    if (action.type !== 'trade' || !action.target) {
      return false;
    }

    // Get faction to check its philosophy
    const faction = this.factionManager.getFaction(law.factionId);
    if (!faction) return false;

    // BTC maxi factions only allow BTC-related tokens
    if (faction.ideology.cryptoPhilosophy === 'btc_maxi') {
      return !isBTCMaxiApproved(action.target);
    }

    // General restriction on memecoins
    return isRestrictedToken(action.target);
  }

  /**
   * Check curfew violations (being outside during restricted hours)
   */
  private checkCurfewViolation(action: NPCAction): boolean {
    if (action.type !== 'movement' || action.location !== 'outside') {
      return false;
    }

    const hour = action.time ?? new Date().getHours();
    
    // Check if within curfew hours (10 PM - 6 AM)
    if (hour >= DEFAULT_CURFEW_START || hour < DEFAULT_CURFEW_END) {
      return true;
    }

    return false;
  }

  /**
   * Check building permit violations
   */
  private checkBuildingPermit(action: NPCAction): boolean {
    if (action.type !== 'build') {
      return false;
    }

    return action.hasPermit === false;
  }

  /**
   * Check conduct code violations (personality-influenced)
   */
  private checkConductCode(npc: CryptoNPC, action: NPCAction): boolean {
    if (action.type === 'misconduct') {
      return true;
    }
    
    if (action.type !== 'risky_behavior' || action.riskLevel === undefined) {
      return false;
    }

    // Personality affects likelihood of violation
    const riskTolerance = npc.personality?.crypto?.riskTolerance ?? 0.5;
    
    // Higher risk tolerance = more likely to take risky actions
    // If the NPC's risk tolerance is higher than the action's risk level,
    // they're more likely to do it (and thus violate)
    const violationChance = riskTolerance * action.riskLevel;
    
    return Math.random() < violationChance;
  }

  /**
   * Check membership rule violations
   */
  private checkMembershipRule(action: NPCAction): boolean {
    // Membership violations are typically tracked through other mechanisms
    return false;
  }

  // ==========================================
  // VIOLATION RECORDING
  // ==========================================

  /**
   * Record a violation of a law.
   * 
   * @param lawId - ID of the violated law
   * @param violatorId - NPC ID of the violator
   * @param witnesses - Array of witness NPC IDs
   * @returns The recorded violation or null if invalid
   */
  recordViolation(
    lawId: string,
    violatorId: string,
    witnesses: string[]
  ): Violation | null {
    const law = this.laws.get(lawId);
    if (!law) {
      return null;
    }

    const violation: Violation = {
      id: this.generateViolationId(),
      lawId,
      violatorId,
      detectedAt: Date.now(),
      witnessed: witnesses,
      penaltyApplied: false,
    };

    this.violations.set(violation.id, violation);

    // Update NPC violation index
    if (!this.violationsByNPC.has(violatorId)) {
      this.violationsByNPC.set(violatorId, []);
    }
    this.violationsByNPC.get(violatorId)!.push(violation.id);

    return violation;
  }

  // ==========================================
  // PENALTY APPLICATION
  // ==========================================

  /**
   * Apply the penalty for a violation.
   * 
   * @param violationId - ID of the violation
   * @returns True if penalty applied successfully
   */
  applyPenalty(violationId: string): boolean {
    const violation = this.violations.get(violationId);
    if (!violation) {
      return false;
    }

    // Don't apply penalty twice
    if (violation.penaltyApplied) {
      return false;
    }

    const law = this.laws.get(violation.lawId);
    if (!law) {
      return false;
    }

    // Apply each penalty
    for (const penalty of law.penalties) {
      this.applyPenaltyType(penalty, law.factionId, violation.violatorId);
    }

    violation.penaltyApplied = true;
    return true;
  }

  /**
   * Apply a specific penalty type
   */
  private applyPenaltyType(
    penalty: Penalty,
    factionId: string,
    violatorId: string
  ): void {
    const faction = this.factionManager.getFaction(factionId);
    if (!faction) return;

    switch (penalty.type) {
      case 'fine':
        // Add fine to faction treasury
        if (penalty.amount) {
          faction.treasury += penalty.amount;
        }
        break;

      case 'exile':
        // Remove NPC from faction
        this.factionManager.leaveFaction(violatorId);
        break;

      case 'reputation_loss':
        // Reputation loss would be handled by reputation system
        // For now, this is a placeholder
        break;

      case 'imprisonment':
        // Imprisonment would restrict NPC movement
        // For now, this is a placeholder
        break;
    }
  }

  // ==========================================
  // QUERIES
  // ==========================================

  /**
   * Get all active laws for a faction.
   * 
   * @param factionId - Faction ID
   * @returns Array of active laws
   */
  getLawsForFaction(factionId: string): Law[] {
    const lawIds = this.lawsByFaction.get(factionId) ?? [];
    return lawIds
      .map(id => this.laws.get(id))
      .filter((law): law is Law => law !== undefined && law.status === 'active');
  }

  /**
   * Get a law by ID.
   * 
   * @param lawId - Law ID
   * @returns The law or null
   */
  getLaw(lawId: string): Law | null {
    return this.laws.get(lawId) ?? null;
  }

  /**
   * Get all violations by an NPC.
   * 
   * @param npcId - NPC ID
   * @returns Array of violations
   */
  getViolationsByNPC(npcId: string): Violation[] {
    const violationIds = this.violationsByNPC.get(npcId) ?? [];
    return violationIds
      .map(id => this.violations.get(id))
      .filter((v): v is Violation => v !== undefined);
  }

  /**
   * Get a violation by ID.
   * 
   * @param violationId - Violation ID
   * @returns The violation or null
   */
  getViolation(violationId: string): Violation | null {
    return this.violations.get(violationId) ?? null;
  }

  // ==========================================
  // LAW EXPIRATION
  // ==========================================

  /**
   * Check and expire any laws past their expiration date.
   * 
   * @returns Number of laws expired
   */
  updateLawExpiration(): number {
    const now = Date.now();
    let expiredCount = 0;

    for (const law of this.laws.values()) {
      if (
        law.status === 'active' &&
        law.expiresAt !== null &&
        law.expiresAt <= now
      ) {
        law.status = 'expired';
        expiredCount++;
      }
    }

    return expiredCount;
  }

  // ==========================================
  // SERIALIZATION
  // ==========================================

  /**
   * Serialize all law data for storage.
   */
  serialize(): {
    laws: SerializedLaw[];
    violations: SerializedViolation[];
    lawIdCounter: number;
    violationIdCounter: number;
  } {
    return {
      laws: Array.from(this.laws.values()).map(serializeLaw),
      violations: Array.from(this.violations.values()).map(serializeViolation),
      lawIdCounter: this.lawIdCounter,
      violationIdCounter: this.violationIdCounter,
    };
  }

  /**
   * Deserialize law data from storage.
   */
  deserialize(data: {
    laws: SerializedLaw[];
    violations: SerializedViolation[];
    lawIdCounter: number;
    violationIdCounter: number;
  }): void {
    this.laws.clear();
    this.violations.clear();
    this.lawsByFaction.clear();
    this.violationsByNPC.clear();

    // Restore laws
    for (const serialized of data.laws) {
      const law = deserializeLaw(serialized);
      this.laws.set(law.id, law);
      
      // Rebuild faction index
      if (!this.lawsByFaction.has(law.factionId)) {
        this.lawsByFaction.set(law.factionId, []);
      }
      this.lawsByFaction.get(law.factionId)!.push(law.id);
    }

    // Restore violations
    for (const serialized of data.violations) {
      const violation = deserializeViolation(serialized);
      this.violations.set(violation.id, violation);
      
      // Rebuild NPC index
      if (!this.violationsByNPC.has(violation.violatorId)) {
        this.violationsByNPC.set(violation.violatorId, []);
      }
      this.violationsByNPC.get(violation.violatorId)!.push(violation.id);
    }

    this.lawIdCounter = data.lawIdCounter;
    this.violationIdCounter = data.violationIdCounter;
  }
}
