/**
 * Screenshot Service
 * 
 * Handles city screenshot capture with stats overlay and sharing.
 * Key viral loop feature for social sharing.
 * 
 * Issue #152: Add one-click city screenshot sharing
 */

// =============================================================================
// TYPES
// =============================================================================

export interface CityStats {
  cityName: string;
  population: number;
  tvl: number;
  buildingCount: number;
  dailyYield: number;
  mayorName?: string;
}

export interface ScreenshotOptions {
  includeStats: boolean;
  quality: number; // 0-1
  format: 'png' | 'jpeg';
  fullCity: boolean;
}

export interface ShareOptions {
  platform: 'twitter' | 'clipboard' | 'download';
  caption?: string;
  hashtags?: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_OPTIONS: ScreenshotOptions = {
  includeStats: true,
  quality: 0.92,
  format: 'png',
  fullCity: true,
};

// Sardonic captions for Twitter sharing
const TWITTER_CAPTIONS = [
  "My crypto city has a ${tvl} TVL and only rugged twice this week 📈",
  "Built different. Literally, it's pixels. But still 🏗️",
  "Population: ${population}. Rug count: classified. 🤫",
  "When yield farming meets city planning 🌾🏙️",
  "This is what peak degenerate urbanism looks like 🎮",
  "I could touch grass, but I chose to build virtual buildings instead 🌱",
  "My city generates ${yield}/day. My real portfolio... let's not talk about it 📊",
];

// =============================================================================
// STATS OVERLAY
// =============================================================================

/**
 * Create a stats overlay canvas
 */
function createStatsOverlay(stats: CityStats, width: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const overlayHeight = 120;
  canvas.width = width;
  canvas.height = overlayHeight;
  
  const ctx = canvas.getContext('2d')!;
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, overlayHeight);
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
  gradient.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, overlayHeight);
  
  // Top border accent
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, width, 3);
  
  // City name
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  ctx.fillText(`🏙️ ${stats.cityName}`, 20, 20);
  
  // Stats row
  const statsY = 55;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  
  const statItems = [
    `Population: ${formatNumber(stats.population)}`,
    `TVL: $${formatNumber(stats.tvl)}`,
    `Buildings: ${stats.buildingCount}`,
    `Yield: +$${formatNumber(stats.dailyYield)}/day`,
  ];
  
  let xOffset = 20;
  for (const item of statItems) {
    ctx.fillText(item, xOffset, statsY);
    xOffset += ctx.measureText(item).width + 30;
  }
  
  // Footer with branding
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#64748b';
  const footer = stats.mayorName 
    ? `Built by ${stats.mayorName} • cryptocity.game`
    : 'cryptocity.game';
  ctx.fillText(footer, 20, 85);
  
  // Decorative elements
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width - 100, 20);
  ctx.lineTo(width - 20, 20);
  ctx.lineTo(width - 20, 100);
  ctx.stroke();
  
  return canvas;
}

/**
 * Format large numbers for display
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// =============================================================================
// SCREENSHOT CAPTURE
// =============================================================================

/**
 * Capture the game canvas as an image
 */
export async function captureGameCanvas(
  canvasElement: HTMLCanvasElement,
  stats: CityStats,
  options: Partial<ScreenshotOptions> = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create composite canvas
  const compositeCanvas = document.createElement('canvas');
  const overlayHeight = opts.includeStats ? 120 : 0;
  
  compositeCanvas.width = canvasElement.width;
  compositeCanvas.height = canvasElement.height + overlayHeight;
  
  const ctx = compositeCanvas.getContext('2d')!;
  
  // Draw game canvas
  ctx.drawImage(canvasElement, 0, overlayHeight);
  
  // Draw stats overlay if enabled
  if (opts.includeStats) {
    const overlay = createStatsOverlay(stats, canvasElement.width);
    ctx.drawImage(overlay, 0, 0);
  }
  
  // Convert to blob
  return new Promise((resolve, reject) => {
    compositeCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create screenshot blob'));
        }
      },
      `image/${opts.format}`,
      opts.quality
    );
  });
}

/**
 * Capture screenshot from multiple canvas layers
 */
export async function captureMultiLayerCanvas(
  canvasElements: HTMLCanvasElement[],
  stats: CityStats,
  options: Partial<ScreenshotOptions> = {}
): Promise<Blob> {
  if (canvasElements.length === 0) {
    throw new Error('No canvas elements provided');
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const firstCanvas = canvasElements[0];
  
  // Create composite canvas
  const compositeCanvas = document.createElement('canvas');
  const overlayHeight = opts.includeStats ? 120 : 0;
  
  compositeCanvas.width = firstCanvas.width;
  compositeCanvas.height = firstCanvas.height + overlayHeight;
  
  const ctx = compositeCanvas.getContext('2d')!;
  
  // Fill background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
  
  // Draw all canvas layers
  for (const canvas of canvasElements) {
    ctx.drawImage(canvas, 0, overlayHeight);
  }
  
  // Draw stats overlay if enabled
  if (opts.includeStats) {
    const overlay = createStatsOverlay(stats, firstCanvas.width);
    ctx.drawImage(overlay, 0, 0);
  }
  
  // Convert to blob
  return new Promise((resolve, reject) => {
    compositeCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create screenshot blob'));
        }
      },
      `image/${opts.format}`,
      opts.quality
    );
  });
}

// =============================================================================
// SHARING
// =============================================================================

/**
 * Copy screenshot to clipboard
 */
export async function copyToClipboard(blob: Blob): Promise<boolean> {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Download screenshot as file
 */
export function downloadScreenshot(blob: Blob, filename?: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `cryptocity-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate Twitter share URL
 */
export function generateTwitterShareUrl(
  stats: CityStats,
  options: Partial<ShareOptions> = {}
): string {
  // Pick a random caption template
  const template = options.caption || 
    TWITTER_CAPTIONS[Math.floor(Math.random() * TWITTER_CAPTIONS.length)];
  
  // Fill in template variables
  const caption = template
    .replace('${tvl}', `$${formatNumber(stats.tvl)}`)
    .replace('${population}', formatNumber(stats.population))
    .replace('${yield}', formatNumber(stats.dailyYield));
  
  // Build hashtags
  const hashtags = options.hashtags || ['CryptoCity', 'DeFi', 'GameFi'];
  
  // Encode and build URL
  const text = encodeURIComponent(caption);
  const hashtagStr = hashtags.join(',');
  
  return `https://twitter.com/intent/tweet?text=${text}&hashtags=${hashtagStr}`;
}

/**
 * Open Twitter share dialog
 */
export function shareToTwitter(stats: CityStats, options: Partial<ShareOptions> = {}): void {
  const url = generateTwitterShareUrl(stats, options);
  window.open(url, '_blank', 'width=550,height=420');
}

/**
 * Use Web Share API if available
 */
export async function nativeShare(
  blob: Blob,
  stats: CityStats,
  title?: string
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  
  try {
    const file = new File([blob], 'cryptocity-screenshot.png', { type: blob.type });
    
    if (!navigator.canShare({ files: [file] })) {
      return false;
    }
    
    await navigator.share({
      title: title || `My CryptoCity: ${stats.cityName}`,
      text: `Check out my city with $${formatNumber(stats.tvl)} TVL!`,
      files: [file],
    });
    
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Native share failed:', error);
    }
    return false;
  }
}

// =============================================================================
// MAIN SHARE FUNCTION
// =============================================================================

/**
 * Complete share flow with fallbacks
 */
export async function shareScreenshot(
  canvasElements: HTMLCanvasElement[],
  stats: CityStats,
  shareOptions: Partial<ShareOptions> = {}
): Promise<{ success: boolean; method: string }> {
  try {
    // Capture screenshot
    const blob = await captureMultiLayerCanvas(canvasElements, stats, {
      includeStats: true,
    });
    
    // Determine share method
    const platform = shareOptions.platform || 'clipboard';
    
    switch (platform) {
      case 'twitter':
        // For Twitter, download image and open share dialog
        downloadScreenshot(blob, `cryptocity-${stats.cityName}.png`);
        shareToTwitter(stats, shareOptions);
        return { success: true, method: 'twitter' };
        
      case 'download':
        downloadScreenshot(blob, `cryptocity-${stats.cityName}.png`);
        return { success: true, method: 'download' };
        
      case 'clipboard':
      default:
        // Try native share first on mobile
        if (typeof navigator !== 'undefined' && 'share' in navigator && /mobile/i.test(navigator.userAgent)) {
          const nativeSuccess = await nativeShare(blob, stats);
          if (nativeSuccess) {
            return { success: true, method: 'native' };
          }
        }
        
        // Fall back to clipboard
        const clipboardSuccess = await copyToClipboard(blob);
        return { 
          success: clipboardSuccess, 
          method: clipboardSuccess ? 'clipboard' : 'failed',
        };
    }
  } catch (error) {
    console.error('Screenshot share failed:', error);
    return { success: false, method: 'error' };
  }
}
