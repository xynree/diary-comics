#!/usr/bin/env node

/**
 * Diary Comics Upload CLI Tool
 *
 * Command-line interface for the automated upload system:
 * - Manual uploads
 * - Watch mode for continuous monitoring
 * - Configuration management
 * - Status monitoring and reporting
 */

// Load environment variables FIRST
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });

import { Command } from "commander";
import chalk from "chalk";
import { existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { createProgressBar } from "cli-progress";

import { uploadConfig, UploadConfigManager } from "./config/uploadConfig";
import { UploadService } from "./services/uploadService";
import { FileWatcher } from "./services/fileWatcher";
import { UploadQueue } from "./services/uploadQueue";
import { DuplicateHandler } from "./services/duplicateHandler";
import { FileValidator } from "./utils/fileValidator";
import { logger } from "./utils/logger";

const program = new Command();

// Configure CLI
program
  .name("diary-upload")
  .description("Automated upload system for diary comics")
  .version("1.0.0");

/**
 * Upload command - Manual upload of files or directories
 */
program
  .command("upload <path>")
  .description("Upload files or directories to Cloudinary")
  .option("-r, --recursive", "Recursively scan directories", false)
  .option("-f, --force", "Force upload even if duplicates exist", false)
  .option(
    "-d, --dry-run",
    "Show what would be uploaded without actually uploading",
    false
  )
  .option("--skip-duplicates", "Skip duplicate files", false)
  .option("--overwrite-duplicates", "Overwrite duplicate files", false)
  .action(async (path: string, options) => {
    try {
      await handleUploadCommand(path, options);
    } catch (error) {
      logger.error("Upload command failed:", error);
      process.exit(1);
    }
  });

/**
 * Watch command - Start file system monitoring
 */
program
  .command("watch")
  .description("Start watching configured directories for new files")
  .option("-i, --immediate", "Process existing files immediately", false)
  .option("--autodelete", "Delete files after successful upload", false)
  .action(async (options) => {
    try {
      await handleWatchCommand(options);
    } catch (error) {
      logger.error("Watch command failed:", error);
      process.exit(1);
    }
  });

/**
 * Config command - Manage configuration
 */
program
  .command("config")
  .description("Manage upload configuration")
  .option("--show", "Show current configuration", false)
  .option("--reset", "Reset to default configuration", false)
  .option("--add-folder <path>", "Add a watch folder")
  .option("--remove-folder <path>", "Remove a watch folder")
  .option(
    "--set-duplicate-handling <strategy>",
    "Set duplicate handling strategy (skip|overwrite|rename)"
  )
  .action(async (options) => {
    try {
      await handleConfigCommand(options);
    } catch (error) {
      logger.error("Config command failed:", error);
      process.exit(1);
    }
  });

/**
 * Status command - Show system status
 */
program
  .command("status")
  .description("Show upload system status and statistics")
  .action(async () => {
    try {
      await handleStatusCommand();
    } catch (error) {
      logger.error("Status command failed:", error);
      process.exit(1);
    }
  });

/**
 * Validate command - Validate files without uploading
 */
program
  .command("validate <path>")
  .description("Validate files for upload without actually uploading")
  .option("-r, --recursive", "Recursively scan directories", false)
  .action(async (path: string, options) => {
    try {
      await handleValidateCommand(path, options);
    } catch (error) {
      logger.error("Validate command failed:", error);
      process.exit(1);
    }
  });

/**
 * Handle upload command
 */
async function handleUploadCommand(path: string, options: any): Promise<void> {
  const resolvedPath = resolve(path);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Path does not exist: ${resolvedPath}`);
  }

  // Get configuration
  const config = uploadConfig.getConfig();

  // Override duplicate handling if specified
  if (options.skipDuplicates) {
    config.duplicateHandling = "skip";
  } else if (options.overwriteDuplicates) {
    config.duplicateHandling = "overwrite";
  }

  // Initialize services
  const fileValidator = new FileValidator(config);
  const uploadService = new UploadService(config);
  const duplicateHandler = new DuplicateHandler(config);

  // Collect files
  const files = collectFiles(resolvedPath, options.recursive);
  const validFiles = fileValidator.validateFiles(files);

  if (validFiles.invalid.length > 0) {
    logger.warn(`Found ${validFiles.invalid.length} invalid files:`);
    validFiles.invalid.forEach(({ path, result }) => {
      logger.warn(`  ${path}: ${result.errors.join(", ")}`);
    });
  }

  if (validFiles.valid.length === 0) {
    logger.info("No valid files found to upload");
    return;
  }

  logger.info(`Found ${validFiles.valid.length} valid files for upload`);

  if (options.dryRun) {
    logger.info("Dry run mode - showing what would be uploaded:");
    validFiles.valid.forEach((filePath) => {
      const cloudinaryPath = fileValidator.getCloudinaryPath(filePath);
      logger.info(`  ${filePath} -> ${cloudinaryPath}`);
    });
    return;
  }

  // Check for duplicates
  const duplicateCheck = await duplicateHandler.processDuplicates(
    validFiles.valid
  );

  if (duplicateCheck.toSkip.length > 0) {
    logger.info(`Skipping ${duplicateCheck.toSkip.length} duplicate files`);
  }

  const filesToUpload = duplicateCheck.toUpload;
  if (filesToUpload.length === 0) {
    logger.info("No files to upload after duplicate check");
    return;
  }

  // Create progress bar
  const progressBar = new createProgressBar.SingleBar({
    format:
      "Upload Progress |{bar}| {percentage}% | {value}/{total} | {filename}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });

  progressBar.start(filesToUpload.length, 0, { filename: "Starting..." });

  // Upload files
  const results = await uploadService.uploadFiles(filesToUpload, (progress) => {
    progressBar.update(progress.completedFiles, {
      filename: progress.currentFile || "Processing...",
    });
  });

  progressBar.stop();

  // Show results
  const stats = uploadService.getUploadStats(results);
  logger.success(
    `Upload completed: ${stats.successful}/${
      stats.total
    } successful (${stats.successRate.toFixed(1)}%)`
  );

  if (stats.failed > 0) {
    logger.error(`${stats.failed} uploads failed`);
    results
      .filter((r) => !r.success)
      .forEach((result) => {
        logger.error(`  ${result.filePath}: ${result.error}`);
      });
  }
}

/**
 * Handle watch command
 */
async function handleWatchCommand(options: any): Promise<void> {
  const config = uploadConfig.getConfig();

  if (config.watchFolders.length === 0) {
    throw new Error(
      'No watch folders configured. Use "diary-upload config --add-folder <path>" to add folders.'
    );
  }

  logger.info("Starting file watcher...");

  if (options.autodelete) {
    logger.info(
      "Auto-delete mode enabled: files will be deleted after successful upload"
    );
  } else {
    logger.info(
      "File marking mode: files will be renamed with [uploaded]_ prefix after upload"
    );
  }

  const fileWatcher = new FileWatcher(config);
  const uploadQueue = new UploadQueue(config, options.autodelete);

  // Set up event handlers
  fileWatcher.on("fileQueued", (filePath: string) => {
    uploadQueue.addFile(filePath);
    logger.info(`Queued for upload: ${filePath}`);
  });

  uploadQueue.on("batchCompleted", (result) => {
    logger.success(
      `Batch completed: ${result.successful}/${result.totalFiles} successful`
    );
  });

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("Shutting down...");
    await fileWatcher.stopWatching();
    uploadQueue.stopProcessing();
    process.exit(0);
  });

  // Start watching
  await fileWatcher.startWatching();

  if (options.immediate) {
    logger.info("Processing existing files...");
    const queuedFiles = fileWatcher.getQueuedFiles();
    if (queuedFiles.length > 0) {
      await uploadQueue.startProcessing();
    }
  }

  // Start queue processing in continuous mode
  await uploadQueue.startProcessing(true);

  logger.info("File watcher is running. Press Ctrl+C to stop.");

  // Keep process alive
  setInterval(() => {
    const stats = fileWatcher.getStats();
    const queueStats = uploadQueue.getStats();

    if (stats.queuedFiles > 0 || queueStats.pendingItems > 0) {
      logger.info(
        `Status: ${stats.queuedFiles} queued, ${queueStats.pendingItems} pending, ${queueStats.processingItems} processing`
      );
    }
  }, 30000); // Log status every 30 seconds
}

/**
 * Handle config command
 */
async function handleConfigCommand(options: any): Promise<void> {
  if (options.show) {
    const config = uploadConfig.getConfig();
    console.log(chalk.blue("Current Configuration:"));
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  if (options.reset) {
    uploadConfig.resetToDefaults();
    uploadConfig.saveConfig();
    logger.success("Configuration reset to defaults");
    return;
  }

  if (options.addFolder) {
    const folderPath = resolve(options.addFolder);
    if (!existsSync(folderPath)) {
      throw new Error(`Folder does not exist: ${folderPath}`);
    }

    uploadConfig.addWatchFolder(folderPath);
    uploadConfig.saveConfig();
    logger.success(`Added watch folder: ${folderPath}`);
    return;
  }

  if (options.removeFolder) {
    const folderPath = resolve(options.removeFolder);
    uploadConfig.removeWatchFolder(folderPath);
    uploadConfig.saveConfig();
    logger.success(`Removed watch folder: ${folderPath}`);
    return;
  }

  if (options.setDuplicateHandling) {
    const strategy = options.setDuplicateHandling;
    if (!["skip", "overwrite", "rename"].includes(strategy)) {
      throw new Error(
        "Invalid duplicate handling strategy. Must be: skip, overwrite, or rename"
      );
    }

    const config = uploadConfig.getConfig();
    config.duplicateHandling = strategy;
    uploadConfig.updateConfig(config);
    uploadConfig.saveConfig();
    logger.success(`Set duplicate handling to: ${strategy}`);
    return;
  }

  // Show help if no options provided
  program.help();
}

/**
 * Handle status command
 */
async function handleStatusCommand(): Promise<void> {
  const config = uploadConfig.getConfig();
  const validation = uploadConfig.validateConfig();

  console.log(chalk.blue("=== Diary Upload System Status ===\n"));

  // Configuration status
  console.log(chalk.yellow("Configuration:"));
  console.log(`  Config file: ${uploadConfig.getConfigPath()}`);
  console.log(
    `  Valid: ${validation.isValid ? chalk.green("Yes") : chalk.red("No")}`
  );

  if (!validation.isValid) {
    console.log(chalk.red("  Errors:"));
    validation.errors.forEach((error) => console.log(`    - ${error}`));
  }

  console.log(`  Watch folders: ${config.watchFolders.length}`);
  config.watchFolders.forEach((folder) => {
    const exists = existsSync(folder);
    console.log(
      `    - ${folder} ${exists ? chalk.green("✓") : chalk.red("✗")}`
    );
  });

  console.log(`  Duplicate handling: ${config.duplicateHandling}`);
  console.log(`  Batch size: ${config.batchSize}`);
  console.log(`  Retry attempts: ${config.retryAttempts}`);

  // Cloudinary status
  console.log(chalk.yellow("\nCloudinary:"));
  console.log(
    `  Cloud name: ${config.cloudinary.cloudName || chalk.red("Not set")}`
  );
  console.log(
    `  API key: ${
      config.cloudinary.apiKey ? chalk.green("Set") : chalk.red("Not set")
    }`
  );
  console.log(
    `  API secret: ${
      config.cloudinary.apiSecret ? chalk.green("Set") : chalk.red("Not set")
    }`
  );
  console.log(`  Folder: ${config.cloudinary.folder}`);
}

/**
 * Handle validate command
 */
async function handleValidateCommand(
  path: string,
  options: any
): Promise<void> {
  const resolvedPath = resolve(path);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Path does not exist: ${resolvedPath}`);
  }

  const config = uploadConfig.getConfig();
  const fileValidator = new FileValidator(config);

  const files = collectFiles(resolvedPath, options.recursive);
  const results = fileValidator.validateFiles(files);

  console.log(chalk.blue(`\n=== Validation Results for ${resolvedPath} ===\n`));
  console.log(`Total files found: ${files.length}`);
  console.log(`Valid files: ${chalk.green(results.valid.length)}`);
  console.log(`Invalid files: ${chalk.red(results.invalid.length)}`);

  if (results.invalid.length > 0) {
    console.log(chalk.red("\nInvalid files:"));
    results.invalid.forEach(({ path, result }) => {
      console.log(`  ${path}:`);
      result.errors.forEach((error) => console.log(`    - ${error}`));
    });
  }

  if (results.valid.length > 0) {
    console.log(chalk.green("\nValid files:"));
    results.valid.forEach((filePath) => {
      const cloudinaryPath = fileValidator.getCloudinaryPath(filePath);
      console.log(`  ${filePath} -> ${cloudinaryPath}`);
    });
  }
}

/**
 * Collect files from path
 */
function collectFiles(path: string, recursive: boolean = false): string[] {
  const files: string[] = [];
  const stats = statSync(path);

  if (stats.isFile()) {
    files.push(path);
  } else if (stats.isDirectory()) {
    const entries = readdirSync(path);

    for (const entry of entries) {
      const entryPath = join(path, entry);
      const entryStats = statSync(entryPath);

      if (entryStats.isFile()) {
        files.push(entryPath);
      } else if (entryStats.isDirectory() && recursive) {
        files.push(...collectFiles(entryPath, recursive));
      }
    }
  }

  return files;
}

// Initialize logger with config
const config = uploadConfig.getConfig();
logger.setLevel(config.logging.level);
logger.setLogToFile(config.logging.logToFile, config.logging.logFilePath);

// Parse command line arguments
program.parse();
