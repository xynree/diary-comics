import { NextRequest, NextResponse } from "next/server";
import { getDiaryGalleryData } from "@/services/cloudinaryService";
import { validateEnvironment } from "@/config/app";
import { SortOrder } from "@/types/diary";

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    const envValidation = validateEnvironment();
    if (!envValidation.isValid) {
      return NextResponse.json(
        {
          error: "Configuration error",
          details: envValidation.errors,
        },
        { status: 500 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sortOrder = (searchParams.get("sort") as SortOrder) || "newest-first";
    const pageSize = parseInt(searchParams.get("pageSize") || "0") || undefined;
    const page = parseInt(searchParams.get("page") || "0") || undefined;

    // Validate sort order
    if (!["newest-first", "oldest-first"].includes(sortOrder)) {
      return NextResponse.json(
        {
          error: 'Invalid sort order. Must be "newest-first" or "oldest-first"',
        },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    if (pageSize && pageSize < 1) {
      return NextResponse.json(
        { error: "pageSize must be a positive integer" },
        { status: 400 }
      );
    }

    if (page && page < 1) {
      return NextResponse.json(
        { error: "page must be a positive integer (1-based)" },
        { status: 400 }
      );
    }

    // If one pagination parameter is provided, both must be provided
    if ((pageSize && !page) || (!pageSize && page)) {
      return NextResponse.json(
        {
          error:
            "Both pageSize and page parameters must be provided for pagination",
        },
        { status: 400 }
      );
    }

    // Fetch diary data
    const galleryData = await getDiaryGalleryData({
      sortOrder,
      pageSize,
      page,
    });

    return NextResponse.json({
      success: true,
      data: galleryData,
      meta: {
        timestamp: new Date().toISOString(),
        sortOrder,
        pagination: galleryData.pagination,
      },
    });
  } catch (error) {
    console.error("Error in diary API route:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch diary data",
        details: error instanceof Error ? error.message : "Unknown error",
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
