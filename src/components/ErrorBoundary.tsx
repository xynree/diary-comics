'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error!} 
          reset={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full bg-gray-50 border border-gray-200 rounded p-8">
        <div className="text-center mb-6">
          <svg className="h-10 w-10 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-light text-gray-900 tracking-wide">
            Something went wrong
          </h3>
        </div>

        <div className="mb-8">
          <p className="text-sm text-gray-500 font-light text-center">
            We encountered an error while loading your diary comics. This might be a temporary issue.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 font-light">
                Error details (development only)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-auto font-mono">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-3 text-sm font-medium tracking-wide text-gray-700 border border-gray-300 hover:border-gray-900 hover:text-gray-900 transition-all duration-200 bg-white"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-3 text-sm font-medium tracking-wide text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-all duration-200 bg-white"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
