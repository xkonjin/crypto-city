/**
 * City AI Manager
 * 
 * "The Answer to the Great Question... Of Life, the Universe and Everything...
 * Is... Forty-two." - Deep Thought
 * 
 * Unfortunately, the Answer to "how to run a city" requires a bit more logic.
 * This singleton manager orchestrates the autonomous city AI, running
 * assessments and executing planned actions when no human is playing.
 * 
 * Features:
 * - Autonomous mode toggle
 * - Periodic city assessment
 * - Action queue management
 * - Override/cancel capabilities
 * - State persistence
 */

import { GameState } from '@/games/isocity/types';
import { CryptoEconomyState } from '@/games/isocity/crypto/types';
import { placeBuilding, bulldozeTile } from '@/lib/simulation';
import {
  CityAIState,
  CityAIConfig,
  CityAction,
  CityAssessment,
  ActionResult,
  AIAggressiveness,
  AI_GOALS,
  DEFAULT_AI_CONFIG,
} from './types';
import { assessCityState, getCityHealthSummary } from './CityAssessor';
import { planActions } from './CityAIPlanner';
import { findBestLocation } from './BuildingPlacer';
import { logger } from '@/lib/logger';

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let managerInstance: CityAIManager | null = null;

/**
 * Get the singleton City AI Manager instance.
 */
export function getCityAIManager(): CityAIManager {
  if (!managerInstance) {
    managerInstance = new CityAIManager();
  }
  return managerInstance;
}

/**
 * Reset the City AI Manager (useful for testing).
 */
export function resetCityAIManager(): void {
  if (managerInstance) {
    managerInstance.disable();
  }
  managerInstance = null;
}

// =============================================================================
// CITY AI MANAGER CLASS
// =============================================================================

/**
 * City AI Manager - Singleton class for autonomous city management.
 * 
 * "Don't Panic!" - The manager handles everything automatically.
 */
export class CityAIManager {
  private state: CityAIState;
  private config: CityAIConfig;
  private listeners: Set<(state: CityAIState) => void> = new Set();
  
  constructor(config: Partial<CityAIConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    this.state = this.createInitialState();
  }
  
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  
  /**
   * Create initial AI state.
   */
  private createInitialState(): CityAIState {
    return {
      enabled: false,
      aggressiveness: 'moderate',
      lastAssessment: null,
      actionQueue: [],
      executedActions: [],
      ticksSinceLastDecision: 0,
      totalActionsExecuted: 0,
      isPaused: false,
      lastError: null,
    };
  }
  
  /**
   * Get current AI state.
   */
  getState(): Readonly<CityAIState> {
    return { ...this.state };
  }
  
  /**
   * Subscribe to state changes.
   */
  subscribe(listener: (state: CityAIState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners of state change.
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
  
  /**
   * Update state and notify listeners.
   */
  private updateState(updates: Partial<CityAIState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }
  
  // ---------------------------------------------------------------------------
  // ENABLE/DISABLE
  // ---------------------------------------------------------------------------
  
  /**
   * Enable autonomous mode.
   */
  enable(): void {
    if (this.state.enabled) return;
    
    this.updateState({
      enabled: true,
      isPaused: false,
      lastError: null,
    });
    
    if (this.config.debugLogging) {
      logger.info('[CityAI] Autonomous mode enabled');
    }
  }
  
  /**
   * Disable autonomous mode.
   */
  disable(): void {
    if (!this.state.enabled) return;
    
    this.updateState({
      enabled: false,
      actionQueue: [],
      isPaused: false,
    });
    
    if (this.config.debugLogging) {
      logger.info('[CityAI] Autonomous mode disabled');
    }
  }
  
  /**
   * Toggle autonomous mode.
   */
  toggle(): boolean {
    if (this.state.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.state.enabled;
  }
  
  /**
   * Check if autonomous mode is enabled.
   */
  isEnabled(): boolean {
    return this.state.enabled;
  }
  
  /**
   * Pause AI actions without disabling.
   */
  pause(): void {
    this.updateState({ isPaused: true });
  }
  
  /**
   * Resume AI actions.
   */
  resume(): void {
    this.updateState({ isPaused: false });
  }
  
  // ---------------------------------------------------------------------------
  // AGGRESSIVENESS
  // ---------------------------------------------------------------------------
  
  /**
   * Set AI aggressiveness level.
   */
  setAggressiveness(level: AIAggressiveness): void {
    this.updateState({ aggressiveness: level });
    
    if (this.config.debugLogging) {
      logger.info(`[CityAI] Aggressiveness set to ${level}`);
    }
  }
  
  /**
   * Get current aggressiveness level.
   */
  getAggressiveness(): AIAggressiveness {
    return this.state.aggressiveness;
  }
  
  // ---------------------------------------------------------------------------
  // MAIN TICK FUNCTION
  // ---------------------------------------------------------------------------
  
  /**
   * Execute one AI decision cycle.
   * Call this from the game loop when autonomous mode is enabled.
   * 
   * @param gameState - Current game state
   * @param cryptoEconomy - Optional crypto economy state
   * @param applyAction - Callback to apply an action to the game state
   * @returns Updated game state (or original if no action taken)
   */
  tick(
    gameState: GameState,
    cryptoEconomy?: CryptoEconomyState | null,
    applyAction?: (action: CityAction, state: GameState) => GameState
  ): GameState {
    // Do nothing if disabled or paused
    if (!this.state.enabled || this.state.isPaused) {
      return gameState;
    }
    
    // Do nothing if game is paused
    if (gameState.speed === 0) {
      return gameState;
    }
    
    const tickCount = this.state.ticksSinceLastDecision + 1;
    this.updateState({ ticksSinceLastDecision: tickCount });
    
    try {
      // Update assessment periodically
      if (tickCount % this.config.assessmentInterval === 0) {
        const assessment = assessCityState(gameState, cryptoEconomy);
        this.updateState({ lastAssessment: assessment });
        
        // Plan new actions if queue is low
        if (this.state.actionQueue.length < this.config.maxQueueSize / 2) {
          const newActions = planActions(
            assessment,
            gameState,
            this.state.aggressiveness
          );
          
          // Add to queue (avoiding duplicates)
          const existingIds = new Set(this.state.actionQueue.map(a => a.type + a.position?.x + a.position?.y));
          const uniqueNewActions = newActions.filter(
            a => !existingIds.has(a.type + a.position?.x + a.position?.y)
          );
          
          this.updateState({
            actionQueue: [...this.state.actionQueue, ...uniqueNewActions].slice(
              0,
              this.config.maxQueueSize
            ),
          });
          
          if (this.config.debugLogging && uniqueNewActions.length > 0) {
            logger.info(`[CityAI] Queued ${uniqueNewActions.length} new actions`);
          }
        }
      }
      
      // Execute actions periodically
      if (tickCount % this.config.actionInterval === 0 && this.state.actionQueue.length > 0) {
        // Execute up to maxActionsPerCycle actions
        let updatedState = gameState;
        const actionsToExecute = this.state.actionQueue.slice(0, this.config.maxActionsPerCycle);
        const executedActions: CityAction[] = [];
        
        for (const action of actionsToExecute) {
          // Check if we can afford this action
          if (action.cost > updatedState.stats.money) {
            if (this.config.debugLogging) {
              logger.info(`[CityAI] Skipping ${action.type} - insufficient funds`);
            }
            continue;
          }
          
          // Execute the action
          const result = applyAction
            ? applyAction(action, updatedState)
            : this.executeAction(action, updatedState);
          
          if (result !== updatedState) {
            updatedState = result;
            executedActions.push(action);
            
            if (this.config.debugLogging) {
              logger.info(`[CityAI] Executed: ${action.reason}`);
            }
          }
        }
        
        // Update queue and executed list
        const remainingQueue = this.state.actionQueue.filter(
          a => !executedActions.includes(a)
        );
        
        this.updateState({
          actionQueue: remainingQueue,
          executedActions: [...executedActions, ...this.state.executedActions].slice(0, 50),
          totalActionsExecuted: this.state.totalActionsExecuted + executedActions.length,
        });
        
        return updatedState;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateState({ lastError: errorMessage });
      logger.error('[CityAI] Error in tick:', error);
    }
    
    return gameState;
  }
  
  // ---------------------------------------------------------------------------
  // ACTION EXECUTION
  // ---------------------------------------------------------------------------
  
  /**
   * Execute a single action on the game state.
   * Returns the updated state or the original if action failed.
   */
  private executeAction(action: CityAction, gameState: GameState): GameState {
    try {
      switch (action.type) {
        case 'zone_residential':
        case 'zone_commercial':
        case 'zone_industrial':
          if (action.position && action.zoneType) {
            return placeBuilding(
              gameState,
              action.position.x,
              action.position.y,
              null,
              action.zoneType
            );
          }
          break;
        
        case 'build_road':
        case 'build_power_plant':
        case 'build_water_tower':
        case 'build_police_station':
        case 'build_fire_station':
        case 'build_hospital':
        case 'build_school':
        case 'build_park':
          if (action.position && action.buildingType) {
            return placeBuilding(
              gameState,
              action.position.x,
              action.position.y,
              action.buildingType,
              null
            );
          }
          break;
        
        case 'bulldoze':
          if (action.position) {
            return bulldozeTile(gameState, action.position.x, action.position.y);
          }
          break;
        
        case 'adjust_tax_rate':
          if (action.newTaxRate !== undefined) {
            return {
              ...gameState,
              taxRate: action.newTaxRate,
            };
          }
          break;
        
        case 'place_crypto_building':
          // Crypto building placement would need integration with CryptoEconomyManager
          // For now, just log and skip
          if (this.config.debugLogging) {
            logger.info(`[CityAI] Crypto building placement not yet implemented`);
          }
          break;
      }
    } catch (error) {
      if (this.config.debugLogging) {
        logger.error(`[CityAI] Failed to execute ${action.type}:`, error);
      }
    }
    
    return gameState;
  }
  
  // ---------------------------------------------------------------------------
  // QUEUE MANAGEMENT
  // ---------------------------------------------------------------------------
  
  /**
   * Get the current action queue.
   */
  getActionQueue(): Readonly<CityAction[]> {
    return [...this.state.actionQueue];
  }
  
  /**
   * Cancel a specific action from the queue.
   */
  cancelAction(actionId: string): boolean {
    const index = this.state.actionQueue.findIndex(a => a.id === actionId);
    if (index === -1) return false;
    
    const newQueue = [...this.state.actionQueue];
    newQueue.splice(index, 1);
    this.updateState({ actionQueue: newQueue });
    
    if (this.config.debugLogging) {
      logger.info(`[CityAI] Cancelled action: ${actionId}`);
    }
    
    return true;
  }
  
  /**
   * Clear all pending actions.
   */
  clearQueue(): void {
    this.updateState({ actionQueue: [] });
    
    if (this.config.debugLogging) {
      logger.info('[CityAI] Action queue cleared');
    }
  }
  
  /**
   * Move an action to the front of the queue.
   */
  prioritizeAction(actionId: string): boolean {
    const index = this.state.actionQueue.findIndex(a => a.id === actionId);
    if (index <= 0) return false; // Already at front or not found
    
    const action = this.state.actionQueue[index];
    const newQueue = [action, ...this.state.actionQueue.filter(a => a.id !== actionId)];
    this.updateState({ actionQueue: newQueue });
    
    return true;
  }
  
  // ---------------------------------------------------------------------------
  // ASSESSMENT ACCESS
  // ---------------------------------------------------------------------------
  
  /**
   * Get the last city assessment.
   */
  getLastAssessment(): Readonly<CityAssessment> | null {
    return this.state.lastAssessment;
  }
  
  /**
   * Force a new assessment.
   */
  forceAssessment(gameState: GameState, cryptoEconomy?: CryptoEconomyState | null): CityAssessment {
    const assessment = assessCityState(gameState, cryptoEconomy);
    this.updateState({ lastAssessment: assessment });
    return assessment;
  }
  
  /**
   * Get city health summary.
   */
  getCityHealth(): ReturnType<typeof getCityHealthSummary> | null {
    if (!this.state.lastAssessment) return null;
    return getCityHealthSummary(this.state.lastAssessment);
  }
  
  // ---------------------------------------------------------------------------
  // STATISTICS
  // ---------------------------------------------------------------------------
  
  /**
   * Get AI statistics.
   */
  getStats(): {
    totalActionsExecuted: number;
    queueLength: number;
    recentActions: CityAction[];
  } {
    return {
      totalActionsExecuted: this.state.totalActionsExecuted,
      queueLength: this.state.actionQueue.length,
      recentActions: this.state.executedActions.slice(0, 10),
    };
  }
  
  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------
  
  /**
   * Update configuration.
   */
  setConfig(updates: Partial<CityAIConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  /**
   * Get current configuration.
   */
  getConfig(): Readonly<CityAIConfig> {
    return { ...this.config };
  }
  
  /**
   * Enable debug logging.
   */
  enableDebugLogging(): void {
    this.config.debugLogging = true;
  }
  
  /**
   * Disable debug logging.
   */
  disableDebugLogging(): void {
    this.config.debugLogging = false;
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export type {
  CityAIState,
  CityAIConfig,
  CityAction,
  CityAssessment,
  AIAggressiveness,
};

export { AI_GOALS };
