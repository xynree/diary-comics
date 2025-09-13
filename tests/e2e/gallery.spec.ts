import { test, expect } from "@playwright/test";

test.describe("Diary Comics Gallery", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto("/");
  });

  test("should load the gallery page without errors", async ({ page }) => {
    // Check that the page loads and displays the main title
    await expect(page.locator("h1")).toContainText("Diary Comics");

    // Check that the subtitle is present
    await expect(
      page.locator("text=A visual journey through daily moments")
    ).toBeVisible();

    // Verify no JavaScript errors occurred
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    // Wait a bit to catch any async errors
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });

  test("should display gallery with actual data", async ({ page }) => {
    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    // Should show gallery statistics
    await expect(page.locator("text=Diary Entries")).toBeVisible();
    await expect(page.locator("text=Total Images")).toBeVisible();
    await expect(page.locator("text=Avg per Day")).toBeVisible();
    await expect(page.locator("text=Days Span")).toBeVisible();

    // Should show actual diary entries
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("should have working sort controls", async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that sort controls are present
    await expect(page.locator("text=Sort by:")).toBeVisible();
    await expect(page.locator('button:has-text("Newest First")')).toBeVisible();
    await expect(page.locator('button:has-text("Oldest First")')).toBeVisible();

    // Newest First should be selected by default
    await expect(page.locator('button:has-text("Newest First")')).toHaveClass(
      /bg-blue-600/
    );

    // Click on Oldest First
    await page.click('button:has-text("Oldest First")');

    // Oldest First should now be selected
    await expect(page.locator('button:has-text("Oldest First")')).toHaveClass(
      /bg-blue-600/
    );
    await expect(
      page.locator('button:has-text("Newest First")')
    ).not.toHaveClass(/bg-blue-600/);
  });

  test("should have working refresh button", async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that refresh button is present
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();

    // Click refresh button
    await refreshButton.click();

    // Should show "Refreshing..." text temporarily
    await expect(page.locator("text=Refreshing...")).toBeVisible();

    // Should go back to "Refresh" after loading
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
  });

  test("should be responsive on mobile devices", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to the page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that the page is still functional on mobile
    await expect(page.locator("h1")).toContainText("Diary Comics");

    // Sort controls should be stacked on mobile
    const sortControls = page.locator("text=Sort by:").locator("..");
    await expect(sortControls).toBeVisible();

    // Refresh button should be visible
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Intercept the API call and return an error
    await page.route("/api/diary*", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Test error for Playwright",
          details: "Simulated API error",
        }),
      });
    });

    // Navigate to the page
    await page.goto("/");

    // Wait for the error state to appear
    await page.waitForLoadState("networkidle");

    // Should show error state
    await expect(page.locator("text=Failed to Load Gallery")).toBeVisible();
    await expect(page.locator(".text-red-600")).toContainText(
      "Test error for Playwright"
    );

    // Should have a "Try Again" button
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test("should display loading state initially", async ({ page }) => {
    // Intercept the API call to delay it
    await page.route("/api/diary*", async (route) => {
      // Delay the response by 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            entries: [],
            totalEntries: 0,
            totalImages: 0,
            dateRange: {
              earliest: new Date().toISOString(),
              latest: new Date().toISOString(),
            },
          },
        }),
      });
    });

    // Navigate to the page
    await page.goto("/");

    // Should show loading state initially
    await expect(
      page.locator("text=Loading your diary comics...")
    ).toBeVisible();

    // Wait for loading to complete
    await page.waitForLoadState("networkidle");

    // Loading should be gone
    await expect(
      page.locator("text=Loading your diary comics...")
    ).not.toBeVisible();
  });
});
