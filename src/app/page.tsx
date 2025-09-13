import { DiaryGallery } from '@/components/DiaryGallery';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Main page component for the Diary Comics application
 *
 * This page displays the complete diary gallery with all entries.
 * It uses client-side data fetching for real-time updates and
 * includes comprehensive error handling.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary>
        <DiaryGallery />
      </ErrorBoundary>
    </div>
  );
}
