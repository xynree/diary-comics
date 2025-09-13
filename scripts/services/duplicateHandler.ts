/**
 * Duplicate Detection and Handling Service
 *
 * Handles duplicate file detection and resolution strategies:
 * - Skip existing files
 * - Overwrite existing files
 * - Rename files to avoid conflicts
 */

import { v2 as cloudinary } from "cloudinary";
import { basename, extname } from "path";
import { UploadConfig } from "../config/uploadConfig";
import { FileValidator } from "../utils/fileValidator";
import { logger } from "../utils/logger";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingResource?: any;
  recommendedAction: "skip" | "overwrite" | "rename";
  newPublicId?: string;
  reason: string;
}

export interface FileHash {
  filePath: string;
  hash: string;
  size: number;
}

export class DuplicateHandler {
  private config: UploadConfig;
  private fileValidator: FileValidator;

  constructor(config: UploadConfig) {
    this.config = config;
    this.fileValidator = new FileValidator(config);

    // Configure Cloudinary with validation
    try {
      if (
        !config.cloudinary.cloudName ||
        !config.cloudinary.apiKey ||
        !config.cloudinary.apiSecret
      ) {
        throw new Error("Missing Cloudinary credentials");
      }

      cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
      });

      logger.debug("Cloudinary configured for duplicate checking");
    } catch (error) {
      logger.error(
        "Failed to configure Cloudinary for duplicate checking:",
        error
      );
      throw error;
    }
  }

  /**
   * Test Cloudinary connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      await cloudinary.api.ping();
      logger.debug("Cloudinary connection test successful");
      return true;
    } catch (error) {
      logger.error("Cloudinary connection test failed:", error);
      return false;
    }
  }

  /**
   * Check if a file is a duplicate and determine the appropriate action
   */
  public async checkDuplicate(filePath: string): Promise<DuplicateCheckResult> {
    const result: DuplicateCheckResult = {
      isDuplicate: false,
      recommendedAction: this.config.duplicateHandling,
      reason: "No duplicate found",
    };

    try {
      // Check if file still exists (it might have been moved/deleted after being detected)
      if (!require("fs").existsSync(filePath)) {
        result.reason = `File no longer exists: ${filePath}`;
        return result;
      }

      // Get the expected Cloudinary path
      const cloudinaryPath = this.fileValidator.getCloudinaryPath(filePath);
      if (!cloudinaryPath) {
        result.reason = "Could not determine Cloudinary path";
        return result;
      }

      const publicId = cloudinaryPath.replace(/\.[^/.]+$/, "");

      // Check if resource exists in Cloudinary
      logger.debug(`Checking Cloudinary for publicId: ${publicId}`);
      try {
        const existingResource = await cloudinary.api.resource(publicId);
        result.isDuplicate = true;
        result.existingResource = existingResource;

        // Determine action based on configuration and file comparison
        switch (this.config.duplicateHandling) {
          case "skip":
            result.recommendedAction = "skip";
            result.reason =
              "File already exists, skipping as per configuration";
            break;

          case "overwrite":
            result.recommendedAction = "overwrite";
            result.reason =
              "File already exists, will overwrite as per configuration";
            break;

          case "rename":
            const newPublicId = await this.generateUniquePublicId(publicId);
            result.recommendedAction = "rename";
            result.newPublicId = newPublicId;
            result.reason = `File already exists, will rename to ${newPublicId}`;
            break;
        }

        // File exists in Cloudinary - follow the configured duplicate handling strategy
        // No hash comparison needed - just check filename existence
      } catch (error: any) {
        // Check for 404 in multiple possible locations
        const httpCode = error?.http_code || error?.error?.http_code;

        if (httpCode === 404) {
          // File doesn't exist in Cloudinary - not a duplicate
          result.isDuplicate = false;
          result.reason = "File does not exist in Cloudinary";
          logger.debug(`File not found in Cloudinary: ${publicId}`);
        } else {
          // Re-throw other errors for handling in outer catch
          throw error;
        }
      }

      return result;
    } catch (error) {
      // Log the full error details for debugging
      logger.error(
        `Error checking for duplicate ${basename(filePath)}:`,
        error
      );
      logger.error(
        `Error message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      logger.error(`Error type: ${error?.constructor?.name}`);
      logger.error(
        `HTTP code: ${
          (error as any)?.http_code || (error as any)?.error?.http_code
        }`
      );
      logger.error(`Context:`, {
        filePath,
        publicId,
      });

      // Fail the operation if we can't verify duplicates
      throw new Error(
        `Cannot verify if file exists in Cloudinary: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Aborting to prevent potential issues.`
      );
    }

    return result;
  }

  /**
   * Process multiple files for duplicates
   */
  public async processDuplicates(filePaths: string[]): Promise<{
    toUpload: string[];
    toSkip: { path: string; reason: string }[];
    toRename: { path: string; newPublicId: string }[];
  }> {
    const toUpload: string[] = [];
    const toSkip: { path: string; reason: string }[] = [];
    const toRename: { path: string; newPublicId: string }[] = [];

    logger.info(`Checking ${filePaths.length} files for duplicates...`);

    for (const filePath of filePaths) {
      const duplicateCheck = await this.checkDuplicate(filePath);

      // If not a duplicate, add to upload queue
      if (!duplicateCheck.isDuplicate) {
        toUpload.push(filePath);
        logger.info(
          `Will upload ${basename(filePath)}: ${duplicateCheck.reason}`
        );
        continue;
      }

      // Handle duplicates based on configuration
      switch (duplicateCheck.recommendedAction) {
        case "skip":
          toSkip.push({ path: filePath, reason: duplicateCheck.reason });
          logger.info(
            `Skipping ${basename(filePath)}: ${duplicateCheck.reason}`
          );
          break;

        case "overwrite":
          toUpload.push(filePath);
          logger.info(
            `Will overwrite ${basename(filePath)}: ${duplicateCheck.reason}`
          );
          break;

        case "rename":
          if (duplicateCheck.newPublicId) {
            toRename.push({
              path: filePath,
              newPublicId: duplicateCheck.newPublicId,
            });
            logger.info(
              `Will rename ${basename(filePath)}: ${duplicateCheck.reason}`
            );
          } else {
            toSkip.push({
              path: filePath,
              reason: "Could not generate unique name",
            });
            logger.warn(
              `Skipping ${basename(filePath)}: Could not generate unique name`
            );
          }
          break;
      }
    }

    logger.info(
      `Duplicate check complete: ${toUpload.length} to upload, ${toSkip.length} to skip, ${toRename.length} to rename`
    );

    return { toUpload, toSkip, toRename };
  }

  /**
   * Generate a unique public ID by appending a suffix
   */
  private async generateUniquePublicId(basePublicId: string): Promise<string> {
    let counter = 1;
    let uniquePublicId = `${basePublicId}_${counter}`;

    while (await this.publicIdExists(uniquePublicId)) {
      counter++;
      uniquePublicId = `${basePublicId}_${counter}`;

      // Prevent infinite loop
      if (counter > 1000) {
        throw new Error(
          "Could not generate unique public ID after 1000 attempts"
        );
      }
    }

    return uniquePublicId;
  }

  /**
   * Check if a public ID exists in Cloudinary
   */
  private async publicIdExists(publicId: string): Promise<boolean> {
    try {
      await cloudinary.api.resource(publicId);
      return true;
    } catch (error: any) {
      if (error.http_code === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: UploadConfig): void {
    this.config = config;
    this.fileValidator.updateConfig(config);
  }

  /**
   * Get duplicate handling strategy
   */
  public getDuplicateStrategy(): string {
    return this.config.duplicateHandling;
  }

  /**
   * Set duplicate handling strategy
   */
  public setDuplicateStrategy(strategy: "skip" | "overwrite" | "rename"): void {
    this.config.duplicateHandling = strategy;
  }
}
