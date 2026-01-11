'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Screen Reader Announcer Component (Issue #60)
 * 
 * Provides ARIA live regions for announcing game events to screen readers.
 * Uses both polite and assertive regions for different priority levels.
 */

export interface ScreenReaderAnnouncerProps {
  /** Whether announcements are enabled */
  enabled?: boolean;
}

export function ScreenReaderAnnouncer({ enabled = true }: ScreenReaderAnnouncerProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Listen for announcement events
  useEffect(() => {
    if (!enabled) return;
    
    const handleAnnouncement = (e: CustomEvent<{ message: string; priority: 'polite' | 'assertive' }>) => {
      const { message, priority } = e.detail;
      
      if (priority === 'assertive') {
        setAssertiveMessage(message);
        // Clear after 5 seconds
        if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = setTimeout(() => setAssertiveMessage(''), 5000);
      } else {
        setPoliteMessage(message);
        if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
        clearTimeoutRef.current = setTimeout(() => setPoliteMessage(''), 5000);
      }
    };
    
    // Game event listeners for automatic announcements
    const handleBuildingPlaced = (e: CustomEvent<{ buildingName: string; x: number; y: number }>) => {
      const { buildingName, x, y } = e.detail;
      setPoliteMessage(`Placed ${buildingName} at position ${x}, ${y}`);
    };
    
    const handleRugPull = (e: CustomEvent<{ buildingName: string; treasuryLoss: number }>) => {
      const { buildingName, treasuryLoss } = e.detail;
      setAssertiveMessage(`Warning: ${buildingName} was rugged! Lost $${treasuryLoss.toLocaleString()}`);
    };
    
    const handleDisaster = (e: CustomEvent<{ name: string; description: string }>) => {
      const { name, description } = e.detail;
      setAssertiveMessage(`${name} event started: ${description}`);
    };
    
    const handleMilestone = (e: CustomEvent<{ name: string; reward: string }>) => {
      const { name, reward } = e.detail;
      setPoliteMessage(`Achievement unlocked: ${name}. ${reward}`);
    };
    
    const handleDayChange = (e: CustomEvent<{ day: number }>) => {
      const { day } = e.detail;
      setPoliteMessage(`Day ${day} started`);
    };
    
    window.addEventListener('sr-announcement', handleAnnouncement as EventListener);
    window.addEventListener('test-building-placed', handleBuildingPlaced as EventListener);
    window.addEventListener('building-placed', handleBuildingPlaced as EventListener);
    window.addEventListener('test-rug-pull', handleRugPull as EventListener);
    window.addEventListener('rug-pull', handleRugPull as EventListener);
    window.addEventListener('disaster-started', handleDisaster as EventListener);
    window.addEventListener('milestone-unlocked', handleMilestone as EventListener);
    window.addEventListener('day-changed', handleDayChange as EventListener);
    
    return () => {
      window.removeEventListener('sr-announcement', handleAnnouncement as EventListener);
      window.removeEventListener('test-building-placed', handleBuildingPlaced as EventListener);
      window.removeEventListener('building-placed', handleBuildingPlaced as EventListener);
      window.removeEventListener('test-rug-pull', handleRugPull as EventListener);
      window.removeEventListener('rug-pull', handleRugPull as EventListener);
      window.removeEventListener('disaster-started', handleDisaster as EventListener);
      window.removeEventListener('milestone-unlocked', handleMilestone as EventListener);
      window.removeEventListener('day-changed', handleDayChange as EventListener);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    };
  }, [enabled]);
  
  if (!enabled) return null;
  
  return (
    <>
      {/* Polite live region - for non-urgent announcements */}
      <div
        id="sr-polite-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="screen-reader-announcer"
        className="sr-only"
      >
        {politeMessage}
      </div>
      
      {/* Assertive live region - for urgent announcements (warnings, alerts) */}
      <div
        id="sr-assertive-announcer"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </>
  );
}

export default ScreenReaderAnnouncer;
