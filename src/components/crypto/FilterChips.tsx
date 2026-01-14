/**
 * FilterChips Component
 * 
 * Filter system for crypto buildings with chain, tier, and risk filters.
 * Issue #204: Add filter chips above the building list.
 */

'use client';

import React from 'react';
import { CryptoChain, CryptoTier } from '../../games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

export type RiskFilter = 'all' | 'low' | 'medium' | 'high' | 'degen';

export interface FilterState {
  chains: CryptoChain[];
  tiers: CryptoTier[];
  risks: RiskFilter[];
}

interface FilterChipsProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  buildingCounts: {
    chains: Record<string, number>;
    tiers: Record<string, number>;
    risks: Record<string, number>;
  };
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CHAIN_OPTIONS: { value: CryptoChain | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'solana', label: 'Solana' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'base', label: 'Base' },
  { value: 'polygon', label: 'Polygon' },
];

const TIER_OPTIONS: { value: CryptoTier | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'retail', label: 'Retail' },
  { value: 'degen', label: 'Degen' },
  { value: 'whale', label: 'Whale' },
  { value: 'institution', label: 'Institution' },
];

const RISK_OPTIONS: { value: RiskFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'degen', label: 'Degen' },
];

// =============================================================================
// FILTER CHIP COMPONENT
// =============================================================================

interface ChipProps {
  label: string;
  count?: number;
  isSelected: boolean;
  onClick: () => void;
  testId: string;
  colorClass?: string;
}

function Chip({ label, count, isSelected, onClick, testId, colorClass }: ChipProps) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        transition-all duration-200
        ${isSelected 
          ? `${colorClass || 'bg-blue-600'} text-white ring-2 ring-blue-400/50 selected active` 
          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
        }
      `}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`
          px-1.5 rounded-full text-[10px]
          ${isSelected ? 'bg-white/20' : 'bg-gray-600'}
        `}>
          {count}
        </span>
      )}
    </button>
  );
}

// =============================================================================
// FILTER SECTION COMPONENT
// =============================================================================

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  testId: string;
}

function FilterSection({ title, children, testId }: FilterSectionProps) {
  return (
    <div data-testid={testId} className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function FilterChips({ 
  filters, 
  onFiltersChange, 
  buildingCounts,
  className = '' 
}: FilterChipsProps) {
  // Toggle chain filter
  const toggleChain = (chain: CryptoChain | 'all') => {
    if (chain === 'all') {
      onFiltersChange({ ...filters, chains: [] });
    } else {
      const newChains = filters.chains.includes(chain)
        ? filters.chains.filter(c => c !== chain)
        : [...filters.chains, chain];
      onFiltersChange({ ...filters, chains: newChains });
    }
  };

  // Toggle tier filter
  const toggleTier = (tier: CryptoTier | 'all') => {
    if (tier === 'all') {
      onFiltersChange({ ...filters, tiers: [] });
    } else {
      const newTiers = filters.tiers.includes(tier)
        ? filters.tiers.filter(t => t !== tier)
        : [...filters.tiers, tier];
      onFiltersChange({ ...filters, tiers: newTiers });
    }
  };

  // Toggle risk filter
  const toggleRisk = (risk: RiskFilter) => {
    if (risk === 'all') {
      onFiltersChange({ ...filters, risks: [] });
    } else {
      const newRisks = filters.risks.includes(risk)
        ? filters.risks.filter(r => r !== risk)
        : [...filters.risks, risk];
      onFiltersChange({ ...filters, risks: newRisks });
    }
  };

  const isChainSelected = (chain: CryptoChain | 'all') => {
    if (chain === 'all') return filters.chains.length === 0;
    return filters.chains.includes(chain);
  };

  const isTierSelected = (tier: CryptoTier | 'all') => {
    if (tier === 'all') return filters.tiers.length === 0;
    return filters.tiers.includes(tier);
  };

  const isRiskSelected = (risk: RiskFilter) => {
    if (risk === 'all') return filters.risks.length === 0;
    return filters.risks.includes(risk);
  };

  const getChainCount = (chain: CryptoChain | 'all') => {
    if (chain === 'all') {
      return Object.values(buildingCounts.chains).reduce((a, b) => a + b, 0);
    }
    return buildingCounts.chains[chain] || 0;
  };

  const getTierCount = (tier: CryptoTier | 'all') => {
    if (tier === 'all') {
      return Object.values(buildingCounts.tiers).reduce((a, b) => a + b, 0);
    }
    return buildingCounts.tiers[tier] || 0;
  };

  const getRiskCount = (risk: RiskFilter) => {
    if (risk === 'all') {
      return Object.values(buildingCounts.risks).reduce((a, b) => a + b, 0);
    }
    return buildingCounts.risks[risk] || 0;
  };

  return (
    <div data-testid="filter-chips" className={`space-y-3 ${className}`}>
      {/* Chain Filters */}
      <FilterSection title="Chain" testId="chain-filters">
        {CHAIN_OPTIONS.map(({ value, label }) => (
          <Chip
            key={value}
            label={label}
            count={getChainCount(value)}
            isSelected={isChainSelected(value)}
            onClick={() => toggleChain(value)}
            testId={`chain-filter-${value}`}
            colorClass="bg-purple-600"
          />
        ))}
      </FilterSection>

      {/* Tier Filters */}
      <FilterSection title="Tier" testId="tier-filters">
        {TIER_OPTIONS.map(({ value, label }) => (
          <Chip
            key={value}
            label={label}
            count={getTierCount(value)}
            isSelected={isTierSelected(value)}
            onClick={() => toggleTier(value)}
            testId={`tier-filter-${value}`}
            colorClass="bg-amber-600"
          />
        ))}
      </FilterSection>

      {/* Risk Filters */}
      <FilterSection title="Risk" testId="risk-filters">
        {RISK_OPTIONS.map(({ value, label }) => {
          const colorMap: Record<RiskFilter, string> = {
            all: 'bg-blue-600',
            low: 'bg-green-600',
            medium: 'bg-yellow-600',
            high: 'bg-orange-600',
            degen: 'bg-red-600',
          };
          return (
            <Chip
              key={value}
              label={label}
              count={getRiskCount(value)}
              isSelected={isRiskSelected(value)}
              onClick={() => toggleRisk(value)}
              testId={`risk-filter-${value}`}
              colorClass={colorMap[value]}
            />
          );
        })}
      </FilterSection>
    </div>
  );
}
