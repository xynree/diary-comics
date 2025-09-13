# Diary Comics Automated Upload System

## 🎯 Overview

The automated upload system provides a comprehensive solution for uploading diary comic images to Cloudinary with features like:

- **File System Monitoring**: Real-time watching of local directories
- **Batch Processing**: Efficient upload of multiple files
- **Duplicate Detection**: Smart handling of duplicate files
- **Progress Tracking**: Visual progress bars and detailed logging
- **CLI Interface**: Easy-to-use command-line tools

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Cloudinary account with API credentials
- Environment variables configured in `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: Set default watch folder
DIARY_WATCH_FOLDER=/path/to/your/diary/images
```

### 2. Installation

The upload system is already included in the project. Install dependencies:

```bash
npm install
```

### 3. Configuration

Check system status:

```bash
npm run upload:status
```

Add a watch folder:

```bash
npm run upload:config -- --add-folder /path/to/your/diary/images
```

### 4. Basic Usage

**Manual Upload:**

```bash
npm run upload -- /path/to/images
```

**Start File Watcher:**

```bash
npm run upload:watch
```

**Validate Files:**

```bash
npm run upload:validate -- /path/to/images
```

## 📋 Commands Reference

### Status Command

```bash
npm run upload:status
```

Shows system configuration, Cloudinary connection status, and watch folder information.

### Configuration Commands

```bash
# Show current configuration
npm run upload:config -- --show

# Add watch folder
npm run upload:config -- --add-folder /path/to/folder

# Remove watch folder
npm run upload:config -- --remove-folder /path/to/folder

# Set duplicate handling strategy
npm run upload:config -- --set-duplicate-handling skip|overwrite|rename

# Reset to defaults
npm run upload:config -- --reset
```

### Upload Commands

```bash
# Upload files/directories
npm run upload -- /path/to/images

# Upload with options
npm run upload -- /path/to/images --recursive --force

# Dry run (show what would be uploaded)
npm run upload -- /path/to/images --dry-run

# Skip duplicates
npm run upload -- /path/to/images --skip-duplicates

# Overwrite duplicates
npm run upload -- /path/to/images --overwrite-duplicates
```

### Watch Mode

```bash
# Start watching configured directories
npm run upload:watch

# Process existing files immediately
npm run upload:watch -- --immediate
```

### Validation

```bash
# Validate files without uploading
npm run upload:validate -- /path/to/images

# Validate recursively
npm run upload:validate -- /path/to/images --recursive
```

## 📁 File Requirements

### Naming Convention

Files must follow the format: `M.D.YY_sequence.extension`

Examples:

- `1.1.25_1.jpg` (January 1, 2025, sequence 1)
- `12.31.24_3.png` (December 31, 2024, sequence 3)

### Supported Formats

- jpg, jpeg, png, gif, webp, bmp, tiff

### File Size Limits

- Minimum: 1 KB
- Maximum: 10 MB

## ⚙️ Configuration Options

### Duplicate Handling

The system automatically detects files that already exist in Cloudinary and handles them intelligently:

- **skip**: Skip files that already exist (default and recommended)
- **overwrite**: Replace existing files (use with caution)
- **rename**: Create new files with unique names

**Simple & Fast**: The system checks if a file with the same name already exists in Cloudinary. If it exists, it follows your configured strategy (skip by default). No complex hash comparisons - just filename-based detection for maximum performance.

### Batch Processing

- **Batch Size**: Number of files processed simultaneously (default: 5)
- **Retry Attempts**: Number of retry attempts for failed uploads (default: 3)
- **Retry Delay**: Delay between retries in milliseconds (default: 1000)

### Logging

- **Log Level**: debug, info, warn, error (default: info)
- **Log to File**: Enable/disable file logging (default: true)
- **Log File Path**: Location of log files (default: ./logs/upload.log)

## 🔧 Advanced Usage

### Custom Configuration File

The system uses `~/.diary-upload-config.json` for persistent configuration. You can manually edit this file for advanced settings.

### Environment Variables

Override configuration with environment variables:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Programmatic Usage

You can also use the upload system programmatically:

```typescript
import { UploadService } from "./scripts/services/uploadService";
import { uploadConfig } from "./scripts/config/uploadConfig";

const config = uploadConfig.getConfig();
const uploadService = new UploadService(config);

// Upload a single file
const result = await uploadService.uploadFile("/path/to/image.jpg");

// Upload multiple files
const results = await uploadService.uploadFiles([
  "/path/to/image1.jpg",
  "/path/to/image2.png",
]);
```

## 🐛 Troubleshooting

### Common Issues

**1. "Cloudinary credentials not set"**

- Ensure `.env.local` file exists with correct credentials
- Check that environment variables are properly formatted

**2. "No valid files found"**

- Verify files follow the naming convention `M.D.YY_sequence.extension`
- Check file formats are supported (jpg, png, etc.)
- Ensure files meet size requirements (1KB - 10MB)

**3. "Watch folder does not exist"**

- Verify the folder path is correct and accessible
- Use absolute paths when possible

**4. "Upload failed with network error"**

- Check internet connection
- Verify Cloudinary credentials are correct
- Check if Cloudinary service is available

### Debug Mode

Enable debug logging for detailed information:

```bash
npm run upload:config -- --set-log-level debug
```

### Log Files

Check log files for detailed error information:

- Default location: `./logs/upload.log`
- Logs include timestamps, error details, and stack traces

### Validation Issues

Use the validate command to check files before uploading:

```bash
npm run upload:validate -- /path/to/images
```

This will show detailed validation errors for each file.

## 📊 Monitoring & Statistics

### Upload Statistics

The system provides detailed statistics after each upload:

- Total files processed
- Success/failure counts
- Average upload time
- Success rate percentage

### Progress Tracking

- Real-time progress bars during uploads
- ETA calculations for batch operations
- File-by-file status updates

### Logging

- Structured logging with different levels
- File and console output
- Automatic log rotation when files get too large

## 🔒 Security

### API Credentials

- Store credentials in `.env.local` (not committed to version control)
- Use environment variables in production
- Regularly rotate API keys

### File Validation

- All files are validated before upload
- Only supported image formats are processed
- File size limits prevent abuse

### Error Handling

- Graceful handling of network failures
- Retry logic with exponential backoff
- Detailed error logging for debugging

## 🚀 Performance Tips

1. **Batch Size**: Adjust batch size based on your internet connection
2. **Concurrent Uploads**: The system limits concurrent uploads to prevent overwhelming the API
3. **File Size**: Optimize images before upload to reduce transfer time
4. **Watch Mode**: Use watch mode for continuous monitoring instead of manual uploads

## 📝 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review log files for detailed error information
3. Use the validation command to identify file issues
4. Check Cloudinary dashboard for upload status
