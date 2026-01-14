'use client';

/**
 * FloatingCobieHead - Visual component for the Cobie talking head
 * Issue #177
 * 
 * A floating, animated pixel-art talking head inspired by Black & White's
 * spiritual advisors. Renders in the corner of the screen, reacts to player
 * actions, and speaks with animated expressions.
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { CobieExpression, CobieMood, LookDirection } from '@/lib/cobie/types';
import { CobieExpressionSVG } from './cobie/CobieExpressions';
import { CobieSpeechBubble } from './cobie/CobieSpeechBubble';
import { CobieMenu } from './cobie/CobieMenu';
import {
  getScalePixels as getScalePixelsUtil,
  getPositionClasses as getPositionClassesUtil,
  shouldRenderCobieHead as shouldRenderCobieHeadUtil,
  type CobiePosition,
  type CobieScale,
} from '@/lib/cobie/CobieHeadUtils';

// Re-export types and functions for backward compatibility
export type { CobiePosition, CobieScale };
export const getScalePixels = getScalePixelsUtil;
export const getPositionClasses = getPositionClassesUtil;
export const shouldRenderCobieHead = shouldRenderCobieHeadUtil;

/**
 * Props for the FloatingCobieHead component
 */
export interface FloatingCobieHeadProps {
  /** Current expression to display */
  expression: CobieExpression;
  /** Current mood (affects animations) */
  mood: CobieMood;
  /** Current dialogue text (null if not speaking) */
  dialogue: string | null;
  /** Whether Cobie is actively speaking */
  isSpeaking: boolean;
  /** Direction Cobie is looking */
  lookDirection: LookDirection;
  /** Screen position */
  position: CobiePosition;
  /** Size scale */
  scale: CobieScale;
  /** Whether the head is enabled/visible */
  enabled: boolean;
  /** Number of messages in queue */
  queueLength: number;
  /** Callback when dialogue is dismissed */
  onDismissDialogue: () => void;
  /** Callback for "Ask Cobie" menu action */
  onAskCobie?: () => void;
  /** Callback for "Hot Takes" menu action */
  onHotTakes?: () => void;
  /** Callback for "Settings" menu action */
  onSettings?: () => void;
  /** Callback for "Dismiss" menu action (hides Cobie) */
  onDismissCobie?: () => void;
}

/**
 * Get speech bubble position based on head position
 */
function getSpeechBubblePosition(position: CobiePosition): 'top' | 'top-left' | 'top-right' {
  return position === 'bottom-left' ? 'top-right' : 'top-left';
}

// =============================================================================
// COMPONENT
// =============================================================================

function FloatingCobieHeadContent({
  expression,
  mood,
  dialogue,
  isSpeaking,
  lookDirection,
  position,
  scale,
  enabled,
  queueLength,
  onDismissDialogue,
  onAskCobie,
  onHotTakes,
  onSettings,
  onDismissCobie,
}: FloatingCobieHeadProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleHeadClick = useCallback(() => {
    // If dialogue is showing, dismiss it
    if (dialogue) {
      onDismissDialogue();
      return;
    }
    // Otherwise, toggle the menu
    setIsMenuOpen(prev => !prev);
  }, [dialogue, onDismissDialogue]);

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleAskCobie = useCallback(() => {
    onAskCobie?.();
  }, [onAskCobie]);

  const handleHotTakes = useCallback(() => {
    onHotTakes?.();
  }, [onHotTakes]);

  const handleSettings = useCallback(() => {
    onSettings?.();
  }, [onSettings]);

  const handleDismissCobie = useCallback(() => {
    onDismissCobie?.();
  }, [onDismissCobie]);

  if (!shouldRenderCobieHead({ enabled })) {
    return null;
  }

  const size = getScalePixels(scale);
  const positionClasses = getPositionClasses(position);
  const bubblePosition = getSpeechBubblePosition(position);

  return (
    <div
      className={cn(
        'fixed z-[9998] pointer-events-auto',
        'transition-all duration-300 ease-out',
        positionClasses,
        enabled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}
      role="region"
      aria-label="Cobie assistant"
    >
      {/* Container for head, speech bubble, and menu */}
      <div className="relative inline-block">
        {/* Speech bubble */}
        <CobieSpeechBubble
          text={dialogue ?? ''}
          isVisible={!!dialogue}
          position={bubblePosition}
          onDismiss={onDismissDialogue}
          queueLength={queueLength}
        />

        {/* Cobie Menu */}
        <CobieMenu
          isOpen={isMenuOpen}
          onClose={handleCloseMenu}
          onAskCobie={handleAskCobie}
          onHotTakes={handleHotTakes}
          onSettings={handleSettings}
          onDismiss={handleDismissCobie}
        />

        {/* Cobie head */}
        <div
          className={cn(
            'relative rounded-full',
            'shadow-lg shadow-purple-500/30',
            'cursor-pointer',
            'hover:scale-105',
            'transition-transform duration-200',
          )}
          onClick={handleHeadClick}
          role="button"
          tabIndex={0}
          aria-label={dialogue ? 'Click to dismiss message' : isMenuOpen ? 'Click to close menu' : 'Click to open Cobie menu'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleHeadClick();
            }
          }}
        >
          <CobieExpressionSVG
            expression={expression}
            lookDirection={lookDirection}
            isSpeaking={isSpeaking}
            size={size}
          />

          {/* Mood indicator glow */}
          <div
            className={cn(
              'absolute inset-0 rounded-full pointer-events-none',
              'transition-opacity duration-500',
              getMoodGlowClass(mood),
            )}
          />

          {/* Online/speaking indicator */}
          <div
            className={cn(
              'absolute -bottom-1 -right-1',
              'w-4 h-4 rounded-full',
              'border-2 border-gray-900',
              isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-green-600',
            )}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Get glow class based on mood
 */
function getMoodGlowClass(mood: CobieMood): string {
  switch (mood) {
    case 'excited':
      return 'shadow-yellow-400/30 opacity-100';
    case 'concerned':
      return 'shadow-red-400/30 opacity-100';
    case 'amused':
      return 'shadow-green-400/20 opacity-80';
    case 'bored':
      return 'shadow-gray-400/10 opacity-50';
    case 'sardonic':
      return 'shadow-purple-400/20 opacity-80';
    case 'thinking':
      return 'shadow-blue-400/20 opacity-60';
    case 'neutral':
    default:
      return 'opacity-0';
  }
}

/**
 * FloatingCobieHead - Main component with portal rendering
 */
export function FloatingCobieHead(props: FloatingCobieHeadProps) {
  // Don't render on server
  if (typeof document === 'undefined') {
    return null;
  }

  // Don't render if disabled
  if (!props.enabled) {
    return null;
  }

  return createPortal(
    <FloatingCobieHeadContent {...props} />,
    document.body
  );
}
