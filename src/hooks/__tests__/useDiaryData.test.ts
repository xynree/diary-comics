import { renderHook, waitFor } from '@testing-library/react';
import { useDiaryData } from '../useDiaryData';
import { DiaryGalleryData } from '@/types/diary';

// Mock fetch
global.fetch = jest.fn();

const mockGalleryData: DiaryGalleryData = {
  entries: [
    {
      date: new Date(2021, 0, 1),
      dateKey: '2021-01-01',
      images: [
        {
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
        }
      ],
      imageCount: 1,
    }
  ],
  totalEntries: 1,
  totalImages: 1,
  dateRange: {
    earliest: new Date(2021, 0, 1),
    latest: new Date(2021, 0, 1),
  },
};

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('useDiaryData', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('fetches data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockGalleryData,
      }),
    } as Response);

    const { result } = renderHook(() => useDiaryData());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockGalleryData);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith('/api/diary?sort=newest-first');
  });

  it('handles fetch errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({
        error: 'Failed to fetch diary data',
      }),
    } as Response);

    const { result } = renderHook(() => useDiaryData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Failed to fetch diary data');
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useDiaryData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Network error');
  });

  it('uses custom sort order', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockGalleryData,
      }),
    } as Response);

    renderHook(() => useDiaryData({ sortOrder: 'oldest-first' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/diary?sort=oldest-first');
    });
  });

  it('refetches data when refetch is called', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockGalleryData,
      }),
    } as Response);

    const { result } = renderHook(() => useDiaryData());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Call refetch
    await result.current.refetch();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('handles API response without success flag', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Custom API error',
      }),
    } as Response);

    const { result } = renderHook(() => useDiaryData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Custom API error');
  });

  it('handles malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as Response);

    const { result } = renderHook(() => useDiaryData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('HTTP 500: Internal Server Error');
  });
});
