"use client";

import { useState, useRef, useCallback, useEffect, MouseEvent } from "react";
import { ToolType, CryptoTier } from "../game/types";
import {
  CATEGORY_NAMES,
  BuildingCategory,
  getBuildingsByCategory,
  getCategories,
  getBuilding,
  BuildingDefinition,
} from "@/app/data/buildings";
import {
  ALL_CRYPTO_BUILDINGS,
  CryptoBuildingDefinition,
  getCryptoBuildingsByCategory,
} from "@/app/data/cryptoBuildings";
import { playDoubleClickSound, playClickSound } from "@/app/utils/sounds";

interface ToolWindowProps {
  selectedTool: ToolType;
  selectedBuildingId: string | null;
  onToolSelect: (tool: ToolType) => void;
  onBuildingSelect: (buildingId: string) => void;
  onSpawnCharacter: () => void;
  onSpawnCar: () => void;
  onRotate?: () => void;
  isVisible: boolean;
  onClose: () => void;
}

// Get the preview sprite for a building (prefer south, fall back to first available)
function getBuildingPreviewSprite(building: BuildingDefinition): string {
  return building.sprites.south || Object.values(building.sprites)[0] || "";
}

// Calculate zoom level based on building footprint size
// Smaller buildings need more zoom, larger buildings need less
function getBuildingPreviewZoom(building: BuildingDefinition): number {
  const footprintSize = Math.max(
    building.footprint.width,
    building.footprint.height
  );
  // Scale: 1x1 = 950%, 2x2 = 500%, 3x3 = 380%, 4x4 = 280%, 6x6 = 200%, 8x8 = 150%
  if (footprintSize === 1) return 950;
  if (footprintSize === 2) return 500;
  const zoom = Math.max(150, 450 - footprintSize * 40);
  return zoom;
}

// Tab icons for each category (including crypto categories)
// Currently unused but kept for future category tab implementation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _CATEGORY_ICONS: Record<BuildingCategory, string> = {
  procedural: "✨",
  residential: "🏠",
  commercial: "🏪",
  props: "🌳",
  christmas: "🎄",
  civic: "🏛️",
  landmark: "🏰",
  // Crypto categories
  defi: "🏦",
  exchange: "📈",
  chain: "⛓️",
  ct: "🐦",
  meme: "🐸",
  plasma: "💎",
};

// Tier badge colors for crypto buildings
const TIER_COLORS: Record<CryptoTier, string> = {
  degen: "#FF00FF",     // Neon magenta
  retail: "#00BFFF",    // Deep sky blue
  whale: "#FFD700",     // Gold
  institution: "#50C878", // Emerald
  shark: "#6C5CE7",     // Purple
  fish: "#74B9FF",      // Light blue
};

// Tier badge labels
const TIER_LABELS: Record<CryptoTier, string> = {
  degen: "DEGEN",
  retail: "RETAIL",
  whale: "WHALE",
  institution: "INST",
  shark: "SHARK",
  fish: "FISH",
};

/**
 * Check if a building is a crypto building
 * Currently unused but kept for future crypto-specific building UI
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _isCryptoBuilding(buildingId: string): boolean {
  return buildingId in ALL_CRYPTO_BUILDINGS;
}

/**
 * Get crypto building data
 */
function getCryptoBuilding(buildingId: string): CryptoBuildingDefinition | null {
  return ALL_CRYPTO_BUILDINGS[buildingId] || null;
}

/**
 * Format crypto building tooltip content
 */
function getCryptoBuildingTooltip(building: CryptoBuildingDefinition): string {
  const effects = building.crypto.effects;
  const parts: string[] = [building.name];
  
  // Add tier
  parts.push(`[${TIER_LABELS[building.crypto.tier]}]`);
  
  // Add key effects
  if (effects.yieldRate) parts.push(`Yield: +${effects.yieldRate}/day`);
  if (effects.tradingFees) parts.push(`Fees: +${effects.tradingFees}/day`);
  if (effects.stakingBonus && effects.stakingBonus > 1) {
    parts.push(`Staking: +${Math.round((effects.stakingBonus - 1) * 100)}%`);
  }
  if (effects.populationBoost) parts.push(`Pop: +${effects.populationBoost}`);
  if (effects.happinessEffect) {
    const sign = effects.happinessEffect > 0 ? '+' : '';
    parts.push(`Happy: ${sign}${effects.happinessEffect}`);
  }
  if (effects.zoneRadius) parts.push(`Zone: ${effects.zoneRadius} tiles`);
  
  return parts.join(' | ');
}

export default function ToolWindow({
  selectedTool,
  selectedBuildingId,
  onToolSelect,
  onBuildingSelect,
  onSpawnCharacter,
  onSpawnCar,
  onRotate,
  isVisible,
  onClose,
}: ToolWindowProps) {
  // Calculate initial position (lazy to avoid SSR issues)
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") {
      return { x: 10, y: 50 };
    }
    const isMobile = window.innerWidth < 768 || "ontouchstart" in window;
    if (isMobile) {
      const menuWidth = Math.min(520, window.innerWidth - 20);
      return {
        x: Math.max(10, (window.innerWidth - menuWidth) / 2),
        y: 60,
      };
    } else {
      return {
        x: Math.max(10, window.innerWidth - 530),
        y: 50,
      };
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"tools" | BuildingCategory>(
    "tools"
  );
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1000,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  const dragOffset = useRef({ x: 0, y: 0 });

  // Track window resize for responsive sizing
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Get buildings grouped by category
  const categories = getCategories();

  // Get current tab title
  const getTabTitle = () => {
    if (activeTab === "tools") return "Tools";
    return CATEGORY_NAMES[activeTab];
  };

  // Calculate responsive width: use 520px or screen width/height (whichever is smaller)
  const baseWidth = 520;
  const responsiveWidth = Math.min(
    baseWidth,
    windowSize.width - 20,
    windowSize.height
  );

  return (
    <div
      className="rct-frame"
      style={{
        position: "absolute",
        left: Math.min(position.x, windowSize.width - responsiveWidth - 10),
        top: position.y,
        width: responsiveWidth,
        maxHeight: Math.min(400, windowSize.height - 100),
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        userSelect: "none",
        overflow: "hidden",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Title bar */}
      <div className="rct-titlebar" onMouseDown={handleMouseDown}>
        <span>{getTabTitle()}</span>
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

      {/* Category Tabs */}
      <div
        style={{
          display: "flex",
          gap: 2,
          padding: "4px 4px 0 4px",
          background: "var(--rct-frame-mid)",
          borderBottom: "2px solid var(--rct-frame-dark)",
        }}
      >
        {/* Tools tab */}
        <button
          onClick={() => {
            if (activeTab !== "tools") {
              setActiveTab("tools");
              playDoubleClickSound();
            }
          }}
          className={`rct-button ${activeTab === "tools" ? "active" : ""}`}
          style={{
            padding: "4px 8px",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
          title="Tools"
        >
          🔧
        </button>

        {/* Category tabs */}
        {categories.map((category) => {
          const buildings = getBuildingsByCategory(category);
          if (buildings.length === 0) return null;

          // Use first building's sprite as tab icon
          const firstBuilding = buildings[0];
          const previewSprite = getBuildingPreviewSprite(firstBuilding);
          const previewZoom = getBuildingPreviewZoom(firstBuilding);

          return (
            <button
              key={category}
              onClick={() => {
                if (activeTab !== category) {
                  setActiveTab(category);
                  playDoubleClickSound();
                }
              }}
              className={`rct-button ${activeTab === category ? "active" : ""}`}
              style={{
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 36,
                minHeight: 32,
              }}
              title={CATEGORY_NAMES[category]}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
              >
                {/* Render at half size then scale up 2x for chunky pixel effect */}
                <img
                  src={previewSprite}
                  alt={CATEGORY_NAMES[category]}
                  style={{
                    width: `${previewZoom / 2}%`,
                    height: `${previewZoom / 2}%`,
                    objectFit: "cover",
                    objectPosition: "center bottom",
                    imageRendering: "pixelated",
                    transform: "scale(2)",
                    transformOrigin: "center bottom",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Content panel */}
      <div
        className="rct-panel"
        style={{
          padding: 8,
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          minHeight: 0,
        }}
      >
        {/* Tools Tab Content */}
        {activeTab === "tools" && (
          <div>
            {/* Roads/Tiles Section */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <button
                onClick={() => {
                  onToolSelect(ToolType.RoadNetwork);
                  playClickSound();
                }}
                className={`rct-button ${
                  selectedTool === ToolType.RoadNetwork ? "active" : ""
                }`}
                title="Road"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 8,
                  minHeight: 60,
                }}
              >
                <img
                  src="/Tiles/1x1asphalt.png"
                  alt="Road"
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "contain",
                    imageRendering: "pixelated",
                  }}
                />
                <span style={{ fontSize: 13, marginTop: 4 }}>Road</span>
              </button>
              <button
                onClick={() => {
                  onToolSelect(ToolType.Asphalt);
                  playClickSound();
                }}
                className={`rct-button ${
                  selectedTool === ToolType.Asphalt ? "active" : ""
                }`}
                title="Asphalt"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 8,
                  minHeight: 60,
                }}
              >
                <img
                  src="/Tiles/1x1asphalt_tile.png"
                  alt="Asphalt"
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "contain",
                    imageRendering: "pixelated",
                  }}
                />
                <span style={{ fontSize: 13, marginTop: 4 }}>Asphalt</span>
              </button>
              <button
                onClick={() => {
                  onToolSelect(ToolType.Tile);
                  playClickSound();
                }}
                className={`rct-button ${
                  selectedTool === ToolType.Tile ? "active" : ""
                }`}
                title="Tile"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 8,
                  minHeight: 60,
                }}
              >
                <img
                  src="/Tiles/1x1square_tile.png"
                  alt="Tile"
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "contain",
                    imageRendering: "pixelated",
                  }}
                />
                <span style={{ fontSize: 13, marginTop: 4 }}>Tile</span>
              </button>
              <button
                onClick={() => {
                  onToolSelect(ToolType.Snow);
                  playClickSound();
                }}
                className={`rct-button ${
                  selectedTool === ToolType.Snow ? "active" : ""
                }`}
                title="Snow"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 8,
                  minHeight: 60,
                }}
              >
                <img
                  src="/Tiles/1x1snow_tile_1.png"
                  alt="Snow"
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "contain",
                    imageRendering: "pixelated",
                  }}
                />
                <span style={{ fontSize: 13, marginTop: 4 }}>Snow</span>
              </button>
            </div>

            {/* Divider */}
            <div
              style={{
                height: 2,
                background: "var(--rct-panel-dark)",
                margin: "8px 0",
              }}
            />

            {/* Spawn buttons */}
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => {
                  onSpawnCharacter();
                  playClickSound();
                }}
                className="rct-button"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontSize: 14,
                }}
              >
                <span style={{ fontSize: 14 }}>🍌</span>
                <span>Spawn Citizen</span>
              </button>

              <button
                onClick={() => {
                  onSpawnCar();
                  playClickSound();
                }}
                className="rct-button"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontSize: 14,
                }}
              >
                <span style={{ fontSize: 14 }}>🚗</span>
                <span>Spawn Car</span>
              </button>
            </div>
          </div>
        )}

        {/* Building Category Content */}
        {activeTab !== "tools" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              width: "100%",
            }}
          >
            {/* Get buildings from both standard and crypto registries */}
            {(() => {
              // Try standard buildings first
              const standardBuildings = getBuildingsByCategory(activeTab);
              // Also check crypto buildings
              const cryptoBuildings = getCryptoBuildingsByCategory(activeTab);
              // Combine (crypto buildings are a superset with extra data)
              const allBuildings = standardBuildings.length > 0 
                ? standardBuildings 
                : cryptoBuildings;
              
              return allBuildings.map((building) => {
                const previewSprite = getBuildingPreviewSprite(building);
                const previewZoom = getBuildingPreviewZoom(building);
                const isSelected =
                  selectedTool === ToolType.Building &&
                  selectedBuildingId === building.id;
                
                // Check if this is a crypto building
                const cryptoData = getCryptoBuilding(building.id);
                const hasCryptoData = !!cryptoData;

                return (
                  <button
                    key={building.id}
                    onClick={() => {
                      onToolSelect(ToolType.Building);
                      onBuildingSelect(building.id);
                      playClickSound();
                    }}
                    onMouseEnter={() => {
                      setHoveredBuilding(building.name);
                      setHoveredBuildingId(building.id);
                    }}
                    onMouseLeave={() => {
                      setHoveredBuilding(null);
                      setHoveredBuildingId(null);
                    }}
                    className={`rct-button ${isSelected ? "active" : ""}`}
                    title={hasCryptoData ? getCryptoBuildingTooltip(cryptoData) : building.name}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 4,
                      minHeight: 60,
                      overflow: "hidden",
                      background: isSelected
                        ? "var(--rct-button-active)"
                        : undefined,
                      position: "relative",
                    }}
                  >
                    {/* Tier badge for crypto buildings */}
                    {hasCryptoData && (
                      <div
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: TIER_COLORS[cryptoData.crypto.tier],
                          border: "1px solid rgba(0,0,0,0.3)",
                          boxShadow: `0 0 4px ${TIER_COLORS[cryptoData.crypto.tier]}`,
                        }}
                        title={TIER_LABELS[cryptoData.crypto.tier]}
                      />
                    )}
                    
                    <div
                      style={{
                        width: 56,
                        height: 50,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {/* Show icon for procedural/crypto buildings without sprites */}
                      {!previewSprite || building.isProcedural ? (
                        <span style={{ fontSize: 32 }}>{building.icon}</span>
                      ) : (
                        /* Render at half size then scale up 2x for chunky pixel effect */
                        <img
                          src={previewSprite}
                          alt={building.name}
                          style={{
                            width: `${previewZoom / 2}%`,
                            height: `${previewZoom / 2}%`,
                            objectFit: "cover",
                            objectPosition: "center bottom",
                            imageRendering: "pixelated",
                            transform: "scale(2)",
                            transformOrigin: "center bottom",
                          }}
                        />
                      )}
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Footer - shows selected/hovered building name and crypto stats */}
      {activeTab !== "tools" && (
        <div
          style={{
            padding: "6px 10px",
            background: "var(--rct-panel-mid)",
            borderTop: "2px solid var(--rct-panel-dark)",
            fontSize: 14,
            minHeight: 28,
            color: "var(--rct-text-light)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            textShadow: "1px 1px 0 var(--rct-text-shadow)",
          }}
        >
          {/* Building name row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 16 }}>
              {hoveredBuilding ||
                (selectedBuildingId && selectedTool === ToolType.Building
                  ? getBuilding(selectedBuildingId)?.name || getCryptoBuilding(selectedBuildingId)?.name
                  : "") ||
                ""}
            </span>
            {selectedTool === ToolType.Building && selectedBuildingId && (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ opacity: 0.7, fontSize: 12 }}>
                  press &quot;R&quot; to rotate
                </span>
                <button
                  className="rct-button"
                  onClick={() => {
                    onRotate?.();
                    playClickSound();
                  }}
                  style={{
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Rotate building"
                >
                  <img
                    src="/UI/r20x20rotate.png"
                    alt="Rotate"
                    style={{
                      width: 28,
                      height: 28,
                      imageRendering: "pixelated",
                    }}
                  />
                </button>
              </span>
            )}
          </div>
          
          {/* Crypto stats row - only show for crypto buildings */}
          {(() => {
            const buildingIdToCheck = hoveredBuildingId || 
              (selectedTool === ToolType.Building ? selectedBuildingId : null);
            const cryptoData = buildingIdToCheck ? getCryptoBuilding(buildingIdToCheck) : null;
            
            if (!cryptoData) return null;
            
            const effects = cryptoData.crypto.effects;
            return (
              <div style={{ 
                display: "flex", 
                gap: 12, 
                fontSize: 12,
                opacity: 0.9,
                flexWrap: "wrap",
              }}>
                {/* Tier badge */}
                <span style={{ 
                  color: TIER_COLORS[cryptoData.crypto.tier],
                  fontWeight: "bold",
                }}>
                  {TIER_LABELS[cryptoData.crypto.tier]}
                </span>
                
                {/* Yield */}
                {(effects.yieldRate || effects.tradingFees) && (
                  <span style={{ color: "#00FF88" }}>
                    💰 +{(effects.yieldRate || 0) + (effects.tradingFees || 0)}/day
                  </span>
                )}
                
                {/* Staking bonus */}
                {effects.stakingBonus && effects.stakingBonus > 1 && (
                  <span style={{ color: "#FFD700" }}>
                    📊 +{Math.round((effects.stakingBonus - 1) * 100)}%
                  </span>
                )}
                
                {/* Population */}
                {effects.populationBoost && effects.populationBoost !== 0 && (
                  <span style={{ color: effects.populationBoost > 0 ? "#00BFFF" : "#FF6B6B" }}>
                    👥 {effects.populationBoost > 0 ? '+' : ''}{effects.populationBoost}
                  </span>
                )}
                
                {/* Happiness */}
                {effects.happinessEffect && effects.happinessEffect !== 0 && (
                  <span style={{ color: effects.happinessEffect > 0 ? "#00FF00" : "#FF4444" }}>
                    {effects.happinessEffect > 0 ? '😊' : '😞'} {effects.happinessEffect > 0 ? '+' : ''}{effects.happinessEffect}
                  </span>
                )}
                
                {/* Zone radius */}
                {effects.zoneRadius && effects.zoneRadius > 0 && (
                  <span style={{ color: "#9B59B6" }}>
                    ◎ {effects.zoneRadius} tiles
                  </span>
                )}
                
                {/* Chain */}
                {cryptoData.crypto.chain && (
                  <span style={{ color: "#888", marginLeft: "auto" }}>
                    ⛓️ {cryptoData.crypto.chain}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
