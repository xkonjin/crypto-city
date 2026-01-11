/**
 * Trade Panel Component (Issue #55)
 * 
 * Displays available trade opportunities and active trades.
 * Players can invest treasury in risky trades for potential returns.
 */

'use client';

import React from 'react';
import { cryptoEconomy } from '@/games/isocity/crypto';
import type { TradeOpportunity, ActiveTrade } from '@/games/isocity/crypto';

// =============================================================================
// TYPES
// =============================================================================

interface TradePanelProps {
  opportunities: TradeOpportunity[];
  activeTrades: ActiveTrade[];
  treasury: number;
  currentTick: number;
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
}

function getRiskColor(risk: number): string {
  if (risk < 0.2) return 'text-green-400';
  if (risk < 0.4) return 'text-lime-400';
  if (risk < 0.6) return 'text-yellow-400';
  if (risk < 0.8) return 'text-orange-400';
  return 'text-red-400';
}

function getRiskLabel(risk: number): string {
  if (risk < 0.2) return 'Safe';
  if (risk < 0.4) return 'Low Risk';
  if (risk < 0.6) return 'Medium';
  if (risk < 0.8) return 'High Risk';
  return 'Degen';
}

function getChainEmoji(chain: string): string {
  const emojis: Record<string, string> = {
    ethereum: '⟠',
    solana: '◎',
    arbitrum: '🔵',
    base: '🔵',
    polygon: '🟣',
    bnb: '🔶',
    avalanche: '🔺',
    optimism: '🔴',
  };
  return emojis[chain] || '⛓️';
}

// =============================================================================
// OPPORTUNITY CARD COMPONENT
// =============================================================================

interface OpportunityCardProps {
  opportunity: TradeOpportunity;
  canAfford: boolean;
  currentTick: number;
  onInvest: () => void;
}

function OpportunityCard({ opportunity, canAfford, currentTick, onInvest }: OpportunityCardProps) {
  const ticksRemaining = opportunity.expiresAt - currentTick;
  const secondsRemaining = Math.max(0, ticksRemaining * 5); // ~5 seconds per tick
  const minutesRemaining = Math.floor(secondsRemaining / 60);
  
  const potentialProfit = opportunity.cost * opportunity.potentialReturn - opportunity.cost;
  const expectedValue = opportunity.cost * opportunity.potentialReturn * (1 - opportunity.risk) - opportunity.cost * opportunity.risk;
  
  return (
    <div className="p-3 bg-gray-800/60 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getChainEmoji(opportunity.chain)}</span>
          <div>
            <div className="font-medium text-sm text-white">{opportunity.name}</div>
            <div className="text-[10px] text-gray-400 capitalize">{opportunity.chain}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Expires</div>
          <div className="text-sm font-mono text-amber-400">{minutesRemaining}m</div>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 mb-3">{opportunity.description}</div>
      
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div>
          <div className="text-[10px] text-gray-500 uppercase">Cost</div>
          <div className="text-sm font-mono text-amber-400">${formatNumber(opportunity.cost)}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase">Return</div>
          <div className="text-sm font-mono text-green-400">{opportunity.potentialReturn}x</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase">Risk</div>
          <div className={`text-sm font-medium ${getRiskColor(opportunity.risk)}`}>
            {getRiskLabel(opportunity.risk)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
        <div className="text-[10px] text-gray-500">
          <span className="text-gray-400">EV:</span>{' '}
          <span className={expectedValue >= 0 ? 'text-green-400' : 'text-red-400'}>
            {expectedValue >= 0 ? '+' : ''}${formatNumber(expectedValue)}
          </span>
        </div>
        <button
          onClick={onInvest}
          disabled={!canAfford}
          className={`
            px-4 py-1.5 rounded text-xs font-medium transition-colors
            ${canAfford
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {canAfford ? 'Invest' : 'Can\'t Afford'}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// ACTIVE TRADE CARD COMPONENT
// =============================================================================

interface ActiveTradeCardProps {
  trade: ActiveTrade;
  currentTick: number;
}

function ActiveTradeCard({ trade, currentTick }: ActiveTradeCardProps) {
  const ticksRemaining = trade.resolvesAt - currentTick;
  const progress = Math.min(100, ((currentTick - trade.startedAt) / trade.opportunity.duration) * 100);
  const secondsRemaining = Math.max(0, ticksRemaining * 5);
  
  return (
    <div className="p-3 bg-gray-800/60 rounded-lg border border-amber-500/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="animate-pulse">⏳</span>
          <span className="font-medium text-sm text-white">{trade.opportunity.name}</span>
        </div>
        <span className="text-xs font-mono text-gray-400">{Math.floor(secondsRemaining)}s</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-2">
        <div>
          <div className="text-gray-500">Invested</div>
          <div className="text-amber-400">${formatNumber(trade.investedAmount)}</div>
        </div>
        <div>
          <div className="text-gray-500">Potential</div>
          <div className="text-green-400">${formatNumber(trade.investedAmount * trade.opportunity.potentialReturn)}</div>
        </div>
        <div>
          <div className="text-gray-500">Risk</div>
          <div className={getRiskColor(trade.opportunity.risk)}>{Math.round(trade.opportunity.risk * 100)}%</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TradePanel({
  opportunities,
  activeTrades,
  treasury,
  currentTick,
  className = '',
}: TradePanelProps) {
  const handleInvest = (opportunityId: string) => {
    cryptoEconomy.investInTrade(opportunityId);
  };
  
  const hasOpportunities = opportunities.length > 0;
  const hasActiveTrades = activeTrades.length > 0;
  
  if (!hasOpportunities && !hasActiveTrades) {
    return (
      <div className={`p-4 bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700/50 ${className}`} data-testid="trade-panel">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📊</span>
          <span className="font-medium text-white">Trade Opportunities</span>
        </div>
        <div className="text-sm text-gray-400 text-center py-4">
          No opportunities available right now.
          <br />
          <span className="text-xs">New trades appear periodically.</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`p-4 bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700/50 ${className}`} data-testid="trade-panel">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <span className="font-medium text-white">Trade Opportunities</span>
        </div>
        <div className="text-xs text-gray-400">
          Treasury: <span className="text-amber-400 font-mono">${formatNumber(treasury)}</span>
        </div>
      </div>
      
      {/* Available opportunities */}
      {hasOpportunities && (
        <div className="space-y-2 mb-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Available</div>
          {opportunities.map(opp => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              canAfford={treasury >= opp.cost}
              currentTick={currentTick}
              onInvest={() => handleInvest(opp.id)}
            />
          ))}
        </div>
      )}
      
      {/* Active trades */}
      {hasActiveTrades && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Active Trades</div>
          {activeTrades.map((trade, idx) => (
            <ActiveTradeCard
              key={`${trade.opportunity.id}_${idx}`}
              trade={trade}
              currentTick={currentTick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
