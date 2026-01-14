/**
 * Building Tooltip Component
 * 
 * Enhanced tooltips showing yield, risk, synergy, and other building stats.
 * Supports crypto buildings, standard buildings, and service buildings.
 * 
 * Issue #160: Enhance tooltips with yield, risk, and synergy information
 */

'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CryptoBuildingDefinition } from '@/games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

export interface StandardBuilding {
  id: string;
  name: string;
  cost: number;
  footprint: { width: number; height: number };
  category: string;
  icon?: string;
  population?: number;
  jobs?: number;
  commercialNeed?: number;
}

export interface ServiceBuilding extends StandardBuilding {
  coverageRadius: number;
  effect: string;
  effectValue: number;
  monthlyCost: number;
}

export type BuildingType = CryptoBuildingDefinition | StandardBuilding | ServiceBuilding;

interface BuildingTooltipProps {
  building: BuildingType;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  canAfford?: boolean;
  treasury?: number;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

function isCryptoBuilding(building: BuildingType): building is CryptoBuildingDefinition {
  return 'crypto' in building && building.crypto !== undefined;
}

function isServiceBuilding(building: BuildingType): building is ServiceBuilding {
  return 'coverageRadius' in building && 'monthlyCost' in building;
}

// =============================================================================
// RISK HELPERS
// =============================================================================

function getRiskInfo(rugRisk: number | undefined) {
  if (!rugRisk || rugRisk === 0) {
    return {
      label: 'Very Low',
      color: 'text-crypto-risk-low',
      bgColor: 'bg-crypto-risk-low/10',
      description: 'Battle-tested protocol with near-zero historical exploits.',
    };
  }
  if (rugRisk < 0.01) {
    return {
      label: 'Low',
      color: 'text-crypto-risk-low',
      bgColor: 'bg-crypto-risk-low/10',
      description: 'Well-audited with strong track record.',
    };
  }
  if (rugRisk < 0.05) {
    return {
      label: 'Medium',
      color: 'text-crypto-risk-medium',
      bgColor: 'bg-crypto-risk-medium/10',
      description: 'Newer protocol or complex mechanics. Monitor closely.',
    };
  }
  if (rugRisk < 0.1) {
    return {
      label: 'High',
      color: 'text-crypto-risk-high',
      bgColor: 'bg-crypto-risk-high/10',
      description: 'Experimental or unaudited. High yield = high risk.',
    };
  }
  return {
    label: 'DEGEN',
    color: 'text-crypto-risk-extreme',
    bgColor: 'bg-crypto-risk-extreme/10',
    description: 'YOLO territory. Expect to lose this eventually.',
  };
}

// =============================================================================
// CRYPTO BUILDING TOOLTIP
// =============================================================================

function CryptoBuildingTooltipContent({
  building,
  canAfford = true,
}: {
  building: CryptoBuildingDefinition;
  canAfford?: boolean;
}) {
  const crypto = building.crypto;
  const effects = crypto?.effects;
  const risk = getRiskInfo(effects?.rugRisk);
  
  // Calculate ROI
  const roi = effects?.yieldRate && effects.yieldRate > 0
    ? Math.ceil(building.cost / (effects.yieldRate * 365))
    : null;

  return (
    <div className="space-y-3 max-w-xs p-1">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xl">{building.icon}</span>
          <span className="font-semibold text-base">{building.name}</span>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
          {crypto?.tier && <span>Tier: {crypto.tier}</span>}
          <span>Size: {building.footprint.width}x{building.footprint.height}</span>
          {crypto?.chain && <span>Chain: {crypto.chain}</span>}
        </div>
      </div>

      {/* Yield & Risk Stats */}
      {effects && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-panel-border pt-2">
          {effects.yieldRate !== undefined && (
            <div className="flex justify-between col-span-2">
              <span className="text-muted-foreground">📈 Yield:</span>
              <span className="text-crypto-yield font-medium">
                +{effects.yieldRate}/day (${(effects.yieldRate * 365).toLocaleString()}/year)
              </span>
            </div>
          )}
          
          {effects.rugRisk !== undefined && effects.rugRisk > 0 && (
            <div className="col-span-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">⚠️ Risk:</span>
                <span className={`font-medium ${risk.color}`}>
                  {risk.label} ({(effects.rugRisk * 100).toFixed(1)}%/cycle)
                </span>
              </div>
              <div className={`text-[10px] ${risk.bgColor} ${risk.color} p-1.5 rounded`}>
                {risk.description}
              </div>
            </div>
          )}

          {effects.populationBoost !== undefined && effects.populationBoost > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">👥 Pop:</span>
              <span className="text-status-info">+{effects.populationBoost}</span>
            </div>
          )}

          {effects.happinessEffect !== undefined && effects.happinessEffect !== 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">😊 Happy:</span>
              <span className="text-pink-400">
                {effects.happinessEffect > 0 ? '+' : ''}{effects.happinessEffect}
              </span>
            </div>
          )}

          {roi && (
            <div className="flex justify-between col-span-2 border-t border-panel-border pt-1">
              <span className="text-muted-foreground">💰 ROI:</span>
              <span className="text-crypto-yield">~{roi} days</span>
            </div>
          )}
        </div>
      )}

      {/* Synergies */}
      {effects && (effects.chainSynergy?.length > 0 || effects.categorySynergy?.length > 0) && (
        <div className="text-xs border-t border-panel-border pt-2 space-y-1.5">
          <div className="text-muted-foreground">
            🔗 <span className="font-medium">Synergies</span> (up to +50% yield)
          </div>
          {effects.chainSynergy?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {effects.chainSynergy.map(chain => (
                <span 
                  key={chain}
                  className="px-1.5 py-0.5 bg-crypto-synergy/20 text-crypto-synergy rounded text-[10px]"
                >
                  {chain}
                </span>
              ))}
            </div>
          )}
          {effects.categorySynergy?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {effects.categorySynergy.map(cat => (
                <span 
                  key={cat}
                  className="px-1.5 py-0.5 bg-crypto-chain/20 text-crypto-chain rounded text-[10px]"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Protection Buildings */}
      {effects && (effects.protectionRadius || effects.insuranceRadius) && (
        <div className="text-xs border-t border-panel-border pt-2 bg-status-success/5 p-2 rounded space-y-1">
          <div className="text-status-success font-medium">🛡️ Protection Building</div>
          {effects.protectionRadius && (
            <div className="text-foreground/80">
              Reduces rug risk by <span className="text-status-success font-bold">
                {Math.round((effects.protectionBonus || 0) * 100)}%
              </span> within <span className="text-status-info">{effects.protectionRadius} tiles</span>
            </div>
          )}
          {effects.insuranceRadius && (
            <div className="text-foreground/80">
              Insures buildings within <span className="text-status-info">{effects.insuranceRadius} tiles</span>
              {' '}- recover <span className="text-crypto-yield font-bold">
                {Math.round((effects.insuranceRecovery || 0) * 100)}%
              </span> on rug
            </div>
          )}
        </div>
      )}

      {/* Sentiment Immune */}
      {effects?.sentimentImmune && (
        <div className="text-xs flex items-center gap-1 text-status-success">
          <span>🛡️</span>
          <span>Yields unaffected by market sentiment</span>
        </div>
      )}

      {/* Cost */}
      <div className="text-xs border-t border-panel-border pt-2">
        <span className={canAfford ? 'text-crypto-yield' : 'text-status-error'}>
          Cost: ${building.cost.toLocaleString()}
        </span>
        {!canAfford && (
          <span className="text-status-error ml-2">(Insufficient funds)</span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// STANDARD BUILDING TOOLTIP
// =============================================================================

function StandardBuildingTooltipContent({
  building,
  canAfford = true,
}: {
  building: StandardBuilding;
  canAfford?: boolean;
}) {
  return (
    <div className="space-y-2 max-w-xs p-1">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          {building.icon && <span className="text-xl">{building.icon}</span>}
          <span className="font-semibold text-base">{building.name}</span>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
          <span>Size: {building.footprint.width}x{building.footprint.height}</span>
          <span className="capitalize">{building.category}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-t border-panel-border pt-2">
        {building.population !== undefined && building.population > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">👥 Population:</span>
            <span className="text-status-info">+{building.population}</span>
          </div>
        )}
        
        {building.jobs !== undefined && building.jobs > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">💼 Jobs:</span>
            <span className="text-status-info">{building.jobs}</span>
          </div>
        )}
        
        {building.commercialNeed !== undefined && building.commercialNeed > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">🏪 Commercial:</span>
            <span className="text-status-info">{building.commercialNeed} needed</span>
          </div>
        )}
      </div>

      {/* Requirements */}
      <div className="text-xs border-t border-panel-border pt-2 text-muted-foreground">
        <div>Requirements:</div>
        <ul className="list-disc list-inside">
          <li>Road access</li>
          <li>Power coverage</li>
        </ul>
      </div>

      {/* Cost */}
      <div className="text-xs border-t border-panel-border pt-2">
        <span className={canAfford ? 'text-crypto-yield' : 'text-status-error'}>
          Cost: ${building.cost.toLocaleString()}
        </span>
        {!canAfford && (
          <span className="text-status-error ml-2">(Insufficient funds)</span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SERVICE BUILDING TOOLTIP
// =============================================================================

function ServiceBuildingTooltipContent({
  building,
  canAfford = true,
}: {
  building: ServiceBuilding;
  canAfford?: boolean;
}) {
  return (
    <div className="space-y-2 max-w-xs p-1">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          {building.icon && <span className="text-xl">{building.icon}</span>}
          <span className="font-semibold text-base">{building.name}</span>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
          <span>Size: {building.footprint.width}x{building.footprint.height}</span>
          <span className="capitalize">{building.category}</span>
        </div>
      </div>

      {/* Coverage Info */}
      <div className="text-xs border-t border-panel-border pt-2 space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">🛡️ Coverage:</span>
          <span className="text-status-info">{building.coverageRadius} tile radius</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">📊 {building.effect}:</span>
          <span className="text-crypto-yield">
            {building.effectValue > 0 ? '+' : ''}{building.effectValue}% in radius
          </span>
        </div>
      </div>

      {/* Monthly Cost */}
      <div className="text-xs border-t border-panel-border pt-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Monthly Cost:</span>
          <span className="text-status-warning">${building.monthlyCost}/month</span>
        </div>
      </div>

      {/* Cost */}
      <div className="text-xs border-t border-panel-border pt-2">
        <span className={canAfford ? 'text-crypto-yield' : 'text-status-error'}>
          Cost: ${building.cost.toLocaleString()}
        </span>
        {!canAfford && (
          <span className="text-status-error ml-2">(Insufficient funds)</span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BuildingTooltip({
  building,
  children,
  side = 'left',
  canAfford = true,
  treasury,
}: BuildingTooltipProps) {
  // Auto-detect affordability if treasury provided
  const affordable = treasury !== undefined 
    ? treasury >= building.cost 
    : canAfford;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        className="bg-panel border-panel-border shadow-xl"
      >
        {isCryptoBuilding(building) ? (
          <CryptoBuildingTooltipContent building={building} canAfford={affordable} />
        ) : isServiceBuilding(building) ? (
          <ServiceBuildingTooltipContent building={building} canAfford={affordable} />
        ) : (
          <StandardBuildingTooltipContent building={building} canAfford={affordable} />
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export default BuildingTooltip;
