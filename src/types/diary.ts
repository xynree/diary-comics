/**
 * Core types for the diary comics application
 */

export interface DiaryImage {
  /** Cloudinary public ID */
  publicId: string;
  /** Original filename */
  filename: string;
  /** Parsed date from filename */
  date: Date;
  /** Sequence number for the day (1, 2, 3, etc.) */
  sequence: number;
  /** Cloudinary secure URL */
  secureUrl: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** File format (jpg, png, etc.) */
  format: string;
  /** File size in bytes */
  bytes: number;
  /** Upload timestamp */
  createdAt: string;
}

export interface DiaryEntry {
  /** Date of the diary entry */
  date: Date;
  /** Date string in YYYY-MM-DD format for grouping */
  dateKey: string;
  /** All images for this date, sorted by sequence */
  images: DiaryImage[];
  /** Total number of images for this date */
  imageCount: number;
}

export interface DiaryGalleryData {
  /** All diary entries, sorted by date */
  entries: DiaryEntry[];
  /** Total number of entries */
  totalEntries: number;
  /** Total number of images across all entries */
  totalImages: number;
  /** Date range of entries */
  dateRange: {
    earliest: Date;
    latest: Date;
  };
}

export interface CloudinaryResource {
  public_id: string;
  filename: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
  folder: string;
}

export interface CloudinarySearchResponse {
  resources: CloudinaryResource[];
  total_count: number;
  next_cursor?: string;
}

export interface ParsedFilename {
  /** Original filename */
  filename: string;
  /** Parsed date */
  date: Date;
  /** Sequence number */
  sequence: number;
  /** Whether parsing was successful */
  isValid: boolean;
  /** Error message if parsing failed */
  error?: string;
}

export type SortOrder = 'newest-first' | 'oldest-first';

export interface GalleryOptions {
  /** Sort order for entries */
  sortOrder: SortOrder;
  /** Number of entries per page (for future pagination) */
  pageSize?: number;
  /** Current page (for future pagination) */
  page?: number;
}
