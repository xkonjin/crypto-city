'use client';

import React, { useState, useEffect } from 'react';
import { Target, Trophy, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { DailyGoal } from '@/lib/engagementHooks';

export interface DailyGoalsPanelProps {
  goals: DailyGoal[];
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(0)}K`;
  }
  return `$${num.toLocaleString()}`;
}

function GoalItem({ goal }: { goal: DailyGoal }) {
  const progress = Math.min((goal.current / goal.target) * 100, 100);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Show animation when goal is completed
  useEffect(() => {
    if (goal.completed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: animation state must sync with completion
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [goal.completed]);

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all duration-300',
        goal.completed
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50',
        showAnimation && 'ring-2 ring-green-400 ring-opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{goal.icon}</span>
          <span
            className={cn(
              'text-sm font-medium truncate',
              goal.completed ? 'text-green-400' : 'text-white'
            )}
          >
            {goal.description}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {goal.completed ? (
            <Trophy className="w-4 h-4 text-yellow-400" />
          ) : (
            <span className="text-xs text-green-400 font-medium">
              {formatNumber(goal.reward)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Progress
          value={progress}
          className={cn(
            'h-1.5 flex-1',
            goal.completed ? '[&>div]:bg-green-500' : '[&>div]:bg-blue-500'
          )}
        />
        <span className="text-xs text-gray-400 whitespace-nowrap min-w-[3rem] text-right">
          {goal.current}/{goal.target}
        </span>
      </div>

      {goal.completed && (
        <div className="mt-2 flex items-center gap-1 text-sm text-green-400">
          <Trophy className="w-3 h-3" />
          <span>+{formatNumber(goal.reward)} earned!</span>
        </div>
      )}
    </div>
  );
}

export function DailyGoalsPanel({
  goals,
  className,
  collapsed = false,
  onToggleCollapse,
}: DailyGoalsPanelProps) {
  const completedCount = goals.filter((g) => g.completed).length;
  const totalReward = goals
    .filter((g) => g.completed)
    .reduce((sum, g) => sum + g.reward, 0);

  // Calculate time remaining (simplified - assumes goals expire at end of day)
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (goals.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700/50',
        'shadow-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={onToggleCollapse}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between',
          'bg-gradient-to-r from-blue-600/20 to-purple-600/20',
          'hover:from-blue-600/30 hover:to-purple-600/30 transition-colors',
          'border-b border-gray-700/50'
        )}
      >
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white">Daily Goals</span>
          <span className="text-sm text-gray-400">
            ({completedCount}/{goals.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{timeRemaining}</span>
          </div>
          {onToggleCollapse && (
            collapsed ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            )
          )}
        </div>
      </button>

      {/* Goals List */}
      {!collapsed && (
        <div className="p-3 space-y-2">
          {goals.map((goal) => (
            <GoalItem key={goal.id} goal={goal} />
          ))}

          {/* Total Rewards */}
          {totalReward > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between text-sm">
              <span className="text-gray-400">Total earned today:</span>
              <span className="text-green-400 font-bold">
                {formatNumber(totalReward)}
              </span>
            </div>
          )}

          {/* Completion Message */}
          {completedCount === goals.length && goals.length > 0 && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded text-center">
              <span className="text-sm text-green-400 font-medium">
                🎉 All goals completed!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DailyGoalsPanel;
