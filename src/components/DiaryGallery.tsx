'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { SortOrder } from '@/types/diary';
import { DiaryEntry } from './DiaryEntry';
import { useInfiniteDiaryData } from '@/hooks/useInfiniteDiaryData';
import { LoadingSpinner } from './LoadingSpinner';
import { PhotoIcon, ExclamationTriangleIcon, InstagramIcon, GitHubIcon, EmailIcon } from './icons/Icons';

interface DiaryGalleryProps {
  className?: string;
}

/**
 * Main gallery component for displaying all diary entries
 *
 * Features:
 * - Responsive grid layout
 * - Sort order controls (newest/oldest first)
 * - Loading states and error handling
 * - Infinite scroll with automatic loading
 * - Search and filtering (future enhancement)
 */
export function DiaryGallery({ className = '' }: DiaryGalleryProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest-first');
  const {
    data,
    entries,
    loading,
    loadingMore,
    error,
    hasNextPage,
    loadMore,
    refetch
  } = useInfiniteDiaryData({
    sortOrder,
    pageSize: 10, // Load 10 entries at a time
  });

  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use hook data
  const galleryData = data;

  const handleSortChange = (newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
  };

  const handleRefresh = async () => {
    await refetch();
  };

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, loadMore]);

  if (loading && !galleryData) {
    return <GalleryLoadingSkeleton />;
  }

  if (error && !galleryData) {
    return <GalleryError error={error} onRetry={handleRefresh} />;
  }

  if (!galleryData || entries.length === 0) {
    return <EmptyGallery />;
  }

  return (
    <div className={`max-w-5xl mx-auto p-6 ${className}`}>
      {/* Gallery Header */}
      <header className="relative my-5">
        <div className="text-center">
          <Image
            src="/title-icon.png"
            alt="Welcome to my diary"
            width={250}
            height={0}
            style={{ height: 'auto' }}
            className="mx-auto"
            priority
          />
        </div>

        {/* Right side controls - Sort and Social */}
        <div className="absolute top-1/8 right-0 flex flex-col space-y-7">


          {/* Social Links */}
          <div className="flex flex-col space-y-2">
            <a
              href="https://instagram.com/xynree"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 self-center"
            >
              <InstagramIcon className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/xynree"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 self-center"
            >
              <GitHubIcon className="w-4 h-4" />
            </a>
            <a
              href="mailto:xynree@gmail.com"
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 self-center"
            >
              <EmailIcon className="w-4 h-4" />
            </a>
          </div>
          {/* Divider */}
          <div className="w-full h-px bg-gray-200"></div>
          {/* Sort Controls */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleSortChange('newest-first')}
              className={`cursor-pointer px-3 py-1 rounded text-xs font-medium transition-all duration-200 hover:bg-gray-100/50 ${
                sortOrder === 'newest-first'
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Newest
            </button>
            <button
              onClick={() => handleSortChange('oldest-first')}
              className={`cursor-pointer px-3 py-1 rounded text-xs font-medium transition-all duration-200 hover:bg-gray-100/50 ${
                sortOrder === 'oldest-first'
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Oldest
            </button>
          </div>
        </div>
      </header>

      {/* Gallery Entries */}
      <main>
        {entries.map((entry, index) => (
          <DiaryEntry
            key={entry.dateKey}
            entry={entry}
            priority={index < 2} // Prioritize loading for first 2 entries
          />
        ))}

        {/* Load More Trigger */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="py-12 text-center">
            {loadingMore ? (
              <LoadingSpinner size="sm" text="Loading more entries..." />
            ) : (
              <button
                onClick={loadMore}
                className="px-8 py-3 text-sm font-medium tracking-wide text-gray-700 border border-gray-300 hover:border-gray-900 hover:text-gray-900 transition-all duration-200 bg-white"
              >
                Load More
              </button>
            )}
          </div>
        )}

        {/* End of Results */}
        {!hasNextPage && entries.length > 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400 font-light tracking-wide">You reached the end!</p>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Loading skeleton component
 */
function GalleryLoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>

      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <div className="h-8 bg-gray-100 rounded w-64 mx-auto mb-8"></div>
          <div className="h-4 bg-gray-100 rounded w-32 mx-auto"></div>
        </div>

        {/* Entry skeletons */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-16">
            <div className="h-4 bg-gray-100 rounded w-32 mb-6"></div>
            <div className="h-px bg-gray-100 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-100 rounded"></div>
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Error state component
 */
function GalleryError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div className="bg-gray-50 border border-gray-200 rounded p-12">
        <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-6" />
        <h2 className="text-lg font-light text-gray-900 mb-3 tracking-wide">
          Failed to Load Gallery
        </h2>
        <p className="text-sm text-gray-500 mb-8 font-light">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 text-sm font-medium tracking-wide text-gray-700 border border-gray-300 hover:border-gray-900 hover:text-gray-900 transition-all duration-200 bg-white"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyGallery() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div className="bg-gray-50 border border-gray-200 rounded p-12">
        <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-6" />
        <h2 className="text-lg font-light text-gray-900 mb-3 tracking-wide">
          No Diary Entries Found
        </h2>
        <p className="text-sm text-gray-500 mb-8 font-light">
          Upload some images to your Cloudinary diary folder to get started!
        </p>
        <div className="text-xs text-gray-400 font-light space-y-1">
          <p>Expected folder structure: <code className="bg-gray-100 px-2 py-1 rounded text-gray-600">diary/{'{year}'}/{'{M.D.YY_sequence}'}</code></p>
          <p>Example: <code className="bg-gray-100 px-2 py-1 rounded text-gray-600">diary/2021/1.1.21_1.jpg</code></p>
        </div>
      </div>
    </div>
  );
}
