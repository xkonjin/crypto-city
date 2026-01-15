'use client';

/**
 * Animation Preview - Test NPC walk cycles and sprite animations
 * 
 * Features:
 * - Preview NPC spritesheet animations
 * - Adjust frame rate
 * - View individual frames
 * - Test generated avatars
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
  SPRITE_COLUMNS,
  SPRITE_ROWS,
  SPRITESHEET_WIDTH,
  SPRITESHEET_HEIGHT,
  getSpriteFrame,
  generateProceduralAvatar,
} from '@/lib/ingestion/AvatarGenerator';

// =============================================================================
// TYPES
// =============================================================================

type Direction = 'south' | 'east' | 'west' | 'north';

interface AnimationState {
  frame: number;
  direction: Direction;
  playing: boolean;
  fps: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AnimationPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spritesheetUrl, setSpritesheetUrl] = useState<string>('');
  const [spritesheet, setSpritesheet] = useState<HTMLImageElement | null>(null);
  const [animation, setAnimation] = useState<AnimationState>({
    frame: 0,
    direction: 'south',
    playing: true,
    fps: 8,
  });
  const [scale, setScale] = useState(4);
  const [testUsername, setTestUsername] = useState('degen_trader');
  
  // Generate procedural avatar for testing
  const generateTestAvatar = useCallback(() => {
    try {
      const dataUrl = generateProceduralAvatar(testUsername, ['#4a90d9', '#f5f5f5', '#333333']);
      setSpritesheetUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate avatar:', error);
    }
  }, [testUsername]);

  // Load spritesheet image
  useEffect(() => {
    if (!spritesheetUrl) return;
    
    const img = new Image();
    img.onload = () => setSpritesheet(img);
    img.onerror = () => console.error('Failed to load spritesheet');
    img.src = spritesheetUrl;
  }, [spritesheetUrl]);

  // Animation loop
  useEffect(() => {
    if (!animation.playing || !spritesheet) return;
    
    const interval = setInterval(() => {
      setAnimation(prev => ({
        ...prev,
        frame: (prev.frame + 1) % SPRITE_COLUMNS,
      }));
    }, 1000 / animation.fps);
    
    return () => clearInterval(interval);
  }, [animation.playing, animation.fps, spritesheet]);

  // Draw current frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spritesheet) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = SPRITE_FRAME_WIDTH * scale;
    canvas.height = SPRITE_FRAME_HEIGHT * scale;
    
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Disable smoothing for pixel art
    ctx.imageSmoothingEnabled = false;
    
    // Get sprite frame coordinates
    const { sx, sy, sw, sh } = getSpriteFrame(animation.direction, animation.frame);
    
    // Draw scaled frame
    ctx.drawImage(
      spritesheet,
      sx, sy, sw, sh,
      0, 0, canvas.width, canvas.height
    );
  }, [spritesheet, animation.frame, animation.direction, scale]);

  const directions: Direction[] = ['south', 'east', 'west', 'north'];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🏃 Animation Preview</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-bold mb-4">Generate Test Avatar</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={testUsername}
                onChange={(e) => setTestUsername(e.target.value)}
                placeholder="Username for avatar"
                className="flex-1 px-3 py-2 bg-gray-700 rounded"
              />
              <button
                onClick={generateTestAvatar}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Generate
              </button>
            </div>
            
            <div className="text-sm text-gray-400">
              Or paste a spritesheet URL:
            </div>
            <input
              type="text"
              value={spritesheetUrl.startsWith('data:') ? '' : spritesheetUrl}
              onChange={(e) => setSpritesheetUrl(e.target.value)}
              placeholder="https://... or data:image/png;base64,..."
              className="w-full px-3 py-2 bg-gray-700 rounded mt-2"
            />
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-bold mb-4">Animation Controls</h2>
            
            <div className="space-y-4">
              {/* Direction */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">Direction</label>
                <div className="grid grid-cols-4 gap-2">
                  {directions.map(dir => (
                    <button
                      key={dir}
                      onClick={() => setAnimation(prev => ({ ...prev, direction: dir }))}
                      className={`
                        px-3 py-2 rounded text-sm capitalize
                        ${animation.direction === dir ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}
                      `}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Frame */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Frame: {animation.frame + 1}/{SPRITE_COLUMNS}
                </label>
                <input
                  type="range"
                  min={0}
                  max={SPRITE_COLUMNS - 1}
                  value={animation.frame}
                  onChange={(e) => setAnimation(prev => ({ 
                    ...prev, 
                    frame: parseInt(e.target.value),
                    playing: false 
                  }))}
                  className="w-full"
                />
              </div>
              
              {/* FPS */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  FPS: {animation.fps}
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={animation.fps}
                  onChange={(e) => setAnimation(prev => ({ 
                    ...prev, 
                    fps: parseInt(e.target.value) 
                  }))}
                  className="w-full"
                />
              </div>
              
              {/* Scale */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Scale: {scale}x
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={scale}
                  onChange={(e) => setScale(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              {/* Play/Pause */}
              <button
                onClick={() => setAnimation(prev => ({ ...prev, playing: !prev.playing }))}
                className={`
                  w-full px-4 py-2 rounded font-bold
                  ${animation.playing ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                `}
              >
                {animation.playing ? '⏸ Pause' : '▶ Play'}
              </button>
            </div>
          </div>
          
          {/* Spritesheet Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-bold mb-2">Spritesheet Specs</h2>
            <div className="text-sm text-gray-400 space-y-1">
              <div>Total Size: {SPRITESHEET_WIDTH}x{SPRITESHEET_HEIGHT}px</div>
              <div>Frame Size: {SPRITE_FRAME_WIDTH}x{SPRITE_FRAME_HEIGHT}px</div>
              <div>Grid: {SPRITE_COLUMNS} cols × {SPRITE_ROWS} rows</div>
              <div className="mt-2 text-xs">
                Row 1: South (toward viewer)<br/>
                Row 2: East (right)<br/>
                Row 3: West (left)<br/>
                Row 4: North (away)
              </div>
            </div>
          </div>
        </div>
        
        {/* Preview */}
        <div className="space-y-6">
          {/* Current Frame */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-bold mb-4">Current Frame</h2>
            <div 
              className="flex items-center justify-center p-4 rounded-lg"
              style={{
                backgroundImage: 'linear-gradient(45deg, #4a4a4a 25%, transparent 25%), linear-gradient(-45deg, #4a4a4a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #4a4a4a 75%), linear-gradient(-45deg, transparent 75%, #4a4a4a 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              }}
            >
              <canvas 
                ref={canvasRef}
                className="border border-gray-600"
              />
            </div>
          </div>
          
          {/* Full Spritesheet */}
          {spritesheet && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="font-bold mb-4">Full Spritesheet</h2>
              <div 
                className="overflow-auto p-4 rounded-lg"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #4a4a4a 25%, transparent 25%), linear-gradient(-45deg, #4a4a4a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #4a4a4a 75%), linear-gradient(-45deg, transparent 75%, #4a4a4a 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
              >
                <img 
                  src={spritesheetUrl}
                  alt="Spritesheet"
                  className="max-w-full"
                  style={{ 
                    imageRendering: 'pixelated',
                    transform: `scale(${Math.min(scale, 4)})`,
                    transformOrigin: 'top left',
                  }}
                />
              </div>
              
              {/* Grid overlay indicators */}
              <div className="mt-2 text-sm text-gray-400">
                <div className="flex gap-4">
                  <span>⬇️ South</span>
                  <span>➡️ East</span>
                  <span>⬅️ West</span>
                  <span>⬆️ North</span>
                </div>
              </div>
            </div>
          )}
          
          {!spritesheet && (
            <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
              Generate a test avatar or paste a spritesheet URL to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnimationPreview;
