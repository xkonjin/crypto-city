'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * ErrorBoundary Component (Issue #51)
 * 
 * A React error boundary that catches JavaScript errors in child component tree,
 * logs them, and displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Store error info for display
    this.setState({ errorInfo });

    // Call optional error callback (for future remote logging)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Attempt to save game state before showing error UI
    this.saveGameState();
  }

  private saveGameState(): void {
    try {
      // Game state is auto-saved to localStorage, but we can trigger a save here
      // This is a safety measure - the game already auto-saves frequently
      const savedState = localStorage.getItem('isocity-game-state');
      if (savedState) {
        // Create a backup with timestamp
        localStorage.setItem(
          `isocity-game-state-backup-${Date.now()}`,
          savedState
        );
        // Clean up old backups (keep only last 3)
        this.cleanupBackups();
      }
    } catch (e) {
      console.error('Failed to save game state backup:', e);
    }
  }

  private cleanupBackups(): void {
    try {
      const backupKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('isocity-game-state-backup-')) {
          backupKeys.push(key);
        }
      }
      // Sort by timestamp (newest first) and remove older ones
      backupKeys.sort().reverse();
      backupKeys.slice(3).forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore cleanup errors
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReturnToMenu = (): void => {
    // Navigate to home by reloading the page (clears error state)
    window.location.href = '/';
  };

  private toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error fallback UI
      return (
        <div
          data-testid="error-fallback"
          className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8"
        >
          <div className="max-w-lg w-full bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-16 h-16 text-amber-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            
            <p className="text-slate-400 mb-6">
              An unexpected error occurred. Your game progress has been saved.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={this.handleReset}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleReturnToMenu}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Menu
              </Button>
            </div>

            {/* Collapsible error details for developers */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 text-left">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-400 transition-colors"
                  data-testid="error-details-toggle"
                >
                  {this.state.showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Technical Details
                </button>
                
                {this.state.showDetails && (
                  <div
                    data-testid="error-details"
                    className="mt-2 p-3 bg-slate-900/50 rounded border border-slate-700 text-xs font-mono text-slate-400 overflow-auto max-h-48"
                  >
                    <p className="text-red-400 mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="whitespace-pre-wrap text-slate-500">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * GameErrorFallback Component
 * 
 * A crypto-themed error fallback UI for the Game component.
 * Displays a sardonic Cobie-style message when the game crashes.
 */
interface GameErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  onReturnToMenu: () => void;
}

// Cobie-style sardonic quotes for error messages
const COBIE_ERROR_QUOTES = [
  "Looks like we got rugged... by our own code.",
  "The probability of this error was never zero.",
  "NGMI. At least not until you refresh.",
  "Your portfolio is safe, but our code isn't.",
  "Risk management: even our code needs it.",
  "This is fine. Everything is fine. *nervous laughter*",
  "Funds are safu. Code, not so much.",
  "Another one bites the dust. Try again?",
];

export function GameErrorFallback({
  error,
  errorInfo,
  onReset,
  onReturnToMenu,
}: GameErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [quote] = React.useState(() => 
    COBIE_ERROR_QUOTES[Math.floor(Math.random() * COBIE_ERROR_QUOTES.length)]
  );

  return (
    <div
      data-testid="game-error-fallback"
      className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 flex items-center justify-center p-8"
    >
      <div className="max-w-lg w-full bg-slate-800/50 border border-red-900/50 rounded-lg p-8 text-center relative overflow-hidden">
        {/* Decorative "rugged" pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,0,0,0.1) 10px, rgba(255,0,0,0.1) 20px)',
          }} />
        </div>

        <div className="relative z-10">
          {/* RUGGED text with glitch effect */}
          <div className="mb-6">
            <h1 
              className="text-4xl font-black text-red-500 tracking-wider animate-pulse"
              style={{
                textShadow: '2px 2px 0 #7f1d1d, -2px -2px 0 #450a0a',
              }}
            >
              RUGGED
            </h1>
            <p className="text-xs text-red-400/60 mt-1 uppercase tracking-widest">
              Critical Error
            </p>
          </div>

          {/* Cobie quote */}
          <div className="mb-6 p-4 bg-slate-900/50 rounded border border-slate-700">
            <p className="text-amber-400 italic text-lg">
              &ldquo;{quote}&rdquo;
            </p>
            <p className="text-slate-500 text-xs mt-2">
              — Cobie (probably)
            </p>
          </div>

          <p className="text-slate-400 mb-6">
            Don&apos;t worry — your city is backed up. Hit retry or head back to the menu.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={onReset}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              onClick={onReturnToMenu}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Menu
            </Button>
          </div>

          {/* Collapsible error details */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mt-6 text-left">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-400 transition-colors"
              >
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Show Technical Details
              </button>
              
              {showDetails && (
                <div className="mt-2 p-3 bg-slate-900/50 rounded border border-slate-700 text-xs font-mono text-slate-400 overflow-auto max-h-48">
                  <p className="text-red-400 mb-2">
                    {error.name}: {error.message}
                  </p>
                  {errorInfo && (
                    <pre className="whitespace-pre-wrap text-slate-500">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * GameErrorBoundary Component
 * 
 * A specialized error boundary for the Game component that uses
 * the crypto-themed GameErrorFallback UI.
 */
interface GameErrorBoundaryProps {
  children: ReactNode;
  onExit?: () => void;
}

interface GameErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GameErrorBoundary extends Component<GameErrorBoundaryProps, GameErrorBoundaryState> {
  constructor(props: GameErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<GameErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('GameErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    this.setState({ errorInfo });

    // Attempt to save game state
    this.saveGameState();
  }

  private saveGameState(): void {
    try {
      const savedState = localStorage.getItem('isocity-game-state');
      if (savedState) {
        localStorage.setItem(
          `isocity-game-state-backup-${Date.now()}`,
          savedState
        );
      }
    } catch (e) {
      console.error('Failed to save game state backup:', e);
    }
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReturnToMenu = (): void => {
    // Call onExit if provided, otherwise navigate to home
    if (this.props.onExit) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
      this.props.onExit();
    } else {
      window.location.href = '/';
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <GameErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onReturnToMenu={this.handleReturnToMenu}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
