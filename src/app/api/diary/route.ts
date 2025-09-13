import { NextRequest, NextResponse } from 'next/server';
import { getDiaryGalleryData } from '@/services/cloudinaryService';
import { validateEnvironment } from '@/config/app';
import { SortOrder } from '@/types/diary';

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    const envValidation = validateEnvironment();
    if (!envValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Configuration error', 
          details: envValidation.errors 
        },
        { status: 500 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sortOrder = (searchParams.get('sort') as SortOrder) || 'newest-first';

    // Validate sort order
    if (!['newest-first', 'oldest-first'].includes(sortOrder)) {
      return NextResponse.json(
        { error: 'Invalid sort order. Must be "newest-first" or "oldest-first"' },
        { status: 400 }
      );
    }

    // Fetch diary data
    const galleryData = await getDiaryGalleryData({ sortOrder });

    return NextResponse.json({
      success: true,
      data: galleryData,
      meta: {
        timestamp: new Date().toISOString(),
        sortOrder,
      }
    });

  } catch (error) {
    console.error('Error in diary API route:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch diary data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  const envValidation = validateEnvironment();
  
  if (!envValidation.isValid) {
    return new NextResponse(null, { status: 500 });
  }
  
  return new NextResponse(null, { status: 200 });
}
