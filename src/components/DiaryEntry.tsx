'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DiaryEntry as DiaryEntryType, DiaryImage as DiaryImageType } from '@/types/diary';
import { DiaryImage } from './DiaryImage';
import { ImageModal } from './ImageModal';
import { formatDisplayDate } from '@/utils/dateParser';
import { ImageIcon, CarouselLeftIcon, CarouselRightIcon } from './icons/Icons';

// Hook to detect mobile devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's md breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

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
  const isMobile = useIsMobile();

  const handleImageClick = (image: DiaryImageType) => {
    // Don't open modal on mobile devices
    if (isMobile) {
      return;
    }

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
    <article className={`mb-10 ${className}`}>
      {/* Date Header */}
      <header className="mb-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-light tracking-wide text-gray-900 mb-2">
              {formatDisplayDate(entry.date)}
            </h2>
          </div>

          {/* Entry actions */}
          <div className="flex items-center space-x-1">
            <div className="flex items-center text-xs text-gray-400">
              <span className="flex items-center font-light tracking-wide">
                <ImageIcon className="w-3 h-3 mr-1" />
                {entry.imageCount}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-8 h-px bg-gray-200 "></div>
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
      // Scroll by the width of one individual image plus gap
      const firstImage = scrollContainerRef.current.querySelector('.flex-shrink-0') as HTMLElement;
      if (firstImage) {
        const imageWidth = firstImage.offsetWidth + 16; // 16px for gap-4
        scrollContainerRef.current.scrollBy({ left: -imageWidth, behavior: 'smooth' });
      }
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      // Scroll by the width of one individual image plus gap
      const firstImage = scrollContainerRef.current.querySelector('.flex-shrink-0') as HTMLElement;
      if (firstImage) {
        const imageWidth = firstImage.offsetWidth + 16; // 16px for gap-4
        scrollContainerRef.current.scrollBy({ left: imageWidth, behavior: 'smooth' });
      }
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
          className="absolute left-6 top-1/2 -translate-y-1/2 z-10 bg-white/30 hover:bg-white/75 rounded-full p-4 transition-all duration-200 shadow-sm cursor-pointer"
          aria-label="Scroll left"
        >
          <CarouselLeftIcon className="w-3 h-3 text-gray-600" />
        </button>
      )}

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-10 bg-white/30 hover:bg-white/75  rounded-full p-4 transition-all duration-200 shadow-sm cursor-pointer"
          aria-label="Scroll right"
        >
          <CarouselRightIcon className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((image, index) => (
          <div key={image.publicId} className="flex-shrink-0 w-full max-w-2xl">
            <DiaryImage
              image={image}
              priority={priority && index === 0}
              onClick={onImageClick}
              className="transition-all duration-300 hover:opacity-95"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
