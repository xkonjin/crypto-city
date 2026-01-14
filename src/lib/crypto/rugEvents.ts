/**
 * Rug Pull Event System
 * 
 * Handles rug risk calculations, event triggers, and building destruction.
 * Core differentiator from generic city builders.
 * 
 * Issue #147: Implement rug risk event system
 */

import type { CryptoBuildingDefinition } from '@/games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

export interface RugEvent {
  id: string;
  buildingId: string;
  buildingName: string;
  position: { x: number; y: number };
  timestamp: number;
  lostValue: number;
  recoveredValue: number;
  wasInsured: boolean;
  phase: RugEventPhase;
}

export type RugEventPhase = 
  | 'warning'      // Building showing signs of trouble
  | 'imminent'     // About to rug
  | 'rugging'      // Animation playing
  | 'rugged'       // Complete, tile in recovery
  | 'recovered';   // Tile available again

export interface RugRiskFactors {
  baseRisk: number;           // From building definition
  auditorProtection: number;  // Reduction from nearby auditors
  insuranceCoverage: number;  // Recovery % from insurance
  marketMultiplier: number;   // From market cycle
  ageMultiplier: number;      // Older buildings slightly safer
}

export interface BuildingRiskAssessment {
  buildingId: string;
  position: { x: number; y: number };
  totalRisk: number;
  factors: RugRiskFactors;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'extreme';
  warning: string | null;
}

export interface RuggedTile {
  x: number;
  y: number;
  ruggedAt: number;
  recoveryTime: number;  // Game hours until available
  originalBuildingId: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Base probability multiplier (per game day)
export const RUG_CHECK_INTERVAL = 24; // Check once per day (24 ticks)

// Recovery time in game hours
export const DEFAULT_RECOVERY_TIME = 720; // 30 game days

// Risk level thresholds
export const RISK_THRESHOLDS = {
  none: 0,
  low: 0.01,
  medium: 0.05,
  high: 0.1,
  extreme: 0.2,
};

// Warning messages
export const RUG_WARNINGS: Record<string, string | null> = {
  none: null,
  low: null,
  medium: "This building's smart contract is showing some concerning patterns...",
  high: "Multiple red flags detected. The founder just changed their Twitter bio to 'Building'...",
  extreme: "EXTREME RISK: Dev wallet moving funds. This is not financial advice but... 👀",
};

// Cobie-style commentary for rug events
export const RUG_COMMENTARY = [
  "Another one bites the dust. At least you learned something, probably.",
  "Rugged. Classic. Have you considered a career in traditional finance?",
  "The smart contract was neither smart nor much of a contract.",
  "And that's why we say 'not your keys, not your coins'. Oh wait, that doesn't help here.",
  "In the wise words of countless crypto founders: 'We're pivoting.'",
  "The protocol has entered what experts call 'the inevitable phase'.",
  "Fun fact: This building's audit was done by a Discord mod named CryptoKing_69.",
  "The good news: You now have a tax loss. The bad news: Everything else.",
];

// =============================================================================
// RISK CALCULATION
// =============================================================================

/**
 * Calculate total rug risk for a building
 */
export function calculateBuildingRisk(
  building: CryptoBuildingDefinition,
  position: { x: number; y: number },
  context: {
    nearbyAuditors: number;
    nearbyInsurance: number;
    marketPhase: 'accumulation' | 'bull' | 'distribution' | 'bear';
    buildingAge: number; // In game days
    protectionRadius?: Array<{ reduction: number; distance: number }>;
  }
): BuildingRiskAssessment {
  const baseRisk = building.crypto?.effects?.rugRisk ?? 0;
  
  // No risk if building has none
  if (baseRisk === 0) {
    return {
      buildingId: building.id,
      position,
      totalRisk: 0,
      factors: {
        baseRisk: 0,
        auditorProtection: 0,
        insuranceCoverage: 0,
        marketMultiplier: 1,
        ageMultiplier: 1,
      },
      riskLevel: 'none',
      warning: null,
    };
  }
  
  // Calculate protection from auditors
  let auditorProtection = 0;
  if (context.protectionRadius) {
    for (const protector of context.protectionRadius) {
      // Protection falls off with distance
      const distanceFactor = Math.max(0, 1 - (protector.distance / 10));
      auditorProtection += protector.reduction * distanceFactor;
    }
  }
  auditorProtection = Math.min(0.8, auditorProtection); // Cap at 80% reduction
  
  // Insurance coverage (doesn't reduce risk, just recovery)
  const insuranceCoverage = Math.min(0.95, context.nearbyInsurance * 0.25);
  
  // Market cycle affects risk
  const marketMultipliers: Record<string, number> = {
    accumulation: 0.7,
    bull: 1.2,      // More scams during bull runs
    distribution: 1.5, // Peak scam season
    bear: 2.0,      // Desperate protocols rug
  };
  const marketMultiplier = marketMultipliers[context.marketPhase] ?? 1;
  
  // Older buildings slightly safer (survived this long)
  const ageMultiplier = Math.max(0.5, 1 - (context.buildingAge / 365) * 0.3);
  
  // Calculate total risk
  const totalRisk = baseRisk 
    * (1 - auditorProtection) 
    * marketMultiplier 
    * ageMultiplier;
  
  // Determine risk level
  let riskLevel: BuildingRiskAssessment['riskLevel'] = 'none';
  if (totalRisk >= RISK_THRESHOLDS.extreme) riskLevel = 'extreme';
  else if (totalRisk >= RISK_THRESHOLDS.high) riskLevel = 'high';
  else if (totalRisk >= RISK_THRESHOLDS.medium) riskLevel = 'medium';
  else if (totalRisk >= RISK_THRESHOLDS.low) riskLevel = 'low';
  
  return {
    buildingId: building.id,
    position,
    totalRisk,
    factors: {
      baseRisk,
      auditorProtection,
      insuranceCoverage,
      marketMultiplier,
      ageMultiplier,
    },
    riskLevel,
    warning: RUG_WARNINGS[riskLevel],
  };
}

/**
 * Check if a building should rug this tick
 */
export function shouldTriggerRug(risk: BuildingRiskAssessment): boolean {
  if (risk.totalRisk === 0) return false;
  
  // Daily probability check
  const dailyProbability = risk.totalRisk;
  return Math.random() < dailyProbability;
}

// =============================================================================
// EVENT GENERATION
// =============================================================================

/**
 * Generate a rug event for a building
 */
export function createRugEvent(
  building: CryptoBuildingDefinition,
  position: { x: number; y: number },
  risk: BuildingRiskAssessment,
  gameTime: number
): RugEvent {
  const lostValue = building.cost;
  const recoveredValue = Math.floor(lostValue * risk.factors.insuranceCoverage);
  
  return {
    id: `rug-${building.id}-${gameTime}`,
    buildingId: building.id,
    buildingName: building.name,
    position,
    timestamp: gameTime,
    lostValue,
    recoveredValue,
    wasInsured: risk.factors.insuranceCoverage > 0,
    phase: 'warning',
  };
}

/**
 * Get random Cobie commentary for a rug event
 */
export function getRugCommentary(): string {
  return RUG_COMMENTARY[Math.floor(Math.random() * RUG_COMMENTARY.length)];
}

// =============================================================================
// RUG EVENT MANAGER
// =============================================================================

type RugEventCallback = (event: RugEvent) => void;

export class RugEventManager {
  private activeEvents: Map<string, RugEvent> = new Map();
  private ruggedTiles: Map<string, RuggedTile> = new Map();
  private callbacks: {
    onWarning: RugEventCallback[];
    onRug: RugEventCallback[];
    onRecovery: RugEventCallback[];
  } = {
    onWarning: [],
    onRug: [],
    onRecovery: [],
  };
  
  /**
   * Process a potential rug event
   */
  processBuilding(
    building: CryptoBuildingDefinition,
    position: { x: number; y: number },
    risk: BuildingRiskAssessment,
    gameTime: number
  ): RugEvent | null {
    // Check if should rug
    if (!shouldTriggerRug(risk)) {
      return null;
    }
    
    // Create event
    const event = createRugEvent(building, position, risk, gameTime);
    this.activeEvents.set(event.id, event);
    
    // Emit warning
    this.emit('onWarning', event);
    
    // Schedule progression (in real implementation, this would be tick-based)
    this.progressEvent(event.id);
    
    return event;
  }
  
  /**
   * Progress an event through phases
   */
  private progressEvent(eventId: string): void {
    const event = this.activeEvents.get(eventId);
    if (!event) return;
    
    switch (event.phase) {
      case 'warning':
        event.phase = 'imminent';
        break;
      case 'imminent':
        event.phase = 'rugging';
        break;
      case 'rugging':
        event.phase = 'rugged';
        this.emit('onRug', event);
        this.createRuggedTile(event);
        break;
      case 'rugged':
        event.phase = 'recovered';
        this.emit('onRecovery', event);
        this.activeEvents.delete(eventId);
        break;
    }
  }
  
  /**
   * Create a rugged tile that needs recovery time
   */
  private createRuggedTile(event: RugEvent): void {
    const key = `${event.position.x},${event.position.y}`;
    this.ruggedTiles.set(key, {
      x: event.position.x,
      y: event.position.y,
      ruggedAt: event.timestamp,
      recoveryTime: DEFAULT_RECOVERY_TIME,
      originalBuildingId: event.buildingId,
    });
  }
  
  /**
   * Check if a tile is in recovery
   */
  isTileRugged(x: number, y: number): boolean {
    return this.ruggedTiles.has(`${x},${y}`);
  }
  
  /**
   * Get rugged tile info
   */
  getRuggedTile(x: number, y: number): RuggedTile | undefined {
    return this.ruggedTiles.get(`${x},${y}`);
  }
  
  /**
   * Update recovery timers
   */
  tick(gameTime: number): void {
    for (const [key, tile] of this.ruggedTiles) {
      const elapsed = gameTime - tile.ruggedAt;
      if (elapsed >= tile.recoveryTime) {
        this.ruggedTiles.delete(key);
      }
    }
  }
  
  /**
   * Subscribe to events
   */
  on(event: 'warning' | 'rug' | 'recovery', callback: RugEventCallback): () => void {
    const key = `on${event.charAt(0).toUpperCase() + event.slice(1)}` as keyof typeof this.callbacks;
    this.callbacks[key].push(callback);
    
    return () => {
      const index = this.callbacks[key].indexOf(callback);
      if (index > -1) {
        this.callbacks[key].splice(index, 1);
      }
    };
  }
  
  private emit(event: keyof typeof this.callbacks, data: RugEvent): void {
    for (const callback of this.callbacks[event]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Rug event callback error:`, error);
      }
    }
  }
  
  /**
   * Get all active events
   */
  getActiveEvents(): RugEvent[] {
    return Array.from(this.activeEvents.values());
  }
  
  /**
   * Get all rugged tiles
   */
  getRuggedTiles(): RuggedTile[] {
    return Array.from(this.ruggedTiles.values());
  }
  
  /**
   * Serialize state for save
   */
  serialize(): string {
    return JSON.stringify({
      activeEvents: Array.from(this.activeEvents.entries()),
      ruggedTiles: Array.from(this.ruggedTiles.entries()),
    });
  }
  
  /**
   * Deserialize state from save
   */
  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.activeEvents = new Map(parsed.activeEvents);
      this.ruggedTiles = new Map(parsed.ruggedTiles);
    } catch (error) {
      console.error('Failed to deserialize rug event state:', error);
    }
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let rugEventManagerInstance: RugEventManager | null = null;

export function getRugEventManager(): RugEventManager {
  if (!rugEventManagerInstance) {
    rugEventManagerInstance = new RugEventManager();
  }
  return rugEventManagerInstance;
}

export function resetRugEventManager(): void {
  rugEventManagerInstance = null;
}
