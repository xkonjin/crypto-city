/**
 * RiskBadge Component
 * 
 * Color-coded badge showing risk level with visual indicators.
 * Issue #206: Make risk immediately visible.
 */

'use client';

import React from 'react';

// =============================================================================
// TYPES
// =============================================================================

type RiskLevel = 'very-low' | 'low' | 'medium' | 'high' | 'degen';

interface RiskBadgeProps {
  /** Risk probability (0-1) */
  risk: number;
  /** Whether to show compact version */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function getRiskLevel(risk: number): RiskLevel {
  if (!risk || risk === 0) return 'very-low';
  if (risk < 0.01) return 'low';
  if (risk < 0.05) return 'medium';
  if (risk < 0.1) return 'high';
  return 'degen';
}

function getRiskConfig(level: RiskLevel): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  pulse: boolean;
  showSkull: boolean;
} {
  switch (level) {
    case 'very-low':
      return {
        label: 'Very Low',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        pulse: false,
        showSkull: false,
      };
    case 'low':
      return {
        label: 'Low',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        pulse: false,
        showSkull: false,
      };
    case 'medium':
      return {
        label: 'Medium',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        pulse: false,
        showSkull: false,
      };
    case 'high':
      return {
        label: 'High',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30',
        pulse: false,
        showSkull: false,
      };
    case 'degen':
      return {
        label: 'Degen',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        pulse: true,
        showSkull: true,
      };
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function RiskBadge({ risk, compact = false, className = '' }: RiskBadgeProps) {
  const level = getRiskLevel(risk);
  const config = getRiskConfig(level);

  return (
    <span
      data-testid="risk-badge"
      className={`
        inline-flex items-center gap-1 font-medium rounded
        ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}
        ${config.color} ${config.bgColor} border ${config.borderColor}
        ${config.pulse ? 'animate-pulse' : ''}
        risk-${level}
        ${className}
      `}
    >
      {config.showSkull && (
        <span data-testid="risk-skull-icon" className="text-red-500">
          💀
        </span>
      )}
      <span data-testid="risk-level-text">{config.label}</span>
    </span>
  );
}

// Export helper for external use
export { getRiskLevel, getRiskConfig, type RiskLevel };
