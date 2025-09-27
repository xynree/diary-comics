/**
 * File Renaming Utility
 *
 * Handles renaming files after successful upload to prevent re-uploading:
 * - Adds [uploaded]_ prefix to filenames
 * - Handles file system operations safely
 * - Provides error handling and logging
 */

import { rename, unlink } from "fs/promises";
import { dirname, basename, join } from "path";
import { existsSync } from "fs";
import { logger } from "./logger";

export interface RenameResult {
  success: boolean;
  originalPath: string;
  newPath?: string;
  error?: string;
}

/**
 * Rename a file by adding [uploaded]_ prefix to prevent re-uploading
 */
export async function markFileAsUploaded(
  filePath: string
): Promise<RenameResult> {
  const result: RenameResult = {
    success: false,
    originalPath: filePath,
  };

  try {
    // Check if file exists
    if (!existsSync(filePath)) {
      result.error = "File does not exist";
      return result;
    }

    // Check if file is already marked as uploaded
    const filename = basename(filePath);
    if (filename.startsWith("[uploaded]_")) {
      result.error = "File is already marked as uploaded";
      return result;
    }

    // Generate new filename with [uploaded]_ prefix
    const directory = dirname(filePath);
    const newFilename = `[uploaded]_${filename}`;
    const newPath = join(directory, newFilename);

    // Check if target file already exists
    if (existsSync(newPath)) {
      result.error = `Target file already exists: ${newFilename}`;
      return result;
    }

    // Perform the rename operation
    await rename(filePath, newPath);

    result.success = true;
    result.newPath = newPath;

    logger.info(`File marked as uploaded: ${filename} -> ${newFilename}`);
    return result;
  } catch (error) {
    result.error =
      error instanceof Error
        ? error.message
        : "Unknown error during file rename";
    logger.error(`Failed to mark file as uploaded: ${filePath}`, error);
    return result;
  }
}

/**
 * Check if a file is already marked as uploaded
 */
export function isFileMarkedAsUploaded(filePath: string): boolean {
  const filename = basename(filePath);
  return filename.startsWith("[uploaded]_");
}

/**
 * Get the original filename from an uploaded file
 */
export function getOriginalFilename(uploadedFilePath: string): string {
  const filename = basename(uploadedFilePath);

  if (filename.startsWith("[uploaded]_")) {
    return filename.substring("[uploaded]_".length);
  }

  return filename;
}

/**
 * Batch rename multiple files as uploaded
 */
export async function markFilesAsUploaded(
  filePaths: string[]
): Promise<RenameResult[]> {
  const results: RenameResult[] = [];

  for (const filePath of filePaths) {
    const result = await markFileAsUploaded(filePath);
    results.push(result);
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;

  if (failed > 0) {
    logger.warn(
      `Batch rename completed: ${successful} successful, ${failed} failed`
    );
  } else {
    logger.info(
      `Batch rename completed: ${successful} files marked as uploaded`
    );
  }

  return results;
}

/**
 * Delete a file after successful upload
 */
export async function deleteUploadedFile(
  filePath: string
): Promise<RenameResult> {
  const result: RenameResult = {
    success: false,
    originalPath: filePath,
  };

  try {
    // Check if file exists
    if (!existsSync(filePath)) {
      result.error = "File does not exist";
      return result;
    }

    // Perform the delete operation
    await unlink(filePath);

    result.success = true;

    logger.info(`File deleted after upload: ${basename(filePath)}`);
    return result;
  } catch (error) {
    result.error =
      error instanceof Error
        ? error.message
        : "Unknown error during file deletion";
    logger.error(`Failed to delete file after upload: ${filePath}`, error);
    return result;
  }
}

/**
 * Delete multiple files after successful upload
 */
export async function deleteUploadedFiles(
  filePaths: string[]
): Promise<RenameResult[]> {
  const results: RenameResult[] = [];

  for (const filePath of filePaths) {
    const result = await deleteUploadedFile(filePath);
    results.push(result);
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;

  if (failed > 0) {
    logger.warn(
      `Batch delete completed: ${successful} successful, ${failed} failed`
    );
  } else {
    logger.info(`Batch delete completed: ${successful} files deleted`);
  }

  return results;
}
