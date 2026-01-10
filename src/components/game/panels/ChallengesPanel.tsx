'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { msg, useMessages } from 'gt-next';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Clock, Gift, CheckCircle } from 'lucide-react';
import {
  Challenge,
  ChallengeState,
  loadChallengeState,
  saveChallengeState,
  claimChallengeReward,
  formatResetTime,
  getUnclaimedCount,
} from '@/lib/challenges';
import type { CryptoEconomyState } from '@/games/isocity/crypto';

// Translatable UI labels
const UI_LABELS = {
  title: msg('Weekly Challenges'),
  resetIn: msg('Resets in'),
  claim: msg('Claim'),
  claimed: msg('Claimed'),
  completed: msg('Completed'),
  inProgress: msg('In Progress'),
  reward: msg('Reward'),
  easy: msg('Easy'),
  medium: msg('Medium'),
  hard: msg('Hard'),
};

interface ChallengesPanelProps {
  cryptoState: CryptoEconomyState;
  challengeState: ChallengeState;
  onClaimReward: (amount: number) => void;
  onUpdateChallengeState: (state: ChallengeState) => void;
}

// Difficulty badge component
function DifficultyBadge({ difficulty }: { difficulty: Challenge['difficulty'] }) {
  const m = useMessages();
  
  const colors = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  
  const labels = {
    easy: UI_LABELS.easy,
    medium: UI_LABELS.medium,
    hard: UI_LABELS.hard,
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[difficulty]}`}>
      {m(labels[difficulty])}
    </span>
  );
}

// Single challenge card
function ChallengeCard({
  challenge,
  onClaim,
}: {
  challenge: Challenge;
  onClaim: (challengeId: string) => void;
}) {
  const m = useMessages();
  
  const canClaim = challenge.completed && !challenge.claimed;
  
  return (
    <div 
      className={`p-4 rounded-lg border transition-all ${
        challenge.claimed 
          ? 'bg-muted/30 border-border/50 opacity-75'
          : challenge.completed
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-card border-border hover:border-primary/50'
      }`}
      data-testid="challenge-item"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {challenge.completed ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Target className="w-4 h-4 text-muted-foreground" />
            )}
            <h4 className="font-medium text-sm" data-testid="challenge-title">
              {challenge.title}
            </h4>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {challenge.description}
          </p>
        </div>
        <DifficultyBadge difficulty={challenge.difficulty} />
      </div>
      
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">
            {challenge.claimed 
              ? m(UI_LABELS.claimed)
              : challenge.completed 
              ? m(UI_LABELS.completed) 
              : m(UI_LABELS.inProgress)}
          </span>
          <span className="font-mono">{challenge.progress}%</span>
        </div>
        <Progress 
          value={challenge.progress} 
          className="h-2"
        />
      </div>
      
      {/* Reward section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <Gift className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-muted-foreground">{m(UI_LABELS.reward)}:</span>
          <span className="font-mono text-amber-400">
            ${challenge.reward.treasury.toLocaleString()}
          </span>
        </div>
        
        {canClaim && (
          <Button
            size="sm"
            variant="default"
            className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
            onClick={() => onClaim(challenge.id)}
          >
            <Trophy className="w-3 h-3 mr-1" />
            {m(UI_LABELS.claim)}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ChallengesPanel({
  cryptoState,
  challengeState,
  onClaimReward,
  onUpdateChallengeState,
}: ChallengesPanelProps) {
  const { state, setActivePanel, addNotification } = useGame();
  const m = useMessages();
  const [resetTime, setResetTime] = useState(formatResetTime());
  
  // Update reset countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setResetTime(formatResetTime());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle claiming a reward
  const handleClaim = useCallback((challengeId: string) => {
    const result = claimChallengeReward(challengeState, challengeId);
    
    if (result.treasuryReward > 0) {
      // Add money to treasury
      onClaimReward(result.treasuryReward);
      
      // Update state
      onUpdateChallengeState(result.updatedState);
      
      // Show notification
      const challenge = challengeState.challenges.find(c => c.id === challengeId);
      if (challenge) {
        addNotification(
          'Challenge Complete!',
          `You earned $${result.treasuryReward.toLocaleString()} for completing "${challenge.title}"`,
          'trophy'
        );
      }
    }
  }, [challengeState, onClaimReward, onUpdateChallengeState, addNotification]);
  
  return (
    <Dialog open={true} onOpenChange={() => setActivePanel('none')}>
      <DialogContent className="max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            {m(UI_LABELS.title)}
          </DialogTitle>
        </DialogHeader>
        
        {/* Reset countdown */}
        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-muted/50 rounded-lg text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{m(UI_LABELS.resetIn)}:</span>
          <span className="font-mono font-medium">{resetTime}</span>
          <span className="text-muted-foreground text-xs">(Monday 00:00 UTC)</span>
        </div>
        
        {/* Challenges list */}
        <div className="space-y-3 mt-2">
          {challengeState.challenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onClaim={handleClaim}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
