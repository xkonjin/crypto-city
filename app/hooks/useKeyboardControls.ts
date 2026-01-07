// =============================================================================
// USE KEYBOARD CONTROLS HOOK
// =============================================================================
// Custom hook for handling keyboard shortcuts in the game.
// Extracted from GameBoard for cleaner component architecture.

import { useEffect, useCallback, useRef } from 'react';
import { Direction, ToolType } from '../components/game/types';

// =============================================================================
// TYPES
// =============================================================================

export interface KeyboardControlsConfig {
  // Current state
  selectedTool: ToolType;
  selectedBuildingId: string | null;
  buildingOrientation: Direction;
  
  // State setters
  onRotate: (newOrientation: Direction) => void;
  onDeselect: () => void;
  
  // Optional: building supports rotation
  supportsRotation?: boolean;
  
  // Enable/disable keyboard controls
  enabled?: boolean;
}

// =============================================================================
// ROTATION HELPER
// =============================================================================

/**
 * Rotate direction clockwise
 */
function rotateClockwise(direction: Direction): Direction {
  const order = [Direction.Down, Direction.Left, Direction.Up, Direction.Right];
  const currentIndex = order.indexOf(direction);
  return order[(currentIndex + 1) % 4];
}

/**
 * Rotate direction counter-clockwise
 */
function rotateCounterClockwise(direction: Direction): Direction {
  const order = [Direction.Down, Direction.Left, Direction.Up, Direction.Right];
  const currentIndex = order.indexOf(direction);
  return order[(currentIndex + 3) % 4];
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Custom hook for keyboard controls
 * 
 * Handles:
 * - R key: Rotate building clockwise
 * - Shift+R: Rotate building counter-clockwise
 * - Escape: Deselect tool/building
 * - Number keys: Quick-select tools
 */
export function useKeyboardControls(config: KeyboardControlsConfig): void {
  const configRef = useRef(config);
  configRef.current = config;
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { enabled = true, selectedTool, selectedBuildingId, buildingOrientation, supportsRotation, onRotate, onDeselect } = configRef.current;
    
    if (!enabled) return;
    
    // Ignore if typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    
    switch (event.key.toLowerCase()) {
      // Rotation controls
      case 'r':
        if (selectedTool === ToolType.Building && selectedBuildingId && supportsRotation) {
          event.preventDefault();
          if (event.shiftKey) {
            onRotate(rotateCounterClockwise(buildingOrientation));
          } else {
            onRotate(rotateClockwise(buildingOrientation));
          }
        }
        break;
        
      // Escape to deselect
      case 'escape':
        event.preventDefault();
        onDeselect();
        break;
        
      default:
        break;
    }
  }, []);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useKeyboardControls;

