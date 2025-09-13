/**
 * DiaryGallery Infinite Scroll Tests
 * 
 * Tests for the DiaryGallery component with infinite scroll functionality:
 * - Initial rendering with paginated data
 * - Infinite scroll behavior
 * - Load more button functionality
 * - Loading states and error handling
 * - Intersection Observer integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiaryGallery } from '@/components/DiaryGallery';

// Mock the infinite scroll hook
jest.mock('@/hooks/useInfiniteDiaryData');
import { useInfiniteDiaryData } from '@/hooks/useInfiniteDiaryData';

const mockUseInfiniteDiaryData = useInfiniteDiaryData as jest.MockedFunction<typeof useInfiniteDiaryData>;

// Mock Intersection Observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('DiaryGallery Infinite Scroll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockEntry = (index: number) => ({
    date: new Date(2022, 0, index + 1),
    dateKey: `2022-01-${String(index + 1).padStart(2, '0')}`,
    images: [{
      publicId: `diary/2022/1.${index + 1}.22_1`,
      filename: `1.${index + 1}.22_1.jpg`,
      date: new Date(2022, 0, index + 1),
      sequence: 1,
      secureUrl: `https://res.cloudinary.com/test/image/upload/diary/2022/1.${index + 1}.22_1.jpg`,
      width: 800,
      height: 600,
      format: 'jpg',
      bytes: 150000,
      createdAt: '2022-01-01T00:00:00.000Z',
    }],
    imageCount: 1,
  });

  const createMockHookReturn = (entriesCount: number, hasNextPage: boolean = true, loadingMore: boolean = false) => ({
    data: {
      entries: Array.from({ length: entriesCount }, (_, i) => createMockEntry(i)),
      totalEntries: 100,
      totalImages: 100,
      dateRange: {
        earliest: new Date(2022, 0, 1),
        latest: new Date(2022, 0, 100),
      },
      pagination: {
        currentPage: Math.ceil(entriesCount / 10),
        pageSize: 10,
        totalPages: 10,
        hasNextPage,
        hasPreviousPage: entriesCount > 10,
      },
    },
    entries: Array.from({ length: entriesCount }, (_, i) => createMockEntry(i)),
    loading: false,
    loadingMore,
    error: null,
    hasNextPage,
    loadMore: jest.fn(),
    refetch: jest.fn(),
  });

  describe('Initial Rendering', () => {
    it('should render initial entries correctly', () => {
      mockUseInfiniteDiaryData.mockReturnValue(createMockHookReturn(10));

      render(<DiaryGallery />);

      expect(screen.getByText('welcome to my diary :)')).toBeInTheDocument();
      
      // Should show load more button when hasNextPage is true
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });

    it('should show loading skeleton when loading', () => {
      mockUseInfiniteDiaryData.mockReturnValue({
        ...createMockHookReturn(0),
        loading: true,
        entries: [],
        data: null,
      });

      render(<DiaryGallery />);

      // Should show loading skeleton (check for skeleton elements)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should show error state when there is an error', () => {
      mockUseInfiniteDiaryData.mockReturnValue({
        ...createMockHookReturn(0),
        error: 'Failed to load data',
        entries: [],
        data: null,
      });

      render(<DiaryGallery />);

      expect(screen.getByText('Failed to Load Gallery')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  describe('Load More Functionality', () => {
    it('should call loadMore when Load More button is clicked', async () => {
      const mockLoadMore = jest.fn();
      mockUseInfiniteDiaryData.mockReturnValue({
        ...createMockHookReturn(20),
        loadMore: mockLoadMore,
      });

      render(<DiaryGallery />);

      const loadMoreButton = screen.getByText('Load More');
      fireEvent.click(loadMoreButton);

      expect(mockLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when loadingMore is true', () => {
      mockUseInfiniteDiaryData.mockReturnValue(createMockHookReturn(20, true, true));

      render(<DiaryGallery />);

      expect(screen.getByText('Loading more entries...')).toBeInTheDocument();
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should not show Load More button when hasNextPage is false', () => {
      mockUseInfiniteDiaryData.mockReturnValue(createMockHookReturn(100, false));

      render(<DiaryGallery />);

      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
      expect(screen.getByText("You reached the end!")).toBeInTheDocument();
    });
  });

  describe('Intersection Observer Integration', () => {
    it('should handle infinite scroll through useInfiniteDiaryData hook', () => {
      const mockHookReturn = createMockHookReturn(10);
      mockUseInfiniteDiaryData.mockReturnValue(mockHookReturn);

      render(<DiaryGallery />);

      // The hook should be called with correct parameters
      expect(mockUseInfiniteDiaryData).toHaveBeenCalledWith({
        sortOrder: 'newest-first',
        pageSize: 10,
      });
    });
  });

  describe('Sort Order Changes', () => {
    it('should update sort order when sort buttons are clicked', () => {
      const mockHookReturn = createMockHookReturn(20);
      mockUseInfiniteDiaryData.mockReturnValue(mockHookReturn);

      render(<DiaryGallery />);

      const oldestFirstButton = screen.getByText('Oldest First');
      fireEvent.click(oldestFirstButton);

      // The hook should be called with the new sort order
      expect(mockUseInfiniteDiaryData).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sortOrder: 'oldest-first',
        })
      );
    });
  });





  describe('Empty State', () => {
    it('should show empty state when no entries are available', () => {
      mockUseInfiniteDiaryData.mockReturnValue({
        ...createMockHookReturn(0, false),
        entries: [],
        data: {
          entries: [],
          totalEntries: 0,
          totalImages: 0,
          dateRange: {
            earliest: new Date(),
            latest: new Date(),
          },
        },
      });

      render(<DiaryGallery />);

      expect(screen.getByText('No Diary Entries Found')).toBeInTheDocument();
    });
  });
});
