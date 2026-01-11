/**
 * Asset Preloader
 * 
 * Handles preloading of all game assets before rendering starts.
 * Addresses GitHub Issues #71, #74, #76, #79
 */

import { getActiveSpritePack } from '@/lib/renderConfig';
import { getAllCryptoBuildings } from '@/games/isocity/crypto/buildings';

export interface PreloadProgress {
  total: number;
  loaded: number;
  failed: string[];
  currentAsset: string;
  percentage: number;
}

// Track overall loading state
let assetsReady = false;
let criticalAssetsReady = false;

// Image cache for preloaded assets
const preloadedImages = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

/**
 * Get all critical sprite sheet paths from the active sprite pack
 */
export function getCriticalAssets(): string[] {
  const pack = getActiveSpritePack();
  const assets: string[] = [];
  
  // Main sprite sheet (try both webp and png)
  if (pack.src) {
    assets.push(pack.src);
    // Also try webp version
    if (pack.src.endsWith('.png')) {
      assets.push(pack.src.replace('.png', '.webp'));
    }
  }
  
  // Water texture
  assets.push('/assets/water.webp');
  
  // Secondary sheets
  if (pack.constructionSrc) assets.push(pack.constructionSrc);
  if (pack.abandonedSrc) assets.push(pack.abandonedSrc);
  if (pack.denseSrc) assets.push(pack.denseSrc);
  if (pack.parksSrc) assets.push(pack.parksSrc);
  if (pack.parksConstructionSrc) assets.push(pack.parksConstructionSrc);
  if (pack.farmsSrc) assets.push(pack.farmsSrc);
  if (pack.shopsSrc) assets.push(pack.shopsSrc);
  if (pack.stationsSrc) assets.push(pack.stationsSrc);
  if (pack.modernSrc) assets.push(pack.modernSrc);
  if (pack.mansionsSrc) assets.push(pack.mansionsSrc);
  
  return assets;
}

/**
 * Get all crypto building sprite paths
 */
export function getCryptoBuildingAssets(): string[] {
  const buildings = getAllCryptoBuildings();
  const assets: string[] = [];
  
  for (const building of buildings) {
    if (!building.isProcedural && building.sprites?.south) {
      assets.push(building.sprites.south);
    }
  }
  
  return assets;
}

/**
 * Load a single image with promise caching to prevent duplicates
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  // Return cached
  if (preloadedImages.has(src)) {
    return Promise.resolve(preloadedImages.get(src)!);
  }
  
  // Return existing promise if already loading
  if (loadingPromises.has(src)) {
    return loadingPromises.get(src)!;
  }
  
  // Start new load
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      preloadedImages.set(src, img);
      loadingPromises.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      loadingPromises.delete(src);
      reject(new Error(`Failed to load: ${src}`));
    };
    img.src = src;
  });
  
  loadingPromises.set(src, promise);
  return promise;
}

/**
 * Preload critical assets needed for initial game render
 */
export async function preloadCriticalAssets(
  onProgress?: (progress: PreloadProgress) => void
): Promise<boolean> {
  const assets = getCriticalAssets();
  const progress: PreloadProgress = {
    total: assets.length,
    loaded: 0,
    failed: [],
    currentAsset: '',
    percentage: 0,
  };
  
  const results = await Promise.allSettled(
    assets.map(async (src) => {
      progress.currentAsset = src.split('/').pop() || src;
      onProgress?.({ ...progress });
      
      try {
        await loadImage(src);
        progress.loaded++;
        progress.percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress?.({ ...progress });
        return src;
      } catch {
        progress.failed.push(src);
        progress.loaded++; // Still count as processed
        progress.percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress?.({ ...progress });
        throw new Error(`Failed: ${src}`);
      }
    })
  );
  
  // At least the main sprite sheet should load
  const mainLoaded = results.some(
    (r, i) => r.status === 'fulfilled' && 
    (assets[i].includes('sprites_red_water_new') || assets[i].includes('water'))
  );
  
  criticalAssetsReady = mainLoaded;
  return mainLoaded;
}

/**
 * Preload crypto building sprites (can be done in background)
 */
export async function preloadCryptoAssets(
  onProgress?: (progress: PreloadProgress) => void
): Promise<boolean> {
  const assets = getCryptoBuildingAssets();
  const progress: PreloadProgress = {
    total: assets.length,
    loaded: 0,
    failed: [],
    currentAsset: '',
    percentage: 0,
  };
  
  // Load in batches of 5 for better performance
  const batchSize = 5;
  for (let i = 0; i < assets.length; i += batchSize) {
    const batch = assets.slice(i, i + batchSize);
    
    await Promise.allSettled(
      batch.map(async (src) => {
        progress.currentAsset = src.split('/').pop() || src;
        onProgress?.({ ...progress });
        
        try {
          await loadImage(src);
          progress.loaded++;
          progress.percentage = Math.round((progress.loaded / progress.total) * 100);
          onProgress?.({ ...progress });
        } catch {
          progress.failed.push(src);
          progress.loaded++;
          progress.percentage = Math.round((progress.loaded / progress.total) * 100);
          onProgress?.({ ...progress });
        }
      })
    );
  }
  
  // Consider success if most loaded
  const successRate = (progress.loaded - progress.failed.length) / progress.total;
  return successRate > 0.8;
}

/**
 * Preload all assets
 */
export async function preloadAllAssets(
  onProgress?: (progress: PreloadProgress) => void
): Promise<boolean> {
  const criticalAssets = getCriticalAssets();
  const cryptoAssets = getCryptoBuildingAssets();
  const allAssets = [...criticalAssets, ...cryptoAssets];
  
  const progress: PreloadProgress = {
    total: allAssets.length,
    loaded: 0,
    failed: [],
    currentAsset: '',
    percentage: 0,
  };
  
  // Load critical first
  await preloadCriticalAssets((p) => {
    progress.loaded = p.loaded;
    progress.currentAsset = p.currentAsset;
    progress.failed = p.failed;
    progress.percentage = Math.round((progress.loaded / progress.total) * 100);
    onProgress?.({ ...progress });
  });
  
  // Then crypto assets
  const cryptoStartOffset = criticalAssets.length;
  await preloadCryptoAssets((p) => {
    progress.loaded = cryptoStartOffset + p.loaded;
    progress.currentAsset = p.currentAsset;
    progress.failed = [...progress.failed, ...p.failed];
    progress.percentage = Math.round((progress.loaded / progress.total) * 100);
    onProgress?.({ ...progress });
  });
  
  assetsReady = true;
  return true;
}

/**
 * Check if critical assets are ready for rendering
 */
export function areAssetsReady(): boolean {
  return criticalAssetsReady;
}

/**
 * Check if all assets including crypto sprites are loaded
 */
export function areAllAssetsReady(): boolean {
  return assetsReady;
}

/**
 * Get a preloaded image from cache
 */
export function getPreloadedImage(src: string): HTMLImageElement | undefined {
  return preloadedImages.get(src);
}

/**
 * Expose functions globally for testing
 */
if (typeof window !== 'undefined') {
  (window as unknown as { 
    areAssetsReady: typeof areAssetsReady;
    areCryptoBuildingSpritesLoaded: typeof areAllAssetsReady;
  }).areAssetsReady = areAssetsReady;
  (window as unknown as { 
    areCryptoBuildingSpritesLoaded: typeof areAllAssetsReady;
  }).areCryptoBuildingSpritesLoaded = areAllAssetsReady;
}
