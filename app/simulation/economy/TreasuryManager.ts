// =============================================================================
// TREASURY MANAGER
// =============================================================================
// Handles all treasury-related operations including:
// - Balance tracking and modification
// - History management for charts
// - Balance change callbacks
// - Safety checks (min/max bounds)

import { ECONOMY_CONFIG, SIMULATION_CONFIG, clampTreasury } from '../../config/gameConfig';

// =============================================================================
// TYPES
// =============================================================================

export interface TreasuryState {
  balance: number;
  history: number[];
}

export type TreasuryChangeCallback = (newBalance: number, delta: number) => void;

// =============================================================================
// TREASURY MANAGER CLASS
// =============================================================================

export class TreasuryManager {
  private balance: number;
  private history: number[];
  private maxHistoryLength: number;
  private onChangeCallbacks: TreasuryChangeCallback[] = [];

  constructor(initialBalance: number = SIMULATION_CONFIG.STARTING_TREASURY) {
    this.balance = clampTreasury(initialBalance);
    this.history = [this.balance];
    this.maxHistoryLength = SIMULATION_CONFIG.MAX_HISTORY_LENGTH;
  }

  // ---------------------------------------------------------------------------
  // GETTERS
  // ---------------------------------------------------------------------------

  /**
   * Get current treasury balance
   */
  getBalance(): number {
    return this.balance;
  }

  /**
   * Get treasury history for charts
   */
  getHistory(): readonly number[] {
    return this.history;
  }

  /**
   * Get the current state as an object
   */
  getState(): TreasuryState {
    return {
      balance: this.balance,
      history: [...this.history],
    };
  }

  // ---------------------------------------------------------------------------
  // BALANCE OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Add to treasury balance
   * Returns the actual amount added (may be less if hitting max)
   */
  add(amount: number): number {
    if (amount <= 0) return 0;

    const oldBalance = this.balance;
    const newBalance = clampTreasury(oldBalance + amount);
    const actualAdded = newBalance - oldBalance;

    this.balance = newBalance;
    this.notifyChange(actualAdded);

    return actualAdded;
  }

  /**
   * Remove from treasury balance
   * Returns the actual amount removed (may be less if insufficient funds)
   */
  remove(amount: number): number {
    if (amount <= 0) return 0;

    const oldBalance = this.balance;
    const newBalance = clampTreasury(oldBalance - amount);
    const actualRemoved = oldBalance - newBalance;

    this.balance = newBalance;
    this.notifyChange(-actualRemoved);

    return actualRemoved;
  }

  /**
   * Set balance to a specific value
   * Returns the new balance
   */
  set(value: number): number {
    const oldBalance = this.balance;
    this.balance = clampTreasury(value);
    const delta = this.balance - oldBalance;

    if (delta !== 0) {
      this.notifyChange(delta);
    }

    return this.balance;
  }

  /**
   * Check if a specific amount can be removed
   */
  canAfford(amount: number): boolean {
    return this.balance >= amount;
  }

  /**
   * Safely remove an amount, only if affordable
   * Returns true if successful, false if insufficient funds
   */
  tryRemove(amount: number): boolean {
    if (!this.canAfford(amount)) return false;
    this.remove(amount);
    return true;
  }

  // ---------------------------------------------------------------------------
  // HISTORY MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Record current balance in history
   * Call this each tick to build up history for charts
   */
  recordToHistory(): void {
    this.history.push(this.balance);

    // Trim history if too long
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(-this.maxHistoryLength);
    }
  }

  /**
   * Clear history and reset to current balance
   */
  clearHistory(): void {
    this.history = [this.balance];
  }

  /**
   * Get the change since last recorded history
   */
  getRecentChange(): number {
    if (this.history.length < 2) return 0;
    return this.balance - this.history[this.history.length - 1];
  }

  /**
   * Get percentage change over a number of ticks
   */
  getPercentageChange(ticks: number = 10): number {
    if (this.history.length < 2) return 0;

    const lookbackIndex = Math.max(0, this.history.length - ticks - 1);
    const previousBalance = this.history[lookbackIndex];

    if (previousBalance === 0) return 0;
    return ((this.balance - previousBalance) / previousBalance) * 100;
  }

  // ---------------------------------------------------------------------------
  // CALLBACKS
  // ---------------------------------------------------------------------------

  /**
   * Register a callback for treasury changes
   */
  onChanged(callback: TreasuryChangeCallback): () => void {
    this.onChangeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.onChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all callbacks of a balance change
   */
  private notifyChange(delta: number): void {
    for (const callback of this.onChangeCallbacks) {
      try {
        callback(this.balance, delta);
      } catch (error) {
        console.error('[TreasuryManager] Callback error:', error);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // SERIALIZATION
  // ---------------------------------------------------------------------------

  /**
   * Export state for saving
   */
  export(): TreasuryState {
    return {
      balance: this.balance,
      history: [...this.history],
    };
  }

  /**
   * Import state from save
   */
  import(state: TreasuryState): void {
    this.balance = clampTreasury(state.balance);
    this.history = state.history?.slice(-this.maxHistoryLength) ?? [this.balance];
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.balance = SIMULATION_CONFIG.STARTING_TREASURY;
    this.history = [this.balance];
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new TreasuryManager instance
 */
export function createTreasuryManager(initialBalance?: number): TreasuryManager {
  return new TreasuryManager(initialBalance);
}

