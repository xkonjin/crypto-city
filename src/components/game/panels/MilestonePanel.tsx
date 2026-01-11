'use client';

import React, { useState, useCallback } from 'react';
import { msg, useMessages } from 'gt-next';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Flag, 
  Trophy, 
  Target, 
  Gift, 
  CheckCircle, 
  Lock,
  Clock,
  Users,
  Sparkles
} from 'lucide-react';
import {
  MilestoneState,
  MilestoneTier,
  Milestone,
  MILESTONES,
  TIER_COLORS,
  claimMilestoneReward,
  saveMilestoneState,
  getMilestonesByTier,
  getCompletedMilestonesByTier,
  getCurrentPopulationTier,
  POPULATION_TIERS,
  PopulationTier,
  STORY_MISSIONS,
  StoryMission,
} from '@/lib/milestones';
import type { CryptoEconomyState } from '@/games/isocity/crypto';

// Translatable UI labels
const UI_LABELS = {
  title: msg('Milestones'),
  milestones: msg('Milestones'),
  storyMissions: msg('Story Missions'),
  population: msg('Population'),
  claim: msg('Claim'),
  claimed: msg('Claimed'),
  completed: msg('Completed'),
  inProgress: msg('In Progress'),
  locked: msg('Locked'),
  reward: msg('Reward'),
  bronze: msg('Bronze'),
  silver: msg('Silver'),
  gold: msg('Gold'),
  diamond: msg('Diamond'),
  yieldBonus: msg('Yield Bonus'),
  prestigePoints: msg('Prestige Points'),
  newBuildings: msg('New Buildings'),
  daysRemaining: msg('Days Remaining'),
  activeMission: msg('Active Mission'),
  noActiveMission: msg('No active mission'),
  startMission: msg('Start Mission'),
  currentTier: msg('Current Tier'),
  nextTier: msg('Next Tier'),
  unlocksAt: msg('Unlocks at'),
};

// Tier badge component
function TierBadge({ tier }: { tier: MilestoneTier }) {
  const m = useMessages();
  const colors = TIER_COLORS[tier];
  
  const labels: Record<MilestoneTier, unknown> = {
    bronze: UI_LABELS.bronze,
    silver: UI_LABELS.silver,
    gold: UI_LABELS.gold,
    diamond: UI_LABELS.diamond,
  };
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      {m(labels[tier] as Parameters<typeof m>[0])}
    </span>
  );
}

// Single milestone card
function MilestoneCard({
  milestone,
  progress,
  completed,
  claimed,
  onClaim,
}: {
  milestone: Milestone;
  progress: number;
  completed: boolean;
  claimed: boolean;
  onClaim: (milestoneId: string) => void;
}) {
  const m = useMessages();
  
  const canClaim = completed && !claimed;
  
  return (
    <div 
      className={`p-4 rounded-lg border transition-all ${
        claimed 
          ? 'bg-muted/30 border-border/50 opacity-75'
          : completed
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-card border-border hover:border-primary/50'
      }`}
      data-testid="milestone-item"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {completed ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Target className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-lg">{milestone.icon}</span>
            <h4 className="font-medium text-sm" data-testid="milestone-title">
              {milestone.name}
            </h4>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {milestone.description}
          </p>
        </div>
        <TierBadge tier={milestone.tier} />
      </div>
      
      {/* Progress bar */}
      <div className="mb-3" data-testid="milestone-progress">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">
            {claimed 
              ? m(UI_LABELS.claimed)
              : completed 
              ? m(UI_LABELS.completed) 
              : m(UI_LABELS.inProgress)}
          </span>
          <span className="font-mono">{progress}%</span>
        </div>
        <Progress 
          value={progress} 
          className="h-2"
        />
      </div>
      
      {/* Reward section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {milestone.reward.treasury && (
            <div className="flex items-center gap-1">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-amber-400">
                ${milestone.reward.treasury.toLocaleString()}
              </span>
            </div>
          )}
          {milestone.reward.yieldBonus && (
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">
                +{(milestone.reward.yieldBonus * 100).toFixed(0)}% {m(UI_LABELS.yieldBonus)}
              </span>
            </div>
          )}
          {milestone.reward.prestigePoints && (
            <div className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-400">
                +{milestone.reward.prestigePoints} PP
              </span>
            </div>
          )}
        </div>
        
        {canClaim && (
          <Button
            size="sm"
            variant="default"
            className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
            onClick={() => onClaim(milestone.id)}
          >
            <Trophy className="w-3 h-3 mr-1" />
            {m(UI_LABELS.claim)}
          </Button>
        )}
      </div>
      
      {/* Unlocks section */}
      {milestone.unlocks && milestone.unlocks.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>{m(UI_LABELS.newBuildings)}: {milestone.unlocks.join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Story mission card
function StoryMissionCard({
  mission,
  progress,
  daysRemaining,
  completed,
  failed,
  isActive,
  onStart,
}: {
  mission: StoryMission;
  progress?: number;
  daysRemaining?: number;
  completed?: boolean;
  failed?: boolean;
  isActive: boolean;
  onStart?: () => void;
}) {
  const m = useMessages();
  
  return (
    <div 
      className={`p-4 rounded-lg border transition-all ${
        completed 
          ? 'bg-green-500/10 border-green-500/30'
          : failed
          ? 'bg-red-500/10 border-red-500/30'
          : isActive
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-card border-border hover:border-primary/50'
      }`}
      data-testid="story-mission-item"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{mission.icon}</span>
            <h4 className="font-medium text-sm">{mission.title}</h4>
          </div>
          <p className="text-xs text-muted-foreground italic mb-2">
            &ldquo;{mission.narrative}&rdquo;
          </p>
        </div>
        {isActive && daysRemaining !== undefined && (
          <div className="flex items-center gap-1 text-xs text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{daysRemaining} {m(UI_LABELS.daysRemaining)}</span>
          </div>
        )}
      </div>
      
      {isActive && progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">{m(UI_LABELS.inProgress)}</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {/* Reward section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {mission.reward.treasury && (
            <div className="flex items-center gap-1">
              <Gift className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">
                +${mission.reward.treasury.toLocaleString()}
              </span>
            </div>
          )}
          {mission.penalty?.treasury && (
            <div className="flex items-center gap-1 text-red-400">
              <span>Penalty: ${Math.abs(mission.penalty.treasury).toLocaleString()}</span>
            </div>
          )}
        </div>
        
        {!isActive && !completed && onStart && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            onClick={onStart}
          >
            {m(UI_LABELS.startMission)}
          </Button>
        )}
      </div>
    </div>
  );
}

// Population tier card
function PopulationTierCard({
  tier,
  isCurrentTier,
  isUnlocked,
  currentPopulation,
}: {
  tier: PopulationTier;
  isCurrentTier: boolean;
  isUnlocked: boolean;
  currentPopulation: number;
}) {
  const m = useMessages();
  
  const progress = tier.population > 0 
    ? Math.min(100, Math.floor((currentPopulation / tier.population) * 100))
    : 100;
  
  return (
    <div 
      className={`p-4 rounded-lg border transition-all ${
        isCurrentTier 
          ? 'bg-primary/10 border-primary/30'
          : isUnlocked
          ? 'bg-muted/30 border-border/50'
          : 'bg-card border-border'
      }`}
      data-testid="population-tier"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{tier.icon}</span>
          <h4 className="font-medium text-sm">{tier.name}</h4>
          {isCurrentTier && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary">
              {m(UI_LABELS.currentTier)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{tier.population.toLocaleString()}</span>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">{tier.description}</p>
      
      {!isUnlocked && (
        <div className="mb-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {m(UI_LABELS.unlocksAt)}: {tier.population.toLocaleString()} citizens
          </p>
        </div>
      )}
      
      {tier.unlocks.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className={isUnlocked ? 'w-3 h-3 text-green-400' : 'w-3 h-3'} />
          <span>{isUnlocked ? 'Unlocked' : 'Unlocks'}: {tier.unlocks.join(', ')}</span>
        </div>
      )}
    </div>
  );
}

interface MilestonePanelProps {
  cryptoState: CryptoEconomyState;
  milestoneState: MilestoneState;
  onClaimReward: (amount: number) => void;
  onUpdateMilestoneState: (state: MilestoneState) => void;
  onStartMission?: (missionId: string) => void;
}

export function MilestonePanel({
  cryptoState,
  milestoneState,
  onClaimReward,
  onUpdateMilestoneState,
  onStartMission,
}: MilestonePanelProps) {
  const { state, setActivePanel, addNotification } = useGame();
  const m = useMessages();
  const [activeTab, setActiveTab] = useState<string>('milestones');
  
  // Handle claiming a milestone reward
  const handleClaim = useCallback((milestoneId: string) => {
    const result = claimMilestoneReward(milestoneState, milestoneId);
    
    if (result.treasuryReward > 0 || result.yieldBonus > 0 || result.prestigePoints > 0) {
      // Add money to treasury
      if (result.treasuryReward > 0) {
        onClaimReward(result.treasuryReward);
      }
      
      // Update state
      onUpdateMilestoneState(result.updatedState);
      saveMilestoneState(result.updatedState);
      
      // Show notification
      const milestone = MILESTONES.find(m => m.id === milestoneId);
      if (milestone) {
        let rewardText = '';
        if (result.treasuryReward > 0) {
          rewardText += `$${result.treasuryReward.toLocaleString()}`;
        }
        if (result.yieldBonus > 0) {
          rewardText += `${rewardText ? ', ' : ''}+${(result.yieldBonus * 100).toFixed(0)}% yield`;
        }
        if (result.prestigePoints > 0) {
          rewardText += `${rewardText ? ', ' : ''}+${result.prestigePoints} prestige points`;
        }
        
        addNotification(
          'Milestone Complete!',
          `${milestone.name}: ${rewardText}`,
          'trophy'
        );
      }
    }
  }, [milestoneState, onClaimReward, onUpdateMilestoneState, addNotification]);
  
  // Get milestones grouped by tier
  const tiers: MilestoneTier[] = ['bronze', 'silver', 'gold', 'diamond'];
  
  // Get current population tier
  const currentPopTier = getCurrentPopulationTier(state.stats.population);
  const currentPopTierIndex = POPULATION_TIERS.findIndex(t => t.name === currentPopTier.name);
  
  return (
    <Dialog open={true} onOpenChange={() => setActivePanel('none')}>
      <DialogContent className="max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-400" />
            {m(UI_LABELS.title)}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="milestones">
              <Trophy className="w-4 h-4 mr-1" />
              {m(UI_LABELS.milestones)}
            </TabsTrigger>
            <TabsTrigger value="missions">
              <Target className="w-4 h-4 mr-1" />
              {m(UI_LABELS.storyMissions)}
            </TabsTrigger>
            <TabsTrigger value="population">
              <Users className="w-4 h-4 mr-1" />
              {m(UI_LABELS.population)}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="milestones" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(85vh-180px)]">
              <div className="space-y-6 pr-4">
                {tiers.map(tier => {
                  const tierMilestones = getMilestonesByTier(tier);
                  const completedCount = getCompletedMilestonesByTier(milestoneState, tier);
                  
                  return (
                    <div key={tier}>
                      <div className="flex items-center justify-between mb-3">
                        <TierBadge tier={tier} />
                        <span className="text-xs text-muted-foreground">
                          {completedCount}/{tierMilestones.length} completed
                        </span>
                      </div>
                      <div className="space-y-3">
                        {tierMilestones.map(milestone => {
                          const mp = milestoneState.milestones.find(
                            m => m.milestoneId === milestone.id
                          );
                          return (
                            <MilestoneCard
                              key={milestone.id}
                              milestone={milestone}
                              progress={mp?.progress || 0}
                              completed={mp?.completed || false}
                              claimed={mp?.claimed || false}
                              onClaim={handleClaim}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="missions" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(85vh-180px)]">
              <div className="space-y-4 pr-4">
                {/* Active Mission */}
                {milestoneState.activeMission && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-400" />
                      {m(UI_LABELS.activeMission)}
                    </h3>
                    {(() => {
                      const mission = STORY_MISSIONS.find(
                        m => m.id === milestoneState.activeMission?.missionId
                      );
                      if (!mission) return null;
                      return (
                        <StoryMissionCard
                          mission={mission}
                          progress={milestoneState.activeMission.progress}
                          daysRemaining={milestoneState.activeMission.daysRemaining}
                          completed={milestoneState.activeMission.completed}
                          failed={milestoneState.activeMission.failed}
                          isActive={true}
                        />
                      );
                    })()}
                  </div>
                )}
                
                {!milestoneState.activeMission && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {m(UI_LABELS.noActiveMission)}
                  </p>
                )}
                
                {/* Available Missions */}
                <h3 className="text-sm font-medium mb-2">Available Missions</h3>
                <div className="space-y-3">
                  {STORY_MISSIONS
                    .filter(m => !milestoneState.completedMissions.includes(m.id))
                    .filter(m => m.id !== milestoneState.activeMission?.missionId)
                    .map(mission => (
                      <StoryMissionCard
                        key={mission.id}
                        mission={mission}
                        isActive={false}
                        onStart={() => onStartMission?.(mission.id)}
                      />
                    ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="population" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(85vh-180px)]">
              <div className="space-y-3 pr-4">
                {POPULATION_TIERS.map((tier, index) => (
                  <PopulationTierCard
                    key={tier.name}
                    tier={tier}
                    isCurrentTier={index === currentPopTierIndex}
                    isUnlocked={index <= currentPopTierIndex}
                    currentPopulation={state.stats.population}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default MilestonePanel;
