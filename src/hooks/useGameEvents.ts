/**
 * useGameEvents Hook
 * 
 * Manages game events: rug pulls, achievements, notifications.
 * Extracted from Game.tsx for better separation of concerns.
 * 
 * Issue #143: Split Game.tsx into smaller components
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { Achievement } from '@/types/game';
import { useSound } from '@/hooks/useSound';

// Rug Pull
import {
  RugPullEvent,
  createRugPullEvent,
  RugPullQueue,
  ANIMATION_PHASES,
} from '@/lib/rugPullEffect';

// Notifications
import {
  notificationManager,
  Notification,
  createRugPullNotification,
  createDisasterNotification,
  createMilestoneNotification,
} from '@/lib/notifications';
import { disasterManager, type ActiveDisaster } from '@/lib/disasters';

// Crypto events
import { cryptoEvents as cryptoEventManager } from '@/games/isocity/crypto';

// Milestones
import { MILESTONES, MilestoneState } from '@/lib/milestones';

export interface GameEventsState {
  // Rug Pull
  activeRugPull: RugPullEvent | null;
  rugPullScreenPosition: { x: number; y: number } | null;
  showRugPullToast: boolean;
  isScreenShaking: boolean;
  handleScreenShake: (intensity: number, duration: number) => void;
  handleRugPullAnimationComplete: () => void;
  handleRugPullToastDismiss: () => void;
  gameContainerRef: React.RefObject<HTMLDivElement | null>;
  
  // Achievements
  pendingAchievement: Achievement | null;
  showAchievementToast: boolean;
  showAchievementShareDialog: boolean;
  handleAchievementToastDismiss: () => void;
  handleAchievementShare: () => void;
  handleAchievementShareDialogClose: () => void;
  
  // Notifications
  showNotificationCenter: boolean;
  setShowNotificationCenter: React.Dispatch<React.SetStateAction<boolean>>;
  notificationToast: Notification | null;
  showNotificationToast: boolean;
  handleNotificationToastDismiss: () => void;
  handleOpenNotificationCenter: () => void;
}

export function useGameEvents(
  milestoneState: MilestoneState,
  previousMilestoneProgressRef: React.MutableRefObject<Map<string, boolean>>
): GameEventsState {
  const { state } = useGame();
  const { playSfx } = useSound();
  
  // ==== RUG PULL STATE ====
  const [activeRugPull, setActiveRugPull] = useState<RugPullEvent | null>(null);
  const [rugPullScreenPosition, setRugPullScreenPosition] = useState<{ x: number; y: number } | null>(null);
  const [showRugPullToast, setShowRugPullToast] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const rugPullQueueRef = useRef<RugPullQueue>(new RugPullQueue());
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  // ==== ACHIEVEMENT STATE ====
  const [pendingAchievement, setPendingAchievement] = useState<Achievement | null>(null);
  const [showAchievementToast, setShowAchievementToast] = useState(false);
  const [showAchievementShareDialog, setShowAchievementShareDialog] = useState(false);
  const shownAchievementsRef = useRef<Set<string>>(new Set());
  const previousAchievementsCountRef = useRef<number>(state.achievements?.length || 0);
  
  // ==== NOTIFICATION STATE ====
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [notificationToast, setNotificationToast] = useState<Notification | null>(null);
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  const emitCobieEvent = useCallback((trigger: 'rug_pull' | 'achievement' | 'milestone' | 'disaster' | 'warning' | 'trade', payload?: unknown) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('cobie-event', {
      detail: { trigger, payload },
    }));
  }, []);
  
  // ==== RUG PULL HANDLERS ====
  const handleScreenShake = useCallback((intensity: number, duration: number) => {
    if (gameContainerRef.current) {
      const shakeClass = intensity > 0.7 ? 'shake-heavy' : intensity > 0.4 ? 'shake-medium' : 'shake-light';
      gameContainerRef.current.classList.add('shake', shakeClass);
      setIsScreenShaking(true);
      
      setTimeout(() => {
        if (gameContainerRef.current) {
          gameContainerRef.current.classList.remove('shake', 'shake-light', 'shake-medium', 'shake-heavy');
        }
        setIsScreenShaking(false);
      }, duration);
    }
  }, []);
  
  const handleRugPullAnimationComplete = useCallback(() => {
    setShowRugPullToast(true);
  }, []);
  
  const handleRugPullToastDismiss = useCallback(() => {
    setShowRugPullToast(false);
    setTimeout(() => {
      setActiveRugPull(null);
      setRugPullScreenPosition(null);
    }, 300);
  }, []);
  
  const processRugPullEvent = useCallback(async (event: RugPullEvent) => {
    playSfx('rugPull');
    setActiveRugPull(event);
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setRugPullScreenPosition({ x: centerX, y: centerY });
    
    const totalDuration =
      ANIMATION_PHASES.warning.duration +
      ANIMATION_PHASES.collapse.duration +
      ANIMATION_PHASES.aftermath.duration;
    
    return new Promise<void>((resolve) => {
      setTimeout(resolve, totalDuration);
    });
  }, [playSfx]);
  
  // Set up rug pull queue processor
  useEffect(() => {
    rugPullQueueRef.current.setProcessor(processRugPullEvent);
  }, [processRugPullEvent]);
  
  // Listen for rug pull events
  useEffect(() => {
    const handleRugPull = (buildingId: string, buildingName: string) => {
      const treasuryLoss = 5000;
      const event = createRugPullEvent(buildingName, { x: 0, y: 0 }, treasuryLoss);
      rugPullQueueRef.current.enqueue(event);

      emitCobieEvent('rug_pull', { buildingId, buildingName, treasuryLossPercent: 0.10 });
    };
    
    cryptoEventManager.setRugPullCallback(handleRugPull);
    
    return () => {
      cryptoEventManager.setRugPullCallback(() => {});
    };
  }, [emitCobieEvent]);
  
  // Test rug pull events
  useEffect(() => {
    const handleTestRugPull = (e: CustomEvent) => {
      const { buildingName, position, treasuryLoss } = e.detail || {};
      if (buildingName && treasuryLoss) {
        const event = createRugPullEvent(
          buildingName,
          position || { x: 0, y: 0 },
          treasuryLoss
        );
        rugPullQueueRef.current.enqueue(event);
      }
    };
    
    window.addEventListener('test-rug-pull', handleTestRugPull as EventListener);
    return () => {
      window.removeEventListener('test-rug-pull', handleTestRugPull as EventListener);
    };
  }, []);
  
  // ==== ACHIEVEMENT HANDLERS ====
  const handleAchievementToastDismiss = useCallback(() => {
    setShowAchievementToast(false);
  }, []);
  
  const handleAchievementShare = useCallback(() => {
    setShowAchievementToast(false);
    setShowAchievementShareDialog(true);
  }, []);
  
  const handleAchievementShareDialogClose = useCallback(() => {
    setShowAchievementShareDialog(false);
    setPendingAchievement(null);
  }, []);
  
  // Track achievement unlocks
  useEffect(() => {
    const achievements = state.achievements || [];
    const currentCount = achievements.length;
    
    if (currentCount > previousAchievementsCountRef.current) {
      const newlyUnlocked = achievements.filter(
        (a) => !shownAchievementsRef.current.has(a.id)
      );
      
      if (newlyUnlocked.length > 0 && !showAchievementToast) {
        const achievement = newlyUnlocked[0];
        setPendingAchievement(achievement);
        setShowAchievementToast(true);
        shownAchievementsRef.current.add(achievement.id);
        emitCobieEvent('achievement', { achievementId: achievement.id, name: achievement.name });
      }
    }
    
    previousAchievementsCountRef.current = currentCount;
  }, [state.achievements, showAchievementToast, emitCobieEvent]);
  
  // Custom achievement event listener
  useEffect(() => {
    const handleAchievementUnlocked = (event: CustomEvent<Achievement>) => {
      const achievement = event.detail;
      if (!shownAchievementsRef.current.has(achievement.id)) {
        setPendingAchievement(achievement);
        setShowAchievementToast(true);
        shownAchievementsRef.current.add(achievement.id);
        emitCobieEvent('achievement', { achievementId: achievement.id, name: achievement.name });
      }
    };

    window.addEventListener('achievement-unlocked', handleAchievementUnlocked as EventListener);
    return () => {
      window.removeEventListener('achievement-unlocked', handleAchievementUnlocked as EventListener);
    };
  }, [emitCobieEvent]);
  
  // ==== NOTIFICATION HANDLERS ====
  const handleNotificationToastDismiss = useCallback(() => {
    setShowNotificationToast(false);
    setTimeout(() => setNotificationToast(null), 300);
  }, []);
  
  const handleOpenNotificationCenter = useCallback(() => {
    setShowNotificationCenter(true);
    handleNotificationToastDismiss();
  }, [handleNotificationToastDismiss]);
  
  // Update notification manager with game day
  useEffect(() => {
    notificationManager.setGameDay(state.day);
  }, [state.day, emitCobieEvent]);
  
  // Subscribe to new notifications
  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notification: Notification) => {
      if (notificationManager.shouldShowToast(notification)) {
        setNotificationToast(notification);
        setShowNotificationToast(true);
      }
    });

    return () => unsubscribe();
  }, []);
  
  // Subscribe to disaster events
  useEffect(() => {
    const unsubscribe = disasterManager.subscribe((disaster: ActiveDisaster, isStarting: boolean) => {
      if (isStarting) {
        const notif = createDisasterNotification(
          disaster.disaster.name,
          disaster.disaster.description,
          state.day,
          disaster.disaster.isPositive || false
        );
        notificationManager.add(notif);
        emitCobieEvent('disaster', { name: disaster.disaster.name, positive: disaster.disaster.isPositive || false });
      }
    });

    return () => unsubscribe();
  }, [state.day, emitCobieEvent]);
  
  // Milestone completion notifications
  useEffect(() => {
    for (const mp of milestoneState.milestones) {
      const wasCompleted = previousMilestoneProgressRef.current.get(mp.milestoneId);
      if (mp.completed && !wasCompleted && !mp.claimed) {
        const milestone = MILESTONES.find(m => m.id === mp.milestoneId);
        if (milestone) {
          let rewardText = '';
          if (milestone.reward.treasury) {
            rewardText += `$${milestone.reward.treasury.toLocaleString()}`;
          }
          if (milestone.reward.yieldBonus) {
            rewardText += `${rewardText ? ', ' : ''}+${(milestone.reward.yieldBonus * 100).toFixed(0)}% yield`;
          }
          if (milestone.reward.prestigePoints) {
            rewardText += `${rewardText ? ', ' : ''}+${milestone.reward.prestigePoints} prestige`;
          }
          
          const notif = createMilestoneNotification(
            milestone.name,
            rewardText || 'Reward available!',
            state.day
          );
          notificationManager.add(notif);
          emitCobieEvent('milestone', { milestoneId: milestone.id, name: milestone.name });
        }
      }
    }
  }, [milestoneState.milestones, state.day, previousMilestoneProgressRef, emitCobieEvent]);
  
  // Rug pull notifications
  useEffect(() => {
    if (activeRugPull) {
      const notif = createRugPullNotification(
        activeRugPull.buildingName,
        activeRugPull.treasuryLoss,
        state.day
      );
      notificationManager.add(notif);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRugPull?.buildingName, activeRugPull?.treasuryLoss]);
  
  // Expose managers for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { notificationManager: typeof notificationManager }).notificationManager = notificationManager;
      (window as unknown as { disasterManager: typeof disasterManager }).disasterManager = disasterManager;
    }
  }, []);
  
  return {
    activeRugPull,
    rugPullScreenPosition,
    showRugPullToast,
    isScreenShaking,
    handleScreenShake,
    handleRugPullAnimationComplete,
    handleRugPullToastDismiss,
    gameContainerRef,
    pendingAchievement,
    showAchievementToast,
    showAchievementShareDialog,
    handleAchievementToastDismiss,
    handleAchievementShare,
    handleAchievementShareDialogClose,
    showNotificationCenter,
    setShowNotificationCenter,
    notificationToast,
    showNotificationToast,
    handleNotificationToastDismiss,
    handleOpenNotificationCenter,
  };
}
