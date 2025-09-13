'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { DiaryImage } from '@/types/diary';

interface ImageModalProps {
  image: DiaryImage | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

/**
 * Simple image modal/lightbox component
 * 
 * Features:
 * - Full-screen image viewing
 * - Keyboard navigation (arrow keys, escape)
 * - Click outside to close
 * - Navigation arrows for multiple images
 */
export function ImageModal({ image, isOpen, onClose, onNext, onPrevious }: ImageModalProps) {
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (onPrevious) onPrevious();
          break;
        case 'ArrowRight':
          if (onNext) onNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

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

      {/* Previous button */}
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

      {/* Next button */}
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
          className="max-w-full max-h-full object-contain"
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
