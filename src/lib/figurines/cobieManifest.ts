export type CobieVariant = 'default' | 'cap' | 'phone' | 'laptop' | 'coffee' | 'tv';

export type CobieLoopId =
  | 'idle'
  | 'wave'
  | 'hype'
  | 'think'
  | 'type'
  | 'sleep'
  | 'snack'
  | 'react'
  | 'cheer'
  | 'shrug';

export type CobieLoopMeta = {
  id: CobieLoopId;
  fps: number;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  durationMs: number;
  defaultVariant: CobieVariant;
};

export type CobieManifest = {
  basePath: string;
  loops: Record<CobieLoopId, CobieLoopMeta>;
};

export const COBIE_MANIFEST: CobieManifest = {
  basePath: '/figurines/cobie',
  loops: {
    idle: { id: 'idle', fps: 12, frameCount: 24, frameWidth: 96, frameHeight: 96, durationMs: 2000, defaultVariant: 'default' },
    wave: { id: 'wave', fps: 12, frameCount: 16, frameWidth: 96, frameHeight: 96, durationMs: 1333, defaultVariant: 'default' },
    hype: { id: 'hype', fps: 14, frameCount: 20, frameWidth: 96, frameHeight: 96, durationMs: 1428, defaultVariant: 'phone' },
    think: { id: 'think', fps: 10, frameCount: 20, frameWidth: 96, frameHeight: 96, durationMs: 2000, defaultVariant: 'default' },
    type: { id: 'type', fps: 12, frameCount: 24, frameWidth: 96, frameHeight: 96, durationMs: 2000, defaultVariant: 'laptop' },
    sleep: { id: 'sleep', fps: 8, frameCount: 16, frameWidth: 96, frameHeight: 96, durationMs: 2000, defaultVariant: 'default' },
    snack: { id: 'snack', fps: 10, frameCount: 20, frameWidth: 96, frameHeight: 96, durationMs: 2000, defaultVariant: 'coffee' },
    react: { id: 'react', fps: 12, frameCount: 18, frameWidth: 96, frameHeight: 96, durationMs: 1500, defaultVariant: 'phone' },
    cheer: { id: 'cheer', fps: 12, frameCount: 18, frameWidth: 96, frameHeight: 96, durationMs: 1500, defaultVariant: 'cap' },
    shrug: { id: 'shrug', fps: 10, frameCount: 16, frameWidth: 96, frameHeight: 96, durationMs: 1600, defaultVariant: 'default' },
  },
};
