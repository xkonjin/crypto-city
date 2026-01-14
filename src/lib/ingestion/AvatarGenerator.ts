/**
 * Avatar Generator - Nano Banana Pixel Art Sprites
 *
 * Transforms X/Twitter profile pictures into pixel art character sprites
 * using Google's Gemini 2.5 Flash Image (Nano Banana) API.
 *
 * The Hitchhiker's Guide notes: "Converting a profile picture to pixel art
 * is like translating your digital soul into an 8-bit dialect. Some nuance
 * may be lost, but the essence remains recognizable to fellow degens."
 */

// =============================================================================
// TYPES
// =============================================================================

export interface AvatarGenerationOptions {
  /** URL of the profile image to convert */
  profileImageUrl: string;
  /** Username for logging and caching */
  username: string;
  /** Dominant colors extracted from profile (optional) */
  dominantColors?: string[];
  /** Style hints based on personality archetype */
  styleHints?: string;
}

export interface AvatarGenerationResult {
  success: boolean;
  /** Base64 encoded PNG spritesheet */
  spritesheetBase64?: string;
  /** Blob URL for immediate rendering */
  spritesheetBlobUrl?: string;
  /** Error message if failed */
  error?: string;
  /** Generation duration in ms */
  duration?: number;
}

export type AvatarGenerationStatus =
  | 'idle'
  | 'downloading_image'
  | 'extracting_colors'
  | 'generating_sprite'
  | 'processing_output'
  | 'complete'
  | 'failed';

export interface AvatarGenerationProgress {
  status: AvatarGenerationStatus;
  progress: number;
  message: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Sprite sheet dimensions for NPC avatars
 * - 4 columns: animation frames (idle, walk1, walk2, walk3)
 * - 4 rows: directions (south, east, west, north)
 */
export const SPRITE_FRAME_WIDTH = 32;
export const SPRITE_FRAME_HEIGHT = 48;
export const SPRITE_COLUMNS = 4;  // Animation frames
export const SPRITE_ROWS = 4;     // Directions
export const SPRITESHEET_WIDTH = SPRITE_FRAME_WIDTH * SPRITE_COLUMNS;   // 128
export const SPRITESHEET_HEIGHT = SPRITE_FRAME_HEIGHT * SPRITE_ROWS;    // 192

/**
 * Base prompt for Nano Banana sprite generation
 */
const BASE_GENERATION_PROMPT = `You are a pixel art game sprite artist. Convert this profile picture into a character spritesheet for an isometric city builder game.

EXACT OUTPUT SPECIFICATIONS:
- Total image size: 128 x 192 pixels
- Sprite frame size: 32 x 48 pixels each
- Layout: 4 columns (animation frames) x 4 rows (directions)
- Background: FULLY TRANSPARENT (alpha=0)

ROW ORDER (top to bottom):
1. South-facing (toward viewer, most important)
2. East-facing (right side)
3. West-facing (left side) 
4. North-facing (away from viewer)

COLUMN ORDER (left to right):
1. Idle/Stand pose
2. Walk frame 1 (left foot forward)
3. Walk frame 2 (feet together)
4. Walk frame 3 (right foot forward)

STYLE REQUIREMENTS:
- Classic 16-bit pixel art style (like SimCity 2000 pedestrians)
- NO anti-aliasing, sharp pixel edges only
- Limited palette: max 16 colors per character
- Isometric perspective for all poses
- Small but recognizable character

CHARACTER DESIGN:
- MUST preserve recognizable features from the profile picture
- Keep distinctive elements (hair color, style, clothing colors)
- Simplify details to work at 32x48 pixel scale
- Add subtle tech/crypto accessories if appropriate (headphones, hoodie, sunglasses)

CRITICAL:
- The sprite must look like a pixelated version of the person/avatar in the image
- Do NOT generate a generic character - capture the essence of the original
- Transparent background only - no ground, shadows, or backdrop`;

// =============================================================================
// COLOR EXTRACTION
// =============================================================================

/**
 * Extract dominant colors from an image for style guidance
 */
async function extractDominantColors(imageUrl: string): Promise<string[]> {
  try {
    // For now, return a default palette
    // TODO: Implement actual color extraction using canvas
    return ['#4a90d9', '#f5f5f5', '#333333', '#e74c3c'];
  } catch (error) {
    console.warn('[AvatarGenerator] Color extraction failed:', error);
    return ['#4a90d9', '#f5f5f5', '#333333'];
  }
}

/**
 * Fetch image and convert to base64 for API
 */
async function imageUrlToBase64(url: string): Promise<string> {
  // Handle various URL formats
  let fetchUrl = url;
  
  // Handle Twitter's image URLs
  if (url.includes('pbs.twimg.com')) {
    // Request the original size
    fetchUrl = url.replace(/_normal\./, '.');
  }
  
  // Use a proxy or CORS-friendly approach for external images
  // For now, we'll use a data URL approach via canvas
  
  try {
    const response = await fetch(fetchUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Extract just the base64 data (remove data:image/xxx;base64, prefix)
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('[AvatarGenerator] Direct fetch failed, trying proxy:', error);
    
    // Fallback: Use a canvas approach for CORS images
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        try {
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl.split(',')[1]);
        } catch (e) {
          reject(new Error('Canvas tainted by CORS'));
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = fetchUrl;
    });
  }
}

// =============================================================================
// GEMINI API INTEGRATION
// =============================================================================

/**
 * Generate pixel art avatar using Nano Banana (Gemini 2.5 Flash Image)
 */
export async function generatePixelAvatar(
  options: AvatarGenerationOptions,
  onProgress?: (progress: AvatarGenerationProgress) => void
): Promise<AvatarGenerationResult> {
  const startTime = Date.now();

  const updateProgress = (
    status: AvatarGenerationStatus,
    progress: number,
    message: string
  ) => {
    onProgress?.({ status, progress, message });
  };

  try {
    // Check for API key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                   (typeof window !== 'undefined' ? (window as any).__GEMINI_API_KEY : null);
    
    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API key not configured. Set NEXT_PUBLIC_GEMINI_API_KEY.',
        duration: Date.now() - startTime,
      };
    }

    // Stage 1: Download profile image
    updateProgress('downloading_image', 10, 'Downloading profile image...');
    
    let imageBase64: string;
    try {
      imageBase64 = await imageUrlToBase64(options.profileImageUrl);
    } catch (error) {
      // Use placeholder if image fetch fails
      console.warn('[AvatarGenerator] Using placeholder for:', options.username);
      return {
        success: false,
        error: `Could not fetch profile image: ${error}`,
        duration: Date.now() - startTime,
      };
    }

    // Stage 2: Extract colors
    updateProgress('extracting_colors', 20, 'Analyzing colors...');
    const colors = options.dominantColors || await extractDominantColors(options.profileImageUrl);

    // Stage 3: Generate sprite with Gemini
    updateProgress('generating_sprite', 30, 'Generating pixel art sprite...');

    // Build the full prompt with style hints
    const styleHints = options.styleHints || '';
    const colorHints = `Dominant colors to incorporate: ${colors.join(', ')}`;
    const fullPrompt = `${BASE_GENERATION_PROMPT}\n\nSTYLE HINTS: ${styleHints}\n${colorHints}\n\nGenerate the spritesheet now based on the provided profile image.`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: fullPrompt },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['image', 'text'],
            responseMimeType: 'image/png',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AvatarGenerator] Gemini API error:', errorText);
      return {
        success: false,
        error: `Gemini API error: ${response.status}`,
        duration: Date.now() - startTime,
      };
    }

    updateProgress('processing_output', 80, 'Processing generated sprite...');

    const data = await response.json();
    
    // Extract the generated image from response
    const generatedImage = data.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!generatedImage?.inlineData?.data) {
      return {
        success: false,
        error: 'No image generated by API',
        duration: Date.now() - startTime,
      };
    }

    // Stage 4: Process and return
    updateProgress('complete', 100, 'Avatar generated!');

    const spritesheetBase64 = generatedImage.inlineData.data;
    const spritesheetBlobUrl = `data:image/png;base64,${spritesheetBase64}`;

    return {
      success: true,
      spritesheetBase64,
      spritesheetBlobUrl,
      duration: Date.now() - startTime,
    };

  } catch (error) {
    console.error('[AvatarGenerator] Generation failed:', error);
    return {
      success: false,
      error: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

// =============================================================================
// FALLBACK: PROCEDURAL PIXEL AVATAR
// =============================================================================

/**
 * Generate a simple procedural pixel avatar when API is unavailable
 * Creates a basic character sprite based on colors and hash
 */
export function generateProceduralAvatar(
  username: string,
  colors: string[] = ['#4a90d9', '#f5f5f5', '#333333']
): string {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITESHEET_WIDTH;
  canvas.height = SPRITESHEET_HEIGHT;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context unavailable');
  }

  // Use username to generate deterministic variations
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Color selection
  const skinColor = ['#ffd5c8', '#e0ac69', '#c68642', '#8d5524'][hash % 4];
  const hairColor = colors[0] || '#333333';
  const shirtColor = colors[1] || '#4a90d9';
  const pantsColor = colors[2] || '#333333';
  
  // Draw each direction and frame
  for (let row = 0; row < SPRITE_ROWS; row++) {
    for (let col = 0; col < SPRITE_COLUMNS; col++) {
      const x = col * SPRITE_FRAME_WIDTH;
      const y = row * SPRITE_FRAME_HEIGHT;
      
      // Draw a simple pixel person
      drawProceduralFrame(ctx, x, y, {
        skinColor,
        hairColor,
        shirtColor,
        pantsColor,
        direction: row,
        frame: col,
        hash,
      });
    }
  }

  return canvas.toDataURL('image/png');
}

interface ProceduralFrameOptions {
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  direction: number;  // 0=south, 1=east, 2=west, 3=north
  frame: number;      // 0-3 animation frame
  hash: number;
}

function drawProceduralFrame(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  opts: ProceduralFrameOptions
): void {
  const { skinColor, hairColor, shirtColor, pantsColor, direction, frame, hash } = opts;
  
  // Center of the frame
  const cx = offsetX + SPRITE_FRAME_WIDTH / 2;
  const cy = offsetY + SPRITE_FRAME_HEIGHT;
  
  // Animation offset for walking
  const walkOffset = [0, -2, 0, -2][frame];
  const legOffset = [0, 2, 0, -2][frame];
  
  // === HEAD ===
  ctx.fillStyle = skinColor;
  // Head (8x8 pixels)
  ctx.fillRect(cx - 4, cy - 40 + walkOffset, 8, 8);
  
  // === HAIR ===
  ctx.fillStyle = hairColor;
  // Hair on top
  ctx.fillRect(cx - 4, cy - 42 + walkOffset, 8, 4);
  // Side hair variations
  if (hash % 3 === 0) {
    ctx.fillRect(cx - 5, cy - 40 + walkOffset, 2, 6);
    ctx.fillRect(cx + 3, cy - 40 + walkOffset, 2, 6);
  }
  
  // === BODY/SHIRT ===
  ctx.fillStyle = shirtColor;
  // Torso (10x12 pixels)
  ctx.fillRect(cx - 5, cy - 30 + walkOffset, 10, 12);
  
  // === ARMS ===
  ctx.fillStyle = skinColor;
  // Arms swing based on frame
  if (frame === 1 || frame === 3) {
    ctx.fillRect(cx - 7, cy - 28 + walkOffset, 2, 8);
    ctx.fillRect(cx + 5, cy - 28 + walkOffset, 2, 8);
  } else {
    ctx.fillRect(cx - 7, cy - 30 + walkOffset, 2, 8);
    ctx.fillRect(cx + 5, cy - 30 + walkOffset, 2, 8);
  }
  
  // === PANTS/LEGS ===
  ctx.fillStyle = pantsColor;
  // Legs (walking animation)
  const leftLegX = cx - 4 + (frame === 1 ? legOffset : frame === 3 ? -legOffset : 0);
  const rightLegX = cx + 1 + (frame === 1 ? -legOffset : frame === 3 ? legOffset : 0);
  ctx.fillRect(leftLegX, cy - 18 + walkOffset, 3, 12);
  ctx.fillRect(rightLegX, cy - 18 + walkOffset, 3, 12);
  
  // === FEET ===
  ctx.fillStyle = '#333333';
  ctx.fillRect(leftLegX - 1, cy - 6 + walkOffset, 4, 2);
  ctx.fillRect(rightLegX - 1, cy - 6 + walkOffset, 4, 2);
  
  // === FACE DIRECTION ===
  ctx.fillStyle = '#333333';
  if (direction === 0) {
    // South - show face
    ctx.fillRect(cx - 2, cy - 38 + walkOffset, 2, 2); // left eye
    ctx.fillRect(cx + 1, cy - 38 + walkOffset, 2, 2); // right eye
  } else if (direction === 3) {
    // North - back of head (no face)
  } else {
    // East/West - side profile
    const sideOffset = direction === 1 ? 2 : -2;
    ctx.fillRect(cx + sideOffset, cy - 38 + walkOffset, 2, 2); // one eye
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Load a spritesheet image from base64 or URL
 */
export function loadSpritesheet(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load spritesheet'));
    img.src = source;
  });
}

/**
 * Get the sprite frame coordinates for a given direction and animation frame
 */
export function getSpriteFrame(
  direction: 'south' | 'east' | 'west' | 'north',
  animationFrame: number
): { sx: number; sy: number; sw: number; sh: number } {
  const directionRow = { south: 0, east: 1, west: 2, north: 3 }[direction];
  const frameCol = Math.floor(animationFrame) % SPRITE_COLUMNS;
  
  return {
    sx: frameCol * SPRITE_FRAME_WIDTH,
    sy: directionRow * SPRITE_FRAME_HEIGHT,
    sw: SPRITE_FRAME_WIDTH,
    sh: SPRITE_FRAME_HEIGHT,
  };
}

const AvatarGenerator = {
  generatePixelAvatar,
  generateProceduralAvatar,
  loadSpritesheet,
  getSpriteFrame,
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
};

export default AvatarGenerator;
