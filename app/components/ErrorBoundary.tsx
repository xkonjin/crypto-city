"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a crypto-themed fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    
    this.setState({ errorInfo });
    
    // TODO: Could send to error tracking service here
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    // Clear any saved state that might be causing the error
    try {
      localStorage.removeItem("cryptoCitySave");
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default crypto-themed error UI
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.icon}>💀</div>
            <h1 style={styles.title}>FUNDS NOT SAFU</h1>
            <p style={styles.subtitle}>Something went wrong in Crypto City</p>
            
            <div style={styles.errorBox}>
              <code style={styles.errorText}>
                {this.state.error?.message || "Unknown error occurred"}
              </code>
            </div>

            <div style={styles.buttonContainer}>
              <button onClick={this.handleReload} style={styles.primaryButton}>
                🔄 Reload App
              </button>
              <button onClick={this.handleReset} style={styles.secondaryButton}>
                🗑️ Reset & Reload
              </button>
            </div>

            <p style={styles.hint}>
              If the error persists after reload, try "Reset & Reload" to clear saved data.
            </p>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details style={styles.details}>
                <summary style={styles.summary}>Stack Trace (Dev Only)</summary>
                <pre style={styles.stack}>
                  {this.state.error?.stack}
                  {"\n\nComponent Stack:"}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline styles to avoid dependency on external CSS
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a0f",
    padding: "20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: "16px",
    padding: "40px",
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
    border: "1px solid #ff4444",
    boxShadow: "0 0 40px rgba(255, 68, 68, 0.2)",
  },
  icon: {
    fontSize: "64px",
    marginBottom: "16px",
  },
  title: {
    color: "#ff4444",
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0 0 8px 0",
    letterSpacing: "2px",
  },
  subtitle: {
    color: "#888",
    fontSize: "16px",
    margin: "0 0 24px 0",
  },
  errorBox: {
    backgroundColor: "#0f0f1a",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
    border: "1px solid #333",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: "14px",
    wordBreak: "break-word",
  },
  buttonContainer: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    marginBottom: "16px",
  },
  primaryButton: {
    backgroundColor: "#4ade80",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    color: "#888",
    border: "1px solid #444",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
  },
  hint: {
    color: "#666",
    fontSize: "12px",
    margin: "0",
  },
  details: {
    marginTop: "24px",
    textAlign: "left",
  },
  summary: {
    color: "#888",
    cursor: "pointer",
    fontSize: "12px",
    marginBottom: "8px",
  },
  stack: {
    backgroundColor: "#0f0f1a",
    color: "#ff6b6b",
    padding: "16px",
    borderRadius: "8px",
    fontSize: "10px",
    overflow: "auto",
    maxHeight: "200px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
};

export default ErrorBoundary;

