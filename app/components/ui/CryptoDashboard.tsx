"use client";

// =============================================================================
// CRYPTO DASHBOARD COMPONENT
// =============================================================================
// Displays real-time crypto economy statistics and active events.
// Shows treasury balance, daily yield, market sentiment, and event ticker.
//
// This component is designed to be displayed as a floating panel or
// integrated into the main game UI.

import { useState, useCallback, useRef, MouseEvent } from "react";
import {
  CryptoEconomyState,
  CryptoEvent,
  CryptoTier,
} from "../game/types";
import {
  getDashboardStats,
} from "@/app/simulation/CryptoEconomy";
import {
  getEventIcon,
  getEventColor,
  formatEventDuration,
  getEventPriority,
} from "@/app/simulation/CryptoEvents";
import { CryptoBuildingDefinition } from "@/app/data/cryptoBuildings";
import { playClickSound, playDoubleClickSound } from "@/app/utils/sounds";

// =============================================================================
// INTERFACES
// =============================================================================

interface CryptoDashboardProps {
  /** Current crypto economy state */
  economyState: CryptoEconomyState;
  /** Array of placed crypto buildings */
  buildings: CryptoBuildingDefinition[];
  /** Currently active events */
  activeEvents: CryptoEvent[];
  /** Event history for display */
  eventHistory?: CryptoEvent[];
  /** Current simulation tick (for event duration calculations) */
  currentTick: number;
  /** Ticks per hour for time calculations */
  ticksPerHour?: number;
  /** Whether the dashboard is visible */
  isVisible: boolean;
  /** Callback when dashboard is closed */
  onClose: () => void;
  /** Callback when an event is clicked */
  onEventClick?: (event: CryptoEvent) => void;
}

// =============================================================================
// TIER COLORS AND LABELS
// =============================================================================

// Color mapping for each crypto tier (for UI display)
const TIER_COLORS: Record<CryptoTier, string> = {
  degen: "#FF00FF",      // Magenta - high risk, meme-tier
  retail: "#00BFFF",     // Deep sky blue - entry level
  whale: "#FFD700",      // Gold - high value
  institution: "#50C878", // Emerald - blue chip
  shark: "#FF6B35",      // Orange-red - aggressive medium tier
  fish: "#87CEEB",       // Sky blue - small players
};

// Display labels for each crypto tier
const TIER_LABELS: Record<CryptoTier, string> = {
  degen: "Degen",
  retail: "Retail",
  whale: "Whale",
  institution: "Institution",
  shark: "Shark",
  fish: "Fish",
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function CryptoDashboard({
  economyState,
  buildings,
  activeEvents,
  eventHistory = [],
  currentTick,
  ticksPerHour = 1,
  isVisible,
  onClose,
  onEventClick,
}: CryptoDashboardProps) {
  // Draggable position state
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return { x: 10, y: 100 };
    return { x: 10, y: 100 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "portfolio">("overview");
  const dragOffset = useRef({ x: 0, y: 0 });

  // Handle dragging
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!isVisible) return null;

  // Get computed stats
  const stats = getDashboardStats(economyState, buildings);

  // Sort events by priority
  const sortedEvents = [...activeEvents].sort(
    (a, b) => getEventPriority(b) - getEventPriority(a)
  );

  return (
    <div
      className="rct-frame"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: 320,
        maxHeight: 450,
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        userSelect: "none",
        overflow: "hidden",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Title bar */}
      <div className="rct-titlebar" onMouseDown={handleMouseDown}>
        <span>📊 Crypto Economy</span>
        <button
          className="rct-close"
          onClick={() => {
            onClose();
            playDoubleClickSound();
          }}
        >
          ×
        </button>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 2,
          padding: "4px 4px 0 4px",
          background: "var(--rct-frame-mid)",
          borderBottom: "2px solid var(--rct-frame-dark)",
        }}
      >
        {(["overview", "events", "portfolio"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              playClickSound();
            }}
            className={`rct-button ${activeTab === tab ? "active" : ""}`}
            style={{
              padding: "4px 10px",
              fontSize: 13,
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div
        className="rct-panel"
        style={{
          padding: 10,
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minHeight: 0,
        }}
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Treasury Section */}
            <div
              style={{
                background: "rgba(0,0,0,0.2)",
                borderRadius: 4,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                💰 Treasury
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#00FF88",
                  textShadow: "0 0 10px rgba(0,255,136,0.5)",
                }}
              >
                {stats.treasury}
              </div>
              <div style={{ fontSize: 14, color: "#88FF88", marginTop: 2 }}>
                {stats.dailyYield}
              </div>
            </div>

            {/* Stats Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {/* TVL */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 4,
                  padding: 8,
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7 }}>📈 TVL</div>
                <div style={{ fontSize: 18, fontWeight: "bold", color: "#FFD700" }}>
                  {stats.tvl}
                </div>
              </div>

              {/* Sentiment */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 4,
                  padding: 8,
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7 }}>🎭 Sentiment</div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    color: stats.sentimentColor,
                  }}
                >
                  {stats.sentiment}
                </div>
                {/* Sentiment bar */}
                <div
                  style={{
                    width: "100%",
                    height: 4,
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: 2,
                    marginTop: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${economyState.marketSentiment}%`,
                      height: "100%",
                      background: stats.sentimentColor,
                      borderRadius: 2,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Buildings */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 4,
                  padding: 8,
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7 }}>🏛️ Buildings</div>
                <div style={{ fontSize: 18, fontWeight: "bold", color: "#00BFFF" }}>
                  {stats.buildingCount}
                </div>
              </div>

              {/* Risk */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 4,
                  padding: 8,
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7 }}>⚠️ Risk</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color:
                      stats.riskLevel < 30
                        ? "#00FF00"
                        : stats.riskLevel < 60
                        ? "#FFD700"
                        : "#FF4444",
                  }}
                >
                  {stats.riskLevel}%
                </div>
              </div>

              {/* Population */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 4,
                  padding: 8,
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7 }}>👥 Pop Boost</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: stats.populationBoost > 0 ? "#00BFFF" : "#888",
                  }}
                >
                  +{stats.populationBoost}
                </div>
              </div>

              {/* Happiness */}
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 4,
                  padding: 8,
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  {stats.happinessEffect >= 0 ? "😊" : "😞"} Happiness
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: stats.happinessEffect > 0 ? "#00FF00" : stats.happinessEffect < 0 ? "#FF4444" : "#888",
                  }}
                >
                  {stats.happinessEffect > 0 ? "+" : ""}
                  {stats.happinessEffect}
                </div>
              </div>
            </div>

            {/* Top Chain */}
            {stats.topChain !== "None" && (
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 4,
                  padding: 8,
                  textAlign: "center",
                }}
              >
                <span style={{ opacity: 0.7 }}>⛓️ Primary Chain: </span>
                <span style={{ fontWeight: "bold", color: "#9B59B6" }}>
                  {stats.topChain}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Active Events */}
            <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4 }}>
              🔔 Active Events ({activeEvents.length})
            </div>
            
            {sortedEvents.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 20,
                  opacity: 0.6,
                  fontSize: 13,
                }}
              >
                No active events. Build more crypto buildings!
              </div>
            ) : (
              sortedEvents.map((event) => {
                const remainingTicks = event.startTick + event.duration - currentTick;
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    style={{
                      background: `linear-gradient(135deg, rgba(0,0,0,0.3), ${getEventColor(event.isPositive)}22)`,
                      borderRadius: 4,
                      padding: 10,
                      borderLeft: `3px solid ${getEventColor(event.isPositive)}`,
                      cursor: onEventClick ? "pointer" : "default",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: "bold" }}>
                        {event.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          opacity: 0.7,
                          background: "rgba(0,0,0,0.3)",
                          padding: "2px 6px",
                          borderRadius: 3,
                        }}
                      >
                        {formatEventDuration(remainingTicks, ticksPerHour)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                      {event.description}
                    </div>
                    {event.affectedBuildings.length > 0 && event.affectedBuildings.length < 5 && (
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                        📍 {event.affectedBuildings.length} building(s) affected
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Event History */}
            {eventHistory.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: "bold",
                    marginTop: 12,
                    marginBottom: 4,
                    opacity: 0.7,
                  }}
                >
                  📜 Recent History
                </div>
                {eventHistory.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: 4,
                      padding: 8,
                      opacity: 0.6,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ marginRight: 6 }}>{getEventIcon(event.type)}</span>
                    {event.name}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === "portfolio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Tier Breakdown */}
            <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 4 }}>
              📊 Buildings by Tier
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(Object.entries(economyState.buildingsByTier) as [CryptoTier, number][])
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([tier, count]) => (
                  <div
                    key={tier}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: TIER_COLORS[tier],
                        boxShadow: `0 0 6px ${TIER_COLORS[tier]}`,
                      }}
                    />
                    <span style={{ flex: 1, fontSize: 13 }}>{TIER_LABELS[tier]}</span>
                    <span style={{ fontWeight: "bold", fontSize: 14 }}>{count}</span>
                    {/* Bar */}
                    <div
                      style={{
                        width: 80,
                        height: 6,
                        background: "rgba(0,0,0,0.3)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(count / Math.max(1, economyState.cryptoBuildingCount)) * 100}%`,
                          height: "100%",
                          background: TIER_COLORS[tier],
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            {/* Chain Breakdown */}
            {Object.keys(economyState.buildingsByChain).length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: "bold",
                    marginTop: 8,
                    marginBottom: 4,
                  }}
                >
                  ⛓️ Buildings by Chain
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(economyState.buildingsByChain)
                    .sort(([, a], [, b]) => b - a)
                    .map(([chain, count]) => (
                      <div
                        key={chain}
                        style={{
                          background: "rgba(155,89,182,0.2)",
                          border: "1px solid rgba(155,89,182,0.4)",
                          borderRadius: 4,
                          padding: "4px 8px",
                          fontSize: 12,
                        }}
                      >
                        <span style={{ textTransform: "capitalize" }}>{chain}</span>
                        <span style={{ marginLeft: 6, fontWeight: "bold" }}>{count}</span>
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* Treasury History Mini Chart */}
            {economyState.treasuryHistory.length > 1 && (
              <>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: "bold",
                    marginTop: 8,
                    marginBottom: 4,
                  }}
                >
                  📈 Treasury History
                </div>
                <div
                  style={{
                    height: 60,
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: 4,
                    padding: 8,
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 1,
                  }}
                >
                  {(() => {
                    const history = economyState.treasuryHistory.slice(-30);
                    const max = Math.max(...history);
                    const min = Math.min(...history);
                    const range = max - min || 1;
                    
                    return history.map((value, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          background: i === history.length - 1 ? "#00FF88" : "#00FF8866",
                          borderRadius: 1,
                          height: `${((value - min) / range) * 100}%`,
                          minHeight: 2,
                        }}
                      />
                    ));
                  })()}
                </div>
              </>
            )}

            {/* Empty State */}
            {economyState.cryptoBuildingCount === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: 30,
                  opacity: 0.6,
                  fontSize: 13,
                }}
              >
                🏗️ No crypto buildings yet!
                <br />
                <span style={{ fontSize: 12 }}>
                  Build DeFi protocols, exchanges, and more.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

