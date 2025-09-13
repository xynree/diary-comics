# Test Duplicate Detection

## Setup

1. **Create test images** (you'll need actual image files):

```bash
# Create diary-images directory if it doesn't exist
mkdir -p diary-images

# Copy some test images with proper naming
# Replace /path/to/test/image.jpg with actual image files you have
cp /path/to/test/image.jpg diary-images/1.1.25_1.jpg
cp /path/to/test/image.png diary-images/1.1.25_2.png
```

## Test Steps

### 1. First Upload (Should succeed)

```bash
# Upload the test images for the first time
npm run upload -- ./diary-images

# Expected result: Files should upload successfully
# Check Cloudinary dashboard to confirm they're there
```

### 2. Test Duplicate Detection (Should skip)

```bash
# Try uploading the same files again
npm run upload -- ./diary-images

# Expected result: Should show "Skipping duplicate files" messages
# No actual uploads should occur
```

### 3. Test with Dry Run

```bash
# Test what would happen with dry run
npm run upload -- ./diary-images --dry-run

# Expected result: Should show the files would be uploaded to specific paths
```

### 4. Test Force Overwrite

```bash
# Test overwriting existing files
npm run upload -- ./diary-images --overwrite-duplicates

# Expected result: Should upload and replace existing files
```

### 5. Test Watch Mode

```bash
# Start watch mode
npm run upload:watch

# In another terminal, add a new image
cp /path/to/another/image.jpg diary-images/2.1.25_1.jpg

# Expected result: Should automatically detect and upload the new file
# Should skip any existing files if you copy duplicates
```

## What You Should See

### Successful Upload:

```
✓ Successfully uploaded 1.1.25_1.jpg (1234ms)
✓ Successfully uploaded 1.1.25_2.png (987ms)
Upload completed: 2/2 successful (100.0%)
```

### Duplicate Detection:

```
Skipping 2 duplicate files
Skipping 1.1.25_1.jpg: File already exists, skipping as per configuration
Skipping 1.1.25_2.png: File already exists, skipping as per configuration
Upload completed: 0/2 successful (0.0%)
```

### Watch Mode:

```
File watcher started, monitoring 1 folders
Added to upload queue: 2.1.25_1.jpg
Batch completed: 1/1 successful
```
