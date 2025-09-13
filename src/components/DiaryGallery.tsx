'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DiaryGalleryData, SortOrder } from '@/types/diary';
import { DiaryEntry } from './DiaryEntry';
import { useInfiniteDiaryData } from '@/hooks/useInfiniteDiaryData';
import { LoadingSpinner } from './LoadingSpinner';

interface DiaryGalleryProps {
  initialData?: DiaryGalleryData;
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
export function DiaryGallery({ initialData, className = '' }: DiaryGalleryProps) {
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
    autoRefresh: false
  });

  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use initial data if available, otherwise use hook data
  const galleryData = data || initialData;

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
    <div className={`max-w-6xl mx-auto px-4 py-8 ${className}`}>
      {/* Gallery Header */}
      <header className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-md font-semibold text-gray-800 mb-2">
            welcome to my diary :)
          </h1>

        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => handleSortChange('newest-first')}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  sortOrder === 'newest-first'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Newest First
              </button>
              <button
                onClick={() => handleSortChange('oldest-first')}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  sortOrder === 'oldest-first'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Oldest First
              </button>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">
              {loading ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
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
          <div ref={loadMoreRef} className="py-8 text-center">
            {loadingMore ? (
              <LoadingSpinner size="sm" text="Loading more entries..." />
            ) : (
              <button
                onClick={loadMore}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Load More
              </button>
            )}
          </div>
        )}

        {/* End of Results */}
        {!hasNextPage && entries.length > 0 && (
          <div className="py-8 text-center text-gray-500">
            <p>You reached the end!</p>
          </div>
        )}
      </main>

      <footer>
                    {/* Social Links */}
            <div className="flex justify-center items-center space-x-6 border-t border-gray-200 pt-8">
              <a
                href="https://instagram.com/xynree"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>


              <a
                href="https://github.com/xynree"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
      </footer>

    </div>
  );
}

/**
 * Loading skeleton component
 */
function GalleryLoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>

      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="text-center mb-8">
          <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
        </div>



        {/* Entry skeletons */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-12">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
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
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8">
        <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          Failed to Load Gallery
        </h2>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          No Diary Entries Found
        </h2>
        <p className="text-gray-600 mb-6">
          Upload some images to your Cloudinary diary folder to get started!
        </p>
        <div className="text-sm text-gray-500">
          <p>Expected folder structure: <code className="bg-gray-200 px-2 py-1 rounded">diary/{'{year}'}/{'{M.D.YY_sequence}'}</code></p>
          <p className="mt-1">Example: <code className="bg-gray-200 px-2 py-1 rounded">diary/2021/1.1.21_1.jpg</code></p>
        </div>
      </div>
    </div>
  );
}
