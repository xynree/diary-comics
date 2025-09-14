'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { DiaryImage } from '@/types/diary';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

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
        className="absolute top-6 right-6 text-white/80 hover:text-white z-10 transition-colors duration-200"
        aria-label="Close modal"
      >
        <CloseIcon className="w-6 h-6" />
      </button>

      {/* Previous button */}
      {onPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white z-10 transition-colors duration-200"
          aria-label="Previous image"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}

      {/* Next button */}
      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white z-10 transition-colors duration-200"
          aria-label="Next image"
        >
          <ChevronRightIcon className="w-6 h-6" />
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

    </div>
  );
}
