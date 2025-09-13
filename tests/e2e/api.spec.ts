import { test, expect } from "@playwright/test";

test.describe("API Endpoints", () => {
  test("should return proper response structure from /api/diary", async ({
    request,
  }) => {
    const response = await request.get("/api/diary");

    // Should return 200 with actual data from Cloudinary
    expect(response.status()).toBe(200);

    const response_data = await response.json();
    expect(response_data).toHaveProperty("data");
    expect(response_data).toHaveProperty("success");
    expect(response_data.success).toBe(true);

    const data = response_data.data;
    expect(data).toHaveProperty("entries");
    expect(data).toHaveProperty("totalEntries");
    expect(data).toHaveProperty("totalImages");
    expect(data).toHaveProperty("dateRange");
    expect(Array.isArray(data.entries)).toBe(true);
    expect(typeof data.totalEntries).toBe("number");
    expect(typeof data.totalImages).toBe("number");
    expect(data.dateRange).toHaveProperty("earliest");
    expect(data.dateRange).toHaveProperty("latest");
  });

  test("should handle sort parameter correctly", async ({ request }) => {
    // Test with newest-first
    const response1 = await request.get("/api/diary?sort=newest-first");
    expect(response1.status()).toBe(200);

    // Test with oldest-first
    const response2 = await request.get("/api/diary?sort=oldest-first");
    expect(response2.status()).toBe(200);
  });

  test("should handle invalid sort parameter gracefully", async ({
    request,
  }) => {
    const response = await request.get("/api/diary?sort=invalid-sort");

    // Should return 400 for invalid sort parameter
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toContain("Invalid sort order");
  });

  test("should return proper content type", async ({ request }) => {
    const response = await request.get("/api/diary");

    expect(response.status()).toBe(200);

    // Check that it's a proper API response (has content-type)
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });

  test("should return consistent data structure", async ({ request }) => {
    const response = await request.get("/api/diary");
    expect(response.status()).toBe(200);

    const response_data = await response.json();
    expect(response_data).toHaveProperty("data");
    const data = response_data.data;

    // Validate entries structure
    if (data.entries && data.entries.length > 0) {
      const entry = data.entries[0];
      expect(entry).toHaveProperty("date");
      expect(entry).toHaveProperty("images");
      expect(Array.isArray(entry.images)).toBe(true);

      if (entry.images.length > 0) {
        const image = entry.images[0];
        expect(image).toHaveProperty("publicId");
        expect(image).toHaveProperty("filename");
        expect(image).toHaveProperty("secureUrl");
        expect(image).toHaveProperty("date");
        expect(image).toHaveProperty("sequence");
      }
    }
  });
});
