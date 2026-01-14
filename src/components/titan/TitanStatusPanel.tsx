/**
 * TitanStatusPanel - Persistent UI Panel for Titan Status
 *
 * Displays comprehensive information about the Titan companion:
 * - Name, level, species, alignment
 * - Alignment bar (gradient from angelic to demonic)
 * - Needs bars with color coding (green/yellow/red)
 * - Mood indicator with emoji
 * - Current goal display
 * - Action buttons (Feed, Pet, Command, Details)
 * - Collapsible state for space saving
 * - No Titan state with spawn instructions
 *
 * "The status panel: your window into the soul of a creature
 * whose entire existence revolves around your approval.
 * No pressure."
 *
 * @see specs/HERO_PET_SYSTEM.md Section 10 on UI Components
 */

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useTitan } from "@/hooks/useTitan";
import type { TitanPet, TitanSpecies, AlignmentState } from "@/games/isocity/types/titan";
import type { Mood } from "@/lib/npc/mood";
import type { TitanNeedType } from "@/lib/titan/TitanNeeds";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the TitanStatusPanel component
 */
export interface TitanStatusPanelProps {
  /** Additional CSS class names */
  className?: string;
  /** Whether the panel is collapsed */
  collapsed?: boolean;
  /** Callback when collapse toggle is clicked */
  onToggleCollapse?: () => void;
  /** Callback when details button is clicked */
  onOpenDetails?: () => void;
}

/**
 * Props for the AlignmentBar sub-component
 */
export interface AlignmentBarProps {
  /** Alignment value from -1.0 (angelic) to +1.0 (demonic) */
  alignment: number;
}

/**
 * Props for the NeedBar sub-component
 */
export interface NeedBarProps {
  /** Emoji icon for the need */
  icon: string;
  /** Name of the need */
  name: string;
  /** Current value */
  value: number;
  /** Maximum value */
  max: number;
  /** Critical threshold (optional) */
  critical?: number;
}

/**
 * Props for the MoodIndicator sub-component
 */
export interface MoodIndicatorProps {
  /** Current mood */
  mood: Mood;
  /** Mood intensity (0-1) */
  intensity: number;
}

/**
 * Props for the ActionButtons sub-component
 */
export interface ActionButtonsProps {
  /** Callback for Feed button */
  onFeed: () => void;
  /** Callback for Pet button */
  onPet: () => void;
  /** Callback for Command button */
  onCommand: () => void;
  /** Callback for Details button */
  onDetails: () => void;
  /** Whether buttons are disabled */
  disabled?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Species emoji icons
 */
const SPECIES_ICONS: Record<TitanSpecies, string> = {
  doge: "🐕",
  bull: "🐂",
  bear: "🐻",
  ape: "🦍",
  whale: "🐋",
  phoenix: "🔥",
};

/**
 * Mood emoji icons
 */
const MOOD_ICONS: Record<Mood, string> = {
  ecstatic: "🤩",
  happy: "😊",
  content: "😌",
  neutral: "😐",
  anxious: "😰",
  sad: "😢",
  angry: "😠",
  depressed: "😞",
};

/**
 * Need type icons
 */
const NEED_ICONS: Record<TitanNeedType, string> = {
  hunger: "🍖",
  energy: "⚡",
  social: "💬",
  fun: "🎮",
  wealth: "💰",
  purpose: "🎯",
  attention: "👋",
  growth: "📈",
};

/**
 * Alignment state labels
 */
const ALIGNMENT_LABELS: Record<AlignmentState, string> = {
  angelic: "Angelic",
  good: "Good",
  neutral: "Neutral",
  evil: "Evil",
  demonic: "Demonic",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get alignment state from alignment value
 */
function getAlignmentState(alignment: number): AlignmentState {
  if (alignment <= -0.6) return "angelic";
  if (alignment <= -0.2) return "good";
  if (alignment <= 0.2) return "neutral";
  if (alignment <= 0.6) return "evil";
  return "demonic";
}

/**
 * Get need bar color based on percentage
 */
function getNeedBarColor(percentage: number): string {
  if (percentage > 60) return "bg-green-500";
  if (percentage >= 30) return "bg-yellow-500";
  return "bg-red-500";
}

/**
 * Format goal type for display
 */
function formatGoalType(goal: TitanPet["bdi"]["intentions"]): string {
  if (!goal) return "Idle";
  
  const goalMap: Record<string, string> = {
    seek_food: "Seeking food",
    seek_attention: "Seeking attention",
    help_npc: "Helping NPC",
    explore_area: "Exploring",
    learn_from: "Learning",
    rest: "Resting",
    play: "Playing",
  };
  
  return goalMap[goal.goal.type] || "Unknown";
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * AlignmentBar - Shows alignment gradient with position marker
 */
export const AlignmentBar: React.FC<AlignmentBarProps> = ({ alignment }) => {
  // Convert alignment (-1 to 1) to percentage (0 to 100)
  const percentage = ((alignment + 1) / 2) * 100;
  const alignmentState = getAlignmentState(alignment);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Alignment</span>
        <span data-testid="titan-alignment-label">{ALIGNMENT_LABELS[alignmentState]}</span>
      </div>
      <div
        data-testid="titan-alignment-bar"
        className="relative h-3 rounded-full overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right, gold 0%, lightgreen 25%, gray 50%, crimson 75%, darkred 100%)",
        }}
        role="progressbar"
        aria-label={`Alignment: ${ALIGNMENT_LABELS[alignmentState]}`}
        aria-valuenow={alignment}
        aria-valuemin={-1}
        aria-valuemax={1}
      >
        {/* Position marker */}
        <div
          data-testid="titan-alignment-marker"
          className="absolute top-0 h-full w-1.5 bg-white shadow-lg rounded-full transform -translate-x-1/2 transition-all duration-300"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * NeedBar - Individual need progress bar with icon
 */
export const NeedBar: React.FC<NeedBarProps> = ({
  icon,
  name,
  value,
  max,
  critical = 20,
}) => {
  const percentage = Math.round((value / max) * 100);
  const isCritical = value <= critical;
  const colorClass = getNeedBarColor(percentage);

  return (
    <div
      data-testid={`titan-need-bar-${name.toLowerCase()}`}
      className={`flex items-center gap-2 ${isCritical ? "animate-pulse" : ""}`}
      role="progressbar"
      aria-label={`${name}: ${percentage}%`}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span className="w-5 text-sm" title={name}>
        {icon}
      </span>
      <span className="w-16 text-xs text-slate-300 truncate">{name}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          data-testid="need-bar-progress"
          className={`h-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-xs text-slate-400 text-right">{percentage}%</span>
    </div>
  );
};

/**
 * MoodIndicator - Shows mood emoji and label
 */
export const MoodIndicator: React.FC<MoodIndicatorProps> = ({ mood, intensity }) => {
  const emoji = MOOD_ICONS[mood] || "😐";
  const moodName = capitalize(mood);

  return (
    <div
      data-testid="titan-mood-indicator"
      className="flex items-center gap-2"
      aria-label={`Mood: ${moodName}`}
    >
      <span className="text-lg" style={{ opacity: 0.5 + intensity * 0.5 }}>
        {emoji}
      </span>
      <span className="text-sm text-slate-300">{moodName}</span>
    </div>
  );
};

/**
 * ActionButtons - Row of action buttons
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onFeed,
  onPet,
  onCommand,
  onDetails,
  disabled = false,
}) => {
  const buttonClass = `
    px-3 py-1.5 text-xs font-medium rounded-md
    transition-colors duration-150
    ${
      disabled
        ? "bg-slate-700 text-slate-500 cursor-not-allowed"
        : "bg-slate-700 text-slate-200 hover:bg-slate-600 active:bg-slate-500"
    }
  `;

  return (
    <div className="flex gap-2 mt-3">
      <button
        data-testid="titan-action-feed"
        className={buttonClass}
        onClick={onFeed}
        disabled={disabled}
        aria-label="Feed the Titan"
      >
        Feed
      </button>
      <button
        data-testid="titan-action-pet"
        className={buttonClass}
        onClick={onPet}
        disabled={disabled}
        aria-label="Pet the Titan"
      >
        Pet
      </button>
      <button
        data-testid="titan-action-command"
        className={buttonClass}
        onClick={onCommand}
        disabled={disabled}
        aria-label="Command the Titan"
      >
        Command
      </button>
      <button
        data-testid="titan-action-details"
        className={buttonClass}
        onClick={onDetails}
        disabled={disabled}
        aria-label="View Titan details"
      >
        Details
      </button>
    </div>
  );
};

// =============================================================================
// NO TITAN VIEW
// =============================================================================

interface NoTitanViewProps {
  onSpawnTest?: () => void;
}

const NoTitanView: React.FC<NoTitanViewProps> = ({ onSpawnTest }) => {
  return (
    <div className="text-center py-4">
      <div
        data-testid="titan-no-titan-message"
        className="text-slate-300 font-medium mb-2"
      >
        No Titan
      </div>
      <div className="w-16 h-px bg-slate-600 mx-auto mb-3" />
      <p
        data-testid="titan-no-titan-instructions"
        className="text-xs text-slate-400 mb-4"
      >
        Place a Titan Den to get your first companion!
      </p>
      {/* Dev mode spawn button */}
      {process.env.NODE_ENV === "development" && onSpawnTest && (
        <button
          data-testid="titan-spawn-test-button"
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          onClick={onSpawnTest}
        >
          Spawn Test Titan
        </button>
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * TitanStatusPanel - Main status panel component
 */
export const TitanStatusPanel: React.FC<TitanStatusPanelProps> = ({
  className = "",
  collapsed: controlledCollapsed,
  onToggleCollapse,
  onOpenDetails,
}) => {
  // State
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  // Titan state from hook
  const { titan, hasTitan, spawnTitan, praise } = useTitan();

  // Callback tracking refs for testing
  const feedCalledRef = useRef(false);
  const petCalledRef = useRef(false);
  const commandCalledRef = useRef(false);
  const detailsCalledRef = useRef(false);
  // Use state instead of ref to avoid lint error (cannot access refs during render)
  const [buttonsDisabled, setButtonsDisabled] = useState(false);

  // Handlers
  const handleToggleCollapse = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  }, [onToggleCollapse]);

  const handleFeed = useCallback(() => {
    feedCalledRef.current = true;
    // TODO: Open feed dialog or trigger god hand feed
    console.log("Feed Titan");
  }, []);

  const handlePet = useCallback(() => {
    petCalledRef.current = true;
    praise();
  }, [praise]);

  const handleCommand = useCallback(() => {
    commandCalledRef.current = true;
    // TODO: Open command panel
    console.log("Command Titan");
  }, []);

  const handleDetails = useCallback(() => {
    detailsCalledRef.current = true;
    onOpenDetails?.();
  }, [onOpenDetails]);

  const handleSpawnTest = useCallback(() => {
    spawnTitan({
      gridX: 10,
      gridY: 10,
      species: "doge",
      name: "TestDoge",
    });
  }, [spawnTitan]);

  // Expose test hooks
  useEffect(() => {
    if (typeof window === "undefined") return;

    // @ts-expect-error - Expose for testing
    window.__TITAN_STATUS_PANEL_HOOKS__ = {
      spawnTestTitan: (options: { 
        name?: string; 
        species?: TitanSpecies; 
        alignment?: number 
      }) => {
        const newTitan = spawnTitan({
          gridX: 10,
          gridY: 10,
          species: options.species || "doge",
          name: options.name || "TestTitan",
          initialAlignment: options.alignment,
        });
        return newTitan;
      },
      despawnTitan: () => {
        // Note: useTitan hook should have despawnTitan
        // For now, we'll use localStorage clear
        localStorage.removeItem("crypto-city-titan");
        window.location.reload();
      },
      setCollapsed: (value: boolean) => {
        setInternalCollapsed(value);
      },
      setTitanNeed: (needType: TitanNeedType, value: number) => {
        // This would require updating the Titan state directly
        // For testing, we expose the mechanism
        console.log(`Set ${needType} to ${value}`);
      },
      setTitanMood: (mood: Mood) => {
        // This would require updating the Titan state directly
        console.log(`Set mood to ${mood}`);
      },
      setButtonsDisabled: (disabled: boolean) => {
        setButtonsDisabled(disabled);
      },
      setOnFeed: (cb: () => void) => {
        // Store callback
      },
      wasFeedCalled: () => feedCalledRef.current,
      wasPetCalled: () => petCalledRef.current,
      wasCommandCalled: () => commandCalledRef.current,
      wasDetailsCalled: () => detailsCalledRef.current,
    };

    return () => {
      // @ts-expect-error - Cleanup
      delete window.__TITAN_STATUS_PANEL_HOOKS__;
    };
  }, [spawnTitan]);

  // Panel base classes
  const panelClasses = collapsed
    ? "fixed right-4 top-20 w-48 bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-slate-700 p-2"
    : "fixed right-4 top-20 w-64 bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-slate-700 p-4";

  // Get species icon
  const speciesIcon = titan ? SPECIES_ICONS[titan.species] || "🐕" : "🐕";

  return (
    <div
      data-testid="titan-status-panel"
      data-collapsed={collapsed}
      className={`${panelClasses} ${className}`}
      role="region"
      aria-label="Titan Status Panel"
    >
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between mb-2">
        <div
          data-testid="titan-status-name"
          className="font-medium text-slate-100 flex items-center gap-1"
        >
          <span>{speciesIcon}</span>
          <span>{titan?.name || "No Titan"}</span>
        </div>
        <button
          data-testid="titan-collapse-toggle"
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          onClick={handleToggleCollapse}
          aria-label={collapsed ? "Expand panel" : "Collapse panel"}
        >
          {collapsed ? "▲" : "▼"}
        </button>
      </div>

      {/* No Titan state */}
      {!hasTitan && <NoTitanView onSpawnTest={handleSpawnTest} />}

      {/* Collapsed state - minimal info */}
      {hasTitan && collapsed && titan && (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <MoodIndicator
            mood={titan.mood.currentMood}
            intensity={titan.mood.moodIntensity}
          />
          {titan.needs.hunger.current < titan.needs.hunger.criticalThreshold && (
            <span className="text-xs text-red-400">Hungry</span>
          )}
        </div>
      )}

      {/* Expanded state - full info */}
      {hasTitan && !collapsed && titan && (
        <>
          {/* Level and species info */}
          <div
            data-testid="titan-status-info"
            className="text-xs text-slate-400 mb-3"
          >
            Level 1 {capitalize(titan.species)} · {ALIGNMENT_LABELS[getAlignmentState(titan.alignment)]}
          </div>

          {/* Separator */}
          <div className="w-full h-px bg-slate-600 mb-3" />

          {/* Alignment bar */}
          <div className="mb-4">
            <AlignmentBar alignment={titan.alignment} />
          </div>

          {/* Needs section */}
          <div className="mb-4">
            <div className="text-xs text-slate-400 mb-2">Needs:</div>
            <div className="space-y-1.5">
              <NeedBar
                icon={NEED_ICONS.hunger}
                name="Hunger"
                value={titan.needs.hunger.current}
                max={titan.needs.hunger.max}
                critical={titan.needs.hunger.criticalThreshold}
              />
              <NeedBar
                icon={NEED_ICONS.energy}
                name="Energy"
                value={titan.needs.energy.current}
                max={titan.needs.energy.max}
                critical={titan.needs.energy.criticalThreshold}
              />
              <NeedBar
                icon={NEED_ICONS.social}
                name="Social"
                value={titan.needs.social.current}
                max={titan.needs.social.max}
                critical={titan.needs.social.criticalThreshold}
              />
              <NeedBar
                icon={NEED_ICONS.fun}
                name="Fun"
                value={titan.needs.fun.current}
                max={titan.needs.fun.max}
                critical={titan.needs.fun.criticalThreshold}
              />
              <NeedBar
                icon={NEED_ICONS.attention}
                name="Attention"
                value={titan.needs.attention.current}
                max={titan.needs.attention.max}
                critical={titan.needs.attention.criticalThreshold}
              />
              <NeedBar
                icon={NEED_ICONS.growth}
                name="Growth"
                value={titan.needs.growth.current}
                max={titan.needs.growth.max}
                critical={titan.needs.growth.criticalThreshold}
              />
            </div>
          </div>

          {/* Mood and Goal */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Mood:</span>
              <MoodIndicator
                mood={titan.mood.currentMood}
                intensity={titan.mood.moodIntensity}
              />
            </div>
          </div>

          <div
            data-testid="titan-current-goal"
            className="text-xs text-slate-400 mb-3"
          >
            <span className="text-slate-500">Goal:</span>{" "}
            <span className="text-slate-300">{formatGoalType(titan.bdi.intentions)}</span>
          </div>

          {/* Action buttons */}
          <ActionButtons
            onFeed={handleFeed}
            onPet={handlePet}
            onCommand={handleCommand}
            onDetails={handleDetails}
            disabled={buttonsDisabled}
          />
        </>
      )}
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default TitanStatusPanel;
