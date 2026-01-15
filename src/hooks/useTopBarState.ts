/**
 * useTopBarState Hook
 * 
 * Shared state and logic for TopBar components (desktop and mobile).
 * Extracts common functionality to reduce duplication between layouts.
 * 
 * Issue #144: Create responsive component variants
 */

'use client';

import { useState, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/lib/formatters';

export interface TopBarState {
  // Game state
  cityName: string;
  year: number;
  month: number;
  day: number;
  speed: 0 | 1 | 2 | 3;
  taxRate: number;
  visualHour: number;
  stats: {
    population: number;
    jobs: number;
    money: number;
    income: number;
    expenses: number;
    happiness: number;
    health: number;
    education: number;
    safety: number;
    environment: number;
    demand: {
      residential: number;
      commercial: number;
      industrial: number;
    };
  };
  
  // UI state
  showDetails: boolean;
  showExitDialog: boolean;
  showTaxSlider: boolean;
  
  // Actions
  setSpeed: (speed: 0 | 1 | 2 | 3) => void;
  setTaxRate: (rate: number) => void;
  toggleDetails: () => void;
  toggleTaxSlider: () => void;
  openExitDialog: () => void;
  closeExitDialog: () => void;
  saveCity: () => void;
  
  // Formatted values
  formattedDate: string;
  formattedPopulation: string;
  formattedMoney: string;
  formattedMonthly: string;
  monthName: string;
  moneyVariant: 'success' | 'warning' | 'destructive';
  monthlyVariant: 'success' | 'destructive';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function useTopBarState(): TopBarState {
  const { state, setSpeed, setTaxRate, visualHour, saveCity } = useGame();
  const { stats, year, month, day, speed, taxRate, cityName } = state;
  
  // UI state
  const [showDetails, setShowDetails] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showTaxSlider, setShowTaxSlider] = useState(false);
  
  // Actions
  const toggleDetails = useCallback(() => setShowDetails(prev => !prev), []);
  const toggleTaxSlider = useCallback(() => setShowTaxSlider(prev => !prev), []);
  const openExitDialog = useCallback(() => setShowExitDialog(true), []);
  const closeExitDialog = useCallback(() => setShowExitDialog(false), []);
  
  // Formatted values
  const formattedDate = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}-${year}`;
  const formattedPopulation = formatNumber(stats.population);
  const formattedMoney = `$${formatNumber(stats.money)}`;
  const monthlyNet = stats.income - stats.expenses;
  const formattedMonthly = `$${formatNumber(Math.abs(monthlyNet))}`;
  const monthName = MONTH_NAMES[month - 1];
  
  // Variants
  const moneyVariant: 'success' | 'warning' | 'destructive' = 
    stats.money < 0 ? 'destructive' : stats.money < 1000 ? 'warning' : 'success';
  const monthlyVariant: 'success' | 'destructive' = monthlyNet >= 0 ? 'success' : 'destructive';
  
  return {
    cityName,
    year,
    month,
    day,
    speed,
    taxRate,
    visualHour,
    stats,
    showDetails,
    showExitDialog,
    showTaxSlider,
    setSpeed,
    setTaxRate,
    toggleDetails,
    toggleTaxSlider,
    openExitDialog,
    closeExitDialog,
    saveCity,
    formattedDate,
    formattedPopulation,
    formattedMoney,
    formattedMonthly,
    monthName,
    moneyVariant,
    monthlyVariant,
  };
}
