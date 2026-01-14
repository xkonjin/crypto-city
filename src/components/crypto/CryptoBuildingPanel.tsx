/**
 * Crypto Building Panel
 * 
 * UI panel for selecting and placing crypto buildings.
 * Features progressive disclosure, search, and filters.
 * 
 * Issues: #203 (Progressive Disclosure), #204 (Filter Chips),
 *         #205 (Search), #206 (Risk Badges)
 * 
 * Adapted for IsoCity engine.
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CryptoCategory, 
  CryptoTier,
  CryptoBuildingDefinition,
  CryptoChain,
} from '../../games/isocity/crypto/types';
import { 
  getCryptoBuildingsByCategory,
  getAllCryptoBuildings,
  CRYPTO_BUILDING_COUNT,
} from '../../games/isocity/crypto/buildings';
import { CRYPTO_CATEGORIES } from '../../games/isocity/crypto/buildingRegistry';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import TimeLimitedBanner from '@/components/game/TimeLimitedBanner';
import type { TimeLimitedOffer } from '@/lib/timeLimitedBuildings';
import { preloadCryptoBuildingSpritesByCategory } from '@/components/game/placeholders';

// New components for UX improvements
import RiskBadge from './RiskBadge';
import FilterChips, { FilterState, RiskFilter } from './FilterChips';
import BuildingSearch, { HighlightedText, NoResults } from './BuildingSearch';
import CategoryCard from './CategoryCard';
import TierGroup from './TierGroup';

// =============================================================================
// TYPES
// =============================================================================

interface CryptoBuildingPanelProps {
  selectedBuilding: string | null;
  onSelectBuilding: (buildingId: string, offer?: TimeLimitedOffer) => void;
  treasury: number;
  onOpenPortfolio?: () => void;
  className?: string;
}

interface PanelState {
  expandedCategory: CryptoCategory | null;
  expandedTier: CryptoTier | null;
  showAllBuildings: boolean;
}

type ViewLevel = 'categories' | 'tiers' | 'buildings';

// =============================================================================
// CONSTANTS
// =============================================================================

const CATEGORY_INFO: Record<string, { name: string; icon: string; color: string }> = {
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

const TIER_ORDER: CryptoTier[] = ['institution', 'whale', 'degen', 'retail'];

const STORAGE_KEY = 'cryptoBuildingPanelState';

// =============================================================================
// HELPERS
// =============================================================================

function getRiskCategory(risk: number): RiskFilter {
  if (!risk || risk === 0) return 'low';
  if (risk < 0.01) return 'low';
  if (risk < 0.05) return 'medium';
  if (risk < 0.1) return 'high';
  return 'degen';
}

function loadPanelState(): PanelState {
  if (typeof window === 'undefined') {
    return { expandedCategory: null, expandedTier: null, showAllBuildings: false };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return { expandedCategory: null, expandedTier: null, showAllBuildings: false };
}

function savePanelState(state: PanelState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function matchesSearch(building: CryptoBuildingDefinition, searchTerm: string): boolean {
  if (!searchTerm) return true;
  const term = searchTerm.toLowerCase();
  const name = building.name.toLowerCase();
  const protocol = building.crypto?.protocol?.toLowerCase() || '';
  const chain = building.crypto?.chain?.toLowerCase() || '';
  const description = building.crypto?.description?.toLowerCase() || '';
  
  return name.includes(term) || 
         protocol.includes(term) || 
         chain.includes(term) || 
         description.includes(term);
}

function matchesFilters(
  building: CryptoBuildingDefinition, 
  filters: FilterState
): boolean {
  const { chains, tiers, risks } = filters;
  
  // Chain filter
  if (chains.length > 0) {
    const buildingChain = building.crypto?.chain;
    if (!buildingChain || !chains.includes(buildingChain)) {
      return false;
    }
  }
  
  // Tier filter
  if (tiers.length > 0) {
    const buildingTier = building.crypto?.tier;
    if (!buildingTier || !tiers.includes(buildingTier)) {
      return false;
    }
  }
  
  // Risk filter
  if (risks.length > 0) {
    const riskCategory = getRiskCategory(building.crypto?.effects?.rugRisk || 0);
    if (!risks.includes(riskCategory)) {
      return false;
    }
  }
  
  return true;
}

// =============================================================================
// BUILDING CARD COMPONENT (Enhanced with RiskBadge)
// =============================================================================

interface BuildingCardProps {
  building: CryptoBuildingDefinition;
  isSelected: boolean;
  canAfford: boolean;
  onClick: () => void;
  searchTerm?: string;
}

function BuildingCard({ building, isSelected, canAfford, onClick, searchTerm = '' }: BuildingCardProps) {
  const crypto = building.crypto;
  const effects = crypto?.effects;
  const rugRisk = effects?.rugRisk ?? 0;
  
  // Format risk level with detailed explanations
  const getRiskLevel = (risk: number | undefined) => {
    if (!risk || risk === 0) return { 
      label: 'Very Low', 
      color: 'text-green-400',
      explanation: 'Battle-tested protocol with near-zero historical exploits.'
    };
    if (risk < 0.01) return { 
      label: 'Low', 
      color: 'text-green-400',
      explanation: 'Well-audited with strong track record. Safe choice.'
    };
    if (risk < 0.05) return { 
      label: 'Medium', 
      color: 'text-yellow-400',
      explanation: 'Newer protocol or complex mechanics. Monitor closely.'
    };
    if (risk < 0.1) return { 
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
          data-testid="building-card"
          onClick={onClick}
          disabled={!canAfford}
          className={`
            relative w-full p-3 rounded text-left transition-all
            ${isSelected 
              ? 'bg-primary/20 border border-primary ring-1 ring-primary/50' 
              : canAfford 
                ? 'bg-muted/50 hover:bg-muted border border-border/50 hover:border-border'
                : 'bg-muted/20 border border-border/30 opacity-50 cursor-not-allowed'
            }
          `}
        >
          {/* Icon and name */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{building.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">
                {searchTerm ? (
                  <HighlightedText text={building.name} highlight={searchTerm} />
                ) : (
                  building.name
                )}
              </div>
              <div className="text-xs text-gray-400">
                {building.footprint.width}x{building.footprint.height}
              </div>
            </div>
          </div>
          
          {/* Risk Badge - prominently displayed (#206) */}
          <div className="mb-2">
            <RiskBadge risk={rugRisk} compact />
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs">
            <span className={`font-mono ${canAfford ? 'text-amber-400' : 'text-red-400'}`}>
              ${building.cost.toLocaleString()}
            </span>
          </div>
          
          {/* Yield info */}
          {effects?.yieldRate !== undefined && (
            <div className="mt-1 text-xs text-green-400">
              +{effects.yieldRate} yield
            </div>
          )}
          
          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
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
// BREADCRUMB COMPONENT
// =============================================================================

interface BreadcrumbProps {
  level: ViewLevel;
  categoryName: string | null;
  tierName: string | null;
  onClickAll: () => void;
  onClickCategory: () => void;
}

function Breadcrumb({ level, categoryName, tierName, onClickAll, onClickCategory }: BreadcrumbProps) {
  return (
    <nav data-testid="breadcrumb" className="flex items-center gap-1 text-sm text-gray-400 px-3 py-2">
      <button 
        data-testid="breadcrumb-all"
        onClick={onClickAll}
        className={`hover:text-white transition-colors ${level === 'categories' ? 'text-white font-medium' : ''}`}
      >
        All
      </button>
      
      {categoryName && (
        <>
          <span className="text-gray-600">›</span>
          <button 
            data-testid="breadcrumb-category"
            onClick={onClickCategory}
            className={`hover:text-white transition-colors ${level === 'tiers' ? 'text-white font-medium' : ''}`}
          >
            {categoryName}
          </button>
        </>
      )}
      
      {tierName && (
        <>
          <span className="text-gray-600">›</span>
          <span className="text-white font-medium">{tierName}</span>
        </>
      )}
    </nav>
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
  // State
  const [panelState, setPanelState] = useState<PanelState>(loadPanelState);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    chains: [],
    tiers: [],
    risks: [],
  });
  
  // Derived state
  const { expandedCategory, expandedTier, showAllBuildings } = panelState;
  
  // Calculate current view level
  const viewLevel: ViewLevel = useMemo(() => {
    if (showAllBuildings || searchTerm) return 'buildings';
    if (expandedTier) return 'buildings';
    if (expandedCategory) return 'tiers';
    return 'categories';
  }, [showAllBuildings, searchTerm, expandedCategory, expandedTier]);
  
  // Get all buildings for filtering and counts
  const allBuildings = useMemo(() => getAllCryptoBuildings(), []);
  
  // Calculate building counts for filter chips
  const buildingCounts = useMemo(() => {
    const chains: Record<string, number> = {};
    const tiers: Record<string, number> = {};
    const risks: Record<string, number> = {};
    
    for (const building of allBuildings) {
      // Chain counts
      const chain = building.crypto?.chain;
      if (chain) {
        chains[chain] = (chains[chain] || 0) + 1;
      }
      
      // Tier counts
      const tier = building.crypto?.tier;
      if (tier) {
        tiers[tier] = (tiers[tier] || 0) + 1;
      }
      
      // Risk counts
      const riskCategory = getRiskCategory(building.crypto?.effects?.rugRisk || 0);
      risks[riskCategory] = (risks[riskCategory] || 0) + 1;
    }
    
    return { chains, tiers, risks };
  }, [allBuildings]);
  
  // Filter and search buildings
  const filteredBuildings = useMemo(() => {
    let buildings = allBuildings;
    
    // Apply category filter if in hierarchy mode
    if (!showAllBuildings && !searchTerm && expandedCategory) {
      buildings = getCryptoBuildingsByCategory(expandedCategory);
      
      // Further filter by tier if expanded
      if (expandedTier) {
        buildings = buildings.filter(b => b.crypto?.tier === expandedTier);
      }
    }
    
    // Apply search
    if (searchTerm) {
      buildings = buildings.filter(b => matchesSearch(b, searchTerm));
    }
    
    // Apply filters
    buildings = buildings.filter(b => matchesFilters(b, filters));
    
    return buildings;
  }, [allBuildings, showAllBuildings, searchTerm, expandedCategory, expandedTier, filters]);
  
  // Group buildings by tier for Level 2 view
  const buildingsByTier = useMemo(() => {
    if (!expandedCategory || showAllBuildings || searchTerm) return null;
    
    const categoryBuildings = getCryptoBuildingsByCategory(expandedCategory);
    const grouped: Record<CryptoTier, CryptoBuildingDefinition[]> = {
      institution: [],
      whale: [],
      degen: [],
      retail: [],
    };
    
    for (const building of categoryBuildings) {
      const tier = building.crypto?.tier;
      if (tier && grouped[tier]) {
        grouped[tier].push(building);
      }
    }
    
    return grouped;
  }, [expandedCategory, showAllBuildings, searchTerm]);
  
  // Persist state changes
  useEffect(() => {
    savePanelState(panelState);
  }, [panelState]);
  
  // Preload sprites for current category
  useEffect(() => {
    if (expandedCategory) {
      preloadCryptoBuildingSpritesByCategory(expandedCategory);
    }
  }, [expandedCategory]);
  
  // Handlers
  const handleCategoryClick = useCallback((category: CryptoCategory) => {
    setPanelState(prev => ({
      ...prev,
      expandedCategory: prev.expandedCategory === category ? null : category,
      expandedTier: null,
    }));
  }, []);
  
  const handleTierClick = useCallback((tier: CryptoTier) => {
    setPanelState(prev => ({
      ...prev,
      expandedTier: prev.expandedTier === tier ? null : tier,
    }));
  }, []);
  
  const handleShowAllToggle = useCallback(() => {
    setPanelState(prev => ({
      ...prev,
      showAllBuildings: !prev.showAllBuildings,
      expandedCategory: null,
      expandedTier: null,
    }));
  }, []);
  
  const handleBreadcrumbAll = useCallback(() => {
    setPanelState(prev => ({
      ...prev,
      expandedCategory: null,
      expandedTier: null,
    }));
    setSearchTerm('');
  }, []);
  
  const handleBreadcrumbCategory = useCallback(() => {
    setPanelState(prev => ({
      ...prev,
      expandedTier: null,
    }));
  }, []);
  
  const handleSearchSuggestion = useCallback((suggestion: string) => {
    setSearchTerm(suggestion);
  }, []);
  
  // Get category info for breadcrumb
  const categoryName = expandedCategory ? CATEGORY_INFO[expandedCategory]?.name : null;
  const tierName = expandedTier ? expandedTier.charAt(0).toUpperCase() + expandedTier.slice(1) : null;

  return (
    <div 
      data-testid="crypto-building-panel"
      className={`flex flex-col overflow-hidden ${className}`}
    >
      {/* Stats Bar - mini treasury display */}
      <div className="px-4 py-2 bg-muted/30 border-b border-sidebar-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm font-mono">${treasury.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Treasury</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Portfolio Analytics Button (Issue #62) */}
            {onOpenPortfolio && (
              <button
                onClick={onOpenPortfolio}
                className="px-2 py-1 text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded transition-colors flex items-center gap-1"
                title="Portfolio Analytics"
                data-testid="portfolio-analytics"
              >
                <span>📊</span>
              </button>
            )}
            <span className="text-xs text-muted-foreground">{CRYPTO_BUILDING_COUNT} buildings</span>
          </div>
        </div>
      </div>
      
      {/* Time-Limited Offers Banner */}
      <TimeLimitedBanner 
        treasury={treasury}
        onSelectBuilding={onSelectBuilding}
        className="mx-3 mt-3 mb-2"
      />
      
      {/* Search (#205) */}
      <div className="px-3 pt-2">
        <BuildingSearch
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name, protocol, chain..."
        />
      </div>
      
      {/* Show All Toggle + Breadcrumb */}
      <div className="flex items-center justify-between px-3 pt-2">
        <Breadcrumb
          level={viewLevel}
          categoryName={categoryName}
          tierName={tierName}
          onClickAll={handleBreadcrumbAll}
          onClickCategory={handleBreadcrumbCategory}
        />
        
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={showAllBuildings}
            onChange={handleShowAllToggle}
            className="sr-only peer"
          />
          <span 
            data-testid="show-all-toggle"
            className={`
              px-2 py-1 rounded transition-colors
              ${showAllBuildings 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700/50 text-gray-400 hover:text-white'
              }
            `}
          >
            Show All
          </span>
        </label>
      </div>
      
      {/* Filter Chips (#204) - shown when in "Show All" mode or searching */}
      {(showAllBuildings || searchTerm) && (
        <div className="px-3 pt-3">
          <FilterChips
            filters={filters}
            onFiltersChange={setFilters}
            buildingCounts={buildingCounts}
          />
        </div>
      )}
      
      {/* Content Area - flexible height */}
      <div className="flex-1 p-3 overflow-y-auto scrollbar-hide">
        {/* Level 1: Category Cards */}
        {viewLevel === 'categories' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CRYPTO_CATEGORIES.map(category => {
              const info = CATEGORY_INFO[category];
              if (!info) return null;
              const buildings = getCryptoBuildingsByCategory(category);
              
              return (
                <CategoryCard
                  key={category}
                  category={category}
                  name={info.name}
                  icon={info.icon}
                  color={info.color}
                  buildings={buildings}
                  isExpanded={expandedCategory === category}
                  onClick={() => handleCategoryClick(category)}
                />
              );
            })}
          </div>
        )}
        
        {/* Level 2: Tier Groups */}
        {viewLevel === 'tiers' && buildingsByTier && (
          <div className="space-y-2">
            {TIER_ORDER.map(tier => {
              const buildings = buildingsByTier[tier];
              if (buildings.length === 0) return null;
              
              return (
                <TierGroup
                  key={tier}
                  tier={tier}
                  buildings={buildings}
                  isExpanded={expandedTier === tier}
                  onClick={() => handleTierClick(tier)}
                >
                  {expandedTier === tier && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {buildings.map(building => (
                        <BuildingCard
                          key={building.id}
                          building={building}
                          isSelected={selectedBuilding === building.id}
                          canAfford={treasury >= building.cost}
                          onClick={() => onSelectBuilding(building.id)}
                          searchTerm={searchTerm}
                        />
                      ))}
                    </div>
                  )}
                </TierGroup>
              );
            })}
          </div>
        )}
        
        {/* Level 3: Building Cards (flat list) */}
        {viewLevel === 'buildings' && (
          <>
            {filteredBuildings.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {filteredBuildings.map(building => (
                  <BuildingCard
                    key={building.id}
                    building={building}
                    isSelected={selectedBuilding === building.id}
                    canAfford={treasury >= building.cost}
                    onClick={() => onSelectBuilding(building.id)}
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
            ) : (
              <NoResults
                searchTerm={searchTerm}
                onSuggestionClick={handleSearchSuggestion}
              />
            )}
          </>
        )}
      </div>
      
      {/* Selected building details */}
      {selectedBuilding && (
        <SelectedBuildingInfo 
          buildingId={selectedBuilding} 
          buildings={filteredBuildings}
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
    <div className="border-t border-sidebar-border p-4 bg-muted/30 flex-shrink-0">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{building.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{building.name}</div>
          <div className="text-xs text-muted-foreground">
            {crypto.protocol || crypto.chain || 'Crypto'}
          </div>
        </div>
        <div className="flex-shrink-0">
          <RiskBadge risk={effects?.rugRisk ?? 0} />
        </div>
      </div>
      
      {crypto.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {crypto.description}
        </p>
      )}
      
      {effects && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {effects.yieldRate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yield:</span>
              <span className="text-green-400">+{effects.yieldRate}/day</span>
            </div>
          )}
          {effects.stakingBonus && effects.stakingBonus > 1 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Staking:</span>
              <span className="text-primary">{effects.stakingBonus}x</span>
            </div>
          )}
          {effects.zoneRadius && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Radius:</span>
              <span className="text-accent">{effects.zoneRadius} tiles</span>
            </div>
          )}
          {effects.volatility !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volatility:</span>
              <span className="text-yellow-400">{(effects.volatility * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}
      
      {/* Synergies */}
      {effects?.chainSynergy && effects.chainSynergy.length > 0 && (
        <div className="mt-3 pt-3 border-t border-sidebar-border/50">
          <div className="text-xs text-muted-foreground mb-1">Chain synergies:</div>
          <div className="flex flex-wrap gap-1">
            {effects.chainSynergy.map(chain => (
              <span 
                key={chain}
                className="px-2 py-0.5 bg-accent/20 text-accent rounded text-xs"
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
