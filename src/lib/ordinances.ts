/**
 * Ordinances/Policies System (Issue #69)
 * 
 * Provides city-wide rules and strategic levers similar to SimCity 3000/4 ordinances.
 * Ordinances can modify yields, risk, happiness, costs, and other game parameters.
 */

import { logger } from './logger';

// =============================================================================
// TYPES
// =============================================================================

export type OrdinanceCategory = 'economic' | 'risk' | 'social' | 'regulatory';

export interface OrdinanceEffect {
  yieldModifier?: number;       // +/- percentage (e.g., 0.1 for +10%)
  riskModifier?: number;        // +/- rug risk (e.g., -0.15 for -15%)
  happinessModifier?: number;   // +/- happiness points
  costModifier?: number;        // +/- building costs (e.g., -0.2 for -20%)
  maintenanceModifier?: number; // +/- maintenance costs
  populationGrowth?: number;    // +/- population growth rate
  taxRate?: number;             // Override crypto tax rate (0-1)
  tradeRiskModifier?: number;   // +/- trade risk
  tradeRewardModifier?: number; // +/- trade reward
  whaleImpactModifier?: number; // Reduce whale event impact
  protectionBonus?: number;     // +% protection for all buildings
  autoInsure?: boolean;         // Auto-insure new buildings
  requireApproval?: boolean;    // Degen buildings require approval
}

export interface OrdinanceRequirement {
  minTreasury?: number;
  minPopulation?: number;
  minBuildings?: number;
  requiredBuildings?: string[];
}

export interface Ordinance {
  id: string;
  name: string;
  description: string;
  category: OrdinanceCategory;
  effect: OrdinanceEffect;
  cost: number;           // Daily cost in $ (or one-time for special ordinances)
  isOneTime?: boolean;    // One-time cost instead of daily
  duration?: number;      // Duration in days for temporary ordinances
  requirements?: OrdinanceRequirement;
  isActive: boolean;
  icon: string;
}

export interface OrdinanceState {
  activeOrdinances: string[];
  ordinanceCosts: Record<string, number>; // Track accumulated costs
  taxHolidayEndDay?: number; // Track when tax holiday ends
  lastUpdated: number;
}

// =============================================================================
// ORDINANCE DEFINITIONS
// =============================================================================

export const ORDINANCES: Ordinance[] = [
  // ===================== ECONOMIC ORDINANCES =====================
  {
    id: 'yield_bonus_program',
    name: 'Yield Bonus Program',
    description: '+10% yields from all crypto buildings. Attracts more investors to your city.',
    category: 'economic',
    effect: { yieldModifier: 0.10 },
    cost: 500,
    isActive: false,
    icon: '📈',
  },
  {
    id: 'building_subsidy',
    name: 'Building Subsidy',
    description: '-20% building costs. Makes expansion more affordable for crypto projects.',
    category: 'economic',
    effect: { costModifier: -0.20 },
    cost: 1000,
    isActive: false,
    icon: '🏗️',
  },
  {
    id: 'free_market_policy',
    name: 'Free Market Policy',
    description: '+20% yields but +20% rug risk. Deregulation has its price.',
    category: 'economic',
    effect: { yieldModifier: 0.20, riskModifier: 0.20 },
    cost: 200,
    isActive: false,
    icon: '🦅',
  },
  {
    id: 'maintenance_relief',
    name: 'Maintenance Relief',
    description: '-30% maintenance costs. Government subsidizes protocol upkeep.',
    category: 'economic',
    effect: { maintenanceModifier: -0.30 },
    cost: 800,
    isActive: false,
    icon: '🔧',
  },

  // ===================== RISK ORDINANCES =====================
  {
    id: 'mandatory_audits',
    name: 'Mandatory Audits',
    description: '-15% rug risk. All protocols must pass security audits.',
    category: 'risk',
    effect: { riskModifier: -0.15 },
    cost: 600,
    isActive: false,
    icon: '🔍',
  },
  {
    id: 'insurance_mandate',
    name: 'Insurance Mandate',
    description: 'New buildings are auto-insured. Provides protection against rug pulls.',
    category: 'risk',
    effect: { autoInsure: true },
    cost: 1000,
    isActive: false,
    icon: '🛡️',
  },
  {
    id: 'degen_restrictions',
    name: 'Degen Restrictions',
    description: 'Degen-tier buildings require manual approval. Prevents hasty decisions.',
    category: 'risk',
    effect: { requireApproval: true },
    cost: 300,
    isActive: false,
    icon: '⚠️',
  },
  {
    id: 'security_perimeter',
    name: 'Security Perimeter',
    description: '+10% protection for all buildings. Enhanced security monitoring.',
    category: 'risk',
    effect: { protectionBonus: 0.10 },
    cost: 700,
    isActive: false,
    icon: '🔒',
  },

  // ===================== SOCIAL ORDINANCES =====================
  {
    id: 'public_education',
    name: 'Public Education',
    description: '+10 happiness. Citizens learn about crypto, reducing fear.',
    category: 'social',
    effect: { happinessModifier: 10 },
    cost: 400,
    isActive: false,
    icon: '📚',
  },
  {
    id: 'community_events',
    name: 'Community Events',
    description: '+15 happiness, slower population decline. Regular meetups and hackathons.',
    category: 'social',
    effect: { happinessModifier: 15, populationGrowth: 0.05 },
    cost: 500,
    isActive: false,
    icon: '🎉',
  },
  {
    id: 'tax_holiday',
    name: 'Tax Holiday',
    description: '0% crypto tax for 7 days. One-time cost. Attracts new builders.',
    category: 'social',
    effect: { taxRate: 0 },
    cost: 2000,
    isOneTime: true,
    duration: 7,
    isActive: false,
    icon: '🎊',
  },
  {
    id: 'free_healthcare',
    name: 'Free Healthcare',
    description: '+20 happiness. Universal healthcare for all citizens.',
    category: 'social',
    effect: { happinessModifier: 20 },
    cost: 800,
    isActive: false,
    icon: '🏥',
  },

  // ===================== REGULATORY ORDINANCES =====================
  {
    id: 'zoning_restrictions',
    name: 'Zoning Restrictions',
    description: 'Restricts certain building tiers to designated zones. (Visual indicator only)',
    category: 'regulatory',
    effect: {}, // Visual effect only, not gameplay changing
    cost: 200,
    isActive: false,
    icon: '🗺️',
  },
  {
    id: 'trade_regulations',
    name: 'Trade Regulations',
    description: '-10% trade risk, -10% trade reward. Safer but less profitable trades.',
    category: 'regulatory',
    effect: { tradeRiskModifier: -0.10, tradeRewardModifier: -0.10 },
    cost: 400,
    isActive: false,
    icon: '⚖️',
  },
  {
    id: 'anti_whale_measures',
    name: 'Anti-Whale Measures',
    description: 'Whale events have reduced impact. Prevents market manipulation.',
    category: 'regulatory',
    effect: { whaleImpactModifier: -0.30 },
    cost: 600,
    isActive: false,
    icon: '🐋',
  },
  {
    id: 'environmental_standards',
    name: 'Environmental Standards',
    description: '+5 happiness, -10% yields. Green crypto policies.',
    category: 'regulatory',
    effect: { happinessModifier: 5, yieldModifier: -0.10 },
    cost: 300,
    isActive: false,
    icon: '🌱',
  },
];

// Category colors for UI
export const CATEGORY_COLORS: Record<OrdinanceCategory, { bg: string; text: string; border: string }> = {
  economic: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  risk: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  social: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  regulatory: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
};

// =============================================================================
// ORDINANCE MANAGER CLASS
// =============================================================================

export interface GameStateForOrdinances {
  treasury: number;
  population: number;
  buildingCount: number;
  placedBuildingIds?: string[];
  currentDay?: number;
}

export class OrdinanceManager {
  private activeOrdinances: Set<string> = new Set();
  private ordinanceCosts: Map<string, number> = new Map();
  private taxHolidayEndDay: number | null = null;
  private listeners: Set<(state: OrdinanceState) => void> = new Set();
  
  constructor(initialState?: Partial<OrdinanceState>) {
    if (initialState) {
      this.importState(initialState);
    }
  }
  
  // ---------------------------------------------------------------------------
  // ORDINANCE ACTIVATION / DEACTIVATION
  // ---------------------------------------------------------------------------
  
  /**
   * Activate an ordinance if requirements are met
   * @param id - Ordinance ID
   * @param gameState - Current game state for requirement checking
   * @returns true if activation successful
   */
  activate(id: string, gameState?: GameStateForOrdinances): boolean {
    const ordinance = this.getOrdinance(id);
    if (!ordinance) {
      logger.warn(`[OrdinanceManager] Unknown ordinance: ${id}`);
      return false;
    }
    
    // Check if already active
    if (this.activeOrdinances.has(id)) {
      logger.info(`[OrdinanceManager] Ordinance already active: ${id}`);
      return true;
    }
    
    // Check requirements if game state provided
    if (gameState && !this.canActivate(id, gameState)) {
      logger.info(`[OrdinanceManager] Requirements not met for: ${id}`);
      return false;
    }
    
    // Activate
    this.activeOrdinances.add(id);
    
    // Handle one-time cost ordinances
    if (ordinance.isOneTime) {
      this.ordinanceCosts.set(id, ordinance.cost);
      
      // Track tax holiday end day
      if (id === 'tax_holiday' && ordinance.duration && gameState?.currentDay !== undefined) {
        this.taxHolidayEndDay = gameState.currentDay + ordinance.duration;
      }
    }
    
    logger.info(`[OrdinanceManager] Activated: ${id}`);
    this.notifyListeners();
    return true;
  }
  
  /**
   * Deactivate an ordinance
   * @param id - Ordinance ID
   */
  deactivate(id: string): void {
    if (!this.activeOrdinances.has(id)) {
      return;
    }
    
    this.activeOrdinances.delete(id);
    this.ordinanceCosts.delete(id);
    
    // Clear tax holiday if deactivating it
    if (id === 'tax_holiday') {
      this.taxHolidayEndDay = null;
    }
    
    logger.info(`[OrdinanceManager] Deactivated: ${id}`);
    this.notifyListeners();
  }
  
  /**
   * Deactivate all ordinances
   */
  deactivateAll(): void {
    this.activeOrdinances.clear();
    this.ordinanceCosts.clear();
    this.taxHolidayEndDay = null;
    this.notifyListeners();
  }
  
  /**
   * Check if an ordinance is active
   */
  isActive(id: string): boolean {
    return this.activeOrdinances.has(id);
  }
  
  /**
   * Toggle an ordinance on/off
   */
  toggle(id: string, gameState?: GameStateForOrdinances): boolean {
    if (this.isActive(id)) {
      this.deactivate(id);
      return false;
    } else {
      return this.activate(id, gameState);
    }
  }
  
  // ---------------------------------------------------------------------------
  // COST CALCULATIONS
  // ---------------------------------------------------------------------------
  
  /**
   * Get total daily cost from active ordinances
   * Excludes one-time cost ordinances
   */
  getDailyCost(): number {
    let total = 0;
    
    for (const id of this.activeOrdinances) {
      const ordinance = this.getOrdinance(id);
      if (ordinance && !ordinance.isOneTime) {
        total += ordinance.cost;
      }
    }
    
    return total;
  }
  
  /**
   * Get one-time costs that need to be deducted
   * Returns costs and clears them (should only be charged once)
   */
  getAndClearOneTimeCosts(): number {
    let total = 0;
    
    for (const [id, cost] of this.ordinanceCosts) {
      const ordinance = this.getOrdinance(id);
      if (ordinance?.isOneTime) {
        total += cost;
      }
    }
    
    // Clear one-time costs after retrieval
    for (const id of this.ordinanceCosts.keys()) {
      const ordinance = this.getOrdinance(id);
      if (ordinance?.isOneTime) {
        this.ordinanceCosts.delete(id);
      }
    }
    
    return total;
  }
  
  // ---------------------------------------------------------------------------
  // EFFECT AGGREGATION
  // ---------------------------------------------------------------------------
  
  /**
   * Get combined effects of all active ordinances
   */
  getActiveEffects(): OrdinanceEffect {
    const combined: OrdinanceEffect = {
      yieldModifier: 0,
      riskModifier: 0,
      happinessModifier: 0,
      costModifier: 0,
      maintenanceModifier: 0,
      populationGrowth: 0,
      tradeRiskModifier: 0,
      tradeRewardModifier: 0,
      whaleImpactModifier: 0,
      protectionBonus: 0,
      autoInsure: false,
      requireApproval: false,
    };
    
    for (const id of this.activeOrdinances) {
      const ordinance = this.getOrdinance(id);
      if (!ordinance) continue;
      
      const effect = ordinance.effect;
      
      // Aggregate numeric modifiers
      if (effect.yieldModifier) combined.yieldModifier! += effect.yieldModifier;
      if (effect.riskModifier) combined.riskModifier! += effect.riskModifier;
      if (effect.happinessModifier) combined.happinessModifier! += effect.happinessModifier;
      if (effect.costModifier) combined.costModifier! += effect.costModifier;
      if (effect.maintenanceModifier) combined.maintenanceModifier! += effect.maintenanceModifier;
      if (effect.populationGrowth) combined.populationGrowth! += effect.populationGrowth;
      if (effect.tradeRiskModifier) combined.tradeRiskModifier! += effect.tradeRiskModifier;
      if (effect.tradeRewardModifier) combined.tradeRewardModifier! += effect.tradeRewardModifier;
      if (effect.whaleImpactModifier) combined.whaleImpactModifier! += effect.whaleImpactModifier;
      if (effect.protectionBonus) combined.protectionBonus! += effect.protectionBonus;
      
      // Override tax rate (take most recent)
      if (effect.taxRate !== undefined) combined.taxRate = effect.taxRate;
      
      // Boolean flags - true if any ordinance sets them
      if (effect.autoInsure) combined.autoInsure = true;
      if (effect.requireApproval) combined.requireApproval = true;
    }
    
    return combined;
  }
  
  // ---------------------------------------------------------------------------
  // REQUIREMENT CHECKING
  // ---------------------------------------------------------------------------
  
  /**
   * Check if an ordinance can be activated given current game state
   */
  canActivate(id: string, gameState: GameStateForOrdinances): boolean {
    const ordinance = this.getOrdinance(id);
    if (!ordinance) return false;
    
    const reqs = ordinance.requirements;
    if (!reqs) return true; // No requirements
    
    // Check treasury requirement
    if (reqs.minTreasury !== undefined && gameState.treasury < reqs.minTreasury) {
      return false;
    }
    
    // Check population requirement
    if (reqs.minPopulation !== undefined && gameState.population < reqs.minPopulation) {
      return false;
    }
    
    // Check building count requirement
    if (reqs.minBuildings !== undefined && gameState.buildingCount < reqs.minBuildings) {
      return false;
    }
    
    // Check required buildings
    if (reqs.requiredBuildings && reqs.requiredBuildings.length > 0) {
      const placedIds = gameState.placedBuildingIds || [];
      for (const reqBuildingId of reqs.requiredBuildings) {
        if (!placedIds.includes(reqBuildingId)) {
          return false;
        }
      }
    }
    
    // Check if can afford cost
    if (ordinance.cost > gameState.treasury) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get list of unmet requirements for an ordinance
   */
  getUnmetRequirements(id: string, gameState: GameStateForOrdinances): string[] {
    const ordinance = this.getOrdinance(id);
    if (!ordinance) return ['Unknown ordinance'];
    
    const unmet: string[] = [];
    const reqs = ordinance.requirements;
    
    if (reqs) {
      if (reqs.minTreasury !== undefined && gameState.treasury < reqs.minTreasury) {
        unmet.push(`Need $${reqs.minTreasury.toLocaleString()} treasury`);
      }
      if (reqs.minPopulation !== undefined && gameState.population < reqs.minPopulation) {
        unmet.push(`Need ${reqs.minPopulation.toLocaleString()} population`);
      }
      if (reqs.minBuildings !== undefined && gameState.buildingCount < reqs.minBuildings) {
        unmet.push(`Need ${reqs.minBuildings} crypto buildings`);
      }
    }
    
    if (ordinance.cost > gameState.treasury) {
      unmet.push(`Cannot afford $${ordinance.cost.toLocaleString()}/day`);
    }
    
    return unmet;
  }
  
  // ---------------------------------------------------------------------------
  // TAX HOLIDAY SPECIAL HANDLING
  // ---------------------------------------------------------------------------
  
  /**
   * Check if tax holiday is currently active
   */
  isTaxHolidayActive(currentDay: number): boolean {
    if (!this.isActive('tax_holiday')) return false;
    if (this.taxHolidayEndDay === null) return false;
    return currentDay < this.taxHolidayEndDay;
  }
  
  /**
   * Get days remaining on tax holiday
   */
  getTaxHolidayDaysRemaining(currentDay: number): number {
    if (!this.isTaxHolidayActive(currentDay)) return 0;
    return Math.max(0, (this.taxHolidayEndDay || 0) - currentDay);
  }
  
  /**
   * Process daily tick - expire temporary ordinances
   */
  processDayTick(currentDay: number): void {
    // Check if tax holiday has expired
    if (this.isActive('tax_holiday') && this.taxHolidayEndDay !== null) {
      if (currentDay >= this.taxHolidayEndDay) {
        this.deactivate('tax_holiday');
        logger.info('[OrdinanceManager] Tax holiday expired');
      }
    }
  }
  
  // ---------------------------------------------------------------------------
  // UTILITY METHODS
  // ---------------------------------------------------------------------------
  
  /**
   * Get an ordinance by ID
   */
  getOrdinance(id: string): Ordinance | undefined {
    return ORDINANCES.find(o => o.id === id);
  }
  
  /**
   * Get all ordinances
   */
  getAllOrdinances(): Ordinance[] {
    return [...ORDINANCES];
  }
  
  /**
   * Get ordinances by category
   */
  getOrdinancesByCategory(category: OrdinanceCategory): Ordinance[] {
    return ORDINANCES.filter(o => o.category === category);
  }
  
  /**
   * Get all active ordinance IDs
   */
  getActiveOrdinanceIds(): string[] {
    return Array.from(this.activeOrdinances);
  }
  
  /**
   * Get all active ordinances
   */
  getActiveOrdinances(): Ordinance[] {
    return this.getActiveOrdinanceIds()
      .map(id => this.getOrdinance(id))
      .filter((o): o is Ordinance => o !== undefined);
  }
  
  /**
   * Get count of active ordinances
   */
  getActiveCount(): number {
    return this.activeOrdinances.size;
  }
  
  // ---------------------------------------------------------------------------
  // STATE PERSISTENCE
  // ---------------------------------------------------------------------------
  
  /**
   * Export state for saving
   */
  exportState(): OrdinanceState {
    return {
      activeOrdinances: Array.from(this.activeOrdinances),
      ordinanceCosts: Object.fromEntries(this.ordinanceCosts),
      taxHolidayEndDay: this.taxHolidayEndDay ?? undefined,
      lastUpdated: Date.now(),
    };
  }
  
  /**
   * Import state from save
   */
  importState(state: Partial<OrdinanceState>): void {
    if (state.activeOrdinances) {
      this.activeOrdinances = new Set(state.activeOrdinances);
    }
    if (state.ordinanceCosts) {
      this.ordinanceCosts = new Map(Object.entries(state.ordinanceCosts));
    }
    if (state.taxHolidayEndDay !== undefined) {
      this.taxHolidayEndDay = state.taxHolidayEndDay;
    }
    this.notifyListeners();
  }
  
  // ---------------------------------------------------------------------------
  // LISTENER MANAGEMENT
  // ---------------------------------------------------------------------------
  
  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: OrdinanceState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.exportState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

// Global instance for convenience
let ordinanceManagerInstance: OrdinanceManager | null = null;

export function getOrdinanceManager(): OrdinanceManager {
  if (!ordinanceManagerInstance) {
    ordinanceManagerInstance = new OrdinanceManager();
  }
  return ordinanceManagerInstance;
}

export function createOrdinanceManager(initialState?: Partial<OrdinanceState>): OrdinanceManager {
  ordinanceManagerInstance = new OrdinanceManager(initialState);
  return ordinanceManagerInstance;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format ordinance effect for display
 */
export function formatEffect(effect: OrdinanceEffect): string[] {
  const lines: string[] = [];
  
  if (effect.yieldModifier) {
    const sign = effect.yieldModifier > 0 ? '+' : '';
    lines.push(`${sign}${(effect.yieldModifier * 100).toFixed(0)}% yields`);
  }
  if (effect.riskModifier) {
    const sign = effect.riskModifier > 0 ? '+' : '';
    lines.push(`${sign}${(effect.riskModifier * 100).toFixed(0)}% rug risk`);
  }
  if (effect.happinessModifier) {
    const sign = effect.happinessModifier > 0 ? '+' : '';
    lines.push(`${sign}${effect.happinessModifier} happiness`);
  }
  if (effect.costModifier) {
    const sign = effect.costModifier > 0 ? '+' : '';
    lines.push(`${sign}${(effect.costModifier * 100).toFixed(0)}% building costs`);
  }
  if (effect.maintenanceModifier) {
    const sign = effect.maintenanceModifier > 0 ? '+' : '';
    lines.push(`${sign}${(effect.maintenanceModifier * 100).toFixed(0)}% maintenance`);
  }
  if (effect.populationGrowth) {
    const sign = effect.populationGrowth > 0 ? '+' : '';
    lines.push(`${sign}${(effect.populationGrowth * 100).toFixed(0)}% population growth`);
  }
  if (effect.taxRate !== undefined) {
    lines.push(`${(effect.taxRate * 100).toFixed(0)}% crypto tax`);
  }
  if (effect.tradeRiskModifier) {
    const sign = effect.tradeRiskModifier > 0 ? '+' : '';
    lines.push(`${sign}${(effect.tradeRiskModifier * 100).toFixed(0)}% trade risk`);
  }
  if (effect.tradeRewardModifier) {
    const sign = effect.tradeRewardModifier > 0 ? '+' : '';
    lines.push(`${sign}${(effect.tradeRewardModifier * 100).toFixed(0)}% trade reward`);
  }
  if (effect.whaleImpactModifier) {
    const sign = effect.whaleImpactModifier > 0 ? '+' : '';
    lines.push(`${sign}${(effect.whaleImpactModifier * 100).toFixed(0)}% whale impact`);
  }
  if (effect.protectionBonus) {
    lines.push(`+${(effect.protectionBonus * 100).toFixed(0)}% protection`);
  }
  if (effect.autoInsure) {
    lines.push('Auto-insure new buildings');
  }
  if (effect.requireApproval) {
    lines.push('Degen approval required');
  }
  
  return lines;
}

/**
 * Get total effect summary for active ordinances
 */
export function getEffectSummary(effects: OrdinanceEffect): string {
  const parts: string[] = [];
  
  if (effects.yieldModifier && effects.yieldModifier !== 0) {
    const sign = effects.yieldModifier > 0 ? '+' : '';
    parts.push(`${sign}${(effects.yieldModifier * 100).toFixed(0)}% yield`);
  }
  if (effects.riskModifier && effects.riskModifier !== 0) {
    const sign = effects.riskModifier > 0 ? '+' : '';
    parts.push(`${sign}${(effects.riskModifier * 100).toFixed(0)}% risk`);
  }
  if (effects.happinessModifier && effects.happinessModifier !== 0) {
    const sign = effects.happinessModifier > 0 ? '+' : '';
    parts.push(`${sign}${effects.happinessModifier} happiness`);
  }
  
  return parts.join(', ') || 'No active effects';
}
