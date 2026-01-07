// =============================================================================
// ASSET VALIDATION SYSTEM
// =============================================================================
// Validates that all building definitions have corresponding assets or
// procedural configurations. Runs on startup and logs warnings for any
// inconsistencies that could cause runtime failures.

import { BUILDINGS } from '../data/buildings';
import { ALL_BUILDINGS } from '../data/buildingRegistry';
import { ALL_CRYPTO_BUILDINGS } from '../data/cryptoBuildings';
import { ALL_PROCEDURAL_BUILDINGS } from '../components/game/procedural/BuildingGenerator';

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationIssue {
  type: 'error' | 'warning';
  buildingId: string;
  message: string;
  suggestion?: string;
}

export interface ValidationReport {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  stats: {
    totalBuildings: number;
    proceduralBuildings: number;
    staticBuildings: number;
    cryptoBuildings: number;
    missingAssets: number;
    orphanedProcedural: number;
  };
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates that all buildings marked as procedural have corresponding
 * configurations in PROCEDURAL_BUILDINGS
 */
function validateProceduralBuildings(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const [id, building] of Object.entries(ALL_BUILDINGS)) {
    if (building.isProcedural) {
      // Check if procedural config exists
      if (!ALL_PROCEDURAL_BUILDINGS[id]) {
        issues.push({
          type: 'error',
          buildingId: id,
          message: `Building is marked isProcedural but has no config in PROCEDURAL_BUILDINGS`,
          suggestion: `Add a config for "${id}" in BuildingGenerator.ts or set isProcedural: false`,
        });
      }
    }
  }
  
  return issues;
}

/**
 * Validates that all non-procedural buildings have valid sprite paths
 */
function validateStaticAssets(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const [id, building] of Object.entries(ALL_BUILDINGS)) {
    // Skip procedural buildings - they don't need sprite files
    if (building.isProcedural) continue;
    
    // Check if building has any sprites defined
    const spriteEntries = Object.entries(building.sprites).filter(([_, path]) => path);
    
    if (spriteEntries.length === 0) {
      issues.push({
        type: 'error',
        buildingId: id,
        message: `Non-procedural building has no sprite paths defined`,
        suggestion: `Add sprite paths to the building definition or set isProcedural: true`,
      });
      continue;
    }
    
    // Validate sprite paths exist (only works in browser with fetch)
    // This is a structural check - runtime checks happen in Phaser
    for (const [direction, path] of spriteEntries) {
      if (typeof path !== 'string') {
        issues.push({
          type: 'error',
          buildingId: id,
          message: `Sprite path for direction "${direction}" is not a string`,
          suggestion: `Fix the sprite path in the building definition`,
        });
      } else if (!path.startsWith('/')) {
        issues.push({
          type: 'warning',
          buildingId: id,
          message: `Sprite path "${path}" for direction "${direction}" is not an absolute path`,
          suggestion: `Use absolute paths like "/assets/buildings/..."`,
        });
      }
    }
  }
  
  return issues;
}

/**
 * Validates that crypto buildings are properly integrated
 */
function validateCryptoBuildings(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const [id, building] of Object.entries(ALL_CRYPTO_BUILDINGS)) {
    // Check that crypto metadata exists
    if (!building.crypto) {
      issues.push({
        type: 'error',
        buildingId: id,
        message: `Crypto building is missing crypto metadata`,
        suggestion: `Add a crypto property with tier, effects, etc.`,
      });
      continue;
    }
    
    // Check that tier is valid
    const validTiers = ['degen', 'retail', 'whale', 'institution', 'shark', 'fish'];
    if (!validTiers.includes(building.crypto.tier)) {
      issues.push({
        type: 'error',
        buildingId: id,
        message: `Invalid crypto tier: "${building.crypto.tier}"`,
        suggestion: `Use one of: ${validTiers.join(', ')}`,
      });
    }
    
    // Check effects
    if (!building.crypto.effects) {
      issues.push({
        type: 'warning',
        buildingId: id,
        message: `Crypto building has no effects defined`,
        suggestion: `Add an effects property to define economic impact`,
      });
    }
  }
  
  return issues;
}

/**
 * Checks for orphaned procedural configs (configs without corresponding buildings)
 */
function findOrphanedProceduralConfigs(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const id of Object.keys(ALL_PROCEDURAL_BUILDINGS)) {
    if (!ALL_BUILDINGS[id]) {
      issues.push({
        type: 'warning',
        buildingId: id,
        message: `Procedural config exists but no building definition found`,
        suggestion: `Add a building definition in buildings.ts or cryptoBuildings.ts`,
      });
    }
  }
  
  return issues;
}

/**
 * Run all validation checks and generate a report
 */
export function validateBuildingRegistries(): ValidationReport {
  const allIssues: ValidationIssue[] = [
    ...validateProceduralBuildings(),
    ...validateStaticAssets(),
    ...validateCryptoBuildings(),
    ...findOrphanedProceduralConfigs(),
  ];
  
  const errors = allIssues.filter(i => i.type === 'error');
  const warnings = allIssues.filter(i => i.type === 'warning');
  
  // Calculate stats
  const proceduralCount = Object.values(ALL_BUILDINGS).filter(b => b.isProcedural).length;
  const orphanedCount = Object.keys(ALL_PROCEDURAL_BUILDINGS).filter(id => !ALL_BUILDINGS[id]).length;
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalBuildings: Object.keys(ALL_BUILDINGS).length,
      proceduralBuildings: proceduralCount,
      staticBuildings: Object.keys(ALL_BUILDINGS).length - proceduralCount,
      cryptoBuildings: Object.keys(ALL_CRYPTO_BUILDINGS).length,
      missingAssets: errors.filter(e => e.message.includes('sprite')).length,
      orphanedProcedural: orphanedCount,
    },
  };
}

/**
 * Validate and log results to console
 * Call this during app initialization
 */
export function runAssetValidation(): ValidationReport {
  console.log('[AssetValidation] Running building registry validation...');
  
  const report = validateBuildingRegistries();
  
  // Log stats
  console.log('[AssetValidation] Stats:', {
    total: report.stats.totalBuildings,
    procedural: report.stats.proceduralBuildings,
    static: report.stats.staticBuildings,
    crypto: report.stats.cryptoBuildings,
  });
  
  // Log errors
  if (report.errors.length > 0) {
    console.error(`[AssetValidation] Found ${report.errors.length} errors:`);
    for (const error of report.errors) {
      console.error(`  ❌ ${error.buildingId}: ${error.message}`);
      if (error.suggestion) {
        console.error(`     💡 ${error.suggestion}`);
      }
    }
  }
  
  // Log warnings
  if (report.warnings.length > 0) {
    console.warn(`[AssetValidation] Found ${report.warnings.length} warnings:`);
    for (const warning of report.warnings) {
      console.warn(`  ⚠️ ${warning.buildingId}: ${warning.message}`);
      if (warning.suggestion) {
        console.warn(`     💡 ${warning.suggestion}`);
      }
    }
  }
  
  if (report.isValid && report.warnings.length === 0) {
    console.log('[AssetValidation] ✅ All building registries are valid!');
  } else if (report.isValid) {
    console.log('[AssetValidation] ✅ No critical errors, but some warnings exist');
  } else {
    console.error('[AssetValidation] ❌ Validation failed - some buildings may not render correctly');
  }
  
  return report;
}

/**
 * Validate sprite paths exist at runtime (async check via fetch)
 * Only runs in development mode
 */
export async function validateAssetPathsAsync(): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  // Skip in production
  if (process.env.NODE_ENV !== 'development') {
    return results;
  }
  
  console.log('[AssetValidation] Checking asset paths...');
  
  const pathsToCheck: Array<{ buildingId: string; path: string }> = [];
  
  for (const [id, building] of Object.entries(ALL_BUILDINGS)) {
    if (building.isProcedural) continue;
    
    for (const [_, path] of Object.entries(building.sprites)) {
      if (path && typeof path === 'string') {
        pathsToCheck.push({ buildingId: id, path });
      }
    }
  }
  
  // Check in batches to avoid overwhelming the server
  const batchSize = 10;
  for (let i = 0; i < pathsToCheck.length; i += batchSize) {
    const batch = pathsToCheck.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async ({ buildingId, path }) => {
        try {
          const response = await fetch(path, { method: 'HEAD' });
          const exists = response.ok;
          results.set(path, exists);
          
          if (!exists) {
            console.warn(`[AssetValidation] Missing asset: ${path} (${buildingId})`);
          }
        } catch {
          results.set(path, false);
          console.warn(`[AssetValidation] Failed to check: ${path} (${buildingId})`);
        }
      })
    );
  }
  
  const missing = Array.from(results.entries()).filter(([_, exists]) => !exists);
  if (missing.length > 0) {
    console.warn(`[AssetValidation] ${missing.length} assets are missing or inaccessible`);
  } else {
    console.log(`[AssetValidation] ✅ All ${results.size} asset paths are valid`);
  }
  
  return results;
}

/**
 * Get a summary of building registry status
 */
export function getBuildingRegistrySummary(): string {
  const report = validateBuildingRegistries();
  
  return `
Building Registry Summary:
--------------------------
Total Buildings: ${report.stats.totalBuildings}
  - Static (PNG): ${report.stats.staticBuildings}
  - Procedural: ${report.stats.proceduralBuildings}
  - Crypto: ${report.stats.cryptoBuildings}

Validation Status: ${report.isValid ? '✅ VALID' : '❌ ERRORS'}
  - Errors: ${report.errors.length}
  - Warnings: ${report.warnings.length}
  `.trim();
}

