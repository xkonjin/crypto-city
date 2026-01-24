/**
 * Progressive Asset Loader
 * Issue #233: Implement Progressive Asset Loading
 * 
 * Loads assets in priority order:
 * 1. CRITICAL assets (required for initial render)
 * 2. HIGH priority assets (commonly used)
 * 3. LOW priority assets (decorative, background load)
 */

import { AssetPriority, getCriticalAssets, getHighPriorityAssets, getLowPriorityAssets } from './assetManifest';

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentPriority: AssetPriority | null;
}

export type ProgressCallback = (progress: LoadProgress) => void;

/**
 * Priority queue for asset loading
 */
class AssetLoadQueue {
  private queue: Array<{ path: string; priority: AssetPriority }> = [];
  private loading = false;
  private loadedAssets = new Set<string>();
  private callbacks: ProgressCallback[] = [];
  
  /**
   * Add an asset to the load queue
   */
  addAsset(path: string, priority: AssetPriority): void {
    if (this.loadedAssets.has(path)) {
      return; // Already loaded
    }
    
    this.queue.push({ path, priority });
    // Sort by priority (lower number = higher priority)
    this.queue.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Add multiple assets to the queue
   */
  addAssets(assets: Array<{ path: string; priority: AssetPriority }>): void {
    assets.forEach(asset => this.addAsset(asset.path, asset.priority));
  }
  
  /**
   * Register a progress callback
   */
  onProgress(callback: ProgressCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all callbacks of progress
   */
  private notifyProgress(loaded: number, total: number, currentPriority: AssetPriority | null): void {
    const progress: LoadProgress = {
      loaded,
      total,
      percentage: total > 0 ? (loaded / total) * 100 : 0,
      currentPriority,
    };
    this.callbacks.forEach(cb => cb(progress));
  }
  
  /**
   * Load a single asset
   */
  private async loadAsset(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadedAssets.add(path);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load asset: ${path}`);
        reject(new Error(`Failed to load ${path}`));
      };
      
      // Try WebP first, fallback to PNG
      const webpPath = path.replace(/\.png$/, '.webp');
      img.src = webpPath;
      
      // Fallback to PNG if WebP fails
      img.onerror = () => {
        img.onerror = () => reject(new Error(`Failed to load ${path}`));
        img.src = path;
      };
    });
  }
  
  /**
   * Start loading assets from the queue
   */
  async startLoading(): Promise<void> {
    if (this.loading) {
      return; // Already loading
    }
    
    this.loading = true;
    const total = this.queue.length;
    let loaded = 0;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;
      
      try {
        await this.loadAsset(item.path);
        loaded++;
        this.notifyProgress(loaded, total, item.priority);
      } catch (error) {
        // Continue loading even if one asset fails
        console.error(`Asset load error:`, error);
        loaded++;
        this.notifyProgress(loaded, total, item.priority);
      }
    }
    
    this.loading = false;
  }
  
  /**
   * Load assets by priority level
   */
  async loadByPriority(priority: AssetPriority): Promise<void> {
    const priorityAssets = this.queue.filter(item => item.priority === priority);
    const total = priorityAssets.length;
    let loaded = 0;
    
    for (const item of priorityAssets) {
      try {
        await this.loadAsset(item.path);
        loaded++;
        this.notifyProgress(loaded, total, priority);
        
        // Remove from queue
        const index = this.queue.indexOf(item);
        if (index > -1) {
          this.queue.splice(index, 1);
        }
      } catch (error) {
        console.error(`Asset load error:`, error);
        loaded++;
        this.notifyProgress(loaded, total, priority);
      }
    }
  }
  
  /**
   * Check if critical assets are loaded
   */
  areCriticalAssetsLoaded(): boolean {
    const criticalAssets = getCriticalAssets();
    return criticalAssets.every(asset => this.loadedAssets.has(asset.path));
  }
  
  /**
   * Get loading progress
   */
  getProgress(): LoadProgress {
    const total = this.queue.length + this.loadedAssets.size;
    const loaded = this.loadedAssets.size;
    return {
      loaded,
      total,
      percentage: total > 0 ? (loaded / total) * 100 : 100,
      currentPriority: this.queue[0]?.priority ?? null,
    };
  }
}

// Singleton instance
export const assetLoadQueue = new AssetLoadQueue();

/**
 * Initialize progressive asset loading
 * Loads critical assets first, then high priority, then low priority
 */
export async function initializeAssetLoading(onProgress?: ProgressCallback): Promise<void> {
  if (onProgress) {
    assetLoadQueue.onProgress(onProgress);
  }
  
  // Add all assets to queue
  const criticalAssets = getCriticalAssets();
  const highPriorityAssets = getHighPriorityAssets();
  const lowPriorityAssets = getLowPriorityAssets();
  
  assetLoadQueue.addAssets(criticalAssets.map(a => ({ path: a.path, priority: a.priority })));
  assetLoadQueue.addAssets(highPriorityAssets.map(a => ({ path: a.path, priority: a.priority })));
  assetLoadQueue.addAssets(lowPriorityAssets.map(a => ({ path: a.path, priority: a.priority })));
  
  // Load critical assets first (blocks initial render)
  await assetLoadQueue.loadByPriority(AssetPriority.CRITICAL);
  
  // Load high priority assets in background
  assetLoadQueue.loadByPriority(AssetPriority.HIGH).then(() => {
    // Load low priority assets after high priority
    return assetLoadQueue.loadByPriority(AssetPriority.LOW);
  });
}

/**
 * Check if the game is ready to render (critical assets loaded)
 */
export function isGameReady(): boolean {
  return assetLoadQueue.areCriticalAssetsLoaded();
}
