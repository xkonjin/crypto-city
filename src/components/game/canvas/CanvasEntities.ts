/**
 * Canvas entity management utilities
 * Issue #66 - Module extraction from CanvasIsometricGrid.tsx
 * 
 * Note: Most entity logic is already extracted to hooks in the game directory:
 * - vehicleSystems.ts (cars, emergency vehicles, pedestrians)
 * - aircraftSystems.ts (airplanes, helicopters)
 * - boatSystem.ts (boats)
 * - bargeSystem.ts (barges)
 * - seaplaneSystem.ts (seaplanes)
 * - effectsSystems.ts (fireworks, smog)
 * - trainSystem.ts (trains)
 * 
 * This module provides entity state management helpers and re-exports for convenience.
 */

import type {
  Car,
  Airplane,
  Helicopter,
  Seaplane,
  Boat,
  Barge,
  Train,
  EmergencyVehicle,
  Pedestrian,
  Firework,
  FactorySmog,
} from '@/components/game/types';

/**
 * Entity refs type for consolidating all vehicle/entity references
 */
export interface EntityRefs {
  // Ground vehicles
  carsRef: React.MutableRefObject<Car[]>;
  carIdRef: React.MutableRefObject<number>;
  carSpawnTimerRef: React.MutableRefObject<number>;
  
  // Emergency services
  emergencyVehiclesRef: React.MutableRefObject<EmergencyVehicle[]>;
  emergencyVehicleIdRef: React.MutableRefObject<number>;
  emergencyDispatchTimerRef: React.MutableRefObject<number>;
  activeFiresRef: React.MutableRefObject<Set<string>>;
  activeCrimesRef: React.MutableRefObject<Set<string>>;
  activeCrimeIncidentsRef: React.MutableRefObject<Map<string, { x: number; y: number; type: number; timeRemaining: number }>>;
  crimeSpawnTimerRef: React.MutableRefObject<number>;
  
  // Pedestrians
  pedestriansRef: React.MutableRefObject<Pedestrian[]>;
  pedestrianIdRef: React.MutableRefObject<number>;
  pedestrianSpawnTimerRef: React.MutableRefObject<number>;
  
  // Aircraft
  airplanesRef: React.MutableRefObject<Airplane[]>;
  airplaneIdRef: React.MutableRefObject<number>;
  airplaneSpawnTimerRef: React.MutableRefObject<number>;
  helicoptersRef: React.MutableRefObject<Helicopter[]>;
  helicopterIdRef: React.MutableRefObject<number>;
  helicopterSpawnTimerRef: React.MutableRefObject<number>;
  seaplanesRef: React.MutableRefObject<Seaplane[]>;
  seaplaneIdRef: React.MutableRefObject<number>;
  seaplaneSpawnTimerRef: React.MutableRefObject<number>;
  
  // Watercraft
  boatsRef: React.MutableRefObject<Boat[]>;
  boatIdRef: React.MutableRefObject<number>;
  boatSpawnTimerRef: React.MutableRefObject<number>;
  bargesRef: React.MutableRefObject<Barge[]>;
  bargeIdRef: React.MutableRefObject<number>;
  bargeSpawnTimerRef: React.MutableRefObject<number>;
  
  // Trains
  trainsRef: React.MutableRefObject<Train[]>;
  trainIdRef: React.MutableRefObject<number>;
  trainSpawnTimerRef: React.MutableRefObject<number>;
  
  // Effects
  fireworksRef: React.MutableRefObject<Firework[]>;
  fireworkIdRef: React.MutableRefObject<number>;
  fireworkSpawnTimerRef: React.MutableRefObject<number>;
  fireworkShowActiveRef: React.MutableRefObject<boolean>;
  fireworkShowStartTimeRef: React.MutableRefObject<number>;
  fireworkLastHourRef: React.MutableRefObject<number>;
  factorySmogRef: React.MutableRefObject<FactorySmog[]>;
  smogLastGridVersionRef: React.MutableRefObject<number>;
  
  // Timing
  navLightFlashTimerRef: React.MutableRefObject<number>;
  trafficLightTimerRef: React.MutableRefObject<number>;
  crossingFlashTimerRef: React.MutableRefObject<number>;
  crossingGateAnglesRef: React.MutableRefObject<Map<number, number>>;
  crossingPositionsRef: React.MutableRefObject<{x: number, y: number}[]>;
}

/**
 * Clear all entity refs - called when game version changes
 */
export function clearAllEntities(refs: EntityRefs): void {
  // Clear all vehicle refs
  refs.carsRef.current = [];
  refs.carIdRef.current = 0;
  refs.carSpawnTimerRef.current = 0;
  refs.emergencyVehiclesRef.current = [];
  refs.emergencyVehicleIdRef.current = 0;
  refs.emergencyDispatchTimerRef.current = 0;
  refs.activeFiresRef.current.clear();
  refs.activeCrimesRef.current.clear();
  refs.activeCrimeIncidentsRef.current.clear();
  refs.crimeSpawnTimerRef.current = 0;
  
  // Clear pedestrians
  refs.pedestriansRef.current = [];
  refs.pedestrianIdRef.current = 0;
  refs.pedestrianSpawnTimerRef.current = 0;
  
  // Clear aircraft
  refs.airplanesRef.current = [];
  refs.airplaneIdRef.current = 0;
  refs.airplaneSpawnTimerRef.current = 0;
  refs.helicoptersRef.current = [];
  refs.helicopterIdRef.current = 0;
  refs.helicopterSpawnTimerRef.current = 0;
  refs.seaplanesRef.current = [];
  refs.seaplaneIdRef.current = 0;
  refs.seaplaneSpawnTimerRef.current = 0;

  // Clear boats
  refs.boatsRef.current = [];
  refs.boatIdRef.current = 0;
  refs.boatSpawnTimerRef.current = 0;
  
  // Clear barges
  refs.bargesRef.current = [];
  refs.bargeIdRef.current = 0;
  refs.bargeSpawnTimerRef.current = 0;
  
  // Clear trains
  refs.trainsRef.current = [];
  refs.trainIdRef.current = 0;
  refs.trainSpawnTimerRef.current = 0;
  
  // Clear fireworks
  refs.fireworksRef.current = [];
  refs.fireworkIdRef.current = 0;
  refs.fireworkSpawnTimerRef.current = 0;
  refs.fireworkShowActiveRef.current = false;
  
  // Clear factory smog
  refs.factorySmogRef.current = [];
  refs.smogLastGridVersionRef.current = -1;
  
  // Reset traffic light timer
  refs.trafficLightTimerRef.current = 0;
}

/**
 * Update animation timers
 */
export function updateAnimationTimers(
  refs: EntityRefs,
  delta: number
): void {
  refs.navLightFlashTimerRef.current += delta * 3;
  refs.trafficLightTimerRef.current += delta;
  refs.crossingFlashTimerRef.current += delta;
}

// Re-export entity system hooks for convenience
export { useVehicleSystems } from '@/components/game/vehicleSystems';
export { useAircraftSystems } from '@/components/game/aircraftSystems';
export { useBoatSystem } from '@/components/game/boatSystem';
export { useBargeSystem } from '@/components/game/bargeSystem';
export { useSeaplaneSystem } from '@/components/game/seaplaneSystem';
export { useEffectsSystems } from '@/components/game/effectsSystems';

// Re-export drawing utilities
export { drawAirplanes, drawHelicopters, drawSeaplanes } from '@/components/game/drawAircraft';
export { drawTrains } from '@/components/game/trainSystem';
