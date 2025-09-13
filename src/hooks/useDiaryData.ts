"use client";

import { useState, useEffect } from "react";
import { DiaryGalleryData, SortOrder } from "@/types/diary";
import {
  deserializeDiaryGalleryData,
  validateDiaryGalleryData,
} from "@/utils/apiUtils";

interface UseDiaryDataOptions {
  sortOrder?: SortOrder;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseDiaryDataReturn {
  data: DiaryGalleryData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing diary gallery data
 *
 * Features:
 * - Automatic data fetching on mount
 * - Loading and error states
 * - Manual refetch capability
 * - Optional auto-refresh for real-time updates
 * - Configurable sort order
 *
 * @param options Configuration options for data fetching
 * @returns Object with data, loading state, error state, and refetch function
 */
export function useDiaryData(
  options: UseDiaryDataOptions = {}
): UseDiaryDataReturn {
  const {
    sortOrder = "newest-first",
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes default
  } = options;

  const [data, setData] = useState<DiaryGalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (sortOrder) {
        params.append("sort", sortOrder);
      }

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

      setData(deserializedData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching diary data:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setLoading(true);
    await fetchData();
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [sortOrder]); // Refetch when sort order changes

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, sortOrder]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for getting diary data with server-side rendering support
 * This version can be used in server components or for initial data loading
 */
export async function getDiaryDataSSR(
  sortOrder: SortOrder = "newest-first"
): Promise<DiaryGalleryData> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const params = new URLSearchParams({ sort: sortOrder });

  const response = await fetch(`${baseUrl}/api/diary?${params.toString()}`, {
    // Add cache control for better performance
    next: { revalidate: 300 }, // Revalidate every 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch diary data: ${response.statusText}`);
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

  return deserializedData;
}
