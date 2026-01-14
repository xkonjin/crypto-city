/**
 * CategoryCard Component
 * 
 * Card displaying a building category with icon, name, building count, and avg yield.
 * Issue #203: Progressive Disclosure Level 1.
 */

'use client';

import React from 'react';
import { CryptoCategory, CryptoBuildingDefinition } from '../../games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

interface CategoryCardProps {
  category: CryptoCategory;
  name: string;
  icon: string;
  color: string;
  buildings: CryptoBuildingDefinition[];
  isExpanded: boolean;
  onClick: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function calculateAvgYield(buildings: CryptoBuildingDefinition[]): number {
  if (buildings.length === 0) return 0;
  const totalYield = buildings.reduce((sum, b) => {
    const yieldRate = b.crypto?.effects?.yieldRate ?? 0;
    return sum + yieldRate;
  }, 0);
  return Math.round(totalYield / buildings.length);
}

function calculateAvgRisk(buildings: CryptoBuildingDefinition[]): number {
  if (buildings.length === 0) return 0;
  const totalRisk = buildings.reduce((sum, b) => {
    const risk = b.crypto?.effects?.rugRisk ?? 0;
    return sum + risk;
  }, 0);
  return totalRisk / buildings.length;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function CategoryCard({
  category,
  name,
  icon,
  color,
  buildings,
  isExpanded,
  onClick,
}: CategoryCardProps) {
  const avgYield = calculateAvgYield(buildings);
  const avgRisk = calculateAvgRisk(buildings);
  const buildingCount = buildings.length;

  // Get risk color
  const getRiskColor = (risk: number) => {
    if (risk < 0.01) return 'text-green-400';
    if (risk < 0.05) return 'text-yellow-400';
    if (risk < 0.1) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <button
      data-testid="category-card"
      data-category={category}
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl text-left transition-all duration-200
        ${isExpanded 
          ? `bg-gradient-to-br ${color} ring-2 ring-white/20` 
          : `bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600`
        }
      `}
    >
      {/* Header with Icon and Name */}
      <div className="flex items-center gap-3 mb-3">
        <span 
          data-testid="category-icon" 
          className="text-3xl"
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div 
            data-testid="category-name" 
            className="font-bold text-lg truncate"
          >
            {name}
          </div>
          <div 
            data-testid="category-building-count" 
            className="text-xs text-gray-400"
          >
            {buildingCount} building{buildingCount !== 1 ? 's' : ''}
          </div>
        </div>
        {/* Expand Arrow */}
        <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        {/* Average Yield */}
        <div data-testid="category-avg-yield" className="flex items-center gap-1">
          <span className="text-gray-400">Yield:</span>
          <span className="text-green-400 font-medium">+{avgYield}/tick</span>
        </div>

        {/* Average Risk */}
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Risk:</span>
          <span className={`${getRiskColor(avgRisk)} font-medium`}>
            {(avgRisk * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </button>
  );
}
