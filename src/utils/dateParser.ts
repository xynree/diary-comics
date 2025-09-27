import { ParsedFilename } from "../types/diary";

/**
 * Parses filename in format M.D.YY_sequence to extract date and sequence
 * Examples: "1.1.21_1", "12.25.21_2", "3.15.22_1"
 */
export function parseFilename(filename: string): ParsedFilename {
  // Remove file extension if present (only common image extensions)
  const nameWithoutExt = filename.replace(
    /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i,
    ""
  );

  // Match pattern: M.D.YY_sequence or MM.DD.YY_sequence
  const pattern = /^(\d{1,2})\.(\d{1,2})\.(\d{2})_(\d+)$/;
  const match = nameWithoutExt.match(pattern);

  if (!match) {
    return {
      filename,
      date: new Date(),
      sequence: 0,
      isValid: false,
      error: `Invalid filename format. Expected M.D.YY_sequence, got: ${nameWithoutExt} (original: ${filename})`,
    };
  }

  const [, monthStr, dayStr, yearStr, sequenceStr] = match;

  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);
  const sequence = parseInt(sequenceStr, 10);

  // Validate ranges
  if (month < 1 || month > 12) {
    return {
      filename,
      date: new Date(),
      sequence: 0,
      isValid: false,
      error: `Invalid month: ${month}. Must be between 1 and 12.`,
    };
  }

  if (day < 1 || day > 31) {
    return {
      filename,
      date: new Date(),
      sequence: 0,
      isValid: false,
      error: `Invalid day: ${day}. Must be between 1 and 31.`,
    };
  }

  if (sequence < 1) {
    return {
      filename,
      date: new Date(),
      sequence: 0,
      isValid: false,
      error: `Invalid sequence: ${sequence}. Must be >= 1.`,
    };
  }

  // Convert 2-digit year to 4-digit year
  // Assume years 00-30 are 2000-2030, years 31-99 are 1931-1999
  const fullYear = year <= 30 ? 2000 + year : 1900 + year;

  // Create date at noon to avoid timezone issues with date boundaries
  const date = new Date(fullYear, month - 1, day, 12, 0, 0, 0);

  // Validate that the date is valid (handles leap years, month lengths, etc.)
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return {
      filename,
      date: new Date(),
      sequence: 0,
      isValid: false,
      error: `Invalid date: ${month}/${day}/${fullYear}`,
    };
  }

  return {
    filename,
    date,
    sequence,
    isValid: true,
  };
}

/**
 * Formats a date to YYYY-MM-DD string for consistent grouping
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date for display (e.g., "January 1, 2021")
 * Uses manual formatting to avoid timezone issues
 */
export function formatDisplayDate(date: Date): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = date.getDate();

  return `${month} ${day}, ${year}`;
}

/**
 * Gets the year from a date for folder structure
 */
export function getYearFromDate(date: Date): number {
  return date.getFullYear();
}

/**
 * Generates the expected Cloudinary folder path for a given date
 * Format: diary/{year}
 */
export function getCloudinaryFolderPath(date: Date): string {
  const year = getYearFromDate(date);
  return `diary/${year}`;
}

/**
 * Generates the expected Cloudinary public ID for a given filename and date
 * Format: diary/{year}/{filename}
 */
export function getExpectedPublicId(filename: string, date: Date): string {
  const year = getYearFromDate(date);
  const nameWithoutExt = filename.replace(
    /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i,
    ""
  );
  return `diary/${year}/${nameWithoutExt}`;
}
