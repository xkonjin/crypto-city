/**
 * Mobile Touch Optimization
 * Issue #236: Optimize Mobile Touch Interactions and Gestures
 * 
 * Provides utilities for handling touch gestures, pinch-to-zoom, and mobile interactions
 */

export interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

export interface GestureState {
  isPinching: boolean;
  isPanning: boolean;
  scale: number;
  rotation: number;
  center: { x: number; y: number };
}

/**
 * Touch gesture recognizer
 */
export class TouchGestureRecognizer {
  private touches: Map<number, TouchPoint> = new Map();
  private initialDistance: number = 0;
  private initialScale: number = 1;
  private onPinch?: (scale: number, center: { x: number; y: number }) => void;
  private onPan?: (dx: number, dy: number) => void;
  private onTap?: (x: number, y: number) => void;
  private lastTouchTime: number = 0;
  private lastTouchPos: { x: number; y: number } | null = null;
  
  constructor(element: HTMLElement) {
    element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }
  
  /**
   * Register pinch gesture handler
   */
  setPinchHandler(handler: (scale: number, center: { x: number; y: number }) => void): void {
    this.onPinch = handler;
  }
  
  /**
   * Register pan gesture handler
   */
  setPanHandler(handler: (dx: number, dy: number) => void): void {
    this.onPan = handler;
  }
  
  /**
   * Register tap gesture handler
   */
  setTapHandler(handler: (x: number, y: number) => void): void {
    this.onTap = handler;
  }
  
  private handleTouchStart(e: TouchEvent): void {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier,
      });
    }
    
    if (this.touches.size === 2) {
      // Start pinch gesture
      const points = Array.from(this.touches.values());
      this.initialDistance = this.getDistance(points[0], points[1]);
      this.initialScale = 1;
    }
    
    // Track for tap detection
    this.lastTouchTime = Date.now();
    this.lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    
    // Update touch positions
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const prevTouch = this.touches.get(touch.identifier);
      
      if (prevTouch && this.touches.size === 1) {
        // Single finger pan
        const dx = touch.clientX - prevTouch.x;
        const dy = touch.clientY - prevTouch.y;
        this.onPan?.(dx, dy);
      }
      
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier,
      });
    }
    
    if (this.touches.size === 2) {
      // Pinch gesture
      const points = Array.from(this.touches.values());
      const currentDistance = this.getDistance(points[0], points[1]);
      const scale = currentDistance / this.initialDistance;
      const center = this.getCenter(points[0], points[1]);
      
      this.onPinch?.(scale, center);
    }
  }
  
  private handleTouchEnd(e: TouchEvent): void {
    // Detect tap (quick touch with minimal movement)
    const now = Date.now();
    const timeDiff = now - this.lastTouchTime;
    
    if (timeDiff < 300 && this.lastTouchPos && this.touches.size === 1) {
      const touch = Array.from(this.touches.values())[0];
      const distance = Math.sqrt(
        Math.pow(touch.x - this.lastTouchPos.x, 2) +
        Math.pow(touch.y - this.lastTouchPos.y, 2)
      );
      
      if (distance < 10) {
        // It's a tap!
        this.onTap?.(touch.x, touch.y);
      }
    }
    
    // Remove ended touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this.touches.delete(touch.identifier);
    }
    
    if (this.touches.size < 2) {
      this.initialDistance = 0;
      this.initialScale = 1;
    }
  }
  
  private getDistance(p1: TouchPoint, p2: TouchPoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private getCenter(p1: TouchPoint, p2: TouchPoint): { x: number; y: number } {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }
}

/**
 * Check if touch target is large enough (WCAG AA: 44x44px)
 */
export function isTouchTargetAccessible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= 44 && rect.height >= 44;
}

/**
 * Increase touch target size with padding
 */
export function ensureTouchTargetSize(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  
  if (rect.width < 44) {
    const paddingX = (44 - rect.width) / 2;
    element.style.paddingLeft = `${paddingX}px`;
    element.style.paddingRight = `${paddingX}px`;
  }
  
  if (rect.height < 44) {
    const paddingY = (44 - rect.height) / 2;
    element.style.paddingTop = `${paddingY}px`;
    element.style.paddingBottom = `${paddingY}px`;
  }
}

/**
 * Detect if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if device supports touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Prevent default touch behavior (like pull-to-refresh)
 */
export function preventDefaultTouch(element: HTMLElement): () => void {
  const handler = (e: TouchEvent) => {
    e.preventDefault();
  };
  
  element.addEventListener('touchstart', handler, { passive: false });
  element.addEventListener('touchmove', handler, { passive: false });
  
  return () => {
    element.removeEventListener('touchstart', handler);
    element.removeEventListener('touchmove', handler);
  };
}
