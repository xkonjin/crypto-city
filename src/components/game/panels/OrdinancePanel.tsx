'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { msg, useMessages } from 'gt-next';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Scroll,
  TrendingUp,
  Shield,
  Users,
  Scale,
  DollarSign,
  AlertTriangle,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  Ordinance,
  OrdinanceCategory,
  OrdinanceEffect,
  ORDINANCES,
  CATEGORY_COLORS,
  formatEffect,
  getEffectSummary,
  getOrdinanceManager,
} from '@/lib/ordinances';
import { cryptoEconomy, CryptoEconomyState } from '@/games/isocity/crypto';

// Translatable UI labels
const UI_LABELS = {
  title: msg('Ordinances'),
  economic: msg('Economic'),
  risk: msg('Risk'),
  social: msg('Social'),
  regulatory: msg('Regulatory'),
  activeOrdinances: msg('Active Ordinances'),
  noActiveOrdinances: msg('No active ordinances'),
  dailyCost: msg('Daily Cost'),
  totalDailyCost: msg('Total Daily Cost'),
  effects: msg('Effects'),
  requirements: msg('Requirements'),
  activate: msg('Activate'),
  deactivate: msg('Deactivate'),
  locked: msg('Locked'),
  perDay: msg('/day'),
  oneTime: msg('one-time'),
  duration: msg('Duration'),
  days: msg('days'),
  costWarning: msg('Warning: High ordinance costs!'),
};

// Category icons
const CATEGORY_ICONS: Record<OrdinanceCategory, React.ReactNode> = {
  economic: <TrendingUp className="w-4 h-4" />,
  risk: <Shield className="w-4 h-4" />,
  social: <Users className="w-4 h-4" />,
  regulatory: <Scale className="w-4 h-4" />,
};

// Single ordinance card component
function OrdinanceCard({
  ordinance,
  isActive,
  canActivate,
  unmetRequirements,
  onToggle,
}: {
  ordinance: Ordinance;
  isActive: boolean;
  canActivate: boolean;
  unmetRequirements: string[];
  onToggle: (id: string) => void;
}) {
  const m = useMessages();
  const isLocked = !canActivate && !isActive;
  const colors = CATEGORY_COLORS[ordinance.category];
  
  const effectLines = formatEffect(ordinance.effect);
  
  return (
    <div 
      className={`p-4 rounded-lg border transition-all ${
        isActive 
          ? 'bg-primary/10 border-primary/30'
          : isLocked
          ? 'bg-muted/30 border-border/50 opacity-75'
          : 'bg-card border-border hover:border-primary/50'
      }`}
      data-testid="ordinance-card"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{ordinance.icon}</span>
            <h4 className="font-medium text-sm">
              {ordinance.name}
            </h4>
            {isActive && (
              <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30" data-testid="ordinance-active">
                Active
              </Badge>
            )}
            {isLocked && (
              <Lock className="w-3 h-3 text-muted-foreground" data-testid="ordinance-locked" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {ordinance.description}
          </p>
        </div>
      </div>
      
      {/* Cost display */}
      <div className="flex items-center gap-2 mb-2 text-sm" data-testid="ordinance-cost">
        <DollarSign className="w-4 h-4 text-amber-400" />
        <span className="font-mono text-amber-400">
          ${ordinance.cost.toLocaleString()}
        </span>
        <span className="text-muted-foreground text-xs">
          {ordinance.isOneTime ? m(UI_LABELS.oneTime) : m(UI_LABELS.perDay)}
        </span>
        {ordinance.duration && (
          <span className="text-muted-foreground text-xs">
            • {ordinance.duration} {m(UI_LABELS.days)}
          </span>
        )}
      </div>
      
      {/* Effects */}
      {effectLines.length > 0 && (
        <div className="mb-3" data-testid="ordinance-effects">
          <div className="text-xs text-muted-foreground mb-1">{m(UI_LABELS.effects)}:</div>
          <div className="flex flex-wrap gap-1">
            {effectLines.map((line, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className={`text-xs ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {line}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Unmet requirements */}
      {unmetRequirements.length > 0 && !isActive && (
        <div className="mb-3 text-xs text-red-400">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3" />
            <span>{m(UI_LABELS.requirements)}:</span>
          </div>
          <ul className="list-disc list-inside pl-1">
            {unmetRequirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Toggle button */}
      <div className="flex items-center justify-between">
        <Switch
          checked={isActive}
          onCheckedChange={() => onToggle(ordinance.id)}
          disabled={isLocked}
          data-testid="ordinance-toggle"
        />
        <span className="text-xs text-muted-foreground">
          {isActive ? m(UI_LABELS.deactivate) : m(UI_LABELS.activate)}
        </span>
      </div>
    </div>
  );
}

// Active ordinances summary component
function ActiveOrdinancesSummary({
  activeOrdinances,
  totalDailyCost,
  effects,
  treasury,
}: {
  activeOrdinances: Ordinance[];
  totalDailyCost: number;
  effects: OrdinanceEffect;
  treasury: number;
}) {
  const m = useMessages();
  
  // Warning threshold: costs > 10% of treasury per day
  const showWarning = totalDailyCost > treasury * 0.1;
  
  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-border mb-4" data-testid="active-ordinances-summary">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">{m(UI_LABELS.activeOrdinances)}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{m(UI_LABELS.totalDailyCost)}:</span>
          <span className={`font-mono text-sm ${showWarning ? 'text-red-400' : 'text-amber-400'}`}>
            ${totalDailyCost.toLocaleString()}/day
          </span>
        </div>
      </div>
      
      {showWarning && (
        <div className="flex items-center gap-2 text-red-400 text-xs mb-3" data-testid="ordinance-cost-warning">
          <AlertTriangle className="w-4 h-4" />
          <span>{m(UI_LABELS.costWarning)}</span>
        </div>
      )}
      
      {activeOrdinances.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-4">
          {m(UI_LABELS.noActiveOrdinances)}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {activeOrdinances.map(ord => (
              <Badge key={ord.id} variant="outline" className="text-xs">
                {ord.icon} {ord.name}
              </Badge>
            ))}
          </div>
          
          {/* Combined effects summary */}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">{m(UI_LABELS.effects)}: </span>
            {getEffectSummary(effects)}
          </div>
        </div>
      )}
    </div>
  );
}

// Main OrdinancePanel component
export function OrdinancePanel() {
  const { state, setActivePanel } = useGame();
  const m = useMessages();
  
  const [activeTab, setActiveTab] = useState<OrdinanceCategory>('economic');
  
  // Subscribe to crypto economy state
  const [economyState, setEconomyState] = useState<CryptoEconomyState>(
    cryptoEconomy.getState()
  );
  
  useEffect(() => {
    const unsubscribe = cryptoEconomy.subscribe(setEconomyState);
    return unsubscribe;
  }, []);
  
  // Get ordinance manager
  const ordinanceManager = useMemo(() => getOrdinanceManager(), []);
  
  // Game state for requirement checking
  const gameState = useMemo(() => ({
    treasury: economyState.treasury || state.stats.money,
    population: state.stats.population,
    buildingCount: economyState.buildingCount || 0,
    currentDay: economyState.gameDays || 0,
  }), [economyState, state.stats]);
  
  // Force re-render on ordinance changes
  const [, forceUpdate] = useState({});
  
  // Get ordinances by category
  const ordinancesByCategory = useMemo(() => {
    const result: Record<OrdinanceCategory, Ordinance[]> = {
      economic: [],
      risk: [],
      social: [],
      regulatory: [],
    };
    
    for (const ord of ORDINANCES) {
      result[ord.category].push(ord);
    }
    
    return result;
  }, []);
  
  // Get active ordinances
  const activeOrdinances = useMemo(() => {
    return ordinanceManager.getActiveOrdinances();
  }, [ordinanceManager]);
  
  // Get total daily cost
  const totalDailyCost = useMemo(() => {
    return ordinanceManager.getDailyCost();
  }, [ordinanceManager]);
  
  // Get combined effects
  const combinedEffects = useMemo(() => {
    return ordinanceManager.getActiveEffects();
  }, [ordinanceManager]);
  
  // Handle toggle
  const handleToggle = useCallback((id: string) => {
    ordinanceManager.toggle(id, gameState);
    forceUpdate({});
  }, [ordinanceManager, gameState]);
  
  // Check if ordinance can be activated
  const canActivate = useCallback((id: string) => {
    return ordinanceManager.canActivate(id, gameState);
  }, [ordinanceManager, gameState]);
  
  // Get unmet requirements
  const getUnmetRequirements = useCallback((id: string) => {
    return ordinanceManager.getUnmetRequirements(id, gameState);
  }, [ordinanceManager, gameState]);
  
  return (
    <Dialog open={true} onOpenChange={() => setActivePanel('none')}>
      <DialogContent className="max-w-[600px] max-h-[80vh]" data-testid="ordinance-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scroll className="w-5 h-5" />
            {m(UI_LABELS.title)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Active ordinances summary */}
          <ActiveOrdinancesSummary
            activeOrdinances={activeOrdinances}
            totalDailyCost={totalDailyCost}
            effects={combinedEffects}
            treasury={gameState.treasury}
          />
          
          {/* Category tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrdinanceCategory)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="economic" className="flex items-center gap-1">
                {CATEGORY_ICONS.economic}
                <span className="hidden sm:inline">{m(UI_LABELS.economic)}</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-1">
                {CATEGORY_ICONS.risk}
                <span className="hidden sm:inline">{m(UI_LABELS.risk)}</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-1">
                {CATEGORY_ICONS.social}
                <span className="hidden sm:inline">{m(UI_LABELS.social)}</span>
              </TabsTrigger>
              <TabsTrigger value="regulatory" className="flex items-center gap-1">
                {CATEGORY_ICONS.regulatory}
                <span className="hidden sm:inline">{m(UI_LABELS.regulatory)}</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Tab content */}
            {(['economic', 'risk', 'social', 'regulatory'] as OrdinanceCategory[]).map(category => (
              <TabsContent key={category} value={category}>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {ordinancesByCategory[category].map(ord => (
                      <OrdinanceCard
                        key={ord.id}
                        ordinance={ord}
                        isActive={ordinanceManager.isActive(ord.id)}
                        canActivate={canActivate(ord.id)}
                        unmetRequirements={getUnmetRequirements(ord.id)}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
