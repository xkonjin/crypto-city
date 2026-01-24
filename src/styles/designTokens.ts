/**
 * Design System Tokens
 * Issue #235: Create Consistent Design System with Tailwind Tokens
 * 
 * Centralized design tokens for colors, typography, spacing, and more
 */

export const designTokens = {
  colors: {
    // Primary brand colors
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    
    // Neutral grays
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
    
    // Semantic colors
    success: {
      light: '#86efac',
      DEFAULT: '#22c55e',
      dark: '#15803d',
    },
    warning: {
      light: '#fde047',
      DEFAULT: '#eab308',
      dark: '#a16207',
    },
    error: {
      light: '#fca5a5',
      DEFAULT: '#ef4444',
      dark: '#b91c1c',
    },
    info: {
      light: '#93c5fd',
      DEFAULT: '#3b82f6',
      dark: '#1e40af',
    },
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'Courier New', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  
  transitions: {
    fast: '150ms',
    DEFAULT: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export type DesignTokens = typeof designTokens;

/**
 * Get a design token value by path
 */
export function getToken(path: string): any {
  const parts = path.split('.');
  let value: any = designTokens;
  
  for (const part of parts) {
    value = value?.[part];
  }
  
  return value;
}

/**
 * CSS custom properties for design tokens
 */
export function generateCSSVariables(): string {
  return `
    :root {
      /* Colors */
      --color-primary: ${designTokens.colors.primary[500]};
      --color-success: ${designTokens.colors.success.DEFAULT};
      --color-warning: ${designTokens.colors.warning.DEFAULT};
      --color-error: ${designTokens.colors.error.DEFAULT};
      --color-info: ${designTokens.colors.info.DEFAULT};
      
      /* Typography */
      --font-sans: ${designTokens.typography.fontFamily.sans.join(', ')};
      --font-mono: ${designTokens.typography.fontFamily.mono.join(', ')};
      
      /* Spacing */
      --spacing-base: ${designTokens.spacing[4]};
      
      /* Transitions */
      --transition-fast: ${designTokens.transitions.fast};
      --transition-default: ${designTokens.transitions.DEFAULT};
      --transition-slow: ${designTokens.transitions.slow};
    }
  `;
}
