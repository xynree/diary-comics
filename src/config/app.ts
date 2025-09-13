/**
 * Application configuration
 */

export const APP_CONFIG = {
  // Site metadata
  site: {
    title: 'Diary Comics',
    description: 'A personal collection of daily diary comics',
    author: 'Your Name', // Update this with your name
  },

  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'xynree',
    diaryFolder: 'diary',
    maxResults: 500, // Maximum number of images to fetch at once
  },

  // Gallery settings
  gallery: {
    defaultSortOrder: 'newest-first' as const,
    imagesPerPage: 20, // For future pagination
    imageQuality: 'auto:good' as const,
    imageFormat: 'auto' as const,
  },

  // Upload script settings (for Phase 4)
  upload: {
    watchFolder: '', // Will be configured later
    uploadSchedule: 'daily', // daily, weekly, or manual
    duplicateHandling: 'skip' as const, // skip, overwrite, or rename
  },

  // Performance settings
  performance: {
    enableLazyLoading: true,
    enableImageOptimization: true,
    cacheTimeout: 300, // 5 minutes in seconds
  },

  // Development settings
  dev: {
    enableDebugLogs: process.env.NODE_ENV === 'development',
    mockData: false, // Set to true to use mock data instead of Cloudinary
  },
} as const;

// Environment validation
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    errors.push('CLOUDINARY_CLOUD_NAME is required');
  }

  if (!process.env.CLOUDINARY_API_KEY) {
    errors.push('CLOUDINARY_API_KEY is required');
  }

  if (!process.env.CLOUDINARY_API_SECRET) {
    errors.push('CLOUDINARY_API_SECRET is required');
  }

  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    errors.push('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Utility function to log configuration in development
export function logConfiguration(): void {
  if (APP_CONFIG.dev.enableDebugLogs) {
    console.log('App Configuration:', {
      cloudName: APP_CONFIG.cloudinary.cloudName,
      diaryFolder: APP_CONFIG.cloudinary.diaryFolder,
      sortOrder: APP_CONFIG.gallery.defaultSortOrder,
      environment: process.env.NODE_ENV,
    });
  }
}
