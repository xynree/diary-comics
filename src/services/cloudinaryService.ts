/**
 * Cloudinary Service for Diary Comics Application
 *
 * This service handles all interactions with Cloudinary for fetching, organizing,
 * and processing diary comic images. It provides a complete abstraction layer
 * over the Cloudinary API with built-in error handling and data transformation.
 *
 * Key Features:
 * - Fetches images from Cloudinary's 'diary' folder structure
 * - Parses filenames in M.D.YY_sequence format (e.g., "1.1.21_1", "12.25.21_2")
 * - Groups images by date and sorts by sequence number
 * - Provides flexible sorting options (newest-first or oldest-first)
 * - Handles year-specific queries for performance optimization
 * - Comprehensive error handling and logging
 */

import { v2 as cloudinary } from "cloudinary";
import {
  DiaryImage,
  DiaryEntry,
  DiaryGalleryData,
  CloudinaryResource,
  CloudinarySearchResponse,
  SortOrder,
  GalleryOptions,
} from "@/types/diary";
import {
  parseFilename,
  formatDateKey,
  getYearFromDate,
} from "@/utils/dateParser";

// Configure Cloudinary with environment variables
// These should be set in your .env.local file:
// CLOUDINARY_CLOUD_NAME=your_cloud_name
// CLOUDINARY_API_KEY=your_api_key
// CLOUDINARY_API_SECRET=your_api_secret
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Fetches all diary images from Cloudinary
 *
 * This function searches for all images in the 'diary' folder and its subfolders.
 * Expected folder structure: diary/{year}/{M.D.YY_sequence}.{ext}
 * Example: diary/2021/1.1.21_1.jpg, diary/2021/12.25.21_2.png
 *
 * @returns Promise<DiaryImage[]> Array of processed diary images with parsed metadata
 * @throws Error if Cloudinary API fails or authentication is invalid
 */
export async function fetchDiaryImages(): Promise<DiaryImage[]> {
  try {
    // Search Cloudinary for all images in the diary folder
    // The expression 'folder:diary/*' matches all files in diary and its subfolders
    const searchResult = (await cloudinary.search
      .expression("folder:diary/*")
      .sort_by("created_at", "desc") // Sort by upload date, newest first
      .max_results(500) // Limit results (increase if you have more images)
      .execute()) as CloudinarySearchResponse;

    const diaryImages: DiaryImage[] = [];

    // Process each image resource from Cloudinary
    for (const resource of searchResult.resources) {
      // Extract filename from either the filename field or the public_id
      const parsedFilename = parseFilename(
        resource.filename || resource.public_id.split("/").pop() || ""
      );

      // Skip files that don't match our expected naming convention
      if (!parsedFilename.isValid) {
        console.warn(
          `Skipping invalid filename: ${resource.filename}`,
          parsedFilename.error
        );
        continue;
      }

      // Create a DiaryImage object with all necessary metadata
      const diaryImage: DiaryImage = {
        publicId: resource.public_id, // Cloudinary's unique identifier
        filename:
          resource.filename || resource.public_id.split("/").pop() || "",
        date: parsedFilename.date, // Parsed date from filename
        sequence: parsedFilename.sequence, // Sequence number for the day
        secureUrl: resource.secure_url, // HTTPS URL for the image
        width: resource.width, // Image width in pixels
        height: resource.height, // Image height in pixels
        format: resource.format, // File format (jpg, png, etc.)
        bytes: resource.bytes, // File size in bytes
        createdAt: resource.created_at, // Upload timestamp
      };

      diaryImages.push(diaryImage);
    }

    return diaryImages;
  } catch (error) {
    console.error("Error fetching diary images from Cloudinary:", error);
    throw new Error("Failed to fetch diary images");
  }
}

/**
 * Groups diary images by date and creates diary entries
 *
 * Takes an array of individual DiaryImage objects and groups them by date,
 * creating DiaryEntry objects that contain all images for each day.
 * Images within each day are sorted by their sequence number.
 *
 * @param images Array of DiaryImage objects to group
 * @returns DiaryEntry[] Array of diary entries, one per unique date
 */
export function groupImagesByDate(images: DiaryImage[]): DiaryEntry[] {
  const groupedByDate = new Map<string, DiaryImage[]>();

  // Group images by date using YYYY-MM-DD format as the key
  for (const image of images) {
    const dateKey = formatDateKey(image.date); // e.g., "2021-01-01"
    if (!groupedByDate.has(dateKey)) {
      groupedByDate.set(dateKey, []);
    }
    groupedByDate.get(dateKey)!.push(image);
  }

  // Convert grouped images to DiaryEntry objects
  const entries: DiaryEntry[] = [];
  for (const [dateKey, dateImages] of groupedByDate) {
    // Sort images by sequence number (1, 2, 3, etc.) for proper display order
    const sortedImages = dateImages.sort((a, b) => a.sequence - b.sequence);

    const entry: DiaryEntry = {
      date: sortedImages[0].date, // All images have the same date
      dateKey, // YYYY-MM-DD format for consistent grouping
      images: sortedImages, // All images for this date, sorted by sequence
      imageCount: sortedImages.length, // Total number of images for this day
    };

    entries.push(entry);
  }

  return entries;
}

/**
 * Sorts diary entries by date
 */
export function sortDiaryEntries(
  entries: DiaryEntry[],
  sortOrder: SortOrder
): DiaryEntry[] {
  return entries.sort((a, b) => {
    const dateA = a.date.getTime();
    const dateB = b.date.getTime();

    return sortOrder === "newest-first" ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Creates complete gallery data with metadata
 */
export function createGalleryData(
  entries: DiaryEntry[],
  allEntries?: DiaryEntry[],
  options?: GalleryOptions
): DiaryGalleryData {
  if (entries.length === 0) {
    return {
      entries: [],
      totalEntries: 0,
      totalImages: 0,
      dateRange: {
        earliest: new Date(),
        latest: new Date(),
      },
    };
  }

  const totalImages = entries.reduce((sum, entry) => sum + entry.imageCount, 0);

  // Find date range (entries should already be sorted)
  const dates = entries.map((entry) => entry.date);
  const earliest = new Date(Math.min(...dates.map((d) => d.getTime())));
  const latest = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Create pagination metadata if options are provided
  let pagination;
  if (options?.pageSize && options?.page && allEntries) {
    const totalEntries = allEntries.length;
    const totalPages = Math.ceil(totalEntries / options.pageSize);

    pagination = {
      currentPage: options.page,
      pageSize: options.pageSize,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPreviousPage: options.page > 1,
    };
  }

  return {
    entries,
    totalEntries: allEntries?.length || entries.length,
    totalImages: allEntries
      ? allEntries.reduce((sum, entry) => sum + entry.imageCount, 0)
      : totalImages,
    dateRange: {
      earliest,
      latest,
    },
    pagination,
  };
}

/**
 * Main function to fetch and organize all diary data
 *
 * This is the primary entry point for getting diary gallery data.
 * It orchestrates the entire process:
 * 1. Fetches all images from Cloudinary
 * 2. Groups images by date
 * 3. Sorts entries by date (newest or oldest first)
 * 4. Applies pagination if requested
 * 5. Creates complete gallery metadata
 *
 * @param options Configuration options including sort order and pagination
 * @returns Promise<DiaryGalleryData> Complete gallery data with metadata
 */
export async function getDiaryGalleryData(
  options: GalleryOptions = { sortOrder: "newest-first" }
): Promise<DiaryGalleryData> {
  try {
    // Step 1: Fetch all images from Cloudinary's diary folder
    const images = await fetchDiaryImages();

    // Step 2: Group images by date (multiple images per day become one entry)
    const entries = groupImagesByDate(images);

    // Step 3: Sort entries by date according to user preference
    const sortedEntries = sortDiaryEntries(entries, options.sortOrder);

    // Step 4: Apply pagination if requested
    let paginatedEntries = sortedEntries;
    if (options.pageSize && options.page) {
      const startIndex = (options.page - 1) * options.pageSize;
      const endIndex = startIndex + options.pageSize;
      paginatedEntries = sortedEntries.slice(startIndex, endIndex);
    }

    // Step 5: Create complete gallery data with metadata (totals, date ranges, etc.)
    const galleryData = createGalleryData(
      paginatedEntries,
      sortedEntries,
      options
    );

    return galleryData;
  } catch (error) {
    console.error("Error creating diary gallery data:", error);
    throw error;
  }
}

/**
 * Get images for a specific date range (for future filtering features)
 */
export async function getDiaryImagesForDateRange(
  startDate: Date,
  endDate: Date
): Promise<DiaryImage[]> {
  const allImages = await fetchDiaryImages();

  return allImages.filter((image) => {
    const imageTime = image.date.getTime();
    return imageTime >= startDate.getTime() && imageTime <= endDate.getTime();
  });
}

/**
 * Get images for a specific year (useful for performance optimization)
 */
export async function getDiaryImagesForYear(
  year: number
): Promise<DiaryImage[]> {
  try {
    const searchResult = (await cloudinary.search
      .expression(`folder:diary/${year}/*`)
      .sort_by("created_at", "desc")
      .max_results(500)
      .execute()) as CloudinarySearchResponse;

    const diaryImages: DiaryImage[] = [];

    for (const resource of searchResult.resources) {
      const parsedFilename = parseFilename(
        resource.filename || resource.public_id.split("/").pop() || ""
      );

      if (!parsedFilename.isValid) {
        console.warn(
          `Skipping invalid filename: ${resource.filename}`,
          parsedFilename.error
        );
        continue;
      }

      const diaryImage: DiaryImage = {
        publicId: resource.public_id,
        filename:
          resource.filename || resource.public_id.split("/").pop() || "",
        date: parsedFilename.date,
        sequence: parsedFilename.sequence,
        secureUrl: resource.secure_url,
        width: resource.width,
        height: resource.height,
        format: resource.format,
        bytes: resource.bytes,
        createdAt: resource.created_at,
      };

      diaryImages.push(diaryImage);
    }

    return diaryImages;
  } catch (error) {
    console.error(`Error fetching diary images for year ${year}:`, error);
    throw new Error(`Failed to fetch diary images for year ${year}`);
  }
}
