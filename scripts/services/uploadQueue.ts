/**
 * Upload Queue and Batch Processing Service
 *
 * Manages upload queue with:
 * - Priority-based queue management
 * - Batch processing with configurable size
 * - Retry logic for failed uploads
 * - Progress tracking and reporting
 * - Concurrent upload limiting
 */

import { EventEmitter } from "events";
import { basename } from "path";
import { UploadConfig } from "../config/uploadConfig";
import { UploadService, UploadResult } from "./uploadService";
import { DuplicateHandler } from "./duplicateHandler";
import { logger } from "../utils/logger";
import { markFileAsUploaded, deleteUploadedFile } from "../utils/fileRenamer";

export interface QueueItem {
  id: string;
  filePath: string;
  priority: number;
  addedAt: number;
  attempts: number;
  lastError?: string;
  status: "pending" | "processing" | "completed" | "failed" | "skipped";
}

export interface BatchResult {
  batchId: string;
  totalFiles: number;
  successful: number;
  failed: number;
  skipped: number;
  duration: number;
  results: UploadResult[];
  errors: string[];
}

export interface QueueStats {
  totalItems: number;
  pendingItems: number;
  processingItems: number;
  completedItems: number;
  failedItems: number;
  skippedItems: number;
  isProcessing: boolean;
  currentBatch?: string;
}

export class UploadQueue extends EventEmitter {
  private config: UploadConfig;
  private uploadService: UploadService;
  private duplicateHandler: DuplicateHandler;
  private queue: Map<string, QueueItem> = new Map();
  private isProcessing: boolean = false;
  private currentBatchId: string | null = null;
  private processingCount: number = 0;
  private maxConcurrent: number = 3;
  private autoDelete: boolean = false;

  constructor(config: UploadConfig, autoDelete: boolean = false) {
    super();
    this.config = config;
    this.uploadService = new UploadService(config);
    this.duplicateHandler = new DuplicateHandler(config);
    this.autoDelete = autoDelete;
  }

  /**
   * Add file to upload queue
   */
  public addFile(filePath: string, priority: number = 0): string {
    const id = this.generateId();
    const item: QueueItem = {
      id,
      filePath,
      priority,
      addedAt: Date.now(),
      attempts: 0,
      status: "pending",
    };

    this.queue.set(id, item);
    logger.debug(`Added to queue: ${basename(filePath)} (ID: ${id})`);

    this.emit("itemAdded", item);
    return id;
  }

  /**
   * Add multiple files to queue
   */
  public addFiles(filePaths: string[], priority: number = 0): string[] {
    const ids: string[] = [];

    for (const filePath of filePaths) {
      const id = this.addFile(filePath, priority);
      ids.push(id);
    }

    logger.info(`Added ${filePaths.length} files to upload queue`);
    return ids;
  }

  /**
   * Remove item from queue
   */
  public removeItem(id: string): boolean {
    const item = this.queue.get(id);
    if (!item) {
      return false;
    }

    if (item.status === "processing") {
      logger.warn(`Cannot remove item ${id} - currently processing`);
      return false;
    }

    this.queue.delete(id);
    this.emit("itemRemoved", item);
    return true;
  }

  /**
   * Clear all pending items from queue
   */
  public clearQueue(): void {
    const pendingItems = Array.from(this.queue.values()).filter(
      (item) => item.status === "pending"
    );

    for (const item of pendingItems) {
      this.queue.delete(item.id);
    }

    logger.info(`Cleared ${pendingItems.length} pending items from queue`);
    this.emit("queueCleared", pendingItems.length);
  }

  /**
   * Start processing the queue
   */
  public async startProcessing(continuous: boolean = false): Promise<void> {
    if (this.isProcessing) {
      logger.warn("Queue processing is already running");
      return;
    }

    this.isProcessing = true;
    logger.info(
      `Starting queue processing${continuous ? " (continuous mode)" : ""}...`
    );
    this.emit("processingStarted");

    try {
      if (continuous) {
        // Continuous mode - keep processing until explicitly stopped
        while (this.isProcessing) {
          if (this.hasPendingItems()) {
            await this.processBatch();

            // Small delay between batches
            if (this.hasPendingItems()) {
              await this.sleep(1000);
            }
          } else {
            // No pending items, wait a bit before checking again
            await this.sleep(2000);
          }
        }
      } else {
        // One-time processing mode - process all current items then stop
        while (this.hasPendingItems() && this.isProcessing) {
          await this.processBatch();

          // Small delay between batches
          if (this.hasPendingItems()) {
            await this.sleep(1000);
          }
        }
      }
    } catch (error) {
      logger.error("Error during queue processing:", error);
      this.emit("processingError", error);
    } finally {
      if (!continuous || !this.isProcessing) {
        this.isProcessing = false;
        logger.info("Queue processing completed");
        this.emit("processingCompleted");
      }
    }
  }

  /**
   * Stop processing the queue
   */
  public stopProcessing(): void {
    if (!this.isProcessing) {
      logger.warn("Queue processing is not running");
      return;
    }

    this.isProcessing = false;
    logger.info("Stopping queue processing...");
    this.emit("processingStopped");
  }

  /**
   * Process a batch of items
   */
  private async processBatch(): Promise<BatchResult> {
    const batchId = this.generateBatchId();
    this.currentBatchId = batchId;

    const batchItems = this.getNextBatch();
    if (batchItems.length === 0) {
      return this.createEmptyBatchResult(batchId);
    }

    logger.info(`Processing batch ${batchId} with ${batchItems.length} items`);
    const startTime = Date.now();

    // Mark items as processing
    for (const item of batchItems) {
      item.status = "processing";
      this.emit("itemProcessing", item);
    }

    // Check for duplicates first
    const filePaths = batchItems.map((item) => item.filePath);
    let duplicateCheck;

    try {
      duplicateCheck = await this.duplicateHandler.processDuplicates(filePaths);
    } catch (error) {
      // If duplicate checking fails, mark all items as failed
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown duplicate check error";
      logger.error(`Duplicate check failed for batch ${batchId}:`, error);

      for (const item of batchItems) {
        item.status = "failed";
        item.lastError = errorMessage;
        this.emit("itemFailed", item, errorMessage);
      }

      const endTime = Date.now();
      const result: BatchResult = {
        batchId,
        totalFiles: batchItems.length,
        successful: 0,
        failed: batchItems.length,
        skipped: 0,
        duration: endTime - startTime,
        results: [],
        errors: [errorMessage],
      };

      this.emit("batchCompleted", result);
      return result;
    }

    // Handle skipped files (duplicates)
    const skippedResults: UploadResult[] = [];
    for (const skipped of duplicateCheck.toSkip) {
      const item = batchItems.find((i) => i.filePath === skipped.path);
      if (item) {
        item.status = "skipped";

        // Mark duplicate files with [uploaded]_ prefix (unless autoDelete is enabled)
        if (!this.autoDelete) {
          try {
            const renameResult = await markFileAsUploaded(skipped.path);
            if (!renameResult.success) {
              logger.warn(
                `Failed to mark duplicate file as uploaded: ${renameResult.error}`
              );
            }
          } catch (error) {
            logger.warn(
              `Error marking duplicate file as uploaded: ${skipped.path}`,
              error
            );
          }
        }

        skippedResults.push({
          success: true,
          filePath: skipped.path,
          retryCount: 0,
          uploadTime: 0,
        });
        this.emit("itemSkipped", item, skipped.reason);
      }
    }

    // Process files that need uploading
    const uploadResults: UploadResult[] = [];
    const errors: string[] = [];

    for (const filePath of duplicateCheck.toUpload) {
      const item = batchItems.find((i) => i.filePath === filePath);
      if (!item) continue;

      try {
        const result = await this.uploadService.uploadFile(filePath);
        uploadResults.push(result);

        if (result.success) {
          item.status = "completed";

          // Handle file after successful upload based on autoDelete setting
          try {
            if (this.autoDelete) {
              // Delete the file after successful upload
              const deleteResult = await deleteUploadedFile(filePath);
              if (!deleteResult.success) {
                logger.warn(
                  `Failed to delete file after upload: ${deleteResult.error}`
                );
              }
            } else {
              // Mark the file as uploaded by renaming it with [uploaded]_ prefix
              const renameResult = await markFileAsUploaded(filePath);
              if (!renameResult.success) {
                logger.warn(
                  `Failed to mark file as uploaded: ${renameResult.error}`
                );
              }
            }
          } catch (error) {
            logger.warn(`Error handling file after upload: ${filePath}`, error);
          }

          this.emit("itemCompleted", item, result);
        } else {
          item.attempts++;
          item.lastError = result.error;

          if (item.attempts >= this.config.retryAttempts) {
            item.status = "failed";
            errors.push(`${basename(filePath)}: ${result.error}`);
            this.emit("itemFailed", item, result.error);
          } else {
            item.status = "pending"; // Retry later
            this.emit("itemRetry", item, result.error);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        item.attempts++;
        item.lastError = errorMessage;

        if (item.attempts >= this.config.retryAttempts) {
          item.status = "failed";
          errors.push(`${basename(filePath)}: ${errorMessage}`);
          this.emit("itemFailed", item, errorMessage);
        } else {
          item.status = "pending";
          this.emit("itemRetry", item, errorMessage);
        }
      }
    }

    // Handle renamed files
    for (const renamed of duplicateCheck.toRename) {
      // For now, treat renamed files as regular uploads
      // In a more advanced implementation, we could modify the upload service
      // to handle custom public IDs
      const item = batchItems.find((i) => i.filePath === renamed.path);
      if (item) {
        logger.info(
          `File ${basename(renamed.path)} would be renamed to ${
            renamed.newPublicId
          }`
        );
        // For now, skip renamed files
        item.status = "skipped";
        skippedResults.push({
          success: true,
          filePath: renamed.path,
          retryCount: 0,
          uploadTime: 0,
        });
        this.emit(
          "itemSkipped",
          item,
          `Would be renamed to ${renamed.newPublicId}`
        );
      }
    }

    const duration = Date.now() - startTime;
    const allResults = [...uploadResults, ...skippedResults];

    const batchResult: BatchResult = {
      batchId,
      totalFiles: batchItems.length,
      successful: allResults.filter((r) => r.success).length,
      failed: uploadResults.filter((r) => !r.success).length,
      skipped: skippedResults.length,
      duration,
      results: allResults,
      errors,
    };

    logger.info(
      `Batch ${batchId} completed: ${batchResult.successful}/${batchResult.totalFiles} successful (${duration}ms)`
    );
    this.emit("batchCompleted", batchResult);

    this.currentBatchId = null;
    return batchResult;
  }

  /**
   * Get next batch of items to process
   */
  private getNextBatch(): QueueItem[] {
    const pendingItems = Array.from(this.queue.values())
      .filter((item) => item.status === "pending")
      .sort((a, b) => {
        // Sort by priority (higher first), then by added time (older first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.addedAt - b.addedAt;
      });

    return pendingItems.slice(0, this.config.batchSize);
  }

  /**
   * Check if there are pending items
   */
  private hasPendingItems(): boolean {
    return Array.from(this.queue.values()).some(
      (item) => item.status === "pending"
    );
  }

  /**
   * Get queue statistics
   */
  public getStats(): QueueStats {
    const items = Array.from(this.queue.values());

    return {
      totalItems: items.length,
      pendingItems: items.filter((i) => i.status === "pending").length,
      processingItems: items.filter((i) => i.status === "processing").length,
      completedItems: items.filter((i) => i.status === "completed").length,
      failedItems: items.filter((i) => i.status === "failed").length,
      skippedItems: items.filter((i) => i.status === "skipped").length,
      isProcessing: this.isProcessing,
      currentBatch: this.currentBatchId || undefined,
    };
  }

  /**
   * Get all queue items
   */
  public getItems(): QueueItem[] {
    return Array.from(this.queue.values());
  }

  /**
   * Get item by ID
   */
  public getItem(id: string): QueueItem | undefined {
    return this.queue.get(id);
  }

  /**
   * Update configuration
   */
  public updateConfig(config: UploadConfig): void {
    this.config = config;
    this.uploadService.updateConfig(config);
    this.duplicateHandler.updateConfig(config);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Create empty batch result
   */
  private createEmptyBatchResult(batchId: string): BatchResult {
    return {
      batchId,
      totalFiles: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      results: [],
      errors: [],
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
