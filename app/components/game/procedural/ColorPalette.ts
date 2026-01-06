// Plasma-style Color Palette System
// Clean vector aesthetic with green/teal/blue accents

export interface ColorPalette {
  primary: string;       // Main face color
  primaryDark: string;   // Left face (shadow)
  primaryLight: string;  // Right face (highlight)
  top: string;           // Top face
  accent: string;        // Windows, details
  outline: string;       // Edge lines
}

// Core Plasma brand colors
export const PLASMA_COLORS = {
  // Primary greens/teals
  green: '#2D5A47',
  greenLight: '#3A7D6A',
  greenDark: '#1E3D30',
  
  // Blues
  blue: '#4A90D9',
  blueLight: '#6BA8E8',
  blueDark: '#3670B0',
  
  // Neutrals
  dark: '#1A1A1A',
  darkGray: '#2A2A2A',
  midGray: '#4A4A4A',
  lightGray: '#8A8A8A',
  light: '#F5F5F5',
  white: '#FFFFFF',
  
  // Background
  bg: '#FAFAFA',
  bgDark: '#E8E8E8',
  
  // Accent colors for variety
  coral: '#E07A5F',
  coralLight: '#F09A7F',
  coralDark: '#B85A3F',
  
  purple: '#7B68EE',
  purpleLight: '#9B88FF',
  purpleDark: '#5B48CE',
  
  gold: '#D4AF37',
  goldLight: '#E4CF67',
  goldDark: '#A48F17',
  
  terracotta: '#C17A5A',
  terracottaLight: '#D19A7A',
  terracottaDark: '#A15A3A',
  
  cream: '#F5E6D3',
  creamLight: '#FFF6E3',
  creamDark: '#D5C6B3',
} as const;

// Pre-defined palettes for different building types
export const BUILDING_PALETTES: Record<string, ColorPalette> = {
  // Modern glass/steel buildings
  modern: {
    primary: '#4A6880',
    primaryDark: '#3A5468',
    primaryLight: '#6A88A0',
    top: '#5A7890',
    accent: PLASMA_COLORS.blueLight,
    outline: PLASMA_COLORS.dark,
  },
  
  modernBlue: {
    primary: PLASMA_COLORS.blue,
    primaryDark: PLASMA_COLORS.blueDark,
    primaryLight: PLASMA_COLORS.blueLight,
    top: '#5AA0E9',
    accent: PLASMA_COLORS.white,
    outline: PLASMA_COLORS.dark,
  },
  
  // Residential warm tones
  residential: {
    primary: PLASMA_COLORS.terracotta,
    primaryDark: PLASMA_COLORS.terracottaDark,
    primaryLight: PLASMA_COLORS.terracottaLight,
    top: '#D18A6A',
    accent: PLASMA_COLORS.cream,
    outline: PLASMA_COLORS.dark,
  },
  
  residentialCream: {
    primary: PLASMA_COLORS.cream,
    primaryDark: PLASMA_COLORS.creamDark,
    primaryLight: PLASMA_COLORS.creamLight,
    top: '#FFF0DD',
    accent: PLASMA_COLORS.terracotta,
    outline: PLASMA_COLORS.darkGray,
  },
  
  brownstone: {
    primary: '#8B5A3C',
    primaryDark: '#6B3A1C',
    primaryLight: '#AB7A5C',
    top: '#9B6A4C',
    accent: '#E8D8C8',
    outline: PLASMA_COLORS.dark,
  },
  
  // Commercial
  commercial: {
    primary: '#E8E0D8',
    primaryDark: '#C8C0B8',
    primaryLight: '#F8F0E8',
    top: '#F0E8E0',
    accent: PLASMA_COLORS.blue,
    outline: PLASMA_COLORS.dark,
  },
  
  commercialGreen: {
    primary: PLASMA_COLORS.green,
    primaryDark: PLASMA_COLORS.greenDark,
    primaryLight: PLASMA_COLORS.greenLight,
    top: '#3D6A57',
    accent: PLASMA_COLORS.gold,
    outline: PLASMA_COLORS.dark,
  },
  
  // Landmark/Civic
  landmark: {
    primary: '#D8D0C8',
    primaryDark: '#B8B0A8',
    primaryLight: '#F0E8E0',
    top: '#E8E0D8',
    accent: PLASMA_COLORS.gold,
    outline: PLASMA_COLORS.dark,
  },
  
  civic: {
    primary: '#C8D8E8',
    primaryDark: '#A8B8C8',
    primaryLight: '#E8F0F8',
    top: '#D8E8F8',
    accent: PLASMA_COLORS.dark,
    outline: PLASMA_COLORS.dark,
  },
  
  // Special palettes
  christmas: {
    primary: '#C41E3A',
    primaryDark: '#8B0000',
    primaryLight: '#FF6B6B',
    top: '#D42E4A',
    accent: '#228B22',
    outline: PLASMA_COLORS.dark,
  },
  
  // Tile palettes
  tileGreen: {
    primary: PLASMA_COLORS.green,
    primaryDark: PLASMA_COLORS.greenDark,
    primaryLight: PLASMA_COLORS.greenLight,
    top: PLASMA_COLORS.greenLight,
    accent: PLASMA_COLORS.light,
    outline: PLASMA_COLORS.greenDark,
  },
  
  tileGray: {
    primary: '#9A9A9A',
    primaryDark: '#6A6A6A',
    primaryLight: '#BABABA',
    top: '#AAAAAA',
    accent: PLASMA_COLORS.light,
    outline: '#5A5A5A',
  },
  
  tileBeige: {
    primary: '#D8CFC0',
    primaryDark: '#B8AFA0',
    primaryLight: '#E8DFD0',
    top: '#E0D7C8',
    accent: PLASMA_COLORS.light,
    outline: '#A8A090',
  },
};

// Generate a random variation of a base palette
export function varyPalette(base: ColorPalette, variance: number = 0.1): ColorPalette {
  const vary = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const v = (val: number) => {
      const delta = Math.floor((Math.random() - 0.5) * 2 * variance * 255);
      return Math.max(0, Math.min(255, val + delta));
    };
    
    return `#${v(r).toString(16).padStart(2, '0')}${v(g).toString(16).padStart(2, '0')}${v(b).toString(16).padStart(2, '0')}`;
  };
  
  return {
    primary: vary(base.primary),
    primaryDark: vary(base.primaryDark),
    primaryLight: vary(base.primaryLight),
    top: vary(base.top),
    accent: base.accent, // Keep accent consistent
    outline: base.outline,
  };
}

// Interpolate between two colors
export function lerpColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Lighten a color
export function lighten(hex: string, amount: number = 0.2): string {
  return lerpColor(hex, '#FFFFFF', amount);
}

// Darken a color
export function darken(hex: string, amount: number = 0.2): string {
  return lerpColor(hex, '#000000', amount);
}

// Get a palette by name with optional variation
export function getPalette(name: string, addVariance: boolean = false): ColorPalette {
  // First check standard palettes, then check crypto palettes
  const base = BUILDING_PALETTES[name] || BUILDING_PALETTES.modern;
  return addVariance ? varyPalette(base, 0.05) : base;
}

// Re-export crypto palettes for unified access
// Import at top of file when using: import { CRYPTO_BUILDING_PALETTES } from './CryptoPalettes';
export { CRYPTO_BUILDING_PALETTES, getCryptoPalette } from './CryptoPalettes';

