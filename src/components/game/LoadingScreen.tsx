'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { preloadCriticalAssets, preloadCryptoAssets, PreloadProgress } from '@/lib/assetPreloader';

interface LoadingScreenProps {
  onComplete: () => void;
}

// Crypto-themed loading messages
const LOADING_MESSAGES = [
  'Syncing blockchain...',
  'Loading DeFi protocols...',
  'Connecting to nodes...',
  'Initializing smart contracts...',
  'Fetching market data...',
  'Staking assets...',
  'Building your empire...',
  'WAGMI...',
  'Preparing rug protection...',
  'Compiling yield strategies...',
];

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState<PreloadProgress>({
    total: 0,
    loaded: 0,
    failed: [],
    currentAsset: '',
    percentage: 0,
  });
  const [message, setMessage] = useState(LOADING_MESSAGES[0]);
  const [phase, setPhase] = useState<'critical' | 'crypto' | 'done'>('critical');

  // Rotate loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleProgress = useCallback((p: PreloadProgress) => {
    setProgress(p);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAssets() {
      try {
        // Phase 1: Load critical assets (blocking)
        setPhase('critical');
        await preloadCriticalAssets(handleProgress);
        
        if (!mounted) return;
        
        // Phase 2: Start loading crypto assets in background
        setPhase('crypto');
        
        // Don't wait for crypto assets - let game start
        preloadCryptoAssets(handleProgress).catch(console.error);
        
        // Small delay for visual feedback then complete
        setTimeout(() => {
          if (mounted) {
            setPhase('done');
            onComplete();
          }
        }, 500);
        
      } catch (error) {
        console.error('Asset loading failed:', error);
        // Still complete even if some assets fail - game has fallbacks
        if (mounted) {
          setPhase('done');
          onComplete();
        }
      }
    }

    loadAssets();

    return () => {
      mounted = false;
    };
  }, [onComplete, handleProgress]);

  return (
    <div 
      data-testid="loading-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold">
          <span className="text-orange-500">CRYPTO</span>
          <span className="text-white">CITY</span>
        </h1>
        <p className="mt-2 text-gray-400">Build Your DeFi Empire</p>
      </div>

      {/* Progress Bar */}
      <div className="w-80 mb-4">
        <div 
          data-testid="loading-progress"
          className="h-2 bg-gray-700 rounded-full overflow-hidden"
        >
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-sm text-gray-500">
          <span>{progress.loaded} / {progress.total || '...'}</span>
          <span>{progress.percentage}%</span>
        </div>
      </div>

      {/* Loading Message */}
      <p 
        data-testid="loading-message"
        className="text-gray-400 text-sm animate-pulse"
      >
        {message}
      </p>

      {/* Current Asset */}
      <p className="mt-2 text-gray-600 text-xs max-w-xs truncate">
        {progress.currentAsset || 'Preparing...'}
      </p>

      {/* Phase Indicator */}
      <div className="mt-6 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${phase === 'critical' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
        <span className="text-xs text-gray-500">
          {phase === 'critical' ? 'Loading core assets...' : 
           phase === 'crypto' ? 'Loading crypto buildings...' : 
           'Ready!'}
        </span>
      </div>

      {/* Failed Assets Warning */}
      {progress.failed.length > 0 && (
        <p className="mt-4 text-xs text-yellow-500">
          ⚠️ {progress.failed.length} asset{progress.failed.length > 1 ? 's' : ''} failed to load
        </p>
      )}
    </div>
  );
}
