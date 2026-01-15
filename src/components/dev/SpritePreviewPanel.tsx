'use client';

/**
 * Sprite Preview Panel - Dev tool for viewing all sprites
 * 
 * Features:
 * - Grid view of all crypto building sprites
 * - Live validation status for each sprite
 * - Filter by category, validation status
 * - Click to see detailed analysis
 */

import React, { useState, useCallback, useRef } from 'react';
import { getAllCryptoBuildings } from '@/games/isocity/crypto/buildings';
import type { CryptoBuildingDefinition } from '@/games/isocity/crypto/types';
import {
  validateFromImageData,
  formatValidationReport,
  type SpriteValidationResult,
  BUILDING_DIMENSIONS,
} from '@/lib/sprites/SpriteValidator';

// =============================================================================
// TYPES
// =============================================================================

interface SpriteInfo {
  building: CryptoBuildingDefinition;
  spritePath: string;
  loaded: boolean;
  validation?: SpriteValidationResult;
  error?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

// Initialize sprite list as a function for useState
function createInitialSprites(): SpriteInfo[] {
  const buildings = getAllCryptoBuildings();
  return buildings.map(building => {
    const spritePath = building.sprites?.south || 
      `/Building/crypto/${building.category}/${building.footprint.width}x${building.footprint.height}${building.id}_south.png`;
    
    return {
      building,
      spritePath,
      loaded: false,
    };
  });
}

export function SpritePreviewPanel() {
  const [sprites, setSprites] = useState<SpriteInfo[]>(createInitialSprites);
  const [selectedSprite, setSelectedSprite] = useState<SpriteInfo | null>(null);
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid' | 'unvalidated'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isValidating, setIsValidating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get unique categories
  const categories = ['all', ...new Set(sprites.map(s => s.building.category))];

  // Validate a single sprite
  const validateSprite = useCallback(async (sprite: SpriteInfo): Promise<SpriteValidationResult | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        const result = validateFromImageData(
          imageData,
          sprite.spritePath,
          {
            expectedWidth: BUILDING_DIMENSIONS.width,
            expectedHeight: BUILDING_DIMENSIONS.height,
          }
        );
        
        resolve(result);
      };
      
      img.onerror = () => {
        resolve(null);
      };
      
      img.src = sprite.spritePath;
    });
  }, []);

  // Validate all sprites
  const validateAll = useCallback(async () => {
    setIsValidating(true);
    
    const updatedSprites = [...sprites];
    
    for (let i = 0; i < updatedSprites.length; i++) {
      const sprite = updatedSprites[i];
      const validation = await validateSprite(sprite);
      
      updatedSprites[i] = {
        ...sprite,
        loaded: true,
        validation: validation || undefined,
        error: validation ? undefined : 'Failed to load image',
      };
      
      // Update state periodically
      if (i % 10 === 0) {
        setSprites([...updatedSprites]);
      }
    }
    
    setSprites(updatedSprites);
    setIsValidating(false);
  }, [sprites, validateSprite]);

  // Filter sprites
  const filteredSprites = sprites.filter(sprite => {
    // Category filter
    if (categoryFilter !== 'all' && sprite.building.category !== categoryFilter) {
      return false;
    }
    
    // Validation filter
    if (filter === 'valid' && !sprite.validation?.valid) return false;
    if (filter === 'invalid' && (sprite.validation?.valid !== false)) return false;
    if (filter === 'unvalidated' && sprite.validation) return false;
    
    return true;
  });

  // Stats
  const stats = {
    total: sprites.length,
    validated: sprites.filter(s => s.validation).length,
    valid: sprites.filter(s => s.validation?.valid).length,
    invalid: sprites.filter(s => s.validation?.valid === false).length,
    avgScore: sprites.filter(s => s.validation).reduce((sum, s) => sum + (s.validation?.score || 0), 0) / 
      Math.max(1, sprites.filter(s => s.validation).length),
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🎨 Sprite Preview Panel</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-gray-400 text-sm">Total Sprites</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{stats.validated}</div>
          <div className="text-gray-400 text-sm">Validated</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.valid}</div>
          <div className="text-gray-400 text-sm">Passed</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.invalid}</div>
          <div className="text-gray-400 text-sm">Failed</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{stats.avgScore.toFixed(0)}</div>
          <div className="text-gray-400 text-sm">Avg Score</div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <button
          onClick={validateAll}
          disabled={isValidating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
        >
          {isValidating ? 'Validating...' : 'Validate All Sprites'}
        </button>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-gray-700 rounded-lg"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-4 py-2 bg-gray-700 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="valid">Valid Only</option>
          <option value="invalid">Invalid Only</option>
          <option value="unvalidated">Not Validated</option>
        </select>
      </div>
      
      {/* Sprite Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {filteredSprites.map((sprite) => (
          <div
            key={sprite.building.id}
            onClick={() => setSelectedSprite(sprite)}
            className={`
              bg-gray-800 rounded-lg p-2 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all
              ${sprite.validation?.valid === true ? 'ring-1 ring-green-500' : ''}
              ${sprite.validation?.valid === false ? 'ring-1 ring-red-500' : ''}
            `}
          >
            <div className="aspect-square bg-gray-700 rounded mb-2 overflow-hidden relative">
              {/* Checkerboard background to show transparency */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #4a4a4a 25%, transparent 25%), linear-gradient(-45deg, #4a4a4a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #4a4a4a 75%), linear-gradient(-45deg, transparent 75%, #4a4a4a 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
              />
              <img
                src={sprite.spritePath}
                alt={sprite.building.name}
                className="w-full h-full object-contain relative z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Score badge */}
              {sprite.validation && (
                <div className={`
                  absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold z-20
                  ${sprite.validation.score >= 80 ? 'bg-green-600' : ''}
                  ${sprite.validation.score >= 50 && sprite.validation.score < 80 ? 'bg-yellow-600' : ''}
                  ${sprite.validation.score < 50 ? 'bg-red-600' : ''}
                `}>
                  {sprite.validation.score}
                </div>
              )}
            </div>
            <div className="text-xs truncate" title={sprite.building.name}>
              {sprite.building.name}
            </div>
            <div className="text-xs text-gray-500">
              {sprite.building.category} • {sprite.building.footprint.width}x{sprite.building.footprint.height}
            </div>
          </div>
        ))}
      </div>
      
      {/* Selected Sprite Detail Modal */}
      {selectedSprite && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSprite(null)}
        >
          <div 
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedSprite.building.name}</h2>
              <button 
                onClick={() => setSelectedSprite(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Sprite Preview */}
              <div>
                <div 
                  className="aspect-square bg-gray-700 rounded-lg overflow-hidden relative"
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #4a4a4a 25%, transparent 25%), linear-gradient(-45deg, #4a4a4a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #4a4a4a 75%), linear-gradient(-45deg, transparent 75%, #4a4a4a 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  }}
                >
                  <img
                    src={selectedSprite.spritePath}
                    alt={selectedSprite.building.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-2 text-sm text-gray-400 break-all">
                  {selectedSprite.spritePath}
                </div>
              </div>
              
              {/* Validation Details */}
              <div>
                <h3 className="font-bold mb-2">Building Info</h3>
                <div className="text-sm space-y-1 mb-4">
                  <div><span className="text-gray-400">ID:</span> {selectedSprite.building.id}</div>
                  <div><span className="text-gray-400">Category:</span> {selectedSprite.building.category}</div>
                  <div><span className="text-gray-400">Footprint:</span> {selectedSprite.building.footprint.width}x{selectedSprite.building.footprint.height}</div>
                  <div><span className="text-gray-400">Tier:</span> {selectedSprite.building.crypto?.tier}</div>
                </div>
                
                {selectedSprite.validation ? (
                  <>
                    <h3 className="font-bold mb-2">Validation Result</h3>
                    <div className={`
                      inline-block px-3 py-1 rounded-full text-sm font-bold mb-3
                      ${selectedSprite.validation.valid ? 'bg-green-600' : 'bg-red-600'}
                    `}>
                      {selectedSprite.validation.valid ? '✓ VALID' : '✗ INVALID'}
                    </div>
                    
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="text-gray-400">Score:</span>{' '}
                        <span className="font-bold">{selectedSprite.validation.score}/100</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Dimensions:</span>{' '}
                        {selectedSprite.validation.dimensions.width}x{selectedSprite.validation.dimensions.height}
                        {selectedSprite.validation.dimensions.correct ? ' ✓' : ' ✗'}
                      </div>
                      <div>
                        <span className="text-gray-400">Transparency:</span>{' '}
                        {selectedSprite.validation.transparency.transparencyPercent.toFixed(1)}%
                      </div>
                      <div>
                        <span className="text-gray-400">Colors:</span>{' '}
                        {selectedSprite.validation.colorAnalysis.uniqueColors}/{selectedSprite.validation.colorAnalysis.maxAllowed}
                      </div>
                      
                      {/* Dominant Colors */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Palette:</span>
                        {selectedSprite.validation.colorAnalysis.dominantColors.map((color, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded border border-gray-600"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      
                      {/* Issues */}
                      {selectedSprite.validation.issues.length > 0 && (
                        <div className="mt-3">
                          <div className="text-red-400 font-bold mb-1">Issues:</div>
                          {selectedSprite.validation.issues.map((issue, i) => (
                            <div key={i} className="text-red-300 text-sm">❌ {issue}</div>
                          ))}
                        </div>
                      )}
                      
                      {/* Warnings */}
                      {selectedSprite.validation.warnings.length > 0 && (
                        <div className="mt-3">
                          <div className="text-yellow-400 font-bold mb-1">Warnings:</div>
                          {selectedSprite.validation.warnings.map((warning, i) => (
                            <div key={i} className="text-yellow-300 text-sm">⚠️ {warning}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400">
                    Click &quot;Validate All Sprites&quot; to run validation
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden canvas for validation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default SpritePreviewPanel;
