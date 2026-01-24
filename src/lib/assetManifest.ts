/**
 * Asset Manifest with Priority Levels
 * Issue #233: Progressive Asset Loading
 * 
 * Categorizes assets into priority groups for progressive loading:
 * - CRITICAL: UI elements, core game sprites (ground tiles)
 * - HIGH: Commonly used buildings, character animations
 * - LOW: Decorative props, seasonal assets
 */

export enum AssetPriority {
  CRITICAL = 0,
  HIGH = 1,
  LOW = 2,
}

export interface AssetDefinition {
  path: string;
  priority: AssetPriority;
  category: 'ui' | 'building' | 'prop' | 'character' | 'vehicle';
}

/**
 * Asset manifest defining load priorities
 * Assets are loaded in order: CRITICAL -> HIGH -> LOW
 */
export const ASSET_MANIFEST: AssetDefinition[] = [
  // CRITICAL: Core UI and ground tiles (load immediately)
  { path: '/tiles/grass.png', priority: AssetPriority.CRITICAL, category: 'ui' },
  { path: '/tiles/water.png', priority: AssetPriority.CRITICAL, category: 'ui' },
  { path: '/tiles/road.png', priority: AssetPriority.CRITICAL, category: 'ui' },
  
  // HIGH: Common buildings (load after critical assets)
  { path: '/Building/2x2house_north.png', priority: AssetPriority.HIGH, category: 'building' },
  { path: '/Building/2x2house_south.png', priority: AssetPriority.HIGH, category: 'building' },
  { path: '/Building/2x2house_east.png', priority: AssetPriority.HIGH, category: 'building' },
  { path: '/Building/2x2house_west.png', priority: AssetPriority.HIGH, category: 'building' },
  
  // LOW: Decorative props and seasonal content (load last)
  { path: '/Props/2x2christmas_tree.png', priority: AssetPriority.LOW, category: 'prop' },
  { path: '/Props/2x2fountain.png', priority: AssetPriority.LOW, category: 'prop' },
];

/**
 * Get assets by priority level
 */
export function getAssetsByPriority(priority: AssetPriority): AssetDefinition[] {
  return ASSET_MANIFEST.filter(asset => asset.priority === priority);
}

/**
 * Get all critical assets (must load before game is playable)
 */
export function getCriticalAssets(): AssetDefinition[] {
  return getAssetsByPriority(AssetPriority.CRITICAL);
}

/**
 * Get high-priority assets (commonly used, load early)
 */
export function getHighPriorityAssets(): AssetDefinition[] {
  return getAssetsByPriority(AssetPriority.HIGH);
}

/**
 * Get low-priority assets (decorative, load in background)
 */
export function getLowPriorityAssets(): AssetDefinition[] {
  return getAssetsByPriority(AssetPriority.LOW);
}

/**
 * Check if an asset is critical (required for initial load)
 */
export function isCriticalAsset(path: string): boolean {
  const asset = ASSET_MANIFEST.find(a => a.path === path);
  return asset?.priority === AssetPriority.CRITICAL;
}
