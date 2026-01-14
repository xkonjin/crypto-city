'use client';

/**
 * Disaster Visual Overlay Component
 * 
 * "Time is an illusion. Lunchtime doubly so.
 * And disaster visual effects are an illusion that
 * makes lunchtime seem like a relaxing vacation."
 * 
 * Renders disaster visual effects as a canvas overlay:
 * - Screen tints and vignettes
 * - Damaged building markers with pulsing effects
 * - Click-to-repair interaction hints
 */

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useDisasterVisuals, type DamagedBuildingMarker } from '@/hooks/useDisasterVisuals';
import { gridToScreen } from '@/components/game/utils';
import { TILE_WIDTH, TILE_HEIGHT } from '@/components/game/types';

// =============================================================================
// TYPES
// =============================================================================

export interface DisasterOverlayProps {
  /** Canvas offset for world-to-screen conversion */
  offset: { x: number; y: number };
  /** Current zoom level */
  zoom: number;
  /** Container dimensions */
  containerSize: { width: number; height: number };
  /** Callback when damaged building is clicked */
  onDamagedBuildingClick?: (buildingId: string, gridX: number, gridY: number) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MARKER_SIZE = 32;
const PULSE_MIN_SCALE = 0.85;
const PULSE_MAX_SCALE = 1.15;
const GLOW_BLUR_RADIUS = 10;

// Icons as unicode for canvas rendering
const DAMAGE_ICONS: Record<string, string> = {
  '⚠️': '⚠',
  '🔥': '🔥',
  '💥': '💥',
  '🌊': '🌊',
  '❌': '✕',
  '🔧': '🔧',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function DisasterOverlay({
  offset,
  zoom,
  containerSize,
  onDamagedBuildingClick,
}: DisasterOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const { state, getAllDamagedMarkers } = useDisasterVisuals();

  // Get damaged markers
  const damagedMarkers = useMemo(() => getAllDamagedMarkers(), [getAllDamagedMarkers]);

  // Set up canvas and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerSize.width * dpr;
    canvas.height = containerSize.height * dpr;

    // Draw function defined inside effect to avoid stale closure issues
    const draw = (time: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw screen tint (full canvas overlay)
      if (state.screenTint !== 'transparent') {
        ctx.fillStyle = state.screenTint;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw vignette for active disasters
      if (state.activeDisasterIds.length > 0) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
        
        const gradient = ctx.createRadialGradient(
          centerX, centerY, maxRadius * 0.3,
          centerX, centerY, maxRadius
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Apply screen shake offset
      if (state.isShaking) {
        ctx.save();
        ctx.translate(
          state.shakeOffset.x * dpr,
          state.shakeOffset.y * dpr
        );
      }

      // Draw damaged building markers
      for (const marker of damagedMarkers) {
        const { screenX, screenY } = gridToScreen(marker.gridX, marker.gridY, 0, 0);
        
        // Convert to screen coordinates with zoom and offset
        const sx = (screenX + TILE_WIDTH / 2) * zoom * dpr + offset.x * dpr;
        const sy = screenY * zoom * dpr + offset.y * dpr;

        // Skip if off-screen
        if (sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) {
          continue;
        }

        // Calculate pulse animation
        const pulseSpeed = marker.overlay.pulseSpeed;
        const pulsePhase = ((time % pulseSpeed) / pulseSpeed) * Math.PI * 2;
        const scale = PULSE_MIN_SCALE + (PULSE_MAX_SCALE - PULSE_MIN_SCALE) * ((Math.sin(pulsePhase) + 1) / 2);

        const markerSize = MARKER_SIZE * zoom * dpr * scale;

        // Draw glow
        ctx.save();
        ctx.shadowColor = marker.overlay.glowColor;
        ctx.shadowBlur = GLOW_BLUR_RADIUS * marker.overlay.glowIntensity * scale;
        
        // Draw background circle
        ctx.beginPath();
        ctx.arc(sx, sy, markerSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = marker.overlay.backgroundColor;
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = marker.overlay.borderColor;
        ctx.lineWidth = 2 * dpr * scale;
        ctx.stroke();
        ctx.restore();

        // Draw icon
        ctx.save();
        ctx.font = `${markerSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = marker.overlay.borderColor;
        
        // Use simple text representation for icon
        const iconText = DAMAGE_ICONS[marker.overlay.icon] || marker.overlay.icon;
        ctx.fillText(iconText, sx, sy);
        ctx.restore();
      }

      // Restore after shake
      if (state.isShaking) {
        ctx.restore();
      }

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [containerSize, state, damagedMarkers, zoom, offset]);

  // Handle click on damaged building marker
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onDamagedBuildingClick || damagedMarkers.length === 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const clickX = (e.clientX - rect.left) * dpr;
      const clickY = (e.clientY - rect.top) * dpr;

      // Check if click is near any marker
      for (const marker of damagedMarkers) {
        const { screenX, screenY } = gridToScreen(marker.gridX, marker.gridY, 0, 0);
        const sx = (screenX + TILE_WIDTH / 2) * zoom * dpr + offset.x * dpr;
        const sy = screenY * zoom * dpr + offset.y * dpr;
        
        const markerRadius = MARKER_SIZE * zoom * dpr * PULSE_MAX_SCALE / 2;
        const distance = Math.sqrt(Math.pow(clickX - sx, 2) + Math.pow(clickY - sy, 2));
        
        if (distance <= markerRadius) {
          onDamagedBuildingClick(marker.buildingId, marker.gridX, marker.gridY);
          return;
        }
      }
    },
    [damagedMarkers, zoom, offset, onDamagedBuildingClick]
  );

  // Don't render if no active effects
  const hasEffects = state.screenTint !== 'transparent' || 
                     state.isShaking || 
                     damagedMarkers.length > 0;

  if (!hasEffects) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="disaster-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerSize.width,
        height: containerSize.height,
        pointerEvents: damagedMarkers.length > 0 ? 'auto' : 'none',
        zIndex: 100,
        transform: state.isShaking
          ? `translate(${state.shakeOffset.x}px, ${state.shakeOffset.y}px)`
          : undefined,
      }}
      onClick={handleClick}
      aria-hidden="true"
    />
  );
}

export default DisasterOverlay;
