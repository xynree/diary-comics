/**
 * Image Utils Tests
 * 
 * Tests for Cloudinary image optimization utilities
 */

import { 
  getOptimizedImageUrl, 
  getThumbnailUrl, 
  getHighQualityUrl,
  IMAGE_PRESETS 
} from '../imageUtils';

describe('imageUtils', () => {
  const mockCloudinaryUrl = 'https://res.cloudinary.com/test/image/upload/diary/2021/1.1.21_1.jpg';

  describe('getOptimizedImageUrl', () => {
    it('should return original URL if format is invalid', () => {
      const invalidUrl = 'https://example.com/image.jpg';
      const result = getOptimizedImageUrl(invalidUrl);
      expect(result).toBe(invalidUrl);
    });

    it('should add transformations to valid Cloudinary URL', () => {
      const result = getOptimizedImageUrl(mockCloudinaryUrl, {
        width: 800,
        quality: 'auto:good',
        format: 'auto',
        crop: 'fit'
      });
      
      expect(result).toBe(
        'https://res.cloudinary.com/test/image/upload/w_800,c_fit,q_auto:good,f_auto/diary/2021/1.1.21_1.jpg'
      );
    });

    it('should use default options when none provided', () => {
      const result = getOptimizedImageUrl(mockCloudinaryUrl);
      
      expect(result).toBe(
        'https://res.cloudinary.com/test/image/upload/c_fit,q_auto:good,f_auto/diary/2021/1.1.21_1.jpg'
      );
    });
  });

  describe('getThumbnailUrl', () => {
    it('should return desktop thumbnail URL by default', () => {
      const result = getThumbnailUrl(mockCloudinaryUrl);
      
      expect(result).toBe(
        'https://res.cloudinary.com/test/image/upload/w_800,c_fit,q_auto:good,f_auto/diary/2021/1.1.21_1.jpg'
      );
    });

    it('should return mobile thumbnail URL when isMobile is true', () => {
      const result = getThumbnailUrl(mockCloudinaryUrl, true);
      
      expect(result).toBe(
        'https://res.cloudinary.com/test/image/upload/w_600,c_fit,q_auto:good,f_auto/diary/2021/1.1.21_1.jpg'
      );
    });
  });

  describe('getHighQualityUrl', () => {
    it('should return high quality URL for modal display', () => {
      const result = getHighQualityUrl(mockCloudinaryUrl);
      
      expect(result).toBe(
        'https://res.cloudinary.com/test/image/upload/c_fit,q_auto:best,f_auto/diary/2021/1.1.21_1.jpg'
      );
    });
  });

  describe('IMAGE_PRESETS', () => {
    it('should have correct gallery thumbnail preset', () => {
      expect(IMAGE_PRESETS.GALLERY_THUMBNAIL).toEqual({
        width: 800,
        quality: 'auto:good',
        format: 'auto',
        crop: 'fit'
      });
    });

    it('should have correct mobile thumbnail preset', () => {
      expect(IMAGE_PRESETS.MOBILE_THUMBNAIL).toEqual({
        width: 600,
        quality: 'auto:good',
        format: 'auto',
        crop: 'fit'
      });
    });

    it('should have correct high quality preset', () => {
      expect(IMAGE_PRESETS.HIGH_QUALITY).toEqual({
        quality: 'auto:best',
        format: 'auto',
        crop: 'fit'
      });
    });
  });
});
