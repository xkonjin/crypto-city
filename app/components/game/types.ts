export enum TileType {
  Grass = "grass",
  Road = "road",
  Asphalt = "asphalt",
  Tile = "tile",
  Snow = "snow",
  Building = "building",
}

// Simplified tool types - Building is now generic, actual building selected separately
export enum ToolType {
  None = "none",
  RoadNetwork = "roadNetwork",
  Asphalt = "asphalt",
  Tile = "tile",
  Snow = "snow",
  Building = "building", // Generic - actual building ID stored separately
  Eraser = "eraser",
}

export interface GridCell {
  type: TileType;
  x: number;
  y: number;
  // For multi-tile objects, marks the origin (top-left in grid coords)
  isOrigin?: boolean;
  originX?: number;
  originY?: number;
  // For buildings, specify the ID (from building registry)
  buildingId?: string;
  // For rotatable buildings, specify the orientation (defaults to Down/South)
  buildingOrientation?: Direction;
  // For props, store the underlying tile type (so props don't render their own floor)
  underlyingTileType?: TileType;
}

export enum Direction {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

export enum LightingType {
  Day = "day",
  Night = "night",
  Sunset = "sunset",
}

export interface VisualSettings {
  blueness: number; // -100 to 100 (hue shift toward blue)
  contrast: number; // 0.5 to 2.0
  saturation: number; // 0.5 to 2.0
  brightness: number; // 0.5 to 2.0
}

export enum CharacterType {
  Banana = "banana",
  Apple = "apple",
}

export interface Character {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  characterType: CharacterType;
}

export enum CarType {
  Jeep = "jeep",
  Taxi = "taxi",
}

export interface Car {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  waiting: number;
  carType: CarType;
}

// =============================================================================
// CRYPTO CITY TYPES
// =============================================================================

/**
 * Tier classification for crypto buildings
 * - degen: High risk/reward, volatile, meme-tier
 * - retail: Entry level, accessible, moderate effects
 * - whale: High value, significant bonuses, established protocols
 * - institution: Blue chip, stable, maximum effects
 */
export type CryptoTier = "degen" | "retail" | "whale" | "institution" | "shark" | "fish";

/**
 * Effects that crypto buildings have on the city simulation
 * All values are optional - buildings can have any combination
 */
export interface CryptoEffects {
  // Economic effects
  yieldRate?: number;           // Daily token generation (0-100 tokens/day)
  stakingBonus?: number;        // Multiplier for nearby buildings (1.0 = no bonus, 1.5 = 50% bonus)
  tradingFees?: number;         // Passive income from trades (0-50 tokens/day)
  
  // Risk/volatility effects
  volatility?: number;          // Chance of pump/dump events (0-1, higher = more volatile)
  rugRisk?: number;             // Chance of rug pull event disabling building (0-1)
  hackRisk?: number;            // Chance of hack event causing treasury loss (0-1)
  
  // Population/happiness effects
  populationBoost?: number;     // Number of crypto degens attracted to city
  happinessEffect?: number;     // Mood impact (-50 to +50)
  prestigeBonus?: number;       // Increases land value in area (0-100)
  
  // Event triggers
  airdropChance?: number;       // Random airdrop event chance per day (0-1)
  upgradeChance?: number;       // Protocol upgrade event chance (0-1)
  dramaChance?: number;         // CT drama event chance (0-1)
  
  // Zone effects
  zoneRadius?: number;          // Area of effect for bonuses (in grid cells)
  chainSynergy?: string[];      // Chain IDs this building synergizes with (e.g., ["ethereum", "arbitrum"])
  categorySynergy?: string[];   // Building categories this synergizes with
  
  // Plasma partner effects
  landValueBonus?: number;      // Percentage increase in land value for nearby tiles (0-100)
  incomePerTick?: number;       // Direct income generated per game tick
  crimeReduction?: number;      // Percentage reduction in crime for nearby tiles (0-100)
  trafficReduction?: number;    // Percentage improvement in traffic flow (0-100)
}

/**
 * Extended building definition for crypto-themed buildings
 * Includes all standard building properties plus crypto-specific effects
 */
export interface CryptoBuildingMeta {
  tier: CryptoTier;
  effects: CryptoEffects;
  protocol?: string;            // Real-world protocol name (e.g., "Aave", "Uniswap")
  chain?: string;               // Primary blockchain (e.g., "ethereum", "solana")
  launchYear?: number;          // When the protocol launched IRL
  tvlTier?: "small" | "low" | "medium" | "large" | "high" | "massive";  // Total Value Locked tier
  description?: string;         // Flavor text about the building
}

/**
 * Crypto economy state for the city simulation
 * Tracks all crypto-related metrics and active events
 */
export interface CryptoEconomyState {
  treasury: number;             // City's total token balance
  dailyYield: number;           // Total yield from all DeFi buildings
  totalTVL: number;             // Combined "TVL" of all crypto buildings
  marketSentiment: number;      // -100 (extreme fear) to 100 (extreme greed)
  
  // Multipliers affected by market conditions
  globalYieldMultiplier: number;      // Affects all yield generation
  globalVolatilityMultiplier: number; // Affects all volatility events
  
  // Building tracking
  cryptoBuildingCount: number;
  buildingsByTier: Record<CryptoTier, number>;
  buildingsByChain: Record<string, number>;
  
  // Historical data for graphs
  treasuryHistory: number[];
  sentimentHistory: number[];
}

/**
 * Types of crypto events that can occur in the city
 */
export type CryptoEventType = 
  | "bullRun"       // All yields boosted, happiness up
  | "bearMarket"    // Yields reduced, happiness down
  | "airdrop"       // Bonus tokens to treasury
  | "rugPull"       // Building disabled, treasury loss
  | "hack"          // Exchange shutdown, recovery time
  | "protocolUpgrade"  // Yield boost after brief downtime
  | "whaleEntry"    // Population spike, land value up
  | "ctDrama"       // Random sentiment swing
  | "liquidation"   // Cascade event from leveraged buildings
  | "merge"         // Major protocol milestone
  | "halving"       // Bitcoin-specific yield change
  | "airdropSeason" // Multiple airdrops in quick succession
  | "memeRally"     // Meme buildings get boosted
  | "regulatoryFUD" // Temporary yield reduction;

/**
 * Active crypto event in the simulation
 */
export interface CryptoEvent {
  id: string;
  type: CryptoEventType;
  name: string;                 // Display name (e.g., "Ethereum Merge!")
  description: string;          // What happened
  affectedBuildings: string[];  // Building IDs affected
  affectedChains?: string[];    // Chains affected
  startTick: number;            // When event started
  duration: number;             // Ticks until event ends
  magnitude: number;            // Intensity of effect (0-1)
  isPositive: boolean;          // Good or bad for the city
  effects: Partial<CryptoEffects>;  // Temporary effect overrides
}

/**
 * Zone effect created by a building affecting nearby tiles
 */
export interface ZoneEffect {
  sourceBuilding: string;       // Building ID creating the zone
  sourceTile: { x: number; y: number };
  radius: number;               // Effect radius in grid cells
  effects: {
    yieldMultiplier?: number;   // Multiply yield of buildings in zone
    happinessModifier?: number; // Add/subtract happiness
    volatilityModifier?: number; // Increase/decrease volatility
    populationType?: CryptoTier; // Type of population attracted
    chainBonus?: string;        // Chain that gets bonuses in this zone
  };
}

export const GRID_WIDTH = 48;
export const GRID_HEIGHT = 48;

export const CAR_SPEED = 0.05;

// Isometric tile dimensions (44x22 isometric diamond)
export const TILE_WIDTH = 44;
export const TILE_HEIGHT = 22;

// Tile sizes for different types (in grid cells) - this is the FOOTPRINT
export const TILE_SIZES: Record<TileType, { w: number; h: number }> = {
  [TileType.Grass]: { w: 1, h: 1 },
  [TileType.Road]: { w: 1, h: 1 },
  [TileType.Asphalt]: { w: 1, h: 1 },
  [TileType.Tile]: { w: 1, h: 1 },
  [TileType.Snow]: { w: 1, h: 1 },
  [TileType.Building]: { w: 4, h: 4 }, // Default, actual size from building registry
};

// Character movement constants
export const CHARACTER_PIXELS_PER_FRAME_X = 13 / 58;
export const CHARACTER_PIXELS_PER_FRAME_Y = 5 / 58;
export const CHARACTER_SPEED = 0.015;

// Convert grid coordinates to isometric screen coordinates
export function gridToIso(
  gridX: number,
  gridY: number
): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2),
    y: (gridX + gridY) * (TILE_HEIGHT / 2),
  };
}

// Convert isometric screen coordinates back to grid coordinates
export function isoToGrid(
  isoX: number,
  isoY: number
): { x: number; y: number } {
  return {
    x: (isoX / (TILE_WIDTH / 2) + isoY / (TILE_HEIGHT / 2)) / 2,
    y: (isoY / (TILE_HEIGHT / 2) - isoX / (TILE_WIDTH / 2)) / 2,
  };
}
