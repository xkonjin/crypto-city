export type CobiePalette = {
  primary: string;
  secondary: string;
  accent: string;
  outline: string;
  highlight: string;
};

export type CobieStyleTokens = {
  palette: CobiePalette;
  material: 'glossy-plastic' | 'matte-plastic';
  headToBodyRatio: number;
  silhouette: 'rounded' | 'rounded-compact';
  spriteScales: {
    small: number;
    medium: number;
    large: number;
  };
};

export const COBIE_STYLE: CobieStyleTokens = {
  palette: {
    primary: '#f8d8c4',
    secondary: '#c9e6ff',
    accent: '#ffe48a',
    outline: '#2a2a2a',
    highlight: '#ffffff',
  },
  material: 'glossy-plastic',
  headToBodyRatio: 0.38,
  silhouette: 'rounded-compact',
  spriteScales: {
    small: 1,
    medium: 1.4,
    large: 2,
  },
};

export const COBIE_ANIMATION_NAMING = {
  prefix: 'cobie',
  loopSeparator: '-',
  variantSeparator: '--',
  fileExtension: '.png',
};
