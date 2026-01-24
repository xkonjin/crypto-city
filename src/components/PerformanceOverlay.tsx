/**
 * Performance Overlay Component
 * Production Tool: In-game performance monitoring
 * 
 * Shows FPS, memory, and system stats for debugging
 */

import { useEffect, useState, useRef } from 'react';

export interface PerformanceStats {
  fps: number;
  frameTime: number;
  memory: number;
  entities: number;
  drawCalls: number;
}

export interface PerformanceOverlayProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  updateInterval?: number;
}

export function PerformanceOverlay({
  enabled = false,
  position = 'top-right',
  updateInterval = 500,
}: PerformanceOverlayProps) {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    frameTime: 0,
    memory: 0,
    entities: 0,
    drawCalls: 0,
  });
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const lastUpdateRef = useRef(performance.now());
  
  useEffect(() => {
    if (!enabled) return;
    
    let animationFrameId: number;
    
    const measurePerformance = () => {
      const now = performance.now();
      frameCountRef.current++;
      
      // Update stats at interval
      if (now - lastUpdateRef.current >= updateInterval) {
        const elapsed = now - lastTimeRef.current;
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        const frameTime = elapsed / frameCountRef.current;
        
        // Get memory usage (if available)
        let memory = 0;
        if ('memory' in performance) {
          const perfMemory = (performance as any).memory;
          memory = Math.round(perfMemory.usedJSHeapSize / 1048576); // MB
        }
        
        setStats({
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          memory,
          entities: 0, // To be populated by game
          drawCalls: 0, // To be populated by game
        });
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
        lastUpdateRef.current = now;
      }
      
      animationFrameId = requestAnimationFrame(measurePerformance);
    };
    
    animationFrameId = requestAnimationFrame(measurePerformance);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled, updateInterval]);
  
  if (!enabled) return null;
  
  const positionStyles = {
    'top-left': { top: 10, left: 10 },
    'top-right': { top: 10, right: 10 },
    'bottom-left': { bottom: 10, left: 10 },
    'bottom-right': { bottom: 10, right: 10 },
  };
  
  const getFPSColor = (fps: number): string => {
    if (fps >= 55) return '#00ff00';
    if (fps >= 30) return '#ffff00';
    return '#ff0000';
  };
  
  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#ffffff',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 10000,
        minWidth: '150px',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      <div style={{ marginBottom: '5px', fontWeight: 'bold', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
        Performance
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span>FPS:</span>
        <span style={{ color: getFPSColor(stats.fps), fontWeight: 'bold' }}>
          {stats.fps}
        </span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span>Frame:</span>
        <span>{stats.frameTime}ms</span>
      </div>
      
      {stats.memory > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Memory:</span>
          <span>{stats.memory}MB</span>
        </div>
      )}
      
      {stats.entities > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Entities:</span>
          <span>{stats.entities}</span>
        </div>
      )}
      
      {stats.drawCalls > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Draw Calls:</span>
          <span>{stats.drawCalls}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for updating performance stats from game
 */
export function usePerformanceStats() {
  const [stats, setStats] = useState<Partial<PerformanceStats>>({});
  
  const updateStats = (newStats: Partial<PerformanceStats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };
  
  return { stats, updateStats };
}
