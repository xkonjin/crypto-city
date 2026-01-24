/**
 * React Optimization Utilities
 * Issue #232: Optimize React Component Re-renders
 * 
 * Provides utilities for preventing unnecessary re-renders
 */

import { useRef, useEffect, DependencyList } from 'react';

/**
 * Deep comparison for objects and arrays
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Custom hook that only triggers effect when dependencies deeply change
 * Useful for objects and arrays that may be recreated but have same content
 */
export function useDeepEffect(
  effect: () => void | (() => void),
  deps: DependencyList
): void {
  const prevDepsRef = useRef<DependencyList>();
  const cleanupRef = useRef<void | (() => void)>();
  
  useEffect(() => {
    // Check if dependencies have deeply changed
    const hasChanged = !prevDepsRef.current || 
      !deepEqual(prevDepsRef.current, deps);
    
    if (hasChanged) {
      // Clean up previous effect
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      
      // Run new effect
      cleanupRef.current = effect();
      prevDepsRef.current = deps;
    }
    
    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, deps);
}

/**
 * Throttle a function to run at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = limitMs - (now - lastRun);
    
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastRun = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastRun = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Debounce a function to run only after it stops being called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, waitMs);
  };
}

/**
 * Memoize a function result based on arguments
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  maxCacheSize: number = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  const keyOrder: string[] = [];
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func.apply(this, args);
    
    // Add to cache
    cache.set(key, result);
    keyOrder.push(key);
    
    // Evict oldest entry if cache is full
    if (keyOrder.length > maxCacheSize) {
      const oldestKey = keyOrder.shift()!;
      cache.delete(oldestKey);
    }
    
    return result;
  } as T;
}

/**
 * Create a stable reference that only updates when value deeply changes
 */
export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  
  if (!deepEqual(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
}

/**
 * Batch multiple state updates into a single render
 */
export function batchUpdates(callback: () => void): void {
  // React 18+ automatically batches updates
  // This is a no-op for compatibility
  callback();
}

/**
 * Performance monitoring wrapper
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  func: T,
  name: string
): T {
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = func.apply(this, args);
    const end = performance.now();
    
    if (end - start > 16) { // Longer than one frame (60fps)
      console.warn(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  } as T;
}
