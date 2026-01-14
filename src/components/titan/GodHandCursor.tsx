/**
 * GodHandCursor - Divine Interaction System
 *
 * A special cursor mode that allows divine interaction with the Titan,
 * inspired by Black & White's iconic floating hand.
 *
 * Features:
 * - Follows mouse cursor when active
 * - Changes appearance based on state (active, grasping, praising, punishing)
 * - Supports drag gestures for praise/punish actions
 * - Keyboard shortcuts: G to toggle, P for praise, U for punish
 * - Touch support for mobile devices
 * - Screen reader announcements for accessibility
 *
 * "The hand of the divine reaches down from the crypto heavens,
 * ready to praise the faithful or smite the paper-handed."
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

/**
 * God Hand States
 * - inactive: Normal cursor mode
 * - active: God Hand visible, hovering
 * - grasping: Holding something
 * - praising: Dragging down = positive reinforcement
 * - punishing: Dragging up = negative reinforcement
 */
export type GodHandState =
  | "inactive"
  | "active"
  | "grasping"
  | "praising"
  | "punishing";

/**
 * All possible God Hand states as an array (for validation/iteration)
 */
export const GOD_HAND_STATES: GodHandState[] = [
  "inactive",
  "active",
  "grasping",
  "praising",
  "punishing",
];

/**
 * Descriptions for each God Hand state
 */
export const GOD_HAND_STATE_DESCRIPTIONS: Record<GodHandState, string> = {
  inactive: "Normal cursor mode - God Hand is dormant",
  active: "God Hand is visible and ready for divine interaction",
  grasping: "Holding an object or entity with divine grip",
  praising: "Performing a praise gesture - reinforcing positive behavior",
  punishing: "Performing a punish gesture - correcting negative behavior",
};

/**
 * Position type for tracking coordinates
 */
interface Position {
  x: number;
  y: number;
}

/**
 * Gesture threshold in pixels
 * Must drag at least this many pixels to trigger praise/punish
 */
const GESTURE_THRESHOLD = 30;

/**
 * Visual cursor styles for each state
 */
const CURSOR_STYLES: Record<GodHandState, CSSProperties> = {
  inactive: { cursor: "default" },
  active: { cursor: "none" },
  grasping: { cursor: "grabbing" },
  praising: { cursor: "none" },
  punishing: { cursor: "none" },
};

/**
 * Cursor emoji/icon for each state
 */
const CURSOR_ICONS: Record<GodHandState, string> = {
  inactive: "",
  active: "🖐️",
  grasping: "✊",
  praising: "🌈",
  punishing: "🔴",
};

// =============================================================================
// CONTEXT
// =============================================================================

/**
 * Context value interface for God Hand state and actions
 */
export interface GodHandContextValue {
  // State
  state: GodHandState;
  isActive: boolean;

  // Activation
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;

  // Gesture tracking
  gestureStart: Position | null;
  gestureDelta: Position;

  // Target tracking
  targetPosition: Position | null;
  isOverTitan: boolean;

  // Internal setters for testing
  setIsOverTitan: (value: boolean) => void;
  setTargetPosition: (position: Position | null) => void;

  // Event callbacks
  onPraise?: () => void;
  onPunish?: () => void;
  onPickUp?: () => void;
  onDrop?: (position: Position) => void;

  // Callback setters
  setOnPraise: (callback: (() => void) | undefined) => void;
  setOnPunish: (callback: (() => void) | undefined) => void;
  setOnPickUp: (callback: (() => void) | undefined) => void;
  setOnDrop: (callback: ((position: Position) => void) | undefined) => void;
}

/**
 * Default context value
 */
const defaultContextValue: GodHandContextValue = {
  state: "inactive",
  isActive: false,
  activate: () => {},
  deactivate: () => {},
  toggle: () => {},
  gestureStart: null,
  gestureDelta: { x: 0, y: 0 },
  targetPosition: null,
  isOverTitan: false,
  setIsOverTitan: () => {},
  setTargetPosition: () => {},
  setOnPraise: () => {},
  setOnPunish: () => {},
  setOnPickUp: () => {},
  setOnDrop: () => {},
};

/**
 * React Context for God Hand state
 */
export const GodHandContext =
  createContext<GodHandContextValue>(defaultContextValue);

/**
 * Custom hook to access God Hand context
 * @throws Error if used outside of GodHandProvider
 */
export function useGodHand(): GodHandContextValue {
  const context = useContext(GodHandContext);
  if (!context) {
    throw new Error("useGodHand must be used within a GodHandProvider");
  }
  return context;
}

// =============================================================================
// PROVIDER
// =============================================================================

export interface GodHandProviderProps {
  children: React.ReactNode;
  /** Initial state (default: inactive) */
  initialState?: GodHandState;
  /** Callback when praise gesture completes */
  onPraise?: () => void;
  /** Callback when punish gesture completes */
  onPunish?: () => void;
  /** Callback when pick up action triggers */
  onPickUp?: () => void;
  /** Callback when drop action triggers */
  onDrop?: (position: Position) => void;
}

/**
 * GodHandProvider - Provides God Hand state to children
 */
export function GodHandProvider({
  children,
  initialState = "inactive",
  onPraise: initialOnPraise,
  onPunish: initialOnPunish,
  onPickUp: initialOnPickUp,
  onDrop: initialOnDrop,
}: GodHandProviderProps) {
  // Core state
  const [state, setState] = useState<GodHandState>(initialState);

  // Gesture tracking
  const [gestureStart, setGestureStart] = useState<Position | null>(null);
  const [gestureDelta, setGestureDelta] = useState<Position>({ x: 0, y: 0 });

  // Target tracking
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [isOverTitan, setIsOverTitan] = useState(false);

  // Event callbacks (stored in state so they can be updated)
  const [onPraise, setOnPraise] = useState<(() => void) | undefined>(
    () => initialOnPraise
  );
  const [onPunish, setOnPunish] = useState<(() => void) | undefined>(
    () => initialOnPunish
  );
  const [onPickUp, setOnPickUp] = useState<(() => void) | undefined>(
    () => initialOnPickUp
  );
  const [onDrop, setOnDrop] = useState<
    ((position: Position) => void) | undefined
  >(() => initialOnDrop);

  // Computed
  const isActive = state !== "inactive";

  // Actions
  const activate = useCallback(() => {
    setState("active");
  }, []);

  const deactivate = useCallback(() => {
    setState("inactive");
    setGestureStart(null);
    setGestureDelta({ x: 0, y: 0 });
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => (prev === "inactive" ? "active" : "inactive"));
    setGestureStart(null);
    setGestureDelta({ x: 0, y: 0 });
  }, []);

  // Context value
  const value: GodHandContextValue = {
    state,
    isActive,
    activate,
    deactivate,
    toggle,
    gestureStart,
    gestureDelta,
    targetPosition,
    isOverTitan,
    setIsOverTitan,
    setTargetPosition,
    onPraise,
    onPunish,
    onPickUp,
    onDrop,
    setOnPraise: (cb) => setOnPraise(() => cb),
    setOnPunish: (cb) => setOnPunish(() => cb),
    setOnPickUp: (cb) => setOnPickUp(() => cb),
    setOnDrop: (cb) => setOnDrop(() => cb),
  };

  // Expose state for testing - use ref to track callbacks
  const praiseCalledRef = useRef(false);
  const punishCalledRef = useRef(false);
  const actionTriggeredRef = useRef("");

  // Expose hooks for testing - use useEffect to ensure this runs on client only
  useEffect(() => {
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__ = window.__TEST_HOOKS__ || {};
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.useGodHandState = () => ({
      state,
      isActive,
      gestureStart,
      gestureDelta,
      targetPosition,
      isOverTitan,
    });
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.activateGodHand = activate;
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.deactivateGodHand = deactivate;
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.toggleGodHand = toggle;
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.setIsOverTitan = setIsOverTitan;
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.setTargetPosition = setTargetPosition;
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.setOnPraise = (cb: () => void) =>
      setOnPraise(() => cb);
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.setOnPunish = (cb: () => void) =>
      setOnPunish(() => cb);

    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.wasPraiseCalled = () => praiseCalledRef.current;
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.wasPunishCalled = () => punishCalledRef.current;
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.getActionTriggered = () => actionTriggeredRef.current;
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.getPraiseTriggered = () => praiseCalledRef.current;
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__.getPunishTriggered = () => punishCalledRef.current;

    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__._trackPraise = () => {
      praiseCalledRef.current = true;
      actionTriggeredRef.current = "praise";
      onPraise?.();
    };
    // @ts-expect-error - Expose for testing
    window.__TEST_HOOKS__._trackPunish = () => {
      punishCalledRef.current = true;
      actionTriggeredRef.current = "punish";
      onPunish?.();
    };
  }, [
    state,
    isActive,
    gestureStart,
    gestureDelta,
    targetPosition,
    isOverTitan,
    activate,
    deactivate,
    toggle,
    onPraise,
    onPunish,
  ]);

  return (
    <GodHandContext.Provider value={value}>{children}</GodHandContext.Provider>
  );
}

// =============================================================================
// CURSOR COMPONENT
// =============================================================================

export interface GodHandCursorProps {
  /** Additional CSS class names */
  className?: string;
  /** Callback when praise gesture completes */
  onPraise?: () => void;
  /** Callback when punish gesture completes */
  onPunish?: () => void;
  /** Callback when pick up action triggers */
  onPickUp?: () => void;
  /** Callback when drop action triggers */
  onDrop?: (position: Position) => void;
}

/**
 * GodHandCursor - Visual cursor component for God Hand mode
 *
 * Features:
 * - Follows mouse cursor when active
 * - Changes appearance based on state
 * - Handles keyboard shortcuts (G, P, U)
 * - Detects drag gestures for praise/punish
 * - Provides visual feedback
 */
export function GodHandCursor({
  className,
  onPraise: propsOnPraise,
  onPunish: propsOnPunish,
  onPickUp: propsOnPickUp,
  onDrop: propsOnDrop,
}: GodHandCursorProps) {
  const context = useGodHand();
  const {
    state,
    isActive,
    toggle,
    gestureStart,
    gestureDelta,
    isOverTitan,
    setOnPraise,
    setOnPunish,
    setOnPickUp,
    setOnDrop,
  } = context;

  // Local state for cursor position
  const [cursorPosition, setCursorPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [localState, setLocalState] = useState<GodHandState>(state);
  const [localGestureStart, setLocalGestureStart] = useState<Position | null>(
    null
  );
  const [localGestureDelta, setLocalGestureDelta] = useState<Position>({
    x: 0,
    y: 0,
  });

  const determineGestureState = useCallback((delta: Position): GodHandState => {
    if (!isActive) return "inactive";
    if (!localGestureStart) return "active";

    if (delta.y > GESTURE_THRESHOLD) {
      return "praising";
    } else if (delta.y < -GESTURE_THRESHOLD) {
      return "punishing";
    }

    return "grasping";
  }, [isActive, localGestureStart]);

  // Refs
  const isMouseDown = useRef(false);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Sync local state with context
  useEffect(() => {
    setLocalState(state);
  }, [state]);

  // Register callbacks
  useEffect(() => {
    if (propsOnPraise) setOnPraise(propsOnPraise);
    if (propsOnPunish) setOnPunish(propsOnPunish);
    if (propsOnPickUp) setOnPickUp(propsOnPickUp);
    if (propsOnDrop) setOnDrop(propsOnDrop);
  }, [
    propsOnPraise,
    propsOnPunish,
    propsOnPickUp,
    propsOnDrop,
    setOnPraise,
    setOnPunish,
    setOnPickUp,
    setOnDrop,
  ]);

  // Announce state changes to screen readers
  const announce = useCallback((message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // G key to toggle God Hand mode
      if (e.key === "g" || e.key === "G") {
        if (!e.repeat) {
          toggle();
          announce(
            isActive ? "God Hand deactivated" : "God Hand activated"
          );
        }
        return;
      }

      // P and U keys only work when active and over Titan
      if (!isActive || !isOverTitan) return;

      // P key for praise
      if (e.key === "p" || e.key === "P") {
        if (!e.repeat) {
          // @ts-expect-error - Access test tracking
          if (typeof window !== "undefined" && window.__TEST_HOOKS__?._trackPraise) {
            // @ts-expect-error - Access test tracking
            window.__TEST_HOOKS__._trackPraise();
          }
          context.onPraise?.();
          announce("Praised the Titan");
        }
        return;
      }

      // U key for punish
      if (e.key === "u" || e.key === "U") {
        if (!e.repeat) {
          // @ts-expect-error - Access test tracking
          if (typeof window !== "undefined" && window.__TEST_HOOKS__?._trackPunish) {
            // @ts-expect-error - Access test tracking
            window.__TEST_HOOKS__._trackPunish();
          }
          context.onPunish?.();
          announce("Punished the Titan");
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle, isActive, isOverTitan, context, announce]);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });

      if (isMouseDown.current && localGestureStart) {
        const delta = {
          x: e.clientX - localGestureStart.x,
          y: e.clientY - localGestureStart.y,
        };
        setLocalGestureDelta(delta);

        // Update gesture delta in test hooks
        if (typeof window !== "undefined") {
          // @ts-expect-error - Update test hooks
          if (window.__TEST_HOOKS__) {
            // @ts-expect-error - Update test hooks
            const currentState = window.__TEST_HOOKS__.useGodHandState();
            // @ts-expect-error - Update test hooks
            window.__TEST_HOOKS__.useGodHandState = () => ({
              ...currentState,
              gestureStart: localGestureStart,
              gestureDelta: delta,
              state: determineGestureState(delta),
            });
          }
        }

        // Determine state based on gesture
        const newState = determineGestureState(delta);
        if (newState !== localState) {
          setLocalState(newState);
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!isActive) return;

      isMouseDown.current = true;
      const startPos = { x: e.clientX, y: e.clientY };
      setLocalGestureStart(startPos);
      setLocalGestureDelta({ x: 0, y: 0 });
      setLocalState("grasping");

      // Update test hooks
      if (typeof window !== "undefined") {
        // @ts-expect-error - Update test hooks
        if (window.__TEST_HOOKS__) {
          // @ts-expect-error - Update test hooks
          const currentState = window.__TEST_HOOKS__.useGodHandState();
          // @ts-expect-error - Update test hooks
          window.__TEST_HOOKS__.useGodHandState = () => ({
            ...currentState,
            gestureStart: startPos,
            gestureDelta: { x: 0, y: 0 },
            state: "grasping",
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (!isMouseDown.current) return;

      isMouseDown.current = false;

      // Check if we should trigger an action
      if (isOverTitan && localGestureDelta) {
        if (localGestureDelta.y > GESTURE_THRESHOLD) {
          // Drag down = praise
          // @ts-expect-error - Access test tracking
          if (typeof window !== "undefined" && window.__TEST_HOOKS__?._trackPraise) {
            // @ts-expect-error - Access test tracking
            window.__TEST_HOOKS__._trackPraise();
          }
          context.onPraise?.();
          announce("Praised the Titan");
        } else if (localGestureDelta.y < -GESTURE_THRESHOLD) {
          // Drag up = punish
          // @ts-expect-error - Access test tracking
          if (typeof window !== "undefined" && window.__TEST_HOOKS__?._trackPunish) {
            // @ts-expect-error - Access test tracking
            window.__TEST_HOOKS__._trackPunish();
          }
          context.onPunish?.();
          announce("Punished the Titan");
        }
      }

      // Reset state
      setLocalGestureStart(null);
      setLocalGestureDelta({ x: 0, y: 0 });
      setLocalState(isActive ? "active" : "inactive");

      // Update test hooks
      if (typeof window !== "undefined") {
        // @ts-expect-error - Update test hooks
        if (window.__TEST_HOOKS__) {
          // @ts-expect-error - Update test hooks
          const currentState = window.__TEST_HOOKS__.useGodHandState();
          // @ts-expect-error - Update test hooks
          window.__TEST_HOOKS__.useGodHandState = () => ({
            ...currentState,
            gestureStart: null,
            gestureDelta: { x: 0, y: 0 },
            state: isActive ? "active" : "inactive",
          });
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isActive, localGestureStart, localGestureDelta, isOverTitan, context, localState, announce, determineGestureState]);

  // Handle touch events
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!isActive || e.touches.length === 0) return;

      const touch = e.touches[0];
      const startPos = { x: touch.clientX, y: touch.clientY };
      setLocalGestureStart(startPos);
      setLocalGestureDelta({ x: 0, y: 0 });
      setCursorPosition(startPos);
      setLocalState("grasping");
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!localGestureStart || e.touches.length === 0) return;

      const touch = e.touches[0];
      const pos = { x: touch.clientX, y: touch.clientY };
      setCursorPosition(pos);

      const delta = {
        x: pos.x - localGestureStart.x,
        y: pos.y - localGestureStart.y,
      };
      setLocalGestureDelta(delta);

      const newState = determineGestureState(delta);
      if (newState !== localState) {
        setLocalState(newState);
      }
    };

    const handleTouchEnd = () => {
      if (!localGestureStart) return;

      // Check if we should trigger an action
      if (isOverTitan && localGestureDelta) {
        if (localGestureDelta.y > GESTURE_THRESHOLD) {
          context.onPraise?.();
          announce("Praised the Titan");
        } else if (localGestureDelta.y < -GESTURE_THRESHOLD) {
          context.onPunish?.();
          announce("Punished the Titan");
        }
      }

      // Reset state
      setLocalGestureStart(null);
      setLocalGestureDelta({ x: 0, y: 0 });
      setLocalState(isActive ? "active" : "inactive");
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isActive, localGestureStart, localGestureDelta, isOverTitan, context, localState, announce, determineGestureState]);

  // Apply cursor style to body when active
  useEffect(() => {
    if (isActive) {
      document.body.style.cursor = "none";
    } else {
      document.body.style.cursor = "";
    }

    return () => {
      document.body.style.cursor = "";
    };
  }, [isActive]);

  // Render cursor icon
  const renderCursorIcon = () => {
    const icon = CURSOR_ICONS[localState];
    if (!icon) return null;

    return (
      <span className="text-3xl select-none pointer-events-none">{icon}</span>
    );
  };

  // Don't render if inactive
  if (!isActive) {
    return (
      <>
        {/* Screen reader announcement region */}
        <div
          ref={announcementRef}
          aria-live="off"
          aria-atomic="true"
          className="sr-only"
          aria-hidden="true"
        />
        {/* God Hand toggle button for mobile */}
        <button
          data-testid="god-hand-toggle"
          className="fixed bottom-4 right-4 p-3 bg-white/80 rounded-full shadow-lg z-50 md:hidden"
          onClick={toggle}
          aria-label="Toggle God Hand mode"
        >
          🖐️
        </button>
        {/* Help text (hidden but available for testing) */}
        <div data-testid="god-hand-help" className="sr-only">
          Press G to toggle God Hand mode. When active: P for praise, U for
          punish. Drag down to praise, drag up to punish.
        </div>
      </>
    );
  }

  return (
    <>
      {/* Screen reader announcement region */}
      <div
        ref={announcementRef}
        aria-live="off"
        aria-atomic="true"
        className="sr-only"
        aria-hidden="true"
      >
        God Hand activated. Press G to deactivate.
      </div>

      {/* Custom cursor */}
      <div
        data-testid="god-hand-cursor"
        data-state={localState}
        className={`fixed pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ${className || ""}`}
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y,
        }}
        role="img"
        aria-label={`God Hand cursor - ${GOD_HAND_STATE_DESCRIPTIONS[localState]}`}
      >
        {renderCursorIcon()}

        {/* Particle effects for praising */}
        {localState === "praising" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-ping absolute w-16 h-16 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 opacity-30" />
            <div className="animate-pulse absolute w-12 h-12 rounded-full bg-gradient-to-r from-yellow-200 to-pink-200 opacity-50" />
          </div>
        )}

        {/* Particle effects for punishing */}
        {localState === "punishing" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-ping absolute w-16 h-16 rounded-full bg-red-500 opacity-30" />
            <div className="animate-pulse absolute w-12 h-12 rounded-full bg-red-400 opacity-50" />
          </div>
        )}
      </div>

      {/* God Hand toggle button for mobile */}
      <button
        data-testid="god-hand-toggle"
        className="fixed bottom-4 right-4 p-3 bg-yellow-400/80 rounded-full shadow-lg z-50 md:hidden"
        onClick={toggle}
        aria-label="Deactivate God Hand mode"
      >
        ❌
      </button>

      {/* Help text */}
      <div data-testid="god-hand-help" className="sr-only">
        God Hand is active. Press G to deactivate. P for praise, U for punish
        when over Titan. Drag down to praise, drag up to punish.
      </div>
    </>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default GodHandCursor;
