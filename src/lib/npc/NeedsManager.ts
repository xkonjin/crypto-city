/**
 * NeedsManager - Manages NPC needs decay and satisfaction
 * 
 * This manager handles:
 * - Decaying all needs over time
 * - Satisfying specific needs
 * - Finding the most urgent need
 * - Getting activities that satisfy needs
 * - Utility AI scoring for action selection
 */

import {
  Need,
  NPCNeeds,
  NeedType,
  DECAY_RATES,
  CRITICAL_THRESHOLDS,
  DEFAULT_WEIGHTS,
  NEED_SATISFIERS,
} from './needs';

/**
 * Action interface for Utility AI scoring.
 */
export interface NPCAction {
  /** Unique identifier for the action */
  id: string;
  /** Effects on needs (positive values increase the need) */
  needEffects: Partial<Record<NeedType, number>>;
}

/**
 * Result from getMostUrgentNeed
 */
export interface UrgentNeedResult {
  /** Name of the most urgent need */
  name: NeedType;
  /** The need object itself */
  need: Need;
  /** Urgency score (higher = more urgent) */
  urgencyScore: number;
}

/**
 * NeedsManager handles all operations related to NPC needs.
 */
export class NeedsManager {
  /**
   * Update all needs by decaying them over time.
   * 
   * @param needs - The NPC's current needs
   * @param deltaTimeMinutes - Time elapsed in game minutes
   * @returns Updated needs object
   */
  updateNeeds(needs: NPCNeeds, deltaTimeMinutes: number): NPCNeeds {
    const updatedNeeds = { ...needs };

    for (const key of Object.keys(needs) as NeedType[]) {
      const need = { ...needs[key] };
      const decay = need.decayRate * deltaTimeMinutes;
      need.current = Math.max(0, need.current - decay);
      updatedNeeds[key] = need;
    }

    return updatedNeeds;
  }

  /**
   * Satisfy a specific need by adding to its current value.
   * 
   * @param needs - The NPC's current needs
   * @param needName - Which need to satisfy
   * @param amount - Amount to add (positive value)
   * @returns Updated needs object
   */
  satisfyNeed(needs: NPCNeeds, needName: NeedType, amount: number): NPCNeeds {
    const updatedNeeds = { ...needs };
    const need = { ...needs[needName] };
    
    need.current = Math.min(need.max, need.current + amount);
    updatedNeeds[needName] = need;

    return updatedNeeds;
  }

  /**
   * Get the most urgent need based on current value, critical threshold, and weight.
   * 
   * Urgency formula:
   * - Base urgency = (max - current) / max * weight
   * - If below critical threshold: urgency * 2 (crisis multiplier)
   * 
   * @param needs - The NPC's current needs
   * @returns The most urgent need with its details
   */
  getMostUrgentNeed(needs: NPCNeeds): UrgentNeedResult {
    let mostUrgent: UrgentNeedResult | null = null;

    for (const key of Object.keys(needs) as NeedType[]) {
      const need = needs[key];
      const deficit = (need.max - need.current) / need.max;
      const isCritical = need.current <= CRITICAL_THRESHOLDS[key];
      
      // Calculate urgency score
      let urgencyScore = deficit * need.weight;
      
      // Crisis multiplier for critical needs
      if (isCritical) {
        urgencyScore *= 2;
      }

      if (!mostUrgent || urgencyScore > mostUrgent.urgencyScore) {
        mostUrgent = {
          name: key,
          need,
          urgencyScore,
        };
      }
    }

    // Should never be null since NPCNeeds always has all six needs
    return mostUrgent!;
  }

  /**
   * Get activities that can satisfy a specific need.
   * 
   * @param needName - The need to get satisfiers for
   * @returns Array of activity identifiers
   */
  getNeedsSatisfiers(needName: NeedType): string[] {
    return NEED_SATISFIERS[needName] || [];
  }

  /**
   * Check if a specific need is below its critical threshold.
   * 
   * @param need - The need to check
   * @param needName - The name of the need (for threshold lookup)
   * @returns true if the need is critical (urgent)
   */
  isNeedCritical(need: Need, needName: NeedType): boolean {
    return need.current <= CRITICAL_THRESHOLDS[needName];
  }

  /**
   * Get all needs that are currently below their critical thresholds.
   * 
   * @param needs - The NPC's current needs
   * @returns Array of need names that are critical
   */
  getAllCriticalNeeds(needs: NPCNeeds): NeedType[] {
    const criticalNeeds: NeedType[] = [];

    for (const key of Object.keys(needs) as NeedType[]) {
      if (this.isNeedCritical(needs[key], key)) {
        criticalNeeds.push(key);
      }
    }

    return criticalNeeds;
  }

  /**
   * Score an action based on how well it satisfies the NPC's needs.
   * 
   * Higher score = more desirable action.
   * 
   * Formula:
   * For each need effect:
   *   score += effect * (deficit / max) * weight * urgencyMultiplier
   * 
   * Where:
   *   deficit = max - current
   *   urgencyMultiplier = 2 if below critical threshold, else 1
   * 
   * @param action - The action to score
   * @param needs - The NPC's current needs
   * @returns Score (higher = more desirable)
   */
  scoreAction(action: NPCAction, needs: NPCNeeds): number {
    let score = 0;

    for (const [needName, effect] of Object.entries(action.needEffects)) {
      const key = needName as NeedType;
      const need = needs[key];
      
      if (!need || effect === undefined) continue;

      const deficit = need.max - need.current;
      const deficitRatio = deficit / need.max;
      const urgencyMultiplier = this.isNeedCritical(need, key) ? 2.0 : 1.0;

      // Score contribution = effect * how much we need it * weight * urgency
      score += effect * deficitRatio * need.weight * urgencyMultiplier;
    }

    return score;
  }

  /**
   * Get the overall satisfaction level (0-100).
   * Average of all needs weighted by their importance.
   * 
   * @param needs - The NPC's current needs
   * @returns Overall satisfaction percentage
   */
  getOverallSatisfaction(needs: NPCNeeds): number {
    let totalWeightedValue = 0;
    let totalWeight = 0;

    for (const key of Object.keys(needs) as NeedType[]) {
      const need = needs[key];
      totalWeightedValue += (need.current / need.max) * need.weight;
      totalWeight += need.weight;
    }

    return totalWeight > 0 ? (totalWeightedValue / totalWeight) * 100 : 0;
  }

  /**
   * Predict how long until a need becomes critical.
   * 
   * @param need - The need to check
   * @param needName - The name of the need
   * @returns Minutes until critical, or 0 if already critical
   */
  getMinutesUntilCritical(need: Need, needName: NeedType): number {
    const threshold = CRITICAL_THRESHOLDS[needName];
    
    if (need.current <= threshold) {
      return 0; // Already critical
    }

    const distanceToThreshold = need.current - threshold;
    return distanceToThreshold / need.decayRate;
  }
}
