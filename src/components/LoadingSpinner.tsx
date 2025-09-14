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
    md: 'w-6 h-6',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-200 border-t-gray-600 ${sizeClasses[size]}`}
        role="status"
        aria-label={text}
      />
      {text && (
        <p className="mt-3 text-sm text-gray-400 font-light tracking-wide" aria-live="polite">
          {text}
        </p>
      )}
    </div>
  );
}


