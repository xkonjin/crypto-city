"use client";

import { useState, useRef, useCallback, MouseEvent, useMemo } from "react";
import { playClickSound, playDoubleClickSound } from "@/app/utils/sounds";
import Modal from "./Modal";
import { GridCell, VisualSettings } from "@/app/components/game/types";

/**
 * Structure of saved game data stored in localStorage
 */
interface GameSaveData {
  grid: GridCell[][];         // The game grid with all tiles/buildings
  characterCount: number;     // Number of NPCs to spawn on load
  carCount: number;           // Number of cars to spawn on load
  zoom?: number;              // Camera zoom level
  visualSettings?: VisualSettings;  // Visual settings (brightness, contrast, etc.)
  timestamp: number;          // When the save was created
}

interface LoadWindowProps {
  isVisible: boolean;
  onClose: () => void;
  onLoad: (saveData: GameSaveData) => void;
}

export default function LoadWindow({
  isVisible,
  onClose,
  onLoad,
}: LoadWindowProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [deleteModalState, setDeleteModalState] = useState<{
    isVisible: boolean;
    saveName: string;
  }>({
    isVisible: false,
    saveName: "",
  });
  const saveNameToDeleteRef = useRef<string>("");
  // Track counter to force re-computation when saves change
  const [saveVersion, setSaveVersion] = useState(0);

  // Load saves from localStorage using useMemo (no setState in effect)
  // Re-computes when isVisible changes or when saveVersion changes (after delete)
  const computedSaves = useMemo(() => {
    if (!isVisible) return [];
    
    const allSaves: Array<{ name: string; data: GameSaveData }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pogicity_save_')) {
        try {
          const saveName = key.replace('pogicity_save_', '');
          const saveData = JSON.parse(localStorage.getItem(key) || '{}');
          allSaves.push({ name: saveName, data: saveData });
        } catch {
          // Failed to parse save - skip it
        }
      }
    }
    // Sort by timestamp (newest first)
    allSaves.sort((a, b) => (b.data.timestamp || 0) - (a.data.timestamp || 0));
    return allSaves;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, saveVersion]);

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

  const handleLoad = (saveData: GameSaveData) => {
    onLoad(saveData);
    onClose();
    playDoubleClickSound();
  };

  const handleDelete = (saveName: string) => {
    playClickSound();
    saveNameToDeleteRef.current = saveName;
    setDeleteModalState({
      isVisible: true,
      saveName,
    });
  };

  const confirmDelete = () => {
    const saveNameToDelete = saveNameToDeleteRef.current;
    if (!saveNameToDelete) return;
    
    localStorage.removeItem(`pogicity_save_${saveNameToDelete}`);
    // Trigger re-computation of saves by incrementing version
    setSaveVersion(v => v + 1);
    setDeleteModalState({ isVisible: false, saveName: "" });
    saveNameToDeleteRef.current = "";
    playClickSound();
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isVisible) return null;

  return (
    <div
      className="rct-frame"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: 400,
        maxHeight: 500,
        display: "flex",
        flexDirection: "column",
        zIndex: 2000,
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
        <span>Load Game</span>
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
        {computedSaves.length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "var(--rct-text-light)",
              fontSize: 14,
            }}
          >
            No saved games found
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {computedSaves.map((save) => (
              <div
                key={save.name}
                style={{
                  background: "var(--rct-panel-dark)",
                  border: "1px solid",
                  borderColor: "var(--rct-panel-light) var(--rct-panel-dark) var(--rct-panel-dark) var(--rct-panel-light)",
                  padding: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: "var(--rct-text-light)",
                      fontSize: 14,
                      fontWeight: "bold",
                      marginBottom: 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {save.name}
                  </div>
                  <div
                    style={{
                      color: "var(--rct-text-light)",
                      fontSize: 11,
                      opacity: 0.8,
                    }}
                  >
                    {formatDate(save.data.timestamp)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className="rct-button"
                    onClick={() => handleLoad(save.data)}
                    style={{
                      padding: "4px 8px",
                      fontSize: 12,
                    }}
                  >
                    Load
                  </button>
                  <button
                    className="rct-button"
                    onClick={() => handleDelete(save.name)}
                    style={{
                      padding: "4px 8px",
                      fontSize: 12,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isVisible={deleteModalState.isVisible}
        title="Delete Save"
        message={`Delete save "${deleteModalState.saveName}"?`}
        onClose={() => {
          setDeleteModalState({ isVisible: false, saveName: "" });
          saveNameToDeleteRef.current = "";
        }}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        showCancel={true}
      />
    </div>
  );
}

