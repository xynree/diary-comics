export default function TestPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Test Page</h1>
        <p className="text-lg text-gray-600">
          If you can see this, the Next.js app is working correctly.
        </p>
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-2">Environment Check</h2>
          <p>NODE_ENV: {process.env.NODE_ENV}</p>
          <p>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}
