'use client';

import React, { useState, useRef } from 'react';
import { DiaryEntry as DiaryEntryType, DiaryImage as DiaryImageType } from '@/types/diary';
import { DiaryImage } from './DiaryImage';
import { ImageModal } from './ImageModal';
import { formatDisplayDate } from '@/utils/dateParser';

interface DiaryEntryProps {
  entry: DiaryEntryType;
  priority?: boolean;
  className?: string;
}

/**
 * Component for displaying a complete diary entry (all images for one day)
 * 
 * Features:
 * - Displays date header with formatted date
 * - Shows all images for the day in a responsive grid
 * - Handles single or multiple images per day
 * - Lightbox modal for full-size viewing
 * - Keyboard navigation support
 */
export function DiaryEntry({ entry, priority = false, className = '' }: DiaryEntryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleImageClick = (image: DiaryImageType) => {
    const index = entry.images.findIndex(img => img.publicId === image.publicId);
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < entry.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (event.key) {
        case 'Escape':
          handleCloseModal();
          break;
        case 'ArrowRight':
          handleNextImage();
          break;
        case 'ArrowLeft':
          handlePreviousImage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedImageIndex]);

  const selectedImage = selectedImageIndex !== null ? entry.images[selectedImageIndex] : null;

  return (
    <article className={`mb-12 ${className}`}>
      {/* Date Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {formatDisplayDate(entry.date)}
            </h2>

          </div>
          
          {/* Entry actions */}
          <div className="flex items-center space-x-1">
            <div className="flex items-center text-sm text-gray-600">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {entry.imageCount}
              </span>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="mt-4 h-px bg-gradient-to-r from-gray-300 via-gray-200 to-transparent"></div>
      </header>

      {/* Images Carousel */}
      <ImageCarousel
        images={entry.images}
        onImageClick={handleImageClick}
        priority={priority}
      />

      {/* Image Modal */}
      <ImageModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onNext={selectedImageIndex !== null && selectedImageIndex < entry.images.length - 1 ? handleNextImage : undefined}
        onPrevious={selectedImageIndex !== null && selectedImageIndex > 0 ? handlePreviousImage : undefined}
      />
    </article>
  );
}



/**
 * Horizontal carousel component for displaying diary images
 */
interface ImageCarouselProps {
  images: DiaryImageType[];
  onImageClick: (image: DiaryImageType) => void;
  priority?: boolean;
  className?: string;
}

function ImageCarousel({ images, onImageClick, priority = false, className = '' }: ImageCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(images.length > 1);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Single image - display centered without carousel controls
  if (images.length === 1) {
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        <DiaryImage
          image={images[0]}
          priority={priority}
          onClick={onImageClick}
          className="transition-all duration-200"
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((image, index) => (
          <div key={image.publicId} className="flex-shrink-0 w-full max-w-2xl">
            <DiaryImage
              image={image}
              priority={priority && index === 0}
              onClick={onImageClick}
              className="transition-all duration-200"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
