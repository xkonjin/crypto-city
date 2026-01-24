/**
 * Disaster Management Hook
 * Issue #227: Refactor Monolithic Components
 * 
 * Extracted from GameContext.tsx to separate disaster logic
 */

import { useState, useCallback } from 'react';

export interface Disaster {
  id: string;
  type: 'fire' | 'flood' | 'earthquake' | 'tornado' | 'meteor';
  x: number;
  y: number;
  severity: number;
  startTime: number;
  duration: number;
  active: boolean;
}

export function useDisasterManagement() {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [disastersEnabled, setDisastersEnabled] = useState(true);
  const [lastDisasterTime, setLastDisasterTime] = useState(0);
  
  const createDisaster = useCallback((
    type: Disaster['type'],
    x: number,
    y: number,
    severity: number = 50
  ): Disaster => {
    return {
      id: `disaster_${Date.now()}_${Math.random()}`,
      type,
      x,
      y,
      severity,
      startTime: Date.now(),
      duration: 30000 + severity * 100, // 30s base + severity bonus
      active: true,
    };
  }, []);
  
  const addDisaster = useCallback((disaster: Disaster) => {
    setDisasters(prev => [...prev, disaster]);
    setLastDisasterTime(Date.now());
  }, []);
  
  const removeDisaster = useCallback((id: string) => {
    setDisasters(prev => prev.filter(d => d.id !== id));
  }, []);
  
  const updateDisaster = useCallback((id: string, updates: Partial<Disaster>) => {
    setDisasters(prev => prev.map(d => 
      d.id === id ? { ...d, ...updates } : d
    ));
  }, []);
  
  const triggerRandomDisaster = useCallback((gridSize: number) => {
    if (!disastersEnabled) return;
    
    const now = Date.now();
    const timeSinceLastDisaster = now - lastDisasterTime;
    
    // Minimum 2 minutes between disasters
    if (timeSinceLastDisaster < 120000) return;
    
    // Random chance (5% per check)
    if (Math.random() > 0.05) return;
    
    const types: Disaster['type'][] = ['fire', 'flood', 'earthquake', 'tornado', 'meteor'];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.floor(Math.random() * gridSize);
    const y = Math.floor(Math.random() * gridSize);
    const severity = 30 + Math.floor(Math.random() * 70);
    
    const disaster = createDisaster(type, x, y, severity);
    addDisaster(disaster);
  }, [disastersEnabled, lastDisasterTime, createDisaster, addDisaster]);
  
  const clearAllDisasters = useCallback(() => {
    setDisasters([]);
  }, []);
  
  const getActiveDisasters = useCallback(() => {
    return disasters.filter(d => d.active);
  }, [disasters]);
  
  return {
    disasters,
    disastersEnabled,
    setDisastersEnabled,
    createDisaster,
    addDisaster,
    removeDisaster,
    updateDisaster,
    triggerRandomDisaster,
    clearAllDisasters,
    getActiveDisasters,
  };
}
