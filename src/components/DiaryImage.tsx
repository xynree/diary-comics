'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { DiaryImage as DiaryImageType } from '@/types/diary';

interface DiaryImageProps {
  image: DiaryImageType;
  priority?: boolean;
  className?: string;
  onClick?: (image: DiaryImageType) => void;
}

/**
 * Individual diary image component with optimized loading and interaction
 * 
 * Features:
 * - Next.js Image optimization
 * - Loading states and error handling
 * - Click interaction support
 * - Responsive sizing
 * - Accessibility support
 */
export function DiaryImage({ 
  image, 
  priority = false, 
  className = '',
  onClick 
}: DiaryImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(image);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Fallback to clear loading state after a reasonable timeout
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (hasError) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center min-h-[200px] ${className}`}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative group cursor-pointer transition-transform duration-200 hover:scale-[1.02] ${className}`}
      onClick={handleClick}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg z-10" />
      )}
      
      {/* Main image */}
      <div className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200">
        <Image
          src={image.secureUrl}
          alt={`Diary entry from ${image.filename}`}
          width={image.width}
          height={image.height}
          priority={priority}
          className="w-full h-auto object-cover"
          onLoad={handleLoad}
          onError={handleError}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        

      </div>
    </div>
  );
}


