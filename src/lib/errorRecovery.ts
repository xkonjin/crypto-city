/**
 * Error Recovery System
 * Production Hardening: Graceful degradation and recovery
 * 
 * Prevents crashes and provides user-friendly error handling
 */

export interface ErrorContext {
  component: string;
  action: string;
  data?: unknown;
  timestamp: number;
}

export interface RecoveryStrategy {
  maxRetries: number;
  retryDelay: number;
  fallback?: () => void;
  onError?: (error: Error, context: ErrorContext) => void;
}

/**
 * Error recovery manager
 */
export class ErrorRecoveryManager {
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<string, number> = new Map();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  
  /**
   * Register recovery strategy for a component
   */
  registerStrategy(component: string, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(component, strategy);
  }
  
  /**
   * Execute function with error recovery
   */
  async execute<T>(
    context: ErrorContext,
    fn: () => T | Promise<T>
  ): Promise<T | null> {
    const strategy = this.recoveryStrategies.get(context.component);
    const errorKey = `${context.component}:${context.action}`;
    
    try {
      const result = await fn();
      
      // Reset error count on success
      this.errorCounts.delete(errorKey);
      
      return result;
    } catch (error) {
      const errorCount = (this.errorCounts.get(errorKey) || 0) + 1;
      this.errorCounts.set(errorKey, errorCount);
      this.lastErrors.set(errorKey, Date.now());
      
      // Log error
      console.error(`Error in ${context.component}.${context.action}:`, error);
      
      if (strategy?.onError) {
        strategy.onError(error as Error, context);
      }
      
      // Check if should retry
      if (strategy && errorCount < strategy.maxRetries) {
        console.log(`Retrying ${context.action} (attempt ${errorCount + 1}/${strategy.maxRetries})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, strategy.retryDelay));
        
        // Retry
        return this.execute(context, fn);
      }
      
      // Execute fallback if available
      if (strategy?.fallback) {
        console.log(`Executing fallback for ${context.action}`);
        strategy.fallback();
      }
      
      return null;
    }
  }
  
  /**
   * Get error statistics
   */
  getStats(): Record<string, { count: number; lastError: number }> {
    const stats: Record<string, { count: number; lastError: number }> = {};
    
    for (const [key, count] of this.errorCounts) {
      stats[key] = {
        count,
        lastError: this.lastErrors.get(key) || 0,
      };
    }
    
    return stats;
  }
  
  /**
   * Clear error history
   */
  clear(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
  }
}

/**
 * Save/Load mutex to prevent race conditions
 */
export class SaveLoadMutex {
  private locked: boolean = false;
  private queue: Array<() => void> = [];
  
  /**
   * Acquire lock
   */
  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }
  
  /**
   * Release lock
   */
  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
  
  /**
   * Execute function with lock
   */
  async withLock<T>(fn: () => T | Promise<T>): Promise<T> {
    await this.acquire();
    
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
  
  /**
   * Check if locked
   */
  isLocked(): boolean {
    return this.locked;
  }
}

/**
 * Resource limit manager
 */
export class ResourceLimitManager {
  private limits: Map<string, number> = new Map();
  private current: Map<string, number> = new Map();
  private onLimitReached: Map<string, () => void> = new Map();
  
  /**
   * Set resource limit
   */
  setLimit(resource: string, limit: number, onReached?: () => void): void {
    this.limits.set(resource, limit);
    if (onReached) {
      this.onLimitReached.set(resource, onReached);
    }
  }
  
  /**
   * Check if can allocate resource
   */
  canAllocate(resource: string, amount: number = 1): boolean {
    const limit = this.limits.get(resource);
    if (!limit) return true;
    
    const current = this.current.get(resource) || 0;
    return current + amount <= limit;
  }
  
  /**
   * Allocate resource
   */
  allocate(resource: string, amount: number = 1): boolean {
    if (!this.canAllocate(resource, amount)) {
      const callback = this.onLimitReached.get(resource);
      if (callback) callback();
      return false;
    }
    
    const current = this.current.get(resource) || 0;
    this.current.set(resource, current + amount);
    return true;
  }
  
  /**
   * Release resource
   */
  release(resource: string, amount: number = 1): void {
    const current = this.current.get(resource) || 0;
    this.current.set(resource, Math.max(0, current - amount));
  }
  
  /**
   * Get usage percentage
   */
  getUsage(resource: string): number {
    const limit = this.limits.get(resource);
    if (!limit) return 0;
    
    const current = this.current.get(resource) || 0;
    return (current / limit) * 100;
  }
  
  /**
   * Get statistics
   */
  getStats(): Record<string, { current: number; limit: number; percentage: number }> {
    const stats: Record<string, { current: number; limit: number; percentage: number }> = {};
    
    for (const [resource, limit] of this.limits) {
      const current = this.current.get(resource) || 0;
      stats[resource] = {
        current,
        limit,
        percentage: (current / limit) * 100,
      };
    }
    
    return stats;
  }
}

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private onOpen?: () => void,
    private onClose?: () => void
  ) {}
  
  /**
   * Execute function with circuit breaker
   */
  async execute<T>(fn: () => T | Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      const now = Date.now();
      
      if (now - this.lastFailureTime >= this.timeout) {
        // Try half-open
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      
      // Success - reset or close circuit
      if (this.state === 'half-open') {
        this.close();
      }
      
      this.failureCount = 0;
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.threshold) {
        this.open();
      }
      
      throw error;
    }
  }
  
  /**
   * Open circuit
   */
  private open(): void {
    if (this.state !== 'open') {
      this.state = 'open';
      if (this.onOpen) this.onOpen();
    }
  }
  
  /**
   * Close circuit
   */
  private close(): void {
    if (this.state !== 'closed') {
      this.state = 'closed';
      this.failureCount = 0;
      if (this.onClose) this.onClose();
    }
  }
  
  /**
   * Get circuit state
   */
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
  
  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}

/**
 * Global error recovery instance
 */
export const errorRecovery = new ErrorRecoveryManager();

/**
 * Global save/load mutex
 */
export const saveLoadMutex = new SaveLoadMutex();

/**
 * Global resource limits
 */
export const resourceLimits = new ResourceLimitManager();

// Set default resource limits
resourceLimits.setLimit('npcs', 100, () => {
  console.warn('NPC limit reached, cannot spawn more NPCs');
});

resourceLimits.setLimit('vehicles', 50, () => {
  console.warn('Vehicle limit reached, cannot spawn more vehicles');
});

resourceLimits.setLimit('particles', 1000, () => {
  console.warn('Particle limit reached, disabling new particle effects');
});

resourceLimits.setLimit('buildings', 1000, () => {
  console.warn('Building limit reached');
});
