import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud'

// Mock Cloudinary v2
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    search: {
      expression: jest.fn().mockReturnThis(),
      sort_by: jest.fn().mockReturnThis(),
      max_results: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    },
  },
}))

// Global test utilities
global.mockCloudinaryResponse = (resources = []) => ({
  resources,
  total_count: resources.length,
})

global.createMockDiaryImage = (overrides = {}) => ({
  publicId: 'diary/2021/1.1.21_1',
  filename: '1.1.21_1.jpg',
  date: new Date(2021, 0, 1),
  sequence: 1,
  secureUrl: 'https://res.cloudinary.com/test/image/upload/diary/2021/1.1.21_1.jpg',
  width: 800,
  height: 600,
  format: 'jpg',
  bytes: 150000,
  createdAt: '2021-01-01T00:00:00Z',
  ...overrides,
})
