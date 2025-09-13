# 📡 API Documentation

## Overview

The Diary Comics API provides endpoints for retrieving diary comic data from Cloudinary. All endpoints return JSON data and support CORS for client-side requests.

**Base URL**: `https://your-domain.vercel.app/api`

## Authentication

Currently, the API does not require authentication for read operations. All endpoints are publicly accessible.

## Endpoints

### `GET /api/diary`

Retrieves diary comic entries with pagination support.

#### **Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sort` | string | `newest-first` | Sort order: `newest-first` or `oldest-first` |
| `limit` | number | `10` | Number of entries per page (1-50) |
| `cursor` | string | - | Pagination cursor for next page |

#### **Example Requests**

```bash
# Get first 10 entries (newest first)
GET /api/diary

# Get oldest entries first
GET /api/diary?sort=oldest-first

# Get 20 entries per page
GET /api/diary?limit=20

# Get next page using cursor
GET /api/diary?cursor=eyJkYXRlIjoiMjAyNC0wMS0xNSJ9
```

#### **Response Format**

```json
{
  "entries": [
    {
      "date": "2024-01-15T00:00:00.000Z",
      "images": [
        {
          "publicId": "diary/2024/1.15.24_1",
          "url": "https://res.cloudinary.com/xynree/image/upload/v1234567890/diary/2024/1.15.24_1.jpg",
          "secureUrl": "https://res.cloudinary.com/xynree/image/upload/v1234567890/diary/2024/1.15.24_1.jpg",
          "width": 1200,
          "height": 800,
          "format": "jpg",
          "bytes": 245760,
          "date": "2024-01-15T00:00:00.000Z",
          "sequence": 1,
          "filename": "1.15.24_1.jpg"
        }
      ]
    }
  ],
  "totalEntries": 156,
  "totalImages": 234,
  "dateRange": {
    "earliest": "2021-01-01T00:00:00.000Z",
    "latest": "2024-01-15T00:00:00.000Z"
  },
  "pagination": {
    "hasNextPage": true,
    "nextCursor": "eyJkYXRlIjoiMjAyNC0wMS0xMCJ9",
    "limit": 10
  }
}
```

#### **Response Fields**

##### **Root Object**
| Field | Type | Description |
|-------|------|-------------|
| `entries` | Array | Array of diary entries |
| `totalEntries` | number | Total number of diary entries |
| `totalImages` | number | Total number of images across all entries |
| `dateRange` | Object | Date range of all entries |
| `pagination` | Object | Pagination information |

##### **DiaryEntry Object**
| Field | Type | Description |
|-------|------|-------------|
| `date` | string (ISO 8601) | Date of the diary entry |
| `images` | Array | Array of images for this date |

##### **DiaryImage Object**
| Field | Type | Description |
|-------|------|-------------|
| `publicId` | string | Cloudinary public ID |
| `url` | string | Image URL (HTTP) |
| `secureUrl` | string | Image URL (HTTPS) |
| `width` | number | Image width in pixels |
| `height` | number | Image height in pixels |
| `format` | string | Image format (jpg, png, etc.) |
| `bytes` | number | File size in bytes |
| `date` | string (ISO 8601) | Date parsed from filename |
| `sequence` | number | Sequence number for multiple images per day |
| `filename` | string | Original filename |

##### **Pagination Object**
| Field | Type | Description |
|-------|------|-------------|
| `hasNextPage` | boolean | Whether more pages are available |
| `nextCursor` | string | Cursor for next page (if available) |
| `limit` | number | Current page size limit |

#### **Error Responses**

##### **400 Bad Request**
```json
{
  "error": "Invalid sort parameter. Must be 'newest-first' or 'oldest-first'",
  "code": "INVALID_SORT"
}
```

##### **500 Internal Server Error**
```json
{
  "error": "Failed to fetch diary data from Cloudinary",
  "code": "CLOUDINARY_ERROR"
}
```

## Data Types

### **Sort Orders**
- `newest-first`: Most recent entries first (default)
- `oldest-first`: Oldest entries first

### **Date Formats**
All dates are returned in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

### **Image URLs**
- **Standard URL**: `http://res.cloudinary.com/...`
- **Secure URL**: `https://res.cloudinary.com/...` (recommended)

## Rate Limiting

- **Development**: No rate limiting
- **Production**: 100 requests per minute per IP
- **Headers**: Rate limit info included in response headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Caching

### **Client-Side Caching**
- **Cache-Control**: `s-maxage=300, stale-while-revalidate=60`
- **ETag**: Provided for conditional requests
- **Last-Modified**: Based on latest image upload

### **CDN Caching**
- **Vercel Edge Cache**: 5 minutes
- **Browser Cache**: 1 minute
- **Stale While Revalidate**: 60 seconds

## Image Transformations

Images can be transformed using Cloudinary URL parameters:

### **Resize**
```
https://res.cloudinary.com/xynree/image/upload/w_800,h_600,c_fit/diary/2024/1.15.24_1.jpg
```

### **Quality**
```
https://res.cloudinary.com/xynree/image/upload/q_auto:good/diary/2024/1.15.24_1.jpg
```

### **Format**
```
https://res.cloudinary.com/xynree/image/upload/f_webp/diary/2024/1.15.24_1.jpg
```

### **Common Transformations**
- `w_800` - Width 800px
- `h_600` - Height 600px
- `c_fit` - Fit within dimensions
- `c_fill` - Fill dimensions (may crop)
- `q_auto` - Automatic quality
- `f_auto` - Automatic format (WebP/AVIF)

## Client Libraries

### **JavaScript/TypeScript**
```typescript
interface DiaryGalleryData {
  entries: DiaryEntry[];
  totalEntries: number;
  totalImages: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
  pagination?: {
    hasNextPage: boolean;
    nextCursor?: string;
    limit: number;
  };
}

// Fetch diary data
async function fetchDiaryData(options = {}) {
  const params = new URLSearchParams(options);
  const response = await fetch(`/api/diary?${params}`);
  return response.json();
}
```

### **React Hook**
```typescript
import { useInfiniteDiaryData } from '@/hooks/useInfiniteDiaryData';

function DiaryGallery() {
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteDiaryData({
    sort: 'newest-first',
    limit: 10
  });

  // Use data in your component
}
```

## Error Handling

### **Network Errors**
```typescript
try {
  const data = await fetchDiaryData();
} catch (error) {
  if (error.name === 'NetworkError') {
    // Handle network issues
  }
}
```

### **API Errors**
```typescript
const response = await fetch('/api/diary');
if (!response.ok) {
  const error = await response.json();
  console.error('API Error:', error.code, error.error);
}
```

## Webhooks

Currently, webhooks are not supported. Consider implementing polling or WebSocket connections for real-time updates.

## Versioning

- **Current Version**: v1 (implicit)
- **Versioning Strategy**: URL-based versioning will be used for breaking changes
- **Backward Compatibility**: Non-breaking changes will maintain compatibility

## Support

- **Documentation**: This document and inline code comments
- **Issues**: GitHub Issues for bug reports
- **Feature Requests**: GitHub Discussions
- **Email**: your-email@example.com

---

## Examples

### **Basic Gallery Implementation**
```typescript
import { useState, useEffect } from 'react';

function SimpleGallery() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/diary?limit=20')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {data.entries.map(entry => (
        <div key={entry.date}>
          <h2>{new Date(entry.date).toLocaleDateString()}</h2>
          {entry.images.map(image => (
            <img
              key={image.publicId}
              src={image.secureUrl}
              alt={`Comic from ${entry.date}`}
              width={image.width}
              height={image.height}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### **Infinite Scroll Implementation**
```typescript
import { useInfiniteDiaryData } from '@/hooks/useInfiniteDiaryData';
import { useInView } from 'react-intersection-observer';

function InfiniteGallery() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = 
    useInfiniteDiaryData();
  
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div>
      {data?.pages.map(page => 
        page.entries.map(entry => (
          <DiaryEntry key={entry.date} entry={entry} />
        ))
      )}
      <div ref={ref}>
        {isFetchingNextPage && <LoadingSpinner />}
      </div>
    </div>
  );
}
```

**📡 Happy API integration!**
