/**
 * EVA Desktop Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * @author EVA Development Team
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary Component
 * Wraps components to catch and handle React errors gracefully
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error 
    };
  }

  /**
   * Log error details and notify parent component
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error details (will be picked up by our logging system)
    console.error('EVA Error Boundary caught an error:', error, errorInfo);

    // Call parent error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Report to renderer's error handling system once implemented
    // if (window.electronAPI?.errorHandler) {
    //   window.electronAPI.errorHandler.reportRendererError({
    //     message: error.message,
    //     stack: error.stack,
    //     componentStack: errorInfo.componentStack,
    //     timestamp: new Date().toISOString()
    //   });
    // }
  }

  /**
   * Reset error state to try rendering again
   */
  resetErrorBoundary = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2 className="error-title">Something went wrong</h2>
            <p className="error-message">
              We apologize for the inconvenience. This component encountered an unexpected error.
            </p>
            <div className="error-actions">
              <button 
                className="error-retry-btn"
                onClick={this.resetErrorBoundary}
              >
                Try Again
              </button>
              <button 
                className="error-reload-btn"
                onClick={() => window.location.reload()}
              >
                Reload Application
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre className="error-stack">
                  {this.state.error?.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="error-component-stack">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook to manually trigger error boundary (for testing or manual error reporting)
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: Partial<ErrorInfo>) => {
    // Create a synthetic error to trigger the boundary
    setTimeout(() => {
      throw error;
    }, 0);
  };
} 