'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Flame, 
  Trophy,
  ChevronRight,
  X,
  Coins,
  Target,
  AlertTriangle,
} from 'lucide-react';
import type { 
  DaySummary, 
  DailyGoal, 
  EngagementStreak,
  CliffhangerEvent,
} from '@/lib/engagementHooks';

// ============================================
// TYPES
// ============================================

export interface DaySummaryModalProps {
  isOpen: boolean;
  summary: DaySummary | null;
  goals: DailyGoal[];
  streak: EngagementStreak;
  teaser: CliffhangerEvent | null;
  autoAdvance: boolean;
  onContinue: () => void;
  onToggleAutoAdvance: (enabled: boolean) => void;
  onClose?: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  }
  return `$${num.toLocaleString()}`;
}

function formatChange(num: number): { text: string; isPositive: boolean } {
  const isPositive = num >= 0;
  const prefix = isPositive ? '+' : '';
  return {
    text: `${prefix}${formatNumber(num)}`,
    isPositive,
  };
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatCard({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  change?: { text: string; isPositive: boolean };
  icon: React.ElementType;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      {change && (
        <div className={cn(
          'text-sm mt-1',
          change.isPositive ? 'text-green-400' : 'text-red-400'
        )}>
          {change.text}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal }: { goal: DailyGoal }) {
  const progress = Math.min((goal.current / goal.target) * 100, 100);
  
  return (
    <div className={cn(
      'p-3 rounded-lg border',
      goal.completed 
        ? 'bg-green-500/10 border-green-500/30' 
        : 'bg-gray-800/50 border-gray-700/50'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{goal.icon}</span>
          <span className={cn(
            'text-sm font-medium',
            goal.completed ? 'text-green-400' : 'text-white'
          )}>
            {goal.description}
          </span>
        </div>
        {goal.completed && <Trophy className="w-4 h-4 text-yellow-400" />}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-500',
              goal.completed ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {goal.current}/{goal.target}
        </span>
      </div>
      
      {goal.completed && (
        <div className="mt-2 text-sm text-green-400">
          +{formatNumber(goal.reward)} earned!
        </div>
      )}
    </div>
  );
}

function StreakDisplay({ streak }: { streak: EngagementStreak }) {
  if (streak.currentStreak <= 0) return null;
  
  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30">
      <div className="w-12 h-12 bg-orange-500/30 rounded-full flex items-center justify-center">
        <Flame className="w-6 h-6 text-orange-400" />
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-400">Current Streak</div>
        <div className="text-2xl font-bold text-white">
          {streak.currentStreak} {streak.currentStreak === 1 ? 'day' : 'days'}
        </div>
        {streak.streakBonus > 0 && (
          <div className="text-sm text-green-400">
            +{(streak.streakBonus * 100).toFixed(0)}% yield bonus active!
          </div>
        )}
      </div>
      {streak.highestStreak > streak.currentStreak && (
        <div className="text-right">
          <div className="text-xs text-gray-400">Best</div>
          <div className="text-sm font-medium text-gray-300">{streak.highestStreak} days</div>
        </div>
      )}
    </div>
  );
}

function TeaserCard({ teaser }: { teaser: CliffhangerEvent }) {
  return (
    <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500/30 rounded-full flex items-center justify-center">
          <span className="text-xl">{teaser.icon}</span>
        </div>
        <div className="flex-1">
          <div className="text-xs text-purple-400 uppercase tracking-wide mb-1">
            Tomorrow&apos;s Forecast
          </div>
          <div className="text-white italic">&ldquo;{teaser.message}&rdquo;</div>
        </div>
        <ChevronRight className="w-5 h-5 text-purple-400" />
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

function DaySummaryModalContent({
  isOpen,
  summary,
  goals,
  streak,
  teaser,
  autoAdvance,
  onContinue,
  onToggleAutoAdvance,
  onClose,
}: DaySummaryModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: animation state must sync with visibility
      setShouldRender(true);
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
  }, [isOpen]);

  const handleContinue = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onContinue();
    }, 150);
  }, [onContinue]);

  if (!shouldRender || !summary) return null;

  const treasuryChange = formatChange(summary.treasuryChange);
  const tvlChange = formatChange(summary.tvlChange);
  const completedGoals = goals.filter(g => g.completed);
  const totalGoalReward = completedGoals.reduce((sum, g) => sum + g.reward, 0);

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
          'relative max-w-lg w-full max-h-[90vh] overflow-y-auto',
          'bg-gray-900 rounded-2xl shadow-2xl',
          'transition-all duration-300 ease-out',
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          'border-2 border-blue-500/50'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-blue-600/30 border-b border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Day {summary.day} Complete</h2>
                <p className="text-sm text-gray-400">Here&apos;s how you did</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Streak Display */}
          <StreakDisplay streak={streak} />
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard 
              label="Treasury" 
              value={formatNumber(summary.treasuryChange + 100000)} // Approximate current
              change={treasuryChange}
              icon={Coins}
            />
            <StatCard 
              label="TVL Change" 
              value={tvlChange.text}
              change={tvlChange}
              icon={tvlChange.isPositive ? TrendingUp : TrendingDown}
            />
            <StatCard 
              label="Buildings Built" 
              value={summary.buildingsPlaced.toString()}
              icon={Building2}
            />
            <StatCard 
              label="Buildings Lost" 
              value={summary.buildingsLost.toString()}
              icon={summary.buildingsLost > 0 ? AlertTriangle : Building2}
            />
          </div>
          
          {/* Yield Summary */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Total Yield Earned</span>
              </div>
              <span className="text-xl font-bold text-green-400">
                {formatNumber(summary.totalYield)}
              </span>
            </div>
          </div>
          
          {/* Daily Goals */}
          {goals.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  Daily Goals
                </h3>
                <span className="text-sm text-gray-400">
                  {completedGoals.length}/{goals.length} completed
                </span>
              </div>
              
              <div className="space-y-2">
                {goals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
              
              {totalGoalReward > 0 && (
                <div className="text-center text-green-400 font-medium">
                  Total earned from goals: {formatNumber(totalGoalReward)}
                </div>
              )}
            </div>
          )}
          
          {/* Achievements */}
          {summary.achievements.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Achievements Unlocked
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.achievements.map((achievement, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-sm text-yellow-400"
                  >
                    {achievement}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Prestige Coins */}
          {summary.coinsEarned > 0 && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🪙</span>
                  <span className="text-gray-300">Prestige Coins Earned</span>
                </div>
                <span className="text-xl font-bold text-purple-400">
                  +{summary.coinsEarned}
                </span>
              </div>
            </div>
          )}
          
          {/* Tomorrow's Teaser */}
          {teaser && <TeaserCard teaser={teaser} />}
          
          {/* Auto-advance Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <label className="text-sm text-gray-300 cursor-pointer" htmlFor="auto-advance">
              Auto-advance days
            </label>
            <button
              id="auto-advance"
              role="switch"
              aria-checked={autoAdvance}
              onClick={() => onToggleAutoAdvance(!autoAdvance)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                autoAdvance ? 'bg-blue-500' : 'bg-gray-600'
              )}
            >
              <span 
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                  autoAdvance && 'translate-x-5'
                )}
              />
            </button>
          </div>
          
          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full py-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg font-bold rounded-lg transition-all"
          >
            Continue to Day {summary.day + 1}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
        
        {/* Decorative corners */}
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-blue-500/30" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-blue-500/30" />
      </div>
    </div>
  );
}

// ============================================
// EXPORT WITH PORTAL
// ============================================

export function DaySummaryModal(props: DaySummaryModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: client-side portal mounting detection
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <DaySummaryModalContent {...props} />,
    document.body
  );
}

export default DaySummaryModal;
