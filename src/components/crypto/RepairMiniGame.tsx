/**
 * Repair Mini-Game Component (Issue #55)
 * 
 * A quick mini-game where players click rapidly to repair a damaged building
 * at a 50% discount. Players must reach 100% progress within 5 seconds.
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { cryptoEconomy, ECONOMY_CONFIG } from '@/games/isocity/crypto';
import type { RepairMiniGame as RepairMiniGameState } from '@/games/isocity/crypto';

// =============================================================================
// TYPES
// =============================================================================

interface RepairMiniGameProps {
  miniGame: RepairMiniGameState;
  buildingName: string;
  repairCost: number;
  onClose: () => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function RepairMiniGame({
  miniGame,
  buildingName,
  repairCost,
  onClose,
}: RepairMiniGameProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { progress, timeRemaining, targetProgress } = miniGame;
  const discount = ECONOMY_CONFIG.REPAIR_MINIGAME.SUCCESS_DISCOUNT;
  const discountedCost = Math.floor(repairCost * (1 - discount));
  
  // Timer countdown
  useEffect(() => {
    if (!miniGame.isActive) return;
    
    timerRef.current = setInterval(() => {
      const remaining = cryptoEconomy.updateRepairMiniGameTimer();
      if (remaining <= 0) {
        // Game ended (either success or failure)
        onClose();
      }
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [miniGame.isActive, onClose]);
  
  const handleClick = useCallback(() => {
    const newProgress = cryptoEconomy.clickRepairMiniGame();
    if (newProgress >= targetProgress) {
      // Success! Component will close via the effect
    }
  }, [targetProgress]);
  
  const handleCancel = () => {
    cryptoEconomy.cancelRepairMiniGame();
    onClose();
  };
  
  const progressPercent = (progress / targetProgress) * 100;
  const isSuccess = progress >= targetProgress;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-gray-900/95 rounded-xl border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <div>
              <h2 className="font-bold text-lg text-white">Repair Mini-Game</h2>
              <p className="text-xs text-gray-400">{buildingName}</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>
        
        {/* Cost info */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-800/50 rounded-lg">
          <div>
            <div className="text-xs text-gray-400">Normal Cost</div>
            <div className="text-sm font-mono text-gray-500 line-through">${formatNumber(repairCost)}</div>
          </div>
          <div className="text-2xl">→</div>
          <div>
            <div className="text-xs text-green-400">Win to Pay Only</div>
            <div className="text-lg font-mono text-green-400">${formatNumber(discountedCost)}</div>
          </div>
          <div className="text-xs text-amber-400 font-medium">50% OFF!</div>
        </div>
        
        {/* Timer */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className={`text-4xl font-bold font-mono ${timeRemaining <= 2 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
            {timeRemaining}
          </span>
          <span className="text-lg text-gray-400">seconds</span>
        </div>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs font-mono text-amber-400">{Math.floor(progressPercent)}%</span>
          </div>
          <div className="h-6 bg-gray-700 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-100 ${
                isSuccess 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
            {/* Target marker */}
            <div className="absolute top-0 right-0 w-0.5 h-full bg-white/50" />
          </div>
        </div>
        
        {/* Click area */}
        <button
          onClick={handleClick}
          disabled={isSuccess}
          className={`
            w-full h-32 rounded-xl border-2 border-dashed transition-all
            flex flex-col items-center justify-center gap-2
            ${isSuccess
              ? 'bg-green-900/30 border-green-500/50 cursor-default'
              : 'bg-amber-900/20 border-amber-500/50 hover:bg-amber-900/40 active:scale-95 cursor-pointer'
            }
          `}
        >
          {isSuccess ? (
            <>
              <span className="text-5xl">✅</span>
              <span className="text-xl font-bold text-green-400">SUCCESS!</span>
            </>
          ) : (
            <>
              <span className="text-5xl animate-bounce">👆</span>
              <span className="text-xl font-bold text-amber-400">CLICK RAPIDLY!</span>
              <span className="text-sm text-gray-400">Fill the bar before time runs out</span>
            </>
          )}
        </button>
        
        {/* Instructions */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Click the button rapidly to fill the progress bar.
          <br />
          Reach 100% before time runs out to get 50% off repairs!
        </div>
      </div>
    </div>
  );
}
