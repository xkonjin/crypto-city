// =============================================================================
// NANOBANANA API SERVICE
// =============================================================================
// Unified service for generating crypto-themed building sprites.
// Uses Google Gemini (primary) with NanoBanana API as fallback.
//
// Architecture:
// 1. Check for Gemini API key -> Use Gemini for generation
// 2. Fallback to NanoBanana API if configured
// 3. Return error if neither is configured
//
// Usage:
// 1. Set NEXT_PUBLIC_GEMINI_API_KEY in .env.local (preferred)
// 2. Optionally set NEXT_PUBLIC_NANOBANANA_API_KEY as fallback
// 3. Call generateBuildingSprite() with building metadata
// 4. Generated images are cached for reuse

import { CryptoBuildingDefinition } from '../data/cryptoBuildings';
import { 
  getGeminiImageService, 
  isGeminiImageAvailable,
  NEGATIVE_PROMPT,
  PROTOCOL_COLORS,
} from './geminiImage';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * NanoBanana API configuration (fallback provider)
 * Primary generation is now handled by Gemini
 */
interface NanoBananaConfig {
  // NanoBanana API key (fallback)
  apiKey: string;
  // NanoBanana API base URL
  baseUrl: string;
  // Default image size
  defaultSize: '1K' | '2K';
  // Default aspect ratio
  defaultAspectRatio: '1:1' | '16:9' | '4:3';
  // Maximum retry attempts
  maxRetries: number;
  // Delay between retries in milliseconds
  retryDelayMs: number;
  // Whether to prefer Gemini over NanoBanana
  preferGemini: boolean;
}

/**
 * Default configuration - Gemini is preferred, NanoBanana as fallback
 */
const DEFAULT_CONFIG: NanoBananaConfig = {
  apiKey: process.env.NEXT_PUBLIC_NANOBANANA_API_KEY || '',
  baseUrl: 'https://api.nanobnana.com/v2',
  defaultSize: '2K',
  defaultAspectRatio: '1:1',
  maxRetries: 3,
  retryDelayMs: 1000,
  preferGemini: true,
};

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Request payload for NanoBanana API image generation
 */
interface GenerateImageRequest {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '4:3';
  image_size?: '1K' | '2K';
  style?: string;
  negative_prompt?: string;
}

/**
 * Response from image generation (unified format)
 */
interface GenerateImageResponse {
  success: boolean;
  image_url?: string;
  image_base64?: string;
  error?: string;
  request_id?: string;
  // Which backend was used
  backend?: 'gemini' | 'nanobanana' | 'none';
}

/**
 * Cached sprite entry with metadata
 */
interface CachedSprite {
  buildingId: string;
  imageUrl: string;
  generatedAt: number;
  prompt: string;
  // Track which backend generated this sprite
  backend: 'gemini' | 'nanobanana';
}

// =============================================================================
// IMPROVED PROMPT TEMPLATES
// =============================================================================
// Updated to match the analyzed partner building art style:
// - Clean vector/flat illustration (NOT pixel art)
// - Transparent PNG backgrounds
// - Dark slate gray base platforms with soft shadows
// - Bold, saturated brand colors

/**
 * Base prompt template for isometric crypto buildings.
 * Matches the existing partner building art style exactly.
 * 
 * Key characteristics from analyzed sprites:
 * - Clean vector illustration, NOT pixel art
 * - Transparent background
 * - Dark slate gray base platform
 * - Soft drop shadow
 * - Bold saturated colors
 * - Modern geometric architecture
 */
const BASE_PROMPT_TEMPLATE = `
High-quality clean vector isometric building illustration for a city builder game.
Flat design style with bold saturated colors and crisp edges.
Transparent PNG background.
South-facing isometric view at approximately 30 degree angle.
Building sits on a dark slate gray hexagonal or rectangular base platform.
Soft drop shadow underneath the base platform.
Modern geometric architecture with clean black outlines.
Minimal but impactful details, no complex textures or gradients.
Building centered in frame, filling most of the 1024x1024 canvas.
Maximum quality professional game asset, suitable for a crypto/DeFi themed city.
Sharp details and precise linework.
`.trim();

/**
 * Category-specific prompt additions for different building types.
 * Each category has distinct architectural characteristics.
 */
const CATEGORY_PROMPTS: Record<string, string> = {
  // DeFi protocol buildings - modern fintech aesthetic
  defi: `
Modern fintech building with clean geometric design.
Subtle digital/blockchain motifs integrated into architecture.
Glowing accent lines or windows suggesting activity.
Professional yet futuristic appearance.
  `.trim(),
  
  // Exchange buildings - corporate trading aesthetic
  exchange: `
Corporate exchange headquarters with impressive presence.
Large glass windows suggesting transparency.
Trading floor aesthetic with digital ticker elements.
Institutional, regulated, trustworthy appearance.
  `.trim(),
  
  // Blockchain ecosystem headquarters
  chain: `
Blockchain ecosystem headquarters building.
Tech campus style with innovation hub feeling.
Branded colors prominently featured.
Represents the chain's identity and values.
  `.trim(),
  
  // Crypto Twitter / influencer buildings
  ct: `
Content creator studio or influencer headquarters.
Modern loft style with creative aesthetic.
Social media and podcast elements visible.
Contemporary, trendy, influential appearance.
  `.trim(),
  
  // Meme culture decorative elements
  meme: `
Whimsical decorative element with crypto meme culture references.
Fun, colorful, slightly playful design.
Could reference famous crypto memes or culture.
Lighthearted but still maintains quality aesthetic.
  `.trim(),
  
  // Plasma partner buildings
  plasma: `
Modern fintech building for stablecoin infrastructure.
Clean, professional, trustworthy appearance.
Emphasizes stability and reliability.
Teal and green color accents.
  `.trim(),
};

/**
 * Protocol-specific prompt additions for famous DeFi protocols.
 * These include brand colors and thematic elements matching each protocol.
 */
const PROTOCOL_PROMPTS: Record<string, string> = {
  // DeFi Protocols
  aave: 'Teal and cyan building with ghost motifs. Purple accents. Lending vault aesthetic with ethereal glow elements.',
  uniswap: 'Pink and magenta building with unicorn theme. Liquidity pool visual motifs. Rainbow accents.',
  lido: 'Ocean blue and turquoise building with water wave themes. Liquid staking visualization.',
  curve: 'Blue building with curved/spiral architectural elements. Mathematical, stablecoin aesthetic.',
  makerdao: 'Green and gold building with classical governance aesthetic. DAI stablecoin theme.',
  compound: 'Green corporate building with modern algorithmic design. Professional lending aesthetic.',
  yearn: 'Blue and teal laboratory-style building. Yield aggregation theme with scientific elements.',
  pendle: 'Purple and blue building with time/clock motifs. Yield trading theme.',
  eigenlayer: 'Purple and violet building with layered geometric shapes. Restaking visualization.',
  morpho: 'Teal blue building with butterfly wing motifs. Lending optimization theme.',
  gmx: 'Blue and purple building with trading chart elements. Perpetuals trading aesthetic.',
  hyperliquid: 'Neon purple and electric blue futuristic building. High-speed trading theme.',
  
  // Exchanges
  coinbase: 'Blue corporate tower with Coinbase branding style. Institutional, regulated, trustworthy.',
  binance: 'Yellow and gold megaplex with black accents. Global exchange feel, massive scale.',
  kraken: 'Purple building with octopus/sea creature motifs. Security-focused design.',
  ftx: 'Damaged/ruined building structure. Gray and muted colors. Memorial/cautionary aesthetic.',
  dydx: 'Purple gradient building with decentralized trading floor aesthetic.',
  jupiter: 'Orange and cosmic purple building with planetary/space theme.',
  bybit: 'Orange and black sleek trading building design.',
  
  // Blockchain Ecosystems
  ethereum: 'Purple and silver building with diamond/octahedron architectural shapes. ETH logo integration.',
  solana: 'Purple and green gradient building with speed lines. High-performance futuristic design.',
  base: 'Blue gradient building matching Coinbase L2 branding. Onchain summer aesthetic.',
  arbitrum: 'Blue building with angular geometric shapes. Optimistic rollup theme.',
  optimism: 'Red and pink building with optimistic, positive vibes. Public goods aesthetic.',
  polygon: 'Purple building with hexagon patterns. Scaling solution theme.',
  avalanche: 'Red building with triangle motifs and subtle snow elements. Fast finality theme.',
  bitcoin: 'Orange and gold fortress/citadel style. Ancient temple meets digital gold vault. Maximum prestige.',
  
  // Plasma Partners
  tether: 'Green building with USDT stablecoin branding. Stability and trust theme.',
  ethena: 'Green building with synthetic dollar aesthetic. Modern DeFi design.',
  etherfi: 'Purple blue building with staking node visualization.',
  robinhood: 'Green building with feather motifs. Retail trading theme.',
  trustwallet: 'Blue building with shield/security motifs. Multi-chain wallet theme.',
  
  // CT Culture
  uponly: 'Podcast studio building with modern media aesthetic.',
  gcr: 'Observatory-style building for market watching. Mysterious, legendary trader theme.',
  bankless: 'Building with crypto education and media theme. Ethereum-focused.',
  defillama: 'Building with llama motifs and data visualization elements.',
};

/**
 * Tier-specific architectural descriptions.
 * Determines the size, impressiveness, and detail level of buildings.
 */
const TIER_DETAILS: Record<string, string> = {
  institution: 'Massive impressive skyscraper, corporate headquarters style, multiple sections, antenna or crown on top, 8+ floors, very detailed with multiple architectural elements.',
  whale: 'Large professional building, high-end modern design, significant street presence, 5-8 floors, quality materials suggested.',
  shark: 'Medium-large building with professional appearance, 3-5 floors, modern commercial design.',
  retail: 'Medium-sized accessible building, welcoming storefront, 2-4 floors, modern but approachable aesthetic.',
  fish: 'Small but charming building, 1-2 floors, boutique aesthetic, compact footprint.',
  degen: 'Quirky colorful building with neon signs, unconventional design, 2-4 floors, slightly chaotic but fun.',
};

// =============================================================================
// NANOBANANA SERVICE CLASS
// =============================================================================

/**
 * Unified service for generating building sprites.
 * Uses Gemini as primary backend with NanoBanana as fallback.
 * 
 * Features:
 * - Automatic backend selection (Gemini preferred)
 * - Local caching with 7-day expiry
 * - Batch generation with rate limiting
 * - Retry logic for transient failures
 * - Art style-matched prompts
 */
export class NanoBananaService {
  // Service configuration
  private config: NanoBananaConfig;
  // Sprite cache (persisted to localStorage)
  private cache: Map<string, CachedSprite> = new Map();
  // Pending requests to prevent duplicate generations
  private pendingRequests: Map<string, Promise<string>> = new Map();
  
  /**
   * Create a new NanoBananaService instance.
   * 
   * @param config - Optional configuration overrides
   */
  constructor(config?: Partial<NanoBananaConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Load cache from localStorage if available (browser only)
    if (typeof window !== 'undefined') {
      this.loadCache();
    }
  }
  
  // ---------------------------------------------------------------------------
  // PUBLIC METHODS
  // ---------------------------------------------------------------------------
  
  /**
   * Check if any image generation backend is properly configured.
   * Returns true if either Gemini or NanoBanana is available.
   * 
   * @returns true if sprite generation is possible
   */
  isConfigured(): boolean {
    // Check Gemini first (preferred)
    if (this.config.preferGemini && isGeminiImageAvailable()) {
      return true;
    }
    // Fall back to NanoBanana API key check
    return !!this.config.apiKey && this.config.apiKey.length > 10;
  }
  
  /**
   * Get which backend will be used for generation.
   * 
   * @returns 'gemini', 'nanobanana', or 'none'
   */
  getActiveBackend(): 'gemini' | 'nanobanana' | 'none' {
    if (this.config.preferGemini && isGeminiImageAvailable()) {
      return 'gemini';
    }
    if (this.config.apiKey && this.config.apiKey.length > 10) {
      return 'nanobanana';
    }
    return 'none';
  }
  
  /**
   * Generate a sprite for a crypto building.
   * Returns cached version if available, otherwise generates new.
   * Uses Gemini as primary backend with NanoBanana as fallback.
   *
   * @param building - The crypto building definition
   * @returns Promise resolving to image URL or data URL
   * 
   * @example
   * ```typescript
   * const service = getNanoBananaService();
   * const imageUrl = await service.generateBuildingSprite(DEFI_BUILDINGS['aave-lending-tower']);
   * ```
   */
  async generateBuildingSprite(building: CryptoBuildingDefinition): Promise<string> {
    // Check cache first - return immediately if cached
    const cached = this.cache.get(building.id);
    if (cached) {
      console.log(`[NanoBanana] Cache hit for ${building.id} (${cached.backend})`);
      return cached.imageUrl;
    }
    
    // Check if request is already pending (prevent duplicate generations)
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
   * Generate sprites for multiple buildings in batch.
   * Uses parallel requests with rate limiting to avoid API throttling.
   *
   * @param buildings - Array of building definitions
   * @param concurrency - Max parallel requests (default: 2 for Gemini rate limits)
   * @returns Map of building IDs to image URLs
   * 
   * @example
   * ```typescript
   * const sprites = await service.batchGenerate(Object.values(DEFI_BUILDINGS), 2);
   * sprites.forEach((url, id) => console.log(`${id}: ${url}`));
   * ```
   */
  async batchGenerate(
    buildings: CryptoBuildingDefinition[],
    concurrency: number = 2
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
    
    console.log(`[NanoBanana] Batch: ${toGenerate.length} to generate, ${results.size} cached`);
    
    // Process remaining in batches
    for (let i = 0; i < toGenerate.length; i += concurrency) {
      const batch = toGenerate.slice(i, i + concurrency);
      const batchNum = Math.floor(i / concurrency) + 1;
      const totalBatches = Math.ceil(toGenerate.length / concurrency);
      
      console.log(`[NanoBanana] Processing batch ${batchNum}/${totalBatches}...`);
      
      const promises = batch.map(async building => {
        try {
          const url = await this.generateBuildingSprite(building);
          results.set(building.id, url);
        } catch (error) {
          console.error(`[NanoBanana] Failed to generate ${building.id}:`, error);
        }
      });
      
      await Promise.all(promises);
      
      // Delay between batches to avoid rate limiting
      if (i + concurrency < toGenerate.length) {
        const delayMs = this.getActiveBackend() === 'gemini' ? 1000 : 500;
        await this.delay(delayMs);
      }
    }
    
    return results;
  }
  
  /**
   * Generate a custom sprite from a text prompt.
   * Useful for one-off generation or testing.
   *
   * @param prompt - Custom prompt for image generation
   * @param options - Optional generation parameters
   * @returns Promise resolving to image URL or data URL
   */
  async generateCustomSprite(
    prompt: string,
    options?: {
      aspectRatio?: '1:1' | '16:9' | '4:3';
      size?: '1K' | '2K';
      style?: string;
    }
  ): Promise<string> {
    const fullPrompt = `${BASE_PROMPT_TEMPLATE}\n\n${prompt}`;
    
    // Try Gemini first
    if (this.config.preferGemini && isGeminiImageAvailable()) {
      const gemini = getGeminiImageService();
      const result = await gemini.generateImage({
        prompt: fullPrompt,
        style: options?.style,
        negativePrompt: NEGATIVE_PROMPT,
      });
      
      if (result.success && result.imageDataUrl) {
        return result.imageDataUrl;
      }
      
      console.warn('[NanoBanana] Gemini failed, falling back to NanoBanana API');
    }
    
    // Fall back to NanoBanana API
    const response = await this.callNanoBananaApi({
      prompt: fullPrompt,
      aspect_ratio: options?.aspectRatio || this.config.defaultAspectRatio,
      image_size: options?.size || this.config.defaultSize,
      style: options?.style || 'isometric vector illustration',
      negative_prompt: NEGATIVE_PROMPT,
    });
    
    if (!response.success || (!response.image_url && !response.image_base64)) {
      throw new Error(response.error || 'Failed to generate image');
    }
    
    return response.image_url || `data:image/png;base64,${response.image_base64}`;
  }
  
  /**
   * Clear the sprite cache.
   * Forces regeneration of all sprites on next request.
   */
  clearCache(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nanobanana_sprite_cache');
    }
    console.log('[NanoBanana] Cache cleared');
  }
  
  /**
   * Get cache statistics for debugging.
   * 
   * @returns Object with cache size and entry IDs
   */
  getCacheStats(): { 
    size: number; 
    entries: string[]; 
    byBackend: { gemini: number; nanobanana: number };
  } {
    let geminiCount = 0;
    let nanobananaCount = 0;
    
    // Convert to array first for ES5 compatibility
    const cacheEntries = Array.from(this.cache.values());
    for (const entry of cacheEntries) {
      if (entry.backend === 'gemini') geminiCount++;
      else nanobananaCount++;
    }
    
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      byBackend: { gemini: geminiCount, nanobanana: nanobananaCount },
    };
  }
  
  // ---------------------------------------------------------------------------
  // PRIVATE METHODS
  // ---------------------------------------------------------------------------
  
  /**
   * Generate a new sprite for a building using the best available backend.
   * Tries Gemini first, falls back to NanoBanana API.
   * 
   * @param building - Building definition to generate sprite for
   * @returns Promise resolving to image URL
   */
  private async generateNewSprite(building: CryptoBuildingDefinition): Promise<string> {
    const backend = this.getActiveBackend();
    console.log(`[NanoBanana] Generating sprite for ${building.id} using ${backend}...`);
    
    // Build the prompt
    const prompt = this.buildPrompt(building);
    
    // Try Gemini first if preferred and available
    if (backend === 'gemini') {
      try {
        const result = await this.generateWithGemini(building, prompt);
        if (result) {
          return result;
        }
      } catch (error) {
        console.warn(`[NanoBanana] Gemini failed for ${building.id}, trying fallback...`, error);
      }
    }
    
    // Fall back to NanoBanana API
    if (this.config.apiKey && this.config.apiKey.length > 10) {
      return this.generateWithNanoBanana(building, prompt);
    }
    
    throw new Error(`No image generation backend available for ${building.id}`);
  }
  
  /**
   * Generate sprite using Gemini API.
   * 
   * @param building - Building definition
   * @param prompt - Pre-built prompt
   * @returns Image data URL or null if failed
   */
  private async generateWithGemini(
    building: CryptoBuildingDefinition, 
    prompt: string
  ): Promise<string | null> {
    const gemini = getGeminiImageService();
    
    // Get protocol for color palette
    const protocol = building.crypto.protocol?.toLowerCase() || 'default';
    
    const result = await gemini.generateImage({
      prompt,
      style: protocol,
      negativePrompt: NEGATIVE_PROMPT,
    });
    
    if (result.success && result.imageDataUrl) {
      // Cache the result
      this.cacheSprite(building.id, result.imageDataUrl, prompt, 'gemini');
      console.log(`[NanoBanana] Generated ${building.id} with Gemini in ${result.generationTimeMs}ms`);
      return result.imageDataUrl;
    }
    
    console.warn(`[NanoBanana] Gemini generation failed for ${building.id}:`, result.error);
    return null;
  }
  
  /**
   * Generate sprite using NanoBanana API (fallback).
   * 
   * @param building - Building definition
   * @param prompt - Pre-built prompt
   * @returns Image URL or data URL
   */
  private async generateWithNanoBanana(
    building: CryptoBuildingDefinition, 
    prompt: string
  ): Promise<string> {
    // Call API with retries
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.callNanoBananaApi({
          prompt,
          aspect_ratio: this.config.defaultAspectRatio,
          image_size: this.config.defaultSize,
          style: 'isometric vector illustration city builder game',
          negative_prompt: NEGATIVE_PROMPT,
        });
        
        if (response.success && (response.image_url || response.image_base64)) {
          const imageUrl = response.image_url || `data:image/png;base64,${response.image_base64}`;
          
          // Cache the result
          this.cacheSprite(building.id, imageUrl, prompt, 'nanobanana');
          
          console.log(`[NanoBanana] Generated ${building.id} with NanoBanana API`);
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
   * Build a detailed prompt for a building.
   * Combines base style template with building-specific details.
   * 
   * @param building - Building definition
   * @returns Complete prompt string
   */
  private buildPrompt(building: CryptoBuildingDefinition): string {
    const parts: string[] = [BASE_PROMPT_TEMPLATE];
    
    // Add building name and description
    parts.push(`\nBuilding: ${building.name}`);
    if (building.crypto.description) {
      parts.push(`Description: ${building.crypto.description}`);
    }
    
    // Add category-specific prompt
    const categoryPrompt = CATEGORY_PROMPTS[building.category];
    if (categoryPrompt) {
      parts.push(`\nCategory style:\n${categoryPrompt}`);
    }
    
    // Add protocol-specific prompt if available
    if (building.crypto.protocol) {
      const protocolKey = building.crypto.protocol.toLowerCase();
      const protocolPrompt = PROTOCOL_PROMPTS[protocolKey];
      if (protocolPrompt) {
        parts.push(`\nProtocol theme: ${protocolPrompt}`);
      }
      
      // Also add color from the shared palette
      const protocolColors = PROTOCOL_COLORS[protocolKey];
      if (protocolColors) {
        parts.push(`Color palette: ${protocolColors}`);
      }
    }
    
    // Add chain-specific color hints
    if (building.crypto.chain) {
      const chainColors = PROTOCOL_COLORS[building.crypto.chain.toLowerCase()];
      if (chainColors) {
        parts.push(`Chain branding colors: ${chainColors}`);
      } else {
        parts.push(`Color scheme inspired by ${building.crypto.chain} blockchain branding.`);
      }
    }
    
    // Add tier-specific details
    const tierDesc = TIER_DETAILS[building.crypto.tier] || TIER_DETAILS.retail;
    parts.push(`\nBuilding tier: ${tierDesc}`);
    
    // Add footprint information for scale reference
    parts.push(`Building footprint: ${building.footprint.width}x${building.footprint.height} grid cells.`);
    
    // Add the negative prompt
    parts.push(`\nAvoid: ${NEGATIVE_PROMPT}`);
    
    return parts.join('\n');
  }
  
  /**
   * Make API call to NanoBanana (fallback provider).
   * 
   * @param request - Generation request parameters
   * @returns API response
   */
  private async callNanoBananaApi(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    // Check if API key is configured
    if (!this.config.apiKey || this.config.apiKey.length < 10) {
      return {
        success: false,
        error: 'NanoBanana API key not configured. Set NEXT_PUBLIC_NANOBANANA_API_KEY in .env.local',
        backend: 'nanobanana',
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
          backend: 'nanobanana',
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        image_url: data.image_url || data.url,
        image_base64: data.image_base64 || data.base64,
        request_id: data.request_id || data.id,
        backend: 'nanobanana',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        backend: 'nanobanana',
      };
    }
  }
  
  /**
   * Cache a generated sprite with metadata.
   * 
   * @param buildingId - Building identifier
   * @param imageUrl - Generated image URL or data URL
   * @param prompt - Prompt used for generation
   * @param backend - Which backend generated this sprite
   */
  private cacheSprite(
    buildingId: string, 
    imageUrl: string, 
    prompt: string,
    backend: 'gemini' | 'nanobanana'
  ): void {
    const entry: CachedSprite = {
      buildingId,
      imageUrl,
      generatedAt: Date.now(),
      prompt,
      backend,
    };
    
    this.cache.set(buildingId, entry);
    this.saveCache();
  }
  
  /**
   * Load sprite cache from localStorage.
   * Filters out entries older than 7 days.
   */
  private loadCache(): void {
    try {
      const stored = localStorage.getItem('nanobanana_sprite_cache');
      if (stored) {
        const entries: CachedSprite[] = JSON.parse(stored);
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const entry of entries) {
          // Only load entries less than 7 days old
          if (entry.generatedAt > sevenDaysAgo) {
            // Ensure backend field exists for legacy entries
            if (!entry.backend) {
              entry.backend = 'nanobanana';
            }
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
   * Save sprite cache to localStorage.
   * Called after each successful generation.
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
   * Delay helper for retry logic and rate limiting.
   * 
   * @param ms - Milliseconds to wait
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

// Singleton service instance
let serviceInstance: NanoBananaService | null = null;

/**
 * Get the singleton NanoBanana service instance.
 * Creates the instance on first call.
 * 
 * @returns The shared NanoBananaService instance
 */
export function getNanoBananaService(): NanoBananaService {
  if (!serviceInstance) {
    serviceInstance = new NanoBananaService();
  }
  return serviceInstance;
}

/**
 * Initialize the service with custom configuration.
 * Call this before getNanoBananaService() if you need custom settings.
 * 
 * @param config - Configuration overrides
 * @returns The configured NanoBananaService instance
 */
export function initNanoBananaService(config: Partial<NanoBananaConfig>): NanoBananaService {
  serviceInstance = new NanoBananaService(config);
  return serviceInstance;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate sprites for all landmark-tier buildings.
 * These are the buildings that benefit most from unique AI art.
 * 
 * @param buildings - Array of crypto building definitions
 * @returns Map of building IDs to image URLs
 */
export async function generateLandmarkSprites(
  buildings: CryptoBuildingDefinition[]
): Promise<Map<string, string>> {
  const service = getNanoBananaService();
  
  // Filter to institution and whale tier buildings (highest priority)
  const landmarks = buildings.filter(
    b => b.crypto.tier === 'institution' || b.crypto.tier === 'whale'
  );
  
  const backend = service.getActiveBackend();
  console.log(`[NanoBanana] Generating sprites for ${landmarks.length} landmark buildings using ${backend}...`);
  
  // Use lower concurrency for Gemini to respect rate limits
  const concurrency = backend === 'gemini' ? 1 : 2;
  return service.batchGenerate(landmarks, concurrency);
}

/**
 * Check if image generation is available and configured.
 * Returns true if either Gemini or NanoBanana is ready.
 * 
 * @returns true if sprite generation is possible
 */
export function isNanoBananaAvailable(): boolean {
  const service = getNanoBananaService();
  return service.isConfigured();
}

/**
 * Get which backend will be used for generation.
 * Useful for UI feedback to users.
 * 
 * @returns 'gemini', 'nanobanana', or 'none'
 */
export function getActiveGenerationBackend(): 'gemini' | 'nanobanana' | 'none' {
  const service = getNanoBananaService();
  return service.getActiveBackend();
}
