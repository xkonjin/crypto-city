// =============================================================================
// GEMINI IMAGE GENERATION SERVICE
// =============================================================================
// Integration with Google Gemini's Nano Banana image generation API.
// Generates high-quality isometric building sprites for the crypto city game.
//
// This service wraps the @google/genai SDK and provides methods for:
// - Single image generation with optimized prompts
// - Batch generation with rate limiting
// - Image caching and retry logic
// - Style-consistent prompt engineering
//
// API Documentation: https://ai.google.dev/gemini-api/docs
// Model: gemini-2.5-flash-image (fast, efficient image generation)

import { GoogleGenAI, Modality } from '@google/genai';

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration options for the Gemini Image service.
 * Controls API connection, generation parameters, and retry behavior.
 */
export interface GeminiImageConfig {
  // API key for authentication with Google Gemini
  apiKey: string;
  // Model to use for image generation (default: gemini-2.5-flash-image)
  model: string;
  // Maximum number of retry attempts on failure
  maxRetries: number;
  // Base delay between retries in milliseconds (exponential backoff)
  retryDelayMs: number;
  // Whether to enable debug logging
  debug: boolean;
}

/**
 * Options for a single image generation request.
 * Controls the visual style and content of the generated image.
 */
export interface GenerateImageOptions {
  // The main prompt describing what to generate
  prompt: string;
  // Optional style modifier to append to prompt
  style?: string;
  // Negative prompt - what to avoid in the image
  negativePrompt?: string;
  // Aspect ratio (currently Gemini uses 1:1 for images)
  aspectRatio?: '1:1' | '16:9' | '4:3';
  // Output image size hint
  imageSize?: '512' | '1024';
}

/**
 * Result from an image generation request.
 * Contains either the generated image data or error information.
 */
export interface GenerateImageResult {
  // Whether the generation was successful
  success: boolean;
  // Base64-encoded image data (PNG format)
  imageBase64?: string;
  // Data URL ready to use in img src or Phaser
  imageDataUrl?: string;
  // MIME type of the generated image
  mimeType?: string;
  // Error message if generation failed
  error?: string;
  // Time taken to generate in milliseconds
  generationTimeMs?: number;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default configuration values for the Gemini Image service.
 * API key is loaded from environment variable for security.
 */
const DEFAULT_CONFIG: GeminiImageConfig = {
  // Load API key from Next.js public environment variable
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
  // Use the fast Flash model for efficient image generation
  model: 'gemini-2.5-flash-preview-05-20',
  // Retry up to 3 times on transient failures
  maxRetries: 3,
  // Start with 1 second delay, doubles on each retry
  retryDelayMs: 1000,
  // Disable debug logging by default
  debug: false,
};

// =============================================================================
// ART STYLE PROMPT TEMPLATES
// =============================================================================
// These prompts are carefully crafted to match the existing partner building
// art style: clean vector isometric, transparent backgrounds, bold colors.

/**
 * Base prompt template that establishes the core art style.
 * This is prepended to all generation requests to ensure consistency.
 */
export const BASE_STYLE_PROMPT = `
High-quality clean vector isometric building illustration for a city builder game.
Flat design style with bold saturated colors and crisp edges.
Transparent PNG background.
South-facing isometric view at approximately 30 degree angle.
Building sits on a dark slate gray hexagonal or rectangular base platform.
Soft drop shadow underneath the base platform.
Modern geometric architecture with clean black outlines.
Minimal but impactful details, no complex textures.
Building centered in frame, filling most of the 1024x1024 canvas.
Maximum quality professional game asset.
Sharp details and precise linework.
`.trim();

/**
 * Negative prompt to avoid unwanted elements in generated images.
 * Helps maintain the clean vector aesthetic.
 */
export const NEGATIVE_PROMPT = `
photorealistic, 3D render, pixel art, gradients, complex shadows,
watermark, text labels, blurry, low quality, noisy, artifacts,
people, vehicles, trees, busy background, cluttered details,
cartoon style, anime style, hand-drawn sketch
`.trim();

/**
 * Protocol-specific color palettes matching the existing partner sprites.
 * Each protocol has signature colors that should be used for their buildings.
 */
export const PROTOCOL_COLORS: Record<string, string> = {
  // DeFi Protocols
  aave: 'teal and cyan with purple accents, ghost motifs',
  uniswap: 'pink and magenta with unicorn theme',
  lido: 'ocean blue and turquoise with wave patterns',
  curve: 'blue spirals and curves, mathematical aesthetic',
  makerdao: 'green and gold, classical architecture',
  compound: 'green corporate with modern design',
  yearn: 'blue and teal with laboratory aesthetic',
  pendle: 'purple and blue with time/clock motifs',
  eigenlayer: 'purple and violet with layered geometric shapes',
  morpho: 'teal blue with butterfly wing motifs',
  gmx: 'blue and purple with trading chart elements',
  hyperliquid: 'neon purple and electric blue, futuristic',
  
  // Exchanges
  coinbase: 'blue corporate with white accents',
  binance: 'yellow and gold with black accents',
  kraken: 'purple and octopus motifs',
  dydx: 'purple gradient with trading floor aesthetic',
  jupiter: 'orange and cosmic purple, planetary theme',
  bybit: 'orange and black, sleek design',
  
  // Chains
  ethereum: 'purple and silver with diamond shapes',
  solana: 'purple and green gradient with speed lines',
  base: 'blue gradient with Coinbase style',
  arbitrum: 'blue with angular geometric shapes',
  optimism: 'red and pink with optimistic vibes',
  polygon: 'purple with hexagon patterns',
  avalanche: 'red triangle motifs with snow elements',
  bitcoin: 'orange and gold with fortress aesthetic',
  
  // Plasma Partners
  plasma: 'teal and green with modern fintech style',
  tether: 'green with USDT branding elements',
  ethena: 'green with synthetic dollar aesthetic',
  etherfi: 'purple blue with staking nodes',
  robinhood: 'green feather with trading theme',
  trustwallet: 'blue shield with security motifs',
  
  // Meme/Culture
  pepe: 'green frog theme with meme aesthetics',
  doge: 'gold and brown with shiba inu motifs',
  default: 'teal and purple with crypto aesthetic',
};

/**
 * Tier-specific architectural descriptions.
 * Larger tiers get more impressive, detailed buildings.
 */
export const TIER_DESCRIPTIONS: Record<string, string> = {
  institution: 'Massive impressive skyscraper, corporate headquarters style, multiple sections, antenna on top, very detailed',
  whale: 'Large professional building, high-end modern design, significant presence, 5-8 floors',
  shark: 'Medium-large building with professional appearance, 3-5 floors, modern design',
  retail: 'Medium-sized accessible building, welcoming storefront, 2-4 floors, modern but approachable',
  fish: 'Small but charming building, 1-2 floors, boutique aesthetic',
  degen: 'Quirky colorful building with neon signs, unconventional design, slightly chaotic',
};

// =============================================================================
// GEMINI IMAGE SERVICE CLASS
// =============================================================================

/**
 * Service class for generating images using Google Gemini's API.
 * Provides a clean interface for generating crypto building sprites
 * with consistent styling and error handling.
 */
export class GeminiImageService {
  // Service configuration
  private config: GeminiImageConfig;
  // Google GenAI client instance
  private client: GoogleGenAI | null = null;
  // Flag indicating if service is ready to use
  private initialized: boolean = false;

  /**
   * Create a new GeminiImageService instance.
   * 
   * @param config - Optional configuration overrides
   */
  constructor(config?: Partial<GeminiImageConfig>) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Attempt to initialize the client
    this.initialize();
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  /**
   * Initialize the Google GenAI client.
   * Called automatically on construction, can be called again if config changes.
   */
  private initialize(): void {
    // Check if we have an API key
    if (!this.config.apiKey) {
      this.log('warn', 'No Gemini API key configured. Image generation will not work.');
      this.initialized = false;
      return;
    }

    try {
      // Create the Google GenAI client
      this.client = new GoogleGenAI({ apiKey: this.config.apiKey });
      this.initialized = true;
      this.log('info', 'Gemini Image Service initialized successfully');
    } catch (error) {
      this.log('error', 'Failed to initialize Gemini client:', error);
      this.initialized = false;
    }
  }

  /**
   * Check if the service is properly configured and ready to use.
   * 
   * @returns true if the service can generate images
   */
  public isConfigured(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Get the current configuration.
   * Useful for debugging and testing.
   * 
   * @returns Current service configuration (with API key masked)
   */
  public getConfig(): Omit<GeminiImageConfig, 'apiKey'> & { hasApiKey: boolean } {
    const { apiKey, ...rest } = this.config;
    return { ...rest, hasApiKey: !!apiKey };
  }

  // ---------------------------------------------------------------------------
  // IMAGE GENERATION
  // ---------------------------------------------------------------------------

  /**
   * Generate an image using Gemini's Nano Banana model.
   * This is the main method for creating building sprites.
   * 
   * @param options - Generation options including prompt and style
   * @returns Result containing image data or error
   * 
   * @example
   * ```typescript
   * const result = await service.generateImage({
   *   prompt: 'A DeFi lending tower with ghost motifs',
   *   style: 'aave',
   * });
   * if (result.success) {
   *   img.src = result.imageDataUrl;
   * }
   * ```
   */
  public async generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    // Check if service is ready
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Gemini Image Service not configured. Check API key.',
      };
    }

    const startTime = Date.now();

    // Build the full prompt with style template
    const fullPrompt = this.buildPrompt(options);
    this.log('debug', 'Generating image with prompt:', fullPrompt.substring(0, 200) + '...');

    // Attempt generation with retries
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.callGeminiApi(fullPrompt);
        
        if (result.success) {
          result.generationTimeMs = Date.now() - startTime;
          this.log('info', `Image generated successfully in ${result.generationTimeMs}ms`);
          return result;
        }

        lastError = new Error(result.error || 'Unknown error');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log('warn', `Attempt ${attempt} failed:`, lastError.message);
      }

      // Wait before retry with exponential backoff
      if (attempt < this.config.maxRetries) {
        const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
        this.log('debug', `Waiting ${delay}ms before retry...`);
        await this.delay(delay);
      }
    }

    // All retries failed
    return {
      success: false,
      error: `Failed after ${this.config.maxRetries} attempts: ${lastError?.message}`,
      generationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Generate a building sprite with protocol-specific styling.
   * Convenience method that applies the correct colors and tier description.
   * 
   * @param buildingName - Name of the building (e.g., "Aave Lending Tower")
   * @param description - Building description for context
   * @param protocol - Protocol name for color palette (e.g., "aave")
   * @param tier - Building tier for size/impressiveness
   * @param footprint - Grid footprint for size reference
   * @returns Result containing image data or error
   */
  public async generateBuildingSprite(
    buildingName: string,
    description: string,
    protocol: string = 'default',
    tier: string = 'retail',
    footprint: { width: number; height: number } = { width: 2, height: 2 }
  ): Promise<GenerateImageResult> {
    // Get protocol-specific colors
    const colors = PROTOCOL_COLORS[protocol.toLowerCase()] || PROTOCOL_COLORS.default;
    
    // Get tier-specific description
    const tierDesc = TIER_DESCRIPTIONS[tier.toLowerCase()] || TIER_DESCRIPTIONS.retail;

    // Build building-specific prompt
    const buildingPrompt = `
${buildingName} - ${description}

Building style: ${tierDesc}
Color scheme: ${colors}
Grid footprint: ${footprint.width}x${footprint.height} cells
Make it look like a crypto/fintech building appropriate for a DeFi protocol.
`.trim();

    return this.generateImage({
      prompt: buildingPrompt,
      negativePrompt: NEGATIVE_PROMPT,
    });
  }

  // ---------------------------------------------------------------------------
  // PRIVATE METHODS
  // ---------------------------------------------------------------------------

  /**
   * Build the full prompt by combining base style with specific request.
   * Ensures all generated images maintain consistent art style.
   * 
   * @param options - Generation options
   * @returns Complete prompt string for the API
   */
  private buildPrompt(options: GenerateImageOptions): string {
    const parts: string[] = [BASE_STYLE_PROMPT];

    // Add the main prompt
    parts.push(options.prompt);

    // Add optional style modifier
    if (options.style) {
      const colors = PROTOCOL_COLORS[options.style.toLowerCase()];
      if (colors) {
        parts.push(`Color scheme and theme: ${colors}`);
      }
    }

    // Add negative prompt guidance
    if (options.negativePrompt) {
      parts.push(`Avoid: ${options.negativePrompt}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Make the actual API call to Gemini.
   * Handles the response parsing and image extraction.
   * 
   * @param prompt - The full prompt to send
   * @returns Result with image data or error
   */
  private async callGeminiApi(prompt: string): Promise<GenerateImageResult> {
    if (!this.client) {
      return { success: false, error: 'Client not initialized' };
    }

    try {
      // Call Gemini with image generation configuration
      const response = await this.client.models.generateContent({
        model: this.config.model,
        contents: prompt,
        config: {
          // Request image output
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      // Extract image from response
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            // Check if this part contains inline image data
            if (part.inlineData && part.inlineData.data) {
              const mimeType = part.inlineData.mimeType || 'image/png';
              const base64Data = part.inlineData.data;
              
              return {
                success: true,
                imageBase64: base64Data,
                imageDataUrl: `data:${mimeType};base64,${base64Data}`,
                mimeType: mimeType,
              };
            }
          }
        }
      }

      // No image found in response
      return {
        success: false,
        error: 'No image data in response. The model may not support image generation.',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', 'Gemini API error:', errorMessage);
      return {
        success: false,
        error: `API error: ${errorMessage}`,
      };
    }
  }

  /**
   * Utility method for delays (used in retry logic).
   * 
   * @param ms - Milliseconds to wait
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logging utility with configurable debug mode.
   * 
   * @param level - Log level (debug, info, warn, error)
   * @param message - Main message
   * @param args - Additional arguments to log
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void {
    // Skip debug logs unless debug mode is enabled
    if (level === 'debug' && !this.config.debug) {
      return;
    }

    const prefix = '[GeminiImage]';
    switch (level) {
      case 'debug':
        console.debug(prefix, message, ...args);
        break;
      case 'info':
        console.log(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

// Singleton instance for the service
let serviceInstance: GeminiImageService | null = null;

/**
 * Get the singleton GeminiImageService instance.
 * Creates the instance on first call.
 * 
 * @returns The shared GeminiImageService instance
 */
export function getGeminiImageService(): GeminiImageService {
  if (!serviceInstance) {
    serviceInstance = new GeminiImageService();
  }
  return serviceInstance;
}

/**
 * Initialize the service with custom configuration.
 * Call this before getGeminiImageService() if you need custom settings.
 * 
 * @param config - Configuration overrides
 * @returns The configured GeminiImageService instance
 */
export function initGeminiImageService(config: Partial<GeminiImageConfig>): GeminiImageService {
  serviceInstance = new GeminiImageService(config);
  return serviceInstance;
}

/**
 * Check if the Gemini Image service is available and configured.
 * Useful for conditional rendering or fallback logic.
 * 
 * @returns true if the service can generate images
 */
export function isGeminiImageAvailable(): boolean {
  const service = getGeminiImageService();
  return service.isConfigured();
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert a base64 image string to a Blob for downloading or saving.
 * 
 * @param base64 - Base64-encoded image data
 * @param mimeType - MIME type (default: image/png)
 * @returns Blob object
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Download a generated image to the user's computer.
 * 
 * @param imageDataUrl - Data URL of the image
 * @param filename - Name for the downloaded file
 */
export function downloadImage(imageDataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = imageDataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

