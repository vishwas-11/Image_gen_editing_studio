"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-black px-4 py-12 text-white">
      <div className="w-full max-w-xl rounded-2xl border border-studio-border bg-studio-surface p-6 shadow-2xl shadow-black/30">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-studio-subtle">
          Something went wrong
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          The page hit an error, but the dev server can recover.
        </h1>
        <p className="mt-3 font-mono text-sm leading-relaxed text-studio-subtle">
          This fallback keeps the app styled so you can fix the module and recover
          without restarting `npm run dev`.
        </p>

        <div className="mt-5 rounded-xl border border-studio-border bg-black/60 p-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-studio-subtle">
            Error
          </p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-red-300">
            {error.message}
          </pre>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="inline-flex h-9 items-center justify-center rounded-md bg-studio-blue px-4 font-mono text-sm text-white transition-colors hover:bg-[#0690d6]"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex h-9 items-center justify-center rounded-md border border-studio-border bg-transparent px-4 font-mono text-sm text-studio-subtle transition-colors hover:border-studio-blue hover:text-white"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
