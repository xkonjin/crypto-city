/**
 * Tutorial Context
 * 
 * Manages the 5-step interactive tutorial for new players.
 * Tracks progress, highlights UI elements, and provides sardonic guidance.
 * 
 * Issue #150: Add 5-step interactive tutorial for new players
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  cobieComment: string;
  highlightElements: string[];  // CSS selectors or data-tutorial-id values
  action: TutorialAction;
  completionCheck?: () => boolean;
}

export type TutorialAction = 
  | { type: 'click'; target: string }
  | { type: 'place'; buildingCategory?: string }
  | { type: 'zone'; zoneType?: string }
  | { type: 'open_panel'; panel: string }
  | { type: 'any' };

export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  completedSteps: string[];
  hasSkipped: boolean;
  hasCompleted: boolean;
}

interface TutorialContextValue {
  state: TutorialState;
  currentStepData: TutorialStep | null;
  totalSteps: number;
  
  // Actions
  startTutorial: () => void;
  skipTutorial: () => void;
  completeStep: () => void;
  goToStep: (step: number) => void;
  resetTutorial: () => void;
  
  // Helpers
  isStepHighlighted: (elementId: string) => boolean;
  getHighlightedElements: () => string[];
}

// =============================================================================
// TUTORIAL STEPS
// =============================================================================

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'place_building',
    title: '🏠 Place Your First Building',
    description: 'Select a building from the sidebar and click on the grid to place it. Start with something simple like a house.',
    cobieComment: "Ah, your first building. This is where dreams begin... and sometimes end. Not financial advice, but maybe start small.",
    highlightElements: ['[data-tutorial-id="building-residential"]', '[data-tutorial-id="sidebar-buildings"]'],
    action: { type: 'place', buildingCategory: 'residential' },
  },
  {
    id: 'build_road',
    title: '🛤️ Build a Road',
    description: 'Roads connect your buildings. Select the road tool and draw a path. Roads auto-connect at intersections.',
    cobieComment: "Roads. Because even in crypto, we need infrastructure. Unlike most DeFi protocols, these actually go somewhere.",
    highlightElements: ['[data-tutorial-id="tool-road"]'],
    action: { type: 'click', target: '[data-tutorial-id="tool-road"]' },
  },
  {
    id: 'zone_area',
    title: '🏗️ Zone for Growth',
    description: 'Zones automatically develop into buildings. Paint a Residential (green), Commercial (blue), or Industrial (yellow) zone near your road.',
    cobieComment: "Zoning is like tokenomics - nobody really understands it but everyone pretends to. Green = homes, blue = shops, yellow = factories. DYOR.",
    highlightElements: ['[data-tutorial-id="zone-residential"]', '[data-tutorial-id="zone-commercial"]', '[data-tutorial-id="zone-industrial"]'],
    action: { type: 'zone' },
  },
  {
    id: 'crypto_building',
    title: '💰 Explore Crypto Buildings',
    description: 'Open the Crypto Buildings panel. These DeFi-themed buildings generate yield but carry risk. Higher yield = higher risk!',
    cobieComment: "Welcome to the casino. I mean, DeFi sector. 127 buildings, each with their own way to potentially lose your treasury. But also gains!",
    highlightElements: ['[data-tutorial-id="crypto-panel-button"]', '[data-tutorial-id="crypto-panel"]'],
    action: { type: 'open_panel', panel: 'crypto' },
  },
  {
    id: 'monitor_city',
    title: '📊 Monitor Your City',
    description: 'Check the Statistics panel to see your city\'s health. Watch your treasury, population, and yields. Balance is key!',
    cobieComment: "Congratulations, you're now a city manager. May your yields be high and your rugs be few. Now go build something beautiful.",
    highlightElements: ['[data-tutorial-id="stats-button"]', '[data-tutorial-id="topbar-stats"]'],
    action: { type: 'open_panel', panel: 'statistics' },
  },
];

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = 'cryptocity-tutorial';

function loadTutorialState(): TutorialState {
  if (typeof window === 'undefined') {
    return getInitialState();
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load tutorial state:', error);
  }
  
  return getInitialState();
}

function saveTutorialState(state: TutorialState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save tutorial state:', error);
  }
}

function getInitialState(): TutorialState {
  return {
    isActive: false,
    currentStep: 0,
    completedSteps: [],
    hasSkipped: false,
    hasCompleted: false,
  };
}

function getInitialTutorialState(autoStartForNewUsers: boolean): TutorialState {
  const loaded = loadTutorialState();
  if (
    autoStartForNewUsers &&
    !loaded.hasCompleted &&
    !loaded.hasSkipped &&
    loaded.completedSteps.length === 0
  ) {
    return { ...loaded, isActive: true };
  }
  return loaded;
}

// =============================================================================
// CONTEXT
// =============================================================================

const TutorialContext = createContext<TutorialContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface TutorialProviderProps {
  children: React.ReactNode;
  autoStartForNewUsers?: boolean;
}

export function TutorialProvider({ 
  children,
  autoStartForNewUsers = true,
}: TutorialProviderProps) {
  const [state, setState] = useState<TutorialState>(() => getInitialTutorialState(autoStartForNewUsers));
  
  // Save state on change
  useEffect(() => {
    saveTutorialState(state);
  }, [state]);
  
  const startTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
    }));
  }, []);
  
  const skipTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      hasSkipped: true,
    }));
  }, []);
  
  const completeStep = useCallback(() => {
    setState(prev => {
      const currentStepData = TUTORIAL_STEPS[prev.currentStep];
      const newCompletedSteps = currentStepData 
        ? [...prev.completedSteps, currentStepData.id]
        : prev.completedSteps;
      
      const nextStep = prev.currentStep + 1;
      const isComplete = nextStep >= TUTORIAL_STEPS.length;
      
      return {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: isComplete ? prev.currentStep : nextStep,
        isActive: !isComplete,
        hasCompleted: isComplete || prev.hasCompleted,
      };
    });
  }, []);
  
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TUTORIAL_STEPS.length) {
      setState(prev => ({
        ...prev,
        currentStep: step,
        isActive: true,
      }));
    }
  }, []);
  
  const resetTutorial = useCallback(() => {
    setState({
      isActive: true,
      currentStep: 0,
      completedSteps: [],
      hasSkipped: false,
      hasCompleted: false,
    });
  }, []);
  
  const isStepHighlighted = useCallback((elementId: string) => {
    if (!state.isActive) return false;
    const currentStepData = TUTORIAL_STEPS[state.currentStep];
    if (!currentStepData) return false;
    
    return currentStepData.highlightElements.some(selector => {
      if (selector.includes(elementId)) return true;
      // Also check for data-tutorial-id matches
      return selector === `[data-tutorial-id="${elementId}"]`;
    });
  }, [state.isActive, state.currentStep]);
  
  const getHighlightedElements = useCallback(() => {
    if (!state.isActive) return [];
    const currentStepData = TUTORIAL_STEPS[state.currentStep];
    return currentStepData?.highlightElements || [];
  }, [state.isActive, state.currentStep]);
  
  const currentStepData = state.isActive ? TUTORIAL_STEPS[state.currentStep] || null : null;
  
  const value: TutorialContextValue = {
    state,
    currentStepData,
    totalSteps: TUTORIAL_STEPS.length,
    startTutorial,
    skipTutorial,
    completeStep,
    goToStep,
    resetTutorial,
    isStepHighlighted,
    getHighlightedElements,
  };
  
  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useTutorial(): TutorialContextValue {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

// =============================================================================
// TUTORIAL OVERLAY COMPONENT
// =============================================================================

export function TutorialOverlay() {
  const { 
    state, 
    currentStepData, 
    totalSteps,
    skipTutorial, 
    completeStep,
  } = useTutorial();
  
  if (!state.isActive || !currentStepData) {
    return null;
  }
  
  return (
    <div className="fixed bottom-20 left-4 z-50 max-w-sm animate-fadeIn">
      <div className="bg-panel/95 backdrop-blur-md border border-panel-border rounded-lg shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-panel-border">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((state.currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Step indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {state.currentStep + 1} of {totalSteps}</span>
            <button 
              onClick={skipTutorial}
              className="hover:text-foreground transition-colors"
            >
              Skip Tutorial
            </button>
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-lg">{currentStepData.title}</h3>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground">
            {currentStepData.description}
          </p>
          
          {/* Cobie comment */}
          <div className="bg-secondary/50 rounded p-3 text-xs italic text-muted-foreground border-l-2 border-primary">
            <span className="font-medium text-foreground">🧠 Cobie:</span>{' '}
            &ldquo;{currentStepData.cobieComment}&rdquo;
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={completeStep}
              className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {state.currentStep === totalSteps - 1 ? 'Finish' : 'Got it!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HIGHLIGHT WRAPPER
// =============================================================================

interface TutorialHighlightProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function TutorialHighlight({ id, children, className = '' }: TutorialHighlightProps) {
  const { isStepHighlighted } = useTutorial();
  const highlighted = isStepHighlighted(id);
  
  return (
    <div 
      data-tutorial-id={id}
      className={`
        ${className}
        ${highlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse' : ''}
      `}
    >
      {children}
    </div>
  );
}
