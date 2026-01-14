/**
 * TitanDetailView - Full-screen Detailed Titan View
 *
 * A comprehensive modal view displaying all Titan data including:
 * - Status (needs, mood, alignment)
 * - Skills (all 12 skill progressions)
 * - Relationships (NPC connections)
 * - History (action log)
 * - Debug (developer info)
 *
 * Features:
 * - Tabbed interface with underline indicator
 * - Modal overlay with blur
 * - Keyboard navigation (Escape to close, arrow keys for tabs)
 * - Dark theme styling
 * - Responsive design
 *
 * "The Titan's detailed view is like opening the hood of a car.
 * Except the car has feelings, makes moral choices, and occasionally
 * sets things on fire."
 *
 * @see specs/HERO_PET_SYSTEM.md Section 10.2
 */

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

import { useTitan } from "@/hooks/useTitan";
import type {
  TitanPet,
  TitanSkill,
  TitanSkillProgression,
  TitanRelationship,
  ActionHistoryEntry,
  AlignmentState,
  ALL_TITAN_SKILLS,
} from "@/games/isocity/types/titan";
import type { Need } from "@/lib/npc/needs";
import type { Mood } from "@/lib/npc/mood";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Tab identifiers for the detail view
 */
export type TabId = "status" | "skills" | "relationships" | "history" | "debug";

/**
 * Props for the TitanDetailView component
 */
export interface TitanDetailViewProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Default tab to show when opening (defaults to 'status') */
  defaultTab?: TabId;
}

/**
 * Action items for the Actions dropdown
 */
interface TitanAction {
  label: string;
  action: string;
  icon: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * All available tabs
 */
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "status", label: "Status", icon: "📊" },
  { id: "skills", label: "Skills", icon: "⚔️" },
  { id: "relationships", label: "Relationships", icon: "👥" },
  { id: "history", label: "History", icon: "📜" },
  { id: "debug", label: "Debug", icon: "🐛" },
];

/**
 * Available Titan actions
 */
const TITAN_ACTIONS: TitanAction[] = [
  { label: "Feed", action: "feed", icon: "🍖" },
  { label: "Pet", action: "pet", icon: "✋" },
  { label: "Send Home", action: "sendHome", icon: "🏠" },
  { label: "Change Name", action: "rename", icon: "✏️" },
  { label: "View Miracles", action: "miracles", icon: "✨" },
];

/**
 * All Titan skills for display
 */
const ALL_SKILLS: TitanSkill[] = [
  "strength",
  "speed",
  "endurance",
  "intelligence",
  "awareness",
  "memory",
  "charisma",
  "intimidation",
  "empathy",
  "miracles",
  "stealth",
  "gathering",
];

/**
 * Skill icons
 */
const SKILL_ICONS: Record<TitanSkill, string> = {
  strength: "💪",
  speed: "🏃",
  endurance: "🛡️",
  intelligence: "🧠",
  awareness: "👁️",
  memory: "📚",
  charisma: "💬",
  intimidation: "😈",
  empathy: "💗",
  miracles: "✨",
  stealth: "🥷",
  gathering: "🧺",
};

/**
 * Need icons
 */
const NEED_ICONS: Record<string, string> = {
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
 * Mood emojis
 */
const MOOD_EMOJIS: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  scared: "😨",
  neutral: "😐",
  excited: "🤩",
  bored: "😑",
  curious: "🤔",
};

/**
 * XP thresholds for each level
 */
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 12000, 20000];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get alignment state name from value
 */
function getAlignmentStateName(alignment: number): AlignmentState {
  if (alignment <= -0.6) return "angelic";
  if (alignment <= -0.2) return "good";
  if (alignment <= 0.2) return "neutral";
  if (alignment <= 0.6) return "evil";
  return "demonic";
}

/**
 * Get alignment color class
 */
function getAlignmentColorClass(alignment: number): string {
  if (alignment <= -0.6) return "text-yellow-300";
  if (alignment <= -0.2) return "text-green-400";
  if (alignment <= 0.2) return "text-gray-400";
  if (alignment <= 0.6) return "text-orange-400";
  return "text-red-500";
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/**
 * Format timestamp to time string
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Get XP needed for next level
 */
function getXPForNextLevel(level: number): number {
  if (level >= 10) return LEVEL_THRESHOLDS[9];
  return LEVEL_THRESHOLDS[level];
}

/**
 * Categorize relationship by trust level
 */
function getRelationshipCategory(trust: number): "friends" | "neutral" | "hostile" {
  if (trust >= 30) return "friends";
  if (trust <= -30) return "hostile";
  return "neutral";
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Progress bar component for needs and skills
 */
const ProgressBar: React.FC<{
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
}> = ({ value, max, color = "bg-blue-500", showLabel = true }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-400 w-16 text-right">
          {Math.round(value)}/{max}
        </span>
      )}
    </div>
  );
};

/**
 * Status Tab - Shows needs, mood, and alignment
 */
export const StatusTab: React.FC<{ titan: TitanPet }> = ({ titan }) => {
  const needs = titan.needs;
  const mood = titan.mood;

  // Get current mood name
  const currentMood = mood?.currentMood ?? "neutral";
  const moodEmoji = MOOD_EMOJIS[currentMood] ?? "😐";

  // Get recent thoughts from mood
  const recentThoughts = mood?.thoughts?.slice(-5) ?? [];

  return (
    <div
      data-testid="titan-detail-tab-content-status"
      className="space-y-6 p-4"
    >
      {/* Needs Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Needs
        </h3>
        <div className="grid gap-2">
          {Object.entries(needs).map(([key, need]) => {
            if (typeof need !== "object" || !need) return null;
            const needObj = need as Need;
            const icon = NEED_ICONS[key] ?? "📦";
            const color =
              needObj.current < 30
                ? "bg-red-500"
                : needObj.current < 60
                  ? "bg-yellow-500"
                  : "bg-green-500";

            return (
              <div
                key={key}
                data-testid={`titan-detail-need-${key}`}
                className="flex items-center gap-3"
              >
                <span className="w-6 text-center">{icon}</span>
                <span className="w-20 text-sm text-gray-300 capitalize">
                  {key}
                </span>
                <ProgressBar
                  value={needObj.current}
                  max={needObj.max}
                  color={color}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mood Section */}
      <div data-testid="titan-detail-mood" className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Mood
        </h3>
        <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
          <span className="text-3xl">{moodEmoji}</span>
          <div>
            <div className="text-lg font-medium text-white capitalize">
              {currentMood}
            </div>
            <div className="text-xs text-gray-400">
              Intensity: {((mood?.moodIntensity ?? 0.5) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Recent Thoughts Section */}
      <div data-testid="titan-detail-thoughts" className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Recent Thoughts
        </h3>
        <div className="space-y-2 bg-gray-800/30 rounded-lg p-3">
          {recentThoughts.length > 0 ? (
            recentThoughts.map((thought, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-gray-500">-</span>
                <span className="text-gray-300 italic">
                  &ldquo;{typeof thought === "string" ? thought : thought.content ?? "..."}&rdquo;
                </span>
                <span className="text-gray-500 text-xs ml-auto">
                  {formatRelativeTime(
                    typeof thought === "object" && thought.timestamp
                      ? thought.timestamp
                      : 0
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm italic">
              No recent thoughts...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Skill Card Component
 */
export const SkillCard: React.FC<{ progression: TitanSkillProgression }> = ({
  progression,
}) => {
  const icon = SKILL_ICONS[progression.skill];
  const xpNeeded = getXPForNextLevel(progression.level);
  const xpProgress = progression.experience;

  return (
    <div
      data-testid={`titan-detail-skill-card-${progression.skill}`}
      className="bg-gray-800/50 rounded-lg p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-white capitalize">
            {progression.skill}
          </span>
        </div>
        <span
          data-testid="skill-level"
          className="text-sm font-bold text-blue-400"
        >
          Lv {progression.level}
        </span>
      </div>
      <div data-testid="skill-xp">
        <ProgressBar
          value={xpProgress}
          max={xpNeeded}
          color="bg-blue-500"
          showLabel={true}
        />
      </div>
      <div className="text-xs text-gray-500">
        Aptitude: {progression.aptitude.toFixed(1)}x
      </div>
    </div>
  );
};

/**
 * Skills Tab - Shows all skill progressions
 */
export const SkillsTab: React.FC<{ titan: TitanPet }> = ({ titan }) => {
  const skills = titan.skills;

  // Calculate overview stats
  const skillLevels = ALL_SKILLS.map((s) => skills[s]?.level ?? 1);
  const avgLevel =
    skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length;
  const highestSkill = ALL_SKILLS.reduce((a, b) =>
    (skills[a]?.level ?? 0) > (skills[b]?.level ?? 0) ? a : b
  );
  const totalXP = ALL_SKILLS.reduce(
    (sum, s) => sum + (skills[s]?.experience ?? 0),
    0
  );

  return (
    <div
      data-testid="titan-detail-tab-content-skills"
      className="space-y-6 p-4"
    >
      {/* Skills Overview */}
      <div
        data-testid="titan-detail-skills-overview"
        className="bg-gray-800/50 rounded-lg p-4 space-y-2"
      >
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Skills Overview
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-white">
              {avgLevel.toFixed(1)}
            </div>
            <div className="text-xs text-gray-400">Average Level</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400 capitalize">
              {highestSkill}
            </div>
            <div className="text-xs text-gray-400">
              Highest (Lv {skills[highestSkill]?.level ?? 1})
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-400">
              {totalXP.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Total XP</div>
          </div>
        </div>
      </div>

      {/* Individual Skills */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Individual Skills
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALL_SKILLS.map((skill) => (
            <SkillCard
              key={skill}
              progression={
                skills[skill] ?? {
                  skill,
                  level: 1,
                  experience: 0,
                  aptitude: 1.0,
                  lastUsed: 0,
                }
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Relationship Card Component
 */
export const RelationshipCard: React.FC<{
  relationship: TitanRelationship;
  npcName: string;
}> = ({ relationship, npcName }) => {
  return (
    <div
      data-testid={`titan-detail-relationship-card-${relationship.npcId}`}
      className="bg-gray-800/50 rounded-lg p-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">👤</span>
        <span className="font-medium text-white">{npcName}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div data-testid="relationship-trust">
          <span className="text-gray-400">Trust:</span>
          <span className="ml-1 text-white">{relationship.trust}</span>
        </div>
        <div data-testid="relationship-respect">
          <span className="text-gray-400">Respect:</span>
          <span className="ml-1 text-white">{relationship.respect}</span>
        </div>
        <div data-testid="relationship-familiarity">
          <span className="text-gray-400">Familiarity:</span>
          <span className="ml-1 text-white">{relationship.familiarity}</span>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Last interaction: {formatRelativeTime(relationship.lastInteraction)}
      </div>
    </div>
  );
};

/**
 * Relationships Tab - Shows NPC relationships
 */
export const RelationshipsTab: React.FC<{ titan: TitanPet }> = ({ titan }) => {
  const relationships = titan.relationships;
  const relationshipList = Object.entries(relationships);

  // Group by category
  const friends = relationshipList.filter(
    ([, r]) => getRelationshipCategory(r.trust) === "friends"
  );
  const neutral = relationshipList.filter(
    ([, r]) => getRelationshipCategory(r.trust) === "neutral"
  );
  const hostile = relationshipList.filter(
    ([, r]) => getRelationshipCategory(r.trust) === "hostile"
  );

  return (
    <div
      data-testid="titan-detail-tab-content-relationships"
      className="space-y-6 p-4"
    >
      {/* Relationship Count */}
      <div
        data-testid="titan-detail-relationship-count"
        className="text-sm text-gray-400"
      >
        Relationships ({relationshipList.length} NPCs known)
      </div>

      {/* Friends */}
      <div data-testid="titan-detail-relationships-friends" className="space-y-3">
        <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide">
          Friends ({friends.length})
        </h3>
        {friends.length > 0 ? (
          <div className="space-y-2">
            {friends.map(([npcId, rel]) => (
              <RelationshipCard
                key={npcId}
                relationship={rel}
                npcName={npcId}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm italic">No friends yet</div>
        )}
      </div>

      {/* Neutral */}
      <div data-testid="titan-detail-relationships-neutral" className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Neutral ({neutral.length})
        </h3>
        {neutral.length > 0 ? (
          <div className="space-y-2">
            {neutral.map(([npcId, rel]) => (
              <RelationshipCard
                key={npcId}
                relationship={rel}
                npcName={npcId}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm italic">No neutral relationships</div>
        )}
      </div>

      {/* Hostile */}
      <div data-testid="titan-detail-relationships-hostile" className="space-y-3">
        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide">
          Hostile ({hostile.length})
        </h3>
        {hostile.length > 0 ? (
          <div className="space-y-2">
            {hostile.map(([npcId, rel]) => (
              <RelationshipCard
                key={npcId}
                relationship={rel}
                npcName={npcId}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm italic">No hostile relationships</div>
        )}
      </div>
    </div>
  );
};

/**
 * Action Log Entry Component
 */
export const ActionLogEntry: React.FC<{ entry: ActionHistoryEntry; index: number }> = ({
  entry,
  index,
}) => {
  const alignmentIcon =
    entry.alignmentImpact < 0 ? "✨" : entry.alignmentImpact > 0 ? "😈" : "•";
  const responseIcon =
    entry.playerResponse === "praised"
      ? "✓"
      : entry.playerResponse === "punished"
        ? "✗"
        : "";

  return (
    <div
      data-testid={`titan-detail-action-entry-${index}`}
      className="flex items-start gap-3 py-2 border-b border-gray-800/50 last:border-0"
    >
      <span
        data-testid="action-timestamp"
        className="text-xs text-gray-500 w-16 flex-shrink-0"
      >
        [{formatTime(entry.timestamp)}]
      </span>
      <div className="flex-1">
        <div className="text-sm text-white">
          {alignmentIcon} {entry.action.replace(/_/g, " ")}
          {responseIcon && (
            <span
              className={`ml-2 ${
                responseIcon === "✓" ? "text-green-400" : "text-red-400"
              }`}
            >
              {responseIcon}
            </span>
          )}
        </div>
        {entry.relatedNpcId && (
          <div className="text-xs text-gray-500">
            → with {entry.relatedNpcId}
          </div>
        )}
        {entry.alignmentImpact !== 0 && (
          <div
            className={`text-xs ${
              entry.alignmentImpact < 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            Alignment {entry.alignmentImpact > 0 ? "+" : ""}
            {entry.alignmentImpact.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * History Tab - Shows action history
 */
export const HistoryTab: React.FC<{ titan: TitanPet }> = ({ titan }) => {
  const history = titan.actionHistory.slice(-50).reverse();

  return (
    <div
      data-testid="titan-detail-tab-content-history"
      className="space-y-4 p-4"
    >
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
        Recent Actions (last 50)
      </h3>
      <div
        data-testid="titan-detail-history-list"
        className="max-h-[400px] overflow-y-auto space-y-1 bg-gray-800/30 rounded-lg p-3"
      >
        {history.length > 0 ? (
          history.map((entry, idx) => (
            <ActionLogEntry key={`${entry.timestamp}-${idx}`} entry={entry} index={idx} />
          ))
        ) : (
          <div className="text-gray-500 text-sm italic py-4 text-center">
            No actions recorded yet
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Debug Tab - Shows developer information
 */
export const DebugTab: React.FC<{ titan: TitanPet; onRefresh?: () => void }> = ({
  titan,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = useCallback(() => {
    // Create a JSON-safe version (convert Maps to arrays)
    const jsonSafe = {
      ...titan,
      bdi: {
        ...titan.bdi,
        beliefs: {
          worldKnowledge: Array.from(titan.bdi.beliefs.worldKnowledge.entries()),
          actionBeliefs: Array.from(titan.bdi.beliefs.actionBeliefs.entries()),
          npcOpinions: Array.from(titan.bdi.beliefs.npcOpinions.entries()),
          playerRelationship: titan.bdi.beliefs.playerRelationship,
        },
      },
    };

    navigator.clipboard.writeText(JSON.stringify(jsonSafe, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [titan]);

  // BDI summary
  const beliefCount = titan.bdi.beliefs.actionBeliefs.size;
  const desireCount = titan.bdi.desires.length;
  const currentIntention = titan.bdi.intentions;

  return (
    <div
      data-testid="titan-detail-tab-content-debug"
      className="space-y-6 p-4"
    >
      {/* Warning */}
      <div className="flex items-center gap-2 text-yellow-400 text-sm">
        <span>⚠️</span>
        <span>Debug Mode</span>
      </div>

      {/* BDI State */}
      <div data-testid="titan-detail-debug-bdi" className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          BDI State
        </h3>
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Beliefs:</span>
            <span className="text-white">{beliefCount} action beliefs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Desires:</span>
            <span className="text-white">
              {desireCount} active (
              {titan.bdi.desires.map((d) => d.type).join(", ") || "none"})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Intention:</span>
            <span className="text-white">
              {currentIntention
                ? `${currentIntention.goal.type} → [${currentIntention.plan
                    .slice(currentIntention.currentStep)
                    .join(", ")}]`
                : "none"}
            </span>
          </div>
        </div>
      </div>

      {/* Raw State */}
      <div data-testid="titan-detail-debug-json" className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Raw State
        </h3>
        <pre className="bg-gray-900 rounded-lg p-3 text-xs text-gray-300 overflow-auto max-h-[200px]">
          {JSON.stringify(
            {
              alignment: titan.alignment,
              species: titan.species,
              age: titan.age,
              gridX: titan.gridX,
              gridY: titan.gridY,
            },
            null,
            2
          )}
        </pre>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          data-testid="titan-detail-debug-copy-json"
          onClick={handleCopyJson}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
        >
          {copied ? "Copied!" : "Copy JSON"}
        </button>
        <button
          data-testid="titan-detail-debug-refresh"
          onClick={onRefresh}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
        >
          Force Refresh
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * TitanDetailView - Main component
 */
export const TitanDetailView: React.FC<TitanDetailViewProps> = ({
  isOpen,
  onClose,
  defaultTab = "status",
}) => {
  const { titan, satisfyNeed } = useTitan();
  // Track previous open state to detect when modal opens
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Reset tab when modal opens - using state comparison pattern
  // This is the React-approved way to respond to prop changes
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      // Modal just opened - reset to default tab
      setActiveTab(defaultTab);
    }
  }

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const currentIndex = TABS.findIndex((t) => t.id === activeTab);
        let newIndex: number;

        if (e.key === "ArrowRight") {
          newIndex = (currentIndex + 1) % TABS.length;
        } else {
          newIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        }

        setActiveTab(TABS[newIndex].id);
        tabRefs.current[newIndex]?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTab, onClose]);

  // Handle action click
  const handleAction = useCallback(
    (action: string) => {
      setActionsMenuOpen(false);
      switch (action) {
        case "feed":
          satisfyNeed("hunger", 30);
          break;
        case "pet":
          satisfyNeed("attention", 20);
          break;
        // Other actions can be implemented as needed
        default:
          console.log("Action:", action);
      }
    },
    [satisfyNeed]
  );

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Force refresh
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (!isOpen || !titan) return null;

  const alignmentState = getAlignmentStateName(titan.alignment);
  const alignmentColorClass = getAlignmentColorClass(titan.alignment);

  return (
    <>
      {/* Overlay */}
      <div
        data-testid="titan-detail-overlay"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleOverlayClick}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        data-testid="titan-detail-modal"
        className="fixed inset-4 md:inset-8 lg:inset-16 z-50 bg-gray-900 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titan-detail-title"
      >
        {/* Header */}
        <header
          data-testid="titan-detail-header"
          className="flex items-center justify-between px-4 py-3 border-b border-gray-800"
        >
          <div className="flex items-center gap-3">
            <button
              data-testid="titan-detail-back-button"
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              aria-label="Go back"
            >
              <span className="text-xl">←</span>
            </button>
            <h1
              id="titan-detail-title"
              className="text-lg font-semibold text-white"
            >
              Titan Details
            </h1>
          </div>
          <button
            data-testid="titan-detail-close-button"
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            aria-label="Close"
          >
            <span className="text-xl">×</span>
          </button>
        </header>

        {/* Titan Info */}
        <div className="flex items-start gap-4 p-4 border-b border-gray-800">
          {/* Sprite */}
          <div
            data-testid="titan-detail-sprite"
            className="w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center text-4xl"
          >
            {titan.species === "doge"
              ? "🐕"
              : titan.species === "bull"
                ? "🐂"
                : titan.species === "bear"
                  ? "🐻"
                  : titan.species === "ape"
                    ? "🦍"
                    : titan.species === "whale"
                      ? "🐋"
                      : "🦅"}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-1">
            <div
              data-testid="titan-detail-name"
              className="text-xl font-bold text-white"
            >
              Name: {titan.name}
            </div>
            <div
              data-testid="titan-detail-species"
              className="text-sm text-gray-400"
            >
              Species: <span className="capitalize">{titan.species}</span>
            </div>
            <div
              data-testid="titan-detail-age"
              className="text-sm text-gray-400"
            >
              Age: {titan.age} day{titan.age !== 1 ? "s" : ""}
            </div>
            <div
              data-testid="titan-detail-alignment"
              className={`text-sm ${alignmentColorClass}`}
            >
              Alignment:{" "}
              <span className="capitalize">{alignmentState}</span> (
              {titan.alignment.toFixed(2)})
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              data-testid={`titan-detail-tab-${tab.id}`}
              data-active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          data-testid="titan-detail-tab"
          className="flex-1 overflow-y-auto"
          role="tabpanel"
        >
          {activeTab === "status" && <StatusTab titan={titan} key={refreshKey} />}
          {activeTab === "skills" && <SkillsTab titan={titan} key={refreshKey} />}
          {activeTab === "relationships" && (
            <RelationshipsTab titan={titan} key={refreshKey} />
          )}
          {activeTab === "history" && <HistoryTab titan={titan} key={refreshKey} />}
          {activeTab === "debug" && (
            <DebugTab titan={titan} onRefresh={handleRefresh} key={refreshKey} />
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
          >
            Close
          </button>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              data-testid="titan-detail-actions-dropdown"
              onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white transition-colors flex items-center gap-2"
            >
              Actions
              <span className="text-xs">▼</span>
            </button>

            {actionsMenuOpen && (
              <div
                data-testid="titan-detail-actions-menu"
                className="absolute bottom-full right-0 mb-1 w-48 bg-gray-800 rounded-lg shadow-lg overflow-hidden"
              >
                {TITAN_ACTIONS.map((action) => (
                  <button
                    key={action.action}
                    data-testid={`titan-action-${action.action}`}
                    onClick={() => handleAction(action.action)}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </footer>
      </div>
    </>
  );
};

// =============================================================================
// TEST HOOKS
// =============================================================================

/**
 * Expose test hooks for Playwright tests
 */
if (typeof window !== "undefined") {
  let isDetailViewOpen = false;
  let currentDefaultTab: TabId = "status";
  let onCloseCallback: (() => void) | null = null;
  let wasOnCloseCalled = false;

  // @ts-expect-error - Expose for testing
  window.__TITAN_DETAIL_HOOKS__ = {
    openDetailView: (defaultTab: TabId = "status") => {
      isDetailViewOpen = true;
      currentDefaultTab = defaultTab;
      // Dispatch custom event to trigger re-render
      window.dispatchEvent(
        new CustomEvent("titan:openDetailView", { detail: { defaultTab } })
      );
    },

    closeDetailView: () => {
      isDetailViewOpen = false;
      if (onCloseCallback) {
        onCloseCallback();
        wasOnCloseCalled = true;
      }
      window.dispatchEvent(new CustomEvent("titan:closeDetailView"));
    },

    isDetailViewOpen: () => isDetailViewOpen,

    getCurrentTab: () => currentDefaultTab,

    setOnCloseCallback: (cb: () => void) => {
      onCloseCallback = cb;
      wasOnCloseCalled = false;
    },

    wasOnCloseCalled: () => wasOnCloseCalled,

    // Proxy to TitanManager functions for testing
    spawnTitan: (options: {
      gridX: number;
      gridY: number;
      name?: string;
      species?: string;
      initialAlignment?: number;
    }) => {
      // @ts-expect-error - access test hooks from useTitan
      const hooks = window.__TEST_HOOKS__;
      if (hooks?.spawnTitan) {
        return hooks.spawnTitan(options);
      }
      return null;
    },

    recordAction: (action: string) => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (hooks?.recordAction) {
        hooks.recordAction(action);
      }
    },

    satisfyNeed: (needType: string, amount: number) => {
      // @ts-expect-error - access test hooks
      const hooks = window.__TEST_HOOKS__;
      if (hooks?.satisfyNeed) {
        hooks.satisfyNeed(needType, amount);
      }
    },

    addRelationship: (
      npcId: string,
      data: { trust: number; respect: number; familiarity: number }
    ) => {
      // This would need to be implemented in TitanManager
      console.log("Add relationship:", npcId, data);
    },
  };
}

export default TitanDetailView;
