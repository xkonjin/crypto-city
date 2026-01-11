'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { msg, useMessages } from 'gt-next';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, TrendingDown, Minus, BarChart3, LineChart as LineChartIcon, PieChart } from 'lucide-react';
import { BudgetGraphs, TimeRange } from '../charts/BudgetGraphs';
import { 
  FinancialHistory, 
  getFinancialHistory, 
  TrendDirection,
  YieldBreakdown,
  PeriodComparison,
} from '@/lib/financialHistory';
import type { CryptoEconomyState, PlacedCryptoBuilding } from '@/games/isocity/crypto/types';
import { getYieldBreakdown } from '@/lib/financialHistory';

// Translatable UI labels
const UI_LABELS = {
  financialReport: msg('Financial Report'),
  overview: msg('Overview'),
  charts: msg('Charts'),
  breakdown: msg('Breakdown'),
  comparison: msg('Comparison'),
  treasury: msg('Treasury'),
  totalYield: msg('Total Yield'),
  totalCosts: msg('Total Costs'),
  netIncome: msg('Net Income'),
  tvl: msg('TVL'),
  buildingCount: msg('Buildings'),
  avgSentiment: msg('Avg Sentiment'),
  thisWeek: msg('This Week'),
  lastWeek: msg('Last Week'),
  change: msg('Change'),
  exportCSV: msg('Export CSV'),
  noData: msg('No financial data yet. Play the game to generate data.'),
  byChain: msg('By Chain'),
  byTier: msg('By Tier'),
  byBuilding: msg('By Building'),
  days7: msg('7 Days'),
  days30: msg('30 Days'),
  days90: msg('90 Days'),
  days365: msg('1 Year'),
};

interface FinancialReportPanelProps {
  /** Crypto economy state */
  economyState?: CryptoEconomyState;
  /** Placed crypto buildings */
  buildings?: PlacedCryptoBuilding[];
}

/**
 * Trend indicator component
 */
function TrendIndicator({ trend, value }: { trend: TrendDirection; value?: number }) {
  const formattedValue = value !== undefined ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : '';
  
  if (trend === 'up') {
    return (
      <span data-testid="trend-indicator" className="inline-flex items-center gap-1 text-green-500">
        <TrendingUp className="w-4 h-4" />
        {formattedValue && <span className="text-xs">{formattedValue}</span>}
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span data-testid="trend-indicator" className="inline-flex items-center gap-1 text-red-500">
        <TrendingDown className="w-4 h-4" />
        {formattedValue && <span className="text-xs">{formattedValue}</span>}
      </span>
    );
  }
  return (
    <span data-testid="trend-indicator" className="inline-flex items-center gap-1 text-muted-foreground">
      <Minus className="w-4 h-4" />
      <span className="text-xs">Stable</span>
    </span>
  );
}

/**
 * Financial Report Panel Component
 */
export function FinancialReportPanel({ economyState, buildings = [] }: FinancialReportPanelProps) {
  const { state, setActivePanel } = useGame();
  const m = useMessages();
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  
  const history = getFinancialHistory();
  const snapshots = history.getSnapshots(timeRange);
  const hasData = snapshots.length > 0;
  
  // Calculate yield breakdown
  const yieldBreakdown = useMemo<YieldBreakdown | undefined>(() => {
    if (buildings.length === 0) return undefined;
    return getYieldBreakdown(buildings);
  }, [buildings]);
  
  // Get period comparison (7-day comparison)
  const comparison = useMemo<PeriodComparison>(() => {
    return history.comparePeriods(7);
  }, [history, snapshots.length]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Calculate current trends
  const trends = useMemo(() => ({
    treasury: history.getTrend('treasury', timeRange),
    tvl: history.getTrend('tvl', timeRange),
    yield: history.getTrend('dailyYield', timeRange),
    costs: history.getTrend('dailyCosts', timeRange),
    sentiment: history.getTrend('sentiment', timeRange),
  }), [history, timeRange, snapshots.length]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Calculate overview stats
  const overviewStats = useMemo(() => {
    const latestSnapshot = snapshots[snapshots.length - 1];
    return {
      treasury: latestSnapshot?.treasury || economyState?.treasury || 0,
      tvl: latestSnapshot?.tvl || economyState?.tvl || 0,
      buildingCount: latestSnapshot?.buildingCount || economyState?.buildingCount || 0,
      totalYield: history.getSum('dailyYield', timeRange),
      totalCosts: history.getSum('dailyCosts', timeRange),
      avgSentiment: history.getAverage('sentiment', timeRange),
    };
  }, [history, timeRange, snapshots.length, economyState]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const csv = history.exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto-city-financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [history]);
  
  return (
    <Dialog open={true} onOpenChange={() => setActivePanel('none')}>
      <DialogContent className="max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col" data-testid="financial-report-panel">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{m(UI_LABELS.financialReport)}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              data-testid="export-csv-btn"
              className="ml-4"
            >
              <Download className="w-4 h-4 mr-2" />
              {m(UI_LABELS.exportCSV)}
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {/* Time Range Selector */}
        <div className="flex gap-2 pb-2 border-b border-border flex-shrink-0">
          {([7, 30, 90, 365] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              data-testid={`time-range-${range}`}
            >
              {range === 7 && m(UI_LABELS.days7)}
              {range === 30 && m(UI_LABELS.days30)}
              {range === 90 && m(UI_LABELS.days90)}
              {range === 365 && m(UI_LABELS.days365)}
            </Button>
          ))}
        </div>
        
        {!hasData ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {m(UI_LABELS.noData)}
          </div>
        ) : (
          <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="overview">
                <BarChart3 className="w-4 h-4 mr-1" />
                {m(UI_LABELS.overview)}
              </TabsTrigger>
              <TabsTrigger value="charts">
                <LineChartIcon className="w-4 h-4 mr-1" />
                {m(UI_LABELS.charts)}
              </TabsTrigger>
              <TabsTrigger value="breakdown">
                <PieChart className="w-4 h-4 mr-1" />
                {m(UI_LABELS.breakdown)}
              </TabsTrigger>
              <TabsTrigger value="comparison">
                {m(UI_LABELS.comparison)}
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Treasury */}
                  <StatCard
                    label={m(UI_LABELS.treasury)}
                    value={`$${overviewStats.treasury.toLocaleString()}`}
                    trend={trends.treasury}
                    changePercent={comparison.changes.treasury}
                  />
                  
                  {/* TVL */}
                  <StatCard
                    label={m(UI_LABELS.tvl)}
                    value={`$${overviewStats.tvl.toLocaleString()}`}
                    trend={trends.tvl}
                  />
                  
                  {/* Total Yield */}
                  <StatCard
                    label={m(UI_LABELS.totalYield)}
                    value={`$${overviewStats.totalYield.toLocaleString()}`}
                    trend={trends.yield}
                    changePercent={comparison.changes.yield}
                    positive
                  />
                  
                  {/* Total Costs */}
                  <StatCard
                    label={m(UI_LABELS.totalCosts)}
                    value={`$${overviewStats.totalCosts.toLocaleString()}`}
                    trend={trends.costs}
                    changePercent={comparison.changes.costs}
                    negative
                  />
                  
                  {/* Net Income */}
                  <StatCard
                    label={m(UI_LABELS.netIncome)}
                    value={`$${(overviewStats.totalYield - overviewStats.totalCosts).toLocaleString()}`}
                    trend={history.getTrend('netIncome', timeRange)}
                    changePercent={comparison.changes.netIncome}
                    positive={overviewStats.totalYield >= overviewStats.totalCosts}
                    negative={overviewStats.totalYield < overviewStats.totalCosts}
                  />
                  
                  {/* Buildings */}
                  <StatCard
                    label={m(UI_LABELS.buildingCount)}
                    value={overviewStats.buildingCount.toString()}
                    trend={history.getTrend('buildingCount', timeRange)}
                  />
                  
                  {/* Avg Sentiment */}
                  <StatCard
                    label={m(UI_LABELS.avgSentiment)}
                    value={overviewStats.avgSentiment.toFixed(1)}
                    trend={trends.sentiment}
                  />
                </div>
              </TabsContent>
              
              {/* Charts Tab */}
              <TabsContent value="charts" className="mt-4">
                <BudgetGraphs
                  history={history}
                  timeRange={timeRange}
                  yieldBreakdown={yieldBreakdown}
                />
              </TabsContent>
              
              {/* Breakdown Tab */}
              <TabsContent value="breakdown" className="mt-4 space-y-4">
                {yieldBreakdown ? (
                  <>
                    {/* By Chain */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">{m(UI_LABELS.byChain)}</h4>
                      <div className="space-y-1">
                        {yieldBreakdown.byChain.map((item, index) => (
                          <BreakdownItem
                            key={index}
                            label={item.chain}
                            value={item.yield}
                            percentage={item.percentage}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* By Tier */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">{m(UI_LABELS.byTier)}</h4>
                      <div className="space-y-1">
                        {yieldBreakdown.byTier.map((item, index) => (
                          <BreakdownItem
                            key={index}
                            label={item.tier}
                            value={item.yield}
                            percentage={item.percentage}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* By Building */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">{m(UI_LABELS.byBuilding)}</h4>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {yieldBreakdown.byBuilding.slice(0, 10).map((item, index) => (
                          <BreakdownItem
                            key={index}
                            label={item.name}
                            value={item.yield}
                            percentage={item.percentage}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No crypto buildings placed yet.
                  </div>
                )}
              </TabsContent>
              
              {/* Comparison Tab */}
              <TabsContent value="comparison" className="mt-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">{m(UI_LABELS.thisWeek)} vs {m(UI_LABELS.lastWeek)}</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium">Metric</th>
                          <th className="text-right py-2 font-medium">{m(UI_LABELS.thisWeek)}</th>
                          <th className="text-right py-2 font-medium">{m(UI_LABELS.lastWeek)}</th>
                          <th className="text-right py-2 font-medium">{m(UI_LABELS.change)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <ComparisonRow
                          label={m(UI_LABELS.treasury)}
                          current={comparison.current.treasury}
                          previous={comparison.previous.treasury}
                          change={comparison.changes.treasury}
                        />
                        <ComparisonRow
                          label={m(UI_LABELS.totalYield)}
                          current={comparison.current.yield}
                          previous={comparison.previous.yield}
                          change={comparison.changes.yield}
                        />
                        <ComparisonRow
                          label={m(UI_LABELS.totalCosts)}
                          current={comparison.current.costs}
                          previous={comparison.previous.costs}
                          change={comparison.changes.costs}
                          invertColors
                        />
                        <ComparisonRow
                          label={m(UI_LABELS.netIncome)}
                          current={comparison.current.netIncome}
                          previous={comparison.previous.netIncome}
                          change={comparison.changes.netIncome}
                        />
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Stat card component for overview
 */
function StatCard({
  label,
  value,
  trend,
  changePercent,
  positive,
  negative,
}: {
  label: string;
  value: string;
  trend: TrendDirection;
  changePercent?: number;
  positive?: boolean;
  negative?: boolean;
}) {
  let valueColor = 'text-foreground';
  if (positive) valueColor = 'text-green-500';
  if (negative) valueColor = 'text-red-500';
  
  return (
    <div className="bg-card rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${valueColor}`}>{value}</div>
      <div className="mt-1">
        <TrendIndicator trend={trend} value={changePercent} />
      </div>
    </div>
  );
}

/**
 * Breakdown item component
 */
function BreakdownItem({
  label,
  value,
  percentage,
}: {
  label: string;
  value: number;
  percentage: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="flex justify-between text-sm">
          <span className="capitalize">{label}</span>
          <span className="font-mono">${value.toFixed(0)}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full mt-1">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-muted-foreground w-12 text-right">
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
}

/**
 * Comparison table row
 */
function ComparisonRow({
  label,
  current,
  previous,
  change,
  invertColors = false,
}: {
  label: string;
  current: number;
  previous: number;
  change: number;
  invertColors?: boolean;
}) {
  const isPositive = invertColors ? change < 0 : change > 0;
  const isNegative = invertColors ? change > 0 : change < 0;
  
  return (
    <tr className="border-b border-border/50">
      <td className="py-2">{label}</td>
      <td className="text-right py-2 font-mono">${current.toLocaleString()}</td>
      <td className="text-right py-2 font-mono text-muted-foreground">${previous.toLocaleString()}</td>
      <td className={`text-right py-2 font-mono ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : ''}`}>
        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
      </td>
    </tr>
  );
}

export default FinancialReportPanel;
