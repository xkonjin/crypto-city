"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCobieEvents } from '@/hooks/useCobieEvents';
import { COBIE_MANIFEST, type CobieLoopId, type CobieVariant } from '@/lib/figurines/cobieManifest';
import { getCobieFrameRect, loadCobieSpritesheet } from '@/lib/figurines/figurineLoader';

type CobieScreenProps = {
  variant?: CobieVariant;
  size?: number;
  className?: string;
};

export function CobieScreen({ variant, size = 96, className }: CobieScreenProps) {
  const { currentLoop } = useCobieEvents();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sheet, setSheet] = useState<HTMLImageElement | null>(null);

  const loopMeta = useMemo(() => COBIE_MANIFEST.loops[currentLoop], [currentLoop]);
  const activeVariant = variant || loopMeta.defaultVariant;

  useEffect(() => {
    let mounted = true;
    loadCobieSpritesheet(currentLoop, activeVariant).then((image) => {
      if (mounted) setSheet(image);
    });

    return () => {
      mounted = false;
    };
  }, [currentLoop, activeVariant]);

  useEffect(() => {
    if (!sheet || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let frameIndex = 0;
    const frameDuration = 1000 / loopMeta.fps;
    let lastFrameTime = performance.now();
    let rafId: number | null = null;

    const drawFrame = (time: number) => {
      if (!ctx) return;
      if (time - lastFrameTime >= frameDuration) {
        frameIndex = (frameIndex + 1) % loopMeta.frameCount;
        lastFrameTime = time;
      }

      ctx.clearRect(0, 0, loopMeta.frameWidth, loopMeta.frameHeight);
      const frame = getCobieFrameRect(loopMeta, frameIndex);
      ctx.drawImage(
        sheet,
        frame.sx,
        frame.sy,
        frame.sw,
        frame.sh,
        0,
        0,
        loopMeta.frameWidth,
        loopMeta.frameHeight
      );

      rafId = requestAnimationFrame(drawFrame);
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [sheet, loopMeta]);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 20px rgba(15, 23, 42, 0.25)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={loopMeta.frameWidth}
        height={loopMeta.frameHeight}
        style={{
          width: size - 12,
          height: size - 12,
          imageRendering: 'pixelated',
        }}
        aria-label={`Cobie ${currentLoop} animation`}
      />
    </div>
  );
}
