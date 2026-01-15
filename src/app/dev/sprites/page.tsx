'use client';

/**
 * Dev Sprites Page - Access sprite preview and validation tools
 * 
 * Routes:
 * - /dev/sprites - Main sprite preview panel
 * - Tab navigation for different tools
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports to avoid SSR issues with canvas
const SpritePreviewPanel = dynamic(
  () => import('@/components/dev/SpritePreviewPanel'),
  { ssr: false, loading: () => <div className="p-8 text-white">Loading Sprite Preview...</div> }
);

const AnimationPreview = dynamic(
  () => import('@/components/dev/AnimationPreview'),
  { ssr: false, loading: () => <div className="p-8 text-white">Loading Animation Preview...</div> }
);

type Tab = 'sprites' | 'animations' | 'generator';

export default function DevSpritesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('sprites');

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🔒 Dev Tools</h1>
          <p className="text-gray-400">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('sprites')}
              className={`
                px-4 py-3 font-medium transition-colors
                ${activeTab === 'sprites' 
                  ? 'text-white border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white'}
              `}
            >
              🎨 Sprite Preview
            </button>
            <button
              onClick={() => setActiveTab('animations')}
              className={`
                px-4 py-3 font-medium transition-colors
                ${activeTab === 'animations' 
                  ? 'text-white border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white'}
              `}
            >
              🏃 Animations
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`
                px-4 py-3 font-medium transition-colors
                ${activeTab === 'generator' 
                  ? 'text-white border-b-2 border-blue-500' 
                  : 'text-gray-400 hover:text-white'}
              `}
            >
              ✨ Generator
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'sprites' && <SpritePreviewPanel />}
        {activeTab === 'animations' && <AnimationPreview />}
        {activeTab === 'generator' && (
          <div className="p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">✨ Sprite Generator</h2>
            <p className="text-gray-400 mb-4">
              Generate new sprites using Nano Banana (Gemini 2.5 Flash Image) API.
            </p>
            <p className="text-sm text-gray-500">
              Requires NEXT_PUBLIC_GEMINI_API_KEY environment variable.
            </p>
            <div className="mt-8 max-w-md mx-auto">
              <a 
                href="https://ai.google.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Get Gemini API Key →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
