'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Gift, Target, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { StoryMission, StoryMissionProgress } from '@/lib/milestones';

export interface StoryMissionModalProps {
  mission: StoryMission | null;
  missionProgress: StoryMissionProgress | null;
  isVisible: boolean;
  onDismiss: () => void;
  onClaim?: () => void;
  onAcknowledgeFailure?: () => void;
}

function StoryMissionModalContent({ 
  mission, 
  missionProgress,
  isVisible, 
  onDismiss,
  onClaim,
  onAcknowledgeFailure,
}: StoryMissionModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible && mission) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: animation state must sync with visibility
      setShouldRender(true);
      
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      
      return () => {
        cancelAnimationFrame(frame);
      };
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, mission]);

  if (!shouldRender || !mission) return null;

  const isCompleted = missionProgress?.completed;
  const isFailed = missionProgress?.failed;
  const progress = missionProgress?.progress ?? 0;
  const daysRemaining = missionProgress?.daysRemaining ?? mission.deadline;

  return (
    <div
      data-testid="story-mission-modal"
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4',
        'transition-all duration-300 ease-out',
        isAnimating 
          ? 'opacity-100' 
          : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />
      
      {/* Modal */}
      <div className={cn(
        'relative w-full max-w-md bg-gray-900 border rounded-lg shadow-2xl overflow-hidden',
        'transition-all duration-300 ease-out',
        isCompleted 
          ? 'border-green-500/50' 
          : isFailed 
          ? 'border-red-500/50'
          : 'border-amber-500/50',
        isAnimating 
          ? 'scale-100 translate-y-0' 
          : 'scale-95 translate-y-4'
      )}>
        {/* Header */}
        <div className={cn(
          'p-4 border-b',
          isCompleted 
            ? 'bg-green-500/10 border-green-500/30' 
            : isFailed 
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-amber-500/10 border-amber-500/30'
        )}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{mission.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-white">{mission.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {isCompleted ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                      Completed!
                    </span>
                  ) : isFailed ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                      Failed
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      Active Mission
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Narrative */}
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <p className="text-sm text-gray-300 italic">
              &ldquo;{mission.narrative}&rdquo;
            </p>
          </div>
          
          {/* Progress */}
          {!isCompleted && !isFailed && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm font-mono text-white">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          )}
          
          {/* Deadline */}
          {!isCompleted && !isFailed && (
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className={cn(
                  'w-5 h-5',
                  daysRemaining <= 3 ? 'text-red-400' : 'text-amber-400'
                )} />
                <span className="text-sm text-gray-300">Time Remaining</span>
              </div>
              <span className={cn(
                'text-lg font-bold',
                daysRemaining <= 3 ? 'text-red-400' : 'text-amber-400'
              )}>
                {daysRemaining} days
              </span>
            </div>
          )}
          
          {/* Rewards */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Gift className="w-4 h-4 text-green-400" />
              Reward on Success
            </h3>
            <div className="flex flex-wrap gap-2">
              {mission.reward.treasury && (
                <span className="px-3 py-1.5 rounded bg-green-500/10 text-green-400 text-sm">
                  +${mission.reward.treasury.toLocaleString()}
                </span>
              )}
              {mission.reward.yieldBonus && (
                <span className="px-3 py-1.5 rounded bg-green-500/10 text-green-400 text-sm">
                  +{(mission.reward.yieldBonus * 100).toFixed(0)}% yield
                </span>
              )}
              {mission.reward.prestigePoints && (
                <span className="px-3 py-1.5 rounded bg-purple-500/10 text-purple-400 text-sm">
                  +{mission.reward.prestigePoints} prestige
                </span>
              )}
            </div>
          </div>
          
          {/* Penalty */}
          {mission.penalty && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Penalty on Failure
              </h3>
              <div className="flex flex-wrap gap-2">
                {mission.penalty.treasury && (
                  <span className="px-3 py-1.5 rounded bg-red-500/10 text-red-400 text-sm">
                    -${Math.abs(mission.penalty.treasury).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
          {isCompleted && onClaim && (
            <Button
              onClick={onClaim}
              className="bg-green-600 hover:bg-green-700"
            >
              <Gift className="w-4 h-4 mr-2" />
              Claim Reward
            </Button>
          )}
          {isFailed && onAcknowledgeFailure && (
            <Button
              onClick={onAcknowledgeFailure}
              variant="destructive"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Accept Penalty
            </Button>
          )}
          {!isCompleted && !isFailed && (
            <Button
              onClick={onDismiss}
              variant="outline"
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function StoryMissionModal(props: StoryMissionModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: client-side portal mounting detection
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <StoryMissionModalContent {...props} />,
    document.body
  );
}

export default StoryMissionModal;
