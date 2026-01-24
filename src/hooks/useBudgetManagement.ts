/**
 * Budget Management Hook
 * Issue #227: Refactor Monolithic Components
 * 
 * Extracted from GameContext.tsx to separate budget-related logic
 */

import { useState, useCallback } from 'react';

export interface Budget {
  police: number;
  fire: number;
  health: number;
  education: number;
  parks: number;
  utilities: number;
}

export const DEFAULT_BUDGET: Budget = {
  police: 50,
  fire: 50,
  health: 50,
  education: 50,
  parks: 50,
  utilities: 50,
};

export function useBudgetManagement(initialBudget: Budget = DEFAULT_BUDGET) {
  const [budget, setBudget] = useState<Budget>(initialBudget);
  const [taxRate, setTaxRate] = useState(7);
  
  const setBudgetFunding = useCallback((key: keyof Budget, funding: number) => {
    setBudget(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, funding)),
    }));
  }, []);
  
  const calculateBudgetCost = useCallback((budget: Budget): number => {
    return Object.values(budget).reduce((sum, value) => sum + value, 0);
  }, []);
  
  const calculateTaxRevenue = useCallback((population: number, taxRate: number): number => {
    return Math.floor(population * taxRate * 0.1);
  }, []);
  
  const resetBudget = useCallback(() => {
    setBudget(DEFAULT_BUDGET);
  }, []);
  
  return {
    budget,
    taxRate,
    setBudget,
    setTaxRate,
    setBudgetFunding,
    calculateBudgetCost,
    calculateTaxRevenue,
    resetBudget,
  };
}
