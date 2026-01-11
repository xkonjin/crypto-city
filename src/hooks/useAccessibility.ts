'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Accessibility hook for keyboard navigation and screen reader support (Issue #60)
 */

export interface KeyboardCursorPosition {
  x: number;
  y: number;
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  screenReaderAnnouncements: boolean;
  highContrast: boolean;
  keyboardNavigationEnabled: boolean;
}

export interface UseAccessibilityReturn {
  // Keyboard cursor state
  cursorPosition: KeyboardCursorPosition;
  setCursorPosition: (pos: KeyboardCursorPosition) => void;
  
  // Navigation methods
  moveUp: () => void;
  moveDown: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  select: () => void;
  cancel: () => void;
  
  // Screen reader announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Settings
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  
  // Focus management
  lastFocusedElement: HTMLElement | null;
  saveFocus: () => void;
  restoreFocus: () => void;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  reducedMotion: false,
  screenReaderAnnouncements: true,
  highContrast: false,
  keyboardNavigationEnabled: true,
};

const STORAGE_KEY = 'crypto-city-accessibility-settings';

export function useAccessibility(
  gridSize: number = 48,
  onSelect?: (x: number, y: number) => void,
  onCancel?: () => void,
): UseAccessibilityReturn {
  // Cursor position state
  const [cursorPosition, setCursorPosition] = useState<KeyboardCursorPosition>({ 
    x: Math.floor(gridSize / 2), 
    y: Math.floor(gridSize / 2) 
  });
  
  // Settings state
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
      } catch {
        // Ignore localStorage errors
      }
      
      // Check system preference for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return { ...DEFAULT_SETTINGS, reducedMotion: prefersReducedMotion };
    }
    return DEFAULT_SETTINGS;
  });
  
  // Focus management
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  
  // Announcement refs for debouncing
  const politeAnnouncementRef = useRef<string>('');
  const assertiveAnnouncementRef = useRef<string>('');
  
  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [settings]);
  
  // Expose cursor position globally for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { keyboardCursorPosition: KeyboardCursorPosition }).keyboardCursorPosition = cursorPosition;
    }
  }, [cursorPosition]);
  
  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  // Navigation methods
  const moveUp = useCallback(() => {
    setCursorPosition(prev => ({
      ...prev,
      y: Math.max(0, prev.y - 1)
    }));
  }, []);
  
  const moveDown = useCallback(() => {
    setCursorPosition(prev => ({
      ...prev,
      y: Math.min(gridSize - 1, prev.y + 1)
    }));
  }, [gridSize]);
  
  const moveLeft = useCallback(() => {
    setCursorPosition(prev => ({
      ...prev,
      x: Math.max(0, prev.x - 1)
    }));
  }, []);
  
  const moveRight = useCallback(() => {
    setCursorPosition(prev => ({
      ...prev,
      x: Math.min(gridSize - 1, prev.x + 1)
    }));
  }, [gridSize]);
  
  const select = useCallback(() => {
    onSelect?.(cursorPosition.x, cursorPosition.y);
  }, [cursorPosition, onSelect]);
  
  const cancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);
  
  // Screen reader announcement
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.screenReaderAnnouncements) return;
    
    if (priority === 'assertive') {
      assertiveAnnouncementRef.current = message;
      // Update the assertive live region
      const region = document.getElementById('sr-assertive-announcer');
      if (region) {
        region.textContent = '';
        // Force reflow to ensure screen reader picks up the change
        void region.offsetHeight;
        region.textContent = message;
      }
    } else {
      politeAnnouncementRef.current = message;
      // Update the polite live region
      const region = document.getElementById('sr-polite-announcer');
      if (region) {
        region.textContent = '';
        void region.offsetHeight;
        region.textContent = message;
      }
    }
    
    // Dispatch event for testing
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sr-announcement', {
        detail: { message, priority }
      }));
    }
  }, [settings.screenReaderAnnouncements]);
  
  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  
  // Focus management
  const saveFocus = useCallback(() => {
    lastFocusedElementRef.current = document.activeElement as HTMLElement;
  }, []);
  
  const restoreFocus = useCallback(() => {
    if (lastFocusedElementRef.current && document.body.contains(lastFocusedElementRef.current)) {
      lastFocusedElementRef.current.focus();
    }
  }, []);
  
  return {
    cursorPosition,
    setCursorPosition,
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    select,
    cancel,
    announce,
    settings,
    updateSettings,
    lastFocusedElement: lastFocusedElementRef.current,
    saveFocus,
    restoreFocus,
  };
}

export default useAccessibility;
