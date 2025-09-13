/**
 * File System Monitoring Service
 * 
 * Monitors local directories for new diary comic files and triggers uploads:
 * - Real-time file system watching
 * - Debounced file change detection
 * - Automatic upload queue management
 * - Support for multiple watch directories
 */

import chokidar from 'chokidar';
import { join, basename } from 'path';
import { existsSync, statSync } from 'fs';
import { EventEmitter } from 'events';
import { UploadConfig } from '../config/uploadConfig';
import { FileValidator } from '../utils/fileValidator';
import { logger } from '../utils/logger';

export interface WatchEvent {
  type: 'add' | 'change' | 'unlink';
  filePath: string;
  timestamp: number;
}

export interface WatchStats {
  watchedFolders: string[];
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  queuedFiles: number;
  isWatching: boolean;
  startTime?: number;
  uptime?: number;
}

export class FileWatcher extends EventEmitter {
  private config: UploadConfig;
  private fileValidator: FileValidator;
  private watcher: chokidar.FSWatcher | null = null;
  private isWatching: boolean = false;
  private startTime: number = 0;
  private fileQueue: Set<string> = new Set();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private stats = {
    totalFiles: 0,
    validFiles: 0,
    invalidFiles: 0,
  };

  constructor(config: UploadConfig) {
    super();
    this.config = config;
    this.fileValidator = new FileValidator(config);
  }

  /**
   * Start watching configured directories
   */
  public async startWatching(): Promise<void> {
    if (this.isWatching) {
      logger.warn('File watcher is already running');
      return;
    }

    if (this.config.watchFolders.length === 0) {
      throw new Error('No watch folders configured');
    }

    // Validate watch folders exist
    const validFolders = this.config.watchFolders.filter(folder => {
      if (!existsSync(folder)) {
        logger.warn(`Watch folder does not exist: ${folder}`);
        return false;
      }
      
      const stats = statSync(folder);
      if (!stats.isDirectory()) {
        logger.warn(`Watch path is not a directory: ${folder}`);
        return false;
      }
      
      return true;
    });

    if (validFolders.length === 0) {
      throw new Error('No valid watch folders found');
    }

    logger.info(`Starting file watcher for ${validFolders.length} folders...`);

    // Configure chokidar options
    const watchOptions: chokidar.WatchOptions = {
      ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        /node_modules/,
        /\.tmp$/,
        /\.temp$/,
        /~$/,
      ],
      persistent: true,
      ignoreInitial: false, // Process existing files on startup
      followSymlinks: false,
      depth: this.config.recursive ? undefined : 1,
      awaitWriteFinish: {
        stabilityThreshold: 2000, // Wait 2 seconds for file to stabilize
        pollInterval: 100,
      },
    };

    // Create watcher
    this.watcher = chokidar.watch(validFolders, watchOptions);

    // Set up event handlers
    this.watcher
      .on('add', (filePath) => this.handleFileEvent('add', filePath))
      .on('change', (filePath) => this.handleFileEvent('change', filePath))
      .on('unlink', (filePath) => this.handleFileEvent('unlink', filePath))
      .on('error', (error) => {
        logger.error('File watcher error:', error);
        this.emit('error', error);
      })
      .on('ready', () => {
        this.isWatching = true;
        this.startTime = Date.now();
        logger.success(`File watcher started, monitoring ${validFolders.length} folders`);
        this.emit('ready');
      });

    // Wait for watcher to be ready
    return new Promise((resolve, reject) => {
      this.watcher!.on('ready', resolve);
      this.watcher!.on('error', reject);
    });
  }

  /**
   * Stop watching directories
   */
  public async stopWatching(): Promise<void> {
    if (!this.isWatching || !this.watcher) {
      logger.warn('File watcher is not running');
      return;
    }

    logger.info('Stopping file watcher...');

    // Clear debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Close watcher
    await this.watcher.close();
    this.watcher = null;
    this.isWatching = false;

    logger.success('File watcher stopped');
    this.emit('stopped');
  }

  /**
   * Handle file system events
   */
  private handleFileEvent(eventType: 'add' | 'change' | 'unlink', filePath: string): void {
    // Clear existing debounce timer for this file
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.processFileEvent(eventType, filePath);
      this.debounceTimers.delete(filePath);
    }, 1000); // 1 second debounce

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Process debounced file events
   */
  private processFileEvent(eventType: 'add' | 'change' | 'unlink', filePath: string): void {
    const event: WatchEvent = {
      type: eventType,
      filePath,
      timestamp: Date.now(),
    };

    logger.debug(`File event: ${eventType} - ${basename(filePath)}`);

    switch (eventType) {
      case 'add':
      case 'change':
        this.handleFileAddOrChange(filePath);
        break;
      case 'unlink':
        this.handleFileRemoval(filePath);
        break;
    }

    this.emit('fileEvent', event);
  }

  /**
   * Handle file addition or change
   */
  private handleFileAddOrChange(filePath: string): void {
    this.stats.totalFiles++;

    // Check if it's a diary file
    if (!this.fileValidator.isDiaryFile(filePath)) {
      logger.debug(`Ignoring non-diary file: ${basename(filePath)}`);
      return;
    }

    // Validate the file
    const validation = this.fileValidator.validateFile(filePath);
    
    if (validation.isValid) {
      this.stats.validFiles++;
      this.addToQueue(filePath);
      logger.info(`Added to upload queue: ${basename(filePath)}`);
    } else {
      this.stats.invalidFiles++;
      logger.warn(`Invalid diary file: ${basename(filePath)}`, validation.errors);
    }
  }

  /**
   * Handle file removal
   */
  private handleFileRemoval(filePath: string): void {
    this.removeFromQueue(filePath);
    logger.debug(`File removed: ${basename(filePath)}`);
  }

  /**
   * Add file to upload queue
   */
  private addToQueue(filePath: string): void {
    this.fileQueue.add(filePath);
    this.emit('fileQueued', filePath);
  }

  /**
   * Remove file from upload queue
   */
  private removeFromQueue(filePath: string): void {
    this.fileQueue.delete(filePath);
    this.emit('fileDequeued', filePath);
  }

  /**
   * Get queued files
   */
  public getQueuedFiles(): string[] {
    return Array.from(this.fileQueue);
  }

  /**
   * Clear upload queue
   */
  public clearQueue(): void {
    this.fileQueue.clear();
    this.emit('queueCleared');
  }

  /**
   * Get watch statistics
   */
  public getStats(): WatchStats {
    return {
      watchedFolders: [...this.config.watchFolders],
      totalFiles: this.stats.totalFiles,
      validFiles: this.stats.validFiles,
      invalidFiles: this.stats.invalidFiles,
      queuedFiles: this.fileQueue.size,
      isWatching: this.isWatching,
      startTime: this.startTime,
      uptime: this.isWatching ? Date.now() - this.startTime : undefined,
    };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: UploadConfig): void {
    this.config = config;
    this.fileValidator.updateConfig(config);
  }

  /**
   * Check if watcher is running
   */
  public isRunning(): boolean {
    return this.isWatching;
  }

  /**
   * Get watched paths
   */
  public getWatchedPaths(): string[] {
    if (!this.watcher) {
      return [];
    }
    return this.watcher.getWatched() as any;
  }
}
