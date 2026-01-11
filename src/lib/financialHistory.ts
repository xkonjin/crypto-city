/**
 * Financial History System (Issue #68)
 *
 * Tracks and persists financial data for budget graphs and trend visualization.
 * Records daily snapshots of key financial metrics for historical analysis.
 */

import type { PlacedCryptoBuilding, CryptoChain, CryptoTier } from '@/games/isocity/crypto/types';
import { getCryptoBuilding } from '@/games/isocity/crypto/buildings';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * A snapshot of financial state at a specific point in time
 */
export interface FinancialSnapshot {
  /** Game day number */
  day: number;
  /** Treasury balance at end of day */
  treasury: number;
  /** Total Value Locked */
  tvl: number;
  /** Yield generated that day */
  dailyYield: number;
  /** Costs incurred that day */
  dailyCosts: number;
  /** Net income (yield - costs) */
  netIncome: number;
  /** Number of crypto buildings */
  buildingCount: number;
  /** City population */
  population: number;
  /** Market sentiment (0-100) */
  sentiment: number;
  /** Timestamp when snapshot was taken */
  timestamp: number;
}

/**
 * Yield breakdown by various categories
 */
export interface YieldBreakdown {
  /** Yield breakdown by blockchain chain */
  byChain: { chain: string; yield: number; percentage: number }[];
  /** Yield breakdown by building tier */
  byTier: { tier: string; yield: number; percentage: number }[];
  /** Yield breakdown by building type */
  byBuilding: { name: string; yield: number; percentage: number }[];
}

/**
 * Trend direction indicator
 */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Period comparison metrics
 */
export interface PeriodComparison {
  /** Current period values */
  current: {
    treasury: number;
    yield: number;
    costs: number;
    netIncome: number;
  };
  /** Previous period values */
  previous: {
    treasury: number;
    yield: number;
    costs: number;
    netIncome: number;
  };
  /** Percentage changes */
  changes: {
    treasury: number;
    yield: number;
    costs: number;
    netIncome: number;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = 'cryptoCityFinancialHistory';
const MAX_SNAPSHOTS = 365; // 1 year of data

// =============================================================================
// FINANCIAL HISTORY CLASS
// =============================================================================

/**
 * Manages financial history data storage and analysis
 */
export class FinancialHistory {
  private snapshots: FinancialSnapshot[] = [];
  public readonly maxSnapshots = MAX_SNAPSHOTS;

  constructor() {
    this.restore();
  }

  /**
   * Add a new financial snapshot
   */
  addSnapshot(snapshot: FinancialSnapshot): void {
    // Don't add duplicate snapshots for the same day
    if (this.snapshots.length > 0 && this.snapshots[this.snapshots.length - 1].day === snapshot.day) {
      // Update existing snapshot for the same day
      this.snapshots[this.snapshots.length - 1] = snapshot;
    } else {
      this.snapshots.push(snapshot);
    }

    // Trim to max snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    this.persist();
  }

  /**
   * Get snapshots, optionally limited to recent days
   */
  getSnapshots(days?: number): FinancialSnapshot[] {
    if (!days || days >= this.snapshots.length) {
      return [...this.snapshots];
    }
    return this.snapshots.slice(-days);
  }

  /**
   * Get trend direction for a specific metric over a period
   */
  getTrend(metric: keyof FinancialSnapshot, days: number): TrendDirection {
    const recent = this.getSnapshots(days);
    if (recent.length < 2) return 'stable';

    const values = recent.map(s => s[metric] as number);
    const first = values[0];
    const last = values[values.length - 1];

    // Calculate percentage change
    const changePercent = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : (last > 0 ? 100 : (last < 0 ? -100 : 0));

    // Consider stable if change is less than 5%
    if (Math.abs(changePercent) < 5) return 'stable';
    return changePercent > 0 ? 'up' : 'down';
  }

  /**
   * Get average value for a metric over a period
   */
  getAverage(metric: keyof FinancialSnapshot, days: number): number {
    const recent = this.getSnapshots(days);
    if (recent.length === 0) return 0;

    const values = recent.map(s => s[metric] as number);
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Get sum of a metric over a period
   */
  getSum(metric: keyof FinancialSnapshot, days: number): number {
    const recent = this.getSnapshots(days);
    return recent.reduce((sum, s) => sum + (s[metric] as number), 0);
  }

  /**
   * Get min value for a metric over a period
   */
  getMin(metric: keyof FinancialSnapshot, days: number): number {
    const recent = this.getSnapshots(days);
    if (recent.length === 0) return 0;
    return Math.min(...recent.map(s => s[metric] as number));
  }

  /**
   * Get max value for a metric over a period
   */
  getMax(metric: keyof FinancialSnapshot, days: number): number {
    const recent = this.getSnapshots(days);
    if (recent.length === 0) return 0;
    return Math.max(...recent.map(s => s[metric] as number));
  }

  /**
   * Compare two periods (e.g., this week vs last week)
   */
  comparePeriods(periodDays: number): PeriodComparison {
    const current = this.getSnapshots(periodDays);
    const allSnapshots = this.getSnapshots(periodDays * 2);
    const previous = allSnapshots.slice(0, Math.max(0, allSnapshots.length - periodDays));

    const sumMetric = (snapshots: FinancialSnapshot[], key: keyof FinancialSnapshot) =>
      snapshots.reduce((sum, s) => sum + (s[key] as number), 0);

    const currentTreasury = current.length > 0 ? current[current.length - 1].treasury : 0;
    const previousTreasury = previous.length > 0 ? previous[previous.length - 1].treasury : 0;

    const currentYield = sumMetric(current, 'dailyYield');
    const previousYield = sumMetric(previous, 'dailyYield');

    const currentCosts = sumMetric(current, 'dailyCosts');
    const previousCosts = sumMetric(previous, 'dailyCosts');

    const currentNetIncome = sumMetric(current, 'netIncome');
    const previousNetIncome = sumMetric(previous, 'netIncome');

    const calcChange = (curr: number, prev: number) => 
      prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : (curr > 0 ? 100 : (curr < 0 ? -100 : 0));

    return {
      current: {
        treasury: currentTreasury,
        yield: currentYield,
        costs: currentCosts,
        netIncome: currentNetIncome,
      },
      previous: {
        treasury: previousTreasury,
        yield: previousYield,
        costs: previousCosts,
        netIncome: previousNetIncome,
      },
      changes: {
        treasury: calcChange(currentTreasury, previousTreasury),
        yield: calcChange(currentYield, previousYield),
        costs: calcChange(currentCosts, previousCosts),
        netIncome: calcChange(currentNetIncome, previousNetIncome),
      },
    };
  }

  /**
   * Export data to CSV format
   */
  exportCSV(): string {
    const headers = [
      'Day',
      'Treasury',
      'TVL',
      'Daily Yield',
      'Daily Costs',
      'Net Income',
      'Building Count',
      'Population',
      'Sentiment',
      'Timestamp',
    ];

    const rows = this.snapshots.map(s => [
      s.day,
      s.treasury,
      s.tvl,
      s.dailyYield,
      s.dailyCosts,
      s.netIncome,
      s.buildingCount,
      s.population,
      s.sentiment,
      new Date(s.timestamp).toISOString(),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Persist snapshots to localStorage
   */
  persist(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.snapshots));
    } catch (e) {
      console.warn('Failed to persist financial history:', e);
    }
  }

  /**
   * Restore snapshots from localStorage
   */
  restore(): void {
    if (typeof window === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.snapshots = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to restore financial history:', e);
      this.snapshots = [];
    }
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.snapshots = [];
    this.persist();
  }

  /**
   * Get total snapshot count
   */
  get length(): number {
    return this.snapshots.length;
  }
}

// =============================================================================
// YIELD BREAKDOWN ANALYSIS
// =============================================================================

/**
 * Calculate yield breakdown by chain, tier, and building type
 */
export function getYieldBreakdown(buildings: PlacedCryptoBuilding[]): YieldBreakdown {
  const byChainMap = new Map<string, number>();
  const byTierMap = new Map<string, number>();
  const byBuildingMap = new Map<string, number>();
  let totalYield = 0;

  for (const building of buildings) {
    const def = getCryptoBuilding(building.buildingId);
    if (!def) continue;

    const yieldRate = def.crypto.effects.yieldRate;
    const upgradeMultiplier = building.upgradeLevel ? 1 + (building.upgradeLevel - 1) * 0.25 : 1;
    const effectiveYield = yieldRate * upgradeMultiplier;

    totalYield += effectiveYield;

    // By chain
    const chain = def.crypto.chain;
    byChainMap.set(chain, (byChainMap.get(chain) || 0) + effectiveYield);

    // By tier
    const tier = def.crypto.tier;
    byTierMap.set(tier, (byTierMap.get(tier) || 0) + effectiveYield);

    // By building name
    byBuildingMap.set(def.name, (byBuildingMap.get(def.name) || 0) + effectiveYield);
  }

  const toBreakdownArray = (map: Map<string, number>, keyName: string) => {
    return Array.from(map.entries())
      .map(([key, value]) => ({
        [keyName]: key,
        yield: value,
        percentage: totalYield > 0 ? (value / totalYield) * 100 : 0,
      }))
      .sort((a, b) => b.yield - a.yield);
  };

  return {
    byChain: toBreakdownArray(byChainMap, 'chain').map(item => ({
      chain: item.chain as string,
      yield: item.yield,
      percentage: item.percentage,
    })),
    byTier: toBreakdownArray(byTierMap, 'tier').map(item => ({
      tier: item.tier as string,
      yield: item.yield,
      percentage: item.percentage,
    })),
    byBuilding: toBreakdownArray(byBuildingMap, 'name').map(item => ({
      name: item.name as string,
      yield: item.yield,
      percentage: item.percentage,
    })),
  };
}

// =============================================================================
// CREATE SNAPSHOT HELPER
// =============================================================================

/**
 * Create a financial snapshot from current game state
 */
export function createFinancialSnapshot(
  day: number,
  treasury: number,
  tvl: number,
  dailyYield: number,
  dailyCosts: number,
  buildingCount: number,
  population: number,
  sentiment: number
): FinancialSnapshot {
  return {
    day,
    treasury,
    tvl,
    dailyYield,
    dailyCosts,
    netIncome: dailyYield - dailyCosts,
    buildingCount,
    population,
    sentiment,
    timestamp: Date.now(),
  };
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let financialHistoryInstance: FinancialHistory | null = null;

/**
 * Get the singleton financial history instance
 */
export function getFinancialHistory(): FinancialHistory {
  if (!financialHistoryInstance) {
    financialHistoryInstance = new FinancialHistory();
  }
  return financialHistoryInstance;
}

/**
 * Reset the financial history instance (for testing)
 */
export function resetFinancialHistory(): void {
  if (financialHistoryInstance) {
    financialHistoryInstance.clear();
  }
  financialHistoryInstance = null;
}
