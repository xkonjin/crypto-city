/**
 * GridContext - Grid-related state management
 * 
 * Manages:
 * - Grid state
 * - Building placement
 * - Zone management
 * - Grid operations (expand, shrink)
 */
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
} from "react";
import { 
  Tile, 
  Tool, 
  GameState, 
  BuildingType, 
  ZoneType,
  TOOL_INFO,
  ServiceCoverage,
} from "@/types/game";
import {
  bulldozeTile,
  expandGrid,
  shrinkGrid,
  placeBuilding,
  placeSubway,
  placeWaterTerraform,
  placeLandTerraform,
  createBridgesOnPath,
} from "@/lib/simulation";

const toolBuildingMap: Partial<Record<Tool, BuildingType>> = {
  road: "road",
  rail: "rail",
  rail_station: "rail_station",
  tree: "tree",
  police_station: "police_station",
  fire_station: "fire_station",
  hospital: "hospital",
  school: "school",
  university: "university",
  park: "park",
  park_large: "park_large",
  tennis: "tennis",
  power_plant: "power_plant",
  water_tower: "water_tower",
  subway_station: "subway_station",
  stadium: "stadium",
  museum: "museum",
  airport: "airport",
  space_program: "space_program",
  city_hall: "city_hall",
  amusement_park: "amusement_park",
  basketball_courts: "basketball_courts",
  playground_small: "playground_small",
  playground_large: "playground_large",
  baseball_field_small: "baseball_field_small",
  soccer_field_small: "soccer_field_small",
  football_field: "football_field",
  baseball_stadium: "baseball_stadium",
  community_center: "community_center",
  office_building_small: "office_building_small",
  swimming_pool: "swimming_pool",
  skate_park: "skate_park",
  mini_golf_course: "mini_golf_course",
  bleachers_field: "bleachers_field",
  go_kart_track: "go_kart_track",
  amphitheater: "amphitheater",
  greenhouse_garden: "greenhouse_garden",
  animal_pens_farm: "animal_pens_farm",
  cabin_house: "cabin_house",
  campground: "campground",
  marina_docks_small: "marina_docks_small",
  pier_large: "pier_large",
  roller_coaster_small: "roller_coaster_small",
  community_garden: "community_garden",
  pond_park: "pond_park",
  park_gate: "park_gate",
  mountain_lodge: "mountain_lodge",
  mountain_trailhead: "mountain_trailhead",
};

const toolZoneMap: Partial<Record<Tool, ZoneType>> = {
  zone_residential: "residential",
  zone_commercial: "commercial",
  zone_industrial: "industrial",
  zone_dezone: "none",
};

export interface GridState {
  grid: Tile[][];
  gridSize: number;
  services: ServiceCoverage;
}

export interface GridContextValue {
  // State
  grid: Tile[][];
  gridSize: number;
  services: ServiceCoverage;
  latestGridRef: React.RefObject<Tile[][]>;
  
  // Actions
  placeAtTile: (
    x: number, 
    y: number, 
    tool: Tool, 
    money: number
  ) => { newState: GameState | null; cost: number };
  finishTrackDrag: (
    pathTiles: { x: number; y: number }[],
    trackType: "road" | "rail",
    state: GameState
  ) => GameState;
  placeCryptoBuilding: (
    x: number,
    y: number,
    buildingId: string,
    grid: Tile[][],
  ) => Tile[][];
  expandCity: (state: GameState) => GameState;
  shrinkCity: (state: GameState) => GameState | null;
  
  // State update (used by GameContext orchestrator)
  updateGridState: (state: Partial<GridState>) => void;
  setFullGridState: (grid: Tile[][], gridSize: number, services: ServiceCoverage) => void;
}

const GridContext = createContext<GridContextValue | null>(null);

const DEFAULT_SERVICES: ServiceCoverage = {
  power: [],
  water: [],
  fire: [],
  police: [],
  health: [],
  education: [],
};

export function GridProvider({ 
  children,
  initialGrid = [],
  initialGridSize = 50,
  initialServices = DEFAULT_SERVICES,
}: { 
  children: React.ReactNode;
  initialGrid?: Tile[][];
  initialGridSize?: number;
  initialServices?: ServiceCoverage;
}) {
  const [grid, setGrid] = useState<Tile[][]>(initialGrid);
  const [gridSize, setGridSize] = useState<number>(initialGridSize);
  const [services, setServices] = useState<ServiceCoverage>(initialServices);
  
  const latestGridRef = useRef<Tile[][]>(grid);
  
  // Keep ref in sync with state
  React.useEffect(() => {
    latestGridRef.current = grid;
  }, [grid]);

  const placeAtTile = useCallback((
    x: number,
    y: number,
    tool: Tool,
    money: number,
  ): { newState: GameState | null; cost: number } => {
    // This is a pure function that operates on state passed in
    // Returns the result without modifying internal state
    // The GameContext orchestrator will handle state updates
    return { newState: null, cost: 0 };
  }, []);

  const finishTrackDrag = useCallback((
    pathTiles: { x: number; y: number }[],
    trackType: "road" | "rail",
    state: GameState,
  ): GameState => {
    return createBridgesOnPath(state, pathTiles, trackType);
  }, []);

  const placeCryptoBuilding = useCallback((
    x: number,
    y: number,
    buildingId: string,
    currentGrid: Tile[][],
  ): Tile[][] => {
    const tile = currentGrid[y]?.[x];
    if (!tile) return currentGrid;
    if (tile.building.type !== "grass" && tile.building.type !== "tree") {
      return currentGrid;
    }

    const newGrid = currentGrid.map((row) =>
      row.map((t) => ({ ...t, building: { ...t.building } })),
    );
    newGrid[y][x].building = {
      type: "crypto_building",
      level: 1,
      population: 0,
      jobs: 25,
      powered: false,
      watered: false,
      onFire: false,
      fireProgress: 0,
      age: 0,
      constructionProgress: 100,
      abandoned: false,
      cryptoBuildingId: buildingId,
    };

    return newGrid;
  }, []);

  const expandCity = useCallback((state: GameState): GameState => {
    const { grid: newGrid, newSize } = expandGrid(
      state.grid,
      state.gridSize,
      15,
    );

    const createServiceGrid = (): number[][] => {
      const grid: number[][] = [];
      for (let y = 0; y < newSize; y++) {
        grid.push(new Array(newSize).fill(0));
      }
      return grid;
    };

    const createBoolGrid = (): boolean[][] => {
      const grid: boolean[][] = [];
      for (let y = 0; y < newSize; y++) {
        grid.push(new Array(newSize).fill(false));
      }
      return grid;
    };

    const expandServiceGrid = (oldGrid: number[][]): number[][] => {
      const newServiceGrid = createServiceGrid();
      const offset = 15;
      if (oldGrid && Array.isArray(oldGrid)) {
        for (let y = 0; y < state.gridSize; y++) {
          const row = oldGrid[y];
          if (row && Array.isArray(row)) {
            for (let x = 0; x < state.gridSize; x++) {
              const value = row[x];
              if (typeof value === "number") {
                newServiceGrid[y + offset][x + offset] = value;
              }
            }
          }
        }
      }
      return newServiceGrid;
    };

    const expandBoolGrid = (oldGrid: boolean[][]): boolean[][] => {
      const newBoolGrid = createBoolGrid();
      const offset = 15;
      if (oldGrid && Array.isArray(oldGrid)) {
        for (let y = 0; y < state.gridSize; y++) {
          const row = oldGrid[y];
          if (row && Array.isArray(row)) {
            for (let x = 0; x < state.gridSize; x++) {
              const value = row[x];
              if (typeof value === "boolean") {
                newBoolGrid[y + offset][x + offset] = value;
              }
            }
          }
        }
      }
      return newBoolGrid;
    };

    return {
      ...state,
      grid: newGrid,
      gridSize: newSize,
      services: {
        power: expandBoolGrid(state.services.power),
        water: expandBoolGrid(state.services.water),
        fire: expandServiceGrid(state.services.fire),
        police: expandServiceGrid(state.services.police),
        health: expandServiceGrid(state.services.health),
        education: expandServiceGrid(state.services.education),
      },
      gameVersion: (state.gameVersion ?? 0) + 1,
    };
  }, []);

  const shrinkCity = useCallback((state: GameState): GameState | null => {
    const result = shrinkGrid(state.grid, state.gridSize, 15);
    if (!result) return null;

    const { grid: newGrid, newSize } = result;

    const createServiceGrid = (): number[][] => {
      const grid: number[][] = [];
      for (let y = 0; y < newSize; y++) {
        grid.push(new Array(newSize).fill(0));
      }
      return grid;
    };

    const createBoolGrid = (): boolean[][] => {
      const grid: boolean[][] = [];
      for (let y = 0; y < newSize; y++) {
        grid.push(new Array(newSize).fill(false));
      }
      return grid;
    };

    const shrinkServiceGrid = (oldGrid: number[][]): number[][] => {
      const newServiceGrid = createServiceGrid();
      const offset = 15;
      if (oldGrid && Array.isArray(oldGrid)) {
        for (let y = 0; y < newSize; y++) {
          const oldRow = oldGrid[y + offset];
          if (oldRow && Array.isArray(oldRow)) {
            for (let x = 0; x < newSize; x++) {
              const value = oldRow[x + offset];
              if (typeof value === "number") {
                newServiceGrid[y][x] = value;
              }
            }
          }
        }
      }
      return newServiceGrid;
    };

    const shrinkBoolGrid = (oldGrid: boolean[][]): boolean[][] => {
      const newBoolGrid = createBoolGrid();
      const offset = 15;
      if (oldGrid && Array.isArray(oldGrid)) {
        for (let y = 0; y < newSize; y++) {
          const oldRow = oldGrid[y + offset];
          if (oldRow && Array.isArray(oldRow)) {
            for (let x = 0; x < newSize; x++) {
              const value = oldRow[x + offset];
              if (typeof value === "boolean") {
                newBoolGrid[y][x] = value;
              }
            }
          }
        }
      }
      return newBoolGrid;
    };

    return {
      ...state,
      grid: newGrid,
      gridSize: newSize,
      services: {
        power: shrinkBoolGrid(state.services.power),
        water: shrinkBoolGrid(state.services.water),
        fire: shrinkServiceGrid(state.services.fire),
        police: shrinkServiceGrid(state.services.police),
        health: shrinkServiceGrid(state.services.health),
        education: shrinkServiceGrid(state.services.education),
      },
      gameVersion: (state.gameVersion ?? 0) + 1,
    };
  }, []);

  const updateGridState = useCallback((updates: Partial<GridState>) => {
    if (updates.grid !== undefined) {
      setGrid(updates.grid);
      latestGridRef.current = updates.grid;
    }
    if (updates.gridSize !== undefined) {
      setGridSize(updates.gridSize);
    }
    if (updates.services !== undefined) {
      setServices(updates.services);
    }
  }, []);

  const setFullGridState = useCallback((
    newGrid: Tile[][],
    newGridSize: number,
    newServices: ServiceCoverage,
  ) => {
    setGrid(newGrid);
    setGridSize(newGridSize);
    setServices(newServices);
    latestGridRef.current = newGrid;
  }, []);

  const value: GridContextValue = {
    grid,
    gridSize,
    services,
    latestGridRef,
    placeAtTile,
    finishTrackDrag,
    placeCryptoBuilding,
    expandCity,
    shrinkCity,
    updateGridState,
    setFullGridState,
  };

  return (
    <GridContext.Provider value={value}>
      {children}
    </GridContext.Provider>
  );
}

export function useGrid() {
  const ctx = useContext(GridContext);
  if (!ctx) {
    throw new Error("useGrid must be used within a GridProvider");
  }
  return ctx;
}

export { GridContext };
