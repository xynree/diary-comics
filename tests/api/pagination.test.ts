/**
 * Pagination Functionality Tests
 *
 * Tests for the pagination functionality including:
 * - createGalleryData with pagination options
 * - Pagination metadata validation
 * - Edge cases and error handling
 */

import { createGalleryData } from "@/services/cloudinaryService";
import { DiaryEntry, GalleryOptions } from "@/types/diary";

describe("Pagination Functionality", () => {
  const createMockEntries = (count: number): DiaryEntry[] => {
    return Array.from({ length: count }, (_, i) => ({
      date: new Date(2022, 0, i + 1),
      dateKey: `2022-01-${String(i + 1).padStart(2, "0")}`,
      images: [
        {
          publicId: `diary/2022/1.${i + 1}.22_1`,
          filename: `1.${i + 1}.22_1.jpg`,
          date: new Date(2022, 0, i + 1),
          sequence: 1,
          secureUrl: `https://res.cloudinary.com/test/image/upload/diary/2022/1.${
            i + 1
          }.22_1.jpg`,
          width: 800,
          height: 600,
          format: "jpg",
          bytes: 150000,
          createdAt: "2022-01-01T00:00:00.000Z",
        },
      ],
      imageCount: 1,
    }));
  };

  describe("createGalleryData with Pagination", () => {
    it("should create pagination metadata correctly", () => {
      const allEntries = createMockEntries(100);
      const paginatedEntries = allEntries.slice(0, 10); // First page
      const options: GalleryOptions = {
        sortOrder: "newest-first",
        pageSize: 10,
        page: 1,
      };

      const result = createGalleryData(paginatedEntries, allEntries, options);

      expect(result.entries).toHaveLength(10);
      expect(result.totalEntries).toBe(100);
      expect(result.pagination).toEqual({
        currentPage: 1,
        pageSize: 10,
        totalPages: 10,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it("should handle middle page correctly", () => {
      const allEntries = createMockEntries(100);
      const paginatedEntries = allEntries.slice(40, 50); // Page 5 (entries 41-50)
      const options: GalleryOptions = {
        sortOrder: "newest-first",
        pageSize: 10,
        page: 5,
      };

      const result = createGalleryData(paginatedEntries, allEntries, options);

      expect(result.pagination).toEqual({
        currentPage: 5,
        pageSize: 10,
        totalPages: 10,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it("should handle last page correctly", () => {
      const allEntries = createMockEntries(95);
      const paginatedEntries = allEntries.slice(90, 95); // Last page (entries 91-95)
      const options: GalleryOptions = {
        sortOrder: "newest-first",
        pageSize: 10,
        page: 10,
      };

      const result = createGalleryData(paginatedEntries, allEntries, options);

      expect(result.entries).toHaveLength(5); // Last page has 5 entries
      expect(result.pagination).toEqual({
        currentPage: 10,
        pageSize: 10,
        totalPages: 10,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it("should work without pagination options", () => {
      const entries = createMockEntries(50);
      const result = createGalleryData(entries);

      expect(result.entries).toHaveLength(50);
      expect(result.totalEntries).toBe(50);
      expect(result.pagination).toBeUndefined();
    });
  });
});
