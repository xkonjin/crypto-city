/**
 * RetroPanel Component
 * 
 * A reusable panel with retro pixel-art frame styling.
 * Used for consistent visual language across landing and game.
 * 
 * Issue #162: Aesthetic cohesion between landing/game pages
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RetroPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'transparent';
  showCorners?: boolean;
  showFrame?: boolean;
}

/**
 * Retro-styled panel with optional frame and corner decorations.
 * Matches the landing page aesthetic for use in game UI.
 */
export function RetroPanel({
  children,
  className,
  variant = 'default',
  showCorners = true,
  showFrame = true,
}: RetroPanelProps) {
  const frameStyles = showFrame ? {
    background: 'linear-gradient(135deg, #8b7355 0%, #5c4033 50%, #3d2817 100%)',
    boxShadow: 'inset 0 0 0 2px #2d1810, inset 0 0 0 4px #a08060, 4px 4px 0 rgba(0,0,0,0.5)',
  } : {};

  const innerStyles = {
    default: {
      background: 'linear-gradient(180deg, #2d1b4e 0%, #1a1030 100%)',
      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
    },
    compact: {
      background: 'linear-gradient(180deg, rgba(45, 27, 78, 0.9) 0%, rgba(26, 16, 48, 0.9) 100%)',
      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
    },
    transparent: {
      background: 'rgba(26, 16, 48, 0.8)',
      backdropFilter: 'blur(8px)',
    },
  };

  return (
    <div
      className={cn('p-1 relative', className)}
      style={frameStyles}
    >
      <div
        className="relative p-4 sm:p-6 md:p-8"
        style={innerStyles[variant]}
      >
        {/* Corner decorations */}
        {showCorners && (
          <>
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-600/60" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-600/60" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-600/60" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-600/60" />
          </>
        )}
        
        {children}
      </div>
    </div>
  );
}

/**
 * Retro-styled button matching the landing page aesthetic.
 */
interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function RetroButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: RetroButtonProps) {
  const baseStyles = 'relative font-mono font-bold uppercase tracking-wider transition-all duration-150 group';
  
  const sizeStyles = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg',
  };
  
  const variantStyles = {
    primary: {
      background: 'linear-gradient(180deg, #4a3728 0%, #2d1f15 100%)',
      border: '3px solid #8b7355',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3), 3px 3px 0 rgba(0,0,0,0.4)',
      color: '#fbbf24',
    },
    secondary: {
      background: 'linear-gradient(180deg, #3a2a4a 0%, #251a30 100%)',
      border: '3px solid #6b5b7b',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.3), 3px 3px 0 rgba(0,0,0,0.4)',
      color: '#b8a0d0',
    },
    ghost: {
      background: 'transparent',
      border: '2px solid rgba(255,255,255,0.2)',
      color: 'rgba(255,255,255,0.7)',
    },
  };
  
  return (
    <button
      className={cn(baseStyles, sizeStyles[size], className)}
      style={variantStyles[variant]}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

/**
 * Pixel-art style title text
 */
interface RetroTitleProps {
  children: React.ReactNode;
  variant?: 'gold' | 'crypto' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function RetroTitle({
  children,
  variant = 'gold',
  size = 'lg',
  className,
}: RetroTitleProps) {
  const sizeStyles = {
    sm: 'text-2xl md:text-3xl',
    md: 'text-3xl md:text-4xl',
    lg: 'text-4xl md:text-5xl lg:text-6xl',
    xl: 'text-5xl md:text-6xl lg:text-7xl',
  };
  
  const variantStyles = {
    gold: {
      color: '#ffd700',
      textShadow: '3px 3px 0 #b8860b, 6px 6px 0 #8b6914, -1px -1px 0 #fff8dc',
    },
    crypto: {
      color: '#00ffcc',
      textShadow: '3px 3px 0 #00997a, 6px 6px 0 #006652, -1px -1px 0 #b2fff0',
    },
    white: {
      color: '#ffffff',
      textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
    },
  };
  
  return (
    <h1
      className={cn(
        'font-mono font-bold tracking-tight',
        sizeStyles[size],
        className
      )}
      style={variantStyles[variant]}
    >
      {children}
    </h1>
  );
}

/**
 * Subtitle text with retro styling
 */
interface RetroSubtitleProps {
  children: React.ReactNode;
  className?: string;
}

export function RetroSubtitle({ children, className }: RetroSubtitleProps) {
  return (
    <p
      className={cn(
        'text-sm tracking-widest uppercase font-mono text-gray-400',
        className
      )}
      style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.5)' }}
    >
      {children}
    </p>
  );
}

/**
 * Decorative pixel stars background
 */
interface PixelStarsProps {
  count?: number;
  className?: string;
}

export function PixelStars({ count = 30, className }: PixelStarsProps) {
  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/40"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 23) % 100}%`,
            animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

/**
 * Pixel grid overlay for retro aesthetic
 */
export function PixelGridOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn('absolute inset-0 pointer-events-none opacity-[0.03]', className)}
      style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px)
        `,
      }}
    />
  );
}
