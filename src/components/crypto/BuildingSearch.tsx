/**
 * BuildingSearch Component
 * 
 * Search functionality for crypto buildings with debouncing and highlighting.
 * Issue #205: Add search functionality.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface BuildingSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function BuildingSearch({ 
  value, 
  onChange, 
  placeholder = 'Search buildings...',
  className = '' 
}: BuildingSearchProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300); // 300ms debounce
  }, [onChange]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Handle keyboard shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear search
  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div 
      data-testid="building-search" 
      className={`relative ${className}`}
    >
      {/* Search Icon */}
      <div 
        data-testid="search-icon"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      >
        <Search size={16} />
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full pl-9 pr-9 py-2 
          bg-gray-800/50 border border-gray-600/50 
          rounded-lg text-sm text-white placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
          transition-all
        `}
      />

      {/* Clear Button */}
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X size={16} />
        </button>
      )}

      {/* Keyboard Shortcut Hint */}
      {!localValue && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs hidden sm:block">
          ⌘K
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TEXT HIGHLIGHTER UTILITY
// =============================================================================

interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
}

export function HighlightedText({ text, highlight, className = '' }: HighlightedTextProps) {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${escapeRegex(highlight)})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMatch = regex.test(part);
        // Reset regex lastIndex after test
        regex.lastIndex = 0;
        
        return isMatch ? (
          <mark key={i} className="highlight bg-yellow-500/30 text-yellow-200 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================================================
// NO RESULTS COMPONENT
// =============================================================================

interface NoResultsProps {
  searchTerm: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
}

export function NoResults({ 
  searchTerm, 
  suggestions = ['DeFi', 'Meme', 'Solana', 'Ethereum'],
  onSuggestionClick,
  className = '' 
}: NoResultsProps) {
  return (
    <div data-testid="no-results" className={`text-center py-8 ${className}`}>
      <div className="text-gray-400 mb-2">
        No results found for &quot;{searchTerm}&quot;
      </div>
      <div className="text-gray-500 text-sm mb-4">
        Try searching for:
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick?.(suggestion)}
            className="px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-full text-sm transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
