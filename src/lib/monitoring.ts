/**
 * Monitoring and Error Tracking
 * Issue #240: Integrate Error Tracking with Sentry
 * Issue #251: Add Performance Monitoring and Analytics
 * 
 * Provides centralized error tracking and performance monitoring
 */

interface ErrorContext {
  user?: { id: string; username?: string };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
}

/**
 * Error tracking service (Sentry-compatible interface)
 */
class ErrorTracker {
  private enabled: boolean = false;
  private dsn: string | null = null;
  
  /**
   * Initialize error tracking
   */
  init(dsn?: string): void {
    this.dsn = dsn || process.env.SENTRY_DSN || null;
    this.enabled = !!this.dsn && process.env.NODE_ENV === 'production';
    
    if (this.enabled) {
      console.log('Error tracking initialized');
      // In production, this would initialize Sentry SDK
      // import * as Sentry from '@sentry/nextjs';
      // Sentry.init({ dsn: this.dsn });
    }
  }
  
  /**
   * Capture an error
   */
  captureError(error: Error, context?: ErrorContext): void {
    if (!this.enabled) {
      console.error('Error:', error, context);
      return;
    }
    
    // In production: Sentry.captureException(error, context);
    console.error('[Sentry] Error captured:', error.message, context);
  }
  
  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    if (!this.enabled) {
      console.log(`[${level}] ${message}`, context);
      return;
    }
    
    // In production: Sentry.captureMessage(message, level);
    console.log(`[Sentry] Message captured: ${message}`, level, context);
  }
  
  /**
   * Set user context
   */
  setUser(user: { id: string; username?: string; email?: string }): void {
    if (!this.enabled) return;
    
    // In production: Sentry.setUser(user);
    console.log('[Sentry] User context set:', user.id);
  }
  
  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.enabled) return;
    
    // In production: Sentry.setUser(null);
    console.log('[Sentry] User context cleared');
  }
  
  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (!this.enabled) return;
    
    // In production: Sentry.addBreadcrumb({ message, category, data });
    console.log(`[Sentry] Breadcrumb: [${category}] ${message}`, data);
  }
}

/**
 * Performance monitoring service
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;
  
  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms'): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };
    
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    
    // Log slow operations
    if (unit === 'ms' && value > 1000) {
      console.warn(`Slow operation: ${name} took ${value}ms`);
    }
  }
  
  /**
   * Record Web Vitals
   */
  recordWebVital(name: string, value: number): void {
    this.recordMetric(`webvital.${name}`, value, 'ms');
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      console.log(`[Analytics] Web Vital: ${name} = ${value}ms`);
    }
  }
  
  /**
   * Get metrics summary
   */
  getSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          avg: 0,
          min: Infinity,
          max: -Infinity,
          count: 0,
        };
      }
      
      const s = summary[metric.name];
      s.count++;
      s.avg = (s.avg * (s.count - 1) + metric.value) / s.count;
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
    }
    
    return summary;
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

/**
 * Analytics service
 */
class Analytics {
  private enabled: boolean = false;
  
  /**
   * Initialize analytics
   */
  init(trackingId?: string): void {
    this.enabled = !!trackingId && process.env.NODE_ENV === 'production';
    
    if (this.enabled) {
      console.log('Analytics initialized');
    }
  }
  
  /**
   * Track page view
   */
  pageView(path: string): void {
    if (!this.enabled) return;
    
    console.log('[Analytics] Page view:', path);
  }
  
  /**
   * Track custom event
   */
  event(category: string, action: string, label?: string, value?: number): void {
    if (!this.enabled) return;
    
    console.log('[Analytics] Event:', { category, action, label, value });
  }
  
  /**
   * Track user action
   */
  trackAction(action: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;
    
    console.log('[Analytics] Action:', action, properties);
  }
}

// Singleton instances
export const errorTracker = new ErrorTracker();
export const performanceMonitor = new PerformanceMonitor();
export const analytics = new Analytics();

/**
 * Initialize all monitoring services
 */
export function initializeMonitoring(): void {
  errorTracker.init();
  analytics.init(process.env.ANALYTICS_ID);
  
  // Track Web Vitals if available
  if (typeof window !== 'undefined' && 'performance' in window) {
    // This would use web-vitals library in production
    console.log('Performance monitoring ready');
  }
}

/**
 * Measure function execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
    errorTracker.captureError(error as Error, { tags: { function: name } });
    throw error;
  }
}

/**
 * Measure async function execution time
 */
export async function measurePerformanceAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
    errorTracker.captureError(error as Error, { tags: { function: name } });
    throw error;
  }
}
