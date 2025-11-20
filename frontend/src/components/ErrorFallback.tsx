interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            <svg
              className="h-16 w-16 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>

        <p className="text-gray-600 mb-2">
          We're sorry, but something unexpected happened.
        </p>

        {/* Error Details (only in development) */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              Error details (development only):
            </p>
            <p className="text-sm text-red-600 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
          >
            Go to Home
          </button>
        </div>

        {/* Support Link */}
        <p className="mt-6 text-sm text-gray-500">
          If this problem persists,{' '}
          <a href="mailto:support@example.com" className="text-indigo-600 hover:text-indigo-800">
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}
