/**
 * Upload Configuration System
 *
 * Manages configuration for the automated upload system including:
 * - Watch folder settings
 * - Upload schedules and behavior
 * - Duplicate handling strategies
 * - File validation rules
 * - Cloudinary settings
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { config as dotenvConfig } from "dotenv";

// Load environment variables
dotenvConfig({ path: ".env.local" });

export interface UploadConfig {
  // Watch folder settings
  watchFolders: string[];
  recursive: boolean;

  // File filtering
  supportedFormats: string[];
  maxFileSize: number; // in bytes
  minFileSize: number; // in bytes

  // Upload behavior
  uploadSchedule: "manual" | "immediate" | "daily" | "weekly";
  batchSize: number;
  retryAttempts: number;
  retryDelay: number; // in milliseconds

  // Duplicate handling
  duplicateHandling: "skip" | "overwrite" | "rename";

  // Cloudinary settings
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder: string;
    resourceType: "image" | "video" | "raw" | "auto";
    useFilename: boolean;
    uniqueFilename: boolean;
  };

  // Logging and monitoring
  logging: {
    level: "debug" | "info" | "warn" | "error";
    logToFile: boolean;
    logFilePath: string;
    maxLogSize: number; // in bytes
  };

  // Notification settings
  notifications: {
    enabled: boolean;
    onSuccess: boolean;
    onError: boolean;
    onBatchComplete: boolean;
  };
}

export function getDefaultConfig(): UploadConfig {
  // Set default watch folder - you can customize this path
  const defaultWatchFolder =
    process.env.DIARY_WATCH_FOLDER || join(process.cwd(), "diary-images");

  return {
    watchFolders: [defaultWatchFolder],
    recursive: true,

    supportedFormats: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    minFileSize: 1024, // 1KB

    uploadSchedule: "manual",
    batchSize: 5,
    retryAttempts: 3,
    retryDelay: 1000,

    duplicateHandling: "skip",

    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
      apiKey: process.env.CLOUDINARY_API_KEY || "",
      apiSecret: process.env.CLOUDINARY_API_SECRET || "",
      folder: "diary",
      resourceType: "image",
      useFilename: true,
      uniqueFilename: false,
    },

    logging: {
      level: "info",
      logToFile: true,
      logFilePath: join(process.cwd(), "logs", "upload.log"),
      maxLogSize: 5 * 1024 * 1024, // 5MB
    },

    notifications: {
      enabled: false,
      onSuccess: false,
      onError: true,
      onBatchComplete: true,
    },
  };
}

export class UploadConfigManager {
  private configPath: string;
  private config: UploadConfig;

  constructor(configPath?: string) {
    this.configPath =
      configPath || join(homedir(), ".diary-upload-config.json");
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from file or create default
   */
  private loadConfig(): UploadConfig {
    if (existsSync(this.configPath)) {
      try {
        const configData = readFileSync(this.configPath, "utf8");
        const loadedConfig = JSON.parse(configData);

        // Merge with defaults to ensure all properties exist
        return { ...getDefaultConfig(), ...loadedConfig };
      } catch (error) {
        console.warn(`Failed to load config from ${this.configPath}:`, error);
        console.warn("Using default configuration");
      }
    }

    return getDefaultConfig();
  }

  /**
   * Save current configuration to file
   */
  public saveConfig(): void {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log(`Configuration saved to ${this.configPath}`);
    } catch (error) {
      console.error(`Failed to save config to ${this.configPath}:`, error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): UploadConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<UploadConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Add a watch folder
   */
  public addWatchFolder(folderPath: string): void {
    if (!this.config.watchFolders.includes(folderPath)) {
      this.config.watchFolders.push(folderPath);
    }
  }

  /**
   * Remove a watch folder
   */
  public removeWatchFolder(folderPath: string): void {
    this.config.watchFolders = this.config.watchFolders.filter(
      (folder) => folder !== folderPath
    );
  }

  /**
   * Validate configuration
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check Cloudinary credentials
    if (!this.config.cloudinary.cloudName) {
      errors.push("Cloudinary cloud name is required");
    }
    if (!this.config.cloudinary.apiKey) {
      errors.push("Cloudinary API key is required");
    }
    if (!this.config.cloudinary.apiSecret) {
      errors.push("Cloudinary API secret is required");
    }

    // Check watch folders
    if (this.config.watchFolders.length === 0) {
      errors.push("At least one watch folder must be configured");
    }

    // Validate file size limits
    if (this.config.maxFileSize <= this.config.minFileSize) {
      errors.push("Maximum file size must be greater than minimum file size");
    }

    // Validate batch size
    if (this.config.batchSize < 1) {
      errors.push("Batch size must be at least 1");
    }

    // Validate retry settings
    if (this.config.retryAttempts < 0) {
      errors.push("Retry attempts cannot be negative");
    }
    if (this.config.retryDelay < 0) {
      errors.push("Retry delay cannot be negative");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reset configuration to defaults
   */
  public resetToDefaults(): void {
    this.config = getDefaultConfig();
  }

  /**
   * Get configuration file path
   */
  public getConfigPath(): string {
    return this.configPath;
  }
}

/**
 * Global configuration instance
 */
export const uploadConfig = new UploadConfigManager();
