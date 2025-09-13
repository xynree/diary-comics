/**
 * Infinite Scroll Hook Tests
 *
 * Tests for the useInfiniteDiaryData hook including:
 * - Initial data loading
 * - Infinite scroll behavior
 * - Loading states management
 * - Error handling
 * - Pagination state management
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useInfiniteDiaryData } from "@/hooks/useInfiniteDiaryData";

// Mock the API utils
jest.mock("@/utils/apiUtils", () => ({
  deserializeDiaryGalleryData: jest.fn((data) => data),
  validateDiaryGalleryData: jest.fn(() => true),
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("useInfiniteDiaryData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockResponse = (
    page: number,
    pageSize: number,
    totalEntries: number = 100
  ) => {
    const totalPages = Math.ceil(totalEntries / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalEntries);
    const entriesCount = endIndex - startIndex;

    return {
      success: true,
      data: {
        entries: Array.from({ length: entriesCount }, (_, i) => ({
          date: `2022-01-${String(startIndex + i + 1).padStart(
            2,
            "0"
          )}T00:00:00.000Z`,
          dateKey: `2022-01-${String(startIndex + i + 1).padStart(2, "0")}`,
          images: [
            {
              publicId: `diary/2022/1.${startIndex + i + 1}.22_1`,
              filename: `1.${startIndex + i + 1}.22_1.jpg`,
              date: `2022-01-${String(startIndex + i + 1).padStart(
                2,
                "0"
              )}T00:00:00.000Z`,
              sequence: 1,
              secureUrl: `https://res.cloudinary.com/test/image/upload/diary/2022/1.${
                startIndex + i + 1
              }.22_1.jpg`,
              width: 800,
              height: 600,
              format: "jpg",
              bytes: 150000,
              createdAt: `2022-01-${String(startIndex + i + 1).padStart(
                2,
                "0"
              )}T00:00:00.000Z`,
            },
          ],
          imageCount: 1,
        })),
        totalEntries,
        totalImages: totalEntries,
        dateRange: {
          earliest: "2022-01-01T00:00:00.000Z",
          latest: `2022-01-${String(totalEntries).padStart(
            2,
            "0"
          )}T00:00:00.000Z`,
        },
        pagination: {
          currentPage: page,
          pageSize,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    };
  };

  describe("Initial Loading", () => {
    it("should load initial data correctly", async () => {
      const mockResponse = createMockResponse(1, 20);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() =>
        useInfiniteDiaryData({ pageSize: 20 })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.entries).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(20);
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.data?.pagination?.currentPage).toBe(1);
    });

    it("should handle loading errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useInfiniteDiaryData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
      expect(result.current.entries).toEqual([]);
    });
  });

  describe("Infinite Scroll", () => {
    it("should load more data when loadMore is called", async () => {
      // Mock first page
      const firstPageResponse = createMockResponse(1, 10);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => firstPageResponse,
      } as Response);

      const { result } = renderHook(() =>
        useInfiniteDiaryData({ pageSize: 10 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(10);

      // Mock second page
      const secondPageResponse = createMockResponse(2, 10);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => secondPageResponse,
      } as Response);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.entries).toHaveLength(20);
      expect(result.current.loadingMore).toBe(false);
    });

    it("should not load more when hasNextPage is false", async () => {
      const mockResponse = createMockResponse(10, 10, 100); // Last page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() =>
        useInfiniteDiaryData({ pageSize: 10 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasNextPage).toBe(false);

      // Try to load more
      await act(async () => {
        await result.current.loadMore();
      });

      // Should not make additional fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should handle loadMore errors without affecting existing data", async () => {
      // Mock first page success
      const firstPageResponse = createMockResponse(1, 10);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => firstPageResponse,
      } as Response);

      const { result } = renderHook(() =>
        useInfiniteDiaryData({ pageSize: 10 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.entries).toHaveLength(10);

      // Mock second page error
      mockFetch.mockRejectedValueOnce(new Error("Load more error"));

      await act(async () => {
        await result.current.loadMore();
      });

      // Should keep existing data
      expect(result.current.entries).toHaveLength(10);
      expect(result.current.error).toBe("Load more error");
      expect(result.current.loadingMore).toBe(false);
    });
  });

  describe("Refetch Functionality", () => {
    it("should refetch data and reset to first page", async () => {
      // Initial load
      const firstPageResponse = createMockResponse(1, 10);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => firstPageResponse,
      } as Response);

      const { result } = renderHook(() =>
        useInfiniteDiaryData({ pageSize: 10 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Load second page
      const secondPageResponse = createMockResponse(2, 10);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => secondPageResponse,
      } as Response);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.entries).toHaveLength(20);

      // Refetch
      const refetchResponse = createMockResponse(1, 10);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => refetchResponse,
      } as Response);

      await act(async () => {
        await result.current.refetch();
      });

      // Should reset to first page only
      expect(result.current.entries).toHaveLength(10);
      expect(result.current.data?.pagination?.currentPage).toBe(1);
    });
  });

  describe("Sort Order Changes", () => {
    it("should refetch data when sort order changes", async () => {
      const mockResponse = createMockResponse(1, 10);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result, rerender } = renderHook(
        ({ sortOrder }) => useInfiniteDiaryData({ sortOrder, pageSize: 10 }),
        { initialProps: { sortOrder: "newest-first" as const } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Change sort order
      rerender({ sortOrder: "oldest-first" as const });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      // Check that the new sort order is used in the API call
      const lastCall = mockFetch.mock.calls[1][0] as string;
      expect(lastCall).toContain("sort=oldest-first");
    });
  });
});
