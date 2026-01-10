'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Flame, Calendar, X, ChevronRight } from 'lucide-react';
import {
  canClaimDailyReward,
  claimDailyReward,
  previewDailyReward,
  getCurrentStreak,
  getStreakDisplayText,
  getNextMilestone,
  loadDailyRewardState,
  type DailyReward,
} from '@/lib/dailyRewards';

interface DailyRewardsProps {
  onClaimReward?: (amount: number) => void;
}

export function DailyRewards({ onClaimReward }: DailyRewardsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [reward, setReward] = useState<DailyReward | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasClaimedThisSession, setHasClaimedThisSession] = useState(false);
  const [showClaimed, setShowClaimed] = useState(false);
  
  // Check claim status on mount
  useEffect(() => {
    const checkStatus = () => {
      const claimable = canClaimDailyReward();
      setCanClaim(claimable);
      setCurrentStreak(getCurrentStreak());
      
      if (claimable) {
        setReward(previewDailyReward());
      }
    };
    
    checkStatus();
    
    // Check again at midnight (roughly)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timer = setTimeout(checkStatus, msUntilMidnight + 1000);
    return () => clearTimeout(timer);
  }, [hasClaimedThisSession]);
  
  const handleClaim = useCallback(() => {
    const claimedReward = claimDailyReward();
    if (claimedReward) {
      setReward(claimedReward);
      setCanClaim(false);
      setHasClaimedThisSession(true);
      setShowClaimed(true);
      setCurrentStreak(getCurrentStreak());
      
      // Notify parent to add to treasury
      onClaimReward?.(claimedReward.totalAmount);
      
      // Hide claimed message after 3 seconds
      setTimeout(() => setShowClaimed(false), 3000);
    }
  }, [onClaimReward]);
  
  // Don't show if already claimed today and not just claimed
  if (!canClaim && !showClaimed && !isOpen) {
    return null;
  }
  
  // Collapsed state - just show the claim button
  if (!isOpen && canClaim) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-lg shadow-lg animate-pulse transition-all"
      >
        <Gift className="w-5 h-5" />
        <span className="font-semibold">Daily Reward!</span>
        {currentStreak > 1 && (
          <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-0.5 rounded">
            <Flame className="w-3 h-3" />
            {currentStreak}
          </span>
        )}
      </button>
    );
  }
  
  // Just claimed animation
  if (showClaimed && reward) {
    return (
      <div className="fixed bottom-4 right-4 z-40 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg shadow-lg animate-bounce">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          <span className="font-semibold">+${reward.totalAmount.toLocaleString()} Claimed!</span>
          {currentStreak > 1 && (
            <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-0.5 rounded">
              <Flame className="w-3 h-3" />
              {currentStreak} day streak
            </span>
          )}
        </div>
      </div>
    );
  }
  
  // Expanded modal
  if (!isOpen) return null;
  
  const preview = reward || previewDailyReward();
  const nextMilestone = getNextMilestone(currentStreak);
  const state = loadDailyRewardState();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-6 h-6" />
              <h2 className="text-xl font-bold">Daily Reward</h2>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Streak Display */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
                <div className="text-2xl font-bold text-foreground">
                  {getStreakDisplayText(currentStreak)}
                </div>
              </div>
            </div>
            {state.highestStreak > currentStreak && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Best</div>
                <div className="text-sm font-medium">{state.highestStreak} days</div>
              </div>
            )}
          </div>
          
          {/* Reward Preview */}
          {canClaim && (
            <div className="p-4 border border-dashed border-yellow-500/50 bg-yellow-500/5 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">Today&apos;s Reward</div>
                <div className="text-4xl font-bold text-yellow-500 mb-2">
                  ${preview.totalAmount.toLocaleString()}
                </div>
                {preview.streakBonus > 0 && (
                  <div className="text-sm text-green-500">
                    +${preview.streakBonus.toLocaleString()} streak bonus!
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Cobie Quote */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex-shrink-0 flex items-center justify-center">
                <span className="text-lg">👴</span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Cobie&apos;s Daily Alpha</div>
                <p className="text-sm text-foreground italic">&ldquo;{preview.cobieQuote}&rdquo;</p>
              </div>
            </div>
          </div>
          
          {/* Next Milestone */}
          {nextMilestone && (
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  {nextMilestone.days - currentStreak} days to next milestone
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          
          {/* Milestone Reward */}
          {preview.isStreakMilestone && preview.milestoneReward && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
              <div className="text-sm text-purple-500 font-semibold">
                🎉 Milestone Reward: {preview.milestoneReward.replace(/_/g, ' ')}!
              </div>
            </div>
          )}
          
          {/* Claim Button */}
          {canClaim ? (
            <button
              onClick={handleClaim}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white text-lg font-bold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Claim ${preview.totalAmount.toLocaleString()}
            </button>
          ) : (
            <div className="w-full py-4 bg-muted text-muted-foreground text-center rounded-lg">
              ✓ Already claimed today - come back tomorrow!
            </div>
          )}
          
          {/* Stats */}
          <div className="flex justify-around text-center text-sm text-muted-foreground">
            <div>
              <div className="font-semibold text-foreground">{state.totalClaims}</div>
              <div>Total Claims</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">{state.highestStreak}</div>
              <div>Best Streak</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyRewards;
