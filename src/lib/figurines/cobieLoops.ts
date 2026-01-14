import type { CobieLoopId } from './cobieManifest';

export type CobieTrigger =
  | 'idle'
  | 'rug_pull'
  | 'achievement'
  | 'milestone'
  | 'disaster'
  | 'warning'
  | 'trade';

export type CobieLoopMap = Record<CobieTrigger, CobieLoopId>;

export const COBIE_LOOP_MAP: CobieLoopMap = {
  idle: 'idle',
  rug_pull: 'react',
  achievement: 'cheer',
  milestone: 'hype',
  disaster: 'shrug',
  warning: 'think',
  trade: 'type',
};

export const COBIE_LOOP_COOLDOWNS_MS: Record<CobieTrigger, number> = {
  idle: 0,
  rug_pull: 8000,
  achievement: 6000,
  milestone: 6000,
  disaster: 6000,
  warning: 5000,
  trade: 4000,
};
