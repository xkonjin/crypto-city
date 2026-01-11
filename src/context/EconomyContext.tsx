/**
 * EconomyContext - Economy-related state management
 * 
 * Manages:
 * - Money/treasury
 * - Tax rate
 * - Income/expenses
 * - Budget-related state
 */
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { Budget, Stats } from "@/types/game";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export interface EconomyState {
  money: number;
  taxRate: number;
  effectiveTaxRate: number;
  income: number;
  expenses: number;
  budget: Budget;
  cryptoTaxRevenue: number;
}

export interface EconomyContextValue {
  // State
  money: number;
  taxRate: number;
  effectiveTaxRate: number;
  income: number;
  expenses: number;
  budget: Budget;
  cryptoTaxRevenue: number;
  
  // Actions
  setTaxRate: (rate: number) => void;
  setBudgetFunding: (key: keyof Budget, funding: number) => void;
  addMoney: (amount: number) => void;
  setCryptoTaxRevenue: (revenue: number) => void;
  
  // State update (used by GameContext orchestrator)
  updateEconomyState: (state: Partial<EconomyState>) => void;
}

const EconomyContext = createContext<EconomyContextValue | null>(null);

const DEFAULT_BUDGET: Budget = {
  fire: { name: "Fire", funding: 100, cost: 0 },
  police: { name: "Police", funding: 100, cost: 0 },
  health: { name: "Health", funding: 100, cost: 0 },
  education: { name: "Education", funding: 100, cost: 0 },
  transportation: { name: "Transportation", funding: 100, cost: 0 },
  parks: { name: "Parks", funding: 100, cost: 0 },
  power: { name: "Power", funding: 100, cost: 0 },
  water: { name: "Water", funding: 100, cost: 0 },
};

const DEFAULT_ECONOMY_STATE: EconomyState = {
  money: 50000,
  taxRate: 9,
  effectiveTaxRate: 9,
  income: 0,
  expenses: 0,
  budget: DEFAULT_BUDGET,
  cryptoTaxRevenue: 0,
};

export function EconomyProvider({ 
  children,
  initialState = DEFAULT_ECONOMY_STATE 
}: { 
  children: React.ReactNode;
  initialState?: Partial<EconomyState>;
}) {
  const [state, setState] = useState<EconomyState>({
    ...DEFAULT_ECONOMY_STATE,
    ...initialState,
    budget: { ...DEFAULT_BUDGET, ...initialState?.budget },
  });

  const setTaxRate = useCallback((rate: number) => {
    setState((prev) => ({ ...prev, taxRate: clamp(rate, 0, 100) }));
  }, []);

  const setBudgetFunding = useCallback((key: keyof Budget, funding: number) => {
    const clamped = clamp(funding, 0, 100);
    setState((prev) => ({
      ...prev,
      budget: {
        ...prev.budget,
        [key]: { ...prev.budget[key], funding: clamped },
      },
    }));
  }, []);

  const addMoney = useCallback((amount: number) => {
    setState((prev) => ({
      ...prev,
      money: prev.money + amount,
    }));
  }, []);

  const setCryptoTaxRevenue = useCallback((revenue: number) => {
    setState((prev) => ({
      ...prev,
      cryptoTaxRevenue: Math.floor(revenue),
      income: prev.income - (prev.cryptoTaxRevenue || 0) + Math.floor(revenue),
    }));
  }, []);

  const updateEconomyState = useCallback((updates: Partial<EconomyState>) => {
    setState((prev) => ({
      ...prev,
      ...updates,
      budget: updates.budget ? { ...prev.budget, ...updates.budget } : prev.budget,
    }));
  }, []);

  const value: EconomyContextValue = {
    money: state.money,
    taxRate: state.taxRate,
    effectiveTaxRate: state.effectiveTaxRate,
    income: state.income,
    expenses: state.expenses,
    budget: state.budget,
    cryptoTaxRevenue: state.cryptoTaxRevenue,
    setTaxRate,
    setBudgetFunding,
    addMoney,
    setCryptoTaxRevenue,
    updateEconomyState,
  };

  return (
    <EconomyContext.Provider value={value}>
      {children}
    </EconomyContext.Provider>
  );
}

export function useEconomy() {
  const ctx = useContext(EconomyContext);
  if (!ctx) {
    throw new Error("useEconomy must be used within an EconomyProvider");
  }
  return ctx;
}

export { EconomyContext };
