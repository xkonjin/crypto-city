/**
 * Building Generator - AI-Generated Company Buildings
 * 
 * Creates isometric building sprites for ingested companies/protocols
 * using Google's Gemini 2.5 Flash (Nano Banana) API.
 * 
 * The Hitchhiker's Guide notes: "Every crypto project deserves a building.
 * Even the ones that will rug in two weeks. ESPECIALLY those, actually -
 * their buildings make excellent ruins."
 */

import type { XProfile } from './XProfileAdapter';
import type { CryptoTier, CryptoChain, CryptoEffects, CryptoCategory } from '@/games/isocity/crypto/types';
import { suggestBuildingCategory } from './EntityTypeDetector';

// =============================================================================
// TYPES
// =============================================================================

export interface BuildingGenerationOptions {
  profile: XProfile;
  footprint?: { width: number; height: number };
  tier?: CryptoTier;
  chain?: CryptoChain;
  forceRegenerate?: boolean;
}

export interface BuildingGenerationResult {
  success: boolean;
  /** Base64 encoded PNG sprite */
  spriteBase64?: string;
  /** Blob URL for immediate rendering */
  spriteBlobUrl?: string;
  /** Generated building definition */
  buildingDefinition?: IngestedBuildingDefinition;
  /** Error message if failed */
  error?: string;
  /** Generation duration in ms */
  duration?: number;
}

export type BuildingGenerationStatus =
  | 'idle'
  | 'analyzing_brand'
  | 'generating_sprite'
  | 'processing_output'
  | 'creating_definition'
  | 'complete'
  | 'failed';

export interface BuildingGenerationProgress {
  status: BuildingGenerationStatus;
  progress: number;
  message: string;
}

/**
 * Definition for an ingested building
 */
export interface IngestedBuildingDefinition {
  id: string;
  name: string;
  category: 'ingested';
  footprint: { width: number; height: number };
  icon: string;
  isProcedural: false;
  sprites: { south: string };
  cost: number;
  crypto: {
    tier: CryptoTier;
    protocol: string;
    chain: CryptoChain;
    description: string;
    effects: CryptoEffects;
  };
  ingested: {
    sourceUsername: string;
    sourceProfileId: string;
    ingestedAt: number;
    lastUpdatedAt: number;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Tile sizes for sprite generation
const TILE_WIDTH = 64;
const TILE_HEIGHT_RATIO = 0.8;  // Height is 80% wider for isometric depth

// Base dimensions for each footprint size
const FOOTPRINT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1x1': { width: 64, height: 80 },
  '2x2': { width: 128, height: 160 },
  '2x3': { width: 128, height: 200 },
  '3x2': { width: 192, height: 160 },
  '3x3': { width: 192, height: 240 },
};

// Tier thresholds based on follower count
const TIER_THRESHOLDS = {
  retail: 0,
  degen: 10000,
  whale: 100000,
  institution: 500000,
};

// Base costs by tier
const BASE_COSTS: Record<CryptoTier, number> = {
  retail: 2000,
  degen: 5000,
  whale: 12000,
  institution: 25000,
};

// Category style guides for building generation
const CATEGORY_STYLES: Record<CryptoCategory | 'ingested', { colors: string; style: string }> = {
  defi: { colors: 'blue and teal', style: 'modern financial tower, glass and steel, digital displays' },
  exchange: { colors: 'green and gold', style: 'trading hub, corporate headquarters, screens showing charts' },
  chain: { colors: 'purple and cyan', style: 'futuristic data center, blockchain node aesthetic, glowing connections' },
  ct: { colors: 'sky blue and white', style: 'media building, podcast studio vibes, social icons' },
  meme: { colors: 'yellow and orange', style: 'playful cartoon building, mascot statues, fun signage' },
  plasma: { colors: 'British Racing Green (#162F29), teal (#569F8C)', style: 'sleek corporate with green energy glow' },
  stablecoin: { colors: 'emerald and white', style: 'bank-like, stable and trustworthy, vault aesthetics' },
  infrastructure: { colors: 'indigo and gray', style: 'industrial data center, server racks visible, utility building' },
  legends: { colors: 'orange and red', style: 'dramatic monument, historical landmark, memorable silhouette' },
  titan: { colors: 'violet and gold', style: 'creature dwelling, cozy den, mystical elements' },
  ingested: { colors: 'gradient of brand colors', style: 'modern tech headquarters, recognizable branding' },
};

// =============================================================================
// GENERATION LOGIC
// =============================================================================

/**
 * Generate a building sprite for an ingested company/protocol.
 */
export async function generateBuilding(
  options: BuildingGenerationOptions,
  onProgress?: (progress: BuildingGenerationProgress) => void
): Promise<BuildingGenerationResult> {
  const startTime = Date.now();
  const { profile } = options;
  
  const updateProgress = (
    status: BuildingGenerationStatus,
    progress: number,
    message: string
  ) => {
    onProgress?.({ status, progress, message });
  };
  
  try {
    // Check for API key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      (typeof window !== 'undefined' ? (window as unknown as { __GEMINI_API_KEY?: string }).__GEMINI_API_KEY : null);
    
    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API key not configured. Set NEXT_PUBLIC_GEMINI_API_KEY.',
        duration: Date.now() - startTime,
      };
    }
    
    // Stage 1: Analyze brand
    updateProgress('analyzing_brand', 10, 'Analyzing brand identity...');
    
    const tier = options.tier || determineTier(profile);
    const footprint = options.footprint || determineFootprint(tier);
    const chain = options.chain || detectChain(profile);
    const category = suggestBuildingCategory(profile);
    const brandColors = extractBrandColors(profile);
    
    updateProgress('analyzing_brand', 30, `Detected: ${tier} tier, ${footprint.width}x${footprint.height}`);
    
    // Stage 2: Generate sprite
    updateProgress('generating_sprite', 40, 'Generating isometric building...');
    
    const prompt = buildBuildingPrompt({
      companyName: profile.displayName,
      username: profile.username,
      bio: profile.bio,
      footprint,
      category,
      brandColors,
    });
    
    // Download profile image for reference
    let imageBase64: string | null = null;
    try {
      imageBase64 = await fetchImageAsBase64(profile.profileImageUrl);
    } catch {
      console.warn('[BuildingGenerator] Could not fetch profile image, generating without reference');
    }
    
    // Call Gemini API
    const spriteSize = FOOTPRINT_DIMENSIONS[`${footprint.width}x${footprint.height}`] || 
      { width: 128, height: 160 };
    
    const requestBody: {
      contents: Array<{
        parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
      }>;
      generationConfig: {
        responseModalities: string[];
        responseMimeType: string;
      };
    } = {
      contents: [
        {
          parts: [
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['image', 'text'],
        responseMimeType: 'image/png',
      },
    };
    
    // Add reference image if available
    if (imageBase64) {
      requestBody.contents[0].parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: imageBase64,
        },
      });
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BuildingGenerator] Gemini API error:', errorText);
      return {
        success: false,
        error: `Gemini API error: ${response.status}`,
        duration: Date.now() - startTime,
      };
    }
    
    updateProgress('processing_output', 70, 'Processing generated sprite...');
    
    const data = await response.json();
    
    // Extract the generated image
    const generatedImage = data.candidates?.[0]?.content?.parts?.find(
      (part: { inlineData?: { mimeType?: string; data?: string } }) => 
        part.inlineData?.mimeType?.startsWith('image/')
    );
    
    if (!generatedImage?.inlineData?.data) {
      return {
        success: false,
        error: 'No image generated by API',
        duration: Date.now() - startTime,
      };
    }
    
    const spriteBase64 = generatedImage.inlineData.data;
    const spriteBlobUrl = `data:image/png;base64,${spriteBase64}`;
    
    // Stage 3: Create building definition
    updateProgress('creating_definition', 90, 'Creating building definition...');
    
    const buildingId = `ingested_${profile.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const effects = calculateEffects(profile, tier, chain);
    
    const buildingDefinition: IngestedBuildingDefinition = {
      id: buildingId,
      name: `${profile.displayName} HQ`,
      category: 'ingested',
      footprint,
      icon: extractIcon(profile),
      isProcedural: false,
      sprites: { south: spriteBlobUrl },
      cost: calculateCost(tier, profile),
      crypto: {
        tier,
        protocol: profile.displayName,
        chain,
        description: generateDescription(profile),
        effects,
      },
      ingested: {
        sourceUsername: profile.username,
        sourceProfileId: profile.id,
        ingestedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      },
    };
    
    updateProgress('complete', 100, 'Building generated!');
    
    return {
      success: true,
      spriteBase64,
      spriteBlobUrl,
      buildingDefinition,
      duration: Date.now() - startTime,
    };
    
  } catch (error) {
    console.error('[BuildingGenerator] Generation failed:', error);
    return {
      success: false,
      error: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine tier based on follower count
 */
function determineTier(profile: XProfile): CryptoTier {
  const followers = profile.followerCount;
  
  if (followers >= TIER_THRESHOLDS.institution) return 'institution';
  if (followers >= TIER_THRESHOLDS.whale) return 'whale';
  if (followers >= TIER_THRESHOLDS.degen) return 'degen';
  return 'retail';
}

/**
 * Determine footprint based on tier
 */
function determineFootprint(tier: CryptoTier): { width: number; height: number } {
  switch (tier) {
    case 'institution': return { width: 3, height: 3 };
    case 'whale': return { width: 3, height: 2 };
    case 'degen': return { width: 2, height: 2 };
    case 'retail': return { width: 2, height: 2 };
    default: return { width: 2, height: 2 };
  }
}

/**
 * Detect blockchain from profile
 */
function detectChain(profile: XProfile): CryptoChain {
  const bio = profile.bio.toLowerCase();
  
  const chainKeywords: Record<CryptoChain, string[]> = {
    ethereum: ['ethereum', 'eth', 'evm', 'erc20', 'mainnet'],
    solana: ['solana', 'sol', 'spl'],
    bitcoin: ['bitcoin', 'btc', 'lightning'],
    arbitrum: ['arbitrum', 'arb'],
    optimism: ['optimism', 'op '],
    polygon: ['polygon', 'matic'],
    base: ['base', 'basedapp'],
    avalanche: ['avalanche', 'avax'],
    bnb: ['bnb', 'binance smart', 'bsc'],
    sui: ['sui'],
    aptos: ['aptos', 'apt'],
    zksync: ['zksync', 'zk sync'],
    scroll: ['scroll'],
    linea: ['linea'],
    blast: ['blast'],
    mantle: ['mantle'],
    hyperliquid: ['hyperliquid', 'hlp'],
  };
  
  for (const [chain, keywords] of Object.entries(chainKeywords)) {
    if (keywords.some(kw => bio.includes(kw))) {
      return chain as CryptoChain;
    }
  }
  
  // Default to Ethereum
  return 'ethereum';
}

/**
 * Extract brand colors (placeholder - could be enhanced with actual color extraction)
 */
function extractBrandColors(profile: XProfile): string[] {
  // For now, return generic colors
  // TODO: Implement actual color extraction from profile image
  return ['#4a90d9', '#f5f5f5', '#333333'];
}

/**
 * Extract icon/emoji from profile
 */
function extractIcon(profile: XProfile): string {
  // Look for emoji in display name
  const emojiMatch = profile.displayName.match(/[\u{1F300}-\u{1F9FF}]/u);
  if (emojiMatch) return emojiMatch[0];
  
  // Default icons by detected category
  const category = suggestBuildingCategory(profile);
  const categoryIcons: Record<string, string> = {
    defi: '🏦',
    exchange: '📊',
    chain: '⛓️',
    infrastructure: '🔗',
    ct: '📱',
    ingested: '🏢',
  };
  
  return categoryIcons[category] || '🏢';
}

/**
 * Calculate building cost
 */
function calculateCost(tier: CryptoTier, profile: XProfile): number {
  const baseCost = BASE_COSTS[tier];
  
  // Slight variation based on follower count
  const followerBonus = Math.floor(Math.log10(Math.max(1, profile.followerCount)) * 500);
  
  return baseCost + followerBonus;
}

/**
 * Generate building description
 */
function generateDescription(profile: XProfile): string {
  const bio = profile.bio.slice(0, 100);
  return `The ${profile.displayName} headquarters rises in Crypto City. ${bio}...`;
}

/**
 * Calculate crypto effects for the building
 */
function calculateEffects(
  profile: XProfile,
  tier: CryptoTier,
  chain: CryptoChain
): CryptoEffects {
  const tierMultiplier = { retail: 1, degen: 1.5, whale: 2, institution: 3 }[tier];
  const followerBonus = Math.log10(Math.max(1, profile.followerCount)) * 2;
  
  return {
    yieldRate: Math.round((5 + followerBonus) * tierMultiplier),
    stakingBonus: 1 + (tierMultiplier * 0.05),
    volatility: 0.15,
    rugRisk: 0.005, // Low risk for established accounts
    populationBoost: Math.round(15 * tierMultiplier),
    happinessEffect: Math.round(5 * tierMultiplier),
    zoneRadius: 4 + Math.floor(tierMultiplier),
    chainSynergy: [chain],
    categorySynergy: ['ingested'],
  };
}

/**
 * Build the prompt for building generation
 */
function buildBuildingPrompt(options: {
  companyName: string;
  username: string;
  bio: string;
  footprint: { width: number; height: number };
  category: string;
  brandColors: string[];
}): string {
  const { companyName, username, bio, footprint, category, brandColors } = options;
  const style = CATEGORY_STYLES[category as keyof typeof CATEGORY_STYLES] || CATEGORY_STYLES.ingested;
  const dimensions = FOOTPRINT_DIMENSIONS[`${footprint.width}x${footprint.height}`] || 
    { width: 128, height: 160 };
  
  return `Generate an isometric pixel art building sprite for "${companyName}" (@${username}) headquarters.

EXACT SPECIFICATIONS:
- Output size: ${dimensions.width} x ${dimensions.height} pixels
- Footprint: ${footprint.width}x${footprint.height} tiles (each tile is 64px wide)
- Style: 16-bit isometric pixel art (like SimCity 2000)
- Background: FULLY TRANSPARENT (alpha=0)
- Direction: South-facing (toward viewer, main entrance visible)

COMPANY CONTEXT:
- Name: ${companyName}
- Handle: @${username}
- Bio: "${bio.slice(0, 150)}"
- Category: ${category}

VISUAL STYLE:
- Colors: ${style.colors}, with brand colors ${brandColors.join(', ')}
- Architecture: ${style.style}
- Make the building INSTANTLY RECOGNIZABLE as ${companyName}
- Incorporate the company name or logo as subtle signage

BUILDING FEATURES:
- Modern tech/crypto headquarters aesthetic
- Subtle neon accents or digital displays
- Appropriate scale for an ${footprint.width}x${footprint.height} building
- Professional but with crypto personality

CRITICAL REQUIREMENTS:
1. Sharp pixel edges, NO anti-aliasing
2. Limited palette (max 24 colors)
3. Transparent background only
4. Must look cohesive at game scale
5. The company identity should be clear from the building design`;
}

/**
 * Fetch an image URL and convert to base64
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  // Handle Twitter image URLs
  let fetchUrl = url;
  if (url.includes('pbs.twimg.com')) {
    fetchUrl = url.replace(/_normal\./, '.');
  }
  
  const response = await fetch(fetchUrl, { mode: 'cors' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

const BuildingGenerator = {
  generateBuilding,
  determineTier,
  determineFootprint,
  detectChain,
};

export default BuildingGenerator;
