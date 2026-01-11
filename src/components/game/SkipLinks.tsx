'use client';

import React from 'react';

/**
 * Skip Links Component (Issue #60)
 * 
 * Provides skip-to-content links for keyboard users to bypass navigation.
 * Links are visually hidden until focused.
 */

export interface SkipLinksProps {
  /** Custom class name */
  className?: string;
}

export function SkipLinks({ className }: SkipLinksProps) {
  return (
    <div className={className}>
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
      
      {/* Skip to game canvas */}
      <a
        href="#game-canvas"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-48 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to game
      </a>
      
      {/* Skip to building panel */}
      <a
        href="#building-panel"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-[340px] focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to building panel
      </a>
    </div>
  );
}

export default SkipLinks;
