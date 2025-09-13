/**
 * Cloudinary Upload Service
 * 
 * Handles uploading files to Cloudinary with:
 * - Proper folder structure
 * - Metadata preservation
 * - Error handling and retries
 * - Progress tracking
 */

import { v2 as cloudinary } from 'cloudinary';
import { basename } from 'path';
import { UploadConfig } from '../config/uploadConfig';
import { FileValidator, ValidationResult } from '../utils/fileValidator';
import { logger } from '../utils/logger';

export interface UploadResult {
  success: boolean;
  filePath: string;
  cloudinaryUrl?: string;
  publicId?: string;
  error?: string;
  retryCount: number;
  uploadTime: number; // in milliseconds
}

export interface UploadProgress {
  totalFiles: number;
  completedFiles: number;
  currentFile: string;
  percentage: number;
  errors: string[];
  startTime: number;
  estimatedTimeRemaining?: number;
}

export class UploadService {
  private config: UploadConfig;
  private fileValidator: FileValidator;
  private isConfigured: boolean = false;

  constructor(config: UploadConfig) {
    this.config = config;
    this.fileValidator = new FileValidator(config);
    this.configureCloudinary();
  }

  /**
   * Configure Cloudinary with credentials
   */
  private configureCloudinary(): void {
    try {
      cloudinary.config({
        cloud_name: this.config.cloudinary.cloudName,
        api_key: this.config.cloudinary.apiKey,
        api_secret: this.config.cloudinary.apiSecret,
      });
      
      this.isConfigured = true;
      logger.debug('Cloudinary configured successfully');
    } catch (error) {
      logger.error('Failed to configure Cloudinary:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Upload a single file to Cloudinary
   */
  public async uploadFile(filePath: string, retryCount: number = 0): Promise<UploadResult> {
    const startTime = Date.now();
    
    const result: UploadResult = {
      success: false,
      filePath,
      retryCount,
      uploadTime: 0,
    };

    try {
      // Validate configuration
      if (!this.isConfigured) {
        throw new Error('Cloudinary not configured properly');
      }

      // Validate file
      const validation = this.fileValidator.validateFile(filePath);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Get the target path in Cloudinary
      const cloudinaryPath = this.fileValidator.getCloudinaryPath(filePath);
      if (!cloudinaryPath) {
        throw new Error('Could not determine Cloudinary path for file');
      }

      // Remove file extension from public_id (Cloudinary adds it automatically)
      const publicId = cloudinaryPath.replace(/\.[^/.]+$/, '');
      
      logger.progress(`Uploading ${basename(filePath)} to ${publicId}`);

      // Upload to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        resource_type: this.config.cloudinary.resourceType,
        use_filename: this.config.cloudinary.useFilename,
        unique_filename: this.config.cloudinary.uniqueFilename,
        overwrite: this.config.duplicateHandling === 'overwrite',
        // Add metadata
        context: {
          source: 'diary-upload-script',
          upload_date: new Date().toISOString(),
          original_filename: basename(filePath),
        },
        // Enable automatic format optimization
        fetch_format: 'auto',
        quality: 'auto:good',
      });

      result.success = true;
      result.cloudinaryUrl = uploadResponse.secure_url;
      result.publicId = uploadResponse.public_id;
      result.uploadTime = Date.now() - startTime;

      logger.success(`Successfully uploaded ${basename(filePath)} (${result.uploadTime}ms)`);
      
      return result;

    } catch (error) {
      result.uploadTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.error = errorMessage;

      logger.error(`Upload failed for ${basename(filePath)}: ${errorMessage}`);

      // Retry logic
      if (retryCount < this.config.retryAttempts) {
        logger.info(`Retrying upload (attempt ${retryCount + 1}/${this.config.retryAttempts})`);
        
        // Wait before retry with exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, retryCount);
        await this.sleep(delay);
        
        return this.uploadFile(filePath, retryCount + 1);
      }

      logger.error(`Upload failed permanently for ${basename(filePath)} after ${retryCount + 1} attempts`);
      return result;
    }
  }

  /**
   * Upload multiple files with progress tracking
   */
  public async uploadFiles(
    filePaths: string[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const startTime = Date.now();
    const errors: string[] = [];

    logger.info(`Starting batch upload of ${filePaths.length} files`);

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const currentFile = basename(filePath);

      // Update progress
      const progress: UploadProgress = {
        totalFiles: filePaths.length,
        completedFiles: i,
        currentFile,
        percentage: Math.round((i / filePaths.length) * 100),
        errors: [...errors],
        startTime,
      };

      // Calculate estimated time remaining
      if (i > 0) {
        const elapsed = Date.now() - startTime;
        const avgTimePerFile = elapsed / i;
        const remainingFiles = filePaths.length - i;
        progress.estimatedTimeRemaining = Math.round(avgTimePerFile * remainingFiles);
      }

      if (onProgress) {
        onProgress(progress);
      }

      // Upload file
      const result = await this.uploadFile(filePath);
      results.push(result);

      if (!result.success && result.error) {
        errors.push(`${currentFile}: ${result.error}`);
      }

      // Respect batch processing - add small delay between uploads
      if (i < filePaths.length - 1) {
        await this.sleep(100); // 100ms delay between uploads
      }
    }

    // Final progress update
    const finalProgress: UploadProgress = {
      totalFiles: filePaths.length,
      completedFiles: filePaths.length,
      currentFile: '',
      percentage: 100,
      errors,
      startTime,
    };

    if (onProgress) {
      onProgress(finalProgress);
    }

    const successCount = results.filter(r => r.success).length;
    const totalTime = Date.now() - startTime;

    logger.info(`Batch upload completed: ${successCount}/${filePaths.length} successful (${totalTime}ms total)`);

    if (errors.length > 0) {
      logger.warn(`Upload errors encountered:`, errors);
    }

    return results;
  }

  /**
   * Check if a file already exists in Cloudinary
   */
  public async fileExists(filePath: string): Promise<boolean> {
    try {
      const cloudinaryPath = this.fileValidator.getCloudinaryPath(filePath);
      if (!cloudinaryPath) {
        return false;
      }

      const publicId = cloudinaryPath.replace(/\.[^/.]+$/, '');
      
      // Try to get resource info
      await cloudinary.api.resource(publicId);
      return true;
    } catch (error) {
      // If resource not found, it doesn't exist
      return false;
    }
  }

  /**
   * Get upload statistics
   */
  public getUploadStats(results: UploadResult[]): {
    total: number;
    successful: number;
    failed: number;
    totalTime: number;
    averageTime: number;
    successRate: number;
  } {
    const successful = results.filter(r => r.success);
    const totalTime = results.reduce((sum, r) => sum + r.uploadTime, 0);

    return {
      total: results.length,
      successful: successful.length,
      failed: results.length - successful.length,
      totalTime,
      averageTime: results.length > 0 ? totalTime / results.length : 0,
      successRate: results.length > 0 ? (successful.length / results.length) * 100 : 0,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: UploadConfig): void {
    this.config = config;
    this.fileValidator.updateConfig(config);
    this.configureCloudinary();
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
