/**
 * CultureManager - Manages cultural transmission in Crypto City
 *
 * Handles cultural norms, traditions, mentorship, cultural drift,
 * and innovation spread through NPC populations.
 */

import type {
  CulturalNorm,
  NormType,
  Tradition,
  TraditionFrequency,
  Mentorship,
  CulturalDrift,
  Innovation,
  SpreadPattern,
  SerializedCulturalNorm,
  SerializedTradition,
} from './culture';
import {
  createDefaultNorm,
  createDefaultTradition,
  createDefaultMentorship,
  createDefaultInnovation,
  serializeNorm,
  deserializeNorm,
  serializeTradition,
  deserializeTradition,
} from './culture';

/**
 * Time durations for tradition frequencies (in ms)
 */
const FREQUENCY_DURATIONS: Record<TraditionFrequency, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

/**
 * Base adoption probability for norm spread
 */
const BASE_ADOPTION_PROBABILITY = 0.3;

/**
 * XP multiplier for mentorship vs self-learning
 */
const MENTORSHIP_XP_MULTIPLIER = 1.5;

/**
 * Maximum drift from original value
 */
const MAX_DRIFT_MAGNITUDE = 1.0;

/**
 * Default drift rate per time unit
 */
const DEFAULT_DRIFT_RATE = 0.01;

/**
 * Spread rate multipliers for different patterns
 */
const SPREAD_PATTERN_MULTIPLIERS: Record<SpreadPattern, number> = {
  viral: 2.0,
  gradual: 1.0,
  localized: 0.5,
};

/**
 * Subculture representation
 */
export interface Subculture {
  /** NPCs in this subculture */
  members: Set<string>;
  /** Norms shared by this subculture */
  sharedNorms: Set<string>;
  /** Distinctiveness score (how different from main culture) */
  distinctiveness: number;
}

/**
 * Serialized state for persistence
 */
export interface SerializedCultureState {
  norms: SerializedCulturalNorm[];
  traditions: SerializedTradition[];
  mentorships: Mentorship[];
  innovations: Innovation[];
  drifts: CulturalDrift[];
  populationSize: number;
  factionMembers: [string, string[]][];
  npcOpenness: [string, number][];
}

/**
 * CultureManager handles all cultural transmission operations
 */
export class CultureManager {
  /** Registry of all cultural norms */
  private norms: Map<string, CulturalNorm> = new Map();

  /** Registry of all traditions */
  private traditions: Map<string, Tradition> = new Map();

  /** Registry of all mentorships */
  private mentorships: Map<string, Mentorship> = new Map();

  /** Registry of all innovations */
  private innovations: Map<string, Innovation> = new Map();

  /** Cultural drift tracking */
  private drifts: Map<string, CulturalDrift> = new Map();

  /** Total population for prevalence calculations */
  private populationSize: number = 100;

  /** Faction membership mapping */
  private factionMembers: Map<string, Set<string>> = new Map();

  /** NPC openness traits for innovation spread */
  private npcOpenness: Map<string, number> = new Map();

  // ==================== Population Setup ====================

  /**
   * Set the total population size for prevalence calculations
   */
  setPopulationSize(size: number): void {
    this.populationSize = Math.max(1, size);
  }

  /**
   * Set faction members for subculture analysis
   */
  setFactionMembers(factionId: string, memberIds: string[]): void {
    this.factionMembers.set(factionId, new Set(memberIds));
  }

  /**
   * Set NPC openness trait for innovation spread calculations
   */
  setNPCOpenness(npcId: string, openness: number): void {
    this.npcOpenness.set(npcId, Math.max(0, Math.min(1, openness)));
  }

  // ==================== Norm Operations ====================

  /**
   * Create a new cultural norm
   *
   * @param name - Name of the norm
   * @param type - Type of norm
   * @param originFactionId - Optional faction origin
   * @returns The created norm
   */
  createNorm(name: string, type: NormType, originFactionId?: string): CulturalNorm {
    const norm = createDefaultNorm(name, type, originFactionId);
    this.norms.set(norm.id, norm);
    return norm;
  }

  /**
   * Get a norm by ID
   */
  getNorm(id: string): CulturalNorm | null {
    return this.norms.get(id) ?? null;
  }

  /**
   * Get all norms
   */
  getAllNorms(): CulturalNorm[] {
    return Array.from(this.norms.values());
  }

  /**
   * NPC adopts a cultural norm
   *
   * @param npcId - NPC ID
   * @param normId - Norm ID
   * @returns True if adoption successful
   */
  adoptNorm(npcId: string, normId: string): boolean {
    const norm = this.norms.get(normId);
    if (!norm) return false;

    norm.adoptedBy.add(npcId);
    this.updatePrevalence(norm);
    return true;
  }

  /**
   * NPC stops following a norm
   */
  unadoptNorm(npcId: string, normId: string): boolean {
    const norm = this.norms.get(normId);
    if (!norm) return false;

    const result = norm.adoptedBy.delete(npcId);
    this.updatePrevalence(norm);
    return result;
  }

  /**
   * Update norm prevalence based on adoption count
   */
  private updatePrevalence(norm: CulturalNorm): void {
    norm.prevalence = norm.adoptedBy.size / this.populationSize;
  }

  /**
   * Spread a norm through social connections
   *
   * @param normId - Norm to spread
   * @param socialNetwork - Map of NPC connections
   * @returns Number of new adopters
   */
  spreadNorm(normId: string, socialNetwork: Record<string, string[]>): number {
    const norm = this.norms.get(normId);
    if (!norm) return 0;

    let newAdopters = 0;
    const currentAdopters = new Set(norm.adoptedBy);

    for (const adopterId of currentAdopters) {
      const connections = socialNetwork[adopterId] ?? [];

      for (const connectionId of connections) {
        // Skip if already adopted
        if (norm.adoptedBy.has(connectionId)) continue;

        // Calculate adoption probability based on social influence
        const influenceStrength = this.calculateInfluenceStrength(adopterId, connectionId, socialNetwork);
        const probability = BASE_ADOPTION_PROBABILITY * influenceStrength;

        if (Math.random() < probability) {
          norm.adoptedBy.add(connectionId);
          newAdopters++;
        }
      }
    }

    this.updatePrevalence(norm);
    return newAdopters;
  }

  /**
   * Calculate influence strength between two NPCs
   */
  private calculateInfluenceStrength(
    influencerId: string,
    targetId: string,
    socialNetwork: Record<string, string[]>
  ): number {
    // More mutual connections = stronger influence
    const influencerConnections = new Set(socialNetwork[influencerId] ?? []);
    const targetConnections = new Set(socialNetwork[targetId] ?? []);

    let mutualConnections = 0;
    for (const conn of influencerConnections) {
      if (targetConnections.has(conn)) mutualConnections++;
    }

    // Base influence + bonus for mutual connections
    return 1.0 + mutualConnections * 0.1;
  }

  // ==================== Tradition Operations ====================

  /**
   * Create a faction tradition
   */
  createTradition(
    factionId: string,
    name: string,
    frequency: TraditionFrequency
  ): Tradition {
    const tradition = createDefaultTradition(factionId, name, frequency);
    this.traditions.set(tradition.id, tradition);
    return tradition;
  }

  /**
   * Get a tradition by ID
   */
  getTradition(id: string): Tradition | null {
    return this.traditions.get(id) ?? null;
  }

  /**
   * Get all traditions for a faction
   */
  getFactionTraditions(factionId: string): Tradition[] {
    return Array.from(this.traditions.values()).filter(
      (t) => t.factionId === factionId
    );
  }

  /**
   * Observe a tradition
   *
   * @param traditionId - Tradition to observe
   * @param participants - NPCs participating
   * @returns True if observation successful
   */
  observeTradition(traditionId: string, participants: string[]): boolean {
    const tradition = this.traditions.get(traditionId);
    if (!tradition) return false;

    tradition.lastObserved = Date.now();
    tradition.participants = new Set(participants);
    return true;
  }

  /**
   * Check if a tradition is due for observance
   */
  isDueForObservance(traditionId: string): boolean {
    const tradition = this.traditions.get(traditionId);
    if (!tradition) return false;

    if (tradition.lastObserved === null) return true;

    const duration = FREQUENCY_DURATIONS[tradition.frequency];
    const timeSinceObserved = Date.now() - tradition.lastObserved;
    return timeSinceObserved >= duration;
  }

  // ==================== Mentorship Operations ====================

  /**
   * Start a mentorship relationship
   */
  startMentorship(mentorId: string, menteeId: string, skill: string): Mentorship {
    const mentorship = createDefaultMentorship(mentorId, menteeId, skill);
    this.mentorships.set(mentorship.id, mentorship);
    return mentorship;
  }

  /**
   * Get a mentorship by ID
   */
  getMentorship(id: string): Mentorship | null {
    return this.mentorships.get(id) ?? null;
  }

  /**
   * Get all mentorships where NPC is mentor
   */
  getMentorshipsForMentor(mentorId: string): Mentorship[] {
    return Array.from(this.mentorships.values()).filter(
      (m) => m.mentorId === mentorId
    );
  }

  /**
   * Get all mentorships where NPC is mentee
   */
  getMentorshipsForMentee(menteeId: string): Mentorship[] {
    return Array.from(this.mentorships.values()).filter(
      (m) => m.menteeId === menteeId
    );
  }

  /**
   * Progress a mentorship
   *
   * @param mentorshipId - Mentorship to progress
   * @param amount - Progress amount (0-1)
   * @returns True if progress successful
   */
  progressMentorship(mentorshipId: string, amount: number): boolean {
    const mentorship = this.mentorships.get(mentorshipId);
    if (!mentorship) return false;

    mentorship.progress = Math.min(1.0, mentorship.progress + amount);
    return true;
  }

  /**
   * Complete a mentorship (must be at 100% progress)
   *
   * @param mentorshipId - Mentorship to complete
   * @returns True if completion successful
   */
  completeMentorship(mentorshipId: string): boolean {
    const mentorship = this.mentorships.get(mentorshipId);
    if (!mentorship) return false;

    if (mentorship.progress < 1.0) return false;

    mentorship.completed = true;
    return true;
  }

  /**
   * Get the XP multiplier for mentorship learning
   */
  getMentorshipXPMultiplier(): number {
    return MENTORSHIP_XP_MULTIPLIER;
  }

  // ==================== Cultural Drift Operations ====================

  /**
   * Apply cultural drift to a norm over time
   *
   * @param normId - Norm to drift
   * @param deltaTime - Time units passed
   */
  applyCulturalDrift(normId: string, deltaTime: number): void {
    const norm = this.norms.get(normId);
    if (!norm) return;

    let drift = this.drifts.get(normId);

    if (!drift) {
      drift = {
        normId,
        originalValue: norm.prevalence,
        currentValue: norm.prevalence,
        driftRate: DEFAULT_DRIFT_RATE,
      };
      this.drifts.set(normId, drift);
    }

    // Random walk drift
    const driftAmount = (Math.random() - 0.5) * 2 * drift.driftRate * deltaTime;
    const newValue = drift.currentValue + driftAmount;

    // Bound drift to max magnitude from original
    const maxValue = drift.originalValue + MAX_DRIFT_MAGNITUDE;
    const minValue = drift.originalValue - MAX_DRIFT_MAGNITUDE;
    drift.currentValue = Math.max(minValue, Math.min(maxValue, newValue));
  }

  /**
   * Get drift data for a norm
   */
  getDrift(normId: string): CulturalDrift | null {
    return this.drifts.get(normId) ?? null;
  }

  /**
   * Set custom drift rate for a norm
   */
  setDriftRate(normId: string, rate: number): void {
    const drift = this.drifts.get(normId);
    if (drift) {
      drift.driftRate = rate;
    } else {
      const norm = this.norms.get(normId);
      if (norm) {
        this.drifts.set(normId, {
          normId,
          originalValue: norm.prevalence,
          currentValue: norm.prevalence,
          driftRate: rate,
        });
      }
    }
  }

  // ==================== Innovation Operations ====================

  /**
   * Create a new innovation
   */
  createInnovation(
    innovatorId: string,
    type: NormType,
    description: string
  ): Innovation {
    const innovation = createDefaultInnovation(innovatorId, type, description);
    this.innovations.set(innovation.id, innovation);
    return innovation;
  }

  /**
   * Get an innovation by ID
   */
  getInnovation(id: string): Innovation | null {
    return this.innovations.get(id) ?? null;
  }

  /**
   * Set spread pattern for an innovation
   */
  setSpreadPattern(innovationId: string, pattern: SpreadPattern): void {
    const innovation = this.innovations.get(innovationId);
    if (innovation) {
      innovation.spreadPattern = pattern;
    }
  }

  /**
   * Spread an innovation
   *
   * @param innovationId - Innovation to spread
   * @returns Number of new adopters
   */
  spreadInnovation(innovationId: string): number {
    const innovation = this.innovations.get(innovationId);
    if (!innovation) return 0;

    const multiplier = SPREAD_PATTERN_MULTIPLIERS[innovation.spreadPattern];
    const innovatorOpenness = this.npcOpenness.get(innovation.innovatorId) ?? 0.5;

    // Base spread rate modified by openness and pattern
    const spreadRate = 0.1 * multiplier * (0.5 + innovatorOpenness);

    // Simulate spread
    const newAdopters = Math.floor(
      (1 - innovation.adoptionRate) * this.populationSize * spreadRate
    );

    innovation.adoptionRate = Math.min(
      1,
      innovation.adoptionRate + newAdopters / this.populationSize
    );

    return newAdopters;
  }

  /**
   * Calculate spread rate for an NPC based on openness
   */
  calculateSpreadRate(npcId: string): number {
    const openness = this.npcOpenness.get(npcId) ?? 0.5;
    return 0.1 + openness * 0.2; // Range 0.1 to 0.3
  }

  /**
   * Convert a successful innovation to a cultural norm
   */
  convertInnovationToNorm(innovationId: string): CulturalNorm | null {
    const innovation = this.innovations.get(innovationId);
    if (!innovation || innovation.adoptionRate < 0.3) return null;

    const norm = this.createNorm(
      innovation.description,
      innovation.type
    );

    return norm;
  }

  // ==================== Subculture Operations ====================

  /**
   * Get subcultures within a faction based on norm clustering
   *
   * @param factionId - Faction to analyze
   * @returns Array of subcultures
   */
  getSubcultures(factionId: string): Subculture[] {
    const members = this.factionMembers.get(factionId);
    if (!members || members.size === 0) return [];

    // Build norm adoption matrix
    const memberNorms: Map<string, Set<string>> = new Map();

    for (const memberId of members) {
      const adoptedNorms = new Set<string>();
      for (const norm of this.norms.values()) {
        if (norm.adoptedBy.has(memberId)) {
          adoptedNorms.add(norm.id);
        }
      }
      memberNorms.set(memberId, adoptedNorms);
    }

    // Simple clustering: group by shared norm sets
    const subcultureMap: Map<string, Subculture> = new Map();

    for (const [memberId, norms] of memberNorms) {
      // Create a key from sorted norm IDs
      const normKey = Array.from(norms).sort().join(',');

      if (!subcultureMap.has(normKey)) {
        subcultureMap.set(normKey, {
          members: new Set(),
          sharedNorms: new Set(norms),
          distinctiveness: 0,
        });
      }

      subcultureMap.get(normKey)!.members.add(memberId);
    }

    // Calculate distinctiveness (how different from majority)
    const subcultures = Array.from(subcultureMap.values());

    if (subcultures.length <= 1) {
      return subcultures;
    }

    // Find most common norms across all members
    const allNormCounts: Map<string, number> = new Map();
    for (const norms of memberNorms.values()) {
      for (const normId of norms) {
        allNormCounts.set(normId, (allNormCounts.get(normId) ?? 0) + 1);
      }
    }

    const majorityThreshold = members.size / 2;
    const majorityNorms = new Set(
      Array.from(allNormCounts.entries())
        .filter(([_, count]) => count >= majorityThreshold)
        .map(([normId, _]) => normId)
    );

    // Calculate distinctiveness for each subculture
    for (const subculture of subcultures) {
      let differentNorms = 0;

      // Count norms that differ from majority
      for (const normId of subculture.sharedNorms) {
        if (!majorityNorms.has(normId)) differentNorms++;
      }
      for (const normId of majorityNorms) {
        if (!subculture.sharedNorms.has(normId)) differentNorms++;
      }

      subculture.distinctiveness =
        differentNorms / (majorityNorms.size + subculture.sharedNorms.size || 1);
    }

    return subcultures;
  }

  // ==================== Serialization ====================

  /**
   * Serialize all culture state for storage
   */
  serialize(): SerializedCultureState {
    return {
      norms: Array.from(this.norms.values()).map(serializeNorm),
      traditions: Array.from(this.traditions.values()).map(serializeTradition),
      mentorships: Array.from(this.mentorships.values()),
      innovations: Array.from(this.innovations.values()),
      drifts: Array.from(this.drifts.values()),
      populationSize: this.populationSize,
      factionMembers: Array.from(this.factionMembers.entries()).map(
        ([k, v]) => [k, Array.from(v)] as [string, string[]]
      ),
      npcOpenness: Array.from(this.npcOpenness.entries()),
    };
  }

  /**
   * Deserialize culture state from storage
   */
  deserialize(data: SerializedCultureState): void {
    this.norms.clear();
    this.traditions.clear();
    this.mentorships.clear();
    this.innovations.clear();
    this.drifts.clear();
    this.factionMembers.clear();
    this.npcOpenness.clear();

    for (const serialized of data.norms) {
      const norm = deserializeNorm(serialized);
      this.norms.set(norm.id, norm);
    }

    for (const serialized of data.traditions) {
      const tradition = deserializeTradition(serialized);
      this.traditions.set(tradition.id, tradition);
    }

    for (const mentorship of data.mentorships) {
      this.mentorships.set(mentorship.id, mentorship);
    }

    for (const innovation of data.innovations) {
      this.innovations.set(innovation.id, innovation);
    }

    for (const drift of data.drifts) {
      this.drifts.set(drift.normId, drift);
    }

    this.populationSize = data.populationSize;

    for (const [factionId, members] of data.factionMembers) {
      this.factionMembers.set(factionId, new Set(members));
    }

    for (const [npcId, openness] of data.npcOpenness) {
      this.npcOpenness.set(npcId, openness);
    }
  }
}
