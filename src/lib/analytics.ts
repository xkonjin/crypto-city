/**
 * Production Analytics and Monitoring
 * Final Tool: Track user behavior and performance metrics
 * 
 * Provides insights for optimization and feature development
 */

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface UserSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: AnalyticsEvent[];
  metrics: PerformanceMetric[];
  userAgent: string;
  screenResolution: string;
}

/**
 * Analytics manager
 */
export class AnalyticsManager {
  private session: UserSession;
  private enabled: boolean = true;
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.session = this.createSession();
    this.startFlushTimer();
  }
  
  /**
   * Create new session
   */
  private createSession(): UserSession {
    return {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      events: [],
      metrics: [],
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      screenResolution: typeof window !== 'undefined' 
        ? `${window.screen.width}x${window.screen.height}` 
        : 'unknown',
    };
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Track event
   */
  trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number
  ): void {
    if (!this.enabled) return;
    
    const event: AnalyticsEvent = {
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
    };
    
    this.session.events.push(event);
    
    // Auto-flush if batch size reached
    if (this.session.events.length >= this.batchSize) {
      this.flush();
    }
  }
  
  /**
   * Track performance metric
   */
  trackMetric(name: string, value: number, unit: string = 'ms'): void {
    if (!this.enabled) return;
    
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };
    
    this.session.metrics.push(metric);
  }
  
  /**
   * Track page view
   */
  trackPageView(page: string): void {
    this.trackEvent('Navigation', 'PageView', page);
  }
  
  /**
   * Track user action
   */
  trackAction(action: string, details?: string): void {
    this.trackEvent('User', 'Action', action, details ? 1 : undefined);
  }
  
  /**
   * Track error
   */
  trackError(error: Error, context?: string): void {
    this.trackEvent('Error', error.name, context || error.message);
  }
  
  /**
   * Track performance timing
   */
  trackTiming(category: string, variable: string, time: number): void {
    this.trackMetric(`${category}.${variable}`, time, 'ms');
  }
  
  /**
   * Flush events to backend
   */
  async flush(): Promise<void> {
    if (this.session.events.length === 0 && this.session.metrics.length === 0) {
      return;
    }
    
    try {
      // In production, send to analytics backend
      // For now, just log to console
      console.log('[Analytics] Flushing session data:', {
        sessionId: this.session.sessionId,
        eventCount: this.session.events.length,
        metricCount: this.session.metrics.length,
      });
      
      // Clear flushed data
      this.session.events = [];
      this.session.metrics = [];
    } catch (error) {
      console.error('[Analytics] Failed to flush:', error);
    }
  }
  
  /**
   * Start auto-flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
  
  /**
   * End session
   */
  endSession(): void {
    this.session.endTime = Date.now();
    this.flush();
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
  
  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Get session summary
   */
  getSessionSummary(): {
    duration: number;
    eventCount: number;
    metricCount: number;
  } {
    const duration = (this.session.endTime || Date.now()) - this.session.startTime;
    
    return {
      duration,
      eventCount: this.session.events.length,
      metricCount: this.session.metrics.length,
    };
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private maxSamples: number = 100;
  
  /**
   * Record metric value
   */
  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only recent samples
    if (values.length > this.maxSamples) {
      values.shift();
    }
  }
  
  /**
   * Get average value
   */
  getAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  
  /**
   * Get percentile value
   */
  getPercentile(name: string, percentile: number): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index];
  }
  
  /**
   * Get min/max values
   */
  getMinMax(name: string): { min: number; max: number } {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }
  
  /**
   * Get all statistics
   */
  getStats(name: string): {
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const { min, max } = this.getMinMax(name);
    
    return {
      average: this.getAverage(name),
      min,
      max,
      p50: this.getPercentile(name, 50),
      p95: this.getPercentile(name, 95),
      p99: this.getPercentile(name, 99),
    };
  }
  
  /**
   * Clear metrics
   */
  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

/**
 * User behavior tracker
 */
export class BehaviorTracker {
  private actions: Array<{ action: string; timestamp: number }> = [];
  private maxActions: number = 1000;
  
  /**
   * Track user action
   */
  track(action: string): void {
    this.actions.push({
      action,
      timestamp: Date.now(),
    });
    
    // Keep only recent actions
    if (this.actions.length > this.maxActions) {
      this.actions.shift();
    }
  }
  
  /**
   * Get action frequency
   */
  getFrequency(action: string): number {
    return this.actions.filter(a => a.action === action).length;
  }
  
  /**
   * Get most common actions
   */
  getMostCommon(limit: number = 10): Array<{ action: string; count: number }> {
    const counts = new Map<string, number>();
    
    for (const { action } of this.actions) {
      counts.set(action, (counts.get(action) || 0) + 1);
    }
    
    return Array.from(counts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  /**
   * Get action timeline
   */
  getTimeline(minutes: number = 10): Array<{ action: string; timestamp: number }> {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.actions.filter(a => a.timestamp >= cutoff);
  }
  
  /**
   * Clear history
   */
  clear(): void {
    this.actions = [];
  }
}

/**
 * A/B testing manager
 */
export class ABTestManager {
  private tests: Map<string, { variant: string; startTime: number }> = new Map();
  
  /**
   * Get variant for test
   */
  getVariant(testName: string, variants: string[]): string {
    if (this.tests.has(testName)) {
      return this.tests.get(testName)!.variant;
    }
    
    // Assign random variant
    const variant = variants[Math.floor(Math.random() * variants.length)];
    
    this.tests.set(testName, {
      variant,
      startTime: Date.now(),
    });
    
    return variant;
  }
  
  /**
   * Check if user is in variant
   */
  isVariant(testName: string, variant: string): boolean {
    const test = this.tests.get(testName);
    return test?.variant === variant;
  }
  
  /**
   * Get all active tests
   */
  getActiveTests(): Record<string, string> {
    const tests: Record<string, string> = {};
    
    for (const [name, { variant }] of this.tests) {
      tests[name] = variant;
    }
    
    return tests;
  }
}

/**
 * Global analytics instance
 */
export const analytics = new AnalyticsManager();

/**
 * Global performance monitor
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Global behavior tracker
 */
export const behaviorTracker = new BehaviorTracker();

/**
 * Global A/B test manager
 */
export const abTestManager = new ABTestManager();

/**
 * Convenience functions
 */
export const Analytics = {
  trackEvent: (category: string, action: string, label?: string, value?: number) => 
    analytics.trackEvent(category, action, label, value),
  
  trackPageView: (page: string) => 
    analytics.trackPageView(page),
  
  trackAction: (action: string, details?: string) => 
    analytics.trackAction(action, details),
  
  trackError: (error: Error, context?: string) => 
    analytics.trackError(error, context),
  
  trackTiming: (category: string, variable: string, time: number) => 
    analytics.trackTiming(category, variable, time),
};
