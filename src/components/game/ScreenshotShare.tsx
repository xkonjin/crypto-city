'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Download, Share2, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Sardonic captions for sharing - Cobie style
const SHARE_CAPTIONS = [
  "Built different. Literally, with crypto buildings.",
  "My city's TVL is higher than your portfolio.",
  "Not financial advice, but this city slaps.",
  "The probability of this city rugging is... non-zero.",
  "Been stumbling through city building since 2024.",
  "If this city dumps, at least the buildings look cool.",
  "ngmi if you don't have a Uniswap building.",
  "This is the metagame now.",
  "Down bad? Build a city instead.",
  "The alpha is in the infrastructure spending.",
  "Wen leaderboard? Soon™",
  "My city survived three rug pulls. What about yours?",
];

interface ScreenshotShareProps {
  stats: {
    population: number;
    money: number;
    cityName: string;
  };
  cryptoStats?: {
    treasury: number;
    sentiment: number;
    buildingCount: number;
  };
}

export function ScreenshotShare({ stats, cryptoStats }: ScreenshotShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureScreenshot = useCallback(async () => {
    setIsCapturing(true);

    try {
      // Find all game canvases and composite them
      const canvases = document.querySelectorAll('canvas');
      if (canvases.length === 0) return null;

      // Find the main game canvas (largest one)
      let mainCanvas: HTMLCanvasElement | null = null;
      let maxArea = 0;
      canvases.forEach((c) => {
        const area = c.width * c.height;
        if (area > maxArea) {
          maxArea = area;
          mainCanvas = c as HTMLCanvasElement;
        }
      });

      if (!mainCanvas) return null;
      const targetCanvas = mainCanvas as HTMLCanvasElement;

      // Create a new canvas with overlay
      const overlayCanvas = document.createElement('canvas');
      const ctx = overlayCanvas.getContext('2d');
      if (!ctx) return null;

      // Set dimensions - use original canvas size
      const width = targetCanvas.width;
      const height = targetCanvas.height;
      overlayCanvas.width = width;
      overlayCanvas.height = height;

      // Draw all canvases in order (they stack on top of each other)
      canvases.forEach((c) => {
        if (c.width > 0 && c.height > 0) {
          ctx.drawImage(c, 0, 0);
        }
      });

      // Add gradient overlay at bottom for stats
      const gradient = ctx.createLinearGradient(0, height - 120, 0, height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - 120, width, 120);

      // Add stats text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      
      const padding = 20;
      const bottomY = height - 25;

      // City name
      ctx.fillText(stats.cityName || 'CryptoCity', padding, bottomY - 60);

      // Stats row
      ctx.font = '16px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#a1a1aa';
      
      let statsText = `Pop: ${formatNumber(stats.population)}`;
      if (cryptoStats) {
        statsText += ` • TVL: $${formatNumber(cryptoStats.treasury)}`;
        statsText += ` • Buildings: ${cryptoStats.buildingCount}`;
      }
      ctx.fillText(statsText, padding, bottomY - 30);

      // Branding
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('cryptocity.game', width - padding, bottomY - 30);

      // Convert to blob URL
      const dataUrl = overlayCanvas.toDataURL('image/png');
      setScreenshotUrl(dataUrl);
      
      // Pick a random caption
      const randomCaption = SHARE_CAPTIONS[Math.floor(Math.random() * SHARE_CAPTIONS.length)];
      setCaption(randomCaption);

      return dataUrl;
    } finally {
      setIsCapturing(false);
    }
  }, [stats, cryptoStats]);

  const handleOpenDialog = useCallback(async () => {
    setIsOpen(true);
    await captureScreenshot();
  }, [captureScreenshot]);

  const handleDownload = useCallback(() => {
    if (!screenshotUrl) return;
    
    const link = document.createElement('a');
    link.download = `cryptocity-${Date.now()}.png`;
    link.href = screenshotUrl;
    link.click();
  }, [screenshotUrl]);

  const handleCopyCaption = useCallback(async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [caption]);

  const handleShareTwitter = useCallback(() => {
    const text = encodeURIComponent(`${caption}\n\nBuilt with CryptoCity 🏙️`);
    const url = 'https://crypto-city.com';
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }, [caption]);

  const handleRefreshCaption = useCallback(() => {
    const randomCaption = SHARE_CAPTIONS[Math.floor(Math.random() * SHARE_CAPTIONS.length)];
    setCaption(randomCaption);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleOpenDialog}
        title="Share Screenshot"
        className="h-8 w-8"
        disabled={isCapturing}
      >
        <Camera className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Your City
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Screenshot Preview */}
            {screenshotUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img 
                  src={screenshotUrl} 
                  alt="City Screenshot" 
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Capturing...</span>
              </div>
            )}

            {/* Caption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Caption</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshCaption}
                  className="h-7 text-xs"
                >
                  🎲 Randomize
                </Button>
              </div>
              <div className="relative">
                <p className="p-3 bg-muted rounded-lg text-sm italic">
                  "{caption}"
                </p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCopyCaption}
                  className="absolute top-2 right-2 h-6 w-6"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1"
                disabled={!screenshotUrl}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={handleShareTwitter}
                className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8]"
                disabled={!screenshotUrl}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on X
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export default ScreenshotShare;
