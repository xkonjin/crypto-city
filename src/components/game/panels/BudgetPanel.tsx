'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { msg, useMessages } from 'gt-next';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cryptoEconomy, CryptoEconomyState } from '@/games/isocity/crypto';
import { getOrdinanceManager } from '@/lib/ordinances';

// Translatable UI labels
const UI_LABELS = {
  budget: msg('Budget'),
  income: msg('Income'),
  expenses: msg('Expenses'),
  net: msg('Net'),
  incomeBreakdown: msg('Income Breakdown'),
  taxRevenue: msg('Tax Revenue'),
  cryptoTax: msg('Crypto Tax'),
  totalIncome: msg('Total Income'),
  cryptoExpenses: msg('Crypto Expenses'),
  maintenance: msg('Maintenance'),
  services: msg('Services'),
  ordinances: msg('Ordinances'),
};

export function BudgetPanel() {
  const { state, setActivePanel, setBudgetFunding } = useGame();
  const { budget, stats } = state;
  const m = useMessages();
  
  // Subscribe to crypto economy state
  const [economyState, setEconomyState] = useState<CryptoEconomyState>(
    cryptoEconomy.getState()
  );
  
  useEffect(() => {
    const unsubscribe = cryptoEconomy.subscribe(setEconomyState);
    return unsubscribe;
  }, []);
  
  // Get ordinance manager for costs
  const ordinanceManager = useMemo(() => getOrdinanceManager(), []);
  const ordinanceDailyCost = ordinanceManager.getDailyCost();
  
  // Crypto economy costs
  const maintenanceCost = economyState.dailyMaintenanceCost || 0;
  const serviceCost = economyState.dailyServiceCost || 0;
  const totalCryptoExpenses = maintenanceCost + serviceCost + ordinanceDailyCost;
  
  const categories = [
    { key: 'police', ...budget.police },
    { key: 'fire', ...budget.fire },
    { key: 'health', ...budget.health },
    { key: 'education', ...budget.education },
    { key: 'transportation', ...budget.transportation },
    { key: 'parks', ...budget.parks },
    { key: 'power', ...budget.power },
    { key: 'water', ...budget.water },
  ];
  
  return (
    <Dialog open={true} onOpenChange={() => setActivePanel('none')}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{m(UI_LABELS.budget)}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Income Breakdown Section */}
          <div className="pb-4 border-b border-border">
            <div className="text-muted-foreground text-xs mb-2 font-medium">{m(UI_LABELS.incomeBreakdown)}</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{m(UI_LABELS.taxRevenue)}</span>
                <span className="text-green-400 font-mono">${(stats.income - (stats.cryptoTaxRevenue || 0)).toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{m(UI_LABELS.cryptoTax)}</span>
                <span className="text-amber-400 font-mono">${(stats.cryptoTaxRevenue || 0).toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/50">
                <span className="text-muted-foreground font-medium">{m(UI_LABELS.totalIncome)}</span>
                <span className="text-green-400 font-mono font-medium">${stats.income.toLocaleString()}/mo</span>
              </div>
            </div>
          </div>
          
          {/* Crypto Expenses Section (only show if there are crypto expenses) */}
          {totalCryptoExpenses > 0 && (
            <div className="pb-4 border-b border-border">
              <div className="text-muted-foreground text-xs mb-2 font-medium">{m(UI_LABELS.cryptoExpenses)}</div>
              <div className="space-y-1 text-sm">
                {maintenanceCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{m(UI_LABELS.maintenance)}</span>
                    <span className="text-red-400 font-mono">-${maintenanceCost.toLocaleString()}/day</span>
                  </div>
                )}
                {serviceCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{m(UI_LABELS.services)}</span>
                    <span className="text-red-400 font-mono">-${serviceCost.toLocaleString()}/day</span>
                  </div>
                )}
                {ordinanceDailyCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{m(UI_LABELS.ordinances)}</span>
                    <span className="text-amber-400 font-mono">-${ordinanceDailyCost.toLocaleString()}/day</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border">
            <div>
              <div className="text-muted-foreground text-xs mb-1">{m(UI_LABELS.income)}</div>
              <div className="text-green-400 font-mono">${stats.income.toLocaleString()}/mo</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs mb-1">{m(UI_LABELS.expenses)}</div>
              <div className="text-red-400 font-mono">${stats.expenses.toLocaleString()}/mo</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs mb-1">{m(UI_LABELS.net)}</div>
              <div className={`font-mono ${stats.income - stats.expenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${(stats.income - stats.expenses).toLocaleString()}/mo
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {categories.map(cat => (
              <div key={cat.key} className="flex items-center gap-4">
                <Label className="w-28 text-sm">{cat.name}</Label>
                <Slider
                  value={[cat.funding]}
                  onValueChange={(value) => setBudgetFunding(cat.key as keyof typeof budget, value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="w-12 text-right font-mono text-sm">{cat.funding}%</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
