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
        <div className="text-center text-gray-500 p-4">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm">Failed to load image</p>
          <p className="text-xs text-gray-400 mt-1">{image.filename}</p>
        </div>
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
        
        {/* Overlay with image info (appears on hover) */}
        <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-end">
          <div className="w-min p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <div className="bg-white bg-opacity-50 rounded px-2 py-1 text-xs">
              <p className="font-bold">{image.filename}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightbox/Modal component for viewing images in full size
 */
interface ImageModalProps {
  image: DiaryImageType | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function ImageModal({ image, isOpen, onClose, onNext, onPrevious }: ImageModalProps) {
  if (!isOpen || !image) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        aria-label="Close modal"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation buttons */}
      {onPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
          aria-label="Previous image"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
          aria-label="Next image"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div className="flex items-center justify-center w-full h-full">
        <Image
          src={image.secureUrl}
          alt={`Diary entry from ${image.filename}`}
          width={image.width}
          height={image.height}
          priority
          objectFit="contain"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Image info */}
      <div className="absolute bottom-4 left-4 right-4 text-white text-center">
        <div className="bg-black bg-opacity-50 rounded px-4 py-2 inline-block">
          <p className="font-medium">{image.filename}</p>
          <p className="text-sm text-gray-300">
            {image.width} × {image.height} • {Math.round(image.bytes / 1024)}KB
          </p>
        </div>
      </div>
    </div>
  );
}
