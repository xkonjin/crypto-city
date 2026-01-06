// =============================================================================
// NANOBANANA API SERVICE
// =============================================================================
// Integration with NanoBanana.ai API for generating crypto-themed building sprites.
// Uses AI image generation to create unique isometric building visuals.
//
// API Documentation: https://nanobnana.com/docs
//
// Usage:
// 1. Set NEXT_PUBLIC_NANOBANANA_API_KEY in .env.local
// 2. Call generateBuildingSprite() with building metadata
// 3. Generated images are cached for reuse
//
// Note: For procedural buildings, we use the BuildingGenerator as fallback.
// NanoBanana is reserved for landmark-quality unique sprites.

import { CryptoBuildingDefinition } from '../data/cryptoBuildings';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * NanoBanana API configuration
 */
interface NanoBananaConfig {
  apiKey: string;
  baseUrl: string;
  defaultSize: '1K' | '2K';
  defaultAspectRatio: '1:1' | '16:9' | '4:3';
  maxRetries: number;
  retryDelayMs: number;
}

/**
 * Default configuration - API key should be set via environment variable
 */
const DEFAULT_CONFIG: NanoBananaConfig = {
  apiKey: process.env.NEXT_PUBLIC_NANOBANANA_API_KEY || '',
  baseUrl: 'https://api.nanobnana.com/v2',
  defaultSize: '1K',
  defaultAspectRatio: '1:1',
  maxRetries: 3,
  retryDelayMs: 1000,
};

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Request payload for image generation
 */
interface GenerateImageRequest {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '4:3';
  image_size?: '1K' | '2K';
  style?: string;
  negative_prompt?: string;
}

/**
 * Response from image generation API
 */
interface GenerateImageResponse {
  success: boolean;
  image_url?: string;
  image_base64?: string;
  error?: string;
  request_id?: string;
}

/**
 * Cached sprite entry
 */
interface CachedSprite {
  buildingId: string;
  imageUrl: string;
  generatedAt: number;
  prompt: string;
}

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

/**
 * Base prompt template for isometric crypto buildings
 * Designed to match Pogicity's clean vector art style
 */
const BASE_PROMPT_TEMPLATE = `
Isometric pixel art building for a city builder game.
Clean vector style, vibrant colors, white background.
512x512 resolution, building centered at bottom.
South-facing view, isometric perspective at 26.57 degrees.
`;

/**
 * Category-specific prompt additions
 */
const CATEGORY_PROMPTS: Record<string, string> = {
  defi: 'Modern fintech building with digital screens, blockchain motifs, glowing accents. Futuristic but professional.',
  exchange: 'Corporate exchange building with trading floor aesthetic. Large windows, digital tickers, busy atmosphere.',
  chain: 'Blockchain ecosystem headquarters. Tech campus style, branded colors, innovation hub feeling.',
  ct: 'Content creator studio / influencer headquarters. Podcast equipment visible, social media aesthetic, modern loft style.',
  meme: 'Whimsical decorative element with crypto meme culture references. Fun, colorful, slightly absurd.',
};

/**
 * Protocol-specific prompt additions for famous buildings
 */
const PROTOCOL_PROMPTS: Record<string, string> = {
  aave: 'Ghost-themed building with purple-pink gradient. Lending vault aesthetic, ethereal glow.',
  uniswap: 'Pink unicorn-topped building. Liquidity pool motifs, rainbow accents, magical swap portal.',
  lido: 'Blue staking hub with water/wave themes. Liquid staking visualization, oceanic feeling.',
  curve: 'Curved architecture with blue spiraling design. Stablecoin pools, mathematical curves.',
  coinbase: 'Professional blue corporate tower with Coinbase-style branding. Institutional, regulated, trustworthy.',
  binance: 'Yellow/gold megaplex with BNB branding. Global exchange feel, massive scale.',
  ethereum: 'Purple diamond-shaped architecture. Octahedron references, ETH logo integration.',
  solana: 'Purple and green neon building. High-speed aesthetic, futuristic design.',
  bitcoin: 'Orange and gold fortress/citadel. Ancient temple meets digital gold vault.',
};

// =============================================================================
// NANOBANANA SERVICE CLASS
// =============================================================================

/**
 * Service for generating building sprites via NanoBanana API
 */
export class NanoBananaService {
  private config: NanoBananaConfig;
  private cache: Map<string, CachedSprite> = new Map();
  private pendingRequests: Map<string, Promise<string>> = new Map();
  
  constructor(config?: Partial<NanoBananaConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Load cache from localStorage if available
    if (typeof window !== 'undefined') {
      this.loadCache();
    }
  }
  
  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------
  
  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.apiKey.length > 10;
  }
  
  /**
   * Generate a sprite for a crypto building
   * Returns cached version if available, otherwise generates new
   *
   * @param building - The crypto building definition
   * @returns Promise resolving to image URL or data URL
   */
  async generateBuildingSprite(building: CryptoBuildingDefinition): Promise<string> {
    // Check cache first
    const cached = this.cache.get(building.id);
    if (cached) {
      console.log(`[NanoBanana] Cache hit for ${building.id}`);
      return cached.imageUrl;
    }
    
    // Check if request is already pending
    const pending = this.pendingRequests.get(building.id);
    if (pending) {
      console.log(`[NanoBanana] Waiting for pending request: ${building.id}`);
      return pending;
    }
    
    // Generate new sprite
    const promise = this.generateNewSprite(building);
    this.pendingRequests.set(building.id, promise);
    
    try {
      const result = await promise;
      this.pendingRequests.delete(building.id);
      return result;
    } catch (error) {
      this.pendingRequests.delete(building.id);
      throw error;
    }
  }
  
  /**
   * Generate sprites for multiple buildings in batch
   * Uses parallel requests with rate limiting
   *
   * @param buildings - Array of building definitions
   * @param concurrency - Max parallel requests (default: 3)
   * @returns Map of building IDs to image URLs
   */
  async batchGenerate(
    buildings: CryptoBuildingDefinition[],
    concurrency: number = 3
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Filter out already cached buildings
    const toGenerate = buildings.filter(b => !this.cache.has(b.id));
    
    // Add cached results immediately
    for (const building of buildings) {
      const cached = this.cache.get(building.id);
      if (cached) {
        results.set(building.id, cached.imageUrl);
      }
    }
    
    // Process remaining in batches
    for (let i = 0; i < toGenerate.length; i += concurrency) {
      const batch = toGenerate.slice(i, i + concurrency);
      const promises = batch.map(async building => {
        try {
          const url = await this.generateBuildingSprite(building);
          results.set(building.id, url);
        } catch (error) {
          console.error(`[NanoBanana] Failed to generate ${building.id}:`, error);
        }
      });
      
      await Promise.all(promises);
      
      // Small delay between batches to avoid rate limiting
      if (i + concurrency < toGenerate.length) {
        await this.delay(500);
      }
    }
    
    return results;
  }
  
  /**
   * Generate a custom sprite from a text prompt
   *
   * @param prompt - Custom prompt for image generation
   * @param options - Optional generation parameters
   * @returns Promise resolving to image URL
   */
  async generateCustomSprite(
    prompt: string,
    options?: {
      aspectRatio?: '1:1' | '16:9' | '4:3';
      size?: '1K' | '2K';
      style?: string;
    }
  ): Promise<string> {
    const fullPrompt = `${BASE_PROMPT_TEMPLATE}\n${prompt}`;
    
    const response = await this.callApi({
      prompt: fullPrompt,
      aspect_ratio: options?.aspectRatio || this.config.defaultAspectRatio,
      image_size: options?.size || this.config.defaultSize,
      style: options?.style || 'isometric pixel art',
    });
    
    if (!response.success || !response.image_url) {
      throw new Error(response.error || 'Failed to generate image');
    }
    
    return response.image_url;
  }
  
  /**
   * Clear the sprite cache
   */
  clearCache(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nanobanana_sprite_cache');
    }
    console.log('[NanoBanana] Cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
  
  // ---------------------------------------------------------------------------
  // PRIVATE METHODS
  // ---------------------------------------------------------------------------
  
  /**
   * Generate a new sprite for a building
   */
  private async generateNewSprite(building: CryptoBuildingDefinition): Promise<string> {
    console.log(`[NanoBanana] Generating sprite for ${building.id}...`);
    
    // Build the prompt
    const prompt = this.buildPrompt(building);
    
    // Call API with retries
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.callApi({
          prompt,
          aspect_ratio: this.config.defaultAspectRatio,
          image_size: this.config.defaultSize,
          style: 'isometric pixel art city builder game',
          negative_prompt: 'blurry, low quality, watermark, text, realistic, photographic, 3D render',
        });
        
        if (response.success && (response.image_url || response.image_base64)) {
          const imageUrl = response.image_url || `data:image/png;base64,${response.image_base64}`;
          
          // Cache the result
          this.cacheSprite(building.id, imageUrl, prompt);
          
          console.log(`[NanoBanana] Generated ${building.id} successfully`);
          return imageUrl;
        }
        
        throw new Error(response.error || 'Generation failed');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[NanoBanana] Attempt ${attempt} failed for ${building.id}:`, lastError.message);
        
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }
    
    throw new Error(`Failed to generate sprite for ${building.id} after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }
  
  /**
   * Build a detailed prompt for a building
   */
  private buildPrompt(building: CryptoBuildingDefinition): string {
    const parts: string[] = [BASE_PROMPT_TEMPLATE.trim()];
    
    // Add building name and description
    parts.push(`Building: ${building.name}`);
    if (building.crypto.description) {
      parts.push(`Description: ${building.crypto.description}`);
    }
    
    // Add category-specific prompt
    const categoryPrompt = CATEGORY_PROMPTS[building.category];
    if (categoryPrompt) {
      parts.push(categoryPrompt);
    }
    
    // Add protocol-specific prompt if available
    if (building.crypto.protocol) {
      const protocolKey = building.crypto.protocol.toLowerCase();
      const protocolPrompt = PROTOCOL_PROMPTS[protocolKey];
      if (protocolPrompt) {
        parts.push(protocolPrompt);
      }
    }
    
    // Add chain-specific color hints
    if (building.crypto.chain) {
      parts.push(`Color scheme inspired by ${building.crypto.chain} blockchain branding.`);
    }
    
    // Add tier-specific details
    const tierDetails: Record<string, string> = {
      institution: 'Large, impressive, corporate. Multiple floors, glass and steel.',
      whale: 'Substantial building, professional but not massive. High-end design.',
      retail: 'Medium-sized, accessible, welcoming. Modern storefront aesthetic.',
      degen: 'Quirky, colorful, slightly chaotic. Neon signs, unconventional design.',
    };
    parts.push(tierDetails[building.crypto.tier]);
    
    // Add footprint information
    parts.push(`Building footprint: ${building.footprint.width}x${building.footprint.height} grid cells.`);
    
    return parts.join('\n');
  }
  
  /**
   * Make API call to NanoBanana
   */
  private async callApi(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'NanoBanana API key not configured. Set NEXT_PUBLIC_NANOBANANA_API_KEY in .env.local',
      };
    }
    
    try {
      const response = await fetch(`${this.config.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `API error ${response.status}: ${errorText}`,
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        image_url: data.image_url || data.url,
        image_base64: data.image_base64 || data.base64,
        request_id: data.request_id || data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  
  /**
   * Cache a generated sprite
   */
  private cacheSprite(buildingId: string, imageUrl: string, prompt: string): void {
    const entry: CachedSprite = {
      buildingId,
      imageUrl,
      generatedAt: Date.now(),
      prompt,
    };
    
    this.cache.set(buildingId, entry);
    this.saveCache();
  }
  
  /**
   * Load cache from localStorage
   */
  private loadCache(): void {
    try {
      const stored = localStorage.getItem('nanobanana_sprite_cache');
      if (stored) {
        const entries: CachedSprite[] = JSON.parse(stored);
        for (const entry of entries) {
          // Only load entries less than 7 days old
          if (Date.now() - entry.generatedAt < 7 * 24 * 60 * 60 * 1000) {
            this.cache.set(entry.buildingId, entry);
          }
        }
        console.log(`[NanoBanana] Loaded ${this.cache.size} cached sprites`);
      }
    } catch (error) {
      console.warn('[NanoBanana] Failed to load cache:', error);
    }
  }
  
  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    try {
      const entries = Array.from(this.cache.values());
      localStorage.setItem('nanobanana_sprite_cache', JSON.stringify(entries));
    } catch (error) {
      console.warn('[NanoBanana] Failed to save cache:', error);
    }
  }
  
  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let serviceInstance: NanoBananaService | null = null;

/**
 * Get the singleton NanoBanana service instance
 */
export function getNanoBananaService(): NanoBananaService {
  if (!serviceInstance) {
    serviceInstance = new NanoBananaService();
  }
  return serviceInstance;
}

/**
 * Initialize the service with custom configuration
 */
export function initNanoBananaService(config: Partial<NanoBananaConfig>): NanoBananaService {
  serviceInstance = new NanoBananaService(config);
  return serviceInstance;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate sprites for all landmark-tier buildings
 * These are the buildings that benefit most from unique AI art
 */
export async function generateLandmarkSprites(
  buildings: CryptoBuildingDefinition[]
): Promise<Map<string, string>> {
  const service = getNanoBananaService();
  
  // Filter to institution and whale tier buildings
  const landmarks = buildings.filter(
    b => b.crypto.tier === 'institution' || b.crypto.tier === 'whale'
  );
  
  console.log(`[NanoBanana] Generating sprites for ${landmarks.length} landmark buildings...`);
  
  return service.batchGenerate(landmarks, 2);
}

/**
 * Check if API is available and configured
 */
export function isNanoBananaAvailable(): boolean {
  const service = getNanoBananaService();
  return service.isConfigured();
}

