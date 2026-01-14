'use client';

/**
 * CobieSpeechBubble - Speech bubble component for FloatingCobieHead
 * Issue #177
 * 
 * Renders a retro pixel-art speech bubble with text and dismiss functionality.
 */

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface CobieSpeechBubbleProps {
  /** The text to display in the speech bubble */
  text: string;
  /** Whether the speech bubble is visible */
  isVisible: boolean;
  /** Position of the bubble relative to the head */
  position: 'top' | 'top-left' | 'top-right';
  /** Callback when the bubble is dismissed */
  onDismiss: () => void;
  /** Optional queue length indicator */
  queueLength?: number;
  /** Optional custom class names */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * CobieSpeechBubble - Renders dialogue text in a styled speech bubble
 */
export function CobieSpeechBubble({
  text,
  isVisible,
  position,
  onDismiss,
  queueLength = 0,
  className,
}: CobieSpeechBubbleProps) {
  if (!isVisible || !text) {
    return null;
  }

  // Position classes based on bubble position
  const positionClasses = {
    'top': 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    'top-left': 'bottom-full right-0 mb-2',
    'top-right': 'bottom-full left-0 mb-2',
  };

  // Tail position based on bubble position
  const tailClasses = {
    'top': 'left-1/2 -translate-x-1/2 -bottom-2',
    'top-left': 'right-4 -bottom-2',
    'top-right': 'left-4 -bottom-2',
  };

  return (
    <div
      className={cn(
        'absolute z-10',
        'transition-all duration-200 ease-out',
        positionClasses[position],
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        className
      )}
      role="dialog"
      aria-label="Cobie says"
    >
      {/* Speech bubble container */}
      <div className="relative max-w-[280px] min-w-[120px]">
        {/* Main bubble */}
        <div
          className={cn(
            'bg-gray-900/95 backdrop-blur-sm',
            'border-2 border-purple-500/50',
            'rounded-lg shadow-lg shadow-purple-500/20',
            'px-3 py-2',
          )}
        >
          {/* Pixel corner decorations */}
          <div className="absolute top-0 left-0 w-1 h-1 bg-purple-400" />
          <div className="absolute top-0 right-0 w-1 h-1 bg-purple-400" />
          <div className="absolute bottom-0 left-0 w-1 h-1 bg-purple-400" />
          <div className="absolute bottom-0 right-0 w-1 h-1 bg-purple-400" />

          {/* Text content */}
          <p className="text-sm text-gray-100 leading-relaxed pr-6">
            {text}
          </p>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className={cn(
              'absolute top-1 right-1',
              'p-1 rounded',
              'text-gray-400 hover:text-white',
              'hover:bg-white/10',
              'transition-colors duration-150',
            )}
            aria-label="Dismiss message"
          >
            <X className="w-3 h-3" />
          </button>

          {/* Queue indicator */}
          {queueLength > 0 && (
            <div className="absolute -top-2 -right-2 flex items-center justify-center">
              <span
                className={cn(
                  'min-w-[18px] h-[18px] px-1',
                  'flex items-center justify-center',
                  'text-[10px] font-bold text-white',
                  'bg-purple-600 rounded-full',
                  'border border-purple-400',
                )}
              >
                +{queueLength}
              </span>
            </div>
          )}
        </div>

        {/* Speech bubble tail */}
        <div
          className={cn(
            'absolute w-0 h-0',
            tailClasses[position],
          )}
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(168, 85, 247, 0.5)',
          }}
        />
        <div
          className={cn(
            'absolute w-0 h-0',
            tailClasses[position],
            '-translate-y-[2px]',
          )}
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(17, 24, 39, 0.95)',
          }}
        />
      </div>
    </div>
  );
}
