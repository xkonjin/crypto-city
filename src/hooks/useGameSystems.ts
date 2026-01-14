/**
 * useGameSystems Hook
 * 
 * Manages all core game systems: crypto economy, challenges, milestones, prestige.
 * Extracted from Game.tsx for better separation of concerns.
 * 
 * Issue #143: Split Game.tsx into smaller components
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import {
  cryptoEconomy,
  cryptoEvents as cryptoEventManager,
  CryptoEconomyState,
  CryptoEvent,
} from '@/games/isocity/crypto';
import { useRealCryptoData } from '@/hooks/useRealCryptoData';

// Challenges
import {
  ChallengeState,
  loadChallengeState,
  saveChallengeState,
  updateChallengesProgress,
  recordRugPull as recordChallengeRugPull,
  recordNewDay as recordChallengeNewDay,
  createInitialChallengeState,
} from '@/lib/challenges';

// Prestige
import {
  PrestigeState,
  loadPrestigeState,
  savePrestigeState,
  createInitialPrestigeState,
  getTotalStartingTreasuryBonus,
  getTotalYieldMultiplier,
  getTotalRugResistance,
} from '@/lib/prestige';

// Milestones
import {
  MilestoneState,
  loadMilestoneState,
  saveMilestoneState,
  createInitialMilestoneState,
  updateMilestonesProgress,
  updateMissionProgress,
  startMission,
  recordRugPullSurvived,
  MILESTONES,
} from '@/lib/milestones';

// Game Objectives
import {
  GameMode,
  GameObjectives,
  GameEndStats,
  createGameObjectives,
  checkGameEnd,
  calculateGameEndStats,
} from '@/lib/gameObjectives';

// Financial History
import { getFinancialHistory } from '@/lib/financialHistory';

// Referral
import { applyPendingReferral, REFERRED_BONUS } from '@/lib/referral';

export interface GameSystemsState {
  // Economy
  economyState: CryptoEconomyState;
  cryptoEvents: CryptoEvent[];
  realCryptoData: ReturnType<typeof useRealCryptoData>;
  
  // Challenges
  challengeState: ChallengeState;
  setChallengeState: React.Dispatch<React.SetStateAction<ChallengeState>>;
  
  // Prestige
  prestigeState: PrestigeState;
  setPrestigeState: React.Dispatch<React.SetStateAction<PrestigeState>>;
  handlePrestige: () => void;
  
  // Milestones
  milestoneState: MilestoneState;
  setMilestoneState: React.Dispatch<React.SetStateAction<MilestoneState>>;
  pendingMilestone: typeof MILESTONES[0] | null;
  showUnlockNotification: boolean;
  handleUnlockNotificationDismiss: () => void;
  handleStartMission: (missionId: string) => void;
  
  // Game Objectives
  gameMode: GameMode;
  setGameMode: React.Dispatch<React.SetStateAction<GameMode>>;
  gameObjectives: GameObjectives;
  setGameObjectives: React.Dispatch<React.SetStateAction<GameObjectives>>;
  showGameEndModal: boolean;
  setShowGameEndModal: React.Dispatch<React.SetStateAction<boolean>>;
  gameEndStats: GameEndStats | null;
  handlePlayAgain: () => void;
  handleContinueSandbox: () => void;
}

export function useGameSystems(onExit?: () => void): GameSystemsState {
  const { state, addMoney, addNotification, setSpeed, setCryptoTaxRevenue } = useGame();
  
  // ==== ECONOMY STATE ====
  const [economyState, setEconomyState] = useState<CryptoEconomyState>(
    cryptoEconomy.getState()
  );
  const [cryptoEvents, setCryptoEvents] = useState<CryptoEvent[]>([]);
  
  // Real-world crypto data integration
  const realCryptoData = useRealCryptoData({
    economyManager: cryptoEconomy,
    eventManager: cryptoEventManager,
    enabled: true,
  });
  
  // ==== CHALLENGES STATE ====
  const [challengeState, setChallengeState] = useState<ChallengeState>(() =>
    typeof window !== 'undefined' ? loadChallengeState() : createInitialChallengeState()
  );
  const previousDayForChallengesRef = useRef(state.day);
  
  // ==== PRESTIGE STATE ====
  const [prestigeState, setPrestigeState] = useState<PrestigeState>(() =>
    typeof window !== 'undefined' ? loadPrestigeState() : createInitialPrestigeState()
  );
  
  // ==== MILESTONES STATE ====
  const [milestoneState, setMilestoneState] = useState<MilestoneState>(() =>
    typeof window !== 'undefined' ? loadMilestoneState() : createInitialMilestoneState()
  );
  const [pendingMilestone, setPendingMilestone] = useState<typeof MILESTONES[0] | null>(null);
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const previousMilestoneProgressRef = useRef<Map<string, boolean>>(new Map());
  
  // ==== GAME OBJECTIVES STATE ====
  const [gameMode, setGameMode] = useState<GameMode>('sandbox');
  const [gameObjectives, setGameObjectives] = useState<GameObjectives>(
    createGameObjectives('sandbox')
  );
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameEndStats, setGameEndStats] = useState<GameEndStats | null>(null);
  const previousDayRef = useRef(state.day);
  
  // ==== INITIALIZE CRYPTO SYSTEMS ====
  useEffect(() => {
    const unsubscribeEconomy = cryptoEconomy.subscribe((newState) => {
      setEconomyState(newState);
    });

    cryptoEventManager.setEconomyManager(cryptoEconomy);
    const unsubscribeEvents = cryptoEventManager.subscribe((events) => {
      setCryptoEvents(events);
    });

    cryptoEconomy.startSimulation();
    cryptoEventManager.start();

    return () => {
      unsubscribeEconomy();
      unsubscribeEvents();
      cryptoEconomy.stopSimulation();
      cryptoEventManager.stop();
    };
  }, []);
  
  // ==== REFERRAL BONUS ====
  useEffect(() => {
    const bonus = applyPendingReferral();
    if (bonus) {
      addMoney(bonus);
      addNotification(
        "Welcome Bonus!",
        `You received $${REFERRED_BONUS.toLocaleString()} for using a referral code!`,
        "gift"
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // ==== SYNC GAME SPEED ====
  useEffect(() => {
    cryptoEconomy.setGameSpeed(state.speed);
  }, [state.speed]);
  
  // ==== CITY-CRYPTO INTEGRATION ====
  useEffect(() => {
    cryptoEconomy.setPopulation(state.stats.population);
    cryptoEconomy.setHappiness(state.stats.happiness);
    
    const hasPowerInfrastructure = state.services.power.some(
      row => row.some(cell => cell)
    );
    cryptoEconomy.setPowerAvailable(hasPowerInfrastructure);
    
    const hasWaterInfrastructure = state.services.water.some(
      row => row.some(cell => cell)
    );
    cryptoEconomy.setWaterAvailable(hasWaterInfrastructure);
  }, [state.stats.population, state.stats.happiness, state.services.power, state.services.water]);
  
  // ==== CRYPTO TAX REVENUE ====
  useEffect(() => {
    const estimatedMonthlyYield = economyState.dailyYield * 30;
    const cryptoTaxRevenue = estimatedMonthlyYield * (state.taxRate / 100);
    setCryptoTaxRevenue(cryptoTaxRevenue);
  }, [economyState.dailyYield, state.taxRate, setCryptoTaxRevenue]);
  
  // ==== PRESTIGE BONUSES ====
  useEffect(() => {
    const yieldMultiplier = getTotalYieldMultiplier(prestigeState);
    const rugResistance = getTotalRugResistance(prestigeState);
    
    cryptoEconomy.setPrestigeYieldMultiplier(yieldMultiplier);
    cryptoEconomy.setPrestigeRugResistance(rugResistance);
  }, [prestigeState]);
  
  // ==== GAME OBJECTIVES TRACKING ====
  useEffect(() => {
    if (state.day !== previousDayRef.current) {
      previousDayRef.current = state.day;
      cryptoEconomy.incrementGameDay();
    }
    
    cryptoEconomy.updateHappinessTracking(state.stats.happiness);
    cryptoEconomy.updateHadCryptoBuildings();
    
    if (gameObjectives.isGameOver || gameMode === 'sandbox') {
      return;
    }
    
    const tracking = {
      gameDays: economyState.gameDays,
      bankruptcyTicks: economyState.bankruptcyCounter,
      lowHappinessTicks: economyState.lowHappinessCounter,
      peakTVL: economyState.tvl,
      peakPopulation: state.stats.population,
      peakBuildingCount: economyState.buildingCount,
      hadCryptoBuildings: economyState.hadCryptoBuildings,
    };
    
    const updatedObjectives: GameObjectives = {
      ...gameObjectives,
      tracking,
    };
    
    const result = checkGameEnd(updatedObjectives, state, economyState);
    
    if (result.isGameOver) {
      const stats = calculateGameEndStats(state, economyState, tracking);
      setGameEndStats(stats);
      
      setGameObjectives({
        ...updatedObjectives,
        isGameOver: true,
        isVictory: result.isVictory,
        endReason: result.endReason,
        endConditionId: result.endConditionId,
      });
      
      setShowGameEndModal(true);
      setSpeed(0);
    } else {
      setGameObjectives(updatedObjectives);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.day, state.stats.happiness, state.stats.population, economyState, gameMode, gameObjectives.isGameOver]);
  
  // ==== CHALLENGES TRACKING ====
  useEffect(() => {
    if (state.day !== previousDayForChallengesRef.current) {
      previousDayForChallengesRef.current = state.day;
      
      const happinessThreshold = 70;
      const updatedAfterDay = recordChallengeNewDay(challengeState, state.stats.happiness, happinessThreshold);
      setChallengeState(updatedAfterDay);
    }
    
    const updatedChallenges = updateChallengesProgress(
      challengeState.challenges,
      state,
      economyState,
      challengeState
    );
    
    const hasProgressChanged = updatedChallenges.some(
      (c, i) => c.progress !== challengeState.challenges[i]?.progress ||
                c.completed !== challengeState.challenges[i]?.completed
    );
    
    if (hasProgressChanged) {
      const newState: ChallengeState = {
        ...challengeState,
        challenges: updatedChallenges,
        lastUpdated: Date.now(),
      };
      setChallengeState(newState);
      saveChallengeState(newState);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.day, state.stats.population, state.stats.happiness, economyState.tvl, economyState.buildingCount]);
  
  // Rug pull tracking for challenges
  useEffect(() => {
    const handleRugPullForChallenge = () => {
      const updatedState = recordChallengeRugPull(challengeState);
      setChallengeState(updatedState);
    };
    
    const unsubscribe = cryptoEventManager.subscribe((events) => {
      const latestEvent = events[0];
      if (latestEvent?.type === 'rug_pull') {
        handleRugPullForChallenge();
      }
    });
    
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeState.rugPullsSurvived]);
  
  // ==== MILESTONES TRACKING ====
  useEffect(() => {
    const updatedState = updateMilestonesProgress(
      milestoneState,
      state,
      economyState
    );
    
    if (state.day !== previousDayForChallengesRef.current && updatedState.activeMission) {
      const daysPassed = 1;
      const withMissionProgress = updateMissionProgress(updatedState, state, economyState, daysPassed);
      
      if (JSON.stringify(withMissionProgress) !== JSON.stringify(milestoneState)) {
        setMilestoneState(withMissionProgress);
        saveMilestoneState(withMissionProgress);
      }
    } else {
      let hasNewCompletions = false;
      for (const mp of updatedState.milestones) {
        const wasCompleted = previousMilestoneProgressRef.current.get(mp.milestoneId);
        if (mp.completed && !wasCompleted && !mp.claimed) {
          hasNewCompletions = true;
          const milestone = MILESTONES.find(m => m.id === mp.milestoneId);
          if (milestone && !showUnlockNotification) {
            setPendingMilestone(milestone);
            setShowUnlockNotification(true);
          }
        }
        previousMilestoneProgressRef.current.set(mp.milestoneId, mp.completed);
      }
      
      const hasProgressChanged = updatedState.milestones.some(
        (m, i) => m.progress !== milestoneState.milestones[i]?.progress
      );
      
      if (hasProgressChanged || hasNewCompletions) {
        setMilestoneState(updatedState);
        saveMilestoneState(updatedState);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.day, state.stats.population, state.stats.happiness, economyState.tvl, economyState.buildingCount, economyState.treasury, economyState.gameDays]);
  
  // Rug pull tracking for milestones
  useEffect(() => {
    const handleRugPullForMilestone = () => {
      const updatedState = recordRugPullSurvived(milestoneState);
      setMilestoneState(updatedState);
      saveMilestoneState(updatedState);
    };
    
    const unsubscribe = cryptoEventManager.subscribe((events) => {
      const latestEvent = events[0];
      if (latestEvent?.type === 'rug_pull') {
        handleRugPullForMilestone();
      }
    });
    
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestoneState.rugPullsSurvived]);
  
  // ==== FINANCIAL HISTORY ====
  const previousDayForFinancialRef = useRef(state.day);
  useEffect(() => {
    if (state.day !== previousDayForFinancialRef.current) {
      previousDayForFinancialRef.current = state.day;
      
      const financialHistory = getFinancialHistory();
      const estimatedDailyCosts = (economyState.serviceFunding?.security || 0) +
        (economyState.serviceFunding?.marketing || 0) +
        (economyState.serviceFunding?.research || 0) +
        economyState.buildingCount * 5;
      
      financialHistory.addSnapshot({
        day: state.day,
        treasury: economyState.treasury,
        tvl: economyState.tvl,
        dailyYield: economyState.dailyYield,
        dailyCosts: estimatedDailyCosts,
        netIncome: economyState.dailyYield - estimatedDailyCosts,
        buildingCount: economyState.buildingCount,
        population: state.stats.population,
        sentiment: economyState.marketSentiment,
        timestamp: Date.now(),
      });
      
      financialHistory.persist();
    }
  }, [state.day, economyState, state.stats.population]);
  
  // ==== HANDLERS ====
  const handleUnlockNotificationDismiss = useCallback(() => {
    setShowUnlockNotification(false);
    setPendingMilestone(null);
  }, []);
  
  const handleStartMission = useCallback((missionId: string) => {
    const updatedState = startMission(milestoneState, missionId);
    setMilestoneState(updatedState);
    saveMilestoneState(updatedState);
    addNotification(
      'Mission Started!',
      'Your new mission has begun. Check the milestones panel for details.',
      'flag'
    );
  }, [milestoneState, addNotification]);
  
  const handlePrestige = useCallback(() => {
    const startingTreasuryBonus = getTotalStartingTreasuryBonus(prestigeState);
    cryptoEconomy.importState({
      economyState: {
        treasury: 50000 + startingTreasuryBonus,
        dailyYield: 0,
        totalYield: 0,
        tvl: 0,
        marketSentiment: 50,
        buildingCount: 0,
        lastUpdate: Date.now(),
        tickCount: 0,
        bankruptcyCounter: 0,
        isBankrupt: false,
        decayingBuildings: [],
        gameDays: 0,
        lowHappinessCounter: 0,
        hadCryptoBuildings: false,
      },
      buildings: [],
    });
    
    addNotification(
      'Prestige Reset!',
      `Your crypto empire has reset. Your prestige bonuses remain active.`,
      'star'
    );
  }, [prestigeState, addNotification]);
  
  const handlePlayAgain = useCallback(() => {
    setShowGameEndModal(false);
    setGameObjectives(createGameObjectives(gameMode));
    setGameEndStats(null);
    cryptoEconomy.resetObjectivesTracking();
    if (onExit) {
      onExit();
    }
  }, [gameMode, onExit]);
  
  const handleContinueSandbox = useCallback(() => {
    setShowGameEndModal(false);
    setGameMode('sandbox');
    setGameObjectives(prev => ({
      ...prev,
      mode: 'sandbox',
      isGameOver: false,
      isVictory: false,
      endReason: undefined,
      endConditionId: undefined,
    }));
    setSpeed(1);
  }, [setSpeed]);
  
  return {
    economyState,
    cryptoEvents,
    realCryptoData,
    challengeState,
    setChallengeState,
    prestigeState,
    setPrestigeState,
    handlePrestige,
    milestoneState,
    setMilestoneState,
    pendingMilestone,
    showUnlockNotification,
    handleUnlockNotificationDismiss,
    handleStartMission,
    gameMode,
    setGameMode,
    gameObjectives,
    setGameObjectives,
    showGameEndModal,
    setShowGameEndModal,
    gameEndStats,
    handlePlayAgain,
    handleContinueSandbox,
  };
}
