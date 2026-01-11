/**
 * Building Display Names System
 * 
 * Maps internal building type IDs to crypto-themed display names,
 * descriptions, and lore. Uses a "Hitchhiker's Guide to the Galaxy"
 * style sardonic tone.
 * 
 * @see specs/CRYPTO_CITY_BRAND_NARRATIVE.md for full brand guide
 */

import { BuildingType } from './buildings';

/**
 * Building categories based on the Five Districts of Crypto City
 */
export type BuildingCategory = 
  | 'staking_suburbs'      // Residential - Where citizens live in financial exposure
  | 'trading_district'     // Commercial - Commerce at the speed of frontrunning
  | 'mining_flats'         // Industrial - Where value is extracted and hashed
  | 'civic_quarter'        // Services - Decentralized governance attempts decisions
  | 'infrastructure'       // Utilities & Transport - The pipes and roads
  | 'landmarks'            // Special buildings - Major attractions
  | 'degen_district'       // Parks & Entertainment - Where responsible decisions die
  | 'terrain';             // Water, grass, trees, etc.

/**
 * Category display information
 */
export interface CategoryDisplayInfo {
  displayName: string;
  icon: string;
  description: string;
}

export const CATEGORY_DISPLAY_INFO: Record<BuildingCategory, CategoryDisplayInfo> = {
  staking_suburbs: {
    displayName: 'The Staking Suburbs',
    icon: '🏠',
    description: 'Where citizens live in various states of financial exposure.',
  },
  trading_district: {
    displayName: 'The Trading District',
    icon: '📈',
    description: 'Where commerce happens at the speed of frontrunning.',
  },
  mining_flats: {
    displayName: 'The Mining Flats',
    icon: '⛏️',
    description: 'Where value is extracted and occasionally hashed.',
  },
  civic_quarter: {
    displayName: 'The Civic Quarter',
    icon: '🏛️',
    description: 'Where decentralized governance tries to make decisions.',
  },
  infrastructure: {
    displayName: 'Infrastructure Layer',
    icon: '🔌',
    description: 'The consensus mechanisms that keep the city running.',
  },
  landmarks: {
    displayName: 'Landmarks',
    icon: '⭐',
    description: 'Major attractions and notable buildings.',
  },
  degen_district: {
    displayName: 'The Degen District',
    icon: '🎰',
    description: 'Where responsible financial decisions go to die.',
  },
  terrain: {
    displayName: 'Terrain',
    icon: '🌍',
    description: 'Natural features and undeveloped land.',
  },
};

/**
 * Complete display information for a building type
 */
export interface BuildingDisplayInfo {
  displayName: string;
  category: BuildingCategory;
  description: string;
  lore: string;
  icon: string;
}

/**
 * Master mapping of building types to display information
 * 
 * Tone Guidelines:
 * - Sardonic but affectionate - laughing WITH crypto culture
 * - Specific references that reward crypto natives
 * - Accessible humor for normies
 * - Optimistic nihilism - everything might go wrong, and that's okay
 */
export const BUILDING_DISPLAY_INFO: Record<BuildingType, BuildingDisplayInfo> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // TERRAIN
  // ═══════════════════════════════════════════════════════════════════════════
  empty: {
    displayName: 'Empty Lot',
    category: 'terrain',
    description: 'Vacant land awaiting development',
    lore: 'Every great protocol started as an empty repo. Every great city starts here.',
    icon: '⬜',
  },
  grass: {
    displayName: 'Grassland',
    category: 'terrain',
    description: 'Undeveloped green space',
    lore: 'Nature reminds us that sometimes touching grass is necessary. Touch grass.',
    icon: '🌱',
  },
  water: {
    displayName: 'Liquidity Pool',
    category: 'terrain',
    description: 'Natural water feature',
    lore: 'Deep liquidity. Don\'t dive without checking the depth first.',
    icon: '💧',
  },
  tree: {
    displayName: 'Money Tree',
    category: 'terrain',
    description: 'Mature vegetation',
    lore: 'They say money doesn\'t grow on trees. They haven\'t seen DeFi yields.',
    icon: '🌳',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INFRASTRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════
  road: {
    displayName: 'Mempool Lane',
    category: 'infrastructure',
    description: 'Standard road connection',
    lore: 'Transactions wait their turn here. Priority access available for those who tip extra.',
    icon: '🛤️',
  },
  bridge: {
    displayName: 'Trust Bridge',
    category: 'infrastructure',
    description: 'Water crossing',
    lore: 'Connects different parts of the city. Varies from "mostly secure" to "we\'re working on it."',
    icon: '🌉',
  },
  rail: {
    displayName: 'L2 Express Track',
    category: 'infrastructure',
    description: 'Rail line',
    lore: 'Fast transit that settles on main street eventually. May take 7 days to exit.',
    icon: '🚃',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RESIDENTIAL - THE STAKING SUBURBS
  // ═══════════════════════════════════════════════════════════════════════════
  house_small: {
    displayName: 'Seed Phrase Shack',
    category: 'staking_suburbs',
    description: 'Starter home for new citizens',
    lore: 'Where new degens write their 24 words on a napkin and immediately lose the napkin. Named after a GameKyuubi family tradition: "I AM HODLING... my napkin somewhere."',
    icon: '🏠',
  },
  house_medium: {
    displayName: 'HODL House',
    category: 'staking_suburbs',
    description: 'Mid-range family home',
    lore: 'Built December 18, 2013 in honor of a drunk forum post that became a philosophy. Panic room includes laminated seed phrases and a copy of the original "I AM HODLING" screenshot.',
    icon: '🏡',
  },
  mansion: {
    displayName: 'Whale Estate',
    category: 'staking_suburbs',
    description: 'Luxury residence',
    lore: 'Seven bathrooms, one for each hardware wallet. Garden maze shaped like a Merkle tree. Previous owner reportedly lost the property in a "boating accident." Very sad. Very convenient.',
    icon: '🏰',
  },
  apartment_low: {
    displayName: 'Staker Flats',
    category: 'staking_suburbs',
    description: 'Low-rise apartments',
    lore: 'Affordable housing for passive income earners. Every unit has a staking dashboard view.',
    icon: '🏢',
  },
  apartment_high: {
    displayName: 'Validator Tower',
    category: 'staking_suburbs',
    description: 'High-rise apartments',
    lore: 'Must prove 32 ETH net worth to apply. Elevator requires consensus to operate.',
    icon: '🏙️',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMERCIAL - THE TRADING DISTRICT
  // ═══════════════════════════════════════════════════════════════════════════
  shop_small: {
    displayName: 'Airdrop Bodega',
    category: 'trading_district',
    description: 'Small retail shop',
    lore: 'Accepts any token. Returns may vary. Actually, returns WILL vary. This is crypto.',
    icon: '🏪',
  },
  shop_medium: {
    displayName: 'Liquidity Plaza',
    category: 'trading_district',
    description: 'Medium retail',
    lore: 'Prices update faster than staff can keep up. "What\'s the price?" "Which second?"',
    icon: '🛒',
  },
  office_low: {
    displayName: 'Protocol HQ',
    category: 'trading_district',
    description: 'Low-rise office',
    lore: 'Junior devs ship code that moves billions. Dress code: hoodie mandatory, pants optional.',
    icon: '🏬',
  },
  office_high: {
    displayName: 'DAO Spire',
    category: 'trading_district',
    description: 'High-rise office',
    lore: 'Where governance proposals debate for eternity. Meeting rooms named after famous exploits.',
    icon: '🏛️',
  },
  mall: {
    displayName: 'DEX Megaplex',
    category: 'trading_district',
    description: 'Large shopping center',
    lore: '47 shops connected by bridges of varying trustworthiness. Some shops may rug without notice.',
    icon: '🛍️',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INDUSTRIAL - THE MINING FLATS
  // ═══════════════════════════════════════════════════════════════════════════
  factory_small: {
    displayName: 'GPU Farm',
    category: 'mining_flats',
    description: 'Small production facility',
    lore: 'Either mining crypto or farming yield. Both involve staring at numbers hopefully going up.',
    icon: '🏭',
  },
  factory_medium: {
    displayName: 'ASIC Factory',
    category: 'mining_flats',
    description: 'Medium manufacturing',
    lore: 'Specialized equipment for converting electricity to money. Neighbors despise this building.',
    icon: '⚙️',
  },
  factory_large: {
    displayName: 'Mining Complex',
    category: 'mining_flats',
    description: 'Large industrial facility',
    lore: 'Serious hash power happens here. Electric bill is classified. Actually, everything is classified.',
    icon: '🔧',
  },
  warehouse: {
    displayName: 'Cold Storage Depot',
    category: 'mining_flats',
    description: 'Storage facility',
    lore: 'Where hardware wallets are written on paper, laminated, buried, and memorized anyway. Unlike QuadrigaCX, this facility has more than one keyholder. Lesson learned.',
    icon: '📦',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CIVIC - THE CIVIC QUARTER
  // ═══════════════════════════════════════════════════════════════════════════
  police_station: {
    displayName: 'Exploit Response HQ',
    category: 'civic_quarter',
    description: 'Security services',
    lore: 'First responders for smart contract emergencies. Works closely with on-chain detectives like the Masked Investigator. Motto: "We can\'t undo it, but we can follow the wallets."',
    icon: '🚔',
  },
  fire_station: {
    displayName: 'Liquidation Rescue',
    category: 'civic_quarter',
    description: 'Emergency services',
    lore: 'Responds when positions are on fire. Named after the Three Arrows Capital incident—arrived too late, found only yacht tracks leading to the marina.',
    icon: '🚒',
  },
  hospital: {
    displayName: 'Recovery Ward',
    category: 'civic_quarter',
    description: 'Healthcare facility',
    lore: 'Specializes in portfolio trauma, rug injuries, and "I should have sold" syndrome. The Celsius Wing handles "unbanking" recovery. Support groups: "Lunatics Anonymous" meets Thursdays.',
    icon: '🏥',
  },
  school: {
    displayName: 'DYOR Academy',
    category: 'civic_quarter',
    description: 'Education facility',
    lore: 'Where young degens learn to read whitepapers, interpret charts, and recognize the 47 warning signs of a rug pull. Mandatory reading: "The Bitconnect Case Study" and "Why 20% APY Is A Red Flag."',
    icon: '🏫',
  },
  university: {
    displayName: 'Tokenomics Institute',
    category: 'civic_quarter',
    description: 'Higher education',
    lore: 'Degrees in Game Theory, Applied Cope, and "Actually Understanding The Technology." Famous alumni include graduates who "independently, financially independently" failed upward. Graduation rate varies by market cycle.',
    icon: '🎓',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════
  power_plant: {
    displayName: 'Consensus Reactor',
    category: 'infrastructure',
    description: 'Power generation',
    lore: 'Provides the computational energy to validate existence. Runs on electricity and pure belief.',
    icon: '⚡',
  },
  water_tower: {
    displayName: 'Liquidity Tank',
    category: 'infrastructure',
    description: 'Water supply',
    lore: 'Ensures sufficient liquidity flows throughout the city. Dry seasons correlate with bear markets.',
    icon: '💧',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSPORTATION
  // ═══════════════════════════════════════════════════════════════════════════
  subway_station: {
    displayName: 'ZK Metro',
    category: 'infrastructure',
    description: 'Underground transit',
    lore: 'So efficient you don\'t have to prove you took the ride. Zero knowledge commuting.',
    icon: '🚇',
  },
  rail_station: {
    displayName: 'Rollup Terminal',
    category: 'infrastructure',
    description: 'Train station',
    lore: 'Batch your travels for efficiency. "The 3:15 to Optimism is now arriving."',
    icon: '🚉',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARKS - THE DEGEN DISTRICT (Basic)
  // ═══════════════════════════════════════════════════════════════════════════
  park: {
    displayName: 'HODL Garden',
    category: 'degen_district',
    description: 'Small park',
    lore: 'A peaceful place to contemplate your portfolio. Benches face away from any price displays.',
    icon: '🌳',
  },
  park_large: {
    displayName: 'Diamond Hands Reserve',
    category: 'degen_district',
    description: 'Large park',
    lore: 'For those who hold through winter. Trees are evergreen because paper hands don\'t last here.',
    icon: '🌲',
  },
  tennis: {
    displayName: 'Volatility Courts',
    category: 'degen_district',
    description: 'Tennis facility',
    lore: 'Ball goes up, ball comes down. Sometimes in the same rally.',
    icon: '🎾',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARKS - THE DEGEN DISTRICT (Extended)
  // ═══════════════════════════════════════════════════════════════════════════
  basketball_courts: {
    displayName: 'Pump Courts',
    category: 'degen_district',
    description: 'Basketball facility',
    lore: 'Slam dunks and dramatic reversals. Just like your portfolio.',
    icon: '🏀',
  },
  playground_small: {
    displayName: 'Testnet Playground',
    category: 'degen_district',
    description: 'Small playground',
    lore: 'Where little degens practice their first swaps with play money.',
    icon: '🎢',
  },
  playground_large: {
    displayName: 'Mainnet Playground',
    category: 'degen_district',
    description: 'Large playground',
    lore: 'The stakes are real now. Watch your step.',
    icon: '🎡',
  },
  baseball_field_small: {
    displayName: 'Short Squeeze Diamond',
    category: 'degen_district',
    description: 'Baseball field',
    lore: 'Three strikes and you\'re liquidated. Home runs are rare but spectacular.',
    icon: '⚾',
  },
  soccer_field_small: {
    displayName: 'Arbitrage Arena',
    category: 'degen_district',
    description: 'Soccer field',
    lore: 'Goal is to move the ball between markets faster than anyone else.',
    icon: '⚽',
  },
  football_field: {
    displayName: 'Touchdown Trading Grounds',
    category: 'degen_district',
    description: 'Football field',
    lore: 'Four quarters, four market cycles. Halftime analysis included.',
    icon: '🏈',
  },
  baseball_stadium: {
    displayName: 'Moon League Stadium',
    category: 'degen_district',
    description: 'Major sports venue',
    lore: 'Home of the Crypto City Moons. Seventh inning stretch replaced with portfolio check.',
    icon: '🏟️',
  },
  community_center: {
    displayName: 'Discord HQ',
    category: 'civic_quarter',
    description: 'Community facility',
    lore: 'Where communities gather to argue about tokenomics and post memes.',
    icon: '🏘️',
  },
  office_building_small: {
    displayName: 'Startup Garage',
    category: 'trading_district',
    description: 'Small office',
    lore: 'Every billion-dollar protocol started in a garage. Or a Discord. Same energy.',
    icon: '🏢',
  },
  swimming_pool: {
    displayName: 'Liquidity Pool (Swim)',
    category: 'degen_district',
    description: 'Swimming facility',
    lore: 'Dive in! Pool depth varies based on market conditions. Check before jumping.',
    icon: '🏊',
  },
  skate_park: {
    displayName: 'Leverage Ramps',
    category: 'degen_district',
    description: 'Skateboard park',
    lore: 'Higher ramps, bigger tricks, harder falls. 100x tricks available for the brave.',
    icon: '🛹',
  },
  mini_golf_course: {
    displayName: 'Par-T Golf',
    category: 'degen_district',
    description: 'Mini golf',
    lore: 'Eighteen holes of gradually increasing difficulty. Just like DeFi protocols.',
    icon: '⛳',
  },
  bleachers_field: {
    displayName: 'Spectator Seats',
    category: 'degen_district',
    description: 'Viewing area',
    lore: 'Sometimes the best move is to watch others play. DYOR includes watching first.',
    icon: '🎪',
  },
  go_kart_track: {
    displayName: 'Speed Run Track',
    category: 'degen_district',
    description: 'Go-kart racing',
    lore: 'Fast and chaotic. Just like market open.',
    icon: '🏎️',
  },
  amphitheater: {
    displayName: 'Town Hall Stage',
    category: 'civic_quarter',
    description: 'Performance venue',
    lore: 'Where founders give updates and occasionally, very enthusiastic investors shout about their gains. The "HEY HEY HEY" echo from 2017 still reverberates through the acoustics. Questions limited to two per person. Answers optional.',
    icon: '🎭',
  },
  greenhouse_garden: {
    displayName: 'Yield Greenhouse',
    category: 'mining_flats',
    description: 'Greenhouse',
    lore: 'Organic yield farming. Results may vary by season and market conditions.',
    icon: '🌿',
  },
  animal_pens_farm: {
    displayName: 'Bull Pen',
    category: 'mining_flats',
    description: 'Animal facility',
    lore: 'Where bulls rest between market cycles. Bears stay in the woods.',
    icon: '🐂',
  },
  cabin_house: {
    displayName: 'Cold Storage Cabin',
    category: 'staking_suburbs',
    description: 'Rural housing',
    lore: 'Off-grid living for the truly decentralized. Seed phrase buried somewhere in the yard.',
    icon: '🏚️',
  },
  campground: {
    displayName: 'Diamond Hands Camp',
    category: 'degen_district',
    description: 'Camping area',
    lore: 'For those holding through the harshest conditions. Tents rated for -80% drawdowns.',
    icon: '⛺',
  },
  marina_docks_small: {
    displayName: 'Yacht Preview Dock',
    category: 'landmarks',
    description: 'Boat dock',
    lore: 'Window shopping for the yacht you\'ll buy when your bags pump. Or, if you\'re like certain hedge fund managers, the yacht you flee to while posting apologies on Twitter.',
    icon: '⛵',
  },
  pier_large: {
    displayName: 'Boating Accident Pier',
    category: 'landmarks',
    description: 'Large pier',
    lore: 'A popular spot for unfortunate hardware wallet incidents. Very unfortunate. Very convenient. Tax authorities are "aware" of the statistical anomaly of crypto holders and maritime disasters.',
    icon: '🚢',
  },
  roller_coaster_small: {
    displayName: 'Portfolio Coaster',
    category: 'degen_district',
    description: 'Roller coaster',
    lore: 'Experience your portfolio in physical form. Loops, drops, and unexpected stops included.',
    icon: '🎢',
  },
  community_garden: {
    displayName: 'Seed Garden',
    category: 'degen_district',
    description: 'Community garden',
    lore: 'Where the community plants seeds (phrases) and watches them grow.',
    icon: '🌻',
  },
  pond_park: {
    displayName: 'Reflection Pool',
    category: 'degen_district',
    description: 'Pond',
    lore: 'A quiet place to reflect on trades past and opportunities missed.',
    icon: '🏞️',
  },
  park_gate: {
    displayName: 'Genesis Gate',
    category: 'landmarks',
    description: 'Park entrance',
    lore: 'Through this gate lies the genesis of your journey. Block 0.',
    icon: '⛩️',
  },
  mountain_lodge: {
    displayName: 'ATH Lodge',
    category: 'landmarks',
    description: 'Mountain retreat',
    lore: 'The view from All-Time High is spectacular. Getting here is the hard part.',
    icon: '🏔️',
  },
  mountain_trailhead: {
    displayName: 'The Starting Trail',
    category: 'landmarks',
    description: 'Hiking trail',
    lore: 'Every journey to the top starts with a single buy order.',
    icon: '🥾',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LANDMARKS
  // ═══════════════════════════════════════════════════════════════════════════
  stadium: {
    displayName: 'Bull Bear Arena',
    category: 'landmarks',
    description: 'Major sports venue',
    lore: 'Where Bulls and Bears compete in eternal struggle. Score changes every 4 hours.',
    icon: '🏟️',
  },
  museum: {
    displayName: 'Block Archive',
    category: 'landmarks',
    description: 'Cultural institution',
    lore: 'Home of the "Fallen Protocols" wing featuring Mt. Gox, FTX, Terra/Luna, Bitconnect, and QuadrigaCX exhibits. Gift shop sells "I survived the 2022 crash" t-shirts and replica Carlos Matos NFTs.',
    icon: '🏛️',
  },
  airport: {
    displayName: 'Crosschain Hub',
    category: 'landmarks',
    description: 'International transit',
    lore: 'Travel to other chains. Customs may take 7-30 days. Your assets may arrive looking different. Named routes include "The Montenegro Express" and "Bahamas Direct." Some destinations one-way only.',
    icon: '✈️',
  },
  space_program: {
    displayName: 'Moonshot Launchpad',
    category: 'landmarks',
    description: 'Space facility',
    lore: 'We\'re going to the moon. We\'ve always been going to the moon. The moon is the destination. NFA.',
    icon: '🚀',
  },
  city_hall: {
    displayName: 'Governance Forum',
    category: 'landmarks',
    description: 'City government',
    lore: 'Proposals proposed, debated, amended, re-debated, temperature-checked, then ignored. The "Effective Governance" department was renamed after 2022. Quorum rarely achieved; when it is, most votes are "abstain."',
    icon: '🏛️',
  },
  amusement_park: {
    displayName: 'Volatility Park',
    category: 'landmarks',
    description: 'Theme park',
    lore: 'Rides go up. Rides go down. Sometimes simultaneously. Must be this liquidated to ride.',
    icon: '🎢',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRYPTO BUILDING (Placeholder - handled by crypto system)
  // ═══════════════════════════════════════════════════════════════════════════
  crypto_building: {
    displayName: 'Crypto Building',
    category: 'landmarks',
    description: 'A building from the crypto district',
    lore: 'This building is part of the expanded crypto ecosystem.',
    icon: '🏗️',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the display name for a building type
 */
export function getBuildingDisplayName(type: BuildingType): string {
  return BUILDING_DISPLAY_INFO[type]?.displayName || type.replace(/_/g, ' ');
}

/**
 * Get the short description for a building type
 */
export function getBuildingDescription(type: BuildingType): string {
  return BUILDING_DISPLAY_INFO[type]?.description || '';
}

/**
 * Get the lore text for a building type
 */
export function getBuildingLore(type: BuildingType): string {
  return BUILDING_DISPLAY_INFO[type]?.lore || '';
}

/**
 * Get the category for a building type
 */
export function getBuildingCategory(type: BuildingType): BuildingCategory {
  return BUILDING_DISPLAY_INFO[type]?.category || 'terrain';
}

/**
 * Get the icon for a building type
 */
export function getBuildingIcon(type: BuildingType): string {
  return BUILDING_DISPLAY_INFO[type]?.icon || '🏗️';
}

/**
 * Get the full display info for a building type
 */
export function getBuildingDisplayInfo(type: BuildingType): BuildingDisplayInfo | undefined {
  return BUILDING_DISPLAY_INFO[type];
}

/**
 * Get category display info
 */
export function getCategoryDisplayInfo(category: BuildingCategory): CategoryDisplayInfo {
  return CATEGORY_DISPLAY_INFO[category];
}

/**
 * Get all buildings in a specific category
 */
export function getBuildingsByCategory(category: BuildingCategory): BuildingType[] {
  return (Object.keys(BUILDING_DISPLAY_INFO) as BuildingType[]).filter(
    type => BUILDING_DISPLAY_INFO[type].category === category
  );
}

/**
 * Get all categories
 */
export function getAllCategories(): BuildingCategory[] {
  return Object.keys(CATEGORY_DISPLAY_INFO) as BuildingCategory[];
}
