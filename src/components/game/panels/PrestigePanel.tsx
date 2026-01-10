'use client';

import React, { useState, useCallback } from 'react';
import { msg, useMessages } from 'gt-next';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Star, Sparkles, Gift, Lock, Check, AlertTriangle, History, TrendingUp } from 'lucide-react';
import {
  PrestigeState,
  PrestigeBonus,
  purchaseBonus,
  getPrestigePointsPreview,
  executePrestige,
  savePrestigeState,
  PRESTIGE_CONFIG,
} from '@/lib/prestige';
import type { CryptoEconomyState } from '@/games/isocity/crypto';

// Translatable UI labels
const UI_LABELS = {
  title: msg('Prestige'),
  level: msg('Level'),
  points: msg('Points'),
  availableBonuses: msg('Available Bonuses'),
  purchasedBonuses: msg('Purchased Bonuses'),
  prestigeNow: msg('Prestige Now'),
  purchase: msg('Purchase'),
  purchased: msg('Purchased'),
  pts: msg('pts'),
  history: msg('History'),
  noHistory: msg('No prestige history yet'),
  confirmTitle: msg('Confirm Prestige'),
  confirmDesc: msg('Are you sure you want to prestige? This will reset your city and economy.'),
  youWillGain: msg('You will gain'),
  youWillLose: msg('You will lose'),
  cancel: msg('Cancel'),
  confirm: msg('Confirm'),
  requirements: msg('Requirements'),
  minTvl: msg('Minimum $100k TVL required'),
  currentTvl: msg('Current TVL'),
  potentialPoints: msg('Potential Points'),
  daysSurvived: msg('Days Survived'),
};

interface PrestigePanelProps {
  cryptoState: CryptoEconomyState;
  prestigeState: PrestigeState;
  onUpdatePrestigeState: (state: PrestigeState) => void;
  onPrestige: () => void;
  gameDays: number;
}

// Single bonus card component
function BonusCard({
  bonus,
  canAfford,
  onPurchase,
}: {
  bonus: PrestigeBonus;
  canAfford: boolean;
  onPurchase: (id: string) => void;
}) {
  const m = useMessages();
  
  return (
    <div 
      className={`p-3 rounded-lg border transition-all ${
        bonus.purchased 
          ? 'bg-green-500/10 border-green-500/30'
          : canAfford
          ? 'bg-card border-primary/50 hover:border-primary'
          : 'bg-card border-border opacity-75'
      }`}
      data-testid="prestige-bonus-item"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{bonus.icon}</span>
          <div>
            <h4 className="font-medium text-sm">{bonus.name}</h4>
            <p className="text-xs text-muted-foreground">{bonus.description}</p>
          </div>
        </div>
        {bonus.purchased && (
          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
        )}
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 text-xs">
          <Star className="w-3 h-3 text-amber-400" />
          <span className="font-mono">{bonus.cost} {m(UI_LABELS.pts)}</span>
        </div>
        
        {!bonus.purchased && (
          <Button
            size="sm"
            variant={canAfford ? 'default' : 'outline'}
            className="h-6 px-2 text-xs"
            disabled={!canAfford}
            onClick={() => onPurchase(bonus.id)}
            data-testid="prestige-purchase-btn"
          >
            {canAfford ? (
              <>
                <Gift className="w-3 h-3 mr-1" />
                {m(UI_LABELS.purchase)}
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 mr-1" />
                {m(UI_LABELS.purchase)}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// Prestige confirmation dialog
function PrestigeConfirmDialog({
  open,
  onOpenChange,
  pointsToEarn,
  tvl,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pointsToEarn: number;
  tvl: number;
  onConfirm: () => void;
}) {
  const m = useMessages();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            {m(UI_LABELS.confirmTitle)}
          </DialogTitle>
          <DialogDescription>
            {m(UI_LABELS.confirmDesc)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-2">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="text-xs text-muted-foreground mb-1">{m(UI_LABELS.youWillGain)}</div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span className="text-lg font-bold text-green-400">+{pointsToEarn} {m(UI_LABELS.pts)}</span>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="text-xs text-muted-foreground mb-1">{m(UI_LABELS.youWillLose)}</div>
            <ul className="text-sm space-y-1">
              <li>• All buildings and progress</li>
              <li>• Treasury: ${tvl.toLocaleString()}</li>
              <li>• Current TVL: ${tvl.toLocaleString()}</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {m(UI_LABELS.cancel)}
          </Button>
          <Button onClick={onConfirm} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Sparkles className="w-4 h-4 mr-1" />
            {m(UI_LABELS.confirm)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PrestigePanel({
  cryptoState,
  prestigeState,
  onUpdatePrestigeState,
  onPrestige,
  gameDays,
}: PrestigePanelProps) {
  const { state, setActivePanel, addNotification } = useGame();
  const m = useMessages();
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'bonuses' | 'history'>('bonuses');
  
  const { canPrestige, pointsToEarn, tvlShortfall } = getPrestigePointsPreview(
    cryptoState.tvl,
    gameDays
  );
  
  // Calculate progress to minimum TVL
  const tvlProgress = Math.min(100, (cryptoState.tvl / PRESTIGE_CONFIG.MIN_TVL_TO_PRESTIGE) * 100);
  
  // Handle bonus purchase
  const handlePurchase = useCallback((bonusId: string) => {
    const result = purchaseBonus(prestigeState, bonusId);
    
    if (result.success) {
      onUpdatePrestigeState(result.state);
      savePrestigeState(result.state);
      
      const bonus = result.state.unlockedBonuses.find(b => b.id === bonusId);
      if (bonus) {
        addNotification(
          'Bonus Purchased!',
          `You unlocked "${bonus.name}"`,
          'star'
        );
      }
    }
  }, [prestigeState, onUpdatePrestigeState, addNotification]);
  
  // Handle prestige confirmation
  const handleConfirmPrestige = useCallback(() => {
    const newState = executePrestige(prestigeState, cryptoState.tvl, gameDays);
    onUpdatePrestigeState(newState);
    savePrestigeState(newState);
    setShowConfirm(false);
    onPrestige();
    
    addNotification(
      'Prestige Complete!',
      `You earned ${pointsToEarn} prestige points!`,
      'sparkles'
    );
  }, [prestigeState, cryptoState.tvl, gameDays, onUpdatePrestigeState, onPrestige, addNotification, pointsToEarn]);
  
  // Separate purchased and unpurchased bonuses
  const purchasedBonuses = prestigeState.unlockedBonuses.filter(b => b.purchased);
  const availableBonuses = prestigeState.unlockedBonuses.filter(b => !b.purchased);
  
  return (
    <>
      <Dialog open={true} onOpenChange={() => setActivePanel('none')}>
        <DialogContent className="max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {m(UI_LABELS.title)}
            </DialogTitle>
          </DialogHeader>
          
          {/* Level and Points Display */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className="text-xs text-muted-foreground mb-1">{m(UI_LABELS.level)}</div>
              <div className="flex items-center gap-2" data-testid="prestige-level">
                <Star className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-bold">{prestigeState.level}</span>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
              <div className="text-xs text-muted-foreground mb-1">{m(UI_LABELS.points)}</div>
              <div className="flex items-center gap-2" data-testid="prestige-points">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-bold">{prestigeState.prestigePoints}</span>
              </div>
            </div>
          </div>
          
          {/* Requirements Section */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{m(UI_LABELS.requirements)}</span>
              <span className="text-xs text-muted-foreground">{m(UI_LABELS.minTvl)}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{m(UI_LABELS.currentTvl)}</span>
                <span className={`font-mono ${canPrestige ? 'text-green-400' : 'text-muted-foreground'}`}>
                  ${cryptoState.tvl.toLocaleString()}
                </span>
              </div>
              <Progress value={tvlProgress} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{m(UI_LABELS.daysSurvived)}</span>
                <span className="font-mono">{gameDays}</span>
              </div>
              
              {canPrestige && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{m(UI_LABELS.potentialPoints)}</span>
                  <span className="font-mono text-amber-400">+{pointsToEarn}</span>
                </div>
              )}
              
              {!canPrestige && tvlShortfall > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Need ${tvlShortfall.toLocaleString()} more TVL to prestige
                </div>
              )}
            </div>
          </div>
          
          {/* Prestige Button */}
          <Button
            className="w-full mb-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            disabled={!canPrestige}
            onClick={() => setShowConfirm(true)}
            data-testid="prestige-now-btn"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {m(UI_LABELS.prestigeNow)}
            {canPrestige && (
              <span className="ml-2 text-xs opacity-80">(+{pointsToEarn} pts)</span>
            )}
          </Button>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-3">
            <Button
              variant={activeTab === 'bonuses' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('bonuses')}
              className="flex-1"
            >
              <Gift className="w-4 h-4 mr-1" />
              {m(UI_LABELS.availableBonuses)}
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('history')}
              className="flex-1"
            >
              <History className="w-4 h-4 mr-1" />
              {m(UI_LABELS.history)}
            </Button>
          </div>
          
          {/* Bonuses Tab */}
          {activeTab === 'bonuses' && (
            <div className="space-y-4">
              {/* Available Bonuses */}
              {availableBonuses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">{m(UI_LABELS.availableBonuses)}</h3>
                  <div className="space-y-2">
                    {availableBonuses.map(bonus => (
                      <BonusCard
                        key={bonus.id}
                        bonus={bonus}
                        canAfford={prestigeState.prestigePoints >= bonus.cost}
                        onPurchase={handlePurchase}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Purchased Bonuses */}
              {purchasedBonuses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">{m(UI_LABELS.purchasedBonuses)}</h3>
                  <div className="space-y-2">
                    {purchasedBonuses.map(bonus => (
                      <BonusCard
                        key={bonus.id}
                        bonus={bonus}
                        canAfford={false}
                        onPurchase={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {prestigeState.prestigeHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{m(UI_LABELS.noHistory)}</p>
                </div>
              ) : (
                prestigeState.prestigeHistory.map((entry, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-medium text-amber-400">
                        +{entry.pointsEarned} pts
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>TVL: ${entry.tvlAtReset.toLocaleString()}</div>
                      <div>Days: {entry.daysSurvived}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <PrestigeConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        pointsToEarn={pointsToEarn}
        tvl={cryptoState.tvl}
        onConfirm={handleConfirmPrestige}
      />
    </>
  );
}
