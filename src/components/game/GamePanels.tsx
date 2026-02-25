'use client';

import React from 'react';
import {
  BudgetPanel,
  StatisticsPanel,
  SettingsPanel,
  AdvisorsPanel,
  PetitionsPanel,
  EventsPanel,
  LeaderboardPanel,
  ReferralPanel,
  ChallengesPanel,
  PrestigePanel,
  MilestonePanel,
  FinancialReportPanel,
  OrdinancePanel,
} from '@/components/game/panels';
import { cryptoEconomy } from '@/games/isocity/crypto';
import type { GameState } from '@/types/game';
import type { ChallengeState } from '@/lib/challenges';
import type { PrestigeState } from '@/lib/prestige';
import type { MilestoneState } from '@/lib/milestones';
import type { CryptoEconomyState, PlacedCryptoBuilding } from '@/games/isocity/crypto/types';

interface GamePanelsProps {
  activePanel: GameState['activePanel'];
  economyState: CryptoEconomyState;
  challengeState: ChallengeState;
  onClaimChallengeReward: (amount: number) => void;
  onUpdateChallengeState: (nextState: ChallengeState) => void;
  prestigeState: PrestigeState;
  onUpdatePrestigeState: (nextState: PrestigeState) => void;
  onPrestige: () => void;
  milestoneState: MilestoneState;
  onClaimMilestoneReward: (amount: number) => void;
  onUpdateMilestoneState: (nextState: MilestoneState) => void;
  onStartMission: (missionId: string) => void;
  buildings: PlacedCryptoBuilding[];
  includeLeaderboard?: boolean;
}

export function GamePanels({
  activePanel,
  economyState,
  challengeState,
  onClaimChallengeReward,
  onUpdateChallengeState,
  prestigeState,
  onUpdatePrestigeState,
  onPrestige,
  milestoneState,
  onClaimMilestoneReward,
  onUpdateMilestoneState,
  onStartMission,
  buildings,
  includeLeaderboard = true,
}: GamePanelsProps): React.ReactElement | null {
  return (
    <>
      {activePanel === 'budget' && <BudgetPanel />}
      {activePanel === 'statistics' && <StatisticsPanel />}
      {activePanel === 'advisors' && <AdvisorsPanel economyState={economyState} />}
      {activePanel === 'settings' && <SettingsPanel />}
      {activePanel === 'petitions' && <PetitionsPanel />}
      {activePanel === 'events' && <EventsPanel />}
      {includeLeaderboard && activePanel === 'leaderboard' && <LeaderboardPanel />}
      {activePanel === 'referral' && <ReferralPanel />}
      {activePanel === 'challenges' && (
        <ChallengesPanel
          cryptoState={economyState}
          challengeState={challengeState}
          onClaimReward={(amount) => {
            onClaimChallengeReward(amount);
            cryptoEconomy.deposit(amount);
          }}
          onUpdateChallengeState={onUpdateChallengeState}
        />
      )}
      {activePanel === 'prestige' && (
        <PrestigePanel
          cryptoState={economyState}
          prestigeState={prestigeState}
          onUpdatePrestigeState={onUpdatePrestigeState}
          onPrestige={onPrestige}
          gameDays={economyState.gameDays}
        />
      )}
      {activePanel === 'milestones' && (
        <MilestonePanel
          cryptoState={economyState}
          milestoneState={milestoneState}
          onClaimReward={(amount) => {
            onClaimMilestoneReward(amount);
            cryptoEconomy.deposit(amount);
          }}
          onUpdateMilestoneState={onUpdateMilestoneState}
          onStartMission={onStartMission}
        />
      )}
      {activePanel === 'reports' && (
        <FinancialReportPanel
          economyState={economyState}
          buildings={buildings}
        />
      )}
      {activePanel === 'ordinances' && <OrdinancePanel />}
    </>
  );
}
