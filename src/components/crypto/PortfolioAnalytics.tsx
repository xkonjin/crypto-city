/**
 * Portfolio Analytics Component (Issue #62)
 *
 * Main component displaying portfolio balance metrics:
 * - Chain distribution (pie chart style)
 * - Tier distribution
 * - Risk exposure
 * - Diversity bonuses
 * - Hedging panel
 */

'use client';

import React, { useState, useEffect } from 'react';
import { cryptoEconomy } from '../../games/isocity/crypto';
import {
  analyzePortfolio,
  getChainDistribution,
  getTierDistribution,
  calculateDiversityBonus,
  getDiversityProgress,
  DIVERSITY_BONUSES,
  AVAILABLE_HEDGES,
  createHedgePosition,
  type HedgePosition,
  type AvailableHedge,
} from '../../lib/portfolio';
import type { PlacedCryptoBuilding } from '../../games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

interface PortfolioAnalyticsProps {
  buildings: PlacedCryptoBuilding[];
  currentGameDay: number;
  onPurchaseHedge?: (hedge: AvailableHedge) => void;
  activeHedges?: HedgePosition[];
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  solana: '#14F195',
  bitcoin: '#F7931A',
  arbitrum: '#28A0F0',
  optimism: '#FF0420',
  polygon: '#8247E5',
  base: '#0052FF',
  avalanche: '#E84142',
  bnb: '#F3BA2F',
  sui: '#4DA2FF',
  aptos: '#00D8D5',
  zksync: '#8B5CF6',
  scroll: '#FFBB00',
  linea: '#61DFFF',
  blast: '#FCFC03',
  mantle: '#000000',
  hyperliquid: '#00FF88',
};

const TIER_COLORS: Record<string, string> = {
  retail: '#94A3B8',
  degen: '#F97316',
  whale: '#3B82F6',
  institution: '#8B5CF6',
};

const TIER_LABELS: Record<string, string> = {
  retail: 'Retail',
  degen: 'Degen',
  whale: 'Whale',
  institution: 'Institution',
};

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// =============================================================================
// CHAIN DISTRIBUTION CHART
// =============================================================================

function ChainDistributionChart({
  distribution,
  totalCount,
}: {
  distribution: Record<string, { count: number; yield: number; risk: number }>;
  totalCount: number;
}) {
  const chains = Object.entries(distribution).sort((a, b) => b[1].count - a[1].count);

  if (chains.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No buildings placed yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chains.map(([chain, data]) => {
        const percentage = totalCount > 0 ? (data.count / totalCount) * 100 : 0;
        const color = CHAIN_COLORS[chain] || '#6B7280';
        const isOverweight = percentage > DIVERSITY_BONUSES.balance.threshold * 100;

        return (
          <div key={chain} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-xs">
                <span className="capitalize truncate">{chain}</span>
                <span className={isOverweight ? 'text-orange-400' : 'text-gray-400'}>
                  {data.count} ({percentage.toFixed(0)}%)
                  {isOverweight && ' ⚠️'}
                </span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// TIER DISTRIBUTION CHART
// =============================================================================

function TierDistributionChart({
  distribution,
  totalCount,
}: {
  distribution: Record<string, { count: number; yield: number; risk: number }>;
  totalCount: number;
}) {
  const tiers = ['retail', 'degen', 'whale', 'institution'];

  return (
    <div className="space-y-2">
      {tiers.map((tier) => {
        const data = distribution[tier] || { count: 0, yield: 0, risk: 0 };
        const percentage = totalCount > 0 ? (data.count / totalCount) * 100 : 0;
        const color = TIER_COLORS[tier] || '#6B7280';

        return (
          <div key={tier} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-xs">
                <span>{TIER_LABELS[tier] || tier}</span>
                <span className="text-gray-400">
                  {data.count} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// DIVERSITY BONUS PANEL
// =============================================================================

function DiversityBonusPanel({ buildings }: { buildings: PlacedCryptoBuilding[] }) {
  const bonus = calculateDiversityBonus(buildings);
  const progress = getDiversityProgress(buildings);

  return (
    <div className="space-y-3">
      {/* Active Bonuses */}
      <div className="space-y-2">
        <h4 className="text-xs uppercase tracking-wider text-gray-400">Active Bonuses</h4>

        {/* Chain Diversity */}
        <div className="flex justify-between items-center">
          <span className="text-sm">Chain Diversity ({bonus.chainCount} chains)</span>
          <span className={`text-sm font-medium ${bonus.chainBonus > 0 ? 'text-green-400' : 'text-gray-500'}`}>
            +{(bonus.chainBonus * 100).toFixed(0)}%
          </span>
        </div>

        {/* Tier Balance */}
        <div className="flex justify-between items-center">
          <span className="text-sm">Tier Balance ({bonus.tierCount} tiers)</span>
          <span className={`text-sm font-medium ${bonus.tierBonus > 0 ? 'text-green-400' : 'text-gray-500'}`}>
            +{(bonus.tierBonus * 100).toFixed(0)}%
          </span>
        </div>

        {/* Balance Bonus */}
        <div className="flex justify-between items-center">
          <span className="text-sm">Portfolio Balance</span>
          <span className={`text-sm font-medium ${bonus.balanceBonus > 0 ? 'text-green-400' : bonus.isBalanced ? 'text-gray-500' : 'text-orange-400'}`}>
            {bonus.balanceBonus > 0 ? `+${(bonus.balanceBonus * 100).toFixed(0)}%` : bonus.isBalanced ? 'Need 5+ buildings' : 'Unbalanced'}
          </span>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
          <span className="text-sm font-medium">Total Diversity Bonus</span>
          <span className={`text-base font-bold ${bonus.totalBonus > 0 ? 'text-green-400' : 'text-gray-500'}`}>
            +{(bonus.totalBonus * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Next Milestones */}
      {(progress.chainProgress || progress.tierProgress) && (
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-gray-400">Next Milestones</h4>

          {progress.chainProgress && (
            <div className="text-xs text-gray-400">
              📊 Add {progress.chainProgress.next - progress.chainProgress.current} more chains for +{(progress.chainProgress.bonus * 100).toFixed(0)}% bonus
            </div>
          )}

          {progress.tierProgress && (
            <div className="text-xs text-gray-400">
              📈 Add {progress.tierProgress.next - progress.tierProgress.current} more tiers for +{(progress.tierProgress.bonus * 100).toFixed(0)}% bonus
            </div>
          )}

          {!bonus.isBalanced && buildings.length >= 5 && (
            <div className="text-xs text-orange-400">
              ⚠️ Rebalance portfolio (max 40% per chain) for +10% bonus
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HEDGING PANEL
// =============================================================================

function HedgingPanel({
  activeHedges,
  currentGameDay,
  treasury,
  onPurchase,
}: {
  activeHedges: HedgePosition[];
  currentGameDay: number;
  treasury: number;
  onPurchase: (hedge: AvailableHedge) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Active Hedges */}
      {activeHedges.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-gray-400">Active Protection</h4>
          {activeHedges.map((hedge) => (
            <div
              key={hedge.id}
              className="bg-gray-700/50 rounded-lg p-2 flex justify-between items-center"
            >
              <div>
                <span className="text-sm capitalize">{hedge.type}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {formatPercent(hedge.coverage)} coverage
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Expires: Day {hedge.expiresAt}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available Hedges */}
      <div className="space-y-2">
        <h4 className="text-xs uppercase tracking-wider text-gray-400">Available Protection</h4>
        {AVAILABLE_HEDGES.map((hedge) => {
          const canAfford = treasury >= hedge.upfrontCost;
          return (
            <div
              key={hedge.id}
              className="bg-gray-700/30 rounded-lg p-2 space-y-1"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{hedge.name}</span>
                <span className={`text-xs ${hedge.type === 'put' ? 'text-red-400' : hedge.type === 'insurance' ? 'text-blue-400' : 'text-green-400'}`}>
                  {hedge.type === 'put' ? 'Put Option' : hedge.type === 'insurance' ? 'Insurance' : 'Call Option'}
                </span>
              </div>
              <p className="text-xs text-gray-400">{hedge.description}</p>
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  Cost: ${hedge.upfrontCost.toLocaleString()} + ${hedge.dailyCost}/day
                </div>
                <button
                  onClick={() => onPurchase(hedge)}
                  disabled={!canAfford}
                  className={`text-xs px-2 py-1 rounded ${
                    canAfford
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Buy
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// RISK EXPOSURE METER
// =============================================================================

function RiskExposureMeter({ riskExposure }: { riskExposure: number }) {
  const riskPercent = riskExposure * 100;
  const riskLabel =
    riskExposure < 0.25
      ? 'Low Risk'
      : riskExposure < 0.5
        ? 'Medium Risk'
        : riskExposure < 0.75
          ? 'High Risk'
          : 'Extreme Risk';
  const riskColor =
    riskExposure < 0.25
      ? 'text-green-400'
      : riskExposure < 0.5
        ? 'text-yellow-400'
        : riskExposure < 0.75
          ? 'text-orange-400'
          : 'text-red-400';
  const barColor =
    riskExposure < 0.25
      ? 'bg-green-500'
      : riskExposure < 0.5
        ? 'bg-yellow-500'
        : riskExposure < 0.75
          ? 'bg-orange-500'
          : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs uppercase tracking-wider text-gray-400">Risk Exposure</span>
        <span className={`text-sm font-medium ${riskColor}`}>{riskLabel}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${riskPercent}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 text-right">{riskPercent.toFixed(0)}%</div>
    </div>
  );
}

// =============================================================================
// MAIN PORTFOLIO ANALYTICS COMPONENT
// =============================================================================

export default function PortfolioAnalytics({
  buildings,
  currentGameDay,
  onPurchaseHedge,
  activeHedges = [],
  className = '',
}: PortfolioAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'distribution' | 'bonuses' | 'hedging'>('distribution');

  const portfolio = analyzePortfolio(buildings);
  const chainDist = getChainDistribution(buildings);
  const tierDist = getTierDistribution(buildings);
  const treasury = cryptoEconomy.getState().treasury;

  const handlePurchaseHedge = (hedge: AvailableHedge) => {
    if (onPurchaseHedge) {
      onPurchaseHedge(hedge);
    }
  };

  return (
    <div className={`bg-gray-800/90 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          📊 Portfolio Analytics
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('distribution')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'distribution'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Distribution
        </button>
        <button
          onClick={() => setActiveTab('bonuses')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'bonuses'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Diversity Bonus
        </button>
        <button
          onClick={() => setActiveTab('hedging')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'hedging'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Hedging
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Risk Exposure - Always visible */}
        <RiskExposureMeter riskExposure={portfolio.riskExposure} />

        {activeTab === 'distribution' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                Chain Distribution
              </h4>
              <ChainDistributionChart
                distribution={chainDist}
                totalCount={buildings.length}
              />
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                Tier Distribution
              </h4>
              <TierDistributionChart
                distribution={tierDist}
                totalCount={buildings.length}
              />
            </div>
          </div>
        )}

        {activeTab === 'bonuses' && <DiversityBonusPanel buildings={buildings} />}

        {activeTab === 'hedging' && (
          <HedgingPanel
            activeHedges={activeHedges}
            currentGameDay={currentGameDay}
            treasury={treasury}
            onPurchase={handlePurchaseHedge}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { DiversityBonusPanel, HedgingPanel, RiskExposureMeter };
