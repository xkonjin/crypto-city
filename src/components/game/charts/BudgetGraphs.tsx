'use client';

import React from 'react';
import { LineChart } from './LineChart';
import { AreaChart } from './AreaChart';
import { BarChart, BarChartData } from './BarChart';
import type { FinancialHistory, YieldBreakdown } from '@/lib/financialHistory';

export type TimeRange = 7 | 30 | 90 | 365;

export interface BudgetGraphsProps {
  /** Financial history instance */
  history: FinancialHistory;
  /** Selected time range in days */
  timeRange: TimeRange;
  /** Yield breakdown data */
  yieldBreakdown?: YieldBreakdown;
  /** Building count breakdown (optional) */
  buildingsByType?: { name: string; count: number }[];
}

// Color palette for charts
const CHART_COLORS = {
  treasury: '#3b82f6', // blue
  tvl: '#8b5cf6', // purple
  income: '#22c55e', // green
  expense: '#ef4444', // red
  sentiment: '#f59e0b', // amber
};

// Chain colors for breakdown charts
const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627eea',
  solana: '#14f195',
  bitcoin: '#f7931a',
  arbitrum: '#28a0f0',
  optimism: '#ff0420',
  polygon: '#8247e5',
  base: '#0052ff',
  avalanche: '#e84142',
  bnb: '#f0b90b',
  default: '#6b7280',
};

// Tier colors
const TIER_COLORS: Record<string, string> = {
  retail: '#60a5fa',
  degen: '#f97316',
  whale: '#a855f7',
  institution: '#14b8a6',
};

/**
 * Budget Graphs Component
 * Displays various financial charts based on history data
 */
export function BudgetGraphs({
  history,
  timeRange,
  yieldBreakdown,
  buildingsByType,
}: BudgetGraphsProps) {
  const snapshots = history.getSnapshots(timeRange);
  
  // Generate labels for x-axis
  const labels = snapshots.map((s, i) => {
    if (timeRange <= 7) return `Day ${s.day}`;
    if (timeRange <= 30) return i % 5 === 0 ? `Day ${s.day}` : '';
    if (timeRange <= 90) return i % 10 === 0 ? `Day ${s.day}` : '';
    return i % 30 === 0 ? `Day ${s.day}` : '';
  }).filter(Boolean);

  // Extract data arrays
  const treasuryData = snapshots.map(s => s.treasury);
  const tvlData = snapshots.map(s => s.tvl);
  const incomeData = snapshots.map(s => s.dailyYield);
  const expenseData = snapshots.map(s => s.dailyCosts);
  const sentimentData = snapshots.map(s => s.sentiment);
  const buildingCountData = snapshots.map(s => s.buildingCount);

  // Prepare yield breakdown chart data
  const chainBreakdownData: BarChartData[] = yieldBreakdown?.byChain.map(item => ({
    label: item.chain,
    value: item.yield,
    color: CHAIN_COLORS[item.chain] || CHAIN_COLORS.default,
  })) || [];

  const tierBreakdownData: BarChartData[] = yieldBreakdown?.byTier.map(item => ({
    label: item.tier,
    value: item.yield,
    color: TIER_COLORS[item.tier] || '#6b7280',
  })) || [];

  return (
    <div className="space-y-6" data-testid="budget-graphs">
      {/* Treasury Trend */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Treasury Trend</h4>
        <div data-testid="treasury-chart">
          <LineChart
            data={treasuryData}
            labels={labels}
            color={CHART_COLORS.treasury}
            height={150}
            fillArea
            fillColor={CHART_COLORS.treasury}
          />
        </div>
      </div>

      {/* Income vs Expenses */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Income vs Expenses</h4>
        <div data-testid="income-expense-chart">
          <AreaChart
            income={incomeData}
            expenses={expenseData}
            labels={labels}
            height={150}
            incomeColor={CHART_COLORS.income}
            expenseColor={CHART_COLORS.expense}
          />
        </div>
      </div>

      {/* TVL Growth */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">TVL Growth</h4>
        <LineChart
          data={tvlData}
          labels={labels}
          color={CHART_COLORS.tvl}
          height={120}
          showDots={timeRange <= 30}
        />
      </div>

      {/* Market Sentiment */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Market Sentiment</h4>
        <LineChart
          data={sentimentData}
          labels={labels}
          color={CHART_COLORS.sentiment}
          height={100}
        />
      </div>

      {/* Yield Breakdown by Chain */}
      {chainBreakdownData.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Yield By Chain</h4>
          <div data-testid="yield-breakdown-chart">
            <BarChart
              data={chainBreakdownData}
              height={150}
              horizontal
            />
          </div>
        </div>
      )}

      {/* Yield Breakdown by Tier */}
      {tierBreakdownData.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Yield By Tier</h4>
          <BarChart
            data={tierBreakdownData}
            height={120}
          />
        </div>
      )}

      {/* Building Count */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Building Count</h4>
        <LineChart
          data={buildingCountData}
          labels={labels}
          color="#6366f1"
          height={100}
        />
      </div>
    </div>
  );
}

export default BudgetGraphs;
