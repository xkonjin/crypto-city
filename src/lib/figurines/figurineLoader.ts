import { loadImage } from '@/components/game/imageLoader';
import { COBIE_MANIFEST, type CobieLoopId, type CobieLoopMeta, type CobieVariant } from './cobieManifest';

type CobieSpriteKey = `${CobieLoopId}:${CobieVariant}`;

const cobieCache = new Map<CobieSpriteKey, HTMLImageElement>();
const cobieLoading = new Map<CobieSpriteKey, Promise<HTMLImageElement>>();

type CobieAssetCallback = () => void;
const cobieAssetCallbacks = new Set<CobieAssetCallback>();

export function onCobieAssetLoaded(callback: CobieAssetCallback): () => void {
  cobieAssetCallbacks.add(callback);
  return () => cobieAssetCallbacks.delete(callback);
}

function notifyCobieAssetLoaded() {
  cobieAssetCallbacks.forEach((cb) => cb());
}

export function getCobieLoopMeta(loopId: CobieLoopId): CobieLoopMeta {
  return COBIE_MANIFEST.loops[loopId];
}

export function getCobieSpritesheetPath(loopId: CobieLoopId, variant: CobieVariant): string {
  return `${COBIE_MANIFEST.basePath}/${loopId}--${variant}.png`;
}

export async function loadCobieSpritesheet(loopId: CobieLoopId, variant: CobieVariant): Promise<HTMLImageElement> {
  const key: CobieSpriteKey = `${loopId}:${variant}`;
  const cached = cobieCache.get(key);
  if (cached) return cached;

  const inflight = cobieLoading.get(key);
  if (inflight) return inflight;

  const promise = loadImage(getCobieSpritesheetPath(loopId, variant), true).then((img) => {
    cobieCache.set(key, img);
    cobieLoading.delete(key);
    notifyCobieAssetLoaded();
    return img;
  });

  cobieLoading.set(key, promise);
  return promise;
}

export function getCobieFrameRect(loopMeta: CobieLoopMeta, frameIndex: number) {
  const clampedIndex = frameIndex % loopMeta.frameCount;
  return {
    sx: clampedIndex * loopMeta.frameWidth,
    sy: 0,
    sw: loopMeta.frameWidth,
    sh: loopMeta.frameHeight,
  };
}
