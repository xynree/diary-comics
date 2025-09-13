import { DiaryGalleryData, DiaryEntry, DiaryImage } from "@/types/diary";

/**
 * Utility functions for handling API data serialization/deserialization
 *
 * When data is sent over HTTP, Date objects get serialized to strings.
 * These functions convert the string dates back to proper Date objects.
 */

// Types for serialized data (with string dates)
type SerializedDiaryImage = Omit<DiaryImage, "date"> & { date: string };
type SerializedDiaryEntry = Omit<DiaryEntry, "date" | "images"> & {
  date: string;
  images: SerializedDiaryImage[];
};
type SerializedDiaryGalleryData = Omit<
  DiaryGalleryData,
  "entries" | "dateRange"
> & {
  entries: SerializedDiaryEntry[];
  dateRange: {
    earliest: string;
    latest: string;
  };
};

/**
 * Converts a DiaryImage with string dates back to proper Date objects
 */
function deserializeDiaryImage(image: SerializedDiaryImage): DiaryImage {
  return {
    ...image,
    date: new Date(image.date),
  };
}

/**
 * Converts a DiaryEntry with string dates back to proper Date objects
 */
function deserializeDiaryEntry(entry: SerializedDiaryEntry): DiaryEntry {
  return {
    ...entry,
    date: new Date(entry.date),
    images: entry.images.map(deserializeDiaryImage),
  };
}

/**
 * Converts API response data back to proper DiaryGalleryData with Date objects
 *
 * This function handles the conversion of serialized date strings back to Date objects
 * after fetching data from the API endpoint.
 *
 * @param data Raw API response data with string dates
 * @returns DiaryGalleryData with proper Date objects
 */
export function deserializeDiaryGalleryData(
  data: SerializedDiaryGalleryData
): DiaryGalleryData {
  return {
    entries: data.entries.map(deserializeDiaryEntry),
    totalEntries: data.totalEntries,
    totalImages: data.totalImages,
    dateRange: {
      earliest: new Date(data.dateRange.earliest),
      latest: new Date(data.dateRange.latest),
    },
    // Preserve pagination data if present
    pagination: data.pagination,
  };
}

/**
 * Validates that a deserialized DiaryGalleryData object has valid dates
 *
 * @param data DiaryGalleryData to validate
 * @returns boolean indicating if all dates are valid
 */
export function validateDiaryGalleryData(data: DiaryGalleryData): boolean {
  try {
    // Check dateRange dates
    if (
      !(data.dateRange.earliest instanceof Date) ||
      isNaN(data.dateRange.earliest.getTime())
    ) {
      return false;
    }
    if (
      !(data.dateRange.latest instanceof Date) ||
      isNaN(data.dateRange.latest.getTime())
    ) {
      return false;
    }

    // Check entry dates
    for (const entry of data.entries) {
      if (!(entry.date instanceof Date) || isNaN(entry.date.getTime())) {
        return false;
      }

      // Check image dates
      for (const image of entry.images) {
        if (!(image.date instanceof Date) || isNaN(image.date.getTime())) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error validating diary gallery data:", error);
    return false;
  }
}

/**
 * Creates a safe fallback DiaryGalleryData object for error states
 */
export function createEmptyDiaryGalleryData(): DiaryGalleryData {
  const now = new Date();
  return {
    entries: [],
    totalEntries: 0,
    totalImages: 0,
    dateRange: {
      earliest: now,
      latest: now,
    },
  };
}
