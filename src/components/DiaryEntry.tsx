'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DiaryEntry as DiaryEntryType, DiaryImage as DiaryImageType } from '@/types/diary';
import { DiaryImage } from './DiaryImage';
import { ImageModal } from './ImageModal';
import { formatDisplayDate } from '@/utils/dateParser';
import { CarouselLeftIcon, CarouselRightIcon } from './icons/Icons';
import { LinkIcon } from '@heroicons/react/24/outline';

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  const handleCopyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#entry-${entry.dateKey}`;
    try {
      await navigator.clipboard.writeText(url);
      // Could add a toast notification here in the future
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
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
    <article id={`entry-${entry.dateKey}`} className={`mb-10 ${className}`}>
      {/* Date Header */}
      <header className="mb-3 mx-20 md:px-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 w-full">
            <h2 className="text-sm font-light tracking-wide text-gray-900 ">
              {formatDisplayDate(entry.date)}
            </h2>

          {/* Link button */}
            <button
              onClick={handleCopyLink}
              className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors duration-200 p-2 ml-auto md:ml-0 hover:bg-gray-100 rounded-full"
              aria-label="Copy link to this entry"
              title="Copy link to this entry"
            >
              <LinkIcon className="w-3 h-3" />
            </button>
          </div>


          {/* Entry actions - Instagram-style dot indicators and link button */}
          <div className="hidden md:flex items-center space-x-3">

            {/* Dot indicators when multiple images */}
            {entry.images.length > 1 && (
              <div className="flex items-center space-x-1">
                {entry.images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}


          </div>
        </div>

        {/* Divider */}
        <div className="mb-4 md:mb-8 h-px bg-gray-200 "></div>
      </header>

      {/* Images Carousel */}
      <div className="px-0 md:px-20">
        <ImageCarousel
          images={entry.images}
          onImageClick={handleImageClick}
          priority={priority}
          onCurrentIndexChange={setCurrentImageIndex}
        />
      </div>

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
  onCurrentIndexChange?: (index: number) => void;
}

function ImageCarousel({ images, onImageClick, priority = false, className = '', onCurrentIndexChange }: ImageCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(images.length > 1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

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

      // Calculate current image index for dot indicators
      const firstImage = scrollContainerRef.current.querySelector('.flex-shrink-0') as HTMLElement;
      if (firstImage) {
        const imageWidth = firstImage.offsetWidth;
        const newIndex = Math.round(scrollLeft / imageWidth);
        const finalIndex = Math.min(newIndex, images.length - 1);
        setCurrentImageIndex(finalIndex);
        onCurrentIndexChange?.(finalIndex);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentImageIndex < images.length - 1) {
      // Swipe left - go to next image
      const nextIndex = currentImageIndex + 1;
      scrollToImage(nextIndex);
    }

    if (isRightSwipe && currentImageIndex > 0) {
      // Swipe right - go to previous image
      const prevIndex = currentImageIndex - 1;
      scrollToImage(prevIndex);
    }
  };

  const scrollToImage = (index: number) => {
    if (scrollContainerRef.current) {
      const imageWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: index * imageWidth,
        behavior: 'smooth'
      });
    }
  };

  // Single image - display centered without carousel controls
  if (images.length === 1) {
    return (
      <div className={`w-full md:max-w-2xl md:mx-auto ${className}`}>
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
      {/* Left scroll button - positioned outside image container on desktop */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="hidden md:block absolute -left-17 top-1/2 -translate-y-1/2 z-10 text-gray-500 hover:text-gray-600 transition-colors duration-200 cursor-pointer px-6 py-12"
          aria-label="Scroll left"
        >
          <CarouselLeftIcon className="w-5 h-5" />
        </button>
      )}

      {/* Right scroll button - positioned outside image container on desktop */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="hidden md:block absolute -right-15 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer px-6 py-12"
          aria-label="Scroll right"
        >
          <CarouselRightIcon className="w-5 h-5" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex gap-0 md:gap-6 overflow-x-auto scrollbar-hide pb-4 md:pb-4 mobile-snap-carousel md:snap-none"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {images.map((image, index) => (
          <div key={image.publicId} className="flex-shrink-0 w-full md:w-full max-w-none md:max-w-2xl snap-start md:snap-align-none">
            <DiaryImage
              image={image}
              priority={priority && index === 0}
              onClick={onImageClick}
              className="transition-all duration-300 hover:opacity-95"
            />
          </div>
        ))}
      </div>

      {/* Instagram-style dot indicators - bottom center when multiple images */}
      {images.length > 1 && (
        <div className="flex justify-center space-x-1 mt-1 md:hidden">
          {images.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                index === currentImageIndex
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
