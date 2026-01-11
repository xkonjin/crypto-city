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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import TimeLimitedBanner from '@/components/game/TimeLimitedBanner';
import type { TimeLimitedOffer } from '@/lib/timeLimitedBuildings';

// =============================================================================
// TYPES
// =============================================================================

interface CryptoBuildingPanelProps {
  selectedBuilding: string | null;
  onSelectBuilding: (buildingId: string, offer?: TimeLimitedOffer) => void;
  treasury: number;
  onOpenPortfolio?: () => void; // Issue #62: Portfolio analytics button
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
  stablecoin: { name: 'Stablecoin', icon: '💵', color: 'from-emerald-500 to-emerald-600' },
  infrastructure: { name: 'Infrastructure', icon: '🏗️', color: 'from-slate-500 to-slate-600' },
  legends: { name: 'Legends', icon: '🗿', color: 'from-amber-500 to-orange-600' },
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
  const crypto = building.crypto;
  const effects = crypto?.effects;
  
  // Format risk level with detailed explanations
  const getRiskLevel = (rugRisk: number | undefined) => {
    if (!rugRisk || rugRisk === 0) return { 
      label: 'Very Low', 
      color: 'text-green-400',
      explanation: 'Battle-tested protocol with near-zero historical exploits.'
    };
    if (rugRisk < 0.01) return { 
      label: 'Low', 
      color: 'text-green-400',
      explanation: 'Well-audited with strong track record. Safe choice.'
    };
    if (rugRisk < 0.05) return { 
      label: 'Medium', 
      color: 'text-yellow-400',
      explanation: 'Newer protocol or complex mechanics. Monitor closely.'
    };
    if (rugRisk < 0.1) return { 
      label: 'High', 
      color: 'text-orange-400',
      explanation: 'Experimental or unaudited. High yield = high risk.'
    };
    return { 
      label: 'Degen', 
      color: 'text-red-400',
      explanation: 'YOLO territory. Expect to lose this eventually.'
    };
  };
  
  const risk = getRiskLevel(effects?.rugRisk);
  
  // Build tooltip content
  const tooltipContent = (
    <div className="space-y-2 max-w-xs">
      <div className="font-semibold text-base">{building.name}</div>
      
      {/* Tier & Size */}
      <div className="flex gap-4 text-xs text-gray-400">
        {crypto?.tier && <span>Tier: {crypto.tier}</span>}
        <span>Size: {building.footprint.width}x{building.footprint.height}</span>
      </div>
      
      {/* Yield Stats */}
      {effects && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-t border-gray-700 pt-2">
          {effects.yieldRate !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-400">Yield:</span>
              <span className="text-green-400">+{effects.yieldRate}/tick</span>
            </div>
          )}
          {effects.rugRisk !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Risk:</span>
                <span className={risk.color}>{risk.label} ({(effects.rugRisk * 100).toFixed(1)}% per cycle)</span>
              </div>
              <div className="text-xs text-gray-500 italic">{risk.explanation}</div>
              {effects.rugRisk > 0.02 && (
                <div className="text-xs text-red-400/80">
                  ⚠️ If rugged: Building destroyed, -10% treasury
                </div>
              )}
            </div>
          )}
          {effects.populationBoost !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-400">Pop:</span>
              <span className="text-blue-400">+{effects.populationBoost}</span>
            </div>
          )}
          {effects.happinessEffect !== undefined && effects.happinessEffect !== 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Happy:</span>
              <span className="text-pink-400">+{effects.happinessEffect}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Sentiment Immune Flag (Issue #62) */}
      {effects?.sentimentImmune && (
        <div className="text-xs border-t border-gray-700 pt-2">
          <div className="flex items-center gap-1 text-emerald-400">
            <span>🛡️</span>
            <span>Sentiment Immune</span>
          </div>
          <div className="text-gray-500 text-[10px]">
            Yields unaffected by market sentiment swings
          </div>
        </div>
      )}
      
      {/* Synergies */}
      {effects && (effects.chainSynergy?.length > 0 || effects.categorySynergy?.length > 0) && (
        <div className="text-xs border-t border-gray-700 pt-2 space-y-1">
          <div className="text-gray-500 italic mb-1">
            💡 Place near similar buildings for yield bonus (up to +50%)
          </div>
          {effects.chainSynergy?.length > 0 && (
            <div>
              <span className="text-gray-400">Chain synergy: </span>
              <span className="text-purple-400">{effects.chainSynergy.join(', ')}</span>
            </div>
          )}
          {effects.categorySynergy?.length > 0 && (
            <div>
              <span className="text-gray-400">Category synergy: </span>
              <span className="text-purple-400">{effects.categorySynergy.join(', ')}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Protection & Insurance (Issue #57) */}
      {effects && (effects.protectionRadius || effects.insuranceRadius) && (
        <div className="text-xs border-t border-gray-700 pt-2 space-y-1 bg-emerald-900/20 p-2 rounded">
          <div className="text-emerald-400 font-semibold">🛡️ Protection Building</div>
          {effects.protectionRadius && (
            <div className="text-gray-300">
              Reduces rug risk by <span className="text-emerald-400 font-bold">{Math.round((effects.protectionBonus || 0) * 100)}%</span> for buildings within <span className="text-cyan-400">{effects.protectionRadius} tiles</span>
            </div>
          )}
          {effects.insuranceRadius && (
            <div className="text-gray-300">
              Insures buildings within <span className="text-cyan-400">{effects.insuranceRadius} tiles</span> - recover <span className="text-amber-400 font-bold">{Math.round((effects.insuranceRecovery || 0) * 100)}%</span> value on rug
            </div>
          )}
        </div>
      )}
      
      {/* Cost */}
      <div className="text-xs border-t border-gray-700 pt-2">
        <span className={canAfford ? 'text-amber-400' : 'text-red-400'}>
          Cost: ${building.cost.toLocaleString()}
        </span>
        {!canAfford && <span className="text-red-400 ml-2">(Not enough funds)</span>}
      </div>
    </div>
  );
  
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
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
            {effects?.rugRisk !== undefined && (
              <span className={`${risk.color} text-[10px]`}>
                {risk.label}
              </span>
            )}
          </div>
          
          {/* Yield info */}
          {effects?.yieldRate !== undefined && (
            <div className="mt-1 text-xs text-green-400">
              +{effects.yieldRate} yield
            </div>
          )}
          
          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="bg-gray-900 border-gray-700">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CryptoBuildingPanel({
  selectedBuilding,
  onSelectBuilding,
  treasury,
  onOpenPortfolio,
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
          <div className="flex items-center gap-2">
            {/* Portfolio Analytics Button (Issue #62) */}
            {onOpenPortfolio && (
              <button
                onClick={onOpenPortfolio}
                className="px-2 py-1 text-xs bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded transition-colors flex items-center gap-1"
                title="Portfolio Analytics"
                data-testid="portfolio-analytics"
              >
                <span>📊</span>
                <span>Portfolio</span>
              </button>
            )}
            <span className="text-xs text-gray-400">{CRYPTO_BUILDING_COUNT} total</span>
          </div>
        </div>
      </div>
      
      {/* Time-Limited Offers Banner */}
      <TimeLimitedBanner 
        treasury={treasury}
        onSelectBuilding={onSelectBuilding}
        className="mx-3 mt-3 mb-2"
      />
      
      {/* Category tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-700/50">
        {CRYPTO_CATEGORIES.map(category => {
          const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
          if (!info) return null;
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

