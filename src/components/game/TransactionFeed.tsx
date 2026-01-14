/**
 * TransactionFeed - Real-time NPC Transaction Feed
 * 
 * Displays a scrollable list of recent NPC-to-NPC transactions including:
 * - Service exchanges
 * - Gift giving
 * - Salary payments
 * - Item purchases
 * 
 * "Every transaction tells a story. Most of them are 'NPC bought ramen again.'"
 * — The Hitchhiker's Guide to Crypto City
 */

'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowRight,
  Gift,
  Coffee,
  Briefcase,
  DollarSign,
  ShoppingBag,
  MessageSquare,
  Shield,
  Paintbrush,
  Home,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatUnits } from 'viem';
import type { NPCTransaction } from '@/lib/npc/x402/types';
import type { NPCTransactionType } from '@/lib/npc/x402/constants';

// =============================================================================
// TYPES
// =============================================================================

interface TransactionFeedProps {
  /** List of transactions to display */
  transactions: NPCTransaction[];
  /** Map of NPC IDs to names */
  npcNames?: Map<string, string>;
  /** Maximum number of transactions to show */
  maxItems?: number;
  /** Whether to show timestamps */
  showTimestamps?: boolean;
  /** Whether to show transaction hashes */
  showTxHash?: boolean;
  /** Optional height constraint */
  height?: number | string;
  /** Optional title */
  title?: string;
  /** Callback when clicking a transaction */
  onTransactionClick?: (tx: NPCTransaction) => void;
  /** Optional filter by NPC ID */
  filterByNpc?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Icons for transaction types */
const TX_TYPE_ICONS: Record<NPCTransactionType, React.ElementType> = {
  salary: DollarSign,
  rent: Home,
  food: Coffee,
  drink: Coffee,
  entertainment: Paintbrush,
  tip: MessageSquare,
  trade: ShoppingBag,
  service: Briefcase,
  gift: Gift,
  tax: Shield,
};

/** Colors for transaction types */
const TX_TYPE_COLORS: Record<NPCTransactionType, string> = {
  salary: 'text-green-400 bg-green-400/10',
  rent: 'text-amber-400 bg-amber-400/10',
  food: 'text-orange-400 bg-orange-400/10',
  drink: 'text-cyan-400 bg-cyan-400/10',
  entertainment: 'text-pink-400 bg-pink-400/10',
  tip: 'text-purple-400 bg-purple-400/10',
  trade: 'text-blue-400 bg-blue-400/10',
  service: 'text-indigo-400 bg-indigo-400/10',
  gift: 'text-rose-400 bg-rose-400/10',
  tax: 'text-red-400 bg-red-400/10',
};

/** Human-readable transaction type labels */
const TX_TYPE_LABELS: Record<NPCTransactionType, string> = {
  salary: 'Salary',
  rent: 'Rent',
  food: 'Food',
  drink: 'Drink',
  entertainment: 'Fun',
  tip: 'Tip',
  trade: 'Trade',
  service: 'Service',
  gift: 'Gift',
  tax: 'Tax',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format transaction amount for display
 */
function formatAmount(amount: bigint): string {
  const formatted = formatUnits(amount, 6);
  const value = parseFloat(formatted);
  
  if (value >= 1) {
    return `$${value.toFixed(2)}`;
  } else if (value >= 0.01) {
    return `$${value.toFixed(3)}`;
  }
  return `$${value.toFixed(4)}`;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60_000) return 'Just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate transaction hash for display
 */
function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Get NPC name with fallback
 */
function getNpcName(npcId: string, npcNames?: Map<string, string>): string {
  return npcNames?.get(npcId) ?? npcId.slice(0, 8);
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Single transaction item
 */
function TransactionItem({
  transaction,
  npcNames,
  showTimestamp,
  showTxHash,
  onClick,
}: {
  transaction: NPCTransaction;
  npcNames?: Map<string, string>;
  showTimestamp: boolean;
  showTxHash: boolean;
  onClick?: () => void;
}) {
  const Icon = TX_TYPE_ICONS[transaction.type] ?? Briefcase;
  const colorClass = TX_TYPE_COLORS[transaction.type] ?? 'text-gray-400 bg-gray-400/10';
  const label = TX_TYPE_LABELS[transaction.type] ?? transaction.type;
  
  const fromName = getNpcName(transaction.fromNpcId, npcNames);
  const toName = getNpcName(transaction.toNpcId, npcNames);
  
  return (
    <div
      className={cn(
        'flex items-center gap-2 py-2 px-3 rounded-lg transition-colors',
        onClick ? 'hover:bg-muted/50 cursor-pointer' : ''
      )}
      onClick={onClick}
    >
      {/* Type Icon */}
      <div className={cn('p-1.5 rounded-md', colorClass)}>
        <Icon className="size-3.5" />
      </div>
      
      {/* Transaction Details */}
      <div className="flex-1 min-w-0">
        {/* From -> To */}
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium truncate max-w-[80px]">{fromName}</span>
          <ArrowRight className="size-3 text-muted-foreground shrink-0" />
          <span className="font-medium truncate max-w-[80px]">{toName}</span>
        </div>
        
        {/* Reason */}
        {transaction.reason && (
          <div className="text-xs text-muted-foreground truncate">
            {transaction.reason}
          </div>
        )}
      </div>
      
      {/* Amount & Time */}
      <div className="text-right shrink-0">
        <div className={cn('font-mono text-sm', colorClass.split(' ')[0])}>
          {formatAmount(transaction.amount)}
        </div>
        {showTimestamp && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {formatTimestamp(transaction.timestamp)}
          </div>
        )}
      </div>
      
      {/* Tx Hash Link */}
      {showTxHash && transaction.txHash && (
        <a
          href={`https://testnet.explorer.plasma.to/tx/${transaction.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded hover:bg-muted transition-colors"
          onClick={(e) => e.stopPropagation()}
          title="View on Explorer"
        >
          <ExternalLink className="size-3.5 text-muted-foreground" />
        </a>
      )}
    </div>
  );
}

/**
 * Transaction type filter pill
 */
function TypeFilter({
  type,
  isActive,
  onClick,
}: {
  type: NPCTransactionType | 'all';
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = type === 'all' ? DollarSign : TX_TYPE_ICONS[type];
  const label = type === 'all' ? 'All' : TX_TYPE_LABELS[type];
  const colorClass = type === 'all' 
    ? 'text-primary bg-primary/10'
    : TX_TYPE_COLORS[type];
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors',
        isActive ? colorClass : 'text-muted-foreground bg-muted/30 hover:bg-muted/50'
      )}
    >
      <Icon className="size-3" />
      {label}
    </button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * TransactionFeed - Scrollable list of NPC transactions
 */
export function TransactionFeed({
  transactions,
  npcNames,
  maxItems = 50,
  showTimestamps = true,
  showTxHash = false,
  height = 400,
  title = 'Transaction Feed',
  onTransactionClick,
  filterByNpc,
  emptyMessage = 'No transactions yet',
  className,
}: TransactionFeedProps) {
  const [activeFilter, setActiveFilter] = React.useState<NPCTransactionType | 'all'>('all');
  
  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // Filter by NPC if specified
    if (filterByNpc) {
      filtered = filtered.filter(
        tx => tx.fromNpcId === filterByNpc || tx.toNpcId === filterByNpc
      );
    }
    
    // Filter by type if not "all"
    if (activeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === activeFilter);
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    // Limit results
    return filtered.slice(0, maxItems);
  }, [transactions, filterByNpc, activeFilter, maxItems]);

  // Get unique transaction types for filter pills
  const availableTypes = useMemo(() => {
    const types = new Set<NPCTransactionType>();
    transactions.forEach(tx => types.add(tx.type));
    return Array.from(types);
  }, [transactions]);

  return (
    <Card className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">{title}</h3>
          <span className="text-xs text-muted-foreground">
            {filteredTransactions.length} transactions
          </span>
        </div>
        
        {/* Filter Pills */}
        {availableTypes.length > 1 && (
          <div className="flex flex-wrap gap-1">
            <TypeFilter
              type="all"
              isActive={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />
            {availableTypes.map(type => (
              <TypeFilter
                key={type}
                type={type}
                isActive={activeFilter === type}
                onClick={() => setActiveFilter(type)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Transaction List */}
      <ScrollArea style={{ height }}>
        <div className="p-1">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                npcNames={npcNames}
                showTimestamp={showTimestamps}
                showTxHash={showTxHash}
                onClick={onTransactionClick ? () => onTransactionClick(tx) : undefined}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <DollarSign className="size-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

/**
 * TransactionFeedCompact - Smaller version for embedding in other panels
 */
export function TransactionFeedCompact({
  transactions,
  npcNames,
  maxItems = 5,
  filterByNpc,
  emptyMessage = 'No transactions',
}: {
  transactions: NPCTransaction[];
  npcNames?: Map<string, string>;
  maxItems?: number;
  filterByNpc?: string;
  emptyMessage?: string;
}) {
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    if (filterByNpc) {
      filtered = filtered.filter(
        tx => tx.fromNpcId === filterByNpc || tx.toNpcId === filterByNpc
      );
    }
    
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    return filtered.slice(0, maxItems);
  }, [transactions, filterByNpc, maxItems]);

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredTransactions.map((tx) => {
        const Icon = TX_TYPE_ICONS[tx.type] ?? Briefcase;
        const colorClass = TX_TYPE_COLORS[tx.type] ?? 'text-gray-400';
        const fromName = getNpcName(tx.fromNpcId, npcNames);
        const toName = getNpcName(tx.toNpcId, npcNames);
        
        return (
          <div key={tx.id} className="flex items-center gap-2 text-xs">
            <Icon className={cn('size-3', colorClass.split(' ')[0])} />
            <span className="truncate flex-1">
              {fromName} → {toName}
            </span>
            <span className={cn('font-mono', colorClass.split(' ')[0])}>
              {formatAmount(tx.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default TransactionFeed;
