'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CobieMessage, CobieMessageType } from '@/hooks/useCobieNarrator';

export interface CobieNarratorProps {
  message: CobieMessage | null;
  isVisible: boolean;
  onDismiss: () => void;
  onDisableCobie: () => void;
}

// Get border color based on message type
function getMessageTypeColor(type: CobieMessageType): string {
  switch (type) {
    case 'tip':
      return 'border-blue-500/50';
    case 'reaction':
      return 'border-yellow-500/50';
    case 'commentary':
      return 'border-purple-500/50';
    case 'milestone':
      return 'border-green-500/50';
    case 'event':
      return 'border-red-500/50';
    default:
      return 'border-primary/50';
  }
}

// Get accent gradient based on message type
function getMessageTypeGradient(type: CobieMessageType): string {
  switch (type) {
    case 'tip':
      return 'from-blue-500/20 via-blue-500/10 to-transparent';
    case 'reaction':
      return 'from-yellow-500/20 via-yellow-500/10 to-transparent';
    case 'commentary':
      return 'from-purple-500/20 via-purple-500/10 to-transparent';
    case 'milestone':
      return 'from-green-500/20 via-green-500/10 to-transparent';
    case 'event':
      return 'from-red-500/20 via-red-500/10 to-transparent';
    default:
      return 'from-primary/20 via-primary/10 to-transparent';
  }
}

function CobieNarratorContent({ message, isVisible, onDismiss, onDisableCobie }: CobieNarratorProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible && message) {
      setShouldRender(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, message]);

  if (!shouldRender || !message) return null;

  const borderColor = getMessageTypeColor(message.type);
  const gradientColor = getMessageTypeGradient(message.type);

  return (
    <div
      className={cn(
        'fixed z-[9999] pointer-events-auto',
        'transition-all duration-300 ease-out',
        // Mobile: bottom position
        'bottom-16 left-3 right-3',
        // Desktop: bottom left position
        'md:bottom-20 md:left-4 md:right-auto md:max-w-md',
        isAnimating 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
      )}
    >
      <div className={cn(
        'relative bg-gray-900/95 backdrop-blur-sm border rounded-lg shadow-2xl overflow-hidden',
        borderColor
      )}>
        {/* Top accent gradient */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
          gradientColor
        )} />
        
        {/* Content */}
        <div className="p-4 flex items-start gap-3">
          {/* Cobie Avatar */}
          <div className="flex-shrink-0 relative">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
              🧙
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
          </div>
          
          {/* Message */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white">Cobie</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                {message.type === 'tip' ? 'TIP' : 
                 message.type === 'reaction' ? 'REACT' :
                 message.type === 'milestone' ? 'MILESTONE' :
                 message.type === 'event' ? 'EVENT' : 'ALPHA'}
              </span>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">
              {message.message}
            </p>
          </div>
          
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Action buttons */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <button
            onClick={onDisableCobie}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <VolumeX className="w-3 h-3" />
            Mute Cobie
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-xs text-gray-300 hover:text-white hover:bg-white/10"
          >
            Got it
          </Button>
        </div>
        
        {/* Decorative corners */}
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-blue-500/30" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-blue-500/30" />
      </div>
    </div>
  );
}

export function CobieNarrator(props: CobieNarratorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <CobieNarratorContent {...props} />,
    document.body
  );
}
