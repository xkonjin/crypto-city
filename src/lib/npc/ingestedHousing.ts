import type { Tile } from '@/types/game';
import type { IngestedProfile } from '@/lib/ingestion/spawnIngestedNPC';
import { RESIDENTIAL_BUILDINGS } from '@/games/isocity/types/buildings';

type ResidentialSpot = {
  x: number;
  y: number;
  buildingId: string;
};

function findResidentialBuildings(grid: Tile[][] | null, gridSize: number): ResidentialSpot[] {
  const residentials: ResidentialSpot[] = [];
  if (!grid) return residentials;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const tile = grid[y]?.[x];
      if (!tile) continue;
      if (tile.building && RESIDENTIAL_BUILDINGS.includes(tile.building.type)) {
        residentials.push({
          x,
          y,
          buildingId: `building-${x}-${y}`,
        });
      }
    }
  }

  return residentials;
}

function chooseByVibe(profile: IngestedProfile, spots: ResidentialSpot[]): ResidentialSpot | null {
  if (spots.length === 0) return null;

  const vibeScore = profile.traits.crypto.degenLevel;
  const index = Math.floor(vibeScore * (spots.length - 1));
  return spots[index] || spots[0];
}

export function selectHousingForIngestedNPC(
  profile: IngestedProfile,
  grid: Tile[][] | null,
  gridSize: number
): string | null {
  const residentials = findResidentialBuildings(grid, gridSize);
  const selected = chooseByVibe(profile, residentials);
  return selected ? selected.buildingId : null;
}
