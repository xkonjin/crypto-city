/**
 * Crypto Building Panel
 * 
 * UI panel for selecting and placing crypto buildings.
 * Shows building categories with icons and info.
 * 
 * Adapted for IsoCity engine.
 */

'use client';

import React, { useState } from 'react';
import { 
  CryptoCategory, 
  CryptoBuildingDefinition 
} from '../../games/isocity/crypto/types';
import { 
  getCryptoBuildingsByCategory,
  CRYPTO_BUILDING_COUNT,
} from '../../games/isocity/crypto/buildings';
import { CRYPTO_CATEGORIES } from '../../games/isocity/crypto/buildingRegistry';

// =============================================================================
// TYPES
// =============================================================================

interface CryptoBuildingPanelProps {
  selectedBuilding: string | null;
  onSelectBuilding: (buildingId: string) => void;
  treasury: number;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const CATEGORY_INFO = {
  defi: { name: 'DeFi', icon: '🏦', color: 'from-blue-500 to-blue-600' },
  exchange: { name: 'Exchange', icon: '📈', color: 'from-green-500 to-green-600' },
  chain: { name: 'Chain', icon: '⛓️', color: 'from-purple-500 to-purple-600' },
  ct: { name: 'CT', icon: '🐦', color: 'from-sky-500 to-sky-600' },
  meme: { name: 'Meme', icon: '🐸', color: 'from-yellow-500 to-yellow-600' },
  plasma: { name: 'Plasma', icon: '⚡', color: 'from-pink-500 to-pink-600' },
};

// =============================================================================
// BUILDING CARD COMPONENT
// =============================================================================

interface BuildingCardProps {
  building: CryptoBuildingDefinition;
  isSelected: boolean;
  canAfford: boolean;
  onClick: () => void;
}

function BuildingCard({ building, isSelected, canAfford, onClick }: BuildingCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!canAfford}
      className={`
        relative w-full p-3 rounded-lg text-left transition-all
        ${isSelected 
          ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400' 
          : canAfford 
            ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500'
            : 'bg-gray-900/50 border border-gray-700/30 opacity-50 cursor-not-allowed'
        }
      `}
    >
      {/* Icon and name */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{building.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{building.name}</div>
          <div className="text-xs text-gray-400">
            {building.footprint.width}x{building.footprint.height}
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-mono ${canAfford ? 'text-amber-400' : 'text-red-400'}`}>
          ${building.cost.toLocaleString()}
        </span>
        {building.crypto && (
          <span className="text-gray-500">
            {building.crypto.tier}
          </span>
        )}
      </div>
      
      {/* Yield info */}
      {building.crypto?.effects?.yieldRate && (
        <div className="mt-1 text-xs text-green-400">
          +{building.crypto.effects.yieldRate} yield
        </div>
      )}
      
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      )}
    </button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CryptoBuildingPanel({
  selectedBuilding,
  onSelectBuilding,
  treasury,
  className = '',
}: CryptoBuildingPanelProps) {
  const [activeCategory, setActiveCategory] = useState<CryptoCategory>('defi');
  
  const buildings = getCryptoBuildingsByCategory(activeCategory);

  return (
    <div className={`bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Crypto Buildings</h3>
          <span className="text-xs text-gray-400">{CRYPTO_BUILDING_COUNT} total</span>
        </div>
      </div>
      
      {/* Category tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-700/50">
        {CRYPTO_CATEGORIES.map(category => {
          const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
          const isActive = activeCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`
                flex-shrink-0 px-4 py-2 flex items-center gap-1.5
                transition-all text-sm
                ${isActive 
                  ? 'bg-gradient-to-r ' + info.color + ' text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }
              `}
            >
              <span>{info.icon}</span>
              <span>{info.name}</span>
            </button>
          );
        })}
      </div>
      
      {/* Building grid */}
      <div className="p-3 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {buildings.map(building => (
            <BuildingCard
              key={building.id}
              building={building}
              isSelected={selectedBuilding === building.id}
              canAfford={treasury >= building.cost}
              onClick={() => onSelectBuilding(building.id)}
            />
          ))}
        </div>
        
        {buildings.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No buildings in this category
          </div>
        )}
      </div>
      
      {/* Selected building details */}
      {selectedBuilding && (
        <SelectedBuildingInfo 
          buildingId={selectedBuilding} 
          buildings={buildings}
        />
      )}
    </div>
  );
}

// =============================================================================
// SELECTED BUILDING INFO
// =============================================================================

function SelectedBuildingInfo({ 
  buildingId, 
  buildings 
}: { 
  buildingId: string;
  buildings: CryptoBuildingDefinition[];
}) {
  const building = buildings.find(b => b.id === buildingId);
  if (!building?.crypto) return null;
  
  const { crypto } = building;
  const effects = crypto.effects;

  return (
    <div className="border-t border-gray-700/50 p-4 bg-gray-800/50">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{building.icon}</span>
        <div>
          <div className="font-bold">{building.name}</div>
          <div className="text-xs text-gray-400">
            {crypto.protocol || crypto.chain || 'Crypto'}
          </div>
        </div>
      </div>
      
      {crypto.description && (
        <p className="text-sm text-gray-400 mb-3">
          {crypto.description}
        </p>
      )}
      
      {effects && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {effects.yieldRate && (
            <div className="flex justify-between">
              <span className="text-gray-500">Yield:</span>
              <span className="text-green-400">+{effects.yieldRate}/day</span>
            </div>
          )}
          {effects.stakingBonus && effects.stakingBonus > 1 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Staking:</span>
              <span className="text-blue-400">{effects.stakingBonus}x</span>
            </div>
          )}
          {effects.zoneRadius && (
            <div className="flex justify-between">
              <span className="text-gray-500">Radius:</span>
              <span className="text-purple-400">{effects.zoneRadius} tiles</span>
            </div>
          )}
          {effects.volatility !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-500">Volatility:</span>
              <span className="text-yellow-400">{(effects.volatility * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}
      
      {/* Synergies */}
      {effects?.chainSynergy && effects.chainSynergy.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="text-xs text-gray-500 mb-1">Chain synergies:</div>
          <div className="flex flex-wrap gap-1">
            {effects.chainSynergy.map(chain => (
              <span 
                key={chain}
                className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs"
              >
                {chain}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

