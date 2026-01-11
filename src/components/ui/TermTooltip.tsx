'use client';

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  getTooltip, 
  getMode, 
  getTerm,
  type TerminologySet 
} from '@/lib/terminology';
import { cn } from '@/lib/utils';

/**
 * TermTooltip Component (Issue #64)
 * 
 * Wraps crypto terms with tooltips that explain them to new players.
 * Only shows tooltips in crypto mode - in classic mode, shows plain text.
 */

export interface TermTooltipProps {
  /** The terminology key to look up */
  term: keyof TerminologySet;
  /** Optional custom children - if not provided, uses the term text */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the dotted underline styling */
  showUnderline?: boolean;
}

export function TermTooltip({ 
  term, 
  children, 
  className,
  showUnderline = true,
}: TermTooltipProps) {
  const mode = getMode();
  const termText = getTerm(term);
  const tooltip = getTooltip(term);
  
  // In classic mode or if no tooltip, just render the term
  if (mode === 'classic' || !tooltip) {
    return <span className={className}>{children || termText}</span>;
  }
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn(
              showUnderline && 'underline decoration-dotted decoration-muted-foreground/50 cursor-help',
              className
            )}
            data-term-tooltip={term}
          >
            {children || termText}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          className="max-w-xs p-3 space-y-1.5"
          side="top"
        >
          <div className="font-semibold text-foreground">{tooltip.term}</div>
          <div className="text-sm text-muted-foreground">{tooltip.definition}</div>
          {tooltip.example && (
            <div className="text-xs text-muted-foreground/75 italic border-l-2 border-primary/30 pl-2 mt-1">
              {tooltip.example}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Term Component - Simple term display that adapts to terminology mode
 * 
 * Use this when you just need to display a term without tooltip
 */
export interface TermProps {
  /** The terminology key to look up */
  term: keyof TerminologySet;
  /** Additional CSS classes */
  className?: string;
}

export function Term({ term, className }: TermProps) {
  const termText = getTerm(term);
  return <span className={className}>{termText}</span>;
}

export default TermTooltip;
