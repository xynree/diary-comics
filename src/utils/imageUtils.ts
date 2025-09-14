/**
 * Image utility functions for optimizing Cloudinary URLs
 */

/**
 * Cloudinary transformation options for different use cases
 */
export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  quality?: 'auto:low' | 'auto:good' | 'auto:best' | 'auto:eco' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'fit' | 'fill' | 'scale' | 'crop' | 'thumb' | 'limit' | 'pad';
  gravity?: 'auto' | 'center' | 'face' | 'faces';
}

/**
 * Generate optimized Cloudinary URL with transformations
 * 
 * @param originalUrl - The original Cloudinary secure_url
 * @param options - Transformation options
 * @returns Optimized URL with transformations
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: CloudinaryTransformOptions = {}
): string {
  // Default options for gallery thumbnails
  const defaultOptions: CloudinaryTransformOptions = {
    quality: 'auto:good',
    format: 'auto',
    crop: 'fit'
  };

  const finalOptions = { ...defaultOptions, ...options };

  // Parse the original URL to extract the base parts
  // Example: https://res.cloudinary.com/xynree/image/upload/diary/2024/1.1.24_1.jpg
  const urlParts = originalUrl.split('/upload/');
  if (urlParts.length !== 2) {
    // If URL doesn't match expected format, return original
    return originalUrl;
  }

  const baseUrl = urlParts[0] + '/upload/';
  const imagePath = urlParts[1];

  // Build transformation string
  const transformations: string[] = [];

  if (finalOptions.width) {
    transformations.push(`w_${finalOptions.width}`);
  }
  if (finalOptions.height) {
    transformations.push(`h_${finalOptions.height}`);
  }
  if (finalOptions.crop) {
    transformations.push(`c_${finalOptions.crop}`);
  }
  if (finalOptions.quality) {
    transformations.push(`q_${finalOptions.quality}`);
  }
  if (finalOptions.format) {
    transformations.push(`f_${finalOptions.format}`);
  }
  if (finalOptions.gravity) {
    transformations.push(`g_${finalOptions.gravity}`);
  }

  // Combine transformations
  const transformationString = transformations.join(',');

  // Return optimized URL
  return transformationString 
    ? `${baseUrl}${transformationString}/${imagePath}`
    : originalUrl;
}

/**
 * Predefined transformation presets for common use cases
 */
export const IMAGE_PRESETS = {
  // Gallery thumbnail - medium resolution, good quality
  GALLERY_THUMBNAIL: {
    width: 800,
    quality: 'auto:good' as const,
    format: 'auto' as const,
    crop: 'fit' as const
  },
  
  // Mobile thumbnail - smaller for mobile devices
  MOBILE_THUMBNAIL: {
    width: 600,
    quality: 'auto:good' as const,
    format: 'auto' as const,
    crop: 'fit' as const
  },
  
  // High quality for modal/lightbox
  HIGH_QUALITY: {
    quality: 'auto:best' as const,
    format: 'auto' as const,
    crop: 'fit' as const
  },
  
  // Low quality for very fast loading
  LOW_QUALITY: {
    width: 400,
    quality: 'auto:low' as const,
    format: 'auto' as const,
    crop: 'fit' as const
  }
} as const;

/**
 * Get thumbnail URL for gallery display
 * Uses medium resolution (800px width) with good quality
 */
export function getThumbnailUrl(originalUrl: string, isMobile: boolean = false): string {
  const preset = isMobile ? IMAGE_PRESETS.MOBILE_THUMBNAIL : IMAGE_PRESETS.GALLERY_THUMBNAIL;
  return getOptimizedImageUrl(originalUrl, preset);
}

/**
 * Get high quality URL for modal/lightbox display
 * Uses original resolution with best quality
 */
export function getHighQualityUrl(originalUrl: string): string {
  return getOptimizedImageUrl(originalUrl, IMAGE_PRESETS.HIGH_QUALITY);
}
