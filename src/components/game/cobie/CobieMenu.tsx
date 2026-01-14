'use client';

/**
 * CobieMenu - Click menu for FloatingCobieHead
 * Issues #200, #201
 * 
 * A radial-style popup menu that appears when clicking the Cobie head.
 * Provides options: Ask Cobie, Hot Takes, Settings, Dismiss
 * 
 * Features:
 * - Smooth animation on open/close
 * - Keyboard accessible (Tab, Enter, Escape)
 * - Click outside to close
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { MessageCircle, Flame, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface CobieMenuOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export interface CobieMenuProps {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Callback when menu should close */
  onClose: () => void;
  /** Callback for "Ask Cobie" option */
  onAskCobie: () => void;
  /** Callback for "Hot Takes" option */
  onHotTakes: () => void;
  /** Callback for "Settings" option */
  onSettings: () => void;
  /** Callback for "Dismiss" option (hides Cobie) */
  onDismiss: () => void;
  /** Optional custom class names */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Animation duration in milliseconds */
const ANIMATION_DURATION = 200;

/** Menu positioning */
const MENU_RADIUS = 70; // Distance from center for menu items

/** Angles for radial menu items (in degrees, 0 = top) */
const MENU_ANGLES = {
  'ask-cobie': -45, // Top-left
  'hot-takes': 45,  // Top-right
  'settings': 135,  // Bottom-right
  'dismiss': -135,  // Bottom-left
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate position for a radial menu item
 */
function getRadialPosition(angle: number, radius: number) {
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * CobieMenu - Radial menu for Cobie head interactions
 */
export function CobieMenu({
  isOpen,
  onClose,
  onAskCobie,
  onHotTakes,
  onSettings,
  onDismiss,
  className,
}: CobieMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  // Menu options configuration
  const menuOptions: CobieMenuOption[] = [
    {
      id: 'ask-cobie',
      label: 'Ask Cobie',
      icon: <MessageCircle className="w-5 h-5" />,
      action: () => {
        onAskCobie();
        onClose();
      },
    },
    {
      id: 'hot-takes',
      label: 'Hot Takes',
      icon: <Flame className="w-5 h-5" />,
      action: () => {
        onHotTakes();
        onClose();
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      action: () => {
        onSettings();
        onClose();
      },
    },
    {
      id: 'dismiss',
      label: 'Dismiss',
      icon: <X className="w-5 h-5" />,
      action: () => {
        onDismiss();
        onClose();
      },
    },
  ];

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }, [isOpen, onClose]);

  // Handle click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!isOpen) return;
    
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Add event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      
      // Focus first item when menu opens
      setTimeout(() => {
        firstItemRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleKeyDown, handleClickOutside]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className={cn(
        'absolute z-[9999]',
        // Position menu above and centered on the head
        'bottom-full left-1/2 -translate-x-1/2 mb-4',
        className
      )}
      role="menu"
      aria-label="Cobie menu options"
    >
      {/* Semi-transparent backdrop for better visibility */}
      <div className="absolute inset-0 -m-20 pointer-events-none" />

      {/* Radial menu container */}
      <div className="relative w-[180px] h-[180px]">
        {menuOptions.map((option, index) => {
          const angle = MENU_ANGLES[option.id as keyof typeof MENU_ANGLES];
          const { x, y } = getRadialPosition(angle, MENU_RADIUS);

          return (
            <button
              key={option.id}
              ref={index === 0 ? firstItemRef : undefined}
              className={cn(
                'absolute',
                'flex flex-col items-center justify-center',
                'w-16 h-16',
                'bg-gray-900/95 backdrop-blur-sm',
                'border-2 border-purple-500/50',
                'rounded-xl shadow-lg shadow-purple-500/20',
                'text-gray-100',
                'transition-all duration-200 ease-out',
                'hover:bg-purple-600/30 hover:scale-110 hover:border-purple-400',
                'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900',
                // Animation on open
                'animate-menu-item-appear',
              )}
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                animationDelay: `${index * 50}ms`,
              }}
              onClick={option.action}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  option.action();
                }
              }}
              role="menuitem"
              tabIndex={0}
              aria-label={option.label}
            >
              {/* Icon */}
              <span className="text-purple-300">
                {option.icon}
              </span>
              {/* Label */}
              <span className="text-[10px] mt-1 font-medium">
                {option.label}
              </span>

              {/* Pixel corner decorations */}
              <div className="absolute top-0 left-0 w-1 h-1 bg-purple-400" />
              <div className="absolute top-0 right-0 w-1 h-1 bg-purple-400" />
              <div className="absolute bottom-0 left-0 w-1 h-1 bg-purple-400" />
              <div className="absolute bottom-0 right-0 w-1 h-1 bg-purple-400" />
            </button>
          );
        })}

        {/* Center indicator (optional visual element) */}
        <div
          className={cn(
            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-4 h-4 rounded-full',
            'bg-purple-500/30 border border-purple-400/50',
            'animate-pulse',
          )}
        />
      </div>
    </div>
  );
}

export default CobieMenu;
