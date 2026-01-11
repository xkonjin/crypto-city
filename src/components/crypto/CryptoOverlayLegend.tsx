'use client';

/**
 * CryptoOverlayLegend Component (Issue #58)
 *
 * Displays a color legend for the current crypto overlay type.
 * Shows gradient scale with min/max labels.
 */

import React from 'react';
import {
  CryptoOverlayType,
  getOverlayLegend,
  CRYPTO_OVERLAY_CONFIGS,
} from '@/lib/cryptoOverlays';
import { cn } from '@/lib/utils';

export interface CryptoOverlayLegendProps {
  /** Current overlay type to display legend for */
  type: CryptoOverlayType;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

export function CryptoOverlayLegend({
  type,
  className,
  compact = false,
}: CryptoOverlayLegendProps) {
  // Don't render for 'none' overlay
  if (type === 'none') {
    return null;
  }

  const legend = getOverlayLegend(type);
  const config = CRYPTO_OVERLAY_CONFIGS[type];

  // Create CSS gradient from color scale
  const gradientStops = legend.colorScale
    .map((point) => `${point.color} ${point.value * 100}%`)
    .join(', ');

  if (compact) {
    return (
      <div
        data-testid="crypto-overlay-legend"
        className={cn(
          'overlay-legend flex items-center gap-1 px-2 py-1 bg-gray-900/80 rounded text-xs',
          className
        )}
      >
        <span className="text-gray-400">{config.icon}</span>
        <div
          className="w-16 h-2 rounded"
          style={{ background: `linear-gradient(to right, ${gradientStops})` }}
        />
        <span className="text-gray-400 text-[10px]">{legend.maxLabel}</span>
      </div>
    );
  }

  return (
    <div
      data-testid="crypto-overlay-legend"
      className={cn(
        'overlay-legend bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 min-w-[180px]',
        'border border-gray-700/50 shadow-lg',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{config.icon}</span>
        <div>
          <h4 className="text-sm font-semibold text-white">{legend.title}</h4>
          <p className="text-[10px] text-gray-400 leading-tight">
            {legend.description}
          </p>
        </div>
      </div>

      {/* Gradient bar */}
      <div className="relative h-4 rounded-sm overflow-hidden mb-1">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${gradientStops})` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{legend.minLabel}</span>
        <span>{legend.maxLabel}</span>
      </div>
    </div>
  );
}

/**
 * Floating legend that positions itself in the corner of the game canvas
 */
export function CryptoOverlayLegendFloating({
  type,
  position = 'bottom-left',
  className,
}: CryptoOverlayLegendProps & {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  if (type === 'none') {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div className={cn('absolute z-10', positionClasses[position], className)}>
      <CryptoOverlayLegend type={type} />
    </div>
  );
}

export default CryptoOverlayLegend;
