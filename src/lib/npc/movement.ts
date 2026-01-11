/**
 * NPC Movement System
 * 
 * Implements a state machine for NPC movement, handling walking along paths,
 * entering/exiting buildings, and smooth tile-by-tile transitions.
 * 
 * The system uses a progress-based approach where NPCs smoothly move between
 * tiles based on their walk speed and delta time.
 */

import type { Tile } from '@/games/isocity/types/game';
import type { NPCDirection } from '@/games/isocity/types/npc';
import { findPath, GridPosition, DEFAULT_PATHFINDING_OPTIONS } from './pathfinding';

/**
 * Movement states for the NPC state machine.
 * Each state represents a distinct movement mode with its own data.
 */
export type MovementState =
  | { type: 'idle' }
  | { type: 'walking'; path: GridPosition[]; pathIndex: number; progress: number }
  | { type: 'inside_building'; buildingId: string }
  | { type: 'entering_building'; buildingId: string; progress: number }
  | { type: 'exiting_building'; buildingId: string; progress: number };

/**
 * Complete movement data for an NPC.
 */
export interface NPCMovement {
  /** Current movement state */
  state: MovementState;
  /** Target position (if any) */
  targetPosition: GridPosition | null;
  /** Movement speed in tiles per second */
  walkSpeed: number;
}

/**
 * Hitchhiker's Guide style descriptions for movement states.
 * Sardonic, educational, and crypto-native.
 */
export const MOVEMENT_DESCRIPTIONS: Record<string, string> = {
  idle: "Standing motionless, contemplating the futility of centralized finance.",
  walking: "Ambulating with purpose, or at least the illusion of it.",
  inside_building: "Temporarily removed from the chaos of the outside world.",
  entering_building: "Seeking shelter from the relentless march of market forces.",
  exiting_building: "Emerging to face whatever the market has done in their absence.",
};

/**
 * Default walk speed in tiles per second.
 * NPCs walk at a leisurely pace - they're not in a hurry unless their portfolio is crashing.
 */
const DEFAULT_WALK_SPEED = 2.0;

/**
 * Time (in seconds) for building enter/exit animations.
 */
const BUILDING_TRANSITION_TIME = 0.5;

/**
 * Create the initial movement state for a new NPC.
 * 
 * @returns Default NPCMovement in idle state
 */
export function createInitialMovement(): NPCMovement {
  return {
    state: { type: 'idle' },
    targetPosition: null,
    walkSpeed: DEFAULT_WALK_SPEED,
  };
}

/**
 * Minimal NPC interface for movement operations.
 * This allows the MovementManager to work with various NPC representations.
 */
interface MovableNPC {
  id: string;
  gridX: number;
  gridY: number;
  direction?: NPCDirection;
  movement: NPCMovement;
  isInsideBuilding?: boolean;
  currentBuildingId?: string | null;
}

/**
 * Calculate the direction to face when moving from one tile to another.
 * 
 * @param fromX Current X position
 * @param fromY Current Y position
 * @param toX Target X position
 * @param toY Target Y position
 * @returns The cardinal direction to face
 */
function calculateDirection(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): NPCDirection {
  const dx = toX - fromX;
  const dy = toY - fromY;
  
  // Prioritize X movement for diagonal paths
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? 'east' : 'west';
  } else {
    return dy > 0 ? 'south' : 'north';
  }
}

/**
 * Movement Manager
 * 
 * Handles all NPC movement operations including pathfinding, walking,
 * and building transitions. Uses a state machine approach for clean
 * state management.
 */
export class MovementManager {
  /**
   * Set a destination for an NPC and calculate the path.
   * 
   * @param npc The NPC to move
   * @param targetX Destination X coordinate
   * @param targetY Destination Y coordinate
   * @param grid The game grid for pathfinding
   * @returns true if path was found and movement started, false otherwise
   */
  setDestination(
    npc: MovableNPC,
    targetX: number,
    targetY: number,
    grid: Tile[][]
  ): boolean {
    // Already at destination
    if (npc.gridX === targetX && npc.gridY === targetY) {
      npc.movement.state = { type: 'idle' };
      npc.movement.targetPosition = null;
      return true;
    }
    
    // Find path to destination
    const path = findPath(
      npc.gridX,
      npc.gridY,
      targetX,
      targetY,
      grid,
      DEFAULT_PATHFINDING_OPTIONS
    );
    
    if (!path || path.length === 0) {
      // No path found - stay idle
      npc.movement.state = { type: 'idle' };
      npc.movement.targetPosition = null;
      return false;
    }
    
    // Start walking along path
    npc.movement.state = {
      type: 'walking',
      path,
      pathIndex: 0,
      progress: 0,
    };
    npc.movement.targetPosition = { x: targetX, y: targetY };
    
    return true;
  }
  
  /**
   * Update NPC movement state based on elapsed time.
   * Should be called every frame with delta time.
   * 
   * @param npc The NPC to update
   * @param deltaTime Time elapsed since last update (in seconds)
   */
  update(npc: MovableNPC, deltaTime: number): void {
    const { state } = npc.movement;
    
    switch (state.type) {
      case 'idle':
        // Nothing to do
        break;
        
      case 'walking':
        this.updateWalking(npc, state, deltaTime);
        break;
        
      case 'entering_building':
        this.updateEnteringBuilding(npc, state, deltaTime);
        break;
        
      case 'exiting_building':
        this.updateExitingBuilding(npc, state, deltaTime);
        break;
        
      case 'inside_building':
        // Nothing to do - NPC is stationary inside building
        break;
    }
  }
  
  /**
   * Update NPC walking state - move along path.
   */
  private updateWalking(
    npc: MovableNPC,
    state: Extract<MovementState, { type: 'walking' }>,
    deltaTime: number
  ): void {
    const { path, pathIndex } = state;
    
    // Check if we've completed the path
    if (pathIndex >= path.length - 1) {
      // Arrived at destination
      npc.movement.state = { type: 'idle' };
      npc.movement.targetPosition = null;
      return;
    }
    
    // Calculate movement progress
    const progressDelta = deltaTime * npc.movement.walkSpeed;
    let newProgress = state.progress + progressDelta;
    
    // Current and next tile
    const currentTile = path[pathIndex];
    const nextTile = path[pathIndex + 1];
    
    // Update direction to face movement
    if (npc.direction !== undefined) {
      npc.direction = calculateDirection(
        currentTile.x,
        currentTile.y,
        nextTile.x,
        nextTile.y
      );
    }
    
    // Handle completing one or more tiles in this update
    while (newProgress >= 1.0 && pathIndex < path.length - 1) {
      newProgress -= 1.0;
      state.pathIndex++;
      
      // Move NPC to the new tile
      const newTile = path[state.pathIndex];
      npc.gridX = newTile.x;
      npc.gridY = newTile.y;
      
      // Check if we've reached the end
      if (state.pathIndex >= path.length - 1) {
        npc.movement.state = { type: 'idle' };
        npc.movement.targetPosition = null;
        return;
      }
      
      // Update direction for next segment
      if (state.pathIndex < path.length - 1 && npc.direction !== undefined) {
        const curr = path[state.pathIndex];
        const next = path[state.pathIndex + 1];
        npc.direction = calculateDirection(curr.x, curr.y, next.x, next.y);
      }
    }
    
    // Update progress
    state.progress = newProgress;
  }
  
  /**
   * Update building entry animation.
   */
  private updateEnteringBuilding(
    npc: MovableNPC,
    state: Extract<MovementState, { type: 'entering_building' }>,
    deltaTime: number
  ): void {
    const progressDelta = deltaTime / BUILDING_TRANSITION_TIME;
    const newProgress = state.progress + progressDelta;
    
    if (newProgress >= 1.0) {
      // Entry complete - now inside building
      npc.movement.state = {
        type: 'inside_building',
        buildingId: state.buildingId,
      };
      
      // Update NPC state
      if ('isInsideBuilding' in npc) {
        npc.isInsideBuilding = true;
      }
      if ('currentBuildingId' in npc) {
        npc.currentBuildingId = state.buildingId;
      }
    } else {
      state.progress = newProgress;
    }
  }
  
  /**
   * Update building exit animation.
   */
  private updateExitingBuilding(
    npc: MovableNPC,
    state: Extract<MovementState, { type: 'exiting_building' }>,
    deltaTime: number
  ): void {
    const progressDelta = deltaTime / BUILDING_TRANSITION_TIME;
    const newProgress = state.progress + progressDelta;
    
    if (newProgress >= 1.0) {
      // Exit complete - now idle outside
      npc.movement.state = { type: 'idle' };
      
      // Update NPC state
      if ('isInsideBuilding' in npc) {
        npc.isInsideBuilding = false;
      }
      if ('currentBuildingId' in npc) {
        npc.currentBuildingId = null;
      }
    } else {
      state.progress = newProgress;
    }
  }
  
  /**
   * Start entering a building.
   * NPC should already be at the building entrance.
   * 
   * @param npc The NPC entering the building
   * @param buildingId The building's identifier
   */
  enterBuilding(npc: MovableNPC, buildingId: string): void {
    npc.movement.state = {
      type: 'entering_building',
      buildingId,
      progress: 0,
    };
    npc.movement.targetPosition = null;
  }
  
  /**
   * Start exiting a building.
   * NPC must currently be inside a building.
   * 
   * @param npc The NPC exiting the building
   */
  exitBuilding(npc: MovableNPC): void {
    const currentState = npc.movement.state;
    
    if (currentState.type !== 'inside_building') {
      // Not inside a building - nothing to do
      return;
    }
    
    npc.movement.state = {
      type: 'exiting_building',
      buildingId: currentState.buildingId,
      progress: 0,
    };
  }
  
  /**
   * Cancel current movement and return to idle.
   * 
   * @param npc The NPC to stop
   */
  stopMovement(npc: MovableNPC): void {
    // Only stop if currently walking
    if (npc.movement.state.type === 'walking') {
      npc.movement.state = { type: 'idle' };
      npc.movement.targetPosition = null;
    }
  }
  
  /**
   * Check if an NPC is currently moving.
   * 
   * @param npc The NPC to check
   * @returns true if the NPC is in a movement state
   */
  isMoving(npc: MovableNPC): boolean {
    return npc.movement.state.type === 'walking';
  }
  
  /**
   * Check if an NPC is inside a building.
   * 
   * @param npc The NPC to check
   * @returns true if inside a building
   */
  isInsideBuilding(npc: MovableNPC): boolean {
    return npc.movement.state.type === 'inside_building';
  }
  
  /**
   * Check if an NPC is in transition (entering or exiting building).
   * 
   * @param npc The NPC to check
   * @returns true if in building transition
   */
  isInTransition(npc: MovableNPC): boolean {
    const type = npc.movement.state.type;
    return type === 'entering_building' || type === 'exiting_building';
  }
  
  /**
   * Get the current progress through the current tile (0-1).
   * Useful for smooth rendering interpolation.
   * 
   * @param npc The NPC to check
   * @returns Progress value 0-1, or 0 if not walking
   */
  getTileProgress(npc: MovableNPC): number {
    if (npc.movement.state.type === 'walking') {
      return npc.movement.state.progress;
    }
    return 0;
  }
  
  /**
   * Get the next tile the NPC is moving towards.
   * Useful for rendering interpolation.
   * 
   * @param npc The NPC to check
   * @returns Next tile position, or null if not walking
   */
  getNextTile(npc: MovableNPC): GridPosition | null {
    const state = npc.movement.state;
    if (state.type !== 'walking') return null;
    
    const { path, pathIndex } = state;
    if (pathIndex >= path.length - 1) return null;
    
    return path[pathIndex + 1];
  }
  
  /**
   * Get the movement description for the current state.
   * Returns a Hitchhiker's Guide style description.
   * 
   * @param npc The NPC to describe
   * @returns Description string
   */
  getMovementDescription(npc: MovableNPC): string {
    return MOVEMENT_DESCRIPTIONS[npc.movement.state.type] || MOVEMENT_DESCRIPTIONS.idle;
  }
}

/**
 * Singleton instance of the MovementManager.
 * Use this for most NPC movement operations.
 */
export const movementManager = new MovementManager();
