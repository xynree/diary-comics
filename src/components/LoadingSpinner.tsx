import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

/**
 * Reusable loading spinner component
 * 
 * Features:
 * - Multiple sizes (sm, md, lg)
 * - Optional loading text
 * - Customizable styling
 * - Accessible with proper ARIA labels
 */
export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text = 'Loading...' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
        role="status"
        aria-label={text}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600" aria-live="polite">
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * Full-page loading overlay
 */
export function LoadingOverlay({ text = 'Loading your diary comics...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

/**
 * Inline loading state for components
 */
export function InlineLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}
