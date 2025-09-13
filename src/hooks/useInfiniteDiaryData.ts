"use client";

import { useState, useEffect, useCallback } from "react";
import { DiaryGalleryData, DiaryEntry, SortOrder } from "@/types/diary";
import {
  deserializeDiaryGalleryData,
  validateDiaryGalleryData,
} from "@/utils/apiUtils";

interface UseInfiniteDiaryDataOptions {
  sortOrder?: SortOrder;
  pageSize?: number;
}

interface UseInfiniteDiaryDataReturn {
  data: DiaryGalleryData | null;
  entries: DiaryEntry[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasNextPage: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching diary gallery data with infinite scroll support
 *
 * Features:
 * - Paginated data loading with infinite scroll
 * - Automatic data fetching on mount
 * - Loading states for initial load and subsequent pages
 * - Error handling and retry capability
 * - Manual refetch capability
 * - Configurable sort order and page size
 *
 * @param options Configuration options for data fetching
 * @returns Object with data, loading states, error state, and control functions
 */
export function useInfiniteDiaryData(
  options: UseInfiniteDiaryDataOptions = {}
): UseInfiniteDiaryDataReturn {
  const {
    sortOrder = "newest-first",
    pageSize = 20, // Default to 20 entries per page
  } = options;

  const [data, setData] = useState<DiaryGalleryData | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchPage = async (page: number, append: boolean = false) => {
    try {
      if (!append) {
        setError(null);
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append("sort", sortOrder);
      params.append("pageSize", pageSize.toString());
      params.append("page", page.toString());

      const response = await fetch(`/api/diary?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch diary data");
      }

      // Deserialize string dates back to Date objects
      const deserializedData = deserializeDiaryGalleryData(result.data);

      // Validate the deserialized data
      if (!validateDiaryGalleryData(deserializedData)) {
        throw new Error("Invalid date data received from API");
      }

      if (append) {
        // Append new entries to existing ones
        setEntries((prev) => [...prev, ...deserializedData.entries]);
        // Update pagination info but keep existing entries count
        setData((prev) => ({
          ...deserializedData,
          entries: [...(prev?.entries || []), ...deserializedData.entries],
        }));
      } else {
        // Replace all data (initial load or refetch)
        setEntries(deserializedData.entries);
        setData(deserializedData);
      }

      // Update pagination state
      setHasNextPage(deserializedData.pagination?.hasNextPage || false);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching diary data:", err);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    await fetchPage(1, false);
    setLoading(false);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNextPage) return;

    setLoadingMore(true);
    await fetchPage(currentPage + 1, true);
    setLoadingMore(false);
  }, [currentPage, hasNextPage, loadingMore]);

  const refetch = async () => {
    setLoading(true);
    setCurrentPage(1);
    await fetchPage(1, false);
    setLoading(false);
  };

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOrder, pageSize]); // Refetch when sort order or page size changes

  return {
    data,
    entries,
    loading,
    loadingMore,
    error,
    hasNextPage,
    loadMore,
    refetch,
  };
}
