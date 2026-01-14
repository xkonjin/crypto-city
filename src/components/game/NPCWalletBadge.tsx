/**
 * NPCWalletBadge - Compact wallet balance display for NPCs
 * 
 * A small badge showing an NPC's USDT₮ balance with color-coded wealth indicator.
 * Green = wealthy (>$1), Yellow = moderate ($0.25-$1), Red = poor (<$0.25)
 * 
 * "In Crypto City, your net worth is always on display. Privacy is so 2019."
 * — The Hitchhiker's Guide to Crypto City
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Wallet } from 'lucide-react';
import { formatUnits } from 'viem';

// =============================================================================
// TYPES
// =============================================================================

interface NPCWalletBadgeProps {
  /** Balance in atomic USDT₮ units (6 decimals) */
  balance: bigint;
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the wallet icon */
  showIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show full precision */
  fullPrecision?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Thresholds in atomic units (6 decimals) */
const WEALTH_THRESHOLDS = {
  rich: BigInt(1_000_000),    // $1.00
  moderate: BigInt(250_000),   // $0.25
};

/** Colors for wealth levels */
const WEALTH_COLORS = {
  rich: 'text-green-400 bg-green-400/10 border-green-400/30',
  moderate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  poor: 'text-red-400 bg-red-400/10 border-red-400/30',
};

/** Icon colors */
const ICON_COLORS = {
  rich: 'text-green-400',
  moderate: 'text-yellow-400',
  poor: 'text-red-400',
};

/** Size variants */
const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-sm px-2 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const ICON_SIZES = {
  sm: 'size-3',
  md: 'size-4',
  lg: 'size-5',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine wealth level based on balance
 */
function getWealthLevel(balance: bigint): 'rich' | 'moderate' | 'poor' {
  if (balance >= WEALTH_THRESHOLDS.rich) return 'rich';
  if (balance >= WEALTH_THRESHOLDS.moderate) return 'moderate';
  return 'poor';
}

/**
 * Format balance for display
 */
function formatBalance(balance: bigint, fullPrecision: boolean): string {
  const formatted = formatUnits(balance, 6);
  const value = parseFloat(formatted);
  
  if (fullPrecision) {
    return `$${value.toFixed(6)}`;
  }
  
  // Smart formatting based on amount
  if (value >= 1) {
    return `$${value.toFixed(2)}`;
  } else if (value >= 0.01) {
    return `$${value.toFixed(3)}`;
  } else if (value > 0) {
    return `$${value.toFixed(4)}`;
  }
  
  return '$0.00';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * NPCWalletBadge - Displays NPC wallet balance with wealth indicator
 */
export function NPCWalletBadge({
  balance,
  size = 'md',
  showIcon = true,
  className,
  fullPrecision = false,
}: NPCWalletBadgeProps) {
  const wealthLevel = getWealthLevel(balance);
  const formattedBalance = formatBalance(balance, fullPrecision);
  
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-mono tabular-nums',
        SIZE_CLASSES[size],
        WEALTH_COLORS[wealthLevel],
        className
      )}
      title={`USDT₮ Balance: ${formatBalance(balance, true)}`}
    >
      {showIcon && (
        <Wallet className={cn(ICON_SIZES[size], ICON_COLORS[wealthLevel])} />
      )}
      <span>{formattedBalance}</span>
    </div>
  );
}

/**
 * NPCWalletBadgeCompact - Even smaller variant for tight spaces
 */
export function NPCWalletBadgeCompact({
  balance,
  className,
}: {
  balance: bigint;
  className?: string;
}) {
  const wealthLevel = getWealthLevel(balance);
  const formatted = formatUnits(balance, 6);
  const value = parseFloat(formatted);
  
  // Very compact format
  let display: string;
  if (value >= 1) {
    display = `$${value.toFixed(1)}`;
  } else {
    display = `¢${(value * 100).toFixed(0)}`;
  }
  
  return (
    <span
      className={cn(
        'font-mono text-xs',
        ICON_COLORS[wealthLevel],
        className
      )}
      title={`$${value.toFixed(6)} USDT₮`}
    >
      {display}
    </span>
  );
}

export default NPCWalletBadge;
