/**
 * CryptoCity Design System
 * 
 * Shared design tokens and utilities for consistent aesthetics
 * across landing page and game UI.
 * 
 * Issue #162: Aesthetic cohesion between landing/game pages
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

/**
 * Core brand colors from landing page retro pixel art style
 */
export const BRAND_COLORS = {
  // Primary gold/crypto accent
  gold: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Primary
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Crypto teal/green accent
  crypto: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6', // Primary
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  
  // Dark backgrounds (from landing page gradient)
  dark: {
    900: '#1a0a2e', // Darkest purple
    800: '#16213e', // Dark blue
    700: '#0f3460', // Deep navy
    600: '#1e3a5f', // Navy
    500: '#2d1b4e', // Purple-tinted dark
    400: '#3d2817', // Dark brown (for frames)
  },
  
  // Wood/frame browns (from retro frame)
  wood: {
    light: '#a08060',
    medium: '#8b7355',
    dark: '#5c4033',
    darkest: '#3d2817',
  },
} as const;

/**
 * Semantic colors for game status
 */
export const STATUS_COLORS = {
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  
  // Demand indicators
  residential: '#22c55e',
  commercial: '#3b82f6',
  industrial: '#f59e0b',
  
  // Crypto-specific
  bullish: '#22c55e',
  bearish: '#ef4444',
  neutral: '#6b7280',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

/**
 * Font families matching landing page retro style
 */
export const FONTS = {
  // Monospace for retro pixel feel
  mono: 'monospace',
  
  // Sans-serif for readability
  sans: 'system-ui, -apple-system, sans-serif',
  
  // Display font for headlines (pixel-like)
  display: 'monospace',
} as const;

/**
 * Type scale with pixel-friendly sizes
 */
export const TYPE_SCALE = {
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px
  base: '1rem',    // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
} as const;

// =============================================================================
// SPACING
// =============================================================================

/**
 * Spacing scale (4px base unit for pixel-perfect alignment)
 */
export const SPACING = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  16: '4rem',   // 64px
} as const;

// =============================================================================
// SHADOWS & EFFECTS
// =============================================================================

/**
 * Box shadows matching retro game aesthetic
 */
export const SHADOWS = {
  // Pixel-art style hard shadows
  pixel: {
    sm: '2px 2px 0 rgba(0,0,0,0.4)',
    md: '3px 3px 0 rgba(0,0,0,0.4)',
    lg: '4px 4px 0 rgba(0,0,0,0.5)',
  },
  
  // Soft inner shadows for depth
  inset: {
    sm: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)',
    md: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3)',
  },
  
  // Glow effects
  glow: {
    gold: '0 0 10px rgba(245, 158, 11, 0.5)',
    crypto: '0 0 10px rgba(20, 184, 166, 0.5)',
    danger: '0 0 10px rgba(239, 68, 68, 0.5)',
  },
} as const;

// =============================================================================
// BORDER STYLES
// =============================================================================

/**
 * Border styles for frame-like elements
 */
export const BORDERS = {
  // Pixel-perfect borders
  pixel: '1px solid',
  
  // Retro frame border
  frame: {
    width: '3px',
    style: 'solid',
  },
  
  // Corner decorations (like gold corners on landing page)
  cornerSize: '4px',
} as const;

// =============================================================================
// CSS-IN-JS HELPERS
// =============================================================================

/**
 * Generate retro button styles
 */
export function getRetroButtonStyles(variant: 'primary' | 'secondary' | 'ghost' = 'primary') {
  const baseStyles = {
    fontFamily: FONTS.mono,
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    transition: 'all 150ms',
  };
  
  const variants = {
    primary: {
      ...baseStyles,
      background: `linear-gradient(180deg, ${BRAND_COLORS.wood.dark} 0%, ${BRAND_COLORS.wood.darkest} 100%)`,
      border: `3px solid ${BRAND_COLORS.wood.medium}`,
      boxShadow: SHADOWS.pixel.md + ', ' + SHADOWS.inset.md,
      color: BRAND_COLORS.gold[400],
    },
    secondary: {
      ...baseStyles,
      background: `linear-gradient(180deg, ${BRAND_COLORS.dark[500]} 0%, ${BRAND_COLORS.dark[900]} 100%)`,
      border: `3px solid #6b5b7b`,
      boxShadow: SHADOWS.pixel.md + ', ' + SHADOWS.inset.md,
      color: '#b8a0d0',
    },
    ghost: {
      ...baseStyles,
      background: 'transparent',
      border: '2px solid rgba(255,255,255,0.2)',
      color: 'rgba(255,255,255,0.7)',
    },
  };
  
  return variants[variant];
}

/**
 * Generate retro frame styles
 */
export function getRetroFrameStyles() {
  return {
    outer: {
      background: `linear-gradient(135deg, ${BRAND_COLORS.wood.medium} 0%, ${BRAND_COLORS.wood.dark} 50%, ${BRAND_COLORS.wood.darkest} 100%)`,
      boxShadow: `inset 0 0 0 2px ${BRAND_COLORS.wood.darkest}, inset 0 0 0 4px ${BRAND_COLORS.wood.light}, ${SHADOWS.pixel.lg}`,
      padding: '4px',
    },
    inner: {
      background: `linear-gradient(180deg, ${BRAND_COLORS.dark[500]} 0%, ${BRAND_COLORS.dark[900]} 100%)`,
      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
    },
  };
}

/**
 * Get corner decoration positions
 */
export function getCornerDecorations() {
  return {
    topLeft: { top: '8px', left: '8px', borderTop: true, borderLeft: true },
    topRight: { top: '8px', right: '8px', borderTop: true, borderRight: true },
    bottomLeft: { bottom: '8px', left: '8px', borderBottom: true, borderLeft: true },
    bottomRight: { bottom: '8px', right: '8px', borderBottom: true, borderRight: true },
  };
}

// =============================================================================
// TAILWIND CLASS HELPERS
// =============================================================================

/**
 * Common Tailwind class combinations for consistent styling
 */
export const TAILWIND_PRESETS = {
  // Retro panel background
  panel: 'bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-700/50 backdrop-blur-sm',
  
  // Gold accent text
  goldText: 'text-amber-400 font-mono font-bold tracking-wide',
  
  // Crypto accent text
  cryptoText: 'text-teal-400 font-mono font-semibold',
  
  // Stat display
  statValue: 'font-mono tabular-nums font-semibold',
  statLabel: 'text-xs text-muted-foreground uppercase tracking-wider',
  
  // Button hover
  buttonHover: 'hover:brightness-110 active:brightness-90 transition-all duration-150',
  
  // Pixel grid overlay (for retro feel)
  pixelGrid: 'before:absolute before:inset-0 before:pointer-events-none before:opacity-[0.03] before:bg-pixel-grid',
} as const;

// =============================================================================
// ANIMATION CONSTANTS
// =============================================================================

/**
 * Animation durations
 */
export const ANIMATION_DURATION = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
} as const;

/**
 * CSS keyframes for common animations
 */
export const ANIMATIONS = {
  twinkle: `
    @keyframes twinkle {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.8; }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `,
  slideIn: `
    @keyframes slideIn {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
} as const;
