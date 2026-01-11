'use client';

/**
 * CryptoOverlaySelector Component (Issue #58)
 *
 * UI component for selecting crypto overlay visualization modes.
 * Displays buttons for yield, risk, protection, and density overlays.
 */

import React from 'react';
import {
  CryptoOverlayType,
  getCryptoOverlayOptions,
  CRYPTO_OVERLAY_CONFIGS,
} from '@/lib/cryptoOverlays';
import { cn } from '@/lib/utils';

export interface CryptoOverlaySelectorProps {
  /** Currently selected overlay type */
  currentOverlay: CryptoOverlayType;
  /** Callback when overlay type changes */
  onSelect: (type: CryptoOverlayType) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function CryptoOverlaySelector({
  currentOverlay,
  onSelect,
  disabled = false,
  className,
}: CryptoOverlaySelectorProps) {
  const options = getCryptoOverlayOptions();

  return (
    <div
      data-testid="crypto-overlay-selector"
      className={cn(
        'flex flex-wrap gap-1 p-1 bg-gray-800/50 rounded-lg',
        className
      )}
    >
      {options.map((option) => {
        const isActive = currentOverlay === option.type;
        const isNone = option.type === 'none';

        return (
          <button
            key={option.type}
            data-overlay={option.type}
            onClick={() => onSelect(option.type)}
            disabled={disabled}
            title={option.description}
            className={cn(
              'px-2 py-1 text-xs font-medium rounded transition-all duration-200',
              'flex items-center gap-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isActive
                ? cn(
                    option.activeColor || 'bg-gray-600',
                    'text-white shadow-lg',
                    !isNone && 'ring-2 ring-white/30'
                  )
                : cn(
                    'bg-gray-700/50 text-gray-300',
                    'hover:bg-gray-600/50 hover:text-white'
                  )
            )}
          >
            <span className="text-sm">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact version of the overlay selector for mobile/tight spaces
 */
export function CryptoOverlaySelectorCompact({
  currentOverlay,
  onSelect,
  disabled = false,
  className,
}: CryptoOverlaySelectorProps) {
  const options = getCryptoOverlayOptions().filter((o) => o.type !== 'none');
  const config = CRYPTO_OVERLAY_CONFIGS[currentOverlay];

  return (
    <div
      data-testid="crypto-overlay-selector"
      className={cn('flex gap-0.5', className)}
    >
      {/* Toggle button shows current state */}
      <button
        data-overlay="none"
        onClick={() => onSelect(currentOverlay === 'none' ? 'yield' : 'none')}
        disabled={disabled}
        title={currentOverlay === 'none' ? 'Show overlays' : 'Hide overlays'}
        className={cn(
          'px-1.5 py-1 text-xs rounded-l transition-all',
          currentOverlay !== 'none'
            ? cn(config.activeColor, 'text-white')
            : 'bg-gray-700/50 text-gray-400 hover:text-white'
        )}
      >
        {currentOverlay === 'none' ? '👁️' : config.icon}
      </button>

      {/* Cycle button */}
      {currentOverlay !== 'none' && (
        <button
          onClick={() => {
            const currentIndex = options.findIndex(
              (o) => o.type === currentOverlay
            );
            const nextIndex = (currentIndex + 1) % options.length;
            onSelect(options[nextIndex].type);
          }}
          disabled={disabled}
          className={cn(
            'px-1.5 py-1 text-xs rounded-r transition-all',
            'bg-gray-700/50 text-gray-400 hover:text-white'
          )}
          title="Next overlay"
        >
          ▶
        </button>
      )}
    </div>
  );
}

export default CryptoOverlaySelector;
