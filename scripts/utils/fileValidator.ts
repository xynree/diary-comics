/**
 * File Validation Utility
 *
 * Validates files for upload including:
 * - File format validation
 * - File size checks
 * - Filename format validation
 * - File accessibility checks
 */

import { statSync, accessSync, constants } from "fs";
import { extname, basename } from "path";
import { parseFilename } from "../../src/utils/dateParser.js";
import { UploadConfig } from "../config/uploadConfig";
import { logger } from "./logger";
import { isFileMarkedAsUploaded } from "./fileRenamer";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    size: number;
    extension: string;
    basename: string;
    parsedFilename?: ReturnType<typeof parseFilename>;
  };
}

export class FileValidator {
  private config: UploadConfig;

  constructor(config: UploadConfig) {
    this.config = config;
  }

  /**
   * Validate a single file for upload
   */
  public validateFile(filePath: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Check if file exists and is accessible
      accessSync(filePath, constants.F_OK | constants.R_OK);

      // Get file stats
      const stats = statSync(filePath);
      const extension = extname(filePath).toLowerCase().replace(".", "");
      const filename = basename(filePath);

      result.fileInfo = {
        size: stats.size,
        extension,
        basename: filename,
      };

      // Validate file is not a directory
      if (stats.isDirectory()) {
        result.errors.push("Path is a directory, not a file");
        result.isValid = false;
        return result;
      }

      // Validate file format
      if (!this.config.supportedFormats.includes(extension)) {
        result.errors.push(
          `Unsupported file format: ${extension}. Supported formats: ${this.config.supportedFormats.join(
            ", "
          )}`
        );
        result.isValid = false;
      }

      // Validate file size
      if (stats.size > this.config.maxFileSize) {
        result.errors.push(
          `File size (${this.formatFileSize(
            stats.size
          )}) exceeds maximum allowed size (${this.formatFileSize(
            this.config.maxFileSize
          )})`
        );
        result.isValid = false;
      }

      if (stats.size < this.config.minFileSize) {
        result.errors.push(
          `File size (${this.formatFileSize(
            stats.size
          )}) is below minimum required size (${this.formatFileSize(
            this.config.minFileSize
          )})`
        );
        result.isValid = false;
      }

      // Validate filename format
      const parsedFilename = parseFilename(filename);
      result.fileInfo.parsedFilename = parsedFilename;

      if (!parsedFilename.isValid) {
        result.errors.push(
          `Invalid filename format: ${parsedFilename.error || "Unknown error"}`
        );
        result.isValid = false;
      } else {
        // Add warnings for potential issues
        if (parsedFilename.sequence > 20) {
          result.warnings.push(
            `High sequence number (${parsedFilename.sequence}) - verify this is correct`
          );
        }

        // Check if date is in the future
        const fileDate = parsedFilename.date;
        const now = new Date();
        if (fileDate > now) {
          result.warnings.push(
            `File date (${fileDate.toDateString()}) is in the future`
          );
        }

        // Check if date is very old (more than 10 years ago)
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        if (fileDate < tenYearsAgo) {
          result.warnings.push(
            `File date (${fileDate.toDateString()}) is more than 10 years old`
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `File access error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate multiple files
   */
  public validateFiles(filePaths: string[]): {
    valid: string[];
    invalid: { path: string; result: ValidationResult }[];
  } {
    const valid: string[] = [];
    const invalid: { path: string; result: ValidationResult }[] = [];

    for (const filePath of filePaths) {
      const result = this.validateFile(filePath);

      if (result.isValid) {
        valid.push(filePath);

        // Log warnings if any
        if (result.warnings.length > 0) {
          logger.warn(`Warnings for ${filePath}:`, result.warnings);
        }
      } else {
        invalid.push({ path: filePath, result });
        logger.error(`Validation failed for ${filePath}:`, result.errors);
      }
    }

    return { valid, invalid };
  }

  /**
   * Check if a file matches the expected diary format
   */
  public isDiaryFile(filePath: string): boolean {
    const extension = extname(filePath).toLowerCase().replace(".", "");
    const filename = basename(filePath);

    // Skip files that are already marked as uploaded
    if (isFileMarkedAsUploaded(filePath)) {
      return false;
    }

    // Check file format
    if (!this.config.supportedFormats.includes(extension)) {
      return false;
    }

    // Check filename format
    const parsedFilename = parseFilename(filename);
    return parsedFilename.isValid;
  }

  /**
   * Get the expected Cloudinary path for a file
   */
  public getCloudinaryPath(filePath: string): string | null {
    const result = this.validateFile(filePath);

    if (!result.isValid || !result.fileInfo?.parsedFilename?.isValid) {
      return null;
    }

    const parsedFilename = result.fileInfo.parsedFilename;
    const year = parsedFilename.date.getFullYear();
    const filename = result.fileInfo.basename;

    return `${this.config.cloudinary.folder}/${year}/${filename}`;
  }

  /**
   * Format file size in human-readable format
   */
  private formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: UploadConfig): void {
    this.config = config;
  }
}

/**
 * Utility function to create a file validator with current config
 */
export function createFileValidator(config: UploadConfig): FileValidator {
  return new FileValidator(config);
}
