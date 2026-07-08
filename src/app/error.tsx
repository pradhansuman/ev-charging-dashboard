"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
            Something went wrong
          </h2>
          <pre className="mt-3 text-sm text-red-600 dark:text-red-300 whitespace-pre-wrap break-words font-mono bg-red-100/50 dark:bg-red-950/50 rounded-lg p-3 overflow-auto max-h-60">
            {error.message}
          </pre>
          {error.digest && (
            <p className="mt-2 text-xs text-red-500">Digest: {error.digest}</p>
          )}
          {error.stack && (
            <details className="mt-3">
              <summary className="text-xs text-red-500 cursor-pointer">
                Stack trace
              </summary>
              <pre className="mt-1 text-xs text-red-400 whitespace-pre-wrap break-words font-mono overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        <button
          onClick={reset}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}