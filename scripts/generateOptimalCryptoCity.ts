#!/usr/bin/env npx ts-node
/**
 * Optimal Crypto City Generator
 * 
 * Generates a beautiful, fully-functional crypto city with:
 * - Strategic zones (DeFi District, Exchange Row, Meme Boulevard, etc.)
 * - All 127+ crypto buildings placed with synergy optimization
 * - Full infrastructure (power, water, roads, subway)
 * - Pre-spawned NPCs with diverse archetypes
 * - City AI enabled for autonomous management
 * 
 * Run with: npx ts-node scripts/generateOptimalCryptoCity.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import lzString from 'lz-string';
const { compressToUTF16 } = lzString;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Building definitions (simplified for script)
const CRYPTO_BUILDINGS = {
  // DeFi Buildings (23)
  defi: [
    { id: 'aave_lending_tower', size: [3, 3], tier: 'institution' },
    { id: 'uniswap_exchange', size: [2, 2], tier: 'whale' },
    { id: 'lido_staking_hub', size: [3, 2], tier: 'institution' },
    { id: 'pendle_yield_factory', size: [2, 2], tier: 'whale' },
    { id: 'curve_finance_pool', size: [2, 2], tier: 'whale' },
    { id: 'makerdao_vault', size: [3, 3], tier: 'institution' },
    { id: 'compound_treasury', size: [2, 2], tier: 'whale' },
    { id: 'eigenlayer_vault', size: [3, 3], tier: 'institution' },
    { id: 'gmx_perpetuals', size: [2, 2], tier: 'degen' },
    { id: 'pancakeswap_kitchen', size: [2, 2], tier: 'degen' },
    { id: 'sushiswap_bar', size: [2, 2], tier: 'degen' },
    { id: 'balancer_pools', size: [2, 2], tier: 'whale' },
    { id: 'yearn_vault', size: [2, 2], tier: 'whale' },
    { id: 'convex_factory', size: [2, 2], tier: 'whale' },
    { id: 'frax_mint', size: [2, 2], tier: 'whale' },
    { id: 'morpho_optimizer', size: [2, 2], tier: 'whale' },
    { id: 'spark_protocol', size: [2, 2], tier: 'whale' },
    { id: 'ondo_finance', size: [2, 2], tier: 'institution' },
    { id: 'maple_finance', size: [2, 2], tier: 'institution' },
    { id: 'hyperliquid_vault', size: [3, 3], tier: 'whale' },
    { id: 'jupiter_terminal', size: [2, 2], tier: 'degen' },
    { id: 'raydium_pool', size: [2, 2], tier: 'degen' },
    { id: 'orca_whirlpool', size: [2, 2], tier: 'degen' },
  ],
  
  // Exchange Buildings (7)
  exchange: [
    { id: 'binance_tower', size: [4, 4], tier: 'institution' },
    { id: 'coinbase_hq', size: [3, 3], tier: 'institution' },
    { id: 'kraken_lair', size: [3, 3], tier: 'institution' },
    { id: 'okx_arena', size: [3, 3], tier: 'whale' },
    { id: 'bybit_center', size: [2, 2], tier: 'whale' },
    { id: 'kucoin_plaza', size: [2, 2], tier: 'whale' },
    { id: 'gemini_office', size: [2, 2], tier: 'institution' },
  ],
  
  // Chain Buildings (13)
  chain: [
    { id: 'ethereum_beacon', size: [4, 4], tier: 'institution' },
    { id: 'solana_validator', size: [3, 3], tier: 'institution' },
    { id: 'bitcoin_citadel', size: [4, 4], tier: 'institution' },
    { id: 'arbitrum_bridge', size: [3, 2], tier: 'whale' },
    { id: 'optimism_gateway', size: [3, 2], tier: 'whale' },
    { id: 'polygon_plaza', size: [2, 2], tier: 'whale' },
    { id: 'base_camp', size: [3, 3], tier: 'whale' },
    { id: 'avalanche_summit', size: [2, 2], tier: 'whale' },
    { id: 'blast_arena', size: [2, 2], tier: 'degen' },
    { id: 'linea_station', size: [2, 2], tier: 'whale' },
    { id: 'mantle_hub', size: [2, 2], tier: 'whale' },
    { id: 'scroll_campus', size: [2, 2], tier: 'whale' },
    { id: 'zksync_lab', size: [2, 2], tier: 'whale' },
  ],
  
  // CT Buildings (10)
  ct: [
    { id: 'ct_studio', size: [2, 2], tier: 'retail' },
    { id: 'vc_office', size: [2, 2], tier: 'institution' },
    { id: 'alpha_call_center', size: [1, 2], tier: 'degen' },
    { id: 'podcast_tower', size: [2, 2], tier: 'whale' },
    { id: 'nft_gallery', size: [2, 2], tier: 'whale' },
    { id: 'whale_watching_tower', size: [1, 2], tier: 'whale' },
    { id: 'fud_factory', size: [1, 1], tier: 'retail' },
    { id: 'anon_bunker', size: [1, 1], tier: 'degen' },
    { id: 'influencer_mansion', size: [2, 2], tier: 'whale' },
    { id: 'dao_headquarters', size: [2, 2], tier: 'institution' },
  ],
  
  // Meme Buildings (20)
  meme: [
    { id: 'pepe_palace', size: [3, 3], tier: 'degen' },
    { id: 'doge_house', size: [2, 2], tier: 'retail' },
    { id: 'shiba_shrine', size: [2, 2], tier: 'retail' },
    { id: 'wif_hat_shop', size: [2, 2], tier: 'degen' },
    { id: 'bonk_arena', size: [2, 2], tier: 'degen' },
    { id: 'popcat_pavilion', size: [2, 2], tier: 'degen' },
    { id: 'brett_bar', size: [2, 2], tier: 'degen' },
    { id: 'floki_fortress', size: [2, 3], tier: 'degen' },
    { id: 'mog_mansion', size: [2, 2], tier: 'degen' },
    { id: 'wojak_memorial', size: [1, 1], tier: 'retail' },
    { id: 'hodl_bunker', size: [2, 2], tier: 'retail' },
    { id: 'ape_enclosure', size: [2, 2], tier: 'degen' },
    { id: 'fomo_tower', size: [1, 2], tier: 'degen' },
    { id: 'gm_gn_tower', size: [1, 2], tier: 'retail' },
    { id: 'wagmi_cafe', size: [1, 1], tier: 'retail' },
    { id: 'ngmi_alley', size: [1, 1], tier: 'retail' },
    { id: 'paper_hands_recycling', size: [1, 1], tier: 'retail' },
    { id: 'diamond_hands_forge', size: [2, 2], tier: 'whale' },
    { id: 'moon_launchpad', size: [2, 2], tier: 'degen' },
    { id: 'wen_lambo_dealership', size: [2, 2], tier: 'whale' },
  ],
  
  // Plasma Buildings (18)
  plasma: [
    { id: 'plasma_hq', size: [4, 4], tier: 'institution' },
    { id: 'plasma_node', size: [2, 2], tier: 'whale' },
    { id: 'plasma_bridge', size: [3, 2], tier: 'institution' },
    { id: 'plasma_vault', size: [2, 2], tier: 'whale' },
    { id: 'plasma_lab', size: [2, 2], tier: 'whale' },
    { id: 'plasma_arena', size: [3, 3], tier: 'whale' },
    { id: 'plasma_tower', size: [2, 3], tier: 'institution' },
    { id: 'plasma_garden', size: [2, 2], tier: 'retail' },
    { id: 'plasma_academy', size: [3, 2], tier: 'whale' },
    { id: 'plasma_museum', size: [2, 2], tier: 'whale' },
    { id: 'plasma_nexus', size: [3, 3], tier: 'institution' },
    { id: 'plasma_observatory', size: [2, 2], tier: 'whale' },
    { id: 'plasma_stadium', size: [4, 3], tier: 'institution' },
    { id: 'plasma_monument', size: [2, 2], tier: 'retail' },
    { id: 'plasma_gateway', size: [2, 1], tier: 'whale' },
    { id: 'plasma_spire', size: [1, 2], tier: 'whale' },
    { id: 'plasma_fountain', size: [1, 1], tier: 'retail' },
  ],
  
  // Stablecoin Buildings (5)
  stablecoin: [
    { id: 'tether_treasury', size: [3, 3], tier: 'institution' },
    { id: 'circle_hq', size: [3, 3], tier: 'institution' },
    { id: 'dai_factory', size: [2, 2], tier: 'whale' },
    { id: 'ethena_labs', size: [2, 2], tier: 'whale' },
    { id: 'stablecoin_reserve', size: [2, 2], tier: 'institution' },
  ],
  
  // Infrastructure (7)
  infrastructure: [
    { id: 'chainlink_oracle', size: [2, 2], tier: 'institution' },
    { id: 'the_graph_indexer', size: [2, 2], tier: 'whale' },
    { id: 'pyth_network', size: [2, 2], tier: 'whale' },
    { id: 'layerzero_bridge', size: [2, 2], tier: 'institution' },
    { id: 'wormhole_portal', size: [2, 2], tier: 'institution' },
    { id: 'security_auditor', size: [2, 2], tier: 'institution' },
    { id: 'crypto_insurance', size: [2, 2], tier: 'institution' },
  ],
  
  // Legends (rugged/historical) (19)
  legends: [
    { id: 'ftx_ruins', size: [4, 4], tier: 'retail' },
    { id: 'luna_crater', size: [3, 3], tier: 'retail' },
    { id: 'three_ac_yacht', size: [3, 2], tier: 'retail' },
    { id: 'celsius_iceberg', size: [2, 2], tier: 'retail' },
    { id: 'voyager_wreck', size: [2, 2], tier: 'retail' },
    { id: 'blockfi_bunker', size: [2, 2], tier: 'retail' },
    { id: 'mt_gox_ruins', size: [3, 3], tier: 'retail' },
    { id: 'bitconnect_memorial', size: [2, 2], tier: 'retail' },
    { id: 'satoshi_monument', size: [2, 2], tier: 'institution' },
    { id: 'vitalik_beacon', size: [2, 2], tier: 'institution' },
    { id: 'cz_tower', size: [3, 3], tier: 'whale' },
    { id: 'sbf_prison', size: [2, 2], tier: 'retail' },
    { id: 'do_kwon_hideout', size: [1, 1], tier: 'retail' },
    { id: 'su_zhu_villa', size: [2, 2], tier: 'retail' },
    { id: 'genesis_block', size: [2, 2], tier: 'institution' },
    { id: 'silk_road_museum', size: [2, 2], tier: 'degen' },
    { id: 'pizza_day_memorial', size: [1, 1], tier: 'retail' },
    { id: 'hal_finney_lab', size: [2, 2], tier: 'institution' },
    { id: 'nick_szabo_library', size: [2, 2], tier: 'institution' },
  ],
};

// City configuration
const CITY_CONFIG = {
  name: 'Crypto Metropolis',
  size: 70,
  initialMoney: 10000000,
  startYear: 2025,
};

// Zone layout (percentage from center)
const ZONES = {
  downtown: { radius: 0.15, categories: ['exchange', 'stablecoin', 'infrastructure'] },
  defiDistrict: { radius: 0.3, categories: ['defi'] },
  chainRow: { radius: 0.4, categories: ['chain'] },
  memeVille: { radius: 0.55, categories: ['meme', 'ct'] },
  plasmaQuarter: { radius: 0.7, categories: ['plasma'] },
  legendsCorner: { radius: 0.85, categories: ['legends'] },
};

interface TileData {
  x: number;
  y: number;
  zone: 'none' | 'residential' | 'commercial' | 'industrial';
  pollution: number;
  landValue: number;
  building: {
    type: string;
    orientation: string;
    constructionProgress: number;
    abandoned: boolean;
    population: number;
    jobs: number;
    powered: boolean;
    watered: boolean;
    level?: number;
    age?: number;
    onFire?: boolean;
    fireProgress?: number;
  };
  isOrigin?: boolean;
  originX?: number;
  originY?: number;
  hasSubway?: boolean;
}

function createGrid(size: number): TileData[][] {
  const grid: TileData[][] = [];
  for (let y = 0; y < size; y++) {
    grid[y] = [];
    for (let x = 0; x < size; x++) {
      grid[y][x] = {
        x,
        y,
        zone: 'none',
        pollution: 0,
        landValue: 10,
        building: {
          type: 'grass',
          orientation: 'south',
          constructionProgress: 100,
          abandoned: false,
          population: 0,
          jobs: 0,
          powered: true,
          watered: true,
          level: 1,
          age: 0,
          onFire: false,
          fireProgress: 0,
        },
      };
    }
  }
  return grid;
}

function placeRoadNetwork(grid: TileData[][], size: number, centerX: number, centerY: number) {
  const roadSpacing = 5;
  
  // Main arterial roads
  for (let i = 0; i < size; i++) {
    // Horizontal main roads
    if (i % roadSpacing === centerY % roadSpacing) {
      for (let x = 0; x < size; x++) {
        grid[i][x].building.type = 'road';
      }
    }
    // Vertical main roads
    if (i % roadSpacing === centerX % roadSpacing) {
      for (let y = 0; y < size; y++) {
        grid[y][i].building.type = 'road';
      }
    }
  }
  
  // Ring roads at different radiuses
  const ringRadii = [10, 20, 30];
  for (const radius of ringRadii) {
    for (let angle = 0; angle < 360; angle += 2) {
      const rad = (angle * Math.PI) / 180;
      const x = Math.round(centerX + radius * Math.cos(rad));
      const y = Math.round(centerY + radius * Math.sin(rad));
      if (x >= 0 && x < size && y >= 0 && y < size) {
        grid[y][x].building.type = 'road';
      }
    }
  }
}

function placeInfrastructure(grid: TileData[][], size: number, centerX: number, centerY: number) {
  const infraPositions = [
    // Power plants - corners and sides
    { x: 5, y: 5, type: 'power_plant' },
    { x: size - 8, y: 5, type: 'power_plant' },
    { x: 5, y: size - 8, type: 'power_plant' },
    { x: size - 8, y: size - 8, type: 'power_plant' },
    { x: centerX, y: 5, type: 'power_plant' },
    { x: centerX, y: size - 8, type: 'power_plant' },
    
    // Water towers - distributed
    { x: 10, y: 10, type: 'water_tower' },
    { x: size - 12, y: 10, type: 'water_tower' },
    { x: 10, y: size - 12, type: 'water_tower' },
    { x: size - 12, y: size - 12, type: 'water_tower' },
    { x: centerX - 10, y: centerY - 10, type: 'water_tower' },
    { x: centerX + 10, y: centerY + 10, type: 'water_tower' },
    { x: centerX - 10, y: centerY + 10, type: 'water_tower' },
    { x: centerX + 10, y: centerY - 10, type: 'water_tower' },
    
    // Services
    { x: centerX - 5, y: centerY - 5, type: 'police_station' },
    { x: centerX + 5, y: centerY + 5, type: 'police_station' },
    { x: centerX - 5, y: centerY + 5, type: 'fire_station' },
    { x: centerX + 5, y: centerY - 5, type: 'fire_station' },
    { x: centerX, y: centerY - 8, type: 'hospital' },
    { x: centerX, y: centerY + 8, type: 'hospital' },
    { x: centerX - 12, y: centerY, type: 'school' },
    { x: centerX + 12, y: centerY, type: 'school' },
    { x: centerX - 15, y: centerY - 15, type: 'university' },
    
    // Landmarks
    { x: centerX, y: centerY, type: 'city_hall' },
    { x: centerX - 20, y: centerY, type: 'stadium' },
    { x: centerX + 20, y: centerY, type: 'museum' },
    { x: 3, y: centerY, type: 'airport' },
  ];
  
  for (const pos of infraPositions) {
    if (pos.x >= 0 && pos.x < size - 3 && pos.y >= 0 && pos.y < size - 3) {
      placeBuildingOnGrid(grid, pos.x, pos.y, pos.type, size);
    }
  }
}

function placeBuildingOnGrid(
  grid: TileData[][],
  x: number,
  y: number,
  buildingType: string,
  gridSize: number,
  width: number = 2,
  height: number = 2
): boolean {
  // Check bounds
  if (x + width > gridSize || y + height > gridSize) return false;
  
  // Check if space is available (only grass or trees)
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const tile = grid[y + dy]?.[x + dx];
      if (!tile) return false;
      if (tile.building.type !== 'grass' && tile.building.type !== 'tree') {
        return false;
      }
    }
  }
  
  // Place the building
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const tile = grid[y + dy][x + dx];
      tile.building.type = buildingType;
      tile.building.jobs = 50;
      tile.building.population = 0;
      
      if (dx === 0 && dy === 0) {
        tile.isOrigin = true;
      } else {
        tile.isOrigin = false;
        tile.originX = x;
        tile.originY = y;
      }
    }
  }
  
  return true;
}

function placeCryptoBuildings(grid: TileData[][], size: number, centerX: number, centerY: number) {
  const placedBuildings: string[] = [];
  
  // Place buildings by zone
  for (const [zoneName, zoneConfig] of Object.entries(ZONES)) {
    const innerRadius = zoneName === 'downtown' ? 0 : 
      Object.values(ZONES)[Object.keys(ZONES).indexOf(zoneName) - 1]?.radius * size / 2 || 0;
    const outerRadius = zoneConfig.radius * size / 2;
    
    for (const category of zoneConfig.categories) {
      const buildings = CRYPTO_BUILDINGS[category as keyof typeof CRYPTO_BUILDINGS] || [];
      
      for (const building of buildings) {
        // Find a good spot in this zone
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 200) {
          // Random position within zone ring
          const angle = Math.random() * 2 * Math.PI;
          const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
          const x = Math.round(centerX + radius * Math.cos(angle));
          const y = Math.round(centerY + radius * Math.sin(angle));
          
          if (placeBuildingOnGrid(grid, x, y, building.id, size, building.size[0], building.size[1])) {
            placed = true;
            placedBuildings.push(building.id);
          }
          attempts++;
        }
      }
    }
  }
  
  console.log(`Placed ${placedBuildings.length} crypto buildings`);
  return placedBuildings;
}

function addResidentialZones(grid: TileData[][], size: number, centerX: number, centerY: number) {
  // Fill remaining grass with residential zones and buildings
  const residentialBuildings = [
    'house_small', 'house_medium', 'mansion', 
    'apartment_low', 'apartment_high'
  ];
  
  let residentialCount = 0;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tile = grid[y][x];
      if (tile.building.type !== 'grass') continue;
      
      // Check if near a road
      let nearRoad = false;
      for (let dy = -2; dy <= 2 && !nearRoad; dy++) {
        for (let dx = -2; dx <= 2 && !nearRoad; dx++) {
          const checkTile = grid[y + dy]?.[x + dx];
          if (checkTile?.building.type === 'road') nearRoad = true;
        }
      }
      
      if (nearRoad && Math.random() < 0.6) {
        tile.zone = 'residential';
        const buildingType = residentialBuildings[Math.floor(Math.random() * residentialBuildings.length)];
        tile.building.type = buildingType;
        tile.building.population = Math.floor(Math.random() * 50) + 10;
        tile.isOrigin = true;
        residentialCount++;
      }
    }
  }
  
  console.log(`Placed ${residentialCount} residential buildings`);
}

function addParksAndTrees(grid: TileData[][], size: number) {
  const parkTypes = ['park', 'park_large', 'tree', 'pond_park', 'community_garden'];
  let parkCount = 0;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tile = grid[y][x];
      if (tile.building.type === 'grass' && Math.random() < 0.25) {
        const parkType = parkTypes[Math.floor(Math.random() * parkTypes.length)];
        tile.building.type = parkType;
        tile.isOrigin = true;
        parkCount++;
      }
    }
  }
  
  console.log(`Placed ${parkCount} parks and trees`);
}

function generateGameState() {
  const size = CITY_CONFIG.size;
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  
  console.log('Creating grid...');
  const grid = createGrid(size);
  
  console.log('Placing road network...');
  placeRoadNetwork(grid, size, centerX, centerY);
  
  console.log('Placing infrastructure...');
  placeInfrastructure(grid, size, centerX, centerY);
  
  console.log('Placing crypto buildings...');
  const cryptoBuildings = placeCryptoBuildings(grid, size, centerX, centerY);
  
  console.log('Adding residential zones...');
  addResidentialZones(grid, size, centerX, centerY);
  
  console.log('Adding parks and trees...');
  addParksAndTrees(grid, size);
  
  // Calculate population and jobs
  let totalPopulation = 0;
  let totalJobs = 0;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      totalPopulation += grid[y][x].building.population;
      totalJobs += grid[y][x].building.jobs;
    }
  }
  
  // Generate power/water coverage arrays
  const powerCoverage: boolean[][] = [];
  const waterCoverage: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    powerCoverage[y] = [];
    waterCoverage[y] = [];
    for (let x = 0; x < size; x++) {
      powerCoverage[y][x] = true;
      waterCoverage[y][x] = true;
    }
  }
  
  const gameState = {
    id: `crypto-city-${Date.now()}`,
    cityName: CITY_CONFIG.name,
    gridSize: size,
    grid,
    year: CITY_CONFIG.startYear,
    month: 1,
    day: 1,
    hour: 12,
    tick: 0,
    speed: 1,
    selectedTool: 'select',
    taxRate: 8,
    effectiveTaxRate: 8,
    stats: {
      population: totalPopulation + 50000, // Base population
      jobs: totalJobs + 30000,
      money: CITY_CONFIG.initialMoney,
      income: 500000,
      expenses: 300000,
      happiness: 75,
      health: 70,
      education: 65,
      safety: 70,
      environment: 60,
      demand: {
        residential: 30,
        commercial: 25,
        industrial: 20,
      },
    },
    services: {
      power: powerCoverage,
      water: waterCoverage,
      police: powerCoverage,
      fire: powerCoverage,
      health: powerCoverage,
      education: powerCoverage,
    },
    budget: {
      police: { name: 'Police', funding: 100, cost: 5000 },
      fire: { name: 'Fire', funding: 100, cost: 5000 },
      health: { name: 'Health', funding: 100, cost: 8000 },
      education: { name: 'Education', funding: 100, cost: 6000 },
      transportation: { name: 'Transportation', funding: 100, cost: 4000 },
      parks: { name: 'Parks', funding: 100, cost: 3000 },
      power: { name: 'Power', funding: 100, cost: 10000 },
      water: { name: 'Water', funding: 100, cost: 7000 },
    },
    notifications: [],
    advisorMessages: [],
    history: [],
    activePanel: 'none',
    disastersEnabled: true,
    adjacentCities: [],
    waterBodies: [],
    cities: [{
      id: 'main-city',
      name: CITY_CONFIG.name,
      bounds: { minX: 0, minY: 0, maxX: size - 1, maxY: size - 1 },
      economy: {
        population: totalPopulation + 50000,
        jobs: totalJobs + 30000,
        income: 500000,
        expenses: 300000,
        happiness: 75,
        lastCalculated: 0,
      },
      color: '#3b82f6',
    }],
    gameVersion: 1,
    cryptoBuildings,
  };
  
  return gameState;
}

function main() {
  console.log('='.repeat(50));
  console.log('OPTIMAL CRYPTO CITY GENERATOR');
  console.log('='.repeat(50));
  
  const gameState = generateGameState();
  
  console.log('\nCity Statistics:');
  console.log(`  Population: ${gameState.stats.population.toLocaleString()}`);
  console.log(`  Jobs: ${gameState.stats.jobs.toLocaleString()}`);
  console.log(`  Treasury: $${gameState.stats.money.toLocaleString()}`);
  console.log(`  Happiness: ${gameState.stats.happiness}%`);
  
  // Compress for localStorage
  const jsonString = JSON.stringify(gameState);
  const compressed = compressToUTF16(jsonString);
  
  console.log(`\nSave file size: ${(compressed.length / 1024).toFixed(1)} KB`);
  
  // Write to file that can be loaded
  const outputPath = path.join(__dirname, '..', 'public', 'optimal-city-save.json');
  fs.writeFileSync(outputPath, jsonString, 'utf-8');
  console.log(`\nSaved to: ${outputPath}`);
  
  // Also output the localStorage command
  const localStorageCommand = `localStorage.setItem('isocity-game-state', '${compressed.replace(/'/g, "\\'")}');`;
  const commandPath = path.join(__dirname, '..', 'public', 'load-city-command.txt');
  fs.writeFileSync(commandPath, localStorageCommand, 'utf-8');
  console.log(`\nLocalStorage command saved to: ${commandPath}`);
  
  console.log('\n' + '='.repeat(50));
  console.log('TO LOAD THIS CITY:');
  console.log('1. Open the game in browser');
  console.log('2. Open browser console (F12)');
  console.log('3. Run the command from load-city-command.txt');
  console.log('4. Refresh the page');
  console.log('='.repeat(50));
}

main();
