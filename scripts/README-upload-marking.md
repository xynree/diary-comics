# File Upload Marking & Auto-Delete System

## Overview

The file watcher now provides two modes for handling files after successful upload:

1. **File Marking Mode** (default): Files are renamed with an `[uploaded]_` prefix after successful upload
2. **Auto-Delete Mode**: Files are automatically deleted after successful upload

Both modes prevent files from being uploaded multiple times and provide different approaches to file management based on your preferences.

## How It Works

### 1. File Upload Process

#### File Marking Mode (Default)

1. File watcher detects a new diary file (e.g., `1.1.25_1.jpg`)
2. File is validated and added to the upload queue
3. File is successfully uploaded to Cloudinary
4. File is automatically renamed to `[uploaded]_1.1.25_1.jpg`

#### Auto-Delete Mode

1. File watcher detects a new diary file (e.g., `1.1.25_1.jpg`)
2. File is validated and added to the upload queue
3. File is successfully uploaded to Cloudinary
4. **File is automatically deleted from local storage**

### 2. Duplicate Detection & Handling

- When duplicates are detected in Cloudinary:
  - **File Marking Mode**: Duplicate files are marked with `[uploaded]_` prefix (no upload occurs)
  - **Auto-Delete Mode**: Duplicate files are simply skipped (no marking or deletion)
- Files with `[uploaded]_` prefix are ignored by the file validator
- File watcher patterns also ignore these files at the filesystem level

### 3. Visual Feedback

- **File Marking Mode**: Users can see which files have been uploaded by the filename prefix
- **Auto-Delete Mode**: Successfully uploaded files are removed, leaving only unprocessed files

## Implementation Details

### New Files Added

- `scripts/utils/fileRenamer.ts` - Core file renaming functionality

### Modified Files

- `scripts/utils/fileValidator.ts` - Added check to skip uploaded files
- `scripts/services/uploadQueue.ts` - Added file renaming after successful upload
- `scripts/services/fileWatcher.ts` - Added ignore pattern for uploaded files

### Key Functions

#### `markFileAsUploaded(filePath: string)`

- Renames a file by adding `[uploaded]_` prefix
- Returns success/failure result with error details
- Handles edge cases (file doesn't exist, already marked, target exists)

#### `isFileMarkedAsUploaded(filePath: string)`

- Checks if a file has the `[uploaded]_` prefix
- Used by file validator to skip processed files

#### `getOriginalFilename(uploadedFilePath: string)`

- Extracts original filename from an uploaded file
- Useful for logging and display purposes

## Usage

### File Marking Mode (Default)

```bash
# Start file watcher with file marking
npm run upload:watch

# Files will be renamed with [uploaded]_ prefix after successful upload
```

### Auto-Delete Mode

```bash
# Start file watcher with auto-delete
npm run upload:watch --autodelete

# Alternative npm script
npm run upload:watch:autodelete

# Files will be deleted after successful upload
```

## Configuration

No additional configuration is required. The mode is determined by the command-line option when starting the file watcher.

## Error Handling

- If file renaming fails, the upload is still considered successful
- Errors are logged but don't prevent the upload process from continuing
- Common error scenarios are handled gracefully:
  - File doesn't exist
  - File already marked as uploaded
  - Target filename already exists
  - Permission issues

## Benefits

1. **Prevents Duplicate Uploads**: Files are never uploaded twice
2. **Visual Feedback**: Clear indication of processed files
3. **Automatic**: No manual intervention required
4. **Safe**: Robust error handling doesn't break existing functionality
5. **Reversible**: Files can be manually renamed to remove the prefix if needed

## Example Workflows

### File Marking Mode Workflow

```
Initial state:
📁 watch-folder/
   📄 1.1.25_1.jpg
   📄 1.2.25_1.png

After upload:
📁 watch-folder/
   📄 [uploaded]_1.1.25_1.jpg  ✅ Uploaded
   📄 [uploaded]_1.2.25_1.png  ✅ Uploaded

New file added:
📁 watch-folder/
   📄 [uploaded]_1.1.25_1.jpg  (ignored)
   📄 [uploaded]_1.2.25_1.png  (ignored)
   📄 1.3.25_1.jpg             (will be processed)

Duplicate detected:
📁 watch-folder/
   📄 [uploaded]_1.1.25_1.jpg  (ignored)
   📄 [uploaded]_1.2.25_1.png  (ignored)
   📄 [uploaded]_1.3.25_1.jpg  ✅ Uploaded
   📄 [uploaded]_1.1.25_1.jpg  ✅ Marked as duplicate (if same file added again)
```

### Auto-Delete Mode Workflow

```
Initial state:
📁 watch-folder/
   📄 1.1.25_1.jpg
   📄 1.2.25_1.png

After upload:
📁 watch-folder/
   (empty - files deleted after successful upload)

New file added:
📁 watch-folder/
   📄 1.3.25_1.jpg             (will be processed and deleted)

Duplicate detected:
📁 watch-folder/
   📄 1.1.25_1.jpg             (skipped - already exists in Cloudinary)
```

## Testing

The functionality has been thoroughly tested with:

- Unit tests for file renaming operations
- Integration tests with file validator
- Edge case handling (non-existent files, duplicates, etc.)
- File watcher integration verification

## Backward Compatibility

This change is fully backward compatible:

- Existing files without the prefix will still be processed normally
- No changes to configuration files or command-line interface
- Existing upload behavior is preserved
