/**
 * Post-Processing Effects
 * Provides shader-like effects for canvas rendering
 */

export interface PostProcessingOptions {
  bloom?: boolean;
  bloomIntensity?: number;
  colorGrading?: boolean;
  saturation?: number;
  contrast?: number;
  brightness?: number;
  vignette?: boolean;
  vignetteIntensity?: number;
  scanlines?: boolean;
  pixelate?: boolean;
  pixelSize?: number;
}

export class PostProcessing {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private tempCanvas: HTMLCanvasElement;
  private tempCtx: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    this.tempCanvas = document.createElement('canvas');
    this.tempCanvas.width = width;
    this.tempCanvas.height = height;
    this.tempCtx = this.tempCanvas.getContext('2d')!;
  }

  /**
   * Resize canvases
   */
  resize(width: number, height: number): void {
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.tempCanvas.width = width;
    this.tempCanvas.height = height;
  }

  /**
   * Apply post-processing effects to canvas
   */
  apply(
    sourceCtx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: PostProcessingOptions
  ): void {
    // Copy source to offscreen canvas
    this.offscreenCtx.clearRect(0, 0, width, height);
    this.offscreenCtx.drawImage(sourceCtx.canvas, 0, 0);

    // Apply effects in order
    if (options.pixelate) {
      this.applyPixelation(width, height, options.pixelSize || 2);
    }

    if (options.colorGrading) {
      this.applyColorGrading(
        width,
        height,
        options.saturation || 1.0,
        options.contrast || 1.0,
        options.brightness || 1.0
      );
    }

    if (options.bloom) {
      this.applyBloom(width, height, options.bloomIntensity || 0.5);
    }

    if (options.vignette) {
      this.applyVignette(width, height, options.vignetteIntensity || 0.5);
    }

    if (options.scanlines) {
      this.applyScanlines(width, height);
    }

    // Copy result back to source
    sourceCtx.clearRect(0, 0, width, height);
    sourceCtx.drawImage(this.offscreenCanvas, 0, 0);
  }

  /**
   * Apply bloom effect (glow)
   */
  private applyBloom(width: number, height: number, intensity: number): void {
    const imageData = this.offscreenCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Extract bright pixels
    const brightData = new Uint8ClampedArray(data.length);
    const threshold = 200;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      if (brightness > threshold) {
        brightData[i] = r;
        brightData[i + 1] = g;
        brightData[i + 2] = b;
        brightData[i + 3] = data[i + 3];
      }
    }

    // Draw bright pixels to temp canvas
    const brightImageData = new ImageData(brightData, width, height);
    this.tempCtx.putImageData(brightImageData, 0, 0);

    // Blur the bright pixels
    this.tempCtx.filter = 'blur(8px)';
    this.tempCtx.drawImage(this.tempCanvas, 0, 0);
    this.tempCtx.filter = 'none';

    // Composite bloom with original
    this.offscreenCtx.globalAlpha = intensity;
    this.offscreenCtx.globalCompositeOperation = 'screen';
    this.offscreenCtx.drawImage(this.tempCanvas, 0, 0);
    this.offscreenCtx.globalAlpha = 1;
    this.offscreenCtx.globalCompositeOperation = 'source-over';
  }

  /**
   * Apply color grading (saturation, contrast, brightness)
   */
  private applyColorGrading(
    width: number,
    height: number,
    saturation: number,
    contrast: number,
    brightness: number
  ): void {
    const imageData = this.offscreenCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply brightness
      r *= brightness;
      g *= brightness;
      b *= brightness;

      // Apply contrast
      r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

      // Apply saturation
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      r = gray + saturation * (r - gray);
      g = gray + saturation * (g - gray);
      b = gray + saturation * (b - gray);

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    this.offscreenCtx.putImageData(imageData, 0, 0);
  }

  /**
   * Apply vignette effect (darkened edges)
   */
  private applyVignette(width: number, height: number, intensity: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    const gradient = this.offscreenCtx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxDist
    );

    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);

    this.offscreenCtx.fillStyle = gradient;
    this.offscreenCtx.fillRect(0, 0, width, height);
  }

  /**
   * Apply CRT scanlines effect
   */
  private applyScanlines(width: number, height: number): void {
    this.offscreenCtx.globalAlpha = 0.1;
    this.offscreenCtx.fillStyle = '#000000';

    for (let y = 0; y < height; y += 2) {
      this.offscreenCtx.fillRect(0, y, width, 1);
    }

    this.offscreenCtx.globalAlpha = 1;
  }

  /**
   * Apply pixelation effect
   */
  private applyPixelation(width: number, height: number, pixelSize: number): void {
    const scaledWidth = Math.floor(width / pixelSize);
    const scaledHeight = Math.floor(height / pixelSize);

    // Draw scaled down
    this.tempCtx.clearRect(0, 0, width, height);
    this.tempCtx.imageSmoothingEnabled = false;
    this.tempCtx.drawImage(
      this.offscreenCanvas,
      0, 0, width, height,
      0, 0, scaledWidth, scaledHeight
    );

    // Draw scaled back up
    this.offscreenCtx.clearRect(0, 0, width, height);
    this.offscreenCtx.imageSmoothingEnabled = false;
    this.offscreenCtx.drawImage(
      this.tempCanvas,
      0, 0, scaledWidth, scaledHeight,
      0, 0, width, height
    );
  }

  /**
   * Apply chromatic aberration effect
   */
  applyChromaticAberration(width: number, height: number, offset: number = 2): void {
    const imageData = this.offscreenCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        // Red channel - shift left
        const rIndex = (y * width + Math.max(0, x - offset)) * 4;
        newData[i] = data[rIndex];

        // Green channel - no shift
        newData[i + 1] = data[i + 1];

        // Blue channel - shift right
        const bIndex = (y * width + Math.min(width - 1, x + offset)) * 4;
        newData[i + 2] = data[bIndex + 2];

        // Alpha
        newData[i + 3] = data[i + 3];
      }
    }

    const newImageData = new ImageData(newData, width, height);
    this.offscreenCtx.putImageData(newImageData, 0, 0);
  }
}

/**
 * Screen Shake Effect
 */
export class ScreenShake {
  private intensity = 0;
  private duration = 0;
  private elapsed = 0;

  /**
   * Trigger screen shake
   */
  shake(intensity: number, duration: number): void {
    this.intensity = intensity;
    this.duration = duration;
    this.elapsed = 0;
  }

  /**
   * Update shake effect
   */
  update(deltaTime: number): { x: number; y: number } {
    if (this.elapsed >= this.duration) {
      return { x: 0, y: 0 };
    }

    this.elapsed += deltaTime;
    const progress = this.elapsed / this.duration;
    const currentIntensity = this.intensity * (1 - progress);

    return {
      x: (Math.random() - 0.5) * currentIntensity * 2,
      y: (Math.random() - 0.5) * currentIntensity * 2,
    };
  }

  /**
   * Check if shake is active
   */
  isActive(): boolean {
    return this.elapsed < this.duration;
  }
}

/**
 * Camera Zoom Effect
 */
export class CameraZoom {
  private currentZoom = 1;
  private targetZoom = 1;
  private zoomSpeed = 0.1;

  /**
   * Set target zoom level
   */
  setZoom(zoom: number): void {
    this.targetZoom = Math.max(0.5, Math.min(3, zoom));
  }

  /**
   * Update zoom interpolation
   */
  update(): number {
    this.currentZoom += (this.targetZoom - this.currentZoom) * this.zoomSpeed;
    return this.currentZoom;
  }

  /**
   * Get current zoom
   */
  getZoom(): number {
    return this.currentZoom;
  }

  /**
   * Reset zoom
   */
  reset(): void {
    this.currentZoom = 1;
    this.targetZoom = 1;
  }
}
