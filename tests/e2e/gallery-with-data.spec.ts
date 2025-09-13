import { test, expect } from '@playwright/test';

// Mock diary data for testing
const mockDiaryData = {
  success: true,
  data: {
    entries: [
      {
        date: '2021-01-02T00:00:00.000Z',
        dateKey: '2021-01-02',
        images: [
          {
            publicId: 'diary/2021/1.2.21_1',
            filename: '1.2.21_1.jpg',
            date: '2021-01-02T00:00:00.000Z',
            sequence: 1,
            secureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            width: 800,
            height: 600,
            format: 'jpg',
            bytes: 150000,
            createdAt: '2021-01-02T00:00:00Z',
          },
          {
            publicId: 'diary/2021/1.2.21_2',
            filename: '1.2.21_2.jpg',
            date: '2021-01-02T00:00:00.000Z',
            sequence: 2,
            secureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            width: 800,
            height: 600,
            format: 'jpg',
            bytes: 150000,
            createdAt: '2021-01-02T00:00:00Z',
          }
        ],
        imageCount: 2,
      },
      {
        date: '2021-01-01T00:00:00.000Z',
        dateKey: '2021-01-01',
        images: [
          {
            publicId: 'diary/2021/1.1.21_1',
            filename: '1.1.21_1.jpg',
            date: '2021-01-01T00:00:00.000Z',
            sequence: 1,
            secureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            width: 800,
            height: 600,
            format: 'jpg',
            bytes: 150000,
            createdAt: '2021-01-01T00:00:00Z',
          }
        ],
        imageCount: 1,
      }
    ],
    totalEntries: 2,
    totalImages: 3,
    dateRange: {
      earliest: '2021-01-01T00:00:00.000Z',
      latest: '2021-01-02T00:00:00.000Z',
    },
  },
};

test.describe('Gallery with Mock Data', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API response with our test data
    await page.route('/api/diary*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDiaryData)
      });
    });
  });

  test('should display gallery statistics correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check gallery statistics
    await expect(page.locator('text=2').first()).toBeVisible(); // Total entries
    await expect(page.locator('text=3').first()).toBeVisible(); // Total images
    await expect(page.locator('text=1.5').first()).toBeVisible(); // Average per day
    await expect(page.locator('text=1').first()).toBeVisible(); // Days span
  });

  test('should display diary entries in correct order', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show entries (newest first by default)
    const entries = page.locator('article');
    await expect(entries).toHaveCount(2);

    // First entry should be January 2, 2021 (newer)
    await expect(entries.first().locator('h2')).toContainText('January 2, 2021');
    
    // Second entry should be January 1, 2021 (older)
    await expect(entries.nth(1).locator('h2')).toContainText('January 1, 2021');
  });

  test('should show correct image counts per entry', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // First entry should show "2 images"
    await expect(page.locator('text=2 images').first()).toBeVisible();
    
    // Second entry should show "1 image"
    await expect(page.locator('text=1 image').first()).toBeVisible();
  });

  test('should display images with sequence indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // First entry has 2 images, second image should have sequence indicator "2"
    const firstEntry = page.locator('article').first();
    await expect(firstEntry.locator('text=2').first()).toBeVisible(); // Sequence indicator
  });

  test('should open lightbox when image is clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on the first image
    const firstImage = page.locator('img').first();
    await firstImage.click();

    // Lightbox should open
    await expect(page.locator('.fixed.inset-0.bg-black')).toBeVisible();
    
    // Should show the image filename
    await expect(page.locator('text=1.2.21_1.jpg')).toBeVisible();
    
    // Should have close button
    await expect(page.locator('button[aria-label="Close modal"]')).toBeVisible();
  });

  test('should navigate between images in lightbox', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on the first image of the first entry (which has 2 images)
    const firstEntry = page.locator('article').first();
    const firstImage = firstEntry.locator('img').first();
    await firstImage.click();

    // Should show navigation buttons
    await expect(page.locator('button[aria-label="Next image"]')).toBeVisible();
    
    // Click next
    await page.click('button[aria-label="Next image"]');
    
    // Should show the second image filename
    await expect(page.locator('text=1.2.21_2.jpg')).toBeVisible();
    
    // Should show previous button
    await expect(page.locator('button[aria-label="Previous image"]')).toBeVisible();
  });

  test('should close lightbox with escape key', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open lightbox
    const firstImage = page.locator('img').first();
    await firstImage.click();

    // Lightbox should be open
    await expect(page.locator('.fixed.inset-0.bg-black')).toBeVisible();

    // Press escape key
    await page.keyboard.press('Escape');

    // Lightbox should be closed
    await expect(page.locator('.fixed.inset-0.bg-black')).not.toBeVisible();
  });

  test('should navigate with arrow keys in lightbox', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open lightbox on first entry (has 2 images)
    const firstEntry = page.locator('article').first();
    const firstImage = firstEntry.locator('img').first();
    await firstImage.click();

    // Should show first image
    await expect(page.locator('text=1.2.21_1.jpg')).toBeVisible();

    // Press right arrow
    await page.keyboard.press('ArrowRight');

    // Should show second image
    await expect(page.locator('text=1.2.21_2.jpg')).toBeVisible();

    // Press left arrow
    await page.keyboard.press('ArrowLeft');

    // Should show first image again
    await expect(page.locator('text=1.2.21_1.jpg')).toBeVisible();
  });

  test('should change sort order and update display', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Initially should show newest first (Jan 2 before Jan 1)
    const entries = page.locator('article h2');
    await expect(entries.first()).toContainText('January 2, 2021');

    // Click "Oldest First"
    await page.click('button:has-text("Oldest First")');
    
    // Wait for the API call to complete
    await page.waitForLoadState('networkidle');

    // Now should show oldest first (Jan 1 before Jan 2)
    await expect(entries.first()).toContainText('January 1, 2021');
  });
});
