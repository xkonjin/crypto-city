/**
 * City Builder AI Types
 * 
 * "Don't Panic!" - The AI knows what it's doing. Probably.
 * 
 * Type definitions for the autonomous city management AI that runs the
 * simulation when no human is playing. Think SimCity autopilot, but with
 * more crypto and fewer bulldozer accidents.
 */

import { BuildingType, ZoneType } from '@/games/isocity/types';
import { CryptoCategory, CryptoChain } from '@/games/isocity/crypto/types';

// =============================================================================
// AI GOALS & CONSTRAINTS
// =============================================================================

/**
 * Core goals the AI tries to maintain.
 * These are the guardrails that keep the city from becoming a dystopia.
 */
export const AI_GOALS = {
  /** Minimum average NPC mood before AI considers city "unhappy" */
  minAverageMood: 60,
  /** Minimum treasury buffer AI tries to maintain */
  treasuryBuffer: 1000,
  /** RCI demand imbalance threshold before AI intervenes */
  rciBalanceThreshold: 0.2,
  /** Max ticks before AI must respond to disasters */
  disasterResponseTime: 300, // ~5 game minutes at normal speed
  /** Minimum happiness score before AI takes corrective action */
  minHappiness: 50,
  /** Maximum unemployment rate (jobs/population) before AI zones industrial */
  maxUnemploymentRate: 0.15,
  /** Minimum power coverage percentage */
  minPowerCoverage: 0.8,
  /** Minimum water coverage percentage */
  minWaterCoverage: 0.8,
} as const;

// =============================================================================
// CITY ASSESSMENT TYPES
// =============================================================================

/**
 * Population trend direction.
 * "Growing" is good. "Declining" means someone put the power plant next to
 * the residential district again.
 */
export type PopulationTrend = 'growing' | 'stable' | 'declining';

/**
 * Treasury health status.
 * "Critical" means stop buying that 15th stadium and maybe build some housing.
 */
export type TreasuryHealth = 'surplus' | 'balanced' | 'deficit' | 'critical';

/**
 * AI aggressiveness level for autonomous actions.
 * "Conservative" builds slowly. "Aggressive" zones everything in sight.
 */
export type AIAggressiveness = 'conservative' | 'moderate' | 'aggressive';

/**
 * RCI (Residential/Commercial/Industrial) demand balance.
 * Classic SimCity mechanic - the three pillars of city building.
 */
export interface RCIDemandBalance {
  residential: number; // -100 to 100 (negative = oversupply)
  commercial: number;
  industrial: number;
}

/**
 * Gap in city services coverage.
 * When the fire station is 50 tiles away, that's a gap.
 */
export interface ServiceGap {
  /** Type of service that's missing */
  serviceType: 'police' | 'fire' | 'health' | 'education' | 'power' | 'water';
  /** Grid position where coverage is weakest */
  position: { x: number; y: number };
  /** Severity of the gap (0-1, higher = more urgent) */
  severity: number;
  /** Radius of the underserved area */
  affectedRadius: number;
}

/**
 * Housing shortage information.
 * When people are living in the streets, we have a problem.
 */
export interface HousingShortage {
  /** Number of people without housing */
  unhoused: number;
  /** Suggested zone positions for new residential */
  suggestedPositions: { x: number; y: number }[];
  /** Severity (0-1) */
  severity: number;
}

/**
 * Employment statistics.
 * Unemployed citizens are unhappy citizens.
 */
export interface EmploymentStats {
  /** Current population */
  population: number;
  /** Available jobs */
  jobs: number;
  /** Unemployment rate (0-1) */
  unemploymentRate: number;
  /** Whether we need more jobs or more workers */
  needsMoreJobs: boolean;
}

/**
 * Prioritized issue that the AI needs to address.
 * Issues are sorted by priority for the AI to tackle.
 */
export interface PrioritizedIssue {
  /** Issue type identifier */
  type: 
    | 'low_happiness'
    | 'low_treasury'
    | 'high_unemployment'
    | 'housing_shortage'
    | 'service_gap'
    | 'rci_imbalance'
    | 'power_shortage'
    | 'water_shortage'
    | 'active_disaster'
    | 'declining_population';
  /** Priority score (higher = more urgent) */
  priority: number;
  /** Human-readable description */
  description: string;
  /** Additional data specific to this issue type */
  data?: Record<string, unknown>;
}

/**
 * Complete city assessment snapshot.
 * Everything the AI needs to know to make decisions.
 */
export interface CityAssessment {
  /** When this assessment was taken */
  timestamp: number;
  
  // === Population & Economy ===
  /** Current population */
  population: number;
  /** Population trend over recent history */
  populationTrend: PopulationTrend;
  /** Current available jobs */
  jobs: number;
  /** Employment statistics */
  employment: EmploymentStats;
  /** Housing shortage if any */
  housingShortage: HousingShortage | null;
  
  // === Demand & Balance ===
  /** RCI demand balance */
  demandBalance: RCIDemandBalance;
  /** Whether demand is balanced within thresholds */
  isDemandBalanced: boolean;
  
  // === Treasury ===
  /** Current money */
  money: number;
  /** Monthly income */
  income: number;
  /** Monthly expenses */
  expenses: number;
  /** Treasury health assessment */
  treasuryHealth: TreasuryHealth;
  
  // === Services ===
  /** Gaps in service coverage */
  serviceGaps: ServiceGap[];
  /** Overall power coverage (0-1) */
  powerCoverage: number;
  /** Overall water coverage (0-1) */
  waterCoverage: number;
  
  // === Happiness ===
  /** Average city happiness (0-100) */
  happiness: number;
  /** Is happiness below minimum threshold */
  isUnhappy: boolean;
  
  // === Active Issues ===
  /** Number of active disasters */
  activeDisasters: number;
  /** All prioritized issues sorted by priority */
  prioritizedIssues: PrioritizedIssue[];
  
  // === Crypto Economy (if applicable) ===
  /** Whether crypto economy is active */
  hasCryptoEconomy: boolean;
  /** Total crypto buildings */
  cryptoBuildingCount: number;
  /** Crypto treasury */
  cryptoTreasury: number;
  /** Daily crypto yield */
  cryptoYield: number;
}

// =============================================================================
// AI ACTION TYPES
// =============================================================================

/**
 * Types of actions the AI can take.
 * Each action has a cost and effect on the city.
 */
export type CityActionType =
  | 'zone_residential'
  | 'zone_commercial'
  | 'zone_industrial'
  | 'build_road'
  | 'build_power_plant'
  | 'build_water_tower'
  | 'build_police_station'
  | 'build_fire_station'
  | 'build_hospital'
  | 'build_school'
  | 'build_park'
  | 'bulldoze'
  | 'adjust_tax_rate'
  | 'place_crypto_building';

/**
 * A planned action for the AI to execute.
 */
export interface CityAction {
  /** Unique action ID */
  id: string;
  /** Type of action */
  type: CityActionType;
  /** Grid position for placement actions */
  position?: { x: number; y: number };
  /** Additional positions for multi-tile actions */
  additionalPositions?: { x: number; y: number }[];
  /** Building type for building actions */
  buildingType?: BuildingType;
  /** Zone type for zoning actions */
  zoneType?: ZoneType;
  /** New tax rate for tax adjustments */
  newTaxRate?: number;
  /** Crypto building ID for crypto placement */
  cryptoBuildingId?: string;
  /** Estimated cost */
  cost: number;
  /** Priority of this action (higher = more important) */
  priority: number;
  /** Reason/justification for this action */
  reason: string;
  /** When this action was planned */
  plannedAt: number;
}

/**
 * Result of executing a city action.
 */
export interface ActionResult {
  /** Whether the action succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** The action that was attempted */
  action: CityAction;
  /** Cost actually spent */
  actualCost: number;
}

// =============================================================================
// BUILDING PLACEMENT TYPES
// =============================================================================

/**
 * Score breakdown for a potential building placement.
 */
export interface PlacementScore {
  /** Grid position being evaluated */
  position: { x: number; y: number };
  /** Total score (sum of factors) */
  totalScore: number;
  /** Individual score factors */
  factors: {
    /** Synergy with nearby buildings */
    synergy: number;
    /** Road access score */
    roadAccess: number;
    /** Service coverage score */
    serviceCoverage: number;
    /** Land value appropriateness */
    landValue: number;
    /** Demand score (NPCs want this building type) */
    demand: number;
    /** Zone compatibility */
    zoneCompatibility: number;
  };
  /** Whether this placement is valid */
  isValid: boolean;
  /** Reason if invalid */
  invalidReason?: string;
}

/**
 * Configuration for the building placement AI.
 */
export interface PlacementConfig {
  /** Weight for synergy score */
  synergyWeight: number;
  /** Weight for road access score */
  roadAccessWeight: number;
  /** Weight for service coverage score */
  serviceCoverageWeight: number;
  /** Weight for land value score */
  landValueWeight: number;
  /** Weight for demand score */
  demandWeight: number;
  /** Weight for zone compatibility */
  zoneCompatibilityWeight: number;
}

// =============================================================================
// CITY AI STATE
// =============================================================================

/**
 * Complete state of the City AI system.
 */
export interface CityAIState {
  /** Whether autonomous mode is enabled */
  enabled: boolean;
  /** Current aggressiveness setting */
  aggressiveness: AIAggressiveness;
  /** Last assessment taken */
  lastAssessment: CityAssessment | null;
  /** Pending actions queue */
  actionQueue: CityAction[];
  /** Actions executed this session */
  executedActions: CityAction[];
  /** Number of ticks since last AI decision */
  ticksSinceLastDecision: number;
  /** Total actions executed */
  totalActionsExecuted: number;
  /** Whether AI is currently paused */
  isPaused: boolean;
  /** Last error if any */
  lastError: string | null;
}

/**
 * Configuration options for the City AI Manager.
 */
export interface CityAIConfig {
  /** Ticks between assessment updates */
  assessmentInterval: number;
  /** Ticks between action executions */
  actionInterval: number;
  /** Maximum actions to queue */
  maxQueueSize: number;
  /** Maximum actions per decision cycle */
  maxActionsPerCycle: number;
  /** Whether to log AI decisions */
  debugLogging: boolean;
}

/**
 * Default configuration for City AI.
 */
export const DEFAULT_AI_CONFIG: CityAIConfig = {
  assessmentInterval: 10, // Assess every 10 ticks
  actionInterval: 5, // Execute action every 5 ticks
  maxQueueSize: 20,
  maxActionsPerCycle: 3,
  debugLogging: false,
};
