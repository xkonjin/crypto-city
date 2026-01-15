/**
 * EconomyStatsPanel - Global NPC Economy Statistics Dashboard
 * 
 * Displays comprehensive statistics about the X402-enabled NPC economy:
 * - Total circulating USDT₮
 * - Daily transaction volume
 * - Number of funded wallets
 * - Top earners and spenders
 * 
 * "A city's true economy isn't measured in GDP, but in how many
 * NPCs can afford their morning Copium Coffee."
 * — The Hitchhiker's Guide to Crypto City
 */

'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Wallet,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  Gift,
  Briefcase,
} from 'lucide-react';
import { formatUnits } from 'viem';
import type { NPCTransaction } from '@/lib/npc/x402/types';

// =============================================================================
// TYPES
// =============================================================================

interface EconomyStatsPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel is closed */
  onClose: () => void;
  /** Wallet statistics */
  walletStats: {
    totalWallets: number;
    fundedWallets: number;
    totalCirculating: bigint;
  };
  /** Transaction statistics */
  transactionStats: {
    totalTransactions: number;
    totalVolume: bigint;
    mostPopularService: string | null;
    mostPopularItem: string | null;
  };
  /** Gift statistics */
  giftStats: {
    totalGifts: number;
    averageReaction: number;
    mostPopularGift: string | null;
  };
  /** Service statistics */
  serviceStats: {
    totalServices: number;
    npcsWithServices: number;
  };
  /** Top earners (NPC IDs with their earnings) */
  topEarners?: Array<{ npcId: string; npcName: string; earnings: bigint }>;
  /** Top spenders (NPC IDs with their spending) */
  topSpenders?: Array<{ npcId: string; npcName: string; spending: bigint }>;
  /** Current game day */
  currentDay?: number;
  /** Recent transactions for display */
  recentTransactions?: NPCTransaction[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format bigint balance to human-readable string
 */
function formatBalance(amount: bigint): string {
  const formatted = formatUnits(amount, 6);
  const value = parseFloat(formatted);
  
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format large numbers with K/M suffix
 */
function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Get reaction emoji based on average score
 */
function getReactionEmoji(score: number): string {
  if (score >= 4.5) return '🤩';
  if (score >= 3.5) return '😊';
  if (score >= 2.5) return '😐';
  if (score >= 1.5) return '😕';
  return '😢';
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Stat card with icon
 */
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'text-primary',
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between mb-2">
        <Icon className={cn('size-5', color)} />
        {trend && (
          <span className={cn(
            'flex items-center text-xs',
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'
          )}>
            {trend === 'up' && <ArrowUpRight className="size-3" />}
            {trend === 'down' && <ArrowDownRight className="size-3" />}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <div className={cn('font-mono tabular-nums font-semibold text-lg', color)}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {subValue && (
          <div className="text-xs text-muted-foreground/70">{subValue}</div>
        )}
      </div>
    </Card>
  );
}

/**
 * Leaderboard item
 */
function LeaderboardItem({
  rank,
  name,
  value,
  type,
}: {
  rank: number;
  name: string;
  value: bigint;
  type: 'earner' | 'spender';
}) {
  const isTop = rank <= 3;
  const medals = ['🥇', '🥈', '🥉'];
  
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="w-6 text-center">
        {isTop ? medals[rank - 1] : <span className="text-xs text-muted-foreground">#{rank}</span>}
      </span>
      <span className="flex-1 truncate text-sm">{name}</span>
      <span className={cn(
        'font-mono text-sm',
        type === 'earner' ? 'text-green-400' : 'text-amber-400'
      )}>
        {formatBalance(value)}
      </span>
    </div>
  );
}

/**
 * Progress bar for services
 */
function ServiceBar({
  label,
  current,
  total,
}: {
  label: string;
  current: number;
  total: number;
}) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{current}/{total}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * EconomyStatsPanel - Economy overview dashboard
 */
export function EconomyStatsPanel({
  isOpen,
  onClose,
  walletStats,
  transactionStats,
  giftStats,
  serviceStats,
  topEarners = [],
  topSpenders = [],
  currentDay = 1,
}: EconomyStatsPanelProps) {
  // Calculate derived stats
  const avgTransactionSize = useMemo(() => {
    if (transactionStats.totalTransactions === 0) return BigInt(0);
    return transactionStats.totalVolume / BigInt(transactionStats.totalTransactions);
  }, [transactionStats]);

  const fundingRate = useMemo(() => {
    if (walletStats.totalWallets === 0) return 0;
    return (walletStats.fundedWallets / walletStats.totalWallets) * 100;
  }, [walletStats]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-dialog-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="size-5 text-purple-400" />
            NPC Economy Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard
              icon={DollarSign}
              label="Circulating USDT₮"
              value={formatBalance(walletStats.totalCirculating)}
              color="text-green-400"
            />
            <StatCard
              icon={Activity}
              label="Daily Volume"
              value={formatBalance(transactionStats.totalVolume)}
              subValue={`Day ${currentDay}`}
              color="text-blue-400"
            />
            <StatCard
              icon={Wallet}
              label="Funded Wallets"
              value={walletStats.fundedWallets}
              subValue={`${fundingRate.toFixed(0)}% of ${walletStats.totalWallets}`}
              color="text-amber-400"
            />
            <StatCard
              icon={TrendingUp}
              label="Transactions"
              value={formatCount(transactionStats.totalTransactions)}
              subValue={`Avg: ${formatBalance(avgTransactionSize)}`}
              color="text-purple-400"
            />
          </div>

          {/* Gift & Service Stats */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="size-4 text-pink-400" />
                <span className="text-sm font-medium">Gift Economy</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Gifts</span>
                  <span className="font-mono">{giftStats.totalGifts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Reaction</span>
                  <span>
                    {getReactionEmoji(giftStats.averageReaction)}
                    <span className="ml-1 font-mono text-xs">
                      {giftStats.averageReaction.toFixed(1)}/5
                    </span>
                  </span>
                </div>
                {giftStats.mostPopularGift && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Popular Gift</span>
                    <span className="text-xs truncate max-w-[100px]">
                      {giftStats.mostPopularGift}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="size-4 text-cyan-400" />
                <span className="text-sm font-medium">Services</span>
              </div>
              <div className="space-y-2">
                <ServiceBar
                  label="NPCs with Services"
                  current={serviceStats.npcsWithServices}
                  total={walletStats.totalWallets}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Services</span>
                  <span className="font-mono">{serviceStats.totalServices}</span>
                </div>
                {transactionStats.mostPopularService && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Top Service</span>
                    <span className="text-xs truncate max-w-[100px]">
                      {transactionStats.mostPopularService}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Leaderboards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Top Earners */}
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight className="size-4 text-green-400" />
                <span className="text-sm font-medium">Top Earners</span>
              </div>
              {topEarners.length > 0 ? (
                <div className="space-y-1">
                  {topEarners.slice(0, 5).map((earner, i) => (
                    <LeaderboardItem
                      key={earner.npcId}
                      rank={i + 1}
                      name={earner.npcName}
                      value={earner.earnings}
                      type="earner"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No earnings data yet
                </div>
              )}
            </Card>

            {/* Top Spenders */}
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownRight className="size-4 text-amber-400" />
                <span className="text-sm font-medium">Top Spenders</span>
              </div>
              {topSpenders.length > 0 ? (
                <div className="space-y-1">
                  {topSpenders.slice(0, 5).map((spender, i) => (
                    <LeaderboardItem
                      key={spender.npcId}
                      rank={i + 1}
                      name={spender.npcName}
                      value={spender.spending}
                      type="spender"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No spending data yet
                </div>
              )}
            </Card>
          </div>

          {/* Economy Health Indicator */}
          <Card className="p-3 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium mb-1">Economy Health</div>
                <div className="text-xs text-muted-foreground">
                  Based on transaction velocity and wallet distribution
                </div>
              </div>
              <div className="text-2xl">
                {fundingRate >= 80 && transactionStats.totalTransactions > 10 ? '💚' :
                 fundingRate >= 50 && transactionStats.totalTransactions > 5 ? '💛' :
                 '❤️'}
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EconomyStatsPanel;
