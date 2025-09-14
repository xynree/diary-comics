'use client';

import React, { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleClick = () => {
    if (onClick && !isMobile) {
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
      <div className={`bg-gray-100 flex items-center justify-center min-h-[200px] ${
        isMobile ? 'rounded-none' : 'rounded-lg'
      } ${className}`}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div
      className={`relative group transition-transform duration-200 ${
        isMobile ? '' : 'cursor-pointer'
      } ${className}`}
      onClick={handleClick}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse z-10 ${
          isMobile ? 'rounded-none' : 'rounded-lg'
        }`} />
      )}
      
      {/* Main image */}
      <div className={`relative overflow-hidden shadow-md transition-shadow duration-200 ${
        isMobile ? 'rounded-none' : 'rounded-lg group-hover:shadow-lg'
      }`}>
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


