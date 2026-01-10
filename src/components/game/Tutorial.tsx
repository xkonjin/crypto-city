'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, X, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GameState, Tool } from '@/types/game';

// Tutorial steps with clear objectives
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  objective: string;
  tip: string;
  isComplete: (state: GameState) => boolean;
  highlightTool?: Tool;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Crypto City!',
    description: "You're the mayor of a crypto-themed city. Build infrastructure, grow your population, and earn crypto yields!",
    objective: 'Click Next to continue',
    tip: "Your goals: Grow population to 10,000+, maintain positive treasury, and achieve 70%+ happiness. The Fear & Greed meter affects all crypto yields!",
    isComplete: () => true,
  },
  {
    id: 'zone-residential',
    title: 'Step 1: Zone Residential Areas',
    description: "Residential zones (green) are where citizens live. More residents = more tax income and workers for your crypto empire.",
    objective: 'Place at least 4 residential zone tiles',
    tip: "WHY: Population drives everything - taxes, workers, and crypto building effectiveness. Start near the center where land value is highest!",
    isComplete: (state) => {
      let count = 0;
      for (let y = 0; y < state.gridSize; y++) {
        for (let x = 0; x < state.gridSize; x++) {
          if (state.grid[y][x].zone === 'residential') count++;
        }
      }
      return count >= 4;
    },
    highlightTool: 'zone_residential',
  },
  {
    id: 'build-road',
    title: 'Step 2: Build Roads',
    description: "Roads connect zones to the city network. Without road access, zones can't develop into buildings.",
    objective: 'Build a road connecting to your zones',
    tip: "WHY: Buildings check for road adjacency before growing. No road = no development. Roads also affect land value and traffic flow.",
    isComplete: (state) => {
      let hasRoad = false;
      for (let y = 0; y < state.gridSize; y++) {
        for (let x = 0; x < state.gridSize; x++) {
          if (state.grid[y][x].building.type === 'road') {
            hasRoad = true;
            break;
          }
        }
        if (hasRoad) break;
      }
      return hasRoad;
    },
    highlightTool: 'road',
  },
  {
    id: 'build-power',
    title: 'Step 3: Power Your City',
    description: "Power plants supply electricity in a radius around them. Unpowered buildings don't function.",
    objective: 'Build a Power Plant',
    tip: "WHY: No power = no zone development, no crypto yields, unhappy citizens. Power plants also affect crypto building output!",
    isComplete: (state) => {
      for (let y = 0; y < state.gridSize; y++) {
        for (let x = 0; x < state.gridSize; x++) {
          if (state.grid[y][x].building.type === 'power_plant') return true;
        }
      }
      return false;
    },
    highlightTool: 'power_plant',
  },
  {
    id: 'build-water',
    title: 'Step 4: Water Supply',
    description: "Water towers provide water service. Like power, buildings need water to develop and function.",
    objective: 'Build a Water Tower',
    tip: "WHY: Water affects health, happiness, and building growth. Place strategically to maximize coverage radius.",
    isComplete: (state) => {
      for (let y = 0; y < state.gridSize; y++) {
        for (let x = 0; x < state.gridSize; x++) {
          if (state.grid[y][x].building.type === 'water_tower') return true;
        }
      }
      return false;
    },
    highlightTool: 'water_tower',
  },
  {
    id: 'zone-commercial',
    title: 'Step 5: Add Commerce',
    description: "Commercial zones (blue) create jobs AND generate sales tax when citizens shop. They buffer industrial pollution too!",
    objective: 'Place at least 2 commercial zone tiles',
    tip: "WHY: Jobs attract more residents. Sales tax boosts income. Pro tip: Place commercial between residential and industrial - it buffers pollution!",
    isComplete: (state) => {
      let count = 0;
      for (let y = 0; y < state.gridSize; y++) {
        for (let x = 0; x < state.gridSize; x++) {
          if (state.grid[y][x].zone === 'commercial') count++;
        }
      }
      return count >= 2;
    },
    highlightTool: 'zone_commercial',
  },
  {
    id: 'crypto-intro',
    title: 'Step 6: The Crypto Economy',
    description: "Crypto buildings generate passive yield for your treasury - like staking rewards for your city. But watch the Risk meter!",
    objective: 'Open the Crypto Buildings panel',
    tip: "WHY: Crypto yields can multiply your income but HIGH-RISK buildings can 'rug' (get destroyed). Start with LOW risk buildings, diversify across chains!",
    isComplete: (state) => state.activePanel === 'crypto',
  },
  {
    id: 'complete',
    title: 'Tutorial Complete!',
    description: "You know the basics! Watch the Fear & Greed meter - it affects ALL crypto yields. Diversify your buildings and survive the rug pulls!",
    objective: 'Start building your crypto empire',
    tip: "Remember: Treasury at $0 triggers bankruptcy (buildings decay). Daily rewards help - come back every day for streak bonuses!",
    isComplete: () => true,
  },
];

const STORAGE_KEY = 'cryptocity-tutorial-progress';
const TUTORIAL_DISMISSED_KEY = 'cryptocity-tutorial-dismissed';

interface TutorialProps {
  state: GameState;
  onHighlightTool?: (tool: Tool | null) => void;
}

export function Tutorial({ state, onHighlightTool }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const dismissed = localStorage.getItem(TUTORIAL_DISMISSED_KEY);
      if (dismissed === 'true') {
        setIsDismissed(true);
        return;
      }
      
      const progress = localStorage.getItem(STORAGE_KEY);
      if (progress) {
        const step = parseInt(progress, 10);
        if (!isNaN(step) && step >= 0 && step < TUTORIAL_STEPS.length) {
          setCurrentStep(step);
        }
      }
    } catch (e) {
      console.error('Failed to load tutorial progress:', e);
    }
  }, []);

  // Save progress
  useEffect(() => {
    if (typeof window === 'undefined' || isDismissed) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, String(currentStep));
    } catch (e) {
      console.error('Failed to save tutorial progress:', e);
    }
  }, [currentStep, isDismissed]);

  // Check step completion
  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStep];
    if (step && step.isComplete(state) && currentStep < TUTORIAL_STEPS.length - 1) {
      // Auto-advance if objective is met and not on last step
      if (step.id !== 'welcome' && step.id !== 'complete') {
        // Small delay before auto-advancing
        const timer = setTimeout(() => {
          setCurrentStep(prev => Math.min(prev + 1, TUTORIAL_STEPS.length - 1));
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [state, currentStep]);

  // Highlight tool when step changes
  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStep];
    if (step?.highlightTool && onHighlightTool) {
      onHighlightTool(step.highlightTool);
    } else if (onHighlightTool) {
      onHighlightTool(null);
    }
  }, [currentStep, onHighlightTool]);

  const handleNext = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, TUTORIAL_STEPS.length - 1));
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(TUTORIAL_DISMISSED_KEY, 'true');
      } catch (e) {
        console.error('Failed to save tutorial dismissal:', e);
      }
    }
    if (onHighlightTool) {
      onHighlightTool(null);
    }
  }, [onHighlightTool]);

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
    setIsDismissed(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(TUTORIAL_DISMISSED_KEY);
        localStorage.setItem(STORAGE_KEY, '0');
      } catch (e) {
        console.error('Failed to restart tutorial:', e);
      }
    }
  }, []);

  if (isDismissed) {
    // Show a small "?" button to restart tutorial
    return (
      <button
        onClick={handleRestart}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
        title="Restart Tutorial"
      >
        <Lightbulb className="w-5 h-5" />
      </button>
    );
  }

  const step = TUTORIAL_STEPS[currentStep];
  const isStepComplete = step.isComplete(state);
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 left-4 z-40 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 text-white shadow-lg transition-colors"
      >
        <Lightbulb className="w-4 h-4" />
        <span className="text-sm">Tutorial ({currentStep + 1}/{TUTORIAL_STEPS.length})</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden pointer-events-auto">
      {/* Header */}
      <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          <span className="font-semibold text-sm">Tutorial</span>
          <span className="text-xs opacity-75">({currentStep + 1}/{TUTORIAL_STEPS.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Minimize"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Dismiss Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground">{step.title}</h3>
        <p className="text-sm text-muted-foreground">{step.description}</p>
        
        {/* Objective */}
        <div className={cn(
          "flex items-start gap-2 p-2 rounded-md text-sm",
          isStepComplete ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
        )}>
          {isStepComplete ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <span className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0 mt-0.5" />
          )}
          <span>{step.objective}</span>
        </div>

        {/* Tip */}
        <div className="text-xs text-muted-foreground italic border-l-2 border-blue-500 pl-2">
          💡 {step.tip}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrev}
          disabled={isFirstStep}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        
        {isLastStep ? (
          <Button
            size="sm"
            onClick={handleDismiss}
          >
            Finish
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleNext}
            disabled={!isStepComplete && step.id !== 'welcome'}
          >
            {step.id === 'welcome' ? 'Start' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Export for use in settings to restart tutorial
export function resetTutorial(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TUTORIAL_DISMISSED_KEY);
    localStorage.setItem(STORAGE_KEY, '0');
  } catch (e) {
    console.error('Failed to reset tutorial:', e);
  }
}

export default Tutorial;
