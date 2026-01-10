'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trophy, Skull, RefreshCw, Play, X } from 'lucide-react';
import { 
  GameEndStats, 
  getCobieEndMessage,
  WIN_CONDITIONS,
  LOSE_CONDITIONS,
} from '@/lib/gameObjectives';

export interface GameEndModalProps {
  isOpen: boolean;
  isVictory: boolean;
  endReason: string;
  endConditionId: string;
  stats: GameEndStats;
  onPlayAgain: () => void;
  onContinueSandbox: () => void;
  onClose?: () => void;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  }
  return `$${num.toLocaleString()}`;
}

function formatPopulation(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

function GameEndModalContent({
  isOpen,
  isVictory,
  endReason,
  endConditionId,
  stats,
  onPlayAgain,
  onContinueSandbox,
  onClose,
}: GameEndModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [cobieMessage, setCobieMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setCobieMessage(getCobieEndMessage(endConditionId, isVictory));
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, endConditionId, isVictory]);

  if (!shouldRender) return null;

  // Get condition details
  const condition = isVictory
    ? WIN_CONDITIONS.find(c => c.id === endConditionId)
    : LOSE_CONDITIONS.find(c => c.id === endConditionId);

  const conditionIcon = condition?.icon || (isVictory ? '🏆' : '💀');
  const conditionName = condition?.name || endReason;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10000] flex items-center justify-center p-4',
        'transition-opacity duration-300 ease-out',
        isAnimating ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          'absolute inset-0 bg-black/80 backdrop-blur-sm',
          'transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={cn(
          'relative max-w-lg w-full bg-gray-900 rounded-2xl shadow-2xl overflow-hidden',
          'transition-all duration-300 ease-out',
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          isVictory 
            ? 'border-2 border-amber-500/50' 
            : 'border-2 border-red-500/50'
        )}
      >
        {/* Header gradient */}
        <div 
          className={cn(
            'absolute top-0 left-0 right-0 h-32',
            isVictory 
              ? 'bg-gradient-to-b from-amber-500/30 via-amber-500/10 to-transparent' 
              : 'bg-gradient-to-b from-red-500/30 via-red-500/10 to-transparent'
          )} 
        />
        
        {/* Close button (only in victory/for dismissing) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* Content */}
        <div className="relative p-6 pt-8">
          {/* Victory/Game Over Icon */}
          <div className="flex justify-center mb-4">
            <div 
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center text-4xl',
                isVictory 
                  ? 'bg-amber-500/20 ring-4 ring-amber-500/30' 
                  : 'bg-red-500/20 ring-4 ring-red-500/30'
              )}
            >
              {isVictory ? <Trophy className="w-10 h-10 text-amber-400" /> : <Skull className="w-10 h-10 text-red-400" />}
            </div>
          </div>
          
          {/* Title */}
          <h2 
            className={cn(
              'text-3xl font-bold text-center mb-2',
              isVictory ? 'text-amber-400' : 'text-red-400'
            )}
          >
            {isVictory ? 'Victory!' : 'Game Over'}
          </h2>
          
          {/* Condition achieved */}
          <div className="text-center mb-6">
            <span className="text-2xl mr-2">{conditionIcon}</span>
            <span className="text-lg text-gray-300">{conditionName}</span>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard label="Days Survived" value={stats.daysSurvived.toString()} icon="📅" />
            <StatCard label="Peak TVL" value={formatNumber(stats.peakTVL)} icon="💰" />
            <StatCard label="Peak Population" value={formatPopulation(stats.peakPopulation)} icon="👥" />
            <StatCard label="Buildings Built" value={stats.peakBuildingCount.toString()} icon="🏗️" />
            <StatCard label="Total Yield" value={formatNumber(stats.totalYieldEarned)} icon="📈" />
            <StatCard label="Final Treasury" value={formatNumber(stats.finalTreasury)} icon="🏦" />
          </div>
          
          {/* Cobie Message */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700/50">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                <Image
                  src="/assets/cobie-avatar.svg"
                  alt="Cobie"
                  width={40}
                  height={40}
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white">Cobie</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                    {isVictory ? 'GG' : 'RIP'}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed italic">
                  &ldquo;{cobieMessage}&rdquo;
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onPlayAgain}
              className={cn(
                'flex-1 gap-2',
                isVictory 
                  ? 'bg-amber-500 hover:bg-amber-600 text-black' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Play Again
            </Button>
            <Button
              onClick={onContinueSandbox}
              variant="outline"
              className="flex-1 gap-2 border-gray-600 hover:bg-gray-800"
            >
              <Play className="w-4 h-4" />
              Continue in Sandbox
            </Button>
          </div>
        </div>
        
        {/* Decorative corners */}
        <div className={cn(
          'absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2',
          isVictory ? 'border-amber-500/30' : 'border-red-500/30'
        )} />
        <div className={cn(
          'absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2',
          isVictory ? 'border-amber-500/30' : 'border-red-500/30'
        )} />
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string; 
  icon: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}

export function GameEndModal(props: GameEndModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <GameEndModalContent {...props} />,
    document.body
  );
}
