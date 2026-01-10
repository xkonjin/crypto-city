"use client";

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useGame } from "@/context/GameContext";
import { Tool } from "@/types/game";
import { useMobile } from "@/hooks/useMobile";
import { MobileToolbar } from "@/components/mobile/MobileToolbar";
import { MobileTopBar } from "@/components/mobile/MobileTopBar";
import { msg, useMessages, useGT } from "gt-next";

// Import shadcn components
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCheatCodes } from "@/hooks/useCheatCodes";
import { VinnieDialog } from "@/components/VinnieDialog";
import { CommandMenu } from "@/components/ui/CommandMenu";
import { CobieNarrator } from "@/components/game/CobieNarrator";
import { useCobieNarrator } from "@/hooks/useCobieNarrator";
import { Tutorial } from "@/components/game/Tutorial";
import { DailyRewards } from "@/components/game/DailyRewards";
import { useMultiplayerSync } from "@/hooks/useMultiplayerSync";
import { useMultiplayerOptional } from "@/context/MultiplayerContext";
import { ShareModal } from "@/components/multiplayer/ShareModal";
import { Copy, Check } from "lucide-react";

// Import achievement share system (Issue #39)
import { AchievementToast } from "@/components/game/AchievementToast";
import { AchievementShareDialog } from "@/components/game/AchievementShareDialog";
import { Achievement } from "@/types/game";

// Import game components
import { OverlayMode } from "@/components/game/types";
import { getOverlayForTool } from "@/components/game/overlays";
import { OverlayModeToggle } from "@/components/game/OverlayModeToggle";
import { Sidebar } from "@/components/game/Sidebar";
import {
  BudgetPanel,
  StatisticsPanel,
  SettingsPanel,
  AdvisorsPanel,
  PetitionsPanel,
  EventsPanel,
  LeaderboardPanel,
  ReferralPanel,
} from "@/components/game/panels";
import { MiniMap } from "@/components/game/MiniMap";
import { TopBar, StatsPanel } from "@/components/game/TopBar";
import { CanvasIsometricGrid } from "@/components/game/CanvasIsometricGrid";
import { ScreenshotShare } from "@/components/game/ScreenshotShare";

// Import crypto components
import TreasuryPanel, { MiniTreasury } from "@/components/crypto/TreasuryPanel";
import NewsTicker from "@/components/crypto/NewsTicker";
import CryptoBuildingPanel from "@/components/crypto/CryptoBuildingPanel";
import {
  cryptoEconomy,
  cryptoEvents as cryptoEventManager,
  CryptoEconomyState,
  CryptoEvent,
} from "@/games/isocity/crypto";
import { useRealCryptoData } from "@/hooks/useRealCryptoData";

// Import game objectives system (Issues #29, #43)
import { GameEndModal } from "@/components/game/GameEndModal";
import {
  GameMode,
  GameObjectives,
  GameEndStats,
  createGameObjectives,
  checkGameEnd,
  calculateGameEndStats,
  WIN_THRESHOLDS,
  LOSE_THRESHOLDS,
} from "@/lib/gameObjectives";

// Import referral system (Issue #38)
import { applyPendingReferral, REFERRED_BONUS } from "@/lib/referral";

// Cargo type names for notifications
const CARGO_TYPE_NAMES = [msg("containers"), msg("bulk materials"), msg("oil")];

export default function Game({ onExit }: { onExit?: () => void }) {
  const gt = useGT();
  const m = useMessages();
  const {
    state,
    setTool,
    setActivePanel,
    addMoney,
    addNotification,
    setSpeed,
    selectedCryptoBuilding,
    setSelectedCryptoBuilding,
    setCryptoTaxRevenue,
  } = useGame();
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("none");
  const [selectedTile, setSelectedTile] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [viewport, setViewport] = useState<{
    offset: { x: number; y: number };
    zoom: number;
    canvasSize: { width: number; height: number };
  } | null>(null);
  const isInitialMount = useRef(true);
  const { isMobileDevice, isSmallScreen } = useMobile();
  const isMobile = isMobileDevice || isSmallScreen;
  const [showShareModal, setShowShareModal] = useState(false);
  const multiplayer = useMultiplayerOptional();

  const [economyState, setEconomyState] = useState<CryptoEconomyState>(
    cryptoEconomy.getState(),
  );
  const [cryptoEvents, setCryptoEvents] = useState<CryptoEvent[]>([]);
  const [showCryptoBuildingPanel, setShowCryptoBuildingPanel] = useState(false);

  // ==== GAME OBJECTIVES STATE (Issues #29, #43) ====
  const [gameMode, setGameMode] = useState<GameMode>('sandbox');
  const [gameObjectives, setGameObjectives] = useState<GameObjectives>(
    createGameObjectives('sandbox')
  );
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameEndStats, setGameEndStats] = useState<GameEndStats | null>(null);
  const previousDayRef = useRef(state.day);
  // ==== END GAME OBJECTIVES STATE ====

  // ==== ACHIEVEMENT SHARE STATE (Issue #39) ====
  const [pendingAchievement, setPendingAchievement] = useState<Achievement | null>(null);
  const [showAchievementToast, setShowAchievementToast] = useState(false);
  const [showAchievementShareDialog, setShowAchievementShareDialog] = useState(false);
  const shownAchievementsRef = useRef<Set<string>>(new Set());
  const previousAchievementsCountRef = useRef<number>(state.achievements?.length || 0);
  // ==== END ACHIEVEMENT SHARE STATE ====

  // Real-world crypto data integration - triggers events from actual market data
  const { data: realCryptoData, blendedData, isOnline, hasData: hasRealData } = useRealCryptoData({
    economyManager: cryptoEconomy,
    eventManager: cryptoEventManager,
    enabled: true,
  });

  // Subscribe to crypto economy and event updates
  useEffect(() => {
    // Subscribe to economy state changes
    const unsubscribeEconomy = cryptoEconomy.subscribe((newState) => {
      setEconomyState(newState);
    });

    // Set up event manager with economy reference and subscribe to events
    cryptoEventManager.setEconomyManager(cryptoEconomy);
    const unsubscribeEvents = cryptoEventManager.subscribe((events) => {
      setCryptoEvents(events);
    });

    // Start both simulations
    cryptoEconomy.startSimulation();
    cryptoEventManager.start();

    return () => {
      // Cleanup: unsubscribe and stop simulations
      unsubscribeEconomy();
      unsubscribeEvents();
      cryptoEconomy.stopSimulation();
      cryptoEventManager.stop();
    };
  }, []);

  // ==== REFERRAL SYSTEM (Issue #38) ====
  // Apply pending referral bonus when game starts
  useEffect(() => {
    const bonus = applyPendingReferral();
    if (bonus) {
      // Add bonus to treasury
      addMoney(bonus);
      // Show notification
      addNotification(
        "Welcome Bonus!",
        `You received $${REFERRED_BONUS.toLocaleString()} for using a referral code!`,
        "gift"
      );
    }
  // Only run once on mount - empty dependency array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ==== END REFERRAL SYSTEM ====

  // Sync game speed with crypto economy
  // This ensures yields pause when game is paused and scale with speed
  useEffect(() => {
    cryptoEconomy.setGameSpeed(state.speed);
  }, [state.speed]);

  // ==== CITY-CRYPTO ECONOMY INTEGRATION (Issue #44) ====
  // Sync city stats with crypto economy for bidirectional effects:
  // - Population affects crypto yields (more users = better yields)
  // - Services affect crypto effectiveness (power/happiness)
  // - Crypto yields generate tax revenue for the city
  useEffect(() => {
    // Update crypto economy with city population
    cryptoEconomy.setPopulation(state.stats.population);
    
    // Update crypto economy with city happiness
    cryptoEconomy.setHappiness(state.stats.happiness);
    
    // Check if city has any power infrastructure (power plants)
    // For simplicity, we assume power is available if there are any buildings producing
    // (The actual power grid check is complex, so we use a proxy)
    const hasPowerInfrastructure = state.services.power.some(
      row => row.some(cell => cell)
    );
    cryptoEconomy.setPowerAvailable(hasPowerInfrastructure);
    
    // Check if city has water infrastructure
    const hasWaterInfrastructure = state.services.water.some(
      row => row.some(cell => cell)
    );
    cryptoEconomy.setWaterAvailable(hasWaterInfrastructure);
  }, [state.stats.population, state.stats.happiness, state.services.power, state.services.water]);
  
  // Calculate crypto tax revenue based on daily yield and tax rate
  // Tax rate applies to crypto yields just like it does to regular income
  useEffect(() => {
    // Convert daily yield to estimated monthly revenue
    // dailyYield is in $/day, we want $/month (30 days)
    const estimatedMonthlyYield = economyState.dailyYield * 30;
    
    // Apply tax rate to get city's share of crypto revenue
    const cryptoTaxRevenue = estimatedMonthlyYield * (state.taxRate / 100);
    
    // Update the city stats with the crypto tax revenue
    setCryptoTaxRevenue(cryptoTaxRevenue);
  }, [economyState.dailyYield, state.taxRate, setCryptoTaxRevenue]);
  // ==== END CITY-CRYPTO ECONOMY INTEGRATION ====

  // ==== GAME OBJECTIVES TRACKING (Issues #29, #43) ====
  // Track game days and check win/lose conditions
  useEffect(() => {
    // Check if a new game day has started
    if (state.day !== previousDayRef.current) {
      previousDayRef.current = state.day;
      cryptoEconomy.incrementGameDay();
    }
    
    // Update low happiness tracking every tick
    cryptoEconomy.updateHappinessTracking(state.stats.happiness);
    
    // Update had crypto buildings tracking
    cryptoEconomy.updateHadCryptoBuildings();
    
    // Skip checking if game already ended or in sandbox mode
    if (gameObjectives.isGameOver || gameMode === 'sandbox') {
      return;
    }
    
    // Build tracking object from economy state
    const tracking = {
      gameDays: economyState.gameDays,
      bankruptcyTicks: economyState.bankruptcyCounter,
      lowHappinessTicks: economyState.lowHappinessCounter,
      peakTVL: economyState.tvl, // We use current TVL as peak for simplicity
      peakPopulation: state.stats.population,
      peakBuildingCount: economyState.buildingCount,
      hadCryptoBuildings: economyState.hadCryptoBuildings,
    };
    
    // Update objectives with current tracking
    const updatedObjectives: GameObjectives = {
      ...gameObjectives,
      tracking,
    };
    
    // Check for game end conditions
    const result = checkGameEnd(updatedObjectives, state, economyState);
    
    if (result.isGameOver) {
      // Calculate end stats
      const stats = calculateGameEndStats(state, economyState, tracking);
      setGameEndStats(stats);
      
      // Update objectives with end state
      setGameObjectives({
        ...updatedObjectives,
        isGameOver: true,
        isVictory: result.isVictory,
        endReason: result.endReason,
        endConditionId: result.endConditionId,
      });
      
      // Show the modal
      setShowGameEndModal(true);
      
      // Pause the game
      setSpeed(0);
    } else {
      // Just update tracking
      setGameObjectives(updatedObjectives);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only trigger on specific state changes, not on every state/objectives update
  }, [state.day, state.stats.happiness, state.stats.population, economyState, gameMode, gameObjectives.isGameOver, setSpeed]);
  // ==== END GAME OBJECTIVES TRACKING ====

  // ==== ACHIEVEMENT UNLOCK TRACKING (Issue #39) ====
  // Track when new achievements are unlocked and show toast
  useEffect(() => {
    const achievements = state.achievements || [];
    const currentCount = achievements.length;
    
    // Check if we have new achievements
    if (currentCount > previousAchievementsCountRef.current) {
      // Find the newly unlocked achievements
      const newlyUnlocked = achievements.filter(
        (a) => !shownAchievementsRef.current.has(a.id)
      );
      
      // Show toast for the first newly unlocked achievement
      // (Queue system could be added for multiple simultaneous unlocks)
      if (newlyUnlocked.length > 0 && !showAchievementToast) {
        const achievement = newlyUnlocked[0];
        setPendingAchievement(achievement);
        setShowAchievementToast(true);
        shownAchievementsRef.current.add(achievement.id);
      }
    }
    
    previousAchievementsCountRef.current = currentCount;
  }, [state.achievements, showAchievementToast]);

  // Listen for custom achievement-unlocked events (for testing)
  useEffect(() => {
    const handleAchievementUnlocked = (event: CustomEvent<Achievement>) => {
      const achievement = event.detail;
      if (!shownAchievementsRef.current.has(achievement.id)) {
        setPendingAchievement(achievement);
        setShowAchievementToast(true);
        shownAchievementsRef.current.add(achievement.id);
      }
    };

    window.addEventListener('achievement-unlocked', handleAchievementUnlocked as EventListener);
    return () => {
      window.removeEventListener('achievement-unlocked', handleAchievementUnlocked as EventListener);
    };
  }, []);

  // Achievement toast handlers
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
  // ==== END ACHIEVEMENT UNLOCK TRACKING ====

  // Cheat code system
  const {
    triggeredCheat,
    showVinnieDialog,
    setShowVinnieDialog,
    clearTriggeredCheat,
  } = useCheatCodes();

  // Cobie narrator system - sardonic tips and commentary
  const {
    currentMessage: cobieMessage,
    isVisible: isCobieVisible,
    onDismiss: onCobieDismiss,
    onDisableCobie,
    triggerReaction: triggerCobieReaction,
    triggerMilestone: triggerCobieMilestone,
  } = useCobieNarrator(state);

  // Multiplayer sync
  const {
    isMultiplayer,
    isHost,
    playerCount,
    roomCode,
    players,
    broadcastPlace,
    leaveRoom,
  } = useMultiplayerSync();

  const previousPetitionId = useRef<string | null>(null);
  useEffect(() => {
    if (
      state.activePetition &&
      state.activePetition.id !== previousPetitionId.current
    ) {
      previousPetitionId.current = state.activePetition.id;
      setActivePanel("petitions");
    } else if (!state.activePetition) {
      previousPetitionId.current = null;
    }
  }, [state.activePetition, setActivePanel]);

  const previousEventId = useRef<string | null>(null);
  useEffect(() => {
    if (state.activeEvent && state.activeEvent.id !== previousEventId.current) {
      previousEventId.current = state.activeEvent.id;
      setActivePanel("events");
    } else if (!state.activeEvent) {
      previousEventId.current = null;
    }
  }, [state.activeEvent, setActivePanel]);

  // Copy room link state
  const [copiedRoomLink, setCopiedRoomLink] = useState(false);

  const handleCopyRoomLink = useCallback(() => {
    if (!roomCode) return;
    const url = `${window.location.origin}/coop/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedRoomLink(true);
    setTimeout(() => setCopiedRoomLink(false), 2000);
  }, [roomCode]);
  const initialSelectedToolRef = useRef<Tool | null>(null);
  const previousSelectedToolRef = useRef<Tool | null>(null);
  const hasCapturedInitialTool = useRef(false);
  const currentSelectedToolRef = useRef<Tool>(state.selectedTool);

  // Keep currentSelectedToolRef in sync with state
  useEffect(() => {
    currentSelectedToolRef.current = state.selectedTool;
  }, [state.selectedTool]);

  // Track the initial selectedTool after localStorage loads (with a small delay to allow state to load)
  useEffect(() => {
    if (!hasCapturedInitialTool.current) {
      // Use a timeout to ensure localStorage state has loaded
      const timeoutId = setTimeout(() => {
        initialSelectedToolRef.current = currentSelectedToolRef.current;
        previousSelectedToolRef.current = currentSelectedToolRef.current;
        hasCapturedInitialTool.current = true;
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, []); // Only run once on mount

  // Auto-set overlay when selecting utility tools (but not on initial page load)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Select tool always resets overlay to none (user is explicitly switching to select)
    if (state.selectedTool === "select") {
      setTimeout(() => {
        setOverlayMode("none");
      }, 0);
      previousSelectedToolRef.current = state.selectedTool;
      return;
    }

    // Subway tool sets overlay when actively selected (not on page load)
    if (
      state.selectedTool === "subway" ||
      state.selectedTool === "subway_station"
    ) {
      setTimeout(() => {
        setOverlayMode("subway");
      }, 0);
      previousSelectedToolRef.current = state.selectedTool;
      return;
    }

    // Don't auto-set overlay until we've captured the initial tool
    if (!hasCapturedInitialTool.current) {
      return;
    }

    // Don't auto-set overlay if this matches the initial tool from localStorage
    if (
      initialSelectedToolRef.current !== null &&
      initialSelectedToolRef.current === state.selectedTool
    ) {
      return;
    }

    // Don't auto-set overlay if tool hasn't changed
    if (previousSelectedToolRef.current === state.selectedTool) {
      return;
    }

    // Update previous tool reference
    previousSelectedToolRef.current = state.selectedTool;

    setTimeout(() => {
      setOverlayMode(getOverlayForTool(state.selectedTool));
    }, 0);
  }, [state.selectedTool]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (overlayMode !== "none") {
          setOverlayMode("none");
        } else if (state.activePanel !== "none") {
          setActivePanel("none");
        } else if (selectedTile) {
          setSelectedTile(null);
        } else if (state.selectedTool !== "select") {
          setTool("select");
        }
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setTool("bulldoze");
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        // Toggle pause/unpause: if paused (speed 0), resume to normal (speed 1)
        // If running, pause (speed 0)
        setSpeed(state.speed === 0 ? 1 : 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.activePanel,
    state.selectedTool,
    state.speed,
    selectedTile,
    setActivePanel,
    setTool,
    setSpeed,
    overlayMode,
  ]);

  // Handle cheat code triggers
  useEffect(() => {
    if (!triggeredCheat) return;

    switch (triggeredCheat.type) {
      case "konami":
        addMoney(triggeredCheat.amount);
        addNotification(
          gt("Retro Cheat Activated!"),
          gt(
            "Your accountants are confused but not complaining. You received $50,000!",
          ),
          "trophy",
        );
        clearTriggeredCheat();
        break;

      case "motherlode":
        addMoney(triggeredCheat.amount);
        addNotification(
          gt("Motherlode!"),
          gt("Your treasury just got a lot heavier. You received $1,000,000!"),
          "trophy",
        );
        clearTriggeredCheat();
        break;

      case "vinnie":
        // Vinnie dialog is handled by VinnieDialog component
        clearTriggeredCheat();
        break;
    }
  }, [triggeredCheat, addMoney, addNotification, clearTriggeredCheat, gt]);

  // Track barge deliveries to show occasional notifications
  const bargeDeliveryCountRef = useRef(0);

  // Handle barge cargo delivery - adds money to the city treasury
  const handleBargeDelivery = useCallback(
    (cargoValue: number, cargoType: number) => {
      addMoney(cargoValue);
      bargeDeliveryCountRef.current++;

      // Show a notification every 5 deliveries to avoid spam
      if (bargeDeliveryCountRef.current % 5 === 1) {
        const cargoName = CARGO_TYPE_NAMES[cargoType] || msg("cargo");
        addNotification(
          gt("Cargo Delivered"),
          gt(
            "A shipment of {cargoName} has arrived at the marina. +${cargoValue} trade revenue.",
            { cargoName: m(cargoName), cargoValue },
          ),
          "ship",
        );
      }
    },
    [addMoney, addNotification, gt, m],
  );

  // ==== GAME END HANDLERS (Issues #29, #43) ====
  // Handle Play Again button - reset game
  const handlePlayAgain = useCallback(() => {
    setShowGameEndModal(false);
    setGameObjectives(createGameObjectives(gameMode));
    setGameEndStats(null);
    cryptoEconomy.resetObjectivesTracking();
    // onExit will trigger returning to home screen for new game
    if (onExit) {
      onExit();
    }
  }, [gameMode, onExit]);

  // Handle Continue in Sandbox button - switch to sandbox mode and continue playing
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
    // Resume the game
    setSpeed(1);
  }, [setSpeed]);
  // ==== END GAME END HANDLERS ====

  // Mobile layout
  if (isMobile) {
    return (
      <TooltipProvider>
        <div className="w-full h-full overflow-hidden bg-background flex flex-col">
          {/* Mobile Top Bar */}
          <MobileTopBar
            selectedTile={
              selectedTile && state.selectedTool === "select"
                ? state.grid[selectedTile.y][selectedTile.x]
                : null
            }
            services={state.services}
            onCloseTile={() => setSelectedTile(null)}
            onShare={() => setShowShareModal(true)}
            onExit={onExit}
          />

          {/* Crypto Mini Treasury - Mobile (compact version) */}
          <div className="absolute top-16 left-2 z-30">
            <MiniTreasury
              treasury={economyState.treasury}
              dailyYield={economyState.dailyYield}
              sentiment={economyState.marketSentiment}
            />
          </div>

          {/* Share Modal for mobile co-op */}
          {multiplayer && (
            <ShareModal
              open={showShareModal}
              onOpenChange={setShowShareModal}
            />
          )}

          {/* Main canvas area - fills remaining space, with padding for top/bottom bars */}
          <div
            className="flex-1 relative overflow-hidden"
            style={{ paddingTop: "72px", paddingBottom: "76px" }}
          >
            <CanvasIsometricGrid
              overlayMode={overlayMode}
              selectedTile={selectedTile}
              setSelectedTile={setSelectedTile}
              isMobile={true}
              onBargeDelivery={handleBargeDelivery}
              selectedCryptoBuilding={selectedCryptoBuilding}
            />

            {/* Multiplayer Players Indicator - Mobile */}
            {isMultiplayer && (
              <div className="absolute top-2 right-2 z-20">
                <div className="bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1.5 shadow-lg">
                  <div className="flex items-center gap-1.5 text-xs text-white">
                    {roomCode && (
                      <>
                        <span className="font-mono tracking-wider">
                          {roomCode}
                        </span>
                        <button
                          onClick={handleCopyRoomLink}
                          className="p-0.5 hover:bg-white/10 rounded transition-colors"
                          title="Copy invite link"
                        >
                          {copiedRoomLink ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                  {players.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center gap-1 text-[10px] text-slate-400"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {player.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile News Ticker - shown at bottom of canvas area */}
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <NewsTicker events={cryptoEvents} className="text-xs" />
            </div>
          </div>

          {/* Mobile Bottom Toolbar */}
          <MobileToolbar
            onOpenPanel={(panel) => setActivePanel(panel)}
            overlayMode={overlayMode}
            setOverlayMode={setOverlayMode}
          />

          {state.activePanel === "budget" && <BudgetPanel />}
          {state.activePanel === "statistics" && <StatisticsPanel />}
          {state.activePanel === "advisors" && <AdvisorsPanel />}
          {state.activePanel === "settings" && <SettingsPanel />}
          {state.activePanel === "petitions" && <PetitionsPanel />}
          {state.activePanel === "events" && <EventsPanel />}
          {state.activePanel === "referral" && <ReferralPanel />}

          <VinnieDialog
            open={showVinnieDialog}
            onOpenChange={setShowVinnieDialog}
          />

          {/* Tutorial system for new players */}
          <Tutorial state={state} />

          {/* Daily rewards system */}
          <DailyRewards onClaimReward={(amount) => cryptoEconomy.deposit(amount)} />

          {/* Cobie Narrator for sardonic tips and commentary */}
          <CobieNarrator
            message={cobieMessage}
            isVisible={isCobieVisible}
            onDismiss={onCobieDismiss}
            onDisableCobie={onDisableCobie}
          />

          {/* Game End Modal (Issues #29, #43) */}
          {showGameEndModal && gameEndStats && (
            <GameEndModal
              isOpen={showGameEndModal}
              isVictory={gameObjectives.isVictory}
              endReason={gameObjectives.endReason || 'Unknown'}
              endConditionId={gameObjectives.endConditionId || 'unknown'}
              stats={gameEndStats}
              onPlayAgain={handlePlayAgain}
              onContinueSandbox={handleContinueSandbox}
            />
          )}

          {/* Achievement Toast and Share Dialog (Issue #39) */}
          <AchievementToast
            achievement={pendingAchievement}
            isVisible={showAchievementToast}
            onDismiss={handleAchievementToastDismiss}
            onShare={handleAchievementShare}
          />
          <AchievementShareDialog
            achievement={pendingAchievement}
            stats={{
              treasury: state.stats.money,
              population: state.stats.population,
              days: state.day,
            }}
            isOpen={showAchievementShareDialog}
            onClose={handleAchievementShareDialogClose}
          />
        </div>
      </TooltipProvider>
    );
  }

  // Desktop layout
  return (
    <TooltipProvider>
      <div className="w-full h-full min-h-[720px] overflow-hidden bg-background flex flex-col">
        {/* Crypto Treasury Panel - Top */}
        <div className="relative z-50">
          <TreasuryPanel economyState={economyState} />
          {/* Screenshot Share Button */}
          <div className="absolute right-48 top-1/2 -translate-y-1/2">
            <ScreenshotShare
              stats={{
                population: state.stats.population,
                money: state.stats.money,
                cityName: state.cityName,
              }}
              cryptoStats={{
                treasury: economyState.treasury,
                sentiment: economyState.marketSentiment,
                buildingCount: economyState.buildingCount,
              }}
            />
          </div>
          {/* Crypto Buildings Toggle Button */}
          <button
            onClick={() => setShowCryptoBuildingPanel(!showCryptoBuildingPanel)}
            className={`
              absolute right-4 top-1/2 -translate-y-1/2
              px-3 py-1.5 rounded-lg text-sm font-semibold
              transition-all duration-200 shadow-lg
              ${
                showCryptoBuildingPanel
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "bg-gray-800 text-amber-400 hover:bg-gray-700 border border-amber-500/50"
              }
            `}
            title="Toggle Crypto Buildings Panel"
          >
            🏗️ Crypto Buildings
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <Sidebar onExit={onExit} />

          <div className="flex-1 flex flex-col ml-56">
            <TopBar />
            <StatsPanel />
            <div className="flex-1 relative overflow-visible">
              <CanvasIsometricGrid
                overlayMode={overlayMode}
                selectedTile={selectedTile}
                setSelectedTile={setSelectedTile}
                navigationTarget={navigationTarget}
                onNavigationComplete={() => setNavigationTarget(null)}
                onViewportChange={setViewport}
                onBargeDelivery={handleBargeDelivery}
                selectedCryptoBuilding={selectedCryptoBuilding}
              />
              <OverlayModeToggle
                overlayMode={overlayMode}
                setOverlayMode={setOverlayMode}
              />
              <MiniMap
                onNavigate={(x, y) => setNavigationTarget({ x, y })}
                viewport={viewport}
              />

              {/* Multiplayer Players Indicator */}
              {isMultiplayer && (
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 shadow-lg min-w-[120px]">
                    <div className="flex items-center gap-2 text-sm text-white">
                      {roomCode && (
                        <>
                          <span className="font-mono font-medium tracking-wider">
                            {roomCode}
                          </span>
                          <button
                            onClick={handleCopyRoomLink}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Copy invite link"
                          >
                            {copiedRoomLink ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                    {players.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {players.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center gap-1.5 text-xs text-slate-400"
                          >
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            {player.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {state.activePanel === "budget" && <BudgetPanel />}
          {state.activePanel === "statistics" && <StatisticsPanel />}
          {state.activePanel === "advisors" && <AdvisorsPanel />}
          {state.activePanel === "settings" && <SettingsPanel />}
          {state.activePanel === "petitions" && <PetitionsPanel />}
          {state.activePanel === "events" && <EventsPanel />}
          {state.activePanel === "leaderboard" && <LeaderboardPanel />}
          {state.activePanel === "referral" && <ReferralPanel />}

          {/* Crypto Building Panel - shown via sidebar or toggle button */}
          {(showCryptoBuildingPanel || state.activePanel === "crypto") && (
            <div className="fixed right-4 top-20 z-40 w-80">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowCryptoBuildingPanel(false);
                    if (state.activePanel === "crypto") {
                      setActivePanel("none");
                    }
                  }}
                  className="absolute -top-2 -right-2 z-50 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full text-white text-xs flex items-center justify-center shadow-lg"
                >
                  ✕
                </button>
                <CryptoBuildingPanel
                  selectedBuilding={selectedCryptoBuilding}
                  onSelectBuilding={(buildingId) => {
                    setSelectedCryptoBuilding(buildingId);
                    setTool("select");
                  }}
                  treasury={economyState.treasury}
                />
              </div>
            </div>
          )}

          <VinnieDialog
            open={showVinnieDialog}
            onOpenChange={setShowVinnieDialog}
          />
          <CommandMenu />

          {/* Tutorial system for new players */}
          <Tutorial state={state} />

          {/* Daily rewards system */}
          <DailyRewards onClaimReward={(amount) => cryptoEconomy.deposit(amount)} />

          {/* Cobie Narrator for sardonic tips and commentary */}
          <CobieNarrator
            message={cobieMessage}
            isVisible={isCobieVisible}
            onDismiss={onCobieDismiss}
            onDisableCobie={onDisableCobie}
          />

          {/* Game End Modal (Issues #29, #43) */}
          {showGameEndModal && gameEndStats && (
            <GameEndModal
              isOpen={showGameEndModal}
              isVictory={gameObjectives.isVictory}
              endReason={gameObjectives.endReason || 'Unknown'}
              endConditionId={gameObjectives.endConditionId || 'unknown'}
              stats={gameEndStats}
              onPlayAgain={handlePlayAgain}
              onContinueSandbox={handleContinueSandbox}
            />
          )}

          {/* Achievement Toast and Share Dialog (Issue #39) */}
          <AchievementToast
            achievement={pendingAchievement}
            isVisible={showAchievementToast}
            onDismiss={handleAchievementToastDismiss}
            onShare={handleAchievementShare}
          />
          <AchievementShareDialog
            achievement={pendingAchievement}
            stats={{
              treasury: state.stats.money,
              population: state.stats.population,
              days: state.day,
            }}
            isOpen={showAchievementShareDialog}
            onClose={handleAchievementShareDialogClose}
          />
        </div>

        {/* Crypto News Ticker - Bottom */}
        <NewsTicker events={cryptoEvents} className="z-50" />
      </div>
    </TooltipProvider>
  );
}
