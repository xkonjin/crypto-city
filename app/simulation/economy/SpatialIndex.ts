// =============================================================================
// SPATIAL INDEX
// =============================================================================
// Provides efficient O(1) lookups for buildings and zone effects by position.
// Uses a grid-based spatial hashing approach for fast neighbor queries.

import { BUILDING_CONFIG } from '../../config/gameConfig';

// =============================================================================
// TYPES
// =============================================================================

export interface SpatialEntry {
  buildingId: string;
  gridX: number;
  gridY: number;
  radius: number;
}

// =============================================================================
// SPATIAL INDEX CLASS
// =============================================================================

export class SpatialIndex {
  // Map of "x,y" -> Set of building IDs that affect this cell
  private cellToBuildings: Map<string, Set<string>> = new Map();
  
  // Map of building ID -> Set of "x,y" cells it affects
  private buildingToCells: Map<string, Set<string>> = new Map();
  
  // Building position lookup
  private buildingPositions: Map<string, { x: number; y: number; radius: number }> = new Map();

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private makeKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  // ---------------------------------------------------------------------------
  // REGISTRATION
  // ---------------------------------------------------------------------------

  /**
   * Add a building to the spatial index
   * @param buildingId Unique building identifier
   * @param x Grid X position
   * @param y Grid Y position
   * @param radius Effect radius in tiles (default from config)
   */
  addBuilding(
    buildingId: string,
    x: number,
    y: number,
    radius: number = BUILDING_CONFIG.DEFAULT_ZONE_RADIUS
  ): void {
    // Clamp radius to max
    radius = Math.min(radius, BUILDING_CONFIG.MAX_ZONE_RADIUS);

    // Store position
    this.buildingPositions.set(buildingId, { x, y, radius });

    // Calculate all cells this building affects
    const affectedCells = new Set<string>();

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        // Use circular radius check
        if (Math.sqrt(dx * dx + dy * dy) <= radius) {
          const cellKey = this.makeKey(x + dx, y + dy);
          affectedCells.add(cellKey);

          // Add to cell -> buildings map
          if (!this.cellToBuildings.has(cellKey)) {
            this.cellToBuildings.set(cellKey, new Set());
          }
          this.cellToBuildings.get(cellKey)!.add(buildingId);
        }
      }
    }

    // Store which cells this building affects
    this.buildingToCells.set(buildingId, affectedCells);
  }

  /**
   * Remove a building from the spatial index
   */
  removeBuilding(buildingId: string): void {
    const affectedCells = this.buildingToCells.get(buildingId);
    if (!affectedCells) return;

    // Remove from all affected cells
    for (const cellKey of affectedCells) {
      const buildings = this.cellToBuildings.get(cellKey);
      if (buildings) {
        buildings.delete(buildingId);
        if (buildings.size === 0) {
          this.cellToBuildings.delete(cellKey);
        }
      }
    }

    // Clean up
    this.buildingToCells.delete(buildingId);
    this.buildingPositions.delete(buildingId);
  }

  /**
   * Update a building's position (removes and re-adds)
   */
  updateBuilding(
    buildingId: string,
    x: number,
    y: number,
    radius: number = BUILDING_CONFIG.DEFAULT_ZONE_RADIUS
  ): void {
    this.removeBuilding(buildingId);
    this.addBuilding(buildingId, x, y, radius);
  }

  // ---------------------------------------------------------------------------
  // QUERIES (O(1) lookups)
  // ---------------------------------------------------------------------------

  /**
   * Get all building IDs that affect a specific cell
   */
  getBuildingsAt(x: number, y: number): string[] {
    const cellKey = this.makeKey(x, y);
    const buildings = this.cellToBuildings.get(cellKey);
    return buildings ? Array.from(buildings) : [];
  }

  /**
   * Check if any buildings affect a specific cell
   */
  hasEffectsAt(x: number, y: number): boolean {
    const cellKey = this.makeKey(x, y);
    const buildings = this.cellToBuildings.get(cellKey);
    return buildings !== undefined && buildings.size > 0;
  }

  /**
   * Get the count of buildings affecting a cell
   */
  getEffectCountAt(x: number, y: number): number {
    const cellKey = this.makeKey(x, y);
    return this.cellToBuildings.get(cellKey)?.size ?? 0;
  }

  /**
   * Get all cells affected by a building
   */
  getCellsAffectedBy(buildingId: string): Array<{ x: number; y: number }> {
    const cells = this.buildingToCells.get(buildingId);
    if (!cells) return [];

    return Array.from(cells).map((key) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });
  }

  /**
   * Get buildings within a radius of a point
   * More efficient than checking all buildings
   */
  getBuildingsInRadius(centerX: number, centerY: number, radius: number): string[] {
    const found = new Set<string>();

    // Only check cells within the radius
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.sqrt(dx * dx + dy * dy) <= radius) {
          const buildings = this.getBuildingsAt(centerX + dx, centerY + dy);
          for (const id of buildings) {
            found.add(id);
          }
        }
      }
    }

    return Array.from(found);
  }

  /**
   * Get the position of a building
   */
  getBuildingPosition(buildingId: string): { x: number; y: number; radius: number } | null {
    return this.buildingPositions.get(buildingId) ?? null;
  }

  // ---------------------------------------------------------------------------
  // BULK OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Clear all data
   */
  clear(): void {
    this.cellToBuildings.clear();
    this.buildingToCells.clear();
    this.buildingPositions.clear();
  }

  /**
   * Get statistics about the index
   */
  getStats(): {
    buildingCount: number;
    cellCount: number;
    avgBuildingsPerCell: number;
  } {
    const buildingCount = this.buildingPositions.size;
    const cellCount = this.cellToBuildings.size;
    
    let totalBuildings = 0;
    for (const buildings of this.cellToBuildings.values()) {
      totalBuildings += buildings.size;
    }

    return {
      buildingCount,
      cellCount,
      avgBuildingsPerCell: cellCount > 0 ? totalBuildings / cellCount : 0,
    };
  }

  /**
   * Export for serialization
   */
  export(): SpatialEntry[] {
    const entries: SpatialEntry[] = [];
    
    for (const [buildingId, pos] of this.buildingPositions) {
      entries.push({
        buildingId,
        gridX: pos.x,
        gridY: pos.y,
        radius: pos.radius,
      });
    }

    return entries;
  }

  /**
   * Import from serialization
   */
  import(entries: SpatialEntry[]): void {
    this.clear();
    
    for (const entry of entries) {
      this.addBuilding(entry.buildingId, entry.gridX, entry.gridY, entry.radius);
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createSpatialIndex(): SpatialIndex {
  return new SpatialIndex();
}

